// app.js - CampusBuzz Frontend Application

// Configuration
// Use relative path for deployment - works on any domain
const API_BASE_URL = window.location.origin.includes('localhost')
    ? 'http://localhost:8000'  // Local development
    : '/nu/backend';           // Production - PHP files are in /nu/backend/
const POLL_INTERVAL = 10000; // Poll for new posts every 10 seconds

// State
let currentUser = null;
let selectedImages = []; // Changed to array for multiple images (max 4)
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
// Multi-image preview elements are created dynamically
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

// Search elements
const searchContainer = document.getElementById('searchContainer');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

// Profile elements
const profileBtn = document.getElementById('profileBtn');
const profileModal = document.getElementById('profileModal');
const closeProfileBtn = document.getElementById('closeProfileBtn');

// Bookmarks elements
const bookmarksBtn = document.getElementById('bookmarksBtn');
const bookmarksModal = document.getElementById('bookmarksModal');
const bookmarksList = document.getElementById('bookmarksList');
const bookmarksLoading = document.getElementById('bookmarksLoading');
const closeBookmarksBtn = document.getElementById('closeBookmarksBtn');

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
    // Image upload
    imageUploadBtn.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', handleImageSelect);

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

    // Search - trigger modal on Enter key
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const query = e.target.value.trim();
            if (query.length >= 2) {
                showSearchModal(query);
            }
        }
    });

    // Search button (for mobile)
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            showSearchModal('');
        });
    }

    // Profile
    profileBtn.addEventListener('click', showProfileModal);
    closeProfileBtn.addEventListener('click', hideProfileModal);

    // Bookmarks
    bookmarksBtn.addEventListener('click', showBookmarksModal);
    closeBookmarksBtn.addEventListener('click', hideBookmarksModal);

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

    profileModal.addEventListener('click', (e) => {
        if (e.target === profileModal) {
            hideProfileModal();
        }
    });

    bookmarksModal.addEventListener('click', (e) => {
        if (e.target === bookmarksModal) {
            hideBookmarksModal();
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
    const major = document.getElementById('registerMajor').value;

    registerError.classList.add('hidden');

    try {
        const response = await fetch(`${API_BASE_URL}/auth.php?action=register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, email, password, major })
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
    // Redirect to server-side logout which destroys session and returns to login
    window.location.href = '/nu/auth/logout.php';
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

    // Make username clickable only for non-ghost posts
    const usernameHtml = post.is_ghost
        ? `<div class="post-username">${escapeHtml(displayName)}<span class="ghost-badge">👻 Ghost</span></div>`
        : `<div class="post-username clickable" data-user-id="${post.user_id}">@${escapeHtml(displayName)}</div>`;

    article.innerHTML = `
        <div class="post-header">
            <div class="avatar${!post.is_ghost ? ' clickable' : ''}" ${!post.is_ghost ? `data-user-id="${post.user_id}"` : ''}>
                ${post.avatar_url && !post.is_ghost ? `<img src="${post.avatar_url}" alt="${displayName}">` : avatarInitial}
            </div>
            <div class="post-author">
                ${usernameHtml}
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
        ${renderPostMedia(post.media || (post.image_url ? [{ url: post.image_url, media_type: 'image' }] : []))}
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
            <div class="post-action bookmark-btn ${post.bookmarked_by_user ? 'bookmarked' : ''}" data-post-id="${post.id}">
                <svg xmlns="http://www.w3.org/2000/svg" fill="${post.bookmarked_by_user ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
            </div>
        </div>
    `;

    // Add event listeners
    const likeBtn = article.querySelector('.like-btn');
    const commentBtn = article.querySelector('.comment-btn');
    const bookmarkBtn = article.querySelector('.bookmark-btn');
    const deleteBtn = article.querySelector('.delete-post-btn');
    const usernameBtn = article.querySelector('.post-username.clickable');
    const avatarBtn = article.querySelector('.avatar.clickable');

    if (likeBtn) {
        likeBtn.addEventListener('click', () => handleLike(post.id));
    }

    if (commentBtn) {
        commentBtn.addEventListener('click', () => toggleComments(post.id));
    }

    if (bookmarkBtn) {
        bookmarkBtn.addEventListener('click', () => toggleBookmark(post.id));
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => handleDeletePost(post.id));
    }

    // Click on username or avatar to view profile
    if (usernameBtn) {
        usernameBtn.addEventListener('click', () => showUserProfile(post.user_id));
    }

    if (avatarBtn) {
        avatarBtn.addEventListener('click', () => showUserProfile(post.user_id));
    }

    // Click on @mentions to view profile
    article.querySelectorAll('.mention').forEach(mention => {
        mention.addEventListener('click', async (e) => {
            e.stopPropagation();
            const username = mention.dataset.username;
            if (username) {
                await openProfileByUsername(username);
            }
        });
    });

    // Click on #hashtags to search for posts
    article.querySelectorAll('.hashtag').forEach(hashtag => {
        hashtag.addEventListener('click', (e) => {
            e.stopPropagation();
            const tag = hashtag.dataset.tag;
            if (tag) {
                searchByHashtag(tag);
            }
        });
    });

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
        let imageUrls = [];

        // Upload all selected images with delay between each to avoid server overload
        if (selectedImages.length > 0) {
            let uploadedCount = 0;
            for (let i = 0; i < selectedImages.length; i++) {
                postBtn.textContent = `Uploading ${i + 1}/${selectedImages.length}...`;
                const url = await uploadImage(selectedImages[i]);
                if (url) {
                    imageUrls.push(url);
                    uploadedCount++;
                }
                // Add small delay between uploads to avoid overwhelming the server
                if (i < selectedImages.length - 1) {
                    await delay(300);
                }
            }
            // Show warning if some uploads failed
            if (uploadedCount < selectedImages.length) {
                console.warn(`Only ${uploadedCount}/${selectedImages.length} images uploaded successfully`);
            }
            imageUrl = imageUrls[0] || null; // First image for legacy compatibility
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
                image_urls: imageUrls,
                is_ghost: isGhost,
                expires_in_hours: expiresInHours
            })
        });

        const data = await response.json();

        if (data.success) {
            // Clear composer
            postContent.value = '';
            removeAllImages();
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

const MAX_IMAGES = 2;
const imagePreviewGrid = document.getElementById('imagePreviewGrid');
const imageCountIndicator = document.getElementById('imageCountIndicator');

function handleImageSelect(e) {
    const files = Array.from(e.target.files);

    if (!files.length) return;

    // Check max images limit
    const remainingSlots = MAX_IMAGES - selectedImages.length;
    if (remainingSlots <= 0) {
        alert(`Maximum ${MAX_IMAGES} images allowed per post`);
        return;
    }

    const filesToAdd = files.slice(0, remainingSlots);

    for (const file of filesToAdd) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select only image files');
            continue;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert(`Image "${file.name}" is too large. Maximum size is 5MB`);
            continue;
        }

        selectedImages.push(file);
    }

    updateImagePreviews();

    // Reset input so same files can be selected again
    imageInput.value = '';
}

function updateImagePreviews() {
    imagePreviewGrid.innerHTML = '';

    if (selectedImages.length === 0) {
        imagePreviewGrid.classList.add('hidden');
        imageCountIndicator.classList.add('hidden');
        return;
    }

    imagePreviewGrid.classList.remove('hidden');
    imageCountIndicator.classList.remove('hidden');
    imageCountIndicator.textContent = `${selectedImages.length}/${MAX_IMAGES}`;

    selectedImages.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'image-preview-item';
            previewItem.innerHTML = `
                <img src="${e.target.result}" alt="Preview ${index + 1}">
                <button class="remove-btn" data-index="${index}">&times;</button>
            `;

            previewItem.querySelector('.remove-btn').addEventListener('click', () => {
                removeImageAtIndex(index);
            });

            imagePreviewGrid.appendChild(previewItem);
        };
        reader.readAsDataURL(file);
    });
}

function removeImageAtIndex(index) {
    selectedImages.splice(index, 1);
    updateImagePreviews();
}

function removeAllImages() {
    selectedImages = [];
    imageInput.value = '';
    updateImagePreviews();
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

        // Log the raw response for debugging
        const text = await response.text();
        console.log('Upload response:', text);

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Invalid JSON response:', text);
            // Don't show alert for each failed upload, just log it
            console.warn('Upload failed for file:', file.name, '- Server returned invalid response');
            return null;
        }

        if (data.success) {
            return data.image_url;
        } else {
            console.warn('Upload failed for file:', file.name, '-', data.error);
            return null;
        }
    } catch (error) {
        console.error('Image upload error:', error);
        return null;
    }
}

// Helper to add delay between uploads
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
    searchContainer.classList.remove('hidden');
    profileBtn.classList.remove('hidden');
    bookmarksBtn.classList.remove('hidden');
    messagesBtn.classList.remove('hidden');
    document.getElementById('searchBtn')?.classList.remove('hidden');
    usernameDisplay.textContent = `@${currentUser.username}`;
    startMessagesPolling();
}

function showUnauthenticatedUI() {
    loginBtn.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    userInfo.classList.add('hidden');
    postComposer.classList.add('hidden');
    notificationsBtn.classList.add('hidden');
    searchContainer.classList.add('hidden');
    profileBtn.classList.add('hidden');
    bookmarksBtn.classList.add('hidden');
    messagesBtn.classList.add('hidden');
    document.getElementById('searchBtn')?.classList.add('hidden');
    stopNotificationsPolling();
    stopMessagesPolling();
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

// Render media gallery for posts (supports 1-4 images)
function renderPostMedia(media) {
    if (!media || media.length === 0) return '';

    const images = media.filter(m => m.media_type === 'image' || !m.media_type);
    if (images.length === 0) return '';

    // Single image
    if (images.length === 1) {
        return `<div class="post-media-grid media-count-1">
            <img src="${images[0].url}" alt="Post image" class="post-media-item" onclick="openImageViewer('${images[0].url}')">
        </div>`;
    }

    // Multiple images (2-4)
    const count = Math.min(images.length, 4);
    const gridItems = images.slice(0, 4).map((img, index) =>
        `<img src="${img.url}" alt="Post image ${index + 1}" class="post-media-item" onclick="openImageViewer('${img.url}')">`
    ).join('');

    return `<div class="post-media-grid media-count-${count}">
        ${gridItems}
    </div>`;
}

// Open image in fullscreen viewer
function openImageViewer(imageUrl) {
    const viewer = document.createElement('div');
    viewer.className = 'image-viewer-overlay';
    viewer.innerHTML = `
        <div class="image-viewer-content">
            <button class="image-viewer-close">&times;</button>
            <img src="${imageUrl}" alt="Full size image">
        </div>
    `;

    viewer.addEventListener('click', (e) => {
        if (e.target === viewer || e.target.classList.contains('image-viewer-close')) {
            viewer.remove();
        }
    });

    document.body.appendChild(viewer);
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

// Format post content to highlight @mentions and #hashtags (clickable)
function formatPostContent(content) {
    // First replace mentions
    let formatted = content.replace(/@(\w+)/g, '<span class="mention" data-username="$1">@$1</span>');
    // Then replace hashtags
    formatted = formatted.replace(/#(\w+)/g, '<span class="hashtag" data-tag="$1">#$1</span>');
    return formatted;
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================

function searchByHashtag(tag) {
    // Search for posts containing this hashtag
    const searchQuery = `#${tag}`;
    showSearchModal(searchQuery);
}

const modalSearchInput = document.getElementById('modalSearchInput');

function showSearchModal(query) {
    const searchModal = document.getElementById('searchModal');
    const searchModalTitle = document.getElementById('searchModalTitle');
    const searchModalResults = document.getElementById('searchModalResults');
    const modalSearchInput = document.getElementById('modalSearchInput');

    // Show modal
    searchModal.classList.add('active');

    // Update inputs
    if (modalSearchInput) {
        modalSearchInput.value = query;
        // Focus input if query is empty (mobile search button click)
        if (!query) {
            setTimeout(() => modalSearchInput.focus(), 100);
        }

        // Add execute search on enter
        modalSearchInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                const newQuery = e.target.value.trim();
                if (newQuery) {
                    performSearch(newQuery);
                }
            }
        };
    }

    // Setup close handlers
    document.getElementById('closeSearchModalBtn').onclick = hideSearchModal;
    searchModal.onclick = (e) => {
        if (e.target === searchModal) hideSearchModal();
    };

    // Only perform search if we have a query
    if (query) {
        performSearch(query);
    } else {
        searchModalResults.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <p>Type to search tailored content</p>
            </div>
        `;
    }
}

async function performSearch(query) {
    const searchModalResults = document.getElementById('searchModalResults');
    const searchModalTitle = document.getElementById('searchModalTitle');

    // Update title
    if (searchModalTitle) searchModalTitle.textContent = `Search: "${query}"`;

    // Show loading
    searchModalResults.innerHTML = '<div class="loading-container"><div class="spinner"></div></div>';

    // Perform search request... (rest of the logic)
    handleSearch(query);
}

function hideSearchModal() {
    document.getElementById('searchModal').classList.remove('active');
}

async function handleSearch(query) {
    try {
        const response = await fetch(`${API_BASE_URL}/search.php?q=${encodeURIComponent(query)}&type=all`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.success) {
            renderSearchResultsInModal(data, query);
        }
    } catch (error) {
        console.error('Search error:', error);
        document.getElementById('searchModalResults').innerHTML =
            '<div class="search-modal-empty">Search failed. Please try again.</div>';
    }
}

function renderSearchResultsInModal(data, query) {
    const searchModalResults = document.getElementById('searchModalResults');

    if (data.posts.length === 0 && data.users.length === 0) {
        searchModalResults.innerHTML = '<div class="search-modal-empty">No results found</div>';
    } else {
        let html = '';

        if (data.users.length > 0) {
            html += '<div class="search-modal-section"><div class="search-modal-section-title">Users</div>';
            data.users.forEach(user => {
                html += `
                    <div class="search-modal-item user-result" data-user-id="${user.id}">
                        <div class="avatar">${user.username.charAt(0).toUpperCase()}</div>
                        <div class="search-modal-item-info">
                            <div class="search-modal-item-title">@${escapeHtml(user.username)}</div>
                            ${user.major ? `<div class="search-modal-item-subtitle">${escapeHtml(user.major)}</div>` : ''}
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }

        if (data.posts.length > 0) {
            html += '<div class="search-modal-section"><div class="search-modal-section-title">Posts</div>';
            data.posts.forEach(post => {
                const preview = post.content.substring(0, 80) + (post.content.length > 80 ? '...' : '');
                html += `
                    <div class="search-modal-item post-result" data-post-id="${post.id}">
                        <div class="avatar">${post.username.charAt(0).toUpperCase()}</div>
                        <div class="search-modal-item-info">
                            <div class="search-modal-item-title">@${escapeHtml(post.username)}</div>
                            <div class="search-modal-item-subtitle">${escapeHtml(preview)}</div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }

        searchModalResults.innerHTML = html;

        // Add click handlers for user results
        searchModalResults.querySelectorAll('.user-result').forEach(item => {
            item.addEventListener('click', () => {
                const userId = item.dataset.userId;
                hideSearchModal();
                showUserProfile(parseInt(userId));
            });
        });

        // Add click handlers for post results
        searchModalResults.querySelectorAll('.post-result').forEach(item => {
            item.addEventListener('click', () => {
                const postId = item.dataset.postId;
                hideSearchModal();
                const postElement = document.querySelector(`[data-post-id="${postId}"]`);
                if (postElement) {
                    postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    postElement.style.animation = 'pulse 1s';
                }
            });
        });
    }
}

// ============================================
// PROFILE FUNCTIONALITY
// ============================================

async function showProfileModal() {
    // Show current user's profile
    if (currentUser) {
        showUserProfile(currentUser.id);
    }
}

async function showUserProfile(userId) {
    profileModal.classList.add('active');

    // Show loading state for posts
    const profilePostsList = document.getElementById('profilePostsList');
    const profilePostsLoading = document.getElementById('profilePostsLoading');
    if (profilePostsLoading) {
        profilePostsLoading.classList.remove('hidden');
    }

    try {
        // Fetch user info
        const response = await fetch(`${API_BASE_URL}/users.php?id=${userId}`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.success) {
            const user = data.user;

            // Update avatar
            const avatarEl = document.getElementById('profileAvatar');
            if (user.avatar_url) {
                avatarEl.innerHTML = `<img src="${user.avatar_url}" alt="${user.username}">`;
            } else {
                avatarEl.textContent = user.username.charAt(0).toUpperCase();
            }

            // Update display name and username
            document.getElementById('profileDisplayName').textContent = user.display_name || user.username;
            document.getElementById('profileUsername').textContent = `@${user.username}`;
            document.getElementById('profileMajor').textContent = user.major || '';
            document.getElementById('profileBio').textContent = user.bio || 'No bio yet';
            document.getElementById('profilePostCount').textContent = user.post_count || 0;
            document.getElementById('profileFollowers').textContent = user.follower_count || 0;
            document.getElementById('profileFollowing').textContent = user.following_count || 0;
            document.getElementById('profileJoined').textContent = `Joined: ${new Date(user.created_at).toLocaleDateString()}`;

            // Handle follow button
            const followBtn = document.getElementById('profileFollowBtn');
            const editBtn = document.getElementById('editProfileBtn');
            const messageBtn = document.getElementById('profileMessageBtn');

            if (currentUser && currentUser.id !== userId) {
                // Show follow button for other users
                followBtn.classList.remove('hidden');
                followBtn.dataset.userId = userId;
                editBtn.classList.add('hidden');

                // Show message button for other users
                messageBtn.classList.remove('hidden');
                messageBtn.dataset.userId = userId;

                // Set button state
                if (user.is_following) {
                    followBtn.classList.add('following');
                    followBtn.querySelector('.follow-text').textContent = 'Following';
                } else {
                    followBtn.classList.remove('following');
                    followBtn.querySelector('.follow-text').textContent = 'Follow';
                }

                // Add click handler (remove old one first)
                followBtn.onclick = () => toggleFollow(userId);
            } else if (currentUser && currentUser.id === userId) {
                // Show edit button for own profile
                followBtn.classList.add('hidden');
                messageBtn.classList.add('hidden');
                editBtn.classList.remove('hidden');
                editBtn.onclick = () => showEditProfileModal(user);
            } else {
                followBtn.classList.add('hidden');
                messageBtn.classList.add('hidden');
                editBtn.classList.add('hidden');
            }

            // Fetch user's posts
            await loadUserPosts(userId);
        }
    } catch (error) {
        console.error('Failed to load profile:', error);
    }
}

async function toggleFollow(userId) {
    if (!currentUser) {
        showAuthModal();
        return;
    }

    const followBtn = document.getElementById('profileFollowBtn');
    followBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/users.php?action=follow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ user_id: userId })
        });

        const data = await response.json();

        if (data.success) {
            // Update button state
            if (data.is_following) {
                followBtn.classList.add('following');
                followBtn.querySelector('.follow-text').textContent = 'Following';
            } else {
                followBtn.classList.remove('following');
                followBtn.querySelector('.follow-text').textContent = 'Follow';
            }

            // Update follower count
            document.getElementById('profileFollowers').textContent = data.follower_count;
        } else {
            console.error('Follow error:', data.error);
        }
    } catch (error) {
        console.error('Failed to toggle follow:', error);
    } finally {
        followBtn.disabled = false;
    }
}

async function loadUserPosts(userId) {
    const profilePostsList = document.getElementById('profilePostsList');
    const profilePostsLoading = document.getElementById('profilePostsLoading');

    try {
        const response = await fetch(`${API_BASE_URL}/posts.php?action=user_posts&user_id=${userId}`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (profilePostsLoading) {
            profilePostsLoading.classList.add('hidden');
        }

        if (data.success && data.posts.length > 0) {
            profilePostsList.innerHTML = data.posts.map(post => {
                const preview = post.content.substring(0, 100) + (post.content.length > 100 ? '...' : '');
                const timeAgo = getTimeAgo(post.created_at);
                return `
                    <div class="profile-post-item" data-post-id="${post.id}">
                        <div class="profile-post-content">${escapeHtml(preview)}</div>
                        <div class="profile-post-meta">
                            <span>❤️ ${post.likes_count}</span>
                            <span>💬 ${post.comments_count}</span>
                            <span>${timeAgo}</span>
                        </div>
                    </div>
                `;
            }).join('');

            // Add click handlers to navigate to post
            profilePostsList.querySelectorAll('.profile-post-item').forEach(item => {
                item.addEventListener('click', () => {
                    hideProfileModal();
                    const postId = item.dataset.postId;
                    const postElement = document.querySelector(`[data-post-id="${postId}"]`);
                    if (postElement) {
                        postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        postElement.style.animation = 'pulse 1s';
                    }
                });
            });
        } else {
            profilePostsList.innerHTML = '<div class="profile-posts-empty">No posts yet</div>';
        }
    } catch (error) {
        console.error('Failed to load user posts:', error);
        profilePostsList.innerHTML = '<div class="profile-posts-empty">Failed to load posts</div>';
    }
}

function hideProfileModal() {
    profileModal.classList.remove('active');
}

async function openProfileByUsername(username) {
    try {
        // Search for user by username
        const response = await fetch(`${API_BASE_URL}/search.php?q=${encodeURIComponent(username)}&type=users&limit=5`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.success && data.users.length > 0) {
            // Find exact match for username
            const user = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
            if (user) {
                showUserProfile(user.id);
            } else {
                // Use first result if no exact match
                showUserProfile(data.users[0].id);
            }
        } else {
            console.log('User not found:', username);
        }
    } catch (error) {
        console.error('Failed to find user:', error);
    }
}

// ============================================
// EDIT PROFILE FUNCTIONALITY
// ============================================

let pendingAvatarFile = null;

function showEditProfileModal(user) {
    const editModal = document.getElementById('editProfileModal');
    const avatarPreview = document.getElementById('editAvatarPreview');
    const displayNameInput = document.getElementById('editDisplayName');
    const bioInput = document.getElementById('editBio');
    const bioCounter = document.getElementById('bioCharCounter');

    // Populate fields with current data
    if (user.avatar_url) {
        avatarPreview.innerHTML = `<img src="${user.avatar_url}" alt="Avatar">`;
    } else {
        avatarPreview.textContent = user.username.charAt(0).toUpperCase();
    }

    displayNameInput.value = user.display_name || user.username;
    bioInput.value = user.bio || '';
    bioCounter.textContent = `${bioInput.value.length}/160`;

    // Reset pending avatar
    pendingAvatarFile = null;

    // Set up event listeners
    const avatarInput = document.getElementById('avatarInput');
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    const closeBtn = document.getElementById('closeEditProfileBtn');
    const cancelBtn = document.getElementById('cancelEditProfileBtn');
    const form = document.getElementById('editProfileForm');

    changeAvatarBtn.onclick = () => avatarInput.click();

    avatarInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert('Image is too large. Maximum size is 5MB');
                return;
            }
            pendingAvatarFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                avatarPreview.innerHTML = `<img src="${e.target.result}" alt="Avatar">`;
            };
            reader.readAsDataURL(file);
        }
    };

    bioInput.oninput = () => {
        bioCounter.textContent = `${bioInput.value.length}/160`;
    };

    closeBtn.onclick = hideEditProfileModal;
    cancelBtn.onclick = hideEditProfileModal;

    form.onsubmit = async (e) => {
        e.preventDefault();
        await saveProfile();
    };

    editModal.onclick = (e) => {
        if (e.target === editModal) {
            hideEditProfileModal();
        }
    };

    editModal.classList.add('active');
}

function hideEditProfileModal() {
    document.getElementById('editProfileModal').classList.remove('active');
}

async function saveProfile() {
    const saveBtn = document.getElementById('saveProfileBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
        let avatarUrl = null;

        // Upload avatar if changed
        if (pendingAvatarFile) {
            const formData = new FormData();
            formData.append('image', pendingAvatarFile);

            const uploadResponse = await fetch(`${API_BASE_URL}/upload.php`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            const uploadData = await uploadResponse.json();
            if (uploadData.success) {
                avatarUrl = uploadData.image_url;
            } else {
                throw new Error(uploadData.error || 'Failed to upload avatar');
            }
        }

        // Prepare update data
        const updateData = {
            display_name: document.getElementById('editDisplayName').value.trim(),
            bio: document.getElementById('editBio').value.trim()
        };

        if (avatarUrl) {
            updateData.avatar_url = avatarUrl;
        }

        // Update profile
        const response = await fetch(`${API_BASE_URL}/users.php?id=${currentUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(updateData)
        });

        const data = await response.json();

        if (data.success) {
            // Update currentUser object
            if (updateData.display_name) currentUser.display_name = updateData.display_name;
            if (updateData.bio) currentUser.bio = updateData.bio;
            if (avatarUrl) currentUser.avatar_url = avatarUrl;

            // Close edit modal and refresh profile
            hideEditProfileModal();
            showUserProfile(currentUser.id);
        } else {
            alert(data.error || 'Failed to update profile');
        }
    } catch (error) {
        console.error('Failed to save profile:', error);
        alert('Failed to save profile: ' + error.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
    }
}

// ============================================
// BOOKMARKS FUNCTIONALITY
// ============================================

async function showBookmarksModal() {
    bookmarksModal.classList.add('active');
    bookmarksLoading.classList.remove('hidden');

    try {
        const response = await fetch(`${API_BASE_URL}/posts.php?action=bookmarks`, {
            credentials: 'include'
        });
        const data = await response.json();

        bookmarksLoading.classList.add('hidden');

        if (data.success && data.posts.length > 0) {
            bookmarksList.innerHTML = data.posts.map(post => {
                const displayName = post.is_ghost ? 'Anonymous' : post.username;
                const timeAgo = getTimeAgo(post.created_at);
                return `
                    <div class="bookmark-item" data-post-id="${post.id}">
                        <div class="bookmark-header">
                            <span class="bookmark-author">@${escapeHtml(displayName)}</span>
                            <span class="bookmark-time">${timeAgo}</span>
                        </div>
                        <div class="bookmark-content">${escapeHtml(post.content.substring(0, 100))}${post.content.length > 100 ? '...' : ''}</div>
                    </div>
                `;
            }).join('');
        } else {
            bookmarksList.innerHTML = '<div class="empty-bookmarks"><div class="empty-icon">📚</div><p>No bookmarks yet</p></div>';
        }
    } catch (error) {
        console.error('Failed to load bookmarks:', error);
        bookmarksLoading.classList.add('hidden');
        bookmarksList.innerHTML = '<div class="bookmarks-error">Failed to load bookmarks</div>';
    }
}

function hideBookmarksModal() {
    bookmarksModal.classList.remove('active');
}

async function toggleBookmark(postId) {
    try {
        const response = await fetch(`${API_BASE_URL}/posts.php?action=bookmark`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ post_id: postId })
        });

        const data = await response.json();

        if (data.success) {
            // Update UI
            const postElement = document.querySelector(`[data-post-id="${postId}"]`);
            const bookmarkBtn = postElement.querySelector('.bookmark-btn');
            const bookmarkIcon = bookmarkBtn.querySelector('svg');

            if (data.bookmarked) {
                bookmarkBtn.classList.add('bookmarked');
                bookmarkIcon.setAttribute('fill', 'currentColor');
            } else {
                bookmarkBtn.classList.remove('bookmarked');
                bookmarkIcon.setAttribute('fill', 'none');
            }
        }
    } catch (error) {
        console.error('Bookmark error:', error);
    }
}

// ============================================
// COMMENTS FUNCTIONALITY
// ============================================

async function toggleComments(postId) {
    const postElement = document.querySelector(`[data-post-id="${postId}"]`);
    let commentsSection = postElement.querySelector('.comments-section');

    if (commentsSection) {
        // Toggle visibility
        commentsSection.classList.toggle('hidden');
        return;
    }

    // Create comments section
    commentsSection = document.createElement('div');
    commentsSection.className = 'comments-section';
    commentsSection.innerHTML = '<div class="loading-container"><div class="spinner"></div></div>';
    postElement.appendChild(commentsSection);

    // Load comments
    try {
        const response = await fetch(`${API_BASE_URL}/posts.php?action=comments&post_id=${postId}`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.success) {
            renderComments(commentsSection, data.comments, postId);
        }
    } catch (error) {
        console.error('Failed to load comments:', error);
        commentsSection.innerHTML = '<div class="comments-error">Failed to load comments</div>';
    }
}

function renderComments(container, comments, postId) {
    let html = '<div class="comments-list">';

    if (comments.length === 0) {
        html += '<div class="no-comments">No comments yet</div>';
    } else {
        comments.forEach(comment => {
            html += `
                <div class="comment">
                    <div class="comment-author">@${escapeHtml(comment.username)}</div>
                    <div class="comment-content">${escapeHtml(comment.content)}</div>
                    <div class="comment-time">${getTimeAgo(comment.created_at)}</div>
                </div>
            `;
        });
    }

    html += '</div>';
    html += `
        <div class="comment-form">
            <input type="text" class="comment-input" placeholder="Write a comment..." data-post-id="${postId}">
            <button class="btn btn-primary btn-sm submit-comment-btn" data-post-id="${postId}">Post</button>
        </div>
    `;

    container.innerHTML = html;

    // Add event listener for submit button
    const submitBtn = container.querySelector('.submit-comment-btn');
    const commentInput = container.querySelector('.comment-input');

    submitBtn.addEventListener('click', () => submitComment(postId, commentInput));
    commentInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submitComment(postId, commentInput);
    });
}

