<?php
// simple_post_test.php - Minimal test for post creation
session_start();

// Set user session
$_SESSION['user_id'] = 2;
$_SESSION['username'] = 'test';

require_once 'db_connection.php';

header('Content-Type: application/json');

try {
    $content = "Simple test post " . time();
    $userId = $_SESSION['user_id'];
    
    $stmt = $pdo->prepare("INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, NULL)");
    $stmt->execute([$userId, $content]);
    
    $postId = $pdo->lastInsertId();
    
    // Fetch the created post
    $stmt = $pdo->prepare("
        SELECT 
            p.id, 
            p.content, 
            p.image_url, 
            p.likes_count, 
            p.comments_count, 
            p.created_at,
            u.id as user_id,
            u.username,
            u.avatar_url
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = ?
    ");
    $stmt->execute([$postId]);
    $post = $stmt->fetch();
    
    echo json_encode([
        'success' => true,
        'post' => $post
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
