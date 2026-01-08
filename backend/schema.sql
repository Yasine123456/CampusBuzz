-- ============================================
-- CampusBuzz Database Schema
-- Run this script in phpMyAdmin to set up
-- the complete database in one go
-- ============================================

-- Create database (optional - uncomment if needed)
-- CREATE DATABASE IF NOT EXISTS campusbuzz;
-- USE campusbuzz;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NULL,
    google_id VARCHAR(255) NULL,
    bio TEXT,
    avatar_url VARCHAR(255),
    major VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- POSTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(255),
    is_ghost BOOLEAN DEFAULT FALSE,
    expires_at DATETIME NULL,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_expires_at (expires_at)
);

-- ============================================
-- LIKES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_like (post_id, user_id)
);

-- ============================================
-- COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_post_id (post_id)
);

-- ============================================
-- BOOKMARKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bookmarks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_bookmark (post_id, user_id)
);

-- ============================================
-- FOLLOWERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS followers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    follower_id INT NOT NULL,
    following_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_follow (follower_id, following_id),
    INDEX idx_follower (follower_id),
    INDEX idx_following (following_id)
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('like', 'comment', 'mention', 'follow') NOT NULL,
    post_id INT NULL,
    actor_id INT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_read (user_id, is_read),
    INDEX idx_created (created_at)
);

-- ============================================
-- MEDIA TABLE (Polymorphic - supports posts and users)
-- ============================================
CREATE TABLE IF NOT EXISTS media (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Polymorphic relation (post, user_avatar, user_banner)
    entity_type ENUM('post', 'user_avatar', 'user_banner') NOT NULL,
    entity_id INT NOT NULL,
    
    -- Media information
    url VARCHAR(500) NOT NULL,
    media_type ENUM('image', 'video', 'gif') DEFAULT 'image',
    position TINYINT DEFAULT 0,  -- Order for posts (0-3), always 0 for avatar/banner
    
    -- Metadata
    width INT NULL,
    height INT NULL,
    file_size INT NULL,
    alt_text VARCHAR(255) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created (created_at)
);

-- ============================================
-- MIGRATION: Run these if you already have tables
-- ============================================
-- ALTER TABLE users ADD COLUMN major VARCHAR(100) AFTER avatar_url;

-- Google OAuth migration (run this to enable OAuth on existing databases):
-- ALTER TABLE users ADD COLUMN google_id VARCHAR(255) NULL AFTER email;
-- ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL;

-- ============================================
-- MEDIA TABLE MIGRATION (Run after creating media table)
-- ============================================
-- Run this to create the media table on existing databases:
-- CREATE TABLE IF NOT EXISTS media (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     entity_type ENUM('post', 'user_avatar', 'user_banner') NOT NULL,
--     entity_id INT NOT NULL,
--     url VARCHAR(500) NOT NULL,
--     media_type ENUM('image', 'video', 'gif') DEFAULT 'image',
--     position TINYINT DEFAULT 0,
--     width INT NULL,
--     height INT NULL,
--     file_size INT NULL,
--     alt_text VARCHAR(255) NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     INDEX idx_entity (entity_type, entity_id),
--     INDEX idx_created (created_at)
-- );

-- Migrate existing post images to media table:
-- INSERT INTO media (entity_type, entity_id, url)
-- SELECT 'post', id, image_url 
-- FROM posts WHERE image_url IS NOT NULL AND image_url != '';

-- Migrate existing user avatars to media table:
-- INSERT INTO media (entity_type, entity_id, url)
-- SELECT 'user_avatar', id, avatar_url 
-- FROM users WHERE avatar_url IS NOT NULL AND avatar_url != '';

-- ============================================
-- CONVERSATIONS TABLE (for private messages)
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user1_id INT NOT NULL,
    user2_id INT NOT NULL,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Ensure unique conversation between 2 users (user1_id should always be < user2_id)
    UNIQUE KEY unique_conversation (user1_id, user2_id),
    
    INDEX idx_user1 (user1_id),
    INDEX idx_user2 (user2_id),
    INDEX idx_last_message (last_message_at)
);

-- ============================================
-- MESSAGES TABLE (content of private messages)
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_conversation (conversation_id),
    INDEX idx_sender (sender_id),
    INDEX idx_created (created_at),
    INDEX idx_unread (conversation_id, is_read)
);

-- ============================================
-- MESSAGES MIGRATION (Run on existing database)
-- ============================================
-- CREATE TABLE IF NOT EXISTS conversations (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     user1_id INT NOT NULL,
--     user2_id INT NOT NULL,
--     last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     UNIQUE KEY unique_conversation (user1_id, user2_id),
--     INDEX idx_user1 (user1_id),
--     INDEX idx_user2 (user2_id),
--     INDEX idx_last_message (last_message_at)
-- );
--
-- CREATE TABLE IF NOT EXISTS messages (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     conversation_id INT NOT NULL,
--     sender_id INT NOT NULL,
--     content TEXT NOT NULL,
--     is_read BOOLEAN DEFAULT FALSE,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     INDEX idx_conversation (conversation_id),
--     INDEX idx_sender (sender_id),
--     INDEX idx_created (created_at),
--     INDEX idx_unread (conversation_id, is_read)
-- );
