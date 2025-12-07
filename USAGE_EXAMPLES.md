# Примеры использования новой архитектуры

## Инициализация

```javascript
import { databaseService, userCollectionService } from './services';

// Инициализация при запуске приложения
await databaseService.initialize();
await userCollectionService.initialize();
```

## Работа с каталогом монет

### Получить всех правителей

```javascript
import { databaseService } from './services';

const rulers = await databaseService.getRulers();

for (const ruler of rulers) {
  console.log(ruler.name); // "Пётр I"
  console.log(ruler.getReignYears()); // "1682-1725"
  console.log(ruler.getReignDuration()); // 43
  console.log(ruler.getAgeAtStart()); // 10
}
```

### Получить монеты правителя

```javascript
const coins = await databaseService.getCoinsByRuler('peter1');

for (const coin of coins) {
  console.log(coin.name); // "Рубль 1704"
  console.log(coin.year); // 1704
  console.log(coin.getAge()); // возраст монеты
  console.log(coin.isRare()); // true/false
  console.log(coin.getEstimatedValue()); // средняя стоимость
  console.log(coin.getMetalType()); // "silver"
}
```

### Поиск монет

```javascript
const results = await databaseService.searchCoins('рубль 1725');

console.log(`Найдено: ${results.length} монет`);
```

### Получить монету по ID

```javascript
const coin = await databaseService.getCoinById('peter1_ruble_1704');

if (coin) {
  console.log(coin.name);
  console.log(coin.ruler); // имя правителя из JOIN
  console.log(coin.isCommemorative()); // памятная монета?
}
```

### Группировка по номиналам

```javascript
const groups = await databaseService.getDenominationsByRuler('peter1');

for (const group of groups) {
  console.log(group.name); // "Золотые монеты"
  console.log(group.count); // количество монет
}

// Получить монеты конкретного типа
const goldCoins = await databaseService.getCoinsByDenomination('peter1', 'gold');
```

## Работа с коллекцией пользователя

### Добавить монету в коллекцию

```javascript
import { userCollectionService } from './services';

// Добавить в коллекцию
const userCoin = await userCollectionService.addCoin('peter1_ruble_1704', {
  purchasePrice: 15000,
  purchaseDate: new Date('2024-01-15'),
  condition: 'VF',
  grade: 'VF-30',
  notes: 'Куплена на аукционе Heritage',
});

console.log('ID:', userCoin.id);
console.log('Дата покупки:', userCoin.getPurchaseDate());
console.log('Дней в коллекции:', userCoin.getDaysInCollection());
```

### Добавить в вишлист

```javascript
const wishlistCoin = await userCollectionService.addCoin('catherine2_ruble_1762', {
  isWishlist: true,
  notes: 'Хочу купить на следующем аукционе',
});
```

### Получить коллекцию

```javascript
// Получить коллекцию (без вишлиста)
const collection = await userCollectionService.getUserCoins(false);

for (const userCoin of collection) {
  console.log(userCoin.catalogCoin.name); // название монеты
  console.log('Куплена за:', userCoin.purchasePrice);
  console.log('Текущая стоимость:', userCoin.getCurrentValue());
  console.log('Прибыль:', userCoin.getProfitLoss());
  console.log('Прибыль %:', userCoin.getProfitLossPercent());
}

// Получить вишлист
const wishlist = await userCollectionService.getUserCoins(true);
```

### Проверить наличие в коллекции

```javascript
const status = await userCollectionService.isInCollection('peter1_ruble_1704');

console.log('В коллекции:', status.owned);
console.log('В вишлисте:', status.wishlisted);
```

### Обновить монету

```javascript
await userCollectionService.updateCoin('uc_123456', {
  condition: 'XF',
  grade: 'XF-40',
  notes: 'Обновил оценку после экспертизы',
});
```

### Переместить из вишлиста в коллекцию

```javascript
await userCollectionService.moveToCollection('uc_123456');
```

### Удалить монету

```javascript
await userCollectionService.removeCoin('peter1_ruble_1704');
```

### Получить статистику

```javascript
const stats = await userCollectionService.getCollectionStats();

console.log('Монет в коллекции:', stats.collectionCount);
console.log('В вишлисте:', stats.wishlistCount);
console.log('Общая стоимость:', stats.totalValue, 'руб.');
console.log('Потрачено:', stats.totalPurchasePrice, 'руб.');
console.log('Прибыль/убыток:', stats.profitLoss, 'руб.');
console.log('Прибыль %:', stats.profitLossPercent.toFixed(2), '%');
```

## Работа с датами

### Фильтрация по дате покупки

```javascript
const collection = await userCollectionService.getUserCoins(false);

// Монеты, купленные в 2024 году
const coins2024 = collection.filter(c => c.wasPurchasedInYear(2024));

// Монеты, купленные в январе
const january = collection.filter(c => c.getPurchaseMonth() === 1);

// Монеты старше 30 дней в коллекции
const oldCoins = collection.filter(c => c.getDaysInCollection() > 30);

// Монеты в коллекции больше 6 месяцев
const longTerm = collection.filter(c => c.getMonthsInCollection() > 6);
```

### Сортировка по датам

