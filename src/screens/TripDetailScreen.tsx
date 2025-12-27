import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useNavigation,
  useRoute,
  RouteProp,
  useFocusEffect,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTripsStore } from "../state/tripsStore";
import { usePlanTabStore } from "../state/planTabStore";
import { useLocationStore } from "../state/locationStore";
import { useUserStatus } from "../utils/authHelper";
import {
  getTripParticipants,
} from "../services/tripParticipantsService";
import { getCampgroundContactById } from "../services/campgroundContactsService";
import { Heading2, BodyText } from "../components/Typography";
import Button from "../components/Button";
import EditTripModal from "../components/EditTripModal";
import DetailsCard, { DetailsLink } from "../components/DetailsCard";
import EditNotesModal from "../components/EditNotesModal";
import AddLinkModal from "../components/AddLinkModal";
import ItineraryLinksSection from "../components/ItineraryLinksSection";
import WeatherForecastSection from "../components/WeatherForecastSection";
import ItineraryPromptPanel from "../components/ItineraryPromptPanel";
import AddItineraryLinkModal from "../components/AddItineraryLinkModal";
import { CreateItineraryLinkData } from "../types/itinerary";
import { createItineraryLink } from "../services/itineraryLinksService";
import * as WebBrowser from "expo-web-browser";
import { v4 as uuidv4 } from "uuid";
import { updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { RootStackParamList } from "../navigation/types";
import { format } from "date-fns";
import { requirePro } from "../utils/gating";
import AccountRequiredModal from "../components/AccountRequiredModal";
import {
  DEEP_FOREST,
  EARTH_GREEN,
  GRANITE_GOLD,
  PARCHMENT,
  PARCHMENT_BORDER,
} from "../constants/colors";

type TripDetailScreenRouteProp = RouteProp<RootStackParamList, "TripDetail">;
type TripDetailScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "TripDetail"
>;

function normalizeUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

export default function TripDetailScreen() {
  const navigation = useNavigation<TripDetailScreenNavigationProp>();
  const route = useRoute<TripDetailScreenRouteProp>();
  const { tripId, showItineraryPrompt } = route.params;
  const { isGuest } = useUserStatus();

  const trip = useTripsStore((s) => s.getTripById(tripId));
  const setActivePlanTab = usePlanTabStore((s) => s.setActiveTab);
  const setSelectedLocation = useLocationStore((s) => s.setSelectedLocation);

  // Itinerary prompt state (shown after trip creation for PRO users)
  const [showItineraryPromptPanel, setShowItineraryPromptPanel] = useState(showItineraryPrompt || false);
  const [showAddItineraryModal, setShowAddItineraryModal] = useState(false);

  // Mock packing and meal stats (swap with real data later)
  const [packingStats] = useState({ packed: 0, total: 0 });
  const [mealStats] = useState({ planned: 0, total: 0 });

  const [participants, setParticipants] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [showEditTripModal, setShowEditTripModal] = useState(false);

  // Details state
  const [showEditNotes, setShowEditNotes] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [detailsNotes, setDetailsNotes] = useState("");
  const [detailsLinks, setDetailsLinks] = useState<DetailsLink[]>([]);

  // Gating modal state
  const [showAccountModal, setShowAccountModal] = useState(false);

  const startDate = useMemo(() => (trip ? new Date(trip.startDate) : null), [trip]);
  const endDate = useMemo(() => (trip ? new Date(trip.endDate) : null), [trip]);

  const nights = useMemo(() => {
    if (!startDate || !endDate) return 1;
    return Math.max(
      1,
      Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    );
  }, [startDate, endDate]);

  const totalMeals = useMemo(() => nights * 3, [nights]);

  const loadParticipants = useCallback(async () => {
    try {
      setLoadingParticipants(true);
      const participantsData = await getTripParticipants(tripId);

      const resolved = await Promise.all(
        participantsData.map(async (p) => {
          const contact = await getCampgroundContactById(p.campgroundContactId);
          return {
            id: p.id,
            name: contact?.contactName || "Unknown",
          };
        })
      );

      setParticipants(resolved);
    } catch (error) {
      console.error("Error loading participants:", error);
    } finally {
      setLoadingParticipants(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadParticipants();
  }, [loadParticipants]);

  useFocusEffect(
    useCallback(() => {
      loadParticipants();
    }, [loadParticipants])
  );

  useEffect(() => {
    if (!trip) return;
    setDetailsNotes(trip.detailsNotes || "");
    setDetailsLinks(trip.detailsLinks || []);
  }, [trip]);

  const handleOpenPacking = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore
    }
    if (trip) navigation.navigate("PackingList", { tripId: trip.id });
  }, [navigation, trip]);

  const handleOpenMeals = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore
    }
    if (trip) navigation.navigate("MealPlanning", { tripId: trip.id });
  }, [navigation, trip]);

  const handleOpenWeather = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore
    }
    
    // If trip has a saved weather destination, set it as the selected location
    if (trip?.weatherDestination) {
      setSelectedLocation({
        name: trip.weatherDestination.label,
        latitude: trip.weatherDestination.lat,
        longitude: trip.weatherDestination.lon,
      });
    }
    
    setActivePlanTab("weather");
    navigation.goBack();
  }, [navigation, setActivePlanTab, trip, setSelectedLocation]);

  const handleAddPeople = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore
    }
    if (trip) navigation.navigate("AddPeopleToTrip", { tripId: trip.id });
  }, [navigation, trip]);

  // Details handlers
  const handleEditNotes = useCallback(() => {
    // Gate: PRO required to edit trip notes
    if (!requirePro({
      openAccountModal: () => setShowAccountModal(true),
      openPaywallModal: () => navigation.navigate("Paywall"),
    })) {
      return;
    }
    setShowEditNotes(true);
  }, []);

  const handleSaveNotes = useCallback(
    async (newNotes: string) => {
      setDetailsNotes(newNotes);

      if (!trip) return;

      try {
        await updateDoc(doc(db, "trips", trip.id), {
          detailsNotes: newNotes,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.error("Failed to save notes:", err);
        Alert.alert("Error", "Could not save notes.");
      }
    },
    [trip]
  );

  const handleAddLink = useCallback(() => {
    // Gate: PRO required to add links
    if (!requirePro({
      openAccountModal: () => setShowAccountModal(true),
      openPaywallModal: () => navigation.navigate("Paywall"),
    })) {
      return;
    }
    setShowAddLink(true);
  }, []);

  const handleSaveLink = useCallback(
    async (title: string, rawUrl: string) => {
      const url = normalizeUrl(rawUrl);

      let source: DetailsLink["source"] = "other";
      if (url.includes("alltrails.com")) source = "alltrails";
      else if (url.includes("onxmaps.com") || url.includes("onxoffroad.app")) source = "onx";
      else if (url.includes("gaiagps.com")) source = "gaia";
      else if (url.includes("google.com/maps") || url.includes("maps.google.")) source = "google_maps";

      if (detailsLinks.some((l) => l.url === url)) {
        Alert.alert("Duplicate Link", "This link already exists.");
        return;
      }

      const newLink: DetailsLink = {
        id: uuidv4(),
        title: title.trim() || "Link",
        url,
        source,
      };

      const newLinks = [...detailsLinks, newLink];
      setDetailsLinks(newLinks);

      if (!trip) return;

      try {
        await updateDoc(doc(db, "trips", trip.id), {
          detailsLinks: newLinks,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.error("Failed to save link:", err);
        Alert.alert("Error", "Could not save link.");
      }
    },
    [detailsLinks, trip]
  );

  const handleDeleteLink = useCallback(
    async (id: string) => {
      // Gate: PRO required to delete links
      if (!requirePro({
        openAccountModal: () => setShowAccountModal(true),
        openPaywallModal: () => navigation.navigate("Paywall"),
      })) {
        return;
      }

      const newLinks = detailsLinks.filter((l) => l.id !== id);
      setDetailsLinks(newLinks);

      if (!trip) return;

      try {
        await updateDoc(doc(db, "trips", trip.id), {
          detailsLinks: newLinks,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.error("Failed to delete link:", err);
        Alert.alert("Error", "Could not delete link.");
      }
    },
    [detailsLinks, trip]
  );

  const handleOpenLink = useCallback(async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Alert.alert("Could not open link");
    }
  }, []);

  // If trip disappears, leave the screen
  useEffect(() => {
    if (!trip) navigation.goBack();
  }, [trip, navigation]);

  if (!trip || !startDate || !endDate) return null;

  return (
    <SafeAreaView className="flex-1 bg-parchment" edges={["top"]}>
      {/* Header */}
      <View className="px-5 pt-4 pb-3 border-b" style={{ borderColor: "#e7e5e4" }}>
        <View className="flex-row items-center justify-between mb-2">
          <Button
            variant="ghost"
            size="sm"
            icon="arrow-back"
            onPress={() => navigation.goBack()}
            className="mr-2"
          >
            Back
          </Button>

          <Pressable
            onPress={async () => {
              try {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {
                // ignore
              }

              if (isGuest) {
                navigation.navigate("Auth" as any);
                return;
              }
              setShowEditTripModal(true);
            }}
            className="px-3 py-1.5 rounded-lg active:opacity-70 flex-row items-center"
            style={{ backgroundColor: "#f0f9f4", gap: 6 }}
          >
            <Ionicons name="create-outline" size={16} color={DEEP_FOREST} />
            <Text
              className="text-sm"
              style={{ fontFamily: "SourceSans3_600SemiBold", color: DEEP_FOREST }}
            >
              Edit trip
            </Text>
          </Pressable>
        </View>

        <Heading2>{trip.name}</Heading2>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Trip Overview */}
        <View className="py-6">
          {/* Dates */}
          <View className="mb-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="calendar" size={20} color={DEEP_FOREST} />
              <Text
                className="text-base ml-2"
                style={{ fontFamily: "SourceSans3_600SemiBold", color: DEEP_FOREST }}
              >
                Dates
              </Text>
            </View>

            <BodyText>
              {format(startDate, "MMMM d, yyyy")} - {format(endDate, "MMMM d, yyyy")}
            </BodyText>

            <BodyText className="text-earthGreen">
              {nights} {nights === 1 ? "night" : "nights"}
            </BodyText>
          </View>

          {/* Destination - uses tripDestination (new) with fallback to legacy destination */}
          <Pressable 
            className="mb-4"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // If has park destination, go to park detail
              if (trip.tripDestination?.placeId && trip.tripDestination.sourceType === "parks") {
                navigation.navigate("ParkDetail", { parkId: trip.tripDestination.placeId });
              } else if (trip.parkId) {
                // Legacy: use parkId
                navigation.navigate("ParkDetail", { parkId: trip.parkId });
              } else {
                // No destination set - go to Plan > Parks to set one
                setActivePlanTab("parks");
                navigation.goBack();
              }
            }}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <Ionicons name="location" size={20} color={DEEP_FOREST} />
                <Text
                  className="text-base ml-2"
                  style={{ fontFamily: "SourceSans3_600SemiBold", color: DEEP_FOREST }}
                >
                  Destination
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={EARTH_GREEN} />
            </View>

            {/* New tripDestination format */}
            {trip.tripDestination ? (
              <>
                <BodyText style={{ color: EARTH_GREEN }}>
                  {trip.tripDestination.name}
                </BodyText>
                {(trip.tripDestination.city || trip.tripDestination.state) && (
                  <BodyText className="text-earthGreen">
                    {[trip.tripDestination.city, trip.tripDestination.state].filter(Boolean).join(", ")}
                  </BodyText>
                )}
                {trip.tripDestination.parkType && (
                  <Text 
                    className="mt-1"
                    style={{ fontFamily: "SourceSans3_400Regular", fontSize: 12, color: EARTH_GREEN }}
                  >
                    {trip.tripDestination.parkType} • Tap for details
                  </Text>
                )}
              </>
            ) : trip.destination ? (
              /* Legacy destination format fallback */
              <>
                <BodyText style={trip.parkId ? { color: EARTH_GREEN } : undefined}>
                  {trip.destination.name}
                </BodyText>
                {trip.destination.city && trip.destination.state && (
                  <BodyText className="text-earthGreen">
                    {trip.destination.city}, {trip.destination.state}
                  </BodyText>
                )}
                {trip.parkId && (
                  <Text 
                    className="mt-1"
                    style={{ fontFamily: "SourceSans3_400Regular", fontSize: 12, color: EARTH_GREEN }}
                  >
                    Tap for park details, map & reservations
                  </Text>
                )}
              </>
            ) : (
              /* No destination set - prompt to add one */
              <>
                <BodyText style={{ color: EARTH_GREEN }}>
                  Add a destination
                </BodyText>
                <Text 
                  className="mt-1"
                  style={{ fontFamily: "SourceSans3_400Regular", fontSize: 12, color: EARTH_GREEN }}
                >
                  Tap to browse parks or add your campground
                </Text>
              </>
            )}
          </Pressable>

          {/* Party Size */}
          {trip.partySize ? (
            <View className="mb-4">
              <View className="flex-row items-center mb-2">
                <Ionicons name="people" size={20} color={DEEP_FOREST} />
                <Text
                  className="text-base ml-2"
                  style={{ fontFamily: "SourceSans3_600SemiBold", color: DEEP_FOREST }}
                >
                  Party Size
                </Text>
              </View>
              <BodyText>{trip.partySize} people</BodyText>
            </View>
          ) : null}

          {/* People */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <Ionicons name="people-outline" size={20} color={DEEP_FOREST} />
                <Text
                  className="text-base ml-2"
                  style={{ fontFamily: "SourceSans3_600SemiBold", color: DEEP_FOREST }}
                >
                  People
                </Text>
              </View>

              <Pressable onPress={handleAddPeople} className="active:opacity-70">
                <Ionicons name="add-circle" size={24} color={EARTH_GREEN} />
              </Pressable>
            </View>

            {loadingParticipants ? (
              <ActivityIndicator size="small" color={EARTH_GREEN} />
            ) : participants.length === 0 ? (
              <Pressable onPress={handleAddPeople} className="active:opacity-70">
                <BodyText className="text-earthGreen">Add people from your campground</BodyText>
              </Pressable>
            ) : (
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {participants.map((person) => (
                  <View
                    key={person.id}
                    className="px-3 py-1.5 rounded-full border"
                    style={{ backgroundColor: PARCHMENT, borderColor: PARCHMENT_BORDER }}
                  >
                    <Text style={{ fontFamily: "SourceSans3_400Regular", color: DEEP_FOREST }}>
                      {person.name}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Camping Style */}
          {trip.campingStyle ? (
            <View className="mb-4">
              <View className="flex-row items-center mb-2">
                <Ionicons name="bonfire" size={20} color={DEEP_FOREST} />
                <Text
                  className="text-base ml-2"
                  style={{ fontFamily: "SourceSans3_600SemiBold", color: DEEP_FOREST }}
                >
                  Camping Style
                </Text>
              </View>
              <BodyText className="capitalize">
                {trip.campingStyle.replace(/_/g, " ").toLowerCase()}
              </BodyText>
            </View>
          ) : null}

          {/* Notes */}
          {trip.notes ? (
            <View className="mb-4">
              <View className="flex-row items-center mb-2">
                <Ionicons name="document-text" size={20} color={DEEP_FOREST} />
                <Text
                  className="text-base ml-2"
                  style={{ fontFamily: "SourceSans3_600SemiBold", color: DEEP_FOREST }}
                >
                  Notes
                </Text>
              </View>
              <BodyText>{trip.notes}</BodyText>
            </View>
          ) : null}
        </View>

        {/* Trip Planning shortcuts */}
        <View className="pb-6">
          <Text
            className="text-lg mb-4"
            style={{ fontFamily: "Raleway_700Bold", color: DEEP_FOREST }}
          >
            Trip Planning
          </Text>

          {/* Packing */}
          <Pressable
            onPress={handleOpenPacking}
            className="bg-white rounded-xl p-4 mb-3 active:opacity-80"
            style={{ borderWidth: 1, borderColor: "#e7e5e4" }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: DEEP_FOREST }}
                >
                  <Ionicons name="bag-outline" size={20} color={PARCHMENT} />
                </View>

                <View className="flex-1">
                  <Text
                    className="text-base mb-1"
                    style={{ fontFamily: "SourceSans3_600SemiBold", color: DEEP_FOREST }}
                  >
                    Packing List
                  </Text>

                  <Text
                    className="text-sm"
                    style={{ fontFamily: "SourceSans3_400Regular", color: EARTH_GREEN }}
                  >
                    {packingStats.total === 0
                      ? "Start packing for your trip"
                      : `${packingStats.packed} of ${packingStats.total} items packed`}
                  </Text>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={20} color={EARTH_GREEN} />
            </View>
          </Pressable>

          {/* Meals */}
          <Pressable
            onPress={handleOpenMeals}
            className="bg-white rounded-xl p-4 mb-3 active:opacity-80"
            style={{ borderWidth: 1, borderColor: "#e7e5e4" }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: DEEP_FOREST }}
                >
                  <Ionicons name="restaurant-outline" size={20} color={PARCHMENT} />
                </View>

                <View className="flex-1">
                  <Text
                    className="text-base mb-1"
                    style={{ fontFamily: "SourceSans3_600SemiBold", color: DEEP_FOREST }}
                  >
                    Meal Planning
                  </Text>

                  <Text
                    className="text-sm"
                    style={{ fontFamily: "SourceSans3_400Regular", color: EARTH_GREEN }}
                  >
                    {mealStats.planned === 0
                      ? "Plan meals for your trip"
                      : `${mealStats.planned} of ${totalMeals} meals planned`}
                  </Text>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={20} color={EARTH_GREEN} />
            </View>
          </Pressable>

          {/* Weather Forecast */}
          <View className="mb-3">
            {trip.weather && trip.weather.forecast && trip.weather.forecast.length > 0 ? (
              <WeatherForecastSection
                forecast={trip.weather.forecast}
                locationName={trip.weatherDestination?.label || trip.destination?.name || "Unknown location"}
                lastUpdated={trip.weather.lastUpdated}
                onViewMore={handleOpenWeather}
              />
            ) : (
              <Pressable
                onPress={handleOpenWeather}
                className="bg-white rounded-xl p-4 active:opacity-80"
                style={{ borderWidth: 1, borderColor: "#e7e5e4" }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: DEEP_FOREST }}
                    >
                      <Ionicons name="partly-sunny-outline" size={20} color={PARCHMENT} />
                    </View>

                    <View className="flex-1">
                      <Text
                        className="text-base mb-1"
                        style={{ fontFamily: "SourceSans3_600SemiBold", color: DEEP_FOREST }}
                      >
                        Weather Forecast
                      </Text>

                      <Text
                        className="text-sm"
                        style={{ fontFamily: "SourceSans3_400Regular", color: EARTH_GREEN }}
                        numberOfLines={1}
                      >
                        {trip.weatherDestination
                          ? `Check weather for ${trip.weatherDestination.label}`
                          : "Check weather for your location"}
                      </Text>
                    </View>
                  </View>

                  <Ionicons name="chevron-forward" size={20} color={EARTH_GREEN} />
                </View>
              </Pressable>
            )}
          </View>

          {/* Itinerary Links */}
          <View className="mb-3">
            <ItineraryLinksSection
              tripId={tripId}
              tripStartDate={trip.startDate}
              tripEndDate={trip.endDate}
            />
          </View>

          {/* Notes Section */}
          <Pressable
            onPress={handleEditNotes}
            className="bg-white rounded-xl p-4 mb-3 active:opacity-80"
            style={{ borderWidth: 1, borderColor: "#e7e5e4" }}
          >
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: DEEP_FOREST }}
                >
                  <Ionicons name="document-text-outline" size={20} color={PARCHMENT} />
                </View>
                <Text
                  className="text-base"
                  style={{ fontFamily: "SourceSans3_600SemiBold", color: DEEP_FOREST }}
                >
                  Notes
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="create-outline" size={18} color={EARTH_GREEN} />
                <Text
                  className="ml-1 text-sm"
                  style={{ fontFamily: "SourceSans3_600SemiBold", color: EARTH_GREEN }}
                >
                  Edit
                </Text>
              </View>
            </View>
            
            {detailsNotes ? (
              <Text
                className="text-sm"
                style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY, lineHeight: 20 }}
                numberOfLines={4}
              >
                {detailsNotes}
              </Text>
            ) : (
              <Text
                className="text-sm italic"
                style={{ fontFamily: "SourceSans3_400Regular", color: EARTH_GREEN }}
              >
                Add notes (day-by-day plans, reminders, permit info...)
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>

      {/* Edit Notes Modal */}
      <EditNotesModal
        visible={showEditNotes}
        initialValue={detailsNotes}
        onSave={handleSaveNotes}
        onClose={() => setShowEditNotes(false)}
      />

      {/* Edit Trip Modal */}
      <EditTripModal
        visible={showEditTripModal}
        onClose={() => setShowEditTripModal(false)}
        tripId={tripId}
      />

      {/* Gating Modals */}
      <AccountRequiredModal
        visible={showAccountModal}
        onCreateAccount={() => {
          setShowAccountModal(false);
          navigation.navigate("Auth" as any);
        }}
        onMaybeLater={() => setShowAccountModal(false)}
      />

      {/* Itinerary Prompt Panel (shown after trip creation for PRO users) */}
      <ItineraryPromptPanel
        visible={showItineraryPromptPanel}
        onAddItinerary={() => {
          setShowItineraryPromptPanel(false);
          setShowAddItineraryModal(true);
        }}
        onDismiss={() => setShowItineraryPromptPanel(false)}
      />

      {/* Add Itinerary Link Modal */}
      {trip && (
        <AddItineraryLinkModal
          visible={showAddItineraryModal}
          onClose={() => setShowAddItineraryModal(false)}
          onSave={async (data) => {
            // Import and use the service to add the link
            const { addItineraryLink } = await import('../services/itineraryLinksService');
            await addItineraryLink(tripId, data);
          }}
          tripStartDate={trip.startDate}
          tripEndDate={trip.endDate}
        />
      )}
    </SafeAreaView>
  );
}
