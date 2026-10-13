from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.reservation import Reservation
from app.models.audit_event import AuditEvent
from app.services.slot_service import SlotService
from app.websocket.manager import ws_manager


def ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


class ExpiryService:
    @staticmethod
    async def evaluate_expirations(db: AsyncSession, reference_time: Optional[datetime] = None) -> List[Dict[str, Any]]:
        now = reference_time or datetime.now(timezone.utc)

        # Find UPCOMING reservations where now > start_time + grace_period
        stmt = select(Reservation).where(
            and_(
                Reservation.status == "UPCOMING",
                Reservation.checked_in == False,
            )
        )
        result = await db.execute(stmt)
        upcoming = result.scalars().all()

        expired_list = []
        for res in upcoming:
            start_utc = ensure_utc(res.start_time)
            expiry_threshold = start_utc + timedelta(minutes=res.grace_period_minutes)
            if now > expiry_threshold:
                res.status = "EXPIRED"
                res.updated_at = now

                event = AuditEvent(
                    event_type="RESERVATION_EXPIRED",
                    severity="WARNING",
                    slot_id=res.slot_id,
                    title="Reservation Expired (No-Show)",
                    description=f"Reservation {res.id} for Bay {res.slot_id} expired after {res.grace_period_minutes}-minute grace window.",
                    user_id=res.user_id,
                    reservation_id=res.id,
                    timestamp=now,
                )
                db.add(event)
                expired_list.append(res.to_dict())

        if expired_list:
            await db.commit()
            slots_data = await SlotService.get_all_slots_with_status(db, now)
            await ws_manager.broadcast_slots_update(slots_data)

        return expired_list
