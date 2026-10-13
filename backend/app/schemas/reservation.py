from typing import Optional
from pydantic import BaseModel, Field, EmailStr, ConfigDict


class ReservationCreate(BaseModel):
    slotId: str = Field(..., min_length=2, max_length=16)
    startTime: str = Field(..., description="ISO 8601 string")
    endTime: str = Field(..., description="ISO 8601 string")
    licensePlate: str = Field(..., min_length=2, max_length=32)
    userName: Optional[str] = None
    userEmail: Optional[EmailStr] = None


class ReservationOut(BaseModel):
    id: str
    slotId: str
    userId: str
    userName: str
    userEmail: str
    licensePlate: str
    startTime: str
    endTime: str
    status: str
    checkedIn: bool
    checkedInAt: Optional[str] = None
    checkedOutAt: Optional[str] = None
    gracePeriodMinutes: int
    qrCodePayload: Optional[str] = None
    createdAt: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CheckInRequest(BaseModel):
    code: str = Field(..., min_length=3, max_length=64)


class CheckOutRequest(BaseModel):
    reservationId: Optional[str] = None
