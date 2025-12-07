import { Problem } from '../../models/Problem';
import { Submission, ISubmission } from '../../models/Submission';
import { Judge0Runner } from './runners/judge0Runner';
import { SQLRunner } from './runners/sqlRunner';
import { PandasRunner } from './runners/pandasRunner';
import { VerdictResolver } from './verdictLogic';
import { logger } from '../../utils/logger';
import { emitSubmissionUpdate } from '../../websocket/submissionUpdates';

export class EvaluatorService {
    private judge0Runner: Judge0Runner;
    private sqlRunner: SQLRunner;
    private pandasRunner: PandasRunner;

    constructor() {
        this.judge0Runner = new Judge0Runner();
        this.sqlRunner = new SQLRunner();
        this.pandasRunner = new PandasRunner();
    }

    async evaluateSubmission(submissionId: string): Promise<void> {
        try {
            const submission = await Submission.findById(submissionId).populate('problemId');
            if (!submission) {
                logger.error(`Submission ${submissionId} not found`);
                return;
            }

            const problem = await Problem.findById(submission.problemId);
            if (!problem) {
                logger.error(`Problem ${submission.problemId} not found`);
                await this.updateSubmissionStatus(submission, 'FAILED', 'INTERNAL_ERROR');
                return;
            }

            logger.info(`Evaluating submission ${submissionId} for problem ${problem.slug}`);

            // Update status to COMPILING
            await this.updateSubmissionStatus(submission, 'COMPILING');
            emitSubmissionUpdate(submission._id.toString(), {
                status: 'COMPILING',
                progress: 0,
                message: 'Compiling your code...',
            });

            // Determine runner based on language and domain
            let evaluationResult;

            if (submission.language === 'sql') {
                // SQL runner
                if (!problem.datasetId) {
                    throw new Error('SQL problem missing dataset');
                }

                await this.updateSubmissionStatus(submission, 'RUNNING');
                emitSubmissionUpdate(submission._id.toString(), {
                    status: 'RUNNING',
                    progress: 10,
                    message: 'Running SQL queries...',
                });

                evaluationResult = await this.sqlRunner.run(
                    submission.code,
                    problem.testcases,
                    problem.datasetId,
                    problem.timeLimitPerTestMs
                );

            } else if (submission.language === 'pandas') {
                // Pandas runner
                if (!problem.datasetId) {
                    throw new Error('Pandas problem missing dataset');
                }

                await this.updateSubmissionStatus(submission, 'RUNNING');
                emitSubmissionUpdate(submission._id.toString(), {
                    status: 'RUNNING',
                    progress: 10,
                    message: 'Running Pandas code...',
                });

                evaluationResult = await this.pandasRunner.run(
                    submission.code,
                    problem.testcases,
                    problem.datasetId,
                    problem.timeLimitPerTestMs
                );

            } else {
                // DSA languages (cpp, java, python)
                evaluationResult = await this.judge0Runner.compileAndRun(
                    submission.code,
                    submission.language,
                    problem.testcases,
                    problem.timeLimitPerTestMs,
                    problem.memoryLimitMb
                );
            }

            // Check for compilation error
            if (evaluationResult.compileOutput) {
                await this.handleCompilationError(submission, evaluationResult.compileOutput);
                return;
            }

            // Process testcase results
            await this.processTestcaseResults(submission, problem, evaluationResult.results);

        } catch (error) {
            logger.error(`Error evaluating submission ${submissionId}:`, error);
            const submission = await Submission.findById(submissionId);
            if (submission) {
                await this.updateSubmissionStatus(submission, 'FAILED', 'INTERNAL_ERROR');
                emitSubmissionUpdate(submissionId, {
                    status: 'COMPLETED',
                    verdict: 'INTERNAL_ERROR',
                    message: 'An error occurred during evaluation',
                });
            }
        }
    }

    private async handleCompilationError(
        submission: ISubmission,
        compileOutput: string
    ): Promise<void> {
        submission.status = 'COMPLETED';
        submission.verdict = 'COMPILATION_ERROR';
        submission.compileOutput = compileOutput;
        submission.completedAt = new Date();
        await submission.save();

        emitSubmissionUpdate(submission._id.toString(), {
            status: 'COMPLETED',
            verdict: 'COMPILATION_ERROR',
            compileOutput,
            message: 'Compilation failed',
        });
    }

    private async processTestcaseResults(
        submission: ISubmission,
        problem: any,
        results: any[]
    ): Promise<void> {
        submission.results = results;
        submission.totalTests = results.length;
        submission.totalPassed = results.filter((r) => r.status === 'PASSED').length;
        submission.totalRuntimeMs = results.reduce((sum, r) => sum + r.runtimeMs, 0);

        // Resolve verdict
        const testcaseStatuses = results.map((r) => r.status);
        submission.verdict = VerdictResolver.resolve(testcaseStatuses, false);

        submission.status = 'COMPLETED';
        submission.completedAt = new Date();

        await submission.save();

        // Update problem statistics
        await this.updateProblemStats(problem, submission.verdict);

        // Emit final update
        emitSubmissionUpdate(submission._id.toString(), {
            status: 'COMPLETED',
            verdict: submission.verdict,
            totalTests: submission.totalTests,
            totalPassed: submission.totalPassed,
            totalRuntimeMs: submission.totalRuntimeMs,
            results: submission.results,
            message: `Evaluation completed: ${submission.verdict}`,
        });

        logger.info(`Submission ${submission._id} evaluated: ${submission.verdict}`);
    }

    private async updateSubmissionStatus(
        submission: ISubmission,
        status: any,
        verdict?: any
    ): Promise<void> {
        submission.status = status;
        if (verdict) {
            submission.verdict = verdict;
        }
        await submission.save();
    }

    private async updateProblemStats(problem: any, verdict: string): Promise<void> {
        problem.totalSubmissions += 1;

        if (verdict === 'ACCEPTED') {
            problem.totalAccepted += 1;
        }

        if (problem.totalSubmissions > 0) {
            problem.acceptanceRate = (problem.totalAccepted / problem.totalSubmissions) * 100;
        }

        await problem.save();
    }
}
