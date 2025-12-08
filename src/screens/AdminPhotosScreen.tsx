/**
 * Admin Photos Review Screen
 * Review and moderate community photos
 */

import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator, RefreshControl, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { db } from "../config/firebase";
import { collection, query, getDocs, doc, updateDoc, deleteDoc, orderBy, limit } from "firebase/firestore";
import ModalHeader from "../components/ModalHeader";
import {
  PARCHMENT,
  CARD_BACKGROUND_LIGHT,
  BORDER_SOFT,
  TEXT_PRIMARY_STRONG,
  TEXT_SECONDARY,
  EARTH_GREEN,
  DEEP_FOREST,
} from "../constants/colors";

interface Story {
  id: string;
  imageUrl: string;
  caption: string;
  authorId: string;
  createdAt: any;
}

export default function AdminPhotosScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stories, setStories] = useState<Story[]>([]);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const storiesRef = collection(db, "stories");
      const q = query(storiesRef, orderBy("createdAt", "desc"), limit(50));
      const snapshot = await getDocs(q);

      const storiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Story[];

      setStories(storiesData);
    } catch (error) {
      console.error("Error loading stories:", error);
      Alert.alert("Error", "Failed to load photos");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRemovePhoto = async (storyId: string) => {
    Alert.alert(
      "Remove Photo",
      "Are you sure you want to remove this photo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "stories", storyId));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setStories(stories.filter(s => s.id !== storyId));
              Alert.alert("Success", "Photo removed");
            } catch (error) {
              console.error("Error removing photo:", error);
              Alert.alert("Error", "Failed to remove photo");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1" style={{ backgroundColor: PARCHMENT }}>
        <ModalHeader title="Review Photos" showTitle />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={DEEP_FOREST} />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: PARCHMENT }}>
      <ModalHeader title="Review Photos" showTitle />

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadStories();
            }}
            tintColor={DEEP_FOREST}
          />
        }
      >
        <View className="px-5 pt-5 pb-8">
          {stories.map((story) => (
            <View
              key={story.id}
              className="mb-4 rounded-xl overflow-hidden border"
              style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}
            >
              <Image
                source={{ uri: story.imageUrl }}
                style={{ width: "100%", height: 300 }}
                resizeMode="cover"
              />
              <View className="p-4">
                <Text
                  className="mb-2"
                  style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_PRIMARY_STRONG }}
                >
                  {story.caption}
                </Text>
                <Pressable
                  onPress={() => handleRemovePhoto(story.id)}
                  className="p-3 rounded-xl items-center active:opacity-70"
                  style={{ backgroundColor: "#D32F2F" }}
                >
                  <Text
                    style={{ fontFamily: "SourceSans3_600SemiBold", fontSize: 14, color: PARCHMENT }}
                  >
                    Remove Photo
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
