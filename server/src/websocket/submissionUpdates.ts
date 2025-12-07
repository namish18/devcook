import { getIO } from './index';
import { logger } from '../utils/logger';

export interface SubmissionUpdate {
    status: string;
    progress?: number;
    message?: string;
    verdict?: string;
    compileOutput?: string;
    totalTests?: number;
    totalPassed?: number;
    totalRuntimeMs?: number;
    results?: any[];
    testcaseUpdate?: {
        testcaseId: string;
        status: string;
        current: number;
        total: number;
    };
}

export const emitSubmissionUpdate = (
    submissionId: string,
    update: SubmissionUpdate
): void => {
    try {
        const io = getIO();
        io.to(`submission:${submissionId}`).emit('submission:update', {
            submissionId,
            ...update,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        logger.error('Error emitting submission update:', error);
    }
};

export const emitTestcaseProgress = (
    submissionId: string,
    testcaseId: string,
    status: string,
    current: number,
    total: number
): void => {
    emitSubmissionUpdate(submissionId, {
        status: 'RUNNING',
        progress: Math.floor((current / total) * 90) + 10, // 10-100%
        message: `Running test ${current}/${total}`,
        testcaseUpdate: {
            testcaseId,
            status,
            current,
            total,
        },
    });
};
