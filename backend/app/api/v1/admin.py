from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.db.session import get_db
from app.schemas.event import AuditEventOut
from app.models.audit_event import AuditEvent
from app.models.slot import ParkingSlot
from app.models.reservation import Reservation
from app.models.user import User
from app.services.slot_service import SlotService
from app.services.expiry_service import ExpiryService
from app.core.dependencies import get_current_admin
from app.db.seed import seed_database
from app.core.config import settings

router = APIRouter(prefix="/admin", tags=["Administrator Operations"])


@router.get("/stats")
async def get_facility_stats(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    slots = await SlotService.get_all_slots_with_status(db)
    
    total = len(slots)
    available = sum(1 for s in slots if s["status"] == "AVAILABLE")
    occupied = sum(1 for s in slots if s["status"] == "OCCUPIED")
    reserved = sum(1 for s in slots if s["status"] == "RESERVED")
    offline = sum(1 for s in slots if s["status"] == "OFFLINE")
    maintenance = sum(1 for s in slots if s["status"] == "OUT_OF_SERVICE")

    # Unreserved occupancy slots: physically occupied but no active/checked-in reservation
    unreserved_slots = [s for s in slots if s["isOccupied"] and not s["activeReservationId"]]

    occupancy_pct = round((occupied / total * 100), 1) if total > 0 else 0.0

    return {
        "totalSlots": total,
        "availableSlots": available,
        "occupiedSlots": occupied,
        "reservedSlots": reserved,
        "offlineSlots": offline,
        "maintenanceSlots": maintenance,
        "occupancyPercentage": occupancy_pct,
        "unreservedOccupancyCount": len(unreserved_slots),
        "unreservedOccupancySlots": unreserved_slots,
        "mode": settings.SENSOR_MODE,
    }


@router.get("/events", response_model=List[AuditEventOut])
async def list_audit_events(
    limit: int = Query(50, ge=1, le=200),
    severity: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    stmt = select(AuditEvent).order_by(AuditEvent.timestamp.desc()).limit(limit)
    if severity:
        stmt = stmt.where(AuditEvent.severity == severity.upper())

    result = await db.execute(stmt)
    events = result.scalars().all()
    return [e.to_dict() for e in events]


@router.post("/evaluate-expirations")
async def evaluate_expirations_endpoint(
    referenceTime: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    ref_dt = None
    if referenceTime:
        try:
            ref_dt = datetime.fromisoformat(referenceTime.replace("Z", "+00:00"))
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid referenceTime format.")

    expired = await ExpiryService.evaluate_expirations(db, ref_dt)
    return {
        "evaluatedAt": (ref_dt or datetime.now(timezone.utc)).isoformat(),
        "expiredReservationsCount": len(expired),
        "expired": expired,
    }


@router.post("/reset-demo")
async def reset_demo_state(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    if settings.SENSOR_MODE == "hardware":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Resetting state is disabled in hardware mode.",
        )

    await seed_database(db, wipe=True)
    return {"message": "Demo database successfully reset to clean testbed seed data."}
