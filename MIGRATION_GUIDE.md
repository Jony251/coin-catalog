# Руководство по миграции на новую архитектуру

## Обзор изменений

Проект был реорганизован с использованием классовой архитектуры:

### Что изменилось:

1. ✅ **Новые модели данных** - Country, Period, Ruler, Coin, UserCoin
2. ✅ **Новые сервисы** - DatabaseService, UserCollectionService
3. ✅ **Работа с датами через классы** - автоматическое преобразование Date ↔ ISO string
4. ✅ **Синхронизация с сервером** - готовность к синхронизации коллекции
5. ✅ **Обратная совместимость** - старый API продолжает работать

### Что НЕ изменилось:

- ✅ Структура данных в каталоге (`data/catalog.js`)
- ✅ Существующие компоненты продолжают работать
- ✅ Данные пользователей сохраняются

## Автоматическая миграция

При первом запуске приложения с новой версией:

1. **База данных автоматически обновится**
   - Создадутся новые таблицы (countries, periods)
   - Данные из каталога перенесутся в новую структуру
   - Коллекция пользователя сохранится

2. **Веб-версия**
   - localStorage автоматически обновится
   - Коллекция пользователя сохранится

## Пошаговая миграция компонентов

### Шаг 1: Обновить импорты

**Было:**
```javascript
import { 
  getRulers, 
  getCoinsByRuler, 
  addToCollection 
} from '../services/database';
```

**Стало:**
```javascript
import { 
  databaseService, 
  userCollectionService 
} from '../services';
```

### Шаг 2: Обновить вызовы функций

#### Получение данных из каталога

**Было:**
```javascript
const rulers = await getRulers();
const coins = await getCoinsByRuler(rulerId);
const coin = await getCoinById(coinId);
```

**Стало:**
```javascript
const rulers = await databaseService.getRulers();
const coins = await databaseService.getCoinsByRuler(rulerId);
const coin = await databaseService.getCoinById(coinId);
```

#### Работа с коллекцией пользователя

**Было:**
```javascript
await addToCollection(coinId, false, { 
  purchasePrice: 1000,
  condition: 'VF',
  notes: 'Заметка'
});

const collection = await getUserCoins(false);
await removeFromCollection(coinId);
```

**Стало:**
```javascript
await userCollectionService.addCoin(coinId, { 
  purchasePrice: 1000,
  condition: 'VF',
  notes: 'Заметка',
  isWishlist: false
});

const collection = await userCollectionService.getUserCoins(false);
await userCollectionService.removeCoin(coinId);
```

### Шаг 3: Использовать методы классов

Теперь объекты имеют полезные методы:

**Было:**
```javascript
const rulers = await getRulers();
for (const ruler of rulers) {
  const years = `${ruler.startYear}-${ruler.endYear}`;
  const duration = ruler.endYear - ruler.startYear;
  console.log(ruler.name, years, duration);
}
```

**Стало:**
```javascript
const rulers = await databaseService.getRulers();
for (const ruler of rulers) {
  console.log(
    ruler.name, 
    ruler.getReignYears(),      // "1682-1725"
    ruler.getReignDuration()    // 43
  );
}
```

### Шаг 4: Работа с датами

**Было:**
```javascript
const collection = await getUserCoins(false);
for (const coin of collection) {
  const createdAt = new Date(coin.createdAt);
  const days = Math.floor((new Date() - createdAt) / (1000*60*60*24));
  console.log('Дней в коллекции:', days);
}
```

**Стало:**
```javascript
const collection = await userCollectionService.getUserCoins(false);
for (const coin of collection) {
  console.log('Дней в коллекции:', coin.getDaysInCollection());
  console.log('Месяцев:', coin.getMonthsInCollection());
  console.log('Год покупки:', coin.getPurchaseYear());
}
```

## Примеры миграции компонентов

### Компонент списка правителей

