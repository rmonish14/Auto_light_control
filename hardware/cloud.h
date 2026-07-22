#ifndef CLOUD_H
#define CLOUD_H

#include <WiFi.h>
#include <PubSubClient.h>
#include <Firebase_ESP_Client.h>
#include <time.h>
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
        FirebaseJson json;
        json.setJsonData(payloadStr);
        FirebaseJsonData data;

        if (json.get(data, "mode")) {
            systemMode = data.stringValue;
        }
        if (json.get(data, "light1Override")) {
            light1Override = data.boolValue;
        }
        if (json.get(data, "light2Override")) {
            light2Override = data.boolValue;
        }
        if (json.get(data, "chickAgeDays")) {
            int age = data.intValue;
            if (age != chickAgeDays) {
                chickAgeDays = age;
                pendingSave = true;
            }
        }

        Serial.print("[MQTT Command Sync] Mode: "); Serial.print(systemMode);
        Serial.print(" | Light1Override: "); Serial.print(light1Override ? "ON" : "OFF");
        Serial.print(" | Light2Override: "); Serial.print(light2Override ? "ON" : "OFF");
        Serial.print(" | ChickAge: "); Serial.println(chickAgeDays);

        // Log mode changes
        if (systemMode != prevModeLog) {
            logEvent("System mode changed to " + systemMode);
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
    mqttClient.setBufferSize(512); // Increase buffer size for large JSON payloads
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

    FirebaseJson event;
    event.set("message", message);

    time_t nowTime = time(nullptr);
    if (nowTime > 100000) {
        event.set("timestamp", (uint64_t)nowTime * 1000ULL);
    } else {
        event.set("timestamp", millis());
    }

    String eventStr;
    event.toString(eventStr, false);

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

    FirebaseJson json;

    // 1. Status Section
    json.set("status/temperature",   temperature);
    json.set("status/environment",   dark ? "DARK" : "BRIGHT");
    json.set("status/lightIntensity", lightIntensity);
    json.set("status/light1Status",  light1State);
    json.set("status/light2Status",  light2State);
    json.set("status/wifiRSSI",      WiFi.RSSI());

    // 2. Settings Section
    json.set("settings/mode",         systemMode);
    json.set("settings/chickAgeDays", chickAgeDays);
    json.set("settings/light2OnTemp", LIGHT2_ON_TEMP);
    json.set("settings/light2OffTemp", LIGHT2_OFF_TEMP);

    // 3. Maintenance & Lifespans Section
    json.set("maintenance/light1OnCount",     light1OnCount);
    json.set("maintenance/light2OnCount",     light2OnCount);
    json.set("maintenance/totalLight1OnTime", totalLight1OnTime);
    json.set("maintenance/totalLight2OnTime", totalLight2OnTime);

    // Bulb Health % Calculations (based on Light1 main lamp)
    float bulbHoursUsed = totalLight1OnTime / 3600.0f;
    float hourHealth = ((BULB_RATED_HOURS - bulbHoursUsed) / BULB_RATED_HOURS) * 100.0f;
    if (hourHealth < 0) hourHealth = 0.0f;
    float cycleHealth = ((BULB_RATED_CYCLES - light1OnCount) / BULB_RATED_CYCLES) * 100.0f;
    if (cycleHealth < 0) cycleHealth = 0.0f;
    float bulbHealth = hourHealth < cycleHealth ? hourHealth : cycleHealth;
    json.set("maintenance/bulbHealth", bulbHealth);

    // 4. Active Warnings & Alerts
    bool isHighTemp    = (temperature != -100.0f && temperature > HIGH_TEMP_ALERT);
    bool isReplaceSoon = (bulbHealth < 20.0f);
    bool isEndOfLife   = (bulbHoursUsed >= BULB_RATED_HOURS);

    json.set("maintenance/alerts/highTemp",    isHighTemp);
    json.set("maintenance/alerts/replaceSoon", isReplaceSoon);
    json.set("maintenance/alerts/endOfLife",   isEndOfLife);

    // Serialize payload
    String jsonStr;
    json.toString(jsonStr, false);

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

    // ── WiFi Reconnect ────────────────────────────
    if (!wifiNowConnected)
    {
        if (prevWifiConnected) {
            // Just lost connection
            setWiFiLED(false);
            Serial.println("[Wi-Fi Monitor] Connection lost. Reconnecting in background...");
            // Reset time display timer so time won't show for 30s after reconnect
            extern unsigned long lastTimeInterrupt;
            lastTimeInterrupt = millis();
        }

        // Non-blocking reconnect attempt
        WiFi.disconnect();
        WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

        int retries = 0;
        bool ledBlink = false;
        while (WiFi.status() != WL_CONNECTED && retries < 10) {
            ledBlink = !ledBlink;
            setWiFiLED(ledBlink); // Blink during reconnect too
            delay(500);
            Serial.print(".");
            retries++;
        }
        setWiFiLED(false);
        Serial.println();
        wifiNowConnected = (WiFi.status() == WL_CONNECTED);
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
