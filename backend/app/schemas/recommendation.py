from typing import List, Optional
from pydantic import BaseModel
from app.schemas.slot import SlotOut


class RecommendationPreferences(BaseModel):
    preferredZone: Optional[str] = "ANY"  # "ANY", "A", "B"
    prioritizeEntrance: bool = True
    requiresAccessible: bool = False
    startTime: Optional[str] = None
    endTime: Optional[str] = None


class RecommendationItem(BaseModel):
    slot: SlotOut
    score: int
    reasons: List[str]


class RecommendationResponse(BaseModel):
    recommendedSlots: List[RecommendationItem]
    totalAvailable: int
