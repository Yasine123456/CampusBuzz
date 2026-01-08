<?php
session_start();
require_once 'config.php';

// Verify the state token (CSRF protection)
if (!isset($_GET['state']) || $_GET['state'] !== $_SESSION['oauth_state']) {
    die('Error: Invalid security state');
}

// Verify the authorization code
if (!isset($_GET['code'])) {
    die('Error: Missing authorization code');
}

$code = $_GET['code'];

// Exchange the code for an access token
$tokenData = [
    'code' => $code,
    'client_id' => GOOGLE_CLIENT_ID,
    'client_secret' => GOOGLE_CLIENT_SECRET,
    'redirect_uri' => GOOGLE_REDIRECT_URI,
    'grant_type' => 'authorization_code'
];

$ch = curl_init(GOOGLE_TOKEN_URL);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($tokenData));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    die('Error while obtaining token: ' . $response);
}

$tokenInfo = json_decode($response, true);
$accessToken = $tokenInfo['access_token'];

// Retrieve user information
$ch = curl_init(GOOGLE_USERINFO_URL);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $accessToken
]);

$response = curl_exec($ch);
curl_close($ch);

$userInfo = json_decode($response, true);

// Check if the user already exists
try {
    $stmt = $pdo->prepare("SELECT * FROM users WHERE google_id = ? OR email = ?");
    $stmt->execute([$userInfo['id'], $userInfo['email']]);
    $user = $stmt->fetch();
    
    if (!$user) {
        // Create a new account
        $username = explode('@', $userInfo['email'])[0]; // Use the part before @
        
        $stmt = $pdo->prepare("
            INSERT INTO users (google_id, email, username, avatar_url, created_at) 
            VALUES (?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $userInfo['id'],
            $userInfo['email'],
            $username,
            $userInfo['picture'] ?? null
        ]);
        
        $userId = $pdo->lastInsertId();
    } else {
        $userId = $user['id'];
        $username = $user['username'];
        
        // Update google_id and avatar if not set
        if (empty($user['google_id'])) {
            $stmt = $pdo->prepare("UPDATE users SET google_id = ?, avatar_url = ? WHERE id = ?");
            $stmt->execute([$userInfo['id'], $userInfo['picture'] ?? null, $userId]);
        } else {
            // Update avatar if changed
            $stmt = $pdo->prepare("UPDATE users SET avatar_url = ? WHERE id = ?");
            $stmt->execute([$userInfo['picture'] ?? null, $userId]);
        }
    }
    
    // Create user session (compatible with frontend app.js)
    $_SESSION['user_id'] = $userId;
    $_SESSION['username'] = $username;
    $_SESSION['user_email'] = $userInfo['email'];
    $_SESSION['user_name'] = $userInfo['name'];
    
    // Clean up OAuth state
    unset($_SESSION['oauth_state']);
    
    // Redirect to the frontend app
    header('Location: /nu/index.html');
    exit;
    
} catch (PDOException $e) {
    die('Database error: ' . $e->getMessage());
}