async function submitComment(postId, inputElement) {
    const content = inputElement.value.trim();
    if (!content) return;

    try {
        const response = await fetch(`${API_BASE_URL}/posts.php?action=comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ post_id: postId, content })
        });

        const data = await response.json();

        if (data.success) {
            inputElement.value = '';
            // Reload comments
            const postElement = document.querySelector(`[data-post-id="${postId}"]`);
            const commentsSection = postElement.querySelector('.comments-section');

            // Refresh comments
            const refreshResponse = await fetch(`${API_BASE_URL}/posts.php?action=comments&post_id=${postId}`, {
                credentials: 'include'
            });
            const refreshData = await refreshResponse.json();

            if (refreshData.success) {
                renderComments(commentsSection, refreshData.comments, postId);
            }

            // Update comment count
            const countElement = postElement.querySelector('.comment-btn span');
            if (countElement) {
                countElement.textContent = parseInt(countElement.textContent) + 1;
            }
        }
    } catch (error) {
        console.error('Failed to submit comment:', error);
    }
}

// ============================================
// PRIVATE MESSAGES
// ============================================

// DOM Elements for Messages
const messagesBtn = document.getElementById('messagesBtn');
const messagesBadge = document.getElementById('messagesBadge');
const messagesModal = document.getElementById('messagesModal');
const closeMessagesBtn = document.getElementById('closeMessagesBtn');
const conversationsList = document.getElementById('conversationsList');
const conversationsLoading = document.getElementById('conversationsLoading');
const chatModal = document.getElementById('chatModal');
const chatBackBtn = document.getElementById('chatBackBtn');
const closeChatBtn = document.getElementById('closeChatBtn');
const chatAvatar = document.getElementById('chatAvatar');
const chatUsername = document.getElementById('chatUsername');
const chatMessages = document.getElementById('chatMessages');
const chatLoading = document.getElementById('chatLoading');
const chatInput = document.getElementById('chatInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const profileMessageBtn = document.getElementById('profileMessageBtn');

// Current chat state
let currentConversationId = null;
let currentChatUserId = null;
let messagePollTimer = null;

// Initialize message event listeners
function initMessagesEventListeners() {
    if (messagesBtn) {
        messagesBtn.addEventListener('click', showMessagesModal);
    }
    if (closeMessagesBtn) {
        closeMessagesBtn.addEventListener('click', hideMessagesModal);
    }
    if (chatBackBtn) {
        chatBackBtn.addEventListener('click', () => {
            hideChatModal();
            showMessagesModal();
        });
    }
    if (closeChatBtn) {
        closeChatBtn.addEventListener('click', hideChatModal);
    }
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', handleSendMessage);
    }
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
    }
    if (profileMessageBtn) {
        profileMessageBtn.addEventListener('click', handleProfileMessage);
    }
    if (messagesModal) {
        messagesModal.addEventListener('click', (e) => {
            if (e.target === messagesModal) {
                hideMessagesModal();
            }
        });
    }
    if (chatModal) {
        chatModal.addEventListener('click', (e) => {
            if (e.target === chatModal) {
                hideChatModal();
            }
        });
    }
}

// Call init when DOM is loaded
document.addEventListener('DOMContentLoaded', initMessagesEventListeners);

// Fetch unread messages count
async function fetchMessagesUnreadCount() {
    try {
        const response = await fetch(`${API_BASE_URL}/messages.php?action=unread_count`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.success) {
            updateMessagesBadge(data.count);
        }
    } catch (error) {
        console.error('Failed to fetch messages unread count:', error);
    }
}

function updateMessagesBadge(count) {
    if (messagesBadge) {
        if (count > 0) {
            messagesBadge.textContent = count > 99 ? '99+' : count;
            messagesBadge.classList.remove('hidden');
        } else {
            messagesBadge.classList.add('hidden');
        }
    }
}

// Start polling for messages
function startMessagesPolling() {
    fetchMessagesUnreadCount();
    messagePollTimer = setInterval(fetchMessagesUnreadCount, 30000);
}

function stopMessagesPolling() {
    if (messagePollTimer) {
        clearInterval(messagePollTimer);
        messagePollTimer = null;
    }
}

// Show messages modal and fetch conversations
async function showMessagesModal() {
    messagesModal.classList.add('active');
    conversationsLoading.classList.remove('hidden');

    try {
        const response = await fetch(`${API_BASE_URL}/messages.php?action=conversations`, {
            credentials: 'include'
        });
        const data = await response.json();

        conversationsLoading.classList.add('hidden');

        if (data.success && data.conversations.length > 0) {
            renderConversations(data.conversations);
        } else {
            conversationsList.innerHTML = `
                <div class="empty-conversations">
                    <div class="empty-icon">💬</div>
                    <p>No conversations yet</p>
                    <p style="font-size: 0.875rem; margin-top: 0.5rem;">Start a conversation from someone's profile!</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Failed to load conversations:', error);
        conversationsLoading.classList.add('hidden');
        conversationsList.innerHTML = '<div class="empty-conversations">Failed to load conversations</div>';
    }
}

