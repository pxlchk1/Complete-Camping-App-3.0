import React, { useEffect, useMemo } from "react";
import { View, Text, ScrollView, Pressable, ImageBackground, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

// Components
import AccountButtonHeader from "../components/AccountButtonHeader";
import { SectionTitle, BodyText, BodyTextMedium } from "../components/Typography";
import PushPermissionPrompt from "../components/PushPermissionPrompt";

// State
import { useTripsStore } from "../state/tripsStore";
import { useGearStore } from "../state/gearStore";
import { useUserStore, createTestUser } from "../state/userStore";
import { usePlanTabStore } from "../state/planTabStore";

// Utils
import { getWelcomeTitle, getWelcomeSubtext } from "../utils/welcomeCopy";

// Constants
import {
  DEEP_FOREST,
  EARTH_GREEN,
  GRANITE_GOLD,
  RIVER_ROCK,
  SIERRA_SKY,
  PARCHMENT,
  PARCHMENT_BACKGROUND,
  CARD_BACKGROUND_LIGHT,
  BORDER_SOFT,
  TEXT_PRIMARY_STRONG,
  TEXT_SECONDARY,
  TEXT_ON_DARK,
} from "../constants/colors";
import { HERO_IMAGES, LOGOS } from "../constants/images";
import { RootStackParamList } from "../navigation/types";
import { auth } from "../config/firebase";

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Home">;

// Daily camping tips
const CAMPING_TIPS = [
  "Always check the weather forecast before your trip and adjust your gear list accordingly.",
  "Pack light, pack right - you can always layer clothing!",
  "Bring a headlamp or flashlight for each person in your group.",
  "Store food properly to avoid attracting wildlife to your campsite.",
  "Leave No Trace - pack out everything you pack in.",
  "Bring extra batteries and a portable charger for electronics.",
  "Test all your gear at home before heading out on your trip.",
  "Bring a first aid kit and know how to use it.",
  "Set up camp at least 200 feet from water sources.",
  "Arrive at your campsite with enough daylight to set up comfortably.",
];



const safeHaptic = () => {
  // Don’t let haptics failures block navigation.
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
};

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const trips = useTripsStore((s) => s.trips);
  const gearLists = useGearStore((s) => s.packingLists);
  const insets = useSafeAreaInsets();
  const setCurrentUser = useUserStore((s) => s.setCurrentUser);
  const currentUser = useUserStore((s) => s.currentUser);
  const setActivePlanTab = usePlanTabStore((s) => s.setActiveTab);

  /**
   * IMPORTANT: this was previously running in production too.
   * Keep test-user auto-creation strictly DEV-only so it never pollutes real users.
   */
  useEffect(() => {
    if (!__DEV__) return;

    const existing = useUserStore.getState().currentUser;
    // eslint-disable-next-line no-console
    console.log("🔍 [HomeScreen] Current User:", JSON.stringify(existing, null, 2));

    if (!existing) {
      // eslint-disable-next-line no-console
      console.log("⚠️ [HomeScreen] No user found, creating test user");
      setCurrentUser(createTestUser("administrator"));
    } else {
      // eslint-disable-next-line no-console
      console.log("✅ [HomeScreen] User exists:", {
        id: existing.id,
        displayName: existing.displayName,
        handle: existing.handle,
        membershipTier: existing.membershipTier,
      });
    }
  }, [setCurrentUser]);

  // Get daily tip (rotates based on day of year)
  const currentTip = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return CAMPING_TIPS[dayOfYear % CAMPING_TIPS.length];
  }, []);

  // User display data - show "Camper" if not logged in, otherwise show first name or display name
  // Check Firebase auth state - if not logged in, show generic avatar and "Welcome, Camper!"
  const isLoggedIn = !!auth.currentUser;
  const userAvatarSource = isLoggedIn && currentUser?.photoURL 
    ? { uri: currentUser.photoURL } 
    : LOGOS.APP_ICON;

  // Welcome greeting and message using centralized utility
  const welcomeGreeting = getWelcomeTitle(currentUser?.displayName, isLoggedIn);
  const welcomeMessage = getWelcomeSubtext(currentUser?.favoriteCampingStyle, isLoggedIn);

  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log("🎯 [HomeScreen] Welcome Greeting:", welcomeGreeting);
    // eslint-disable-next-line no-console
    console.log("🎯 [HomeScreen] Welcome Message:", welcomeMessage);
    // eslint-disable-next-line no-console
    console.log("🎯 [HomeScreen] Current User Display Name:", currentUser?.displayName);
    // eslint-disable-next-line no-console
    console.log("🎯 [HomeScreen] Favorite Camping Style:", currentUser?.favoriteCampingStyle);
    // Prevent “unused var” lint confusion if you re-enable sections that rely on these.
    void trips;
    void gearLists;
  }

  const bottomSpacer = 50 + Math.max(insets.bottom, 18) + 12;

  /**
   * Merge-conflict fix:
   * - Prefer the nested navigation (HomeTabs -> Connect -> Ask) if available.
   * - Fall back to QuestionsListScreen if that’s the route your navigator uses.
   */
  const navigateToAsk = () => {
    const nav: any = navigation as any;
    const state = nav?.getState?.();
    const routeNames: string[] = state?.routeNames ?? [];

    if (routeNames.includes("HomeTabs")) {
      nav.navigate("HomeTabs", { screen: "Connect", params: { screen: "Ask" } });
      return;
    }

    if (routeNames.includes("QuestionsListScreen")) {
      nav.navigate("QuestionsListScreen");
      return;
    }

    // Last resort: try the most likely direct routes without crashing.
    // These won’t throw; RN will warn if missing.
    nav.navigate("Connect");
  };

  return (
    <View className="flex-1 bg-forest">
      {/* Push Permission Soft Prompt - shows after 1+ core action */}
      <PushPermissionPrompt />
      
      <View className="flex-1" style={{ backgroundColor: PARCHMENT_BACKGROUND }}>
        {/* Welcome Hero Image - full bleed */}
        <View style={{ height: 200 + insets.top }}>
          <ImageBackground
            source={HERO_IMAGES.WELCOME}
            style={{ flex: 1 }}
            resizeMode="cover"
            accessibilityLabel="Welcome to camping - forest scene"
          >
            {/* Gradient Overlay - covers full image including safe area */}
            <LinearGradient
              colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.6)"]}
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
              }}
            />
            <View className="flex-1" style={{ paddingTop: insets.top }}>
              {/* Account Button - Top Right */}
              <AccountButtonHeader color={TEXT_ON_DARK} />

              {/* Welcome message with centered avatar above */}
              <View className="flex-1 justify-end">
                <View className="items-center px-4 pb-4" style={{ zIndex: 1 }}>
                  {/* Centered Avatar */}
                  <View
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: PARCHMENT,
                      overflow: "hidden",
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: 12,
                      borderWidth: 3,
                      borderColor: PARCHMENT,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 4,
                      elevation: 4,
                    }}
                  >
                    <Image source={userAvatarSource} style={{ width: 80, height: 80 }} resizeMode="cover" />
                  </View>
                  {/* Welcome Text - Centered */}
                  <Text
                    className="text-2xl text-center"
                    style={{
                      fontFamily: "Raleway_700Bold",
                      color: TEXT_ON_DARK,
                      textShadowColor: "rgba(0, 0, 0, 0.5)",
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 4,
                    }}
                  >
                    {welcomeGreeting}
                  </Text>
                  <Text
                    className="mt-1 text-center"
                    style={{
                      fontFamily: "SourceSans3_400Regular",
                      color: TEXT_ON_DARK,
                      textShadowColor: "rgba(0, 0, 0, 0.5)",
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 3,
                    }}
                  >
                    {welcomeMessage}
                  </Text>
                </View>
              </View>
            </View>
          </ImageBackground>
        </View>

        <ScrollView
          className="flex-1 px-4 pt-4"
          contentInsetAdjustmentBehavior="never"
          contentContainerStyle={{ paddingBottom: bottomSpacer }}
          showsVerticalScrollIndicator={false}
        >
          {/* Quick Actions */}
          <View className="mb-6">
            <SectionTitle className="mb-4" color={DEEP_FOREST}>
              Quick Actions
            </SectionTitle>

            <View className="space-y-3">
              {/* Plan Trip */}
              <Pressable
                className="rounded-xl active:scale-95"
                style={{ backgroundColor: "#59625C", paddingVertical: 14, borderRadius: 10 }}
                onPress={() => {
                  safeHaptic();
                  setActivePlanTab("trips");
                  navigation.navigate("Plan");
                }}
                accessibilityLabel="Plan Trip"
                accessibilityRole="button"
              >
                <View className="flex-row items-center justify-between px-4">
                  <View className="flex-row items-center">
                    <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
                    <Text
                      className="ml-3"
                      style={{
                        fontFamily: "SourceSans3_600SemiBold",
                        fontSize: 15,
                        textTransform: "uppercase",
                        letterSpacing: 0.08,
                        textAlign: "center",
                        color: "#FFFFFF",
                      }}
                    >
                      Plan Trip
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                </View>
              </Pressable>

              {/* Packing List */}
              <Pressable
                className="rounded-xl active:scale-95"
                style={{ backgroundColor: "#8A8165", paddingVertical: 14, borderRadius: 10 }}
                onPress={() => {
                  safeHaptic();
                  setActivePlanTab("packing");
                  navigation.navigate("Plan");
                }}
                accessibilityLabel="Packing List"
                accessibilityRole="button"
              >
                <View className="flex-row items-center justify-between px-4">
                  <View className="flex-row items-center">
                    <Ionicons name="list" size={24} color="#FFFFFF" />
                    <Text
                      className="ml-3"
                      style={{
                        fontFamily: "SourceSans3_600SemiBold",
                        fontSize: 15,
                        textTransform: "uppercase",
                        letterSpacing: 0.08,
                        textAlign: "center",
                        color: "#FFFFFF",
                      }}
                    >
                      Packing List
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                </View>
              </Pressable>

              {/* Meal Plans */}
              <Pressable
                className="rounded-xl active:scale-95"
                style={{ backgroundColor: "#8B8577", paddingVertical: 14, borderRadius: 10 }}
                onPress={() => {
                  safeHaptic();
                  setActivePlanTab("meals");
                  navigation.navigate("Plan");
                }}
                accessibilityLabel="Meal Plans"
                accessibilityRole="button"
              >
                <View className="flex-row items-center justify-between px-4">
                  <View className="flex-row items-center">
                    <Ionicons name="restaurant-outline" size={24} color="#FFFFFF" />
                    <Text
                      className="ml-3"
                      style={{
                        fontFamily: "SourceSans3_600SemiBold",
                        fontSize: 15,
                        textTransform: "uppercase",
                        letterSpacing: 0.08,
                        textAlign: "center",
                        color: "#FFFFFF",
                      }}
                    >
                      Meal Plans
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                </View>
              </Pressable>

              {/* Weather Forecast */}
              <Pressable
                className="rounded-xl active:scale-95"
                style={{ backgroundColor: "#8A8165", paddingVertical: 14, borderRadius: 10 }}
                onPress={() => {
                  safeHaptic();
                  setActivePlanTab("weather");
                  navigation.navigate("Plan");
                }}
                accessibilityLabel="Weather Forecast"
                accessibilityRole="button"
              >
                <View className="flex-row items-center justify-between px-4">
                  <View className="flex-row items-center">
                    <Ionicons name="cloud-outline" size={24} color="#FFFFFF" />
                    <Text
                      className="ml-3"
                      style={{
                        fontFamily: "SourceSans3_600SemiBold",
                        fontSize: 15,
                        textTransform: "uppercase",
                        letterSpacing: 0.08,
                        textAlign: "center",
                        color: "#FFFFFF",
                      }}
                    >
                      Weather Forecast
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                </View>
              </Pressable>

              {/* Ask a Camper */}
              <Pressable
                className="rounded-xl active:scale-95"
                style={{ backgroundColor: "#5A635C", paddingVertical: 14, borderRadius: 10 }}
                onPress={() => {
                  safeHaptic();
                  navigateToAsk();
                }}
                accessibilityLabel="Ask a Camper"
                accessibilityRole="button"
              >
                <View className="flex-row items-center justify-between px-4">
                  <View className="flex-row items-center">
                    <Ionicons name="chatbubble-ellipses-outline" size={24} color="#FFFFFF" />
                    <Text
                      className="ml-3"
                      style={{
                        fontFamily: "SourceSans3_600SemiBold",
                        fontSize: 15,
                        textTransform: "uppercase",
                        letterSpacing: 0.08,
                        textAlign: "center",
                        color: "#FFFFFF",
                      }}
                    >
                      Ask a Camper
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                </View>
              </Pressable>
            </View>
          </View>

          {/* Daily Tip Banner */}
          <View className="rounded-xl p-4 mb-6 border" style={{ backgroundColor: "#C2B9A5", borderColor: BORDER_SOFT }}>
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <Ionicons name="bulb" size={20} color={GRANITE_GOLD} />
                <BodyTextMedium className="ml-2" color={TEXT_PRIMARY_STRONG}>
                  Daily Camping Tip
                </BodyTextMedium>
              </View>
            </View>
            <BodyText className="leading-5" color={TEXT_PRIMARY_STRONG}>
              {currentTip}
            </BodyText>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}