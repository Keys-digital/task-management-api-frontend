import React from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Colors, Radii, Space, Typography } from "../theme";

export interface ToastProps {
  type: "success" | "error" | "info";
  message: string;
  onDismiss?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ type, message }) => {
  return (
    <View
      style={[
        styles.container,
        type === "success" && styles.success,
        type === "error" && styles.error,
        type === "info" && styles.info,
      ]}
      accessibilityRole="alert"
    >
      <Text
        style={[
          styles.text,
          type === "success" && styles.successText,
          type === "error" && styles.errorText,
          type === "info" && styles.infoText,
        ]}
      >
        {type === "success" ? "✓ " : type === "error" ? "⚠ " : "ℹ "}
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: Space.md,
    right: Space.md,
    zIndex: 9999,
    paddingVertical: Space.sm,
    paddingHorizontal: Space.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    alignItems: "center",
  },
  success: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success,
  },
  error: {
    backgroundColor: Colors.errorLight,
    borderColor: Colors.error,
  },
  info: {
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.borderMid,
  },
  text: {
    ...Typography.bodySmall,
    fontWeight: "600",
    textAlign: "center",
  },
  successText: {
    color: Colors.successText,
  },
  errorText: {
    color: Colors.errorText,
  },
  infoText: {
    color: Colors.text,
  },
});
