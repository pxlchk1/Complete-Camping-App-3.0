/**
 * Parks Browse Screen
 * Plan > Campgrounds tab
 *
 * Notes:
 * - This file was broken by logs inserted before imports, duplicate React imports, and a hook call outside the component.
 * - This version is a full, safe overwrite that restores valid structure and keeps your existing UI intent.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  collection,
  doc,
  getDocs,
  limit as firestoreLimit,
  serverTimestamp,
  setDoc,
  query,
} from "firebase/firestore";

import { db } from "../config/firebase";
import { useTripsStore } from "../state/tripsStore";
import { useUserStore } from "../state/userStore";

// Components
import ParksMap from "../components/ParksMap";
import ParkFilterBar, { FilterMode, ParkType, DriveTime } from "../components/ParkFilterBar";
import ParkListItem from "../components/ParkListItem";
import ParkDetailModal from "../components/ParkDetailModal";
import FireflyLoader from "../components/common/FireflyLoader";

// Types
import { Park } from "../types/camping";
import { RootStackParamList } from "../navigation/types";

// Theme
import { colors, spacing, radius, fonts, fontSizes } from "../theme/theme";
import {
  DEEP_FOREST,
  EARTH_GREEN,
  GRANITE_GOLD,
  CARD_BACKGROUND_LIGHT,
  BORDER_SOFT,
  TEXT_SECONDARY,
} from "../constants/colors";

type ParksBrowseScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ParksBrowseScreenProps {
  onTabChange?: (tab: "trips" | "parks" | "weather" | "packing" | "meals") => void;
}

type LatLng = { latitude: number; longitude: number };

export default function ParksBrowseScreen({ onTabChange }: ParksBrowseScreenProps) {
  console.log("[PLAN_TRACE] Enter ParksBrowseScreen");

  useEffect(() => {
    console.log("[PLAN_TRACE] ParksBrowseScreen mounted");
  }, []);

  const navigation = useNavigation<ParksBrowseScreenNavigationProp>();

  // Filters and view mode
  const [mode, setMode] = useState<FilterMode>("near");
  const [searchQuery, setSearchQuery] = useState("");
  const [driveTime, setDriveTime] = useState<DriveTime>(2 as DriveTime);
  const [parkType, setParkType] = useState<ParkType>("all" as ParkType);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");

  // Data and UI state
  const [parks, setParks] = useState<Park[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPark, setSelectedPark] = useState<Park | null>(null);

  // Add campground + add to trip flow
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [showAddToTrip, setShowAddToTrip] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  const [newCampgroundName, setNewCampgroundName] = useState("");
  const [newCampgroundAddress, setNewCampgroundAddress] = useState("");
  const [newCampgroundNotes, setNewCampgroundNotes] = useState("");

  const trips = useTripsStore((s) => s.trips);
  const updateTrip = useTripsStore((s) => s.updateTrip);
  const currentUser = useUserStore((s) => s.currentUser);

  // Haversine distance in miles
  const getDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959;
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
  }, []);

  const maxDistanceMiles = useMemo(() => {
    // mph approximation
    return Number(driveTime) * 55;
  }, [driveTime]);

  const fetchParks = useCallback(async () => {
    // Only fetch after user has initiated search or location flow
    if (!hasSearched) {
      console.log("[ParksBrowse] Waiting for user to initiate search");
      return;
    }

    if (mode === "near" && !userLocation) {
      console.log("[ParksBrowse] Near mode requires location");
      return;
    }

    if (mode === "search" && searchQuery.trim().length < 2) {
      console.log("[ParksBrowse] Search query too short");
      setParks([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const parksCollection = collection(db, "parks");
      const q = query(parksCollection, firestoreLimit(3000));
      const querySnapshot = await getDocs(q);

      console.log("[ParksBrowse] Firebase returned", querySnapshot.size, "documents");

      let fetched: (Park & { distance?: number })[] = [];

      querySnapshot.forEach((d) => {
        const data: any = d.data();
        fetched.push({
          id: d.id,
          name: data.name || "",
          filter: data.filter || "national_forest",
          address: data.address || "",
          state: data.state || "",
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
          url: data.url || "",
        });
      });

      // Search by name or state
      if (mode === "search" && searchQuery.trim().length >= 2) {
        const lower = searchQuery.toLowerCase();
        fetched = fetched.filter((p) => p.name.toLowerCase().includes(lower) || p.state.toLowerCase().includes(lower));
      }

      // Filter by park type
      if (parkType !== ("all" as any)) {
        fetched = fetched.filter((p) => p.filter === parkType);
      }

      // Near me filter and sort by distance
      if (mode === "near" && userLocation) {
        fetched = fetched
          .map((p) => ({
            ...p,
            distance: getDistance(userLocation.latitude, userLocation.longitude, p.latitude, p.longitude),
          }))
          .filter((p) => (p.distance ?? 999999) <= maxDistanceMiles)
          .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));

        console.log("[ParksBrowse] Found", fetched.length, "parks within", driveTime, "hours (", maxDistanceMiles, "mi )");
      }

      console.log("[ParksBrowse] Final parks count:", fetched.length);
      setParks(fetched);
    } catch (err: any) {
      console.error("Error fetching parks:", err?.code, err?.message, err);
      setError("Failed to load parks. Please check your connection and try again.");
      setParks([]);
    } finally {
      setIsLoading(false);
    }
  }, [hasSearched, mode, searchQuery, userLocation, driveTime, parkType, maxDistanceMiles, getDistance]);

  useEffect(() => {
    fetchParks();
  }, [fetchParks]);

  useEffect(() => {
    console.log("[ParksBrowseScreen] Loading state changed, isLoading:", isLoading);
  }, [isLoading]);

  const handleModeChange = (newMode: FilterMode) => {
    console.log("[ParksBrowseScreen] Mode changed to:", newMode);

    if (newMode !== mode) {
      setMode(newMode);
      setSearchQuery("");
      setError(null);
      setParks([]);
      setHasSearched(false);
    }
  };

  const handleLocationRequest = (location: LatLng) => {
    console.log("[ParksBrowseScreen] Location received:", location);
    setUserLocation(location);
    setHasSearched(true);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim().length >= 2) setHasSearched(true);
  };

  const handleLocationError = (errorMsg: string) => {
    console.log("[ParksBrowseScreen] Location error:", errorMsg);
    setError(errorMsg);
  };

  const handleParkPress = (park: Park) => setSelectedPark(park);

  const handleAddCampground = () => setAddModalVisible(true);

  const handleSaveCampground = async () => {
    if (!currentUser) {
      Alert.alert("Sign in required", "You must be logged in to save a campground.");
      return;
    }
    if (!newCampgroundName.trim()) {
      Alert.alert("Missing name", "Campground name is required.");
      return;
    }

    try {
      const campgroundId = `${currentUser.id}_${Date.now()}`;
      const campgroundData = {
        id: campgroundId,
        name: newCampgroundName.trim(),
        address: newCampgroundAddress.trim(),
        notes: newCampgroundNotes.trim(),
        createdBy: currentUser.id,
        createdAt: serverTimestamp(),
        isCustom: true,
      };

      await setDoc(doc(db, "users", currentUser.id, "favorites", campgroundId), campgroundData);

      setAddModalVisible(false);
      setShowAddToTrip(true);

      // Clear inputs after saving
      setNewCampgroundName("");
      setNewCampgroundAddress("");
      setNewCampgroundNotes("");

      Alert.alert("Saved", "Campground saved to your favorites! Now add it to a trip.");
    } catch (err) {
      console.error("Error saving campground:", err);
      Alert.alert("Save failed", "Failed to save campground. Please try again.");
    }
  };

  const handleConfirmAddToTrip = async () => {
    if (!currentUser) return;
    if (!selectedTripId) return;

    try {
      const trip = trips.find((t: any) => t.id === selectedTripId);
      if (!trip) return;

      const nowId = `${currentUser.id}_${Date.now()}`;
      const newItem = { id: nowId, name: newCampgroundName.trim() || "Custom campground" };

      const updatedCampgrounds = Array.isArray((trip as any).customCampgrounds)
        ? [...(trip as any).customCampgrounds, newItem]
        : [newItem];

      updateTrip((trip as any).id, { customCampgrounds: updatedCampgrounds } as any);

      setShowAddToTrip(false);
      setSelectedTripId(null);

      Alert.alert("Added", "Campground added to your trip!");
    } catch (err) {
      console.error("Error adding campground to trip:", err);
      Alert.alert("Add failed", "Failed to add campground to trip. Please try again.");
    }
  };

  const showEmptyState = !isLoading && parks.length === 0 && hasSearched;
  const showLocationPrompt = mode === "near" && !userLocation && !isLoading;
  const showInitialState = !hasSearched && !isLoading && parks.length === 0;

  return (
    <View style={styles.root}>
      {/* Add to Trip Modal */}
      <Modal
        visible={showAddToTrip}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddToTrip(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Campground to a Trip</Text>

            {trips.length === 0 ? (
              <Text style={{ marginBottom: 20, color: "#111" }}>You have no trips. Create a trip first.</Text>
            ) : (
              <>
                <Text style={{ marginBottom: 8, color: "#111" }}>Select a trip:</Text>

                {trips.map((trip: any) => (
                  <TouchableOpacity
                    key={trip.id}
                    onPress={() => setSelectedTripId(trip.id)}
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      backgroundColor: selectedTripId === trip.id ? DEEP_FOREST : CARD_BACKGROUND_LIGHT,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: BORDER_SOFT,
                    }}
                  >
                    <Text
                      style={{
                        color: selectedTripId === trip.id ? "#fff" : DEEP_FOREST,
                        fontFamily: fonts.bodySemibold,
                      }}
                    >
                      {trip.name}
                    </Text>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  onPress={handleConfirmAddToTrip}
                  style={{
                    backgroundColor: DEEP_FOREST,
                    borderRadius: 8,
                    padding: 12,
                    marginTop: 12,
                    alignItems: "center",
                    opacity: selectedTripId ? 1 : 0.5,
                  }}
                  disabled={!selectedTripId}
                >
                  <Text style={{ color: "#fff", fontFamily: fonts.bodySemibold }}>Add to Trip</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setShowAddToTrip(false)} style={{ padding: 10, marginTop: 8 }}>
                  <Text style={{ color: DEEP_FOREST, fontFamily: fonts.bodySemibold }}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Add Campground Modal */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Your Own Campground</Text>

            <TextInput
              placeholder="Campground Name"
              value={newCampgroundName}
              onChangeText={setNewCampgroundName}
              style={styles.input}
              placeholderTextColor="#777"
            />
            <TextInput
              placeholder="Address (optional)"
              value={newCampgroundAddress}
              onChangeText={setNewCampgroundAddress}
              style={styles.input}
              placeholderTextColor="#777"
            />
            <TextInput
              placeholder="Notes (optional)"
              value={newCampgroundNotes}
              onChangeText={setNewCampgroundNotes}
              style={[styles.input, { minHeight: 70 }]}
              placeholderTextColor="#777"
              multiline
            />

            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12 }}>
              <TouchableOpacity onPress={() => setAddModalVisible(false)} style={{ padding: 10 }}>
                <Text style={{ color: DEEP_FOREST, fontFamily: fonts.bodySemibold }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveCampground}
                style={{ backgroundColor: DEEP_FOREST, borderRadius: 8, padding: 10, paddingHorizontal: 18 }}
              >
                <Text style={{ color: "#fff", fontFamily: fonts.bodySemibold }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Main Content */}
      <View style={{ flex: 1, backgroundColor: colors.parchment }}>
        {/* Add Campground Button */}
        <View style={{ alignItems: "center", marginTop: spacing.md, marginBottom: spacing.sm }}>
          <TouchableOpacity
            onPress={handleAddCampground}
            style={{ backgroundColor: DEEP_FOREST, borderRadius: 24, paddingVertical: 12, paddingHorizontal: 28 }}
          >
            <Text style={{ color: "#fff", fontFamily: fonts.bodySemibold, fontSize: 16 }}>
              + Add your own campground
            </Text>
          </TouchableOpacity>
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
          {/* Filter Bar */}
          <ParkFilterBar
            mode={mode}
            onModeChange={handleModeChange}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchSubmit={handleSearchSubmit}
            driveTime={driveTime}
            onDriveTimeChange={setDriveTime}
            parkType={parkType}
            onParkTypeChange={setParkType}
            onLocationRequest={handleLocationRequest}
            onLocationError={handleLocationError}
          />

          {/* View Mode Toggle */}
          <View style={{ flexDirection: "row", gap: spacing.xs, marginBottom: spacing.md }}>
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
              <Ionicons name="map" size={18} color={viewMode === "map" ? colors.parchment : EARTH_GREEN} />
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
              <Ionicons name="list" size={18} color={viewMode === "list" ? colors.parchment : EARTH_GREEN} />
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

          {/* Error */}
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
              <Text style={{ fontFamily: fonts.bodyRegular, fontSize: fontSizes.sm, color: "#991B1B" }}>
                {error}
              </Text>
            </View>
          )}

          {/* Location prompt */}
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

          {/* Initial state */}
          {showInitialState && (
            <View
              style={{
                backgroundColor: CARD_BACKGROUND_LIGHT,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: BORDER_SOFT,
                padding: spacing.xl,
                alignItems: "center",
                marginTop: spacing.xl,
              }}
            >
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: `${DEEP_FOREST}15`,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: spacing.md,
                }}
              >
                <Ionicons name="compass-outline" size={40} color={DEEP_FOREST} />
              </View>
              <Text
                style={{
                  fontFamily: fonts.displayBold,
                  fontSize: 20,
                  color: DEEP_FOREST,
                  marginBottom: spacing.sm,
                  textAlign: "center",
                }}
              >
                Discover Your Next Adventure
              </Text>
              <Text
                style={{
                  fontFamily: fonts.bodyRegular,
                  fontSize: 16,
                  color: EARTH_GREEN,
                  textAlign: "center",
                  marginBottom: spacing.md,
                }}
              >
                {mode === "near"
                  ? "Tap 'Near me' above to find parks and campgrounds nearby"
                  : "Enter a park name or location to start searching"}
              </Text>

              <View style={{ flexDirection: "row", gap: spacing.xs, flexWrap: "wrap", justifyContent: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="location" size={16} color={GRANITE_GOLD} />
                  <Text style={{ fontFamily: fonts.bodyRegular, fontSize: fontSizes.sm, color: TEXT_SECONDARY, marginLeft: 4 }}>
                    Find nearby
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="search" size={16} color={GRANITE_GOLD} />
                  <Text style={{ fontFamily: fonts.bodyRegular, fontSize: fontSizes.sm, color: TEXT_SECONDARY, marginLeft: 4 }}>
                    Search by name
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="filter" size={16} color={GRANITE_GOLD} />
                  <Text style={{ fontFamily: fonts.bodyRegular, fontSize: fontSizes.sm, color: TEXT_SECONDARY, marginLeft: 4 }}>
                    Filter by type
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Map */}
          {viewMode === "map" && !showLocationPrompt && !showInitialState && (mode !== "near" || userLocation) && (
            <View style={{ marginBottom: spacing.md }}>
              <ParksMap parks={parks} userLocation={userLocation} mode={mode} onParkPress={handleParkPress} />
            </View>
          )}

          {/* List */}
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

          {/* Empty */}
          {showEmptyState && !showLocationPrompt && !showInitialState && (
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
                <Ionicons name="search-outline" size={30} color={DEEP_FOREST} />
              </View>
              <Text
                style={{
                  fontFamily: fonts.displaySemibold,
                  fontSize: fontSizes.lg,
                  color: DEEP_FOREST,
                  marginBottom: spacing.xs,
                }}
              >
                No parks found
              </Text>
              <Text
                style={{
                  fontFamily: fonts.bodyRegular,
                  fontSize: fontSizes.md,
                  color: EARTH_GREEN,
                  textAlign: "center",
                  marginBottom: spacing.sm,
                }}
              >
                {mode === "near"
                  ? "Try increasing your drive time or changing the park type filter."
                  : "Try a different search term or adjust your filters."}
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
              console.log("Add park to existing trip:", park.name, "Trip ID:", tripId);
              setSelectedPark(null);
            } else {
              console.log("Create new trip with park:", park.name);
              setSelectedPark(null);
              navigation.navigate("CreateTrip" as never);
            }
          }}
          onCheckWeather={(park) => {
            console.log("Check weather for park:", park.name);
            setSelectedPark(null);
            if (onTabChange) onTabChange("weather");
          }}
        />
      </View>

      {/* Loader overlay */}
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
    position: "relative",
    backgroundColor: colors.parchment,
  },
  loaderOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    elevation: 1000,
    pointerEvents: "none",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    borderWidth: 1,
    borderColor: BORDER_SOFT,
  },
  modalTitle: {
    fontFamily: fonts.bodySemibold,
    fontSize: 20,
    marginBottom: 16,
    color: "#111",
  },
  input: {
    borderWidth: 1,
    borderColor: BORDER_SOFT,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    color: "#111",
  },
});
