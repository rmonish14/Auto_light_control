/*
=========================================================
SMART POULTRY AUTOMATION SYSTEM
---------------------------------------------------------
Controller  : ESP32 DevKit V1
Sensors     : DS18B20 (Temp), LDR LM393 (Light Detection)
Outputs     : Relay 1 (Light 1 — LDR Day/Night Auto)
              Relay 2 (Light 2 — Temperature-Based Auto)
Indicators  : LED_LIGHT1 (GPIO4), LED_LIGHT2 (GPIO5),
              LED_WIFI (GPIO2 — Solid=Connected, Blink=TX)
Display     : 16x2 I2C LCD (GPIO21 SDA, GPIO22 SCL)
Page Button : GPIO19
Connectivity: Wi-Fi, MQTT (HiveMQ public broker)
Time Sync   : NTP
Persistence : Non-Volatile Storage (Preferences/NVS)

Author: Monishwaran
=========================================================
*/

#include <Arduino.h>
#include <time.h>
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
unsigned long lastTimeInterrupt   = 0; // Global: reset by cloud.h on WiFi disconnect

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

    // 7. Setup NTP Server Time Sync
    Serial.println("Syncing time with NTP Server...");
    configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER);

    // 8. Connect to MQTT Broker (shows progress on LCD)
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
    temperature = readTemperature();
    dark        = isDark();

    // 3. Run Decision Engine based on active mode
    if (systemMode == "AUTO")
    {
        // --- Both lights follow LDR: Dark = ON, Bright = OFF ---
        setLight1(dark);
        setLight2(dark);
    }
    else if (systemMode == "MANUAL")
    {
        // --- Remote Web Overrides ---
        setLight1(light1Override);
        setLight2(light2Override);
    }
    else if (systemMode == "SCHEDULE")
    {
        // --- Light1 Control: Chick-Age Photoperiod Schedule ---
        struct tm timeinfo;
        bool timeSynced = getLocalTime(&timeinfo);

        if (timeSynced)
        {
            int currentHour = timeinfo.tm_hour;

            if (chickAgeDays <= 3)
            {
                // Day 1-3: 24 hours continuous light
                setLight1(true);
            }
            else if (chickAgeDays <= 7)
            {
                // Day 4-7: 20 Hours light, 4 Hours dark (10PM - 2AM)
                setLight1(!(currentHour >= 22 || currentHour < 2));
            }
            else
            {
                // Day 8+: 18 Hours light, 6 Hours dark (9PM - 3AM)
                setLight1(!(currentHour >= 21 || currentHour < 3));
            }
        }
        else
        {
            // Time sync failed: Fallback to LDR AUTO mode
            static unsigned long lastWarn = 0;
            if (now - lastWarn > 30000) {
                Serial.println("[Schedule Warning] NTP not synced. Falling back to LDR AUTO.");
                lastWarn = now;
            }
            setLight1(dark);
        }

        // --- Light2 follows same schedule as Light1 ---
        setLight2(light1State);
    }

    // 4. Update indicator LEDs to match relay states
    updateLight1LED(light1State);
    updateLight2LED(light2State);

    // 5. Interrupt triggers — detect state changes and show LCD notifications

    // ── LDR state change → show relay states for 2s
    static bool prevDarkState = false;
    if (dark != prevDarkState)
    {
        prevDarkState = dark;
        char line0[17], line1[17];
        snprintf(line0, sizeof(line0), dark ? ">>  Now: DARK   " : ">>  Now: BRIGHT ");
        snprintf(line1, sizeof(line1), "L1:%-3s   L2:%-3s",
                 light1State ? "ON" : "OFF",
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

    // ── Auto time display every 30 seconds (WiFi must be connected)
    if (now - lastTimeInterrupt >= 30000 && !interruptActive && WiFi.status() == WL_CONNECTED)
    {
        lastTimeInterrupt = now;
        struct tm timeinfo;
        if (getLocalTime(&timeinfo))
        {
            char timeLine[17], dateLine[17];
            snprintf(timeLine, sizeof(timeLine), "Time: %02d:%02d:%02d",
                     timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec);
            snprintf(dateLine, sizeof(dateLine), "Date: %02d/%02d/%04d",
                     timeinfo.tm_mday, timeinfo.tm_mon + 1, timeinfo.tm_year + 1900);
            showInterrupt(timeLine, dateLine);
        }
    }

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
        Serial.print("Light1 Relay: "); Serial.println(light1State ? "ON" : "OFF");
        Serial.print("Light2 Relay: "); Serial.println(light2State ? "ON" : "OFF");

        struct tm timeinfo;
        if (getLocalTime(&timeinfo)) {
            Serial.print("NTP Time    : ");
            Serial.println(asctime(&timeinfo));
        } else {
            Serial.println("NTP Time    : Not Synced");
        }
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

    // Small delay (~10Hz loop)
    delay(100);
}