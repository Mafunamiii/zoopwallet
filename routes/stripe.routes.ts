import express from 'express';
import {getPaymentMethods} from '../controllers/stripe.controller.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/create-payment-method', authenticateJWT, );
router.get('/payment-methods', authenticateJWT, getPaymentMethods);

export default router;