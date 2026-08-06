#ifndef CLOUD_H
#define CLOUD_H

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "config.h"
#include "sensors.h"
#include "relays.h"
#include "persistence.h"
#include "leds.h"
#include "display.h"

//--------------------------------------------------
// Global MQTT Client Objects
//--------------------------------------------------
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// Global settings/controls variables (defined here)
String systemMode = "AUTO"; // "AUTO", "MANUAL", "SCHEDULE"
bool light1Override = false;
bool light2Override = false;

// Event logging state flags to avoid flooding
bool prevHighTempAlert = false;
bool prevReplaceSoonAlert = false;
String prevModeLog = "";

// Time check
unsigned long lastReconnectAttempt = 0;

// Forward declarations
void logEvent(String message);

//--------------------------------------------------
// MQTT Incoming Message Callback
//--------------------------------------------------
void mqttCallback(char* topic, byte* payload, unsigned int length)
{
    String payloadStr = "";
    for (unsigned int i = 0; i < length; i++) {
        payloadStr += (char)payload[i];
    }

    Serial.print("[MQTT Callback] Message arrived [");
    Serial.print(topic);
    Serial.print("]: ");
    Serial.println(payloadStr);

    if (String(topic) == MQTT_TOPIC_COMMANDS)
    {
        JsonDocument doc;
        DeserializationError error = deserializeJson(doc, payloadStr);
        if (error) {
            Serial.print("[MQTT Error] JSON parse failed: ");
            Serial.println(error.c_str());
            return;
        }

        if (doc.containsKey("mode")) {
            systemMode = doc["mode"].as<String>();
        }
        if (doc.containsKey("light1Override")) {
            light1Override = doc["light1Override"].as<bool>();
        }
        if (doc.containsKey("light2Override")) {
            light2Override = doc["light2Override"].as<bool>();
        }
        if (doc.containsKey("scheduleLight1")) {
            scheduleLight1State = doc["scheduleLight1"].as<bool>();
        }
        if (doc.containsKey("scheduleLight2")) {
            scheduleLight2State = doc["scheduleLight2"].as<bool>();
        }
        if (doc.containsKey("luxThreshold")) {
            luxThreshold = doc["luxThreshold"].as<float>();
            pendingSave = true;
        }
        if (doc.containsKey("light2OnTemp")) {
            light2OnTemp = doc["light2OnTemp"].as<float>();
            pendingSave = true;
        }
        if (doc.containsKey("light2OffTemp")) {
            light2OffTemp = doc["light2OffTemp"].as<float>();
            pendingSave = true;
        }
        if (doc.containsKey("chickAgeDays")) {
            int age = doc["chickAgeDays"].as<int>();
            if (age != chickAgeDays) {
                chickAgeDays = age;
                pendingSave = true;
            }
        }
        
        // Parse nested threshold configurations if sent from Config Page
        if (doc.containsKey("configUpdate")) {
            JsonObject configObj = doc["configUpdate"];
            if (configObj.containsKey("luxThreshold")) {
                luxThreshold = configObj["luxThreshold"].as<float>();
                pendingSave = true;
            }
            if (configObj.containsKey("light2OnTemp")) {
                light2OnTemp = configObj["light2OnTemp"].as<float>();
                pendingSave = true;
            }
            if (configObj.containsKey("light2OffTemp")) {
                light2OffTemp = configObj["light2OffTemp"].as<float>();
                pendingSave = true;
            }
        }
        
        // Parse nested schedule configurations
        if (doc.containsKey("scheduleConfig")) {
            JsonObject configJson = doc["scheduleConfig"];
            if (configJson.containsKey("onTime")) {
                String onTime = configJson["onTime"].as<String>();
                int separator = onTime.indexOf(':');
                if (separator != -1) {
                    scheduleOnHour = onTime.substring(0, separator).toInt();
                    scheduleOnMin = onTime.substring(separator + 1).toInt();
                    pendingSave = true;
                }
            }
            if (configJson.containsKey("offTime")) {
                String offTime = configJson["offTime"].as<String>();
                int separator = offTime.indexOf(':');
                if (separator != -1) {
                    scheduleOffHour = offTime.substring(0, separator).toInt();
                    scheduleOffMin = offTime.substring(separator + 1).toInt();
                    pendingSave = true;
                }
            }
            if (configJson.containsKey("ch1Enabled")) {
                scheduleCh1Enabled = configJson["ch1Enabled"].as<bool>();
                pendingSave = true;
            }
            if (configJson.containsKey("ch2Enabled")) {
                scheduleCh2Enabled = configJson["ch2Enabled"].as<bool>();
                pendingSave = true;
            }
            if (configJson.containsKey("durationDays")) {
                scheduleDurationDays = configJson["durationDays"].as<int>();
                scheduleStartYear = 2026;
                scheduleStartMonth = 1;
                scheduleStartDay = 1;
                pendingSave = true;
            }
            
            Serial.println("[MQTT Command Sync] Schedule settings updated:");
            Serial.printf("  ON Time  : %02d:%02d\n", scheduleOnHour, scheduleOnMin);
            Serial.printf("  OFF Time : %02d:%02d\n", scheduleOffHour, scheduleOffMin);
            Serial.printf("  Ch1/Ch2  : %s / %s\n", scheduleCh1Enabled ? "YES" : "NO", scheduleCh2Enabled ? "YES" : "NO");
            Serial.printf("  Duration : %d days\n", scheduleDurationDays);
        }

        Serial.print("[MQTT Command Sync] Mode: "); Serial.print(systemMode);
        Serial.print(" | Light1Override: "); Serial.print(light1Override ? "ON" : "OFF");
        Serial.print(" | Light2Override: "); Serial.print(light2Override ? "ON" : "OFF");
        Serial.print(" | ChickAge: "); Serial.println(chickAgeDays);

        // Log mode changes
        if (systemMode != prevModeLog) {
            logEvent("System mode changed to " + systemMode);
            showInterrupt("Mode Changed:   ", systemMode.c_str());
            prevModeLog = systemMode;
        }
    }
}

