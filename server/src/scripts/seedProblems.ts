import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Problem } from '../models/Problem';
import { Dataset } from '../models/Dataset';
import { User } from '../models/User';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/leetclone';

async function seedProblems() {
    try {
        await mongoose.connect(MONGODB_URI);
        logger.info('Connected to MongoDB for seeding');

        // Create admin user
        const adminEmail = 'admin@leetclone.com';
        let admin = await User.findOne({ email: adminEmail });

        if (!admin) {
            const passwordHash = await bcrypt.hash('admin123', 10);
            admin = new User({
                email: adminEmail,
                passwordHash,
                displayName: 'Admin',
                role: 'ADMIN',
            });
            await admin.save();
            logger.info('Created admin user');
        }

        // Clear existing problems
        await Problem.deleteMany({});
        await Dataset.deleteMany({});
        logger.info('Cleared existing problems and datasets');

        // Problem 1: Two Sum Unique Pairs
        const twoSumProblem = new Problem({
            title: 'Two Sum Unique Pairs',
            slug: 'two-sum-unique-pairs',
            domain: 'DSA',
            difficulty: 'Easy',
            description: `Given an array of integers \`nums\` and an integer \`target\`, return the list of unique pairs (a,b) such that a + b == target.

Each pair must be ordered with the smaller value first and the list of pairs sorted lexicographically. Duplicates in input may exist but each distinct pair value should appear only once.

**Output format**: print each pair on its own line as "a b". If no pairs exist, print an empty line.`,
            examples: [
                {
                    input: 'nums = [2,7,11,15], target = 9',
                    output: '2 7',
                    explanation: 'Only 2 and 7 sum to 9',
                },
                {
                    input: 'nums = [3,3,3], target = 6',
                    output: '3 3',
                    explanation: 'The pair (3,3) sums to 6',
                },
            ],
            constraints: [
                '1 <= nums.length <= 10^5',
                'Values fit 32-bit signed integers',
            ],
            allowedLanguages: ['cpp', 'java', 'python'],
            timeLimitPerTestMs: 2000,
            memoryLimitMb: 256,
            testcases: [
                {
                    id: 'tc1',
                    input: '4\n2 7 11 15\n9',
                    expectedOutput: '2 7',
                    isPublic: true,
                    weight: 1,
                    comparatorConfig: { type: 'exact', trimWhitespace: true, orderSensitive: true },
                },
                {
                    id: 'tc2',
                    input: '3\n3 3 3\n6',
                    expectedOutput: '3 3',
                    isPublic: true,
                    weight: 1,
                    comparatorConfig: { type: 'exact', trimWhitespace: true, orderSensitive: true },
                },
                {
                    id: 'tc3',
                    input: '5\n1 2 3 4 5\n10',
                    expectedOutput: '',
                    isPublic: true,
                    weight: 1,
                    comparatorConfig: { type: 'exact', trimWhitespace: true, orderSensitive: true },
                },
                {
                    id: 'tc4',
                    input: '5\n0 -1 2 -3 1\n-2',
                    expectedOutput: '-3 1',
                    isPublic: false,
                    weight: 1,
                    comparatorConfig: { type: 'exact', trimWhitespace: true, orderSensitive: true },
                },
                {
                    id: 'tc5',
                    input: '5\n5 5 0 0 5\n5',
                    expectedOutput: '0 5',
                    isPublic: false,
                    weight: 1,
                    comparatorConfig: { type: 'exact', trimWhitespace: true, orderSensitive: true },
                },
                {
                    id: 'tc6',
                    input: '3\n1000000000 -1000000000 0\n0',
                    expectedOutput: '-1000000000 1000000000',
                    isPublic: false,
                    weight: 1,
                    comparatorConfig: { type: 'exact', trimWhitespace: true, orderSensitive: true },
                },
            ],
            tags: ['arrays', 'hashing', 'two-pointers'],
            createdBy: admin._id,
        });
        await twoSumProblem.save();
        logger.info('Created problem: Two Sum Unique Pairs');

        // Problem 2: Longest Increasing Subarray Length
        const longestIncreasingProblem = new Problem({
            title: 'Longest Increasing Subarray Length',
            slug: 'longest-increasing-subarray',
            domain: 'DSA',
            difficulty: 'Medium',
            description: `Given an integer array \`nums\`, return the length of the longest strictly increasing contiguous subarray.

This is the classic longest increasing consecutive elements subarray problem.`,
            examples: [
                {
                    input: 'nums = [1,2,3,2,4,5,6]',
                    output: '4',
                    explanation: 'The longest increasing subarray is [2,4,5,6]',
                },
                {
                    input: 'nums = [5,4,3,2]',
                    output: '1',
                    explanation: 'No increasing subarray exists, so minimum length is 1',
                },
            ],
            constraints: [
                '1 <= nums.length <= 10^5',
            ],
            allowedLanguages: ['cpp', 'java', 'python'],
            timeLimitPerTestMs: 2000,
            memoryLimitMb: 256,
            testcases: [
                {
                    id: 'tc1',
                    input: '7\n1 2 3 2 4 5 6',
                    expectedOutput: '4',
                    isPublic: true,
                    weight: 1,
                    comparatorConfig: { type: 'exact', trimWhitespace: true, orderSensitive: true },
                },
                {
                    id: 'tc2',
                    input: '4\n5 4 3 2',
                    expectedOutput: '1',
                    isPublic: true,
                    weight: 1,
                    comparatorConfig: { type: 'exact', trimWhitespace: true, orderSensitive: true },
                },
                {
                    id: 'tc3',
                    input: '1\n1',
                    expectedOutput: '1',
                    isPublic: true,
                    weight: 1,
                    comparatorConfig: { type: 'exact', trimWhitespace: true, orderSensitive: true },
                },
                {
                    id: 'tc4',
                    input: '4\n1 2 2 3',
                    expectedOutput: '2',
                    isPublic: false,
                    weight: 1,
                    comparatorConfig: { type: 'exact', trimWhitespace: true, orderSensitive: true },
                },
                {
                    id: 'tc5',
                    input: '6\n1 2 3 4 5 6',
                    expectedOutput: '6',
                    isPublic: false,
                    weight: 1,
                    comparatorConfig: { type: 'exact', trimWhitespace: true, orderSensitive: true },
                },
                {
                    id: 'tc6',
                    input: '5\n-3 -2 -1 0 1',
                    expectedOutput: '5',
                    isPublic: false,
                    weight: 1,
                    comparatorConfig: { type: 'exact', trimWhitespace: true, orderSensitive: true },
                },
            ],
            tags: ['arrays', 'sliding-window'],
            createdBy: admin._id,
        });
        await longestIncreasingProblem.save();
        logger.info('Created problem: Longest Increasing Subarray');

        // Problem 3: SQL - Active Customers (with dataset)
        const sqlDataset = new Dataset({
            problemId: null as any, // Will set after creating problem
            name: 'Active Customers Dataset',
            type: 'SQL',
            tables: [
                {
                    name: 'customers',
                    columns: [
                        { name: 'id', type: 'INT' },
                        { name: 'name', type: 'TEXT' },
                        { name: 'active', type: 'BOOLEAN' },
                        { name: 'signup_date', type: 'DATE' },
                    ],
                    rows: [], // Will be populated per testcase
                },
            ],
        });

        const sqlProblem = new Problem({
            title: 'SQL - Active Customers',
            slug: 'sql-active-customers',
            domain: 'DB',
            difficulty: 'Easy',
            description: `Given a table \`customers(id INT, name TEXT, active BOOLEAN, signup_date DATE)\`, write an SQL query that returns the \`id\` and \`name\` of customers who are active (active = true) and signed up in the year 2020.

Results should be ordered by \`id\` ascending.`,
            examples: [
                {
                    input: `Customers table:
| id | name    | active | signup_date |
|----|---------|--------|-------------|
| 1  | Alice   | true   | 2020-01-15  |
| 2  | Bob     | false  | 2020-05-20  |
| 3  | Charlie | true   | 2019-12-31  |`,
                    output: `1|Alice`,
                },
            ],
            constraints: [
                'Use standard SQL syntax',
                'Table schema is fixed',
            ],
            allowedLanguages: ['sql'],
            timeLimitPerTestMs: 5000,
            memoryLimitMb: 256,
            testcases: [
                {
                    id: 'tc1',
                    input: '',
                    expectedOutput: '1|Alice',
                    isPublic: true,
                    weight: 1,
                    comparatorConfig: { type: 'table', trimWhitespace: true, orderSensitive: true },
                },
                {
                    id: 'tc2',
                    input: '',
                    expectedOutput: '10|Sam',
                    isPublic: true,
                    weight: 1,
                    comparatorConfig: { type: 'table', trimWhitespace: true, orderSensitive: true },
                },
                {
                    id: 'tc3',
                    input: '',
                    expectedOutput: '',
                    isPublic: true,
                    weight: 1,
                    comparatorConfig: { type: 'table', trimWhitespace: true, orderSensitive: true },
                },
                {
                    id: 'tc4',
                    input: '',
                    expectedOutput: '2|Zack\n3|Yuri',
                    isPublic: false,
                    weight: 1,
                    comparatorConfig: { type: 'table', trimWhitespace: true, orderSensitive: true },
                },
                {
                    id: 'tc5',
                    input: '',
                    expectedOutput: '101|L',
                    isPublic: false,
                    weight: 1,
                    comparatorConfig: { type: 'table', trimWhitespace: true, orderSensitive: true },
                },
                {
                    id: 'tc6',
                    input: '',
                    expectedOutput: '',
                    isPublic: false,
                    weight: 1,
                    comparatorConfig: { type: 'table', trimWhitespace: true, orderSensitive: true },
                },
            ],
            tags: ['sql', 'filtering', 'date-operations'],
            createdBy: admin._id,
        });
        await sqlProblem.save();

        sqlDataset.problemId = sqlProblem._id;
        await sqlDataset.save();
        sqlProblem.datasetId = sqlDataset._id;
        await sqlProblem.save();

        logger.info('Created problem: SQL - Active Customers');

        // Problem 4: Pandas - Flag High Spenders
        const pandasDataset = new Dataset({
            problemId: null as any,
            name: 'Transactions Dataset',
            type: 'PANDAS',
            tables: [
                {
                    name: 'transactions',
                    columns: [
                        { name: 'user_id', type: 'int' },
                        { name: 'amount', type: 'float' },
                        { name: 'country', type: 'string' },
                    ],
                    rows: [], // Will vary per testcase
                },
            ],
        });

        const pandasProblem = new Problem({
            title: 'Pandas - Flag High Spenders',
            slug: 'pandas-flag-high-spenders',
            domain: 'DB',
            difficulty: 'Medium',
            description: `Given a DataFrame \`transactions\` with columns \`user_id\` (int), \`amount\` (float), \`country\` (string), produce a DataFrame \`result_df\` with unique \`user_id\` and a boolean column \`high_spender\` which is True if the user's total \`amount\` across all their transactions is > 1000.

Sort result_df by \`user_id\` ascending. The evaluator expects the final DataFrame serialized as CSV rows without the index and with columns \`user_id,high_spender\`.`,
            examples: [
                {
                    input: `transactions = [(1, 500.0, 'IN'), (1, 600.0, 'IN'), (2, 100.0, 'US')]`,
                    output: `1,True\n2,False`,
                },
            ],
            constraints: [
                'Use pandas library',
                'Output variable must be named result_df',
            ],
            allowedLanguages: ['pandas'],
            timeLimitPerTestMs: 5000,
            memoryLimitMb: 256,
            testcases: [
                {
                    id: 'tc1',
                    input: '',
                    expectedOutput: '1,True\n2,False',
                    isPublic: true,
                    weight: 1,
                    comparatorConfig: { type: 'table', trimWhitespace: true, orderSensitive: true },
                },
                {
                    id: 'tc2',
                    input: '',
                    expectedOutput: '10,True',
                    isPublic: true,
                    weight: 1,
                    comparatorConfig: { type: 'table', trimWhitespace: true, orderSensitive: true },
                },
                {
                    id: 'tc3',
                    input: '',
                    expectedOutput: '5,False',
                    isPublic: true,
                    weight: 1,
                    comparatorConfig: { type: 'table', trimWhitespace: true, orderSensitive: true },
                },
                {
                    id: 'tc4',
                    input: '',
                    expectedOutput: '',
                    isPublic: false,
                    weight: 1,
                    comparatorConfig: { type: 'table', trimWhitespace: true, orderSensitive: true },
                },
                {
                    id: 'tc5',
                    input: '',
                    expectedOutput: '1,True\n2,True',
                    isPublic: false,
                    weight: 1,
                    comparatorConfig: { type: 'table', trimWhitespace: true, orderSensitive: true },
                },
                {
                    id: 'tc6',
                    input: '',
                    expectedOutput: '3,True',
                    isPublic: false,
                    weight: 1,
                    comparatorConfig: { type: 'table', trimWhitespace: true, orderSensitive: true },
                },
            ],
            tags: ['pandas', 'groupby', 'aggregation'],
            createdBy: admin._id,
        });
        await pandasProblem.save();

        pandasDataset.problemId = pandasProblem._id;
        await pandasDataset.save();
        pandasProblem.datasetId = pandasDataset._id;
        await pandasProblem.save();

        logger.info('Created problem: Pandas - Flag High Spenders');

        logger.info('✅ Seeding completed successfully!');
        logger.info(`Admin credentials: ${adminEmail} / admin123`);

    } catch (error) {
        logger.error('Seeding error:', error);
    } finally {
        await mongoose.disconnect();
        logger.info('Disconnected from MongoDB');
    }
}

seedProblems();
