import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';
import api from '../lib/api';
import { useTheme } from '../contexts/ThemeContext';
import { getSocket } from '../lib/socket';
import { FiPlay, FiSend, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import clsx from 'clsx';

interface Problem {
    _id: string;
    title: string;
    difficulty: string;
    domain: string;
    description: string;
    examples: Array<{ input: string; output: string; explanation?: string }>;
    constraints: string[];
    allowedLanguages: string[];
    testcases: any[];
}

const ProblemDetailPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const { theme } = useTheme();
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('python');
    const [submissionState, setSubmissionState] = useState<any>(null);

    const { data: problem, isLoading } = useQuery({
        queryKey: ['problem', slug],
        queryFn: async () => {
            const response = await api.get(`/problems/${slug}`);
            return response.data as Problem;
        },
    });

    useEffect(() => {
        if (problem && problem.allowedLanguages.length > 0) {
            setLanguage(problem.allowedLanguages[0]);
        }
    }, [problem]);

    // WebSocket for real-time updates
    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        socket.on('submission:update', (data: any) => {
            setSubmissionState(data);
        });

        return () => {
            socket.off('submission:update');
        };
    }, []);

    const submitMutation = useMutation({
        mutationFn: async () => {
            const response = await api.post('/submissions', {
                problemId: problem?._id,
                language,
                code,
            });
            return response.data;
        },
        onSuccess: (data) => {
            const socket = getSocket();
            if (socket) {
                socket.emit('subscribe:submission', data.submissionId);
            }
            setSubmissionState({ status: 'PENDING', message: 'Submission queued...' });
        },
    });

    const handleSubmit = () => {
        submitMutation.mutate();
    };

    const getEditorLanguage = (lang: string) => {
        const langMap: Record<string, string> = {
            cpp: 'cpp',
            java: 'java',
            python: 'python',
            sql: 'sql',
            pandas: 'python',
        };
        return langMap[lang] || 'python';
    };

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!problem) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="card text-center">Problem not found</div>
            </div>
        );
    }

    const difficultyColors = {
        Easy: 'badge-easy',
        Medium: 'badge-medium',
        Hard: 'badge-hard',
    };

    return (
        <div className="h-[calc(100vh-128px)] flex">
            {/* Left Panel - Problem Description */}
            <div className="w-1/2 overflow-y-auto border-r border-gray-200 dark:border-gray-700 p-6">
                <div className="mb-4">
                    <div className="flex items-center gap-3 mb-4">
                        <h1 className="text-2xl font-bold">{problem.title}</h1>
                        <span className={clsx('badge', difficultyColors[problem.difficulty as keyof typeof difficultyColors])}>
                            {problem.difficulty}
                        </span>
                        <span className="badge bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                            {problem.domain}
                        </span>
                    </div>

                    <div className="prose dark:prose-invert max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: problem.description.replace(/\n/g, '<br/>') }} />
                    </div>
                </div>

                {/* Examples */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Examples</h3>
                    {problem.examples.map((example, idx) => (
                        <div key={idx} className="card mb-4 bg-gray-50 dark:bg-gray-800/50">
                            <div className="mb-2">
                                <strong>Input:</strong>
                                <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded mt-1 text-sm overflow-x-auto">
                                    {example.input}
                                </pre>
                            </div>
                            <div className="mb-2">
                                <strong>Output:</strong>
                                <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded mt-1 text-sm overflow-x-auto">
                                    {example.output}
                                </pre>
                            </div>
                            {example.explanation && (
                                <div>
                                    <strong>Explanation:</strong>
                                    <p className="text-sm mt-1">{example.explanation}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Constraints */}
                {problem.constraints.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3">Constraints</h3>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                            {problem.constraints.map((constraint, idx) => (
                                <li key={idx}>{constraint}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Right Panel - Code Editor */}
            <div className="w-1/2 flex flex-col">
                {/* Editor Toolbar */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <select
                        className="input w-40"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                    >
                        {problem.allowedLanguages.map((lang) => (
                            <option key={lang} value={lang}>
                                {lang.toUpperCase()}
                            </option>
                        ))}
                    </select>

                    <div className="flex gap-2">
                        <button
                            className="btn btn-secondary flex items-center gap-2"
                            onClick={handleSubmit}
                            disabled={submitMutation.isPending || !code}
                        >
                            <FiSend />
                            Submit
                        </button>
                    </div>
                </div>

                {/* Monaco Editor */}
                <div className="flex-1">
                    <Editor
                        height="100%"
                        language={getEditorLanguage(language)}
                        value={code}
                        onChange={(value) => setCode(value || '')}
                        theme={theme === 'dark' ? 'vs-dark' : 'light'}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineNumbers: 'on',
                            roundedSelection: false,
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                        }}
                    />
                </div>

                {/* Submission Status */}
                {submissionState && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="card">
                            <div className="flex items-center gap-2 mb-2">
                                {submissionState.status === 'COMPLETED' && (
                                    <>
                                        {submissionState.verdict === 'ACCEPTED' ? (
                                            <FiCheckCircle className="text-green-600 text-xl" />
                                        ) : (
                                            <FiXCircle className="text-red-600 text-xl" />
                                        )}
                                        <span className="font-semibold">
                                            {submissionState.verdict?.replace(/_/g, ' ')}
                                        </span>
                                    </>
                                )}
                                {submissionState.status !== 'COMPLETED' && (
                                    <>
                                        <FiClock className="text-yellow-600 text-xl animate-pulse" />
                                        <span>{submissionState.message}</span>
                                    </>
                                )}
                            </div>

                            {submissionState.verdict === 'ACCEPTED' && (
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Runtime: {submissionState.totalRuntimeMs}ms | Passed: {submissionState.totalPassed}/{submissionState.totalTests}
                                </div>
                            )}

                            {submissionState.compileOutput && (
                                <div className="mt-3">
                                    <strong className="text-sm">Compilation Error:</strong>
                                    <pre className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-2 rounded mt-1 text-xs overflow-x-auto">
                                        {submissionState.compileOutput}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProblemDetailPage;
