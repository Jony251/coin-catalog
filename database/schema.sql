-- ============================================
-- Neon PostgreSQL Schema for Coin Catalog
-- ============================================

-- Включаем расширение для UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ТАБЛИЦА: users
-- Пользователи приложения
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  avatar_url VARCHAR(500),
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- ТАБЛИЦА: user_coins
-- Коллекция монет пользователей
-- ============================================
CREATE TABLE IF NOT EXISTS user_coins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  catalog_coin_id VARCHAR(255) NOT NULL,
  is_wishlist BOOLEAN DEFAULT FALSE,
  
  -- Информация о монете
  condition VARCHAR(50),
  grade VARCHAR(50),
  purchase_price DECIMAL(10, 2),
  purchase_date DATE,
  notes TEXT,
  
  -- Фотографии пользователя
  user_obverse_image VARCHAR(500),
  user_reverse_image VARCHAR(500),
  
  -- Временные метки
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  
  -- Для синхронизации
  local_id VARCHAR(255),
  synced_at TIMESTAMP
);

CREATE INDEX idx_user_coins_user ON user_coins(user_id);
CREATE INDEX idx_user_coins_catalog ON user_coins(catalog_coin_id);
CREATE INDEX idx_user_coins_wishlist ON user_coins(is_wishlist);
CREATE INDEX idx_user_coins_deleted ON user_coins(deleted_at);

-- ============================================
-- ТАБЛИЦА: sync_log
-- Лог синхронизации устройств
-- ============================================
CREATE TABLE IF NOT EXISTS sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  device_name VARCHAR(255),
  platform VARCHAR(50),
  app_version VARCHAR(50),
  last_sync TIMESTAMP DEFAULT NOW(),
  sync_status VARCHAR(50) DEFAULT 'success',
  error_message TEXT
);

CREATE INDEX idx_sync_log_user ON sync_log(user_id);
CREATE INDEX idx_sync_log_device ON sync_log(device_id);

-- ============================================
-- ТАБЛИЦА: user_sessions
-- Сессии пользователей
-- ============================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  device_id VARCHAR(255),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(token);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- ============================================
-- ФУНКЦИЯ: Автоматическое обновление updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_coins_updated_at
  BEFORE UPDATE ON user_coins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ПРЕДСТАВЛЕНИЯ (VIEWS)
-- ============================================

-- Статистика коллекции пользователя
CREATE OR REPLACE VIEW user_collection_stats AS
SELECT 
  user_id,
  COUNT(*) FILTER (WHERE is_wishlist = FALSE AND deleted_at IS NULL) as collection_count,
  COUNT(*) FILTER (WHERE is_wishlist = TRUE AND deleted_at IS NULL) as wishlist_count,
  SUM(purchase_price) FILTER (WHERE is_wishlist = FALSE AND deleted_at IS NULL) as total_spent,
  AVG(purchase_price) FILTER (WHERE is_wishlist = FALSE AND deleted_at IS NULL) as avg_price,
  MIN(created_at) FILTER (WHERE is_wishlist = FALSE AND deleted_at IS NULL) as first_coin_date,
  MAX(created_at) FILTER (WHERE is_wishlist = FALSE AND deleted_at IS NULL) as last_coin_date
FROM user_coins
GROUP BY user_id;

-- Общая статистика платформы
CREATE OR REPLACE VIEW platform_stats AS
SELECT 
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT uc.id) FILTER (WHERE uc.deleted_at IS NULL) as total_coins,
  COUNT(DISTINCT uc.id) FILTER (WHERE uc.is_wishlist = FALSE AND uc.deleted_at IS NULL) as total_collection,
  COUNT(DISTINCT uc.id) FILTER (WHERE uc.is_wishlist = TRUE AND uc.deleted_at IS NULL) as total_wishlist,
  AVG(uc.purchase_price) FILTER (WHERE uc.deleted_at IS NULL) as avg_coin_price,
  COUNT(DISTINCT uc.catalog_coin_id) as unique_coins_collected
FROM users u
LEFT JOIN user_coins uc ON u.id = uc.user_id;

-- ============================================
-- НАЧАЛЬНЫЕ ДАННЫЕ
-- ============================================

-- Тестовый пользователь (опционально, для разработки)
-- Пароль: test123 (хешируйте в реальном приложении!)
-- INSERT INTO users (email, password_hash, name) 
-- VALUES ('test@example.com', '$2a$10$...', 'Test User');

-- ============================================
-- ПОЛИТИКИ БЕЗОПАСНОСТИ (RLS)
-- ============================================

-- Включаем Row Level Security
ALTER TABLE user_coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Политика: пользователи видят только свои данные
CREATE POLICY user_coins_policy ON user_coins
  FOR ALL
  USING (user_id = current_setting('app.user_id')::UUID);

CREATE POLICY sync_log_policy ON sync_log
  FOR ALL
  USING (user_id = current_setting('app.user_id')::UUID);

CREATE POLICY user_sessions_policy ON user_sessions
  FOR ALL
  USING (user_id = current_setting('app.user_id')::UUID);

-- ============================================
-- КОММЕНТАРИИ К ТАБЛИЦАМ
-- ============================================

COMMENT ON TABLE users IS 'Пользователи приложения';
COMMENT ON TABLE user_coins IS 'Коллекция монет пользователей';
COMMENT ON TABLE sync_log IS 'Лог синхронизации между устройствами';
COMMENT ON TABLE user_sessions IS 'Активные сессии пользователей';

COMMENT ON COLUMN user_coins.catalog_coin_id IS 'ID монеты из локального каталога (не FK, т.к. каталог локальный)';
COMMENT ON COLUMN user_coins.local_id IS 'ID записи на устройстве пользователя для синхронизации';
COMMENT ON COLUMN user_coins.deleted_at IS 'Мягкое удаление - NULL если активна';
