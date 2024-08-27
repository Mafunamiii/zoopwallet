import Wallet from '../models/wallet.model';
import PaymentMethod from '../models/payment-method.model';
import Transaction from '../models/transaction.model';
import StripeService from './stripe.service';
import KYCVerification from "../models/kyc-verification.model";
import NotificationService from "./notification.service";
import crypto from "crypto";
import qrcode from "qrcode";
import logger from "../utils/logger";
// const util = require('util');
// const setTimeoutPromise = util.promisify(setTimeout);

const STRIPE_TEST_PAYMENT_METHODS = new Set([
  'pm_card_visa', 'pm_card_mastercard', 'pm_card_amex', 'pm_card_discover',
  'pm_card_diners', 'pm_card_jcb', 'pm_card_unionpay', 'pm_card_visa_debit',
  'pm_card_mastercard_prepaid', 'pm_card_threeDSecure2Required', 'pm_usBankAccount',
  'pm_sepaDebit', 'pm_bacsDebit', 'pm_alipay', 'pm_wechat'
]);

class WalletService {
  static async createWallet(userId : string, email : string, initialBalance : number) {
    logger.info(`Creating wallet for user ${userId} with initial balance ${initialBalance}`);
    try {
      // Check KYC status first
      const kycVerification = await KYCVerification.findOne({ user: userId });
      logger.info(`KYC verification: ${JSON.stringify(kycVerification)}`);
      if (!kycVerification || kycVerification.status !== "approved") {
        throw new Error(
          "KYC verification is not approved. Cannot create wallet."
        );
      }

      // Check if user already has a wallet
      const existingWallet = await Wallet.findOne({ user: userId });
      logger.info(`Existing wallet: ${JSON.stringify(existingWallet)}`);
      if (existingWallet) {
        throw new Error("User already has a wallet");
      }
      logger.info(`Creating customerWallet for user ${userId} with initial balance ${initialBalance}`);
      const stripeCustomer = await StripeService.createCustomer(email);
      logger.info(`Stripe customer: ${JSON.stringify(stripeCustomer)}`);
      const wallet = new Wallet({
        user: userId,
        balance: initialBalance,
        stripeCustomerId: stripeCustomer.id,
      });

      await wallet.save();

      if (initialBalance > 0) {
        const transaction = await this.createTransaction("deposit", initialBalance, '', wallet._id);
        // Send notification for initial balance as a deposit
        await NotificationService.notifyDeposit(userId, initialBalance, transaction._id);
      }

      logger.info(`Wallet created for user ${userId} with initial balance ${initialBalance}`);

      return wallet;
    } catch (error) {
      throw new Error(`Failed to create wallet: ${error}`);
    }
  }

  static async deposit(userId: string, amount: number, paymentMethodId: string) {
    try {
      const wallet = await Wallet.findOne({ user: userId });
      if (!wallet) {
        throw new Error("Wallet not found");
      }

      const paymentMethod = await PaymentMethod.findOne({
        user: userId,
        stripePaymentMethodId: paymentMethodId
      });

      if (!paymentMethod) {
        throw new Error("Payment method not found or does not belong to this user");
      }

      let paymentIntent;
      if (STRIPE_TEST_PAYMENT_METHODS.has(paymentMethodId)) {
        // For test payment methods, we'll simulate a successful payment
        paymentIntent = {
          id: `pi_simulated_${crypto.randomBytes(16).toString("hex")}`,
          status: "succeeded",
          amount: amount * 100 // Convert to cents for consistency with Stripe
        };
        logger.info(`Simulated payment intent for test payment method: ${JSON.stringify(paymentIntent)}`);
      } else {
        // For real payment methods, proceed with Stripe
        // 1. Create the PaymentIntent, potentially without confirming immediately
        paymentIntent = await StripeService.createPaymentIntent(
            amount * 100, // Convert to cents for Stripe
            "usd",
            wallet.stripeCustomerId,
            paymentMethodId // Pass the paymentMethodId here
        );

        // 2. If not confirmed immediately, confirm it now using the paymentMethodId
        if (paymentIntent.status !== 'succeeded') {
          paymentIntent = await StripeService.confirmPaymentIntent(
              paymentIntent.id,
              paymentMethodId
          );
        }
      }

      if (paymentIntent.status === "succeeded") {
        const depositAmount = paymentIntent.amount / 100; // Convert back to dollars
        wallet.balance += depositAmount;
        await wallet.save();

        const transaction = await this.createTransaction(
          "deposit",
          depositAmount,
          '',
          wallet._id,
        );

        // Send notification
        await NotificationService.notifyDeposit(wallet.user, depositAmount, transaction._id);

        return {
          balance: wallet.balance,
          transactionId: paymentIntent.id,
        };
      } else {
        throw new Error("Deposit failed");
      }
    } catch (error) {
      logger.error("Error in deposit:", error);
      throw new Error(`Deposit failed: ${error}`);
    }
  }

