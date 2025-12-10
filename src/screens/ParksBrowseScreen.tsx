import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, ImageBackground, ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { collection, query, where, getDocs, limit as firestoreLimit, orderBy } from "firebase/firestore";
import { db } from "../config/firebase";
import { LinearGradient } from "expo-linear-gradient";

// Components
import ParksMap from "../components/ParksMap";
import AccountButtonHeader from "../components/AccountButtonHeader";
import ParkFilterBar, { FilterMode, ParkType, DriveTime } from "../components/ParkFilterBar";
import ParkListItem from "../components/ParkListItem";
import ParkDetailModal from "../components/ParkDetailModal";
import PlanTopNav from "../components/PlanTopNav";
import FireflyLoader from "../components/common/FireflyLoader";

// Types
import { Park } from "../types/camping";
import { RootStackParamList } from "../navigation/types";

// Theme
import { colors, spacing, radius, fonts, fontSizes } from "../theme/theme";
import { DEEP_FOREST, EARTH_GREEN, CARD_BACKGROUND_LIGHT, BORDER_SOFT, TEXT_SECONDARY } from "../constants/colors";
import { HERO_IMAGES } from "../constants/images";

type ParksBrowseScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ParksBrowseScreenProps {
  onTabChange?: (tab: "trips" | "parks" | "weather" | "packing" | "meals") => void;
}

