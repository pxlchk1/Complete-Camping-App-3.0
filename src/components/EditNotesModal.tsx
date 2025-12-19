import React, { useState } from "react";
import { Modal, View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface EditNotesModalProps {
  visible: boolean;
  initialValue: string;
  onSave: (notes: string) => void;
  onClose: () => void;
}

export default function EditNotesModal({ visible, initialValue, onSave, onClose }: EditNotesModalProps) {
  const [notes, setNotes] = useState(initialValue);

  // Reset notes when modal opens
  React.useEffect(() => {
    setNotes(initialValue);
  }, [visible, initialValue]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.header}>Edit Notes</Text>
          <TextInput
            style={styles.input}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes (day-by-day plans, reminders, permit info…)"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            autoFocus
          />
          <View style={styles.actions}>
            <Pressable onPress={onClose} style={styles.cancelBtn} accessibilityLabel="Cancel">
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onSave(notes.trim());
                onClose();
              }}
              style={styles.saveBtn}
              accessibilityLabel="Save notes"
              disabled={notes.trim() === initialValue.trim()}
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
    minHeight: 90,
    marginBottom: 18,
    backgroundColor: "#f9f6f2",
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
