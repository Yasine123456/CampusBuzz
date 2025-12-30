<?php
// standalone_test.php - Standalone database test (no dependencies)
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Database Connection Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .info { background: #f0f0f0; padding: 10px; margin: 10px 0; border-radius: 5px; }
        table { border-collapse: collapse; margin: 20px 0; }
        td, th { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #4CAF50; color: white; }
    </style>
</head>
<body>
    <h1>🔍 CampusBuzz Database Connection Test</h1>
    
    <?php
    echo "<div class='info'>";
    echo "<strong>PHP Version:</strong> " . phpversion() . "<br>";
    echo "<strong>Server:</strong> " . $_SERVER['SERVER_NAME'] . "<br>";
    echo "<strong>Script Path:</strong> " . __FILE__ . "<br>";
    echo "</div>";
    
    // Database credentials
    $host = 'nuwebspace_db';
    $db   = 'w25050742';
    $user = 'w25050742';
    $pass = 'Molomolo1';
    $charset = 'utf8mb4';
    
    echo "<h2>Connection Details</h2>";
    echo "<div class='info'>";
    echo "<strong>Host:</strong> $host<br>";
    echo "<strong>Database:</strong> $db<br>";
    echo "<strong>Username:</strong> $user<br>";
    echo "<strong>Password:</strong> " . str_repeat('*', strlen($pass)) . "<br>";
    echo "</div>";
    
    echo "<h2>Connection Test</h2>";
    
    try {
        $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
        
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        
        echo "<p class='success'>✓ Database connection successful!</p>";
        
        // Get MySQL version
        $stmt = $pdo->query('SELECT VERSION() as version');
        $result = $stmt->fetch();
        echo "<p><strong>MySQL Version:</strong> " . htmlspecialchars($result['version']) . "</p>";
        
        // List all tables
        echo "<h2>Database Tables</h2>";
        $stmt = $pdo->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        if (count($tables) > 0) {
            echo "<table>";
            echo "<tr><th>Table Name</th><th>Row Count</th></tr>";
            
            foreach ($tables as $table) {
                $stmt = $pdo->query("SELECT COUNT(*) as count FROM `$table`");
                $count = $stmt->fetch();
                echo "<tr>";
                echo "<td>" . htmlspecialchars($table) . "</td>";
                echo "<td>" . $count['count'] . "</td>";
                echo "</tr>";
            }
            
            echo "</table>";
            echo "<p class='success'>Found " . count($tables) . " tables in the database.</p>";
        } else {
            echo "<p class='error'>No tables found in the database.</p>";
        }
        
        echo "<h2>✅ All Tests Passed!</h2>";
        echo "<p>Your database is properly configured and ready to use.</p>";
        
    } catch (PDOException $e) {
        echo "<p class='error'>✗ Database connection failed!</p>";
        echo "<div class='info'>";
        echo "<strong>Error Message:</strong> " . htmlspecialchars($e->getMessage()) . "<br>";
        echo "<strong>Error Code:</strong> " . $e->getCode() . "<br>";
        echo "</div>";
        
        echo "<h3>Possible Solutions:</h3>";
        echo "<ul>";
        echo "<li>Verify your database credentials in phpMyAdmin</li>";
        echo "<li>Make sure the database 'w25050742' exists</li>";
        echo "<li>Check that your password is correct</li>";
        echo "<li>Ensure MySQL is running on the server</li>";
        echo "</ul>";
    }
    ?>
</body>
</html>
