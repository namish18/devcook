import Redis from 'ioredis';
import { logger } from '../utils/logger';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';

export const createRedisConnection = (): Redis => {
    const redis = new Redis({
        host: REDIS_HOST,
        port: REDIS_PORT,
        password: REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        retryStrategy: (times: number) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
    });

    redis.on('connect', () => {
        logger.info('Redis connected successfully');
    });

    redis.on('error', (error) => {
        logger.error('Redis connection error:', error);
    });

    redis.on('reconnecting', () => {
        logger.warn('Redis reconnecting...');
    });

    return redis;
};
