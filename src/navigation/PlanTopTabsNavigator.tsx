/**
 * Plan Top Tabs Navigator
 * Material top tabs for Trips, Parks, Weather, Packing, Meals
 */

import React from "react";
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

export default function PlanTopTabsNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-parchment">
      {/* Hero Header */}
      <View style={{ height: 200 + insets.top }}>
        <ImageBackground
          source={HERO_IMAGES.PLAN_TRIP}
          style={{ flex: 1 }}
          resizeMode="cover"
          accessibilityLabel="Planning camping scene"
        >
          <View className="flex-1" style={{ paddingTop: insets.top }}>
            {/* Account Button - Top Right */}
            <AccountButtonHeader color={TEXT_ON_DARK} />

            <View className="flex-1 justify-end px-6 pb-4">
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
                Plan
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
                Organize trips, explore parks, and prepare for adventure
              </Text>
            </View>
          </View>
        </ImageBackground>
      </View>

      {/* Material Top Tabs */}
      <Tab.Navigator
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
