import { Request, Response } from 'express';
import { OrderService } from '../services/orderService';
import { PaymentCallbackService } from '../services/paymentCallbackService';

export class PaymentCallbackController {
    private orderService: OrderService;
    private paymentCallbackService: PaymentCallbackService;

    constructor() {
        this.orderService = new OrderService();
        this.paymentCallbackService = new PaymentCallbackService();
    }

    handleCallback = async (req: Request, res: Response) => {
        try {
            // 1. 验证回调通知
            if (!this.paymentCallbackService.verifyNotification(req.body)) {
                return res.status(400).send('Invalid payment notification');
            }

            // 2. 检查是否重复通知
            const isDuplicate = await this.paymentCallbackService.isDuplicateNotification(req.body.transactionId + req.body.status );
            if (isDuplicate) {
                console.log('Duplicate notification received', { transactionId: req.body.transactionId + req.body.status });
                return res.status(200).send('success'); // 重复通知也返回成功
            }

            // 3. 处理支付通知
            await this.paymentCallbackService.handlePaymentNotification(req.body);

            // 4. 返回成功响应
            res.status(200).send('success');
        } catch (error) {
            console.error('Payment callback error:', error);
            res.status(500).send('error');
        }
    }
}