import mongoose from 'mongoose';
import { logger } from '../utils/logger';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/leetclone';

export const connectDatabase = async (): Promise<void> => {
    try {
        await mongoose.connect(MONGODB_URI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        logger.info('MongoDB connected successfully');

        mongoose.connection.on('error', (error) => {
            logger.error('MongoDB connection error:', error);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected. Attempting to reconnect...');
        });

    } catch (error) {
        logger.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
};

export const disconnectDatabase = async (): Promise<void> => {
    try {
        await mongoose.connection.close();
        logger.info('MongoDB disconnected successfully');
    } catch (error) {
        logger.error('Error disconnecting from MongoDB:', error);
    }
};
