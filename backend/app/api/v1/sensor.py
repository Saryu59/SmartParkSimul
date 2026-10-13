from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from app.db.session import get_db
from app.schemas.sensor import SensorEventCreate, SensorEventOut, HardwareStatusOut
from app.services.sensor_service import SensorService
from app.models.slot import ParkingSlot
from app.core.config import settings
from app.core.dependencies import verify_hardware_token

router = APIRouter(prefix="/sensors", tags=["Hardware & Sensor Telemetry"])


@router.post("/events", response_model=SensorEventOut, status_code=status.HTTP_200_OK)
async def ingest_sensor_event(
    event: SensorEventCreate,
    device_token: str = Depends(verify_hardware_token),
    db: AsyncSession = Depends(get_db),
):
    """
    Primary ingestion endpoint for ESP32 and IR obstacle sensor telemetry.
    Authenticated via 'X-Device-Token' header in hardware mode.
    """
    dev_time = None
    if event.deviceTimestamp:
        try:
            dev_time = datetime.fromisoformat(event.deviceTimestamp.replace("Z", "+00:00"))
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid ISO 8601 deviceTimestamp format.",
            )

    try:
        processed_event = await SensorService.process_sensor_event(
            db=db,
            device_id=event.deviceId,
            slot_id=event.slotId.upper(),
            is_occupied=event.isOccupied,
            raw_reading=event.rawReading or "LOW",
            device_timestamp=dev_time,
            sequence_number=event.sequenceNumber,
            battery_percent=event.batteryPercent,
            signal_dbm=event.signalDbm,
            is_simulated=False,
        )
        return processed_event
    except PermissionError as pe:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))


@router.get("/status", response_model=HardwareStatusOut)
async def get_hardware_status(db: AsyncSession = Depends(get_db)):
    stmt = select(ParkingSlot)
    result = await db.execute(stmt)
    slots = result.scalars().all()

    online = sum(1 for s in slots if s.sensor_online)
    offline = sum(1 for s in slots if not s.sensor_online)

    now = datetime.now(timezone.utc)
    # Stale: online, but heartbeat older than 5 minutes
    def is_stale(slot):
        if not slot.sensor_online or not slot.last_heartbeat:
            return False
        hb = slot.last_heartbeat if slot.last_heartbeat.tzinfo else slot.last_heartbeat.replace(tzinfo=timezone.utc)
        return (now - hb).total_seconds() > 300

    stale = sum(1 for s in slots if is_stale(s))

    return HardwareStatusOut(
        mode=settings.SENSOR_MODE,
        totalSlots=len(slots),
        onlineCount=online,
        offlineCount=offline,
        staleCount=stale,
        firmwareVersion="v1.4.2-esp32-freertos",
        deviceRegistered=True,
    )
