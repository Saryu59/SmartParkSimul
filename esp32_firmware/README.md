# SmartPark ESP32 Hardware Integration Guide

This directory contains the firmware code for interfacing the physical parking layout with the SmartPark cloud platform.

## Hardware Specifications
- **Microcontroller**: ESP32 DevKit V1 (30-pin or 38-pin)
- **Sensors**: 6x FC-51 / TCRT5000 Active-LOW Optical IR Obstacle Sensors
- **Actuator**: 1x TowerPro SG90 9g Micro Servo (Entrance Barrier)
- **Power**: 5V external power supply or USB power with common ground

## Pin Assignment Summary
| Parking Bay | Sensor Pin | ESP32 GPIO | Function |
|---|---|---|---|
| **A1** | S1 OUT | **GPIO 13** | Slot A1 Occupancy |
| **A2** | S2 OUT | **GPIO 14** | Slot A2 Occupancy |
| **A3** | S3 OUT | **GPIO 16** | Slot A3 Occupancy |
| **B1** | S4 OUT | **GPIO 17** | Slot B1 Occupancy |
| **B2** | S5 OUT | **GPIO 18** | Slot B2 Occupancy |
| **B3** | S6 OUT | **GPIO 19** | Slot B3 Occupancy |
| **Entrance Barrier**| PWM Yellow/Orange | **GPIO 25** | Servo Motor Gate |

## Arduino IDE Setup
1. In Arduino IDE, open **Tools > Manage Libraries...**
2. Search and install:
   - **`ESP32Servo`** by Kevin Harrington / John K. Bennett
3. Select Board: **ESP32 Dev Module**
4. Edit your WiFi SSID & Password in `smartpark_esp32.ino`.
5. Upload to your ESP32 board!
