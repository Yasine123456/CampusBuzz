// Utility functions for CampusBuzz

// Escape HTML to prevent XSS
export const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

// Format relative time (e.g., "2 hours ago")
export const getTimeAgo = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now - then) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return then.toLocaleDateString();
};

// Calculate time until expiration (for ghost posts)
export const getTimeUntilExpiration = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry - now;

    if (diffMs <= 0) return 'Expired';

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
};

// Format post content with @mentions and #hashtags
export const formatPostContent = (content) => {
    if (!content) return '';

    // Replace @mentions
    let formatted = content.replace(
        /@(\w+)/g,
        '<span class="mention" data-username="$1">@$1</span>'
    );

    // Replace #hashtags
    formatted = formatted.replace(
        /#(\w+)/g,
        '<span class="hashtag" data-tag="$1">#$1</span>'
    );

    return formatted;
};

// Get user initial for avatar
export const getUserInitial = (user) => {
    if (user?.display_name) {
        return user.display_name.charAt(0).toUpperCase();
    }
    if (user?.username) {
        return user.username.charAt(0).toUpperCase();
    }
    return '?';
};

// Get display name (fallback to username)
export const getDisplayName = (user) => {
    return user?.display_name || user?.username || 'Unknown';
};

// Weather code to icon mapping
export const getWeatherIcon = (code) => {
    // WMO Weather interpretation codes
    // https://open-meteo.com/en/docs
    if (code === 0) return 'sun'; // Clear sky
    if (code <= 3) return 'cloud-sun'; // Partly cloudy
    if (code <= 48) return 'cloud'; // Fog/cloudy
    if (code <= 57) return 'cloud-drizzle'; // Drizzle
    if (code <= 67) return 'cloud-rain'; // Rain
    if (code <= 77) return 'snowflake'; // Snow
    if (code <= 82) return 'cloud-rain'; // Rain showers
    if (code <= 86) return 'snowflake'; // Snow showers
    if (code >= 95) return 'cloud-lightning'; // Thunderstorm
    return 'cloud';
};

// Weather code to description
export const getWeatherDescription = (code) => {
    if (code === 0) return 'Clear sky';
    if (code <= 3) return 'Partly cloudy';
    if (code <= 48) return 'Foggy';
    if (code <= 57) return 'Drizzle';
    if (code <= 67) return 'Rainy';
    if (code <= 77) return 'Snowy';
    if (code <= 82) return 'Rain showers';
    if (code <= 86) return 'Snow showers';
    if (code >= 95) return 'Thunderstorm';
    return 'Cloudy';
};

// Debounce function for search
export const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

// Validate email format
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate username (alphanumeric, 3-20 chars)
export const isValidUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
};

// Format file size
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
