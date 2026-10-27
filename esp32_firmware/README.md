# SmartPark ESP32 Hardware Integration Guide (Sensors-Only)

This directory contains the firmware code for interfacing the physical parking layout with the SmartPark cloud platform.

## Hardware Specifications
- **Microcontroller**: ESP32 DevKit V1 (30-pin or 38-pin)
- **Sensors**: 6x FC-51 / TCRT5000 Active-LOW Optical IR Obstacle Sensors
- **Power**: 5V USB cable directly from PC or phone charger

## Pin Assignment Summary
| Parking Bay | Sensor Pin | ESP32 GPIO | Function |
|---|---|---|---|
| **A1** | S1 OUT | **GPIO 13 (D13)** | Slot A1 Occupancy |
| **A2** | S2 OUT | **GPIO 14 (D14)** | Slot A2 Occupancy |
| **A3** | S3 OUT | **GPIO 27 (D27)** | Slot A3 Occupancy |
| **B1** | S4 OUT | **GPIO 17 (TX2)** | Slot B1 Occupancy |
| **B2** | S5 OUT | **GPIO 18 (D18)** | Slot B2 Occupancy |
| **B3** | S6 OUT | **GPIO 19 (D19)** | Slot B3 Occupancy |
| **All Sensors** | VCC | **ESP32 3.3V** | Safe 3.3V power |
| **All Sensors** | GND | **ESP32 GND** | Common Ground |

## Setup Instructions
1. Open Arduino IDE.
2. Open [`smartpark_esp32/smartpark_esp32.ino`](smartpark_esp32/smartpark_esp32.ino).
3. Select Board: **ESP32 Dev Module**
4. Set your Wi-Fi name and password in `WIFI_SSID` and `WIFI_PASSWORD`.
5. Upload to your ESP32 board!
*(No extra libraries required)*
