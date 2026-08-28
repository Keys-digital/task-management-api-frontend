import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Platform,
} from "react-native";
import { User, Task, Project, TaskStatus, TaskPriority } from "../sdk/types";
import { getStatusLabel, getPriorityLabel } from "../sdk/mappers";
import { Colors, Radii, Space, Typography } from "../theme";

export interface DashboardScreenProps {
  user: User | null;
  tasks: Task[];
  projects: Project[];
  onNavigateToTasks: () => void;
  onNavigateToProjects: () => void;
  onSelectProject?: (projectId: number) => void;
  onToggleTask?: (task: Task) => Promise<void> | void;
}

const PROJECT_ICON_STYLES = [
  { bg: "rgba(13, 148, 136, 0.15)", iconColor: "#2dd4bf", border: "rgba(13, 148, 136, 0.3)" },
  { bg: "rgba(59, 130, 246, 0.15)", iconColor: "#60a5fa", border: "rgba(59, 130, 246, 0.3)" },
  { bg: "rgba(139, 92, 246, 0.15)", iconColor: "#a78bfa", border: "rgba(139, 92, 246, 0.3)" },
  { bg: "rgba(244, 63, 94, 0.15)", iconColor: "#fb7185", border: "rgba(244, 63, 94, 0.3)" },
  { bg: "rgba(245, 158, 11, 0.15)", iconColor: "#fbbf24", border: "rgba(245, 158, 11, 0.3)" },
  { bg: "rgba(16, 185, 129, 0.15)", iconColor: "#34d399", border: "rgba(16, 185, 129, 0.3)" },
];

