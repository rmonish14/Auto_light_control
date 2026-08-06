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

// Schedule settings
int scheduleOnHour = 7;
int scheduleOnMin = 0;
int scheduleOffHour = 19;
int scheduleOffMin = 0;
bool scheduleCh1Enabled = true;
bool scheduleCh2Enabled = true;
int scheduleDurationDays = 0;      // 0 = Always Run
int scheduleStartYear = 0;
int scheduleStartMonth = 0;
int scheduleStartDay = 0;

bool scheduleLight1State = false;
bool scheduleLight2State = false;

bool light1State = false;
bool light2State = false;
bool pendingSave = false;

extern float luxThreshold;
extern float light2OnTemp;
extern float light2OffTemp;

// Instance of Preferences
Preferences preferences;

//--------------------------------------------------
// Initialize Preferences and Load Stored Values
//--------------------------------------------------
void initPersistence()
{
    preferences.begin("poultry", false);

    light1OnCount    = preferences.getUInt("l1OnCount", 0);
    totalLight1OnTime = preferences.getUInt("l1Time", 0);
    light2OnCount    = preferences.getUInt("l2OnCount", 0);
    totalLight2OnTime = preferences.getUInt("l2Time", 0);
    chickAgeDays     = preferences.getInt("chickAge", 1);
    
    luxThreshold     = preferences.getFloat("luxThresh", 50.0f);
    light2OnTemp     = preferences.getFloat("l2OnTemp", 34.0f);
    light2OffTemp    = preferences.getFloat("l2OffTemp", 30.0f);
    
    scheduleOnHour   = preferences.getInt("schOnHour", 7);
    scheduleOnMin    = preferences.getInt("schOnMin", 0);
    scheduleOffHour  = preferences.getInt("schOffHour", 19);
    scheduleOffMin   = preferences.getInt("schOffMin", 0);
    scheduleCh1Enabled = preferences.getBool("schCh1", true);
    scheduleCh2Enabled = preferences.getBool("schCh2", true);
    scheduleDurationDays = preferences.getInt("schDur", 0);
    scheduleStartYear = preferences.getInt("schStartYr", 0);
    scheduleStartMonth = preferences.getInt("schStartMon", 0);
    scheduleStartDay = preferences.getInt("schStartDay", 0);

    Serial.println("------------- PERSISTED VALUES -------------");
    Serial.print("Light1 On Count  : "); Serial.println(light1OnCount);
    Serial.print("Light1 Runtime   : "); Serial.print(totalLight1OnTime / 3600.0f, 2); Serial.println(" hours");
    Serial.print("Light2 On Count  : "); Serial.println(light2OnCount);
    Serial.print("Light2 Runtime   : "); Serial.print(totalLight2OnTime / 3600.0f, 2); Serial.println(" hours");
    Serial.print("Chick Age (Days) : "); Serial.println(chickAgeDays);
    Serial.print("Lux Threshold    : "); Serial.println(luxThreshold, 1);
    Serial.print("Light 2 Temp ON  : "); Serial.print(light2OnTemp, 1); Serial.println(" C");
    Serial.print("Light 2 Temp OFF : "); Serial.print(light2OffTemp, 1); Serial.println(" C");
    Serial.println("--------------------------------------------");
}

//--------------------------------------------------
// Save Current Telemetry to NVS
//--------------------------------------------------
void savePersistence()
{
    if (!pendingSave) return;

    preferences.putUInt("l1OnCount",  light1OnCount);
    preferences.putUInt("l1Time",     totalLight1OnTime);
    preferences.putUInt("l2OnCount",  light2OnCount);
    preferences.putUInt("l2Time",     totalLight2OnTime);
    preferences.putInt("chickAge",    chickAgeDays);

    preferences.putFloat("luxThresh", luxThreshold);
    preferences.putFloat("l2OnTemp",  light2OnTemp);
    preferences.putFloat("l2OffTemp", light2OffTemp);

    preferences.putInt("schOnHour",   scheduleOnHour);
    preferences.putInt("schOnMin",    scheduleOnMin);
    preferences.putInt("schOffHour",  scheduleOffHour);
    preferences.putInt("schOffMin",   scheduleOffMin);
    preferences.putBool("schCh1",     scheduleCh1Enabled);
    preferences.putBool("schCh2",     scheduleCh2Enabled);
    preferences.putInt("schDur",      scheduleDurationDays);
    preferences.putInt("schStartYr",  scheduleStartYear);
    preferences.putInt("schStartMon", scheduleStartMonth);
    preferences.putInt("schStartDay", scheduleStartDay);

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
