/**
 * Plan Top Tabs Navigator
 * Material top tabs for Trips, Parks, Weather, Packing, Meals
 */

import React, { useState } from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { View, ImageBackground, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
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
    case "Trips":
      return HERO_IMAGES.PLAN_TRIP;
    case "Parks":
      return HERO_IMAGES.HEADER;
    case "Weather":
      return HERO_IMAGES.WEATHER;
    case "Packing":
      return HERO_IMAGES.PACKING;
    case "Meals":
      return HERO_IMAGES.MEALS;
    default:
      return HERO_IMAGES.PLAN_TRIP;
  }
};

// Map tab routes to titles and descriptions
const getHeroContent = (routeName: string) => {
  switch (routeName) {
    case "Trips":
      return { title: "Plan", description: "Organize trips, explore parks, and prepare for adventure" };
    case "Parks":
      return { title: "Find a Place to Camp", description: "Discover campgrounds and parks for your next adventure" };
    case "Weather":
      return { title: "Weather Forecast", description: "Check conditions for your camping destination" };
    case "Packing":
      return { title: "Packing", description: "Build and organize your gear list for every trip" };
    case "Meals":
      return { title: "Meals", description: "Plan delicious meals for your camping adventure" };
    default:
      return { title: "Plan", description: "Organize trips, explore parks, and prepare for adventure" };
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
  const [activeTab, setActiveTab] = useState("Trips");

  return (
    <View className="flex-1 bg-parchment">
      {/* Hero Header */}
      <HeroHeader activeTab={activeTab} />

      {/* Material Top Tabs */}
      <Tab.Navigator
        screenListeners={{
          state: (e) => {
            // Get the active route name from the tab navigator
            const state = e.data.state;
            const route = state.routes[state.index];
            setActiveTab(route.name);
          },
        }}
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
      >
        <Tab.Screen name="Trips" component={MyTripsScreen} />
        <Tab.Screen name="Parks" component={ParksBrowseScreen} />
        <Tab.Screen name="Weather" component={WeatherScreen} />
        <Tab.Screen name="Packing" component={PackingTabScreen} />
        <Tab.Screen name="Meals" component={MealsScreen} />
      </Tab.Navigator>
    </View>
  );
}
