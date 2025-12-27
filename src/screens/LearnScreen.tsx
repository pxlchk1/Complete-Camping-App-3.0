/**
 * LearnScreen (Redesigned)
 * 
 * Firebase-backed learning content with:
 * - Badge display section
 * - Track selection
 * - Module cards with progress
 */

import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Pressable, ImageBackground, RefreshControl, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Components
import AccountButtonHeader from "../components/AccountButtonHeader";

// Services
import {
  getTracksWithProgress,
  getUserLearningProgress,
} from "../services/learningService";

// Types
import {
  TrackWithModules,
  UserLearningProgress,
  LEARNING_BADGES,
} from "../types/learning";

// Constants
import {
  DEEP_FOREST,
  EARTH_GREEN,
  GRANITE_GOLD,
  PARCHMENT,
  PARCHMENT_BACKGROUND,
  CARD_BACKGROUND_LIGHT,
  BORDER_SOFT,
  TEXT_PRIMARY_STRONG,
  TEXT_SECONDARY,
  TEXT_ON_DARK,
  TEXT_MUTED,
} from "../constants/colors";
import { HERO_IMAGES } from "../constants/images";
import { RootStackParamList } from "../navigation/types";

type LearnScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, "Learn">;

export default function LearnScreen() {
  const navigation = useNavigation<LearnScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const bottomSpacer = 50 + Math.max(insets.bottom, 18) + 12;

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tracks, setTracks] = useState<TrackWithModules[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [userProgress, setUserProgress] = useState<UserLearningProgress | null>(null);

  // Load data
  const loadData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const [tracksData, progress] = await Promise.all([
        getTracksWithProgress(),
        getUserLearningProgress(),
      ]);

      setTracks(tracksData);
      setUserProgress(progress);

      // Select first track by default
      if (tracksData.length > 0 && !selectedTrackId) {
        setSelectedTrackId(tracksData[0].id);
      }
    } catch (error) {
      console.error("[LearnScreen] Error loading data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedTrackId]);

  // Load on mount and focus
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData(true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const handleModulePress = (moduleId: string) => {
    navigation.navigate("ModuleDetail", { moduleId });
  };

  const selectedTrack = tracks.find((t) => t.id === selectedTrackId);

  // Loading state
  if (loading && tracks.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: PARCHMENT_BACKGROUND, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={DEEP_FOREST} />
        <Text style={{ marginTop: 16, fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}>
          Loading learning content...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: PARCHMENT_BACKGROUND }}>
      {/* Hero Image */}
      <View style={{ height: 200 + insets.top }}>
        <ImageBackground
          source={HERO_IMAGES.LEARNING}
          style={{ flex: 1 }}
          resizeMode="cover"
          accessibilityLabel="Learning and education scene"
        >
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
          <View style={{ flex: 1, paddingTop: insets.top }}>
            <AccountButtonHeader color={TEXT_ON_DARK} />

            <View style={{ flex: 1, justifyContent: "flex-end", paddingHorizontal: 24, paddingBottom: 16 }}>
              <Text
                style={{
                  fontFamily: "Raleway_700Bold",
                  fontSize: 30,
                  color: TEXT_ON_DARK,
                  textShadowColor: "rgba(0, 0, 0, 0.5)",
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 4,
                }}
              >
                Learn
              </Text>
              <Text
                style={{
                  fontFamily: "SourceSans3_400Regular",
                  fontSize: 15,
                  color: TEXT_ON_DARK,
                  marginTop: 8,
                  textShadowColor: "rgba(0, 0, 0, 0.5)",
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 3,
                }}
              >
                Master camping skills and earn badges
              </Text>
            </View>
          </View>
        </ImageBackground>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: bottomSpacer }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />
        }
      >
        {/* Your Progress Section */}
        {tracks.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
              <Ionicons name="ribbon" size={20} color={GRANITE_GOLD} />
              <Text
                style={{
                  fontFamily: "SourceSans3_600SemiBold",
                  fontSize: 18,
                  color: TEXT_PRIMARY_STRONG,
                  marginLeft: 8,
                }}
              >
                Your Progress
              </Text>
            </View>

            {/* Track Badge Grid */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 }}>
              {tracks.map((track) => {
                const isSelected = selectedTrackId === track.id;
                const isCompleted = track.hasBadge;
                // Find the badge for this track
                const badgeEntry = Object.values(LEARNING_BADGES).find(b => b.trackId === track.id);
                const badgeColor = badgeEntry?.color || GRANITE_GOLD;

                return (
                  <Pressable
                    key={track.id}
                    onPress={() => setSelectedTrackId(track.id)}
                    style={{
                      width: "25%",
                      paddingHorizontal: 6,
                      marginBottom: 16,
                      alignItems: "center",
                    }}
                  >
                    <View
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        backgroundColor: isCompleted ? badgeColor : CARD_BACKGROUND_LIGHT,
                        borderWidth: isCompleted ? 0 : isSelected ? 2 : 2,
                        borderColor: isSelected ? DEEP_FOREST : BORDER_SOFT,
                        borderStyle: isCompleted ? "solid" : "dashed",
                        justifyContent: "center",
                        alignItems: "center",
                        opacity: isCompleted ? 1 : 0.5,
                      }}
                    >
                      <Ionicons
                        name={track.icon as any}
                        size={26}
                        color={isCompleted ? PARCHMENT : TEXT_MUTED}
                      />
                    </View>
                    <Text
                      style={{
                        fontFamily: isSelected ? "SourceSans3_600SemiBold" : "SourceSans3_400Regular",
                        fontSize: 11,
                        color: isCompleted ? TEXT_PRIMARY_STRONG : TEXT_MUTED,
                        marginTop: 6,
                        textAlign: "center",
                      }}
                      numberOfLines={2}
                    >
                      {track.title}
                    </Text>
                    {isSelected && (
                      <View
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: DEEP_FOREST,
                          marginTop: 4,
                        }}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Track Progress Card */}
        {selectedTrack && (
          <View
            style={{
              backgroundColor: CARD_BACKGROUND_LIGHT,
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: BORDER_SOFT,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <Text style={{ fontFamily: "SourceSans3_600SemiBold", fontSize: 16, color: TEXT_PRIMARY_STRONG }}>
                {selectedTrack.title}
              </Text>
              <View
                style={{
                  backgroundColor: selectedTrack.hasBadge ? "rgba(34, 197, 94, 0.15)" : "rgba(0,0,0,0.05)",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 12,
                }}
              >
                <Text
                  style={{
                    fontFamily: "SourceSans3_600SemiBold",
                    fontSize: 12,
                    color: selectedTrack.hasBadge ? EARTH_GREEN : TEXT_SECONDARY,
                  }}
                >
                  {selectedTrack.userProgress}% Complete
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={{ backgroundColor: "rgba(0,0,0,0.08)", borderRadius: 6, height: 10, overflow: "hidden" }}>
              <View
                style={{
                  width: `${selectedTrack.userProgress}%`,
                  height: "100%",
                  backgroundColor: selectedTrack.hasBadge ? EARTH_GREEN : GRANITE_GOLD,
                  borderRadius: 6,
                }}
              />
            </View>

            <Text style={{ fontFamily: "SourceSans3_400Regular", fontSize: 13, color: TEXT_SECONDARY, marginTop: 10, textAlign: "center" }}>
              {selectedTrack.modules.filter((m) => 
                userProgress?.moduleProgress[m.id]?.passed
              ).length} of {selectedTrack.modules.length} modules completed
            </Text>
          </View>
        )}

        {/* Modules List */}
        {selectedTrack?.modules.map((module) => {
          const moduleProgress = userProgress?.moduleProgress[module.id];
          const isCompleted = moduleProgress?.passed || false;
          const hasStarted = moduleProgress?.hasRead || false;

          return (
            <Pressable
              key={module.id}
              onPress={() => handleModulePress(module.id)}
              style={{
                backgroundColor: CARD_BACKGROUND_LIGHT,
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: isCompleted ? EARTH_GREEN : BORDER_SOFT,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                {/* Icon */}
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: isCompleted ? EARTH_GREEN : "rgba(42, 83, 55, 0.1)",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 14,
                  }}
                >
                  <Ionicons
                    name={module.icon as any}
                    size={24}
                    color={isCompleted ? PARCHMENT : DEEP_FOREST}
                  />
                </View>

                {/* Content */}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text
                      style={{
                        fontFamily: "SourceSans3_600SemiBold",
                        fontSize: 16,
                        color: TEXT_PRIMARY_STRONG,
                        flex: 1,
                      }}
                      numberOfLines={2}
                    >
                      {module.title}
                    </Text>
                    {isCompleted && (
                      <Ionicons name="checkmark-circle" size={20} color={EARTH_GREEN} style={{ marginLeft: 8 }} />
                    )}
                  </View>

                  <Text
                    style={{
                      fontFamily: "SourceSans3_400Regular",
                      fontSize: 14,
                      color: TEXT_SECONDARY,
                      marginTop: 4,
                    }}
                    numberOfLines={2}
                  >
                    {module.description}
                  </Text>

                  {/* Meta */}
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
                    <Ionicons name="time-outline" size={14} color={TEXT_MUTED} />
                    <Text style={{ fontFamily: "SourceSans3_400Regular", fontSize: 13, color: TEXT_MUTED, marginLeft: 4 }}>
                      {module.estimatedMinutes} min read
                    </Text>
                    
                    <View style={{ width: 1, height: 12, backgroundColor: BORDER_SOFT, marginHorizontal: 10 }} />
                    
                    <Ionicons name="help-circle-outline" size={14} color={TEXT_MUTED} />
                    <Text style={{ fontFamily: "SourceSans3_400Regular", fontSize: 13, color: TEXT_MUTED, marginLeft: 4 }}>
                      {module.quiz.length} quiz questions
                    </Text>
                  </View>

                  {/* Status Badge */}
                  <View style={{ marginTop: 10 }}>
                    {isCompleted ? (
                      <View
                        style={{
                          alignSelf: "flex-start",
                          backgroundColor: "rgba(34, 197, 94, 0.15)",
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 10,
                        }}
                      >
                        <Text style={{ fontFamily: "SourceSans3_600SemiBold", fontSize: 12, color: EARTH_GREEN }}>
                          ✓ Completed
                        </Text>
                      </View>
                    ) : hasStarted ? (
                      <View
                        style={{
                          alignSelf: "flex-start",
                          backgroundColor: "rgba(212, 175, 55, 0.15)",
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 10,
                        }}
                      >
                        <Text style={{ fontFamily: "SourceSans3_600SemiBold", fontSize: 12, color: GRANITE_GOLD }}>
                          In Progress
                        </Text>
                      </View>
                    ) : (
                      <View
                        style={{
                          alignSelf: "flex-start",
                          backgroundColor: "rgba(0,0,0,0.05)",
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 10,
                        }}
                      >
                        <Text style={{ fontFamily: "SourceSans3_600SemiBold", fontSize: 12, color: TEXT_SECONDARY }}>
                          Not Started
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}

        {/* Empty State */}
        {tracks.length === 0 && !loading && (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Ionicons name="book-outline" size={48} color={TEXT_MUTED} />
            <Text style={{ fontFamily: "SourceSans3_600SemiBold", fontSize: 18, color: TEXT_PRIMARY_STRONG, marginTop: 16 }}>
              No Learning Content
            </Text>
            <Text style={{ fontFamily: "SourceSans3_400Regular", fontSize: 14, color: TEXT_SECONDARY, marginTop: 8, textAlign: "center" }}>
              Learning tracks are being prepared.{"\n"}Check back soon!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
