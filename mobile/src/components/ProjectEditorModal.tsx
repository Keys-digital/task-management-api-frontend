import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Project, CreateProjectPayload, UpdateProjectPayload } from "../sdk/types";
import { Colors, Radii, Space, Typography } from "../theme";

export interface ProjectEditorModalProps {
  visible: boolean;
  project?: Project | null; // null/undefined for create, Project object for edit
  isLoading?: boolean;
  onClose: () => void;
  onSave: (payload: CreateProjectPayload | UpdateProjectPayload, projectId?: number) => Promise<void>;
}

export const ProjectEditorModal: React.FC<ProjectEditorModalProps> = ({
  visible,
  project,
  isLoading = false,
  onClose,
  onSave,
}) => {
  const isEditing = !!project;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name || "");
      setDescription(project.description || "");
    } else {
      setName("");
      setDescription("");
    }
    setErrorMessage("");
  }, [project, visible]);

  const handleSave = async () => {
    if (!name.trim()) {
      setErrorMessage("Project name is required.");
      return;
    }

    setErrorMessage("");
    setSaving(true);

    try {
      const payload: CreateProjectPayload | UpdateProjectPayload = {
        name: name.trim(),
        description: description.trim() || undefined,
      };

      await onSave(payload, project?.id);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Failed to save project.";
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.sheetTitle} accessibilityRole="header">
                {isEditing ? "Edit Project" : "Create New Project"}
              </Text>
              <Text style={styles.sheetSubtitle}>
                {isEditing
                  ? "Update project name and details."
                  : "Organize related tasks together under a project."}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityRole="button">
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {!!errorMessage && (
            <View style={styles.errorBox} accessibilityRole="alert">
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Project Name *</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Mobile App 2.0"
                placeholderTextColor={Colors.inputPlaceholder}
                style={styles.input}
                accessibilityLabel="Project Name"
              />
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Briefly describe what this project covers..."
                placeholderTextColor={Colors.inputPlaceholder}
                multiline
                numberOfLines={4}
                style={[styles.input, styles.textarea]}
                accessibilityLabel="Project Description"
              />
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={saving || isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, (saving || isLoading) && styles.disabledButton]}
              onPress={handleSave}
              disabled={saving || isLoading}
              accessibilityRole="button"
            >
              {saving || isLoading ? (
                <ActivityIndicator color={Colors.textInverse} size="small" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {isEditing ? "Save Changes" : "Create Project"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radii["2xl"],
    borderTopRightRadius: Radii["2xl"],
    padding: Space.lg,
    maxHeight: "92%",
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Space.md,
    width: "100%",
  },
  headerTextContainer: {
    flex: 1,
    marginRight: Space.xs,
  },
  sheetTitle: {
    ...Typography.screenTitle,
    fontSize: 18,
    color: Colors.text,
  },
  sheetSubtitle: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: Space.xs,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceElevated,
  },
  closeBtnText: {
    color: Colors.textMuted,
    fontWeight: "700",
    fontSize: 14,
  },
  errorBox: {
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.error,
    paddingVertical: Space.xs,
    paddingHorizontal: Space.md,
    borderRadius: Radii.md,
    marginBottom: Space.sm,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.errorText,
  },
  formScroll: {
    maxHeight: 320,
  },
  formGroup: {
    marginBottom: Space.sm,
    gap: Space.xs / 2,
  },
  label: {
    ...Typography.label,
    color: Colors.textMuted,
  },
  input: {
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    color: Colors.text,
    paddingVertical: Space.sm,
    paddingHorizontal: Space.md,
    borderRadius: Radii.lg,
    ...Typography.body,
  },
  textarea: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Space.sm,
    marginTop: Space.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Space.sm,
  },
  cancelButton: {
    paddingVertical: Space.sm,
    paddingHorizontal: Space.md,
    borderRadius: Radii.lg,
    justifyContent: "center",
  },
  cancelButtonText: {
    ...Typography.button,
    color: Colors.textMuted,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Space.sm,
    paddingHorizontal: Space.lg,
    borderRadius: Radii.lg,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 130,
    minHeight: 44,
  },
  saveButtonText: {
    ...Typography.button,
    color: Colors.textInverse,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
