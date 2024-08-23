import WalletService from '../services/wallet.service';
import logger from '../utils/logger';
import { Request, Response } from 'express';

exports.createWallet = async (req: Request, res : Response) => {
  try {
    const { initialBalance } = req.body;
    const userId = req.body.user.id;
    const email = req.body.user.email;
    const result = await WalletService.createWallet(userId, email, initialBalance);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Error creating wallet:', error);
    res.status(500).json({ error: error });
  }
};

exports.deposit = async (req: Request, res : Response) => {
    try {
        const { amount, paymentMethodId } = req.body;
        const userId = req.body.user.id; // Assuming you have user info in the request after authentication

        const result = await WalletService.deposit(userId, amount, paymentMethodId);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error });
    }
};


exports.transfer = async (req: Request, res : Response) => {
  try {
    const { amount, toUserId } = req.body;
    const fromUserId = req.body.user.id;
    const result = await WalletService.transfer(fromUserId, toUserId, amount);
    res.json(result);
  } catch (error) {
    logger.error('Error transferring funds:', error);
    res.status(500).json({ error: error });
  }
};

exports.withdraw = async (req: Request, res : Response) => {
  try {
    const { amount } = req.body;
    const userId = req.body.user.id;
    const result = await WalletService.withdraw(userId, amount);
    res.json(result);
  } catch (error) {
    logger.error('Error withdrawing funds:', error);
    res.status(500).json({ error: error });
  }
};

exports.getBalance = async (req: Request, res : Response) => {
  try {
    const userId = req.body.user.id;
    const result = await WalletService.getBalance(userId);
    res.json(result);
  } catch (error) {
    logger.error('Error getting balance:', error);
    res.status(500).json({ error: error });
  }
};

exports.getTransactionHistory = async (req: Request, res : Response) => {
  try {
    const userId = req.body.user.id;
    const result = await WalletService.getTransactions(userId);
    res.json(result);
  } catch (error) {
    logger.error('Error getting transaction history:', error);
    res.status(500).json({ error: error });
  }
};
