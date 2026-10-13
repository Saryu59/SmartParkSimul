# SmartPark — IoT-Based Smart Parking & Slot Management Backend

SmartPark is an architectural full-stack IoT smart parking system designed for a 6-slot physical testbed powered by an ESP32 microcontroller, optical infrared (IR) obstacle sensors, a high-performance Python FastAPI backend, PostgreSQL relational database, and real-time WebSockets.

---

## 1. System Architecture

```
Physical Layer:        IR Sensors (6 bays)  →  ESP32 Microcontroller (Wi-Fi)
                                                        │
Network / Ingestion:                                HTTP POST /api/v1/sensors/events
                                                    (Header: X-Device-Token)
                                                        │
Backend Platform:                               FastAPI + Pydantic Validation
                                                        │
Persistence & State:                            PostgreSQL + SQLAlchemy ORM (Alembic)
                                                        │
Real-Time Delivery:                             WebSocket Broadcasts (/ws/live)
                                                        │
Client Layer:                                   React Dashboard & Architectural Map
```

---

## 2. Technology Stack

* **Language**: Python 3.10+
* **Framework**: FastAPI (Async REST APIs + WebSockets)
* **ORM & Migrations**: SQLAlchemy 2.0 (Async) & Alembic
* **Databases Supported**:
  * **Production**: PostgreSQL via `asyncpg` / `psycopg2`
  * **Development / Testing**: SQLite via `aiosqlite`
* **Authentication**: JWT (JSON Web Tokens) + PBKDF2-HMAC-SHA256 (100,000 iterations)
* **Testing**: Pytest & HTTPX AsyncClient

---

## 3. Directory Layout

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── admin.py            # Facility metrics, audit log, expiry evaluation
│   │       ├── auth.py             # User registration, login, JWT profile
│   │       ├── checkin.py          # Gate QR code validation & check-in
│   │       ├── recommendations.py  # Rule-based slot ranking
│   │       ├── reservations.py     # Concurrency-safe booking & conflict checks
│   │       ├── router.py           # Combined API v1 router
│   │       ├── sensor.py           # Hardware ingestion & diagnostics
│   │       └── slots.py            # Slot state queries & maintenance toggles
│   ├── core/
│   │   ├── config.py           # Pydantic BaseSettings & environment variables
│   │   ├── dependencies.py     # Auth & hardware device token dependencies
│   │   └── security.py         # Password hashing & JWT generation/verification
│   ├── db/
│   │   ├── base.py             # DeclarativeBase model registry
│   │   ├── seed.py             # Initial 6-slot testbed & user fixture seeding
│   │   └── session.py          # Async engine & sessionmaker
│   ├── models/                 # SQLAlchemy ORM models
│   │   ├── audit_event.py
│   │   ├── reservation.py
│   │   ├── sensor_event.py
│   │   ├── slot.py
│   │   └── user.py
│   ├── schemas/                # Pydantic request/response schemas
│   │   ├── event.py
│   │   ├── recommendation.py
│   │   ├── reservation.py
│   │   ├── sensor.py
│   │   ├── slot.py
│   │   └── user.py
│   ├── services/               # Isolated domain business logic
│   │   ├── expiry_service.py
│   │   ├── recommendation_service.py
│   │   ├── reservation_service.py
│   │   ├── sensor_service.py
│   │   └── slot_service.py
│   ├── websocket/
│   │   └── manager.py          # WebSocket connection hub & live broadcaster
│   └── main.py                 # FastAPI application root, lifespan, CORS, /ws/live
├── alembic/                    # Database migration scripts
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│       └── 001_initial_schema.py
├── tests/                      # Pytest automated test suite
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_health.py
│   ├── test_reservations.py
│   ├── test_sensors.py
│   └── test_slots.py
├── .env.example
├── alembic.ini
└── requirements.txt
```

---

## 4. Hardware Pin Mapping & Protocol Specification

### Pin Assignment (ESP32 Development Board)
The testbed pairs 6 active-LOW Infrared Obstacle Sensors with dedicated ESP32 GPIO inputs:

| Slot ID | Zone | Name | Hardware Sensor ID | ESP32 GPIO Pin | Distance to Lobby | Priority Type |
|---|---|---|---|---|---|---|
| **A1** | Zone A | Slot A1 | `IR-OPTICAL-01` | **GPIO 21** | 10m | Accessible Priority |
| **A2** | Zone A | Slot A2 | `IR-OPTICAL-02` | **GPIO 22** | 14m | Standard |
| **A3** | Zone A | Slot A3 | `IR-OPTICAL-03` | **GPIO 23** | 18m | Standard |
| **B1** | Zone B | Slot B1 | `IR-OPTICAL-04` | **GPIO 25** | 20m | Standard |
| **B2** | Zone B | Slot B2 | `IR-OPTICAL-05` | **GPIO 26** | 24m | Standard |
| **B3** | Zone B | Slot B3 | `IR-OPTICAL-06` | **GPIO 27** | 28m | Standard |

### Detection Logic
* **Beam Interrupted (Car Present)**: Sensor output drops to **LOW (0)**.
* **Beam Clear (Vacant Stall)**: Sensor output stays **HIGH (1)** via internal/external pull-up.

---

## 5. ESP32 Ingestion API Protocol

### Endpoint
`POST http://<server-ip>:8000/api/v1/sensors/events`

