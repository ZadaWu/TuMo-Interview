import Redis from 'ioredis';

export class RedisLock {
  private redis: Redis;
  private lockTimeout = 10000; // 10 seconds

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async acquireLock(lockKey: string): Promise<boolean> {
    const result = await this.redis.set(
      lockKey,
      '1',
      'PX',
      this.lockTimeout,
      'NX'
    );
    return result === 'OK';
  }

  async releaseLock(lockKey: string): Promise<void> {
    await this.redis.del(lockKey);
  }
}

export const redis = new Redis({
  port: 6379,
  host: 'localhost',
  db: 0,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  keyPrefix: 'app:',
});

export const redisLock = new RedisLock(redis);

export default redis;
