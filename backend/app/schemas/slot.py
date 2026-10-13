from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class SensorInfo(BaseModel):
    id: str
    gpioPin: int
    isOnline: bool
    lastHeartbeat: Optional[str] = None
    batteryPercent: int = 95
    signalDbm: int = -55
    lastTriggeredAt: Optional[str] = None


class SlotOut(BaseModel):
    id: str
    zone: str
    name: str
    isAccessible: bool
    distanceToEntranceMeters: int
    isOccupied: bool
    isMaintenance: bool
    activeReservationId: Optional[str] = None
    status: str  # "AVAILABLE", "RESERVED", "OCCUPIED", "OFFLINE", "OUT_OF_SERVICE"
    sensor: SensorInfo

    model_config = ConfigDict(from_attributes=True)


class SlotMaintenanceToggle(BaseModel):
    isMaintenance: Optional[bool] = None


class SlotSensorOnlineToggle(BaseModel):
    isOnline: Optional[bool] = None


class SlotOccupancyToggle(BaseModel):
    isOccupied: Optional[bool] = None
