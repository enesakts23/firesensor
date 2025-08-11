<?php
// Database configuration
define('DB_HOST', '127.0.0.1'); // localhost yerine 127.0.0.1 kullan
define('DB_PORT', '3306'); // MySQL port
define('DB_USERNAME', 'root');
define('DB_PASSWORD', 'Enes.aktas2326');
define('DB_NAME', 'aicofire');

// Create database connection
function getDbConnection() {
    try {
        // Port ile birlikte DSN oluştur
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4",
            PDO::ATTR_TIMEOUT => 10 // Connection timeout
        ];
        
        $pdo = new PDO($dsn, DB_USERNAME, DB_PASSWORD, $options);
        
        // Test the connection
        $pdo->query("SELECT 1");
        
        return $pdo;
    } catch (PDOException $e) {
        error_log("Database connection failed: " . $e->getMessage());
        
        // Check if MySQL is running
        $mysqlRunning = checkMySQLStatus();
        
        // More detailed error for debugging
        $errorDetails = [
            'error' => 'Database connection failed',
            'message' => $e->getMessage(),
            'host' => DB_HOST,
            'port' => DB_PORT,
            'database' => DB_NAME,
            'username' => DB_USERNAME,
            'mysql_status' => $mysqlRunning,
            'suggested_solution' => $mysqlRunning ? 'Check database credentials' : 'Start MySQL server (XAMPP/MAMP/Homebrew)'
        ];
        
        http_response_code(500);
        echo json_encode($errorDetails);
        exit;
    }
}

// Check if MySQL is running
function checkMySQLStatus() {
    // Try to connect to MySQL port
    $connection = @fsockopen(DB_HOST, DB_PORT, $errno, $errstr, 5);
    if ($connection) {
        fclose($connection);
        return 'MySQL port is accessible';
    } else {
        return 'MySQL port is not accessible - Server may not be running';
    }
}
?>
