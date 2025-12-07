import { createJudge0Client, LANGUAGE_IDS, EXECUTION_LIMITS } from '../../config/judge0';
import { ITestcase } from '../../models/Problem';
import { ITestcaseResult, TestcaseStatus } from '../../models/Submission';
import { OutputComparator } from './comparators';
import { logger } from '../../utils/logger';
import axios, { AxiosInstance } from 'axios';

export interface CompilationResult {
    success: boolean;
    output?: string;
    error?: string;
}

export interface ExecutionResult {
    testcaseId: string;
    status: TestcaseStatus;
    stdout: string;
    stderr: string;
    runtimeMs: number;
    memoryMb: number;
    exitCode?: number;
    diff?: string;
}

export class Judge0Runner {
    private client: AxiosInstance;

    constructor() {
        this.client = createJudge0Client();
    }

    async compileAndRun(
        code: string,
        language: string,
        testcases: ITestcase[],
        timeLimitMs: number,
        memoryLimitMb: number
    ): Promise<{ results: ExecutionResult[]; compileOutput?: string }> {
        const languageId = this.getLanguageId(language);
        const results: ExecutionResult[] = [];
        let compileOutput: string | undefined;

        // For interpreted languages, run directly
        // For compiled languages, needs compilation first (Judge0 handles this)

        for (const testcase of testcases) {
            try {
                const result = await this.runTestcase(
                    code,
                    languageId,
                    testcase,
                    timeLimitMs / 1000, // Convert to seconds
                    memoryLimitMb * 1024 // Convert to KB
                );

                // Check if compilation failed
                if (result.status?.id === 6) { // Compilation Error
                    compileOutput = result.compile_output || result.stderr || 'Compilation failed';

                    // Mark all testcases as failed due to compilation error
                    for (const tc of testcases) {
                        results.push({
                            testcaseId: tc.id,
                            status: 'RE',
                            stdout: '',
                            stderr: compileOutput,
                            runtimeMs: 0,
                            memoryMb: 0,
                        });
                    }

                    break;
                }

                // Process execution result
                const executionResult = this.processExecutionResult(result, testcase);
                results.push(executionResult);

            } catch (error) {
                logger.error(`Error running testcase ${testcase.id}:`, error);
                results.push({
                    testcaseId: testcase.id,
                    status: 'RE',
                    stdout: '',
                    stderr: 'Internal error during execution',
                    runtimeMs: 0,
                    memoryMb: 0,
                });
            }
        }

        return { results, compileOutput };
    }

    private async runTestcase(
        code: string,
        languageId: number,
        testcase: ITestcase,
        timeLimitSec: number,
        memoryLimitKb: number
    ): Promise<any> {
        // Create submission
        const submissionData = {
            source_code: Buffer.from(code).toString('base64'),
            language_id: languageId,
            stdin: Buffer.from(testcase.input).toString('base64'),
            expected_output: Buffer.from(testcase.expectedOutput).toString('base64'),
            cpu_time_limit: timeLimitSec,
            memory_limit: memoryLimitKb,
        };

        const createResponse = await this.client.post('/submissions?base64_encoded=true&wait=true', submissionData);
        const token = createResponse.data.token;

        // Poll for result (Judge0 with wait=true should return result immediately)
        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
            const resultResponse = await this.client.get(`/submissions/${token}?base64_encoded=true`);
            const result = resultResponse.data;

            // Check if processing is complete
            if (result.status.id > 2) { // Status > 2 means completed (either success or error)
                // Decode base64 outputs
                if (result.stdout) {
                    result.stdout = Buffer.from(result.stdout, 'base64').toString('utf-8');
                }
                if (result.stderr) {
                    result.stderr = Buffer.from(result.stderr, 'base64').toString('utf-8');
                }
                if (result.compile_output) {
                    result.compile_output = Buffer.from(result.compile_output, 'base64').toString('utf-8');
                }

                return result;
            }

            // Wait before polling again
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }

        throw new Error('Execution timeout: Judge0 did not return result in time');
    }

    private processExecutionResult(judgeResult: any, testcase: ITestcase): ExecutionResult {
        const statusId = judgeResult.status?.id;
        const stdout = judgeResult.stdout || '';
        const stderr = judgeResult.stderr || '';
        const runtimeMs = (parseFloat(judgeResult.time) || 0) * 1000;
        const memoryMb = (parseInt(judgeResult.memory) || 0) / 1024;

        let status: TestcaseStatus;
        let diff: string | undefined;

        // Judge0 status IDs:
        // 3 = Accepted
        // 4 = Wrong Answer
        // 5 = Time Limit Exceeded
        // 6 = Compilation Error
        // 7-12 = Runtime errors
        // 13 = Internal Error
        // 14 = Exec Format Error

        if (statusId === 5) {
            status = 'TLE';
        } else if (statusId === 6) {
            status = 'RE';
        } else if (statusId >= 7 && statusId <= 12) {
            status = 'RE';
        } else if (statusId === 3 || statusId === 4) {
            // Compare output
            const comparison = OutputComparator.compare(
                stdout,
                testcase.expectedOutput,
                testcase.comparatorConfig
            );

            status = comparison.passed ? 'PASSED' : 'FAILED';
            diff = comparison.diff;
        } else {
            status = 'RE';
        }

        return {
            testcaseId: testcase.id,
            status,
            stdout,
            stderr,
            runtimeMs,
            memoryMb,
            exitCode: judgeResult.exit_code,
            diff,
        };
    }

    private getLanguageId(language: string): number {
        const languageMap: Record<string, number> = {
            cpp: LANGUAGE_IDS.cpp,
            java: LANGUAGE_IDS.java,
            python: LANGUAGE_IDS.python,
            javascript: LANGUAGE_IDS.javascript,
        };

        return languageMap[language] || LANGUAGE_IDS.python;
    }
}
