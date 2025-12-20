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
import { useUserStatus } from "../utils/authHelper";
import {
  getTripParticipants,
  updateParticipantRole,
} from "../services/tripParticipantsService";
import { getCampgroundContactById } from "../services/campgroundContactsService";
import { ParticipantRole } from "../types/campground";
import { Heading2, BodyText } from "../components/Typography";
import Button from "../components/Button";
import EditTripModal from "../components/EditTripModal";
import DetailsCard, { DetailsLink } from "../components/DetailsCard";
import EditNotesModal from "../components/EditNotesModal";
import AddLinkModal from "../components/AddLinkModal";
import * as WebBrowser from "expo-web-browser";
import { v4 as uuidv4 } from "uuid";
import { updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { RootStackParamList } from "../navigation/types";
import { format } from "date-fns";
import {
  DEEP_FOREST,
  EARTH_GREEN,
  GRANITE_GOLD,
  PARCHMENT,
  PARCHMENT_BORDER,
  CARD_BACKGROUND_LIGHT,
  BORDER_SOFT,
  TEXT_PRIMARY_STRONG,
  TEXT_SECONDARY,
} from "../constants/colors";

type TripDetailScreenRouteProp = RouteProp<RootStackParamList, "TripDetail">;
type TripDetailScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "TripDetail"
>;

const ROLE_OPTIONS: { value: ParticipantRole; label: string }[] = [
  { value: "guest", label: "Guest" },
  { value: "host", label: "Host" },
  { value: "co_host", label: "Co-host" },
  { value: "kid", label: "Kid" },
  { value: "pet", label: "Pet" },
  { value: "other", label: "Other" },
];

const getRoleLabel = (role: ParticipantRole): string => {
  const option = ROLE_OPTIONS.find((r) => r.value === role);
  return option?.label || role;
};

function normalizeUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

export default function TripDetailScreen() {
  const navigation = useNavigation<TripDetailScreenNavigationProp>();
  const route = useRoute<TripDetailScreenRouteProp>();
  const { tripId } = route.params;
  const { isGuest } = useUserStatus();

  const trip = useTripsStore((s) => s.getTripById(tripId));
  const setActivePlanTab = usePlanTabStore((s) => s.setActiveTab);

  // Mock packing and meal stats (swap with real data later)
  const [packingStats] = useState({ packed: 0, total: 0 });
  const [mealStats] = useState({ planned: 0, total: 0 });

  const [participants, setParticipants] = useState<
    Array<{ id: string; name: string; role: ParticipantRole }>
  >([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<{
    id: string;
    name: string;
    role: ParticipantRole;
  } | null>(null);
  const [savingRole, setSavingRole] = useState(false);
  const [showEditTripModal, setShowEditTripModal] = useState(false);

  // Details state
  const [showEditNotes, setShowEditNotes] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [detailsNotes, setDetailsNotes] = useState("");
  const [detailsLinks, setDetailsLinks] = useState<DetailsLink[]>([]);

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
            role: p.role,
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
    setActivePlanTab("weather");
    navigation.goBack();
  }, [navigation, setActivePlanTab]);

  const handleAddPeople = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore
    }
    if (trip) navigation.navigate("AddPeopleToTrip", { tripId: trip.id });
  }, [navigation, trip]);

  const handleEditRole = useCallback(
    async (participant: { id: string; name: string; role: ParticipantRole }) => {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // ignore
      }
      setEditingParticipant(participant);
    },
    []
  );

  const handleSaveRole = useCallback(
    async (newRole: ParticipantRole) => {
      if (!editingParticipant) return;

      try {
        setSavingRole(true);
        await updateParticipantRole(tripId, editingParticipant.id, newRole);
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
          // ignore
        }
        setEditingParticipant(null);
        await loadParticipants();
      } catch (error: any) {
        console.error("Error updating role:", error);
        Alert.alert("Error", "Failed to update role");
      } finally {
        setSavingRole(false);
      }
    },
    [editingParticipant, tripId, loadParticipants]
  );

  // Details handlers
  const handleEditNotes = useCallback(() => {
    // If you want this gated, do it here. Right now, notes are not gated.
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
              Edit Trip
            </Text>
          </Pressable>
        </View>

        <Heading2>{trip.name}</Heading2>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Details Card */}
        <DetailsCard
          notes={detailsNotes}
          links={detailsLinks}
          onEditNotes={handleEditNotes}
          onAddLink={handleAddLink}
          onDeleteLink={handleDeleteLink}
          onOpenLink={handleOpenLink}
        />

        <EditNotesModal
          visible={showEditNotes}
          initialValue={detailsNotes}
          onSave={handleSaveNotes}
          onClose={() => setShowEditNotes(false)}
        />

        <AddLinkModal
          visible={showAddLink}
          onSave={handleSaveLink}
          onClose={() => setShowAddLink(false)}
        />

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

          {/* Destination */}
          {trip.destination && (
            <View className="mb-4">
              <View className="flex-row items-center mb-2">
                <Ionicons name="location" size={20} color={DEEP_FOREST} />
                <Text
                  className="text-base ml-2"
                  style={{ fontFamily: "SourceSans3_600SemiBold", color: DEEP_FOREST }}
                >
                  Destination
                </Text>
              </View>

              <BodyText>{trip.destination.name}</BodyText>

              {trip.destination.city && trip.destination.state && (
                <BodyText className="text-earthGreen">
                  {trip.destination.city}, {trip.destination.state}
                </BodyText>
              )}
            </View>
          )}

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
                  <Pressable
                    key={person.id}
                    onPress={() => handleEditRole(person)}
                    className="px-3 py-1.5 rounded-full border active:opacity-70"
                    style={{ backgroundColor: PARCHMENT, borderColor: PARCHMENT_BORDER }}
                  >
                    <Text style={{ fontFamily: "SourceSans3_400Regular", color: DEEP_FOREST }}>
                      {person.name} ·{" "}
                      <Text
                        style={{
                          fontFamily: "SourceSans3_400Regular",
                          color: EARTH_GREEN,
                          fontSize: 12,
                        }}
                      >
                        {getRoleLabel(person.role)}
                      </Text>
                    </Text>
                  </Pressable>
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
            style={{ fontFamily: "JosefinSlab_700Bold", color: DEEP_FOREST }}
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

          {/* Weather */}
          <Pressable
            onPress={handleOpenWeather}
            className="bg-white rounded-xl p-4 mb-3 active:opacity-80"
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
                  >
                    {trip.weather
                      ? `Updated ${format(new Date(trip.weather.lastUpdated), "MMM d")}`
                      : "Check weather for your location"}
                  </Text>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={20} color={EARTH_GREEN} />
            </View>
          </Pressable>
        </View>
      </ScrollView>

      {/* Edit Role Modal */}
      <Modal
        visible={editingParticipant !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingParticipant(null)}
      >
        <Pressable
          className="flex-1 items-center justify-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          onPress={() => setEditingParticipant(null)}
        >
          <Pressable
            className="w-11/12 max-w-md rounded-2xl p-6"
            style={{ backgroundColor: PARCHMENT }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text
              className="text-xl mb-2"
              style={{ fontFamily: "JosefinSlab_700Bold", color: TEXT_PRIMARY_STRONG }}
            >
              Edit Role
            </Text>

            <Text className="mb-4" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}>
              {editingParticipant?.name}
            </Text>

            <View className="flex-row flex-wrap mb-6" style={{ gap: 8 }}>
              {ROLE_OPTIONS.map((roleOption) => {
                const isSelected = editingParticipant?.role === roleOption.value;

                return (
                  <Pressable
                    key={roleOption.value}
                    onPress={() => editingParticipant && handleSaveRole(roleOption.value)}
                    disabled={savingRole}
                    className="px-4 py-2 rounded-full border active:opacity-70"
                    style={{
                      backgroundColor: isSelected ? EARTH_GREEN : CARD_BACKGROUND_LIGHT,
                      borderColor: isSelected ? EARTH_GREEN : BORDER_SOFT,
                      opacity: savingRole ? 0.7 : 1,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "SourceSans3_600SemiBold",
                        color: isSelected ? PARCHMENT : TEXT_PRIMARY_STRONG,
                      }}
                    >
                      {roleOption.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {savingRole ? <ActivityIndicator size="small" color={DEEP_FOREST} /> : null}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Edit Trip Modal */}
      <EditTripModal
        visible={showEditTripModal}
        onClose={() => setShowEditTripModal(false)}
        tripId={tripId}
      />
    </SafeAreaView>
  );
}
