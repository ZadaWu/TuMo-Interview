import express from 'express';
import { PaymentCallbackController } from '../controllers/paymentCallbackController';
import auth from '../middleware/auth';
const router = express.Router();
const paymentCallbackController = new PaymentCallbackController();

router.post('/callback', auth, paymentCallbackController.handleCallback);

export default router; 