# SmartPark — IoT-Based Smart Parking and Slot Management System

[![Frontend Phase](https://img.shields.io/badge/Phase_1-Frontend_Prototype_Complete-emerald.svg)](#)
[![Stack](https://img.shields.io/badge/Tech_Stack-React_18_%7C_Vite_%7C_TailwindCSS_%7C_Recharts-indigo.svg)](#)
[![Hardware Specs](https://img.shields.io/badge/Hardware-ESP32_%7C_6x_FC--51_IR_Sensors-blue.svg)](#)
[![Demo Mode](https://img.shields.io/badge/Architecture-Decoupled_Service_Layer-amber.svg)](#)

SmartPark is an IoT-coupled smart parking SaaS and physical slot management system built for small parking testbeds and commercial facilities (maximum 6 parking slots for the physical prototype: A1, A2, A3, B1, B2, B3).

---

## 1. Project Purpose & System Overview

Smart parking systems frequently suffer from brittle coupling between raw hardware sensor readings and reservation state machines. SmartPark decouples **physical vehicle occupancy** (optical beam interruption) from **logical reservation holds**, preventing common edge cases such as ghost vacancies, premature expirations during physical blockage, and unreserved parking abuse.

### Key Capabilities
- **Live Parking Lot Visualization**: Interactive layout of 6 monitored parking bays across Zone A and Zone B with live LED status indicators and telemetry data.
- **Independent State Machine**: Distinguishes between `AVAILABLE`, `RESERVED`, `OCCUPIED`, `OFFLINE`, and `OUT_OF_SERVICE`. Physical vehicle presence never silently overwrites reservation history, and vice versa.
- **Rule-Based Recommendation Engine**: Transparent slot ranking based on walking distance to main lobby entrance, designated accessibility requirements, and zone preference.
- **Reservation & Overlap Prevention**: Strict interval conflict checks and unique reservation reference code generation (e.g., `SP-XXXXX`).
- **Configurable No-Show Grace Period**: Default 10-minute grace timer. Before a slot is released upon no-show expiry, the system verifies physical sensor occupancy. If a vehicle is present, the slot remains `OCCUPIED` and triggers an unreserved occupancy alert.
- **QR Code Entry Pass & Scanner**: Generates scannable QR passes with an interactive camera simulation and manual reference code fallback.
- **Admin Operations Console**: Recharts hourly occupancy trends, zone utilization, sensor telemetry health (battery, RSSI, GPIO pin, heartbeat), unreserved occupancy alarms, and maintenance overrides.
- **Hardware Simulation Test Harness**: Integrated drawer with simulated clock time travel (+5m, +10m, +30m, +1h) and ESP32 GPIO obstacle toggles.

---

## 2. Project Folder Structure

```
SmartPark/
├── .env                     # Local environment configuration
├── .env.example             # Configuration reference for future backend integration
├── index.html               # Vite HTML entrypoint with Inter typography
├── package.json             # React 18, Tailwind, Lucide, Recharts, QRCode dependencies
├── postcss.config.js        # PostCSS configuration
├── tailwind.config.js       # Custom design tokens, status palettes, typography
├── vite.config.js           # Vite development and build configuration
├── src/
│   ├── constants/           # Authoritative system enums and metadata
│   │   ├── slots.js         # Slot statuses, hardware GPIO pin map (21, 22, 23, 25, 26, 27)
│   │   ├── reservations.js  # Reservation statuses and grace period constants
│   │   └── events.js        # Audit log event types and severity levels
│   ├── contexts/            # React state contexts
│   │   ├── AuthContext.jsx         # User & Admin roles, guest mode, demo authentication
│   │   ├── ParkingContext.jsx      # Live slots, reservations, stats, clock simulation
│   │   └── NotificationContext.jsx # Toast notifications system
│   ├── services/            # Decoupled service layer boundary
│   │   ├── config.js               # Demo mode flag (VITE_DEMO_MODE) and API endpoints
│   │   ├── clockService.js         # Controllable simulated clock for time travel testing
│   │   ├── slotsService.js         # Slot queries, maintenance, and hardware simulation
│   │   ├── reservationsService.js  # Booking validation, overlap checks, cancellations
│   │   ├── authService.js          # Authentication service with role switching
│   │   ├── analyticsService.js     # Dynamically calculated statistics and chart curves
│   │   ├── api/                    # Real FastAPI HTTP & WebSocket client (used when demo=false)
│   │   │   └── apiClient.js
│   │   └── mock/                   # Mock storage and initial prototype seed data
│   │       ├── initialData.js      # Seed slots (A1-B3), sample drivers, events
│   │       └── mockStore.js        # Reactive event-driven store with localStorage persistence
│   ├── components/          # Reusable UI components
│   │   ├── common/
│   │   │   ├── DemoBanner.jsx          # Persistent top demo indicator
│   │   │   ├── DemoControlsDrawer.jsx  # Interactive hardware & clock simulator
│   │   │   ├── Layout.jsx              # Main application shell with responsive sidebar
│   │   │   ├── Modal.jsx               # Accessible dialog component
│   │   │   ├── Navbar.jsx              # Top bar with role switcher and ESP32 status
│   │   │   ├── Sidebar.jsx             # SaaS navigation menu
│   │   │   ├── StatusBadge.jsx         # Accessible status tags
│   │   │   └── Toast.jsx               # Toast notifications
│   │   ├── parking/
│   │   │   ├── ParkingGrid.jsx         # 6-bay visual parking lot layout
│   │   │   ├── ParkingLegend.jsx       # Real-time status counts
│   │   │   ├── SlotDetailModal.jsx     # Deep telemetry & booking eligibility inspector
│   │   │   └── SlotVisual.jsx          # Individual parking bay graphic with LED light
│   │   ├── recommendations/
│   │   │   ├── PreferencesForm.jsx     # Zone, distance, and accessibility filters
│   │   │   └── RecommendationCard.jsx  # Ranked slot card with transparent reasons
│   │   ├── reservations/
│   │   │   ├── BookingForm.jsx         # Booking form with conflict validation
│   │   │   ├── QRCodeModal.jsx         # Printable/scannable QR pass modal
│   │   │   └── ReservationCard.jsx     # Reservation card with countdown and cancellation
│   │   └── admin/
│   │       ├── SensorHealthCard.jsx    # ESP32 pin diagnostics and RSSI monitor
│   │       └── UnreservedAlertBanner.jsx # Alarms for occupancy without reservations
│   ├── pages/               # Route views
│   │   ├── LandingPage.jsx         # Marketing landing page & live lot preview
│   │   ├── LoginPage.jsx           # Demo authentication with quick fill
│   │   ├── RegisterPage.jsx        # User & Admin account creation
│   │   ├── UserDashboard.jsx       # Driver metrics, upcoming pass, recent activity
│   │   ├── LiveParkingMap.jsx      # Filterable live parking map
│   │   ├── RecommendationsPage.jsx # Smart slot recommendation ranking
│   │   ├── BookingPage.jsx         # Slot scheduling & lock interface
│   │   ├── MyReservationsPage.jsx  # User booking history and QR passes
│   │   ├── CheckInPage.jsx         # Entry gate optical scanner & checkout station
│   │   ├── AdminDashboard.jsx      # Operations center with Recharts telemetry
│   │   ├── SettingsPage.jsx        # Profile, grace period rules, export logs
│   │   └── NotFoundPage.jsx        # 404 handler
│   ├── utils/
│   │   ├── dateUtils.js            # Relative timers and date formatters
│   │   ├── formatters.js           # Reservation code generation
│   │   └── recommendationUtils.js  # Heuristic scoring engine
│   ├── App.jsx              # Route definition and provider hierarchy
│   ├── main.jsx             # React DOM root
│   └── index.css            # Tailwind directives and styling
```

---

## 3. Required Software & Prerequisites

- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later
- Modern web browser (Chrome, Firefox, Safari, Edge)

---

## 4. Installation & Run Commands

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build for Production
```bash
npm run build
```

### 4. Preview the Production Build
```bash
npm run preview
```

---

## 5. Demo Mode & Simulation Controls

The project includes an **interactive demo control drawer** that enables thorough testing of all state transitions without needing real physical hardware:

1. Click **"Simulate Hardware"** in the top amber demo banner (or open from the navigation drawer).
2. **IR Sensors Tab**:
   - Click **"Simulate Car Arrival"** or **"Simulate Exit"** on any of the 6 slots (A1-B3).
   - Simulates physical ESP32 GPIO pin state changes (active-LOW obstacle reflection).
   - Test **Unreserved Occupancy Alerts**: Place a car in slot `B3` (or any vacant slot) without a reservation to immediately see the admin alert banner trigger.
   - Click the Wi-Fi icon to test **Sensor Offline** scenarios (slot marks `OFFLINE` and booking is safely disabled).
   - Click the wrench icon to toggle **Maintenance Mode** (`OUT_OF_SERVICE`).
3. **Simulated Clock Tab**:
   - Fast forward simulated time (+5m, +10m, +30m, +1h) to test:
     - Upcoming reservation countdowns.
     - **10-minute no-show grace period expiration**.
     - Physical occupancy check upon expiration: If a car is present, the slot remains occupied rather than resetting to available.
4. **Roles & Reset Tab**:
   - Switch between **Driver (Alex Rivera)**, **Administrator (Sarah Jenkins)**, and **Guest Explorer**.
   - Click **"Reset All Demo Data"** to restore factory defaults at any time.

---

## 6. Implemented Features vs. Planned Phases

### Currently Implemented (Phase 1 Frontend Prototype)
- [x] Full React 18 SPA with responsive Tailwind CSS design system.
- [x] Complete 6-slot parking model with distinct states: `AVAILABLE`, `OCCUPIED`, `RESERVED`, `OFFLINE`, `OUT_OF_SERVICE`.
- [x] Strict separation between physical IR sensor state and reservation state.
- [x] Smart slot recommendation heuristic engine with transparent explanations.
- [x] Conflict-free booking engine with time window overlap validation.
- [x] Controllable simulated clock for fast-forwarding grace periods and no-show expirations.
- [x] QR code generator and interactive gate camera scanner simulation with manual fallback.
- [x] Admin console with Recharts hourly trends, zone analytics, and GPIO telemetry diagnostics.
- [x] Unreserved occupancy detection ("Occupied slot without a matching reservation — review required").
- [x] Strict adherence to sensor identity boundaries: no false claims that optical IR beams identify drivers or plates.
- [x] Decoupled service layer (`src/services/`) switchable via `VITE_DEMO_MODE`.

### Planned for Phase 2 (FastAPI & PostgreSQL Backend)
- [ ] FastAPI REST endpoints (`/api/v1/slots`, `/api/v1/reservations`, `/api/v1/auth`).
- [ ] PostgreSQL database with SQLAlchemy ORM and Alembic migrations.
- [ ] Real-time WebSockets (`/ws/live`) for push updates from backend to frontend.
- [ ] Cryptographic QR signature verification with HMAC/JWT validation at entry gates.
- [ ] Production JWT authentication with Argon2 password hashing.

### Planned for Phase 3 (ESP32 Firmware & Hardware Wiring)
- [ ] ESP32 FreeRTOS firmware in C++/Arduino framework.
- [ ] 6x FC-51 IR obstacle avoidance sensors connected to GPIO 21, 22, 23, 25, 26, 27.
- [ ] Wi-Fi and MQTT/HTTP client communicating sensor heartbeat and beam state transitions to FastAPI.
- [ ] Optional physical red/green slot LED indicators and entry barrier servo.

---

## 7. License & Attribution

Designed and architected as a prototype for smart campus and facility parking management. Built with modern full-stack web standards and clean software architecture principles.
