"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDatabase = connectToDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables from .env file located in the parent directory of src
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const connectionString = process.env.MONGO_URI || '';
console.log('MongoDB URI' + connectionString);
// Define connectToDatabase as a named function
function connectToDatabase() {
    try {
        mongoose_1.default.connect(connectionString);
        console.log('Connected to MongoDB');
    }
    catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}
