<?php
// debug_post.php - Debug post creation
session_start();
header('Content-Type: text/html; charset=utf-8');

echo "<h1>Post Creation Debug</h1>";

echo "<h2>Session Info</h2>";
echo "<pre>";
print_r($_SESSION);
echo "</pre>";

echo "<h2>Test Post Creation</h2>";

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo "<p style='color: red;'>❌ No active session. Please log in first.</p>";
    echo "<p><a href='../frontend/index.html'>Go to Frontend</a></p>";
    exit;
}

echo "<p style='color: green;'>✅ Session active. User ID: {$_SESSION['user_id']}, Username: {$_SESSION['username']}</p>";

// Try to create a test post
require_once 'db_connection.php';

try {
    $content = "Test post created at " . date('Y-m-d H:i:s');
    $userId = $_SESSION['user_id'];
    
    $stmt = $pdo->prepare("INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, NULL)");
    $stmt->execute([$userId, $content]);
    
    $postId = $pdo->lastInsertId();
    
    echo "<p style='color: green;'>✅ Post created successfully! Post ID: $postId</p>";
    echo "<p><strong>Content:</strong> $content</p>";
    
    // Fetch the post
    $stmt = $pdo->prepare("SELECT * FROM posts WHERE id = ?");
    $stmt->execute([$postId]);
    $post = $stmt->fetch();
    
    echo "<h3>Post Data:</h3>";
    echo "<pre>";
    print_r($post);
    echo "</pre>";
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>❌ Database error: " . $e->getMessage() . "</p>";
}
?>
