<?php
require_once 'db_config.php';
require_once 'get_data.php';

echo "<h2>Binary Warning Test</h2>";

try {
    $pdo = getDbConnection();
    
    // Get some sample data with warning1 values
    $sql = "SELECT sensor1, warning1, time FROM sensors WHERE warning1 IS NOT NULL ORDER BY time DESC LIMIT 10";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $results = $stmt->fetchAll();
    
    echo "<table border='1' style='border-collapse: collapse;'>";
    echo "<tr><th>Sensor1</th><th>Warning1 (Binary)</th><th>Analyzed Level</th><th>Time</th></tr>";
    
    foreach ($results as $row) {
        $binaryString = $row['warning1'];
        $warningLevel = analyzeWarningBinary($binaryString);
        
        // Color code the warning level
        $color = 'black';
        if ($warningLevel === 'warning') $color = 'orange';
        if ($warningLevel === 'critical') $color = 'red';
        
        echo "<tr>";
        echo "<td>{$row['sensor1']}</td>";
        echo "<td style='font-family: monospace;'>{$binaryString}</td>";
        echo "<td style='color: {$color}; font-weight: bold;'>{$warningLevel}</td>";
        echo "<td>{$row['time']}</td>";
        echo "</tr>";
    }
    
    echo "</table>";
    
    // Test specific binary patterns
    echo "<h3>Binary Pattern Tests:</h3>";
    $testPatterns = [
        '11111111' => 'Should be critical (8 active bits)',
        '0000100' => 'Should be warning (1 active bit)',
        '00000011' => 'Should be warning (2 active bits)',
        '00001111' => 'Should be critical (4 consecutive 1s)',
        '00000000' => 'Should be normal (no active bits)',
        '10101010' => 'Should be critical (4 active bits)',
    ];
    
    echo "<table border='1' style='border-collapse: collapse;'>";
    echo "<tr><th>Binary Pattern</th><th>Analysis Result</th><th>Explanation</th></tr>";
    
    foreach ($testPatterns as $pattern => $expected) {
        $result = analyzeWarningBinary($pattern);
        $color = 'black';
        if ($result === 'warning') $color = 'orange';
        if ($result === 'critical') $color = 'red';
        
        echo "<tr>";
        echo "<td style='font-family: monospace;'>{$pattern}</td>";
        echo "<td style='color: {$color}; font-weight: bold;'>{$result}</td>";
        echo "<td>{$expected}</td>";
        echo "</tr>";
    }
    
    echo "</table>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
}
?>
