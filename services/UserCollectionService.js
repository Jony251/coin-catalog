import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { UserCoin } from '../models';
import { databaseService } from './DatabaseService';

/**
 * UserCollectionService - сервис для управления коллекцией пользователя
 * Поддерживает локальное хранение и синхронизацию с сервером
 */
class UserCollectionService {
  constructor() {
    this.db = null;
    this.isWeb = Platform.OS === 'web';
    this.isInitialized = false;
    this.userId = null; // ID пользователя (для будущей авторизации)
    
    // In-memory storage для веб
    this.webStorage = {
      userCoins: [],
    };
  }

  /**
   * Инициализация сервиса
   */
  async initialize(userId = null) {
    if (this.isInitialized) return;

    this.userId = userId;

    try {
      if (this.isWeb) {
        await this._initializeWeb();
      } else {
        await this._initializeSQLite();
      }
      
      this.isInitialized = true;
      console.log('UserCollectionService initialized');
    } catch (error) {
      console.error('UserCollectionService initialization error:', error);
      throw error;
    }
  }

  /**
   * Инициализация для веб (localStorage)
   */
  async _initializeWeb() {
    try {
      const saved = localStorage.getItem('coin_catalog_user_collection');
      if (saved) {
        const data = JSON.parse(saved);
        this.webStorage.userCoins = data.map(item => UserCoin.fromDatabase(item));
      }
    } catch (e) {
      console.log('No saved user collection data');
    }
  }

  /**
   * Инициализация SQLite
   */
  async _initializeSQLite() {
    this.db = await SQLite.openDatabaseAsync('coin_catalog.db');
    await this._createUserTables();
  }

  /**
   * Создание таблиц для коллекции пользователя
   */
  async _createUserTables() {
    await this.db.execAsync(`
      -- Коллекция пользователя
      CREATE TABLE IF NOT EXISTS user_coins (
        id TEXT PRIMARY KEY,
        userId TEXT,
        catalogCoinId TEXT NOT NULL,
        isWishlist INTEGER DEFAULT 0,
        condition TEXT,
        grade TEXT,
        purchasePrice REAL,
        purchaseDate TEXT,
        notes TEXT,
        userObverseImage TEXT,
        userReverseImage TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT,
        syncedAt TEXT,
        needsSync INTEGER DEFAULT 0,
        isDeleted INTEGER DEFAULT 0,
        FOREIGN KEY (catalogCoinId) REFERENCES catalog_coins(id)
      );

      -- Индексы
      CREATE INDEX IF NOT EXISTS idx_user_coins_catalog ON user_coins(catalogCoinId);
      CREATE INDEX IF NOT EXISTS idx_user_coins_user ON user_coins(userId);
      CREATE INDEX IF NOT EXISTS idx_user_coins_wishlist ON user_coins(isWishlist);
      CREATE INDEX IF NOT EXISTS idx_user_coins_sync ON user_coins(needsSync);
    `);
  }

  /**
   * Сохранить веб-хранилище в localStorage
   */
  _saveWebStorage() {
    if (this.isWeb) {
      const data = this.webStorage.userCoins.map(coin => coin.toDatabase());
      localStorage.setItem('coin_catalog_user_collection', JSON.stringify(data));
    }
  }

  // ==================== CRUD ОПЕРАЦИИ ====================

