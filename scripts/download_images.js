/**
 * Скрипт для автоматического скачивания изображений из Wikipedia
 * 
 * Использование: node scripts/download_images.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Базовая папка проекта
const BASE_DIR = path.join(__dirname, '..');
const IMAGES_DIR = path.join(BASE_DIR, 'assets', 'images');

// Создать папки если их нет
function ensureDirectories() {
  const dirs = [
    path.join(IMAGES_DIR, 'rulers'),
    path.join(IMAGES_DIR, 'coins'),
    path.join(IMAGES_DIR, 'denominations'),
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Создана папка: ${dir}`);
    }
  });
}

// Скачать файл
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      // Следовать редиректам
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadFile(response.headers.location, filepath)
          .then(resolve)
          .catch(reject);
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

// Список изображений правителей
const rulerImages = [
  {
    id: 'peter1',
    name: 'Пётр I',
    url: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Peter_der-Grosse_1838.jpg'
  },
  {
    id: 'catherine1',
    name: 'Екатерина I',
    url: 'https://upload.wikimedia.org/wikipedia/commons/1/13/Moor%2C_karel_de_-_portret_ekaterini_i.jpg'
  },
  {
    id: 'peter2',
    name: 'Пётр II',
    url: 'https://upload.wikimedia.org/wikipedia/commons/7/79/Portrait_of_Emperor_Peter_II_Alexeyevich_-_Google_Cultural_Institute.jpg'
  },
  {
    id: 'anna',
    name: 'Анна Иоанновна',
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Anna_Ioannovna_by_L.Caravaque_%281730%2C_Tretyakov_gallery%29.jpg'
  },
  {
    id: 'elizabeth',
    name: 'Елизавета Петровна',
    url: 'https://upload.wikimedia.org/wikipedia/commons/6/6e/Elizabeth_of_Russia_by_Vigilius_Eriksen.jpg'
  },
  {
    id: 'peter3',
    name: 'Пётр III',
    url: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Peter_III_of_Russia_by_A.Antropov_%281762%2C_Tretyakov_gallery%29.jpg'
  },
  {
    id: 'catherine2',
    name: 'Екатерина II',
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Rokotov_Catherine_II.jpg'
  },
  {
    id: 'paul1',
    name: 'Павел I',
    url: 'https://upload.wikimedia.org/wikipedia/commons/5/57/Borovikovsky_PavelI.jpg'
  },
  {
    id: 'alexander1',
    name: 'Александр I',
    url: 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Alexander_I_of_Russia_by_G.Dawe_%281826%2C_Peterhof%29.jpg'
  },
  {
    id: 'nicholas1',
    name: 'Николай I',
    url: 'https://upload.wikimedia.org/wikipedia/commons/6/6c/Franz_Kruger_-_Portrait_of_Emperor_Nicholas_I_-_WGA12289.jpg'
  },
  {
    id: 'alexander2',
    name: 'Александр II',
    url: 'https://upload.wikimedia.org/wikipedia/commons/f/f4/Alexander_II_of_Russia_photo.jpg'
  },
  {
    id: 'alexander3',
    name: 'Александр III',
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Alexander_III_of_Russia_photo.jpg'
  },
  {
    id: 'nicholas2',
    name: 'Николай II',
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/27/Tsar_Nicholas_II_-1898.jpg'
  },
];

// Скачать изображения правителей
async function downloadRulerImages() {
  console.log('\n📥 Скачивание портретов правителей...\n');

  for (const ruler of rulerImages) {
    const filepath = path.join(IMAGES_DIR, 'rulers', `${ruler.id}.jpg`);

    // Пропустить если уже существует
    if (fs.existsSync(filepath)) {
      console.log(`⏭️  Пропущено: ${ruler.name} (файл уже существует)`);
      continue;
    }

    try {
      console.log(`⬇️  Скачивание: ${ruler.name}...`);
      await downloadFile(ruler.url, filepath);
      console.log(`✅ Готово: ${ruler.name}`);
    } catch (error) {
      console.error(`❌ Ошибка: ${ruler.name} - ${error.message}`);
    }
  }
}

// Создать placeholder изображения
function createPlaceholders() {
  console.log('\n🎨 Создание placeholder изображений...\n');

  const placeholders = [
    { path: path.join(IMAGES_DIR, 'rulers', 'placeholder.jpg'), type: 'ruler' },
    { path: path.join(IMAGES_DIR, 'coins', 'placeholder.jpg'), type: 'coin' },
    { path: path.join(IMAGES_DIR, 'denominations', 'placeholder.png'), type: 'denomination' },
  ];

  placeholders.forEach(({ path: filepath, type }) => {
    if (!fs.existsSync(filepath)) {
      // Создать простой текстовый файл как placeholder
      // В реальном приложении здесь должно быть создание изображения
      fs.writeFileSync(filepath, `Placeholder for ${type}`);
      console.log(`✅ Создан placeholder: ${type}`);
    }
  });
}

// Показать статистику
function showStats() {
  console.log('\n📊 Статистика:\n');

  const rulersCount = fs.readdirSync(path.join(IMAGES_DIR, 'rulers')).length;
  const coinsCount = fs.readdirSync(path.join(IMAGES_DIR, 'coins')).length;
  const denomsCount = fs.readdirSync(path.join(IMAGES_DIR, 'denominations')).length;

  console.log(`Портреты правителей: ${rulersCount} файлов`);
  console.log(`Изображения монет: ${coinsCount} файлов`);
  console.log(`Иконки номиналов: ${denomsCount} файлов`);
  console.log('');
}

// Главная функция
async function main() {
  console.log('🚀 Начинаем скачивание изображений...\n');

  try {
    // Создать папки
    ensureDirectories();

    // Скачать изображения правителей
    await downloadRulerImages();

    // Создать placeholders
    createPlaceholders();

    // Показать статистику
    showStats();

    console.log('✨ Готово! Изображения скачаны.\n');
    console.log('📝 Примечания:');
    console.log('   - Изображения монет нужно скачать вручную');
    console.log('   - См. assets/images/DOWNLOAD_INSTRUCTIONS.md\n');

  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

// Запуск
main();
