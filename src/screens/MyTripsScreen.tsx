import React, { useMemo, useState } from "react";
import { View, Text, Pressable, FlatList, Modal, Share, ImageBackground } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useTrips, Trip, useCreateTrip, useDeleteTrip, useUpdateTrip } from "../state/tripsStore";
import { useUserStore } from "../state/userStore";
import PaywallModal from "../components/PaywallModal";
import { useTripsListStore, TripSegment, TripSort } from "../state/tripsListStore";
import { usePlanTabStore } from "../state/planTabStore";
import { useSubscriptionStore } from "../state/subscriptionStore";
import { useUserStatus } from "../utils/authHelper";
import { useAuthStore } from "../state/authStore";
import TripCard from "../components/TripCard";
import AccountButtonHeader from "../components/AccountButtonHeader";
import PlanTopNav from "../components/PlanTopNav";
import CreateTripModal from "../components/CreateTripModal";
import ConfirmationModal from "../components/ConfirmationModal";
import EmptyState from "../components/EmptyState";
import AccountRequiredModal from "../components/AccountRequiredModal";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../components/Select";
import { RootStackParamList } from "../navigation/types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { DEEP_FOREST, EARTH_GREEN, GRANITE_GOLD, RIVER_ROCK, SIERRA_SKY, PARCHMENT, PARCHMENT_BORDER } from "../constants/colors";
import { HERO_IMAGES } from "../constants/images";

// Import Plan tab screens
import ParksBrowseScreen from "./ParksBrowseScreen";
import WeatherScreen from "./WeatherScreen";
import MealsScreen from "./MealsScreen";
import PackingTabScreen from "./PackingTabScreen";

type MyTripsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type PlanTab = "trips" | "parks" | "weather" | "packing" | "meals";

function getStatus(startISO: string, endISO: string): "In Progress" | "Upcoming" | "Completed" {
  const today = new Date();
  const start = new Date(startISO);
  const end = new Date(endISO);
  if (today > end) return "Completed";
  if (today < start) return "Upcoming";
  return "In Progress";
}

function parseStateFromDestination(name?: string): string | null {
  if (!name) return null;
  const m = /,\s*([A-Z]{2})(\s|$)/.exec(name);
  return m ? m[1] : null;
}

function formatShare(trip: Trip) {
  const loc = trip.destination?.name ? ` at ${trip.destination.name}` : "";
  return `${trip.name}${loc}\n${trip.startDate} → ${trip.endDate}`;
}

