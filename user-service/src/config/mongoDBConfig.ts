import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file located in the parent directory of src
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const connectionString: string = process.env.MONGO_URI || '';
console.log('MongoDB URI' + connectionString);

// Define connectToDatabase as a named function
export function connectToDatabase() :void {
    try {
        mongoose.connect(connectionString);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}

