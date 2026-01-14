// API Service for CampusBuzz
// Centralized API calls to PHP backend

// Determine base URL based on environment
const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
        // In browser - use relative path which will be proxied in dev
        // or work directly in production
        return window.location.origin.includes('localhost')
            ? '' // Vite will proxy /backend/* requests
            : window.location.origin;
    }
    return '';
};

const BASE_URL = getBaseUrl();
const API_PATH = '/backend';

// Helper to get auth token
const getToken = () => localStorage.getItem('campusbuzz_token');

// Generic fetch helper with error handling
const fetchApi = async (endpoint, options = {}) => {
    const token = getToken();

    const headers = {
        ...options.headers,
    };

    // Only add Content-Type for non-FormData requests
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${API_PATH}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || `HTTP error ${response.status}`);
    }

    return data;
};

// ============================================
// AUTHENTICATION
// ============================================

export const login = async (username, password) => {
    return fetchApi('/auth.php', {
        method: 'POST',
        body: JSON.stringify({
            action: 'login',
            username,
            password,
        }),
    });
};

export const register = async (username, email, password, major = '') => {
    return fetchApi('/auth.php', {
        method: 'POST',
        body: JSON.stringify({
            action: 'register',
            username,
            email,
            password,
            major,
        }),
    });
};

export const verifyToken = async (token) => {
    return fetchApi('/auth.php', {
        method: 'POST',
        body: JSON.stringify({
            action: 'verify',
            token,
        }),
    });
};

// ============================================
// POSTS
// ============================================

export const getPosts = async () => {
    return fetchApi('/posts.php?action=list');
};

export const createPost = async (content, imageUrls = [], isGhost = false, expiresIn = 3) => {
    return fetchApi('/posts.php', {
        method: 'POST',
        body: JSON.stringify({
            action: 'create',
            content,
            image_urls: imageUrls,
            is_ghost: isGhost,
            expires_in: expiresIn,
        }),
    });
};

export const deletePost = async (postId) => {
    return fetchApi('/posts.php', {
        method: 'POST',
        body: JSON.stringify({
            action: 'delete',
            post_id: postId,
        }),
    });
};

export const likePost = async (postId) => {
    return fetchApi('/posts.php', {
        method: 'POST',
        body: JSON.stringify({
            action: 'like',
            post_id: postId,
        }),
    });
};

export const unlikePost = async (postId) => {
    return fetchApi('/posts.php', {
        method: 'POST',
        body: JSON.stringify({
            action: 'unlike',
            post_id: postId,
        }),
    });
};

// ============================================
// COMMENTS
// ============================================

export const getComments = async (postId) => {
    return fetchApi(`/posts.php?action=comments&post_id=${postId}`);
};

export const addComment = async (postId, content) => {
    return fetchApi('/posts.php', {
        method: 'POST',
        body: JSON.stringify({
            action: 'comment',
            post_id: postId,
            content,
        }),
    });
};

// ============================================
// BOOKMARKS
// ============================================

export const getBookmarks = async () => {
    return fetchApi('/posts.php?action=bookmarks');
};

export const toggleBookmark = async (postId) => {
    return fetchApi('/posts.php', {
        method: 'POST',
        body: JSON.stringify({
            action: 'bookmark',
            post_id: postId,
        }),
    });
};

// ============================================
// SEARCH
// ============================================

export const search = async (query) => {
    return fetchApi(`/search.php?q=${encodeURIComponent(query)}`);
};

// ============================================
// PROFILE
// ============================================

export const getProfile = async (userId) => {
    return fetchApi(`/users.php?action=profile&user_id=${userId}`);
};

export const getProfileByUsername = async (username) => {
    return fetchApi(`/users.php?action=profile&username=${encodeURIComponent(username)}`);
};

export const getUserPosts = async (userId) => {
    return fetchApi(`/posts.php?action=user_posts&user_id=${userId}`);
};

export const updateProfile = async (displayName, bio, avatarUrl = null) => {
    const body = {
        action: 'update_profile',
        display_name: displayName,
        bio,
    };
    if (avatarUrl) {
        body.avatar_url = avatarUrl;
    }
    return fetchApi('/users.php', {
        method: 'POST',
        body: JSON.stringify(body),
    });
};

export const followUser = async (userId) => {
    return fetchApi('/users.php', {
        method: 'POST',
        body: JSON.stringify({
            action: 'follow',
            user_id: userId,
        }),
    });
};

export const unfollowUser = async (userId) => {
    return fetchApi('/users.php', {
        method: 'POST',
        body: JSON.stringify({
            action: 'unfollow',
            user_id: userId,
        }),
    });
};

// ============================================
// NOTIFICATIONS
// ============================================

export const getNotifications = async () => {
    return fetchApi('/notifications.php?action=list');
};

export const getUnreadCount = async () => {
    return fetchApi('/notifications.php?action=unread_count');
};

export const markNotificationRead = async (notificationId) => {
    return fetchApi('/notifications.php', {
        method: 'POST',
        body: JSON.stringify({
            action: 'mark_read',
            notification_id: notificationId,
        }),
    });
};

export const markAllNotificationsRead = async () => {
    return fetchApi('/notifications.php', {
        method: 'POST',
        body: JSON.stringify({
            action: 'mark_all_read',
        }),
    });
};

// ============================================
// MESSAGES
// ============================================

export const getConversations = async () => {
    return fetchApi('/messages.php?action=conversations');
};

export const getMessages = async (conversationId) => {
    return fetchApi(`/messages.php?action=messages&conversation_id=${conversationId}`);
};

export const sendMessage = async (recipientId, content, conversationId = null) => {
    return fetchApi('/messages.php', {
        method: 'POST',
        body: JSON.stringify({
            action: 'send',
            recipient_id: recipientId,
            content,
            conversation_id: conversationId,
        }),
    });
};

export const getMessagesUnreadCount = async () => {
    return fetchApi('/messages.php?action=unread_count');
};

export const markConversationRead = async (conversationId) => {
    return fetchApi('/messages.php', {
        method: 'POST',
        body: JSON.stringify({
            action: 'mark_read',
            conversation_id: conversationId,
        }),
    });
};

// ============================================
// MEDIA UPLOAD
// ============================================

export const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    return fetchApi('/upload.php', {
        method: 'POST',
        body: formData,
    });
};

// ============================================
// WEATHER (External API)
// ============================================

export const getWeather = async (lat, lon) => {
    // Open-Meteo API - free, no key required
    const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`
    );
    return response.json();
};

// Newcastle, UK coordinates (hardcoded as per previous implementation)
export const getNewcastleWeather = async () => {
    return getWeather(54.9783, -1.6178);
};
