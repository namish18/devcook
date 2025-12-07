import mongoose, { Schema, Document, Types } from 'mongoose';

export type UserRole = 'USER' | 'ADMIN';

export interface IUserStats {
    totalSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    averageRuntime: number;
    preferredLanguages: string[];
}

export interface IUserPreferences {
    theme: 'light' | 'dark';
    editorFontSize: number;
    editorTabSize: number;
}

export interface IUser extends Document {
    _id: Types.ObjectId;
    email: string;
    passwordHash: string;
    displayName: string;
    avatar?: string;
    role: UserRole;
    stats: IUserStats;
    favorites: Types.ObjectId[];
    preferences: IUserPreferences;
    createdAt: Date;
    updatedAt: Date;
}

const UserStatsSchema = new Schema<IUserStats>({
    totalSolved: { type: Number, default: 0 },
    easySolved: { type: Number, default: 0 },
    mediumSolved: { type: Number, default: 0 },
    hardSolved: { type: Number, default: 0 },
    averageRuntime: { type: Number, default: 0 },
    preferredLanguages: [{ type: String }],
});

const UserPreferencesSchema = new Schema<IUserPreferences>({
    theme: { type: String, enum: ['light', 'dark'], default: 'dark' },
    editorFontSize: { type: Number, default: 14 },
    editorTabSize: { type: Number, default: 2 },
});

const UserSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        passwordHash: { type: String, required: true },
        displayName: { type: String, required: true, trim: true },
        avatar: { type: String },
        role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
        stats: { type: UserStatsSchema, default: () => ({}) },
        favorites: [{ type: Schema.Types.ObjectId, ref: 'Problem' }],
        preferences: { type: UserPreferencesSchema, default: () => ({}) },
    },
    {
        timestamps: true,
    }
);

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
