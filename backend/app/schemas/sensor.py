from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class SensorEventCreate(BaseModel):
    deviceId: str = Field(..., min_length=2, max_length=64, description="ESP32 hardware ID e.g. 'esp32-node-01' or 'sim-node'")
    slotId: str = Field(..., min_length=2, max_length=16, description="Slot ID: A1, A2, A3, B1, B2, B3")
    isOccupied: bool = Field(..., description="True if vehicle detected, False if beam clear")
    rawReading: Optional[str] = Field(default="LOW", description="LOW (active beam break) or HIGH")
    deviceTimestamp: Optional[str] = Field(default=None, description="ISO 8601 device timestamp")
    sequenceNumber: Optional[int] = Field(default=None, ge=0)
    batteryPercent: Optional[int] = Field(default=None, ge=0, le=100)
    signalDbm: Optional[int] = Field(default=None, ge=-120, le=0)


class SensorEventOut(BaseModel):
    id: str
    deviceId: str
    slotId: str
    isOccupied: bool
    rawReading: str
    sequenceNumber: Optional[int] = None
    deviceTimestamp: Optional[str] = None
    serverTimestamp: str
    validationResult: str

    model_config = ConfigDict(from_attributes=True)


class HardwareStatusOut(BaseModel):
    mode: str  # "demo" or "hardware"
    totalSlots: int
    onlineCount: int
    offlineCount: int
    staleCount: int
    firmwareVersion: str
    deviceRegistered: bool
