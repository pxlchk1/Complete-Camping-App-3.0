/**
 * Edit Gear Screen
 * Form to edit an existing gear item in My Gear Closet
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { auth } from "../config/firebase";
import { updateGearItem, uploadGearImage } from "../services/gearClosetService";
import { GearCategory, GEAR_CATEGORIES } from "../types/gear";
import { RootStackNavigationProp, RootStackParamList } from "../navigation/types";
import ModalHeader from "../components/ModalHeader";
import {
  DEEP_FOREST,
  EARTH_GREEN,
  PARCHMENT,
  CARD_BACKGROUND_LIGHT,
  BORDER_SOFT,
  TEXT_PRIMARY_STRONG,
  TEXT_SECONDARY,
  TEXT_MUTED,
} from "../constants/colors";

type EditGearScreenRouteProp = RouteProp<RootStackParamList, "EditGear">;

export default function EditGearScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<EditGearScreenRouteProp>();
  const { gearItem } = route.params;

  const [name, setName] = useState(gearItem.name);
  const [category, setCategory] = useState<GearCategory>(gearItem.category);
  const [brand, setBrand] = useState(gearItem.brand || "");
  const [model, setModel] = useState(gearItem.model || "");
  const [weight, setWeight] = useState(gearItem.weight || "");
  const [notes, setNotes] = useState(gearItem.notes || "");
  const [imageUri, setImageUri] = useState<string | null>(gearItem.imageUrl || null);
  const [imageChanged, setImageChanged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Please allow access to your photos to add gear images.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setImageChanged(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Please allow camera access to take photos.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setImageChanged(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const handleRemovePhoto = () => {
    Alert.alert(
      "Remove Photo",
      "Are you sure you want to remove this photo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setImageUri(null);
            setImageChanged(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "You must be signed in to edit gear");
      return;
    }

    if (!name.trim()) {
      Alert.alert("Name Required", "Please enter a name for this gear");
      return;
    }

    try {
      setSubmitting(true);

      // Handle image upload if changed
      let imageUrl: string | undefined = imageUri || undefined;
      if (imageChanged && imageUri && !imageUri.startsWith("http")) {
        try {
          imageUrl = await uploadGearImage(user.uid, gearItem.id, imageUri);
        } catch (imageError) {
          console.error("Error uploading image:", imageError);
          Alert.alert("Warning", "Failed to upload new image, but other changes were saved.");
        }
      } else if (imageChanged && !imageUri) {
        // Image was removed
        imageUrl = undefined;
      }

      // Update the gear item
      await updateGearItem(gearItem.id, {
        name: name.trim(),
        category,
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        weight: weight.trim() || undefined,
        notes: notes.trim() || undefined,
        imageUrl,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error: any) {
      console.error("Error updating gear:", error);
      Alert.alert("Error", error.message || "Failed to update gear");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoPress = () => {
    if (imageUri) {
      Alert.alert(
        "Photo Options",
        "What would you like to do?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Take New Photo", onPress: handleTakePhoto },
          { text: "Choose from Library", onPress: handlePickImage },
          { text: "Remove Photo", onPress: handleRemovePhoto, style: "destructive" },
        ]
      );
    } else {
      Alert.alert(
        "Add Photo",
        "Choose a photo for your gear",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Take Photo", onPress: handleTakePhoto },
          { text: "Choose from Library", onPress: handlePickImage },
        ]
      );
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: PARCHMENT }}>
      <ModalHeader
        title="Edit Gear"
        showTitle
        rightAction={{
          icon: "checkmark",
          onPress: handleSubmit,
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-5 pt-5">
          {/* Photo Picker */}
          <View className="mb-4 items-center">
            <Pressable
              onPress={handlePhotoPress}
              className="w-32 h-32 rounded-xl items-center justify-center active:opacity-70"
              style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT, borderWidth: 1 }}
            >
              {imageUri ? (
                <>
                  <Image source={{ uri: imageUri }} className="w-full h-full rounded-xl" resizeMode="cover" />
                  <View
                    style={{
                      position: "absolute",
                      bottom: 4,
                      right: 4,
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: EARTH_GREEN,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="camera-outline" size={16} color={PARCHMENT} />
                  </View>
                </>
              ) : (
                <View className="items-center">
                  <Ionicons name="camera-outline" size={32} color={TEXT_MUTED} />
                  <Text
                    className="mt-2 text-sm"
                    style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_MUTED }}
                  >
                    Add Photo
                  </Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Name Field */}
          <View className="mb-4">
            <Text
              className="mb-2"
              style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}
            >
              Gear Name *
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g., Tent, Sleeping Bag"
              placeholderTextColor={TEXT_MUTED}
              className="px-4 py-3 rounded-xl border"
              style={{
                backgroundColor: CARD_BACKGROUND_LIGHT,
                borderColor: BORDER_SOFT,
                fontFamily: "SourceSans3_400Regular",
                color: TEXT_PRIMARY_STRONG,
              }}
            />
          </View>

          {/* Category Picker */}
          <View className="mb-4">
            <Text
              className="mb-2"
              style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}
            >
              Category *
            </Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowCategoryPicker(!showCategoryPicker);
              }}
              className="px-4 py-3 rounded-xl border flex-row items-center justify-between"
              style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}
            >
              <Text style={{ fontFamily: "SourceSans3_400Regular", color: TEXT_PRIMARY_STRONG }}>
                {GEAR_CATEGORIES.find(c => c.value === category)?.label || "Select Category"}
              </Text>
              <Ionicons name="chevron-down" size={20} color={TEXT_SECONDARY} />
            </Pressable>

            {showCategoryPicker && (
              <View
                className="mt-2 rounded-xl border overflow-hidden"
                style={{ backgroundColor: CARD_BACKGROUND_LIGHT, borderColor: BORDER_SOFT }}
              >
                {GEAR_CATEGORIES.map(cat => (
                  <Pressable
                    key={cat.value}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setCategory(cat.value);
                      setShowCategoryPicker(false);
                    }}
                    className="px-4 py-3 border-b active:opacity-70"
                    style={{ borderColor: BORDER_SOFT }}
                  >
                    <Text
                      style={{
                        fontFamily: category === cat.value ? "SourceSans3_600SemiBold" : "SourceSans3_400Regular",
                        color: category === cat.value ? EARTH_GREEN : TEXT_PRIMARY_STRONG,
                      }}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Brand Field */}
          <View className="mb-4">
            <Text
              className="mb-2"
              style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}
            >
              Brand
            </Text>
            <TextInput
              value={brand}
              onChangeText={setBrand}
              placeholder="e.g., REI, Patagonia"
              placeholderTextColor={TEXT_MUTED}
              className="px-4 py-3 rounded-xl border"
              style={{
                backgroundColor: CARD_BACKGROUND_LIGHT,
                borderColor: BORDER_SOFT,
                fontFamily: "SourceSans3_400Regular",
                color: TEXT_PRIMARY_STRONG,
              }}
            />
          </View>

          {/* Model Field */}
          <View className="mb-4">
            <Text
              className="mb-2"
              style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}
            >
              Model
            </Text>
            <TextInput
              value={model}
              onChangeText={setModel}
              placeholder="Model name or number"
              placeholderTextColor={TEXT_MUTED}
              className="px-4 py-3 rounded-xl border"
              style={{
                backgroundColor: CARD_BACKGROUND_LIGHT,
                borderColor: BORDER_SOFT,
                fontFamily: "SourceSans3_400Regular",
                color: TEXT_PRIMARY_STRONG,
              }}
            />
          </View>

          {/* Weight Field */}
          <View className="mb-4">
            <Text
              className="mb-2"
              style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}
            >
              Weight
            </Text>
            <TextInput
              value={weight}
              onChangeText={setWeight}
              placeholder="e.g., 1.2 lb or 540 g"
              placeholderTextColor={TEXT_MUTED}
              className="px-4 py-3 rounded-xl border"
              style={{
                backgroundColor: CARD_BACKGROUND_LIGHT,
                borderColor: BORDER_SOFT,
                fontFamily: "SourceSans3_400Regular",
                color: TEXT_PRIMARY_STRONG,
              }}
            />
          </View>

          {/* Notes Field */}
          <View className="mb-4">
            <Text
              className="mb-2"
              style={{ fontFamily: "SourceSans3_600SemiBold", color: TEXT_PRIMARY_STRONG }}
            >
              Notes
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional notes about this gear..."
              placeholderTextColor={TEXT_MUTED}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="px-4 py-3 rounded-xl border"
              style={{
                backgroundColor: CARD_BACKGROUND_LIGHT,
                borderColor: BORDER_SOFT,
                fontFamily: "SourceSans3_400Regular",
                color: TEXT_PRIMARY_STRONG,
                minHeight: 100,
              }}
            />
          </View>

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmit}
            disabled={!name.trim() || submitting}
            className="mt-4 mb-8 py-4 rounded-xl active:opacity-90"
            style={{
              backgroundColor: name.trim() ? DEEP_FOREST : BORDER_SOFT,
            }}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={PARCHMENT} />
            ) : (
              <Text
                className="text-center"
                style={{ fontFamily: "SourceSans3_600SemiBold", color: PARCHMENT }}
              >
                Save Changes
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
