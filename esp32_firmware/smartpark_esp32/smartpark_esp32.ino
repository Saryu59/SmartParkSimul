/*
 * SmartPark IoT ESP32 Firmware (Sensors-Only Version)
 * Hardware: ESP32 DevKit V1 + 6x IR Obstacle Sensors
 * 
 * Pin Mapping:
 *   Bay A1 (S1) -> GPIO 13 (D13)
 *   Bay A2 (S2) -> GPIO 14 (D14)
 *   Bay A3 (S3) -> GPIO 16 (RX2)
 *   Bay B1 (S4) -> GPIO 17 (TX2)
 *   Bay B2 (S5) -> GPIO 18 (D18)
 *   Bay B3 (S6) -> GPIO 19 (D19)
 */

#include <WiFi.h>
#include <HTTPClient.h>

// ================= USER CONFIGURATION =================
const char* WIFI_SSID     = "VNRVJIET_E";
const char* WIFI_PASSWORD = "vnrvjiet@123";

// Backend API endpoint on Render
const char* SERVER_URL    = "https://smartparksimul.onrender.com/api/v1/sensors/events";
const char* DEVICE_TOKEN  = "esp32-hw-token-smartpark-node-01";
const char* DEVICE_ID     = "esp32-node-01";

// ================= HARDWARE PIN DEFINITIONS =================
struct SlotPin {
  const char* slotId;
  int pin;
  bool lastOccupied;
  unsigned long lastChangeTime;
};

SlotPin slots[6] = {
  {"A1", 13, false, 0},
  {"A2", 14, false, 0},
  {"A3", 16, false, 0},
  {"B1", 17, false, 0},
  {"B2", 18, false, 0},
  {"B3", 19, false, 0}
};

// Debounce & heartbeat timings (in milliseconds)
const unsigned long DEBOUNCE_DELAY = 1000;      // 1.0s filter against IR flutter
const unsigned long HEARTBEAT_INTERVAL = 30000;   // 30s status ping
unsigned long lastHeartbeat = 0;
unsigned int sequenceNumber = 1;

void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected! IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi connection failed! Continuing to monitor sensors...");
  }
}

void sendSensorEvent(const char* slotId, bool isOccupied, const char* rawReading) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Skipping cloud transmission.");
    return;
  }

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Token", DEVICE_TOKEN);

  int rssi = WiFi.RSSI();

  // Construct JSON Payload
  String payload = "{";
  payload += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
  payload += "\"slotId\":\"" + String(slotId) + "\",";
  payload += "\"isOccupied\":" + String(isOccupied ? "true" : "false") + ",";
  payload += "\"rawReading\":\"" + String(rawReading) + "\",";
  payload += "\"sequenceNumber\":" + String(sequenceNumber++) + ",";
  payload += "\"signalDbm\":" + String(rssi);
  payload += "}";

  Serial.print("Posting Event for ");
  Serial.print(slotId);
  Serial.print(" -> ");
  Serial.println(payload);

  int httpResponseCode = http.POST(payload);
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("Server Response [");
    Serial.print(httpResponseCode);
    Serial.print("]: ");
    Serial.println(response);
  } else {
    Serial.print("HTTP Error code: ");
    Serial.println(httpResponseCode);
  }
  http.end();
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- SmartPark ESP32 Sensor Hub Initializing ---");

  // Configure IR sensor input pins with internal pull-up
  for (int i = 0; i < 6; i++) {
    pinMode(slots[i].pin, INPUT_PULLUP);
    // IR Obstacle Sensor: Active LOW (LOW when car detected, HIGH when clear)
    slots[i].lastOccupied = (digitalRead(slots[i].pin) == LOW);
  }

  connectWiFi();
  
  // Initial transmission of current states
  Serial.println("Broadcasting initial bay states to SmartPark backend...");
  for (int i = 0; i < 6; i++) {
    sendSensorEvent(slots[i].slotId, slots[i].lastOccupied, slots[i].lastOccupied ? "LOW" : "HIGH");
    delay(200);
  }
}

void loop() {
  unsigned long now = millis();

  // 1. Check WiFi Connection
  if (WiFi.status() != WL_CONNECTED) {
    if (now - lastHeartbeat > 10000) {
      connectWiFi();
      lastHeartbeat = now;
    }
  }

  // 2. Poll IR Sensors with Debounce
  for (int i = 0; i < 6; i++) {
    // Active LOW: LOW = obstacle/car detected, HIGH = beam clear
    bool currentReading = (digitalRead(slots[i].pin) == LOW);

    if (currentReading != slots[i].lastOccupied) {
      if (slots[i].lastChangeTime == 0) {
        slots[i].lastChangeTime = now;
      } else if (now - slots[i].lastChangeTime >= DEBOUNCE_DELAY) {
        slots[i].lastOccupied = currentReading;
        slots[i].lastChangeTime = 0;

        Serial.print("Bay [");
        Serial.print(slots[i].slotId);
        Serial.print("] changed state -> ");
        Serial.println(currentReading ? "OCCUPIED" : "VACANT");

        sendSensorEvent(slots[i].slotId, currentReading, currentReading ? "LOW" : "HIGH");
      }
    } else {
      slots[i].lastChangeTime = 0;
    }
  }

  // 3. Periodic Heartbeat (Every 30 seconds)
  if (now - lastHeartbeat >= HEARTBEAT_INTERVAL) {
    lastHeartbeat = now;
    Serial.println("Sending periodic sensor heartbeat...");
    for (int i = 0; i < 6; i++) {
      sendSensorEvent(slots[i].slotId, slots[i].lastOccupied, slots[i].lastOccupied ? "LOW" : "HIGH");
      delay(150);
    }
  }

  delay(50); // Small loop tick
}