//--------------------------------------------------
// Initialize Wi-Fi Connection
//--------------------------------------------------
void initWiFi()
{
    Serial.println();
    Serial.print("Connecting to SSID: ");
    Serial.println(WIFI_SSID);

    lcdShowStatus("WiFi Connecting.", WIFI_SSID);

    // Start with LED OFF before blinking
    setWiFiLED(false);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    int attempts = 0;
    bool ledBlink = false;
    while (WiFi.status() != WL_CONNECTED && attempts < 25)
    {
        ledBlink = !ledBlink;
        setWiFiLED(ledBlink); // Blink every 500ms during search
        delay(500);
        Serial.print(".");
        attempts++;
    }
    setWiFiLED(false); // Reset before final check
    Serial.println();

    if (WiFi.status() == WL_CONNECTED)
    {
        Serial.print("Wi-Fi Connected! IP Address: ");
        Serial.println(WiFi.localIP());
        Serial.print("Signal Strength (RSSI): ");
        Serial.print(WiFi.RSSI());
        Serial.println(" dBm");
        setWiFiLED(true); // Solid ON = connected

        char ipStr[17];
        snprintf(ipStr, sizeof(ipStr), "%-16s", WiFi.localIP().toString().c_str());
        lcdShowStatus("WiFi Connected! ", ipStr);
        delay(1500);
    }
    else
    {
        Serial.println("Wi-Fi connection timed out. System running in Offline Mode.");
        setWiFiLED(false);
        lcdShowStatus("WiFi Failed!    ", "Offline Mode    ");
        delay(1500);
    }
}

//--------------------------------------------------
// Initialize MQTT Connection
//--------------------------------------------------
void initMQTT()
{
    mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
    mqttClient.setBufferSize(1024); // Increase buffer size for JSON payloads
    mqttClient.setCallback(mqttCallback);
    Serial.println("MQTT Client Initialized.");

    // Attempt first MQTT connection at boot if WiFi is up
    if (WiFi.status() == WL_CONNECTED)
    {
        lcdShowStatus("MQTT Connecting.", MQTT_BROKER);
        Serial.println("Attempting initial MQTT connection...");

        String clientId = String(MQTT_CLIENT_ID) + "_" + String(random(0, 1000));
        if (mqttClient.connect(clientId.c_str()))
        {
            mqttClient.subscribe(MQTT_TOPIC_COMMANDS);
            Serial.println("MQTT Connected on boot.");

            char portStr[17];
            snprintf(portStr, sizeof(portStr), "Port: %d", MQTT_PORT);
            lcdShowStatus("MQTT Connected! ", portStr);
            delay(1500);
        }
        else
        {
            Serial.print("Initial MQTT connect failed, state=");
            Serial.println(mqttClient.state());
            lcdShowStatus("MQTT Failed!    ", "Will retry...   ");
            delay(1500);
        }
    }
}

