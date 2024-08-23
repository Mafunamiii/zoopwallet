const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class StripeService {
  static async createCustomer(email: string) {
    return await stripe.customers.create({ email });
  }

  static async createPaymentMethod(type: string, card: string) {
    return await stripe.paymentMethods.create({ type, card });
  }

  static async attachPaymentMethodToCustomer(paymentMethodId: string, customerId: string) {
    return await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
  }

  static async listCustomerPaymentMethods(customerId: string) {
    return await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
  }

  static async createPaymentIntent(amount: number, currency: string, customerId: string, paymentMethodId: string) {
    return await stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
      payment_method: paymentMethodId,
      confirm: true,
    });
  }
}

export default StripeService;
