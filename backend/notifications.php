<?php
// notifications.php - Notifications API endpoints

require_once 'db_connection.php';
require_once 'auth_helpers.php';

// ============================================
// HELPER FUNCTION - Create Notification
// ============================================

function createNotification($pdo, $userId, $type, $postId, $actorId)
{
    // Don't notify yourself
    if ($userId === $actorId) {
        return;
    }

    try {
        // Check for duplicate notification
        $stmt = $pdo->prepare("
            SELECT id FROM notifications 
            WHERE user_id = ? AND type = ? AND post_id = ? AND actor_id = ?
        ");
        $stmt->execute([$userId, $type, $postId, $actorId]);

        if ($stmt->fetch()) {
            return; // Notification already exists
        }

        // Create notification
        $stmt = $pdo->prepare("
            INSERT INTO notifications (user_id, type, post_id, actor_id) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$userId, $type, $postId, $actorId]);

    } catch (PDOException $e) {
        // Silently fail - notifications are not critical
        error_log("Failed to create notification: " . $e->getMessage());
    }
}

// Only run routing logic if this file is accessed directly
if (basename($_SERVER['PHP_SELF']) === 'notifications.php') {
    header('Content-Type: application/json');

    // Get request method and parse input
    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents('php://input'), true);

    // Route handling
    switch ($method) {
        case 'GET':
            $action = $_GET['action'] ?? 'list';

            if ($action === 'list') {
                getNotifications($pdo);
            } elseif ($action === 'unread_count') {
                getUnreadCount($pdo);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid action']);
            }
            break;

        case 'POST':
            $action = $_GET['action'] ?? '';

            if ($action === 'mark_read') {
                markAsRead($pdo, $input);
            } elseif ($action === 'mark_all_read') {
                markAllAsRead($pdo);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid action']);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
}

// ============================================
// NOTIFICATION HANDLERS
// ============================================

function getNotifications($pdo)
{
    // Check authentication
    if (!isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        return;
    }

    $userId = getCurrentUser();
    $limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 50;

    try {
        $stmt = $pdo->prepare("
            SELECT 
                n.id,
                n.type,
                n.post_id,
                n.is_read,
                n.created_at,
                actor.id as actor_id,
                actor.username as actor_username,
                actor.avatar_url as actor_avatar,
                p.content as post_content
            FROM notifications n
            JOIN users actor ON n.actor_id = actor.id
            JOIN posts p ON n.post_id = p.id
            WHERE n.user_id = ?
            ORDER BY n.created_at DESC
            LIMIT ?
        ");
        $stmt->execute([$userId, $limit]);
        $notifications = $stmt->fetchAll();

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'notifications' => $notifications
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch notifications: ' . $e->getMessage()]);
    }
}

function getUnreadCount($pdo)
{
    // Check authentication
    if (!isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        return;
    }

    $userId = getCurrentUser();

    try {
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE");
        $stmt->execute([$userId]);
        $result = $stmt->fetch();

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'count' => (int) $result['count']
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to get unread count: ' . $e->getMessage()]);
    }
}

function markAsRead($pdo, $input)
{
    // Check authentication
    if (!isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        return;
    }

    $userId = getCurrentUser();

    if (!isset($input['notification_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Notification ID required']);
        return;
    }

    $notificationId = (int) $input['notification_id'];

    try {
        // Verify notification belongs to user
        $stmt = $pdo->prepare("UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?");
        $stmt->execute([$notificationId, $userId]);

        http_response_code(200);
        echo json_encode(['success' => true]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to mark as read: ' . $e->getMessage()]);
    }
}

function markAllAsRead($pdo)
{
    // Check authentication
    if (!isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        return;
    }

    $userId = getCurrentUser();

    try {
        $stmt = $pdo->prepare("UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE");
        $stmt->execute([$userId]);

        http_response_code(200);
        echo json_encode(['success' => true]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to mark all as read: ' . $e->getMessage()]);
    }
}