**Было:**
```javascript
import React, { useEffect, useState } from 'react';
import { getRulers } from '../services/database';

export function RulersList() {
  const [rulers, setRulers] = useState([]);

  useEffect(() => {
    loadRulers();
  }, []);

  async function loadRulers() {
    const data = await getRulers();
    setRulers(data);
  }

  return (
    <div>
      {rulers.map(ruler => (
        <div key={ruler.id}>
          <h3>{ruler.name}</h3>
          <p>{ruler.startYear}-{ruler.endYear}</p>
        </div>
      ))}
    </div>
  );
}
```

**Стало:**
```javascript
import React, { useEffect, useState } from 'react';
import { databaseService } from '../services';

export function RulersList() {
  const [rulers, setRulers] = useState([]);

  useEffect(() => {
    loadRulers();
  }, []);

  async function loadRulers() {
    const data = await databaseService.getRulers();
    setRulers(data);
  }

  return (
    <div>
      {rulers.map(ruler => (
        <div key={ruler.id}>
          <h3>{ruler.name}</h3>
          <p>{ruler.getReignYears()}</p>
          <p>Правил {ruler.getReignDuration()} лет</p>
        </div>
      ))}
    </div>
  );
}
```

### Компонент карточки монеты

**Было:**
```javascript
import React, { useEffect, useState } from 'react';
import { getCoinById, isInCollection, addToCollection } from '../services/database';

export function CoinCard({ coinId }) {
  const [coin, setCoin] = useState(null);
  const [status, setStatus] = useState({ owned: false, wishlisted: false });

  useEffect(() => {
    loadCoin();
  }, [coinId]);

  async function loadCoin() {
    const data = await getCoinById(coinId);
    const collectionStatus = await isInCollection(coinId);
    setCoin(data);
    setStatus(collectionStatus);
  }

  async function handleAdd() {
    await addToCollection(coinId, false, {
      purchasePrice: 1000,
      condition: 'VF'
    });
    await loadCoin();
  }

  if (!coin) return <div>Загрузка...</div>;

  const avgValue = coin.estimatedValueMin && coin.estimatedValueMax
    ? (coin.estimatedValueMin + coin.estimatedValueMax) / 2
    : null;

  return (
    <div>
      <h2>{coin.name}</h2>
      <p>Год: {coin.year}</p>
      <p>Металл: {coin.metal}</p>
      {avgValue && <p>Стоимость: {avgValue} руб.</p>}
      {!status.owned && (
        <button onClick={handleAdd}>Добавить в коллекцию</button>
      )}
    </div>
  );
}
```

**Стало:**
```javascript
import React, { useEffect, useState } from 'react';
import { databaseService, userCollectionService } from '../services';

export function CoinCard({ coinId }) {
  const [coin, setCoin] = useState(null);
  const [status, setStatus] = useState({ owned: false, wishlisted: false });

  useEffect(() => {
    loadCoin();
  }, [coinId]);

  async function loadCoin() {
    const data = await databaseService.getCoinById(coinId);
    const collectionStatus = await userCollectionService.isInCollection(coinId);
    setCoin(data);
    setStatus(collectionStatus);
  }

  async function handleAdd() {
    await userCollectionService.addCoin(coinId, {
      purchasePrice: 1000,
      condition: 'VF'
    });
    await loadCoin();
  }

  if (!coin) return <div>Загрузка...</div>;

  return (
    <div>
      <h2>{coin.name}</h2>
      <p>Год: {coin.year}</p>
      <p>Металл: {coin.metal}</p>
      <p>Возраст: {coin.getAge()} лет</p>
      {coin.getEstimatedValue() && (
        <p>Стоимость: {coin.getEstimatedValue()} руб.</p>
      )}
      {coin.isRare() && <span>⭐ Редкая</span>}
      {!status.owned && (
        <button onClick={handleAdd}>Добавить в коллекцию</button>
      )}
    </div>
  );
}
```

### Компонент коллекции

