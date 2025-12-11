/**
 * My Campsite Screen - Social-style profile
 * Backed by Firestore profiles collection
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ImageBackground,
  Image,
  ActivityIndicator,
  Dimensions,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { auth, db, storage } from "../config/firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { signOut } from "firebase/auth";
import { restorePurchases, syncSubscriptionToFirestore } from "../services/subscriptionService";
import { useUserStatus } from "../utils/authHelper";
import { HERO_IMAGES } from "../constants/images";
import {
  DEEP_FOREST,
  EARTH_GREEN,
  GRANITE_GOLD,
  PARCHMENT,
  CARD_BACKGROUND_LIGHT,
  TEXT_PRIMARY_STRONG,
  TEXT_SECONDARY,
  BORDER_SOFT,
} from "../constants/colors";

type MembershipTier = "free" | "weekendCamper" | "trailLeader" | "backcountryGuide";

type ProfileStats = {
  tripsCount: number;
  tipsCount: number;
  gearReviewsCount: number;
  questionsCount: number;
  photosCount: number;
};

type UserProfile = {
  displayName: string;
  handle: string; // Stored WITHOUT "@"
  email: string;
  avatarUrl: string | null;
  backgroundUrl: string | null;
  membershipTier: MembershipTier;
  bio: string | null;
  location: string | null;
  campingStyle: string | null;
  joinedAt: any;
  stats?: ProfileStats;
};

type ActivityTab = "trips" | "gear" | "photos" | "questions";

const SCREEN_WIDTH = Dimensions.get("window").width;
const COVER_HEIGHT = 200;
const PROFILE_SIZE = 120;
const PROFILE_OVERLAP = 60;

export default function MyCampsiteScreen({ navigation }: any) {
  const { isGuest } = useUserStatus();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActivityTab>("trips");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigation.replace("Auth");
      return;
    }

    loadProfile(user.uid);
  }, [navigation]);

  const loadProfile = async (userId: string) => {
    try {
      setLoading(true);
      const profileRef = doc(db, "profiles", userId);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        const data = profileSnap.data() as UserProfile;

        // Normalize handle - remove any "@" prefix if it exists
        const normalizedHandle = data.handle?.replace(/^@+/, "") || "";

        setProfile({
          ...data,
          handle: normalizedHandle,
        });

        // Compute stats if not present
        if (!data.stats) {
          await computeAndSaveStats(userId);
        }
      } else {
        // Create default profile
        await createDefaultProfile(userId);
      }
    } catch (error) {
      console.error("[MyCampsite] Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultProfile = async (userId: string) => {
    const user = auth.currentUser;
    if (!user) return;

    // Derive handle from email prefix
    const emailPrefix = user.email?.split("@")[0] || "camper";
    const handle = emailPrefix.toLowerCase().replace(/[^a-z0-9]/g, "");

    const defaultProfile: UserProfile = {
      displayName: user.displayName || "Happy Camper",
      handle: handle, // Stored WITHOUT "@"
      email: user.email || "",
      avatarUrl: user.photoURL || null,
      backgroundUrl: null,
      membershipTier: "free",
      bio: null,
      location: null,
      campingStyle: null,
      joinedAt: serverTimestamp(),
      stats: {
        tripsCount: 0,
        tipsCount: 0,
        gearReviewsCount: 0,
        questionsCount: 0,
        photosCount: 0,
      },
    };

    try {
      // Create profile document
      await setDoc(doc(db, "profiles", userId), defaultProfile);

      // Create users document with default settings
      await setDoc(doc(db, "users", userId), {
        email: user.email || "",
        displayName: user.displayName || "Happy Camper",
        handle: handle,
        photoURL: user.photoURL || null,
        createdAt: serverTimestamp(),
        // Default settings - preselected ON
        notificationsEnabled: true,
        emailSubscribed: true,
        profilePublic: false,
        showUsernamePublicly: true,
        // Onboarding helpers
        onboardingStartAt: serverTimestamp(),
        onboardingCompleted: false,
      });

      setProfile(defaultProfile);
    } catch (error) {
      console.error("[MyCampsite] Error creating profile:", error);
    }
  };

  const computeAndSaveStats = async (userId: string) => {
    try {
      // Count trips
      const tripsQuery = query(collection(db, "trips"), where("userId", "==", userId));
      const tripsSnap = await getDocs(tripsQuery);
      const tripsCount = tripsSnap.size;

      // Count tips
      const tipsQuery = query(collection(db, "tips"), where("userId", "==", userId));
      const tipsSnap = await getDocs(tipsQuery);
      const tipsCount = tipsSnap.size;

      // Count gear reviews
      const gearQuery = query(collection(db, "gearReviews"), where("userId", "==", userId));
      const gearSnap = await getDocs(gearQuery);
      const gearReviewsCount = gearSnap.size;

      // Count questions
      const questionsQuery = query(collection(db, "questions"), where("userId", "==", userId));
      const questionsSnap = await getDocs(questionsQuery);
      const questionsCount = questionsSnap.size;

      // Count photos
      const photosQuery = query(collection(db, "stories"), where("userId", "==", userId));
      const photosSnap = await getDocs(photosQuery);
      const photosCount = photosSnap.size;

      const stats: ProfileStats = {
        tripsCount,
        tipsCount,
        gearReviewsCount,
        questionsCount,
        photosCount,
      };

      // Update profile with stats
      await setDoc(doc(db, "profiles", userId), { stats }, { merge: true });

      // Update local state
      setProfile((prev) => (prev ? { ...prev, stats } : null));
    } catch (error) {
      console.error("[MyCampsite] Error computing stats:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      if (navigation && navigation.reset) {
        navigation.reset({
          index: 0,
          routes: [{ name: "HomeTabs" }],
        });
      }
    } catch (error) {
      console.error("[MyCampsite] Error signing out:", error);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setRestoring(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const restored = await restorePurchases();

      if (restored) {
        await syncSubscriptionToFirestore();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "Purchases Restored",
          "Your subscription has been restored successfully."
        );
      } else {
        Alert.alert(
          "No Purchases Found",
          "No active subscriptions were found for your account."
        );
      }
    } catch (error: any) {
      console.error("[MyCampsite] Restore error:", error);
      Alert.alert(
        "Restore Failed",
        "Unable to restore purchases. Please try again or contact support."
      );
    } finally {
      setRestoring(false);
    }
  };

  const handleUpdateProfilePhoto = async () => {
    const user = auth.currentUser;
    if (!user || isGuest) {
      navigation.navigate("Auth");
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images" as any,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) return;

      setUploadingPhoto(true);

      const imageUri = result.assets[0].uri;
      const response = await fetch(imageUri);
      const blob = await response.blob();

      const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}.jpg`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      // Update profiles collection
      await updateDoc(doc(db, "profiles", user.uid), {
        avatarUrl: downloadURL,
      });

      setProfile((prev) => (prev ? { ...prev, avatarUrl: downloadURL } : null));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error("Error updating profile photo:", error);
      Alert.alert("Error", "Failed to update profile photo. Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleUpdateCoverPhoto = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images" as any,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (result.canceled) return;

      setUploadingCover(true);

      const imageUri = result.assets[0].uri;
      const response = await fetch(imageUri);
      const blob = await response.blob();

      const storageRef = ref(storage, `profileBackgrounds/${user.uid}/${Date.now()}.jpg`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      // Update profiles collection
      await updateDoc(doc(db, "profiles", user.uid), {
        backgroundUrl: downloadURL,
      });

      setProfile((prev) => (prev ? { ...prev, backgroundUrl: downloadURL } : null));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error("Error updating cover photo:", error);
      Alert.alert("Error", "Failed to update cover photo. Please try again.");
    } finally {
      setUploadingCover(false);
    }
  };

  const getMembershipLabel = (tier: MembershipTier): string => {
    switch (tier) {
      case "weekendCamper":
        return "Weekend Camper";
      case "trailLeader":
        return "Trail Leader";
      case "backcountryGuide":
        return "Backcountry Guide";
      default:
        return "Free Member";
    }
  };

  const getMembershipBadgeColor = (tier: MembershipTier): string => {
    switch (tier) {
      case "weekendCamper":
        return GRANITE_GOLD;
      case "trailLeader":
        return "#2563eb";
      case "backcountryGuide":
        return "#7c3aed";
      default:
        return EARTH_GREEN;
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: PARCHMENT }}>
        <ActivityIndicator size="large" color={DEEP_FOREST} />
        <Text
          className="mt-4"
          style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}
        >
          Loading your campsite...
        </Text>
      </View>
    );
  }

  if (!auth.currentUser || !profile) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: PARCHMENT }}>
        <ActivityIndicator color={DEEP_FOREST} />
      </View>
    );
  }

  const initials = profile.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Use safe area bottom padding for consistent tab bar height
  const bottomSpacer = Math.max(insets.bottom || 0, 18) + 72;

  return (
    <View className="flex-1" style={{ backgroundColor: PARCHMENT }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Hero Header with Background Image */}
        <View style={{ height: COVER_HEIGHT + insets.top }}>
          <ImageBackground
            source={profile.backgroundUrl ? { uri: profile.backgroundUrl } : HERO_IMAGES.WELCOME}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          >
            {/* Gradient Overlay */}
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.3)",
              }}
            />

            {/* Back & Settings Buttons */}
            <View
              style={{
                paddingTop: insets.top + 8,
                paddingHorizontal: 20,
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.goBack();
                }}
                className="w-10 h-10 rounded-full items-center justify-center active:opacity-70"
                style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
              >
                <Ionicons name="arrow-back" size={24} color={PARCHMENT} />
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  
                  // Gate: Login required to edit profile
                  if (isGuest || !auth.currentUser) {
                    navigation.navigate("Auth");
                    return;
                  }
                  
                  navigation.navigate("EditProfile");
                }}
                className="w-10 h-10 rounded-full items-center justify-center active:opacity-70"
                style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
              >
                <Ionicons name="create-outline" size={24} color={PARCHMENT} />
              </Pressable>
            </View>

            {/* Camera Button for Cover Photo */}
            <View style={{ flex: 1, justifyContent: "flex-end", alignItems: "flex-end", paddingRight: 20, paddingBottom: 12 }}>
              <Pressable
                onPress={handleUpdateCoverPhoto}
                disabled={uploadingCover}
                className="w-10 h-10 rounded-full items-center justify-center active:opacity-70"
                style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
              >
                {uploadingCover ? (
                  <ActivityIndicator size="small" color={PARCHMENT} />
                ) : (
                  <Ionicons name="camera" size={20} color={PARCHMENT} />
                )}
              </Pressable>
            </View>
          </ImageBackground>
        </View>

        {/* Profile Section with Avatar Overlap */}
        <View className="px-5" style={{ marginTop: -PROFILE_OVERLAP }}>
          {/* Avatar */}
          <Pressable
            onPress={handleUpdateProfilePhoto}
            disabled={uploadingPhoto}
            style={{
              width: PROFILE_SIZE,
              height: PROFILE_SIZE,
              borderRadius: PROFILE_SIZE / 2,
              borderWidth: 4,
              borderColor: PARCHMENT,
              backgroundColor: PARCHMENT,
              marginBottom: 12,
            }}
          >
            {profile.avatarUrl ? (
              <Image
                source={{ uri: profile.avatarUrl }}
                style={{
                  width: PROFILE_SIZE - 8,
                  height: PROFILE_SIZE - 8,
                  borderRadius: (PROFILE_SIZE - 8) / 2,
                }}
              />
            ) : (
              <View
                style={{
                  width: PROFILE_SIZE - 8,
                  height: PROFILE_SIZE - 8,
                  borderRadius: (PROFILE_SIZE - 8) / 2,
                  backgroundColor: DEEP_FOREST,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontFamily: "SourceSans3_700Bold",
                    fontSize: 40,
                    color: PARCHMENT,
                  }}
                >
                  {initials}
                </Text>
              </View>
            )}

            {/* Camera Icon Overlay */}
            <View
              style={{
                position: "absolute",
                bottom: 4,
                right: 4,
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: EARTH_GREEN,
                borderWidth: 3,
                borderColor: PARCHMENT,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color={PARCHMENT} />
              ) : (
                <Ionicons name="camera" size={18} color={PARCHMENT} />
              )}
            </View>
          </Pressable>

          {/* User Identity Block */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-1">
                <Text
                  className="text-3xl mb-1"
                  style={{ fontFamily: "JosefinSlab_700Bold", color: TEXT_PRIMARY_STRONG }}
                >
                  {profile.displayName}
                </Text>
                <Text
                  className="text-base mb-2"
                  style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}
                >
                  @{profile.handle}
                </Text>

                {/* Membership Badge */}
                <View
                  className="rounded-full px-3 py-1 self-start"
                  style={{ backgroundColor: getMembershipBadgeColor(profile.membershipTier) }}
                >
                  <Text
                    className="text-xs"
                    style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}
                  >
                    {getMembershipLabel(profile.membershipTier)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Social Stats Row */}
          <View className="flex-row mb-6 py-4 border-y" style={{ borderColor: BORDER_SOFT }}>
            <View className="flex-1 items-center">
              <Text
                className="text-2xl"
                style={{ fontFamily: "SourceSans3_700Bold", color: TEXT_PRIMARY_STRONG }}
              >
                {profile.stats?.tripsCount || 0}
              </Text>
              <Text
                className="text-xs uppercase"
                style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}
              >
                Trips
              </Text>
            </View>

            <View className="flex-1 items-center">
              <Text
                className="text-2xl"
                style={{ fontFamily: "SourceSans3_700Bold", color: TEXT_PRIMARY_STRONG }}
              >
                {profile.stats?.tipsCount || 0}
              </Text>
              <Text
                className="text-xs uppercase"
                style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}
              >
                Tips
              </Text>
            </View>

            <View className="flex-1 items-center">
              <Text
                className="text-2xl"
                style={{ fontFamily: "SourceSans3_700Bold", color: TEXT_PRIMARY_STRONG }}
              >
                {profile.stats?.gearReviewsCount || 0}
              </Text>
              <Text
                className="text-xs uppercase"
                style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}
              >
                Reviews
              </Text>
            </View>

            <View className="flex-1 items-center">
              <Text
                className="text-2xl"
                style={{ fontFamily: "SourceSans3_700Bold", color: TEXT_PRIMARY_STRONG }}
              >
                {profile.stats?.questionsCount || 0}
              </Text>
              <Text
                className="text-xs uppercase"
                style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}
              >
                Questions
              </Text>
            </View>

            <View className="flex-1 items-center">
              <Text
                className="text-2xl"
                style={{ fontFamily: "SourceSans3_700Bold", color: TEXT_PRIMARY_STRONG }}
              >
                {profile.stats?.photosCount || 0}
              </Text>
              <Text
                className="text-xs uppercase"
                style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}
              >
                Photos
              </Text>
            </View>
          </View>

          {/* About Section */}
          <View className="mb-6 p-4 rounded-xl" style={{ backgroundColor: CARD_BACKGROUND_LIGHT }}>
            <Text
              className="text-lg mb-3"
              style={{ fontFamily: "JosefinSlab_700Bold", color: TEXT_PRIMARY_STRONG }}
            >
              About
            </Text>

            <View className="mb-3">
              {profile.bio ? (
                <Text
                  style={{
                    fontFamily: "SourceSans3_400Regular",
                    fontSize: 15,
                    color: TEXT_PRIMARY_STRONG,
                    lineHeight: 22,
                  }}
                >
                  {profile.bio}
                </Text>
              ) : (
                <Text
                  style={{
                    fontFamily: "SourceSans3_400Regular",
                    fontSize: 15,
                    color: TEXT_SECONDARY,
                    fontStyle: "italic",
                  }}
                >
                  Add a short bio so campers know you.
                </Text>
              )}
            </View>

            {profile.location && (
              <View className="flex-row items-center mb-2">
                <Ionicons name="location-outline" size={18} color={EARTH_GREEN} />
                <Text
                  className="ml-2"
                  style={{ fontFamily: "SourceSans3_400Regular", fontSize: 15, color: TEXT_PRIMARY_STRONG }}
                >
                  {profile.location}
                </Text>
              </View>
            )}

            {profile.campingStyle && (
              <View className="flex-row items-center">
                <Ionicons name="bonfire-outline" size={18} color={EARTH_GREEN} />
                <Text
                  className="ml-2"
                  style={{ fontFamily: "SourceSans3_400Regular", fontSize: 15, color: TEXT_PRIMARY_STRONG }}
                >
                  {profile.campingStyle}
                </Text>
              </View>
            )}
          </View>

          {/* My Activity Section */}
          <View className="mb-6">
            <Text
              className="text-lg mb-3"
              style={{ fontFamily: "JosefinSlab_700Bold", color: TEXT_PRIMARY_STRONG }}
            >
              My Activity
            </Text>

            {/* Activity Tabs */}
            <View className="flex-row mb-4">
              {(["trips", "gear", "photos", "questions"] as ActivityTab[]).map((tab) => (
                <Pressable
                  key={tab}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

                    // Navigate to the appropriate screen based on tab
                    if (tab === "trips") {
                      navigation.navigate("Plan");
                    } else if (tab === "gear") {
                      navigation.navigate("MyGearCloset");
                    } else {
                      setActiveTab(tab);
                    }
                  }}
                  className="mr-3 px-4 py-2 rounded-full"
                  style={{
                    backgroundColor: activeTab === tab ? DEEP_FOREST : CARD_BACKGROUND_LIGHT,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "SourceSans3_600SemiBold",
                      fontSize: 14,
                      color: activeTab === tab ? PARCHMENT : TEXT_SECONDARY,
                    }}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Activity Content - Placeholder */}
            <View className="p-6 rounded-xl items-center" style={{ backgroundColor: CARD_BACKGROUND_LIGHT }}>
              <Ionicons name="calendar-outline" size={40} color={EARTH_GREEN} />
              <Text
                className="mt-3"
                style={{ fontFamily: "SourceSans3_600SemiBold", fontSize: 15, color: TEXT_PRIMARY_STRONG }}
              >
                No {activeTab} yet
              </Text>
              <Text
                className="mt-1 text-center"
                style={{ fontFamily: "SourceSans3_400Regular", fontSize: 14, color: TEXT_SECONDARY }}
              >
                Your {activeTab} will appear here
              </Text>
            </View>
          </View>

          {/* My Campground */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate("MyCampground");
            }}
            className="mb-6 p-4 rounded-xl border active:opacity-70"
            style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <Ionicons name="people-outline" size={22} color={EARTH_GREEN} />
                <Text
                  className="ml-3"
                  style={{ fontFamily: "SourceSans3_400Regular", fontSize: 16, color: TEXT_PRIMARY_STRONG }}
                >
                  My Campground
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={EARTH_GREEN} />
            </View>
          </Pressable>

          {/* Restore Purchases Button */}
          <Pressable
            onPress={handleRestorePurchases}
            disabled={restoring}
            className="mb-4 py-4 rounded-xl border-2 active:opacity-70"
            style={{ borderColor: EARTH_GREEN, backgroundColor: CARD_BACKGROUND_LIGHT }}
          >
            <View className="flex-row items-center justify-center">
              {restoring ? (
                <ActivityIndicator size="small" color={EARTH_GREEN} />
              ) : (
                <>
                  <Ionicons name="reload-circle-outline" size={24} color={EARTH_GREEN} />
                  <Text
                    className="ml-2"
                    style={{
                      fontFamily: "SourceSans3_600SemiBold",
                      fontSize: 16,
                      color: TEXT_PRIMARY_STRONG,
                    }}
                  >
                    Restore Purchases
                  </Text>
                </>
              )}
            </View>
          </Pressable>

          {/* Sign Out Button */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleSignOut();
            }}
            className="mb-6 py-3 rounded-lg active:opacity-90"
            style={{ backgroundColor: "#dc2626" }}
          >
            <Text
              className="text-center"
              style={{
                fontFamily: "SourceSans3_600SemiBold",
                fontSize: 16,
                color: PARCHMENT,
              }}
            >
              Sign Out
            </Text>
          </Pressable>
        </View>

        {/* Bottom Spacer for Tab Bar */}
        <View style={{ height: bottomSpacer }} />
      </ScrollView>
    </View>
  );
}