```javascript
// Сортировка по дате добавления (новые первые)
const sorted = collection.sort((a, b) => 
  b.getCreatedAt() - a.getCreatedAt()
);

// Сортировка по дате покупки
const byPurchase = collection.sort((a, b) => {
  const dateA = a.getPurchaseDate();
  const dateB = b.getPurchaseDate();
  if (!dateA) return 1;
  if (!dateB) return -1;
  return dateB - dateA;
});
```

### Группировка по году покупки

```javascript
const byYear = {};

for (const coin of collection) {
  const year = coin.getPurchaseYear();
  if (!year) continue;
  
  if (!byYear[year]) {
    byYear[year] = [];
  }
  byYear[year].push(coin);
}

console.log('Монет куплено в 2024:', byYear[2024]?.length || 0);
```

## Анализ коллекции

### Самые прибыльные монеты

```javascript
const collection = await userCollectionService.getUserCoins(false);

const profitable = collection
  .filter(c => c.getProfitLoss() !== null)
  .sort((a, b) => b.getProfitLoss() - a.getProfitLoss())
  .slice(0, 10);

console.log('Топ-10 прибыльных монет:');
for (const coin of profitable) {
  console.log(
    coin.catalogCoin.name,
    '+' + coin.getProfitLoss().toFixed(0),
    '(' + coin.getProfitLossPercent().toFixed(1) + '%)'
  );
}
```

### Распределение по металлам

```javascript
const collection = await userCollectionService.getUserCoins(false);

const byMetal = {
  gold: 0,
  silver: 0,
  copper: 0,
  other: 0,
};

for (const userCoin of collection) {
  const coin = userCoin.catalogCoin;
  const metalType = coin.getMetalType ? coin.getMetalType() : 'other';
  byMetal[metalType] = (byMetal[metalType] || 0) + 1;
}

console.log('Золотых:', byMetal.gold);
console.log('Серебряных:', byMetal.silver);
console.log('Медных:', byMetal.copper);
```

### Редкие монеты в коллекции

```javascript
const collection = await userCollectionService.getUserCoins(false);

const rareCoins = collection.filter(uc => {
  const coin = uc.catalogCoin;
  return coin.isRare && coin.isRare();
});

console.log('Редких монет:', rareCoins.length);

const veryRare = collection.filter(uc => {
  const coin = uc.catalogCoin;
  return coin.isVeryRare && coin.isVeryRare();
});

console.log('Очень редких:', veryRare.length);
```

## Использование в React компонентах

### Пример компонента списка правителей

```javascript
import React, { useEffect, useState } from 'react';
import { databaseService } from '../services';

export function RulersList() {
  const [rulers, setRulers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRulers();
  }, []);

  async function loadRulers() {
    try {
      const data = await databaseService.getRulers();
      setRulers(data);
    } catch (error) {
      console.error('Error loading rulers:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Загрузка...</div>;

  return (
    <div>
      {rulers.map(ruler => (
        <div key={ruler.id}>
          <h3>{ruler.name}</h3>
          <p>Правление: {ruler.getReignYears()}</p>
          <p>Продолжительность: {ruler.getReignDuration()} лет</p>
        </div>
      ))}
    </div>
  );
}
```

### Пример компонента коллекции

```javascript
import React, { useEffect, useState } from 'react';
import { userCollectionService } from '../services';

export function MyCollection() {
  const [collection, setCollection] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadCollection();
  }, []);

  async function loadCollection() {
    const coins = await userCollectionService.getUserCoins(false);
    const statistics = await userCollectionService.getCollectionStats();
    setCollection(coins);
    setStats(statistics);
  }

  async function handleRemove(catalogCoinId) {
    await userCollectionService.removeCoin(catalogCoinId);
    await loadCollection(); // перезагрузить
  }

  return (
    <div>
      <h2>Моя коллекция</h2>
      
      {stats && (
        <div>
          <p>Монет: {stats.collectionCount}</p>
          <p>Стоимость: {stats.totalValue.toFixed(0)} руб.</p>
          <p>Прибыль: {stats.profitLoss.toFixed(0)} руб. ({stats.profitLossPercent.toFixed(1)}%)</p>
        </div>
      )}

      {collection.map(userCoin => (
        <div key={userCoin.id}>
          <h4>{userCoin.catalogCoin.name}</h4>
          <p>Год: {userCoin.catalogCoin.year}</p>
          <p>Куплена: {userCoin.getPurchaseDate()?.toLocaleDateString()}</p>
          <p>Цена покупки: {userCoin.purchasePrice} руб.</p>
          <p>Текущая стоимость: {userCoin.getCurrentValue()} руб.</p>
          <p>В коллекции: {userCoin.getDaysInCollection()} дней</p>
          <button onClick={() => handleRemove(userCoin.catalogCoinId)}>
            Удалить
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Миграция существующего кода

### Было (старый API):

```javascript
import { getRulers, getCoinsByRuler, addToCollection } from '../services/database';

const rulers = await getRulers();
const coins = await getCoinsByRuler('peter1');
await addToCollection('coin_id', false, { purchasePrice: 1000 });
```

### Стало (новый API):

```javascript
import { databaseService, userCollectionService } from '../services';

const rulers = await databaseService.getRulers();
const coins = await databaseService.getCoinsByRuler('peter1');
await userCollectionService.addCoin('coin_id', { purchasePrice: 1000 });
```

**Примечание:** Старый API продолжает работать для обратной совместимости!
