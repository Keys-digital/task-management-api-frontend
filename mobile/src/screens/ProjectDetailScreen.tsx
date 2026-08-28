import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ActivityIndicator,
} from "react-native";
import {
  Project,
  Task,
  TaskStatus,
  TaskPriority,
  CreateTaskPayload,
  UpdateTaskPayload,
  UpdateProjectPayload,
} from "../sdk/types";
import { getStatusLabel, getPriorityLabel } from "../sdk/mappers";
import { TaskEditorModal } from "../components/TaskEditorModal";
import { ProjectEditorModal } from "../components/ProjectEditorModal";
import { ConfirmDeleteModal } from "../components/ConfirmDeleteModal";
import { Colors, Radii, Space, Typography } from "../theme";

export interface ProjectDetailScreenProps {
  project: Project;
  tasks: Task[];
  projects: Project[];
  onBack: () => void;
  onUpdateProject: (id: number, payload: UpdateProjectPayload) => Promise<void>;
  onDeleteProject: (id: number) => Promise<void>;
  onToggleTask: (task: Task) => Promise<void> | void;
  onCreateTask: (payload: CreateTaskPayload) => Promise<void>;
  onUpdateTask: (id: number, payload: UpdateTaskPayload) => Promise<void>;
  onDeleteTask: (id: number) => Promise<void>;
}

