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

// State
import { useTripsStore } from "../state/tripsStore";
import { useGearStore } from "../state/gearStore";
import { useUserStore, createTestUser } from "../state/userStore";
import { usePlanTabStore } from "../state/planTabStore";

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

// Camping style welcome messages
const CAMPING_STYLE_MESSAGES: { [key: string]: string } = {
  backpacking: "Ready to hit the trails? Every mile brings new adventures.",
  "car camping": "Time to load up and chase the sunset. Your perfect campsite awaits!",
  "rv camping": "The open road is calling. Let's roll into your next adventure!",
  glamping: "Luxury meets nature. Your comfortable escape is just ahead!",
  "dispersed camping": "Off the beaten path and into the wild. True freedom awaits!",
  "winter camping": "Embrace the cold and find beauty in the quiet of winter.",
  "beach camping": "Sand, surf, and starlight. Paradise is waiting for you!",
  "mountain camping": "The peaks are calling and you must go. Adventure awaits!",
  "desert camping": "Under endless skies and stars. The desert has its own magic.",
  "forest camping": "Into the woods where peace and wonder grow.",
  overlanding: "Your vehicle is your home, the world is your destination.",
  "motorcycle camping": "Two wheels, endless roads, infinite possibilities.",
  "canoe camping": "Paddle your way to serenity. The water is your highway.",
  "kayak camping": "Glide into adventure. Remote shores are calling your name.",
};

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

  // User display data - show "Camper" if no user, otherwise show first name or display name
  const userFirstName = currentUser?.displayName?.split(" ")[0] || currentUser?.handle || "Camper";
  const userAvatarSource = currentUser?.photoURL ? { uri: currentUser.photoURL } : LOGOS.APP_ICON;

  // Determine welcome message based on subscription and camping style
  const getWelcomeMessage = () => {
    if (!currentUser) return "Your camping adventure starts here";

    const isPaidSubscriber =
      currentUser.membershipTier === "subscribed" ||
      currentUser.membershipTier === "isAdmin" ||
      currentUser.membershipTier === "isModerator";

    if (!isPaidSubscriber) return "Your camping adventure starts here";

    if (currentUser.favoriteCampingStyle) {
      const styleKey = currentUser.favoriteCampingStyle.toLowerCase();
      return CAMPING_STYLE_MESSAGES[styleKey] || "Your camping adventure starts here";
    }

    return "Your camping adventure starts here";
  };

  const welcomeMessage = getWelcomeMessage();

  const welcomeGreeting =
    currentUser &&
    (currentUser.membershipTier === "subscribed" ||
      currentUser.membershipTier === "isAdmin" ||
      currentUser.membershipTier === "isModerator")
      ? `Welcome back, ${userFirstName}!`
      : currentUser
      ? `Welcome, ${userFirstName}!`
      : "Welcome, Camper!";

  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log("🎯 [HomeScreen] Welcome Greeting:", welcomeGreeting);
    // eslint-disable-next-line no-console
    console.log("🎯 [HomeScreen] User First Name:", userFirstName);
    // eslint-disable-next-line no-console
    console.log("🎯 [HomeScreen] Current User Display Name:", currentUser?.displayName);
    // eslint-disable-next-line no-console
    console.log("🎯 [HomeScreen] Current User Membership:", currentUser?.membershipTier);
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
      <View className="flex-1" style={{ backgroundColor: PARCHMENT_BACKGROUND }}>
        {/* Welcome Hero Image - full bleed */}
        <View style={{ height: 200 + insets.top }}>
          <ImageBackground
            source={HERO_IMAGES.WELCOME}
            style={{ flex: 1 }}
            resizeMode="cover"
            accessibilityLabel="Welcome to camping - forest scene"
          >
            <View className="flex-1" style={{ paddingTop: insets.top }}>
              {/* Account Button - Top Right */}
              <AccountButtonHeader color={TEXT_ON_DARK} />

              {/* Welcome message with avatar at bottom */}
              <View className="flex-1 justify-end">
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.4)"]}
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 100,
                  }}
                />
                <View className="flex-row items-center px-4 pb-4" style={{ zIndex: 1 }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: PARCHMENT,
                      overflow: "hidden",
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 12,
                    }}
                  >
                    <Image source={userAvatarSource} style={{ width: 48, height: 48 }} resizeMode="cover" />
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-3xl"
                      style={{
                        fontFamily: "JosefinSlab_700Bold",
                        color: TEXT_ON_DARK,
                        textShadowColor: "rgba(0, 0, 0, 0.5)",
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 4,
                      }}
                    >
                      {welcomeGreeting}
                    </Text>
                    <Text
                      className="mt-1"
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
                className="rounded-xl active:scale-95 bg-forest"
                style={{ backgroundColor: DEEP_FOREST, paddingVertical: 14, borderRadius: 10 }}
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
                    <Ionicons name="add-circle-outline" size={24} color={PARCHMENT} />
                    <Text
                      className="text-parchment ml-3"
                      style={{
                        fontFamily: "SourceSans3_600SemiBold",
                        fontSize: 15,
                        textTransform: "uppercase",
                        letterSpacing: 0.08,
                        textAlign: "center",
                      }}
                    >
                      Plan Trip
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={PARCHMENT} />
                </View>
              </Pressable>

              {/* Packing List */}
              <Pressable
                className="rounded-xl active:scale-95 bg-granite"
                style={{ backgroundColor: GRANITE_GOLD, paddingVertical: 14, borderRadius: 10 }}
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
                    <Ionicons name="list" size={24} color={PARCHMENT} />
                    <Text
                      className="text-parchment ml-3"
                      style={{
                        fontFamily: "SourceSans3_600SemiBold",
                        fontSize: 15,
                        textTransform: "uppercase",
                        letterSpacing: 0.08,
                        textAlign: "center",
                      }}
                    >
                      Packing List
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={PARCHMENT} />
                </View>
              </Pressable>

              {/* Meal Plans */}
              <Pressable
                className="rounded-xl active:scale-95 bg-riverRock"
                style={{ backgroundColor: RIVER_ROCK, paddingVertical: 14, borderRadius: 10 }}
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
                    <Ionicons name="restaurant-outline" size={24} color={PARCHMENT} />
                    <Text
                      className="text-parchment ml-3"
                      style={{
                        fontFamily: "SourceSans3_600SemiBold",
                        fontSize: 15,
                        textTransform: "uppercase",
                        letterSpacing: 0.08,
                        textAlign: "center",
                      }}
                    >
                      Meal Plans
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={PARCHMENT} />
                </View>
              </Pressable>

              {/* Weather Forecast */}
              <Pressable
                className="rounded-xl active:scale-95"
                style={{ backgroundColor: SIERRA_SKY, paddingVertical: 14, borderRadius: 10 }}
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
                    <Ionicons name="cloud-outline" size={24} color={PARCHMENT} />
                    <Text
                      className="text-parchment ml-3"
                      style={{
                        fontFamily: "SourceSans3_600SemiBold",
                        fontSize: 15,
                        textTransform: "uppercase",
                        letterSpacing: 0.08,
                        textAlign: "center",
                      }}
                    >
                      Weather Forecast
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={PARCHMENT} />
                </View>
              </Pressable>

              {/* Ask a Camper */}
              <Pressable
                className="rounded-xl active:scale-95 bg-riverRock"
                style={{ backgroundColor: RIVER_ROCK, paddingVertical: 14, borderRadius: 10 }}
                onPress={() => {
                  safeHaptic();
                  navigateToAsk();
                }}
                accessibilityLabel="Ask a Camper"
                accessibilityRole="button"
              >
                <View className="flex-row items-center justify-between px-4">
                  <View className="flex-row items-center">
                    <Ionicons name="chatbubble-ellipses-outline" size={24} color={PARCHMENT} />
                    <Text
                      className="text-parchment ml-3"
                      style={{
                        fontFamily: "SourceSans3_600SemiBold",
                        fontSize: 15,
                        textTransform: "uppercase",
                        letterSpacing: 0.08,
                        textAlign: "center",
                      }}
                    >
                      Ask a Camper
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={PARCHMENT} />
                </View>
              </Pressable>
            </View>
          </View>

          {/* Daily Tip Banner */}
          <View className="rounded-xl p-4 mb-6 border" style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}>
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