#ifndef CONFIG_H
#define CONFIG_H

//==================================================
//              SMART POULTRY SYSTEM CONFIG
//==================================================

//--------------- Wi-Fi Settings -------------------
#define WIFI_SSID           "MONISH"
#define WIFI_PASSWORD       "12345678"

//--------------- MQTT Broker Settings --------------
#define MQTT_BROKER         "broker.hivemq.com"
#define MQTT_PORT           1883
#define MQTT_CLIENT_ID      "poultry_esp32_client"
#define MQTT_TOPIC_STATUS   "poultry/status"
#define MQTT_TOPIC_COMMANDS "poultry/commands"
#define MQTT_TOPIC_EVENTS   "poultry/events"

//--------------- NTP Time Settings ----------------
#define NTP_SERVER          "pool.ntp.org"
#define GMT_OFFSET_SEC      19800   // GMT +5:30 (India Standard Time)
#define DAYLIGHT_OFFSET_SEC 0

//--------------- Pin Definitions ------------------
// DS18B20 1-Wire Temperature Sensor
#define DS18B20_PIN         18

// LDR Module (LM393 Digital Output)
#define LDR_PIN             35

// Relay Outputs
#define LIGHT1_RELAY_PIN    26   // Relay 1: Main Poultry Light (LDR Day/Night)
#define LIGHT2_RELAY_PIN    27   // Relay 2: Second Light (Temperature-based)

// Indicator LEDs
#define LED_LIGHT1_PIN      4    // LED: Glows when Light1 relay is ON
#define LED_LIGHT2_PIN      5    // LED: Glows when Light2 relay is ON
#define LED_WIFI_PIN        2    // LED: Solid = WiFi connected, Blink = Sending MQTT data

//--------------- Relay Logic ----------------------
// Most relay modules are Active LOW
#define RELAY_ON            LOW
#define RELAY_OFF           HIGH

//--------------- DS18B20 Settings -----------------
// DallasTemperature resolution can be set to 9, 10, 11, or 12 bits.
#define DS18B20_RESOLUTION  12

//--------------- Temperature Thresholds -----------
// Light 2 turns ON when temp is HIGH (heat lamp / extra warmth light)
#define LIGHT2_ON_TEMP      34.0f
#define LIGHT2_OFF_TEMP     30.0f
#define HIGH_TEMP_ALERT     38.0f

//--------------- LDR Configuration ----------------
// true  = HIGH means DARK
// false = LOW means DARK
#define LDR_HIGH_IS_DARK    true

//--------------- Bulb & Relay Lifespan Ratings -----
#define BULB_RATED_HOURS    25000.0f   // Rated hours of operation
#define BULB_RATED_CYCLES   50000.0f   // Rated ON/OFF switching cycles
#define RELAY_RATED_CYCLES  100000.0f  // Estimated relay switching operations

//--------------- System Parameters ----------------
#define SERIAL_BAUD             115200
#define SENSOR_READ_INTERVAL    2000     // 2 seconds loop interval
#define PREFS_SAVE_INTERVAL     300000   // Save runtime to Flash every 5 mins (ms)

//--------------- LCD & Button Parameters -----------
#define PAGE_BUTTON_PIN         19
#define LCD_ADDRESS             0x27
#define LCD_COLS                16
#define LCD_ROWS                2

#endif