/**
 * Photos List Screen
 * Displays camping photo stories from the community
 */

import React, { useState, useEffect } from "react";
import { View, Text, Pressable, FlatList, Image, ActivityIndicator, Dimensions } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { getStories } from "../../services/storiesService";
import { Story } from "../../types/community";
import { useCurrentUser } from "../../state/userStore";
import { RootStackNavigationProp } from "../../navigation/types";
import CommunitySectionHeader from "../../components/CommunitySectionHeader";
import {
  DEEP_FOREST,
  EARTH_GREEN,
  GRANITE_GOLD,
  PARCHMENT,
  CARD_BACKGROUND_LIGHT,
  BORDER_SOFT,
  TEXT_PRIMARY_STRONG,
  TEXT_SECONDARY,
  TEXT_MUTED,
} from "../../constants/colors";
import { DocumentSnapshot } from "firebase/firestore";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 60) / 2; // 2 columns with padding

const FILTER_TAGS = ["all", "camping", "nature", "gear", "trails", "wildlife", "sunset"];

export default function PhotosListScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const currentUser = useCurrentUser();

  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadStories = async (refresh = false) => {
    try {
      if (refresh) {
        setLoading(true);
        setStories([]);
        setLastDoc(null);
        setHasMore(true);
      }

      setError(null);

      const filterTag = selectedTag === "all" ? undefined : selectedTag;
      const result = await getStories(
        filterTag,
        undefined,
        30,
        refresh ? undefined : lastDoc || undefined
      );

      if (refresh) {
        setStories(result.stories);
      } else {
        setStories(prev => [...prev, ...result.stories]);
      }

      setLastDoc(result.lastDoc);
      setHasMore(result.stories.length === 30);
    } catch (err: any) {
      setError(err.message || "Failed to load photos");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadStories(true);
  }, [selectedTag]);

  useFocusEffect(
    React.useCallback(() => {
      loadStories(true);
    }, [selectedTag])
  );

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && lastDoc) {
      setLoadingMore(true);
      loadStories(false);
    }
  };

  const handlePhotoPress = (storyId: string) => {
    navigation.navigate("PhotoDetail", { storyId });
  };

  const handleUploadPhoto = () => {
    if (!currentUser) {
      // TODO: Show auth dialog
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("UploadPhoto");
  };

  const renderPhoto = ({ item }: { item: Story }) => (
    <Pressable
      onPress={() => handlePhotoPress(item.id)}
      className="rounded-xl mb-4 overflow-hidden active:opacity-90"
      style={{
        width: ITEM_WIDTH,
        backgroundColor: CARD_BACKGROUND_LIGHT,
        borderWidth: 1,
        borderColor: BORDER_SOFT,
      }}
    >
      <Image
        source={{ uri: item.thumbnailUrl || item.imageUrl }}
        style={{ width: "100%", height: ITEM_WIDTH, backgroundColor: "#e5e7eb" }}
        resizeMode="cover"
      />
      <View className="p-3">
        <Text
          numberOfLines={2}
          className="mb-2"
          style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY, fontSize: 13 }}
        >
          {item.caption}
        </Text>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Ionicons name="heart" size={14} color="#dc2626" />
            <Text className="ml-1" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_MUTED, fontSize: 12 }}>
              {item.likeCount}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="chatbubble-outline" size={14} color={TEXT_MUTED} />
            <Text className="ml-1" style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_MUTED, fontSize: 12 }}>
              {item.commentCount}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-parchment">
        <ActivityIndicator size="large" color={DEEP_FOREST} />
        <Text
          className="mt-4"
          style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}
        >
          Loading photos...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-parchment">
        <CommunitySectionHeader
          title="Camp Photos"
          onAddPress={handleUploadPhoto}
        />
        <View className="flex-1 items-center justify-center px-5">
          <Ionicons name="alert-circle-outline" size={64} color={EARTH_GREEN} />
          <Text
            className="mt-4 text-center text-lg"
            style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}
          >
            Failed to load photos
          </Text>
          <Text
            className="mt-2 text-center"
            style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}
          >
            {error}
          </Text>
          <Pressable
            onPress={() => loadStories(true)}
            className="mt-6 px-6 py-3 rounded-xl active:opacity-90"
            style={{ backgroundColor: DEEP_FOREST }}
          >
            <Text style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}>
              Retry
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-parchment">
      {/* Header */}
      <CommunitySectionHeader
        title="Community Photos"
        onAddPress={handleUploadPhoto}
      />

      {/* Filter Tags */}
      <View className="px-5 py-3 border-b" style={{ borderColor: BORDER_SOFT }}>
        <View className="flex-row gap-2">
          {FILTER_TAGS.map(tag => (
            <Pressable
              key={tag}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedTag(tag);
              }}
              className={`px-4 py-2 rounded-full ${
                selectedTag === tag ? "bg-forest" : "bg-white border"
              }`}
              style={selectedTag !== tag ? { borderColor: BORDER_SOFT } : undefined}
            >
              <Text
                className="text-sm capitalize"
                style={{
                  fontFamily: "SourceSans3_600SemiBold",
                  color: selectedTag === tag ? PARCHMENT : TEXT_PRIMARY_STRONG
                }}
              >
                {tag}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Content removed - coming soon message */}
      <View className="flex-1 items-center justify-center px-5">
        <Ionicons name="images-outline" size={64} color={GRANITE_GOLD} />
        <Text
          className="mt-4 text-xl text-center"
          style={{ fontFamily: "JosefinSlab_700Bold", color: TEXT_PRIMARY_STRONG }}
        >
          Photo sharing coming soon
        </Text>
        <Text
          className="mt-2 text-center"
          style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}
        >
          We're building an amazing photo sharing experience for the camping community!
        </Text>
      </View>
    </View>
  );
}
