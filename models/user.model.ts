import mongoose from "mongoose";
import bcrypt from "bcryptjs";



const walletSchema = new mongoose.Schema(
  {
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    stripeCustomerId: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

export interface IUser extends mongoose.Document {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    stripeCustomerId: string;
    wallet: {
        balance: number;
        stripeCustomerId: string;
    };
    isEmailVerified: boolean;
    emailVerificationToken: string;
    emailVerificationExpires: Date;
    createdAt: Date;
    checkPassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  stripeCustomerId: {
    type: String,
    unique: true,
    sparse: true,
  },
  wallet: walletSchema,
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  const user = this as IUser;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 10);
  }
  next();
});

// Method to check password
userSchema.methods.checkPassword = async function (candidatePassword) {
  const user = this as IUser;
  return await bcrypt.compare(candidatePassword, user.password);
};

const User = mongoose.model("User", userSchema);

export default User;