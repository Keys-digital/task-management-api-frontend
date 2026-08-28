import React from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet, ActivityIndicator } from "react-native";
import { Colors, Radii, Space, Typography } from "../theme";

export interface ConfirmDeleteModalProps {
  visible: boolean;
  title: string;
  message: string;
  itemTitle?: string;
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  visible,
  title,
  message,
  itemTitle,
  isLoading = false,
  onCancel,
  onConfirm,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title} accessibilityRole="header">{title}</Text>
          <Text style={styles.message}>{message}</Text>
          {!!itemTitle && (
            <View style={styles.itemBox}>
              <Text style={styles.itemText} numberOfLines={2}>"{itemTitle}"</Text>
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onCancel}
              disabled={isLoading}
              accessibilityRole="button"
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteBtn, isLoading && styles.disabled]}
              onPress={onConfirm}
              disabled={isLoading}
              accessibilityRole="button"
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.deleteText}>Delete</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: Space.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Space.lg,
    width: "92%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Space.sm,
  },
  title: {
    ...Typography.cardTitle,
    color: Colors.errorText,
  },
  message: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  itemBox: {
    backgroundColor: Colors.surfaceElevated,
    padding: Space.sm,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.borderMid,
  },
  itemText: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.text,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Space.sm,
    marginTop: Space.sm,
  },
  cancelBtn: {
    paddingVertical: Space.xs,
    paddingHorizontal: Space.md,
    borderRadius: Radii.md,
  },
  cancelText: {
    ...Typography.button,
    color: Colors.textMuted,
  },
  deleteBtn: {
    backgroundColor: Colors.errorDark,
    paddingVertical: Space.xs,
    paddingHorizontal: Space.md,
    borderRadius: Radii.md,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteText: {
    ...Typography.button,
    color: Colors.textInverse,
  },
  disabled: {
    opacity: 0.6,
  },
});
