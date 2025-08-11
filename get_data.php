<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db_config.php';

// Get sensor type from request
$sensorType = isset($_GET['sensor']) ? $_GET['sensor'] : '';

if (empty($sensorType)) {
    http_response_code(400);
    echo json_encode(['error' => 'Sensor type is required']);
    exit;
}

// Map frontend sensor names to database column names
$sensorColumnMap = [
    'temperature' => 'sicaklik',
    'humidity' => 'nem',
    'air-quality' => 'hava_kalite',
    'gas' => 'gaz_rezistans',
    'surface-temp' => 'yuzey_sicaklik',
    'tvoc' => 'tvoc',
    'eco2' => 'eco2',
    'no2' => 'no2',
    'co' => 'co'
];

// Check if sensor type is valid
if (!isset($sensorColumnMap[$sensorType])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid sensor type']);
    exit;
}

$columnName = $sensorColumnMap[$sensorType];

try {
    $pdo = getDbConnection();
    
    // Check if the table exists and has data
    $checkSql = "SELECT COUNT(*) as count FROM sensors";
    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->execute();
    $tableCheck = $checkStmt->fetch();
    
    if ($tableCheck['count'] == 0) {
        echo json_encode([
            'success' => true,
            'sensor' => $sensorType,
            'column' => $columnName,
            'count' => 0,
            'data' => [],
            'message' => 'No data available in sensors table'
        ]);
        exit;
    }
    
    // Prepare SQL query to get last 100 records for the specific sensor
    // Use COALESCE to handle NULL values
    $sql = "SELECT COALESCE({$columnName}, 0) as value, 
                   COALESCE(warning1, 'normal') as warning1, 
                   time 
            FROM sensors 
            WHERE {$columnName} IS NOT NULL 
            AND time IS NOT NULL
            ORDER BY time DESC 
            LIMIT 100";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    
    $results = $stmt->fetchAll();
    
    // Reverse the array to get chronological order (oldest to newest)
    $results = array_reverse($results);
    
    // Format the data for the frontend
    $formattedData = [];
    foreach ($results as $row) {
        $value = floatval($row['value']);
        
        // Skip invalid values
        if (!is_finite($value)) {
            continue;
        }
        
        $formattedData[] = [
            'value' => $value,
            'warning' => $row['warning1'] ?: 'normal',
            'time' => $row['time'],
            'timestamp' => strtotime($row['time'])
        ];
    }
    
    // Return JSON response
    echo json_encode([
        'success' => true,
        'sensor' => $sensorType,
        'column' => $columnName,
        'count' => count($formattedData),
        'data' => $formattedData
    ]);
    
} catch (PDOException $e) {
    error_log("Database query failed: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database query failed',
        'message' => $e->getMessage(),
        'sensor' => $sensorType,
        'column' => $columnName
    ]);
} catch (Exception $e) {
    error_log("General error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error',
        'message' => $e->getMessage(),
        'sensor' => $sensorType,
        'column' => $columnName
    ]);
}
?>
