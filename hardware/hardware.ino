/*
=========================================================
SMART POULTRY AUTOMATION SYSTEM
---------------------------------------------------------
Controller  : ESP32 DevKit V1
Sensors     : DS18B20 (Temp), VEML7700 (Light Detection I2C)
Outputs     : Relay 1 (Light 1 — Day/Night Auto)
              Relay 2 (Light 2 — Temperature-Based Auto)
Indicators  : LED_LIGHT1 (GPIO4), LED_LIGHT2 (GPIO5),
              LED_WIFI (GPIO2 — Solid=Connected, Blink=TX)
Display     : 16x2 I2C LCD (GPIO21 SDA, GPIO22 SCL)
Page Button : GPIO19
Connectivity: Wi-Fi, MQTT (HiveMQ public broker)
Persistence : Non-Volatile Storage (Preferences/NVS)

Author: Monishwaran
=========================================================
*/

#include <Arduino.h>
#include <Wire.h>
#include <SPI.h>
#include "config.h"
#include "leds.h"
#include "persistence.h"
#include "sensors.h"
#include "relays.h"
#include "cloud.h"
#include "display.h"

//--------------------------------------------------
// Timing variables
//--------------------------------------------------
unsigned long lastLoopTime        = 0;
unsigned long lastTelemetryUpload = 0;
unsigned long lastSaveTime        = 0;

//--------------------------------------------------
// Setup
//--------------------------------------------------
void setup()
{
    Serial.begin(SERIAL_BAUD);
    delay(1000);

    Serial.println();
    Serial.println("==============================================");
    Serial.println("   SMART POULTRY SYSTEM AUTOMATION STARTING  ");
    Serial.println("==============================================");

    // 1. Initialize LCD first so boot status is visible
    initDisplay();

    // 2. Initialize indicator LEDs
    initLEDs();

    // 3. Initialize local persistent telemetry from NVS
    initPersistence();

    // 4. Initialize hardware controls (Relays & Pins)
    initRelays();

    // 5. Initialize sensor hardware
    initSensors();

    // 6. Initialize WiFi (shows progress on LCD)
    initWiFi();

    // 7. Connect to MQTT Broker (shows progress on LCD)
    initMQTT();

    lastLoopTime        = millis();
    lastTelemetryUpload = millis();
    lastSaveTime        = millis();

    Serial.println("==============================================");
    Serial.println("   POULTRY AUTOMATION ONLINE & READY         ");
    Serial.println("==============================================");
}

//--------------------------------------------------
// Main Loop
//--------------------------------------------------
void loop()
{
    // 1. Maintain Wi-Fi and MQTT health, scan page button
    maintainConnections();
    mqttClient.loop();
    checkDisplayButton();

    unsigned long now = millis();

    // 2. Update sensor readings
    // Read temperature asynchronously to prevent loop blocking
    static unsigned long lastTempRequest = 0;
    static bool tempRequestPending = false;
    
    if (now - lastTempRequest >= 2000 && !tempRequestPending) {
        requestTemperature();
        lastTempRequest = now;
        tempRequestPending = true;
    }
    
    // 12-bit resolution requires max 750ms conversion time
    if (tempRequestPending && (now - lastTempRequest >= 750)) {
        temperature = readTemperature();
        tempRequestPending = false;
    }
    
    // Always read light instantly
    dark = isDark();

    // 3. Run Decision Engine based on active mode
    if (systemMode == "AUTO")
    {
        // --- AUTO Mode: BOTH Relays depend ONLY on Lux (dark = lightIntensity < luxThreshold) ---
        // When lux drops below threshold (dark = true), BOTH relays turn ON. Otherwise OFF.
        setLight1(dark);
        setLight2(dark);
    }
    else if (systemMode == "MANUAL")
    {
        // --- MANUAL Mode: Relays strictly controlled ONLY by web overrides (sensors still read continuously) ---
        setLight1(light1Override);
        setLight2(light2Override);
    }
    else if (systemMode == "SCHEDULE")
    {
        // --- SCHEDULE Mode: Relays strictly controlled by web schedule signals ---
        setLight1(scheduleLight1State);
        setLight2(scheduleLight2State);
    }

    // 4. Update indicator LEDs to match relay states
    updateLight1LED(light1State);
    updateLight2LED(light2State);

    // 5. Interrupt triggers — detect state changes and show LCD notifications

    // ── Ambient Light state change → show relay states for 2s
    static bool prevDarkState = false;
    if (dark != prevDarkState)
    {
        prevDarkState = dark;
        char line0[17], line1[17];
        snprintf(line0, sizeof(line0), dark ? ">>  Now: DARK   " : ">>  Now: BRIGHT ");
        snprintf(line1, sizeof(line1), "Light Status:%-3s",
                 light2State ? "ON" : "OFF");
        showInterrupt(line0, line1);
    }

    // ── High temperature alert → show ALERT for 2s
    static bool prevHighTempFlag = false;
    bool isHighTempNow = (temperature != -100.0f && temperature > HIGH_TEMP_ALERT);
    if (isHighTempNow && !prevHighTempFlag)
    {
        char alertLine[17];
        snprintf(alertLine, sizeof(alertLine), "Temp:%5.1f%cC", temperature, (char)0xDF);
        showInterrupt("!!! ALERT !!!   ", alertLine);
    }
    prevHighTempFlag = isHighTempNow;

    // 5. Periodically update active runtimes
    updateActiveRuntimes();

    // 6. Periodic Telemetry Upload via MQTT
    if (now - lastTelemetryUpload >= SENSOR_READ_INTERVAL)
    {
        lastTelemetryUpload = now;
        uploadTelemetry(); // WiFi LED blinks inside here on success

        // Print status to Serial Monitor
        printSensors();
        Serial.print("Mode        : "); Serial.println(systemMode);
        Serial.print("Light Relay : "); Serial.println(light2State ? "ON" : "OFF");
    }

    // 7. Non-Volatile Persistence Save (on relay changes, every 5 mins)
    if (pendingSave)
    {
        if (now - lastSaveTime >= PREFS_SAVE_INTERVAL)
        {
            savePersistence();
            lastSaveTime = now;
        }
    }

    // 9. LCD update — handles interrupt expiry and home page refresh
    updateDisplay();

    // Small delay (~100Hz loop) for near-instant reaction
    delay(10);
}