  /**
   * Добавить монету в коллекцию
   */
  async addCoin(catalogCoinId, data = {}) {
    if (!this.isInitialized) await this.initialize();

    const userCoin = new UserCoin({
      id: `uc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      catalogCoinId,
      isWishlist: data.isWishlist || false,
      condition: data.condition || null,
      grade: data.grade || null,
      purchasePrice: data.purchasePrice || null,
      purchaseDate: data.purchaseDate || null,
      notes: data.notes || null,
      userObverseImage: data.userObverseImage || null,
      userReverseImage: data.userReverseImage || null,
      createdAt: new Date(),
      needsSync: true,
    });

    userCoin.validate();

    if (this.isWeb) {
      // Удаляем из вишлиста если добавляем в коллекцию
      if (!userCoin.isWishlist) {
        this.webStorage.userCoins = this.webStorage.userCoins.filter(
          c => !(c.catalogCoinId === catalogCoinId && c.isWishlist)
        );
      }
      
      this.webStorage.userCoins.push(userCoin);
      this._saveWebStorage();
    } else {
      // Удаляем из вишлиста если добавляем в коллекцию
      if (!userCoin.isWishlist) {
        await this.db.runAsync(
          'DELETE FROM user_coins WHERE catalogCoinId = ? AND isWishlist = 1',
          [catalogCoinId]
        );
      }

      const dbData = userCoin.toDatabase();
      await this.db.runAsync(
        `INSERT INTO user_coins (
          id, userId, catalogCoinId, isWishlist, condition, grade, 
          purchasePrice, purchaseDate, notes, userObverseImage, userReverseImage,
          createdAt, updatedAt, syncedAt, needsSync, isDeleted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dbData.id, dbData.userId, dbData.catalogCoinId, dbData.isWishlist,
          dbData.condition, dbData.grade, dbData.purchasePrice, dbData.purchaseDate,
          dbData.notes, dbData.userObverseImage, dbData.userReverseImage,
          dbData.createdAt, dbData.updatedAt, dbData.syncedAt, dbData.needsSync, dbData.isDeleted
        ]
      );
    }

    // TODO: Синхронизация с сервером
    await this._syncToServer(userCoin);

    return userCoin;
  }

  /**
   * Обновить монету в коллекции
   */
  async updateCoin(userCoinId, data) {
    if (!this.isInitialized) await this.initialize();

    if (this.isWeb) {
      const coin = this.webStorage.userCoins.find(c => c.id === userCoinId);
      if (!coin) throw new Error('UserCoin not found');
      
      coin.update(data);
      this._saveWebStorage();
      
      // TODO: Синхронизация с сервером
      await this._syncToServer(coin);
      
      return coin;
    } else {
      const row = await this.db.getFirstAsync(
        'SELECT * FROM user_coins WHERE id = ?',
        [userCoinId]
      );
      
      if (!row) throw new Error('UserCoin not found');
      
      const coin = UserCoin.fromDatabase(row);
      coin.update(data);
      
      const dbData = coin.toDatabase();
      await this.db.runAsync(
        `UPDATE user_coins SET
          condition = ?, grade = ?, purchasePrice = ?, purchaseDate = ?,
          notes = ?, userObverseImage = ?, userReverseImage = ?,
          updatedAt = ?, needsSync = ?
         WHERE id = ?`,
        [
          dbData.condition, dbData.grade, dbData.purchasePrice, dbData.purchaseDate,
          dbData.notes, dbData.userObverseImage, dbData.userReverseImage,
          dbData.updatedAt, dbData.needsSync, dbData.id
        ]
      );
      
      // TODO: Синхронизация с сервером
      await this._syncToServer(coin);
      
      return coin;
    }
  }

  /**
   * Удалить монету из коллекции
   */
  async removeCoin(catalogCoinId) {
    if (!this.isInitialized) await this.initialize();

    if (this.isWeb) {
      const coin = this.webStorage.userCoins.find(c => c.catalogCoinId === catalogCoinId);
      
      this.webStorage.userCoins = this.webStorage.userCoins.filter(
        c => c.catalogCoinId !== catalogCoinId
      );
      this._saveWebStorage();
      
      // TODO: Синхронизация с сервером (отправить удаление)
      if (coin) {
        coin.markAsDeleted();
        await this._syncToServer(coin);
      }
    } else {
      const row = await this.db.getFirstAsync(
        'SELECT * FROM user_coins WHERE catalogCoinId = ?',
        [catalogCoinId]
      );
      
      if (row) {
        const coin = UserCoin.fromDatabase(row);
        coin.markAsDeleted();
        
        // TODO: Синхронизация с сервером
        await this._syncToServer(coin);
      }
      
      await this.db.runAsync(
        'DELETE FROM user_coins WHERE catalogCoinId = ?',
        [catalogCoinId]
      );
    }
  }

