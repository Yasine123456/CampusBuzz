import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check authentication on mount
    useEffect(() => {
        verifyAuth();
    }, []);

    const verifyAuth = async () => {
        const token = localStorage.getItem('campusbuzz_token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const response = await api.verifyToken(token);
            if (response.success && response.user) {
                setUser(response.user);
            } else {
                // Token invalid, clear it
                localStorage.removeItem('campusbuzz_token');
            }
        } catch (err) {
            console.error('Auth verification failed:', err);
            localStorage.removeItem('campusbuzz_token');
        } finally {
            setLoading(false);
        }
    };

    const login = useCallback(async (username, password) => {
        setError(null);
        try {
            const response = await api.login(username, password);
            if (response.success) {
                localStorage.setItem('campusbuzz_token', response.token);
                setUser(response.user);
                return { success: true };
            } else {
                setError(response.message || 'Login failed');
                return { success: false, message: response.message };
            }
        } catch (err) {
            const message = err.message || 'Login failed';
            setError(message);
            return { success: false, message };
        }
    }, []);

    const register = useCallback(async (username, email, password, major = '') => {
        setError(null);
        try {
            const response = await api.register(username, email, password, major);
            if (response.success) {
                localStorage.setItem('campusbuzz_token', response.token);
                setUser(response.user);
                return { success: true };
            } else {
                setError(response.message || 'Registration failed');
                return { success: false, message: response.message };
            }
        } catch (err) {
            const message = err.message || 'Registration failed';
            setError(message);
            return { success: false, message };
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('campusbuzz_token');
        setUser(null);
        setError(null);
    }, []);

    const updateUserProfile = useCallback((updates) => {
        setUser(prev => prev ? { ...prev, ...updates } : prev);
    }, []);

    const value = {
        user,
        loading,
        error,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        verifyAuth,
        updateUserProfile,
        clearError: () => setError(null),
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
