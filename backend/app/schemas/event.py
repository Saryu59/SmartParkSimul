from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class AuditEventOut(BaseModel):
    id: str
    type: str
    severity: str
    slotId: Optional[str] = None
    title: str
    description: str
    userId: Optional[str] = None
    reservationId: Optional[str] = None
    timestamp: str
    metadata: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)
