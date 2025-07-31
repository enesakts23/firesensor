#!/usr/bin/env python3
"""
AICO Fire Detection System - MQTT Data Publisher
Sends fire sensor data to MQTT broker every 5 seconds
"""

import paho.mqtt.client as mqtt
import time
import random
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class FireSensorMQTTPublisher:
    def __init__(self):
        self.broker_host = '213.142.151.191'
        self.broker_port = 1883
        self.topic = 'aicofire'
        self.client_id = 'aicofire_python_publisher'
        
        # Fire sensor data messages (as provided)
        self.sensor_messages = [
            "0xAA0x41964C650x417395320x47BF907C0x420131F20x000000000x41EC31700x4212CFBA0x43D699620x000000000x000000000x55",
            "0xAA0x4195F65D0x4173B9EE0x47B8249A0x41FF53320x000000000x41EA29610x4211ECA00x43D653480x000000000x000000000x55",
            "0xAA0x41957AFF0x4174326F0x47B141800x41FCC52A0x000000000x41E722920x421015EC0x43D5C1230x000000000x000000000x55",
            "0xAA0x41962A3E0x417435900x47FB8CFA0x41FAA4BA0x000000000x41DF47330x42133ABA0x43D6826F0x000000000x000000000x55",
            "0xAA0x419662C40x4173BA430x47D1F2560x41FF89460x000000000x41F210A50x4212CC7D0x43D6600C0x000000000x000000000x55",
            "0xAA0x41963FBA0x4173A7B60x47C2B2540x41FCF2650x000000000x41EF0DDE0x421597D30x43D71DD30x000000000x000000000x55",
            "0xAA0x4195DD350x417405D70x47BA68EB0x41FACA000x000000000x41EC8B610x421453530x43D6D6310x000000000x000000000x55",
            "0xAA0x419552950x4174B1280x47B2F8420x41F8FDAB0x000000000x41E91EE30x4215DCD40x43D72FF20x000000000x000000000x55",
            "0xAA0x4195E3730x4174D7880x47FCB2850x41F77E0E0x000000000x41E244A90x421626680x43D74BB80x000000000x000000000x55",
            "0xAA0x4196052E0x417470600x47D506C00x41FCE90C0x000000000x41E1E3EF0x4217F88A0x43D7C8650x000000000x000000000x55",
            "0xAA0x4195D2020x417472FF0x47C576E50x41FAC2350x000000000x41E03DC10x4214CF1E0x43D6E3570x000000000x000000000x55",
            "0xAA0x419566840x4174DA0D0x47BD44550x41F8F72C0x000000000x41DC33630x42153C2E0x43D709450x000000000x000000000x55",
            "0xAA0x41948E7E0x417CF1530x47B95D560x41E378A50x000000000x41D22AEA0x42172E0A0x43D78EEC0x000000000x000000000x55",
            "0xAA0x4194FAEB0x417FC8E60x4800B1CD0x41D18F350x000000000x41CF24120x4219EC410x43D8574C0x000000000x000000000x55",
            "0xAA0x4194DAE70x41818A6A0x47D834780x41C94CAD0x000000000x41C9F35A0x421816E20x43D7C4ED0x000000000x000000000x55",
            "0xAA0x41946D0E0x4182CEDB0x47C779960x41C26A910x000000000x41CC4AC50x421681240x43D746590x000000000x000000000x55",
            "0xAA0x4193D5840x4183B6C70x47BFFD890x41BCAE240x000000000x41CA3E280x4217BFD00x43D7A1E20x000000000x000000000x55"
        ]
        
        self.client = None
        self.is_connected = False
        self.message_index = 0
        
    def on_connect(self, client, userdata, flags, rc):
        """Callback for when the client receives a CONNACK response from the server."""
        if rc == 0:
            self.is_connected = True
            logger.info("🔥 Connected to MQTT broker successfully!")
            logger.info(f"📡 Broker: {self.broker_host}:{self.broker_port}")
            logger.info(f"📢 Publishing to topic: {self.topic}")
            logger.info("🚀 Starting to send fire sensor data...")
        else:
            logger.error(f"❌ Failed to connect to MQTT broker. Return code: {rc}")
            self.is_connected = False

    def on_disconnect(self, client, userdata, rc):
        """Callback for when the client disconnects from the server."""
        self.is_connected = False
        if rc != 0:
            logger.warning("⚠️ Unexpected disconnection from MQTT broker")
        else:
            logger.info("🔌 Disconnected from MQTT broker")

    def on_publish(self, client, userdata, mid):
        """Callback for when a message is published."""
        logger.info(f"✅ Message published successfully (ID: {mid})")

    def connect_to_broker(self):
        """Connect to the MQTT broker."""
        try:
            # Use callback_api_version for compatibility with paho-mqtt 2.0+
            self.client = mqtt.Client(client_id=self.client_id, callback_api_version=mqtt.CallbackAPIVersion.VERSION1)
            self.client.on_connect = self.on_connect
            self.client.on_disconnect = self.on_disconnect
            self.client.on_publish = self.on_publish
            
            logger.info(f"🔄 Connecting to MQTT broker at {self.broker_host}:{self.broker_port}...")
            self.client.connect(self.broker_host, self.broker_port, 60)
            
            # Start the network loop in a separate thread
            self.client.loop_start()
            
            # Wait for connection
            timeout = 10
            while not self.is_connected and timeout > 0:
                time.sleep(1)
                timeout -= 1
                
            if not self.is_connected:
                logger.error("❌ Failed to connect to MQTT broker within timeout")
                return False
                
            return True
            
        except Exception as e:
            logger.error(f"❌ Error connecting to MQTT broker: {e}")
            return False

    def publish_sensor_data(self):
        """Publish fire sensor data to MQTT topic."""
        if not self.is_connected:
            logger.warning("⚠️ Not connected to MQTT broker. Attempting to reconnect...")
            if not self.connect_to_broker():
                return False
        
        try:
            # Get the next message in sequence
            message = self.sensor_messages[self.message_index]
            self.message_index = (self.message_index + 1) % len(self.sensor_messages)
            
            # Publish the message
            result = self.client.publish(self.topic, message)
            
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                logger.info(f"📤 Published fire sensor data: {message[:50]}...")
                return True
            else:
                logger.error(f"❌ Failed to publish message. Return code: {result.rc}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error publishing sensor data: {e}")
            return False

    def start_publishing(self, interval=5):
        """Start publishing sensor data at regular intervals."""
        logger.info("🔥 AICO Fire Detection System - MQTT Publisher Starting...")
        logger.info(f"⏱️  Publishing interval: {interval} seconds")
        logger.info("=" * 60)
        
        if not self.connect_to_broker():
            logger.error("❌ Failed to connect to MQTT broker. Exiting...")
            return
        
        try:
            while True:
                if self.publish_sensor_data():
                    logger.info(f"⏳ Waiting {interval} seconds before next message...")
                else:
                    logger.warning("⚠️ Failed to publish data. Retrying in 5 seconds...")
                    time.sleep(5)
                    continue
                    
                time.sleep(interval)
                
        except KeyboardInterrupt:
            logger.info("\n🛑 Received interrupt signal. Shutting down...")
        except Exception as e:
            logger.error(f"❌ Unexpected error: {e}")
        finally:
            self.disconnect()

    def disconnect(self):
        """Disconnect from the MQTT broker."""
        if self.client and self.is_connected:
            self.client.loop_stop()
            self.client.disconnect()
            logger.info("🔌 Disconnected from MQTT broker")

def main():
    """Main function to start the MQTT publisher."""
    publisher = FireSensorMQTTPublisher()
    publisher.start_publishing(interval=5)

if __name__ == "__main__":
    main()