function hideMessagesModal() {
    messagesModal.classList.remove('active');
}

function renderConversations(conversations) {
    conversationsList.innerHTML = conversations.map(conv => {
        const avatarInitial = conv.other_username ? conv.other_username.charAt(0).toUpperCase() : '?';
        const timeAgo = getTimeAgo(conv.last_message_at);
        const preview = conv.last_message ? conv.last_message.substring(0, 40) + (conv.last_message.length > 40 ? '...' : '') : 'No messages yet';

        return `
            <div class="conversation-item ${conv.unread_count > 0 ? 'unread' : ''}" 
                 data-conversation-id="${conv.id}"
                 data-user-id="${conv.other_user_id}"
                 data-username="${escapeHtml(conv.other_username)}"
                 data-avatar="${conv.other_avatar_url || ''}">
                <div class="conversation-avatar">
                    ${conv.other_avatar_url ? `<img src="${conv.other_avatar_url}" alt="${conv.other_username}">` : avatarInitial}
                </div>
                <div class="conversation-info">
                    <div class="conversation-header">
                        <span class="conversation-username">@${escapeHtml(conv.other_username)}</span>
                        <span class="conversation-time">${timeAgo}</span>
                    </div>
                    <div class="conversation-preview">${escapeHtml(preview)}</div>
                </div>
                ${conv.unread_count > 0 ? `<span class="conversation-unread-badge">${conv.unread_count}</span>` : ''}
            </div>
        `;
    }).join('');

    // Add click handlers
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.addEventListener('click', () => {
            openChat(
                parseInt(item.dataset.conversationId),
                parseInt(item.dataset.userId),
                item.dataset.username,
                item.dataset.avatar
            );
        });
    });
}

