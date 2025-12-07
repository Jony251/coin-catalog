# 📥 Инструкция по скачиванию изображений

## Проблема с Wikipedia на Android

Wikipedia блокирует загрузку изображений из приложений на Android. Решение - скачать изображения локально.

## 🖼️ Что нужно скачать:

### 1. Портреты правителей (13 штук)

Скачайте в папку `assets/images/rulers/`:

| Файл | Правитель | Ссылка |
|------|-----------|--------|
| `peter1.jpg` | Пётр I | [Wikipedia](https://commons.wikimedia.org/wiki/File:Peter_der-Grosse_1838.jpg) |
| `catherine1.jpg` | Екатерина I | [Wikipedia](https://commons.wikimedia.org/wiki/File:Moor,_karel_de_-_portret_ekaterini_i.jpg) |
| `peter2.jpg` | Пётр II | [Wikipedia](https://commons.wikimedia.org/wiki/File:Portrait_of_Emperor_Peter_II_Alexeyevich.jpg) |
| `anna.jpg` | Анна Иоанновна | [Wikipedia](https://commons.wikimedia.org/wiki/File:Anna_Ioannovna.jpg) |
| `elizabeth.jpg` | Елизавета Петровна | [Wikipedia](https://commons.wikimedia.org/wiki/File:Elizabeth_of_Russia_by_Vigilius_Eriksen.jpg) |
| `peter3.jpg` | Пётр III | [Wikipedia](https://commons.wikimedia.org/wiki/File:Peter_III_of_Russia.jpg) |
| `catherine2.jpg` | Екатерина II | [Wikipedia](https://commons.wikimedia.org/wiki/File:Catherine_II_by_F.Rokotov.jpg) |
| `paul1.jpg` | Павел I | [Wikipedia](https://commons.wikimedia.org/wiki/File:Paul_I_of_Russia.jpg) |
| `alexander1.jpg` | Александр I | [Wikipedia](https://commons.wikimedia.org/wiki/File:Alexander_I_of_Russia.jpg) |
| `nicholas1.jpg` | Николай I | [Wikipedia](https://commons.wikimedia.org/wiki/File:Franz_Kruger_-_Portrait_of_Emperor_Nicholas_I.jpg) |
| `alexander2.jpg` | Александр II | [Wikipedia](https://commons.wikimedia.org/wiki/File:Alexander_II_of_Russia.jpg) |
| `alexander3.jpg` | Александр III | [Wikipedia](https://commons.wikimedia.org/wiki/File:Alexander_III_of_Russia.jpg) |
| `nicholas2.jpg` | Николай II | [Wikipedia](https://commons.wikimedia.org/wiki/File:Nicholas_II_of_Russia.jpg) |

### 2. Изображения монет

Скачайте в папку `assets/images/coins/`:

**Формат имени:** `{rulerId}_{coinType}_{year}_{side}.jpg`

Примеры:
- `peter1_ruble_1704_obverse.jpg` - аверс рубля Петра I 1704 года
- `peter1_ruble_1704_reverse.jpg` - реверс рубля Петра I 1704 года
- `catherine2_ruble_1762_obverse.jpg` - аверс рубля Екатерины II 1762 года

**Где искать изображения монет:**
- [Wikimedia Commons - Russian Empire coins](https://commons.wikimedia.org/wiki/Category:Coins_of_the_Russian_Empire)
- [Numista](https://en.numista.com/catalogue/russie-1.php)
- [CoinArchives](https://www.coinarchives.com/)

### 3. Иконки номиналов

Скачайте в папку `assets/images/denominations/`:

- `gold.png` - иконка золотых монет
- `silver.png` - иконка серебряных монет
- `copper.png` - иконка медных монет
- `placeholder.png` - заглушка

## 🤖 Автоматическое скачивание

Создайте скрипт для автоматического скачивания:

```bash
# download_images.sh

#!/bin/bash

# Создать папки
mkdir -p assets/images/rulers
mkdir -p assets/images/coins
mkdir -p assets/images/denominations

# Скачать портреты правителей
wget -O assets/images/rulers/peter1.jpg "https://upload.wikimedia.org/wikipedia/commons/7/72/Peter_der-Grosse_1838.jpg"
wget -O assets/images/rulers/catherine1.jpg "https://upload.wikimedia.org/wikipedia/commons/1/13/Moor%2C_karel_de_-_portret_ekaterini_i.jpg"
# ... и так далее для всех правителей

echo "✅ Изображения скачаны!"
```

Запустите:
```bash
chmod +x download_images.sh
./download_images.sh
```

## 📐 Рекомендуемые размеры:

### Портреты правителей:
- Размер: 400x400px
- Формат: JPG
- Качество: 80-90%

### Монеты:
- Размер: 600x600px (аверс и реверс)
- Формат: JPG
- Качество: 85-95%

### Иконки номиналов:
- Размер: 128x128px
- Формат: PNG (с прозрачностью)

## 🎨 Создание placeholder изображений

Если какого-то изображения нет, создайте placeholder:

```javascript
// Простой placeholder с текстом
// Используйте любой графический редактор или онлайн-сервис
// Например: https://placeholder.com/
```

## 🔧 Оптимизация изображений

После скачивания оптимизируйте изображения:

```bash
# Установить ImageMagick
brew install imagemagick  # macOS
apt-get install imagemagick  # Linux

# Оптимизировать все JPG
find assets/images -name "*.jpg" -exec convert {} -quality 85 {} \;

# Оптимизировать все PNG
find assets/images -name "*.png" -exec convert {} -strip {} \;
```

## 📱 Использование в приложении

После скачивания изображений, используйте утилиту:

```javascript
import { getRulerImage, getCoinImage } from '../utils/images';

// Получить портрет правителя
<Image source={getRulerImage('peter1')} />

// Получить изображение монеты
<Image source={getCoinImage('peter1', 'ruble_1704', 'obverse')} />
```

## ✅ Проверка

После скачивания проверьте структуру:

```
assets/images/
├── rulers/
│   ├── peter1.jpg ✅
│   ├── catherine1.jpg ✅
│   ├── peter2.jpg ✅
│   └── ... (всего 13 файлов)
├── coins/
│   ├── peter1_ruble_1704_obverse.jpg ✅
│   ├── peter1_ruble_1704_reverse.jpg ✅
│   └── ... (по 2 файла на монету)
└── denominations/
    ├── gold.png ✅
    ├── silver.png ✅
    └── copper.png ✅
```

## 🚀 Альтернативные источники

Если Wikipedia не работает:

1. **Numista** - https://en.numista.com/
2. **CoinArchives** - https://www.coinarchives.com/
3. **Heritage Auctions** - https://www.ha.com/
4. **Государственный Эрмитаж** - https://www.hermitagemuseum.org/

## 📝 Лицензии

Убедитесь, что изображения имеют подходящую лицензию:
- Public Domain
- Creative Commons (CC BY, CC BY-SA)
- Собственные фотографии

**Не используйте изображения с copyright без разрешения!**

## 💡 Советы

1. **Качество** - используйте высокое качество для монет (детали важны)
2. **Размер** - не делайте файлы слишком большими (< 200KB на файл)
3. **Формат** - JPG для фото, PNG для иконок с прозрачностью
4. **Именование** - следуйте единому формату имён файлов
5. **Backup** - сохраните копию всех изображений

---

**После скачивания изображений приложение будет работать офлайн!** 📱✨
