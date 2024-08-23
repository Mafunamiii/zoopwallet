import nodemailer, {Transporter} from 'nodemailer';
import config from '../config';
import logger from '../utils/logger';
import User, {IUser} from '../models/user.model.js';
import {promises as fs} from 'fs';
import Handlebars from 'handlebars';
import path from 'path';
import userModel from "../models/user.model.js";

class NotificationService {
    private transporter: Transporter;
    private templates: { [key: string]: HandlebarsTemplateDelegate } = {};
    private baseTemplate: HandlebarsTemplateDelegate | undefined;

    constructor() {
    this.transporter = this.createTransporter();
    this.templates = {};
    this.loadEmailTemplates();
    Handlebars.registerHelper('eq', function(a, b) {
      return a === b;
    });
  }

  createTransporter() {
    const useMailHog = process.env.USE_MAILHOG === 'true';

    if (useMailHog) {
      logger.info('Using MailHog for email testing');
      return nodemailer.createTransport({
        host: 'mailhog', // Docker service name
        port: 1025,
        ignoreTLS: true
      });
    } else {
      logger.info('Using configured SMTP server for emails');
      return nodemailer.createTransport({
        host: config.emailHost,
        port: config.emailPort,
        auth: {
          user: config.emailUsername,
          pass: config.emailPassword
        }
      });
    }
  }


    async loadEmailTemplates() {
        try {
            const templateDir = path.join(__dirname, '../templates');

            try {
                const baseTemplateContent = await fs.readFile(path.join(templateDir, 'base-email-template.html'), 'utf-8');
                this.baseTemplate = Handlebars.compile<string>(baseTemplateContent);
            } catch (err) {
                logger.error("Error loading base email template:", err);
                // Optionally, you could set a default base template here or throw an error if it's critical
            }

            const templateFiles = [
                'verification',
                'login',
                'deposit',
                'kyc-verification',
                'qr-payment',
                'transfer',
                'withdrawal',
                'wallet-creation',
                'payment-method-added'
            ];

            for (const file of templateFiles) {
                const templatePath = path.join(templateDir, `${file}-email-template.html`);
                try {
                    const templateContent = await fs.readFile(templatePath, 'utf-8');
                    this.templates[file] = Handlebars.compile(templateContent);
                } catch (err) {
                    logger.warn(`Error loading template '${file}':`, err);
                    // You might want to set a default template or skip this template
                }
            }

            logger.info('Email templates loaded successfully');
            logger.debug('Loaded templates:', Object.keys(this.templates));
        } catch (error) {
            logger.error('Error loading email templates:', error);
            // Consider not throwing an error here, as it might prevent the application from starting
            // Instead, you could log the error and continue, potentially with reduced functionality
        }
    }

