import Redis from 'ioredis';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

class CacheService {
  private readonly context = 'CacheService';
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true
    });

    this.redis.on('connect', () => {
      logger.info(this.context, 'Connected to Redis');
    });

    this.redis.on('error', (error) => {
      logger.warn(this.context, 'Redis connection issue', error);
    });
  }

  private async withTimeout<T>(
    action: Promise<T>,
    operation: string,
    metadata: Record<string, unknown>,
    fallback: T
  ): Promise<T> {
    let timeoutHandle: NodeJS.Timeout | null = null;
    const timeout = new Promise<T>((resolve) => {
      timeoutHandle = setTimeout(() => {
        logger.warn(this.context, 'Redis operation timed out; falling back', {
          operation,
          timeoutMs: env.REDIS_OP_TIMEOUT_MS,
          ...metadata
        });
        resolve(fallback);
      }, env.REDIS_OP_TIMEOUT_MS);
    });

    try {
      return await Promise.race([action, timeout]);
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }

  async getJSON<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.withTimeout<string | null>(
        this.redis.get(key),
        'get',
        { key },
        null
      );

      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as T;
    } catch (error) {
      logger.warn(this.context, 'Failed to read cache key', { key, error });
      return null;
    }
  }

  async setJSON<T>(key: string, value: T, ttlMinutes: number): Promise<void> {
    try {
      await this.withTimeout<unknown>(
        this.redis.set(key, JSON.stringify(value), 'EX', ttlMinutes * 60),
        'set',
        { key, ttlMinutes },
        null
      );
    } catch (error) {
      logger.warn(this.context, 'Failed to write cache key', { key, error });
    }
  }

  async setFlag(key: string, value: boolean, ttlSeconds: number): Promise<void> {
    try {
      await this.withTimeout<unknown>(
        this.redis.set(key, value ? '1' : '0', 'EX', ttlSeconds),
        'set-flag',
        { key, ttlSeconds, value },
        null
      );
    } catch (error) {
      logger.warn(this.context, 'Failed to write cache flag', { key, value, error });
    }
  }

  async getFlag(key: string): Promise<boolean | null> {
    try {
      const raw = await this.withTimeout<string | null>(
        this.redis.get(key),
        'get-flag',
        { key },
        null
      );
      if (raw === null) {
        return null;
      }
      return raw === '1';
    } catch (error) {
      logger.warn(this.context, 'Failed to read cache flag', { key, error });
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.withTimeout<unknown>(
        this.redis.del(key),
        'delete',
        { key },
        null
      );
    } catch (error) {
      logger.warn(this.context, 'Failed to delete cache key', { key, error });
    }
  }

  async scanDelete(pattern: string): Promise<number> {
    let cursor = '0';
    let deleted = 0;

    try {
      do {
        const [nextCursor, keys] = await this.withTimeout<[string, string[]]>(
          this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100),
          'scan-delete',
          { pattern, cursor },
          ['0', []]
        );
        cursor = nextCursor;

        if (keys.length > 0) {
          deleted += await this.withTimeout<number>(
            this.redis.del(...keys),
            'scan-delete-del',
            { pattern, count: keys.length },
            0
          );
        }
      } while (cursor !== '0');
    } catch (error) {
      logger.warn(this.context, 'Failed to delete keys by pattern', { pattern, error });
    }

    return deleted;
  }

  async scanKeys(pattern: string): Promise<string[]> {
    let cursor = '0';
    const allKeys: string[] = [];

    try {
      do {
        const [nextCursor, keys] = await this.withTimeout<[string, string[]]>(
          this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100),
          'scan',
          { pattern, cursor },
          ['0', []]
        );
        cursor = nextCursor;
        allKeys.push(...keys);
      } while (cursor !== '0');
    } catch (error) {
      logger.warn(this.context, 'Failed to scan keys', { pattern, error });
    }

    return allKeys;
  }

  isConnected(): boolean {
    return this.redis.status === 'ready';
  }

  async close(): Promise<void> {
    await this.redis.quit();
  }
}

export const cacheService = new CacheService();
