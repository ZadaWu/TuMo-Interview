import { Order } from '../models/order.model';
import cacheManager from '../util/cacheManager';
import { redisLock } from '../config/redis';
import { Op } from 'sequelize';

export class OrderService {
    // 创建订单
    async createOrder(userId: number, orderData: any) {
        const minutes = 5;
        const timestamp = Math.floor(Date.now() / (1000 * 60 * minutes)); // Get timestamp by minutes interval
        const lockKey = `order:lock:${userId}:${timestamp}`;
        
        try {
            
            // 尝试获取分布式锁
            const acquired = await redisLock.acquireLock(lockKey);
            
            if (!acquired) {
                throw new Error('Order is being processed, please try again later');
            }

            // 检查是否存在未完成的近期订单
            const existingOrder = await Order.findRecentPendingOrder(userId, 5);
            if (existingOrder) {
                throw new Error('You have a pending order in the last 30 minutes, please try again later');
            }

            // 创建订单
            const order = await Order.createOrder({
                userId,
                ...orderData
            });

            // 缓存订单数据
            await this.cacheOrder(order);

            return order;
        } catch (error) {
            throw error;
        } finally {
            // 释放锁
            await redisLock.releaseLock(lockKey);
        }
    }

    // 更新订单状态
    async updateOrderStatus(orderId: number, status: string, userId: number) {
        try {
            // 使用 Model 层方法更新状态
            const order = await Order.updateOrderStatus(orderId, status, userId);
            
            // 更新缓存
            await this.cacheOrder(order);

            return order;
        } catch (error) {
            throw error;
        }
    }

    // 获取订单
    async getOrderById(orderId: number) {
        // 先从缓存获取
        const cachedOrder = await this.getCachedOrder(orderId);
        if (cachedOrder) {
            return cachedOrder;
        }

        // 缓存未命中，从数据库获取
        const order = await Order.findByPk(orderId);
        if (order) {
            await this.cacheOrder(order);
        }

        return order;
    }

    // 缓存相关的私有方法
    private async cacheOrder(order: any) {
        const key = `order:${order.id}`;
        await cacheManager.set(key, order);
    }

    private async getCachedOrder(orderId: number) {
        const key = `order:${orderId}`;
        return await cacheManager.get(key);
    }
}