export const ProjectDetailScreen: React.FC<ProjectDetailScreenProps> = ({
  project,
  tasks,
  projects,
  onBack,
  onUpdateProject,
  onDeleteProject,
  onToggleTask,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Project Edit & Delete Modals
  const [editProjectModalVisible, setEditProjectModalVisible] = useState(false);
  const [deleteProjectModalVisible, setDeleteProjectModalVisible] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  // Task Edit & Delete Modals
  const [taskEditorModalVisible, setTaskEditorModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [deleteTaskModalVisible, setDeleteTaskModalVisible] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

  // Filter tasks belonging specifically to this project
  const projectTasks = useMemo(
    () => tasks.filter((t) => t.project === project.id),
    [tasks, project.id]
  );

  const totalCount = projectTasks.length;
  const completedCount = projectTasks.filter((t) => t.status === "completed").length;
  const inProgressCount = projectTasks.filter((t) => t.status === "in_progress").length;
  const todoCount = projectTasks.filter((t) => t.status === "todo").length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projectTasks.filter((t) => {
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q));
      const matchesStatus =
        statusFilter === "all" || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projectTasks, search, statusFilter]);

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

  const handleConfirmDeleteProject = async () => {
    setIsDeletingProject(true);
    try {
      await onDeleteProject(project.id);
      setDeleteProjectModalVisible(false);
      onBack();
    } finally {
      setIsDeletingProject(false);
    }
  };

  const handleConfirmDeleteTask = async () => {
    if (!taskToDelete) return;
    setIsDeletingTask(true);
    try {
      await onDeleteTask(taskToDelete.id);
      setDeleteTaskModalVisible(false);
      setTaskToDelete(null);
    } finally {
      setIsDeletingTask(false);
    }
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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Back Navigation Bar */}
        <TouchableOpacity style={styles.backButton} onPress={onBack} accessibilityRole="button">
          <Text style={styles.backButtonText}>← Back to Projects</Text>
        </TouchableOpacity>

        {/* Project Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.titleRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.projectTitle} accessibilityRole="header">
                {project.name}
              </Text>
              <Text style={styles.projectDate}>
                Created {formatDate(project.created_at)} · Updated {formatDate(project.updated_at)}
              </Text>
            </View>

            <View style={styles.projectActions}>
              <TouchableOpacity
                style={styles.actionBtnOutline}
                onPress={() => setEditProjectModalVisible(true)}
                accessibilityRole="button"
              >
                <Text style={styles.actionBtnOutlineText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtnDanger}
                onPress={() => setDeleteProjectModalVisible(true)}
                accessibilityRole="button"
              >
                <Text style={styles.actionBtnDangerText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.projectDescription}>
            {project.description || "No description provided."}
          </Text>

          {/* Progress Bar & Stats */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Project Progress</Text>
              <Text style={styles.progressPercent}>{progressPercent}%</Text>
            </View>

            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>

            <View style={styles.statsRow}>
              <Text style={styles.statItem}>Total: <Text style={styles.statBold}>{totalCount}</Text></Text>
              <Text style={styles.statItem}>To Do: <Text style={styles.statBold}>{todoCount}</Text></Text>
              <Text style={styles.statItem}>In Progress: <Text style={[styles.statBold, { color: "#60a5fa" }]}>{inProgressCount}</Text></Text>
              <Text style={styles.statItem}>Completed: <Text style={[styles.statBold, { color: "#34d399" }]}>{completedCount}</Text></Text>
            </View>
          </View>
        </View>

        {/* Task Management Section Header */}
        <View style={styles.taskSectionHeader}>
          <View style={styles.taskSectionTextContainer}>
            <Text style={styles.sectionTitle}>Project Tasks</Text>
            <Text style={styles.sectionSubtitle}>
              Manage and track items assigned to this project.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addTaskButton}
            onPress={() => {
              setEditingTask(null);
              setTaskEditorModalVisible(true);
            }}
            accessibilityRole="button"
          >
            <Text style={styles.addTaskButtonText}>+ Add Task</Text>
          </TouchableOpacity>
        </View>

        {/* Search & Filter */}
        <View style={styles.filterCard}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search tasks in this project..."
            placeholderTextColor={Colors.inputPlaceholder}
            style={styles.searchInput}
          />

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

        {/* Empty States */}
        {totalCount === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={styles.emptyTitle}>No tasks in this project</Text>
            <Text style={styles.emptySubtitle}>
              Create your first task to start organizing work for {project.name}.
            </Text>
            <TouchableOpacity
              style={styles.emptyActionBtn}
              onPress={() => {
                setEditingTask(null);
                setTaskEditorModalVisible(true);
              }}
              accessibilityRole="button"
            >
              <Text style={styles.emptyActionText}>+ Add Task</Text>
            </TouchableOpacity>
          </View>
        )}

        {totalCount > 0 && filteredTasks.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No matching tasks</Text>
            <Text style={styles.emptySubtitle}>Try changing your search keywords or filter selection.</Text>
            <TouchableOpacity
              style={styles.clearFilterBtn}
              onPress={() => {
                setSearch("");
                setStatusFilter("all");
              }}
            >
              <Text style={styles.clearFilterText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Task Cards List */}
        {filteredTasks.length > 0 && (
          <View style={styles.taskList}>
            {filteredTasks.map((task) => {
              const overdue = isOverdue(task.due_date, task.status);
              const dueDateFormatted = formatDate(task.due_date);
              const isCompleted = task.status === "completed";

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

                  {/* Badges */}
                  <View style={styles.badgeRow}>
                    <View style={[styles.priorityBadge, getPriorityBadgeStyle(task.priority)]}>
                      <Text style={[styles.priorityBadgeText, getPriorityTextStyle(task.priority)]}>
                        {getPriorityLabel(task.priority)}
                      </Text>
                    </View>

                    <View style={[styles.statusBadge, getStatusBadgeStyle(task.status)]}>
                      <Text style={[styles.statusBadgeText, getStatusTextStyle(task.status)]}>
                        {getStatusLabel(task.status)}
                      </Text>
                    </View>
                  </View>

                  {/* Footer */}
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
                          setTaskEditorModalVisible(true);
                        }}
                        accessibilityRole="button"
                      >
                        <Text style={styles.editBtnText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => {
                          setTaskToDelete(task);
                          setDeleteTaskModalVisible(true);
                        }}
                        accessibilityRole="button"
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

      {/* Task Create / Edit Modal (pre-selected with this project ID) */}
      <TaskEditorModal
        visible={taskEditorModalVisible}
        task={editingTask}
        projects={projects}
        defaultProjectId={project.id}
        onClose={() => setTaskEditorModalVisible(false)}
        onSave={handleSaveTask}
      />

      {/* Project Edit Modal */}
      <ProjectEditorModal
        visible={editProjectModalVisible}
        project={project}
        onClose={() => setEditProjectModalVisible(false)}
        onSave={async (payload) => {
          await onUpdateProject(project.id, payload);
        }}
      />

      {/* Project Delete Confirmation Modal */}
      <ConfirmDeleteModal
        visible={deleteProjectModalVisible}
        title="Delete Project"
        message="Are you sure you want to delete this project? All associated tasks will be removed permanently."
        itemTitle={project.name}
        isLoading={isDeletingProject}
        onCancel={() => setDeleteProjectModalVisible(false)}
        onConfirm={handleConfirmDeleteProject}
      />

      {/* Task Delete Confirmation Modal */}
      <ConfirmDeleteModal
        visible={deleteTaskModalVisible}
        title="Delete Task"
        message="Are you sure you want to delete this task?"
        itemTitle={taskToDelete?.title}
        isLoading={isDeletingTask}
        onCancel={() => {
          setDeleteTaskModalVisible(false);
          setTaskToDelete(null);
        }}
        onConfirm={handleConfirmDeleteTask}
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
  backButton: {
    marginBottom: Space.xs / 2,
    paddingVertical: Space.xs,
  },
  backButtonText: {
    ...Typography.button,
    color: Colors.primaryText,
    fontSize: 13,
  },
  headerCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Space.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Space.sm,
    width: "100%",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleContainer: {
    flex: 1,
    marginRight: Space.sm,
    minWidth: 0,
  },
  projectTitle: {
    ...Typography.screenTitle,
    fontSize: 20,
    color: Colors.text,
  },
  projectDate: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  projectActions: {
    flexDirection: "row",
    gap: Space.xs,
    flexWrap: "wrap",
  },
  actionBtnOutline: {
    paddingVertical: 4,
    paddingHorizontal: Space.sm,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.borderMid,
    backgroundColor: Colors.surfaceElevated,
  },
  actionBtnOutlineText: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: "600",
  },
  actionBtnDanger: {
    paddingVertical: 4,
    paddingHorizontal: Space.sm,
    borderRadius: Radii.md,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  actionBtnDangerText: {
    ...Typography.caption,
    color: Colors.errorText,
    fontWeight: "600",
  },
  projectDescription: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  progressSection: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radii.lg,
    padding: Space.md,
    borderWidth: 1,
    borderColor: Colors.borderMid,
    marginTop: Space.xs,
    gap: Space.xs,
    width: "100%",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    ...Typography.caption,
    fontWeight: "700",
    color: Colors.text,
  },
  progressPercent: {
    ...Typography.body,
    fontWeight: "800",
    color: Colors.primaryText,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: Colors.borderMid,
    borderRadius: Radii.full,
    overflow: "hidden",
    marginVertical: 4,
    width: "100%",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 4,
    gap: 4,
  },
  statItem: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  statBold: {
    fontWeight: "700",
    color: Colors.text,
  },
  taskSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
  },
  taskSectionTextContainer: {
    flex: 1,
    marginRight: Space.xs,
  },
  sectionTitle: {
    ...Typography.cardTitle,
    color: Colors.text,
  },
  sectionSubtitle: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  addTaskButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Space.xs,
    paddingHorizontal: Space.md,
    borderRadius: Radii.lg,
  },
  addTaskButtonText: {
    ...Typography.button,
    color: Colors.textInverse,
    fontSize: 12,
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
  searchInput: {
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: Radii.lg,
    paddingHorizontal: Space.sm,
    paddingVertical: Space.xs,
    color: Colors.text,
    ...Typography.bodySmall,
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
