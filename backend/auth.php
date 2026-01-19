<?php
// auth.php - Authentication API endpoints
// This file handles login, register, logout, and verify requests

require_once 'db_connection.php';
require_once 'auth_helpers.php';

// Start session for authentication (only if not already started)
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');

// Get request method and parse input
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// Route handling
switch ($method) {
    case 'POST':
        $action = $_GET['action'] ?? '';

        switch ($action) {
            case 'register':
                handleRegister($pdo, $input);
                break;
            case 'login':
                handleLogin($pdo, $input);
                break;
            case 'logout':
                handleLogout();
                break;
            default:
                http_response_code(400);
                echo json_encode(['error' => 'Invalid action']);
        }
        break;

    case 'GET':
        $action = $_GET['action'] ?? '';

        if ($action === 'verify') {
            handleVerify();
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}

// ============================================
// AUTHENTICATION HANDLERS
// ============================================

function handleRegister($pdo, $input)
{
    // Validate input
    if (!isset($input['username']) || !isset($input['email']) || !isset($input['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        return;
    }

    $username = trim($input['username']);
    $email = trim($input['email']);
    $password = $input['password'];
    $major = isset($input['major']) ? trim($input['major']) : null;

    // Validate username
    if (strlen($username) < 3 || strlen($username) > 50) {
        http_response_code(400);
        echo json_encode(['error' => 'Username must be between 3 and 50 characters']);
        return;
    }

    // Validate email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email address']);
        return;
    }

    // Validate password
    if (strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(['error' => 'Password must be at least 6 characters']);
        return;
    }

    // Hash password
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    try {
        // Check if username or email already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$username, $email]);

        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['error' => 'Username or email already exists']);
            return;
        }

        // Insert new user
        $stmt = $pdo->prepare("INSERT INTO users (username, email, password_hash, major) VALUES (?, ?, ?, ?)");
        $stmt->execute([$username, $email, $passwordHash, $major]);

        $userId = $pdo->lastInsertId();

        // Set session
        $_SESSION['user_id'] = $userId;
        $_SESSION['username'] = $username;

        http_response_code(201);
        echo json_encode([
            'success' => true,
            'user' => [
                'id' => $userId,
                'username' => $username,
                'email' => $email,
                'major' => $major
            ]
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Registration failed: ' . $e->getMessage()]);
    }
}

function handleLogin($pdo, $input)
{
    // Validate input
    if (!isset($input['username']) || !isset($input['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing username or password']);
        return;
    }

    $username = trim($input['username']);
    $password = $input['password'];

    try {
        // Fetch user
        $stmt = $pdo->prepare("SELECT id, username, email, password_hash, bio, avatar_url FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid username or password']);
            return;
        }

        // Verify password
        if (!password_verify($password, $user['password_hash'])) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid username or password']);
            return;
        }

        // Set session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];

        // Return user data (without password hash)
        unset($user['password_hash']);

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'user' => $user
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Login failed: ' . $e->getMessage()]);
    }
}

function handleLogout()
{
    // Destroy session
    session_destroy();

    http_response_code(200);
    echo json_encode(['success' => true]);
}

function handleVerify()
{
    if (isAuthenticated()) {
        http_response_code(200);
        echo json_encode([
            'authenticated' => true,
            'user_id' => $_SESSION['user_id'],
            'username' => $_SESSION['username']
        ]);
    } else {
        http_response_code(200);
        echo json_encode(['authenticated' => false]);
    }
}
