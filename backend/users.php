<?php
// users.php - User profile API endpoints

require_once 'db_connection.php';
require_once 'auth.php';

header('Content-Type: application/json');

// Get request method and parse input
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// Route handling
switch ($method) {
    case 'GET':
        getUser($pdo);
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

function getUser($pdo) {
    $userId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    
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
                bio,
                avatar_url,
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
        $stmt = $pdo->prepare("SELECT COUNT(*) as post_count FROM posts WHERE user_id = ?");
        $stmt->execute([$userId]);
        $result = $stmt->fetch();
        $user['post_count'] = $result['post_count'];
        
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

function updateUser($pdo, $input) {
    // Check authentication
    if (!isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        return;
    }
    
    $userId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    $currentUserId = getCurrentUser();
    
    // Users can only update their own profile
    if ($userId != $currentUserId) {
        http_response_code(403);
        echo json_encode(['error' => 'You can only update your own profile']);
        return;
    }
    
    // Build update query dynamically based on provided fields
    $allowedFields = ['bio', 'avatar_url', 'email'];
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
        // Update user
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
