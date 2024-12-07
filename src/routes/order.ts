import express, { Request, Response } from 'express';
import { OrderController } from '../controllers/orderController';
import auth from '../middleware/auth';

const router = express.Router();
const orderController = new OrderController();

// Create order
router.post('/', auth, async (req: Request, res: Response) => {
    console.log(10, req.userId);
    await orderController.createOrder(req, res);
});

// Get order by id 
router.get('/:orderId', auth, async (req: Request, res: Response) => {
    await orderController.getOrder(req, res);
});

// Update order status
router.patch('/:orderId/status', auth, async (req: Request, res: Response) => {
    await orderController.updateOrderStatus(req, res);
});

export default router;
