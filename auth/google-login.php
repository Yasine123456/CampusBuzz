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

// Redirect directly to Google login
header('Location: ' . $authUrl);
exit;
