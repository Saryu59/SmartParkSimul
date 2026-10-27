import json
import random
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from app.models.reservation import Reservation
from app.models.slot import ParkingSlot
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


class ReservationService:
    @staticmethod
    def generate_reservation_id() -> str:
        num = random.randint(1000, 9999)
        return f"SP-{num}"

    @staticmethod
    async def get_reservations(
        db: AsyncSession,
        user_id: Optional[str] = None,
        slot_id: Optional[str] = None,
        status: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        stmt = select(Reservation).order_by(Reservation.start_time.desc())
        conditions = []
        if user_id:
            conditions.append(Reservation.user_id == user_id)
        if slot_id:
            conditions.append(Reservation.slot_id == slot_id)
        if status and status != "ALL":
            conditions.append(Reservation.status == status)

        if conditions:
            stmt = stmt.where(and_(*conditions))

        result = await db.execute(stmt)
        reservations = result.scalars().all()
        return [r.to_dict() for r in reservations]

    @staticmethod
    async def get_reservation_by_id(db: AsyncSession, reservation_id: str) -> Optional[Reservation]:
        stmt = select(Reservation).where(Reservation.id == reservation_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def create_reservation(
        db: AsyncSession,
        slot_id: str,
        user_id: str,
        user_name: str,
        user_email: str,
        license_plate: str,
        start_time: datetime,
        end_time: datetime,
    ) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        start_time = ensure_utc(start_time)
        end_time = ensure_utc(end_time)

        # 1. Basic time interval validation
        if end_time <= start_time:
            raise ValueError("End time must be after start time.")

        # Allow 2 minutes grace for slight clock discrepancies
        if start_time < now - timedelta(minutes=2):
            raise ValueError("Start time cannot be in the past.")

        # 2. Verify slot exists and is eligible
        slot = await db.get(ParkingSlot, slot_id)
        if not slot:
            raise ValueError(f"Parking slot {slot_id} does not exist.")
        if slot.is_maintenance:
            raise ValueError(f"Slot {slot_id} is currently out of service for maintenance.")
        if not slot.sensor_online:
            raise ValueError(f"Slot {slot_id} sensor is offline; cannot verify availability.")

        # 3. Concurrency-safe Slot Conflict Check
        # Overlap condition: existing.start_time < new.end_time AND existing.end_time > new.start_time
        overlap_stmt = select(Reservation).where(
            and_(
                Reservation.slot_id == slot_id,
                Reservation.status.in_(["UPCOMING", "ACTIVE"]),
                Reservation.start_time < end_time,
                Reservation.end_time > start_time,
            )
        )
        overlap_result = await db.execute(overlap_stmt)
        conflicting = overlap_result.scalars().first()
        if conflicting:
            s_time = conflicting.start_time.strftime("%H:%M")
            e_time = conflicting.end_time.strftime("%H:%M")
            raise ValueError(f"Slot {slot_id} already has a confirmed booking ({conflicting.id}) from {s_time} to {e_time}.")

        # 4. Single Driver / Single Vehicle Concurrency Rule
        driver_overlap_stmt = select(Reservation).where(
            and_(
                or_(
                    Reservation.user_id == user_id,
                    func.upper(Reservation.license_plate) == license_plate.strip().upper(),
                ),
                Reservation.status.in_(["UPCOMING", "ACTIVE"]),
                or_(
                    Reservation.status == "ACTIVE",
                    and_(
                        Reservation.start_time < end_time,
                        Reservation.end_time > start_time,
                    )
                )
            )
        )
        driver_result = await db.execute(driver_overlap_stmt)
        driver_conflict = driver_result.scalars().first()
        if driver_conflict:
            raise ValueError(f"Driver/Vehicle {license_plate} already holds Bay {driver_conflict.slot_id} ({driver_conflict.id}) during this window.")

        # 5. Create and persist reservation
        res_id = ReservationService.generate_reservation_id()
        qr_payload = json.dumps({
            "reservationId": res_id,
            "slotId": slot_id,
            "licensePlate": license_plate.strip().upper(),
            "validFrom": start_time.isoformat(),
            "validTo": end_time.isoformat(),
        })

        new_res = Reservation(
            id=res_id,
            slot_id=slot_id,
            user_id=user_id,
            user_name=user_name,
            user_email=user_email,
            license_plate=license_plate.strip().upper(),
            start_time=start_time,
            end_time=end_time,
            status="UPCOMING",
            checked_in=False,
            grace_period_minutes=settings.DEFAULT_GRACE_PERIOD_MINUTES,
            qr_code_payload=qr_payload,
            created_at=now,
        )
        db.add(new_res)

        # Audit event
        event = AuditEvent(
            event_type="RESERVATION_CREATED",
            severity="INFO",
            slot_id=slot_id,
            title="Reservation Confirmed",
            description=f"Reservation {res_id} booked for Slot {slot_id} by {user_name}.",
            user_id=user_id,
            reservation_id=res_id,
            timestamp=now,
        )
        db.add(event)

        await db.commit()
        await db.refresh(new_res)

        # Broadcast live updates
        slots_data = await SlotService.get_all_slots_with_status(db)
        reservations_data = await ReservationService.get_reservations(db)
        await ws_manager.broadcast_slots_update(slots_data)
        await ws_manager.broadcast_reservations_update(reservations_data)
        await ws_manager.broadcast_event(event.to_dict())

        return new_res.to_dict()

    @staticmethod
    async def cancel_reservation(db: AsyncSession, reservation_id: str, requesting_user_id: Optional[str] = None, is_admin: bool = False) -> Dict[str, Any]:
        res = await ReservationService.get_reservation_by_id(db, reservation_id)
        if not res:
            raise ValueError(f"Reservation {reservation_id} not found.")

        if not is_admin and requesting_user_id and res.user_id != requesting_user_id:
            raise PermissionError("You do not have clearance to cancel this booking.")

        if res.status not in ["UPCOMING", "ACTIVE"]:
            raise ValueError(f"Cannot cancel booking in status '{res.status}'.")

        res.status = "CANCELLED"
        res.updated_at = datetime.now(timezone.utc)

        event = AuditEvent(
            event_type="RESERVATION_CANCELLED",
            severity="WARNING",
            slot_id=res.slot_id,
            title="Reservation Cancelled",
            description=f"Reservation {res.id} for Slot {res.slot_id} was cancelled.",
            user_id=res.user_id,
            reservation_id=res.id,
            timestamp=datetime.now(timezone.utc),
        )
        db.add(event)
        await db.commit()

        slots_data = await SlotService.get_all_slots_with_status(db)
        reservations_data = await ReservationService.get_reservations(db)
        await ws_manager.broadcast_slots_update(slots_data)
        await ws_manager.broadcast_reservations_update(reservations_data)
        await ws_manager.broadcast_event(event.to_dict())

        return res.to_dict()

    @staticmethod
    async def check_in(db: AsyncSession, code: str, requesting_user_id: Optional[str] = None, is_admin: bool = False) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        clean_code = code.strip().upper()

        # Match by ID or parse QR JSON
        res = await db.get(Reservation, clean_code)
        if not res:
            # Try to match QR code payload
            stmt = select(Reservation).where(Reservation.qr_code_payload.like(f"%{clean_code}%"))
            result = await db.execute(stmt)
            res = result.scalars().first()

        if not res:
            raise ValueError(f"Invalid reference code: '{code}'. No active booking matched.")

        if res.status == "ACTIVE" and res.checked_in:
            raise ValueError(f"Reservation {res.id} has already been checked in.")

        if res.status in ["CANCELLED", "EXPIRED", "COMPLETED"]:
            raise ValueError(f"Cannot check in: reservation {res.id} is already {res.status.lower()}.")

        # Arrival window check: allow check-in at any time once booked until end_time
        res_end = ensure_utc(res.end_time)
        if now > res_end:
            raise ValueError("Reservation booking window has expired.")

        res.checked_in = True
        res.checked_in_at = now
        res.status = "ACTIVE"
        res.updated_at = now

        event = AuditEvent(
            event_type="CHECK_IN_SUCCESS",
            severity="SUCCESS",
            slot_id=res.slot_id,
            title="QR Check-in Verified",
            description=f"Reservation {res.id} checked in at Entry Gate for Bay {res.slot_id}.",
            user_id=res.user_id,
            reservation_id=res.id,
            timestamp=now,
        )
        db.add(event)
        await db.commit()

        slots_data = await SlotService.get_all_slots_with_status(db)
        reservations_data = await ReservationService.get_reservations(db)
        await ws_manager.broadcast_slots_update(slots_data)
        await ws_manager.broadcast_reservations_update(reservations_data)
        await ws_manager.broadcast_event(event.to_dict())

        return res.to_dict()

    @staticmethod
    async def check_out(db: AsyncSession, reservation_id: str, requesting_user_id: Optional[str] = None, is_admin: bool = False) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        res = await ReservationService.get_reservation_by_id(db, reservation_id)
        if not res:
            raise ValueError(f"Reservation {reservation_id} not found.")

        if not is_admin and requesting_user_id and res.user_id != requesting_user_id:
            raise PermissionError("You can only check out your own vehicle session.")

        res.status = "COMPLETED"
        res.checked_out_at = now
        res.updated_at = now

        event = AuditEvent(
            event_type="CHECK_OUT_SUCCESS",
            severity="INFO",
            slot_id=res.slot_id,
            title="Vehicle Check-out Completed",
            description=f"Vehicle {res.license_plate} exited. Slot {res.slot_id} barrier gate opened.",
            user_id=res.user_id,
            reservation_id=res.id,
            timestamp=now,
        )
        db.add(event)
        await db.commit()

        slots_data = await SlotService.get_all_slots_with_status(db)
        reservations_data = await ReservationService.get_reservations(db)
        await ws_manager.broadcast_slots_update(slots_data)
        await ws_manager.broadcast_reservations_update(reservations_data)
        await ws_manager.broadcast_event(event.to_dict())

        return res.to_dict()
