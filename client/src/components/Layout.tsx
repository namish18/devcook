import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { FiSun, FiMoon, FiLogOut, FiCode } from 'react-icons/fi';

const Layout: React.FC = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!isAuthenticated) {
        navigate('/login');
        return null;
    }

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link to="/problems" className="flex items-center space-x-2">
                            <FiCode className="text-2xl text-primary-600" />
                            <span className="text-xl font-bold">LeetClone</span>
                        </Link>

                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {user?.displayName}
                            </span>

                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                aria-label="Toggle theme"
                            >
                                {theme === 'light' ? <FiMoon className="text-xl" /> : <FiSun className="text-xl" />}
                            </button>

                            <button
                                onClick={handleLogout}
                                className="btn btn-secondary flex items-center space-x-2"
                            >
                                <FiLogOut />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-600 dark:text-gray-400">
                    &copy; 2024 LeetClone. Built with React, Node.js, and MongoDB.
                </div>
            </footer>
        </div>
    );
};

export default Layout;
