from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.slot import ParkingSlot
from app.models.reservation import Reservation
from app.models.sensor_event import SensorEvent
from app.models.audit_event import AuditEvent
from app.services.slot_service import SlotService
from app.websocket.manager import ws_manager
from app.core.config import settings


def ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


class SensorService:
    @staticmethod
    async def process_sensor_event(
        db: AsyncSession,
        device_id: str,
        slot_id: str,
        is_occupied: bool,
        raw_reading: str = "LOW",
        device_timestamp: Optional[datetime] = None,
        sequence_number: Optional[int] = None,
        battery_percent: Optional[int] = None,
        signal_dbm: Optional[int] = None,
        is_simulated: bool = False,
    ) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        dev_time = device_timestamp or now

        # 1. Mode Enforcement
        if settings.SENSOR_MODE == "hardware" and is_simulated:
            raise PermissionError("Simulated sensor triggers are disabled when SENSOR_MODE=hardware.")

        # 2. Slot existence check
        slot = await db.get(ParkingSlot, slot_id)
        if not slot:
            raise ValueError(f"Unknown slot ID: {slot_id}. Must be one of A1-B3.")

        dev_time = ensure_utc(device_timestamp) or now
        last_trig = ensure_utc(slot.last_triggered_at)

        # 3. Check for stale / out-of-order readings
        if last_trig and dev_time < last_trig - timedelta(seconds=5):
            # Out-of-order reading ignored
            event_log = SensorEvent(
                device_id=device_id,
                slot_id=slot_id,
                is_occupied=is_occupied,
                raw_reading=raw_reading,
                sequence_number=sequence_number,
                device_timestamp=dev_time,
                server_timestamp=now,
                is_processed=False,
                validation_result="IGNORED_OUT_OF_ORDER",
            )
            db.add(event_log)
            await db.commit()
            return event_log.to_dict()

        # 4. Update physical slot state
        previous_occupancy = slot.is_occupied
        slot.is_occupied = is_occupied
        slot.last_triggered_at = dev_time
        slot.last_heartbeat = now
        slot.sensor_online = True
        if battery_percent is not None:
            slot.sensor_battery_percent = battery_percent
        if signal_dbm is not None:
            slot.sensor_signal_dbm = signal_dbm

        # 5. Record sensor event
        sensor_event = SensorEvent(
            device_id=device_id,
            slot_id=slot_id,
            is_occupied=is_occupied,
            raw_reading=raw_reading,
            sequence_number=sequence_number,
            device_timestamp=dev_time,
            server_timestamp=now,
            is_processed=True,
            validation_result="PROCESSED",
        )
        db.add(sensor_event)

        # 6. Check for Unreserved Occupancy or Arrival/Departure
        audit_event = None
        if is_occupied and not previous_occupancy:
            # Check for active reservation
            res_stmt = select(Reservation).where(
                and_(
                    Reservation.slot_id == slot_id,
                    Reservation.status.in_(["ACTIVE", "UPCOMING"]),
                )
            )
            res_res = await db.execute(res_stmt)
            active_res = res_res.scalars().first()

            if not active_res:
                audit_event = AuditEvent(
                    event_type="UNRESERVED_OCCUPANCY",
                    severity="ALERT",
                    slot_id=slot_id,
                    title="Unreserved Occupancy Alert",
                    description=f"Physical vehicle detected at Bay {slot_id} without an active booking.",
                    timestamp=now,
                )
            else:
                audit_event = AuditEvent(
                    event_type="SENSOR_OCCUPIED",
                    severity="INFO",
                    slot_id=slot_id,
                    title=f"Vehicle Detected at Bay {slot_id}",
                    description=f"IR obstacle sensor GPIO {slot.sensor_gpio_pin} triggered LOW for {active_res.id}.",
                    reservation_id=active_res.id,
                    timestamp=now,
                )
        elif not is_occupied and previous_occupancy:
            audit_event = AuditEvent(
                event_type="SENSOR_VACATED",
                severity="INFO",
                slot_id=slot_id,
                title=f"Bay {slot_id} Vacated",
                description=f"Optical IR beam clear at Bay {slot_id}.",
                timestamp=now,
            )

        if audit_event:
            db.add(audit_event)

        await db.commit()
        await db.refresh(sensor_event)

        # 7. Broadcast live update to WebSockets
        slots_data = await SlotService.get_all_slots_with_status(db)
        await ws_manager.broadcast_slots_update(slots_data)
        if audit_event:
            await ws_manager.broadcast_event(audit_event.to_dict())

        return sensor_event.to_dict()