export default function ParksBrowseScreen({ onTabChange }: ParksBrowseScreenProps = {}) {
  const navigation = useNavigation<ParksBrowseScreenNavigationProp>();
  const insets = useSafeAreaInsets();

  console.log("[ParksBrowseScreen] Component rendered");

  // Filter state
  const [mode, setMode] = useState<FilterMode>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [driveTime, setDriveTime] = useState<DriveTime>(2);
  const [parkType, setParkType] = useState<ParkType>("all");
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");

  // Data state
  const [parks, setParks] = useState<Park[]>([]);
  const [allParks, setAllParks] = useState<Park[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPark, setSelectedPark] = useState<Park | null>(null);

  // Calculate distance between two coordinates (Haversine formula) - returns distance in miles
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Radius of the Earth in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Fetch parks based on current filters
  const fetchParks = useCallback(async () => {
    // If we are in "near" mode but still waiting on location, do nothing yet
    if (mode === "near" && !userLocation) {
      console.log("[ParksBrowse] Skipping fetch, waiting for location");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const parksCollection = collection(db, "parks");
      // Simple, index friendly query: get up to 2500 parks
      const q = query(parksCollection, firestoreLimit(2500));
      const querySnapshot = await getDocs(q);

      let fetchedParks: Park[] = [];

      console.log("[ParksBrowse] Firebase returned", querySnapshot.size, "documents");

      querySnapshot.forEach((doc) => {
        const data: any = doc.data();
        fetchedParks.push({
          id: doc.id,
          name: data.name || "",
          filter: data.filter || "national_forest",
          address: data.address || "",
          state: data.state || "",
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
          url: data.url || "",
        });
      });

      // Cache all parks on first load
      if (allParks.length === 0) {
        setAllParks(fetchedParks);
      }

      // Search by name (only if at least 2 characters, but we still fetched everything)
      if (mode === \"search\" && debouncedSearchQuery.trim().length >= 2) {
        const lower = debouncedSearchQuery.toLowerCase();
        fetchedParks = fetchedParks.filter((park) =>
          park.name.toLowerCase().includes(lower)
        );
      }

      // Filter by park type
      if (parkType !== "all") {
        fetchedParks = fetchedParks.filter((park) => park.filter === parkType);
      }

      // "Near me" filtering and sorting by distance, using drive time
      if (mode === "near" && userLocation) {
        const parksWithDistance = fetchedParks.map((park) => ({
          ...park,
          distance: getDistance(
            userLocation.latitude,
            userLocation.longitude,
            park.latitude,
            park.longitude
          ),
        }));

        const maxDistanceMiles = driveTime * 55; // simple mph approximation

        fetchedParks = parksWithDistance
          .filter((p) => p.distance <= maxDistanceMiles)
          .sort((a, b) => a.distance - b.distance);

        console.log(
          "[ParksBrowse] Found",
          fetchedParks.length,
          "parks within",
          driveTime,
          "hours (",
          maxDistanceMiles,
          "mi )"
        );
      }

      console.log("[ParksBrowse] Final parks count:", fetchedParks.length);
      setParks(fetchedParks);
    } catch (err: any) {
      console.error("Error fetching parks:", err?.code, err?.message, err);
      setError("Failed to load parks. Please try again.");
      setParks([]);
    } finally {
      setIsLoading(false);
    }
  }, [mode, debouncedSearchQuery, userLocation, driveTime, parkType, allParks.length]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch parks when filters change
  useEffect(() => {
    fetchParks();
  }, [fetchParks]);

  // Log loading state changes
  useEffect(() => {
    console.log("[ParksBrowseScreen] Loading state changed - isLoading:", isLoading);
  }, [isLoading]);

  const handleModeChange = (newMode: FilterMode) => {
    console.log("[ParksBrowseScreen] Mode changed to:", newMode);
    setMode(newMode);
    setSearchQuery("");
    setError(null);
  };

  const handleLocationRequest = (location: { latitude: number; longitude: number }) => {
    console.log("[ParksBrowseScreen] Location received:", location);
    setUserLocation(location);
  };

  const handleLocationError = (errorMsg: string) => {
    console.log("[ParksBrowseScreen] Location error:", errorMsg);
    setError(errorMsg);
  };

  const handleParkPress = (park: Park) => {
    setSelectedPark(park);
  };

  const handleAddCampground = () => {
    console.log("Add campground pressed – opens campground creation flow in full app.");
    // In full app, this would open a modal to add custom campground directly to a trip
  };

  const showEmptyState = !isLoading && parks.length === 0;
  const showLocationPrompt = mode === "near" && !userLocation && !isLoading;

  return (
    <View style={styles.root}>
      {/* Main Content */}
      <View style={{ flex: 1, backgroundColor: colors.parchment }}>
        {/* Hero Image Header - Full Bleed */}
        <ImageBackground
        source={HERO_IMAGES.HEADER}
        style={{
          width: "100%",
          height: 150 + insets.top,
        }}
        resizeMode="cover"
      >
        <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
          {/* Account Button - Top Right */}
          <AccountButtonHeader color={colors.parchment} />

          <View
            style={{
              flex: 1,
              justifyContent: "flex-end",
              paddingHorizontal: spacing.lg,
              paddingBottom: spacing.md,
            }}
          >
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.4)"]}
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 80,
              }}
            />
            <Text
              style={{
                fontFamily: fonts.displayBold,
                fontSize: fontSizes.lg,
                color: colors.parchment,
                textShadowColor: "rgba(0, 0, 0, 0.5)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
                zIndex: 1,
              }}
            >
              Find a place to camp
            </Text>
          </View>
        </SafeAreaView>
      </ImageBackground>

      {/* Top Navigation */}
      <PlanTopNav activeTab="parks" onTabChange={onTabChange} />

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
          {/* Filter Bar */}
          <ParkFilterBar
            mode={mode}
            onModeChange={handleModeChange}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            driveTime={driveTime}
            onDriveTimeChange={setDriveTime}
            parkType={parkType}
            onParkTypeChange={setParkType}
            onLocationRequest={handleLocationRequest}
            onLocationError={handleLocationError}
          />

          {/* View Mode Toggle - Map/List */}
          <View
            style={{
              flexDirection: "row",
              gap: spacing.xs,
              marginBottom: spacing.md,
            }}
          >
            <Pressable
              onPress={() => setViewMode("map")}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: spacing.sm,
                borderRadius: radius.md,
                backgroundColor: viewMode === "map" ? DEEP_FOREST : CARD_BACKGROUND_LIGHT,
                borderWidth: 1,
                borderColor: viewMode === "map" ? DEEP_FOREST : BORDER_SOFT,
              }}
            >
              <Ionicons
                name="map"
                size={18}
                color={viewMode === "map" ? colors.parchment : EARTH_GREEN}
              />
              <Text
                style={{
                  fontFamily: fonts.bodySemibold,
                  fontSize: fontSizes.sm,
                  color: viewMode === "map" ? colors.parchment : EARTH_GREEN,
                  marginLeft: spacing.xs,
                }}
              >
                Map
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setViewMode("list")}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: spacing.sm,
                borderRadius: radius.md,
                backgroundColor: viewMode === "list" ? DEEP_FOREST : CARD_BACKGROUND_LIGHT,
                borderWidth: 1,
                borderColor: viewMode === "list" ? DEEP_FOREST : BORDER_SOFT,
              }}
            >
              <Ionicons
                name="list"
                size={18}
                color={viewMode === "list" ? colors.parchment : EARTH_GREEN}
              />
              <Text
                style={{
                  fontFamily: fonts.bodySemibold,
                  fontSize: fontSizes.sm,
                  color: viewMode === "list" ? colors.parchment : EARTH_GREEN,
                  marginLeft: spacing.xs,
                }}
              >
                List
              </Text>
            </Pressable>
          </View>

          {/* Error Message */}
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

          {/* Location Prompt for Near Me Mode */}
          {showLocationPrompt && (
            <View
              style={{
                backgroundColor: CARD_BACKGROUND_LIGHT,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: BORDER_SOFT,
                padding: spacing.lg,
                marginBottom: spacing.md,
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: DEEP_FOREST + "15",
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
                Enable location
              </Text>
              <Text
                style={{
                  fontFamily: fonts.bodyRegular,
                  fontSize: fontSizes.sm,
                  color: EARTH_GREEN,
                  textAlign: "center",
                }}
              >
                Tap the button above to use your location and find nearby parks.
              </Text>
            </View>
          )}

          {/* Map - only show in map view mode */}
          {viewMode === "map" && !showLocationPrompt && (mode !== "near" || userLocation) && (
            <View style={{ marginBottom: spacing.md }}>
              <ParksMap parks={parks} userLocation={userLocation} mode={mode} onParkPress={handleParkPress} />
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
                Loading parks...
              </Text>
            </View>
          )}

          {/* Park List - show in list view mode or below map in map view mode */}
          {!isLoading && parks.length > 0 && (
            <View>
              <Text
                style={{
                  fontFamily: fonts.displaySemibold,
                  fontSize: fontSizes.md,
                  color: DEEP_FOREST,
                  marginBottom: spacing.sm,
                }}
              >
                {parks.length} {parks.length === 1 ? "park" : "parks"} found
              </Text>
              {parks.map((park, index) => (
                <ParkListItem key={park.id} park={park} onPress={handleParkPress} index={index} />
              ))}
            </View>
          )}

          {/* Empty State */}
          {showEmptyState && !showLocationPrompt && (
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
                  backgroundColor: DEEP_FOREST + "15",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: spacing.sm,
                }}
              >
                <Ionicons name="search-outline" size={30} color={DEEP_FOREST} />
              </View>
              <Text
                style={{
                  fontFamily: fonts.displayRegular,
                  fontSize: fontSizes.md,
                  color: DEEP_FOREST,
                  marginBottom: spacing.xs,
                }}
              >
                No parks found
              </Text>
              <Text
                style={{
                  fontFamily: fonts.bodyRegular,
                  fontSize: fontSizes.sm,
                  color: EARTH_GREEN,
                  textAlign: "center",
                }}
              >
                Try adjusting your filters or increasing your drive time.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Park Detail Modal */}
        <ParkDetailModal
          visible={!!selectedPark}
          park={selectedPark}
          onClose={() => setSelectedPark(null)}
          onAddToTrip={(park, tripId) => {
            if (tripId) {
              // Add to existing trip
              console.log("Add park to existing trip:", park.name, "Trip ID:", tripId);
              // TODO: Implement adding park to existing trip
              setSelectedPark(null);
            } else {
              // Create new trip with this park
              console.log("Create new trip with park:", park.name);
              setSelectedPark(null);
              // Navigate to CreateTrip with park data
              navigation.navigate("CreateTrip");
            }
          }}
          onCheckWeather={(park) => {
            console.log("Check weather for park:", park.name);
            setSelectedPark(null);
            // Switch to weather tab
            if (onTabChange) {
              onTabChange("weather");
            }
          }}
        />
      </View>

      {/* Show loader when parks are loading */}
      {isLoading && (
        <View style={styles.loaderOverlay}>
          <FireflyLoader />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'relative',
    backgroundColor: colors.parchment,
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 1000,
    pointerEvents: 'none',
  },
});
