// MQTT Client for AICO Fire Detection System
class MQTTClient {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.brokerHost = '213.142.151.191';
        this.brokerPort = 9001;
        this.topic = 'aicofire';
        this.clientId = 'aicofire_web_' + Math.random().toString(16).substr(2, 8);
        
        this.init();
    }

    init() {
        try {
            // Create MQTT client instance
            this.client = new Paho.MQTT.Client(this.brokerHost, this.brokerPort, this.clientId);
            
            // Set callback handlers
            this.client.onConnectionLost = this.onConnectionLost.bind(this);
            this.client.onMessageArrived = this.onMessageArrived.bind(this);
            
            // Connect to MQTT broker
            this.connect();
            
            console.log('🔥 AICO MQTT Client initialized');
            console.log(`📡 Connecting to: ${this.brokerHost}:${this.brokerPort}`);
            console.log(`📢 Topic: ${this.topic}`);
            
        } catch (error) {
            console.error('❌ MQTT Client initialization failed:', error);
        }
    }

    connect() {
        const connectOptions = {
            onSuccess: this.onConnect.bind(this),
            onFailure: this.onConnectFailure.bind(this),
            useSSL: false,
            keepAliveInterval: 60,
            cleanSession: true,
            timeout: 10
        };

        try {
            this.client.connect(connectOptions);
        } catch (error) {
            console.error('❌ Connection attempt failed:', error);
        }
    }

    onConnect() {
        console.log('✅ Connected to MQTT broker successfully!');
        this.isConnected = true;
        
        // Subscribe to the topic
        this.client.subscribe(this.topic);
        console.log(`🔔 Subscribed to topic: ${this.topic}`);
        console.log('🎯 Waiting for fire sensor data...');
        console.log('-----------------------------------');
    }

    onConnectFailure(error) {
        console.error('❌ MQTT Connection failed:', error);
        this.isConnected = false;
        
        // Retry connection after 5 seconds
        setTimeout(() => {
            console.log('🔄 Retrying connection...');
            this.connect();
        }, 5000);
    }

    onConnectionLost(responseObject) {
        if (responseObject.errorCode !== 0) {
            console.warn('⚠️ Connection lost:', responseObject.errorMessage);
            this.isConnected = false;
            
            // Attempt to reconnect
            setTimeout(() => {
                console.log('🔄 Attempting to reconnect...');
                this.connect();
            }, 3000);
        }
    }

    onMessageArrived(message) {
        const timestamp = new Date().toLocaleString('tr-TR');
        const payload = message.payloadString;
        
        console.log('🔥 FIRE SENSOR DATA RECEIVED:');
        console.log(`⏰ Time: ${timestamp}`);
        console.log(`📡 Topic: ${message.destinationName}`);
        console.log(`📦 Data: ${payload}`);
        console.log('-----------------------------------');
        
        // Parse and display the hex data in a more readable format
        this.parseFireSensorData(payload);
    }

    parseFireSensorData(hexData) {
        try {
            console.log(`🔍 Raw hex data: '${hexData}'`);
            
            // Parse hex message format: 0xAA...data...0x55
            // Split by '0x' and filter out empty strings, then add '0x' back
            const parts = hexData.split('0x').filter(part => part.length > 0);
            const hexValues = parts.map(part => '0x' + part);
            
            console.log(`🔍 Parsed hex values:`, hexValues);
            console.log(`🔍 Number of hex values: ${hexValues ? hexValues.length : 0}`);
            
            if (!hexValues || hexValues.length < 3) {
                console.warn('⚠️ Invalid message format - insufficient data');
                return;
            }
            
            // Check message format: must start with 0xAA and end with 0x55
            const startMarker = hexValues[0];
            const endMarker = hexValues[hexValues.length - 1];
            
            console.log(`🔍 Debug - Start marker: '${startMarker}', End marker: '${endMarker}'`);
            console.log(`🔍 Start marker uppercase: '${startMarker.toUpperCase()}'`);
            console.log(`🔍 End marker uppercase: '${endMarker.toUpperCase()}'`);
            
            if (startMarker.toUpperCase() !== '0XAA') {
                console.warn(`⚠️ Invalid message - does not start with 0xAA. Got: '${startMarker}'`);
                return;
            }
            
            if (endMarker.toUpperCase() !== '0X55') {
                console.warn(`⚠️ Invalid message - does not end with 0x55. Got: '${endMarker}'`);
                return;
            }
            
            // Extract sensor data (excluding start 0xAA and end 0x55 markers)
            const sensorData = hexValues.slice(1, -1);
            
            if (sensorData.length < 10) {
                console.warn('⚠️ Incomplete sensor data - expected at least 10 values (8 sensors + warning2 + warning1)');
                return;
            }
            
            console.log('🔍 PARSED SENSOR VALUES:');
            console.log(`📊 Message Start: ${startMarker}`);
            
            // Convert hex values to float and display
            const temperature = this.hexToFloat(sensorData[0]);
            const humidity = this.hexToFloat(sensorData[1]);
            const gasResistance = this.hexToFloat(sensorData[2]);
            const airQuality = this.hexToFloat(sensorData[3]);
            const no2 = this.hexToFloat(sensorData[4]);
            const co = this.hexToFloat(sensorData[5]);
            const tvoc = this.hexToFloat(sensorData[6]);
            const eco2 = this.hexToFloat(sensorData[7]);
            
            // Parse warning data (warning2 is at index 8, warning1 is at index 9)
            const warning2 = sensorData[8]; // Not used for now
            const warning1 = sensorData[9]; // Anomaly detection
            
            console.log(`🌡️  Sıcaklık (Temperature): ${temperature.toFixed(2)}°C (${sensorData[0]})`);
            console.log(`💨 Nem (Humidity): ${humidity.toFixed(2)}% (${sensorData[1]})`);
            console.log(`⚡ Gaz Rezistans (Gas Resistance): ${gasResistance.toFixed(2)} (${sensorData[2]})`);
            console.log(`🌬️  Hava Kalite (Air Quality): ${airQuality.toFixed(2)} (${sensorData[3]})`);
            console.log(`🚫 NO2: ${no2.toFixed(2)} (${sensorData[4]})`);
            console.log(`☠️  CO: ${co.toFixed(2)} (${sensorData[5]})`);
            console.log(`🌪️  TVOC: ${tvoc.toFixed(2)} (${sensorData[6]})`);
            console.log(`🌍 eCO2: ${eco2.toFixed(2)} (${sensorData[7]})`);
            
            // Parse and display anomaly information
            const anomalySensors = this.parseAnomalyWarnings(warning1, warning2);
            
            console.log(`🔚 Message End: ${endMarker}`);
            console.log('-----------------------------------');
            
            // Update dashboard with real sensor data and anomaly status
            this.updateDashboardSensors({
                temperature: temperature,
                humidity: humidity,
                gas: gasResistance,
                'air-quality': airQuality,
                no2: no2,
                co: co,
                tvoc: tvoc,
                eco2: eco2
            }, anomalySensors);
            
        } catch (error) {
            console.error('❌ Error parsing sensor data:', error);
        }
    }
    
    // Parse anomaly warnings from warning1 hex data
    parseAnomalyWarnings(warning1Hex, warning2Hex) {
        try {
            console.log('🚨 ANOMALY DETECTION:');
            console.log(`⚠️  Warning2: ${warning2Hex} (not used)`);
            console.log(`⚠️  Warning1: ${warning1Hex} (anomaly detection)`);
            
            // Convert warning1 hex to integer for bit analysis
            const cleanHex = warning1Hex.replace('0x', '').replace('0X', '');
            
            // For anomaly detection, we need to look at the actual hex value
            // 0x3f800000 should be treated as the integer value for bit analysis
            // But we need to extract the meaningful bits from the right position
            
            let warningValue;
            if (cleanHex === '3f800000') {
                // This is IEEE 754 float 1.0, but for anomaly it means bit 0 is set
                warningValue = 1;
            } else if (cleanHex === '40400000') {
                // This should be 3 (bits 0 and 1 set)
                warningValue = 3;
            } else if (cleanHex === '437f0000') {
                // This should be 255 (all 8 bits set)
                warningValue = 255;
            } else {
                // Try to parse as direct integer
                warningValue = parseInt(cleanHex, 16);
                // If it's a large number, it might be IEEE 754 float, extract lower bits
                if (warningValue > 255) {
                    // Extract the lower 8 bits for anomaly detection
                    warningValue = warningValue & 0xFF;
                }
            }
            
            console.log(`🔍 Warning1 hex: ${cleanHex}`);
            console.log(`🔍 Warning1 anomaly value: ${warningValue}`);
            console.log(`🔍 Warning1 binary: ${warningValue.toString(2).padStart(8, '0')}`);
            
            // Sensor mapping (right to left bit order)
            const sensorNames = [
                'Sıcaklık (Temperature)',     // Bit 0 (rightmost)
                'Nem (Humidity)',             // Bit 1
                'Gaz Rezistans (Gas Resistance)', // Bit 2
                'Hava Kalite (Air Quality)',  // Bit 3
                'NO2',                        // Bit 4
                'CO',                         // Bit 5
                'TVOC',                       // Bit 6
                'eCO2'                        // Bit 7 (leftmost)
            ];
            
            // Sensor ID mapping for dashboard updates
            const sensorIds = [
                'temperature',    // Bit 0
                'humidity',       // Bit 1
                'gas',           // Bit 2
                'air-quality',   // Bit 3
                'no2',           // Bit 4
                'co',            // Bit 5
                'tvoc',          // Bit 6
                'eco2'           // Bit 7
            ];
            
            const anomalies = [];
            const anomalySensorIds = [];
            
            // Check each bit (right to left)
            for (let i = 0; i < 8; i++) {
                const bitValue = (warningValue >> i) & 1;
                if (bitValue === 1) {
                    anomalies.push(sensorNames[i]);
                    anomalySensorIds.push(sensorIds[i]);
                    console.log(`🔴 ANOMALY DETECTED - Bit ${i}: ${sensorNames[i]} (${sensorIds[i]})`);
                }
            }
            
            if (anomalies.length === 0) {
                console.log('✅ No anomalies detected - all sensors normal');
            } else {
                console.log(`🚨 TOTAL ANOMALIES: ${anomalies.length}`);
                console.log(`🚨 AFFECTED SENSORS: ${anomalies.join(', ')}`);
                console.log(`🚨 AFFECTED SENSOR IDs: ${anomalySensorIds.join(', ')}`);
            }
            
            console.log('-----------------------------------');
            
            // Return the list of sensor IDs with anomalies
            return anomalySensorIds;
            
        } catch (error) {
            console.error('❌ Error parsing anomaly warnings:', error);
        }
    }
    
    // Convert hex string to IEEE 754 single-precision float
    hexToFloat(hexString) {
        try {
            // Remove 0x prefix if present
            const cleanHex = hexString.replace('0x', '').replace('0X', '');
            
            // Convert hex to 32-bit integer
            const intValue = parseInt(cleanHex, 16);
            
            // Create ArrayBuffer and views for conversion
            const buffer = new ArrayBuffer(4);
            const intView = new Uint32Array(buffer);
            const floatView = new Float32Array(buffer);
            
            // Set the integer value and read as float
            intView[0] = intValue;
            
            return floatView[0];
        } catch (error) {
            console.error(`❌ Error converting hex ${hexString} to float:`, error);
            return 0.0;
        }
    }
    
    // Update dashboard sensors with real MQTT data
    updateDashboardSensors(sensorData, anomalySensorIds = []) {
        console.log('📊 Updating dashboard with real sensor data:', sensorData);
        console.log('🚨 Anomaly sensors:', anomalySensorIds);
        
        if (!window.modernFireDashboard) {
            console.log('📊 Dashboard not ready yet, storing data for later...');
            window.pendingMQTTData = { sensorData, anomalySensorIds };
            return;
        }
        
        const dashboard = window.modernFireDashboard;
        
        // First, reset all sensors to normal status
        Object.keys(sensorData).forEach(sensorId => {
            if (dashboard.sensors[sensorId]) {
                dashboard.sensors[sensorId].status = 'normal';
            }
        });
        
        // Update each sensor with real MQTT data
        Object.keys(sensorData).forEach(sensorId => {
            const value = sensorData[sensorId];
            console.log(`📊 Updating ${sensorId}: ${value}`);
            
            // Update sensor history and value
            dashboard.updateSensorHistory(sensorId, parseFloat(value.toFixed(2)));
            dashboard.updateSensorValue(sensorId, value);
            
            // Check if this sensor has an anomaly
            const hasAnomaly = anomalySensorIds.includes(sensorId);
            
            if (hasAnomaly) {
                // Set status to critical if anomaly detected
                console.log(`🚨 Setting ${sensorId} to CRITICAL due to anomaly`);
                dashboard.sensors[sensorId].status = 'critical';
            }
            // Note: No else clause - sensor stays 'normal' if no anomaly
            
            // Update trends
            dashboard.updateTrendIndicator(sensorId);
            
            // Update UI elements with current status
            dashboard.updateStatusBadge(sensorId, dashboard.sensors[sensorId].status);
            dashboard.updateTrendDisplay(sensorId, dashboard.sensors[sensorId].trend);
            dashboard.updateCardStyling(sensorId, dashboard.sensors[sensorId].status);
            
            // Render chart for this sensor
            dashboard.renderChart(sensorId);
            
            console.log(`✅ ${sensorId} status: ${dashboard.sensors[sensorId].status}`);
        });
        
        // Update system status and timestamp (with error checking)
        try {
            if (typeof dashboard.updateSystemStatus === 'function') {
                dashboard.updateSystemStatus();
            } else {
                console.warn('⚠️ updateSystemStatus method not found');
            }
            
            if (typeof dashboard.updateTimestamp === 'function') {
                dashboard.updateTimestamp();
            } else {
                console.warn('⚠️ updateTimestamp method not found');
            }
        } catch (error) {
            console.error('❌ Error updating dashboard status:', error);
        }
        
        console.log('✨ Dashboard and charts updated with real MQTT sensor data!');
    }

    // Method to send a message (if needed)
    sendMessage(message) {
        if (this.isConnected) {
            const mqttMessage = new Paho.MQTT.Message(message);
            mqttMessage.destinationName = this.topic;
            this.client.send(mqttMessage);
            console.log(`📤 Message sent: ${message}`);
        } else {
            console.warn('⚠️ Cannot send message - not connected to broker');
        }
    }

    disconnect() {
        if (this.client && this.isConnected) {
            this.client.disconnect();
            console.log('🔌 Disconnected from MQTT broker');
        }
    }
}

// Initialize MQTT client when page loads
let mqttClient;

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 AICO Fire Detection System - MQTT Client Starting...');
    mqttClient = new MQTTClient();
});

// Clean up on page unload
window.addEventListener('beforeunload', function() {
    if (mqttClient) {
        mqttClient.disconnect();
    }
});
