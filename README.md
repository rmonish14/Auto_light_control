# PoultryCore IoT — Smart Poultry Automation

A comprehensive, state-of-the-art IoT automation system designed for poultry house environment management and cloud telemetry control.

This project is divided into two primary sections:
1. **`hardware`** — ESP32 Arduino firmware featuring real-time sensor processing, relay control, LCD menu logic, and NVS persistence.
2. **`web`** — Professional React dashboard utilizing Vite, MQTT WebSockets, and glassmorphic premium UI elements.

---

## Project Structure

```
Poultry_Automation.ino/
├── hardware/              # Arduino / ESP32 Core Files
│   ├── hardware.ino      # Main setup & execution loop
│   ├── config.h          # Pins, parameters, and credentials
│   ├── sensors.h         # Temperature (DS18B20) & Light (LDR) drivers
│   ├── relays.h          # Light1 & Light2 relay controls
│   ├── leds.h            # Status LED indicator driver
│   ├── cloud.h           # MQTT broker connection & publication
│   ├── persistence.h     # Non-volatile storage management (NVS)
│   └── display.h         # LCD menus & interrupt overlays
│
└── web/                   # React Web Dashboard (Vite)
    ├── index.html        # HTML Entry Point
    ├── vite.config.js    # Vite configurations
    ├── package.json      # Dependencies and dev tools
    └── src/
        ├── main.jsx      # React mounting
        ├── App.jsx       # Root control app & simulation engine
        ├── index.css     # Premium dark theme design tokens & animations
        ├── hooks/
        │   └── useMQTT.js # Custom MQTT connection Hook
        └── components/
            ├── Header.jsx          # Top bar with WiFi bars & last seen
            ├── TemperatureCard.jsx # Temp monitor with animated bar gauge
            ├── EnvironmentCard.jsx # Light status indicator
            ├── ModeSelector.jsx    # AUTO / MANUAL / SCHEDULE selectors
            ├── RelayCard.jsx       # Relays status & toggles
            ├── ChickAgeCard.jsx    # Growth phase tracker
            ├── MaintenanceCard.jsx # Relay cycles & bulb wear estimation
            └── EventLog.jsx        # Real-time event logging
```

---

## Setup & Quick Start

### ⚡ 1. Flashing Firmware (Hardware)
1. Open the [hardware.ino](file:///c:/Users/monis/Downloads/Poultry_Automation.ino/hardware/hardware.ino) sketch in Arduino IDE, or compile/upload using CLI:
   ```bash
   cd hardware
   arduino-cli compile --fqbn esp32:esp32:esp32 .
   arduino-cli upload -p COM4 --fqbn esp32:esp32:esp32 .
   ```
2. Check `config.h` to change your Wi-Fi SSID (`MONISH`) and Password (`12345678`).

### 🌐 2. Running Dashboard (Web)
1. Ensure Node.js is installed.
2. Open terminal in the `web` folder and run:
   ```bash
   cd web
   npm install
   npm run dev
   ```
3. Open `http://localhost:3000` in your web browser.
4. If the physical IoT board is offline, click **"Run Dashboard Simulator"** to interact with a high-fidelity live simulation.

---

## Wiring Diagram Summary

| ESP32 GPIO | Connected Device | Description / Pin |
|---|---|---|
| **GPIO 18** | DS18B20 | Temperature sensor DATA (requires 4.7kΩ pull-up to 3.3V) |
| **GPIO 35** | LM393 LDR | Light sensor D0 digital input |
| **GPIO 26** | 2-Ch Relay | IN1 (Light 1 Relay) |
| **GPIO 27** | 2-Ch Relay | IN2 (Light 2 Relay) |
| **GPIO 21** | I2C LCD | SDA |
| **GPIO 22** | I2C LCD | SCL |
| **GPIO 19** | Push Button | LCD page toggle input |
| **GPIO 4** | LED | Light 1 active status (requires 220Ω resistor) |
| **GPIO 5** | LED | Light 2 active status (requires 220Ω resistor) |
| **GPIO 2** | LED / Onboard | WiFi connection status |

---

## Design Highlights
- **Interrupt HUD Display** — LCD automatically displays temporary full-screen messages for LDR changes, critical alerts, and time syncs, returning instantly back to the temperature screen.
- **Glassmorphic Web Dashboard** — CSS visual elements with frosted backgrounds, glowing states, smooth gradients, and custom modern fonts.
- **Wear Management** — Local persistence records active light durations and relay click counts. The dashboard estimates wear and alerts you when maintenance or bulb replacements are recommended.
