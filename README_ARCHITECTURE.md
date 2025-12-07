# Архитектура проекта Coin Catalog

## Обзор

Проект использует классовую архитектуру для работы с данными монет. Все данные организованы в иерархическую структуру: Страна → Период → Правитель → Монета.

## Структура данных

```
Country (Страна)
  └── Period (Период: Империя, СССР и т.д.)
      └── Ruler (Правитель)
          └── Coin (Монета из каталога)

User (Пользователь)
  └── UserCollection (Коллекция пользователя)
      └── UserCoin (Монета в коллекции)
```

## Модели данных

### 1. Country (models/Country.js)
Представляет страну в каталоге монет.

**Поля:**
- `id` - уникальный идентификатор
- `name` - название на русском
- `nameEn` - название на английском
- `description` - описание

**Методы:**
- `validate()` - валидация данных
- `toDatabase()` - преобразование для сохранения в БД
- `fromDatabase(row)` - создание из данных БД

### 2. Period (models/Period.js)
Представляет исторический период (Империя, СССР и т.д.).

**Поля:**
- `id` - уникальный идентификатор
- `countryId` - ID страны
- `name` - название периода
- `startYear`, `endYear` - годы начала и конца
- `sortOrder` - порядок сортировки

**Методы:**
- `getDuration()` - длительность периода в годах
- `includesYear(year)` - проверка, входит ли год в период

### 3. Ruler (models/Ruler.js)
Представляет правителя.

**Поля:**
- `id` - уникальный идентификатор
- `periodId` - ID периода
- `name`, `nameEn` - имя правителя
- `startYear`, `endYear` - годы правления
- `birthYear`, `deathYear` - годы жизни
- `imageUrl` - URL изображения
- `description`, `succession`, `coinage` - описания

**Методы:**
- `getReignYears()` - годы правления в формате строки
- `getReignDuration()` - длительность правления
- `getAgeAtStart()` - возраст на момент начала правления
- `getLifespan()` - продолжительность жизни

### 4. Coin (models/Coin.js)
Представляет монету из каталога.

**Поля:**
- `id` - уникальный идентификатор
- `rulerId` - ID правителя
- `name`, `nameEn` - название монеты
- `year` - год чеканки
- `denomination` - номинал
- `metal` - металл
- `weight`, `diameter` - физические параметры
- `rarity`, `rarityScore` - редкость
- `estimatedValueMin`, `estimatedValueMax` - оценочная стоимость

**Методы:**
- `getEstimatedValue()` - средняя оценочная стоимость
- `isRare()` - проверка редкости
- `getMetalType()` - тип металла (gold, silver, copper)
- `isCommemorative()` - проверка, является ли памятной
- `getAge()` - возраст монеты в годах

### 5. UserCoin (models/UserCoin.js)
Представляет монету в коллекции пользователя.

**Поля:**
- `id` - уникальный идентификатор
- `userId` - ID пользователя
- `catalogCoinId` - ID монеты из каталога
- `isWishlist` - флаг вишлиста
- `condition`, `grade` - состояние и оценка
- `purchasePrice` - цена покупки
- `purchaseDate` - дата покупки (Date объект)
- `createdAt` - дата добавления в коллекцию (Date объект)
- `needsSync` - требуется синхронизация с сервером
- `isDeleted` - помечена как удалённая

**Методы для работы с датами:**
- `getPurchaseDate()` - получить дату покупки как Date
- `getCreatedAt()` - получить дату добавления как Date
- `getDaysInCollection()` - количество дней в коллекции
- `getMonthsInCollection()` - количество месяцев в коллекции
- `getPurchaseYear()` - год покупки
- `wasPurchasedInYear(year)` - проверка покупки в году

**Методы для работы со стоимостью:**
- `getCurrentValue()` - текущая стоимость
- `getProfitLoss()` - прибыль/убыток
- `getProfitLossPercent()` - процент прибыли/убытка

**Методы для синхронизации:**
- `markForSync()` - отметить для синхронизации
- `markAsSynced()` - отметить как синхронизированную
- `markAsDeleted()` - пометить как удалённую
- `update(data)` - обновить данные

## Сервисы

### 1. DatabaseService (services/DatabaseService.js)
Сервис для работы с базой данных (справочники).

**Методы:**
- `initialize()` - инициализация БД
- `getCountries()` - получить все страны
- `getPeriodsByCountry(countryId)` - получить периоды страны
- `getRulers()` - получить всех правителей
- `getRulersByPeriod(periodId)` - получить правителей периода
- `getRulerById(id)` - получить правителя по ID
- `getCoinsByRuler(rulerId)` - получить монеты правителя
- `getCoinById(id)` - получить монету по ID
- `searchCoins(query)` - поиск монет
- `getCoinsByDenomination(rulerId, type)` - монеты по типу номинала
- `getDenominationsByRuler(rulerId)` - группы номиналов

**Особенности:**
- Поддерживает SQLite (мобильные) и localStorage (веб)
- Автоматическая миграция данных при обновлении версии
- Возвращает объекты моделей (Country, Period, Ruler, Coin)

### 2. UserCollectionService (services/UserCollectionService.js)
Сервис для управления коллекцией пользователя.

