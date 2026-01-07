import { CampingStyle } from "../types/camping";
import { TripType, Season } from "../state/packingStore";

/**
 * Derive season from trip start date
 * Winter: December, January, February
 * Spring: March, April, May, June
 * Summer: July, August
 * Fall: September, October, November
 */
export function deriveSeasonFromDate(startDate: string | Date): Season {
  const date = typeof startDate === "string" ? new Date(startDate) : startDate;
  const month = date.getMonth(); // 0-indexed: 0 = January, 11 = December

  if (month === 11 || month === 0 || month === 1) {
    return "winter";
  }
  if (month >= 2 && month <= 5) {
    return "spring";
  }
  if (month === 6 || month === 7) {
    return "summer";
  }
  // months 8, 9, 10 (September, October, November)
  return "fall";
}

/**
 * Map CampingStyle to TripType for packing list defaults
 */
export function mapCampingStyleToTripType(campingStyle: CampingStyle | undefined): TripType | null {
  if (!campingStyle) return null;

  switch (campingStyle) {
    case "BACKPACKING":
      return "backpacking";
    case "CAR_CAMPING":
    case "RV":
    case "OVERLANDING":
    case "ROOFTOP_TENT":
      return "car-camping";
    default:
      return null;
  }
}

/**
 * Calculate trip length in nights
 */
export function calculateTripNights(startDate: string | Date, endDate: string | Date): number {
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;
  const diffMs = end.getTime() - start.getTime();
  return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Derive TripType from trip length (number of nights)
 */
export function deriveTripTypeFromLength(nights: number): TripType {
  if (nights <= 1) return "one-night";
  if (nights <= 2) return "weekend";
  return "multi-day";
}
