import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  TextInput,
  Keyboard,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

import { useLocationStore } from "../state/locationStore";
import { useTrips } from "../state/tripsStore";
import { fetchWeather, WeatherData } from "../api/weather-service";
import { colors, spacing, radius, fonts, fontSizes } from "../theme/theme";
import {
  DEEP_FOREST,
  EARTH_GREEN,
  CARD_BACKGROUND_LIGHT,
  BORDER_SOFT,
  TEXT_SECONDARY,
  RIVER_ROCK,
  PARCHMENT,
} from "../constants/colors";

interface WeatherScreenProps {
  onTabChange?: (tab: "trips" | "parks" | "weather" | "packing" | "meals") => void;
}

const getWeatherIcon = (condition: string): keyof typeof Ionicons.glyphMap => {
  const lower = (condition || "").toLowerCase();
  if (lower.includes("rain")) return "rainy";
  if (lower.includes("cloud")) return "cloudy";
  if (lower.includes("sun") || lower.includes("clear")) return "sunny";
  if (lower.includes("snow")) return "snow";
  if (lower.includes("thunder")) return "thunderstorm";
  if (lower.includes("wind")) return "cloudy";
  return "partly-sunny";
};

const formatTripRange = (startDate: string | number | Date, endDate: string | number | Date) => {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const start = new Date(startDate).toLocaleDateString("en-US", opts);
  const end = new Date(endDate).toLocaleDateString("en-US", opts);
  return `${start} - ${end}`;
};

