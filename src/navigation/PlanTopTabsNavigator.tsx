/**
 * Plan Top Tabs Navigator
 * Material top tabs for Trips, Parks, Weather, Packing, Meals
 */

import React, { useEffect, useRef } from "react";
// ...existing imports...
import { usePlanTabStore } from "../state/planTabStore";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { View, ImageBackground, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigationState } from "@react-navigation/native";
import MyTripsScreen from "../screens/MyTripsScreen";
import ParksBrowseScreen from "../screens/ParksBrowseScreen";
import WeatherScreen from "../screens/WeatherScreen";
import PackingTabScreen from "../screens/PackingTabScreen";
import MealsScreen from "../screens/MealsScreen";
import AccountButtonHeader from "../components/AccountButtonHeader";
import { DEEP_FOREST, PARCHMENT, BORDER_SOFT, TEXT_ON_DARK } from "../constants/colors";
import { HERO_IMAGES } from "../constants/images";

const Tab = createMaterialTopTabNavigator();

// Map tab routes to hero images
const getHeroImage = (routeName: string) => {
  switch (routeName) {
    case "Plan":
      return HERO_IMAGES.PLAN_TRIP;
    case "Campgrounds":
      return HERO_IMAGES.HEADER;
    case "Meals":
      return HERO_IMAGES.MEALS;
    case "Pack":
      return HERO_IMAGES.PACKING;
    case "Weather":
      return HERO_IMAGES.WEATHER;
    default:
      return HERO_IMAGES.PLAN_TRIP;
  }
};

// Map tab routes to titles and descriptions
const getHeroContent = (routeName: string) => {
  switch (routeName) {
    case "Plan":
      return { title: "Plan your trip", description: "Organize trips, explore parks, and prepare for adventure" };
    case "Campgrounds":
      return { title: "Find a campground", description: "Discover campgrounds and parks for your next adventure" };
    case "Meals":
      return { title: "Meal Planner", description: "Plan delicious meals for your camping adventure" };
    case "Pack":
      return { title: "Packing List", description: "Build and organize your gear list for every trip" };
    case "Weather":
      return { title: "Weather", description: "Check conditions for your camping destination" };
    default:
      return { title: "Plan your trip", description: "Organize trips, explore parks, and prepare for adventure" };
  }
};

function HeroHeader({ activeTab }: { activeTab: string }) {
  const insets = useSafeAreaInsets();
  
  const heroImage = getHeroImage(activeTab);
  const { title, description } = getHeroContent(activeTab);

  return (
    <View style={{ height: 200 + insets.top }}>
      <ImageBackground
        source={heroImage}
        style={{ flex: 1 }}
        resizeMode="cover"
        accessibilityLabel="Planning camping scene"
      >
        <View className="flex-1" style={{ paddingTop: insets.top }}>
          {/* Account Button - Top Right */}
          <AccountButtonHeader color={TEXT_ON_DARK} />

          <View className="flex-1 justify-end px-6 pb-4">
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.6)"]}
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 100,
              }}
            />
            <Text
              className="text-parchment text-3xl"
              style={{
                fontFamily: "JosefinSlab_700Bold",
                textShadowColor: "rgba(0, 0, 0, 0.5)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
                zIndex: 1,
              }}
            >
              {title}
            </Text>
            <Text
              className="text-parchment mt-2"
              style={{
                fontFamily: "SourceSans3_400Regular",
                textShadowColor: "rgba(0, 0, 0, 0.5)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 3,
                zIndex: 1,
              }}
            >
              {description}
            </Text>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

export default function PlanTopTabsNavigator() {
  // Zustand store for tab state
  const activeTab = usePlanTabStore((s) => s.activeTab);
  const setActiveTab = usePlanTabStore((s) => s.setActiveTab);
  const tabNames = ["Plan", "Campgrounds", "Meals", "Pack", "Weather"];
  const tabKeyToRoute: Record<string, string> = {
    plan: "Plan",
    campgrounds: "Campgrounds",
    meals: "Meals",
    pack: "Pack",
    weather: "Weather",
  };
  const routeToTabKey: Record<string, string> = {
    Plan: "plan",
    Campgrounds: "campgrounds",
    Meals: "meals",
    Pack: "pack",
    Weather: "weather",
  };

  // Ref to prevent initial tab reset on every render
  const isFirstRender = useRef(true);
  const [initialTab, setInitialTab] = React.useState(tabKeyToRoute[activeTab] || "Plan");

  useEffect(() => {
    if (isFirstRender.current) {
      setInitialTab(tabKeyToRoute[activeTab] || "Plan");
      isFirstRender.current = false;
    }
  }, [activeTab]);

  return (
    <View className="flex-1 bg-parchment">
      {/* Hero Header */}
      <HeroHeader activeTab={tabKeyToRoute[activeTab] || "Plan"} />

      {/* Material Top Tabs */}
      <Tab.Navigator
        initialRouteName={initialTab}
        screenOptions={{
          tabBarStyle: {
            backgroundColor: PARCHMENT,
            borderBottomWidth: 1,
            borderBottomColor: BORDER_SOFT,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarActiveTintColor: DEEP_FOREST,
          tabBarInactiveTintColor: "#696969",
          tabBarIndicatorStyle: {
            backgroundColor: "#f59e0b",
            height: 3,
          },
          tabBarLabelStyle: {
            fontFamily: "SourceSans3_600SemiBold",
            fontSize: 13,
            textTransform: "none",
          },
          tabBarScrollEnabled: true,
          tabBarItemStyle: {
            width: "auto",
            minWidth: 80,
          },
        }}
        screenListeners={{
          state: (e) => {
            const routeName = e.data.state.routes[e.data.state.index].name;
            const tabKey = routeToTabKey[routeName];
            if (tabKey && tabKey !== activeTab) {
              setActiveTab(tabKey);
            }
          },
        }}
      >
        <Tab.Screen name="Plan" component={MyTripsScreen} />
        <Tab.Screen name="Campgrounds" component={ParksBrowseScreen} />
        <Tab.Screen name="Meals" component={MealsScreen} />
        <Tab.Screen name="Pack" component={PackingTabScreen} />
        <Tab.Screen name="Weather" component={WeatherScreen} />
      </Tab.Navigator>
    </View>
  );
}