  /**
   * Получить коллекцию пользователя
   */
  async getUserCoins(isWishlist = false) {
    if (!this.isInitialized) await this.initialize();

    if (this.isWeb) {
      const userCoins = this.webStorage.userCoins.filter(uc => 
        uc.isWishlist === isWishlist && !uc.isDeleted
      );
      
      // Обогащаем данными из каталога
      const enrichedCoins = await Promise.all(
        userCoins.map(async (uc) => {
          const catalogCoin = await databaseService.getCoinById(uc.catalogCoinId);
          return new UserCoin({
            ...uc,
            catalogCoin,
          });
        })
      );
      
      return enrichedCoins.sort((a, b) => b.createdAt - a.createdAt);
    } else {
      const rows = await this.db.getAllAsync(
        `SELECT 
          uc.*,
          c.id as coin_id, c.rulerId, c.catalogNumber, c.name, c.nameEn, c.year,
          c.denomination, c.denominationValue, c.currency, c.metal, c.weight,
          c.diameter, c.mint, c.mintMark, c.mintage, c.rarity, c.rarityScore,
          c.estimatedValueMin, c.estimatedValueMax, c.obverseImage, c.reverseImage,
          c.description
         FROM user_coins uc
         JOIN catalog_coins c ON uc.catalogCoinId = c.id
         WHERE uc.isWishlist = ? AND uc.isDeleted = 0
         ORDER BY uc.createdAt DESC`,
        [isWishlist ? 1 : 0]
      );
      
      return rows.map(row => {
        const userCoin = UserCoin.fromDatabase(row);
        userCoin.catalogCoin = {
          id: row.coin_id,
          rulerId: row.rulerId,
          catalogNumber: row.catalogNumber,
          name: row.name,
          nameEn: row.nameEn,
          year: row.year,
          denomination: row.denomination,
          denominationValue: row.denominationValue,
          currency: row.currency,
          metal: row.metal,
          weight: row.weight,
          diameter: row.diameter,
          mint: row.mint,
          mintMark: row.mintMark,
          mintage: row.mintage,
          rarity: row.rarity,
          rarityScore: row.rarityScore,
          estimatedValueMin: row.estimatedValueMin,
          estimatedValueMax: row.estimatedValueMax,
          obverseImage: row.obverseImage,
          reverseImage: row.reverseImage,
          description: row.description,
        };
        return userCoin;
      });
    }
  }

  /**
   * Проверить, есть ли монета в коллекции
   */
  async isInCollection(catalogCoinId) {
    if (!this.isInitialized) await this.initialize();

    if (this.isWeb) {
      const owned = this.webStorage.userCoins.find(
        c => c.catalogCoinId === catalogCoinId && !c.isWishlist && !c.isDeleted
      );
      const wishlisted = this.webStorage.userCoins.find(
        c => c.catalogCoinId === catalogCoinId && c.isWishlist && !c.isDeleted
      );
      return { owned: !!owned, wishlisted: !!wishlisted };
    } else {
      const owned = await this.db.getFirstAsync(
        'SELECT id FROM user_coins WHERE catalogCoinId = ? AND isWishlist = 0 AND isDeleted = 0',
        [catalogCoinId]
      );
      const wishlisted = await this.db.getFirstAsync(
        'SELECT id FROM user_coins WHERE catalogCoinId = ? AND isWishlist = 1 AND isDeleted = 0',
        [catalogCoinId]
      );
      return { owned: !!owned, wishlisted: !!wishlisted };
    }
  }

