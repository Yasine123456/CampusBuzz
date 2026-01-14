// Theme configuration for CampusBuzz
// Converted from styles-old.css CSS variables

export const colors = {
    // Accent colors - Teal (default)
    teal: {
        accent: '#14b8a6',
        accentDark: '#0d9488',
        accentLight: '#2dd4bf',
    },
    // Accent colors - Amber
    amber: {
        accent: '#f59e0b',
        accentDark: '#d97706',
        accentLight: '#fbbf24',
    },
    // Semantic colors
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
};

export const lightTheme = {
    mode: 'light',
    colors: {
        ...colors,
        // Background colors
        bgPrimary: '#ffffff',
        bgSecondary: '#f8fafc',
        bgTertiary: '#f1f5f9',
        bgElevated: '#ffffff',
        // Text colors
        textPrimary: '#0f172a',
        textSecondary: '#475569',
        textMuted: '#94a3b8',
        // Border & glass
        borderColor: '#e2e8f0',
        glassBg: 'rgba(255, 255, 255, 0.8)',
        glassBorder: 'rgba(0, 0, 0, 0.05)',
    },
    shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        glow: (accent) => `0 0 20px ${accent === 'amber' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(20, 184, 166, 0.2)'}`,
    },
};

export const darkTheme = {
    mode: 'dark',
    colors: {
        ...colors,
        // Background colors
        bgPrimary: '#0a0a0a',
        bgSecondary: '#171717',
        bgTertiary: '#262626',
        bgElevated: '#1c1c1c',
        // Text colors
        textPrimary: '#fafafa',
        textSecondary: '#a1a1aa',
        textMuted: '#71717a',
        // Border & glass
        borderColor: '#27272a',
        glassBg: 'rgba(23, 23, 23, 0.8)',
        glassBorder: 'rgba(255, 255, 255, 0.05)',
    },
    shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
        glow: (accent) => `0 0 20px ${accent === 'amber' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(20, 184, 166, 0.3)'}`,
    },
};

// Shared values (don't change with theme)
export const spacing = {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
};

export const radii = {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
};

export const transitions = {
    fast: '150ms ease-in-out',
    normal: '300ms ease-in-out',
    slow: '500ms ease-in-out',
};

export const fonts = {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    display: "'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

// Helper to get current accent colors
export const getAccentColors = (accent) => {
    return accent === 'amber' ? colors.amber : colors.teal;
};

// Create a complete theme object from mode and accent
export const createTheme = (mode = 'dark', accent = 'teal') => {
    const baseTheme = mode === 'dark' ? darkTheme : lightTheme;
    const accentColors = getAccentColors(accent);

    return {
        ...baseTheme,
        accent,
        accentColors,
        spacing,
        radii,
        transitions,
        fonts,
    };
};

export default createTheme;
