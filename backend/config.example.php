<?php
// config.example.php
// Copy this file to db_connection.php and update with your actual credentials

// CORS Headers
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
if (strpos($origin, 'localhost') !== false || strpos($origin, '127.0.0.1') !== false || strpos($origin, $_SERVER['HTTP_HOST']) !== false) {
    header("Access-Control-Allow-Origin: $origin");
}
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ============================================
// NUWEBSPACE AUTHENTICATION CONFIGURATION
// ============================================
// TODO: Add your NUWebspace authentication credentials here
// 
// Example configuration needed:
// define('NUWEBSPACE_API_URL', 'https://your-nuwebspace-domain.com/api');
// define('NUWEBSPACE_CLIENT_ID', 'your-client-id');
// define('NUWEBSPACE_CLIENT_SECRET', 'your-client-secret');
// define('NUWEBSPACE_REDIRECT_URI', 'http://localhost:3000/auth/callback');
//
// For OAuth flow, you may need:
// - Authorization endpoint
// - Token endpoint
// - User info endpoint
// ============================================


// Database Credentials - NUWebSpace Configuration
$host = 'localhost';          // NUWebSpace database host (use localhost for shared hosting)
$db   = 'YOUR_DATABASE_NAME'; // Database name (usually same as username)
$user = 'YOUR_USERNAME';      // Database username (e.g., w25050742)
$pass = 'YOUR_PASSWORD';      // Your NUWebSpace password
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    // Return JSON error
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit();
}
?>
