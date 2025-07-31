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
            // Split the hex string and display in groups for better readability
            const hexValues = hexData.match(/0x[0-9A-Fa-f]+/g);
            
            if (hexValues && hexValues.length > 0) {
                console.log('🔍 PARSED SENSOR VALUES:');
                console.log(`📊 Header: ${hexValues[0]}`);
                
                if (hexValues.length > 12) {
                    console.log(`🌡️  Temperature 1: ${hexValues[1]}`);
                    console.log(`🌡️  Temperature 2: ${hexValues[2]}`);
                    console.log(`🌡️  Temperature 3: ${hexValues[3]}`);
                    console.log(`🌡️  Temperature 4: ${hexValues[4]}`);
                    console.log(`💨 Humidity 1: ${hexValues[5]}`);
                    console.log(`💨 Humidity 2: ${hexValues[6]}`);
                    console.log(`💨 Humidity 3: ${hexValues[7]}`);
                    console.log(`🌬️  Air Quality: ${hexValues[8]}`);
                    console.log(`⚡ Gas Level 1: ${hexValues[9]}`);
                    console.log(`⚡ Gas Level 2: ${hexValues[10]}`);
                    console.log(`🔚 Footer: ${hexValues[11]}`);
                }
                console.log('-----------------------------------');
            }
        } catch (error) {
            console.error('❌ Error parsing sensor data:', error);
        }
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
