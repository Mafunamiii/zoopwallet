import mongoose from "mongoose";

interface IWallet extends mongoose.Document {
    user: mongoose.Schema.Types.ObjectId;
    balance: number;
    currency: string;
    stripeCustomerId: string;
    createdAt: Date;
    updatedAt: Date;
}

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  stripeCustomerId: {
    type: String,
    required: true
  },
});


const Wallet = mongoose.model('Wallet', walletSchema);

export default Wallet;