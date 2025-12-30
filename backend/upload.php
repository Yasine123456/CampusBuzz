<?php
// upload.php - File upload handler for post images

require_once 'db_connection.php';
require_once 'auth.php';

header('Content-Type: application/json');

// Check authentication
if (!isAuthenticated()) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required']);
    exit;
}

// Check if file was uploaded
if (!isset($_FILES['image'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded']);
    exit;
}

$file = $_FILES['image'];

// Validate file
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$maxSize = 5 * 1024 * 1024; // 5MB

if (!in_array($file['type'], $allowedTypes)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed']);
    exit;
}

if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['error' => 'File too large. Maximum size is 5MB']);
    exit;
}

if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(500);
    echo json_encode(['error' => 'Upload failed with error code: ' . $file['error']]);
    exit;
}

// Create uploads directory if it doesn't exist
$uploadDir = __DIR__ . '/uploads/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Generate unique filename
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = uniqid('img_', true) . '.' . $extension;
$filepath = $uploadDir . $filename;

// Move uploaded file
if (move_uploaded_file($file['tmp_name'], $filepath)) {
    // Return the URL to the uploaded file
    $imageUrl = '/backend/uploads/' . $filename;
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'image_url' => $imageUrl
    ]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save uploaded file']);
}
