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
import {
  Task,
  Project,
  TaskStatus,
  TaskPriority,
  CreateTaskPayload,
  UpdateTaskPayload,
} from "../sdk/types";
import { getStatusLabel, getPriorityLabel } from "../sdk/mappers";
import { Colors, Radii, Space, Typography } from "../theme";

export interface TaskEditorModalProps {
  visible: boolean;
  task?: Task | null; // null/undefined for create, Task object for edit
  projects: Project[];
  defaultProjectId?: number | null;
  isLoading?: boolean;
  onClose: () => void;
  onSave: (payload: CreateTaskPayload | UpdateTaskPayload, taskId?: number) => Promise<void>;
}

export const TaskEditorModal: React.FC<TaskEditorModalProps> = ({
  visible,
  task,
  projects,
  defaultProjectId = null,
  isLoading = false,
  onClose,
  onSave,
}) => {
  const isEditing = !!task;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState<number | null>(null);
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setProjectId(task.project);
      setStatus(task.status || "todo");
      setPriority(task.priority || "medium");
      setDueDate(task.due_date || "");
    } else {
      setTitle("");
      setDescription("");
      setProjectId(defaultProjectId);
      setStatus("todo");
      setPriority("medium");
      setDueDate("");
    }
    setErrorMessage("");
  }, [task, defaultProjectId, visible]);

  const cycleStatus = () => {
    const statuses: TaskStatus[] = ["todo", "in_progress", "completed"];
    setStatus(statuses[(statuses.indexOf(status) + 1) % statuses.length]);
  };

  const cyclePriority = () => {
    const priorities: TaskPriority[] = ["low", "medium", "high"];
    setPriority(priorities[(priorities.indexOf(priority) + 1) % priorities.length]);
  };

  const cycleProject = () => {
    if (projects.length === 0) return;
    const projectIds: (number | null)[] = [null, ...projects.map((p) => p.id)];
    const curIdx = projectIds.indexOf(projectId);
    const nextIdx = (curIdx + 1) % projectIds.length;
    setProjectId(projectIds[nextIdx]);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setErrorMessage("Task title is required.");
      return;
    }

    setErrorMessage("");
    setSaving(true);

    try {
      const payload: CreateTaskPayload | UpdateTaskPayload = {
        title: title.trim(),
        description: description.trim() || undefined,
        project: projectId,
        status,
        priority,
        due_date: dueDate.trim() || null,
      };

      await onSave(payload, task?.id);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Failed to save task.";
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  const selectedProject = projects.find((p) => p.id === projectId);

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
                {isEditing ? "Edit Task" : "Create New Task"}
              </Text>
              <Text style={styles.sheetSubtitle}>
                {isEditing
                  ? "Update task parameters, assignment, and status."
                  : "Add a task to keep your project work moving."}
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
            {/* Title */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Task Title *</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Build authentication flow"
                placeholderTextColor={Colors.inputPlaceholder}
                style={styles.input}
                accessibilityLabel="Task Title"
              />
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Describe what needs to be done..."
                placeholderTextColor={Colors.inputPlaceholder}
                multiline
                numberOfLines={4}
                style={[styles.input, styles.textarea]}
                accessibilityLabel="Task Description"
              />
            </View>

            {/* Project Picker */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Project</Text>
              <TouchableOpacity
                style={styles.selectorRow}
                onPress={cycleProject}
                accessibilityRole="button"
                accessibilityLabel="Select Project"
              >
                <Text style={styles.selectorValue}>
                  {selectedProject ? selectedProject.name : "No Project (Standalone)"}
                </Text>
                <Text style={styles.cycleHint}>Tap to switch</Text>
              </TouchableOpacity>
            </View>

            {/* Status & Priority Row */}
            <View style={styles.row}>
              <View style={[styles.formGroup, styles.halfCol]}>
                <Text style={styles.label}>Status</Text>
                <TouchableOpacity
                  style={styles.selectorRow}
                  onPress={cycleStatus}
                  accessibilityRole="button"
                  accessibilityLabel="Task Status"
                >
                  <Text style={styles.selectorValue}>{getStatusLabel(status)}</Text>
                  <Text style={styles.cycleHint}>Tap</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.formGroup, styles.halfCol]}>
                <Text style={styles.label}>Priority</Text>
                <TouchableOpacity
                  style={styles.selectorRow}
                  onPress={cyclePriority}
                  accessibilityRole="button"
                  accessibilityLabel="Task Priority"
                >
                  <Text style={styles.selectorValue}>{getPriorityLabel(priority)}</Text>
                  <Text style={styles.cycleHint}>Tap</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Due Date */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Due Date (YYYY-MM-DD)</Text>
              <TextInput
                value={dueDate}
                onChangeText={setDueDate}
                placeholder="YYYY-MM-DD (e.g. 2026-09-15)"
                placeholderTextColor={Colors.inputPlaceholder}
                style={styles.input}
                accessibilityLabel="Due Date"
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
                  {isEditing ? "Save Changes" : "Create Task"}
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
    maxHeight: 400,
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
    minHeight: 80,
    textAlignVertical: "top",
  },
  selectorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    paddingVertical: Space.sm,
    paddingHorizontal: Space.md,
    borderRadius: Radii.lg,
  },
  selectorValue: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
  },
  cycleHint: {
    ...Typography.caption,
    color: Colors.primaryText,
    marginLeft: Space.xs,
  },
  row: {
    flexDirection: "row",
    gap: Space.sm,
  },
  halfCol: {
    flex: 1,
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
    minWidth: 120,
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
