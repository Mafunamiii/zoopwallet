import mongoose from "mongoose";
const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["deposit", "withdraw", "transfer"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    default: "USD",
  },
  fromWallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Wallet",
    required: true
  },
  toWallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Wallet",
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  stripePaymentIntentId: {
    type: String,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;