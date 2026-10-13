from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.reservation import CheckInRequest, ReservationOut
from app.services.reservation_service import ReservationService
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/check-in", tags=["QR Check-In"])


@router.post("", response_model=ReservationOut)
async def perform_check_in(
    data: CheckInRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        updated_res = await ReservationService.check_in(
            db=db,
            code=data.code,
            requesting_user_id=current_user.id,
            is_admin=current_user.role == "ADMIN",
        )
        return updated_res
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
