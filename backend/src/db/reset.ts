import fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const context = 'ResetDatabase';

function removeIfExists(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    return;
  }

  fs.unlinkSync(filePath);
  logger.info(context, 'Removed file', { path: filePath });
}

function resetDatabaseFiles(): void {
  const absoluteDbPath = path.resolve(process.cwd(), env.DB_PATH);
  removeIfExists(absoluteDbPath);
  removeIfExists(`${absoluteDbPath}-wal`);
  removeIfExists(`${absoluteDbPath}-shm`);
}

try {
  resetDatabaseFiles();
  logger.info(context, 'Database reset completed');
  process.exit(0);
} catch (error) {
  logger.error(context, 'Database reset failed', error);
  process.exit(1);
}
