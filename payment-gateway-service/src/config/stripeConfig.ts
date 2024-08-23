import dotenv from "dotenv";


dotenv.config();

export const stripeConfig = {
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
};