// Open chat with a specific conversation
async function openChat(conversationId, userId, username, avatarUrl) {
    currentConversationId = conversationId;
    currentChatUserId = userId;

    // Update chat header
    chatUsername.textContent = `@${username}`;
    if (avatarUrl) {
        chatAvatar.innerHTML = `<img src="${avatarUrl}" alt="${username}">`;
    } else {
        chatAvatar.innerHTML = username.charAt(0).toUpperCase();
    }

    // Hide messages modal and show chat
    hideMessagesModal();
    chatModal.classList.add('active');
    chatLoading.classList.remove('hidden');
    chatMessages.innerHTML = '';
    chatMessages.appendChild(chatLoading);

    // Fetch messages
    await loadMessages(conversationId);

    // Mark as read
    await markConversationAsRead(conversationId);

    // Start polling for new messages in this conversation
    startChatPolling();
}

async function loadMessages(conversationId) {
    try {
        const response = await fetch(`${API_BASE_URL}/messages.php?action=messages&conversation_id=${conversationId}`, {
            credentials: 'include'
        });
        const data = await response.json();

        chatLoading.classList.add('hidden');

        if (data.success) {
            renderMessages(data.messages);
            scrollChatToBottom();
        }
    } catch (error) {
        console.error('Failed to load messages:', error);
        chatLoading.classList.add('hidden');
    }
}