export default function MyTripsScreen() {
  const nav = useNavigation<MyTripsScreenNavigationProp>();
  const allTrips = useTrips();
  const currentUser = useAuthStore((s) => s.user);
  const { isLoggedIn, isPro, isFree, isGuest } = useUserStatus();
  const insets = useSafeAreaInsets();

  // Filter trips to only show those for the current logged-in user
  // Guest users see no trips
  const trips = useMemo(() => {
    if (!currentUser) return [];
    return allTrips.filter((t) => t.userId === currentUser.id);
  }, [allTrips, currentUser]);

  // Plan section tab state - use shared store
  const activePlanTab = usePlanTabStore((s) => s.activeTab);
  const setActivePlanTab = usePlanTabStore((s) => s.setActiveTab);

  const {
    segment,
    sortBy,
    filters,
    setSegment,
    setSortBy,
    setFilters,
    resetFilters,
    pageBySegment,
    incrementPage,
    resetPaging,
  } = useTripsListStore();

  const [showCreate, setShowCreate] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const hasUsedFreeTrip = useUserStore((s) => s.hasUsedFreeTrip);
  const setHasUsedFreeTrip = useUserStore((s) => s.setHasUsedFreeTrip);
  const [menuTrip, setMenuTrip] = useState<Trip | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Trip | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const deleteTrip = useDeleteTrip();
  const updateTrip = useUpdateTrip();
  const createTrip = useCreateTrip();

  // Find trip in progress (planning or active)
  const tripInProgress = trips.find((t) => {
    const status = getStatus(t.startDate, t.endDate);
    return t.status === "planning" || status === "In Progress";
  });

  // Filter out trip in progress from the rest
  const filtered = useMemo(() => {
    let base = trips.filter((t) => {
      if (tripInProgress && t.id === tripInProgress.id) return false;
      const status = getStatus(t.startDate, t.endDate);
      if (segment === "active") return status === "In Progress" || status === "Upcoming";
      if (segment === "completed") return status === "Completed";
      return true;
    });
    // ...existing filter/sort logic...
    base = base.filter((t) => {
      const s = new Date(t.startDate);
      const e = new Date(t.endDate);
      if (filters.dateFrom) {
        const from = new Date(filters.dateFrom);
        if (e < from) return false;
      }
      if (filters.dateTo) {
        const to = new Date(filters.dateTo);
        if (s > to) return false;
      }
      if (filters.campingStyle && filters.campingStyle !== "any") {
        if (t.campingStyle !== filters.campingStyle) return false;
      }
      if (filters.states && filters.states.length) {
        const st = parseStateFromDestination(t.destination?.name || undefined);
        if (!st || !filters.states.includes(st)) return false;
      }
      return true;
    });
    base.sort((a, b) => {
      if (sortBy === "startSoonest") {
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      } else if (sortBy === "updatedRecent") {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      } else {
        return a.name.localeCompare(b.name);
      }
    });
    return base;
  }, [trips, segment, sortBy, filters, tripInProgress]);

  const page = pageBySegment[segment] || 1;
  const PAGE_SIZE = 20;
  const paged = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = filtered.length > paged.length;

  const onResume = (trip: Trip) => nav.navigate("TripDetail", { tripId: trip.id });
  const onMenu = (trip: Trip) => setMenuTrip(trip);

  const handleCreateTrip = () => {
    // Gate 1: Login required - show AccountRequiredModal
    if (isGuest) {
      setShowAccountModal(true);
      return;
    }

    // Gate 2: Free users get one lifetime trip
    if (isFree) {
      if (hasUsedFreeTrip) {
        setShowProModal(true);
        return;
      }
      if (trips.length >= 1) {
        setShowProModal(true);
        return;
      }
    }

    setShowCreate(true);
  };

  const empty = (
    <View style={{ flex: 1, backgroundColor: '#F4EBD0' }}>
      <EmptyState
        iconName="compass"
        title={isGuest ? "Log in to start planning" : "No active trips"}
        message={isGuest ? "Create an account to plan trips, save parks, and organize your camping adventures." : "Start planning and we will keep your trips here."}
        ctaLabel={isGuest ? "Log In" : "Plan a Trip"}
        onPress={handleCreateTrip}
      />
    </View>
  );

  const bottomSpacer = 50 + Math.max(insets.bottom, 18) + 12;

  // If Parks tab is active, render the Parks screen instead
  if (activePlanTab === "parks") {
    return (
      <View style={{ flex: 1 }}>
        <ParksBrowseScreen onTabChange={setActivePlanTab} />
      </View>
    );
  }

  // If Weather tab is active, render the Weather screen instead
  if (activePlanTab === "weather") {
    return (
      <View style={{ flex: 1 }}>
        <WeatherScreen onTabChange={setActivePlanTab} />
      </View>
    );
  }

  // If Packing tab is active, render the Packing screen
  if (activePlanTab === "packing") {
    return (
      <View style={{ flex: 1 }}>
        <PackingTabScreen onTabChange={setActivePlanTab} />
      </View>
    );
  }

  // If Meals tab is active, render the Meals screen
  if (activePlanTab === "meals") {
    return (
      <View style={{ flex: 1 }}>
        <MealsScreen onTabChange={setActivePlanTab} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-parchment">
      <View className="flex-1">
        {/* Trip in Progress Module */}
        {tripInProgress && (
          <View className="px-4 pt-4 pb-2">
            <Text className="text-lg font-bold mb-2" style={{ fontFamily: 'JosefinSlab_700Bold', color: DEEP_FOREST }}>Trip in Progress</Text>
            <TripCard
              trip={tripInProgress}
              onResume={() => onResume(tripInProgress)}
              onMenu={() => onMenu(tripInProgress)}
              onPackingPress={() => setActivePlanTab("packing")}
              onWeatherPress={() => setActivePlanTab("weather")}
              onMealsPress={() => setActivePlanTab("meals")}
            />
          </View>
        )}

        {/* Plan a New Trip CTA */}
        <View className="px-4 pb-4">
          <Pressable
            onPress={handleCreateTrip}
            className="w-full py-4 rounded-xl bg-forest items-center justify-center mb-2 active:opacity-90"
            accessibilityLabel="Plan a new trip"
            accessibilityRole="button"
          >
            <Text className="text-parchment text-lg font-semibold" style={{ fontFamily: 'SourceSans3_600SemiBold' }}>Plan a new trip</Text>
          </Pressable>
        </View>

        {/* Segments */}
        <View className="px-4 pt-2 pb-2 flex-row gap-2">
          {(["active", "completed", "all"] as TripSegment[]).map((seg) => (
            <Pressable
              key={seg}
              onPress={() => {
                setSegment(seg);
                resetPaging(seg);
              }}
              className={`px-3 py-2 rounded-xl border ${
                segment === seg
                  ? "bg-forest border-[#3a453f]"
                  : "bg-parchment border-parchmentDark"
              }`}
              accessibilityLabel={`View ${seg === "active" ? "active" : seg === "completed" ? "completed" : "all"} trips`}
              accessibilityRole="button"
              accessibilityState={{ selected: segment === seg }}
            >
              <Text
                className={`${segment === seg ? "text-parchment" : "text-forest"} font-semibold text-sm`}
              >
                {seg === "active" ? "Active" : seg === "completed" ? "Completed" : "All"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Sort / Filters */}
        <View className="px-4 pb-2 flex-row gap-2 items-center">
          <View className="flex-1">
            <Select
              value={sortBy}
              onValueChange={(v) => setSortBy(v as TripSort)}
              options={[
                { value: "startSoonest", label: "Start Date (soonest)" },
                { value: "updatedRecent", label: "Recently Updated" },
                { value: "az", label: "A–Z" },
              ]}
            >
              <SelectTrigger aria-label="Sort trips">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="startSoonest">Start Date (soonest)</SelectItem>
                <SelectItem value="updatedRecent">Recently Updated</SelectItem>
                <SelectItem value="az">A–Z</SelectItem>
              </SelectContent>
            </Select>
          </View>
          <Pressable
            onPress={() => setShowFilters(true)}
            className="px-4 py-2 border border-parchmentDark rounded-xl active:opacity-70 flex-row items-center"
            accessibilityLabel="Open filters"
            accessibilityRole="button"
          >
            <Ionicons name="filter" size={16} color={DEEP_FOREST} />
            <Text className="ml-1 text-forest font-semibold text-sm" style={{ fontFamily: "SourceSans3_600SemiBold" }}>Filter</Text>
          </Pressable>
        </View>

        {/* Trips List */}
        <FlatList
          data={paged}
          renderItem={({ item }) => (
            <TripCard
              trip={item}
              onResume={() => onResume(item)}
              onMenu={() => onMenu(item)}
              onPackingPress={() => setActivePlanTab("packing")}
              onWeatherPress={() => setActivePlanTab("weather")}
              onMealsPress={() => setActivePlanTab("meals")}
            />
          )}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomSpacer }}
          ListEmptyComponent={empty}
          ListFooterComponent={
            hasMore ? (
              <Pressable
                onPress={() => incrementPage(segment)}
                className="py-3 items-center active:opacity-70"
              >
                <Text className="text-earthGreen font-semibold" style={{ fontFamily: "SourceSans3_600SemiBold" }}>Load More</Text>
              </Pressable>
            ) : null
          }
        />

        {/* Modals */}
        <CreateTripModal
          visible={showCreate}
          onClose={() => setShowCreate(false)}
          onTripCreated={(tripId) => {
            if (isFree) setHasUsedFreeTrip(true);
            setShowCreate(false);
          }}
        />
        <PaywallModal
          visible={showProModal}
          onClose={() => setShowProModal(false)}
        />

        {/* Account Required Modal */}
        <AccountRequiredModal
          visible={showAccountModal}
          onCreateAccount={() => {
            setShowAccountModal(false);
            nav.navigate("Auth");
          }}
          onMaybeLater={() => setShowAccountModal(false)}
        />

        {/* Menu Modal */}
        <Modal
          visible={!!menuTrip}
          transparent
          animationType="fade"
          onRequestClose={() => setMenuTrip(null)}
        >
          <Pressable
            className="flex-1 bg-black/50 justify-end"
            onPress={() => setMenuTrip(null)}
          >
            <Pressable
              className="bg-parchment rounded-t-2xl p-6"
              onPress={(e) => e.stopPropagation()}
            >
              <Text className="text-xl font-bold mb-4" style={{ fontFamily: "JosefinSlab_700Bold", color: DEEP_FOREST }}>
                {menuTrip?.name}
              </Text>
              <Pressable
                onPress={async () => {
                  if (menuTrip) {
                    await Share.share({ message: formatShare(menuTrip) });
                    setMenuTrip(null);
                  }
                }}
                className="py-3 border-b border-parchmentDark active:opacity-70"
              >
                <Text className="text-base" style={{ fontFamily: "SourceSans3_400Regular", color: DEEP_FOREST }}>Share Trip</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setPendingDelete(menuTrip);
                  setMenuTrip(null);
                }}
                className="py-3 active:opacity-70"
              >
                <Text className="text-base text-red-600" style={{ fontFamily: "SourceSans3_400Regular" }}>Delete Trip</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Delete Confirmation */}
        <ConfirmationModal
          visible={!!pendingDelete}
          title="Delete Trip?"
          message={`Are you sure you want to delete "${pendingDelete?.name}"? This cannot be undone.`}
          primary={{
            label: "Delete",
            onPress: () => {
              if (pendingDelete) deleteTrip(pendingDelete.id);
              setPendingDelete(null);
            },
          }}
          secondary={{
            label: "Cancel",
            onPress: () => setPendingDelete(null),
          }}
          onClose={() => setPendingDelete(null)}
        />

        {/* Filters Modal - placeholder */}
        <Modal
          visible={showFilters}
          transparent
          animationType="fade"
          onRequestClose={() => setShowFilters(false)}
        >
          <Pressable
            className="flex-1 bg-black/50 justify-end"
            onPress={() => setShowFilters(false)}
          >
            <Pressable
              className="bg-parchment rounded-t-2xl p-6"
              onPress={(e) => e.stopPropagation()}
            >
              <Text className="text-xl font-bold mb-4" style={{ fontFamily: "JosefinSlab_700Bold", color: DEEP_FOREST }}>
                Filters
              </Text>
              <Text className="mb-4" style={{ fontFamily: "SourceSans3_400Regular", color: EARTH_GREEN }}>
                Filter options coming soon
              </Text>
              <Pressable
                onPress={() => setShowFilters(false)}
                className="bg-forest rounded-xl py-3 active:opacity-90"
              >
                <Text className="text-center text-parchment font-semibold" style={{ fontFamily: "SourceSans3_600SemiBold" }}>
                  Close
                </Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </View>
  );
}
