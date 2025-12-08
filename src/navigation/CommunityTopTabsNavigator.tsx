/**
 * Community Top Tabs Navigator
 * Material top tabs for Tips, Gear, Ask, Photos, Feedback
 */

import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { View, ImageBackground } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "react-native";
import TipsListScreen from "../screens/community/TipsListScreen";
import GearReviewsListScreen from "../screens/community/GearReviewsListScreen";
import QuestionsListScreen from "../screens/community/QuestionsListScreen";
import PhotosListScreen from "../screens/community/PhotosListScreen";
import FeedbackListScreen from "../screens/community/FeedbackListScreen";
import AccountButtonHeader from "../components/AccountButtonHeader";
import { DEEP_FOREST, PARCHMENT, TEXT_PRIMARY_STRONG, BORDER_SOFT, TEXT_ON_DARK } from "../constants/colors";
import { HERO_IMAGES } from "../constants/images";

const Tab = createMaterialTopTabNavigator();

export default function CommunityTopTabsNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-parchment">
      {/* Hero Header */}
      <View style={{ height: 200 + insets.top }}>
        <ImageBackground
          source={HERO_IMAGES.COMMUNITY}
          style={{ flex: 1 }}
          resizeMode="cover"
          accessibilityLabel="Community camping scene"
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
                Community
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
                Share tips, gear reviews, and connect with fellow campers
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
        <Tab.Screen name="Tips" component={TipsListScreen} />
        <Tab.Screen name="Gear" component={GearReviewsListScreen} />
        <Tab.Screen name="Ask" component={QuestionsListScreen} />
        <Tab.Screen name="Photos" component={PhotosListScreen} />
        <Tab.Screen name="Feedback" component={FeedbackListScreen} />
      </Tab.Navigator>
    </View>
  );
}
