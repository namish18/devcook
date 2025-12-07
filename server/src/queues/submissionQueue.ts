import { Queue } from 'bullmq';
import { createRedisConnection } from '../config/redis';
import { logger } from '../utils/logger';

const connection = createRedisConnection();

export const submissionQueue = new Queue('submission-evaluation', {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        removeOnComplete: {
            count: 100, // Keep last 100 completed jobs
            age: 24 * 3600, // Keep for 24 hours
        },
        removeOnFail: {
            count: 500, // Keep last 500 failed jobs
            age: 7 * 24 * 3600, // Keep for 7 days
        },
    },
});

export interface SubmissionJobData {
    submissionId: string;
    userId: string;
    problemId: string;
}

export const addSubmissionJob = async (
    submissionId: string,
    userId: string,
    problemId: string,
    priority?: number
): Promise<void> => {
    try {
        await submissionQueue.add(
            'evaluate',
            {
                submissionId,
                userId,
                problemId,
            } as SubmissionJobData,
            {
                priority: priority || 10, // Default priority
                jobId: submissionId, // Use submission ID as job ID to prevent duplicates
            }
        );

        logger.info(`Added submission job ${submissionId} to queue`);
    } catch (error) {
        logger.error('Error adding submission job to queue:', error);
        throw error;
    }
};

// Queue event listeners
submissionQueue.on('error', (error) => {
    logger.error('Submission queue error:', error);
});

submissionQueue.on('waiting', (data) => {
    logger.debug(`Job waiting: ${data.jobId}`);
});

submissionQueue.on('active', (data) => {
    logger.debug(`Job active: ${data.jobId}`);
});

submissionQueue.on('completed', (data) => {
    logger.info(`Job completed: ${data.jobId}`);
});

submissionQueue.on('failed', (data, error) => {
    logger.error(`Job failed: ${data.jobId}`, error);
});
