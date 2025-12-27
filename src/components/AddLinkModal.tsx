import React, { useState } from "react";
import { Modal, View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DEEP_FOREST, PARCHMENT } from "../constants/colors";

export type AddLinkModalProps = {
  visible: boolean;
  onSave: (title: string, url: string) => void;
  onClose: () => void;
};

export default function AddLinkModal({ visible, onSave, onClose }: AddLinkModalProps) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (visible) {
      setTitle("");
      setUrl("");
      setError("");
    }
  }, [visible]);

  function validateAndSave() {
    if (title.trim().length < 2) {
      setError("Title must be at least 2 characters.");
      return;
    }
    let inputUrl = url.trim();
    if (!inputUrl) {
      setError("URL is required.");
      return;
    }
    if (!/^https?:\/\//i.test(inputUrl)) {
      inputUrl = "https://" + inputUrl;
    }
    try {
      const u = new URL(inputUrl);
      if (!/^https?:\/\//i.test(u.href)) throw new Error();
    } catch {
      setError("Please enter a valid URL (http/https).");
      return;
    }
    setError("");
    onSave(title.trim(), inputUrl);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: PARCHMENT }}>
        {/* Header - Deep Forest Green background */}
        <View style={styles.headerContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Add link</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={PARCHMENT} />
            </Pressable>
          </View>
        </View>
        
        <View style={styles.content}>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Link title (e.g. Our day one hike)"
            autoFocus
          />
          <TextInput
            style={styles.input}
            value={url}
            onChangeText={setUrl}
            placeholder="Paste or type URL (e.g. alltrails.com/...)"
            autoCapitalize="none"
            keyboardType="url"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <Pressable onPress={onClose} style={styles.cancelBtn} accessibilityLabel="Cancel">
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={validateAndSave}
              style={styles.saveBtn}
              accessibilityLabel="Save link"
              disabled={title.trim().length < 2 || !url.trim()}
            >
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: DEEP_FOREST,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontFamily: "Raleway_700Bold",
    fontSize: 24,
    color: PARCHMENT,
    flex: 1,
    marginRight: 12,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5D6C2",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#3D2817",
    marginBottom: 12,
    backgroundColor: "#f9f6f2",
  },
  error: {
    color: "#dc2626",
    fontSize: 13,
    marginBottom: 8,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  cancelBtn: {
    marginRight: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelText: {
    color: "#bfae9b",
    fontSize: 15,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3D2817",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  saveText: {
    color: "#fff",
    fontSize: 15,
    marginLeft: 6,
    fontWeight: "600",
  },
});
