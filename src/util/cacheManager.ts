import Memcached from 'memcached';
import { redis } from '../config/redis';

export class CacheManager {
    private memcached: Memcached;
    private readonly DEFAULT_EXPIRATION = 3600; // 1 hour in seconds

    constructor() {
        this.memcached = new Memcached('localhost:11211');
    }

    async get(key: string): Promise<any> {
        try {
            const memResult = await new Promise((resolve, reject) => {
                this.memcached.get(key, (err, data) => {
                    if (err) reject(err);
                    resolve(data);
                });
            });

            if (memResult) {
                return JSON.parse(memResult as string);
            }

            // If not in Memcached, try Redis
            const redisResult = await redis.get(key);
            if (redisResult) {
                // Store in Memcached for future requests
                await this.setMemcached(key, redisResult);
                return JSON.parse(redisResult);
            }

            return null;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    async set(key: string, value: any, expiration: number = this.DEFAULT_EXPIRATION): Promise<void> {
        try {
            const stringValue = JSON.stringify(value);
            
            // Set in both caches
            await Promise.all([
                this.setMemcached(key, stringValue, expiration),
                this.setRedis(key, stringValue, expiration)
            ]);
        } catch (error) {
            console.error('Cache set error:', error);
        }
    }

    async delete(key: string): Promise<void> {
        try {
            await Promise.all([
                new Promise((resolve, reject) => {
                    this.memcached.del(key, (err) => {
                        if (err) reject(err);
                        resolve(true);
                    });
                }),
                redis.del(key)
            ]);
        } catch (error) {
            console.error('Cache delete error:', error);
        }
    }

    private setMemcached(key: string, value: string, expiration: number = this.DEFAULT_EXPIRATION): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.memcached.set(key, value, expiration, (err) => {
                if (err) reject(err);
                resolve(true);
            });
        });
    }

    private async setRedis(key: string, value: string, expiration: number = this.DEFAULT_EXPIRATION): Promise<void> {
        await redis.setex(key, expiration, value);
    }
}

export default new CacheManager();
