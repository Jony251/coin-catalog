/**
 * Утилиты для работы с изображениями
 * Поддержка локальных и удалённых изображений
 */

// Локальные изображения правителей
const rulerImages = {
  peter1: require('../assets/images/rulers/peter1.jpg'),
  catherine1: require('../assets/images/rulers/catherine1.jpg'),
  peter2: require('../assets/images/rulers/peter2.jpg'),
  anna: require('../assets/images/rulers/anna.jpg'),
  ivan6: require('../assets/images/rulers/ivan6.jpg'),
  elizabeth: require('../assets/images/rulers/elizabeth.jpg'),
  peter3: require('../assets/images/rulers/peter3.jpg'),
  catherine2: require('../assets/images/rulers/catherine2.jpg'),
  paul1: require('../assets/images/rulers/paul1.jpg'),
  alexander1: require('../assets/images/rulers/alexander1.jpg'),
  nicholas1: require('../assets/images/rulers/nicholas1.jpg'),
  alexander2: require('../assets/images/rulers/alexander2.jpg'),
  alexander3: require('../assets/images/rulers/alexander3.jpg'),
  nicholas2: require('../assets/images/rulers/nicholas2.jpg'),
};

// Локальные изображения номиналов (пока закомментированы, файлов нет)
const denominationImages = {
  // gold: require('../assets/images/denominations/gold.png'),
  // silver: require('../assets/images/denominations/silver.png'),
  // copper: require('../assets/images/denominations/copper.png'),
};

/**
 * Получить изображение правителя
 * @param {string} rulerId - ID правителя
 * @param {string} fallbackUrl - URL для fallback (если локального нет)
 * @returns {any} - Image source (require или {uri})
 */
export function getRulerImage(rulerId, fallbackUrl = null) {
  // Попытка получить локальное изображение
  if (rulerImages[rulerId]) {
    return rulerImages[rulerId];
  }
  
  // Fallback на URL
  if (fallbackUrl) {
    return { uri: fallbackUrl };
  }
  
  // Placeholder
  return require('../assets/images/rulers/placeholder.jpg');
}

/**
 * Получить изображение монеты
 * @param {string} rulerId - ID правителя
 * @param {string} coinId - ID монеты
 * @param {string} side - 'obverse' или 'reverse'
 * @param {string} fallbackUrl - URL для fallback
 * @returns {any} - Image source
 */
export function getCoinImage(rulerId, coinId, side = 'obverse', fallbackUrl = null) {
  try {
    // Формат: peter1_ruble_1704_obverse.jpg
    const imageName = `${rulerId}_${coinId}_${side}`;
    
    // Попытка загрузить локальное изображение
    // Примечание: require не работает с динамическими путями
    // Поэтому нужно использовать маппинг или импортировать все изображения
    
    // Временное решение: используем fallback URL
    if (fallbackUrl) {
      return { uri: fallbackUrl };
    }
    
    // Placeholder - пока используем placeholder правителя
    return require('../assets/images/rulers/placeholder.jpg');
  } catch (error) {
    console.warn(`Image not found: ${rulerId}_${coinId}_${side}`);
    return require('../assets/images/rulers/placeholder.jpg');
  }
}

/**
 * Получить изображение номинала
 * @param {string} metal - 'gold', 'silver', 'copper'
 * @returns {any} - Image source
 */
export function getDenominationImage(metal) {
  // Возвращаем null - иконки номиналов не используются
  return null;
}

/**
 * Получить placeholder изображение
 * @param {string} type - 'ruler', 'coin', 'denomination'
 * @returns {any} - Image source
 */
export function getPlaceholderImage(type = 'coin') {
  const placeholders = {
    ruler: require('../assets/images/rulers/placeholder.jpg'),
    // coin: require('../assets/images/coins/placeholder.jpg'),
    // denomination: require('../assets/images/denominations/placeholder.png'),
  };
  
  return placeholders[type] || placeholders.ruler;
}

/**
 * Проверить доступность изображения по URL
 * @param {string} url - URL изображения
 * @returns {Promise<boolean>}
 */
export async function checkImageAvailability(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}
