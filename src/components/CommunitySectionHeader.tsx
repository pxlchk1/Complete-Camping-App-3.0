/**
 * Community Section Header
 * Shared header component for all Community tabs with deep forest green stripe
 */

import React from "react";
import { View, Text, Pressable, ImageBackground, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DEEP_FOREST, TEXT_ON_DARK } from "../constants/colors";
const COMMUNITY_HEADER_BG = require("../assets/images/community.png");

interface CommunitySectionHeaderProps {
  title: string;
  onAddPress: () => void;
}

export default function CommunitySectionHeader({
  title,
  onAddPress
}: CommunitySectionHeaderProps) {
  return (
    <ImageBackground
      source={COMMUNITY_HEADER_BG}
      style={styles.bg}
      resizeMode="cover"
      imageStyle={{ opacity: 0.85 }}
    >
      <View style={styles.overlay}>
        <View style={styles.inner}>
          <Text style={styles.title}>{title}</Text>
          <Pressable onPress={onAddPress} style={styles.addBtn} accessibilityLabel="Add">
            <Ionicons name="add-circle" size={32} color={TEXT_ON_DARK} />
          </Pressable>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    width: '100%',
    minHeight: 72,
    justifyContent: 'flex-end',
  },
  overlay: {
    backgroundColor: 'rgba(16,40,32,0.60)',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: 'JosefinSlab_700Bold',
    color: TEXT_ON_DARK,
    fontSize: 22,
    letterSpacing: 0.5,
  },
  addBtn: {
    marginLeft: 8,
  },
});
