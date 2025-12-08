/**
 * Add Camper Screen
 * Form to add a new contact to My Campground
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { auth, db } from "../config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { createCampgroundContact } from "../services/campgroundContactsService";
import { sendCampgroundInvitation } from "../services/emailService";
import { RootStackNavigationProp } from "../navigation/types";
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

export default function AddCamperScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [sendInvite, setSendInvite] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "You must be signed in to add a contact");
      return;
    }

    if (!displayName.trim()) {
      Alert.alert("Name Required", "Please enter a name for this contact");
      return;
    }

    // Validate email if sending invite
    if (sendInvite && !email.trim()) {
      Alert.alert("Email Required", "Please enter an email address to send the invitation");
      return;
    }

    if (sendInvite && email.trim() && !isValidEmail(email.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }

    try {
      setSubmitting(true);

      // Create the contact
      await createCampgroundContact(user.uid, {
        contactName: displayName.trim(),
        contactEmail: email.trim() || undefined,
        contactNote: notes.trim() || undefined,
      });

      // Send invitation email if requested
      if (sendInvite && email.trim()) {
        try {
          // Get inviter's display name
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const inviterName = userDoc.exists()
            ? userDoc.data().displayName || "A camper"
            : "A camper";

          await sendCampgroundInvitation(
            email.trim(),
            displayName.trim(),
            inviterName
          );
        } catch (emailError) {
          console.error("Error sending invitation email:", emailError);
          // Don't fail the whole operation if email fails
          Alert.alert(
            "Contact Added",
            "Contact was added successfully, but we could not send the invitation email. You can manually share the app with them."
          );
        }
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error: any) {
      console.error("Error adding contact:", error);
      Alert.alert("Error", error.message || "Failed to add contact");
    } finally {
      setSubmitting(false);
    }
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: PARCHMENT }}>
      <ModalHeader
        title="Add Camper"
        showTitle
        rightAction={{
          icon: "checkmark",
          onPress: handleSubmit,
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-5 pt-5">
          {/* Name Field */}
          <View className="mb-4">
            <Text
              className="mb-2"
              style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}
            >
              Name *
            </Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter name"
              placeholderTextColor={TEXT_MUTED}
              className="px-4 py-3 rounded-xl border"
              style={{
                backgroundColor: CARD_BACKGROUND_LIGHT,
                borderColor: BORDER_SOFT,
                fontFamily: "SourceSans3_400Regular",
                color: TEXT_PRIMARY_STRONG,
              }}
              autoFocus
            />
          </View>

          {/* Email Field */}
          <View className="mb-4">
            <Text
              className="mb-2"
              style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}
            >
              Email {sendInvite && "*"}
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com"
              placeholderTextColor={TEXT_MUTED}
              keyboardType="email-address"
              autoCapitalize="none"
              className="px-4 py-3 rounded-xl border"
              style={{
                backgroundColor: CARD_BACKGROUND_LIGHT,
                borderColor: BORDER_SOFT,
                fontFamily: "SourceSans3_400Regular",
                color: TEXT_PRIMARY_STRONG,
              }}
            />
          </View>

          {/* Send Invitation Checkbox */}
          <View
            className="mb-4 p-4 rounded-xl border"
            style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}
          >
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSendInvite(!sendInvite);
              }}
              className="flex-row items-start active:opacity-70"
            >
              <View
                className="w-6 h-6 rounded border-2 items-center justify-center mr-3 mt-0.5"
                style={{
                  borderColor: sendInvite ? EARTH_GREEN : BORDER_SOFT,
                  backgroundColor: sendInvite ? EARTH_GREEN : "transparent",
                }}
              >
                {sendInvite && <Ionicons name="checkmark" size={18} color={PARCHMENT} />}
              </View>
              <View className="flex-1">
                <Text
                  className="mb-1"
                  style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}
                >
                  Send invitation email
                </Text>
                <Text
                  style={{ fontFamily: "SourceSans3_400Regular", fontSize: 14, color: TEXT_SECONDARY }}
                >
                  Adding this person will send an email with instructions for how they can join your
                  campground and be included in all your camping trip plans & details.
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Phone Field */}
          <View className="mb-4">
            <Text
              className="mb-2"
              style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}
            >
              Phone
            </Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="(555) 123-4567"
              placeholderTextColor={TEXT_MUTED}
              keyboardType="phone-pad"
              className="px-4 py-3 rounded-xl border"
              style={{
                backgroundColor: CARD_BACKGROUND_LIGHT,
                borderColor: BORDER_SOFT,
                fontFamily: "SourceSans3_400Regular",
                color: TEXT_PRIMARY_STRONG,
              }}
            />
          </View>

          {/* Notes Field */}
          <View className="mb-4">
            <Text
              className="mb-2"
              style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}
            >
              Notes
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional notes about this person..."
              placeholderTextColor={TEXT_MUTED}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="px-4 py-3 rounded-xl border"
              style={{
                backgroundColor: CARD_BACKGROUND_LIGHT,
                borderColor: BORDER_SOFT,
                fontFamily: "SourceSans3_400Regular",
                color: TEXT_PRIMARY_STRONG,
                minHeight: 100,
              }}
            />
          </View>

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmit}
            disabled={!displayName.trim() || submitting}
            className="mt-4 mb-8 py-4 rounded-xl active:opacity-90"
            style={{
              backgroundColor: displayName.trim() ? DEEP_FOREST : BORDER_SOFT,
            }}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={PARCHMENT} />
            ) : (
              <Text
                className="text-center"
                style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}
              >
                Add Camper
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
