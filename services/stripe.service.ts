import Stripe from 'stripe';
import logger from '../utils/logger';
import walletService from "./wallet.service";



let stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');



class StripeService {
  static async createCustomer(email: string) {
    logger.info(`Creating Stripe customer for email: ${email}`);
    try {
      const customer = await stripe.customers.create({ email });
      logger.info(`Created Stripe customer for email: ${email}`);
      return customer;
    } catch (error) {
      logger.error(`Error creating Stripe customer: ${error}`); // Log the error
      throw new Error(`Failed to create Stripe customer: ${error}`); // Re-throw for higher-level handling
    }
  }

  /* THIS NEED CONFIRMATION ON

    static async createPaymentIntent(amount, currency, customerId) {
      return await stripe.paymentIntents.create({
        amount: amount * 100, // Convert to cents
        currency,
        customer: customerId,
        payment_method_types: ['card'],
      });
    }

    static async confirmPaymentIntent(paymentIntentId) {
      return await stripe.paymentIntents.confirm(paymentIntentId);
    }

    static async attachPaymentMethodToCustomer(paymentMethodId, customerId) {
        return await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
      }

      static async createPayout(amount, customerId) {
        // Note: In a real-world scenario, you'd typically use a connected account for payouts
        // This is a simplified version for demonstration purposes
        return await stripe.payouts.create({
          amount: amount * 100, // Convert to cents
          currency: 'usd',
          method: 'instant',
        }, {
          stripeAccount: customerId, // This assumes the customer ID can be used as a connected account ID, which is not typically the case
        });
      }*/

  /* THIS IS AUTO CONFIRM */

// DUPLICATE BELOW, this is a much more direct approach
  // static async attachPaymentMethodToCustomer(paymentMethodId, customerId) {
  //   try {
  //     const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
  //       customer: customerId,
  //     });
  //     logger.info(`Attached payment method ${paymentMethodId} to customer ${customerId}`);
  //     return paymentMethod;
  //   } catch (error) {
  //     logger.error(`Error attaching payment method: ${error.message}`);
  //     throw new Error(`Failed to attach payment method: ${error.message}`);
  //   }
  // }

  // ADDING CREATEPAYMENT METHOD
  static async createPaymentMethod(type: string, cardDetails: any): Promise<Stripe.PaymentMethod> {
    try {
      // Validate payment method type (you might have additional validation here)
      if (type !== 'card') {
        throw new Error('Unsupported payment method type');
      }

      // Create the payment method using the Stripe API
      const paymentMethod = await stripe.paymentMethods.create({
        type,
        card: cardDetails, // Assuming 'cardDetails' contains the necessary card information
      });

      logger.info(`Created Stripe payment method: ${paymentMethod.id}`);
      return paymentMethod;
    } catch (error) {
      logger.error(`Error creating Stripe payment method: ${error}`);
      throw new Error(`Failed to create payment method: ${error}`);
    }
  }

