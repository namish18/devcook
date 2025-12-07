import mongoose, { Schema, Document, Types } from 'mongoose';

export type SubmissionStatus = 'PENDING' | 'COMPILING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
export type Verdict = 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED' | 'RUNTIME_ERROR' | 'COMPILATION_ERROR' | 'INTERNAL_ERROR';
export type TestcaseStatus = 'PASSED' | 'FAILED' | 'TLE' | 'MLE' | 'RE';

export interface ITestcaseResult {
    testcaseId: string;
    status: TestcaseStatus;
    stdout: string;
    stderr: string;
    runtimeMs: number;
    memoryMb: number;
    exitCode?: number;
    diff?: string;
}

export interface ISubmission extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    problemId: Types.ObjectId;
    language: string;
    code: string;
    status: SubmissionStatus;
    verdict?: Verdict;
    results: ITestcaseResult[];
    compileOutput?: string;
    totalRuntimeMs: number;
    totalPassed: number;
    totalTests: number;
    createdAt: Date;
    completedAt?: Date;
}

const TestcaseResultSchema = new Schema<ITestcaseResult>({
    testcaseId: { type: String, required: true },
    status: { type: String, enum: ['PASSED', 'FAILED', 'TLE', 'MLE', 'RE'], required: true },
    stdout: { type: String, default: '' },
    stderr: { type: String, default: '' },
    runtimeMs: { type: Number, default: 0 },
    memoryMb: { type: Number, default: 0 },
    exitCode: { type: Number },
    diff: { type: String },
});

const SubmissionSchema = new Schema<ISubmission>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        problemId: { type: Schema.Types.ObjectId, ref: 'Problem', required: true },
        language: { type: String, required: true },
        code: { type: String, required: true },
        status: {
            type: String,
            enum: ['PENDING', 'COMPILING', 'RUNNING', 'COMPLETED', 'FAILED'],
            default: 'PENDING'
        },
        verdict: {
            type: String,
            enum: ['ACCEPTED', 'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', 'MEMORY_LIMIT_EXCEEDED', 'RUNTIME_ERROR', 'COMPILATION_ERROR', 'INTERNAL_ERROR']
        },
        results: [TestcaseResultSchema],
        compileOutput: { type: String },
        totalRuntimeMs: { type: Number, default: 0 },
        totalPassed: { type: Number, default: 0 },
        totalTests: { type: Number, default: 0 },
        completedAt: { type: Date },
    },
    {
        timestamps: true,
    }
);

// Indexes
SubmissionSchema.index({ userId: 1, createdAt: -1 });
SubmissionSchema.index({ problemId: 1, createdAt: -1 });
SubmissionSchema.index({ status: 1 });
SubmissionSchema.index({ verdict: 1 });

export const Submission = mongoose.model<ISubmission>('Submission', SubmissionSchema);
