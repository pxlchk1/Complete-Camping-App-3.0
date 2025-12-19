/**
 * Account Screen - Social Media Style Profile
 * Facebook-inspired profile layout with cover photo, stats, and activity feed
 */

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  ImageBackground,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCurrentUser, useIsModerator, useIsAdministrator, useUserStore } from "../state/userStore";
import { auth, db } from "../config/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useIsPro } from "../state/subscriptionStore";
import { RootStackParamList } from "../navigation/types";
import AdminPanel from "../components/AdminPanel";
import ModeratorPanel from "../components/ModeratorPanel";
import {
  DEEP_FOREST,
  EARTH_GREEN,
  GRANITE_GOLD,
  PARCHMENT,
  SIERRA_SKY,
  LODGE_FOREST,
} from "../constants/colors";

type AccountScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Account">;

type TabType = "posts" | "about" | "moderator" | "admin";

const SCREEN_WIDTH = Dimensions.get("window").width;
const COVER_HEIGHT = 200;
const PROFILE_SIZE = 120;
const PROFILE_OVERLAP = 40;

export default function AccountScreen() {
        // Step 4: Error UI and Retry/Sign out actions
        const handleRetry = () => {
          setLoadError(null);
          setHasTimedOut(false);
          setIsLoading(true);
          // Re-run profile fetch by resetting effect
          // (simulate by incrementing a key or using a state toggle if needed)
          // For now, just reload the screen
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          window.location.reload();
        };

        const handleSignOut = async () => {
          try {
            await auth.signOut();
          } catch (err) {
            setLoadError("Failed to sign out");
          }
        };
      // Step 3: Fetch profile by uid, create if missing
      useEffect(() => {
        const fetchProfile = async () => {
          setIsLoading(true);
          setLoadError(null);
          setHasTimedOut(false);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          const user = auth.currentUser;
          if (!user) {
            setIsLoading(false);
            return;
          }
          try {
            const userRef = doc(db, "profiles", user.uid);
            let userSnap = await getDoc(userRef);
            if (!userSnap.exists()) {
              // Defensive: create doc with safe defaults
              const email = user.email || "";
              const displayName = user.displayName || "Camper";
              const photoURL = user.photoURL || "";
              await setDoc(userRef, {
                email,
                displayName,
                photoURL,
                handle: "", // Optionally generate a unique handle here
                role: "user",
                membershipTier: "free",
                isBanned: false,
                notificationsEnabled: true,
                emailSubscribed: false,
                profilePublic: true,
                showUsernamePublicly: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              }, { merge: true });
              userSnap = await getDoc(userRef);
            }
            if (userSnap.exists()) {
              setCurrentUser({ id: user.uid, ...userSnap.data() });
            }
            setIsLoading(false);
          } catch (err) {
            setLoadError("Failed to load profile");
            setIsLoading(false);
          }
        };
        fetchProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
    // Step 2: Loading timeout logic
    useEffect(() => {
      if (!isLoading) return;
      // Start timeout
      timeoutRef.current = setTimeout(() => {
        setHasTimedOut(true);
        setIsLoading(false);
        setLoadError("Loading timed out. Please try again.");
        // Log debug info
        const user = auth.currentUser;
        console.error("[AccountScreen] Loading timed out", {
          uid: user?.uid,
          providerData: user?.providerData,
        });
      }, 10000);
      // Cleanup on unmount or load
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }, [isLoading]);
  const navigation = useNavigation<AccountScreenNavigationProp>();
  const currentUser = useCurrentUser();
  // Defensive: allow partial profile data
  const safeProfile = currentUser || {};
  const isModerator = useIsModerator();
  const isAdministrator = useIsAdministrator();
  const isPro = useIsPro();
  const setCurrentUser = useUserStore((s) => s.setCurrentUser);
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  // Step 1: Loading/error/timeout state
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  if (!currentUser) {
    return (
      <SafeAreaView className="flex-1 bg-parchment" edges={["top"]}>
        <View className="flex-1 items-center justify-center px-5">
          <Ionicons name="person-circle-outline" size={80} color={EARTH_GREEN} />
          <Text
            className="mt-4 text-xl text-center"
            style={{ fontFamily: "JosefinSlab_700Bold", color: DEEP_FOREST }}
          >
            Not Signed In
          </Text>
          <Text
            className="mt-2 text-center"
            style={{ fontFamily: "SourceSans3_400Regular", color: EARTH_GREEN }}
          >
            Please sign in to view your account
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const tabs: { key: TabType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: "posts", label: "Posts", icon: "newspaper-outline" },
    { key: "about", label: "About", icon: "information-circle-outline" },
  ];

  if (isModerator) {
    tabs.push({ key: "moderator", label: "Moderation", icon: "shield-outline" });
  }

  if (isAdministrator) {
    tabs.push({ key: "admin", label: "Admin", icon: "settings-outline" });
  }

  const getMembershipBadge = () => {
    if (safeProfile.membershipTier === "isAdmin" || isAdministrator) {
      return (
        <View className="flex-row items-center px-3 py-1 rounded-full ml-2" style={{ backgroundColor: "#dc2626" }}>
          <Ionicons name="shield-checkmark" size={14} color={PARCHMENT} />
          <Text
            className="text-xs ml-1"
            style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}
          >
            ADMIN
          </Text>
        </View>
      );
    }
    if (safeProfile.membershipTier === "isModerator" || isModerator) {
      return (
        <View className="flex-row items-center px-3 py-1 rounded-full ml-2" style={{ backgroundColor: SIERRA_SKY }}>
          <Ionicons name="shield" size={14} color={PARCHMENT} />
          <Text
            className="text-xs ml-1"
            style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}
          >
            MODERATOR
          </Text>
        </View>
      );
    }
    if (isPro) {
      return (
        <View className="flex-row items-center px-3 py-1 rounded-full ml-2" style={{ backgroundColor: GRANITE_GOLD }}>
          <Ionicons name="star" size={14} color={PARCHMENT} />
          <Text
            className="text-xs ml-1"
            style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}
          >
            PRO
          </Text>
        </View>
      );
    }
    return (
      <View className="flex-row items-center px-3 py-1 rounded-full ml-2" style={{ backgroundColor: EARTH_GREEN }}>
        <Text
          className="text-xs"
          style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}
        >
          FREE
        </Text>
      </View>
    );
  };

  const getRoleBadge = () => {
    if (safeProfile.role === "administrator") {
      return (
        <View className="flex-row items-center px-3 py-1 rounded-full ml-2" style={{ backgroundColor: "#dc2626" }}>
          <Ionicons name="shield-checkmark" size={14} color={PARCHMENT} />
          <Text
            className="text-xs ml-1"
            style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}
          >
            ADMIN
          </Text>
        </View>
      );
    }
    if (safeProfile.role === "moderator") {
      return (
        <View className="flex-row items-center px-3 py-1 rounded-full ml-2" style={{ backgroundColor: SIERRA_SKY }}>
          <Ionicons name="shield" size={14} color={PARCHMENT} />
          <Text
            className="text-xs ml-1"
            style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}
          >
            MOD
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-100" edges={["top"]}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Cover Photo */}
        <View style={{ height: COVER_HEIGHT, width: SCREEN_WIDTH }}>
          <ImageBackground
            source={safeProfile.coverPhotoURL ? { uri: safeProfile.coverPhotoURL } : require("../../assets/images/splash-screen.png")}
            style={{ width: "100%", height: "100%", justifyContent: "space-between" }}
            resizeMode="cover"
          >
            {/* Back Button Overlay */}
            <View className="px-4 pt-2">
              <Pressable
                onPress={() => navigation.goBack()}
                className="w-10 h-10 rounded-full items-center justify-center active:opacity-70"
                style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
              >
                <Ionicons name="arrow-back" size={24} color={PARCHMENT} />
              </Pressable>
            </View>
          </ImageBackground>
        </View>

        {/* Profile Picture (overlapping cover) */}
        <View className="px-4" style={{ marginTop: -PROFILE_OVERLAP }}>
          <View className="flex-row items-end justify-between mb-3">
            {/* Profile Picture */}
            <View
              style={{
                width: PROFILE_SIZE,
                height: PROFILE_SIZE,
                borderRadius: PROFILE_SIZE / 2,
                borderWidth: 4,
                borderColor: "white",
                backgroundColor: "white",
              }}
            >
              {safeProfile.photoURL ? (
                <Image
                  source={{ uri: safeProfile.photoURL }}
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
                    <Ionicons name="person" size={56} color={PARCHMENT} />
                  </View>
                )}
            </View>

            {/* Edit Profile Button */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate("EditProfile");
              }}
              className="px-4 py-2 rounded-lg active:opacity-70"
              style={{ backgroundColor: EARTH_GREEN }}
            >
              <Text
                style={{
                  fontFamily: "SourceSans3_600SemiBold",
                  fontSize: 15,
                  color: PARCHMENT,
                }}
              >
                Edit Profile
              <Text
                className="text-2xl font-bold mt-2"
                style={{ fontFamily: "JosefinSlab_700Bold", color: DEEP_FOREST }}
              >
                {safeProfile.displayName || "Camper"}
              </Text>
            <View className="flex-row items-center flex-wrap mb-1">
              <Text
                className="text-2xl"
                style={{ fontFamily: "JosefinSlab_700Bold", color: DEEP_FOREST }}
              >
                {currentUser.displayName}
              {safeProfile.email ? (
                <Text
                  className="text-base text-gray-600 mt-1"
                  style={{ fontFamily: "SourceSans3_400Regular" }}
                >
                  {safeProfile.email}
                </Text>
              ) : (
                <Text
                  className="text-base text-gray-600 mt-1"
                  style={{ fontFamily: "SourceSans3_400Regular", fontStyle: "italic" }}
                >
                  Email not available
                </Text>
              )}
              style={{ fontFamily: "SourceSans3_400Regular", color: EARTH_GREEN }}
            >
              @{currentUser.handle?.replace(/^@+/, "") || "user"}
            </Text>

            {/* Bio / Description */}
            {currentUser.about && (
              <Text
                className="text-base mb-3"
                style={{ fontFamily: "SourceSans3_400Regular", color: DEEP_FOREST }}
              >
                if (!auth.currentUser) {
                  return (
                    <SafeAreaView className="flex-1 bg-parchment" edges={["top"]}>
                      <View className="flex-1 items-center justify-center px-5">
                        <Ionicons name="person-circle-outline" size={80} color={EARTH_GREEN} />
                        <Text className="mt-4 text-xl text-center" style={{ fontFamily: "JosefinSlab_700Bold", color: DEEP_FOREST }}>Not Signed In</Text>
                        <Text className="mt-2 text-center" style={{ fontFamily: "SourceSans3_400Regular", color: EARTH_GREEN }}>Please sign in to view your account</Text>
                      </View>
                    </SafeAreaView>
                  );
                }

                if (isLoading) {
                  return (
                    <SafeAreaView className="flex-1 bg-parchment" edges={["top"]}>
                      <View className="flex-1 items-center justify-center px-5">
                        <Ionicons name="hourglass" size={60} color={EARTH_GREEN} />
                        <Text className="mt-4 text-lg text-center" style={{ fontFamily: "JosefinSlab_700Bold", color: DEEP_FOREST }}>Loading your account...</Text>
                      </View>
                    </SafeAreaView>
                  );
                }

                if (hasTimedOut || loadError) {
                  // Log debug info
                  const user = auth.currentUser;
                  console.error("[AccountScreen] Profile load failed", {
                    uid: user?.uid,
                    providerData: user?.providerData,
                    error: loadError,
                  });
                  return (
                    <SafeAreaView className="flex-1 bg-parchment" edges={["top"]}>
                      <View className="flex-1 items-center justify-center px-5">
                        <Ionicons name="alert-circle-outline" size={60} color={EARTH_GREEN} />
                        <Text className="mt-4 text-lg text-center" style={{ fontFamily: "JosefinSlab_700Bold", color: DEEP_FOREST }}>Unable to load your account</Text>
                        <Text className="mt-2 text-center" style={{ fontFamily: "SourceSans3_400Regular", color: EARTH_GREEN }}>
                          {hasTimedOut ? "Loading timed out. Please try again." : loadError}
                        </Text>
                        <View className="flex-row mt-6 space-x-4">
                          <Pressable onPress={handleRetry} className="px-6 py-2 rounded-lg" style={{ backgroundColor: EARTH_GREEN }}>
                            <Text style={{ color: PARCHMENT, fontFamily: "SourceSans3_600SemiBold" }}>Retry</Text>
                          </Pressable>
                          <Pressable onPress={handleSignOut} className="px-6 py-2 rounded-lg" style={{ backgroundColor: DEEP_FOREST }}>
                            <Text style={{ color: PARCHMENT, fontFamily: "SourceSans3_600SemiBold" }}>Sign Out</Text>
                          </Pressable>
                        </View>
                      </View>
                    </SafeAreaView>
                  );
                }
                    color={activeTab === tab.key ? DEEP_FOREST : EARTH_GREEN}
                  />
                  <Text
                    className="ml-2"
                    style={{
                      fontFamily: activeTab === tab.key ? "SourceSans3_700Bold" : "SourceSans3_600SemiBold",
                      fontSize: 15,
                      color: activeTab === tab.key ? DEEP_FOREST : EARTH_GREEN,
                    }}
                  >
                    {tab.label}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Tab Content */}
        {activeTab === "posts" && (
          <View className="bg-white">
            {/* Upgrade to Pro Card */}
            {!isPro && (
              <View className="px-4 pt-4">
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    navigation.navigate("Paywall");
                  }}
                  className="mb-4 p-4 rounded-xl active:opacity-95"
                  style={{
                    backgroundColor: GRANITE_GOLD,
                  }}
                >
                  <View className="flex-row items-center">
                    <Ionicons name="star" size={32} color={PARCHMENT} />
                    <View className="flex-1 ml-3">
                      <Text
                        className="text-lg mb-1"
                        style={{
                          fontFamily: "JosefinSlab_700Bold",
                          color: PARCHMENT,
                        }}
                      >
                        Upgrade to Pro
                      </Text>
                      <Text
                        style={{
                          fontFamily: "SourceSans3_400Regular",
                          fontSize: 14,
                          color: PARCHMENT,
                        }}
                      >
                        Unlock premium features and unlimited trip planning
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={PARCHMENT} />
                  </View>
                </Pressable>
              </View>
            )}

            {/* Posts Section Header */}
            <View className="px-4 py-3 border-b border-neutral-200">
              <Text
                className="text-lg"
                style={{ fontFamily: "JosefinSlab_700Bold", color: DEEP_FOREST }}
              >
                Your Posts
              </Text>
            </View>

            {/* Mock Posts Feed */}
            <View className="px-4 py-6">
              <View className="items-center justify-center py-12">
                <View
                  className="w-20 h-20 rounded-full items-center justify-center mb-4"
                  style={{ backgroundColor: "rgba(72, 89, 82, 0.1)" }}
                >
                  <Ionicons name="images-outline" size={40} color={EARTH_GREEN} />
                </View>
                <Text
                  className="text-lg mb-2"
                  style={{ fontFamily: "SourceSans3_600SemiBold", color: DEEP_FOREST }}
                >
                  No posts yet
                </Text>
                <Text
                  className="text-center px-8"
                  style={{ fontFamily: "SourceSans3_400Regular", color: EARTH_GREEN }}
                >
                  Share your camping adventures with the community
                </Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === "about" && (
          <View className="bg-white">
            {/* Overview Section */}
            <View className="px-4 py-4 border-b border-neutral-200">
              <Text
                className="text-lg mb-3"
                style={{ fontFamily: "JosefinSlab_700Bold", color: DEEP_FOREST }}
              >
                Overview
              </Text>

              <View className="flex-row items-start mb-3">
                <Ionicons name="mail-outline" size={20} color={EARTH_GREEN} style={{ marginTop: 2 }} />
                <Text
                  className="ml-3 flex-1"
                  style={{ fontFamily: "SourceSans3_400Regular", fontSize: 15, color: DEEP_FOREST }}
                >
                  {currentUser.email}
                </Text>
              </View>

              <View className="flex-row items-start mb-3">
                <Ionicons name="calendar-outline" size={20} color={EARTH_GREEN} style={{ marginTop: 2 }} />
                <Text
                  className="ml-3 flex-1"
                  style={{ fontFamily: "SourceSans3_400Regular", fontSize: 15, color: DEEP_FOREST }}
                >
                  Joined {new Date(currentUser.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </Text>
              </View>

              <View className="flex-row items-start">
                {(currentUser.membershipTier === "isAdmin" || isAdministrator) && (
                  <>
                    <Ionicons name="shield-checkmark" size={20} color="#dc2626" style={{ marginTop: 2 }} />
                    <Text
                      className="ml-3 flex-1"
                      style={{ fontFamily: "SourceSans3_400Regular", fontSize: 15, color: DEEP_FOREST }}
                    >
                      Admin - Full Access
                    </Text>
                  </>
                )}
                {(currentUser.membershipTier === "isModerator" || (isModerator && !isAdministrator)) && (
                  <>
                    <Ionicons name="shield" size={20} color={SIERRA_SKY} style={{ marginTop: 2 }} />
                    <Text
                      className="ml-3 flex-1"
                      style={{ fontFamily: "SourceSans3_400Regular", fontSize: 15, color: DEEP_FOREST }}
                    >
                      Moderator
                    </Text>
                  </>
                )}
                {isPro && !isAdministrator && !isModerator && (
                  <>
                    <Ionicons name="star" size={20} color={GRANITE_GOLD} style={{ marginTop: 2 }} />
                    <Text
                      className="ml-3 flex-1"
                      style={{ fontFamily: "SourceSans3_400Regular", fontSize: 15, color: DEEP_FOREST }}
                    >
                      Pro Member
                    </Text>
                  </>
                )}
                {!isPro && !isAdministrator && !isModerator && (
                  <>
                    <Ionicons name="person-outline" size={20} color={EARTH_GREEN} style={{ marginTop: 2 }} />
                    <Text
                      className="ml-3 flex-1"
                      style={{ fontFamily: "SourceSans3_400Regular", fontSize: 15, color: DEEP_FOREST }}
                    >
                      Free Member
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* Camping Stats */}
            <View className="px-4 py-4 border-b border-neutral-200">
              <Text
                className="text-lg mb-3"
                style={{ fontFamily: "JosefinSlab_700Bold", color: DEEP_FOREST }}
              >
                Camping Stats
              </Text>

              <View className="flex-row flex-wrap">
                <View className="w-1/2 mb-4">
                  <View className="flex-row items-center mb-1">
                    <Ionicons name="bonfire-outline" size={18} color={EARTH_GREEN} />
                    <Text
                      className="ml-2 text-2xl"
                      style={{ fontFamily: "SourceSans3_700Bold", color: DEEP_FOREST }}
                    >
                      12
                    </Text>
                  </View>
                  <Text
                    style={{ fontFamily: "SourceSans3_400Regular", fontSize: 14, color: EARTH_GREEN }}
                  >
                    Trips Completed
                  </Text>
                </View>

                <View className="w-1/2 mb-4">
                  <View className="flex-row items-center mb-1">
                    <Ionicons name="location-outline" size={18} color={EARTH_GREEN} />
                    <Text
                      className="ml-2 text-2xl"
                      style={{ fontFamily: "SourceSans3_700Bold", color: DEEP_FOREST }}
                    >
                      8
                    </Text>
                  </View>
                  <Text
                    style={{ fontFamily: "SourceSans3_400Regular", fontSize: 14, color: EARTH_GREEN }}
                  >
                    Parks Visited
                  </Text>
                </View>

                <View className="w-1/2 mb-4">
                  <View className="flex-row items-center mb-1">
                    <Ionicons name="images-outline" size={18} color={EARTH_GREEN} />
                    <Text
                      className="ml-2 text-2xl"
                      style={{ fontFamily: "SourceSans3_700Bold", color: DEEP_FOREST }}
                    >
                      47
                    </Text>
                  </View>
                  <Text
                    style={{ fontFamily: "SourceSans3_400Regular", fontSize: 14, color: EARTH_GREEN }}
                  >
                    Photos Shared
                  </Text>
                </View>

                <View className="w-1/2 mb-4">
                  <View className="flex-row items-center mb-1">
                    <Ionicons name="trophy-outline" size={18} color={EARTH_GREEN} />
                    <Text
                      className="ml-2 text-2xl"
                      style={{ fontFamily: "SourceSans3_700Bold", color: DEEP_FOREST }}
                    >
                      5
                    </Text>
                  </View>
                  <Text
                    style={{ fontFamily: "SourceSans3_400Regular", fontSize: 14, color: EARTH_GREEN }}
                  >
                    Achievements
                  </Text>
                </View>
              </View>
            </View>

            {/* Camping Preferences */}
            {(currentUser.favoriteCampingStyle || (currentUser.favoriteGear && currentUser.favoriteGear.length > 0)) && (
              <View className="px-4 py-4 border-b border-neutral-200">
                <Text
                  className="text-lg mb-3"
                  style={{ fontFamily: "JosefinSlab_700Bold", color: DEEP_FOREST }}
                >
                  Camping Preferences
                </Text>

                {currentUser.favoriteCampingStyle && (
                  <View className="flex-row items-start mb-3">
                    <Ionicons name="compass-outline" size={20} color={EARTH_GREEN} style={{ marginTop: 2 }} />
                    <View className="ml-3 flex-1">
                      <Text
                        style={{ fontFamily: "SourceSans3_600SemiBold", fontSize: 14, color: EARTH_GREEN }}
                      >
                        Favorite Camping Style
                      </Text>
                      <Text
                        style={{ fontFamily: "SourceSans3_400Regular", fontSize: 15, color: DEEP_FOREST }}
                      >
                        {currentUser.favoriteCampingStyle.split('_').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                        ).join(' ')}
                      </Text>
                    </View>
                  </View>
                )}

                {currentUser.favoriteGear && currentUser.favoriteGear.length > 0 && (
                  <View className="flex-row items-start">
                    <Ionicons name="bag-handle-outline" size={20} color={EARTH_GREEN} style={{ marginTop: 2 }} />
                    <View className="ml-3 flex-1">
                      <Text
                        style={{ fontFamily: "SourceSans3_600SemiBold", fontSize: 14, color: EARTH_GREEN }}
                      >
                        Favorite Gear
                      </Text>
                      <Text
                        style={{ fontFamily: "SourceSans3_400Regular", fontSize: 15, color: DEEP_FOREST }}
                      >
                        {currentUser.favoriteGear.map(gear => 
                          gear.charAt(0).toUpperCase() + gear.slice(1)
                        ).join(', ')}
                        {currentUser.favoriteGearDetails && ` - ${currentUser.favoriteGearDetails}`}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Account Settings */}
            <View className="px-4 py-4">
              <Text
                className="text-lg mb-3"
                style={{ fontFamily: "JosefinSlab_700Bold", color: DEEP_FOREST }}
              >
                Account Settings
              </Text>

              <Pressable
                className="flex-row items-center justify-between py-3 active:opacity-70"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate("Settings");
                }}
              >
                <View className="flex-row items-center flex-1">
                  <Ionicons name="person-outline" size={22} color={EARTH_GREEN} />
                  <Text
                    className="ml-3"
                    style={{ fontFamily: "SourceSans3_400Regular", fontSize: 16, color: DEEP_FOREST }}
                  >
                    Edit Profile Information
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color={EARTH_GREEN} />
              </Pressable>

              <Pressable
                className="flex-row items-center justify-between py-3 active:opacity-70"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate("Settings");
                }}
              >
                <View className="flex-row items-center flex-1">
                  <Ionicons name="mail-outline" size={22} color={EARTH_GREEN} />
                  <Text
                    className="ml-3"
                    style={{ fontFamily: "SourceSans3_400Regular", fontSize: 16, color: DEEP_FOREST }}
                  >
                    Email & Password
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color={EARTH_GREEN} />
              </Pressable>

              <Pressable
                className="flex-row items-center justify-between py-3 active:opacity-70"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate("Settings");
                }}
              >
                <View className="flex-row items-center flex-1">
                  <Ionicons name="notifications-outline" size={22} color={EARTH_GREEN} />
                  <Text
                    className="ml-3"
                    style={{ fontFamily: "SourceSans3_400Regular", fontSize: 16, color: DEEP_FOREST }}
                  >
                    Notification Settings
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color={EARTH_GREEN} />
              </Pressable>

              <Pressable
                className="flex-row items-center justify-between py-3 active:opacity-70"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate("Settings");
                }}
              >
                <View className="flex-row items-center flex-1">
                  <Ionicons name="lock-closed-outline" size={22} color={EARTH_GREEN} />
                  <Text
                    className="ml-3"
                    style={{ fontFamily: "SourceSans3_400Regular", fontSize: 16, color: DEEP_FOREST }}
                  >
                    Privacy Settings
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color={EARTH_GREEN} />
              </Pressable>

              {isPro && (
                <Pressable
                  className="flex-row items-center justify-between py-3 active:opacity-70"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate("Paywall");
                  }}
                >
                  <View className="flex-row items-center flex-1">
                    <Ionicons name="card-outline" size={22} color={EARTH_GREEN} />
                    <Text
                      className="ml-3"
                      style={{ fontFamily: "SourceSans3_400Regular", fontSize: 16, color: DEEP_FOREST }}
                    >
                      Manage Subscription
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color={EARTH_GREEN} />
                </Pressable>
              )}
            </View>
          </View>
        )}

        {activeTab === "moderator" && isModerator && (
          <View className="bg-white">
            <ModeratorPanel currentUserId={currentUser.id} />
          </View>
        )}

        {activeTab === "admin" && isAdministrator && (
          <View className="bg-white">
            <AdminPanel currentUserId={currentUser.id} />
          </View>
        )}

        {/* Bottom Spacing */}
        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
