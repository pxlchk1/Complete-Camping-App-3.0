/**
 * Add People to Trip Modal
 * Multi-select contacts from My Campground with role assignment
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { auth } from "../config/firebase";
import { getCampgroundContacts } from "../services/campgroundContactsService";
import { addTripParticipantsWithRoles } from "../services/tripParticipantsService";
import { CampgroundContact, ParticipantRole } from "../types/campground";
import { RootStackParamList, RootStackNavigationProp } from "../navigation/types";
import { useTripsStore } from "../state/tripsStore";
import ModalHeader from "../components/ModalHeader";
import {
  DEEP_FOREST,
  EARTH_GREEN,
  PARCHMENT,
  CARD_BACKGROUND_LIGHT,
  BORDER_SOFT,
  TEXT_PRIMARY_STRONG,
  TEXT_SECONDARY,
  TEXT_MUTED,
} from "../constants/colors";

const ROLE_OPTIONS: { value: ParticipantRole; label: string }[] = [
  { value: "guest", label: "Guest" },
  { value: "host", label: "Host" },
  { value: "co_host", label: "Co-host" },
  { value: "kid", label: "Kid" },
  { value: "pet", label: "Pet" },
  { value: "other", label: "Other" },
];

export default function AddPeopleToTripScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, "AddPeopleToTrip">>();
  const { tripId } = route.params;

  const trip = useTripsStore((s) => s.getTripById(tripId));

  const [contacts, setContacts] = useState<CampgroundContact[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [contactRoles, setContactRoles] = useState<Map<string, ParticipantRole>>(new Map());
  const [step, setStep] = useState<"select" | "roles">("select");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "You must be signed in");
      navigation.goBack();
      return;
    }

    try {
      const contactsData = await getCampgroundContacts(user.uid);
      setContacts(contactsData);
    } catch (error: any) {
      console.error("Error loading contacts:", error);
      Alert.alert("Error", "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  const toggleContact = (contactId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedContactIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contactId)) {
        newSet.delete(contactId);
        // Remove role when deselecting
        setContactRoles(prevRoles => {
          const newRoles = new Map(prevRoles);
          newRoles.delete(contactId);
          return newRoles;
        });
      } else {
        newSet.add(contactId);
        // Set default role to guest
        setContactRoles(prevRoles => {
          const newRoles = new Map(prevRoles);
          newRoles.set(contactId, "guest");
          return newRoles;
        });
      }
      return newSet;
    });
  };

  const setRole = (contactId: string, role: ParticipantRole) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setContactRoles(prev => {
      const newRoles = new Map(prev);
      newRoles.set(contactId, role);
      return newRoles;
    });
  };

  const handleNext = () => {
    if (selectedContactIds.size === 0) {
      Alert.alert("No Selection", "Please select at least one person to add");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep("roles");
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep("select");
  };

  const handleSubmit = async () => {
    if (selectedContactIds.size === 0) {
      Alert.alert("No Selection", "Please select at least one person to add");
      return;
    }

    try {
      setSubmitting(true);
      const participantsWithRoles = Array.from(selectedContactIds).map(contactId => ({
        contactId,
        role: contactRoles.get(contactId) || "guest",
      }));

      const tripStartDate = trip?.startDate ? new Date(trip.startDate) : new Date();
      await addTripParticipantsWithRoles(tripId, participantsWithRoles, tripStartDate);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error: any) {
      console.error("Error adding participants:", error);
      Alert.alert("Error", error.message || "Failed to add people to trip");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1" style={{ backgroundColor: PARCHMENT }}>
        <ModalHeader title="Add People" showTitle />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={DEEP_FOREST} />
          <Text className="mt-4" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}>
            Loading contacts...
          </Text>
        </View>
      </View>
    );
  }

  if (step === "roles") {
    const selectedContacts = contacts.filter(c => selectedContactIds.has(c.id));

    return (
      <View className="flex-1" style={{ backgroundColor: PARCHMENT }}>
        <ModalHeader
          title="Assign Roles"
          showTitle
          onBack={handleBack}
          rightAction={{
            icon: "checkmark",
            onPress: handleSubmit,
          }}
        />

        <ScrollView className="flex-1 px-5 pt-5">
          <Text
            className="mb-4"
            style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}
          >
            Assign a role to each person
          </Text>

          {selectedContacts.map(contact => {
            const currentRole = contactRoles.get(contact.id) || "guest";
            return (
              <View key={contact.id} className="mb-4">
                <Text
                  className="mb-2"
                  style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}
                >
                  {contact.contactName}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {ROLE_OPTIONS.map(roleOption => {
                    const isSelected = currentRole === roleOption.value;
                    return (
                      <Pressable
                        key={roleOption.value}
                        onPress={() => setRole(contact.id, roleOption.value)}
                        className="px-4 py-2 rounded-full border active:opacity-70"
                        style={{
                          backgroundColor: isSelected ? EARTH_GREEN : CARD_BACKGROUND_LIGHT,
                          borderColor: isSelected ? EARTH_GREEN : BORDER_SOFT,
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
              </View>
            );
          })}

          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            className="mt-4 mb-8 py-4 rounded-xl active:opacity-90"
            style={{ backgroundColor: DEEP_FOREST }}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={PARCHMENT} />
            ) : (
              <Text
                className="text-center"
                style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}
              >
                Add {selectedContactIds.size} {selectedContactIds.size === 1 ? "Person" : "People"}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: PARCHMENT }}>
      <ModalHeader
        title="Add People"
        showTitle
        rightAction={{
          icon: "arrow-forward",
          onPress: handleNext,
        }}
      />

      <ScrollView className="flex-1 px-5 pt-5">
        {contacts.length === 0 ? (
          <View className="py-12 items-center">
            <Ionicons name="people-outline" size={64} color={BORDER_SOFT} />
            <Text
              className="mt-4 text-center mb-4"
              style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_MUTED }}
            >
              No contacts in your campground yet. Add people to your campground first.
            </Text>
            <Pressable
              onPress={() => {
                navigation.goBack();
                navigation.navigate("MyCampground");
              }}
              className="px-6 py-3 rounded-xl active:opacity-90"
              style={{ backgroundColor: DEEP_FOREST }}
            >
              <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}>
                Go to My Campground
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text
              className="mb-4"
              style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}
            >
              Select people from your campground to add to this trip
            </Text>

            {contacts.map(contact => {
              const isSelected = selectedContactIds.has(contact.id);
              return (
                <Pressable
                  key={contact.id}
                  onPress={() => toggleContact(contact.id)}
                  className="mb-3 p-4 rounded-xl border active:opacity-70"
                  style={{
                    backgroundColor: isSelected ? EARTH_GREEN : CARD_BACKGROUND_LIGHT,
                    borderColor: isSelected ? EARTH_GREEN : BORDER_SOFT,
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 mr-3">
                      <View className="flex-row items-center">
                        <Text
                          className="text-lg"
                          style={{
                            fontFamily: "SourceSans3_600SemiBold",
                            color: isSelected ? PARCHMENT : TEXT_PRIMARY_STRONG,
                          }}
                        >
                          {contact.contactName}
                        </Text>
                      </View>

                      {contact.contactEmail && (
                        <Text
                          className="mt-1"
                          style={{
                            fontFamily: "SourceSans3_400Regular",
                            color: isSelected ? PARCHMENT : TEXT_SECONDARY,
                          }}
                        >
                          {contact.contactEmail}
                        </Text>
                      )}
                    </View>

                    <View
                      className="w-6 h-6 rounded-full border-2 items-center justify-center"
                      style={{
                        borderColor: isSelected ? PARCHMENT : BORDER_SOFT,
                        backgroundColor: isSelected ? PARCHMENT : "transparent",
                      }}
                    >
                      {isSelected && <Ionicons name="checkmark" size={16} color={EARTH_GREEN} />}
                    </View>
                  </View>
                </Pressable>
              );
            })}

            <Pressable
              onPress={handleNext}
              disabled={selectedContactIds.size === 0}
              className="mt-4 mb-8 py-4 rounded-xl active:opacity-90"
              style={{
                backgroundColor: selectedContactIds.size > 0 ? DEEP_FOREST : BORDER_SOFT,
              }}
            >
              <Text
                className="text-center"
                style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}
              >
                Next: Assign Roles
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}
