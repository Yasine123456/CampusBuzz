<?php
// api_test.php - Comprehensive API endpoint testing
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: text/html; charset=utf-8');

// Base URL for API calls
$base_url = 'https://w25050742.nuwebspace.co.uk/Campusbuzz/backend';

// Helper function to make API calls
function apiCall($url, $method = 'GET', $data = null) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_COOKIEJAR, '/tmp/cookies.txt');
    curl_setopt($ch, CURLOPT_COOKIEFILE, '/tmp/cookies.txt');
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    } elseif ($method === 'DELETE') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
    } elseif ($method === 'PUT') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'code' => $httpCode,
        'body' => json_decode($response, true),
        'raw' => $response
    ];
}

?>
<!DOCTYPE html>
<html>
<head>
    <title>CampusBuzz API Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .test { background: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #2196F3; }
        .success { border-left-color: #4CAF50; background: #e8f5e9; }
        .error { border-left-color: #f44336; background: #ffebee; }
        .test-title { font-weight: bold; font-size: 16px; margin-bottom: 10px; }
        .test-result { margin: 10px 0; }
        .code { background: #263238; color: #aed581; padding: 10px; border-radius: 5px; overflow-x: auto; font-family: monospace; font-size: 12px; }
        .badge { display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 12px; font-weight: bold; }
        .badge-success { background: #4CAF50; color: white; }
        .badge-error { background: #f44336; color: white; }
        .badge-info { background: #2196F3; color: white; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 CampusBuzz API Endpoint Testing</h1>
        <p>Testing all backend API endpoints with real data...</p>

        <?php
        $testsPassed = 0;
        $testsFailed = 0;
        
        // Test 1: Register a new user
        echo "<h2>1. User Registration</h2>";
        $registerData = [
            'username' => 'testuser_' . time(),
            'email' => 'test_' . time() . '@campusbuzz.com',
            'password' => 'TestPass123'
        ];
        
        $result = apiCall("$base_url/auth.php?action=register", 'POST', $registerData);
        
        if ($result['code'] === 201 && isset($result['body']['success'])) {
            echo "<div class='test success'>";
            echo "<div class='test-title'>✅ Registration Successful <span class='badge badge-success'>HTTP {$result['code']}</span></div>";
            echo "<div class='test-result'><strong>Username:</strong> {$registerData['username']}</div>";
            echo "<div class='test-result'><strong>User ID:</strong> {$result['body']['user']['id']}</div>";
            echo "<div class='code'>" . htmlspecialchars(json_encode($result['body'], JSON_PRETTY_PRINT)) . "</div>";
            echo "</div>";
            $testsPassed++;
            $userId = $result['body']['user']['id'];
        } else {
            echo "<div class='test error'>";
            echo "<div class='test-title'>❌ Registration Failed <span class='badge badge-error'>HTTP {$result['code']}</span></div>";
            echo "<div class='code'>" . htmlspecialchars($result['raw']) . "</div>";
            echo "</div>";
            $testsFailed++;
            die("Cannot continue without user registration");
        }
        
        // Test 2: Verify session
        echo "<h2>2. Session Verification</h2>";
        $result = apiCall("$base_url/auth.php?action=verify", 'GET');
        
        if ($result['code'] === 200 && $result['body']['authenticated']) {
            echo "<div class='test success'>";
            echo "<div class='test-title'>✅ Session Valid <span class='badge badge-success'>HTTP {$result['code']}</span></div>";
            echo "<div class='test-result'><strong>Logged in as:</strong> {$result['body']['username']}</div>";
            echo "<div class='code'>" . htmlspecialchars(json_encode($result['body'], JSON_PRETTY_PRINT)) . "</div>";
            echo "</div>";
            $testsPassed++;
        } else {
            echo "<div class='test error'>";
            echo "<div class='test-title'>❌ Session Invalid <span class='badge badge-error'>HTTP {$result['code']}</span></div>";
            echo "</div>";
            $testsFailed++;
        }
        
        // Test 3: Create a post
        echo "<h2>3. Create Post</h2>";
        $postData = [
            'content' => 'Hello from CampusBuzz! This is my first test post. 🎉',
            'image_url' => null
        ];
        
        $result = apiCall("$base_url/posts.php?action=create", 'POST', $postData);
        
        if ($result['code'] === 201 && isset($result['body']['post'])) {
            echo "<div class='test success'>";
            echo "<div class='test-title'>✅ Post Created <span class='badge badge-success'>HTTP {$result['code']}</span></div>";
            echo "<div class='test-result'><strong>Post ID:</strong> {$result['body']['post']['id']}</div>";
            echo "<div class='test-result'><strong>Content:</strong> {$result['body']['post']['content']}</div>";
            echo "<div class='code'>" . htmlspecialchars(json_encode($result['body'], JSON_PRETTY_PRINT)) . "</div>";
            echo "</div>";
            $testsPassed++;
            $postId = $result['body']['post']['id'];
        } else {
            echo "<div class='test error'>";
            echo "<div class='test-title'>❌ Post Creation Failed <span class='badge badge-error'>HTTP {$result['code']}</span></div>";
            echo "<div class='code'>" . htmlspecialchars($result['raw']) . "</div>";
            echo "</div>";
            $testsFailed++;
        }
        
        // Test 4: Get all posts
        echo "<h2>4. Retrieve Posts</h2>";
        $result = apiCall("$base_url/posts.php?action=list", 'GET');
        
        if ($result['code'] === 200 && isset($result['body']['posts'])) {
            echo "<div class='test success'>";
            echo "<div class='test-title'>✅ Posts Retrieved <span class='badge badge-success'>HTTP {$result['code']}</span></div>";
            echo "<div class='test-result'><strong>Total Posts:</strong> " . count($result['body']['posts']) . "</div>";
            echo "<div class='code'>" . htmlspecialchars(json_encode($result['body'], JSON_PRETTY_PRINT)) . "</div>";
            echo "</div>";
            $testsPassed++;
        } else {
            echo "<div class='test error'>";
            echo "<div class='test-title'>❌ Failed to Retrieve Posts <span class='badge badge-error'>HTTP {$result['code']}</span></div>";
            echo "</div>";
            $testsFailed++;
        }
        
        // Test 5: Like a post
        if (isset($postId)) {
            echo "<h2>5. Like Post</h2>";
            $likeData = ['post_id' => $postId];
            $result = apiCall("$base_url/posts.php?action=like", 'POST', $likeData);
            
            if ($result['code'] === 200 && $result['body']['liked']) {
                echo "<div class='test success'>";
                echo "<div class='test-title'>✅ Post Liked <span class='badge badge-success'>HTTP {$result['code']}</span></div>";
                echo "<div class='test-result'><strong>Likes Count:</strong> {$result['body']['likes_count']}</div>";
                echo "<div class='code'>" . htmlspecialchars(json_encode($result['body'], JSON_PRETTY_PRINT)) . "</div>";
                echo "</div>";
                $testsPassed++;
            } else {
                echo "<div class='test error'>";
                echo "<div class='test-title'>❌ Like Failed <span class='badge badge-error'>HTTP {$result['code']}</span></div>";
                echo "</div>";
                $testsFailed++;
            }
        }
        
        // Test 6: Add a comment
        if (isset($postId)) {
            echo "<h2>6. Add Comment</h2>";
            $commentData = [
                'post_id' => $postId,
                'content' => 'Great first post! 👍'
            ];
            $result = apiCall("$base_url/posts.php?action=comment", 'POST', $commentData);
            
            if ($result['code'] === 201 && isset($result['body']['comment'])) {
                echo "<div class='test success'>";
                echo "<div class='test-title'>✅ Comment Added <span class='badge badge-success'>HTTP {$result['code']}</span></div>";
                echo "<div class='test-result'><strong>Comment:</strong> {$result['body']['comment']['content']}</div>";
                echo "<div class='code'>" . htmlspecialchars(json_encode($result['body'], JSON_PRETTY_PRINT)) . "</div>";
                echo "</div>";
                $testsPassed++;
            } else {
                echo "<div class='test error'>";
                echo "<div class='test-title'>❌ Comment Failed <span class='badge badge-error'>HTTP {$result['code']}</span></div>";
                echo "</div>";
                $testsFailed++;
            }
        }
        
        // Test 7: Get user profile
        if (isset($userId)) {
            echo "<h2>7. Get User Profile</h2>";
            $result = apiCall("$base_url/users.php?id=$userId", 'GET');
            
            if ($result['code'] === 200 && isset($result['body']['user'])) {
                echo "<div class='test success'>";
                echo "<div class='test-title'>✅ Profile Retrieved <span class='badge badge-success'>HTTP {$result['code']}</span></div>";
                echo "<div class='test-result'><strong>Username:</strong> {$result['body']['user']['username']}</div>";
                echo "<div class='test-result'><strong>Posts:</strong> {$result['body']['user']['post_count']}</div>";
                echo "<div class='code'>" . htmlspecialchars(json_encode($result['body'], JSON_PRETTY_PRINT)) . "</div>";
                echo "</div>";
                $testsPassed++;
            } else {
                echo "<div class='test error'>";
                echo "<div class='test-title'>❌ Profile Retrieval Failed <span class='badge badge-error'>HTTP {$result['code']}</span></div>";
                echo "</div>";
                $testsFailed++;
            }
        }
        
        // Summary
        echo "<h2>📊 Test Summary</h2>";
        $total = $testsPassed + $testsFailed;
        $percentage = $total > 0 ? round(($testsPassed / $total) * 100) : 0;
        
        echo "<div class='test " . ($testsFailed === 0 ? 'success' : 'error') . "'>";
        echo "<div class='test-title'>Results</div>";
        echo "<div class='test-result'><strong>Total Tests:</strong> $total</div>";
        echo "<div class='test-result'><strong>Passed:</strong> <span class='badge badge-success'>$testsPassed</span></div>";
        echo "<div class='test-result'><strong>Failed:</strong> <span class='badge badge-error'>$testsFailed</span></div>";
        echo "<div class='test-result'><strong>Success Rate:</strong> $percentage%</div>";
        echo "</div>";
        
        if ($testsFailed === 0) {
            echo "<h2>🎉 All Tests Passed!</h2>";
            echo "<p>Your CampusBuzz backend API is fully functional and ready for frontend integration.</p>";
        }
        ?>
    </div>
</body>
</html>
