import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Build the connection string with credentials
const { MONGO_USER, MONGO_PASSWORD, MONGO_DB, MONGO_HOST, MONGO_PORT } = process.env;

const connectionString: string = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}`;

console.log('MongoDB URI:', connectionString);

// Define connectToDatabase as a named function
export function connectToDatabase(): void {
    try {
        mongoose.connect(connectionString);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}
