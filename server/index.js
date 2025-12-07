import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Подключение к Neon DB
const sql = neon(process.env.DATABASE_URL);

// Middleware
app.use(cors());
app.use(express.json());

// Middleware для проверки JWT токена
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Недействительный токен' });
    }
    req.user = user;
    next();
  });
};

// ==================== AUTH ENDPOINTS ====================

// Регистрация
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    // Проверяем, существует ли пользователь
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }

    // Хешируем пароль
    const passwordHash = await bcrypt.hash(password, 10);

    // Создаём пользователя
    const result = await sql`
      INSERT INTO users (email, password_hash, name)
      VALUES (${email}, ${passwordHash}, ${name || null})
      RETURNING id, email, name, created_at
    `;

    const user = result[0];

    // Создаём JWT токен
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Сохраняем сессию
    await sql`
      INSERT INTO user_sessions (user_id, token, expires_at)
      VALUES (${user.id}, ${token}, NOW() + INTERVAL '30 days')
    `;

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Ошибка регистрации' });
  }
});

// Вход
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email и пароль обязательны' });
    }

    // Находим пользователя
    const users = await sql`
      SELECT id, email, name, password_hash FROM users WHERE email = ${email}
    `;

    if (users.length === 0) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    const user = users[0];

    // Проверяем пароль
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // Создаём JWT токен
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Сохраняем сессию
    await sql`
      INSERT INTO user_sessions (user_id, token, expires_at)
      VALUES (${user.id}, ${token}, NOW() + INTERVAL '30 days')
    `;

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Ошибка входа' });
  }
});

// Выход
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    const token = req.headers['authorization'].split(' ')[1];
    
    await sql`
      DELETE FROM user_sessions WHERE token = ${token}
    `;

    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Ошибка выхода' });
  }
});

// ==================== USER COLLECTION ENDPOINTS ====================

// Получить коллекцию пользователя
app.get('/api/collection', authenticateToken, async (req, res) => {
  try {
    const { isWishlist } = req.query;
    const userId = req.user.userId;

    const coins = await sql`
      SELECT * FROM user_coins
      WHERE user_id = ${userId}
        AND is_wishlist = ${isWishlist === 'true'}
        AND is_deleted = false
      ORDER BY created_at DESC
    `;

    res.json({ success: true, coins });
  } catch (error) {
    console.error('Get collection error:', error);
    res.status(500).json({ error: 'Ошибка получения коллекции' });
  }
});

// Добавить монету в коллекцию
app.post('/api/collection', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      catalogCoinId,
      isWishlist,
      condition,
      grade,
      purchasePrice,
      purchaseDate,
      notes,
    } = req.body;

    if (!catalogCoinId) {
      return res.status(400).json({ error: 'catalogCoinId обязателен' });
    }

    const result = await sql`
      INSERT INTO user_coins (
        user_id, catalog_coin_id, is_wishlist, condition, grade,
        purchase_price, purchase_date, notes
      )
      VALUES (
        ${userId}, ${catalogCoinId}, ${isWishlist || false}, ${condition || null},
        ${grade || null}, ${purchasePrice || null}, ${purchaseDate || null}, ${notes || null}
      )
      RETURNING *
    `;

    res.json({ success: true, coin: result[0] });
  } catch (error) {
    console.error('Add coin error:', error);
    res.status(500).json({ error: 'Ошибка добавления монеты' });
  }
});

// Обновить монету
app.put('/api/collection/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const {
      condition,
      grade,
      purchasePrice,
      purchaseDate,
      notes,
      isWishlist,
    } = req.body;

    const result = await sql`
      UPDATE user_coins
      SET
        condition = COALESCE(${condition}, condition),
        grade = COALESCE(${grade}, grade),
        purchase_price = COALESCE(${purchasePrice}, purchase_price),
        purchase_date = COALESCE(${purchaseDate}, purchase_date),
        notes = COALESCE(${notes}, notes),
        is_wishlist = COALESCE(${isWishlist}, is_wishlist)
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: 'Монета не найдена' });
    }

    res.json({ success: true, coin: result[0] });
  } catch (error) {
    console.error('Update coin error:', error);
    res.status(500).json({ error: 'Ошибка обновления монеты' });
  }
});

// Удалить монету
app.delete('/api/collection/:catalogCoinId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { catalogCoinId } = req.params;

    await sql`
      UPDATE user_coins
      SET is_deleted = true
      WHERE catalog_coin_id = ${catalogCoinId} AND user_id = ${userId}
    `;

    res.json({ success: true });
  } catch (error) {
    console.error('Delete coin error:', error);
    res.status(500).json({ error: 'Ошибка удаления монеты' });
  }
});

// Синхронизация коллекции
app.post('/api/collection/sync', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { coins } = req.body;

    if (!Array.isArray(coins)) {
      return res.status(400).json({ error: 'coins должен быть массивом' });
    }

    // Обрабатываем каждую монету
    for (const coin of coins) {
      if (coin.isDeleted) {
        // Удаляем
        await sql`
          UPDATE user_coins
          SET is_deleted = true
          WHERE catalog_coin_id = ${coin.catalogCoinId} AND user_id = ${userId}
        `;
      } else {
        // Добавляем или обновляем
        await sql`
          INSERT INTO user_coins (
            user_id, catalog_coin_id, is_wishlist, condition, grade,
            purchase_price, purchase_date, notes
          )
          VALUES (
            ${userId}, ${coin.catalogCoinId}, ${coin.isWishlist || false},
            ${coin.condition || null}, ${coin.grade || null},
            ${coin.purchasePrice || null}, ${coin.purchaseDate || null},
            ${coin.notes || null}
          )
          ON CONFLICT (user_id, catalog_coin_id)
          DO UPDATE SET
            is_wishlist = EXCLUDED.is_wishlist,
            condition = EXCLUDED.condition,
            grade = EXCLUDED.grade,
            purchase_price = EXCLUDED.purchase_price,
            purchase_date = EXCLUDED.purchase_date,
            notes = EXCLUDED.notes,
            is_deleted = false
        `;
      }
    }

    // Получаем актуальную коллекцию
    const updatedCoins = await sql`
      SELECT * FROM user_coins
      WHERE user_id = ${userId} AND is_deleted = false
      ORDER BY created_at DESC
    `;

    res.json({ success: true, coins: updatedCoins });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Ошибка синхронизации' });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', async (req, res) => {
  try {
    await sql`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
