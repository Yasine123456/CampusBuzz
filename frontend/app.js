// app.js - CampusBuzz Frontend Application

// Configuration
// Use relative path for deployment - works on any domain
const API_BASE_URL = window.location.origin.includes('localhost')
    ? 'http://localhost:8000'  // Local development
    : '/Campusbuzz/backend';   // Production (NUWebSpace) - absolute path from root
const POLL_INTERVAL = 10000; // Poll for new posts every 10 seconds

// State
let currentUser = null;
let selectedImage = null;
let pollTimer = null;

// DOM Elements
const authModal = document.getElementById('authModal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userInfo = document.getElementById('userInfo');
const usernameDisplay = document.getElementById('usernameDisplay');
const postComposer = document.getElementById('postComposer');
const postContent = document.getElementById('postContent');
const postBtn = document.getElementById('postBtn');
const charCounter = document.getElementById('charCounter');
const imageUploadBtn = document.getElementById('imageUploadBtn');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const removeImageBtn = document.getElementById('removeImageBtn');
const postsContainer = document.getElementById('postsContainer');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const showRegisterLink = document.getElementById('showRegisterLink');
const showLoginLink = document.getElementById('showLoginLink');
const loginError = document.getElementById('loginError');
const registerError = document.getElementById('registerError');

// Notifications elements
const notificationsBtn = document.getElementById('notificationsBtn');
const notificationsModal = document.getElementById('notificationsModal');
const notificationsList = document.getElementById('notificationsList');
const notificationBadge = document.getElementById('notificationBadge');
const markAllReadBtn = document.getElementById('markAllReadBtn');
const notificationsLoading = document.getElementById('notificationsLoading');

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

async function initializeApp() {
    // Check if user is already authenticated
    const authenticated = await verifyAuth();

    if (authenticated) {
        showAuthenticatedUI();
        loadPosts();
        startPolling();
        startNotificationsPolling();
    } else {
        showAuthModal();
    }

    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.error('Service Worker registration failed:', err));
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Auth
    loginBtn.addEventListener('click', showAuthModal);
    logoutBtn.addEventListener('click', handleLogout);
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        showRegisterForm();
    });
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginForm();
    });

    // Post composer
    postContent.addEventListener('input', updateCharCounter);
    postBtn.addEventListener('click', handleCreatePost);
    imageUploadBtn.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', handleImageSelect);
    removeImageBtn.addEventListener('click', removeImage);

    // Ghost mode toggle
    const ghostModeToggle = document.getElementById('ghostModeToggle');
    const expirationTime = document.getElementById('expirationTime');
    ghostModeToggle.addEventListener('change', () => {
        if (ghostModeToggle.checked) {
            expirationTime.classList.remove('hidden');
        } else {
            expirationTime.classList.add('hidden');
        }
    });

    // Notifications
    notificationsBtn.addEventListener('click', showNotificationsModal);
    markAllReadBtn.addEventListener('click', markAllNotificationsAsRead);

    // Close modal on outside click
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal && currentUser) {
            hideAuthModal();
        }
    });

    notificationsModal.addEventListener('click', (e) => {
        if (e.target === notificationsModal) {
            hideNotificationsModal();
        }
    });
}

// ============================================
// AUTHENTICATION
// ============================================

async function verifyAuth() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth.php?action=verify`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.authenticated) {
            currentUser = {
                id: data.user_id,
                username: data.username
            };
            return true;
        }
        return false;
    } catch (error) {
        console.error('Auth verification failed:', error);
        return false;
    }
}

async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    loginError.classList.add('hidden');

    try {
        const response = await fetch(`${API_BASE_URL}/auth.php?action=login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            currentUser = data.user;
            hideAuthModal();
            showAuthenticatedUI();
            loadPosts();
            startPolling();
            loginForm.reset();
        } else {
            showError(loginError, data.error || 'Login failed');
        }
    } catch (error) {
        showError(loginError, 'Network error. Please try again.');
        console.error('Login error:', error);
    }
}

