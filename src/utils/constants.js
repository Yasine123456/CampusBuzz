// Constants for CampusBuzz

// Maximum values
export const MAX_POST_LENGTH = 500;
export const MAX_COMMENT_LENGTH = 280;
export const MAX_BIO_LENGTH = 160;
export const MAX_DISPLAY_NAME_LENGTH = 50;
export const MAX_IMAGES_PER_POST = 4;
export const MAX_MESSAGE_LENGTH = 2000;

// Polling intervals (in ms)
export const POSTS_POLL_INTERVAL = 30000; // 30 seconds
export const NOTIFICATIONS_POLL_INTERVAL = 60000; // 1 minute
export const MESSAGES_POLL_INTERVAL = 10000; // 10 seconds

// Ghost post expiration options (in hours)
export const GHOST_EXPIRATION_OPTIONS = [
    { value: 1, label: '1 hour' },
    { value: 3, label: '3 hours' },
    { value: 6, label: '6 hours' },
    { value: 12, label: '12 hours' },
    { value: 24, label: '24 hours' },
];

// Image upload constraints
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

// Newcastle, UK coordinates for weather
export const NEWCASTLE_COORDS = {
    lat: 54.9783,
    lon: -1.6178,
};
