# База данных Neon PostgreSQL

## Подключение к Neon

### Connection String

**ВАЖНО:** Connection string содержит пароль! Храните его в `.env` файле.

1. Откройте https://console.neon.tech/
2. Выберите ваш проект
3. Нажмите **Connection Details**
4. Скопируйте **Connection string**
5. Сохраните в `.env` файл

### Подключение через psql
```bash
# Используйте переменную окружения
psql $DATABASE_URL

# Или напрямую (замените на ваш connection string)
psql 'postgresql://username:password@host.neon.tech/dbname?sslmode=require'
```

### Подключение через Node.js
```javascript
import { neon } from '@neondatabase/serverless';

// Используйте переменную окружения
const sql = neon(process.env.DATABASE_URL);

const result = await sql`SELECT * FROM users`;
```

## Установка схемы

### 1. Создать таблицы
```bash
psql 'postgresql://...' < database/schema.sql
```

Или через веб-интерфейс Neon:
1. Откройте https://console.neon.tech/
2. Выберите ваш проект
3. Перейдите в SQL Editor
4. Скопируйте содержимое `schema.sql`
5. Выполните запрос

### 2. Добавить тестовые данные (опционально)
```bash
psql 'postgresql://...' < database/seed.sql
```

## Структура базы данных

### Таблицы

#### `users`
Пользователи приложения
- `id` - UUID, первичный ключ
- `email` - email пользователя (уникальный)
- `password_hash` - хеш пароля
- `name` - имя пользователя
- `avatar_url` - URL аватара
- `is_public` - публичный профиль
- `created_at` - дата регистрации
- `updated_at` - дата обновления
- `last_login` - последний вход

#### `user_coins`
Коллекция монет пользователей
- `id` - UUID, первичный ключ
- `user_id` - ID пользователя (FK)
- `catalog_coin_id` - ID монеты из локального каталога
- `is_wishlist` - флаг вишлиста
- `condition` - состояние монеты
- `grade` - оценка
- `purchase_price` - цена покупки
- `purchase_date` - дата покупки
- `notes` - заметки
- `user_obverse_image` - фото аверса
- `user_reverse_image` - фото реверса
- `created_at` - дата добавления
- `updated_at` - дата обновления
- `deleted_at` - дата удаления (мягкое удаление)
- `local_id` - ID на устройстве
- `synced_at` - дата синхронизации

#### `sync_log`
Лог синхронизации
- `id` - UUID, первичный ключ
- `user_id` - ID пользователя (FK)
- `device_id` - ID устройства
- `device_name` - название устройства
- `platform` - платформа (ios/android/web)
- `app_version` - версия приложения
- `last_sync` - дата последней синхронизации
- `sync_status` - статус синхронизации
- `error_message` - сообщение об ошибке

#### `user_sessions`
Сессии пользователей
- `id` - UUID, первичный ключ
- `user_id` - ID пользователя (FK)
- `token` - токен сессии
- `device_id` - ID устройства
- `expires_at` - дата истечения
- `created_at` - дата создания

### Представления (Views)

#### `user_collection_stats`
Статистика коллекции пользователя
- `user_id` - ID пользователя
- `collection_count` - количество монет в коллекции
- `wishlist_count` - количество монет в вишлисте
- `total_spent` - общая сумма покупок
- `avg_price` - средняя цена монеты
- `first_coin_date` - дата первой монеты
- `last_coin_date` - дата последней монеты

#### `platform_stats`
Общая статистика платформы
- `total_users` - всего пользователей
- `total_coins` - всего монет
- `total_collection` - монет в коллекциях
- `total_wishlist` - монет в вишлистах
- `avg_coin_price` - средняя цена монеты
- `unique_coins_collected` - уникальных монет собрано

## Полезные запросы

См. файл `queries.sql` для примеров запросов:
- Получение коллекции пользователя
- Добавление/обновление/удаление монет
- Статистика
- Синхронизация
- Поиск и фильтрация

## Безопасность

### Row Level Security (RLS)
Включена политика безопасности на уровне строк:
- Пользователи видят только свои данные
- Доступ контролируется через `current_setting('app.user_id')`

### Хеширование паролей
Используйте bcrypt для хеширования паролей:
```javascript
import bcrypt from 'bcrypt';

const hash = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(password, hash);
```

## Обслуживание

### Очистка старых данных
```sql
-- Удалить истекшие сессии
DELETE FROM user_sessions WHERE expires_at < NOW() - INTERVAL '7 days';

-- Окончательно удалить монеты
DELETE FROM user_coins WHERE deleted_at < NOW() - INTERVAL '30 days';

-- Очистить старые логи
DELETE FROM sync_log WHERE last_sync < NOW() - INTERVAL '90 days';
```

### Резервное копирование
```bash
# Экспорт всей БД
pg_dump 'postgresql://...' > backup.sql

# Экспорт только данных
pg_dump 'postgresql://...' --data-only > data.sql

# Восстановление
psql 'postgresql://...' < backup.sql
```

## Мониторинг

### Размер таблиц
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Активные подключения
```sql
SELECT count(*) FROM pg_stat_activity;
```

### Медленные запросы
```sql
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## Ограничения бесплатного плана Neon

- ✅ 0.5 GB хранилища
- ✅ 1 проект
- ✅ Автоматическое масштабирование
- ✅ Serverless (платите только за использование)

**Примерный расчет:**
- 1 пользователь ≈ 1 KB
- 1 монета в коллекции ≈ 500 bytes
- 1000 пользователей × 100 монет = ~50 MB

## Следующие шаги

1. ✅ Создать таблицы (`schema.sql`)
2. ⏳ Создать API сервер (Express + Neon)
3. ⏳ Обновить UserCollectionService для синхронизации
4. ⏳ Добавить авторизацию
5. ⏳ Деплой API на Vercel/Railway

## Полезные ссылки

- [Neon Console](https://console.neon.tech/)
- [Neon Documentation](https://neon.tech/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
