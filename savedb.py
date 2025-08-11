import paho.mqtt.client as mqtt
import mysql.connector
from datetime import datetime
import struct
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class MQTTtoMySQL:
    def __init__(self):
        self.mqtt_broker = "213.142.151.191"
        self.mqtt_port = 1883
        self.mqtt_topic = "aicofire"
        self.client_id = "aicofire_python_db"
        
        self.db_config = {
            'host': 'localhost',
            'user': 'root',
            'password': 'Enes.aktas2326',
            'database': 'aicofire',
            'autocommit': True
        }
        
        self.mqtt_client = mqtt.Client(client_id=self.client_id)
        self.mqtt_client.on_connect = self.on_connect
        self.mqtt_client.on_message = self.on_message
        self.db_connection = None
        
        self.setup_database()
        self.connect_mqtt()

    def setup_database(self):
        try:
            self.db_connection = mysql.connector.connect(**self.db_config)
            cursor = self.db_connection.cursor()
            
            create_table_query = """
            CREATE TABLE IF NOT EXISTS sensors (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sicaklik FLOAT,
                nem FLOAT,
                hava_kalite FLOAT,
                gaz_rezistans FLOAT,
                yuzey_sicaklik FLOAT NULL,
                tvoc FLOAT,
                eco2 FLOAT,
                no2 FLOAT,
                co FLOAT,
                warning1 INT,
                time DATETIME
            )
            """
            
            cursor.execute(create_table_query)
            self.db_connection.commit()
            logging.info("✅ Database table created/verified successfully")
            
        except mysql.connector.Error as err:
            logging.error(f"❌ Database error: {err}")

    def connect_mqtt(self):
        try:
            self.mqtt_client.connect(self.mqtt_broker, self.mqtt_port, 60)
            self.mqtt_client.loop_start()
            logging.info("✅ Connected to MQTT broker")
        except Exception as e:
            logging.error(f"❌ MQTT connection failed: {e}")

    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            logging.info("✅ MQTT connection successful")
            client.subscribe(self.mqtt_topic)
            logging.info(f"📡 Subscribed to topic: {self.mqtt_topic}")
        else:
            logging.error(f"❌ MQTT connection failed with code: {rc}")

    def on_message(self, client, userdata, msg):
        try:
            payload = msg.payload.decode('utf-8')
            logging.info(f"📥 Received message: {payload}")
            self.parse_and_save_data(payload)
        except Exception as e:
            logging.error(f"❌ Error processing message: {e}")

    def hex_to_float(self, hex_string):
        try:
            clean_hex = hex_string.replace('0x', '').replace('0X', '')
            int_value = int(clean_hex, 16)
            float_bytes = struct.pack('>I', int_value)
            float_value = struct.unpack('>f', float_bytes)[0]
            return float_value
        except Exception as e:
            logging.error(f"❌ Error converting hex {hex_string} to float: {e}")
            return 0.0

    def parse_warning1(self, warning1_hex):
        try:
            float_value = self.hex_to_float(warning1_hex)
            warning_value = round(float_value)
            binary_string = format(warning_value, '08b')
            logging.info(f"🚨 Warning1: {warning1_hex} -> Float: {float_value} -> Int: {warning_value} -> Binary: {binary_string}")
            return binary_string
        except Exception as e:
            logging.error(f"❌ Error parsing warning1: {e}")
            return "00000000"

    def parse_and_save_data(self, hex_data):
        try:
            parts = hex_data.split('0x')
            parts = [part for part in parts if part]
            hex_values = ['0x' + part for part in parts]
            
            if len(hex_values) < 3:
                logging.warning("⚠️ Invalid message format")
                return
            
            start_marker = hex_values[0].upper()
            end_marker = hex_values[-1].upper()
            
            if start_marker != '0XAA' or end_marker != '0X55':
                logging.warning("⚠️ Invalid start/end markers")
                return
            
            sensor_data = hex_values[1:-1]
            
            if len(sensor_data) < 10:
                logging.warning("⚠️ Insufficient sensor data")
                return
            
            temperature = self.hex_to_float(sensor_data[0])
            humidity = self.hex_to_float(sensor_data[1])
            gas_resistance = self.hex_to_float(sensor_data[2])
            air_quality = self.hex_to_float(sensor_data[3])
            no2 = self.hex_to_float(sensor_data[4])
            co = self.hex_to_float(sensor_data[5])
            tvoc = self.hex_to_float(sensor_data[6])
            eco2 = self.hex_to_float(sensor_data[7])
            warning2 = sensor_data[8]
            warning1 = sensor_data[9]
            
            warning1_value = self.parse_warning1(warning1)
            yuzey_sicaklik = None
            current_time = datetime.now()
            
            self.save_to_database(
                temperature, humidity, air_quality, gas_resistance,
                yuzey_sicaklik, tvoc, eco2, no2, co, warning1_value, current_time
            )
            
        except Exception as e:
            logging.error(f"❌ Error parsing sensor data: {e}")

    def save_to_database(self, sicaklik, nem, hava_kalite, gaz_rezistans, 
                        yuzey_sicaklik, tvoc, eco2, no2, co, warning1, time):
        try:
            cursor = self.db_connection.cursor()
            
            insert_query = """
            INSERT INTO sensors 
            (sicaklik, nem, hava_kalite, gaz_rezistans, yuzey_sicaklik, tvoc, eco2, no2, co, warning1, time) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            values = (sicaklik, nem, hava_kalite, gaz_rezistans, yuzey_sicaklik, 
                     tvoc, eco2, no2, co, warning1, time)
            
            cursor.execute(insert_query, values)
            self.db_connection.commit()
            
            logging.info(f"✅ Data saved - Temp: {sicaklik:.2f}°C, Humidity: {nem:.2f}%, Warning1: {warning1}")
            
        except mysql.connector.Error as err:
            logging.error(f"❌ Database insert error: {err}")
            self.reconnect_database()
        except Exception as e:
            logging.error(f"❌ Unexpected database error: {e}")

    def reconnect_database(self):
        try:
            if self.db_connection:
                self.db_connection.close()
            self.db_connection = mysql.connector.connect(**self.db_config)
            logging.info("🔄 Database reconnected")
        except Exception as e:
            logging.error(f"❌ Database reconnection failed: {e}")

    def run(self):
        try:
            logging.info("🚀 MQTT to MySQL service started")
            while True:
                pass
        except KeyboardInterrupt:
            logging.info("🛑 Service stopped by user")
            self.cleanup()

    def cleanup(self):
        if self.mqtt_client:
            self.mqtt_client.loop_stop()
            self.mqtt_client.disconnect()
        if self.db_connection:
            self.db_connection.close()
        logging.info("🧹 Cleanup completed")

if __name__ == "__main__":
    mqtt_mysql = MQTTtoMySQL()
    mqtt_mysql.run()