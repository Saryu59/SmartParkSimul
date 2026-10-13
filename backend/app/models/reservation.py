import uuid
import json
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Boolean, Integer, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Reservation(Base):
    __tablename__ = "reservations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)  # e.g. "RES-8041" or "SP-1234"
    slot_id: Mapped[str] = mapped_column(String(16), ForeignKey("parking_slots.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    user_name: Mapped[str] = mapped_column(String(128), nullable=False)
    user_email: Mapped[str] = mapped_column(String(255), nullable=False)
    license_plate: Mapped[str] = mapped_column(String(32), nullable=False, index=True)

    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)

    # Status: UPCOMING, ACTIVE, COMPLETED, CANCELLED, EXPIRED
    status: Mapped[str] = mapped_column(String(32), default="UPCOMING", nullable=False, index=True)

    checked_in: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    checked_in_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    checked_out_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    grace_period_minutes: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    qr_code_payload: Mapped[str] = mapped_column(String(1024), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    slot = relationship("ParkingSlot", back_populates="reservations")
    user = relationship("User", back_populates="reservations")

    __table_args__ = (
        Index("idx_reservations_slot_interval", "slot_id", "start_time", "end_time", "status"),
        Index("idx_reservations_driver_interval", "user_id", "license_plate", "start_time", "end_time", "status"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "slotId": self.slot_id,
            "userId": self.user_id,
            "userName": self.user_name,
            "userEmail": self.user_email,
            "licensePlate": self.license_plate,
            "startTime": self.start_time.isoformat() if self.start_time else None,
            "endTime": self.end_time.isoformat() if self.end_time else None,
            "status": self.status,
            "checkedIn": self.checked_in,
            "checkedInAt": self.checked_in_at.isoformat() if self.checked_in_at else None,
            "checkedOutAt": self.checked_out_at.isoformat() if self.checked_out_at else None,
            "gracePeriodMinutes": self.grace_period_minutes,
            "qrCodePayload": self.qr_code_payload,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
