#ifndef SENSORS_H
#define SENSORS_H

#include <Arduino.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include "config.h"

//====================================================
// Sensor Instances
//====================================================
OneWire oneWire(DS18B20_PIN);
DallasTemperature sensors(&oneWire);

//====================================================
// Global Variables for Sensor Readings
//====================================================
float temperature = 0.0f;
bool dark = false;
float lightIntensity = 0.0f;

//====================================================
// Initialize Sensors
//====================================================
void initSensors()
{
    sensors.begin();
    sensors.setResolution(DS18B20_RESOLUTION);
    pinMode(LDR_PIN, INPUT);
    Serial.println("Sensors Initialized.");
}

//====================================================
// Temperature Read (DS18B20)
//====================================================
float readTemperature()
{
    sensors.requestTemperatures();
    float t = sensors.getTempCByIndex(0);
    if (t != DEVICE_DISCONNECTED_C) {
        temperature = t;
    } else {
        temperature = -100.0f; // Error indicator
    }
    return temperature;
}

//====================================================
// LDR Day/Night Detection
//====================================================
bool isDark()
{
    // Read raw analog value (0 - 4095 on ESP32 12-bit ADC)
    int rawVal = analogRead(LDR_PIN);
    
    // Map: 4095 (darkest) to 0%, 0 (brightest) to 100%
    float pct = ((4095.0f - rawVal) / 4095.0f) * 100.0f;
    if (pct < 0.0f) pct = 0.0f;
    if (pct > 100.0f) pct = 100.0f;
    
    lightIntensity = pct;

    // Consider it dark if light intensity drops below 30%
    dark = (lightIntensity < 30.0f);

    return dark;
}

//====================================================
// Print Sensor Readings to Serial Monitor
//====================================================
void printSensors()
{
    Serial.println("----------- SENSOR MONITOR -----------");
    if (temperature == -100.0f) {
        Serial.println("Temperature : ERROR");
    } else {
        Serial.print("Temperature : ");
        Serial.print(temperature, 1);
        Serial.println(" C");
    }

    Serial.print("Light Level : ");
    Serial.print(lightIntensity, 1);
    Serial.print(" % (");
    Serial.print(dark ? "DARK" : "BRIGHT");
    Serial.println(")");
    Serial.println("--------------------------------------");
}

#endif