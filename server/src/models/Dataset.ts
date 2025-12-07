import mongoose, { Schema, Document, Types } from 'mongoose';

export type DatasetType = 'SQL' | 'PANDAS';

export interface IColumn {
    name: string;
    type: string;
}

export interface ITable {
    name: string;
    columns: IColumn[];
    rows: Record<string, any>[];
}

export interface IDataset extends Document {
    _id: Types.ObjectId;
    problemId: Types.ObjectId;
    name: string;
    type: DatasetType;
    tables: ITable[];
    createdAt: Date;
    updatedAt: Date;
}

const ColumnSchema = new Schema<IColumn>({
    name: { type: String, required: true },
    type: { type: String, required: true },
});

const TableSchema = new Schema<ITable>({
    name: { type: String, required: true },
    columns: [ColumnSchema],
    rows: [{ type: Schema.Types.Mixed }],
});

const DatasetSchema = new Schema<IDataset>(
    {
        problemId: { type: Schema.Types.ObjectId, ref: 'Problem', required: true },
        name: { type: String, required: true },
        type: { type: String, enum: ['SQL', 'PANDAS'], required: true },
        tables: [TableSchema],
    },
    {
        timestamps: true,
    }
);

// Indexes
DatasetSchema.index({ problemId: 1 });

export const Dataset = mongoose.model<IDataset>('Dataset', DatasetSchema);
