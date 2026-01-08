<?php
// posts.php - Posts API endpoints

require_once 'db_connection.php';
require_once 'auth_helpers.php';
require_once 'notifications.php';

header('Content-Type: application/json');

// Get request method and parse input
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// Route handling
switch ($method) {
    case 'GET':
        $action = $_GET['action'] ?? 'list';

        if ($action === 'list') {
            getPosts($pdo);
        } elseif ($action === 'user_posts') {
            getUserPosts($pdo);
        } elseif ($action === 'comments') {
            getComments($pdo);
        } elseif ($action === 'bookmarks') {
            getBookmarks($pdo);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
        }
        break;

    case 'POST':
        $action = $_GET['action'] ?? 'create';

        switch ($action) {
            case 'create':
                createPost($pdo, $input);
                break;
            case 'like':
                toggleLike($pdo, $input);
                break;
            case 'bookmark':
                toggleBookmark($pdo, $input);
                break;
            case 'comment':
                addComment($pdo, $input);
                break;
            default:
                http_response_code(400);
                echo json_encode(['error' => 'Invalid action']);
        }
        break;

    case 'DELETE':
        // DELETE requests don't need action parameter
        deletePost($pdo);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}

// ============================================
// POST HANDLERS
// ============================================

function getPosts($pdo)
{
    // Get pagination parameters
    $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;
    $offset = ($page - 1) * $limit;

    // Get user_id filter if provided
    $userId = isset($_GET['user_id']) ? (int) $_GET['user_id'] : null;

    try {
        // Build query - include ghost mode fields
        $sql = "SELECT 
                    p.id, 
                    p.content, 
                    p.image_url, 
                    p.is_ghost,
                    p.expires_at,
                    p.likes_count, 
                    p.comments_count, 
                    p.created_at,
                    u.id as user_id,
                    u.username,
                    u.avatar_url
                FROM posts p
                JOIN users u ON p.user_id = u.id
                WHERE (p.expires_at IS NULL OR p.expires_at > NOW())";

        if ($userId) {
            $sql .= " AND p.user_id = ?";
        }

        $sql .= " ORDER BY p.created_at DESC LIMIT ? OFFSET ?";

        $stmt = $pdo->prepare($sql);

        if ($userId) {
            $stmt->execute([$userId, $limit, $offset]);
        } else {
            $stmt->execute([$limit, $offset]);
        }

        $posts = $stmt->fetchAll();

        // Process posts for ghost mode
        foreach ($posts as &$post) {
            // Hide username for ghost posts
            if ($post['is_ghost']) {
                $post['username'] = 'Anonymous';
                $post['avatar_url'] = null;
            }
        }

        // Check if current user has liked each post
        $currentUserId = getCurrentUser();
        if ($currentUserId) {
            foreach ($posts as &$post) {
                $stmt = $pdo->prepare("SELECT id FROM likes WHERE post_id = ? AND user_id = ?");
                $stmt->execute([$post['id'], $currentUserId]);
                $post['liked_by_user'] = $stmt->fetch() ? true : false;
            }
        }

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'posts' => $posts,
            'page' => $page,
            'limit' => $limit
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch posts: ' . $e->getMessage()]);
    }
}

function getUserPosts($pdo)
{
    $userId = isset($_GET['user_id']) ? (int) $_GET['user_id'] : 0;

    if (!$userId) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID is required']);
        return;
    }

    $page = isset($_GET['page']) ? (int) $_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 20;
    $offset = ($page - 1) * $limit;

    try {
        // Get user's posts (exclude ghost posts when viewing other users)
        $stmt = $pdo->prepare("
            SELECT 
                p.id, 
                p.content, 
                p.image_url, 
                p.is_ghost,
                p.expires_at,
                p.likes_count, 
                p.comments_count, 
                p.created_at,
                u.id as user_id,
                u.username,
                u.avatar_url
            FROM posts p
            JOIN users u ON p.user_id = u.id
            WHERE p.user_id = ?
              AND p.is_ghost = 0
              AND (p.expires_at IS NULL OR p.expires_at > NOW())
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([$userId, $limit, $offset]);
        $posts = $stmt->fetchAll();

        // Check if current user has liked/bookmarked each post
        $currentUserId = getCurrentUser();
        if ($currentUserId) {
            foreach ($posts as &$post) {
                $stmt = $pdo->prepare("SELECT id FROM likes WHERE post_id = ? AND user_id = ?");
                $stmt->execute([$post['id'], $currentUserId]);
                $post['liked_by_user'] = $stmt->fetch() ? true : false;

                $stmt = $pdo->prepare("SELECT id FROM bookmarks WHERE post_id = ? AND user_id = ?");
                $stmt->execute([$post['id'], $currentUserId]);
                $post['bookmarked_by_user'] = $stmt->fetch() ? true : false;
            }
        }

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'posts' => $posts,
            'page' => $page,
            'limit' => $limit
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch user posts: ' . $e->getMessage()]);
    }
}

