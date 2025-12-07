/**
 * API Server для Coin Catalog
 * Подключается к Neon PostgreSQL и предоставляет REST API
 */

import express from 'express';
import cors from 'cors';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const app = express();
const PORT = process.env.API_PORT || 3000;

// Подключение к Neon
const sql = neon(process.env.DATABASE_URL);

// Middleware
app.use(cors());
app.use(express.json());

// Middleware для проверки JWT токена
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// ============================================
// АВТОРИЗАЦИЯ
// ============================================

// Регистрация
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Валидация
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Проверка существования пользователя
    const existing = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existing.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Хеширование пароля
    const passwordHash = await bcrypt.hash(password, 10);

    // Создание пользователя
    const result = await sql`
      INSERT INTO users (email, password_hash, name)
      VALUES (${email}, ${passwordHash}, ${name || null})
      RETURNING id, email, name, created_at
    `;

    const user = result[0];

    // Генерация JWT токена
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.created_at
      },
      token
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Вход
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Валидация
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Поиск пользователя
    const result = await sql`
      SELECT id, email, name, password_hash
      FROM users
      WHERE email = ${email}
    `;

    if (result.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result[0];

    // Проверка пароля
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Обновление последнего входа
    await sql`
      UPDATE users
      SET last_login = NOW()
      WHERE id = ${user.id}
    `;

    // Генерация JWT токена
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ============================================
// КОЛЛЕКЦИЯ ПОЛЬЗОВАТЕЛЯ
// ============================================

// Получить коллекцию
app.get('/api/user/coins', authenticateToken, async (req, res) => {
  try {
    const { isWishlist } = req.query;
    const userId = req.user.userId;

    const coins = await sql`
      SELECT *
      FROM user_coins
      WHERE user_id = ${userId}
        AND is_wishlist = ${isWishlist === 'true'}
        AND deleted_at IS NULL
      ORDER BY created_at DESC
    `;

    res.json(coins);

  } catch (error) {
    console.error('Get coins error:', error);
    res.status(500).json({ error: 'Failed to get coins' });
  }
});

// Добавить монету
app.post('/api/user/coins', authenticateToken, async (req, res) => {
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
      localId
    } = req.body;

    // Валидация
    if (!catalogCoinId) {
      return res.status(400).json({ error: 'catalogCoinId required' });
    }

    // Удалить из вишлиста если добавляем в коллекцию
    if (!isWishlist) {
      await sql`
        DELETE FROM user_coins
        WHERE user_id = ${userId}
          AND catalog_coin_id = ${catalogCoinId}
          AND is_wishlist = true
      `;
    }

    // Добавить монету
    const result = await sql`
      INSERT INTO user_coins (
        user_id, catalog_coin_id, is_wishlist,
        condition, grade, purchase_price, purchase_date,
        notes, local_id, synced_at
      )
      VALUES (
        ${userId}, ${catalogCoinId}, ${isWishlist || false},
        ${condition || null}, ${grade || null}, ${purchasePrice || null}, ${purchaseDate || null},
        ${notes || null}, ${localId || null}, NOW()
      )
      RETURNING *
    `;

    res.json(result[0]);

  } catch (error) {
    console.error('Add coin error:', error);
    res.status(500).json({ error: 'Failed to add coin' });
  }
});

// Обновить монету
app.put('/api/user/coins/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const coinId = req.params.id;
    const {
      condition,
      grade,
      purchasePrice,
      purchaseDate,
      notes
    } = req.body;

    const result = await sql`
      UPDATE user_coins
      SET
        condition = COALESCE(${condition}, condition),
        grade = COALESCE(${grade}, grade),
        purchase_price = COALESCE(${purchasePrice}, purchase_price),
        purchase_date = COALESCE(${purchaseDate}, purchase_date),
        notes = COALESCE(${notes}, notes),
        updated_at = NOW(),
        synced_at = NOW()
      WHERE id = ${coinId}
        AND user_id = ${userId}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: 'Coin not found' });
    }

    res.json(result[0]);

  } catch (error) {
    console.error('Update coin error:', error);
    res.status(500).json({ error: 'Failed to update coin' });
  }
});

// Удалить монету
app.delete('/api/user/coins/:catalogCoinId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const catalogCoinId = req.params.catalogCoinId;

    await sql`
      UPDATE user_coins
      SET deleted_at = NOW()
      WHERE user_id = ${userId}
        AND catalog_coin_id = ${catalogCoinId}
    `;

    res.json({ success: true });

  } catch (error) {
    console.error('Delete coin error:', error);
    res.status(500).json({ error: 'Failed to delete coin' });
  }
});

// Синхронизация
app.post('/api/user/coins/sync', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { coins } = req.body; // Массив монет для синхронизации

    const results = [];

    for (const coin of coins) {
      if (coin.isDeleted) {
        // Удалить
        await sql`
          UPDATE user_coins
          SET deleted_at = NOW()
          WHERE user_id = ${userId}
            AND catalog_coin_id = ${coin.catalogCoinId}
        `;
      } else {
        // Добавить или обновить
        const result = await sql`
          INSERT INTO user_coins (
            user_id, catalog_coin_id, is_wishlist,
            condition, grade, purchase_price, purchase_date,
            notes, local_id, synced_at
          )
          VALUES (
            ${userId}, ${coin.catalogCoinId}, ${coin.isWishlist || false},
            ${coin.condition || null}, ${coin.grade || null}, 
            ${coin.purchasePrice || null}, ${coin.purchaseDate || null},
            ${coin.notes || null}, ${coin.localId || null}, NOW()
          )
          ON CONFLICT (user_id, catalog_coin_id)
          DO UPDATE SET
            condition = EXCLUDED.condition,
            grade = EXCLUDED.grade,
            purchase_price = EXCLUDED.purchase_price,
            purchase_date = EXCLUDED.purchase_date,
            notes = EXCLUDED.notes,
            updated_at = NOW(),
            synced_at = NOW()
          RETURNING *
        `;
        results.push(result[0]);
      }
    }

    res.json({ synced: results.length });

  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// Статистика коллекции
app.get('/api/user/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const stats = await sql`
      SELECT * FROM user_collection_stats
      WHERE user_id = ${userId}
    `;

    res.json(stats[0] || {
      collection_count: 0,
      wishlist_count: 0,
      total_spent: 0,
      avg_price: 0
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', async (req, res) => {
  try {
    // Проверка подключения к БД
    await sql`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// ============================================
// ЗАПУСК СЕРВЕРА
// ============================================

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
});
