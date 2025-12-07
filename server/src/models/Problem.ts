import mongoose, { Schema, Document, Types } from 'mongoose';

export type ProblemDomain = 'DSA' | 'DB';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type AllowedLanguage = 'cpp' | 'java' | 'python' | 'sql' | 'pandas';
export type ComparatorType = 'exact' | 'token' | 'table';

export interface IExample {
    input: string;
    output: string;
    explanation?: string;
}

export interface IComparatorConfig {
    type: ComparatorType;
    trimWhitespace: boolean;
    orderSensitive: boolean;
    ignoreCase?: boolean;
}

export interface ITestcase {
    id: string;
    input: string;
    expectedOutput: string;
    isPublic: boolean;
    weight: number;
    comparatorConfig: IComparatorConfig;
    timeoutMs?: number;
    hiddenReason?: string;
}

export interface IProblem extends Document {
    _id: Types.ObjectId;
    title: string;
    slug: string;
    domain: ProblemDomain;
    difficulty: Difficulty;
    description: string;
    examples: IExample[];
    constraints: string[];
    hints?: string[];
    allowedLanguages: AllowedLanguage[];
    timeLimitPerTestMs: number;
    memoryLimitMb: number;
    testcases: ITestcase[];
    tags: string[];
    acceptanceRate: number;
    runtimeMedian: number;
    totalSubmissions: number;
    totalAccepted: number;
    datasetId?: Types.ObjectId;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const ExampleSchema = new Schema<IExample>({
    input: { type: String, required: true },
    output: { type: String, required: true },
    explanation: { type: String },
});

const ComparatorConfigSchema = new Schema<IComparatorConfig>({
    type: { type: String, enum: ['exact', 'token', 'table'], default: 'exact' },
    trimWhitespace: { type: Boolean, default: true },
    orderSensitive: { type: Boolean, default: true },
    ignoreCase: { type: Boolean, default: false },
});

const TestcaseSchema = new Schema<ITestcase>({
    id: { type: String, required: true },
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    isPublic: { type: Boolean, default: false },
    weight: { type: Number, default: 1 },
    comparatorConfig: { type: ComparatorConfigSchema, required: true },
    timeoutMs: { type: Number },
    hiddenReason: { type: String },
});

const ProblemSchema = new Schema<IProblem>(
    {
        title: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
        domain: { type: String, enum: ['DSA', 'DB'], required: true },
        difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
        description: { type: String, required: true },
        examples: [ExampleSchema],
        constraints: [{ type: String }],
        hints: [{ type: String }],
        allowedLanguages: [
            {
                type: String,
                enum: ['cpp', 'java', 'python', 'sql', 'pandas'],
            }
        ],
        timeLimitPerTestMs: { type: Number, default: 2000 },
        memoryLimitMb: { type: Number, default: 256 },
        testcases: [TestcaseSchema],
        tags: [{ type: String, trim: true, lowercase: true }],
        acceptanceRate: { type: Number, default: 0, min: 0, max: 100 },
        runtimeMedian: { type: Number, default: 0 },
        totalSubmissions: { type: Number, default: 0 },
        totalAccepted: { type: Number, default: 0 },
        datasetId: { type: Schema.Types.ObjectId, ref: 'Dataset' },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    {
        timestamps: true,
    }
);

// Indexes
ProblemSchema.index({ slug: 1 });
ProblemSchema.index({ domain: 1 });
ProblemSchema.index({ difficulty: 1 });
ProblemSchema.index({ tags: 1 });
ProblemSchema.index({ acceptanceRate: -1 });
ProblemSchema.index({ totalSubmissions: -1 });

export const Problem = mongoose.model<IProblem>('Problem', ProblemSchema);
