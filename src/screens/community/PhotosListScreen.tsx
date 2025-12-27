/**
 * Photos List Screen
 * Enhanced photo feed with post types, Quick Post tiles, and structured tags
 */

import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, FlatList, Image, ActivityIndicator, Dimensions, Modal, ScrollView, Alert } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { getPhotoPosts, getHelpfulStatuses, toggleHelpful, getPostTypeLabel } from "../../services/photoPostsService";
import { getStories } from "../../services/storiesService";
import { Story } from "../../types/community";
import {
  PhotoPost,
  PhotoPostType,
  TripStyle,
  DetailTag,
  PRIMARY_PHOTO_TILES,
  QUICK_POST_TILES,
  POST_TYPE_LABELS,
  POST_TYPE_COLORS,
  TRIP_STYLE_LABELS,
  DETAIL_TAG_LABELS,
  mapLegacyPostType,
} from "../../types/photoPost";
import { useCurrentUser } from "../../state/userStore";
import { RootStackNavigationProp } from "../../navigation/types";
import CommunitySectionHeader from "../../components/CommunitySectionHeader";
import AccountRequiredModal from "../../components/AccountRequiredModal";
import { requireAccount } from "../../utils/gating";
import { shouldShowInFeed } from "../../services/moderationService";
import { canUploadPhotoToday } from "../../services/photoLimitService";
import {
  DEEP_FOREST,
  EARTH_GREEN,
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
const QUICK_TILE_WIDTH = 100;

// Feed filter chips (no Tips - that's a separate section)
const FILTER_CHIPS: { key: PhotoPostType | "all" | "nearby"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "campsite-spotlight", label: "Campsites" },
  { key: "conditions-report", label: "Conditions" },
  { key: "setup-ideas", label: "Setups" },
  { key: "gear-in-real-life", label: "Gear" },
  { key: "camp-cooking", label: "Cooking" },
  { key: "wildlife-nature", label: "Wildlife" },
  { key: "accessibility", label: "Accessible" },
];

// Legacy filter tags (for backwards compatibility with old data)
const FILTER_TAGS = ["all", "camping", "nature", "gear", "trails", "wildlife", "sunset"];

// Trip style options for filter modal
const TRIP_STYLE_OPTIONS: TripStyle[] = [
  "car-camping",
  "tent-camping",
  "backpacking",
  "rv-trailer",
  "group-camping",
  "solo-camping",
  "family-camping",
  "winter-camping",
];

// Sort options
const SORT_OPTIONS = [
  { key: "newest", label: "Newest" },
  { key: "most-helpful", label: "Most Helpful" },
] as const;