export default function WeatherScreen({ onTabChange }: WeatherScreenProps = {}) {
  const insets = useSafeAreaInsets();

  const { selectedLocation, userLocation, setUserLocation, setSelectedLocation } = useLocationStore();
  const trips = useTrips();

  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddToTripModal, setShowAddToTripModal] = useState(false);

  // Prevent out-of-order weather responses from overwriting newer results.
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (__DEV__) {
      // Keep debug logs inside the component and behind __DEV__ so they never break bundling.
      // (Also avoids illegal hook usage outside components.)
      // eslint-disable-next-line no-console
      console.log("[PLAN_TRACE] WeatherScreen mounted");
    }
  }, []);

  const location = useMemo(() => {
    if (selectedLocation) return selectedLocation;
    if (userLocation) {
      return {
        name: "Your Location",
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      };
    }
    return null;
  }, [selectedLocation, userLocation]);

  const fetchWeatherData = useCallback(async (lat: number, lon: number) => {
    const currentRequestId = ++requestIdRef.current;

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchWeather(lat, lon);

      // Ignore stale responses
      if (currentRequestId !== requestIdRef.current) return;

      setWeatherData(data);
    } catch (err: unknown) {
      if (currentRequestId !== requestIdRef.current) return;

      // eslint-disable-next-line no-console
      console.error("Error fetching weather:", err);
      setError("Failed to load weather data. Please try again.");
      setWeatherData(null);
    } finally {
      if (currentRequestId !== requestIdRef.current) return;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!location) return;
    fetchWeatherData(location.latitude, location.longitude);
  }, [fetchWeatherData, location?.latitude, location?.longitude]);

  const handleUseMyLocation = useCallback(async () => {
    setIsLoadingLocation(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setError("Location permission denied. Please enable location in your device settings.");
        return;
      }

      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation({
        latitude: locationResult.coords.latitude,
        longitude: locationResult.coords.longitude,
      });

      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log("User location obtained:", locationResult.coords);
      }
    } catch (err: unknown) {
      // eslint-disable-next-line no-console
      console.error("Error getting location:", err);
      setError("Failed to get your location. Please try again.");
    } finally {
      setIsLoadingLocation(false);
    }
  }, [setUserLocation]);

  const handleSearchLocation = useCallback(async () => {
    const query = searchQuery.trim();

    if (!query) {
      setError("Please enter a city and state");
      return;
    }

    Keyboard.dismiss();
    setIsSearchingLocation(true);
    setError(null);

    try {
      const results = await Location.geocodeAsync(query);

      if (!results.length) {
        setError("Location not found. Please try a different search.");
        return;
      }

      const result = results[0];

      setSelectedLocation({
        name: query,
        latitude: result.latitude,
        longitude: result.longitude,
      });

      setSearchQuery("");

      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log("Location found:", result);
      }
    } catch (err: unknown) {
      // eslint-disable-next-line no-console
      console.error("Error searching location:", err);
      setError("Failed to find location. Please try again.");
    } finally {
      setIsSearchingLocation(false);
    }
  }, [searchQuery, setSelectedLocation]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.parchment }}>
      {/* Page Title Header */}
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingBottom: 12,
          backgroundColor: "#F4EBD0",
          paddingHorizontal: 20,
        }}
      >
        <Text style={{ fontFamily: "JosefinSlab_700Bold", fontSize: 24, color: "#16492f" }}>Weather</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: spacing.xl,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Location Display */}
        {location && (
          <View
            style={{
              backgroundColor: CARD_BACKGROUND_LIGHT,
              borderRadius: radius.md,
              padding: spacing.md,
              marginBottom: spacing.md,
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: BORDER_SOFT,
            }}
          >
            <Ionicons name="location" size={20} color={RIVER_ROCK} />
            <View style={{ marginLeft: spacing.sm, flex: 1 }}>
              <Text
                style={{
                  fontFamily: fonts.displayRegular,
                  fontSize: fontSizes.md,
                  color: DEEP_FOREST,
                }}
              >
                {location.name}
              </Text>
              {"state" in location && (location as any).state ? (
                <Text
                  style={{
                    fontFamily: fonts.bodyRegular,
                    fontSize: fontSizes.xs,
                    color: TEXT_SECONDARY,
                  }}
                >
                  {(location as any).state}
                </Text>
              ) : null}
            </View>
          </View>
        )}

        {/* No Location State */}
        {!location && !isLoading && (
          <View
            style={{
              backgroundColor: CARD_BACKGROUND_LIGHT,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: BORDER_SOFT,
              padding: spacing.xl,
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: `${DEEP_FOREST}15`,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: spacing.sm,
              }}
            >
              <Ionicons name="location-outline" size={30} color={DEEP_FOREST} />
            </View>

            <Text
              style={{
                fontFamily: fonts.displayRegular,
                fontSize: fontSizes.md,
                color: DEEP_FOREST,
                marginBottom: spacing.xs,
              }}
            >
              No location selected
            </Text>

            <Text
              style={{
                fontFamily: fonts.bodyRegular,
                fontSize: fontSizes.sm,
                color: EARTH_GREEN,
                textAlign: "center",
                marginBottom: spacing.md,
              }}
            >
              Select a park, search for a city, or use your location to see weather forecasts.
            </Text>

            {/* City/State Search */}
            <View style={{ width: "100%", marginBottom: spacing.md }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.parchment,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: BORDER_SOFT,
                  paddingHorizontal: spacing.sm,
                }}
              >
                <Ionicons name="search" size={18} color={EARTH_GREEN} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="City, State (e.g., San Francisco, CA)"
                  placeholderTextColor={EARTH_GREEN}
                  style={{
                    flex: 1,
                    fontFamily: fonts.bodyRegular,
                    fontSize: fontSizes.sm,
                    color: DEEP_FOREST,
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.sm,
                  }}
                  returnKeyType="search"
                  onSubmitEditing={handleSearchLocation}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery("")} accessibilityRole="button" accessibilityLabel="Clear search">
                    <Ionicons name="close-circle" size={18} color={EARTH_GREEN} />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Stacked Buttons */}
            <View style={{ width: "100%", gap: spacing.sm }}>
              <Pressable
                onPress={handleSearchLocation}
                disabled={isSearchingLocation || !searchQuery.trim()}
                style={{
                  backgroundColor: DEEP_FOREST,
                  borderRadius: radius.md,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.lg,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: isSearchingLocation || !searchQuery.trim() ? 0.6 : 1,
                }}
              >
                {isSearchingLocation ? (
                  <ActivityIndicator size="small" color={colors.parchment} />
                ) : (
                  <Ionicons name="search" size={18} color={colors.parchment} style={{ marginRight: spacing.xs }} />
                )}
                <Text
                  style={{
                    fontFamily: fonts.bodySemibold,
                    fontSize: fontSizes.sm,
                    color: colors.parchment,
                    marginLeft: isSearchingLocation ? spacing.xs : 0,
                  }}
                >
                  {isSearchingLocation ? "Searching..." : "Search Location"}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleUseMyLocation}
                disabled={isLoadingLocation}
                style={{
                  backgroundColor: colors.parchment,
                  borderRadius: radius.md,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.lg,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: BORDER_SOFT,
                  opacity: isLoadingLocation ? 0.6 : 1,
                }}
              >
                {isLoadingLocation ? (
                  <ActivityIndicator size="small" color={DEEP_FOREST} />
                ) : (
                  <Ionicons name="navigate" size={18} color={DEEP_FOREST} style={{ marginRight: spacing.xs }} />
                )}
                <Text
                  style={{
                    fontFamily: fonts.bodySemibold,
                    fontSize: fontSizes.sm,
                    color: DEEP_FOREST,
                    marginLeft: isLoadingLocation ? spacing.xs : 0,
                  }}
                >
                  {isLoadingLocation ? "Getting location..." : "Use My Location"}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => onTabChange?.("parks")}
                style={{
                  backgroundColor: colors.parchment,
                  borderRadius: radius.md,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.lg,
                  borderWidth: 1,
                  borderColor: BORDER_SOFT,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.bodySemibold,
                    fontSize: fontSizes.sm,
                    color: DEEP_FOREST,
                  }}
                >
                  Browse Parks
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Loading State */}
        {isLoading && (
          <View style={{ alignItems: "center", paddingVertical: spacing.xl }}>
            <ActivityIndicator size="large" color={DEEP_FOREST} />
            <Text
              style={{
                fontFamily: fonts.bodyRegular,
                fontSize: fontSizes.sm,
                color: EARTH_GREEN,
                marginTop: spacing.sm,
              }}
            >
              Loading weather...
            </Text>
          </View>
        )}

        {/* Error State */}
        {error && (
          <View
            style={{
              backgroundColor: "#FEE2E2",
              borderRadius: radius.md,
              padding: spacing.md,
              marginBottom: spacing.md,
              borderWidth: 1,
              borderColor: "#FCA5A5",
            }}
          >
            <Text
              style={{
                fontFamily: fonts.bodyRegular,
                fontSize: fontSizes.sm,
                color: "#991B1B",
              }}
            >
              {error}
            </Text>
          </View>
        )}

        {/* Current Weather */}
        {weatherData && !isLoading && (
          <>
            <View
              style={{
                backgroundColor: CARD_BACKGROUND_LIGHT,
                borderRadius: radius.md,
                padding: spacing.lg,
                marginBottom: spacing.md,
                alignItems: "center",
                borderWidth: 1,
                borderColor: BORDER_SOFT,
              }}
            >
              <Ionicons name={getWeatherIcon(weatherData.current.condition)} size={64} color={DEEP_FOREST} />

              <Text
                style={{
                  fontFamily: fonts.displayBold,
                  fontSize: 48,
                  color: DEEP_FOREST,
                  marginTop: spacing.sm,
                }}
              >
                {Math.round(weatherData.current.temp)}°
              </Text>

              <Text
                style={{
                  fontFamily: fonts.displayRegular,
                  fontSize: fontSizes.md,
                  color: TEXT_SECONDARY,
                }}
              >
                {weatherData.current.condition}
              </Text>

              {/* Weather Details */}
              <View
                style={{
                  flexDirection: "row",
                  marginTop: spacing.md,
                  gap: spacing.lg,
                }}
              >
                <View style={{ alignItems: "center" }}>
                  <Ionicons name="water-outline" size={20} color={RIVER_ROCK} />
                  <Text
                    style={{
                      fontFamily: fonts.bodySemibold,
                      fontSize: fontSizes.xs,
                      color: DEEP_FOREST,
                      marginTop: spacing.xxs,
                    }}
                  >
                    {weatherData.current.humidity}%
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.bodyRegular,
                      fontSize: fontSizes.xs,
                      color: TEXT_SECONDARY,
                    }}
                  >
                    Humidity
                  </Text>
                </View>

                <View style={{ alignItems: "center" }}>
                  <Ionicons name="speedometer-outline" size={20} color={RIVER_ROCK} />
                  <Text
                    style={{
                      fontFamily: fonts.bodySemibold,
                      fontSize: fontSizes.xs,
                      color: DEEP_FOREST,
                      marginTop: spacing.xxs,
                    }}
                  >
                    {weatherData.current.windSpeed} mph
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.bodyRegular,
                      fontSize: fontSizes.xs,
                      color: TEXT_SECONDARY,
                    }}
                  >
                    Wind
                  </Text>
                </View>

                <View style={{ alignItems: "center" }}>
                  <Ionicons name="thermometer-outline" size={20} color={RIVER_ROCK} />
                  <Text
                    style={{
                      fontFamily: fonts.bodySemibold,
                      fontSize: fontSizes.xs,
                      color: DEEP_FOREST,
                      marginTop: spacing.xxs,
                    }}
                  >
                    {Math.round(weatherData.current.feelsLike)}°
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.bodyRegular,
                      fontSize: fontSizes.xs,
                      color: TEXT_SECONDARY,
                    }}
                  >
                    Feels Like
                  </Text>
                </View>
              </View>
            </View>

            {/* Add to Trip Button */}
            {location && (
              <Pressable
                onPress={() => setShowAddToTripModal(true)}
                style={{
                  backgroundColor: DEEP_FOREST,
                  borderRadius: radius.md,
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.lg,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: spacing.md,
                }}
              >
                <Ionicons name="add-circle" size={20} color={colors.parchment} style={{ marginRight: spacing.xs }} />
                <Text
                  style={{
                    fontFamily: fonts.bodySemibold,
                    fontSize: fontSizes.md,
                    color: colors.parchment,
                  }}
                >
                  Add to Trip
                </Text>
              </Pressable>
            )}

            {/* 5-Day Forecast */}
            <Text
              style={{
                fontFamily: fonts.displaySemibold,
                fontSize: fontSizes.md,
                color: DEEP_FOREST,
                marginBottom: spacing.sm,
              }}
            >
              5-Day Forecast
            </Text>

            {weatherData.forecast.map((day, index) => (
              <View
                key={`${day.day}-${index}`}
                style={{
                  backgroundColor: CARD_BACKGROUND_LIGHT,
                  borderRadius: radius.md,
                  padding: spacing.md,
                  marginBottom: spacing.sm,
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: BORDER_SOFT,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: fonts.displayRegular,
                      fontSize: fontSizes.sm,
                      color: DEEP_FOREST,
                    }}
                  >
                    {day.day}
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.bodyRegular,
                      fontSize: fontSizes.xs,
                      color: TEXT_SECONDARY,
                    }}
                  >
                    {day.condition}
                  </Text>
                </View>

                <View style={{ alignItems: "center", marginRight: spacing.md }}>
                  <Ionicons name={getWeatherIcon(day.condition)} size={32} color={DEEP_FOREST} />
                  {day.precipitation > 0 && (
                    <Text
                      style={{
                        fontFamily: fonts.bodyRegular,
                        fontSize: fontSizes.xs,
                        color: RIVER_ROCK,
                        marginTop: 2,
                      }}
                    >
                      {day.precipitation}%
                    </Text>
                  )}
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <Text
                    style={{
                      fontFamily: fonts.bodySemibold,
                      fontSize: fontSizes.md,
                      color: DEEP_FOREST,
                    }}
                  >
                    {Math.round(day.high)}°
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.bodyRegular,
                      fontSize: fontSizes.sm,
                      color: TEXT_SECONDARY,
                    }}
                  >
                    {Math.round(day.low)}°
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Add to Trip Modal */}
      <Modal
        visible={showAddToTripModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddToTripModal(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "flex-end",
          }}
          onPress={() => setShowAddToTripModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: PARCHMENT,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: spacing.lg,
              maxHeight: "70%",
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: spacing.md,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.displayBold,
                  fontSize: fontSizes.lg,
                  color: DEEP_FOREST,
                }}
              >
                Add to Trip
              </Text>

              <Pressable
                onPress={() => setShowAddToTripModal(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: CARD_BACKGROUND_LIGHT,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="close" size={18} color={DEEP_FOREST} />
              </Pressable>
            </View>

            {/* Location Info */}
            {location && (
              <View
                style={{
                  backgroundColor: CARD_BACKGROUND_LIGHT,
                  borderRadius: radius.md,
                  padding: spacing.md,
                  marginBottom: spacing.md,
                  borderWidth: 1,
                  borderColor: BORDER_SOFT,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="location" size={18} color={RIVER_ROCK} />
                  <Text
                    style={{
                      fontFamily: fonts.displayRegular,
                      fontSize: fontSizes.sm,
                      color: DEEP_FOREST,
                      marginLeft: spacing.xs,
                    }}
                  >
                    {location.name}
                  </Text>
                </View>
              </View>
            )}

            {/* Trips List */}
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {trips.length === 0 ? (
                <View
                  style={{
                    padding: spacing.xl,
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="calendar-outline" size={48} color={EARTH_GREEN} />
                  <Text
                    style={{
                      fontFamily: fonts.displayRegular,
                      fontSize: fontSizes.sm,
                      color: EARTH_GREEN,
                      textAlign: "center",
                      marginTop: spacing.sm,
                    }}
                  >
                    No trips yet. Create a trip first to add this location.
                  </Text>
                </View>
              ) : (
                trips.map((trip: any) => (
                  <Pressable
                    key={trip.id}
                    onPress={() => {
                      // Hook up your "add location to trip" action here.
                      if (__DEV__) {
                        // eslint-disable-next-line no-console
                        console.log("Add location to trip:", trip.name);
                      }
                      setShowAddToTripModal(false);
                    }}
                    style={{
                      backgroundColor: CARD_BACKGROUND_LIGHT,
                      borderRadius: radius.md,
                      padding: spacing.md,
                      marginBottom: spacing.sm,
                      borderWidth: 1,
                      borderColor: BORDER_SOFT,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: fonts.displaySemibold,
                        fontSize: fontSizes.sm,
                        color: DEEP_FOREST,
                        marginBottom: spacing.xxs,
                      }}
                    >
                      {trip.name}
                    </Text>
                    <Text
                      style={{
                        fontFamily: fonts.bodyRegular,
                        fontSize: fontSizes.xs,
                        color: TEXT_SECONDARY,
                      }}
                    >
                      {formatTripRange(trip.startDate, trip.endDate)}
                    </Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
