import React, { useMemo, useState, useEffect } from "react";
import { View, Text, Pressable, Modal, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useTrips, Trip, useDeleteTrip } from "../state/tripsStore";
import { useUserStore } from "../state/userStore";
import { usePlanTabStore, PlanTab } from "../state/planTabStore";
import { usePackingStore } from "../state/packingStore";
import { useUserStatus } from "../utils/authHelper";
import { requirePro, requireAccount } from "../utils/gating";
import { useAuthStore } from "../state/authStore";
import TripCard from "../components/TripCard";
import CreateTripModal from "../components/CreateTripModal";
import ConfirmationModal from "../components/ConfirmationModal";
import AccountRequiredModal from "../components/AccountRequiredModal";
import { RootStackParamList } from "../navigation/types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { DEEP_FOREST, EARTH_GREEN, GRANITE_GOLD, PARCHMENT, BORDER_SOFT } from "../constants/colors";
import {
  deriveSeasonFromDate,
  mapCampingStyleToTripType,
  calculateTripNights,
  deriveTripTypeFromLength,
} from "../utils/packingTripHelpers";
import * as Haptics from "expo-haptics";
import { format } from "date-fns";

type MyTripsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type MyTripsScreenRouteProp = RouteProp<{ MyTrips: { initialTab?: PlanTab } }, "MyTrips">;

function getStatus(startISO: string, endISO: string): "In Progress" | "Upcoming" | "Completed" {
  const today = new Date();
  const start = new Date(startISO);
  const end = new Date(endISO);
  if (today > end) return "Completed";
  if (today < start) return "Upcoming";
  return "In Progress";
}

function formatDateRange(startISO: string, endISO: string): string {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const startStr = format(start, "MMM d");
  const endStr = format(end, "MMM d, yyyy");
  return `${startStr} – ${endStr}`;
}

