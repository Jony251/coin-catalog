# 🎯 Следующие шаги

## ✅ Что уже сделано:

1. ✅ **База данных Neon** - создана и настроена
2. ✅ **API сервер** - готов к запуску
3. ✅ **Модели данных** - классы для работы с данными
4. ✅ **Сервисы** - DatabaseService, UserCollectionService
5. ✅ **Безопасность** - пароли защищены, .env настроен

## 🚀 Что делать дальше:

### Шаг 1: Запустить API сервер

```bash
# Запустить сервер
npm run server
```

Сервер запустится на `http://localhost:3000`

**Проверьте работу:**
```bash
# Откройте в браузере или curl
curl http://localhost:3000/api/health
```

Должны увидеть:
```json
{
  "status": "ok",
  "database": "connected"
}
```

### Шаг 2: Протестировать API

#### Регистрация пользователя:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'
```

Вы получите токен - сохраните его!

#### Добавить монету:

```bash
curl -X POST http://localhost:3000/api/user/coins \
  -H "Authorization: Bearer ВАШ_ТОКЕН" \
  -H "Content-Type: application/json" \
  -d '{"catalogCoinId":"peter1_ruble_1704","purchasePrice":15000}'
```

#### Получить коллекцию:

```bash
curl http://localhost:3000/api/user/coins \
  -H "Authorization: Bearer ВАШ_ТОКЕН"
```

### Шаг 3: Обновить UserCollectionService для синхронизации

Откройте `services/UserCollectionService.js` и обновите метод `_syncToServer`:

```javascript
async _syncToServer(userCoin) {
  try {
    const token = await this._getAuthToken(); // Получить токен из SecureStore
    
    const response = await fetch(`${process.env.API_URL}/api/user/coins/sync`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        coins: [userCoin.toServerFormat()]
      }),
    });
    
    if (response.ok) {
      userCoin.markAsSynced();
      await this._updateLocalSync(userCoin);
    }
  } catch (error) {
    console.error('Sync error:', error);
  }
}
```

### Шаг 4: Добавить авторизацию в приложение

Создайте компонент для входа/регистрации:

```javascript
// app/auth/login.jsx
import { useState } from 'react';
import { View, TextInput, Button } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleLogin() {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const { user, token } = await response.json();
    
    // Сохранить токен
    await SecureStore.setItemAsync('authToken', token);
    await SecureStore.setItemAsync('userId', user.id);
    
    // Инициализировать коллекцию
    await userCollectionService.initialize(user.id);
    
    // Синхронизировать
    await userCollectionService.syncAll();
    
    // Перейти на главную
    router.replace('/');
  }

  return (
    <View>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Войти" onPress={handleLogin} />
    </View>
  );
}
```

### Шаг 5: Деплой API сервера

#### Вариант A: Vercel (бесплатно)

```bash
# Установить Vercel CLI
npm install -g vercel

# Деплой
vercel

# Добавить переменные окружения в Vercel Dashboard:
# - DATABASE_URL
# - JWT_SECRET
```

#### Вариант B: Railway (бесплатно)

1. Откройте https://railway.app/
2. Создайте новый проект
3. Подключите GitHub репозиторий
4. Добавьте переменные окружения
5. Railway автоматически задеплоит

### Шаг 6: Обновить API_URL в приложении

После деплоя обновите `.env`:

```env
API_URL=https://your-api.vercel.app
```

## 📚 Полезные ссылки:

- **API документация**: `server/README.md`
- **База данных**: `database/README.md`
- **Архитектура**: `README_ARCHITECTURE.md`
- **Примеры**: `USAGE_EXAMPLES.md`
- **Безопасность**: `SECURITY.md`

## 🎨 Дополнительные улучшения (опционально):

### 1. Добавить загрузку фотографий

Используйте Cloudinary или AWS S3 для хранения фотографий монет.

### 2. Добавить push-уведомления

Уведомления о новых монетах, изменении цен и т.д.

### 3. Добавить экспорт коллекции

Экспорт в CSV/Excel для анализа.

### 4. Добавить социальные функции

Публичные коллекции, обмен монетами и т.д.

### 5. Добавить аналитику

Графики роста коллекции, статистика покупок.

## 🐛 Если что-то не работает:

### API сервер не запускается
```bash
# Проверьте .env
cat .env

# Проверьте что DATABASE_URL правильный
# Проверьте что порт 3000 свободен
```

### Ошибка подключения к БД
```bash
# Проверьте connection string в Neon Console
# Убедитесь что БД доступна
```

### Ошибка авторизации
```bash
# Проверьте JWT_SECRET в .env
# Убедитесь что токен передаётся в заголовке
```

## 💬 Нужна помощь?

1. Проверьте документацию в соответствующих README
2. Проверьте логи сервера
3. Проверьте health check endpoint
4. Проверьте что все переменные окружения настроены

---

**Готово к работе!** 🎉

Запустите `npm run server` и начните тестировать API!