export default function PhotosListScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const currentUser = useCurrentUser();

  // New photo posts from enhanced system
  const [photoPosts, setPhotoPosts] = useState<PhotoPost[]>([]);
  // Legacy stories for backwards compatibility
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [selectedPostType, setSelectedPostType] = useState<PhotoPostType | "all">("all");
  const [selectedTripStyle, setSelectedTripStyle] = useState<TripStyle | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "most-helpful">("newest");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Helpful status tracking
  const [helpfulStatuses, setHelpfulStatuses] = useState<Record<string, boolean>>({});

  // Gating modal state
  const [showAccountModal, setShowAccountModal] = useState(false);

  const loadPhotoPosts = async (refresh = false) => {
    try {
      if (refresh) {
        setLoading(true);
        setPhotoPosts([]);
        setLastDoc(null);
        setHasMore(true);
      }

      setError(null);

      // Load from new photoPosts collection
      const filters = {
        postType: selectedPostType === "all" ? undefined : selectedPostType,
        tripStyle: selectedTripStyle || undefined,
        sortBy,
      };

      const result = await getPhotoPosts(
        filters,
        30,
        refresh ? undefined : lastDoc || undefined
      );

      // Filter out hidden content
      const visiblePosts = result.posts.filter(post => 
        !post.isHidden || post.userId === currentUser?.id
      );

      if (refresh) {
        setPhotoPosts(visiblePosts);
      } else {
        setPhotoPosts(prev => [...prev, ...visiblePosts]);
      }

      setLastDoc(result.lastDoc);
      setHasMore(result.posts.length === 30);

      // Load helpful statuses for current user
      if (currentUser?.id && visiblePosts.length > 0) {
        const statuses = await getHelpfulStatuses(
          visiblePosts.map(p => p.id),
          currentUser.id
        );
        setHelpfulStatuses(prev => ({ ...prev, ...statuses }));
      }
    } catch (err: any) {
      console.error("Error loading photo posts:", err);
      // Fall back to legacy stories
      await loadLegacyStories(refresh);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Legacy fallback for old data
  const loadLegacyStories = async (refresh = false) => {
    try {
      const filterTag = selectedTag === "all" ? undefined : selectedTag;
      const result = await getStories(
        filterTag,
        undefined,
        30,
        refresh ? undefined : lastDoc || undefined
      );

      const visibleStories = result.stories.filter(story => 
        shouldShowInFeed(story, currentUser?.id)
      );

      if (refresh) {
        setStories(visibleStories);
      } else {
        setStories(prev => [...prev, ...visibleStories]);
      }

      setLastDoc(result.lastDoc);
      setHasMore(result.stories.length === 30);
    } catch (err: any) {
      setError(err.message || "Failed to load photos");
    }
  };

  useEffect(() => {
    loadPhotoPosts(true);
  }, [selectedPostType, selectedTripStyle, sortBy]);

  useFocusEffect(
    useCallback(() => {
      loadPhotoPosts(true);
    }, [selectedPostType, selectedTripStyle, sortBy])
  );

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && lastDoc) {
      setLoadingMore(true);
      loadPhotoPosts(false);
    }
  };

  const handlePhotoPostPress = (postId: string) => {
    navigation.navigate("PhotoDetail", { storyId: postId });
  };

  const handleQuickPostPress = async (postType: PhotoPostType) => {
    // First check if user has account
    if (!requireAccount({
      openAccountModal: () => setShowAccountModal(true),
    })) {
      return;
    }

    // Check daily photo limit
    const limitCheck = await canUploadPhotoToday();
    if (!limitCheck.canUpload) {
      Alert.alert(
        "Daily Limit Reached",
        limitCheck.message || "You've hit today's photo limit. Try again tomorrow, or upgrade for unlimited photo posts.",
        [
          { text: "Maybe Later", style: "cancel" },
          { text: "Upgrade", onPress: () => navigation.navigate("Paywall") },
        ]
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("PhotoComposer", { postType });
  };

  const handleUploadPhoto = async () => {
    // First check if user has account
    if (!requireAccount({
      openAccountModal: () => setShowAccountModal(true),
    })) {
      return;
    }

    // Check daily photo limit for FREE users
    const limitCheck = await canUploadPhotoToday();
    if (!limitCheck.canUpload) {
      Alert.alert(
        "Daily Limit Reached",
        limitCheck.message || "You've hit today's photo limit. Try again tomorrow, or upgrade for unlimited photo posts.",
        [
          { text: "Maybe Later", style: "cancel" },
          { text: "Upgrade", onPress: () => navigation.navigate("Paywall") },
        ]
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("PhotoComposer", {});
  };

  const handleToggleHelpful = async (postId: string) => {
    if (!currentUser?.id) {
      setShowAccountModal(true);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Optimistic update
    const wasHelpful = helpfulStatuses[postId];
    setHelpfulStatuses(prev => ({ ...prev, [postId]: !wasHelpful }));
    setPhotoPosts(prev => 
      prev.map(p => 
        p.id === postId 
          ? { ...p, helpfulCount: p.helpfulCount + (wasHelpful ? -1 : 1) }
          : p
      )
    );

    try {
      await toggleHelpful(postId, currentUser.id);
    } catch (err) {
      // Revert on error
      setHelpfulStatuses(prev => ({ ...prev, [postId]: wasHelpful }));
      setPhotoPosts(prev => 
        prev.map(p => 
          p.id === postId 
            ? { ...p, helpfulCount: p.helpfulCount + (wasHelpful ? 1 : -1) }
            : p
        )
      );
    }
  };

  const handleFilterChipPress = (key: PhotoPostType | "all") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPostType(key === "all" ? "all" : key);
  };

  // Render header with helper text and quick post tiles
  const renderHeader = () => (
    <View>
      {/* Header Helper Block */}
      <View 
        className="mx-5 mb-4 p-4 rounded-xl border"
        style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}
      >
        <Text 
          className="text-lg mb-1"
          style={{ fontFamily: "Raleway_700Bold", color: TEXT_PRIMARY_STRONG }}
        >
          Share a photo that helps someone camp better.
        </Text>
        <Text
          className="text-sm"
          style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}
        >
          Pick a category, add your tags, and post.
        </Text>
      </View>

      {/* Primary Category Tiles - 2x2 Grid */}
      <View className="mx-5 mb-4">
        <View className="flex-row flex-wrap" style={{ marginHorizontal: -6 }}>
          {PRIMARY_PHOTO_TILES.map((tile) => {
            const isSelected = selectedPostType === tile.postType;
            return (
              <View key={tile.postType} style={{ width: "50%", paddingHorizontal: 6, marginBottom: 12 }}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    // Toggle selection - tap again to deselect
                    if (isSelected) {
                      setSelectedPostType("all");
                    } else {
                      setSelectedPostType(tile.postType);
                    }
                  }}
                  onLongPress={() => handleQuickPostPress(tile.postType)}
                  className="items-center justify-center rounded-xl p-4 active:opacity-90"
                  style={{ 
                    backgroundColor: isSelected ? DEEP_FOREST + "10" : CARD_BACKGROUND_LIGHT,
                    borderWidth: isSelected ? 2 : 1,
                    borderColor: isSelected ? DEEP_FOREST : BORDER_SOFT,
                    minHeight: 100,
                  }}
                >
                  <View 
                    className="w-12 h-12 rounded-full items-center justify-center mb-2"
                    style={{ 
                      backgroundColor: isSelected ? DEEP_FOREST : tile.color,
                    }}
                  >
                    <Ionicons name={tile.icon as any} size={24} color="white" />
                  </View>
                  <Text 
                    className="text-sm text-center"
                    style={{ 
                      fontFamily: "SourceSans3_600SemiBold", 
                      color: isSelected ? DEEP_FOREST : TEXT_PRIMARY_STRONG,
                    }}
                    numberOfLines={2}
                  >
                    {tile.label}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>

      {/* Filter Pills */}
      <View className="mb-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        >
          {FILTER_CHIPS.map((chip) => {
            const isActive = selectedPostType === chip.key;
            return (
              <Pressable
                key={chip.key}
                onPress={() => handleFilterChipPress(chip.key as PhotoPostType | "all")}
                className="px-4 py-2 rounded-full"
                style={{
                  backgroundColor: isActive ? DEEP_FOREST : CARD_BACKGROUND_LIGHT,
                  borderWidth: 1,
                  borderColor: isActive ? DEEP_FOREST : BORDER_SOFT,
                }}
              >
                <Text
                  style={{
                    fontFamily: "SourceSans3_600SemiBold",
                    color: isActive ? PARCHMENT : TEXT_PRIMARY_STRONG,
                    fontSize: 13,
                  }}
                >
                  {chip.label}
                </Text>
              </Pressable>
            );
          })}
          
          {/* Filter Button */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowFilterModal(true);
            }}
            className="px-4 py-2 rounded-full flex-row items-center"
            style={{
              backgroundColor: CARD_BACKGROUND_LIGHT,
              borderWidth: 1,
              borderColor: BORDER_SOFT,
            }}
          >
            <Ionicons name="options" size={16} color={TEXT_PRIMARY_STRONG} />
            <Text
              className="ml-1"
              style={{
                fontFamily: "SourceSans3_600SemiBold",
                color: TEXT_PRIMARY_STRONG,
                fontSize: 13,
              }}
            >
              Filter
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );

  // Render tag chips for a post
  const renderTagChips = (post: PhotoPost) => {
    const chips: { label: string; color: string }[] = [];
    
    // Post type chip (always first) - map legacy tip-or-fix to setup-ideas
    if (post.postType) {
      const mappedType = mapLegacyPostType(post.postType);
      chips.push({
        label: POST_TYPE_LABELS[mappedType] || "Photo",
        color: POST_TYPE_COLORS[mappedType] || DEEP_FOREST,
      });
    }
    
    // Trip style chip
    if (post.tripStyle) {
      chips.push({
        label: TRIP_STYLE_LABELS[post.tripStyle],
        color: EARTH_GREEN,
      });
    }
    
    // One detail tag
    if (post.detailTags && post.detailTags.length > 0) {
      chips.push({
        label: DETAIL_TAG_LABELS[post.detailTags[0]],
        color: TEXT_SECONDARY,
      });
    }

    // Calculate remaining
    const totalTags = 1 + (post.tripStyle ? 1 : 0) + (post.detailTags?.length || 0);
    const remaining = totalTags - 3;

    return (
      <View className="flex-row flex-wrap gap-1 mt-1">
        {chips.slice(0, 3).map((chip, idx) => (
          <View 
            key={idx}
            className="px-2 py-0.5 rounded-full"
            style={{ backgroundColor: chip.color + "20" }}
          >
            <Text 
              className="text-[10px]"
              style={{ fontFamily: "SourceSans3_600SemiBold", color: chip.color }}
            >
              {chip.label}
            </Text>
          </View>
        ))}
        {remaining > 0 && (
          <View 
            className="px-2 py-0.5 rounded-full"
            style={{ backgroundColor: TEXT_MUTED + "20" }}
          >
            <Text 
              className="text-[10px]"
              style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_MUTED }}
            >
              +{remaining}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Render location line
  const renderLocationLine = (post: PhotoPost) => {
    if (!post.campgroundName) return null;
    
    let locationText = post.campgroundName;
    if (post.campsiteNumber && !post.hideCampsiteNumber) {
      locationText += ` • Site ${post.campsiteNumber}`;
    }
    
    return (
      <View className="flex-row items-center mt-1">
        <Text className="text-[11px]" style={{ color: TEXT_SECONDARY }}>📍 </Text>
        <Text 
          className="text-[11px] flex-1"
          style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}
          numberOfLines={1}
        >
          {locationText}
        </Text>
      </View>
    );
  };

  const renderPhotoPostItem = ({ item }: { item: PhotoPost }) => {
    const isHelpful = helpfulStatuses[item.id] || false;
    
    return (
      <Pressable
        onPress={() => handlePhotoPostPress(item.id)}
        className="mb-4 mx-2 rounded-xl overflow-hidden border"
        style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT, width: ITEM_WIDTH, aspectRatio: 3 / 4 }}
      >
        {item.photoUrls && item.photoUrls[0] ? (
          <View style={{ flex: 1 }}>
            <Image
              source={{ uri: item.photoUrls[0] }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
            {/* Overlay with info */}
            <View 
              style={{ 
                position: "absolute", 
                bottom: 0, 
                left: 0, 
                right: 0, 
                backgroundColor: "rgba(0,0,0,0.7)",
                paddingHorizontal: 8,
                paddingVertical: 6,
              }}
            >
              {/* Location Line */}
              {renderLocationLine(item)}
              
              {/* Caption preview */}
              {!!item.caption && (
                <Text
                  numberOfLines={2}
                  style={{ 
                    fontFamily: "SourceSans3_400Regular", 
                    color: "#fff", 
                    fontSize: 12,
                    marginTop: 2,
                  }}
                >
                  {item.caption}
                </Text>
              )}
              
              {/* Tag chips */}
              {renderTagChips(item)}
              
              {/* Helpful button and count */}
              <View className="flex-row items-center justify-between mt-2">
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    handleToggleHelpful(item.id);
                  }}
                  className="flex-row items-center px-2 py-1 rounded-full"
                  style={{ 
                    backgroundColor: isHelpful ? "#16a34a30" : "rgba(255,255,255,0.2)",
                  }}
                >
                  <Ionicons 
                    name={isHelpful ? "thumbs-up" : "thumbs-up-outline"} 
                    size={14} 
                    color={isHelpful ? "#16a34a" : "#fff"} 
                  />
                  <Text 
                    className="ml-1" 
                    style={{ 
                      fontFamily: "SourceSans3_600SemiBold", 
                      color: isHelpful ? "#16a34a" : "#fff", 
                      fontSize: 11 
                    }}
                  >
                    {item.helpfulCount > 0 ? `${item.helpfulCount} Helpful` : "Helpful"}
                  </Text>
                </Pressable>
                
                {item.commentCount !== undefined && item.commentCount > 0 && (
                  <View className="flex-row items-center">
                    <Ionicons name="chatbubble-outline" size={12} color="#9ca3af" />
                    <Text 
                      className="ml-1" 
                      style={{ fontFamily: "SourceSans3_400Regular", color: "#9ca3af", fontSize: 11 }}
                    >
                      {item.commentCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        ) : (
          <View className="flex-1 items-center justify-center bg-gray-100">
            <Ionicons name="image" size={32} color={TEXT_MUTED} />
            <Text style={{ color: TEXT_MUTED, fontFamily: "SourceSans3_400Regular" }}>No image</Text>
          </View>
        )}
      </Pressable>
    );
  };

  // Legacy story item renderer
  const renderPhotoItem = ({ item }: { item: Story }) => {
    const score = (item.upvotes || 0) - (item.downvotes || 0);
    
    return (
      <Pressable
        onPress={() => handlePhotoPress(item.id)}
        className="mb-4 mx-2 rounded-xl overflow-hidden border"
        style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT, width: ITEM_WIDTH, aspectRatio: 3 / 4 }}
      >
        {item.imageUrl ? (
          <View style={{ flex: 1 }}>
            <Image
              source={{ uri: item.imageUrl }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
              onError={() => console.log("Image unavailable:", item.imageUrl)}
            />
            {/* Overlay with title and votes */}
            <View 
              style={{ 
                position: "absolute", 
                bottom: 0, 
                left: 0, 
                right: 0, 
                backgroundColor: "rgba(0,0,0,0.6)",
                paddingHorizontal: 10,
                paddingVertical: 8,
              }}
            >
              {!!item.caption && (
                <Text
                  numberOfLines={2}
                  style={{ 
                    fontFamily: "SourceSans3_600SemiBold", 
                    color: "#fff", 
                    fontSize: 13,
                    marginBottom: 4,
                  }}
                >
                  {item.caption}
                </Text>
              )}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons 
                    name={score > 0 ? "arrow-up" : score < 0 ? "arrow-down" : "swap-vertical-outline"} 
                    size={14} 
                    color={score > 0 ? "#4ade80" : score < 0 ? "#f87171" : "#9ca3af"} 
                  />
                  <Text 
                    className="ml-1" 
                    style={{ 
                      fontFamily: "SourceSans3_600SemiBold", 
                      color: score > 0 ? "#4ade80" : score < 0 ? "#f87171" : "#9ca3af", 
                      fontSize: 12 
                    }}
                  >
                    {score}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="chatbubble-outline" size={14} color="#9ca3af" />
                  <Text className="ml-1" style={{ fontFamily: "SourceSans3_400Regular", color: "#9ca3af", fontSize: 12 }}>
                    {item.commentCount || 0}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View className="flex-1 items-center justify-center bg-gray-100">
            <Ionicons name="image" size={32} color={TEXT_MUTED} />
            <Text style={{ color: TEXT_MUTED, fontFamily: "SourceSans3_400Regular" }}>Image unavailable</Text>
          </View>
        )}
      </Pressable>
    );
  };

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
          title="Camping photos"
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
            onPress={() => loadPhotoPosts(true)}
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

  // Determine which data to show (new posts or legacy stories)
  const hasNewPosts = photoPosts.length > 0;
  const feedData = hasNewPosts ? photoPosts : stories;

  return (
    <View className="flex-1 bg-parchment">
      {/* Action Bar */}
      <CommunitySectionHeader
        title="Camping photos"
        onAddPress={handleUploadPhoto}
      />

      {/* Enhanced Filter Modal */}
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
              style={{ fontFamily: "Raleway_700Bold", color: TEXT_PRIMARY_STRONG }}
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
            {/* Sort By */}
            <Text
              className="mb-3 text-sm"
              style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_SECONDARY }}
            >
              SORT BY
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {SORT_OPTIONS.map(option => (
                <Pressable
                  key={option.key}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSortBy(option.key);
                  }}
                  className="px-5 py-3 rounded-xl"
                  style={{
                    backgroundColor: sortBy === option.key ? DEEP_FOREST : CARD_BACKGROUND_LIGHT,
                    borderWidth: 1,
                    borderColor: sortBy === option.key ? DEEP_FOREST : BORDER_SOFT,
                  }}
                >
                  <Text
                    className="text-base"
                    style={{
                      fontFamily: "SourceSans3_600SemiBold",
                      color: sortBy === option.key ? PARCHMENT : TEXT_PRIMARY_STRONG
                    }}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Trip Style */}
            <Text
              className="mb-3 text-sm"
              style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_SECONDARY }}
            >
              TRIP STYLE
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedTripStyle(null);
                }}
                className="px-4 py-2 rounded-xl"
                style={{
                  backgroundColor: selectedTripStyle === null ? DEEP_FOREST : CARD_BACKGROUND_LIGHT,
                  borderWidth: 1,
                  borderColor: selectedTripStyle === null ? DEEP_FOREST : BORDER_SOFT,
                }}
              >
                <Text
                  style={{
                    fontFamily: "SourceSans3_600SemiBold",
                    color: selectedTripStyle === null ? PARCHMENT : TEXT_PRIMARY_STRONG
                  }}
                >
                  All Styles
                </Text>
              </Pressable>
              {TRIP_STYLE_OPTIONS.map(style => (
                <Pressable
                  key={style}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedTripStyle(style);
                  }}
                  className="px-4 py-2 rounded-xl"
                  style={{
                    backgroundColor: selectedTripStyle === style ? DEEP_FOREST : CARD_BACKGROUND_LIGHT,
                    borderWidth: 1,
                    borderColor: selectedTripStyle === style ? DEEP_FOREST : BORDER_SOFT,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "SourceSans3_600SemiBold",
                      color: selectedTripStyle === style ? PARCHMENT : TEXT_PRIMARY_STRONG
                    }}
                  >
                    {TRIP_STYLE_LABELS[style]}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Legacy tag filter (for old data) */}
            <Text
              className="mb-3 text-sm"
              style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_SECONDARY }}
            >
              FILTER BY TAG (LEGACY)
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {FILTER_TAGS.map(tag => (
                <Pressable
                  key={tag}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedTag(tag);
                  }}
                  className="px-4 py-2 rounded-xl"
                  style={{
                    backgroundColor: selectedTag === tag ? DEEP_FOREST : CARD_BACKGROUND_LIGHT,
                    borderWidth: 1,
                    borderColor: selectedTag === tag ? DEEP_FOREST : BORDER_SOFT,
                  }}
                >
                  <Text
                    className="capitalize"
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
          <View className="px-5 py-3 border-t" style={{ borderColor: BORDER_SOFT }}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowFilterModal(false);
              }}
              className="py-3 rounded-lg active:opacity-90"
              style={{ backgroundColor: DEEP_FOREST }}
            >
              <Text
                className="text-center text-sm"
                style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}
              >
                Apply Filters
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Photos Feed */}
      <FlatList
        data={hasNewPosts ? photoPosts : stories}
        renderItem={hasNewPosts ? renderPhotoPostItem : renderPhotoItem}
        keyExtractor={item => item.id}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ paddingBottom: 100 }}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color={DEEP_FOREST} /> : null}
        ListEmptyComponent={
          <View className="items-center justify-center py-12 px-5">
            <Ionicons name="images-outline" size={48} color={TEXT_MUTED} />
            <Text 
              className="mt-4 text-center"
              style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}
            >
              No photos yet
            </Text>
            <Text 
              className="mt-2 text-center"
              style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_SECONDARY }}
            >
              Be the first to share a camping moment!
            </Text>
          </View>
        }
      />

      {/* Gating Modals */}
      <AccountRequiredModal
        visible={showAccountModal}
        onCreateAccount={() => {
          setShowAccountModal(false);
          navigation.navigate("Auth");
        }}
        onMaybeLater={() => setShowAccountModal(false)}
      />
    </View>
  );
}
