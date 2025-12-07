import { Verdict, TestcaseStatus } from '../../models/Submission';

export class VerdictResolver {
    static resolve(
        testcaseStatuses: TestcaseStatus[],
        hasCompilationError: boolean,
        compileOutput?: string
    ): Verdict {
        // Compilation Error has highest priority
        if (hasCompilationError) {
            return 'COMPILATION_ERROR';
        }

        // Check for Runtime Errors
        if (testcaseStatuses.some(status => status === 'RE')) {
            return 'RUNTIME_ERROR';
        }

        // Check for Time Limit Exceeded
        if (testcaseStatuses.some(status => status === 'TLE')) {
            return 'TIME_LIMIT_EXCEEDED';
        }

        // Check for Memory Limit Exceeded
        if (testcaseStatuses.some(status => status === 'MLE')) {
            return 'MEMORY_LIMIT_EXCEEDED';
        }

        // Check for Wrong Answer
        if (testcaseStatuses.some(status => status === 'FAILED')) {
            return 'WRONG_ANSWER';
        }

        // All passed
        if (testcaseStatuses.every(status => status === 'PASSED')) {
            return 'ACCEPTED';
        }

        // Fallback
        return 'INTERNAL_ERROR';
    }

    static getFirstFailingTestcase(
        testcaseStatuses: { testcaseId: string; status: TestcaseStatus }[]
    ): { testcaseId: string; status: TestcaseStatus } | undefined {
        return testcaseStatuses.find(t => t.status !== 'PASSED');
    }
}
