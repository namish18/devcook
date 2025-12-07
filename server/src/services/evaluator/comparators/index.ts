import { IComparatorConfig } from '../models/Problem';
import { logger } from '../utils/logger';

export interface ComparisonResult {
    passed: boolean;
    diff?: string;
}

export class OutputComparator {
    static compare(
        actual: string,
        expected: string,
        config: IComparatorConfig
    ): ComparisonResult {
        switch (config.type) {
            case 'exact':
                return this.exactCompare(actual, expected, config);
            case 'token':
                return this.tokenCompare(actual, expected, config);
            case 'table':
                return this.tableCompare(actual, expected, config);
            default:
                return this.exactCompare(actual, expected, config);
        }
    }

    private static exactCompare(
        actual: string,
        expected: string,
        config: IComparatorConfig
    ): ComparisonResult {
        let processedActual = actual;
        let processedExpected = expected;

        if (config.trimWhitespace) {
            processedActual = this.normalizeWhitespace(processedActual);
            processedExpected = this.normalizeWhitespace(processedExpected);
        }

        if (config.ignoreCase) {
            processedActual = processedActual.toLowerCase();
            processedExpected = processedExpected.toLowerCase();
        }

        const passed = processedActual === processedExpected;

        return {
            passed,
            diff: passed ? undefined : this.generateDiff(processedActual, processedExpected),
        };
    }

    private static tokenCompare(
        actual: string,
        expected: string,
        config: IComparatorConfig
    ): ComparisonResult {
        let processedActual = actual;
        let processedExpected = expected;

        if (config.trimWhitespace) {
            processedActual = this.normalizeWhitespace(processedActual);
            processedExpected = this.normalizeWhitespace(processedExpected);
        }

        const actualTokens = processedActual.split(/\s+/).filter(t => t.length > 0);
        const expectedTokens = processedExpected.split(/\s+/).filter(t => t.length > 0);

        if (actualTokens.length !== expectedTokens.length) {
            return {
                passed: false,
                diff: `Token count mismatch: expected ${expectedTokens.length}, got ${actualTokens.length}`,
            };
        }

        for (let i = 0; i < actualTokens.length; i++) {
            let actualToken = actualTokens[i];
            let expectedToken = expectedTokens[i];

            if (config.ignoreCase) {
                actualToken = actualToken.toLowerCase();
                expectedToken = expectedToken.toLowerCase();
            }

            if (actualToken !== expectedToken) {
                return {
                    passed: false,
                    diff: `Token mismatch at position ${i}: expected "${expectedToken}", got "${actualToken}"`,
                };
            }
        }

        return { passed: true };
    }

    private static tableCompare(
        actual: string,
        expected: string,
        config: IComparatorConfig
    ): ComparisonResult {
        try {
            const actualLines = actual.trim().split('\n').filter(l => l.trim().length > 0);
            const expectedLines = expected.trim().split('\n').filter(l => l.trim().length > 0);

            if (config.orderSensitive) {
                // Order-sensitive comparison
                if (actualLines.length !== expectedLines.length) {
                    return {
                        passed: false,
                        diff: `Row count mismatch: expected ${expectedLines.length} rows, got ${actualLines.length} rows`,
                    };
                }

                for (let i = 0; i < actualLines.length; i++) {
                    const actualRow = this.normalizeRow(actualLines[i], config);
                    const expectedRow = this.normalizeRow(expectedLines[i], config);

                    if (actualRow !== expectedRow) {
                        return {
                            passed: false,
                            diff: `Row ${i + 1} mismatch:\nExpected: ${expectedRow}\nActual:   ${actualRow}`,
                        };
                    }
                }
            } else {
                // Order-insensitive comparison
                const actualSet = new Set(actualLines.map(l => this.normalizeRow(l, config)));
                const expectedSet = new Set(expectedLines.map(l => this.normalizeRow(l, config)));

                if (actualSet.size !== expectedSet.size) {
                    return {
                        passed: false,
                        diff: `Row count mismatch: expected ${expectedSet.size} unique rows, got ${actualSet.size} unique rows`,
                    };
                }

                for (const expectedRow of expectedSet) {
                    if (!actualSet.has(expectedRow)) {
                        return {
                            passed: false,
                            diff: `Missing expected row: ${expectedRow}`,
                        };
                    }
                }
            }

            return { passed: true };
        } catch (error) {
            logger.error('Table comparison error:', error);
            return {
                passed: false,
                diff: 'Error comparing table outputs',
            };
        }
    }

    private static normalizeWhitespace(str: string): string {
        // Normalize line endings and trim trailing whitespace
        return str
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .split('\n')
            .map(line => line.trimEnd())
            .join('\n')
            .trim();
    }

    private static normalizeRow(row: string, config: IComparatorConfig): string {
        let normalized = row.trim();

        if (config.trimWhitespace) {
            // Normalize multiple spaces to single space
            normalized = normalized.replace(/\s+/g, ' ');
        }

        if (config.ignoreCase) {
            normalized = normalized.toLowerCase();
        }

        return normalized;
    }

    private static generateDiff(actual: string, expected: string): string {
        const actualLines = actual.split('\n');
        const expectedLines = expected.split('\n');

        let diff = 'Diff:\n';
        const maxLines = Math.max(actualLines.length, expectedLines.length);

        for (let i = 0; i < Math.min(maxLines, 10); i++) {
            const actualLine = actualLines[i] || '';
            const expectedLine = expectedLines[i] || '';

            if (actualLine !== expectedLine) {
                diff += `Line ${i + 1}:\n`;
                diff += `  Expected: ${expectedLine}\n`;
                diff += `  Actual:   ${actualLine}\n`;
            }
        }

        if (maxLines > 10) {
            diff += `... (${maxLines - 10} more lines)\n`;
        }

        return diff;
    }
}
