import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { Country, Period, Ruler, Coin, UserCoin } from '../models';
import { catalogData } from '../data/catalog';

/**
 * DatabaseService - сервис для работы с базой данных
 * Поддерживает SQLite (мобильные устройства) и localStorage (веб)
 */
class DatabaseService {
  constructor() {
    this.db = null;
    this.isWeb = Platform.OS === 'web';
    this.isInitialized = false;
    
    // In-memory storage для веб
    this.webStorage = {
      countries: [],
      periods: [],
      rulers: [],
      coins: [],
    };
  }

  /**
   * Инициализация базы данных
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      if (this.isWeb) {
        await this._initializeWeb();
      } else {
        await this._initializeSQLite();
      }
      
      this.isInitialized = true;
      console.log('DatabaseService initialized');
    } catch (error) {
      console.error('DatabaseService initialization error:', error);
      throw error;
    }
  }

  /**
   * Инициализация для веб (localStorage)
   */
  async _initializeWeb() {
    // Загружаем данные из каталога
    await this._seedWebStorage();
    console.log('Web storage initialized');
  }

  /**
   * Инициализация SQLite
   */
  async _initializeSQLite() {
    // ВРЕМЕННОЕ РЕШЕНИЕ: Удаляем БД принудительно для миграции
    try {
      const db = await SQLite.openDatabaseAsync('coin_catalog.db');
      
      // Проверяем версию
      try {
        const versionRow = await db.getFirstAsync(
          'SELECT value FROM db_metadata WHERE key = ?', 
          ['version']
        );
        const currentVersion = versionRow ? parseInt(versionRow.value) : 0;
        
        // Если версия меньше 5 - удаляем все таблицы
        if (currentVersion < 5) {
          console.log(`⚠️ Old DB version ${currentVersion} detected. Dropping all tables...`);
          await db.runAsync('DROP TABLE IF EXISTS user_coins');
          await db.runAsync('DROP TABLE IF EXISTS catalog_coins');
          await db.runAsync('DROP TABLE IF EXISTS rulers');
          await db.runAsync('DROP TABLE IF EXISTS periods');
          await db.runAsync('DROP TABLE IF EXISTS countries');
          await db.runAsync('DROP TABLE IF EXISTS db_metadata');
          console.log('✅ Old tables dropped');
        }
      } catch (e) {
        // Таблица не существует - это нормально
        console.log('No existing metadata table');
      }
      
      this.db = db;
    } catch (error) {
      console.log('Error checking DB version:', error);
      this.db = await SQLite.openDatabaseAsync('coin_catalog.db');
    }
    
    // Создаём таблицы
    await this._createTables();
    
    // Проверяем версию и заполняем данными если нужно
    await this._checkAndSeedDatabase();
  }

