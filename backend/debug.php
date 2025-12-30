<?php
// debug.php - Simple diagnostic script
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "PHP Version: " . phpversion() . "<br>";
echo "Testing database connection...<br><br>";

$host = 'localhost';
$db   = 'w25050742';
$user = 'w25050742';
$pass = 'Molomolo1';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";

echo "DSN: $dsn<br>";
echo "User: $user<br><br>";

try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    
    echo "<strong style='color: green;'>✓ Database connection successful!</strong><br><br>";
    
    // Test query
    $stmt = $pdo->query('SELECT VERSION() as version');
    $result = $stmt->fetch();
    echo "MySQL Version: " . $result['version'] . "<br><br>";
    
    // List tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Tables found: " . count($tables) . "<br>";
    foreach ($tables as $table) {
        echo "- $table<br>";
    }
    
} catch (PDOException $e) {
    echo "<strong style='color: red;'>✗ Database connection failed!</strong><br>";
    echo "Error: " . $e->getMessage() . "<br>";
    echo "Code: " . $e->getCode() . "<br>";
}
?>