//--------------------------------------------------
// Log an Event to MQTT Events Topic
//--------------------------------------------------
void logEvent(String message)
{
    if (!mqttClient.connected()) return;

    JsonDocument event;
    event["message"] = message;
    event["timestamp"] = millis();

    String eventStr;
    serializeJson(event, eventStr);

    if (mqttClient.publish(MQTT_TOPIC_EVENTS, eventStr.c_str())) {
        Serial.print("[MQTT Logger] Logged Event: ");
        Serial.println(message);
    } else {
        Serial.println("[MQTT Logger] Failed to publish event log.");
    }
}

//--------------------------------------------------
// Upload Telemetry Data to MQTT Topic
//--------------------------------------------------
void uploadTelemetry()
{
    if (!mqttClient.connected()) return;

    JsonDocument doc;

    // 1. Status Section
    doc["status"]["temperature"]    = temperature;
    doc["status"]["environment"]    = dark ? "DARK" : "BRIGHT";
    doc["status"]["lightIntensity"] = lightIntensity;
    doc["status"]["light1Status"]   = light1State;
    doc["status"]["light2Status"]   = light2State;
    doc["status"]["wifiRSSI"]       = WiFi.RSSI();

    // 2. Settings Section
    doc["settings"]["mode"]         = systemMode;
    doc["settings"]["chickAgeDays"] = chickAgeDays;
    doc["settings"]["luxThreshold"] = luxThreshold;
    doc["settings"]["light2OnTemp"]  = light2OnTemp;
    doc["settings"]["light2OffTemp"] = light2OffTemp;
    
    char scheduleOnTimeStr[6];
    char scheduleOffTimeStr[6];
    snprintf(scheduleOnTimeStr, sizeof(scheduleOnTimeStr), "%02d:%02d", scheduleOnHour, scheduleOnMin);
    snprintf(scheduleOffTimeStr, sizeof(scheduleOffTimeStr), "%02d:%02d", scheduleOffHour, scheduleOffMin);
    
    doc["settings"]["scheduleOnTime"]       = scheduleOnTimeStr;
    doc["settings"]["scheduleOffTime"]      = scheduleOffTimeStr;
    doc["settings"]["scheduleCh1Enabled"]   = scheduleCh1Enabled;
    doc["settings"]["scheduleCh2Enabled"]   = scheduleCh2Enabled;
    doc["settings"]["scheduleDurationDays"] = scheduleDurationDays;
    doc["settings"]["scheduleStartYear"]    = scheduleStartYear;
    doc["settings"]["scheduleStartMonth"]   = scheduleStartMonth;
    doc["settings"]["scheduleStartDay"]     = scheduleStartDay;

    // 3. Maintenance & Lifespans Section
    doc["maintenance"]["light1OnCount"]     = light1OnCount;
    doc["maintenance"]["light2OnCount"]     = light2OnCount;
    doc["maintenance"]["totalLight1OnTime"] = totalLight1OnTime;
    doc["maintenance"]["totalLight2OnTime"] = totalLight2OnTime;

    // Bulb Health % Calculations (based on Light2 main lamp)
    float bulbHoursUsed = totalLight2OnTime / 3600.0f;
    float hourHealth = ((BULB_RATED_HOURS - bulbHoursUsed) / BULB_RATED_HOURS) * 100.0f;
    if (hourHealth < 0) hourHealth = 0.0f;
    float cycleHealth = ((BULB_RATED_CYCLES - light2OnCount) / BULB_RATED_CYCLES) * 100.0f;
    if (cycleHealth < 0) cycleHealth = 0.0f;
    float bulbHealth = hourHealth < cycleHealth ? hourHealth : cycleHealth;
    doc["maintenance"]["bulbHealth"] = bulbHealth;

    // 4. Active Warnings & Alerts
    bool isHighTemp    = (temperature != -100.0f && temperature > HIGH_TEMP_ALERT);
    bool isReplaceSoon = (bulbHealth < 20.0f);
    bool isEndOfLife   = (bulbHoursUsed >= BULB_RATED_HOURS);

    doc["maintenance"]["alerts"]["highTemp"]    = isHighTemp;
    doc["maintenance"]["alerts"]["replaceSoon"] = isReplaceSoon;
    doc["maintenance"]["alerts"]["endOfLife"]   = isEndOfLife;

    // Serialize payload
    String jsonStr;
    serializeJson(doc, jsonStr);

    if (mqttClient.publish(MQTT_TOPIC_STATUS, jsonStr.c_str())) {
        Serial.println("[MQTT] Telemetry published successfully.");
        blinkWiFiLED(); // Double-blink to indicate data sent
    } else {
        Serial.println("[MQTT] Telemetry publication failed.");
    }

    // 5. Event-Driven Alert Logging
    if (isHighTemp && !prevHighTempAlert) {
        logEvent("ALERT: Dangerous High Temperature of " + String(temperature, 1) + " C inside poultry house!");
        prevHighTempAlert = true;
    } else if (!isHighTemp && prevHighTempAlert) {
        logEvent("Alert cleared: Temperature returned to normal range.");
        prevHighTempAlert = false;
    }

    if (isReplaceSoon && !prevReplaceSoonAlert) {
        logEvent("WARNING: Bulb health is below 20%. Please replace soon.");
        prevReplaceSoonAlert = true;
    }
}