async function handleRegister(e) {
    e.preventDefault();

    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    registerError.classList.add('hidden');

    try {
        const response = await fetch(`${API_BASE_URL}/auth.php?action=register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            currentUser = data.user;
            hideAuthModal();
            showAuthenticatedUI();
            loadPosts();
            startPolling();
            registerForm.reset();
        } else {
            showError(registerError, data.error || 'Registration failed');
        }
    } catch (error) {
        showError(registerError, 'Network error. Please try again.');
        console.error('Register error:', error);
    }
}

async function handleLogout() {
    try {
        await fetch(`${API_BASE_URL}/auth.php?action=logout`, {
            method: 'POST',
            credentials: 'include'
        });

        currentUser = null;
        stopPolling();
        showUnauthenticatedUI();
        showAuthModal();
        postsContainer.innerHTML = '';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// ============================================
// POSTS
// ============================================

async function loadPosts() {
    try {
        loadingState.classList.remove('hidden');
        emptyState.classList.add('hidden');

        const response = await fetch(`${API_BASE_URL}/posts.php?action=list&limit=20`, {
            credentials: 'include'
        });

        const data = await response.json();

        loadingState.classList.add('hidden');

        if (data.success && data.posts.length > 0) {
            renderPosts(data.posts);
        } else {
            emptyState.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Failed to load posts:', error);
        loadingState.classList.add('hidden');
        emptyState.classList.remove('hidden');
    }
}

function renderPosts(posts) {
    postsContainer.innerHTML = '';

    posts.forEach(post => {
        const postElement = createPostElement(post);
        postsContainer.appendChild(postElement);
    });
}

function createPostElement(post) {
    const article = document.createElement('article');
    article.className = `card post-card fade-in${post.is_ghost ? ' ghost-post' : ''}`;
    article.dataset.postId = post.id;

    const displayName = post.is_ghost ? 'Anonymous' : post.username;
    const avatarInitial = displayName.charAt(0).toUpperCase();
    const timeAgo = getTimeAgo(post.created_at);

    // Calculate time until expiration for ghost posts
    let expirationText = '';
    if (post.is_ghost && post.expires_at) {
        const expiresIn = getTimeUntilExpiration(post.expires_at);
        expirationText = `<span class="expiration-badge">⏱️ ${expiresIn}</span>`;
    }

    article.innerHTML = `
        <div class="post-header">
            <div class="avatar">
                ${post.avatar_url && !post.is_ghost ? `<img src="${post.avatar_url}" alt="${displayName}">` : avatarInitial}
            </div>
            <div class="post-author">
                <div class="post-username">
                    ${escapeHtml(displayName)}
                    ${post.is_ghost ? '<span class="ghost-badge">👻 Ghost</span>' : ''}
                </div>
                <div class="post-time">${timeAgo} ${expirationText}</div>
            </div>
            ${currentUser && currentUser.id === post.user_id && !post.is_ghost ? `
                <button class="btn btn-ghost btn-icon delete-post-btn" data-post-id="${post.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            ` : ''}
        </div>
        <div class="post-content">${formatPostContent(escapeHtml(post.content))}</div>
        ${post.image_url ? `<img src="${post.image_url}" alt="Post image" class="post-image">` : ''}
        <div class="post-actions">
            <div class="post-action like-btn ${post.liked_by_user ? 'liked' : ''}" data-post-id="${post.id}">
                <svg xmlns="http://www.w3.org/2000/svg" fill="${post.liked_by_user ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span class="likes-count">${post.likes_count}</span>
            </div>
            <div class="post-action comment-btn" data-post-id="${post.id}">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>${post.comments_count}</span>
            </div>
        </div>
    `;

    // Add event listeners
    const likeBtn = article.querySelector('.like-btn');
    const deleteBtn = article.querySelector('.delete-post-btn');

    if (likeBtn) {
        likeBtn.addEventListener('click', () => handleLike(post.id));
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => handleDeletePost(post.id));
    }

    return article;
}

async function handleCreatePost() {
    const content = postContent.value.trim();

    if (!content) {
        return;
    }

    if (content.length > 500) {
        alert('Post is too long. Maximum 500 characters.');
        return;
    }

    try {
        postBtn.disabled = true;
        postBtn.textContent = 'Posting...';

        let imageUrl = null;

        // Upload image if selected
        if (selectedImage) {
            imageUrl = await uploadImage(selectedImage);
        }

        // Get ghost mode settings
        const ghostToggle = document.getElementById('ghostModeToggle');
        const isGhost = ghostToggle ? ghostToggle.checked : false;
        const expiresInHours = isGhost ? parseInt(document.getElementById('expirationTime').value) : null;

        const response = await fetch(`${API_BASE_URL}/posts.php?action=create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                content,
                image_url: imageUrl,
                is_ghost: isGhost,
                expires_in_hours: expiresInHours
            })
        });

        const data = await response.json();

        if (data.success) {
            // Clear composer
            postContent.value = '';
            removeImage();
            updateCharCounter();

            // Reset ghost mode
            document.getElementById('ghostModeToggle').checked = false;
            document.getElementById('expirationTime').classList.add('hidden');

            // Add new post to top of timeline
            const newPostElement = createPostElement(data.post);
            postsContainer.insertBefore(newPostElement, postsContainer.firstChild);

            // Hide empty state if visible
            emptyState.classList.add('hidden');
        } else {
            alert(data.error || 'Failed to create post');
        }
    } catch (error) {
        console.error('Create post error:', error);
        alert('Network error. Please try again.');
    } finally {
        postBtn.disabled = false;
        postBtn.textContent = 'Post';
    }
}

