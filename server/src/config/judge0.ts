import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || '';
const JUDGE0_API_HOST = process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com';

export interface Judge0Config {
    apiUrl: string;
    apiKey: string;
    apiHost: string;
}

export const judge0Config: Judge0Config = {
    apiUrl: JUDGE0_API_URL,
    apiKey: JUDGE0_API_KEY,
    apiHost: JUDGE0_API_HOST,
};

export const createJudge0Client = (): AxiosInstance => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // Add RapidAPI headers if using RapidAPI
    if (JUDGE0_API_HOST) {
        headers['X-RapidAPI-Key'] = JUDGE0_API_KEY;
        headers['X-RapidAPI-Host'] = JUDGE0_API_HOST;
    }

    const client = axios.create({
        baseURL: JUDGE0_API_URL,
        headers,
        timeout: 30000,
    });

    client.interceptors.response.use(
        (response) => response,
        (error) => {
            logger.error('Judge0 API error:', error.response?.data || error.message);
            return Promise.reject(error);
        }
    );

    return client;
};

// Language ID mapping for Judge0
export const LANGUAGE_IDS = {
    cpp: 54,      // C++ (GCC 9.2.0)
    java: 62,     // Java (OpenJDK 13.0.1)
    python: 71,   // Python (3.8.1)
    javascript: 63, // JavaScript (Node.js 12.14.0)
} as const;

// Execution limits
export const EXECUTION_LIMITS = {
    DEFAULT_TIME_LIMIT_MS: parseInt(process.env.DEFAULT_TIME_LIMIT_MS || '2000', 10),
    DEFAULT_MEMORY_LIMIT_MB: parseInt(process.env.DEFAULT_MEMORY_LIMIT_MB || '256', 10),
    COMPILATION_TIMEOUT_MS: parseInt(process.env.COMPILATION_TIMEOUT_MS || '10000', 10),
};
