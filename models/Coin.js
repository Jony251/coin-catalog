/**
 * Класс Coin - представляет монету из каталога
 */
export class Coin {
  constructor(data) {
    this.id = data.id;
    this.rulerId = data.rulerId;
    this.catalogNumber = data.catalogNumber || null;
    this.name = data.name;
    this.nameEn = data.nameEn || null;
    this.year = data.year;
    this.denomination = data.denomination;
    this.denominationValue = data.denominationValue || null;
    this.currency = data.currency || null;
    this.metal = data.metal || null;
    this.weight = data.weight || null;
    this.diameter = data.diameter || null;
    this.mint = data.mint || null;
    this.mintMark = data.mintMark || null;
    this.mintage = data.mintage || null;
    this.rarity = data.rarity || null;
    this.rarityScore = data.rarityScore || null;
    this.estimatedValueMin = data.estimatedValueMin || null;
    this.estimatedValueMax = data.estimatedValueMax || null;
    this.obverseImage = data.obverseImage || null;
    this.reverseImage = data.reverseImage || null;
    this.description = data.description || null;
    
    // Дополнительные поля из JOIN запросов
    this.ruler = data.ruler || null;
    this.rulerEn = data.rulerEn || null;
  }

  /**
   * Создать объект Coin из данных БД
   */
  static fromDatabase(row) {
    return new Coin(row);
  }

  /**
   * Преобразовать в объект для сохранения в БД
   */
  toDatabase() {
    return {
      id: this.id,
      rulerId: this.rulerId,
      catalogNumber: this.catalogNumber,
      name: this.name,
      nameEn: this.nameEn,
      year: this.year,
      denomination: this.denomination,
      denominationValue: this.denominationValue,
      currency: this.currency,
      metal: this.metal,
      weight: this.weight,
      diameter: this.diameter,
      mint: this.mint,
      mintMark: this.mintMark,
      mintage: this.mintage,
      rarity: this.rarity,
      rarityScore: this.rarityScore,
      estimatedValueMin: this.estimatedValueMin,
      estimatedValueMax: this.estimatedValueMax,
      obverseImage: this.obverseImage,
      reverseImage: this.reverseImage,
      description: this.description,
    };
  }

  /**
   * Получить среднюю оценочную стоимость
   */
  getEstimatedValue() {
    if (!this.estimatedValueMin || !this.estimatedValueMax) return null;
    return (this.estimatedValueMin + this.estimatedValueMax) / 2;
  }

  /**
   * Получить диапазон стоимости в виде строки
   */
  getEstimatedValueRange() {
    if (!this.estimatedValueMin || !this.estimatedValueMax) return null;
    return `${this.estimatedValueMin}-${this.estimatedValueMax}`;
  }

  /**
   * Проверить, является ли монета редкой
   */
  isRare() {
    return this.rarityScore && this.rarityScore >= 7;
  }

  /**
   * Проверить, является ли монета очень редкой
   */
  isVeryRare() {
    return this.rarityScore && this.rarityScore >= 9;
  }

  /**
   * Получить тип металла на русском
   */
  getMetalType() {
    if (!this.metal) return null;
    const metal = this.metal.toLowerCase();
    if (metal.includes('золото') || metal.includes('gold')) return 'gold';
    if (metal.includes('серебро') || metal.includes('silver')) return 'silver';
    if (metal.includes('медь') || metal.includes('copper')) return 'copper';
    if (metal.includes('платина') || metal.includes('platinum')) return 'platinum';
    return 'other';
  }

  /**
   * Проверить, является ли монета памятной
   */
  isCommemorative() {
    if (!this.name) return false;
    const name = this.name.toLowerCase();
    return name.includes('коронация') || 
           name.includes('памят') || 
           name.includes('юбилей') ||
           name.includes('бородино') || 
           name.includes('романов') || 
           name.includes('гангут');
  }

  /**
   * Получить возраст монеты в годах
   */
  getAge() {
    return new Date().getFullYear() - this.year;
  }

  /**
   * Валидация данных
   */
  validate() {
    if (!this.id || !this.rulerId || !this.name) {
      throw new Error('Coin must have id, rulerId and name');
    }
    if (this.year && (this.year < 1000 || this.year > new Date().getFullYear())) {
      throw new Error('Coin year is invalid');
    }
    return true;
  }
}
