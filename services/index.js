/**
 * Экспорт всех сервисов
 * 
 * Рекомендуется использовать новые сервисы напрямую:
 * import { databaseService, userCollectionService } from '../services';
 */

export { databaseService } from './DatabaseService';
export { userCollectionService } from './UserCollectionService';

// Для обратной совместимости со старым API
export * from './database';
