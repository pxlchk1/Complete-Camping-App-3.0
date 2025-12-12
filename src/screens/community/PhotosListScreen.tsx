/**
 * Photos List Screen
 * Displays camping photo stories from the community
 */

import React, { useState, useEffect } from "react";
import { View, Text, Pressable, FlatList, Image, ActivityIndicator, Dimensions, Modal, ScrollView } from "react-native";
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
  const [showFilterModal, setShowFilterModal] = useState(false);

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
      {/* Header with Filter Button */}
      <View style={{ backgroundColor: DEEP_FOREST }}>
        <View className="px-5 py-3">
          <View className="flex-row items-center justify-between">
            <Text
              className="text-xl"
              style={{ fontFamily: "JosefinSlab_700Bold", color: PARCHMENT }}
            >
              Community Photos
            </Text>
            <View className="flex-row items-center gap-3">
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowFilterModal(true);
                }}
                className="active:opacity-70"
              >
                <Ionicons name="funnel-outline" size={24} color={PARCHMENT} />
              </Pressable>
              <Pressable
                onPress={handleUploadPhoto}
                className="active:opacity-70"
              >
                <Ionicons name="add-circle" size={32} color={PARCHMENT} />
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View className="flex-1 bg-parchment">
          {/* Modal Header */}
          <View className="px-5 py-4 border-b flex-row items-center justify-between" style={{ borderColor: BORDER_SOFT }}>
            <Text
              className="text-xl"
              style={{ fontFamily: "JosefinSlab_700Bold", color: TEXT_PRIMARY_STRONG }}
            >
              Filter Photos
            </Text>
            <Pressable
              onPress={() => setShowFilterModal(false)}
              className="active:opacity-70"
            >
              <Ionicons name="close" size={28} color={TEXT_PRIMARY_STRONG} />
            </Pressable>
          </View>

          {/* Filter Options */}
          <ScrollView className="flex-1 px-5 py-4">
            <Text
              className="mb-3 text-sm"
              style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_SECONDARY }}
            >
              FILTER BY TAG
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {FILTER_TAGS.map(tag => (
                <Pressable
                  key={tag}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedTag(tag);
                  }}
                  className="px-5 py-3 rounded-xl"
                  style={{
                    backgroundColor: selectedTag === tag ? DEEP_FOREST : CARD_BACKGROUND_LIGHT,
                    borderWidth: 1,
                    borderColor: selectedTag === tag ? DEEP_FOREST : BORDER_SOFT,
                  }}
                >
                  <Text
                    className="text-base capitalize"
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
          </ScrollView>

          {/* Apply Button */}
          <View className="px-5 py-4 border-t" style={{ borderColor: BORDER_SOFT }}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowFilterModal(false);
              }}
              className="py-4 rounded-xl active:opacity-90"
              style={{ backgroundColor: DEEP_FOREST }}
            >
              <Text
                className="text-center text-base"
                style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}
              >
                Apply Filter
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>w>
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
