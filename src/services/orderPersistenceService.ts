import { redis } from '../config/redis';
import { Order } from '../models/order.model';

export class OrderPersistenceService {
    private static KEYS = {
        ORDER: (id: number) => `order:${id}`,
        ORDER_QUEUE: 'order:queue',
        ORDER_PROCESSING: 'order:processing',
        ORDER_FAILED: 'order:failed',
    };

    // 保存订单数据
    async saveOrder(order: Order): Promise<void> {
        const key = OrderPersistenceService.KEYS.ORDER(order.id);
        
        // 使用Redis事务保证原子性
        const pipeline = redis.pipeline();
        
        pipeline.hmset(key, {
            id: order.id,
            userId: order.userId,
            status: order.status,
            amount: order.amount,
            updatedAt: new Date().toISOString(),
            data: JSON.stringify(order)
        });
        
        // 设置过期时间（可选）
        pipeline.expire(key, 60 * 60 * 24); // 24小时
        
        await pipeline.exec();
    }

    // 获取订单数据
    async getOrder(orderId: number): Promise<Order | null> {
        const key = OrderPersistenceService.KEYS.ORDER(orderId);
        const data = await redis.hgetall(key);
        
        if (!Object.keys(data).length) {
            return null;
        }
        
        return JSON.parse(data.data);
    }
} 