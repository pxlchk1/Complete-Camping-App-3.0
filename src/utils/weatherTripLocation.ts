import { Trip } from "../types/camping";

/**
 * Resolves the weather location for a trip based on priority:
 * 1. trip.weatherDestination (explicit user override)
 * 2. trip.tripDestination (inherits from trip destination)
 * 3. null (show picker/search)
 */
export function resolveTripWeatherLocation(trip: Trip | null | undefined): {
  name: string;
  latitude: number;
  longitude: number;
} | null {
  if (!trip) return null;

  // Priority 1: Explicit weather destination override
  if (trip.weatherDestination?.lat && trip.weatherDestination?.lon) {
    return {
      name: trip.weatherDestination.label ?? "Trip weather",
      latitude: trip.weatherDestination.lat,
      longitude: trip.weatherDestination.lon,
    };
  }

  // Priority 2: Inherit from trip destination
  if (trip.tripDestination?.lat && trip.tripDestination?.lng) {
    return {
      name: trip.tripDestination.name ?? "Trip destination",
      latitude: trip.tripDestination.lat,
      longitude: trip.tripDestination.lng,
    };
  }

  // Priority 3: No location set
  return null;
}
