import rateLimit from 'express-rate-limit';

const SUBMISSION_RATE_LIMIT = parseInt(process.env.SUBMISSION_RATE_LIMIT || '10', 10);
const SUBMISSION_RATE_WINDOW_MS = parseInt(process.env.SUBMISSION_RATE_WINDOW_MS || '60000', 10);

// General API rate limiter
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

// Submission rate limiter (per user)
export const submissionLimiter = rateLimit({
    windowMs: SUBMISSION_RATE_WINDOW_MS,
    max: SUBMISSION_RATE_LIMIT,
    message: `Too many submissions. Limit is ${SUBMISSION_RATE_LIMIT} submissions per minute`,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) => {
        // Use userId if authenticated, otherwise IP
        return req.userId || req.ip;
    },
});

// Auth rate limiter (stricter)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // 5 login attempts per 15 minutes
    message: 'Too many authentication attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});
