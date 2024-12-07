import Redis from 'ioredis';

export const redis = new Redis({
    port: 6379,
    host: 'localhost',
    db: 0,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    // Redis持久化配置
    keyPrefix: 'app:', // 键前缀
});

// 错误处理
redis.on('error', (error) => {
    console.error('Redis connection error:', error);
});

export default redis;
