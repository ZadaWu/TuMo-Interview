import { Request, Response } from 'express';
import { OrderService } from '../services/orderService';


export class OrderController {
    private orderService: OrderService;

    constructor() {
        this.orderService = new OrderService();
    }

    // 创建订单
    createOrder = async (req: Request, res: Response) => {
        try {
            console.log(14, req.userId);
            if (!req.userId) {
                return res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
            }
            const userId = req.userId;
            const order = await this.orderService.createOrder(userId, req.body);

            res.status(201).json({
                success: true,
                data: order
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };

    // 获取订单
    getOrder = async (req: Request, res: Response) => {
        try {
            const { orderId } = req.params;
            const order = await this.orderService.getOrderById(Number(orderId));

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            res.json({
                success: true,
                data: order
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };

    // 更新订单状态
    updateOrderStatus = async (req: Request, res: Response) => {
        try {
            const { orderId } = req.params;
            const { status } = req.body;
            const { userId } = req.user;

            const order = await this.orderService.updateOrderStatus(
                Number(orderId),
                status,
                userId
            );

            res.json({
                success: true,
                data: order
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };
} 