import { ITestcase } from '../../models/Problem';
import { Dataset } from '../../models/Dataset';
import { OutputComparator } from '../comparators';
import { ExecutionResult } from './judge0Runner';
import { logger } from '../../../utils/logger';
import { promises as fs } from 'fs';
import path from 'path';
import { Types } from 'mongoose';

export class SQLRunner {
    async run(
        sqlQuery: string,
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
                    // Create ephemeral SQLite database
                    const dbPath = path.join(process.cwd(), 'temp', `sql_${Date.now()}_${Math.random().toString(36).substring(7)}.db`);
                    await fs.mkdir(path.dirname(dbPath), { recursive: true });

                    const result = await this.runSingleTestcase(
                        sqlQuery,
                        testcase,
                        dataset,
                        dbPath,
                        timeLimitMs
                    );

                    const runtimeMs = Date.now() - startTime;
                    result.runtimeMs = runtimeMs;

                    results.push(result);

                    // Clean up database file
                    try {
                        await fs.unlink(dbPath);
                    } catch (err) {
                        // Ignore cleanup errors
                    }

                } catch (error: any) {
                    logger.error(`SQL testcase ${testcase.id} error:`, error);
                    results.push({
                        testcaseId: testcase.id,
                        status: 'RE',
                        stdout: '',
                        stderr: error.message || 'SQL execution error',
                        runtimeMs: Date.now() - startTime,
                        memoryMb: 0,
                    });
                }
            }

            return { results };
        } catch (error: any) {
            logger.error('SQL runner error:', error);
            throw error;
        }
    }

    private async runSingleTestcase(
        sqlQuery: string,
        testcase: ITestcase,
        dataset: any,
        dbPath: string,
        timeLimitMs: number
    ): Promise<ExecutionResult> {
        return new Promise((resolve) => {
            const sqlite3 = require('sqlite3').verbose();
            const db = new sqlite3.Database(dbPath);

            const timeout = setTimeout(() => {
                db.close();
                resolve({
                    testcaseId: testcase.id,
                    status: 'TLE',
                    stdout: '',
                    stderr: 'Time limit exceeded',
                    runtimeMs: timeLimitMs,
                    memoryMb: 0,
                });
            }, timeLimitMs);

            // Serialize database operations
            db.serialize(() => {
                try {
                    // Create tables and insert data
                    for (const table of dataset.tables) {
                        // Create table
                        const columnDefs = table.columns
                            .map((col: any) => `${col.name} ${col.type}`)
                            .join(', ');

                        const createTableSQL = `CREATE TABLE ${table.name} (${columnDefs})`;
                        db.run(createTableSQL);

                        // Insert rows
                        if (table.rows && table.rows.length > 0) {
                            const columns = table.columns.map((col: any) => col.name).join(', ');
                            const placeholders = table.columns.map(() => '?').join(', ');
                            const insertSQL = `INSERT INTO ${table.name} (${columns}) VALUES (${placeholders})`;

                            const stmt = db.prepare(insertSQL);
                            for (const row of table.rows) {
                                const values = table.columns.map((col: any) => row[col.name]);
                                stmt.run(values);
                            }
                            stmt.finalize();
                        }
                    }

                    // Execute user query
                    db.all(sqlQuery, [], (err: any, rows: any) => {
                        clearTimeout(timeout);

                        if (err) {
                            db.close();
                            resolve({
                                testcaseId: testcase.id,
                                status: 'RE',
                                stdout: '',
                                stderr: err.message,
                                runtimeMs: 0,
                                memoryMb: 0,
                            });
                            return;
                        }

                        // Format output as table
                        const stdout = this.formatSQLResult(rows);

                        // Compare with expected output
                        const comparison = OutputComparator.compare(
                            stdout,
                            testcase.expectedOutput,
                            testcase.comparatorConfig
                        );

                        db.close();

                        resolve({
                            testcaseId: testcase.id,
                            status: comparison.passed ? 'PASSED' : 'FAILED',
                            stdout,
                            stderr: '',
                            runtimeMs: 0, // Will be set by caller
                            memoryMb: 0,
                            diff: comparison.diff,
                        });
                    });

                } catch (error: any) {
                    clearTimeout(timeout);
                    db.close();
                    resolve({
                        testcaseId: testcase.id,
                        status: 'RE',
                        stdout: '',
                        stderr: error.message || 'SQL execution error',
                        runtimeMs: 0,
                        memoryMb: 0,
                    });
                }
            });
        });
    }

    private formatSQLResult(rows: any[]): string {
        if (!rows || rows.length === 0) {
            return '';
        }

        // Format as pipe-separated values
        return rows
            .map(row => {
                return Object.values(row).join('|');
            })
            .join('\n');
    }
}
