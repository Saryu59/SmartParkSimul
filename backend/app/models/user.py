import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: f"usr-{uuid.uuid4().hex[:12]}")
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(32), default="USER", nullable=False)  # "USER" or "ADMIN"
    license_plate: Mapped[str] = mapped_column(String(32), nullable=True, default="ABC-1234")
    phone: Mapped[str] = mapped_column(String(32), nullable=True)
    department: Mapped[str] = mapped_column(String(128), nullable=True)
    preferred_zone: Mapped[str] = mapped_column(String(16), nullable=True, default="A")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    reservations = relationship("Reservation", back_populates="user", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "licensePlate": self.license_plate,
            "phone": self.phone,
            "department": self.department,
            "preferredZone": self.preferred_zone,
            "registeredAt": self.created_at.isoformat() if self.created_at else None,
        }