  /**
   * Создание таблиц в SQLite
   */
  async _createTables() {
    await this.db.execAsync(`
      -- Страны
      CREATE TABLE IF NOT EXISTS countries (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        nameEn TEXT,
        description TEXT
      );

      -- Периоды
      CREATE TABLE IF NOT EXISTS periods (
        id TEXT PRIMARY KEY,
        countryId TEXT NOT NULL,
        name TEXT NOT NULL,
        nameEn TEXT,
        startYear INTEGER,
        endYear INTEGER,
        description TEXT,
        sortOrder INTEGER DEFAULT 0,
        FOREIGN KEY (countryId) REFERENCES countries(id)
      );

      -- Правители
      CREATE TABLE IF NOT EXISTS rulers (
        id TEXT PRIMARY KEY,
        periodId TEXT,
        name TEXT NOT NULL,
        nameEn TEXT,
        title TEXT,
        startYear INTEGER,
        endYear INTEGER,
        birthYear INTEGER,
        deathYear INTEGER,
        description TEXT,
        imageUrl TEXT,
        sortOrder INTEGER DEFAULT 0,
        succession TEXT,
        coinage TEXT,
        FOREIGN KEY (periodId) REFERENCES periods(id)
      );

      -- Каталог монет (справочник)
      CREATE TABLE IF NOT EXISTS catalog_coins (
        id TEXT PRIMARY KEY,
        rulerId TEXT NOT NULL,
        catalogNumber TEXT,
        name TEXT NOT NULL,
        nameEn TEXT,
        year INTEGER,
        denomination TEXT,
        denominationValue REAL,
        currency TEXT,
        metal TEXT,
        weight REAL,
        diameter REAL,
        mint TEXT,
        mintMark TEXT,
        mintage INTEGER,
        rarity TEXT,
        rarityScore INTEGER,
        estimatedValueMin REAL,
        estimatedValueMax REAL,
        obverseImage TEXT,
        reverseImage TEXT,
        description TEXT,
        FOREIGN KEY (rulerId) REFERENCES rulers(id)
      );

      -- Создаём индексы
      CREATE INDEX IF NOT EXISTS idx_periods_country ON periods(countryId);
      CREATE INDEX IF NOT EXISTS idx_rulers_period ON rulers(periodId);
      CREATE INDEX IF NOT EXISTS idx_catalog_ruler ON catalog_coins(rulerId);
      CREATE INDEX IF NOT EXISTS idx_catalog_year ON catalog_coins(year);
      
      -- Метаданные БД
      CREATE TABLE IF NOT EXISTS db_metadata (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);
  }

  /**
   * Проверка версии БД и заполнение данными
   */
  async _checkAndSeedDatabase() {
    const DB_VERSION = 5; // Принудительная пересборка БД
    
    const versionRow = await this.db.getFirstAsync(
      'SELECT value FROM db_metadata WHERE key = ?', 
      ['version']
    );
    const currentVersion = versionRow ? parseInt(versionRow.value) : 0;
    
    if (currentVersion < DB_VERSION) {
      console.log(`Migrating database from version ${currentVersion} to ${DB_VERSION}`);
      await this._migrateDatabase(currentVersion, DB_VERSION);
    }
  }

  /**
   * Миграция базы данных
   */
  async _migrateDatabase(fromVersion, toVersion) {
    try {
      // Для версии 4+ - полное пересоздание БД
      if (toVersion >= 4) {
        console.log(`Performing full database recreation for v${toVersion}...`);
        
        // Удаляем все таблицы
        await this.db.runAsync('DROP TABLE IF EXISTS user_coins');
        await this.db.runAsync('DROP TABLE IF EXISTS catalog_coins');
        await this.db.runAsync('DROP TABLE IF EXISTS rulers');
        await this.db.runAsync('DROP TABLE IF EXISTS periods');
        await this.db.runAsync('DROP TABLE IF EXISTS countries');
        await this.db.runAsync('DROP TABLE IF EXISTS db_metadata');
        
        // Создаём таблицы заново
        await this._createTables();
      }
      
      await this.db.execAsync('BEGIN TRANSACTION');
      
      // Создаём новую структуру
      await this._seedCountriesAndPeriods();
      await this._seedRulers();
      await this._seedCoins();
      
      // Обновляем версию
      await this.db.runAsync(
        'INSERT OR REPLACE INTO db_metadata (key, value) VALUES (?, ?)',
        ['version', toVersion.toString()]
      );
      
      await this.db.execAsync('COMMIT');
      console.log('Database migration completed');
    } catch (error) {
      await this.db.execAsync('ROLLBACK');
      console.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Заполнение таблиц стран и периодов
   */
  async _seedCountriesAndPeriods() {
    // Создаём страну "Россия"
    const russia = new Country({
      id: 'russia',
      name: 'Россия',
      nameEn: 'Russia',
      description: 'Российское государство',
    });
    
    await this.db.runAsync(
      'INSERT OR REPLACE INTO countries (id, name, nameEn, description) VALUES (?, ?, ?, ?)',
      [russia.id, russia.name, russia.nameEn, russia.description]
    );
    
    // Создаём период "Российская Империя"
    const empire = new Period({
      id: 'russian_empire',
      countryId: 'russia',
      name: 'Российская Империя',
      nameEn: 'Russian Empire',
      startYear: 1721,
      endYear: 1917,
      description: 'Период с провозглашения Петром I Российской Империи до Февральской революции',
      sortOrder: 1,
    });
    
    await this.db.runAsync(
      `INSERT OR REPLACE INTO periods (id, countryId, name, nameEn, startYear, endYear, description, sortOrder)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [empire.id, empire.countryId, empire.name, empire.nameEn, empire.startYear, 
       empire.endYear, empire.description, empire.sortOrder]
    );
  }

