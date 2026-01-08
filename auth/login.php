<?php
session_start();
require_once 'config.php';

// Generate a state token for CSRF security
$state = bin2hex(random_bytes(16));
$_SESSION['oauth_state'] = $state;

// OAuth request parameters
$params = [
    'client_id' => GOOGLE_CLIENT_ID,
    'redirect_uri' => GOOGLE_REDIRECT_URI,
    'response_type' => 'code',
    'scope' => 'email profile',
    'state' => $state,
    'access_type' => 'online',
    'prompt' => 'select_account'
];

// Build the authorization URL
$authUrl = GOOGLE_AUTH_URL . '?' . http_build_query($params);
?>
<!DOCTYPE html>
<html>
<head>
    <title>Connection to CampusBuzz</title>
    <style>
        body {
            font-family: 'Segoe UI', 'Roboto', sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
        }
        .login-container {
            max-width: 400px;
            background: white;
            padding: 40px;
            border-radius: 16px;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }
        h1 {
            margin-bottom: 8px;
            color: #1a1a2e;
        }
        .subtitle {
            color: #666;
            margin-bottom: 32px;
        }
        .auth-btn {
            background: white;
            border: 1px solid #ddd;
            padding: 14px 24px;
            border-radius: 8px;
            font-family: inherit;
            font-size: 15px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            text-decoration: none;
            color: #444;
            transition: all 0.2s;
            margin-bottom: 12px;
            width: 100%;
            box-sizing: border-box;
        }
        .auth-btn:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateY(-1px);
        }
        .auth-btn img {
            width: 20px;
            height: 20px;
        }
        .microsoft-btn {
            background: #2f2f2f;
            border: none;
            color: white;
        }
        .microsoft-btn:hover {
            background: #1a1a1a;
        }
        .divider {
            display: flex;
            align-items: center;
            margin: 20px 0;
            color: #999;
            font-size: 13px;
        }
        .divider::before, .divider::after {
            content: '';
            flex: 1;
            height: 1px;
            background: #ddd;
        }
        .divider span {
            padding: 0 12px;
        }
        .northumbria-note {
            font-size: 12px;
            color: #888;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <h1>CampusBuzz</h1>
        <p class="subtitle">Connect with your university account</p>
        
        <!-- Microsoft Login (for Northumbria students) -->
        <a href="microsoft-login.php" class="auth-btn microsoft-btn">
            <img src="https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg" alt="Microsoft">
            Sign in with Microsoft
        </a>
        
        <div class="divider"><span>or</span></div>
        
        <!-- Google Login -->
        <a href="<?= htmlspecialchars($authUrl) ?>" class="auth-btn">
            <img src="https://www.google.com/favicon.ico" alt="Google">
            Sign in with Google
        </a>
        
        <p class="northumbria-note">
            Northumbria students: use your @northumbria.ac.uk Microsoft account
        </p>
    </div>
</body>
</html>