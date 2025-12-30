<?php
// test_json_response.php - Test what posts.php actually returns
header('Content-Type: text/plain'); // Plain text so we can see the raw response

// Capture the output
ob_start();

// Simulate a POST request to create a post
$_SERVER['REQUEST_METHOD'] = 'POST';
$_GET['action'] = 'create';

// Set up session
session_start();
$_SESSION['user_id'] = 2; // Use existing user
$_SESSION['username'] = 'test';

// Simulate JSON input
$_SERVER['CONTENT_TYPE'] = 'application/json';
file_put_contents('php://input', json_encode([
    'content' => 'Test post from diagnostic script',
    'image_url' => null
]));

// Include the posts.php file
include 'posts.php';

// Get the output
$output = ob_get_clean();

// Display the raw output
echo "=== RAW OUTPUT ===\n";
echo "Length: " . strlen($output) . " bytes\n";
echo "First 100 chars: " . substr($output, 0, 100) . "\n";
echo "Last 100 chars: " . substr($output, -100) . "\n";
echo "\n=== FULL OUTPUT ===\n";
echo $output;
echo "\n=== END OUTPUT ===\n";

// Try to decode it
echo "\n=== JSON DECODE TEST ===\n";
$decoded = json_decode($output);
if ($decoded === null) {
    echo "JSON DECODE FAILED!\n";
    echo "Error: " . json_last_error_msg() . "\n";
    
    // Show hex dump of first/last characters
    echo "\nFirst 10 bytes (hex): ";
    for ($i = 0; $i < min(10, strlen($output)); $i++) {
        echo bin2hex($output[$i]) . " ";
    }
    echo "\n";
    
    echo "Last 10 bytes (hex): ";
    for ($i = max(0, strlen($output) - 10); $i < strlen($output); $i++) {
        echo bin2hex($output[$i]) . " ";
    }
    echo "\n";
} else {
    echo "JSON DECODE SUCCESS!\n";
    print_r($decoded);
}