function renderMessages(messages) {
    chatMessages.innerHTML = messages.map(msg => {
        // Convert to int for proper comparison (API returns string, currentUser.id may be number)
        const isSent = parseInt(msg.sender_id) === parseInt(currentUser.id);
        const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return `
            <div class="message-bubble ${isSent ? 'sent' : 'received'}">
                <div class="message-content">${escapeHtml(msg.content)}</div>
                <div class="message-time">${time}</div>
            </div>
        `;
    }).join('');
}

function scrollChatToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function handleSendMessage() {
    const content = chatInput.value.trim();

    if (!content || !currentConversationId) return;

    try {
        sendMessageBtn.disabled = true;

        const response = await fetch(`${API_BASE_URL}/messages.php?action=send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                conversation_id: currentConversationId,
                content: content
            })
        });

        const data = await response.json();

        if (data.success) {
            chatInput.value = '';

            // Add message to chat
            const time = new Date(data.message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const messageHtml = `
                <div class="message-bubble sent">
                    <div class="message-content">${escapeHtml(data.message.content)}</div>
                    <div class="message-time">${time}</div>
                </div>
            `;
            chatMessages.insertAdjacentHTML('beforeend', messageHtml);
            scrollChatToBottom();
        }
    } catch (error) {
        console.error('Failed to send message:', error);
    } finally {
        sendMessageBtn.disabled = false;
    }
}

async function markConversationAsRead(conversationId) {
    try {
        await fetch(`${API_BASE_URL}/messages.php?action=mark_read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ conversation_id: conversationId })
        });
        fetchMessagesUnreadCount();
    } catch (error) {
        console.error('Failed to mark as read:', error);
    }
}