async function handleLike(postId) {
    try {
        const response = await fetch(`${API_BASE_URL}/posts.php?action=like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ post_id: postId })
        });

        const data = await response.json();

        if (data.success) {
            // Update UI
            const postElement = document.querySelector(`[data-post-id="${postId}"]`);
            const likeBtn = postElement.querySelector('.like-btn');
            const likesCount = likeBtn.querySelector('.likes-count');
            const heartIcon = likeBtn.querySelector('svg');

            if (data.liked) {
                likeBtn.classList.add('liked');
                heartIcon.setAttribute('fill', 'currentColor');
            } else {
                likeBtn.classList.remove('liked');
                heartIcon.setAttribute('fill', 'none');
            }

            likesCount.textContent = data.likes_count;
        }
    } catch (error) {
        console.error('Like error:', error);
    }
}

async function handleDeletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/posts.php?action=delete&id=${postId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
            // Remove post from UI
            const postElement = document.querySelector(`[data-post-id="${postId}"]`);
            postElement.style.opacity = '0';
            postElement.style.transform = 'scale(0.9)';
            setTimeout(() => postElement.remove(), 300);

            // Show empty state if no posts left
            if (postsContainer.children.length === 0) {
                emptyState.classList.remove('hidden');
            }
        }
    } catch (error) {
        console.error('Delete post error:', error);
        alert('Failed to delete post');
    }
}

// ============================================
// IMAGE UPLOAD
// ============================================

function handleImageSelect(e) {
    const file = e.target.files[0];

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('Image is too large. Maximum size is 5MB');
        return;
    }

    selectedImage = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImg.src = e.target.result;
        imagePreview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

function removeImage() {
    selectedImage = null;
    imageInput.value = '';
    imagePreview.classList.add('hidden');
    previewImg.src = '';
}

async function uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch(`${API_BASE_URL}/upload.php`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            return data.image_url;
        } else {
            throw new Error(data.error || 'Upload failed');
        }
    } catch (error) {
        console.error('Image upload error:', error);
        alert('Failed to upload image');
        return null;
    }
}

// ============================================
// UI HELPERS
// ============================================

function showAuthModal() {
    authModal.classList.add('active');
}

function hideAuthModal() {
    authModal.classList.remove('active');
}

function showLoginForm() {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    document.getElementById('authTitle').textContent = 'Welcome Back';
    loginError.classList.add('hidden');
}

function showRegisterForm() {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    document.getElementById('authTitle').textContent = 'Join CampusBuzz';
    registerError.classList.add('hidden');
}

function showAuthenticatedUI() {
    loginBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    userInfo.classList.remove('hidden');
    postComposer.classList.remove('hidden');
    notificationsBtn.classList.remove('hidden');
    usernameDisplay.textContent = `@${currentUser.username}`;
}

function showUnauthenticatedUI() {
    loginBtn.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    userInfo.classList.add('hidden');
    postComposer.classList.add('hidden');
    notificationsBtn.classList.add('hidden');
    stopNotificationsPolling();
}

function showError(element, message) {
    element.textContent = message;
    element.classList.remove('hidden');
}

function updateCharCounter() {
    const length = postContent.value.length;
    charCounter.textContent = `${length}/500`;

    if (length > 450) {
        charCounter.classList.add('warning');
    } else {
        charCounter.classList.remove('warning');
    }

    if (length > 500) {
        charCounter.classList.add('error');
    } else {
        charCounter.classList.remove('error');
    }
}

// ============================================
// POLLING FOR REAL-TIME UPDATES
// ============================================

function startPolling() {
    pollTimer = setInterval(async () => {
        // Silently refresh posts in background
        try {
            const response = await fetch(`${API_BASE_URL}/posts.php?action=list&limit=20`, {
                credentials: 'include'
            });
            const data = await response.json();

            if (data.success && data.posts.length > 0) {
                // Only update if there are new posts
                const currentFirstPostId = postsContainer.firstChild?.dataset.postId;
                const newFirstPostId = data.posts[0].id;

                if (currentFirstPostId !== newFirstPostId) {
                    renderPosts(data.posts);
                }
            }
        } catch (error) {
            console.error('Polling error:', error);
        }
    }, POLL_INTERVAL);
}

function stopPolling() {
    if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getTimeAgo(timestamp) {
    const now = new Date();
    const postTime = new Date(timestamp);
    const seconds = Math.floor((now - postTime) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return postTime.toLocaleDateString();
}

// Helper function to calculate time until expiration
function getTimeUntilExpiration(expiresAt) {
    const now = new Date();
    const expirationTime = new Date(expiresAt);
    const seconds = Math.floor((expirationTime - now) / 1000);

    if (seconds < 0) return 'Expired';
    if (seconds < 60) return `${seconds}s left`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m left`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h left`;

    return `${Math.floor(seconds / 86400)}d left`;
}

// ============================================
// NOTIFICATIONS
// ============================================

let notificationsPollTimer = null;

async function fetchNotifications() {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications.php?action=list`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.success) {
            renderNotifications(data.notifications);
        }
    } catch (error) {
        console.error('Failed to fetch notifications:', error);
    }
}

