/**
 * Plan Top Tabs Navigator
 * Material top tabs for Trips, Campgrounds, Meals, Pack, Weather
 */

import React, { useEffect, useRef, useState } from "react";
import { View, ImageBackground, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";

import { usePlanTabStore } from "../state/planTabStore";

import AccountButtonHeader from "../components/AccountButtonHeader";

import MyTripsScreen from "../screens/MyTripsScreen";
import ParksBrowseScreen from "../screens/ParksBrowseScreen";
import MealsScreen from "../screens/MealsScreen";
import PackingTabScreen from "../screens/PackingTabScreen";
import WeatherScreen from "../screens/WeatherScreen";
import PlanSafeScreen from "../screens/PlanSafeScreen";

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
        <View style={{ flex: 1, paddingTop: insets.top }}>
          {/* Account Button - Top Right */}
          <AccountButtonHeader color={TEXT_ON_DARK} />

          <View style={{ flex: 1, justifyContent: "flex-end", paddingHorizontal: 24, paddingBottom: 16 }}>
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
              style={{
                fontFamily: "JosefinSlab_700Bold",
                fontSize: 30,
                color: PARCHMENT,
                textShadowColor: "rgba(0, 0, 0, 0.5)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
                zIndex: 1,
              }}
            >
              {title}
            </Text>
            <Text
              style={{
                fontFamily: "SourceSans3_400Regular",
                marginTop: 8,
                color: PARCHMENT,
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
  console.log("[PLAN_TRACE] Enter PlanTopTabsNavigator");

  // Zustand store for tab state
  const activeTab = usePlanTabStore((s) => s.activeTab);
  const setActiveTab = usePlanTabStore((s) => s.setActiveTab);

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
  const [initialTab, setInitialTab] = useState(tabKeyToRoute[activeTab] || "Plan");

  useEffect(() => {
    if (isFirstRender.current) {
      setInitialTab(tabKeyToRoute[activeTab] || "Plan");
      isFirstRender.current = false;
    }
  }, [activeTab]);

  const activeRouteName = tabKeyToRoute[activeTab] || "Plan";

  return (
    <View style={{ flex: 1, backgroundColor: PARCHMENT }}>
      {/* Hero Header */}
      <HeroHeader activeTab={activeRouteName} />

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
            const state = e.data.state;
            const routeName = state.routes[state.index]?.name;
            const tabKey = routeToTabKey[routeName];
            if (tabKey && tabKey !== activeTab) setActiveTab(tabKey);
          },
        }}
      >
        {/* Isolation mode: keep PlanSafeScreen as the first tab until crash is identified */}
        <Tab.Screen name="Plan" component={PlanSafeScreen} />
        <Tab.Screen name="Campgrounds" component={ParksBrowseScreen} />
        <Tab.Screen name="Meals" component={MealsScreen} />
        <Tab.Screen name="Pack" component={PackingTabScreen} />
        <Tab.Screen name="Weather" component={WeatherScreen} />
      </Tab.Navigator>
    </View>
  );
}
