-- ============================================
-- Полезные SQL запросы для работы с БД
-- ============================================

-- ============================================
-- ПОЛЬЗОВАТЕЛИ
-- ============================================

-- Получить всех пользователей
SELECT id, email, name, created_at, last_login
FROM users
ORDER BY created_at DESC;

-- Получить пользователя по email
SELECT * FROM users WHERE email = 'test@example.com';

-- Обновить последний вход
UPDATE users 
SET last_login = NOW() 
WHERE id = '550e8400-e29b-41d4-a716-446655440000';

-- ============================================
-- КОЛЛЕКЦИЯ
-- ============================================

-- Получить коллекцию пользователя (без вишлиста)
SELECT * FROM user_coins
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
  AND is_wishlist = FALSE
  AND deleted_at IS NULL
ORDER BY created_at DESC;

-- Получить вишлист
SELECT * FROM user_coins
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
  AND is_wishlist = TRUE
  AND deleted_at IS NULL
ORDER BY created_at DESC;

-- Добавить монету в коллекцию
INSERT INTO user_coins (
  user_id, catalog_coin_id, is_wishlist, 
  condition, grade, purchase_price, purchase_date, notes
)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'peter1_ruble_1704',
  FALSE,
  'VF',
  'VF-30',
  15000.00,
  '2024-01-15',
  'Куплена на аукционе'
)
RETURNING *;

-- Обновить монету
UPDATE user_coins
SET 
  condition = 'XF',
  grade = 'XF-40',
  notes = 'Обновлена оценка после экспертизы',
  updated_at = NOW()
WHERE id = 'coin-uuid-here';

-- Мягкое удаление монеты
UPDATE user_coins
SET deleted_at = NOW()
WHERE id = 'coin-uuid-here';

-- Переместить из вишлиста в коллекцию
UPDATE user_coins
SET is_wishlist = FALSE, updated_at = NOW()
WHERE id = 'coin-uuid-here';

-- ============================================
-- СТАТИСТИКА
-- ============================================

-- Статистика коллекции пользователя
SELECT * FROM user_collection_stats
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';

-- Детальная статистика
SELECT 
  COUNT(*) FILTER (WHERE is_wishlist = FALSE AND deleted_at IS NULL) as collection_count,
  COUNT(*) FILTER (WHERE is_wishlist = TRUE AND deleted_at IS NULL) as wishlist_count,
  SUM(purchase_price) FILTER (WHERE is_wishlist = FALSE AND deleted_at IS NULL) as total_spent,
  AVG(purchase_price) FILTER (WHERE is_wishlist = FALSE AND deleted_at IS NULL) as avg_price,
  MIN(purchase_date) FILTER (WHERE is_wishlist = FALSE AND deleted_at IS NULL) as first_purchase,
  MAX(purchase_date) FILTER (WHERE is_wishlist = FALSE AND deleted_at IS NULL) as last_purchase
FROM user_coins
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';

-- Топ-10 самых дорогих монет в коллекции
SELECT catalog_coin_id, purchase_price, purchase_date, condition, grade
FROM user_coins
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
  AND is_wishlist = FALSE
  AND deleted_at IS NULL
  AND purchase_price IS NOT NULL
ORDER BY purchase_price DESC
LIMIT 10;

-- Монеты по годам покупки
SELECT 
  EXTRACT(YEAR FROM purchase_date) as year,
  COUNT(*) as count,
  SUM(purchase_price) as total_spent
FROM user_coins
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
  AND is_wishlist = FALSE
  AND deleted_at IS NULL
  AND purchase_date IS NOT NULL
GROUP BY EXTRACT(YEAR FROM purchase_date)
ORDER BY year DESC;

-- ============================================
-- СИНХРОНИЗАЦИЯ
-- ============================================

-- Получить несинхронизированные монеты
SELECT * FROM user_coins
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
  AND (synced_at IS NULL OR updated_at > synced_at);

-- Отметить как синхронизированную
UPDATE user_coins
SET synced_at = NOW()
WHERE id = 'coin-uuid-here';

-- История синхронизации пользователя
SELECT * FROM sync_log
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY last_sync DESC
LIMIT 10;

-- Добавить запись синхронизации
INSERT INTO sync_log (user_id, device_id, device_name, platform, app_version)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'device-001',
  'iPhone 13',
  'ios',
  '1.0.0'
);

-- ============================================
-- ОБЩАЯ СТАТИСТИКА ПЛАТФОРМЫ
-- ============================================

-- Общая статистика
SELECT * FROM platform_stats;

-- Самые популярные монеты
SELECT 
  catalog_coin_id,
  COUNT(*) as collectors_count
FROM user_coins
WHERE is_wishlist = FALSE AND deleted_at IS NULL
GROUP BY catalog_coin_id
ORDER BY collectors_count DESC
LIMIT 20;

-- Активные пользователи (за последние 30 дней)
SELECT COUNT(*) as active_users
FROM users
WHERE last_login > NOW() - INTERVAL '30 days';

-- ============================================
-- ОЧИСТКА И ОБСЛУЖИВАНИЕ
-- ============================================

-- Удалить старые сессии (истекшие более 7 дней назад)
DELETE FROM user_sessions
WHERE expires_at < NOW() - INTERVAL '7 days';

-- Окончательно удалить монеты (удалённые более 30 дней назад)
DELETE FROM user_coins
WHERE deleted_at < NOW() - INTERVAL '30 days';

-- Очистить старые логи синхронизации (старше 90 дней)
DELETE FROM sync_log
WHERE last_sync < NOW() - INTERVAL '90 days';

-- ============================================
-- РЕЗЕРВНОЕ КОПИРОВАНИЕ
-- ============================================

-- Экспорт коллекции пользователя в JSON
SELECT json_agg(row_to_json(t))
FROM (
  SELECT * FROM user_coins
  WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
    AND deleted_at IS NULL
) t;

-- ============================================
-- ПОИСК И ФИЛЬТРАЦИЯ
-- ============================================

-- Поиск по заметкам
SELECT * FROM user_coins
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
  AND notes ILIKE '%аукцион%'
  AND deleted_at IS NULL;

-- Фильтр по состоянию
SELECT * FROM user_coins
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
  AND condition IN ('XF', 'AU')
  AND deleted_at IS NULL;

-- Фильтр по диапазону цен
SELECT * FROM user_coins
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
  AND purchase_price BETWEEN 10000 AND 50000
  AND deleted_at IS NULL;

-- Фильтр по датам покупки
SELECT * FROM user_coins
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
  AND purchase_date BETWEEN '2024-01-01' AND '2024-12-31'
  AND deleted_at IS NULL;
