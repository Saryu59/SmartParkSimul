from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Boolean, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class ParkingSlot(Base):
    __tablename__ = "parking_slots"

    id: Mapped[str] = mapped_column(String(16), primary_key=True)  # "A1", "A2", "A3", "B1", "B2", "B3"
    zone: Mapped[str] = mapped_column(String(16), nullable=False)  # "A" or "B"
    name: Mapped[str] = mapped_column(String(64), nullable=False)  # "Slot A1"
    is_accessible: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    distance_to_entrance_meters: Mapped[int] = mapped_column(Integer, default=15, nullable=False)

    # Physical Occupancy (Raw hardware state from IR sensor)
    is_occupied: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Operational & Maintenance Status
    is_maintenance: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Sensor hardware telemetry
    sensor_id: Mapped[str] = mapped_column(String(64), nullable=False)
    sensor_gpio_pin: Mapped[int] = mapped_column(Integer, nullable=False)
    sensor_online: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sensor_battery_percent: Mapped[int] = mapped_column(Integer, default=95, nullable=False)
    sensor_signal_dbm: Mapped[int] = mapped_column(Integer, default=-55, nullable=False)
    last_heartbeat: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    last_triggered_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    reservations = relationship("Reservation", back_populates="slot", cascade="all, delete-orphan")

    def compute_status(self, active_reservation_id: Optional[str] = None) -> str:
        """
        Pure business logic to compute user-facing slot status:
        OUT_OF_SERVICE > OFFLINE > OCCUPIED > RESERVED > AVAILABLE
        """
        if self.is_maintenance:
            return "OUT_OF_SERVICE"
        if not self.sensor_online:
            return "OFFLINE"
        if self.is_occupied:
            return "OCCUPIED"
        if active_reservation_id:
            return "RESERVED"
        return "AVAILABLE"

    def to_dict(self, active_reservation_id: Optional[str] = None):
        return {
            "id": self.id,
            "zone": self.zone,
            "name": self.name,
            "isAccessible": self.is_accessible,
            "distanceToEntranceMeters": self.distance_to_entrance_meters,
            "isOccupied": self.is_occupied,
            "isMaintenance": self.is_maintenance,
            "activeReservationId": active_reservation_id,
            "status": self.compute_status(active_reservation_id),
            "sensor": {
                "id": self.sensor_id,
                "gpioPin": self.sensor_gpio_pin,
                "isOnline": self.sensor_online,
                "lastHeartbeat": self.last_heartbeat.isoformat() if self.last_heartbeat else None,
                "batteryPercent": self.sensor_battery_percent,
                "signalDbm": self.sensor_signal_dbm,
                "lastTriggeredAt": self.last_triggered_at.isoformat() if self.last_triggered_at else None,
            },
        }
