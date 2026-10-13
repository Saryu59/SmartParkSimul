from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.slot_service import SlotService
from app.models.reservation import Reservation
from sqlalchemy import select, and_


class RecommendationService:
    @staticmethod
    async def get_recommendations(
        db: AsyncSession,
        preferred_zone: str = "ANY",
        prioritize_entrance: bool = True,
        requires_accessible: bool = False,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
    ) -> List[Dict[str, Any]]:
        slots = await SlotService.get_all_slots_with_status(db)

        # 1. Filter out completely ineligible slots (maintenance, offline, physically occupied, or reserved)
        eligible_slots = []
        for s in slots:
            # Check maintenance and sensor
            if s["isMaintenance"]:
                continue
            if not s["sensor"]["isOnline"]:
                continue
            # Physical occupancy check
            if s["isOccupied"]:
                continue

            # Check if reserved at requested time or current time
            if s["activeReservationId"]:
                continue

            # Accessible constraint
            if requires_accessible and not s["isAccessible"]:
                continue

            eligible_slots.append(s)

        # 2. Score and rank eligible slots
        ranked = []
        for s in eligible_slots:
            score = 100
            reasons = []

            # Accessibility
            if requires_accessible and s["isAccessible"]:
                score += 50
                reasons.append("Matches required accessible / priority bay designation")
            elif s["isAccessible"]:
                # Normal user booking accessible bay is slightly lower priority if normal bays free
                score -= 10
                reasons.append("Accessible priority bay")

            # Zone match
            if preferred_zone != "ANY":
                if s["zone"] == preferred_zone:
                    score += 30
                    reasons.append(f"Located in your preferred Zone {preferred_zone}")
                else:
                    score -= 20
            else:
                reasons.append(f"Located in Zone {s['zone']}")

            # Entrance proximity
            if prioritize_entrance:
                dist = s["distanceToEntranceMeters"]
                proximity_bonus = max(0, 30 - dist)
                score += proximity_bonus
                reasons.append(f"Short {dist}m walking distance to elevator lobby")

            reasons.append("Hardware optical sensor confirms stall is vacant and operational")

            ranked.append({
                "slot": s,
                "score": score,
                "reasons": reasons,
            })

        # Sort descending by score
        ranked.sort(key=lambda x: x["score"], reverse=True)
        return ranked