  async sendEmail(to : string, subject : string, templateName : string, context: any) {
    try {
      if (!this.templates[templateName]) {
        logger.error(`Template '${templateName}' not found. Available templates:`, Object.keys(this.templates));
        throw new Error(`Email template '${templateName}' not found`);
      }

        if (!this.baseTemplate) {
            logger.error('Base template is not defined');
            throw new Error('Base template is not defined');
        }

      logger.debug(`Rendering template: ${templateName}`);
      logger.debug('Template context:', context);

      const template = this.templates[templateName];
      const content = template(context);
      const html = this.baseTemplate({ content, subject, ...context });

      const mailOptions = {
        from: 'Your E-Wallet <noreply@coderstudio.co>',
        to,
        subject,
        html
      };

      logger.debug('Mail options:', mailOptions);

      await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent to ${to} using template ${templateName}`);

      // If using MailHog, log additional information for testing
      if (process.env.USE_MAILHOG === 'true') {
        logger.info(`MailHog Web Interface: http://localhost:8025`);
        logger.info(`Check MailHog to view the sent email.`);
      }
    } catch (error) {
      logger.error('Error sending email:', error);
      logger.error('Template name:', templateName);
      logger.error('Context:', context);
      throw new Error(`Failed to send email notification: ${error}`);
    }
  }

  async sendSMS(phoneNumber : string, message : string) {
    try {
      // Implement SMS sending logic here
      // You might want to use a service like Twilio for this
      logger.info(`SMS sent to ${phoneNumber}: ${message}`);
    } catch (error) {
      logger.error('Error sending SMS:', error);
      throw new Error(`Failed to send SMS notification: ${error}`);
    }
  }

  async sendPushNotification(userId : string, title : string, body : string) {
    try {
      // Implement push notification logic here
      // You might want to use a service like Firebase Cloud Messaging for this
      logger.info(`Push notification sent to user ${userId}: ${title} - ${body}`);
    } catch (error) {
      logger.error('Error sending push notification:', error);
      throw new Error(`Failed to send push notification: ${error}`);
    }
  }

  async notifyEmailVerification(user : IUser, verificationLink : string) {
    try {
      await this.sendEmail(
        user.email,
        'Verify Your E-Wallet Email',
        'verification',
        {
          firstName: user.firstName,
          verificationLink
        }
      );
      logger.info(`Verification email sent successfully to ${user.email}`);
      return true;
    } catch (error) {
      logger.error(`Error sending verification email to ${user.email}:`, error);
      return false;
    }
  }

  async notifyLogin(user : IUser , loginTime : string, loginLocation : string) {
    try {
      await this.sendEmail(
        user.email,
        'New Login to Your E-Wallet Account',
        'login',
        {
          firstName: user.firstName,
          loginTime,
          loginLocation,
          secureAccountLink: `${config.appUrl}/secure-account` // Update with actual link
        }
      );
    } catch (error) {
      logger.error('Error in notifyLogin:', error);
      // We don't throw here to prevent login process from failing due to notification error
    }
  }

  async notifyDeposit(userId : string, amount : number, transactionId : string) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      await this.sendEmail(
        user.email,
        'Deposit Successful',
        'deposit',
        {
          firstName: user.firstName,
          amount,
          transactionId,
          transactionDate: new Date().toLocaleString(),
          viewBalanceLink: `${config.appUrl}/wallet/balance`
        }
      );
    } catch (error) {
      logger.error('Error in notifyDeposit:', error);
      throw new Error(`Failed to send deposit notification: ${error}`);
    }
  }

  async notifyKYCUpdate(userId : string, kycStatus : string, rejectionReason = null) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      await this.sendEmail(
        user.email,
        'KYC Verification Update',
        'kyc-verification',
        {
          firstName: user.firstName,
          kycStatus,
          rejectionReason,
          accountLink: `${config.appUrl}/account`,
          resubmitLink: `${config.appUrl}/kyc/resubmit`
        }
      );
    } catch (error) {
      logger.error('Error in notifyKYCUpdate:', error);
      throw new Error(`Failed to send KYC update notification: ${error}`);
    }
  }

  async notifyQRPayment(payerId :string, recipientId: string, amount : number, transactionId : string, status: string) {
    try {
      logger.info(`Notifying QR payment. Payer: ${payerId}, Recipient: ${recipientId}`);

      const [payer, recipient] = await Promise.all([
        User.findById(payerId),
        User.findById(recipientId)
      ]);

      if (!payer) {
        logger.error(`Payer not found. ID: ${payerId}`);
        throw new Error(`Payer not found. ID: ${payerId}`);
      }
      if (!recipient) {
        logger.error(`Recipient not found. ID: ${recipientId}`);
        throw new Error(`Recipient not found. ID: ${recipientId}`);
      }

      await Promise.all([
        this.sendEmail(
          payer.email,
          'QR Payment Sent',
          'qr-payment',
          {
            firstName: payer.firstName,
            paymentStatus: 'sent',
            amount,
            transactionId,
            transactionDate: new Date().toLocaleString(),
            transactionDetailsLink: `${config.appUrl}/transactions/${transactionId}`
          }
        ),
        this.sendEmail(
          recipient.email,
          'QR Payment Received',
          'qr-payment',
          {
            firstName: recipient.firstName,
            paymentStatus: 'received',
            amount,
            transactionId,
            transactionDate: new Date().toLocaleString(),
            transactionDetailsLink: `${config.appUrl}/transactions/${transactionId}`
          }
        )
      ]);

      logger.info(`QR payment notifications sent successfully for transaction ${transactionId}`);
    } catch (error) {
      logger.error('Error in notifyQRPayment:', error);
      throw new Error(`Failed to send QR payment notifications: ${error}`);
    }
  }

  async notifyTransfer(fromUserId : string, toUserId: string, amount: number, transactionId: string, fromBalance : number, toBalance: number) {
    try {
      const [fromUser, toUser] = await Promise.all([
        User.findById(fromUserId),
        User.findById(toUserId)
      ]);

      if (!fromUser || !toUser) throw new Error('One or both users not found');

      await Promise.all([
        this.sendEmail(
          fromUser.email,
          'Transfer Sent',
          'transfer',
          {
            firstName: fromUser.firstName,
            transferStatus: 'sent',
            amount,
            otherPartyName: toUser.email,
            transactionId,
            transactionDate: new Date().toLocaleString(),
            transactionDetailsLink: `${config.appUrl}/transactions/${transactionId}`,
            newBalance: fromBalance
          }
        ),
        this.sendEmail(
          toUser.email,
          'Transfer Received',
          'transfer',
          {
            firstName: toUser.firstName,
            transferStatus: 'received',
            amount,
            otherPartyName: fromUser.email,
            transactionId,
            transactionDate: new Date().toLocaleString(),
            transactionDetailsLink: `${config.appUrl}/transactions/${transactionId}`,
            newBalance: toBalance
          }
        )
      ]);
    } catch (error) {
      logger.error('Error in notifyTransfer:', error);
      throw new Error(`Failed to send transfer notifications: ${error}`);
    }
  }

  async notifyWithdrawal(userId : string, amount : number, transactionId : string, withdrawalStatus : string, withdrawalMethod : string, failureReason = null) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      await this.sendEmail(
        user.email,
        'Withdrawal Update',
        'withdrawal',
        {
          firstName: user.firstName,
          amount,
          withdrawalStatus,
          transactionId,
          transactionDate: new Date().toLocaleString(),
          withdrawalMethod,
          failureReason,
          transactionDetailsLink: `${config.appUrl}/transactions/${transactionId}`,
          newBalance: user.wallet.balance - amount // Assuming balance is updated before notification for successful withdrawals
        }
      );
    } catch (error) {
      logger.error('Error in notifyWithdrawal:', error);
      throw new Error(`Failed to send withdrawal notification: ${error}`);
    }
  }

  async notifyWalletCreation(userId : string, initialBalance: number) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      await this.sendEmail(
        user.email,
        'Wallet Created Successfully',
        'wallet-creation',
        {
          firstName: user.firstName,
          initialBalance,
          walletLink: `${config.appUrl}/wallet`
        }
      );
      logger.info(`Wallet creation notification sent to user ${userId}`);
    } catch (error) {
      logger.error('Error in notifyWalletCreation:', error);
      // We don't throw here to prevent wallet creation from failing due to notification error
    }
  }

  async notifyPaymentMethodAdded(userId : string, last4: string, cardBrand : string) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      await this.sendEmail(
        user.email,
        'New Payment Method Added',
        'payment-method-added',
        {
          firstName: user.firstName,
          last4: last4,
          cardBrand: cardBrand,
          managePaymentMethodsLink: `${config.appUrl}/wallet/payment-methods`
        }
      );
      logger.info(`Payment method added notification sent to user ${userId}`);
    } catch (error) {
      logger.error('Error in notifyPaymentMethodAdded:', error);
      // We don't throw here to prevent the payment method addition from failing due to notification error
    }
  }

  // Add more notification methods for other events as needed
}

export default new NotificationService();