function hideChatModal() {
    chatModal.classList.remove('active');
    currentConversationId = null;
    currentChatUserId = null;
    stopChatPolling();
}

// Polling for new messages in current chat
let chatPollTimer = null;

function startChatPolling() {
    stopChatPolling();
    chatPollTimer = setInterval(async () => {
        if (currentConversationId) {
            await loadMessages(currentConversationId);
        }
    }, 5000);
}

function stopChatPolling() {
    if (chatPollTimer) {
        clearInterval(chatPollTimer);
        chatPollTimer = null;
    }
}

// Handle message button on profile
async function handleProfileMessage() {
    const userId = parseInt(profileMessageBtn.dataset.userId);

    if (!userId) return;

    try {
        profileMessageBtn.disabled = true;
        profileMessageBtn.textContent = 'Loading...';

        const response = await fetch(`${API_BASE_URL}/messages.php?action=start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ user_id: userId })
        });

        const data = await response.json();

        if (data.success) {
            hideProfileModal();
            openChat(
                data.conversation_id,
                data.other_user.id,
                data.other_user.username,
                data.other_user.avatar_url
            );
        }
    } catch (error) {
        console.error('Failed to start conversation:', error);
    } finally {
        profileMessageBtn.disabled = false;
        profileMessageBtn.textContent = '💬 Message';
    }
}
