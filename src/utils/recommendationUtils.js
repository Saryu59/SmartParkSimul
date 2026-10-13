import { SLOT_STATUS } from '../constants/slots';

/**
 * Intelligent Rule-Based Parking Slot Recommendation Engine
 */
export function getRecommendedSlots(slots, preferences = {}) {
  const {
    preferredZone = 'ANY',
    prioritizeEntrance = true,
    requiresAccessible = false,
  } = preferences;

  // 1. Filter eligible slots: must be strictly AVAILABLE
  // (Sensor online, not occupied, no pending reservation, not out-of-service)
  const eligibleSlots = slots.filter((slot) => {
    if (slot.status !== SLOT_STATUS.AVAILABLE) return false;
    if (slot.isOccupied) return false;
    if (slot.isMaintenance) return false;
    if (!slot.sensor?.isOnline) return false;
    return true;
  });

  if (!eligibleSlots.length) {
    return [];
  }

  // 2. Score each eligible slot
  const scoredSlots = eligibleSlots.map((slot) => {
    let score = 100;
    const reasons = [];

    // Accessibility rule
    if (requiresAccessible) {
      if (slot.isAccessible) {
        score += 80;
        reasons.push('Meets required disability / accessibility designation');
      } else {
        score -= 50; // heavily penalized if accessible requested but slot is standard
      }
    } else {
      // If user doesn't need accessible, keep accessible slot as lower priority so it remains for those in need
      if (slot.isAccessible) {
        score -= 10;
        reasons.push('Standard bay preferred; accessible slot reserved as backup');
      }
    }

    // Zone preference rule
    if (preferredZone !== 'ANY') {
      if (slot.zone === preferredZone) {
        score += 40;
        reasons.push(`Matches preferred Zone ${slot.zone}`);
      } else {
        score -= 20;
      }
    }

    // Distance to entrance rule
    if (prioritizeEntrance) {
      // Shorter distance = higher score
      const distanceBonus = Math.max(0, 50 - slot.distanceToEntranceMeters);
      score += distanceBonus;
      reasons.push(`Closest walking distance: ${slot.distanceToEntranceMeters}m to facility entrance`);
    } else {
      reasons.push(`Standard bay distance (${slot.distanceToEntranceMeters}m)`);
    }

    // Signal/telemetry health confidence
    if (slot.sensor?.batteryPercent > 90) {
      score += 5;
    }

    return {
      slot,
      score,
      reasons,
    };
  });

  // 3. Sort by descending score
  scoredSlots.sort((a, b) => b.score - a.score);

  return scoredSlots;
}