const getProjectStyle = (id: number) =>
  PROJECT_ICON_STYLES[id % PROJECT_ICON_STYLES.length];

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  user,
  tasks,
  projects,
  onNavigateToTasks,
  onNavigateToProjects,
  onSelectProject,
  onToggleTask,
}) => {
  const pendingTasks = tasks.filter((t) => t.status !== "completed");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  const isOverdue = (dueDate?: string | null, status?: TaskStatus): boolean => {
    if (!dueDate || status === "completed") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(`${dueDate}T00:00:00`);
    return due < today;
  };

  const formatDate = (date?: string | null): string => {
    if (!date) return "";
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return date;
    return d.toLocaleDateString();
  };

  // Urgent tasks: Overdue tasks first, then tasks due today or upcoming (max 3)
  const urgentTasks = useMemo(() => {
    const overdue = pendingTasks.filter((t) => isOverdue(t.due_date, t.status));
    const upcoming = pendingTasks.filter((t) => t.due_date && !isOverdue(t.due_date, t.status));
    const others = pendingTasks.filter((t) => !t.due_date);
    return [...overdue, ...upcoming, ...others].slice(0, 3);
  }, [pendingTasks]);

  const overdueCount = pendingTasks.filter((t) => isOverdue(t.due_date, t.status)).length;

  const getProjectName = (task: Task): string => {
    if (task.project_name) return task.project_name;
    if (task.project) {
      const found = projects.find((p) => p.id === task.project);
      if (found) return found.name;
      return `Project #${task.project}`;
    }
    return "Standalone";
  };

  const displayName =
    user?.profile?.full_name ||
    (user?.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : "") ||
    user?.username ||
    "User";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Welcome Header */}
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
          Welcome back, {displayName}
        </Text>
        <Text style={styles.subtitle}>Here is what is happening with your workspace.</Text>
      </View>

      {/* Top Highlight Banner Grid */}
      <View style={styles.highlightGrid}>
        <TouchableOpacity
          style={styles.summaryCard}
          onPress={onNavigateToProjects}
          accessibilityRole="button"
        >
          <Text style={styles.summaryLabel}>Projects</Text>
          <Text style={styles.summaryValue}>{projects.length}</Text>
          <Text style={styles.summaryFootnote}>Active in workspace</Text>
        </TouchableOpacity>

        <View style={styles.brandBannerCard}>
          <Text style={styles.brandTag}>TASKFLO</Text>
          <Text style={styles.brandHeadline}>Your work, organized.</Text>
          <Text style={styles.brandSub}>Keep projects and tasks moving forward.</Text>
        </View>
      </View>

      {/* Workload Metrics Row */}
      <View style={styles.metricsGrid}>
        <TouchableOpacity
          style={styles.metricCard}
          onPress={onNavigateToTasks}
          accessibilityRole="button"
        >
          <Text style={styles.metricLabel}>Pending</Text>
          <Text style={styles.metricValue}>{pendingTasks.length}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.metricCard, overdueCount > 0 && styles.overdueCard]}
          onPress={onNavigateToTasks}
          accessibilityRole="button"
        >
          <Text style={styles.metricLabel}>Overdue</Text>
          <Text style={[styles.metricValue, styles.overdueValue]}>{overdueCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.metricCard}
          onPress={onNavigateToTasks}
          accessibilityRole="button"
        >
          <Text style={styles.metricLabel}>Completed</Text>
          <Text style={[styles.metricValue, styles.completedValue]}>{completedTasks.length}</Text>
        </TouchableOpacity>
      </View>

      {/* Tasks Requiring Attention Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Tasks Requiring Attention
            </Text>
            <Text style={styles.sectionSub}>Your most urgent overdue and upcoming tasks.</Text>
          </View>
          <TouchableOpacity onPress={onNavigateToTasks} accessibilityRole="button">
            <Text style={styles.linkText}>View all →</Text>
          </TouchableOpacity>
        </View>

        {urgentTasks.length === 0 ? (
          <View style={styles.emptyAttentionBox}>
            <Text style={styles.emptyAttentionIcon}>✓</Text>
            <Text style={styles.emptyAttentionTitle}>You're all caught up!</Text>
            <Text style={styles.emptyAttentionSub}>
              No overdue or upcoming tasks currently require your attention.
            </Text>
          </View>
        ) : (
          <View style={styles.urgentList}>
            {urgentTasks.map((task) => {
              const overdue = isOverdue(task.due_date, task.status);
              const dueDateFormatted = formatDate(task.due_date);
              const projectName = getProjectName(task);

              return (
                <TouchableOpacity
                  key={task.id}
                  style={[styles.urgentTaskCard, overdue && styles.urgentOverdueCard]}
                  onPress={onNavigateToTasks}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  <View style={styles.taskTopRow}>
                    <View style={styles.taskTitleContainer}>
                      {overdue && (
                        <View style={styles.overdueBadge}>
                          <Text style={styles.overdueBadgeText}>OVERDUE</Text>
                        </View>
                      )}
                      <Text style={styles.taskTitle} numberOfLines={1}>
                        {task.title}
                      </Text>
                    </View>

                    {onToggleTask && (
                      <Switch
                        value={task.status === "completed"}
                        onValueChange={() => onToggleTask(task)}
                        trackColor={{ false: Colors.borderMid, true: Colors.success }}
                        thumbColor={Colors.textInverse}
                      />
                    )}
                  </View>

                  <Text style={styles.taskProjectPill} numberOfLines={1}>
                    📁 {projectName}
                  </Text>

                  <View style={styles.taskBottomRow}>
                    <View style={styles.badgePair}>
                      <View style={[styles.pBadge, getPriorityStyle(task.priority)]}>
                        <Text style={styles.pBadgeText}>{getPriorityLabel(task.priority)}</Text>
                      </View>
                      <View style={styles.sBadge}>
                        <Text style={styles.sBadgeText}>{getStatusLabel(task.status)}</Text>
                      </View>
                    </View>

                    {dueDateFormatted ? (
                      <Text style={[styles.dueText, overdue && styles.dueTextOverdue]}>
                        {overdue ? `Due ${dueDateFormatted}` : `Due ${dueDateFormatted}`}
                      </Text>
                    ) : (
                      <Text style={styles.dueText}>No due date</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Active Projects Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Active Projects ({projects.length})
            </Text>
            <Text style={styles.sectionSub}>Projects belonging to your workspace.</Text>
          </View>
          <TouchableOpacity onPress={onNavigateToProjects} accessibilityRole="button">
            <Text style={styles.linkText}>View all →</Text>
          </TouchableOpacity>
        </View>

        {projects.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No active projects yet.</Text>
            <TouchableOpacity style={styles.createProjBtn} onPress={onNavigateToProjects}>
              <Text style={styles.createProjBtnText}>+ Create Project</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.projectList}>
            {projects.slice(0, 3).map((proj) => {
              const styleTheme = getProjectStyle(proj.id);
              const projTasks = tasks.filter((t) => t.project === proj.id);
              const completedCount = projTasks.filter((t) => t.status === "completed").length;

              return (
                <TouchableOpacity
                  key={proj.id}
                  style={styles.projCard}
                  onPress={() => onSelectProject ? onSelectProject(proj.id) : onNavigateToProjects()}
                  accessibilityRole="button"
                >
                  <View style={styles.projCardHeader}>
                    <View
                      style={[
                        styles.projIconBadge,
                        { backgroundColor: styleTheme.bg, borderColor: styleTheme.border },
                      ]}
                    >
                      <Text style={styles.projIconText}>📁</Text>
                    </View>

                    {/* Directional Chevron Navigation Pill */}
                    <View style={styles.navChevronPill}>
                      <Text style={styles.navChevronText}>›</Text>
                    </View>
                  </View>

                  <Text style={styles.projTitle} numberOfLines={1}>{proj.name}</Text>
                  <Text style={styles.projDesc} numberOfLines={2}>
                    {proj.description || "No description provided."}
                  </Text>

                  <View style={styles.projFooter}>
                    <Text style={styles.taskCountText}>
                      {completedCount}/{projTasks.length} tasks completed
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const getPriorityStyle = (priority: TaskPriority | string) => {
  switch (priority) {
    case "high":
      return { backgroundColor: "rgba(239, 68, 68, 0.15)" };
    case "medium":
      return { backgroundColor: "rgba(245, 158, 11, 0.15)" };
    default:
      return { backgroundColor: "rgba(100, 116, 139, 0.15)" };
  }
};

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
  header: {
    marginBottom: Space.xs / 2,
  },
  title: {
    ...Typography.screenTitle,
    fontSize: 20,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginTop: 2,
  },
  highlightGrid: {
    flexDirection: "row",
    gap: Space.sm,
    width: "100%",
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Space.md,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    minWidth: 0,
  },
  summaryLabel: {
    ...Typography.caption,
    fontWeight: "700",
    color: Colors.textMuted,
    textTransform: "uppercase",
    fontSize: 10,
  },
  summaryValue: {
    ...Typography.screenTitle,
    fontSize: 24,
    color: Colors.text,
    marginVertical: 2,
  },
  summaryFootnote: {
    ...Typography.caption,
    color: Colors.textSubtle,
    fontSize: 10,
  },
  brandBannerCard: {
    flex: 1.4,
    backgroundColor: Colors.primaryHover,
    borderRadius: Radii.xl,
    padding: Space.md,
    borderWidth: 1,
    borderColor: Colors.primaryFocus,
    justifyContent: "center",
    minWidth: 0,
  },
  brandTag: {
    ...Typography.caption,
    fontWeight: "800",
    color: Colors.primaryLight,
    letterSpacing: 1,
    fontSize: 9,
  },
  brandHeadline: {
    ...Typography.body,
    fontWeight: "700",
    color: Colors.textInverse,
    marginTop: 2,
    fontSize: 13,
  },
  brandSub: {
    ...Typography.caption,
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    marginTop: 2,
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
  overdueCard: {
    borderColor: "rgba(239, 68, 68, 0.4)",
    backgroundColor: "rgba(239, 68, 68, 0.04)",
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
    color: Colors.primaryText,
    marginTop: 2,
  },
  overdueValue: {
    color: Colors.errorText,
  },
  completedValue: {
    color: "#34d399",
  },
  section: {
    gap: Space.sm,
    width: "100%",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  sectionTitleContainer: {
    flex: 1,
    marginRight: Space.xs,
  },
  sectionTitle: {
    ...Typography.cardTitle,
    fontSize: 15,
    color: Colors.text,
  },
  sectionSub: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 1,
  },
  linkText: {
    ...Typography.caption,
    fontWeight: "700",
    color: Colors.primaryText,
  },
  emptyAttentionBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Space.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    borderStyle: "dashed",
    gap: 4,
  },
  emptyAttentionIcon: {
    fontSize: 22,
    color: Colors.success,
    fontWeight: "700",
  },
  emptyAttentionTitle: {
    ...Typography.body,
    fontWeight: "700",
    color: Colors.text,
  },
  emptyAttentionSub: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: "center",
  },
  urgentList: {
    gap: Space.sm,
    width: "100%",
  },
  urgentTaskCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Space.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Space.xs / 2,
    width: "100%",
  },
  urgentOverdueCard: {
    borderColor: "rgba(239, 68, 68, 0.35)",
    backgroundColor: "rgba(239, 68, 68, 0.03)",
  },
  taskTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  taskTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Space.xs,
    marginRight: Space.xs,
    minWidth: 0,
  },
  overdueBadge: {
    backgroundColor: Colors.errorLight,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radii.sm,
  },
  overdueBadgeText: {
    color: Colors.errorText,
    fontWeight: "800",
    fontSize: 9,
  },
  taskTitle: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.text,
    flex: 1,
  },
  taskProjectPill: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 11,
  },
  taskBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 4,
    flexWrap: "wrap",
    gap: 4,
  },
  badgePair: {
    flexDirection: "row",
    gap: 4,
  },
  pBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radii.sm,
  },
  pBadgeText: {
    ...Typography.caption,
    fontSize: 9,
    fontWeight: "700",
    color: Colors.text,
  },
  sBadge: {
    backgroundColor: Colors.surfaceElevated,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radii.sm,
  },
  sBadgeText: {
    ...Typography.caption,
    fontSize: 9,
    color: Colors.textMuted,
  },
  dueText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textMuted,
  },
  dueTextOverdue: {
    color: Colors.errorText,
    fontWeight: "700",
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Space.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Space.xs,
    width: "100%",
  },
  emptyText: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  createProjBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Space.xs,
    paddingHorizontal: Space.md,
    borderRadius: Radii.md,
    marginTop: 4,
  },
  createProjBtnText: {
    ...Typography.button,
    color: Colors.textInverse,
    fontSize: 12,
  },
  projectList: {
    gap: Space.sm,
    width: "100%",
  },
  projCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Space.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Space.xs / 2,
    width: "100%",
  },
  projCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  projIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  projIconText: {
    fontSize: 14,
  },
  navChevronPill: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.borderMid,
  },
  navChevronText: {
    color: Colors.primaryText,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: Platform.OS === "android" ? -2 : 0,
  },
  projTitle: {
    ...Typography.body,
    fontWeight: "700",
    color: Colors.text,
  },
  projDesc: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  projFooter: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 4,
  },
  taskCountText: {
    ...Typography.caption,
    color: Colors.primaryText,
    fontWeight: "600",
    fontSize: 11,
  },
});