  /**
   * Заполнение таблицы правителей
   */
  async _seedRulers() {
    for (const rulerData of catalogData.rulers) {
      const ruler = new Ruler({
        ...rulerData,
        periodId: 'russian_empire', // Все правители относятся к периоду Империи
      });
      
      const data = ruler.toDatabase();
      await this.db.runAsync(
        `INSERT OR REPLACE INTO rulers (
          id, periodId, name, nameEn, title, startYear, endYear, birthYear, deathYear,
          description, imageUrl, sortOrder, succession, coinage
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.id, data.periodId, data.name, data.nameEn, data.title,
          data.startYear, data.endYear, data.birthYear, data.deathYear,
          data.description, data.imageUrl, data.sortOrder, data.succession, data.coinage
        ]
      );
    }
  }

  /**
   * Заполнение таблицы монет
   */
  async _seedCoins() {
    for (const coinData of catalogData.coins) {
      const coin = new Coin(coinData);
      const data = coin.toDatabase();
      
      await this.db.runAsync(
        `INSERT OR REPLACE INTO catalog_coins (
          id, rulerId, catalogNumber, name, nameEn, year, denomination,
          denominationValue, currency, metal, weight, diameter, mint, mintMark,
          mintage, rarity, rarityScore, estimatedValueMin, estimatedValueMax,
          obverseImage, reverseImage, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.id, data.rulerId, data.catalogNumber, data.name, data.nameEn,
          data.year, data.denomination, data.denominationValue, data.currency,
          data.metal, data.weight, data.diameter, data.mint, data.mintMark,
          data.mintage, data.rarity, data.rarityScore, data.estimatedValueMin,
          data.estimatedValueMax, data.obverseImage, data.reverseImage, data.description
        ]
      );
    }
  }

  /**
   * Заполнение веб-хранилища
   */
  async _seedWebStorage() {
    // Создаём страну
    this.webStorage.countries = [
      new Country({
        id: 'russia',
        name: 'Россия',
        nameEn: 'Russia',
        description: 'Российское государство',
      })
    ];
    
    // Создаём период
    this.webStorage.periods = [
      new Period({
        id: 'russian_empire',
        countryId: 'russia',
        name: 'Российская Империя',
        nameEn: 'Russian Empire',
        startYear: 1721,
        endYear: 1917,
        description: 'Период с провозглашения Петром I Российской Империи до Февральской революции',
        sortOrder: 1,
      })
    ];
    
    // Загружаем правителей
    this.webStorage.rulers = catalogData.rulers.map(r => 
      new Ruler({ ...r, periodId: 'russian_empire' })
    );
    
    // Загружаем монеты
    this.webStorage.coins = catalogData.coins.map(c => new Coin(c));
  }

  // ==================== МЕТОДЫ ДЛЯ РАБОТЫ С ДАННЫМИ ====================

  /**
   * Получить все страны
   */
  async getCountries() {
    if (!this.isInitialized) await this.initialize();
    
    if (this.isWeb) {
      return this.webStorage.countries;
    }
    
    const rows = await this.db.getAllAsync('SELECT * FROM countries');
    return rows.map(row => Country.fromDatabase(row));
  }

  /**
   * Получить периоды по стране
   */
  async getPeriodsByCountry(countryId) {
    if (!this.isInitialized) await this.initialize();
    
    if (this.isWeb) {
      return this.webStorage.periods
        .filter(p => p.countryId === countryId)
        .sort((a, b) => a.sortOrder - b.sortOrder);
    }
    
    const rows = await this.db.getAllAsync(
      'SELECT * FROM periods WHERE countryId = ? ORDER BY sortOrder ASC',
      [countryId]
    );
    return rows.map(row => Period.fromDatabase(row));
  }

  /**
   * Получить всех правителей
   */
  async getRulers() {
    if (!this.isInitialized) await this.initialize();
    
    if (this.isWeb) {
      return [...this.webStorage.rulers].sort((a, b) => a.sortOrder - b.sortOrder);
    }
    
    const rows = await this.db.getAllAsync('SELECT * FROM rulers ORDER BY sortOrder ASC');
    return rows.map(row => Ruler.fromDatabase(row));
  }

  /**
   * Получить правителей по периоду
   */
  async getRulersByPeriod(periodId) {
    if (!this.isInitialized) await this.initialize();
    
    if (this.isWeb) {
      return this.webStorage.rulers
        .filter(r => r.periodId === periodId)
        .sort((a, b) => a.sortOrder - b.sortOrder);
    }
    
    const rows = await this.db.getAllAsync(
      'SELECT * FROM rulers WHERE periodId = ? ORDER BY sortOrder ASC',
      [periodId]
    );
    return rows.map(row => Ruler.fromDatabase(row));
  }

  /**
   * Получить правителя по ID
   */
  async getRulerById(id) {
    if (!this.isInitialized) await this.initialize();
    
    if (this.isWeb) {
      const ruler = this.webStorage.rulers.find(r => r.id === id);
      return ruler || null;
    }
    
    const row = await this.db.getFirstAsync('SELECT * FROM rulers WHERE id = ?', [id]);
    return row ? Ruler.fromDatabase(row) : null;
  }

