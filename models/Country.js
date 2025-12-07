/**
 * Класс Country - представляет страну в каталоге монет
 */
export class Country {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.nameEn = data.nameEn;
    this.description = data.description || null;
  }

  /**
   * Создать объект Country из данных БД
   */
  static fromDatabase(row) {
    return new Country(row);
  }

  /**
   * Преобразовать в объект для сохранения в БД
   */
  toDatabase() {
    return {
      id: this.id,
      name: this.name,
      nameEn: this.nameEn,
      description: this.description,
    };
  }

  /**
   * Валидация данных
   */
  validate() {
    if (!this.id || !this.name) {
      throw new Error('Country must have id and name');
    }
    return true;
  }
}