async function fetchUnreadCount() {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications.php?action=unread_count`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.success) {
            updateNotificationBadge(data.count);
        }
    } catch (error) {
        console.error('Failed to fetch unread count:', error);
    }
}

function updateNotificationBadge(count) {
    if (count > 0) {
        notificationBadge.textContent = count > 99 ? '99+' : count;
        notificationBadge.classList.remove('hidden');
    } else {
        notificationBadge.classList.add('hidden');
    }
}

function renderNotifications(notifications) {
    notificationsLoading.classList.add('hidden');

    if (notifications.length === 0) {
        notificationsList.innerHTML = `
            <div class="empty-notifications">
                <div class="empty-notifications-icon">🔔</div>
                <p>No notifications yet</p>
            </div>
        `;
        return;
    }

    notificationsList.innerHTML = notifications.map(notification => {
        const icon = getNotificationIcon(notification.type);
        const actionText = getNotificationActionText(notification.type);
        const timeAgo = getTimeAgo(notification.created_at);
        const postPreview = notification.post_content.substring(0, 50) + (notification.post_content.length > 50 ? '...' : '');

        return `
            <div class="notification-item ${!notification.is_read ? 'unread' : ''}" 
                 data-notification-id="${notification.id}"
                 data-post-id="${notification.post_id}">
                <div class="notification-icon ${notification.type}">
                    ${icon}
                </div>
                <div class="notification-content">
                    <p class="notification-text">
                        <strong>${escapeHtml(notification.actor_username)}</strong> ${actionText}
                    </p>
                    <p class="notification-post-preview">"${escapeHtml(postPreview)}"</p>
                    <span class="notification-time">${timeAgo}</span>
                </div>
            </div>
        `;
    }).join('');

    // Add click handlers
    document.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', () => handleNotificationClick(item));
    });
}

function getNotificationIcon(type) {
    switch (type) {
        case 'like':
            return '❤️';
        case 'comment':
            return '💬';
        case 'mention':
            return '@';
        default:
            return '🔔';
    }
}

function getNotificationActionText(type) {
    switch (type) {
        case 'like':
            return 'liked your post';
        case 'comment':
            return 'commented on your post';
        case 'mention':
            return 'mentioned you in a post';
        default:
            return 'interacted with your post';
    }
}

async function handleNotificationClick(item) {
    const notificationId = item.dataset.notificationId;
    const postId = item.dataset.postId;

    // Mark as read
    if (item.classList.contains('unread')) {
        await markNotificationAsRead(notificationId);
        item.classList.remove('unread');
        await fetchUnreadCount();
    }

    // Close modal
    hideNotificationsModal();

    // Scroll to post (if on timeline)
    const postElement = document.querySelector(`[data-post-id="${postId}"]`);
    if (postElement) {
        postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        postElement.style.animation = 'pulse 1s';
    }
}

async function markNotificationAsRead(notificationId) {
    try {
        await fetch(`${API_BASE_URL}/notifications.php?action=mark_read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ notification_id: parseInt(notificationId) })
        });
    } catch (error) {
        console.error('Failed to mark notification as read:', error);
    }
}

async function markAllNotificationsAsRead() {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications.php?action=mark_all_read`, {
            method: 'POST',
            credentials: 'include'
        });
        const data = await response.json();

        if (data.success) {
            // Refresh notifications
            await fetchNotifications();
            await fetchUnreadCount();
        }
    } catch (error) {
        console.error('Failed to mark all as read:', error);
    }
}

function showNotificationsModal() {
    notificationsModal.classList.add('active');
    fetchNotifications();
}

function hideNotificationsModal() {
    notificationsModal.classList.remove('active');
}

function startNotificationsPolling() {
    // Poll for unread count every 30 seconds
    notificationsPollTimer = setInterval(fetchUnreadCount, 30000);
    // Initial fetch
    fetchUnreadCount();
}

function stopNotificationsPolling() {
    if (notificationsPollTimer) {
        clearInterval(notificationsPollTimer);
        notificationsPollTimer = null;
    }
}

// Format post content to highlight @mentions
function formatPostContent(content) {
    return content.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
}