**Было:**
```javascript
import React, { useEffect, useState } from 'react';
import { getUserCoins, removeFromCollection } from '../services/database';

export function MyCollection() {
  const [collection, setCollection] = useState([]);

  useEffect(() => {
    loadCollection();
  }, []);

  async function loadCollection() {
    const data = await getUserCoins(false);
    setCollection(data);
  }

  async function handleRemove(coinId) {
    await removeFromCollection(coinId);
    await loadCollection();
  }

  // Подсчёт статистики
  const totalValue = collection.reduce((sum, coin) => {
    const avg = coin.estimatedValueMin && coin.estimatedValueMax
      ? (coin.estimatedValueMin + coin.estimatedValueMax) / 2
      : 0;
    return sum + avg;
  }, 0);

  const totalPurchase = collection.reduce((sum, coin) => {
    return sum + (coin.purchasePrice || 0);
  }, 0);

  return (
    <div>
      <h2>Моя коллекция</h2>
      <p>Монет: {collection.length}</p>
      <p>Стоимость: {totalValue.toFixed(0)} руб.</p>
      <p>Потрачено: {totalPurchase.toFixed(0)} руб.</p>

      {collection.map(coin => (
        <div key={coin.userCoinId}>
          <h4>{coin.name}</h4>
          <p>Цена покупки: {coin.purchasePrice}</p>
          <button onClick={() => handleRemove(coin.catalogCoinId)}>
            Удалить
          </button>
        </div>
      ))}
    </div>
  );
}
```

**Стало:**
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
    const data = await userCollectionService.getUserCoins(false);
    const statistics = await userCollectionService.getCollectionStats();
    setCollection(data);
    setStats(statistics);
  }

  async function handleRemove(coinId) {
    await userCollectionService.removeCoin(coinId);
    await loadCollection();
  }

  return (
    <div>
      <h2>Моя коллекция</h2>
      {stats && (
        <>
          <p>Монет: {stats.collectionCount}</p>
          <p>Стоимость: {stats.totalValue.toFixed(0)} руб.</p>
          <p>Потрачено: {stats.totalPurchasePrice.toFixed(0)} руб.</p>
          <p>Прибыль: {stats.profitLoss.toFixed(0)} руб. ({stats.profitLossPercent.toFixed(1)}%)</p>
        </>
      )}

      {collection.map(userCoin => (
        <div key={userCoin.id}>
          <h4>{userCoin.catalogCoin.name}</h4>
          <p>Цена покупки: {userCoin.purchasePrice}</p>
          <p>Текущая стоимость: {userCoin.getCurrentValue()}</p>
          <p>Прибыль: {userCoin.getProfitLoss()}</p>
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

## Обратная совместимость

Старый API продолжает работать! Вы можете мигрировать постепенно:

```javascript
// Старый API - работает
import { getRulers, getCoinsByRuler } from '../services/database';
const rulers = await getRulers();

// Новый API - работает
import { databaseService } from '../services';
const rulers = await databaseService.getRulers();
```

## Проверка миграции

После миграции проверьте:

1. ✅ Приложение запускается без ошибок
2. ✅ Список правителей загружается
3. ✅ Монеты отображаются корректно
4. ✅ Коллекция пользователя сохранилась
5. ✅ Добавление/удаление монет работает
6. ✅ Даты отображаются правильно

## Откат изменений

Если что-то пошло не так:

1. Старый файл `services/database.js` сохранён как обёртка
2. Все старые функции продолжают работать
3. Данные пользователя не удаляются

## Получение помощи

Если возникли проблемы:

1. Проверьте консоль на ошибки
2. Убедитесь, что все импорты обновлены
3. Проверьте, что сервисы инициализированы
4. Посмотрите примеры в `USAGE_EXAMPLES.md`
5. Изучите документацию в `README_ARCHITECTURE.md`

## Следующие шаги

После успешной миграции:

1. Постепенно обновите все компоненты на новый API
2. Используйте методы классов для упрощения кода
3. Добавьте работу с датами через встроенные методы
4. Подготовьтесь к синхронизации с сервером
