import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {loggerCreate} from "../../src";

// Load environment variables from .env file
dotenv.config();

// Build the connection string with credentials
const { MONGO_USER, MONGO_PASSWORD, MONGO_DB, MONGO_HOST, MONGO_PORT } = process.env;
const logger = loggerCreate('user-service-server');
const connectionString: string = `mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}@users.s0xtc.mongodb.net/?retryWrites=true&w=majority&appName=users`;
logger.info(`MongoDB URI: ${connectionString}`);

// Define connectToDatabase as a named function
export function connectToDatabase(): void {
    mongoose.connect(connectionString)
        .then(() => logger.info('Connected to MongoDB'))
        .catch((error) => logger.error('Error connecting to MongoDB:', error));
}