**Методы:**
- `initialize(userId)` - инициализация сервиса
- `addCoin(catalogCoinId, data)` - добавить монету в коллекцию
- `updateCoin(userCoinId, data)` - обновить монету
- `removeCoin(catalogCoinId)` - удалить монету
- `getUserCoins(isWishlist)` - получить коллекцию/вишлист
- `isInCollection(catalogCoinId)` - проверка наличия в коллекции
- `moveToCollection(userCoinId)` - переместить из вишлиста
- `clearAll()` - очистить всю коллекцию
- `getCollectionStats()` - статистика коллекции
- `syncAll()` - синхронизировать все изменения

**Особенности:**
- Поддерживает локальное хранение (SQLite/localStorage)
- Автоматическая синхронизация с сервером (TODO)
- Мягкое удаление (isDeleted флаг)
- Отслеживание изменений (needsSync флаг)
- Возвращает объекты UserCoin с обогащёнными данными

## Хранение данных

### База данных (SQLite)

**Справочные таблицы:**
- `countries` - страны
- `periods` - периоды
- `rulers` - правители
- `catalog_coins` - каталог монет

**Пользовательские таблицы:**
- `user_coins` - коллекция пользователя

**Служебные таблицы:**
- `db_metadata` - метаданные БД (версия)

### Веб (localStorage)

**Ключи:**
- `coin_catalog_user_collection` - коллекция пользователя

## Работа с датами

Все даты хранятся как ISO строки в БД, но в моделях преобразуются в Date объекты.

**Пример:**
```javascript
const userCoin = await userCollectionService.addCoin('coin_id', {
  purchaseDate: new Date('2024-01-15'), // Date объект
  purchasePrice: 1000,
});

console.log(userCoin.getPurchaseDate()); // Date объект
console.log(userCoin.getDaysInCollection()); // число дней
console.log(userCoin.getPurchaseYear()); // 2024
```

## Синхронизация с сервером

Коллекция пользователя синхронизируется с сервером:

1. При добавлении/изменении монеты устанавливается флаг `needsSync = true`
2. Вызывается `_syncToServer(userCoin)` для отправки на сервер
3. После успешной синхронизации устанавливается `syncedAt` и `needsSync = false`
4. При удалении монета помечается `isDeleted = true` и синхронизируется

**TODO:** Реализовать API для синхронизации.

## Миграция данных

При обновлении версии БД происходит автоматическая миграция:

1. Проверяется версия в `db_metadata`
2. Если версия устарела, запускается миграция
3. Создаются новые таблицы (countries, periods)
4. Данные из каталога переносятся в новую структуру
5. Обновляется версия БД

**Важно:** Коллекция пользователя сохраняется при миграции!

## Обратная совместимость

Старый файл `services/database.js` является обёрткой над новыми сервисами.

**Для новых компонентов используйте:**
```javascript
import { databaseService, userCollectionService } from '../services';

// Работа с каталогом
const rulers = await databaseService.getRulers();
const coins = await databaseService.getCoinsByRuler('peter1');

// Работа с коллекцией
await userCollectionService.addCoin('coin_id', { purchasePrice: 1000 });
const collection = await userCollectionService.getUserCoins(false);
```

**Старый API продолжает работать:**
```javascript
import { getRulers, getCoinsByRuler, addToCollection } from '../services/database';

const rulers = await getRulers();
const coins = await getCoinsByRuler('peter1');
await addToCollection('coin_id', false, { purchasePrice: 1000 });
```

## Примеры использования

### Получить все монеты правителя с методами класса

```javascript
const coins = await databaseService.getCoinsByRuler('peter1');

for (const coin of coins) {
  console.log(coin.name);
  console.log('Редкая:', coin.isRare());
  console.log('Возраст:', coin.getAge(), 'лет');
  console.log('Стоимость:', coin.getEstimatedValue());
}
```

### Добавить монету в коллекцию

```javascript
const userCoin = await userCollectionService.addCoin('coin_id', {
  purchasePrice: 1500,
  purchaseDate: new Date('2024-01-15'),
  condition: 'VF',
  notes: 'Куплена на аукционе',
});

console.log('Добавлена:', userCoin.id);
console.log('Дней в коллекции:', userCoin.getDaysInCollection());
```

### Получить статистику коллекции

```javascript
const stats = await userCollectionService.getCollectionStats();

console.log('Монет в коллекции:', stats.collectionCount);
console.log('В вишлисте:', stats.wishlistCount);
console.log('Общая стоимость:', stats.totalValue);
console.log('Прибыль:', stats.profitLoss);
console.log('Прибыль %:', stats.profitLossPercent);
```

### Работа с датами

```javascript
const collection = await userCollectionService.getUserCoins(false);

// Фильтрация по году покупки
const coins2024 = collection.filter(c => c.wasPurchasedInYear(2024));

// Сортировка по дате добавления
const sorted = collection.sort((a, b) => 
  b.getCreatedAt() - a.getCreatedAt()
);

// Монеты старше 30 дней
const old = collection.filter(c => c.getDaysInCollection() > 30);
```

## Будущие улучшения

1. **API для синхронизации** - реализовать серверную часть
2. **Авторизация** - добавить систему пользователей
3. **Оффлайн режим** - улучшить работу без интернета
4. **Конфликты синхронизации** - обработка конфликтов при синхронизации
5. **Экспорт/импорт** - экспорт коллекции в CSV/Excel
6. **Фотографии** - загрузка фото монет пользователя
7. **Дополнительные периоды** - СССР, Российская Федерация
