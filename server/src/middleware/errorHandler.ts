import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}

export const errorHandler = (
    err: AppError,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';

    logger.error('Error occurred:', {
        statusCode,
        message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });

    // Don't leak error details in production
    const response: any = {
        error: message,
    };

    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
    }

    res.status(statusCode).json(response);
};

export const notFoundHandler = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    res.status(404).json({
        error: `Route ${req.originalUrl} not found`,
    });
};

export class ValidationError extends Error {
    statusCode = 400;
    isOperational = true;

    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class UnauthorizedError extends Error {
    statusCode = 401;
    isOperational = true;

    constructor(message: string = 'Unauthorized') {
        super(message);
        this.name = 'UnauthorizedError';
    }
}

export class ForbiddenError extends Error {
    statusCode = 403;
    isOperational = true;

    constructor(message: string = 'Forbidden') {
        super(message);
        this.name = 'ForbiddenError';
    }
}

export class NotFoundError extends Error {
    statusCode = 404;
    isOperational = true;

    constructor(message: string = 'Resource not found') {
        super(message);
        this.name = 'NotFoundError';
    }
}