function createPost($pdo, $input)
{
    // Check authentication
    if (!isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        return;
    }

    // Validate input
    if (!isset($input['content']) || trim($input['content']) === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Content is required']);
        return;
    }

    $content = trim($input['content']);
    $imageUrl = isset($input['image_url']) ? trim($input['image_url']) : null;
    $userId = getCurrentUser();

    // Ghost mode parameters - handle various boolean representations
    $isGhost = false;
    if (isset($input['is_ghost'])) {
        // Handle boolean, string 'true'/'false', or numeric 1/0
        if (is_bool($input['is_ghost'])) {
            $isGhost = $input['is_ghost'];
        } elseif (is_string($input['is_ghost'])) {
            $isGhost = in_array(strtolower($input['is_ghost']), ['true', '1', 'yes']);
        } elseif (is_numeric($input['is_ghost'])) {
            $isGhost = (bool) $input['is_ghost'];
        }
    }
    $expiresInHours = isset($input['expires_in_hours']) ? (int) $input['expires_in_hours'] : null;
    $expiresAt = null;

    // Calculate expiration time for ghost posts
    if ($isGhost && $expiresInHours) {
        $expiresAt = date('Y-m-d H:i:s', strtotime("+{$expiresInHours} hours"));
    }

    // Validate content length (microblogging - keep it short)
    if (strlen($content) > 500) {
        http_response_code(400);
        echo json_encode(['error' => 'Content must be 500 characters or less']);
        return;
    }

    try {
        // Insert post with ghost mode support
        // Convert boolean to integer for MySQL TINYINT(1) compatibility
        $isGhostInt = $isGhost ? 1 : 0;
        $stmt = $pdo->prepare("INSERT INTO posts (user_id, content, image_url, is_ghost, expires_at) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$userId, $content, $imageUrl, $isGhostInt, $expiresAt]);

        $postId = $pdo->lastInsertId();

        // Fetch the created post with user info
        $stmt = $pdo->prepare("
            SELECT 
                p.id, 
                p.content, 
                p.image_url, 
                p.is_ghost,
                p.expires_at,
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

        // Hide username for ghost posts
        if ($post['is_ghost']) {
            $post['username'] = 'Anonymous';
            $post['avatar_url'] = null;
        }

        // Detect @mentions and create notifications (skip for ghost posts)
        if (!$isGhost) {
            preg_match_all('/@(\w+)/', $content, $matches);
            $mentions = array_unique($matches[1]);

            foreach ($mentions as $username) {
                // Get user ID from username
                $mentionStmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
                $mentionStmt->execute([$username]);
                $mentionedUser = $mentionStmt->fetch();

                if ($mentionedUser && $mentionedUser['id'] != $userId) {
                    createNotification($pdo, $mentionedUser['id'], 'mention', $postId, $userId);
                }
            }
        }

        http_response_code(201);
        echo json_encode([
            'success' => true,
            'post' => $post
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create post: ' . $e->getMessage()]);
    }
}

function deletePost($pdo)
{
    // Check authentication
    if (!isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        return;
    }

    $postId = isset($_GET['id']) ? (int) $_GET['id'] : 0;
    $userId = getCurrentUser();

    if (!$postId) {
        http_response_code(400);
        echo json_encode(['error' => 'Post ID is required']);
        return;
    }

    try {
        // Check if post exists and belongs to user
        $stmt = $pdo->prepare("SELECT user_id FROM posts WHERE id = ?");
        $stmt->execute([$postId]);
        $post = $stmt->fetch();

        if (!$post) {
            http_response_code(404);
            echo json_encode(['error' => 'Post not found']);
            return;
        }

        if ($post['user_id'] != $userId) {
            http_response_code(403);
            echo json_encode(['error' => 'You can only delete your own posts']);
            return;
        }

        // Delete post (cascades to likes and comments)
        $stmt = $pdo->prepare("DELETE FROM posts WHERE id = ?");
        $stmt->execute([$postId]);

        http_response_code(200);
        echo json_encode(['success' => true]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete post: ' . $e->getMessage()]);
    }
}

function toggleLike($pdo, $input)
{
    // Check authentication
    if (!isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        return;
    }

    if (!isset($input['post_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Post ID is required']);
        return;
    }

    $postId = (int) $input['post_id'];
    $userId = getCurrentUser();

    try {
        // Check if already liked
        $stmt = $pdo->prepare("SELECT id FROM likes WHERE post_id = ? AND user_id = ?");
        $stmt->execute([$postId, $userId]);
        $like = $stmt->fetch();

        if ($like) {
            // Unlike
            $stmt = $pdo->prepare("DELETE FROM likes WHERE post_id = ? AND user_id = ?");
            $stmt->execute([$postId, $userId]);

            // Decrement likes count
            $stmt = $pdo->prepare("UPDATE posts SET likes_count = likes_count - 1 WHERE id = ?");
            $stmt->execute([$postId]);

            $liked = false;
        } else {
            // Like
            $stmt = $pdo->prepare("INSERT INTO likes (post_id, user_id) VALUES (?, ?)");
            $stmt->execute([$postId, $userId]);

            // Increment likes count
            $stmt = $pdo->prepare("UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?");
            $stmt->execute([$postId]);

            // Create notification for post owner
            $stmt = $pdo->prepare("SELECT user_id FROM posts WHERE id = ?");
            $stmt->execute([$postId]);
            $post = $stmt->fetch();
            if ($post) {
                createNotification($pdo, $post['user_id'], 'like', $postId, $userId);
            }

            $liked = true;
        }

        // Get updated likes count
        $stmt = $pdo->prepare("SELECT likes_count FROM posts WHERE id = ?");
        $stmt->execute([$postId]);
        $post = $stmt->fetch();

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'liked' => $liked,
            'likes_count' => $post['likes_count']
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to toggle like: ' . $e->getMessage()]);
    }
}

function getComments($pdo)
{
    $postId = isset($_GET['post_id']) ? (int) $_GET['post_id'] : 0;

    if (!$postId) {
        http_response_code(400);
        echo json_encode(['error' => 'Post ID is required']);
        return;
    }

    try {
        $stmt = $pdo->prepare("
            SELECT 
                c.id,
                c.content,
                c.created_at,
                u.id as user_id,
                u.username,
                u.avatar_url
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.post_id = ?
            ORDER BY c.created_at ASC
        ");
        $stmt->execute([$postId]);
        $comments = $stmt->fetchAll();

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'comments' => $comments
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch comments: ' . $e->getMessage()]);
    }
}

function addComment($pdo, $input)
{
    // Check authentication
    if (!isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        return;
    }

    if (!isset($input['post_id']) || !isset($input['content'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Post ID and content are required']);
        return;
    }

    $postId = (int) $input['post_id'];
    $content = trim($input['content']);
    $userId = getCurrentUser();

    if ($content === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Comment content cannot be empty']);
        return;
    }

    try {
        // Insert comment
        $stmt = $pdo->prepare("INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)");
        $stmt->execute([$postId, $userId, $content]);

        $commentId = $pdo->lastInsertId();

        // Increment comments count
        $stmt = $pdo->prepare("UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?");
        $stmt->execute([$postId]);

        // Create notification for post owner
        $stmt = $pdo->prepare("SELECT user_id FROM posts WHERE id = ?");
        $stmt->execute([$postId]);
        $post = $stmt->fetch();
        if ($post) {
            createNotification($pdo, $post['user_id'], 'comment', $postId, $userId);
        }

        // Fetch the created comment with user info
        $stmt = $pdo->prepare("
            SELECT 
                c.id,
                c.content,
                c.created_at,
                u.id as user_id,
                u.username,
                u.avatar_url
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        ");
        $stmt->execute([$commentId]);
        $comment = $stmt->fetch();

        http_response_code(201);
        echo json_encode([
            'success' => true,
            'comment' => $comment
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to add comment: ' . $e->getMessage()]);
    }
}

// ============================================
// BOOKMARK HANDLERS
// ============================================

function toggleBookmark($pdo, $input)
{
    // Check authentication
    if (!isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        return;
    }

    if (!isset($input['post_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Post ID is required']);
        return;
    }

    $postId = (int) $input['post_id'];
    $userId = getCurrentUser();

    try {
        // Check if already bookmarked
        $stmt = $pdo->prepare("SELECT id FROM bookmarks WHERE post_id = ? AND user_id = ?");
        $stmt->execute([$postId, $userId]);
        $bookmark = $stmt->fetch();

        if ($bookmark) {
            // Remove bookmark
            $stmt = $pdo->prepare("DELETE FROM bookmarks WHERE post_id = ? AND user_id = ?");
            $stmt->execute([$postId, $userId]);
            $bookmarked = false;
        } else {
            // Add bookmark
            $stmt = $pdo->prepare("INSERT INTO bookmarks (post_id, user_id) VALUES (?, ?)");
            $stmt->execute([$postId, $userId]);
            $bookmarked = true;
        }

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'bookmarked' => $bookmarked
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to toggle bookmark: ' . $e->getMessage()]);
    }
}

function getBookmarks($pdo)
{
    // Check authentication
    if (!isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        return;
    }

    $userId = getCurrentUser();

    try {
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
                u.avatar_url,
                b.created_at as bookmarked_at
            FROM bookmarks b
            JOIN posts p ON b.post_id = p.id
            JOIN users u ON p.user_id = u.id
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC
        ");
        $stmt->execute([$userId]);
        $posts = $stmt->fetchAll();

        // Process posts for ghost mode
        foreach ($posts as &$post) {
            if ($post['is_ghost']) {
                $post['username'] = 'Anonymous';
                $post['avatar_url'] = null;
            }
            $post['bookmarked_by_user'] = true;
        }

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'posts' => $posts
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch bookmarks: ' . $e->getMessage()]);
    }
}
