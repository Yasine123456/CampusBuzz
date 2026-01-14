import { createContext, useContext, useState, useEffect } from 'react';
import createTheme from '../styles/theme';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
    // Initialize from localStorage or defaults
    const [mode, setMode] = useState(() => {
        const saved = localStorage.getItem('campusbuzz_theme');
        return saved || 'dark';
    });

    const [accent, setAccent] = useState(() => {
        const saved = localStorage.getItem('campusbuzz_accent');
        return saved || 'teal';
    });

    // Create the full theme object
    const theme = createTheme(mode, accent);

    // Persist to localStorage when changed
    useEffect(() => {
        localStorage.setItem('campusbuzz_theme', mode);
    }, [mode]);

    useEffect(() => {
        localStorage.setItem('campusbuzz_accent', accent);
    }, [accent]);

    // Toggle functions
    const toggleMode = () => {
        setMode(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const toggleAccent = () => {
        setAccent(prev => prev === 'teal' ? 'amber' : 'teal');
    };

    const value = {
        theme,
        mode,
        accent,
        toggleMode,
        toggleAccent,
        isDark: mode === 'dark',
        isAmber: accent === 'amber',
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export default ThemeContext;
