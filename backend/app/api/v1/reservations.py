from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.reservation import ReservationCreate, ReservationOut, CheckOutRequest
from app.services.reservation_service import ReservationService
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/reservations", tags=["Reservations"])


@router.get("", response_model=List[ReservationOut])
async def list_reservations(
    slotId: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    allUsers: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Regular users only see their own reservations unless they are Admin and requested all
    user_id_filter = None if (current_user.role == "ADMIN" and allUsers) else current_user.id
    return await ReservationService.get_reservations(
        db=db,
        user_id=user_id_filter,
        slot_id=slotId,
        status=status,
    )


@router.get("/{reservation_id}", response_model=ReservationOut)
async def get_reservation(
    reservation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await ReservationService.get_reservation_by_id(db, reservation_id)
    if not res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reservation '{reservation_id}' not found.",
        )
    if current_user.role != "ADMIN" and res.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this booking permit.",
        )
    return res.to_dict()


@router.post("", response_model=ReservationOut, status_code=status.HTTP_201_CREATED)
async def create_reservation(
    data: ReservationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        start_dt = datetime.fromisoformat(data.startTime.replace("Z", "+00:00"))
        end_dt = datetime.fromisoformat(data.endTime.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ISO 8601 date format for startTime or endTime.",
        )

    try:
        new_res = await ReservationService.create_reservation(
            db=db,
            slot_id=data.slotId.upper(),
            user_id=current_user.id,
            user_name=data.userName or current_user.name,
            user_email=data.userEmail or current_user.email,
            license_plate=data.licensePlate.strip().upper(),
            start_time=start_dt,
            end_time=end_dt,
        )
        return new_res
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))


@router.post("/{reservation_id}/cancel", response_model=ReservationOut)
async def cancel_reservation(
    reservation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await ReservationService.cancel_reservation(
            db=db,
            reservation_id=reservation_id,
            requesting_user_id=current_user.id,
            is_admin=current_user.role == "ADMIN",
        )
    except PermissionError as pe:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))


@router.post("/{reservation_id}/checkout", response_model=ReservationOut)
async def checkout_reservation(
    reservation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await ReservationService.check_out(
            db=db,
            reservation_id=reservation_id,
            requesting_user_id=current_user.id,
            is_admin=current_user.role == "ADMIN",
        )
    except PermissionError as pe:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
