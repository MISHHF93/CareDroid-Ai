import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as redis from 'redis';

@Injectable()
export class CacheService implements OnModuleInit {
  private readonly logger = new Logger(CacheService.name);
  private client: redis.RedisClient;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  private async connect() {
    try {
      const redisConfig = this.configService.get('redis');
      if (!redisConfig) {
        this.logger.warn('Redis configuration not found. Cache service disabled.');
        return;
      }

      this.client = redis.createClient({
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password,
        db: redisConfig.db,
        retry_strategy: (options) => {
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        },
      });

      this.client.on('error', (err) => {
        this.logger.error('Redis client error:', err);
      });

      this.client.on('connect', () => {
        this.logger.log(`✅ Redis cache connected to ${redisConfig.host}:${redisConfig.port}`);
      });
    } catch (error) {
      this.logger.error('Failed to initialize cache service:', error);
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    if (!this.client) return null;

    return new Promise((resolve, reject) => {
      this.client.get(key, (err, data) => {
        if (err) {
          this.logger.error(`Failed to get cache key ${key}:`, err);
          reject(err);
        }
        if (!data) {
          resolve(null);
        }
        try {
          resolve(JSON.parse(data) as T);
        } catch {
          resolve(data as T);
        }
      });
    });
  }

  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    if (!this.client) return false;

    return new Promise((resolve, reject) => {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (ttl) {
        this.client.setex(key, ttl, serialized, (err) => {
          if (err) {
            this.logger.error(`Failed to set cache key ${key}:`, err);
            reject(err);
          }
          resolve(true);
        });
      } else {
        this.client.set(key, serialized, (err) => {
          if (err) {
            this.logger.error(`Failed to set cache key ${key}:`, err);
            reject(err);
          }
          resolve(true);
        });
      }
    });
  }

  async del(key: string): Promise<boolean> {
    if (!this.client) return false;

    return new Promise((resolve, reject) => {
      this.client.del(key, (err) => {
        if (err) {
          this.logger.error(`Failed to delete cache key ${key}:`, err);
          reject(err);
        }
        resolve(true);
      });
    });
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client) return false;

    return new Promise((resolve, reject) => {
      this.client.exists(key, (err, result) => {
        if (err) {
          this.logger.error(`Failed to check cache key ${key}:`, err);
          reject(err);
        }
        resolve(result === 1);
      });
    });
  }

  async getOrSet<T = any>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Compute value and cache it
    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  async clear(): Promise<boolean> {
    if (!this.client) return false;

    return new Promise((resolve, reject) => {
      this.client.flushdb((err) => {
        if (err) {
          this.logger.error('Failed to clear cache:', err);
          reject(err);
        }
        this.logger.log('Cache cleared');
        resolve(true);
      });
    });
  }

  async close(): Promise<void> {
    if (this.client) {
      this.client.quit();
      this.logger.log('Redis connection closed');
    }
  }
}