export default function MyTripsScreen() {
  const nav = useNavigation<MyTripsScreenNavigationProp>();
  const route = useRoute<MyTripsScreenRouteProp>();
  const allTrips = useTrips();
  const currentUser = useAuthStore((s) => s.user);
  const { isPro, isFree, isGuest } = useUserStatus();
  const insets = useSafeAreaInsets();

  // Handle route params for initialTab
  useEffect(() => {
    if (route.params?.initialTab) {
      setActivePlanTab(route.params.initialTab);
    }
  }, [route.params?.initialTab]);

  // Filter trips to only show those for the current logged-in user
  // Guest users see no trips
  const trips = useMemo(() => {
    if (!currentUser) return [];
    return allTrips.filter((t) => t.userId === currentUser.id);
  }, [allTrips, currentUser]);

  // Plan section tab state - use shared store
  const setActivePlanTab = usePlanTabStore((s) => s.setActiveTab);

  const [showCreate, setShowCreate] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const hasUsedFreeTrip = useUserStore((s) => s.hasUsedFreeTrip);
  const setHasUsedFreeTrip = useUserStore((s) => s.setHasUsedFreeTrip);
  const [menuTrip, setMenuTrip] = useState<Trip | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Trip | null>(null);
  const deleteTrip = useDeleteTrip();

  // Combine all non-completed trips into upcoming, categorize past separately
  const { allUpcomingTrips, pastTrips } = useMemo(() => {
    const upcoming: Trip[] = [];
    const past: Trip[] = [];
    
    trips.forEach((t) => {
      const status = getStatus(t.startDate, t.endDate);
      if (status === "Completed") {
        past.push(t);
      } else {
        // Include planning, in progress, and upcoming
        upcoming.push(t);
      }
    });
    
    // Sort upcoming by start date (soonest first)
    upcoming.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    // Sort past by end date (most recent first)
    past.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
    
    return { allUpcomingTrips: upcoming, pastTrips: past };
  }, [trips]);

  const onResume = (trip: Trip) => nav.navigate("TripDetail", { tripId: trip.id });
  const onMenu = (trip: Trip) => setMenuTrip(trip);

  /**
   * Handle create trip with proper gating (2026-01-01)
   * 
   * Rules:
   * - First trip (tripCount === 0): requiresAccount=true, requiresPro=false
   *   → GUEST sees AccountRequiredModal, FREE/PRO can create
   * - Second+ trip (tripCount >= 1): requiresPro=true
   *   → GUEST or FREE sees PaywallModal, PRO can create
   */
  const handleCreateTrip = () => {
    const tripCount = trips.length;
    
    if (tripCount === 0) {
      // First trip - only requires account (free-tier action)
      const canProceed = requireAccount({
        openAccountModal: () => setShowAccountModal(true),
      });
      if (!canProceed) return;
    } else {
      // Second+ trip - requires Pro (Pro-gated action)
      const canProceed = requirePro({
        openAccountModal: () => setShowAccountModal(true), // Not used for Pro gates
        openPaywallModal: (variant) => nav.navigate("Paywall", { triggerKey: "second_trip", variant }),
      });
      if (!canProceed) return;
    }
    
    setShowCreate(true);
  };

  const handleGuestLogin = () => {
    nav.navigate("Auth");
  };

  // Show empty state if there are no trips at all
  const showEmptyState = allUpcomingTrips.length === 0 && pastTrips.length === 0;

  const bottomSpacer = 50 + Math.max(insets.bottom, 18) + 12;

  // Safe haptic helper
  const safeHaptic = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
  };

  // Navigate to packing list for a specific trip
  const handlePackingPress = (tripId: string) => {
    // Gate: Pro-only feature
    const canProceed = requirePro({
      openAccountModal: () => setShowAccountModal(true),
      openPaywallModal: (variant) => nav.navigate("Paywall", { triggerKey: "packing_list", variant }),
    });
    if (!canProceed) return;

    safeHaptic();
    
    // Check if there's a local packing list for this trip
    const localLists = usePackingStore.getState().packingLists.filter(list => list.tripId === tripId);
    if (localLists.length > 0) {
      // Navigate to local packing list editor
      nav.navigate("PackingListEditor", { listId: localLists[0].id });
      return;
    }
    
    // Otherwise, navigate to create a new packing list (template picker)
    const trip = trips.find(t => t.id === tripId);
    if (trip) {
      const inheritedSeason = deriveSeasonFromDate(trip.startDate);
      const styleBasedType = mapCampingStyleToTripType(trip.campingStyle);
      const nights = calculateTripNights(trip.startDate, trip.endDate);
      const inheritedTripType = styleBasedType ?? deriveTripTypeFromLength(nights);

      nav.navigate("PackingListCreate", {
        tripId,
        tripName: trip.name,
        inheritedSeason,
        inheritedTripType,
      });
    } else {
      nav.navigate("PackingListCreate", { tripId });
    }
  };

  // Navigate to meals for a specific trip
  const handleMealsPress = (tripId: string) => {
    // Gate: Pro-only feature
    const canProceed = requirePro({
      openAccountModal: () => setShowAccountModal(true),
      openPaywallModal: (variant) => nav.navigate("Paywall", { triggerKey: "meal_planner", variant }),
    });
    if (!canProceed) return;

    safeHaptic();
    nav.navigate("MealPlanning", { tripId });
  };

  // Navigate to standalone packing (drafts mode)
  const handleQuickPacking = () => {
    // Gate: Pro-only feature
    const canProceed = requirePro({
      openAccountModal: () => setShowAccountModal(true),
      openPaywallModal: (variant) => nav.navigate("Paywall", { triggerKey: "packing_list", variant }),
    });
    if (!canProceed) return;

    safeHaptic();
    nav.navigate("PackingListCreate");
  };

  // Navigate to standalone meals (meal planner without trip context)
  const handleQuickMeals = () => {
    // Gate: Pro-only feature
    const canProceed = requirePro({
      openAccountModal: () => setShowAccountModal(true),
      openPaywallModal: (variant) => nav.navigate("Paywall", { triggerKey: "meal_planner", variant }),
    });
    if (!canProceed) return;

    safeHaptic();
    // Navigate to meal planning - if user has an upcoming trip, use the first one
    // Otherwise, prompt them to create a trip first
    if (allUpcomingTrips.length > 0) {
      nav.navigate("MealPlanning", { tripId: allUpcomingTrips[0].id });
    } else {
      // No upcoming trip - prompt to create one
      handleCreateTrip();
    }
  };

  // Empty state with quick-start Packing/Meals buttons
  if (showEmptyState) {
    return (
      <View className="flex-1 bg-parchment">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: bottomSpacer }}
          showsVerticalScrollIndicator={false}
        >
          {/* Empty State Hero */}
          <View className="flex-1 items-center justify-center px-6 py-8">
            <View className="w-20 h-20 rounded-full items-center justify-center mb-6" style={{ backgroundColor: DEEP_FOREST + "15" }}>
              <Ionicons name="compass" size={40} color={DEEP_FOREST} />
            </View>
            <Text
              className="text-2xl text-center mb-2"
              style={{ fontFamily: "Raleway_700Bold", color: DEEP_FOREST }}
            >
              {isGuest ? "Log in to start planning" : "No trips planned"}
            </Text>
            <Text
              className="text-base text-center mb-6"
              style={{ fontFamily: "SourceSans3_400Regular", color: EARTH_GREEN }}
            >
              {isGuest 
                ? "Create an account to plan trips, save parks, and organize your camping adventures." 
                : "Your sleeping bag is giving you side-eye."
              }
            </Text>
            
            {/* Primary CTA */}
            <Pressable
              onPress={isGuest ? handleGuestLogin : handleCreateTrip}
              className="w-full py-4 rounded-xl items-center justify-center active:opacity-90"
              style={{ backgroundColor: DEEP_FOREST }}
            >
              <Text
                className="text-base"
                style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}
              >
                {isGuest ? "Log in" : "Plan a new trip"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* Modals */}
        <CreateTripModal
          visible={showCreate}
          onClose={() => setShowCreate(false)}
          onTripCreated={(tripId) => {
            if (isFree) setHasUsedFreeTrip(true);
            setShowCreate(false);
          }}
        />
        <AccountRequiredModal
          visible={showAccountModal}
          triggerKey="create_first_trip"
          onCreateAccount={() => {
            setShowAccountModal(false);
            nav.navigate("Auth");
          }}
          onMaybeLater={() => setShowAccountModal(false)}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-parchment">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: bottomSpacer }}
        showsVerticalScrollIndicator={false}
      >
        {/* Upcoming Trips Section (includes active/in-progress and upcoming) */}
        {allUpcomingTrips.length > 0 && (
          <View className="px-4 pt-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text
                className="text-xs"
                style={{ fontFamily: "SourceSans3_600SemiBold", color: EARTH_GREEN, letterSpacing: 0.5 }}
              >
                UPCOMING TRIPS
              </Text>
              <Pressable
                onPress={handleCreateTrip}
                className="px-3 py-1.5 rounded-lg active:opacity-90"
                style={{ backgroundColor: DEEP_FOREST }}
              >
                <Text
                  className="text-xs"
                  style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}
                >
                  + New trip
                </Text>
              </Pressable>
            </View>
            
            {allUpcomingTrips.map((trip) => (
              <View
                key={trip.id}
                className="rounded-xl p-3 mb-2"
                style={{ backgroundColor: DEEP_FOREST }}
              >
                <View className="flex-row items-start justify-between">
                  <Pressable 
                    onPress={() => onResume(trip)} 
                    className="flex-1 mr-2 active:opacity-70"
                  >
                    <Text
                      className="text-base"
                      style={{ fontFamily: "Raleway_700Bold", color: PARCHMENT }}
                      numberOfLines={1}
                    >
                      {trip.name}
                    </Text>
                    <Text
                      className="text-xs mt-0.5"
                      style={{ fontFamily: "SourceSans3_400Regular", color: "rgba(255,255,255,0.7)" }}
                      numberOfLines={1}
                    >
                      {formatDateRange(trip.startDate, trip.endDate)}
                      {trip.destination?.name ? ` • ${trip.destination.name}` : ""}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => onMenu(trip)}
                    className="p-1.5 rounded-full active:opacity-80"
                    style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                  >
                    <Ionicons name="ellipsis-horizontal" size={16} color={PARCHMENT} />
                  </Pressable>
                </View>

                {/* Compact Packing & Meals Buttons */}
                <View className="flex-row mt-3" style={{ gap: 8 }}>
                  <Pressable
                    onPress={() => handlePackingPress(trip.id)}
                    className="flex-1 flex-row items-center justify-center py-2 rounded-lg active:opacity-90"
                    style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
                  >
                    <Ionicons name="bag" size={16} color={PARCHMENT} />
                    <Text
                      className="text-xs ml-1.5"
                      style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}
                    >
                      Packing
                    </Text>
                    {trip.packing && (
                      <Text
                        className="text-xs ml-1"
                        style={{ fontFamily: "SourceSans3_400Regular", color: "rgba(255,255,255,0.6)" }}
                      >
                        ({trip.packing.itemsChecked}/{trip.packing.totalItems})
                      </Text>
                    )}
                  </Pressable>

                  <Pressable
                    onPress={() => handleMealsPress(trip.id)}
                    className="flex-1 flex-row items-center justify-center py-2 rounded-lg active:opacity-90"
                    style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
                  >
                    <Ionicons name="restaurant" size={16} color={PARCHMENT} />
                    <Text
                      className="text-xs ml-1.5"
                      style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}
                    >
                      Meals
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* New Trip Button when no upcoming trips but have past trips */}
        {allUpcomingTrips.length === 0 && pastTrips.length > 0 && (
          <View className="px-4 pt-4 flex-row justify-end">
            <Pressable
              onPress={handleCreateTrip}
              className="px-3 py-1.5 rounded-lg active:opacity-90"
              style={{ backgroundColor: DEEP_FOREST }}
            >
              <Text
                className="text-xs"
                style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}
              >
                + New trip
              </Text>
            </Pressable>
          </View>
        )}

        {/* Past Trips Section */}
        {pastTrips.length > 0 && (
          <View className="px-4 pt-4">
            <Text
              className="text-xs mb-3"
              style={{ fontFamily: "SourceSans3_600SemiBold", color: EARTH_GREEN, letterSpacing: 0.5 }}
            >
              PAST
            </Text>
            {pastTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onResume={() => onResume(trip)}
                onMenu={() => onMenu(trip)}
                onPackingPress={() => handlePackingPress(trip.id)}
                onWeatherPress={() => onResume(trip)}
                onMealsPress={() => handleMealsPress(trip.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <CreateTripModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onTripCreated={(tripId) => {
          if (isFree) setHasUsedFreeTrip(true);
          setShowCreate(false);
        }}
      />

      {/* Account Required Modal */}
      <AccountRequiredModal
        visible={showAccountModal}
        triggerKey="create_first_trip"
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
              <Text className="text-xl font-bold mb-4" style={{ fontFamily: "Raleway_700Bold", color: DEEP_FOREST }}>
                {menuTrip?.name}
              </Text>
              <Pressable
                onPress={() => {
                  setPendingDelete(menuTrip);
                  setMenuTrip(null);
                }}
                className="py-3 active:opacity-70"
              >
                <Text className="text-base text-red-600" style={{ fontFamily: "SourceSans3_400Regular" }}>Delete trip</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        <ConfirmationModal
          visible={!!pendingDelete}
          title="Delete trip?"
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
    </View>
  );
}
