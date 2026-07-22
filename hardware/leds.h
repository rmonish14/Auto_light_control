#ifndef LEDS_H
#define LEDS_H

#include <Arduino.h>
#include "config.h"

//====================================================
// LED Status Indicator Driver
//====================================================
// LED_LIGHT1_PIN (GPIO4)  — Mirrors Light1 relay state (ON/OFF)
// LED_LIGHT2_PIN (GPIO5)  — Mirrors Light2 relay state (ON/OFF)
// LED_WIFI_PIN   (GPIO2)  — Solid: WiFi connected | Blink: sending data | OFF: disconnected
//====================================================

//--------------------------------------------------
// Initialize LED Pins
//--------------------------------------------------
void initLEDs()
{
    pinMode(LED_LIGHT2_PIN, OUTPUT);
    pinMode(LED_WIFI_PIN,   OUTPUT);

    // All LEDs OFF at boot
    digitalWrite(LED_LIGHT2_PIN, LOW);
    digitalWrite(LED_WIFI_PIN,   LOW);

    Serial.println("Indicator LEDs Initialized.");
}

//--------------------------------------------------
// Update Light2 indicator LED
// Mirrors the Light2 relay state exactly
//--------------------------------------------------
void updateLight2LED(bool state)
{
    digitalWrite(LED_LIGHT2_PIN, state ? HIGH : LOW);
}

//--------------------------------------------------
// WiFi LED blink — call when MQTT data is being sent
// Briefly blinks off and on to indicate transmission
//--------------------------------------------------
void blinkWiFiLED()
{
    // Short double-blink to indicate data send
    digitalWrite(LED_WIFI_PIN, LOW);
    delay(60);
    digitalWrite(LED_WIFI_PIN, HIGH);
    delay(60);
    digitalWrite(LED_WIFI_PIN, LOW);
    delay(60);
    digitalWrite(LED_WIFI_PIN, HIGH);
}

//--------------------------------------------------
// Set WiFi LED steady state
// Call once whenever WiFi connection status changes
//--------------------------------------------------
void setWiFiLED(bool connected)
{
    digitalWrite(LED_WIFI_PIN, connected ? HIGH : LOW);
}

#endif
