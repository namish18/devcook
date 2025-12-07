import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { FiFilter, FiSearch } from 'react-icons/fi';
import clsx from 'clsx';

interface Problem {
    _id: string;
    title: string;
    slug: string;
    domain: string;
    difficulty: string;
    tags: string[];
    description: string;
    acceptanceRate: number;
    runtimeMedian: number;
}

const ProblemListPage: React.FC = () => {
    const [page, setPage] = useState(1);
    const [domain, setDomain] = useState('');
    const [difficulty, setDifficulty] = useState('');
    const [search, setSearch] = useState('');

    const { data, isLoading, error } = useQuery({
        queryKey: ['problems', page, domain, difficulty, search],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                ...(domain && { domain }),
                ...(difficulty && { difficulty }),
                ...(search && { search }),
            });
            const response = await api.get(`/problems?${params}`);
            return response.data;
        },
    });

    const difficultyColors = {
        Easy: 'badge-easy',
        Medium: 'badge-medium',
        Hard: 'badge-hard',
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Problems</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Practice DSA and database problems
                </p>
            </div>

            {/* Filters */}
            <div className="card mb-6">
                <div className="flex flex-wrap gap-4">
                    {/* Search */}
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search problems..."
                                className="input pl-10"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Domain Filter */}
                    <select
                        className="input w-32"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                    >
                        <option value="">All Domains</option>
                        <option value="DSA">DSA</option>
                        <option value="DB">Database</option>
                    </select>

                    {/* Difficulty Filter */}
                    <select
                        className="input w-32"
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                    >
                        <option value="">All Levels</option>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                    </select>
                </div>
            </div>

            {/* Problem List */}
            {isLoading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                </div>
            ) : error ? (
                <div className="card text-center py-8 text-red-600">
                    Failed to load problems
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {data?.problems.map((problem: Problem) => (
                            <Link
                                key={problem._id}
                                to={`/problems/${problem.slug}`}
                                className="card block hover:shadow-lg transition-shadow"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold">{problem.title}</h3>
                                            <span className={clsx('badge', difficultyColors[problem.difficulty as keyof typeof difficultyColors])}>
                                                {problem.difficulty}
                                            </span>
                                            <span className="badge bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                                {problem.domain}
                                            </span>
                                        </div>

                                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                                            {problem.description.substring(0, 150)}...
                                        </p>

                                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                            <span>Acceptance: {problem.acceptanceRate.toFixed(1)}%</span>
                                            {problem.runtimeMedian > 0 && (
                                                <span>Avg Runtime: {problem.runtimeMedian}ms</span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {problem.tags.slice(0, 5).map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="px-2 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Pagination */}
                    {data && data.pagination.totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-8">
                            <button
                                className="btn btn-secondary"
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                            >
                                Previous
                            </button>
                            <span className="px-4 py-2 text-sm">
                                Page {page} of {data.pagination.totalPages}
                            </span>
                            <button
                                className="btn btn-secondary"
                                disabled={page === data.pagination.totalPages}
                                onClick={() => setPage(page + 1)}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ProblemListPage;
