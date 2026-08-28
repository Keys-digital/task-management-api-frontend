import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from "react-native";
import { Task, Project, TaskStatus, TaskPriority, CreateTaskPayload, UpdateTaskPayload } from "../sdk/types";
import { getStatusLabel, getPriorityLabel } from "../sdk/mappers";
import { TaskEditorModal } from "../components/TaskEditorModal";
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal";
import { Colors, Radii, Space, Typography } from "../theme";

export interface TasksScreenProps {
  tasks: Task[];
  projects: Project[];
  onToggleTask: (task: Task) => Promise<void> | void;
  onCreateTask: (payload: CreateTaskPayload) => Promise<void>;
  onUpdateTask: (id: number, payload: UpdateTaskPayload) => Promise<void>;
  onDeleteTask: (id: number) => Promise<void>;
  onNavigateToProjects?: () => void;
}

export const TasksScreen: React.FC<TasksScreenProps> = ({
  tasks,
  projects,
  onToggleTask,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onNavigateToProjects,
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Modal State
  const [editorModalVisible, setEditorModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Metrics
  const todoCount = tasks.filter((t) => t.status === "todo").length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  // Filter Logic
  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.project_name && t.project_name.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "all" || t.status === statusFilter;

      const matchesPriority =
        priorityFilter === "all" || t.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, search, statusFilter, priorityFilter]);

  const isOverdue = (dueDate?: string | null, status?: TaskStatus): boolean => {
    if (!dueDate || status === "completed") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(`${dueDate}T00:00:00`);
    return due < today;
  };

  const formatDate = (date?: string | null): string | null => {
    if (!date) return null;
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;
    return parsed.toLocaleDateString();
  };

  const getProjectName = (task: Task): string => {
    if (task.project_name) return task.project_name;
    if (task.project) {
      const found = projects.find((p) => p.id === task.project);
      if (found) return found.name;
      return `Project #${task.project}`;
    }
    return "Standalone";
  };

  const handleSaveTask = async (
    payload: CreateTaskPayload | UpdateTaskPayload,
    taskId?: number
  ) => {
    if (taskId) {
      await onUpdateTask(taskId, payload as UpdateTaskPayload);
    } else {
      await onCreateTask(payload as CreateTaskPayload);
    }
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteTask(taskToDelete.id);
      setDeleteModalVisible(false);
      setTaskToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.pageTitle} accessibilityRole="header">
              Tasks
            </Text>
            <Text style={styles.pageSubtitle}>
              Organize, track, and complete your workspace tasks.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.newTaskButton}
            onPress={() => {
              setEditingTask(null);
              setEditorModalVisible(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Create New Task"
          >
            <Text style={styles.newTaskButtonText}>+ New Task</Text>
          </TouchableOpacity>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => setStatusFilter("todo")}
            accessibilityRole="button"
          >
            <Text style={styles.metricLabel}>To Do</Text>
            <Text style={[styles.metricValue, { color: Colors.text }]}>{todoCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => setStatusFilter("in_progress")}
            accessibilityRole="button"
          >
            <Text style={styles.metricLabel}>In Progress</Text>
            <Text style={[styles.metricValue, { color: "#60a5fa" }]}>{inProgressCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => setStatusFilter("completed")}
            accessibilityRole="button"
          >
            <Text style={styles.metricLabel}>Completed</Text>
            <Text style={[styles.metricValue, { color: "#34d399" }]}>{completedCount}</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Card */}
        <View style={styles.filterCard}>
          {/* Search Box */}
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search tasks, descriptions, projects..."
              placeholderTextColor={Colors.inputPlaceholder}
              style={styles.searchInput}
              accessibilityLabel="Search Tasks"
            />
            {!!search && (
              <TouchableOpacity onPress={() => setSearch("")} style={styles.clearSearchBtn}>
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Status Filters */}
          <View style={styles.filterRow}>
            <Text style={styles.filterRowLabel}>Status:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillGroup}>
              {[
                { id: "all", label: "All" },
                { id: "todo", label: "To Do" },
                { id: "in_progress", label: "In Progress" },
                { id: "completed", label: "Completed" },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setStatusFilter(tab.id)}
                  style={[styles.filterPill, statusFilter === tab.id && styles.activeFilterPill]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: statusFilter === tab.id }}
                >
                  <Text style={[styles.filterPillText, statusFilter === tab.id && styles.activeFilterPillText]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Priority Filters */}
          <View style={styles.filterRow}>
            <Text style={styles.filterRowLabel}>Priority:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillGroup}>
              {[
                { id: "all", label: "All" },
                { id: "high", label: "High" },
                { id: "medium", label: "Medium" },
                { id: "low", label: "Low" },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setPriorityFilter(tab.id)}
                  style={[styles.filterPill, priorityFilter === tab.id && styles.activeFilterPill]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: priorityFilter === tab.id }}
                >
                  <Text style={[styles.filterPillText, priorityFilter === tab.id && styles.activeFilterPillText]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Empty State */}
        {filteredTasks.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>
              {tasks.length === 0 ? "No tasks yet" : "No matching tasks found"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {tasks.length === 0
                ? "Get started by creating your first task or assigning one to a project."
                : "Try adjusting your search terms or clearing your status/priority filters."}
            </Text>

            {tasks.length === 0 ? (
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => {
                  setEditingTask(null);
                  setEditorModalVisible(true);
                }}
                accessibilityRole="button"
              >
                <Text style={styles.emptyActionText}>+ Create First Task</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.clearFilterBtn}
                onPress={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setPriorityFilter("all");
                }}
                accessibilityRole="button"
              >
                <Text style={styles.clearFilterText}>Reset All Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Task Cards List */}
        {filteredTasks.length > 0 && (
          <View style={styles.taskList}>
            {filteredTasks.map((task) => {
              const overdue = isOverdue(task.due_date, task.status);
              const dueDateFormatted = formatDate(task.due_date);
              const isCompleted = task.status === "completed";
              const projectName = getProjectName(task);

              return (
                <View key={task.id} style={[styles.taskCard, isCompleted && styles.completedCard]}>
                  {/* Header: Switch + Title */}
                  <View style={styles.cardHeader}>
                    <Switch
                      value={isCompleted}
                      onValueChange={() => onToggleTask(task)}
                      trackColor={{ false: Colors.borderMid, true: Colors.success }}
                      thumbColor={Colors.textInverse}
                      accessibilityRole="switch"
                      accessibilityLabel={`Mark ${task.title} as ${isCompleted ? "to do" : "completed"}`}
                    />
                    <Text
                      style={[styles.taskTitle, isCompleted && styles.taskTitleCompleted]}
                      numberOfLines={2}
                    >
                      {task.title}
                    </Text>
                  </View>

                  {/* Description */}
                  {!!task.description && (
                    <Text style={styles.taskDescription} numberOfLines={2}>
                      {task.description}
                    </Text>
                  )}

                  {/* Project & Badges */}
                  <View style={styles.badgeRow}>
                    {/* Project Association */}
                    <View style={styles.projectPill}>
                      <Text style={styles.projectPillText} numberOfLines={1}>
                        📁 {projectName}
                      </Text>
                    </View>

                    {/* Priority Badge */}
                    <View style={[styles.priorityBadge, getPriorityBadgeStyle(task.priority)]}>
                      <Text style={[styles.priorityBadgeText, getPriorityTextStyle(task.priority)]}>
                        {getPriorityLabel(task.priority)}
                      </Text>
                    </View>

                    {/* Status Badge */}
                    <View style={[styles.statusBadge, getStatusBadgeStyle(task.status)]}>
                      <Text style={[styles.statusBadgeText, getStatusTextStyle(task.status)]}>
                        {getStatusLabel(task.status)}
                      </Text>
                    </View>
                  </View>

                  {/* Footer: Due Date & Actions */}
                  <View style={styles.cardFooter}>
                    {dueDateFormatted ? (
                      <Text style={[styles.dueDateText, overdue && styles.overdueDueDateText]}>
                        {overdue ? `⚠ Overdue · Due ${dueDateFormatted}` : `📅 Due ${dueDateFormatted}`}
                      </Text>
                    ) : (
                      <Text style={styles.noDueDateText}>No due date</Text>
                    )}

                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => {
                          setEditingTask(task);
                          setEditorModalVisible(true);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Edit task ${task.title}`}
                      >
                        <Text style={styles.editBtnText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => {
                          setTaskToDelete(task);
                          setDeleteModalVisible(true);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Delete task ${task.title}`}
                      >
                        <Text style={styles.deleteBtnText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Task Create / Edit Modal */}
      <TaskEditorModal
        visible={editorModalVisible}
        task={editingTask}
        projects={projects}
        onClose={() => setEditorModalVisible(false)}
        onSave={handleSaveTask}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        visible={deleteModalVisible}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        itemTitle={taskToDelete?.title}
        isLoading={isDeleting}
        onCancel={() => {
          setDeleteModalVisible(false);
          setTaskToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </View>
  );
};

// ── Style Helpers ─────────────────────────────────────────────────────────────
const getPriorityBadgeStyle = (priority: TaskPriority | string) => {
  switch (priority) {
    case "high":
      return { backgroundColor: "rgba(239, 68, 68, 0.15)", borderColor: "rgba(239, 68, 68, 0.3)" };
    case "medium":
      return { backgroundColor: "rgba(245, 158, 11, 0.15)", borderColor: "rgba(245, 158, 11, 0.3)" };
    case "low":
      return { backgroundColor: "rgba(100, 116, 139, 0.15)", borderColor: "rgba(100, 116, 139, 0.3)" };
    default:
      return { backgroundColor: Colors.surfaceElevated, borderColor: Colors.borderMid };
  }
};

const getPriorityTextStyle = (priority: TaskPriority | string) => {
  switch (priority) {
    case "high":
      return { color: "#f87171" };
    case "medium":
      return { color: "#fbbf24" };
    case "low":
      return { color: "#94a3b8" };
    default:
      return { color: Colors.text };
  }
};

const getStatusBadgeStyle = (status: TaskStatus | string) => {
  switch (status) {
    case "completed":
      return { backgroundColor: "rgba(16, 185, 129, 0.15)", borderColor: "rgba(16, 185, 129, 0.3)" };
    case "in_progress":
      return { backgroundColor: "rgba(59, 130, 246, 0.15)", borderColor: "rgba(59, 130, 246, 0.3)" };
    case "todo":
    default:
      return { backgroundColor: Colors.surfaceElevated, borderColor: Colors.borderMid };
  }
};

const getStatusTextStyle = (status: TaskStatus | string) => {
  switch (status) {
    case "completed":
      return { color: "#34d399" };
    case "in_progress":
      return { color: "#60a5fa" };
    case "todo":
    default:
      return { color: Colors.textMuted };
  }
};

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Space.md,
    paddingBottom: Space["3xl"] + 20,
    gap: Space.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
  },
  headerTextContainer: {
    flex: 1,
    marginRight: Space.xs,
  },
  pageTitle: {
    ...Typography.screenTitle,
    fontSize: 20,
    color: Colors.text,
  },
  pageSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginTop: 2,
  },
  newTaskButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Space.xs,
    paddingHorizontal: Space.md,
    borderRadius: Radii.lg,
  },
  newTaskButtonText: {
    ...Typography.button,
    color: Colors.textInverse,
    fontSize: 13,
  },
  metricsGrid: {
    flexDirection: "row",
    gap: Space.xs,
    width: "100%",
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: Space.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 0,
  },
  metricLabel: {
    ...Typography.caption,
    fontWeight: "700",
    color: Colors.textMuted,
    fontSize: 10,
    textTransform: "uppercase",
  },
  metricValue: {
    ...Typography.screenTitle,
    fontSize: 18,
    marginTop: 2,
  },
  filterCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Space.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Space.xs,
    width: "100%",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: Radii.lg,
    paddingHorizontal: Space.sm,
    width: "100%",
  },
  searchIcon: {
    fontSize: 14,
    marginRight: Space.xs,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Space.xs,
    color: Colors.text,
    ...Typography.bodySmall,
  },
  clearSearchBtn: {
    padding: Space.xs / 2,
  },
  clearSearchText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.xs,
    width: "100%",
  },
  filterRowLabel: {
    ...Typography.caption,
    fontWeight: "700",
    color: Colors.textMuted,
    fontSize: 11,
    width: 55,
  },
  pillGroup: {
    flexDirection: "row",
    gap: Space.xs / 2,
    paddingVertical: 2,
  },
  filterPill: {
    paddingVertical: 4,
    paddingHorizontal: Space.sm,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderMid,
  },
  activeFilterPill: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryFocus,
  },
  filterPillText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: "600",
  },
  activeFilterPillText: {
    color: Colors.textInverse,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Space.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
    marginTop: Space.sm,
    width: "100%",
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: Space.xs,
  },
  emptyTitle: {
    ...Typography.cardTitle,
    color: Colors.text,
  },
  emptySubtitle: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 4,
    maxWidth: 280,
  },
  emptyActionBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Space.sm,
    paddingHorizontal: Space.lg,
    borderRadius: Radii.lg,
    marginTop: Space.md,
  },
  emptyActionText: {
    ...Typography.button,
    color: Colors.textInverse,
  },
  clearFilterBtn: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderMid,
    paddingVertical: Space.xs,
    paddingHorizontal: Space.md,
    borderRadius: Radii.md,
    marginTop: Space.md,
  },
  clearFilterText: {
    ...Typography.button,
    color: Colors.text,
  },
  taskList: {
    gap: Space.sm,
    width: "100%",
  },
  taskCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Space.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Space.xs,
    width: "100%",
  },
  completedCard: {
    opacity: 0.75,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.sm,
    width: "100%",
  },
  taskTitle: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.text,
    flex: 1,
    minWidth: 0,
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
    color: Colors.textMuted,
  },
  taskDescription: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    paddingLeft: 46,
    marginTop: -2,
  },
  badgeRow: {
    flexDirection: "row",
    gap: Space.xs / 2,
    paddingLeft: 46,
    marginTop: 4,
    flexWrap: "wrap",
  },
  projectPill: {
    backgroundColor: Colors.surfaceElevated,
    paddingVertical: 2,
    paddingHorizontal: Space.xs,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.borderMid,
    maxWidth: 160,
  },
  projectPillText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 10,
  },
  priorityBadge: {
    paddingVertical: 2,
    paddingHorizontal: Space.xs,
    borderRadius: Radii.sm,
    borderWidth: 1,
  },
  priorityBadgeText: {
    ...Typography.caption,
    fontWeight: "700",
    fontSize: 10,
    textTransform: "uppercase",
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: Space.xs,
    borderRadius: Radii.sm,
    borderWidth: 1,
  },
  statusBadgeText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: "600",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Space.xs,
    marginTop: Space.xs,
    paddingLeft: 46,
    flexWrap: "wrap",
    gap: 4,
  },
  dueDateText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  overdueDueDateText: {
    color: "#f87171",
    fontWeight: "700",
  },
  noDueDateText: {
    ...Typography.caption,
    color: Colors.textSubtle,
  },
  cardActions: {
    flexDirection: "row",
    gap: Space.xs,
  },
  editBtn: {
    paddingVertical: 2,
    paddingHorizontal: Space.xs,
    borderRadius: Radii.sm,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderMid,
  },
  editBtnText: {
    ...Typography.caption,
    color: Colors.primaryText,
    fontWeight: "600",
  },
  deleteBtn: {
    paddingVertical: 2,
    paddingHorizontal: Space.xs,
    borderRadius: Radii.sm,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  deleteBtnText: {
    ...Typography.caption,
    color: Colors.errorText,
    fontWeight: "600",
  },
});
