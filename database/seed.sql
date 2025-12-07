-- ============================================
-- Seed Data для тестирования
-- ============================================

-- Тестовый пользователь
-- Пароль: test123
-- (В реальном приложении используйте bcrypt для хеширования!)
INSERT INTO users (id, email, password_hash, name, is_public) 
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'test@example.com', '$2a$10$YourHashedPasswordHere', 'Тестовый пользователь', false),
  ('550e8400-e29b-41d4-a716-446655440001', 'demo@example.com', '$2a$10$YourHashedPasswordHere', 'Демо пользователь', true)
ON CONFLICT (email) DO NOTHING;

-- Примеры монет в коллекции
INSERT INTO user_coins (user_id, catalog_coin_id, is_wishlist, condition, grade, purchase_price, purchase_date, notes)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'peter1_ruble_1704', false, 'VF', 'VF-30', 15000.00, '2024-01-15', 'Куплена на аукционе Heritage'),
  ('550e8400-e29b-41d4-a716-446655440000', 'catherine2_ruble_1762', false, 'XF', 'XF-40', 25000.00, '2024-02-20', 'Отличная сохранность'),
  ('550e8400-e29b-41d4-a716-446655440000', 'nicholas2_ruble_1913', true, NULL, NULL, NULL, NULL, 'Хочу купить на следующем аукционе')
ON CONFLICT DO NOTHING;

-- Лог синхронизации
INSERT INTO sync_log (user_id, device_id, device_name, platform, app_version)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'device-001', 'iPhone 13', 'ios', '1.0.0'),
  ('550e8400-e29b-41d4-a716-446655440000', 'device-002', 'iPad Pro', 'ios', '1.0.0')
ON CONFLICT DO NOTHING;