//--------------------------------------------------
// Reconnection & connection health keeper
//--------------------------------------------------
void maintainConnections()
{
    static bool prevWifiConnected = true; // assume connected at boot

    bool wifiNowConnected = (WiFi.status() == WL_CONNECTED);

    static unsigned long lastWifiAttempt = 0;

    // ── WiFi Reconnect (Non-blocking Background Scanner) ───────
    if (!wifiNowConnected)
    {
        if (prevWifiConnected) {
            // Just lost connection
            setWiFiLED(false);
            Serial.println("[Wi-Fi Monitor] Connection lost. Reconnecting in background...");
        }

        unsigned long now = millis();
        if (now - lastWifiAttempt > 10000) { // Retry every 10s
            lastWifiAttempt = now;
            WiFi.disconnect();
            WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
            Serial.println("[Wi-Fi Monitor] Reconnecting to WiFi in background...");
        }

        // Non-blocking WiFi LED blinking (toggle every 500ms)
        static unsigned long lastBlink = 0;
        static bool blinkState = false;
        if (now - lastBlink >= 500) {
            lastBlink = now;
            blinkState = !blinkState;
            setWiFiLED(blinkState);
        }
    }

    // ── WiFi Just Connected (transition) ─────────
    if (wifiNowConnected && !prevWifiConnected)
    {
        setWiFiLED(true);
        Serial.print("[Wi-Fi] Reconnected! IP: ");
        Serial.println(WiFi.localIP());

        // LCD interrupt notification: WiFi connected
        char ipStr[17];
        snprintf(ipStr, sizeof(ipStr), "%-16s", WiFi.localIP().toString().c_str());
        showInterrupt("WiFi Connected! ", ipStr);
    }

    prevWifiConnected = wifiNowConnected;

    // ── MQTT Reconnect ────────────────────────────
    if (wifiNowConnected && !mqttClient.connected())
    {
        unsigned long now = millis();
        if (now - lastReconnectAttempt > 5000)
        {
            lastReconnectAttempt = now;
            Serial.print("[MQTT Client] Reconnecting to broker: ");
            Serial.println(MQTT_BROKER);

            String clientId = String(MQTT_CLIENT_ID) + "_" + String(random(0, 1000));

            if (mqttClient.connect(clientId.c_str()))
            {
                Serial.println("[MQTT Client] Connected successfully!");
                mqttClient.subscribe(MQTT_TOPIC_COMMANDS);
                setWiFiLED(true);
                logEvent("Poultry system connected to MQTT Broker.");
            }
            else
            {
                Serial.print("[MQTT Client] Connection failed, state = ");
                Serial.println(mqttClient.state());
            }
        }
    }
}

#endif
