<?php
// search.php - Search API endpoints for posts and users

require_once 'db_connection.php';
require_once 'auth_helpers.php';

header('Content-Type: application/json');

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Get search parameters
$query = isset($_GET['q']) ? trim($_GET['q']) : '';
$type = isset($_GET['type']) ? $_GET['type'] : 'all'; // posts, users, or all
$limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;

if (empty($query)) {
    http_response_code(400);
    echo json_encode(['error' => 'Search query is required']);
    exit();
}

if (strlen($query) < 2) {
    http_response_code(400);
    echo json_encode(['error' => 'Search query must be at least 2 characters']);
    exit();
}

$results = [
    'success' => true,
    'query' => $query,
    'posts' => [],
    'users' => []
];

try {
    // Search posts
    if ($type === 'posts' || $type === 'all') {
        $searchTerm = '%' . $query . '%';
        $stmt = $pdo->prepare("
            SELECT 
                p.id, 
                p.content, 
                p.image_url, 
                p.is_ghost,
                p.likes_count, 
                p.comments_count, 
                p.created_at,
                u.id as user_id,
                u.username,
                u.avatar_url
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.content LIKE ? 
              AND (p.expires_at IS NULL OR p.expires_at > NOW())
              AND p.is_ghost = FALSE
            ORDER BY p.created_at DESC
            LIMIT ?
        ");
        $stmt->execute([$searchTerm, $limit]);
        $results['posts'] = $stmt->fetchAll();
    }

    // Search users
    if ($type === 'users' || $type === 'all') {
        $searchTerm = '%' . $query . '%';
        $stmt = $pdo->prepare("
            SELECT 
                id,
                username,
                bio,
                avatar_url,
                major,
                created_at
            FROM users
            WHERE username LIKE ? OR bio LIKE ?
            ORDER BY username ASC
            LIMIT ?
        ");
        $stmt->execute([$searchTerm, $searchTerm, $limit]);
        $results['users'] = $stmt->fetchAll();
    }

    http_response_code(200);
    echo json_encode($results);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Search failed: ' . $e->getMessage()]);
}
?>
