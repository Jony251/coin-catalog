# Инструкция по настройке базы данных Neon

## Шаг 1: Подключение к Neon

### Вариант A: Через веб-интерфейс (рекомендуется)

1. Откройте https://console.neon.tech/
2. Войдите в свой аккаунт
3. Выберите проект `neondb`
4. Перейдите в **SQL Editor**

### Вариант B: Через psql (командная строка)

**Сначала получите connection string:**
1. Откройте https://console.neon.tech/
2. Выберите проект
3. Нажмите **Connection Details**
4. Скопируйте **Connection string**

```bash
# Используйте ваш connection string
psql 'postgresql://username:password@host.neon.tech/dbname?sslmode=require'

# Или через переменную окружения
export DATABASE_URL='postgresql://...'
psql $DATABASE_URL
```

## Шаг 2: Создание таблиц

### Через веб-интерфейс:

1. Откройте файл `database/schema.sql`
2. Скопируйте **всё содержимое** файла
3. Вставьте в SQL Editor на Neon
4. Нажмите **Run** (или Ctrl+Enter)
5. Дождитесь сообщения об успешном выполнении

### Через psql:

```bash
# Из корневой папки проекта
psql 'postgresql://...' < database/schema.sql
```

## Шаг 3: Проверка установки

Выполните следующий запрос:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Ожидаемый результат:**
```
table_name
-----------------
sync_log
user_coins
user_sessions
users
```

## Шаг 4: Добавление тестовых данных (опционально)

Если хотите добавить тестовые данные для разработки:

### Через веб-интерфейс:
1. Откройте файл `database/seed.sql`
2. Скопируйте содержимое
3. Вставьте в SQL Editor
4. Нажмите **Run**

### Через psql:
```bash
psql 'postgresql://...' < database/seed.sql
```

## Шаг 5: Проверка данных

```sql
-- Проверить пользователей
SELECT id, email, name, created_at FROM users;

-- Проверить коллекцию
SELECT id, catalog_coin_id, is_wishlist, purchase_price 
FROM user_coins 
WHERE deleted_at IS NULL;

-- Проверить статистику
SELECT * FROM user_collection_stats;
```

## Шаг 6: Настройка приложения

1. Убедитесь, что файл `.env` создан в корне проекта
2. Проверьте, что `DATABASE_URL` правильный:

```env
DATABASE_URL=postgresql://username:password@host.neon.tech/dbname?sslmode=require
```

**Получите ваш connection string:**
- Откройте https://console.neon.tech/
- Выберите проект → Connection Details
- Скопируйте connection string

## Возможные проблемы

### Ошибка: "permission denied"
**Решение:** Убедитесь, что используете правильный connection string с правами `neondb_owner`

### Ошибка: "relation already exists"
**Решение:** Таблицы уже созданы. Можно пропустить этот шаг или удалить таблицы:
```sql
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS sync_log CASCADE;
DROP TABLE IF EXISTS user_coins CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

### Ошибка: "SSL connection required"
**Решение:** Убедитесь, что в connection string есть `?sslmode=require`

## Полезные команды

### Просмотр структуры таблицы
```sql
\d users
\d user_coins
```

### Удаление всех данных (осторожно!)
```sql
TRUNCATE users, user_coins, sync_log, user_sessions CASCADE;
```

### Пересоздание таблиц
```sql
-- Удалить все таблицы
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS sync_log CASCADE;
DROP TABLE IF EXISTS user_coins CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Затем запустить schema.sql заново
```

## Следующие шаги

После успешной установки БД:

1. ✅ Таблицы созданы
2. ⏳ Создать API сервер (см. `server/` папку)
3. ⏳ Обновить UserCollectionService для синхронизации
4. ⏳ Добавить авторизацию
5. ⏳ Протестировать синхронизацию

## Мониторинг

### Проверить размер БД
```sql
SELECT pg_size_pretty(pg_database_size('neondb'));
```

### Проверить количество записей
```sql
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'user_coins', COUNT(*) FROM user_coins
UNION ALL
SELECT 'sync_log', COUNT(*) FROM sync_log
UNION ALL
SELECT 'user_sessions', COUNT(*) FROM user_sessions;
```

### Проверить последнюю активность
```sql
SELECT 
  u.email,
  COUNT(uc.id) as coins_count,
  MAX(uc.created_at) as last_coin_added
FROM users u
LEFT JOIN user_coins uc ON u.id = uc.user_id
GROUP BY u.id, u.email
ORDER BY last_coin_added DESC;
```

## Контакты

Если возникли проблемы:
1. Проверьте логи в Neon Console
2. Убедитесь, что connection string правильный
3. Проверьте, что у вас есть права на создание таблиц

---

**Важно:** Не коммитьте файл `.env` в Git! Он уже добавлен в `.gitignore`.
