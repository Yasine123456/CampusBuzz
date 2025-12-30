<?php
// connection_finder.php - Test multiple connection methods
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: text/html; charset=utf-8');

$db = 'w25050742';
$user = 'w25050742';
$pass = 'Molomolo1';
$charset = 'utf8mb4';

// Different hosts to try
$hosts_to_try = [
    'localhost',
    '127.0.0.1',
    'nuwebspace_db',
    'localhost:3306',
    '127.0.0.1:3306',
];

?>
<!DOCTYPE html>
<html>
<head>
    <title>Connection Method Finder</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .success { color: green; font-weight: bold; }
        .error { color: red; }
        table { border-collapse: collapse; margin: 20px 0; width: 100%; }
        td, th { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #4CAF50; color: white; }
        .result-success { background-color: #d4edda; }
        .result-error { background-color: #f8d7da; }
    </style>
</head>
<body>
    <h1>🔍 Testing Database Connection Methods</h1>
    
    <table>
        <tr>
            <th>Host</th>
            <th>DSN</th>
            <th>Result</th>
            <th>Details</th>
        </tr>
        
        <?php
        foreach ($hosts_to_try as $host) {
            $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
            
            echo "<tr>";
            echo "<td><strong>" . htmlspecialchars($host) . "</strong></td>";
            echo "<td><code>" . htmlspecialchars($dsn) . "</code></td>";
            
            try {
                $pdo = new PDO($dsn, $user, $pass, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                ]);
                
                // Get MySQL version
                $stmt = $pdo->query('SELECT VERSION() as version');
                $result = $stmt->fetch();
                
                echo "<td class='result-success'>✅ SUCCESS</td>";
                echo "<td class='success'>MySQL " . htmlspecialchars($result['version']) . "</td>";
                
                // This is the working configuration!
                echo "</tr>";
                echo "<tr><td colspan='4' style='background: #d4edda; padding: 20px;'>";
                echo "<h2>✅ Working Configuration Found!</h2>";
                echo "<p><strong>Use this in your db_connection.php:</strong></p>";
                echo "<pre style='background: white; padding: 15px; border-radius: 5px;'>";
                echo "\$host = '" . htmlspecialchars($host) . "';\n";
                echo "\$dsn = \"mysql:host=\$host;dbname=\$db;charset=\$charset\";";
                echo "</pre>";
                echo "</td></tr>";
                
                break; // Stop after first successful connection
                
            } catch (PDOException $e) {
                echo "<td class='result-error'>❌ FAILED</td>";
                echo "<td class='error'>" . htmlspecialchars($e->getMessage()) . "</td>";
            }
            
            echo "</tr>";
        }
        ?>
    </table>
    
    <h2>Server Information</h2>
    <p><strong>PHP Version:</strong> <?php echo phpversion(); ?></p>
    <p><strong>Server:</strong> <?php echo $_SERVER['SERVER_NAME']; ?></p>
    
</body>
</html>
