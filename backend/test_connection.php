<?php
// test_connection.php - Simple database connection test
header('Content-Type: application/json');

require_once 'db_connection.php';

try {
    // Test basic connection
    $stmt = $pdo->query('SELECT VERSION() as version');
    $result = $stmt->fetch();
    
    // Count tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Get table info
    $tableInfo = [];
    foreach ($tables as $table) {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM `$table`");
        $count = $stmt->fetch();
        $tableInfo[$table] = $count['count'];
    }
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Database connection successful!',
        'database' => $db,
        'mysql_version' => $result['version'],
        'tables' => $tableInfo,
        'total_tables' => count($tables)
    ], JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database connection failed',
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
?>
