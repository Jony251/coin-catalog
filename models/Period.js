/**
 * Класс Period - представляет исторический период (Империя, СССР и т.д.)
 */
export class Period {
  constructor(data) {
    this.id = data.id;
    this.countryId = data.countryId;
    this.name = data.name;
    this.nameEn = data.nameEn;
    this.startYear = data.startYear;
    this.endYear = data.endYear;
    this.description = data.description || null;
    this.sortOrder = data.sortOrder || 0;
  }

  /**
   * Создать объект Period из данных БД
   */
  static fromDatabase(row) {
    return new Period(row);
  }

  /**
   * Преобразовать в объект для сохранения в БД
   */
  toDatabase() {
    return {
      id: this.id,
      countryId: this.countryId,
      name: this.name,
      nameEn: this.nameEn,
      startYear: this.startYear,
      endYear: this.endYear,
      description: this.description,
      sortOrder: this.sortOrder,
    };
  }

  /**
   * Получить длительность периода в годах
   */
  getDuration() {
    return this.endYear - this.startYear;
  }

  /**
   * Проверить, входит ли год в период
   */
  includesYear(year) {
    return year >= this.startYear && year <= this.endYear;
  }

  /**
   * Валидация данных
   */
  validate() {
    if (!this.id || !this.countryId || !this.name) {
      throw new Error('Period must have id, countryId and name');
    }
    if (this.startYear && this.endYear && this.startYear > this.endYear) {
      throw new Error('Period startYear must be less than endYear');
    }
    return true;
  }
}
