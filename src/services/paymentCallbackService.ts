import { redis } from '../config/redis';
import { OrderService } from './orderService';
import { Payment } from '../models/payment.model';
import cacheManager from '../util/cacheManager';
import sequelize from '../util/sequelize';
import { OrderStatus } from '../models/order.model';  

interface PaymentNotification {
    merchantOrderId: string;     // 商户订单号
    transactionId: string;       // 支付网关交易号
    amount: number;              // 交易金额
    currency: string;            // 货币类型
    status: string;              // 交易状态
    cardInfo: {
        last4: string;           // 卡号后四位
        brand: string;           // 卡品牌（VISA/MC等）
        expiryMonth: string;     // 过期月
        expiryYear: string;      // 过期年
    };
    authorizationCode?: string;  // 授权码
    responseCode?: string;       // 响应码
    failureReason?: string;      // 失败原因
    timestamp: string;           // 交易时间戳
}

export class PaymentCallbackService {
    private orderService: OrderService;
    private Payment: Payment;
    private readonly CALLBACK_LOCK_TTL = 300; // 5分钟锁定时间

    constructor() {
        this.orderService = new OrderService();
        this.Payment = new Payment();
    }

    async handlePaymentNotification(notification: PaymentNotification) {
        const { merchantOrderId, status, transactionId } = notification;

        // 1. 验证通知的真实性
        if (!this.verifyNotification(notification)) {
            throw new Error('Invalid payment notification');
        }

        try {
            switch (status) {
                case 'AUTHORIZED':
                    await this.handleAuthorization(notification);
                    break;
                case 'CAPTURED':
                    await this.handleCapture(notification);
                    break;
                case 'FAILED':
                    await this.handleFailure(notification);
                    break;
                case 'REFUNDED':
                    await this.handleRefund(notification);
                    break;
                case 'DISPUTED':
                    await this.handleDispute(notification);
                    break;
            }
        } catch (error) {
            console.error('Payment notification processing failed:', error);
            throw error;
        }
    }

    private async handleAuthorization(notification: PaymentNotification) {
        const { merchantOrderId, transactionId, cardInfo } = notification;

        // 1. 记录授权信息
        await this.Payment.saveAuthorization({
            orderId: merchantOrderId,
            transactionId,
            cardLast4: cardInfo.last4,
            cardBrand: cardInfo.brand,
            status: 'AUTHORIZED'
        });

        // 2. 更新订单状态
        // await this.orderService.updateOrderStatus(merchantOrderId, 'PAYMENT_AUTHORIZED');
    }

    private async handleCapture(notification: PaymentNotification) {
        const { merchantOrderId, amount, transactionId } = notification;

        // 1. 更新支付记录
        await this.Payment.updatePayment(transactionId, {
            orderId: merchantOrderId,
            status: 'CAPTURED',
            capturedAmount: amount,
            capturedAt: new Date()
        });

        // 2. 获取订单信息&&更新订单状态 
        const order = await this.orderService.getOrderById(merchantOrderId);

        // 3. 根据orderId获取所有捕获的金额
        // Get all captured payments for this order
        const [result] = await sequelize.query(`
            SELECT SUM(captured_amount) as total_captured
            FROM payment_transactions 
            WHERE order_id = :orderId 
            AND status = 'CAPTURED'`, {
            replacements: {
                orderId: merchantOrderId
            }
        });
        
        const totalCapturedAmount = result?.[0]?.total_captured || 0;
 
        if (totalCapturedAmount >= order.totalAmount) {
            await this.orderService.updateOrderStatus(merchantOrderId, 'PAID', 'transaction');
        }

        // 3. 触发后续业务流程
        // await this.fulfillmentService.initiateFulfillment(merchantOrderId);
        // await this.notificationService.sendPaymentConfirmation(merchantOrderId);
    }

    private async handleFailure(notification: PaymentNotification) {
        const { merchantOrderId, failureReason, responseCode } = notification;

        // 1. 记录失败信息
        await this.Payment.saveFailureRecord({
            orderId: merchantOrderId,
            reason: failureReason,
            responseCode,
            failedAt: new Date()
        });

        // 2. 更新订单状态
        await this.orderService.updateOrderStatus(merchantOrderId, 'FAILED');

        // 3. 发送失败通知
        // await this.notificationService.sendPaymentFailureNotification(
        //     merchantOrderId,
        //     failureReason
        // );
    }

    private async handleDispute(notification: PaymentNotification) {
        const { merchantOrderId, transactionId } = notification;

        // 1. 记录争议信息
        // await this.disputeService.createDisputeRecord({
        //     orderId: merchantOrderId,
        //     transactionId,
        //     disputedAt: new Date()
        // });

        // 2. 更新订单状态
        await this.orderService.updateOrderStatus(merchantOrderId, 'DISPUTED');

        // 3. 通知相关团队
        // await this.notificationService.notifyDisputeTeam({
        //     orderId: merchantOrderId,
        //     transactionId
        // });
    }

    private async handleRefund(notification: PaymentNotification) {
        const { merchantOrderId, transactionId, amount } = notification;

        // 1. 更新支付记录
        await this.Payment.updatePayment(transactionId, {
            orderId: merchantOrderId,
            status: 'REFUNDED',
            capturedAmount: -amount,  // 负数表示退款
            capturedAt: new Date()
        });

        // 2. 更新订单状态
        await this.orderService.updateOrderStatus(merchantOrderId, OrderStatus.REFUNDED);

        // 3. TODO：记录退款历史
        // await this.Payment.saveRefundRecord({
        //     orderId: merchantOrderId,
        //     transactionId,
        //     amount,
        //     refundedAt: new Date()
        // });

        // 4. 可选：发送退款通知
        // await this.notificationService.sendRefundNotification(merchantOrderId);
    }

    private verifyNotification(notification: PaymentNotification): boolean {
        // 实现签名验证逻辑
        return true;
    }

    private async isDuplicateNotification(transactionId: string): Promise<boolean> {
        const key = `payment:notification:${transactionId}`;
        const existingValue = await cacheManager.get(key);
        if (existingValue) {
            return true; // Duplicate notification
        }
        await cacheManager.set(key, '1', 86400); // 24小时过期
        return false;
    }
} 