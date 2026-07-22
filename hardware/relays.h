#ifndef RELAYS_H
#define RELAYS_H

#include <Arduino.h>
#include "config.h"

//--------------------------------------------------
// Global Tracking Variables (Declared extern, defined in persistence.h)
//--------------------------------------------------
extern uint32_t light1OnCount;
extern uint32_t totalLight1OnTime;     // Total Light1 ON time in seconds
extern uint32_t lastLight1OnTime;      // millis() when Light1 was turned ON

extern uint32_t light2OnCount;
extern uint32_t totalLight2OnTime;     // Total Light2 ON time in seconds
extern uint32_t lastLight2OnTime;      // millis() when Light2 was turned ON

// State flags
extern bool light1State;
extern bool light2State;

// Flag to indicate that settings need to be saved to Preferences
extern bool pendingSave;

//--------------------------------------------------
// Initialize Relay Pins
//--------------------------------------------------
void initRelays()
{
    pinMode(LIGHT1_RELAY_PIN, OUTPUT);
    pinMode(LIGHT2_RELAY_PIN, OUTPUT);

    // Initial state is OFF
    digitalWrite(LIGHT1_RELAY_PIN, RELAY_OFF);
    digitalWrite(LIGHT2_RELAY_PIN, RELAY_OFF);

    light1State = false;
    light2State = false;
}

//--------------------------------------------------
// Light 1 Relay Control (LDR Day/Night)
//--------------------------------------------------
void setLight1(bool on)
{
    if (on)
    {
        if (!light1State) // Transition OFF -> ON
        {
            digitalWrite(LIGHT1_RELAY_PIN, RELAY_ON);
            light1State = true;
            light1OnCount++;
            lastLight1OnTime = millis();
            pendingSave = true;
            Serial.print("[Relay] Light1 ON | Cycle Count: ");
            Serial.println(light1OnCount);
        }
    }
    else
    {
        if (light1State) // Transition ON -> OFF
        {
            digitalWrite(LIGHT1_RELAY_PIN, RELAY_OFF);
            light1State = false;
            uint32_t elapsed = (millis() - lastLight1OnTime) / 1000;
            totalLight1OnTime += elapsed;
            pendingSave = true;
            Serial.print("[Relay] Light1 OFF | Runtime added: ");
            Serial.print(elapsed);
            Serial.print("s | Total: ");
            Serial.print(totalLight1OnTime / 3600.0f);
            Serial.println(" hrs");
        }
    }
}

//--------------------------------------------------
// Light 2 Relay Control (Temperature-Based)
//--------------------------------------------------
void setLight2(bool on)
{
    if (on)
    {
        if (!light2State) // Transition OFF -> ON
        {
            digitalWrite(LIGHT2_RELAY_PIN, RELAY_ON);
            light2State = true;
            light2OnCount++;
            lastLight2OnTime = millis();
            pendingSave = true;
            Serial.print("[Relay] Light2 ON | Cycle Count: ");
            Serial.println(light2OnCount);
        }
    }
    else
    {
        if (light2State) // Transition ON -> OFF
        {
            digitalWrite(LIGHT2_RELAY_PIN, RELAY_OFF);
            light2State = false;
            uint32_t elapsed = (millis() - lastLight2OnTime) / 1000;
            totalLight2OnTime += elapsed;
            pendingSave = true;
            Serial.print("[Relay] Light2 OFF | Runtime added: ");
            Serial.print(elapsed);
            Serial.print("s | Total: ");
            Serial.print(totalLight2OnTime / 3600.0f);
            Serial.println(" hrs");
        }
    }
}

//--------------------------------------------------
// Periodically update active runtimes to prevent data loss on power-cut
//--------------------------------------------------
void updateActiveRuntimes()
{
    uint32_t now = millis();

    if (light1State)
    {
        uint32_t elapsed = (now - lastLight1OnTime) / 1000;
        if (elapsed > 0)
        {
            totalLight1OnTime += elapsed;
            lastLight1OnTime = now;
            pendingSave = true;
        }
    }

    if (light2State)
    {
        uint32_t elapsed = (now - lastLight2OnTime) / 1000;
        if (elapsed > 0)
        {
            totalLight2OnTime += elapsed;
            lastLight2OnTime = now;
            pendingSave = true;
        }
    }
}

#endif