<?php
// users.php - User profile API endpoints

require_once 'db_connection.php';
require_once 'auth_helpers.php';
require_once 'media.php';

header('Content-Type: application/json');

// Get request method and parse input
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// Route handling
switch ($method) {
    case 'GET':
        $action = $_GET['action'] ?? '';
        if ($action === 'profile') {
            getProfile($pdo);
        } else {
            // Fallback to old behavior (id param)
            getUser($pdo);
        }
        break;

    case 'POST':
        // Accept action from query param OR request body
        $action = $_GET['action'] ?? ($input['action'] ?? '');
        
        switch ($action) {
            case 'follow':
            case 'unfollow':
                toggleFollow($pdo, $input);
                break;
            case 'update_profile':
                updateUser($pdo, $input);
                break;
            default:
                http_response_code(400);
                echo json_encode(['error' => 'Invalid action: ' . $action]);
        }
        break;

    case 'PUT':
        updateUser($pdo, $input);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}

// ============================================
// USER HANDLERS
// ============================================

// New function to handle profile requests from React app
function getProfile($pdo)
{
    $userId = isset($_GET['user_id']) ? (int) $_GET['user_id'] : 0;
    $username = isset($_GET['username']) ? trim($_GET['username']) : '';

    try {
        // Fetch by username or user_id
        if ($username) {
            $stmt = $pdo->prepare("
                SELECT 
                    id,
                    username,
                    email,
                    display_name,
                    bio,
                    avatar_url,
                    major,
                    created_at
                FROM users
                WHERE username = ?
            ");
            $stmt->execute([$username]);
        } elseif ($userId) {
            $stmt = $pdo->prepare("
                SELECT 
                    id,
                    username,
                    email,
                    display_name,
                    bio,
                    avatar_url,
                    major,
                    created_at
                FROM users
                WHERE id = ?
            ");
            $stmt->execute([$userId]);
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'User ID or username is required']);
            return;
        }

        $user = $stmt->fetch();

        if (!$user) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'User not found']);
            return;
        }

        $userId = $user['id'];

        // Get user's post count
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM posts WHERE user_id = ?");
        $stmt->execute([$userId]);
        $result = $stmt->fetch();
        $user['posts_count'] = (int) $result['count'];

        // Get follower count (people following this user)
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM followers WHERE following_id = ?");
        $stmt->execute([$userId]);
        $result = $stmt->fetch();
        $user['followers_count'] = (int) $result['count'];

        // Get following count (people this user follows)
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM followers WHERE follower_id = ?");
        $stmt->execute([$userId]);
        $result = $stmt->fetch();
        $user['following_count'] = (int) $result['count'];

        // Check if current user follows this user
        $currentUserId = getCurrentUser();
        $user['is_following'] = false;
        if ($currentUserId && $currentUserId != $userId) {
            $stmt = $pdo->prepare("SELECT id FROM followers WHERE follower_id = ? AND following_id = ?");
            $stmt->execute([$currentUserId, $userId]);
            $user['is_following'] = $stmt->fetch() ? true : false;
        }

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'user' => $user
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to fetch profile: ' . $e->getMessage()]);
    }
}

function getUser($pdo)
{
    $userId = isset($_GET['id']) ? (int) $_GET['id'] : 0;

    if (!$userId) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID is required']);
        return;
    }

    try {
        // Fetch user profile
        $stmt = $pdo->prepare("
            SELECT 
                id,
                username,
                email,
                display_name,
                bio,
                avatar_url,
                major,
                created_at
            FROM users
            WHERE id = ?
        ");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user) {
            http_response_code(404);
            echo json_encode(['error' => 'User not found']);
            return;
        }

        // Get user's post count
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM posts WHERE user_id = ?");
        $stmt->execute([$userId]);
        $result = $stmt->fetch();
        $user['post_count'] = (int) $result['count'];

        // Get follower count (people following this user)
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM followers WHERE following_id = ?");
        $stmt->execute([$userId]);
        $result = $stmt->fetch();
        $user['follower_count'] = (int) $result['count'];

        // Get following count (people this user follows)
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM followers WHERE follower_id = ?");
        $stmt->execute([$userId]);
        $result = $stmt->fetch();
        $user['following_count'] = (int) $result['count'];

        // Check if current user follows this user
        $currentUserId = getCurrentUser();
        $user['is_following'] = false;
        if ($currentUserId && $currentUserId != $userId) {
            $stmt = $pdo->prepare("SELECT id FROM followers WHERE follower_id = ? AND following_id = ?");
            $stmt->execute([$currentUserId, $userId]);
            $user['is_following'] = $stmt->fetch() ? true : false;
        }
        
        // Get avatar from media table (with fallback to avatar_url column)
        $avatarMedia = getUserAvatarUrl($pdo, $userId);
        if ($avatarMedia) {
            $user['avatar_url'] = $avatarMedia;
        }
        
        // Get banner from media table
        $user['banner_url'] = getUserBannerUrl($pdo, $userId);

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'user' => $user
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch user: ' . $e->getMessage()]);
    }
}


