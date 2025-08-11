<?php
// Test database connection and MySQL status
require_once 'db_config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Test MySQL connection first
$mysqlTest = @fsockopen('127.0.0.1', 3306, $errno, $errstr, 5);
$mysqlRunning = $mysqlTest ? true : false;
if ($mysqlTest) fclose($mysqlTest);

$response = [
    'mysql_server_running' => $mysqlRunning,
    'mysql_error' => $mysqlRunning ? null : "Cannot connect to MySQL on port 3306: $errstr ($errno)"
];

if (!$mysqlRunning) {
    $response['suggestions'] = [
        'XAMPP' => 'Start XAMPP Control Panel and start MySQL service',
        'MAMP' => 'Start MAMP and ensure MySQL is running',
        'Homebrew' => 'Run: brew services start mysql',
        'Manual' => 'Check if MySQL service is running in System Preferences'
    ];
    echo json_encode($response);
    exit;
}

try {
    $pdo = getDbConnection();
    
    // Test basic query
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM sensors");
    $result = $stmt->fetch();
    
    // Test table structure
    $stmt2 = $pdo->query("DESCRIBE sensors");
    $columns = $stmt2->fetchAll();
    
    // Test sample data from each sensor column
    $sensorColumns = ['sicaklik', 'nem', 'hava_kalite', 'gaz_rezistans', 'yuzey_sicaklik', 'tvoc', 'eco2', 'no2', 'co'];
    $sampleData = [];
    
    foreach ($sensorColumns as $column) {
        try {
            $stmt3 = $pdo->prepare("SELECT $column, warning1, time FROM sensors WHERE $column IS NOT NULL ORDER BY time DESC LIMIT 5");
            $stmt3->execute();
            $sampleData[$column] = $stmt3->fetchAll();
        } catch (Exception $e) {
            $sampleData[$column] = ['error' => $e->getMessage()];
        }
    }
    
    $response['success'] = true;
    $response['message'] = 'Database connection successful';
    $response['total_records'] = $result['total'];
    $response['columns'] = $columns;
    $response['sample_data'] = $sampleData;
    
    echo json_encode($response);
    
} catch (Exception $e) {
    $response['success'] = false;
    $response['error'] = $e->getMessage();
    $response['trace'] = $e->getTraceAsString();
    echo json_encode($response);
}
?>
