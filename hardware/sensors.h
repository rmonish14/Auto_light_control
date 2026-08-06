#ifndef SENSORS_H
#define SENSORS_H

#include <Arduino.h>
#include <Wire.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <Adafruit_VEML7700.h>
#include "config.h"

//====================================================
// Sensor Instances
//====================================================
OneWire oneWire(DS18B20_PIN);
DallasTemperature sensors(&oneWire);
Adafruit_VEML7700 veml = Adafruit_VEML7700();

//====================================================
// Global Variables for Sensor Readings
//====================================================
float temperature = 0.0f;
bool dark = false;
float lightIntensity = 0.0f;
float luxThreshold = 50.0f;
float light2OnTemp = 34.0f;
float light2OffTemp = 30.0f;

//====================================================
// Initialize Sensors
//====================================================
void initSensors()
{
    sensors.begin();
    sensors.setResolution(DS18B20_RESOLUTION);
    sensors.setWaitForConversion(false); // Make conversion non-blocking
    
    if (veml.begin()) {
        Serial.println("VEML7700 Initialized.");
        veml.setGain(VEML7700_GAIN_1_8);
        veml.setIntegrationTime(VEML7700_IT_25MS); // Fastest integration time for instant reaction
    } else {
        Serial.println("VEML7700 NOT FOUND!");
    }
    
    Serial.println("Sensors Initialized.");
}

//====================================================
// Temperature Read (DS18B20)
//====================================================
void requestTemperature()
{
    sensors.requestTemperatures();
}

float readTemperature()
{
    float t = sensors.getTempCByIndex(0);
    // Ignore 85.0C which is the default uninitialized value for DS18B20
    if (t != DEVICE_DISCONNECTED_C && t != 85.0f) {
        temperature = t;
    } else if (t == DEVICE_DISCONNECTED_C) {
        temperature = -100.0f; // Error indicator
    }
    return temperature;
}

//====================================================
// VEML7700 Ambient Light Day/Night Detection
//====================================================
bool isDark()
{
    float lux = veml.readLux();
    if (lux < 0) lux = 0; // prevent negative readings
    
    lightIntensity = lux;

    // Consider it dark if light intensity drops below the threshold (e.g. 50 lux)
    dark = (lightIntensity < luxThreshold);

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
    Serial.print(" Lux (");
    Serial.print(dark ? "DARK" : "BRIGHT");
    Serial.println(")");
    Serial.println("--------------------------------------");
}

#endif