function updateUser($pdo, $input)
{
    // Check authentication
    if (!isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        return;
    }

    $userId = isset($_GET['id']) ? (int) $_GET['id'] : 0;
    $currentUserId = getCurrentUser();

    // Users can only update their own profile
    if ($userId != $currentUserId) {
        http_response_code(403);
        echo json_encode(['error' => 'You can only update your own profile']);
        return;
    }

    // Build update query dynamically based on provided fields
    $allowedFields = ['bio', 'avatar_url', 'display_name'];
    $updates = [];
    $params = [];

    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            $updates[] = "$field = ?";
            $params[] = $input[$field];
        }
    }

    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['error' => 'No valid fields to update']);
        return;
    }

    $params[] = $userId;

    try {
        // Handle avatar_url specially - insert into media table
        if (isset($input['avatar_url']) && !empty($input['avatar_url'])) {
            updateUserAvatar($pdo, $userId, $input['avatar_url']);
        }
        
        // Handle banner_url - insert into media table
        if (isset($input['banner_url']) && !empty($input['banner_url'])) {
            deleteMediaForEntity($pdo, 'user_banner', $userId);
            createMedia($pdo, 'user_banner', $userId, $input['banner_url']);
        }
        
        // Update other fields in users table
        $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        // Fetch updated user
        $stmt = $pdo->prepare("
            SELECT 
                id,
                username,
                email,
                bio,
                avatar_url,
                created_at
            FROM users
            WHERE id = ?
        ");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'user' => $user
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update user: ' . $e->getMessage()]);
    }
}

// ============================================
// FOLLOW HANDLERS
// ============================================

function toggleFollow($pdo, $input)
{
    // Check authentication
    if (!isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        return;
    }

    if (!isset($input['user_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'User ID is required']);
        return;
    }

    $targetUserId = (int) $input['user_id'];
    $currentUserId = getCurrentUser();

    // Can't follow yourself
    if ($targetUserId === $currentUserId) {
        http_response_code(400);
        echo json_encode(['error' => 'You cannot follow yourself']);
        return;
    }

    try {
        // Check if already following
        $stmt = $pdo->prepare("SELECT id FROM followers WHERE follower_id = ? AND following_id = ?");
        $stmt->execute([$currentUserId, $targetUserId]);
        $existing = $stmt->fetch();

        if ($existing) {
            // Unfollow
            $stmt = $pdo->prepare("DELETE FROM followers WHERE follower_id = ? AND following_id = ?");
            $stmt->execute([$currentUserId, $targetUserId]);
            $isFollowing = false;
        } else {
            // Follow
            $stmt = $pdo->prepare("INSERT INTO followers (follower_id, following_id) VALUES (?, ?)");
            $stmt->execute([$currentUserId, $targetUserId]);
            $isFollowing = true;

            // Create notification for the followed user
            require_once 'notifications.php';
            createNotification($pdo, $targetUserId, 'follow', null, $currentUserId);
        }

        // Get updated follower count
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM followers WHERE following_id = ?");
        $stmt->execute([$targetUserId]);
        $result = $stmt->fetch();
        $followerCount = (int) $result['count'];

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'is_following' => $isFollowing,
            'follower_count' => $followerCount
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to toggle follow: ' . $e->getMessage()]);
    }
}
