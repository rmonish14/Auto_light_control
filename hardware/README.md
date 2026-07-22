# Hardware — Smart Poultry Automation System

This folder contains all the ESP32 Arduino firmware files.

## Files

| File | Purpose |
|---|---|
| `Poultry_Automation.ino.ino` | Main sketch (setup + loop) |
| `config.h` | Pin mappings, thresholds, constants |
| `sensors.h` | DS18B20 & LDR sensor drivers |
| `relays.h` | Relay control with telemetry tracking |
| `leds.h` | Indicator LED driver |
| `cloud.h` | WiFi, MQTT publish/subscribe |
| `persistence.h` | NVS read/write for runtime data |
| `display.h` | 16x2 LCD page rendering & interrupt system |

## Build & Upload

```bash
# Compile
arduino-cli compile --fqbn esp32:esp32:esp32 .

# Upload
arduino-cli upload -p COM4 --fqbn esp32:esp32:esp32 .
```

## Pin Summary

| GPIO | Device | Function |
|---|---|---|
| 18 | DS18B20 | Temperature (1-Wire) |
| 35 | LM393 LDR | Light detection (digital) |
| 26 | Relay IN1 | Light 1 control |
| 27 | Relay IN2 | Light 2 control |
| 21 | LCD SDA | I2C data |
| 22 | LCD SCL | I2C clock |
| 19 | Push button | LCD page button |
| 4 | LED | Light 1 status |
| 5 | LED | Light 2 status |
| 2 | LED | WiFi status |
