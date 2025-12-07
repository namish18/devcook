import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { initializeWebSocket } from './websocket';
import { apiLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Routes
import authRoutes from './routes/auth';
import problemRoutes from './routes/problems';
import submissionRoutes from './routes/submissions';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

const app: Express = express();
const httpServer = http.createServer(app);

// Middleware
app.use(helmet());
app.use(cors({
    origin: CORS_ORIGIN,
    credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Apply rate limiting
app.use('/api', apiLimiter);

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Initialize services
const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDatabase();

        // Initialize WebSocket
        initializeWebSocket(httpServer);

        // Start server
        httpServer.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
            logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    httpServer.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully...');
    httpServer.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});

// Start the server
startServer();

export default app;
