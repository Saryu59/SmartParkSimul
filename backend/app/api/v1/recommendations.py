from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.recommendation import RecommendationPreferences, RecommendationItem, RecommendationResponse
from app.services.recommendation_service import RecommendationService

router = APIRouter(prefix="/recommendations", tags=["Smart Recommendations"])


@router.post("", response_model=RecommendationResponse)
async def get_recommended_slots(
    prefs: RecommendationPreferences,
    db: AsyncSession = Depends(get_db),
):
    ranked = await RecommendationService.get_recommendations(
        db=db,
        preferred_zone=prefs.preferredZone or "ANY",
        prioritize_entrance=prefs.prioritizeEntrance,
        requires_accessible=prefs.requiresAccessible,
    )
    return RecommendationResponse(
        recommendedSlots=ranked,
        totalAvailable=len(ranked),
    )
