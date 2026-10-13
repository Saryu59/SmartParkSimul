import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Boolean, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class SensorEvent(Base):
    __tablename__ = "sensor_events"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"sevt-{uuid.uuid4().hex[:12]}")
    device_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    slot_id: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    is_occupied: Mapped[bool] = mapped_column(Boolean, nullable=False)
    raw_reading: Mapped[str] = mapped_column(String(32), default="LOW", nullable=False)
    sequence_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    device_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    server_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    is_processed: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    validation_result: Mapped[str] = mapped_column(String(64), default="VALID", nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "deviceId": self.device_id,
            "slotId": self.slot_id,
            "isOccupied": self.is_occupied,
            "rawReading": self.raw_reading,
            "sequenceNumber": self.sequence_number,
            "deviceTimestamp": self.device_timestamp.isoformat() if self.device_timestamp else None,
            "serverTimestamp": self.server_timestamp.isoformat() if self.server_timestamp else None,
            "validationResult": self.validation_result,
        }
