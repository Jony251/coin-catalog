# Настройка базы данных

## 1. Создание базы данных в Neon

1. Зарегистрируйтесь на [Neon.tech](https://neon.tech)
2. Создайте новый проект
3. Скопируйте строку подключения (Connection String)

## 2. Настройка .env

Откройте файл `.env` в корне проекта и замените `DATABASE_URL`:

```env
DATABASE_URL=postgresql://username:password@ep-xxx.neon.tech/dbname?sslmode=require
```

## 3. Создание таблиц

### Вариант 1: Через Neon Console

1. Откройте [Neon Console](https://console.neon.tech)
2. Выберите ваш проект
3. Перейдите в SQL Editor
4. Скопируйте содержимое файла `schema.sql`
5. Вставьте и выполните

### Вариант 2: Через psql (если установлен PostgreSQL)

```bash
psql "postgresql://username:password@ep-xxx.neon.tech/dbname?sslmode=require" < database/schema.sql
```

## 4. Проверка подключения

Запустите сервер:

```bash
npm run server
```

Откройте в браузере:
```
http://localhost:3000/api/health
```

Должен вернуть:
```json
{
  "status": "ok",
  "database": "connected"
}
```

## 5. Структура базы данных

### Таблицы:

- **users** - Пользователи
- **user_sessions** - Сессии (JWT токены)
- **user_coins** - Коллекция монет пользователя
- **sync_log** - Лог синхронизации

### Связи:

```
users (1) -----> (N) user_coins
users (1) -----> (N) user_sessions
users (1) -----> (N) sync_log
```

## Безопасность

⚠️ **ВАЖНО:**
- Никогда не коммитьте `.env` файл в git
- Измените `JWT_SECRET` на случайную строку
- Используйте сильные пароли для БД
