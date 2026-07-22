#ifndef PERSISTENCE_H
#define PERSISTENCE_H

#include <Preferences.h>

// Declare global tracking variables (defined here)
uint32_t light1OnCount = 0;
uint32_t totalLight1OnTime = 0;    // seconds
uint32_t lastLight1OnTime = 0;     // millis

uint32_t light2OnCount = 0;
uint32_t totalLight2OnTime = 0;    // seconds
uint32_t lastLight2OnTime = 0;     // millis

int chickAgeDays = 1;              // default 1 day old

bool light1State = false;
bool light2State = false;
bool pendingSave = false;

// Instance of Preferences
Preferences preferences;

//--------------------------------------------------
// Initialize Preferences and Load Stored Values
//--------------------------------------------------
void initPersistence()
{
    preferences.begin("poultry", false);

    light1OnCount    = preferences.getUInt("l1OnCount", 0);
    totalLight1OnTime = preferences.getUInt("l1OnTime", 0);
    light2OnCount    = preferences.getUInt("l2OnCount", 0);
    totalLight2OnTime = preferences.getUInt("l2OnTime", 0);
    chickAgeDays     = preferences.getInt("chickAge", 1);

    Serial.println("------------- PERSISTED VALUES -------------");
    Serial.print("Light1 On Count  : "); Serial.println(light1OnCount);
    Serial.print("Light1 Runtime   : "); Serial.print(totalLight1OnTime / 3600.0f, 2); Serial.println(" hours");
    Serial.print("Light2 On Count  : "); Serial.println(light2OnCount);
    Serial.print("Light2 Runtime   : "); Serial.print(totalLight2OnTime / 3600.0f, 2); Serial.println(" hours");
    Serial.print("Chick Age (Days) : "); Serial.println(chickAgeDays);
    Serial.println("--------------------------------------------");
}

//--------------------------------------------------
// Save Current Telemetry to NVS
//--------------------------------------------------
void savePersistence()
{
    if (!pendingSave) return;

    preferences.putUInt("l1OnCount",  light1OnCount);
    preferences.putUInt("l1OnTime",   totalLight1OnTime);
    preferences.putUInt("l2OnCount",  light2OnCount);
    preferences.putUInt("l2OnTime",   totalLight2OnTime);
    preferences.putInt("chickAge",    chickAgeDays);

    pendingSave = false;
    Serial.println("[Persistence] Telemetry saved to non-volatile flash memory.");
}

//--------------------------------------------------
// Reset All Lifetime Telemetry (Utility function)
//--------------------------------------------------
void resetPersistence()
{
    preferences.putUInt("l1OnCount", 0);
    preferences.putUInt("l1OnTime",  0);
    preferences.putUInt("l2OnCount", 0);
    preferences.putUInt("l2OnTime",  0);
    preferences.putInt("chickAge",   1);

    light1OnCount = 0;
    totalLight1OnTime = 0;
    light2OnCount = 0;
    totalLight2OnTime = 0;
    chickAgeDays = 1;

    pendingSave = false;
    Serial.println("[Persistence] All stored values have been reset.");
}

#endif