  /**
   * Переместить из вишлиста в коллекцию
   */
  async moveToCollection(userCoinId) {
    if (!this.isInitialized) await this.initialize();

    if (this.isWeb) {
      const coin = this.webStorage.userCoins.find(c => c.id === userCoinId);
      if (coin) {
        coin.isWishlist = false;
        coin.markForSync();
        this._saveWebStorage();
        
        // TODO: Синхронизация с сервером
        await this._syncToServer(coin);
      }
    } else {
      const row = await this.db.getFirstAsync(
        'SELECT * FROM user_coins WHERE id = ?',
        [userCoinId]
      );
      
      if (row) {
        const coin = UserCoin.fromDatabase(row);
        coin.isWishlist = false;
        coin.markForSync();
        
        const dbData = coin.toDatabase();
        await this.db.runAsync(
          'UPDATE user_coins SET isWishlist = 0, updatedAt = ?, needsSync = ? WHERE id = ?',
          [dbData.updatedAt, dbData.needsSync, coin.id]
        );
        
        // TODO: Синхронизация с сервером
        await this._syncToServer(coin);
      }
    }
  }

  /**
   * Очистить всю коллекцию
   */
  async clearAll() {
    if (!this.isInitialized) await this.initialize();

    if (this.isWeb) {
      // Помечаем все как удалённые для синхронизации
      for (const coin of this.webStorage.userCoins) {
        coin.markAsDeleted();
        await this._syncToServer(coin);
      }
      
      this.webStorage.userCoins = [];
      this._saveWebStorage();
    } else {
      // Помечаем все как удалённые для синхронизации
      const rows = await this.db.getAllAsync('SELECT * FROM user_coins');
      for (const row of rows) {
        const coin = UserCoin.fromDatabase(row);
        coin.markAsDeleted();
        await this._syncToServer(coin);
      }
      
      await this.db.runAsync('DELETE FROM user_coins');
    }
  }

  // ==================== СТАТИСТИКА ====================

  /**
   * Получить статистику коллекции
   */
  async getCollectionStats() {
    const collection = await this.getUserCoins(false);
    const wishlist = await this.getUserCoins(true);
    
    const totalValue = collection.reduce((sum, coin) => {
      const value = coin.getCurrentValue();
      return sum + (value || 0);
    }, 0);
    
    const totalPurchasePrice = collection.reduce((sum, coin) => {
      return sum + (coin.purchasePrice || 0);
    }, 0);
    
    const profitLoss = totalValue - totalPurchasePrice;
    
    return {
      collectionCount: collection.length,
      wishlistCount: wishlist.length,
      totalValue,
      totalPurchasePrice,
      profitLoss,
      profitLossPercent: totalPurchasePrice > 0 ? (profitLoss / totalPurchasePrice) * 100 : 0,
    };
  }

  // ==================== СИНХРОНИЗАЦИЯ ====================

  /**
   * Синхронизировать монету с сервером
   * TODO: Реализовать когда будет готов API
   */
  async _syncToServer(userCoin) {
    // Заглушка для будущей реализации
    console.log('Sync to server:', userCoin.id, userCoin.isDeleted ? '(deleted)' : '');
    
    // Когда будет готов API:
    // try {
    //   const response = await fetch('API_URL/user-coins/sync', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(userCoin.toServerFormat()),
    //   });
    //   
    //   if (response.ok) {
    //     userCoin.markAsSynced();
    //     // Обновить в БД
    //   }
    // } catch (error) {
    //   console.error('Sync error:', error);
    // }
  }

  /**
   * Синхронизировать все несинхронизированные монеты
   */
  async syncAll() {
    if (!this.isInitialized) await this.initialize();

    let coinsToSync = [];
    
    if (this.isWeb) {
      coinsToSync = this.webStorage.userCoins.filter(c => c.needsSync);
    } else {
      const rows = await this.db.getAllAsync(
        'SELECT * FROM user_coins WHERE needsSync = 1'
      );
      coinsToSync = rows.map(row => UserCoin.fromDatabase(row));
    }
    
    console.log(`Syncing ${coinsToSync.length} coins...`);
    
    for (const coin of coinsToSync) {
      await this._syncToServer(coin);
    }
  }
}

// Экспортируем singleton
export const userCollectionService = new UserCollectionService();