### Headers
```http
Content-Type: application/json
X-Device-Token: esp32-hw-token-smartpark-node-01
```

### JSON Request Payload
```json
{
  "deviceId": "esp32-node-01",
  "slotId": "A1",
  "isOccupied": true,
  "rawReading": "LOW",
  "deviceTimestamp": "2026-10-12T14:30:00Z",
  "sequenceNumber": 1042,
  "batteryPercent": 98,
  "signalDbm": -52
}
```

### Response
```json
{
  "id": "sevt-4921f0082a1b",
  "deviceId": "esp32-node-01",
  "slotId": "A1",
  "isOccupied": true,
  "rawReading": "LOW",
  "sequenceNumber": 1042,
  "deviceTimestamp": "2026-10-12T14:30:00Z",
  "serverTimestamp": "2026-10-12T14:30:00.124Z",
  "validationResult": "PROCESSED"
}
```

---

## 6. Switching Operational Modes

Configured in `backend/.env`:

* **Demo Simulation Mode (`SENSOR_MODE="demo"`)**:
  * Development mode with simulated sensor triggers from the React UI.
  * Demo controls (`Park Car`, `Vacate`, `Disconnect`) are active.
* **Hardware Mode (`SENSOR_MODE="hardware"`)**:
  * Rejects simulated sensor triggers.
  * Only accepts authenticated sensor events from the registered ESP32 with valid `X-Device-Token`.

---

## 7. Setup & Run Instructions

### 1. Install Dependencies
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Database
Copy `.env.example` to `.env`:
* **For PostgreSQL**:
  ```env
  DATABASE_URL="postgresql+asyncpg://postgres:yourpassword@localhost:5432/smartpark"
  DATABASE_URL_SYNC="postgresql://postgres:yourpassword@localhost:5432/smartpark"
  ```
  Run migrations:
  ```bash
  alembic upgrade head
  ```
* **For SQLite (Default local development)**:
  ```env
  DATABASE_URL="sqlite+aiosqlite:///./smartpark.db"
  DATABASE_URL_SYNC="sqlite:///./smartpark.db"
  ```

### 3. Start the FastAPI Server
```powershell
uvicorn app.main:app --reload --port 8000
```
* **Interactive OpenAPI Swagger Docs**: `http://localhost:8000/docs`
* **Alternative ReDoc**: `http://localhost:8000/redoc`
* **Live WebSocket Feed**: `ws://localhost:8000/ws/live`

### 4. Run Automated Tests
```powershell
pytest
```
