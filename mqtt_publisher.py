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
        
        # Fire sensor data messages with diverse alarm scenarios for testing
        self.sensor_messages = [
            # Normal data - no alarms (0x00000000)
            "0xAA0x41962A3E0x417435900x47FB8CFA0x41FAA4BA0x000000000x41DF47330x42133ABA0x43D6826F0x000000000x000000000x55",
            "0xAA0x41962A3E0x417435900x47FB8CFA0x41FAA4BA0x000000000x41DF47330x42133ABA0x43D6826F0x000000000x000000000x55",
            
            # Single sensor alarms - test individual bits
            "0xAA0x41962A3E0x417435900x47FB8CFA0x41FAA4BA0x000000000x41DF47330x42133ABA0x43D6826F0x000000000x000000010x55",  # Temperature alarm (bit 0)
            "0xAA0x41962A3E0x417435900x47FB8CFA0x41FAA4BA0x000000000x41DF47330x42133ABA0x43D6826F0x000000000x000000020x55",  # Humidity alarm (bit 1)
            "0xAA0x41962A3E0x417435900x47FB8CFA0x41FAA4BA0x000000000x41DF47330x42133ABA0x43D6826F0x000000000x000000040x55",  # Gas alarm (bit 2)
            "0xAA0x41962A3E0x417435900x47FB8CFA0x41FAA4BA0x000000000x41DF47330x42133ABA0x43D6826F0x000000000x000000080x55",  # Air Quality alarm (bit 3)
            "0xAA0x41962A3E0x417435900x47FB8CFA0x41FAA4BA0x000000000x41DF47330x42133ABA0x43D6826F0x000000000x000000100x55",  # NO2 alarm (bit 4)
            "0xAA0x41962A3E0x417435900x47FB8CFA0x41FAA4BA0x000000000x41DF47330x42133ABA0x43D6826F0x000000000x000000200x55",  # CO alarm (bit 5)
            "0xAA0x41962A3E0x417435900x47FB8CFA0x41FAA4BA0x000000000x41DF47330x42133ABA0x43D6826F0x000000000x000000400x55",  # TVOC alarm (bit 6)
            "0xAA0x41962A3E0x417435900x47FB8CFA0x41FAA4BA0x000000000x41DF47330x42133ABA0x43D6826F0x000000000x000000800x55",  # eCO2 alarm (bit 7)
            
            # Multiple sensor alarms - test bit combinations
            "0xAA0x41962A3E0x417435900x47FB8CFA0x41FAA4BA0x000000000x41DF47330x42133ABA0x43D6826F0x000000000x000000030x55",  # Temperature + Humidity (bits 0,1)
            "0xAA0x41962A3E0x417435900x47FB8CFA0x41FAA4BA0x000000000x41DF47330x42133ABA0x43D6826F0x000000000x000000070x55",  # Temperature + Humidity + Gas (bits 0,1,2)
            "0xAA0x41962A3E0x417435900x47FB8CFA0x41FAA4BA0x000000000x41DF47330x42133ABA0x43D6826F0x000000000x0000000F0x55",  # First 4 sensors (bits 0,1,2,3)
            "0xAA0x41962A3E0x417435900x47FB8CFA0x41FAA4BA0x000000000x41DF47330x42133ABA0x43D6826F0x000000000x000000300x55",  # CO + TVOC (bits 5,6)
            "0xAA0x41962A3E0x417435900x47FB8CFA0x41FAA4BA0x000000000x41DF47330x42133ABA0x43D6826F0x000000000x000000C00x55",  # TVOC + eCO2 (bits 6,7)
            
            # IEEE 754 float patterns - test the original problematic values
            "0xAA0x41962A3E0x417435900x47FB8CFA0x41FAA4BA0x000000000x41DF47330x42133ABA0x43D6826F0x000000000x3f8000000x55",  # IEEE 754 float 1.0 (should be bit 0)
            "0xAA0x41962A3E0x417435900x47FB8CFA0x41FAA4BA0x000000000x41DF47330x42133ABA0x43D6826F0x000000000x404000000x55",  # IEEE 754 float 3.0 (should be bits 0,1)
            "0xAA0x41962A3E0x417435900x47FB8CFA0x41FAA4BA0x000000000x41DF47330x42133ABA0x43D6826F0x000000000x437f00000x55",  # IEEE 754 float 255.0 (all bits)
            
            # High byte positions - test bit extraction from different positions
            "0xAA0x41962A3E0x417435900x47FB8CFA0x41FAA4BA0x000000000x41DF47330x42133ABA0x43D6826F0x000000000x010000000x55",  # Bit in position 24
            "0xAA0x41962A3E0x417435900x47FB8CFA0x41FAA4BA0x000000000x41DF47330x42133ABA0x43D6826F0x000000000x000100000x55",  # Bit in position 16
            "0xAA0x41962A3E0x417435900x47FB8CFA0x41FAA4BA0x000000000x41DF47330x42133ABA0x43D6826F0x000000000x000001000x55",  # Bit in position 8
            
            # Complex scenarios - mixed patterns
            "0xAA0x41962A3E0x417435900x47FB8CFA0x41FAA4BA0x000000000x41DF47330x42133ABA0x43D6826F0x000000000x123456780x55",  # Complex hex pattern
            "0xAA0x41962A3E0x417435900x47FB8CFA0x41FAA4BA0x000000000x41DF47330x42133ABA0x43D6826F0x000000000x0000FF000x55",  # All bits in middle byte
            "0xAA0x41962A3E0x417435900x47FB8CFA0x41FAA4BA0x000000000x41DF47330x42133ABA0x43D6826F0x000000000xABCDEF120x55",  # Random hex pattern
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
