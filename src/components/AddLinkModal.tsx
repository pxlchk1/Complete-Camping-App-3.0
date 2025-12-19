import React, { useState } from "react";
import { Modal, View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.header}>Add Link</Text>
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
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3D2817",
    marginBottom: 12,
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
