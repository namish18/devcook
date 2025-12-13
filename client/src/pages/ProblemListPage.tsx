import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { HiSearch, HiFilter, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
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
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
            <div className="mb-12">
                <h1 className="text-4xl font-bold mb-3 tracking-tight">Problems</h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Practice DSA and database problems
                </p>
            </div>

            {/* Filters */}
            <div className="card mb-8">
                <div className="flex flex-wrap gap-4">
                    {/* Search */}
                    <div className="flex-1 min-w-[250px]">
                        <div className="relative">
                            <HiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search problems..."
                                className="input pl-11"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Domain Filter */}
                    <div className="relative">
                        <select
                            className="input w-36 appearance-none pr-10"
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                        >
                            <option value="">All Domains</option>
                            <option value="DSA">DSA</option>
                            <option value="DB">Database</option>
                        </select>
                        <HiFilter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Difficulty Filter */}
                    <div className="relative">
                        <select
                            className="input w-36 appearance-none pr-10"
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                        >
                            <option value="">All Levels</option>
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>
                        <HiFilter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Problem List */}
            {isLoading ? (
                <div className="text-center py-20">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-black dark:border-white border-t-transparent"></div>
                </div>
            ) : error ? (
                <div className="card text-center py-12 text-gray-600 dark:text-gray-400">
                    Failed to load problems
                </div>
            ) : (
                <>
                    <div className="space-y-3">
                        {data?.problems.map((problem: Problem) => (
                            <Link
                                key={problem._id}
                                to={`/problems/${problem.slug}`}
                                className="card card-hover block"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <h3 className="text-lg font-semibold">{problem.title}</h3>
                                            <span className={clsx('badge', difficultyColors[problem.difficulty as keyof typeof difficultyColors])}>
                                                {problem.difficulty}
                                            </span>
                                            <span className="badge bg-gray-100 dark:bg-gray-900 text-black dark:text-white">
                                                {problem.domain}
                                            </span>
                                        </div>

                                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                                            {problem.description.substring(0, 150)}...
                                        </p>

                                        <div className="flex items-center gap-6 text-xs text-gray-500 dark:text-gray-500 mb-3">
                                            <span className="font-medium">Acceptance: {problem.acceptanceRate.toFixed(1)}%</span>
                                            {problem.runtimeMedian > 0 && (
                                                <span className="font-medium">Avg Runtime: {problem.runtimeMedian}ms</span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {problem.tags.slice(0, 5).map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="px-2 py-1 text-xs font-medium rounded bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300"
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
                        <div className="flex justify-center items-center gap-4 mt-10">
                            <button
                                className="btn btn-secondary flex items-center gap-2"
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                            >
                                <HiChevronLeft />
                                <span>Previous</span>
                            </button>
                            <span className="px-4 py-2 text-sm font-medium">
                                Page {page} of {data.pagination.totalPages}
                            </span>
                            <button
                                className="btn btn-secondary flex items-center gap-2"
                                disabled={page === data.pagination.totalPages}
                                onClick={() => setPage(page + 1)}
                            >
                                <span>Next</span>
                                <HiChevronRight />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ProblemListPage;
