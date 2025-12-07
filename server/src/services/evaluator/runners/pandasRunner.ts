import { ITestcase } from '../../models/Problem';
import { Dataset } from '../../models/Dataset';
import { OutputComparator } from '../comparators';
import { ExecutionResult } from './judge0Runner';
import { logger } from '../../../utils/logger';
import { promises as fs } from 'fs';
import path from 'path';
import { Types } from 'mongoose';
import { spawn } from 'child_process';

export class PandasRunner {
    async run(
        pandasCode: string,
        testcases: ITestcase[],
        datasetId: Types.ObjectId,
        timeLimitMs: number
    ): Promise<{ results: ExecutionResult[]; compileOutput?: string }> {
        const results: ExecutionResult[] = [];

        try {
            // Fetch dataset
            const dataset = await Dataset.findById(datasetId);
            if (!dataset) {
                throw new Error('Dataset not found');
            }

            // Process each testcase
            for (const testcase of testcases) {
                const startTime = Date.now();

                try {
                    const result = await this.runSingleTestcase(
                        pandasCode,
                        testcase,
                        dataset,
                        timeLimitMs
                    );

                    const runtimeMs = Date.now() - startTime;
                    result.runtimeMs = runtimeMs;

                    results.push(result);

                } catch (error: any) {
                    logger.error(`Pandas testcase ${testcase.id} error:`, error);
                    results.push({
                        testcaseId: testcase.id,
                        status: 'RE',
                        stdout: '',
                        stderr: error.message || 'Pandas execution error',
                        runtimeMs: Date.now() - startTime,
                        memoryMb: 0,
                    });
                }
            }

            return { results };
        } catch (error: any) {
            logger.error('Pandas runner error:', error);
            throw error;
        }
    }

    private async runSingleTestcase(
        pandasCode: string,
        testcase: ITestcase,
        dataset: any,
        timeLimitMs: number
    ): Promise<ExecutionResult> {
        // Create temporary Python file
        const tempDir = path.join(process.cwd(), 'temp');
        await fs.mkdir(tempDir, { recursive: true });

        const scriptPath = path.join(tempDir, `pandas_${Date.now()}_${Math.random().toString(36).substring(7)}.py`);

        // Build Python script
        const pythonScript = this.buildPythonScript(pandasCode, dataset);

        await fs.writeFile(scriptPath, pythonScript, 'utf-8');

        try {
            const result = await this.executePythonScript(scriptPath, timeLimitMs);

            // Clean up
            await fs.unlink(scriptPath).catch(() => { });

            // Compare output
            const comparison = OutputComparator.compare(
                result.stdout,
                testcase.expectedOutput,
                testcase.comparatorConfig
            );

            return {
                testcaseId: testcase.id,
                status: result.stderr && result.exitCode !== 0 ? 'RE' :
                    comparison.passed ? 'PASSED' : 'FAILED',
                stdout: result.stdout,
                stderr: result.stderr,
                runtimeMs: result.runtimeMs,
                memoryMb: 0,
                diff: comparison.diff,
            };

        } catch (error: any) {
            // Clean up
            await fs.unlink(scriptPath).catch(() => { });
            throw error;
        }
    }

    private buildPythonScript(userCode: string, dataset: any): string {
        let script = 'import pandas as pd\nimport sys\n\n';

        // Create DataFrames from dataset
        for (const table of dataset.tables) {
            const dataDict: Record<string, any[]> = {};

            // Initialize columns
            for (const col of table.columns) {
                dataDict[col.name] = [];
            }

            // Populate rows
            for (const row of table.rows) {
                for (const col of table.columns) {
                    dataDict[col.name].push(row[col.name]);
                }
            }

            const dataStr = JSON.stringify(dataDict);
            script += `${table.name} = pd.DataFrame(${dataStr})\n`;
        }

        script += '\n# User code\n';
        script += userCode;
        script += '\n\n# Output result_df as CSV\n';
        script += 'if "result_df" in locals():\n';
        script += '    print(result_df.to_csv(index=False, header=False))\n';
        script += 'else:\n';
        script += '    print("Error: result_df not defined", file=sys.stderr)\n';
        script += '    sys.exit(1)\n';

        return script;
    }

    private executePythonScript(
        scriptPath: string,
        timeLimitMs: number
    ): Promise<{ stdout: string; stderr: string; exitCode: number; runtimeMs: number }> {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const pythonProcess = spawn('python', [scriptPath]);

            let stdout = '';
            let stderr = '';
            let didTimeout = false;

            const timeout = setTimeout(() => {
                didTimeout = true;
                pythonProcess.kill();
            }, timeLimitMs);

            pythonProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            pythonProcess.on('close', (code) => {
                clearTimeout(timeout);
                const runtimeMs = Date.now() - startTime;

                if (didTimeout) {
                    resolve({
                        stdout: '',
                        stderr: 'Time limit exceeded',
                        exitCode: -1,
                        runtimeMs: timeLimitMs,
                    });
                } else {
                    resolve({
                        stdout: stdout.trim(),
                        stderr: stderr.trim(),
                        exitCode: code || 0,
                        runtimeMs,
                    });
                }
            });

            pythonProcess.on('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }
}
