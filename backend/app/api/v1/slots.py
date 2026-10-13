from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.slot import SlotOut, SlotMaintenanceToggle, SlotSensorOnlineToggle, SlotOccupancyToggle
from app.services.slot_service import SlotService
from app.services.sensor_service import SensorService
from app.core.dependencies import get_current_user, get_current_admin
from app.models.user import User

router = APIRouter(prefix="/slots", tags=["Parking Slots"])


@router.get("", response_model=List[SlotOut])
async def list_parking_slots(db: AsyncSession = Depends(get_db)):
    return await SlotService.get_all_slots_with_status(db)


@router.get("/{slot_id}", response_model=SlotOut)
async def get_parking_slot(slot_id: str, db: AsyncSession = Depends(get_db)):
    slot = await SlotService.get_slot_by_id(db, slot_id.upper())
    if not slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Slot '{slot_id}' not found.",
        )
    return slot


@router.post("/{slot_id}/maintenance", response_model=SlotOut)
async def toggle_slot_maintenance(
    slot_id: str,
    payload: Optional[SlotMaintenanceToggle] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    try:
        is_maint = payload.isMaintenance if payload else None
        return await SlotService.toggle_maintenance(db, slot_id.upper(), is_maint)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{slot_id}/sensor-online", response_model=SlotOut)
async def toggle_sensor_online(
    slot_id: str,
    payload: Optional[SlotSensorOnlineToggle] = None,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    try:
        is_online = payload.isOnline if payload else None
        return await SlotService.toggle_sensor_online(db, slot_id.upper(), is_online)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{slot_id}/occupancy", response_model=SlotOut)
async def simulate_slot_occupancy(
    slot_id: str,
    payload: Optional[SlotOccupancyToggle] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Demo sensor trigger for testing car arrival/departure in demo mode.
    """
    target_slot = await SlotService.get_slot_by_id(db, slot_id.upper())
    if not target_slot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Slot {slot_id} not found.")

    new_occupied = payload.isOccupied if (payload and payload.isOccupied is not None) else not target_slot["isOccupied"]

    try:
        await SensorService.process_sensor_event(
            db=db,
            device_id=f"demo-trigger-{current_user.id}",
            slot_id=slot_id.upper(),
            is_occupied=new_occupied,
            raw_reading="LOW" if new_occupied else "HIGH",
            is_simulated=True,
        )
        return await SlotService.get_slot_by_id(db, slot_id.upper())
    except PermissionError as pe:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
