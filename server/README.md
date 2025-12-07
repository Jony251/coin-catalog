# 🚀 API Server для Coin Catalog

REST API для работы с коллекцией монет и синхронизацией с Neon PostgreSQL.

## Установка

```bash
# Установить зависимости
npm install

# Убедитесь что .env настроен
# DATABASE_URL=postgresql://...
# JWT_SECRET=your-secret-key
# API_PORT=3000
```

## Запуск

```bash
# Запуск сервера
npm run server

# Или напрямую
node server/index.js
```

Сервер запустится на `http://localhost:3000`

## API Endpoints

### Авторизация

#### POST /api/auth/register
Регистрация нового пользователя

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Имя пользователя"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Имя пользователя",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "token": "jwt-token"
}
```

#### POST /api/auth/login
Вход пользователя

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Имя пользователя"
  },
  "token": "jwt-token"
}
```

### Коллекция

Все endpoints требуют авторизации:
```
Authorization: Bearer <jwt-token>
```

#### GET /api/user/coins
Получить коллекцию пользователя

**Query params:**
- `isWishlist` - true/false (по умолчанию false)

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "catalog_coin_id": "peter1_ruble_1704",
    "is_wishlist": false,
    "condition": "VF",
    "grade": "VF-30",
    "purchase_price": 15000.00,
    "purchase_date": "2024-01-15",
    "notes": "Куплена на аукционе",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
]
```

#### POST /api/user/coins
Добавить монету в коллекцию

**Request:**
```json
{
  "catalogCoinId": "peter1_ruble_1704",
  "isWishlist": false,
  "condition": "VF",
  "grade": "VF-30",
  "purchasePrice": 15000.00,
  "purchaseDate": "2024-01-15",
  "notes": "Куплена на аукционе",
  "localId": "uc_local_123"
}
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "catalog_coin_id": "peter1_ruble_1704",
  ...
}
```

#### PUT /api/user/coins/:id
Обновить монету

**Request:**
```json
{
  "condition": "XF",
  "grade": "XF-40",
  "notes": "Обновлена оценка"
}
```

**Response:**
```json
{
  "id": "uuid",
  "condition": "XF",
  "grade": "XF-40",
  ...
}
```

#### DELETE /api/user/coins/:catalogCoinId
Удалить монету (мягкое удаление)

**Response:**
```json
{
  "success": true
}
```

#### POST /api/user/coins/sync
Синхронизация коллекции

**Request:**
```json
{
  "coins": [
    {
      "catalogCoinId": "peter1_ruble_1704",
      "isWishlist": false,
      "condition": "VF",
      "purchasePrice": 15000,
      "localId": "uc_local_123",
      "isDeleted": false
    }
  ]
}
```

**Response:**
```json
{
  "synced": 1
}
```

#### GET /api/user/stats
Статистика коллекции

**Response:**
```json
{
  "collection_count": 10,
  "wishlist_count": 5,
  "total_spent": 150000.00,
  "avg_price": 15000.00,
  "first_coin_date": "2024-01-01T00:00:00Z",
  "last_coin_date": "2024-12-01T00:00:00Z"
}
```

### Служебные

#### GET /api/health
Проверка работоспособности

**Response:**
```json
{
  "status": "ok",
  "database": "connected"
}
```

## Примеры использования

### cURL

```bash
# Регистрация
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

# Вход
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Получить коллекцию
curl http://localhost:3000/api/user/coins \
  -H "Authorization: Bearer YOUR_TOKEN"

# Добавить монету
curl -X POST http://localhost:3000/api/user/coins \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"catalogCoinId":"peter1_ruble_1704","purchasePrice":15000}'
```

### JavaScript (Fetch)

```javascript
// Регистрация
const response = await fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'test123',
    name: 'Test User'
  })
});

const { user, token } = await response.json();

// Сохранить токен
localStorage.setItem('authToken', token);

// Получить коллекцию
const coins = await fetch('http://localhost:3000/api/user/coins', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const collection = await coins.json();
```

## Безопасность

### JWT Токены
- Токены действительны 7 дней
- Хранятся на клиенте (localStorage/SecureStore)
- Передаются в заголовке Authorization

### Пароли
- Хешируются с bcrypt (saltRounds=10)
- Никогда не передаются в открытом виде
- Никогда не возвращаются в ответах API

### CORS
- Настроен для всех origins (для разработки)
- В продакшене ограничьте через `ALLOWED_ORIGINS` в .env

## Деплой

### Vercel (рекомендуется)

1. Установите Vercel CLI:
```bash
npm install -g vercel
```

2. Деплой:
```bash
vercel
```

3. Добавьте переменные окружения в Vercel Dashboard:
- `DATABASE_URL`
- `JWT_SECRET`

### Railway

1. Создайте проект на https://railway.app/
2. Подключите GitHub репозиторий
3. Добавьте переменные окружения
4. Railway автоматически задеплоит

### Render

1. Создайте Web Service на https://render.com/
2. Подключите репозиторий
3. Build Command: `npm install`
4. Start Command: `node server/index.js`
5. Добавьте переменные окружения

## Мониторинг

### Логирование

Все ошибки логируются в консоль. В продакшене используйте:
- Sentry для отслеживания ошибок
- LogRocket для сессий пользователей
- DataDog для метрик

### Health Check

Проверяйте `/api/health` для мониторинга:

```bash
# Каждые 5 минут
*/5 * * * * curl http://your-api.com/api/health
```

## Разработка

### Структура

```
server/
├── index.js          # Главный файл сервера
├── README.md         # Документация
└── middleware/       # Middleware (будущее)
    ├── auth.js
    └── validation.js
```

### Добавление нового endpoint

```javascript
app.post('/api/your-endpoint', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    // Ваш код
    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed' });
  }
});
```

## Тестирование

### Postman Collection

Импортируйте коллекцию для тестирования API (создайте файл):

```json
{
  "info": {
    "name": "Coin Catalog API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/api/auth/register",
            "body": {
              "mode": "raw",
              "raw": "{\"email\":\"test@example.com\",\"password\":\"test123\"}"
            }
          }
        }
      ]
    }
  ]
}
```

## Troubleshooting

### Ошибка: "DATABASE_URL not found"
- Проверьте файл `.env`
- Убедитесь что переменная `DATABASE_URL` установлена

### Ошибка: "Invalid token"
- Токен истёк (7 дней)
- Пользователь должен войти заново

### Ошибка: "Connection refused"
- Проверьте что Neon БД доступна
- Проверьте connection string

## Контакты

При проблемах с API:
- Проверьте логи сервера
- Проверьте health check endpoint
- Проверьте подключение к Neon
