import React from "react";
import { View, Text, Modal, Pressable, ScrollView, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { DEEP_FOREST, PARCHMENT } from "../constants/colors";

interface AboutModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AboutModal({ visible, onClose }: AboutModalProps) {
  const handleLinkPress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error("Failed to open URL:", error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-parchment" edges={["top", "bottom"]}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-stone-300">
          <View className="w-10" />
          <Text
            className="text-2xl"
            style={{ fontFamily: "JosefinSlab_700Bold", color: DEEP_FOREST }}
          >
            About
          </Text>
          <Pressable onPress={onClose} className="p-2 active:opacity-70">
            <Ionicons name="close" size={28} color={DEEP_FOREST} />
          </Pressable>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
          {/* Main Title */}
          <Text
            className="text-2xl text-center mb-6"
            style={{ fontFamily: "JosefinSlab_700Bold", color: DEEP_FOREST }}
          >
            About The Complete Camping App
          </Text>

          {/* Body Text */}
          <Text
            className="text-base mb-2 leading-6"
            style={{ fontFamily: "SourceSans3_400Regular", color: "#3d3d3d", lineHeight: 24 }}
          >
            The Complete Camping App is one of the ways I try to make camping feel easier,
            friendlier, and a little more fun. It brings together planning tools, gear ideas,
            community advice, and simple checklists so anyone can head outside with confidence.
          </Text>
          <Text
            className="text-base mb-8"
            style={{ fontFamily: "SourceSans3_400Regular", color: "#3d3d3d", lineHeight: 24 }}
          >
            {"\n"}
            Stay wild & wander often,{"\n"}
            Alana
          </Text>

          {/* Divider */}
          <View className="h-px bg-stone-300 mb-6" />

          {/* Find us online section */}
          <Text
            className="text-lg mb-4"
            style={{ fontFamily: "JosefinSlab_700Bold", color: DEEP_FOREST }}
          >
            Find us online
          </Text>

          <View className="mb-8 space-y-3">
            <View className="mb-3">
              <Text
                className="text-base mb-1"
                style={{ fontFamily: "SourceSans3_600SemiBold", color: DEEP_FOREST }}
              >
                Website
              </Text>
              <Pressable onPress={() => handleLinkPress("https://tentandlantern.com")}>
                <Text
                  className="text-base underline"
                  style={{ fontFamily: "SourceSans3_400Regular", color: "#2563eb" }}
                >
                  https://tentandlantern.com
                </Text>
              </Pressable>
            </View>

            <View className="mb-3">
              <Text
                className="text-base mb-1"
                style={{ fontFamily: "SourceSans3_600SemiBold", color: DEEP_FOREST }}
              >
                YouTube
              </Text>
              <Pressable
                onPress={() => handleLinkPress("https://www.youtube.com/@TentAndLantern")}
              >
                <Text
                  className="text-base underline"
                  style={{ fontFamily: "SourceSans3_400Regular", color: "#2563eb" }}
                >
                  https://www.youtube.com/@TentAndLantern
                </Text>
              </Pressable>
            </View>

            <View className="mb-3">
              <Text
                className="text-base mb-1"
                style={{ fontFamily: "SourceSans3_600SemiBold", color: DEEP_FOREST }}
              >
                Instagram
              </Text>
              <Pressable
                onPress={() => handleLinkPress("https://www.instagram.com/tent.and.lantern")}
              >
                <Text
                  className="text-base underline"
                  style={{ fontFamily: "SourceSans3_400Regular", color: "#2563eb" }}
                >
                  https://www.instagram.com/tent.and.lantern
                </Text>
              </Pressable>
            </View>

            <View className="mb-3">
              <Text
                className="text-base mb-1"
                style={{ fontFamily: "SourceSans3_600SemiBold", color: DEEP_FOREST }}
              >
                Email
              </Text>
              <Pressable onPress={() => handleLinkPress("mailto:info@tentandlantern.com")}>
                <Text
                  className="text-base underline"
                  style={{ fontFamily: "SourceSans3_400Regular", color: "#2563eb" }}
                >
                  info@tentandlantern.com
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Divider */}
          <View className="h-px bg-stone-300 mb-6" />

          {/* Special thanks section */}
          <Text
            className="text-lg mb-4"
            style={{ fontFamily: "JosefinSlab_700Bold", color: DEEP_FOREST }}
          >
            Special thanks
          </Text>

          <View className="mb-8">
            <Text
              className="text-sm mb-2"
              style={{ fontFamily: "SourceSans3_400Regular", color: "#6b7280", lineHeight: 20 }}
            >
              Data collection and steady encouragement: Dave Piper
            </Text>
            <Text
              className="text-sm mb-2"
              style={{ fontFamily: "SourceSans3_400Regular", color: "#6b7280", lineHeight: 20 }}
            >
              QA testing and thoughtful UX feedback: Will Piper
            </Text>
          </View>

          {/* Divider */}
          <View className="h-px bg-stone-300 mb-6" />

          {/* Footer */}

          <Text
            className="text-base mb-4"
            style={{ fontFamily: "SourceSans3_400Regular", color: "#3d3d3d" }}
          >
            Design and Development by{' '}
            <Text
              className="underline"
              style={{ color: '#2563eb' }}
              onPress={() => handleLinkPress('https://guyline.studio')}
            >
              Guyline.Studio
            </Text>
          </Text>

          <Text
            className="text-xs text-center mb-8"
            style={{ fontFamily: "SourceSans3_400Regular", color: "#9ca3af" }}
          >
            All content and IP © Tent and Lantern
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
