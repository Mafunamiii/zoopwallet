import StripeService from '../services/stripe.service';
import validator from '../utils/validator';
import logger from '../utils/logger';
import { Request, Response } from 'express';
import Stripe from "stripe";

const initStripeService = (req : Request) => {
  const stripeSecretKey = req.headers['stripe-secret-key'];
  return new StripeService();
};

export async function createPaymentMethod (req: Request, res : Response) {
  try {
    const { type, card } = req.body;

    if (type !== 'card' || !card) {
      return res.status(400).json({ error: 'Invalid payment method details' });
    }

    const stripeService = initStripeService(req); // This line might not be needed anymore

    const paymentMethod = await StripeService.createPaymentMethod(type, card); // Call static method
    const customerId = req.body.user.stripeCustomerId;
    await StripeService.attachPaymentMethodToCustomer(paymentMethod.id, customerId); // Call static method

    res.json({ paymentMethod });
  } catch (error) {
    logger.error('Error creating payment method:', error);
    res.status(500).json({ error: error });
  }
}

export async function getPaymentMethods (req : Request, res : Response) {
  try {
    const customerId = req.body.user.stripeCustomerId;  // Assuming this is stored with the user
    const stripeService = initStripeService(req);
    const paymentMethods = await StripeService.listPaymentMethods(customerId);
    res.json({ paymentMethods });
  } catch (error) {
    logger.error('Error getting payment methods:', error);
    res.status(500).json({ error: error });
  }
};

export async function createPaymentIntent(req: Request, res: Response){
  try {
    const { error } = validator.validateAmount(req.body.amount);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { amount, paymentMethodId } = req.body; // Extract paymentMethodId from the request body
    const customerId = req.body.user.stripeCustomerId;

    // Check if paymentMethodId is provided
    if (!paymentMethodId) {
      return res.status(400).json({ error: 'Payment method ID is required' });
    }

    const stripeService = initStripeService(req);
    const paymentIntent = await StripeService.createPaymentIntent(amount, 'usd', customerId, paymentMethodId);

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    logger.error('Error creating payment intent:', error);
    res.status(500).json({ error: error }); // Send a more specific error message to the client
  }
};