  static async createPaymentIntent(
    amount : number,
    currency : string,
    customerId : string,
    paymentMethodId : string
  ) {
    logger.info(
      `Creating PaymentIntent: amount=${amount}, currency=${currency}, customerId=${customerId}, paymentMethodId=${paymentMethodId}`
    );

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        customer: customerId,
        payment_method: paymentMethodId,
        setup_future_usage: "off_session",
      });

      logger.info(`PaymentIntent created: ${JSON.stringify(paymentIntent)}`);
      return paymentIntent;
    } catch (error) {
      logger.error(`Error creating PaymentIntent: ${error}`);
      throw error;
    }
  }

  static async confirmPaymentIntent(paymentIntentId:string, paymentMethodId: string) {
    logger.info(`[stripe-service]Confirming PaymentIntent: ${paymentIntentId}`);
    try {
      const confirmedPaymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      });
      logger.info(`Confirmed PaymentIntent: ${paymentIntentId}`);
      return confirmedPaymentIntent;
    } catch (error) {
      logger.error(`Error confirming PaymentIntent: ${error}`);
      throw new Error(`Failed to confirm PaymentIntent: ${error}`);
    }
  }

  static async createPayout(amount: number, customerId: string) {
    logger.info(`Creating payout for customer ${customerId}`);

    // Retrieve the wallet for the given customer
    const wallet = await walletService.getWalletByCustomerId(customerId);

    // Validate that the wallet exists and has sufficient balance
    if (!wallet) {
      logger.error(`Wallet not found for customer ${customerId}`);
      throw new Error('Wallet not found');
    }

    if (wallet.balance < amount) {
      logger.error(`Insufficient funds for customer ${customerId}`);
      throw new Error('Insufficient funds');
    }

    // Simulate fetching bank accounts (not needed for simulation)
    // const bankAccounts = ...

    try {
      // Deduct the amount from the wallet balance
      wallet.balance -= amount;
      await wallet.save();

      // Simulate a successful payout
      const simulatedPayout = {
        id: customerId, // You can generate a unique ID if needed
        status: 'succeeded',
        amount: amount * 100, // In cents
        currency: 'usd',
      };

      logger.info(`Simulated payout for customer ${customerId}: ${JSON.stringify(simulatedPayout)}`);
      return simulatedPayout;
    } catch (error) {
      logger.error(`Error simulating payout for customer ${customerId}: ${error}`);

      // Roll back the wallet balance if simulation fails (for completeness)
      wallet.balance += amount;
      await wallet.save();

      throw new Error(`Failed to simulate payout: ${error}`);
    }
  }


  static async listPaymentMethods(customerId: string) {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });
      logger.debug(`Retrieved ${paymentMethods.data.length} payment methods for customer ${customerId}`);
      return paymentMethods;
    } catch (error) {
      logger.error('Error listing payment methods:', error);
      throw new Error(`Failed to list payment methods: ${error}`);
    }
  }

  static async retrievePaymentMethod(paymentMethodId: string) {
    try {
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      logger.debug(`Retrieved payment method ${paymentMethodId}`);
      return paymentMethod;
    } catch (error) {
      logger.error(`Error retrieving payment method ${paymentMethodId}:`, error);
      throw new Error(`Failed to retrieve payment method: ${error}`);
    }
  }

  static async attachPaymentMethodToCustomer(paymentMethodId : string, customerId: string) {
    try {
      // First, retrieve the payment method to check its current status
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      logger.debug(`Retrieved payment method before attachment: ${JSON.stringify(paymentMethod)}`);

      if (paymentMethod.customer === customerId) {
        logger.info(`Payment method ${paymentMethodId} is already attached to customer ${customerId}`);
        return paymentMethod;
      }

      if (paymentMethod.customer) {
        // If the payment method is attached to another customer, detach it first
        await stripe.paymentMethods.detach(paymentMethodId);
        logger.info(`Detached payment method ${paymentMethodId} from previous customer`);
      }

      // Attach the payment method to the new customer
      const attachedPaymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      logger.info(`Payment method ${paymentMethodId} attached to customer ${customerId}`);
      logger.debug(`Attached payment method response: ${JSON.stringify(attachedPaymentMethod)}`);
      return attachedPaymentMethod;
    } catch (error) {
      logger.error(`Error in attachPaymentMethodToCustomer: ${error}`);
      logger.error(`Error details: ${JSON.stringify(error)}`);
      throw new Error(`Failed to attach payment method: ${error}`);
    }
  }

  static async detachPaymentMethod(paymentMethodId: string) {
    try {
      const detachedPaymentMethod = await stripe.paymentMethods.detach(paymentMethodId);
      logger.info(`Detached payment method ${paymentMethodId}`);
      return detachedPaymentMethod;
    } catch (error) {
      logger.error(`Error detaching payment method ${paymentMethodId}:`, error);
      throw new Error(`Failed to detach payment method: ${error}`);
    }
  }

}

export default StripeService;
