/**
 * Класс UserCoin - представляет монету в коллекции пользователя
 */
export class UserCoin {
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId || null;
    this.catalogCoinId = data.catalogCoinId;
    this.isWishlist = data.isWishlist || false;
    this.condition = data.condition || null;
    this.grade = data.grade || null;
    this.purchasePrice = data.purchasePrice || null;
    this.purchaseDate = data.purchaseDate ? this._parseDate(data.purchaseDate) : null;
    this.notes = data.notes || null;
    this.userObverseImage = data.userObverseImage || null;
    this.userReverseImage = data.userReverseImage || null;
    this.createdAt = data.createdAt ? this._parseDate(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? this._parseDate(data.updatedAt) : null;
    
    // Поля для синхронизации
    this.syncedAt = data.syncedAt ? this._parseDate(data.syncedAt) : null;
    this.needsSync = data.needsSync || false;
    this.isDeleted = data.isDeleted || false;
    
    // Дополнительные поля из JOIN запросов (данные о монете из каталога)
    this.catalogCoin = data.catalogCoin || null;
  }

  /**
   * Создать объект UserCoin из данных БД
   */
  static fromDatabase(row) {
    return new UserCoin(row);
  }

  /**
   * Преобразовать в объект для сохранения в БД
   */
  toDatabase() {
    return {
      id: this.id,
      userId: this.userId,
      catalogCoinId: this.catalogCoinId,
      isWishlist: this.isWishlist ? 1 : 0,
      condition: this.condition,
      grade: this.grade,
      purchasePrice: this.purchasePrice,
      purchaseDate: this.purchaseDate ? this.purchaseDate.toISOString() : null,
      notes: this.notes,
      userObverseImage: this.userObverseImage,
      userReverseImage: this.userReverseImage,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt ? this.updatedAt.toISOString() : null,
      syncedAt: this.syncedAt ? this.syncedAt.toISOString() : null,
      needsSync: this.needsSync ? 1 : 0,
      isDeleted: this.isDeleted ? 1 : 0,
    };
  }

  /**
   * Преобразовать в объект для отправки на сервер
   */
  toServerFormat() {
    return {
      id: this.id,
      userId: this.userId,
      catalogCoinId: this.catalogCoinId,
      isWishlist: this.isWishlist,
      condition: this.condition,
      grade: this.grade,
      purchasePrice: this.purchasePrice,
      purchaseDate: this.purchaseDate ? this.purchaseDate.toISOString() : null,
      notes: this.notes,
      userObverseImage: this.userObverseImage,
      userReverseImage: this.userReverseImage,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt ? this.updatedAt.toISOString() : null,
      isDeleted: this.isDeleted,
    };
  }

  /**
   * Парсинг даты из разных форматов
   */
  _parseDate(date) {
    if (date instanceof Date) return date;
    if (typeof date === 'string') return new Date(date);
    if (typeof date === 'number') return new Date(date);
    return null;
  }

  /**
   * Получить дату покупки как Date объект
   */
  getPurchaseDate() {
    return this.purchaseDate;
  }

  /**
   * Получить дату добавления в коллекцию как Date объект
   */
  getCreatedAt() {
    return this.createdAt;
  }

  /**
   * Получить количество дней в коллекции
   */
  getDaysInCollection() {
    const now = new Date();
    const diff = now - this.createdAt;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Получить количество месяцев в коллекции
   */
  getMonthsInCollection() {
    const now = new Date();
    const yearDiff = now.getFullYear() - this.createdAt.getFullYear();
    const monthDiff = now.getMonth() - this.createdAt.getMonth();
    return yearDiff * 12 + monthDiff;
  }

  /**
   * Получить год покупки
   */
  getPurchaseYear() {
    return this.purchaseDate ? this.purchaseDate.getFullYear() : null;
  }

  /**
   * Получить месяц покупки (1-12)
   */
  getPurchaseMonth() {
    return this.purchaseDate ? this.purchaseDate.getMonth() + 1 : null;
  }

  /**
   * Проверить, была ли монета куплена в указанном году
   */
  wasPurchasedInYear(year) {
    return this.getPurchaseYear() === year;
  }

  /**
   * Получить текущую стоимость (если есть оценка в каталоге)
   */
  getCurrentValue() {
    if (!this.catalogCoin) return null;
    const min = this.catalogCoin.estimatedValueMin;
    const max = this.catalogCoin.estimatedValueMax;
    if (!min || !max) return null;
    return (min + max) / 2;
  }

  /**
   * Получить прибыль/убыток от покупки
   */
  getProfitLoss() {
    if (!this.purchasePrice) return null;
    const currentValue = this.getCurrentValue();
    if (!currentValue) return null;
    return currentValue - this.purchasePrice;
  }

  /**
   * Получить процент прибыли/убытка
   */
  getProfitLossPercent() {
    if (!this.purchasePrice) return null;
    const profitLoss = this.getProfitLoss();
    if (profitLoss === null) return null;
    return (profitLoss / this.purchasePrice) * 100;
  }

  /**
   * Отметить как требующую синхронизации
   */
  markForSync() {
    this.needsSync = true;
    this.updatedAt = new Date();
  }

  /**
   * Отметить как синхронизированную
   */
  markAsSynced() {
    this.needsSync = false;
    this.syncedAt = new Date();
  }

  /**
   * Пометить как удалённую (мягкое удаление)
   */
  markAsDeleted() {
    this.isDeleted = true;
    this.updatedAt = new Date();
    this.markForSync();
  }

  /**
   * Обновить данные монеты
   */
  update(data) {
    if (data.condition !== undefined) this.condition = data.condition;
    if (data.grade !== undefined) this.grade = data.grade;
    if (data.purchasePrice !== undefined) this.purchasePrice = data.purchasePrice;
    if (data.purchaseDate !== undefined) this.purchaseDate = this._parseDate(data.purchaseDate);
    if (data.notes !== undefined) this.notes = data.notes;
    if (data.userObverseImage !== undefined) this.userObverseImage = data.userObverseImage;
    if (data.userReverseImage !== undefined) this.userReverseImage = data.userReverseImage;
    
    this.updatedAt = new Date();
    this.markForSync();
  }

  /**
   * Валидация данных
   */
  validate() {
    if (!this.id || !this.catalogCoinId) {
      throw new Error('UserCoin must have id and catalogCoinId');
    }
    if (this.purchasePrice && this.purchasePrice < 0) {
      throw new Error('Purchase price cannot be negative');
    }
    return true;
  }
}
