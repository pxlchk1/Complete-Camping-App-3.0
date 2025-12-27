/**
 * Community Section Header
 * Shared header component for all Community tabs with deep forest green stripe
 */

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DEEP_FOREST, TEXT_ON_DARK } from "../constants/colors";

interface CommunitySectionHeaderProps {
  title: string;
  onAddPress: () => void;
  showFilter?: boolean;
  onFilterPress?: () => void;
}

export default function CommunitySectionHeader({
  title,
  onAddPress,
  showFilter,
  onFilterPress,
}: CommunitySectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.actions}>
          {showFilter && onFilterPress && (
            <Pressable onPress={onFilterPress} style={styles.actionBtn} accessibilityLabel="Filter">
              <Ionicons name="funnel-outline" size={24} color={TEXT_ON_DARK} />
            </Pressable>
          )}
          <Pressable onPress={onAddPress} style={styles.addBtn} accessibilityLabel="Add">
            <Ionicons name="add-circle" size={32} color={TEXT_ON_DARK} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: DEEP_FOREST,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: 'Raleway_700Bold',
    color: TEXT_ON_DARK,
    fontSize: 22,
    letterSpacing: 0.5,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    padding: 4,
  },
  addBtn: {
    marginLeft: 0,
  },
});
