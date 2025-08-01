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
            
            if (sensorData.length < 8) {
                console.warn('⚠️ Incomplete sensor data - expected 8 values');
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
            
            console.log(`🌡️  Sıcaklık (Temperature): ${temperature.toFixed(2)}°C (${sensorData[0]})`);
            console.log(`💨 Nem (Humidity): ${humidity.toFixed(2)}% (${sensorData[1]})`);
            console.log(`⚡ Gaz Rezistans (Gas Resistance): ${gasResistance.toFixed(2)} (${sensorData[2]})`);
            console.log(`🌬️  Hava Kalite (Air Quality): ${airQuality.toFixed(2)} (${sensorData[3]})`);
            console.log(`🚫 NO2: ${no2.toFixed(2)} (${sensorData[4]})`);
            console.log(`☠️  CO: ${co.toFixed(2)} (${sensorData[5]})`);
            console.log(`🌪️  TVOC: ${tvoc.toFixed(2)} (${sensorData[6]})`);
            console.log(`🌍 eCO2: ${eco2.toFixed(2)} (${sensorData[7]})`);
            
            console.log(`🔚 Message End: ${endMarker}`);
            console.log('-----------------------------------');
            
            // Update dashboard with real sensor data
            this.updateDashboardSensors({
                temperature: temperature,
                humidity: humidity,
                gas: gasResistance,
                'air-quality': airQuality,
                no2: no2,
                co: co,
                tvoc: tvoc,
                eco2: eco2
            });
            
        } catch (error) {
            console.error('❌ Error parsing sensor data:', error);
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
    updateDashboardSensors(sensorData) {
        console.log('📊 Updating dashboard with real sensor data:', sensorData);
        
        if (!window.modernFireDashboard) {
            console.log('📊 Dashboard not ready yet, storing data for later...');
            window.pendingMQTTData = sensorData;
            return;
        }
        
        const dashboard = window.modernFireDashboard;
        
        // Update each sensor value in the dashboard
        Object.keys(sensorData).forEach(sensorId => {
            const value = sensorData[sensorId];
            
            if (dashboard.sensors[sensorId]) {
                // Update sensor current value
                dashboard.sensors[sensorId].current = parseFloat(value.toFixed(2));
                
                // Update UI element
                dashboard.updateSensorValue(sensorId, value);
                
                // Update chart with new data
                if (dashboard.chartSystem) {
                    dashboard.chartSystem.updateSensorChart(sensorId, value);
                }
                
                // Update sensor status based on thresholds
                dashboard.updateSensorStatus(sensorId);
                
                console.log(`✅ Updated ${sensorId}: ${value}${dashboard.sensors[sensorId].unit} (chart updated)`);
            } else {
                console.warn(`⚠️ Sensor ${sensorId} not found in dashboard`);
            }
        });
        
        // Update system status and timestamp
        dashboard.updateSystemStatus();
        dashboard.updateTimestamp();
        
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
