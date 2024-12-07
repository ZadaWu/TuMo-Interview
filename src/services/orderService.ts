import { Order } from '../models/order.model';
import cacheManager from '../util/cacheManager';

export class OrderService {
    // 创建订单
    async createOrder(userId: number, orderData: any) {
        try {
            // 使用 Model 层方法创建订单
            const order = await Order.createOrder({
                userId,
                ...orderData
            });

            // 缓存订单数据
            await this.cacheOrder(order);

            return order;
        } catch (error) {
            throw error;
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