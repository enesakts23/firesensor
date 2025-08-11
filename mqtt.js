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
            this.client = new Paho.MQTT.Client(this.brokerHost, this.brokerPort, this.clientId);
            this.client.onConnectionLost = this.onConnectionLost.bind(this);
            this.client.onMessageArrived = this.onMessageArrived.bind(this);
            this.connect();
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
        this.client.subscribe(this.topic);
    }

    onConnectFailure(error) {
        console.error('❌ MQTT Connection failed:', error);
        this.isConnected = false;
        
        setTimeout(() => {
            console.log('🔄 Retrying connection...');
            this.connect();
        }, 5000);
    }

    onConnectionLost(responseObject) {
        if (responseObject.errorCode !== 0) {
            console.warn('⚠️ Connection lost:', responseObject.errorMessage);
            this.isConnected = false;
            
            setTimeout(() => {
                console.log('🔄 Attempting to reconnect...');
                this.connect();
            }, 3000);
        }
    }

    onMessageArrived(message) {
        const timestamp = new Date().toLocaleTimeString('tr-TR');
        const payload = message.payloadString;

        this.parseFireSensorData(payload, timestamp);
    }

    parseFireSensorData(hexData, timestamp) {
        try {
            const parts = hexData.split('0x').filter(part => part.length > 0);
            const hexValues = parts.map(part => '0x' + part);
            if (!hexValues || hexValues.length < 3) return;
            const startMarker = hexValues[0];
            const endMarker = hexValues[hexValues.length - 1];
            if (startMarker.toUpperCase() !== '0XAA' || endMarker.toUpperCase() !== '0X55') return;
            const sensorData = hexValues.slice(1, -1);
            if (sensorData.length < 10) return;

            const temperature = this.hexToFloat(sensorData[0]);
            const humidity = this.hexToFloat(sensorData[1]);
            const gasResistance = this.hexToFloat(sensorData[2]);
            const airQuality = this.hexToFloat(sensorData[3]);
            const no2 = this.hexToFloat(sensorData[4]);
            const co = this.hexToFloat(sensorData[5]);
            const tvoc = this.hexToFloat(sensorData[6]);
            const eco2 = this.hexToFloat(sensorData[7]);
            const warning2 = sensorData[8]; 
            const warning1 = sensorData[9]; 
            const anomalySensorIds = this.parseAnomalyWarnings(warning1, warning2);

            this.updateDashboardSensors({
                temperature: temperature,
                humidity: humidity,
                gas: gasResistance,
                'air-quality': airQuality,
                no2: no2,
                co: co,
                tvoc: tvoc,
                eco2: eco2
            }, anomalySensorIds);
        } catch (error) {
            console.error('❌ Error parsing sensor data:', error);
        }
    }
    
    parseAnomalyWarnings(warning1Hex, warning2Hex) {
        try {
            console.log('🚨 ANOMALY DETECTION:');
            console.log(`⚠️  Warning1: ${warning1Hex} (anomaly detection)`);
            
            const floatValue = this.hexToFloat(warning1Hex);
            const warningValue = Math.round(floatValue);
            
            console.log(`🔍 Warning1 hex: ${warning1Hex}`);
            console.log(`🔍 Warning1 float value: ${floatValue}`);
            console.log(`🔍 Warning1 anomaly value: ${warningValue}`);
            console.log(`🔍 Warning1 binary: ${warningValue.toString(2).padStart(8, '0')}`);
            
            const sensorNames = [
                'Sıcaklık (Temperature)',
                'Nem (Humidity)',
                'Gaz Rezistans (Gas Resistance)',
                'Hava Kalite (Air Quality)',
                'NO2',
                'CO',
                'TVOC',
                'eCO2'
            ];
            
            const sensorIds = [
                'temperature',
                'humidity',
                'gas',
                'air-quality',
                'no2',
                'co',
                'tvoc',
                'eco2'
            ];
            
            const anomalies = [];
            const anomalySensorIds = [];
            
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
            }
                        
            return anomalySensorIds;
            
        } catch (error) {
            console.error('❌ Error parsing anomaly warnings:', error);
            return [];
        }
    }
    
    hexToFloat(hexString) {
        try {
            const cleanHex = hexString.replace('0x', '').replace('0X', '');
            const intValue = parseInt(cleanHex, 16);            
            const buffer = new ArrayBuffer(4);
            const intView = new Uint32Array(buffer);
            const floatView = new Float32Array(buffer);
            
            intView[0] = intValue;
            
            return floatView[0];
        } catch (error) {
            console.error(`❌ Error converting hex ${hexString} to float:`, error);
            return 0.0;
        }
    }
    
    updateDashboardSensors(sensorData, anomalySensorIds = []) {
        if (!window.modernFireDashboard) {
            window.pendingMQTTData = { sensorData, anomalySensorIds };
            return;
        }
        const dashboard = window.modernFireDashboard;
        Object.keys(sensorData).forEach(sensorId => {
            if (dashboard.sensors[sensorId]) {
                dashboard.sensors[sensorId].status = 'normal';
            }
        });
        Object.keys(sensorData).forEach(sensorId => {
            const value = sensorData[sensorId];
            dashboard.updateSensorHistory(sensorId, parseFloat(value.toFixed(2)));
            dashboard.updateSensorValue(sensorId, value);
            const hasAnomaly = anomalySensorIds.includes(sensorId);
            if (hasAnomaly) {
                dashboard.sensors[sensorId].status = 'critical';
            }
            dashboard.updateTrendIndicator(sensorId);
            dashboard.updateStatusBadge(sensorId, dashboard.sensors[sensorId].status);
            dashboard.updateTrendDisplay(sensorId, dashboard.sensors[sensorId].trend);
            dashboard.updateCardStyling(sensorId, dashboard.sensors[sensorId].status);
            dashboard.renderChart(sensorId);
        });
        try {
            if (typeof dashboard.updateSystemStatus === 'function') {
                dashboard.updateSystemStatus();
            }
            if (typeof dashboard.updateTimestamp === 'function') {
                dashboard.updateTimestamp();
            }
        } catch (error) {
        }
    }

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

let mqttClient;

document.addEventListener('DOMContentLoaded', function() {
    mqttClient = new MQTTClient();
});

window.addEventListener('beforeunload', function() {
    if (mqttClient) {
        mqttClient.disconnect();
    }
});