  /**
   * Получить монеты по правителю
   */
  async getCoinsByRuler(rulerId) {
    if (!this.isInitialized) await this.initialize();
    
    if (this.isWeb) {
      return this.webStorage.coins
        .filter(c => c.rulerId === rulerId)
        .sort((a, b) => a.year - b.year || (b.denominationValue || 0) - (a.denominationValue || 0));
    }
    
    const rows = await this.db.getAllAsync(
      'SELECT * FROM catalog_coins WHERE rulerId = ? ORDER BY year ASC, denominationValue DESC',
      [rulerId]
    );
    return rows.map(row => Coin.fromDatabase(row));
  }

  /**
   * Получить монету по ID
   */
  async getCoinById(id) {
    if (!this.isInitialized) await this.initialize();
    
    if (this.isWeb) {
      const coin = this.webStorage.coins.find(c => c.id === id);
      if (coin) {
        const ruler = this.webStorage.rulers.find(r => r.id === coin.rulerId);
        return new Coin({
          ...coin,
          ruler: ruler?.name,
          rulerEn: ruler?.nameEn,
        });
      }
      return null;
    }
    
    const row = await this.db.getFirstAsync(
      `SELECT c.*, r.name as ruler, r.nameEn as rulerEn
       FROM catalog_coins c
       LEFT JOIN rulers r ON c.rulerId = r.id
       WHERE c.id = ?`,
      [id]
    );
    return row ? Coin.fromDatabase(row) : null;
  }

  /**
   * Поиск монет
   */
  async searchCoins(query) {
    if (!this.isInitialized) await this.initialize();
    
    const q = query.toLowerCase();
    
    if (this.isWeb) {
      return this.webStorage.coins
        .filter(c => 
          c.name?.toLowerCase().includes(q) ||
          c.nameEn?.toLowerCase().includes(q) ||
          c.catalogNumber?.toLowerCase().includes(q) ||
          String(c.year).includes(q)
        )
        .slice(0, 50);
    }
    
    const searchTerm = `%${query}%`;
    const rows = await this.db.getAllAsync(
      `SELECT * FROM catalog_coins 
       WHERE name LIKE ? OR nameEn LIKE ? OR catalogNumber LIKE ? OR CAST(year AS TEXT) LIKE ?
       ORDER BY year ASC LIMIT 50`,
      [searchTerm, searchTerm, searchTerm, searchTerm]
    );
    return rows.map(row => Coin.fromDatabase(row));
  }

  /**
   * Получить монеты по типу номинала
   */
  async getCoinsByDenomination(rulerId, denominationType) {
    const coins = await this.getCoinsByRuler(rulerId);
    
    return coins.filter(coin => {
      // Проверка на памятные монеты
      if (coin.isCommemorative()) {
        return denominationType === 'commemorative';
      }
      
      const metalType = coin.getMetalType();
      const value = coin.denominationValue || 0;
      
      if (metalType === 'gold') {
        return denominationType === 'gold';
      } else if (metalType === 'silver') {
        if (value >= 0.5) {
          return denominationType === 'silver_ruble';
        } else {
          return denominationType === 'silver_small';
        }
      } else if (metalType === 'copper') {
        return denominationType === 'copper';
      }
      
      return false;
    }).sort((a, b) => a.year - b.year);
  }

  /**
   * Получить группы номиналов для правителя
   */
  async getDenominationsByRuler(rulerId) {
    const coins = await this.getCoinsByRuler(rulerId);
    
    const groups = {};
    
    for (const coin of coins) {
      let type = 'copper';
      
      if (coin.isCommemorative()) {
        type = 'commemorative';
      } else {
        const metalType = coin.getMetalType();
        const value = coin.denominationValue || 0;
        
        if (metalType === 'gold') {
          type = 'gold';
        } else if (metalType === 'silver') {
          type = value >= 0.5 ? 'silver_ruble' : 'silver_small';
        } else if (metalType === 'copper') {
          type = 'copper';
        }
      }
      
      if (!groups[type]) {
        groups[type] = {
          type,
          name: this._getDenominationTypeName(type),
          count: 0,
        };
      }
      groups[type].count++;
    }
    
    const order = ['gold', 'silver_ruble', 'silver_small', 'copper', 'commemorative', 'token'];
    return Object.values(groups).sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
  }

  /**
   * Получить название типа номинала
   */
  _getDenominationTypeName(type) {
    const names = {
      gold: 'Золотые монеты',
      silver_ruble: 'Серебряные рубли',
      silver_small: 'Серебряная мелочь',
      copper: 'Медные монеты',
      commemorative: 'Памятные монеты',
      token: 'Жетоны',
    };
    return names[type] || 'Прочие';
  }
}

// Экспортируем singleton
export const databaseService = new DatabaseService();
