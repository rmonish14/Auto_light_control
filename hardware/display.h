#ifndef DISPLAY_H
#define DISPLAY_H

#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include "config.h"
#include "sensors.h"
#include "relays.h"
#include "persistence.h"

// Extern references from cloud.h
extern String systemMode;

// LCD instance
LiquidCrystal_I2C lcd(LCD_ADDRESS, LCD_COLS, LCD_ROWS);

// Button debounce
unsigned long lastPageSwitch = 0;

// ── Interrupt Overlay System ──────────────────────
// Any event can trigger a 2-second overlay that
// auto-returns to the home page when it expires.
// ─────────────────────────────────────────────────
bool interruptActive = false;
unsigned long interruptEndTime = 0;

//--------------------------------------------------
// Boot / Status message helper (used during boot sequence)
//--------------------------------------------------
void lcdShowStatus(const char* line1, const char* line2)
{
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print(line1);
    lcd.setCursor(0, 1);
    lcd.print(line2);
}

//--------------------------------------------------
// Initialize LCD hardware + show splash screen
//--------------------------------------------------
void initDisplay()
{
    pinMode(PAGE_BUTTON_PIN, INPUT_PULLUP);
    lcd.init();
    lcd.backlight();
    lcd.clear();
    lcdShowStatus(" PoultryCore IoT", " Initializing...");
    delay(1500);
}

//--------------------------------------------------
// Show a 2-second interrupt overlay
// After duration, display auto-returns to home page
//--------------------------------------------------
void showInterrupt(const char* line1, const char* line2, unsigned long durationMs = 2000)
{
    interruptActive = true;
    interruptEndTime = millis() + durationMs;
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print(line1);
    lcd.setCursor(0, 1);
    lcd.print(line2);
    Serial.print("[LCD] Interrupt: ");
    Serial.print(line1);
    Serial.print(" | ");
    Serial.println(line2);
}

//--------------------------------------------------
// Home page — permanent default display (Page 0)
//
//  Line 0: "Lux :45.2   DARK" (or BRIGHT)
//  Line 1: "Temp:32.5   AUTO" (or MANUAL / SCHED)
//--------------------------------------------------
void showHomePage()
{
    char buf0[17] = {0};
    char buf1[17] = {0};

    // Format Line 0: Lux reading + Environment state
    snprintf(buf0, sizeof(buf0), "Lux :%-5.1f %-6s", lightIntensity, dark ? "DARK" : "BRIGHT");

    // Format Line 1: Temp reading + Current System Mode
    String modeLabel = systemMode;
    if (modeLabel == "SCHEDULE") modeLabel = "SCHED";

    if (temperature == -100.0f) {
        snprintf(buf1, sizeof(buf1), "Temp: ERR  %-6s", modeLabel.c_str());
    } else {
        snprintf(buf1, sizeof(buf1), "Temp:%-5.1f %-6s", temperature, modeLabel.c_str());
    }

    lcd.setCursor(0, 0);
    lcd.print(buf0);
    lcd.setCursor(0, 1);
    lcd.print(buf1);
}

//--------------------------------------------------
// Main display update — call on every loop pass
//
// Handles:
//   • Interrupt expiry → clear + return to home
//   • Home page refresh (every 100ms when idle)
//--------------------------------------------------
void updateDisplay()
{
    unsigned long now = millis();
    static unsigned long lastHomeRefresh = 0;

    // Interrupt expired → return to home page
    if (interruptActive && now >= interruptEndTime)
    {
        interruptActive = false;
        lcd.clear();
        showHomePage();
        lastHomeRefresh = now;
        return;
    }

    // Refresh home page every 100ms when no interrupt is active
    if (!interruptActive && now - lastHomeRefresh >= 100)
    {
        lastHomeRefresh = now;
        showHomePage();
    }
    // If interrupt is active, do NOT overwrite it
}

//--------------------------------------------------
// Button: press to show system status for 2 seconds
//--------------------------------------------------
void checkDisplayButton()
{
    static bool prevBtnState = HIGH;
    bool btnState = digitalRead(PAGE_BUTTON_PIN);
    unsigned long now = millis();

    if (btnState == LOW && prevBtnState == HIGH)
    {
        if (now - lastPageSwitch > 250) // 250ms debounce
        {
            lastPageSwitch = now;
            char line0[17], line1[17];
            snprintf(line0, sizeof(line0), "Mode: %-10s", systemMode.c_str());
            snprintf(line1, sizeof(line1), "L1:%-3s  L2:%-3s   ",
                     light1State ? "ON" : "OFF",
                     light2State ? "ON" : "OFF");
            showInterrupt(line0, line1, 2000);
        }
    }
    prevBtnState = btnState;
}

#endif
