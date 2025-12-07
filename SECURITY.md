# 🔐 Безопасность проекта

## Важные правила

### ❌ НИКОГДА не коммитьте:
- `.env` файлы с реальными паролями
- Database connection strings с паролями
- API ключи
- JWT секреты
- Приватные ключи (*.pem, *.key)
- Сертификаты

### ✅ Всегда коммитьте:
- `.env.example` с примерами (БЕЗ реальных паролей)
- `.gitignore` с правилами игнорирования
- Документацию по настройке

## Настройка окружения

### 1. Создайте .env файл

```bash
# Скопируйте пример
cp .env.example .env

# Откройте и заполните реальными значениями
# НЕ коммитьте этот файл!
```

### 2. Получите Database URL

1. Откройте https://console.neon.tech/
2. Выберите ваш проект
3. Нажмите **Connection Details**
4. Скопируйте **Connection string**
5. Вставьте в `.env` как `DATABASE_URL`

**Формат:**
```
DATABASE_URL=postgresql://username:password@host.neon.tech/dbname?sslmode=require
```

### 3. Сгенерируйте JWT Secret

```bash
# В терминале выполните:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Скопируйте результат в .env как JWT_SECRET
```

## Хеширование паролей

### Используйте bcrypt

```javascript
import bcrypt from 'bcrypt';

// Хеширование при регистрации
const saltRounds = 10;
const passwordHash = await bcrypt.hash(password, saltRounds);

// Сохраните passwordHash в БД, НЕ сам пароль!
await sql`
  INSERT INTO users (email, password_hash)
  VALUES (${email}, ${passwordHash})
`;

// Проверка при входе
const user = await sql`
  SELECT * FROM users WHERE email = ${email}
`;

const isValid = await bcrypt.compare(password, user.password_hash);
if (isValid) {
  // Пароль правильный
}
```

## JWT токены

### Генерация токена

```javascript
import jwt from 'jsonwebtoken';

const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);
```

### Проверка токена

```javascript
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('User ID:', decoded.userId);
} catch (error) {
  console.error('Invalid token');
}
```

## Переменные окружения

### Структура .env

```bash
# База данных (СЕКРЕТНО!)
DATABASE_URL=postgresql://user:password@host/db

# API
API_URL=http://localhost:3000
API_PORT=3000

# JWT (СЕКРЕТНО!)
JWT_SECRET=ваш-секретный-ключ-32-символа

# Окружение
APP_ENV=development
```

### Использование в коде

```javascript
// Node.js
const dbUrl = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET;

// React Native (через expo-constants)
import Constants from 'expo-constants';

const apiUrl = Constants.expoConfig.extra.apiUrl;
```

## Row Level Security (RLS)

База данных настроена с RLS - пользователи видят только свои данные.

### Как это работает:

```sql
-- Политика безопасности
CREATE POLICY user_coins_policy ON user_coins
  FOR ALL
  USING (user_id = current_setting('app.user_id')::UUID);
```

### Использование в API:

```javascript
// Установить контекст пользователя
await sql`SET app.user_id = ${userId}`;

// Теперь все запросы автоматически фильтруются
const coins = await sql`SELECT * FROM user_coins`;
// Вернёт только монеты текущего пользователя
```

## Проверка безопасности

### Перед коммитом:

```bash
# Проверьте, что .env не добавлен
git status

# Если .env в списке - удалите его из индекса
git rm --cached .env

# Убедитесь, что .env в .gitignore
cat .gitignore | grep .env
```

### Проверка истории Git:

```bash
# Поиск паролей в истории
git log --all --full-history --source -- .env

# Если нашли - нужно очистить историю
# См. https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository
```

## Что делать если пароль утёк

### 1. Немедленно смените пароль

```bash
# В Neon Console:
# Settings → Reset Password
```

### 2. Обновите .env

```bash
# Обновите DATABASE_URL с новым паролем
```

### 3. Очистите Git историю

```bash
# Используйте git-filter-repo или BFG Repo-Cleaner
# https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository
```

### 4. Сгенерируйте новый JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Инвалидируйте все токены

```sql
-- Удалите все сессии
DELETE FROM user_sessions;
```

## Лучшие практики

### ✅ DO:
- Используйте `.env` для всех секретов
- Хешируйте пароли с bcrypt (saltRounds >= 10)
- Используйте HTTPS в продакшене
- Устанавливайте срок действия JWT токенов
- Регулярно обновляйте зависимости
- Используйте Row Level Security
- Логируйте попытки входа
- Ограничивайте количество попыток входа

### ❌ DON'T:
- Не храните пароли в открытом виде
- Не коммитьте .env файлы
- Не используйте слабые пароли
- Не логируйте пароли/токены
- Не передавайте токены в URL
- Не используйте HTTP в продакшене
- Не доверяйте данным от клиента

## Дополнительные меры

### Rate Limiting

```javascript
// Ограничение запросов
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100 // максимум 100 запросов
});

app.use('/api/', limiter);
```

### Helmet для Express

```javascript
import helmet from 'helmet';

app.use(helmet()); // Защита от известных уязвимостей
```

### CORS

```javascript
import cors from 'cors';

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true
}));
```

## Мониторинг

### Логирование подозрительной активности

```javascript
// Логируйте неудачные попытки входа
await sql`
  INSERT INTO security_log (event_type, user_email, ip_address)
  VALUES ('failed_login', ${email}, ${req.ip})
`;

// Блокируйте после 5 неудачных попыток
const failedAttempts = await sql`
  SELECT COUNT(*) FROM security_log
  WHERE user_email = ${email}
  AND event_type = 'failed_login'
  AND created_at > NOW() - INTERVAL '1 hour'
`;

if (failedAttempts[0].count >= 5) {
  throw new Error('Account temporarily locked');
}
```

## Контакты

При обнаружении уязвимости:
1. НЕ создавайте публичный issue
2. Напишите напрямую разработчику
3. Дайте время на исправление перед публикацией

---

**Помните:** Безопасность - это процесс, а не состояние. Регулярно проверяйте и обновляйте меры безопасности.
