<?php
// auth_helpers.php - Authentication helper functions
// This file is meant to be included by other files (posts.php, users.php, etc.)

// Start session for authentication (only if not already started)
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Helper function to validate session
function isAuthenticated()
{
    return isset($_SESSION['user_id']);
}

// Helper function to get current user ID
function getCurrentUser()
{
    if (!isAuthenticated()) {
        return null;
    }
    return $_SESSION['user_id'];
}
