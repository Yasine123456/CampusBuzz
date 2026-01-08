<?php
// messages.php - Private messaging API

require_once 'db_connection.php';
require_once 'auth_helpers.php';

header('Content-Type: application/json');

// Check authentication for all endpoints
if (!isAuthenticated()) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'conversations':
        getConversations($pdo);
        break;
    case 'messages':
        getMessages($pdo);
        break;
    case 'send':
        sendMessage($pdo);
        break;
    case 'mark_read':
        markAsRead($pdo);
        break;
    case 'unread_count':
        getUnreadCount($pdo);
        break;
    case 'start':
        startConversation($pdo);
        break;
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
}

// ============================================
// GET CONVERSATIONS
// ============================================
function getConversations($pdo) {
    $userId = getCurrentUser();
    
    try {
        // Get all conversations for the current user with the other user's info
        $stmt = $pdo->prepare("
            SELECT 
                c.id,
                c.user1_id,
                c.user2_id,
                c.last_message_at,
                c.created_at,
                -- Get the other user's info
                CASE 
                    WHEN c.user1_id = ? THEN u2.id 
                    ELSE u1.id 
                END as other_user_id,
                CASE 
                    WHEN c.user1_id = ? THEN u2.username 
                    ELSE u1.username 
                END as other_username,
                CASE 
                    WHEN c.user1_id = ? THEN u2.avatar_url 
                    ELSE u1.avatar_url 
                END as other_avatar_url,
                CASE 
                    WHEN c.user1_id = ? THEN u2.display_name 
                    ELSE u1.display_name 
                END as other_display_name,
                -- Get last message preview
                (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                -- Get unread count for this conversation
                (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND is_read = FALSE) as unread_count
            FROM conversations c
            JOIN users u1 ON c.user1_id = u1.id
            JOIN users u2 ON c.user2_id = u2.id
            WHERE c.user1_id = ? OR c.user2_id = ?
            ORDER BY c.last_message_at DESC
        ");
        $stmt->execute([$userId, $userId, $userId, $userId, $userId, $userId, $userId]);
        $conversations = $stmt->fetchAll();
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'conversations' => $conversations
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch conversations']);
    }
}

// ============================================
// GET MESSAGES FOR A CONVERSATION
// ============================================
function getMessages($pdo) {
    $userId = getCurrentUser();
    $conversationId = isset($_GET['conversation_id']) ? (int)$_GET['conversation_id'] : 0;
    $limit = isset($_GET['limit']) ? min(50, (int)$_GET['limit']) : 50;
    $before = isset($_GET['before']) ? (int)$_GET['before'] : null;
    
    if (!$conversationId) {
        http_response_code(400);
        echo json_encode(['error' => 'conversation_id is required']);
        return;
    }
    
    try {
        // Verify user is part of this conversation
        $stmt = $pdo->prepare("
            SELECT id FROM conversations 
            WHERE id = ? AND (user1_id = ? OR user2_id = ?)
        ");
        $stmt->execute([$conversationId, $userId, $userId]);
        if (!$stmt->fetch()) {
            http_response_code(403);
            echo json_encode(['error' => 'Access denied to this conversation']);
            return;
        }
        
        // Get messages
        $sql = "
            SELECT 
                m.id,
                m.conversation_id,
                m.sender_id,
                m.content,
                m.is_read,
                m.created_at,
                u.username as sender_username,
                u.avatar_url as sender_avatar_url
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.conversation_id = ?
        ";
        $params = [$conversationId];
        
        if ($before) {
            $sql .= " AND m.id < ?";
            $params[] = $before;
        }
        
        $sql .= " ORDER BY m.created_at DESC LIMIT ?";
        $params[] = $limit;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $messages = $stmt->fetchAll();
        
        // Reverse to get chronological order
        $messages = array_reverse($messages);
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'messages' => $messages
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch messages']);
    }
}

// ============================================
// SEND MESSAGE
// ============================================
function sendMessage($pdo) {
    $userId = getCurrentUser();
    $input = json_decode(file_get_contents('php://input'), true);
    
    $conversationId = isset($input['conversation_id']) ? (int)$input['conversation_id'] : 0;
    $content = isset($input['content']) ? trim($input['content']) : '';
    
    if (!$conversationId || empty($content)) {
        http_response_code(400);
        echo json_encode(['error' => 'conversation_id and content are required']);
        return;
    }
    
    if (strlen($content) > 2000) {
        http_response_code(400);
        echo json_encode(['error' => 'Message too long. Maximum 2000 characters']);
        return;
    }
    
    try {
        // Verify user is part of this conversation
        $stmt = $pdo->prepare("
            SELECT id FROM conversations 
            WHERE id = ? AND (user1_id = ? OR user2_id = ?)
        ");
        $stmt->execute([$conversationId, $userId, $userId]);
        if (!$stmt->fetch()) {
            http_response_code(403);
            echo json_encode(['error' => 'Access denied to this conversation']);
            return;
        }
        
        // Insert message
        $stmt = $pdo->prepare("
            INSERT INTO messages (conversation_id, sender_id, content)
            VALUES (?, ?, ?)
        ");
        $stmt->execute([$conversationId, $userId, $content]);
        $messageId = $pdo->lastInsertId();
        
        // Update conversation's last_message_at
        $stmt = $pdo->prepare("
            UPDATE conversations SET last_message_at = NOW() WHERE id = ?
        ");
        $stmt->execute([$conversationId]);
        
        // Get the created message with user info
        $stmt = $pdo->prepare("
            SELECT 
                m.id,
                m.conversation_id,
                m.sender_id,
                m.content,
                m.is_read,
                m.created_at,
                u.username as sender_username,
                u.avatar_url as sender_avatar_url
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.id = ?
        ");
        $stmt->execute([$messageId]);
        $message = $stmt->fetch();
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => $message
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to send message']);
    }
}

// ============================================
// MARK MESSAGES AS READ
// ============================================
function markAsRead($pdo) {
    $userId = getCurrentUser();
    $input = json_decode(file_get_contents('php://input'), true);
    
    $conversationId = isset($input['conversation_id']) ? (int)$input['conversation_id'] : 0;
    
    if (!$conversationId) {
        http_response_code(400);
        echo json_encode(['error' => 'conversation_id is required']);
        return;
    }
    
    try {
        // Mark all messages in this conversation as read (except our own)
        $stmt = $pdo->prepare("
            UPDATE messages 
            SET is_read = TRUE 
            WHERE conversation_id = ? AND sender_id != ? AND is_read = FALSE
        ");
        $stmt->execute([$conversationId, $userId]);
        
        http_response_code(200);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to mark as read']);
    }
}

// ============================================
// GET UNREAD COUNT
// ============================================
function getUnreadCount($pdo) {
    $userId = getCurrentUser();
    
    try {
        // Count all unread messages where user is the recipient
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count
            FROM messages m
            JOIN conversations c ON m.conversation_id = c.id
            WHERE (c.user1_id = ? OR c.user2_id = ?)
              AND m.sender_id != ?
              AND m.is_read = FALSE
        ");
        $stmt->execute([$userId, $userId, $userId]);
        $result = $stmt->fetch();
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'count' => (int)$result['count']
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to get unread count']);
    }
}

// ============================================
// START OR GET EXISTING CONVERSATION
// ============================================
function startConversation($pdo) {
    $userId = getCurrentUser();
    $input = json_decode(file_get_contents('php://input'), true);
    
    $otherUserId = isset($input['user_id']) ? (int)$input['user_id'] : 0;
    
    if (!$otherUserId) {
        http_response_code(400);
        echo json_encode(['error' => 'user_id is required']);
        return;
    }
    
    if ($otherUserId === $userId) {
        http_response_code(400);
        echo json_encode(['error' => 'Cannot start conversation with yourself']);
        return;
    }
    
    try {
        // Check if other user exists
        $stmt = $pdo->prepare("SELECT id, username, avatar_url, display_name FROM users WHERE id = ?");
        $stmt->execute([$otherUserId]);
        $otherUser = $stmt->fetch();
        
        if (!$otherUser) {
            http_response_code(404);
            echo json_encode(['error' => 'User not found']);
            return;
        }
        
        // Ensure user1_id < user2_id for unique constraint
        $user1 = min($userId, $otherUserId);
        $user2 = max($userId, $otherUserId);
        
        // Check if conversation already exists
        $stmt = $pdo->prepare("
            SELECT id FROM conversations WHERE user1_id = ? AND user2_id = ?
        ");
        $stmt->execute([$user1, $user2]);
        $existing = $stmt->fetch();
        
        if ($existing) {
            // Return existing conversation
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'conversation_id' => (int)$existing['id'],
                'other_user' => $otherUser,
                'is_new' => false
            ]);
            return;
        }
        
        // Create new conversation
        $stmt = $pdo->prepare("
            INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)
        ");
        $stmt->execute([$user1, $user2]);
        $conversationId = $pdo->lastInsertId();
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'conversation_id' => (int)$conversationId,
            'other_user' => $otherUser,
            'is_new' => true
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to start conversation: ' . $e->getMessage()]);
    }
}
