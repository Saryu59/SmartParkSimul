import uuid
import json
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy import String, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"evt-{uuid.uuid4().hex[:12]}")
    event_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    severity: Mapped[str] = mapped_column(String(32), default="INFO", nullable=False)  # INFO, SUCCESS, WARNING, ALERT
    slot_id: Mapped[Optional[str]] = mapped_column(String(16), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    user_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    reservation_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    metadata_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    def to_dict(self):
        meta = {}
        if self.metadata_json:
            try:
                meta = json.loads(self.metadata_json)
            except Exception:
                pass
        return {
            "id": self.id,
            "type": self.event_type,
            "severity": self.severity,
            "slotId": self.slot_id,
            "title": self.title,
            "description": self.description,
            "userId": self.user_id,
            "reservationId": self.reservation_id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "metadata": meta,
        }
