import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';
import { initializeSocket, disconnectSocket } from '../lib/socket';

interface User {
    id: string;
    email: string;
    displayName: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, displayName: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const savedToken = localStorage.getItem('auth_token');
        if (savedToken) {
            setToken(savedToken);
            fetchCurrentUser(savedToken);
        }
    }, []);

    const fetchCurrentUser = async (authToken: string) => {
        try {
            const response = await api.get('/auth/me', {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setUser(response.data);
            initializeSocket(authToken);
        } catch (error) {
            console.error('Failed to fetch user:', error);
            localStorage.removeItem('auth_token');
            setToken(null);
        }
    };

    const login = async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });
        const { token: authToken, user: userData } = response.data;

        localStorage.setItem('auth_token', authToken);
        setToken(authToken);
        setUser(userData);
        initializeSocket(authToken);
    };

    const register = async (email: string, password: string, displayName: string) => {
        const response = await api.post('/auth/register', { email, password, displayName });
        const { token: authToken, user: userData } = response.data;

        localStorage.setItem('auth_token', authToken);
        setToken(authToken);
        setUser(userData);
        initializeSocket(authToken);
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
        disconnectSocket();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                login,
                register,
                logout,
                isAuthenticated: !!token && !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
