import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

let io: SocketIOServer;

export const initializeWebSocket = (httpServer: HTTPServer): SocketIOServer => {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: CORS_ORIGIN,
            credentials: true,
        },
    });

    // Authentication middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication error'));
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
            socket.data.userId = decoded.userId;
            next();
        } catch (error) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        logger.info(`Client connected: ${socket.id}, User: ${socket.data.userId}`);

        // Subscribe to submission updates
        socket.on('subscribe:submission', (submissionId: string) => {
            socket.join(`submission:${submissionId}`);
            logger.debug(`Client ${socket.id} subscribed to submission ${submissionId}`);
        });

        socket.on('unsubscribe:submission', (submissionId: string) => {
            socket.leave(`submission:${submissionId}`);
            logger.debug(`Client ${socket.id} unsubscribed from submission ${submissionId}`);
        });

        socket.on('disconnect', () => {
            logger.info(`Client disconnected: ${socket.id}`);
        });
    });

    logger.info('WebSocket server initialized');
    return io;
};

export const getIO = (): SocketIOServer => {
    if (!io) {
        throw new Error('WebSocket not initialized');
    }
    return io;
};
