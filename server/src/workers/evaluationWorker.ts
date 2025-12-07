import { Worker, Job } from 'bullmq';
import { createRedisConnection } from '../config/redis';
import { EvaluatorService } from '../services/evaluator';
import { SubmissionJobData } from '../queues/submissionQueue';
import { logger } from '../utils/logger';

const connection = createRedisConnection();
const evaluatorService = new EvaluatorService();

const CONCURRENT_JOBS_PER_USER = parseInt(process.env.CONCURRENT_JOBS_PER_USER || '3', 10);

// Track concurrent jobs per user
const userJobCounts = new Map<string, number>();

export const evaluationWorker = new Worker<SubmissionJobData>(
    'submission-evaluation',
    async (job: Job<SubmissionJobData>) => {
        const { submissionId, userId } = job.data;

        logger.info(`Processing submission ${submissionId} for user ${userId}`);

        // Check user concurrency limit
        const currentCount = userJobCounts.get(userId) || 0;
        if (currentCount >= CONCURRENT_JOBS_PER_USER) {
            logger.warn(`User ${userId} has too many concurrent jobs, delaying...`);
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        }

        // Increment counter
        userJobCounts.set(userId, currentCount + 1);

        try {
            await evaluatorService.evaluateSubmission(submissionId);
            logger.info(`Completed evaluating submission ${submissionId}`);
        } catch (error) {
            logger.error(`Error processing submission ${submissionId}:`, error);
            throw error; // Will trigger retry
        } finally {
            // Decrement counter
            const newCount = (userJobCounts.get(userId) || 1) - 1;
            if (newCount <= 0) {
                userJobCounts.delete(userId);
            } else {
                userJobCounts.set(userId, newCount);
            }
        }
    },
    {
        connection,
        concurrency: 5, // Process up to 5 jobs concurrently
        limiter: {
            max: 10, // Max 10 jobs
            duration: 1000, // per second
        },
    }
);

evaluationWorker.on('completed', (job) => {
    logger.info(`Worker completed job ${job.id}`);
});

evaluationWorker.on('failed', (job, error) => {
    logger.error(`Worker failed job ${job?.id}:`, error);
});

evaluationWorker.on('error', (error) => {
    logger.error('Worker error:', error);
});

logger.info('Evaluation worker started');

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, closing worker...');
    await evaluationWorker.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received, closing worker...');
    await evaluationWorker.close();
    process.exit(0);
});
