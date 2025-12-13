import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { HiSun, HiMoon, HiLogout } from 'react-icons/hi';
import { BiCode } from 'react-icons/bi';

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
        <div className="min-h-screen flex flex-col bg-white dark:bg-black">
            {/* Header */}
            <header className="border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-lg">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link to="/problems" className="flex items-center space-x-2 group">
                            <BiCode className="text-2xl text-black dark:text-white group-hover:scale-110 transition-transform" />
                            <span className="text-xl font-bold tracking-tight">LeetClone</span>
                        </Link>

                        <div className="flex items-center space-x-4">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {user?.displayName}
                            </span>

                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                                aria-label="Toggle theme"
                            >
                                {theme === 'light' ?
                                    <HiMoon className="text-xl" /> :
                                    <HiSun className="text-xl" />
                                }
                            </button>

                            <button
                                onClick={handleLogout}
                                className="btn btn-outline flex items-center space-x-2"
                            >
                                <HiLogout />
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
            <footer className="border-t border-gray-200 dark:border-gray-800 py-6">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center text-sm text-gray-500 dark:text-gray-500">
                    Built with React, Node.js, and MongoDB
                </div>
            </footer>
        </div>
    );
};

export default Layout;
