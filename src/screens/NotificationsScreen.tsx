/**
 * Notifications Screen
 * Manages push notification preferences
 * Wired to users/{uid}.notificationsEnabled and pushTokens collection
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { auth, db } from "../config/firebase";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, deleteDoc, serverTimestamp } from "firebase/firestore";
import ModalHeader from "../components/ModalHeader";
import {
  PARCHMENT,
  CARD_BACKGROUND_LIGHT,
  BORDER_SOFT,
  TEXT_PRIMARY_STRONG,
  TEXT_SECONDARY,
  EARTH_GREEN,
  DEEP_FOREST,
} from "../constants/colors";

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setEnabled(data.notificationsEnabled || false);
      }
    } catch (error) {
      console.error("[Notifications] Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (value: boolean) => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "You must be signed in to manage notifications");
      return;
    }

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (value) {
      // Turning ON notifications
      await enableNotifications(user.uid);
    } else {
      // Turning OFF notifications
      await disableNotifications(user.uid);
    }
  };

  const enableNotifications = async (userId: string) => {
    try {
      setUpdating(true);

      // Check if device supports push notifications
      if (!Device.isDevice) {
        Alert.alert(
          "Not Available",
          "Push notifications are not available on simulators/emulators."
        );
        setUpdating(false);
        return;
      }

      // Request permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Please enable notifications in your device settings to receive updates."
        );
        setUpdating(false);
        return;
      }

      // Get push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: "your-expo-project-id", // This will be auto-filled by Expo
      });
      const token = tokenData.data;

      // Save token to Firestore
      const pushTokensRef = collection(db, "pushTokens");
      const q = query(pushTokensRef, where("userId", "==", userId), where("token", "==", token));
      const existingTokens = await getDocs(q);

      if (existingTokens.empty) {
        // Create new token document
        await setDoc(doc(pushTokensRef), {
          userId,
          token,
          platform: Platform.OS,
          createdAt: serverTimestamp(),
        });
      }

      // Update user document
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        notificationsEnabled: true,
        updatedAt: serverTimestamp(),
      });

      setEnabled(true);
      Alert.alert("Success", "Notifications have been enabled");
    } catch (error: any) {
      console.error("[Notifications] Error enabling:", error);
      Alert.alert("Error", error.message || "Failed to enable notifications");
    } finally {
      setUpdating(false);
    }
  };

  const disableNotifications = async (userId: string) => {
    try {
      setUpdating(true);

      // Update user document
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        notificationsEnabled: false,
        updatedAt: serverTimestamp(),
      });

      // Optionally delete push tokens
      const pushTokensRef = collection(db, "pushTokens");
      const q = query(pushTokensRef, where("userId", "==", userId));
      const tokens = await getDocs(q);

      await Promise.all(tokens.docs.map(tokenDoc => deleteDoc(tokenDoc.ref)));

      setEnabled(false);
      Alert.alert("Success", "Notifications have been disabled");
    } catch (error: any) {
      console.error("[Notifications] Error disabling:", error);
      Alert.alert("Error", error.message || "Failed to disable notifications");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1" style={{ backgroundColor: PARCHMENT }}>
        <ModalHeader title="Notifications" showTitle />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={DEEP_FOREST} />
          <Text className="mt-4" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}>
            Loading settings...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: PARCHMENT }}>
      <ModalHeader title="Notifications" showTitle />

      <ScrollView className="flex-1">
        <View className="px-5 pt-5">
          {/* Main Toggle */}
          <View
            className="p-4 rounded-xl border"
            style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <Text
                  className="text-lg mb-1"
                  style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}
                >
                  Push Notifications
                </Text>
                <Text
                  style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}
                >
                  Receive updates about your trips, community activity, and camping tips
                </Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={handleToggle}
                disabled={updating}
                trackColor={{ false: BORDER_SOFT, true: EARTH_GREEN }}
                thumbColor={PARCHMENT}
              />
            </View>
          </View>

          {/* Info Section */}
          <View className="mt-6 p-4 rounded-xl" style={{ backgroundColor: CARD_BACKGROUND_LIGHT }}>
            <Text
              className="text-base mb-2"
              style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}
            >
              What you will receive:
            </Text>
            <View className="gap-2">
              <Text style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}>
                • Trip reminders and updates
              </Text>
              <Text style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}>
                • Community replies and mentions
              </Text>
              <Text style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}>
                • Camping tips and safety alerts
              </Text>
              <Text style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}>
                • Weather warnings for your trips
              </Text>
            </View>
          </View>

          <View className="mt-4 px-2">
            <Text
              className="text-sm text-center"
              style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}
            >
              You can manage notification preferences in your device settings at any time.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
