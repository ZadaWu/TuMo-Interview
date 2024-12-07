import { DataTypes, Model } from 'sequelize';
import MySQLClient from '../util/getMysql';
import sequelize from '../util/sequelize';

export enum OrderStatus {
    PENDING = 'PENDING',           // 待支付
    PAID = 'PAID',                // 已支付
    PROCESSING = 'PROCESSING',     // 处理中
    SHIPPED = 'SHIPPED',          // 已发货
    DELIVERED = 'DELIVERED',       // 已送达
    COMPLETED = 'COMPLETED',       // 已完成
    CANCELLED = 'CANCELLED',       // 已取消
    REFUND_PENDING = 'REFUND_PENDING', // 退款申请中
    REFUNDED = 'REFUNDED',        // 已退款
    CLOSED = 'CLOSED'             // 已关闭
}

export class Order extends Model {
    public id!: number;
    public userId!: number;
    public status!: OrderStatus;
    public amount!: number;
    public orderNumber!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // 静态方法：创建订单
    static async createOrder(orderData: any) {
        const mysql = MySQLClient;
        
        try {
            // 开始事务
            await mysql.query('START TRANSACTION');
            
            // 修复这里的解构赋值
            const result = await mysql.query<any>(
                'INSERT INTO orders (userId, orderNumber, status, amount) VALUES (?, ?, ?, ?)',
                [orderData.userId, this.generateOrderNumber(), 'PENDING', orderData.totalAmount]
            );

            console.log(41, result);
            
            const orderId = result.insertId;

            // 创建订单项
            if (orderData.items) {
                const itemValues = orderData.items.map((item: any) => 
                    [orderId, `'${item.productId}'`, item.quantity, item.price]
                ).join('), (');
                
                await mysql.query(
                    `INSERT INTO order_items (orderId, productId, quantity, price) VALUES (${itemValues})`
                );
            }

            // 提交事务
            await mysql.query('COMMIT');

            // 获取创建的订单
            const [order] = await mysql.query<any[]>(
                'SELECT * FROM orders WHERE id = ?',
                [orderId]
            );
            
            return order;
        } catch (error) {
            console.log(65, error);
            // 回滚事务
            await mysql.query('ROLLBACK');
            throw error;
        }
    }

    // 静态方法：更新订单状态
    static async updateOrderStatus(
        orderId: number,
        status: OrderStatus,
        userId: number
    ) {
        const mysql = MySQLClient;
        
        try {
            // 开始事务
            await mysql.query('START TRANSACTION');

            // 获取订单当前状态
            const [orders] = await mysql.query<any[]>(
                'SELECT status FROM orders WHERE id = ?',
                [orderId]
            );

            if (!orders || orders.length === 0) {
                throw new Error('Order not found');
            }

            const oldStatus = orders[0].status;

            // 更新订单状态
            await mysql.query(
                'UPDATE orders SET status = ? WHERE id = ?',
                [status, orderId]
            );

            // 记录状态变更历史
            await mysql.query(
                'INSERT INTO order_status_history (orderId, fromStatus, toStatus, changedBy) VALUES (?, ?, ?, ?)',
                [orderId, oldStatus, status, userId]
            );

            // 提交事务
            await mysql.query('COMMIT');

            // 返回更新后的订单
            const [updatedOrder] = await mysql.query<any[]>(
                'SELECT * FROM orders WHERE id = ?',
                [orderId]
            );
            
            return updatedOrder;
        } catch (error) {
            // 回滚事务
            await mysql.query('ROLLBACK');
            throw error;
        }
    }

    private static generateOrderNumber() {
        return `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
    }
}

Order.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    orderNumber: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    }
}, {
    sequelize,
    tableName: 'orders'
});
