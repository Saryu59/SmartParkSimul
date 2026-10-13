from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.models.user import User
from app.models.slot import ParkingSlot
from app.models.reservation import Reservation
from app.models.audit_event import AuditEvent
from app.models.sensor_event import SensorEvent
from app.core.security import hash_password


HARDWARE_PINS = {
    "A1": {"pin": 21, "sensor_name": "IR-OPTICAL-01", "is_accessible": True, "zone": "A", "distance": 10},
    "A2": {"pin": 22, "sensor_name": "IR-OPTICAL-02", "is_accessible": False, "zone": "A", "distance": 14},
    "A3": {"pin": 23, "sensor_name": "IR-OPTICAL-03", "is_accessible": False, "zone": "A", "distance": 18},
    "B1": {"pin": 25, "sensor_name": "IR-OPTICAL-04", "is_accessible": False, "zone": "B", "distance": 20},
    "B2": {"pin": 26, "sensor_name": "IR-OPTICAL-05", "is_accessible": False, "zone": "B", "distance": 24},
    "B3": {"pin": 27, "sensor_name": "IR-OPTICAL-06", "is_accessible": False, "zone": "B", "distance": 28},
}


async def seed_database(db: AsyncSession, wipe: bool = False):
    now = datetime.now(timezone.utc)

    if wipe:
        await db.execute(delete(SensorEvent))
        await db.execute(delete(AuditEvent))
        await db.execute(delete(Reservation))
        await db.execute(delete(ParkingSlot))
        await db.execute(delete(User))
        await db.commit()

    # 1. Seed Initial Users
    admin_stmt = select(User).where(User.email == "admin@smartpark.demo")
    admin_res = await db.execute(admin_stmt)
    admin_user = admin_res.scalar_one_or_none()

    if not admin_user:
        admin_user = User(
            id="usr-admin",
            name="Sarah Jenkins",
            email="admin@smartpark.demo",
            password_hash=hash_password("demo1234"),
            role="ADMIN",
            license_plate="ADM-001-HQ",
            department="Smart Facilities & Security",
            phone="+1 (555) 019-9000",
            created_at=now - timedelta(days=30),
        )
        db.add(admin_user)

    driver_stmt = select(User).where(User.email == "alex@smartpark.demo")
    driver_res = await db.execute(driver_stmt)
    driver_user = driver_res.scalar_one_or_none()

    if not driver_user:
        driver_user = User(
            id="usr-1",
            name="Alex Rivera",
            email="alex@smartpark.demo",
            password_hash=hash_password("demo1234"),
            role="USER",
            license_plate="EV-882-NY",
            phone="+1 (555) 019-2834",
            preferred_zone="A",
            created_at=now - timedelta(days=15),
        )
        db.add(driver_user)

    # 2. Seed 6 Physical Parking Slots
    for slot_id, config in HARDWARE_PINS.items():
        slot_stmt = select(ParkingSlot).where(ParkingSlot.id == slot_id)
        slot_res = await db.execute(slot_stmt)
        existing_slot = slot_res.scalar_one_or_none()

        # Initial occupancy states: B1 and B3 start occupied for demonstration
        is_occ = slot_id in ["B1", "B3"]

        if not existing_slot:
            new_slot = ParkingSlot(
                id=slot_id,
                zone=config["zone"],
                name=f"Slot {slot_id}",
                is_accessible=config["is_accessible"],
                distance_to_entrance_meters=config["distance"],
                is_occupied=is_occ,
                is_maintenance=False,
                sensor_id=config["sensor_name"],
                sensor_gpio_pin=config["pin"],
                sensor_online=True,
                sensor_battery_percent=95 if slot_id != "B2" else 86,
                sensor_signal_dbm=-55 if slot_id != "A3" else -62,
                last_heartbeat=now - timedelta(minutes=1),
                last_triggered_at=now - timedelta(minutes=30) if is_occ else None,
                created_at=now,
            )
            db.add(new_slot)

    # 3. Seed Initial Reservations
    res_stmt = select(Reservation).where(Reservation.id == "RES-8041")
    res_check = await db.execute(res_stmt)
    if not res_check.scalar_one_or_none():
        res1 = Reservation(
            id="RES-8041",
            slot_id="A3",
            user_id="usr-1",
            user_name="Alex Rivera",
            user_email="alex@smartpark.demo",
            license_plate="EV-882-NY",
            start_time=now + timedelta(minutes=15),
            end_time=now + timedelta(minutes=75),
            status="UPCOMING",
            checked_in=False,
            grace_period_minutes=10,
            qr_code_payload='{"reservationId":"RES-8041","slotId":"A3","licensePlate":"EV-882-NY"}',
            created_at=now - timedelta(minutes=30),
        )
        db.add(res1)

    res2_stmt = select(Reservation).where(Reservation.id == "RES-7890")
    res2_check = await db.execute(res2_stmt)
    if not res2_check.scalar_one_or_none():
        res2 = Reservation(
            id="RES-7890",
            slot_id="B1",
            user_id="usr-admin",
            user_name="Sarah Jenkins",
            user_email="admin@smartpark.demo",
            license_plate="ADM-001-HQ",
            start_time=now - timedelta(minutes=35),
            end_time=now + timedelta(minutes=55),
            status="ACTIVE",
            checked_in=True,
            checked_in_at=now - timedelta(minutes=30),
            grace_period_minutes=10,
            qr_code_payload='{"reservationId":"RES-7890","slotId":"B1","licensePlate":"ADM-001-HQ"}',
            created_at=now - timedelta(minutes=60),
        )
        db.add(res2)

    # 4. Seed Initial Audit Events
    evt_stmt = select(AuditEvent).where(AuditEvent.id == "evt-init-01")
    evt_check = await db.execute(evt_stmt)
    if not evt_check.scalar_one_or_none():
        evt1 = AuditEvent(
            id="evt-init-01",
            event_type="UNRESERVED_OCCUPANCY",
            severity="ALERT",
            slot_id="B3",
            title="Unreserved Occupancy Alert",
            description="Physical vehicle detected at Bay B3 without a matching reservation.",
            timestamp=now - timedelta(minutes=14),
        )
        evt2 = AuditEvent(
            id="evt-init-02",
            event_type="CHECK_IN_SUCCESS",
            severity="SUCCESS",
            slot_id="B1",
            title="QR Check-in Verified",
            description="Reservation RES-7890 checked in at Entry Gate for Bay B1.",
            reservation_id="RES-7890",
            timestamp=now - timedelta(minutes=30),
        )
        db.add(evt1)
        db.add(evt2)

    await db.commit()
