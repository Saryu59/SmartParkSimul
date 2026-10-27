from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from app.models.slot import ParkingSlot
from app.models.reservation import Reservation
from app.models.audit_event import AuditEvent
from app.websocket.manager import ws_manager


class SlotService:
    @staticmethod
    async def get_active_reservation_map(db: AsyncSession, reference_time: Optional[datetime] = None) -> Dict[str, str]:
        """
        Returns a mapping of slot_id -> active/upcoming reservation_id at reference_time.
        Auto-completes/expires any past-due reservations whose end_time has passed.
        """
        now = reference_time or datetime.now(timezone.utc)

        # 1. Clean up expired active / upcoming reservations whose end_time has passed
        expired_stmt = select(Reservation).where(
            and_(
                Reservation.status.in_(["ACTIVE", "UPCOMING"]),
                Reservation.end_time < now,
            )
        )
        expired_res = await db.execute(expired_stmt)
        expired_list = expired_res.scalars().all()
        if expired_list:
            for r in expired_list:
                if r.status == "ACTIVE":
                    r.status = "COMPLETED"
                    r.checked_out_at = r.checked_out_at or now
                else:
                    r.status = "EXPIRED"
                r.updated_at = now
            await db.commit()

        # 2. Get active bookings that are currently held or active right now
        stmt = select(Reservation).where(
            and_(
                Reservation.status.in_(["ACTIVE", "UPCOMING"]),
                Reservation.end_time >= now,
            )
        )
        result = await db.execute(stmt)
        active_res = result.scalars().all()
        return {r.slot_id: r.id for r in active_res}

    @staticmethod
    async def get_all_slots_with_status(db: AsyncSession, reference_time: Optional[datetime] = None) -> List[Dict[str, Any]]:
        stmt = select(ParkingSlot).order_by(ParkingSlot.id.asc())
        result = await db.execute(stmt)
        slots = result.scalars().all()

        active_map = await SlotService.get_active_reservation_map(db, reference_time)
        return [slot.to_dict(active_map.get(slot.id)) for slot in slots]

    @staticmethod
    async def get_slot_by_id(db: AsyncSession, slot_id: str, reference_time: Optional[datetime] = None) -> Optional[Dict[str, Any]]:
        stmt = select(ParkingSlot).where(ParkingSlot.id == slot_id)
        result = await db.execute(stmt)
        slot = result.scalar_one_or_none()
        if not slot:
            return None

        active_map = await SlotService.get_active_reservation_map(db, reference_time)
        return slot.to_dict(active_map.get(slot.id))

    @staticmethod
    async def toggle_maintenance(db: AsyncSession, slot_id: str, is_maintenance: Optional[bool] = None) -> Dict[str, Any]:
        stmt = select(ParkingSlot).where(ParkingSlot.id == slot_id)
        result = await db.execute(stmt)
        slot = result.scalar_one_or_none()
        if not slot:
            raise ValueError(f"Parking slot {slot_id} not found.")

        slot.is_maintenance = not slot.is_maintenance if is_maintenance is None else is_maintenance
        slot.updated_at = datetime.now(timezone.utc)

        # Audit log
        event = AuditEvent(
            event_type="SLOT_MAINTENANCE_TOGGLED",
            severity="WARNING" if slot.is_maintenance else "INFO",
            slot_id=slot.id,
            title=f"Slot {slot.id} Maintenance {'Enabled' if slot.is_maintenance else 'Restored'}",
            description=f"Slot {slot.id} operational state set to {'Out of Service' if slot.is_maintenance else 'Active'}.",
            timestamp=datetime.now(timezone.utc),
        )
        db.add(event)
        await db.commit()

        slots_data = await SlotService.get_all_slots_with_status(db)
        await ws_manager.broadcast_slots_update(slots_data)
        await ws_manager.broadcast_event(event.to_dict())

        return await SlotService.get_slot_by_id(db, slot_id)

    @staticmethod
    async def toggle_sensor_online(db: AsyncSession, slot_id: str, is_online: Optional[bool] = None) -> Dict[str, Any]:
        stmt = select(ParkingSlot).where(ParkingSlot.id == slot_id)
        result = await db.execute(stmt)
        slot = result.scalar_one_or_none()
        if not slot:
            raise ValueError(f"Parking slot {slot_id} not found.")

        slot.sensor_online = not slot.sensor_online if is_online is None else is_online
        slot.last_heartbeat = datetime.now(timezone.utc)
        slot.updated_at = datetime.now(timezone.utc)

        event = AuditEvent(
            event_type="SENSOR_HEALTH_CHANGED",
            severity="ALERT" if not slot.sensor_online else "SUCCESS",
            slot_id=slot.id,
            title=f"Sensor for {slot.id} {'Offline' if not slot.sensor_online else 'Online'}",
            description=f"Node {slot.sensor_id} Wi-Fi heartbeat {'disconnected' if not slot.sensor_online else 'reconnected'}.",
            timestamp=datetime.now(timezone.utc),
        )
        db.add(event)
        await db.commit()

        slots_data = await SlotService.get_all_slots_with_status(db)
        await ws_manager.broadcast_slots_update(slots_data)
        await ws_manager.broadcast_event(event.to_dict())

        return await SlotService.get_slot_by_id(db, slot_id)
