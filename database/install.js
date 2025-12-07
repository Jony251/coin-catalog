/**
 * Скрипт для автоматической установки схемы БД в Neon
 * 
 * Использование:
 * node database/install.js
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Connection string из .env
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Ошибка: DATABASE_URL не найден в переменных окружения!');
  console.error('\n💡 Создайте файл .env и добавьте:');
  console.error('   DATABASE_URL=postgresql://username:password@host.neon.tech/dbname?sslmode=require\n');
  console.error('📖 См. .env.example для примера\n');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function install() {
  console.log('🚀 Начинаем установку схемы БД в Neon...\n');

  try {
    // Читаем schema.sql
    console.log('📖 Читаем schema.sql...');
    const schemaSQL = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');

    // Выполняем schema.sql
    console.log('⚙️  Создаём таблицы...');
    // Используем .query() для выполнения сырого SQL
    const { neon } = await import('@neondatabase/serverless');
    const sqlQuery = neon(DATABASE_URL);
    
    // Разбиваем на отдельные команды и выполняем
    const commands = schemaSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    for (const command of commands) {
      if (command) {
        try {
          await sqlQuery`${sqlQuery.raw(command)}`;
        } catch (err) {
          // Игнорируем ошибки "already exists"
          if (!err.message.includes('already exists')) {
            throw err;
          }
        }
      }
    }
    console.log('✅ Таблицы созданы успешно!\n');

    // Проверяем созданные таблицы
    console.log('🔍 Проверяем созданные таблицы...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log('📋 Созданные таблицы:');
    tables.forEach(t => console.log(`   - ${t.table_name}`));
    console.log('');

    // Проверяем views
    const views = await sql`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    if (views.length > 0) {
      console.log('📊 Созданные представления (views):');
      views.forEach(v => console.log(`   - ${v.table_name}`));
      console.log('');
    }

    // Спрашиваем про тестовые данные
    console.log('❓ Хотите добавить тестовые данные? (y/n)');
    console.log('   (Для автоматической установки запустите: node database/install.js --seed)\n');

    if (process.argv.includes('--seed')) {
      await installSeedData();
    }

    console.log('✨ Установка завершена успешно!');
    console.log('\n📝 Следующие шаги:');
    console.log('   1. Проверьте БД в Neon Console: https://console.neon.tech/');
    console.log('   2. Создайте API сервер (см. server/)');
    console.log('   3. Обновите UserCollectionService для синхронизации\n');

  } catch (error) {
    console.error('❌ Ошибка при установке:', error.message);
    console.error('\n💡 Возможные причины:');
    console.error('   - Неправильный DATABASE_URL');
    console.error('   - Нет прав на создание таблиц');
    console.error('   - Таблицы уже существуют (используйте --force для пересоздания)\n');
    process.exit(1);
  }
}

async function installSeedData() {
  try {
    console.log('\n🌱 Добавляем тестовые данные...');
    const seedSQL = readFileSync(join(__dirname, 'seed.sql'), 'utf-8');
    await sql(seedSQL);
    console.log('✅ Тестовые данные добавлены!\n');

    // Показываем добавленные данные
    const users = await sql`SELECT id, email, name FROM users`;
    console.log('👥 Тестовые пользователи:');
    users.forEach(u => console.log(`   - ${u.email} (${u.name})`));

    const coins = await sql`
      SELECT catalog_coin_id, is_wishlist, purchase_price 
      FROM user_coins 
      WHERE deleted_at IS NULL
    `;
    console.log(`\n🪙 Тестовые монеты: ${coins.length} шт.`);
    console.log('');

  } catch (error) {
    console.error('⚠️  Ошибка при добавлении тестовых данных:', error.message);
  }
}

// Запуск
install();
