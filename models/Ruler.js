/**
 * Класс Ruler - представляет правителя
 */
export class Ruler {
  constructor(data) {
    this.id = data.id;
    this.periodId = data.periodId || null;
    this.name = data.name;
    this.nameEn = data.nameEn;
    this.title = data.title || null;
    this.startYear = data.startYear;
    this.endYear = data.endYear;
    this.birthYear = data.birthYear || null;
    this.deathYear = data.deathYear || null;
    this.description = data.description || null;
    this.imageUrl = data.imageUrl || null;
    this.sortOrder = data.sortOrder || 0;
    this.succession = data.succession || null;
    this.coinage = data.coinage || null;
  }

  /**
   * Создать объект Ruler из данных БД
   */
  static fromDatabase(row) {
    return new Ruler(row);
  }

  /**
   * Преобразовать в объект для сохранения в БД
   */
  toDatabase() {
    return {
      id: this.id,
      periodId: this.periodId,
      name: this.name,
      nameEn: this.nameEn,
      title: this.title,
      startYear: this.startYear,
      endYear: this.endYear,
      birthYear: this.birthYear,
      deathYear: this.deathYear,
      description: this.description,
      imageUrl: this.imageUrl,
      sortOrder: this.sortOrder,
      succession: this.succession,
      coinage: this.coinage,
    };
  }

  /**
   * Получить годы правления в формате строки
   */
  getReignYears() {
    return `${this.startYear}-${this.endYear}`;
  }

  /**
   * Получить длительность правления в годах
   */
  getReignDuration() {
    return this.endYear - this.startYear;
  }

  /**
   * Получить возраст на момент начала правления
   */
  getAgeAtStart() {
    if (!this.birthYear) return null;
    return this.startYear - this.birthYear;
  }

  /**
   * Получить возраст на момент окончания правления
   */
  getAgeAtEnd() {
    if (!this.birthYear) return null;
    return this.endYear - this.birthYear;
  }

  /**
   * Получить продолжительность жизни
   */
  getLifespan() {
    if (!this.birthYear || !this.deathYear) return null;
    return this.deathYear - this.birthYear;
  }

  /**
   * Валидация данных
   */
  validate() {
    if (!this.id || !this.periodId || !this.name) {
      throw new Error('Ruler must have id, periodId and name');
    }
    if (this.startYear && this.endYear && this.startYear > this.endYear) {
      throw new Error('Ruler startYear must be less than endYear');
    }
    return true;
  }
}