  static async createPaymentIntent(userId: string, amount: number) {
    logger.info(`Creating payment intent for user ${userId} with amount ${amount}`);
    const wallet = await Wallet.findOne({ user: userId });
    logger.info(`Wallet: ${JSON.stringify(wallet)}`);
    if (!wallet) {
      throw new Error("Wallet not found");
    }
    let paymentMethodId;
    // Validate paymentMethodId if provided
    try {
      logger.info(`Validating payment method for user ${userId}`);
      const paymentMethod = await PaymentMethod.findOne({
        user: userId,
      });
      logger.info(`Payment method: ${JSON.stringify(paymentMethod)}`);
      paymentMethodId = paymentMethod?.stripePaymentMethodId;
      logger.info(`Payment method ID: ${paymentMethodId}`);
      if (!paymentMethod) {
        throw new Error("Payment method not found or does not belong to this user");
      }

    } catch (error) {
      logger.error(`Error validating payment method: ${error}`);
      throw new Error("Invalid payment method");
    }
    let paymentIntent;
    if (typeof paymentMethodId === "string") {
      logger.info(`Creating payment intent for user ${userId} with amount ${amount} and payment method ${paymentMethodId}`);
       paymentIntent = await StripeService.createPaymentIntent(
          amount,
          "usd",
          wallet.stripeCustomerId,
          paymentMethodId
      );
    }

    if (!paymentIntent) {
      paymentIntent = await StripeService.createPaymentIntent(
        amount,
        "usd",
        wallet.stripeCustomerId,
          ''
      );
    }

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      paymentMethodId: paymentMethodId,
    };
  }

  static async confirmPaymentIntent(userId: string, paymentIntentId: string, paymentMethodId: string) {
    logger.info(`Confirming payment intent for user ${userId} with paymentIntentId ${paymentIntentId} and paymentMethodId ${paymentMethodId}`);
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    const paymentMethod = await PaymentMethod.findOne({
      user: userId,
      stripePaymentMethodId: paymentMethodId
    });

    if (!paymentMethod) {
      throw new Error("Payment method not found or does not belong to this user");
    }

    let paymentIntent;
    if (STRIPE_TEST_PAYMENT_METHODS.has(paymentMethodId)) {
      // For test payment methods, we'll simulate a successful confirmation
      paymentIntent = {
        id: paymentIntentId,
        status: "succeeded",
        amount: 5000 // Simulated amount in cents
      };
      logger.info(`Simulated payment intent confirmation for test payment method: ${JSON.stringify(paymentIntent)}`);
    } else {
      // For real payment methods, proceed with Stripe
      paymentIntent = await StripeService.confirmPaymentIntent(
        paymentIntentId,
        paymentMethodId
      );
    }

    if (paymentIntent.status === "succeeded") {
      const amount = paymentIntent.amount / 100; // Convert from cents to dollars
      wallet.balance += amount;
      await wallet.save();

      const transaction = await this.createTransaction(
        "deposit",
        amount,
        '',
        wallet._id,
        paymentIntent.id
      );

      // Send notification
      await NotificationService.notifyDeposit(userId, amount, transaction._id);

      return { balance: wallet.balance, transactionId: paymentIntent.id };
    } else {
      throw new Error("Payment failed");
    }
  }

  static async getPaymentStatus(userId: string, paymentIntentId: string) {
    // Verify that the payment intent belongs to this user
    const transaction = await Transaction.findOne({
      stripePaymentIntentId: paymentIntentId,
    }).populate('fromWallet');

    if (!transaction || transaction.fromWallet.user.toString() !== userId) {
      throw new Error("Payment not found or does not belong to this user");
    }

    // If you need more detailed status from Stripe, you can fetch it:
    // const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return {
      status: transaction.status,
      amount: transaction.amount,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      // Add any other relevant fields
    };
  }

  static async getBalance(userId: string) {
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      throw new Error("Wallet not found");
    }
    return { balance: wallet.balance };
  }

  static async addPaymentMethod(userId: string, paymentMethodId: string) {
    try {
      const wallet = await Wallet.findOne({ user: userId });
      if (!wallet) {
        throw new Error("Wallet not found");
      }

      // Check if the payment method already exists in the database
      const existingPaymentMethod = await PaymentMethod.findOne({ stripePaymentMethodId: paymentMethodId });
      if (existingPaymentMethod) {
        logger.info(`Payment method ${paymentMethodId} already exists for user ${userId}`);
        return { message: "Payment method already exists for this user" };
      }

      // Retrieve the payment method details from Stripe
      const stripePaymentMethod = await StripeService.retrievePaymentMethod(paymentMethodId);

      // Attach the payment method to the customer in Stripe
      await StripeService.attachPaymentMethodToCustomer(paymentMethodId, wallet.stripeCustomerId);

      // Create a new PaymentMethod document in the database
      const newPaymentMethod = new PaymentMethod({
        user: userId,
        stripePaymentMethodId: paymentMethodId,
        type: stripePaymentMethod.type,
        card: stripePaymentMethod.card ? {
          brand: stripePaymentMethod.card.brand,
          last4: stripePaymentMethod.card.last4,
          expMonth: stripePaymentMethod.card.exp_month,
          expYear: stripePaymentMethod.card.exp_year
        } : null,
        isDefault: false // You might want to set this based on some logic
      });

      await newPaymentMethod.save();

      // Send notification
      // try {
      //   await NotificationService.notifyPaymentMethodAdded(
      //     userId,
      //     stripePaymentMethod.card.last4,
      //     stripePaymentMethod.card.brand
      //   );
      // } catch (notificationError) {
      //   logger.error(`Error sending notification: ${notificationError}`);
      // }

      return { message: "Payment method added successfully" };
    } catch (error) {
      logger.error(`Error in addPaymentMethod for user ${userId}: ${error}`);
      throw new Error(`Failed to add payment method: ${error}`);
    }
  }

  static async listPaymentMethods(userId: string) {
    try {
      const paymentMethods = await PaymentMethod.find({ user: userId }).sort({ createdAt: -1 });

      return paymentMethods.map((pm: { stripePaymentMethodId: any; type: any; card: any; isDefault: any; }) => ({
        id: pm.stripePaymentMethodId,
        type: pm.type,
        card: pm.card,
        isDefault: pm.isDefault
      }));
    } catch (error) {
      logger.error(`Error in listPaymentMethods for user ${userId}: ${error}`);
      throw new Error(`Failed to list payment methods: ${error}`);
    }
  }

  static async deletePaymentMethod(userId: string, paymentMethodId: string) {
    try {
      const wallet = await Wallet.findOne({ user: userId });
      if (!wallet) {
        throw new Error("Wallet not found");
      }

      const paymentMethod = await PaymentMethod.findOne({
        user: userId,
        stripePaymentMethodId: paymentMethodId
      });

      if (!paymentMethod) {
        throw new Error("Payment method not found or does not belong to this user");
      }

      // Check if it's a test payment method
      if (STRIPE_TEST_PAYMENT_METHODS.has(paymentMethodId)) {
        logger.info(`Attempted to delete test payment method ${paymentMethodId} for user ${userId}`);
        await PaymentMethod.deleteOne({ _id: paymentMethod._id });
        return { message: "Test payment method removed from user's account" };
      }

      // For real payment methods, attempt to detach from Stripe
      try {
        await StripeService.detachPaymentMethod(paymentMethodId);
      } catch (stripeError) {
        // If Stripe couldn't find the payment method, it might have been deleted on Stripe's end
        if (stripeError === 'resource_missing') {
          logger.warn(`Payment method ${paymentMethodId} not found in Stripe, but exists in our database. Proceeding with local deletion.`);
        } else {
          // For other Stripe errors, we should stop the process
          throw stripeError;
        }
      }

      // Remove the payment method from our database
      await PaymentMethod.deleteOne({ _id: paymentMethod._id });

      logger.info(`Payment method ${paymentMethodId} deleted for user ${userId}`);

      return { message: "Payment method successfully deleted" };
    } catch (error) {
      logger.error(`Error in deletePaymentMethod for user ${userId}: ${error}`);
      throw new Error(`Failed to delete payment method: ${error}`);
    }
  }

  static async withdraw(userId: string, amount: number) {
    try {
      const wallet = await Wallet.findOne({ user: userId });
      if (!wallet) {
        throw new Error("Wallet not found");
      }

      if (wallet.balance < amount) {
        throw new Error("Insufficient funds");
      }

      const payout = await StripeService.createPayout(
        amount,
        wallet.stripeCustomerId
      );

      wallet.balance -= amount;
      await wallet.save();

      const transaction = await this.createTransaction(
        "withdraw",
        amount,
        wallet._id,
        '',
        payout.id
      );

      // Send notification
      await NotificationService.notifyWithdrawal(userId, amount, transaction._id, "completed", "bank_transfer");

      return { balance: wallet.balance, payoutId: payout.id };
    } catch (error) {
      logger.error("Error in withdraw:", error);
      throw new Error(`Withdrawal failed: ${error}`);
    }
  }

  static async transfer(fromUserId: string, toUserId: string, amount: number) {
    try {
      const fromWallet = await Wallet.findOne({ user: fromUserId });
      const toWallet = await Wallet.findOne({ user: toUserId });

      if (!fromWallet || !toWallet) {
        throw new Error("One or both wallets not found");
      }

      if (fromWallet.balance < amount) {
        throw new Error("Insufficient funds");
      }

      fromWallet.balance -= amount;
      toWallet.balance += amount;

      await fromWallet.save();
      await toWallet.save();

      const transaction = await this.createTransaction(
        "transfer",
        amount,
        fromWallet._id,
        toWallet._id
      );

      // Send notifications with updated balances
      await NotificationService.notifyTransfer(
        fromUserId,
        toUserId,
        amount,
        transaction._id,
        fromWallet.balance,
        toWallet.balance
      );

      return { fromBalance: fromWallet.balance, toBalance: toWallet.balance };
    } catch (error) {
      logger.error("Error in transfer:", error);
      throw new Error(`Transfer failed: ${error}`);
    }
  }

  static async getTransactions(userId: string) {
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    const transactions = await Transaction.find({
      $or: [{ fromWallet: wallet._id }, { toWallet: wallet._id }],
    }).sort({ createdAt: -1 });

    return transactions;
  }

  static async generatePaymentQR(userId: string, amount: number) {
    try {
      const wallet = await Wallet.findOne({ user: userId });
      if (!wallet) {
        throw new Error("Wallet not found");
      }

      const paymentId = crypto.randomBytes(16).toString("hex");

      const qrData = JSON.stringify({
        paymentId,
        amount,
        recipient: userId,
      });

      const qrCodeDataURL = await qrcode.toDataURL(qrData);

      // Create a pending transaction
      await this.createTransaction(
        "transfer",
        amount,
        '', // fromWallet is null for QR code generation
        wallet._id,
        '',
        "pending",
        { paymentId }
      );

      return { qrCodeDataURL, paymentId };
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error}`);
    }
  }

  static async initiateQRPayment(paymentId: string, payerId: string, paymentMethodId: string) {
    logger.info(
      `Initiating QR payment: paymentId=${paymentId}, payerId=${payerId}, paymentMethodId=${paymentMethodId}`
    );

    try {
      if (!paymentId || !payerId || !paymentMethodId) {
        throw new Error("Missing required parameters");
      }

      const transaction = await Transaction.findOne({
        "metadata.paymentId": paymentId,
        status: "pending",
      });
      logger.info(`Found transaction: ${JSON.stringify(transaction)}`);

      if (!transaction) {
        throw new Error("Invalid payment ID");
      }

      const payerWallet = await Wallet.findOne({ user: payerId });
      logger.info(`Found payer wallet: ${JSON.stringify(payerWallet)}`);

      if (!payerWallet) {
        throw new Error("Payer wallet not found");
      }

      if (payerWallet.balance < transaction.amount) {
        throw new Error("Insufficient funds");
      }

      const paymentMethod = await PaymentMethod.findOne({
        user: payerId,
        stripePaymentMethodId: paymentMethodId
      });

      if (!paymentMethod) {
        throw new Error("Payment method not found or does not belong to this user");
      }

      // Set the fromWallet
      transaction.fromWallet = payerWallet._id;
      await transaction.save();

      let paymentIntent;
      if (STRIPE_TEST_PAYMENT_METHODS.has(paymentMethodId)) {
        // For test payment methods, we'll simulate a payment intent
        paymentIntent = {
          id: `pi_simulated_${crypto.randomBytes(16).toString("hex")}`,
          client_secret: `seti_simulated_${crypto.randomBytes(16).toString("hex")}`,
          status: "requires_confirmation",
          amount: transaction.amount * 100 // Convert to cents for consistency
        };
        logger.info(`Simulated payment intent for test payment method: ${JSON.stringify(paymentIntent)}`);
      } else {
        // For real payment methods, proceed with Stripe
        paymentIntent = await StripeService.createPaymentIntent(
          transaction.amount * 100, // Convert to cents
          "usd",
          payerWallet.stripeCustomerId,
          paymentMethodId
        );
      }

      transaction.stripePaymentIntentId = paymentIntent.id;
      await transaction.save();

      return {
        clientSecret: paymentIntent.client_secret,
        amount: transaction.amount,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
      };
    } catch (error) {
      logger.error(`Error in initiateQRPayment: ${error}`);
      logger.error(error);
      throw new Error(`Failed to initiate QR payment: ${error}`);
    }
  }

  static async confirmQRPayment(payerId: string, paymentIntentId: string, paymentMethodId: string) {
    try {
      const paymentMethod = await PaymentMethod.findOne({
        user: payerId,
        stripePaymentMethodId: paymentMethodId
      });

      if (!paymentMethod) {
        throw new Error("Payment method not found or does not belong to this user");
      }

      let paymentIntent;
      if (STRIPE_TEST_PAYMENT_METHODS.has(paymentMethodId)) {
        // For test payment methods, we'll simulate a successful confirmation
        paymentIntent = {
          id: paymentIntentId,
          status: "succeeded"
        };
        logger.info(`Simulated QR payment confirmation for test payment method: ${JSON.stringify(paymentIntent)}`);
      } else {
        // For real payment methods, proceed with Stripe
        paymentIntent = await StripeService.confirmPaymentIntent(
          paymentIntentId,
          paymentMethodId
        );
      }

      if (paymentIntent.status === "succeeded") {
        const transaction = await Transaction.findOne({
          stripePaymentIntentId: paymentIntentId,
        }).populate('toWallet');
        if (!transaction) {
          throw new Error("Transaction not found");
        }

        transaction.status = "completed";
        await transaction.save();

        const recipientWallet = await Wallet.findById(transaction.toWallet);
        if (!recipientWallet) {
          throw new Error("Recipient wallet not found");
        }
        recipientWallet.balance += transaction.amount;
        await recipientWallet.save();

        const payerWallet = await Wallet.findOne({ user: payerId });
        if (!payerWallet) {
          throw new Error("Payer wallet not found");
        }
        payerWallet.balance -= transaction.amount;
        await payerWallet.save();

        // Send notifications
        await NotificationService.notifyQRPayment(
          payerId,
          recipientWallet.user.toString(),
          transaction.amount,
          transaction._id,
          "sent"
        );
        await NotificationService.notifyQRPayment(
          recipientWallet.user.toString(),
          payerId,
          transaction.amount,
          transaction._id,
          "received"
        );

        return { message: "Payment processed successfully", paymentIntentId };
      } else {
        throw new Error("Payment failed");
      }
    } catch (error) {
      logger.error("Error in confirmQRPayment:", error);
      throw new Error(`Failed to confirm QR payment: ${error}`);
    }
  }

  static async createTransaction(
    type : string,
    amount: number,
    fromWalletId: string,
    toWalletId: string,
    stripePaymentIntentId?: string,
    status = "completed",
    metadata = {}
  ) {
    const transaction = new Transaction({
      type,
      amount,
      fromWallet: fromWalletId,
      toWallet: toWalletId,
      status,
      stripePaymentIntentId,
      metadata,
    });

    await transaction.save();
    return transaction;
  }
}

export default WalletService;