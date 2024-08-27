import express from "express";
import WalletService from "../services/wallet.service";
import { authenticateJWT } from "../middleware/auth.middleware";
import logger from "../utils/logger";

const router = express.Router();

router.post("/create", authenticateJWT, async (req, res) => {
  logger.info("WalletRoutes-Request body:", req.body);
  try {
    const wallet = await WalletService.createWallet(
      req.body.user._id,
      req.body.user.email,
      req.body.initialBalance
    );
    res.status(201).json(wallet);
  } catch (error) {
    if (error == "KYC verification") {
      res.status(403).json({ error: error });
    } else {
      res.status(400).json({ error: error });
    }
  }
});

router.post("/create-payment-intent", authenticateJWT, async (req, res) => {
  try {
    const { amount } = req.body;

    const paymentIntent = await WalletService.createPaymentIntent(
      req.body.user.id,
      amount
    );

    res.json(paymentIntent);
  } catch (error) {
    res.status(400).json({ error: error });
  }
});

router.post("/confirm-payment-intent", authenticateJWT, async (req, res) => {
  logger.info("WalletRoutes-Request body:", req.body);
  try {
    const {paymentIntentId, paymentMethodId } = req.body; // Access properties directly
    logger.info("user_id:", req.body.user._id);
    const result = await WalletService.confirmPaymentIntent(
     req.body.user._id,
      paymentIntentId,
      paymentMethodId
    );
    res.json(result);
  } catch (error) {
    logger.error("WalletRoutes-Error:", error);
    res.status(400).json({ error: error });
  }
});

router.get("/payment-status/:paymentIntentId", authenticateJWT, async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    const status = await WalletService.getPaymentStatus(req.body.user.id, paymentIntentId);
    res.json(status);
  } catch (error) {
    res.status(400).json({ error: error });
  }
});

router.get("/balance", authenticateJWT, async (req, res) => {
  try {
    const balance = await WalletService.getBalance(req.body.user.id);
    res.json(balance);
  } catch (error) {
    res.status(400).json({ error: error });
  }
});

router.post("/add-payment-method", authenticateJWT, async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    const result = await WalletService.addPaymentMethod(
      req.body.user.id,
      paymentMethodId
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error });
  }
});

router.get("/payment-methods", authenticateJWT, async (req, res) => {
  try {
    const paymentMethods = await WalletService.listPaymentMethods(req.body.user.id);
    res.json(paymentMethods);
  } catch (error) {
    res.status(400).json({ error: error });
  }
});

router.delete("/payment-methods/:paymentMethodId", authenticateJWT, async (req, res) => {
  try {
    const { paymentMethodId } = req.params;
    await WalletService.deletePaymentMethod(req.body.user.id, paymentMethodId);
    res.json({ message: "Payment method deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error });
  }
});

router.post("/withdraw", authenticateJWT, async (req, res) => {
  try {
    const { amount } = req.body;
    const result = await WalletService.withdraw(req.body.user.id, amount);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error });
  }
});

router.post("/transfer", authenticateJWT, async (req, res) => {
  try {
    const { toUserId, amount } = req.body;
    const result = await WalletService.transfer(req.body.user.id, toUserId, amount);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error });
  }
});

router.get("/transactions", authenticateJWT, async (req, res) => {
  try {
    const transactions = await WalletService.getTransactions(req.body.user.id);
    res.json(transactions);
  } catch (error) {
    res.status(400).json({ error: error });
  }
});

router.post("/deposit", authenticateJWT, async (req, res) => {
  try {
    const { amount, paymentMethodId } = req.body;
    const result = await WalletService.deposit(
      req.body.user.id,
      amount,
      paymentMethodId
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error });
  }
});

router.post("/generate-qr", authenticateJWT, async (req, res) => {
  try {
    const { amount } = req.body;
    const qrCode = await WalletService.generatePaymentQR(req.body.user.id, amount);
    res.json(qrCode);
  } catch (error) {
    res.status(400).json({ error: error });
  }
});

router.post("/initiate-qr-payment", authenticateJWT, async (req, res) => {
  try {
    const { paymentId, paymentMethodId } = req.body;
    if (!paymentId || !paymentMethodId) {
      return res
        .status(400)
        .json({ error: "paymentId and paymentMethodId are required" });
    }
    const result = await WalletService.initiateQRPayment(
      paymentId,
      req.body.user.id,
      paymentMethodId
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error });
  }
});


router.post("/confirm-qr-payment", authenticateJWT, async (req, res) => {
  try {
    const { paymentIntentId, paymentMethodId } = req.body;
    const result = await WalletService.confirmQRPayment(
      req.body.user.id,
      paymentIntentId,
      paymentMethodId
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error });
  }
});


export default router;
