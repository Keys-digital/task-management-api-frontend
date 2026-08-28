import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Project, Task, CreateProjectPayload, CreateTaskPayload } from "../sdk/types";
import { ProjectEditorModal } from "../components/ProjectEditorModal";
import { TaskEditorModal } from "../components/TaskEditorModal";
import { Colors, Radii, Space, Typography } from "../theme";

export interface ProjectsScreenProps {
  projects: Project[];
  tasks: Task[];
  isLoading?: boolean;
  error?: string;
  onSelectProject: (projectId: number) => void;
  onCreateProject: (payload: CreateProjectPayload) => Promise<void>;
  onCreateTask: (payload: CreateTaskPayload) => Promise<void>;
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

export const ProjectsScreen: React.FC<ProjectsScreenProps> = ({
  projects,
  tasks,
  isLoading = false,
  error = "",
  onSelectProject,
  onCreateProject,
  onCreateTask,
}) => {
  const [search, setSearch] = useState("");
  const [createProjectModalVisible, setCreateProjectModalVisible] = useState(false);

  // Quick "+ Add Task" for a specific project from card
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [targetProjectId, setTargetProjectId] = useState<number | null>(null);

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [projects, search]);

  const formatDate = (date?: string | null): string => {
    if (!date) return "";
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return date;
    return d.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.pageTitle} accessibilityRole="header">
              Your Projects
            </Text>
            <Text style={styles.pageSubtitle}>
              Review and manage your projects, or choose one to add a task.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.newProjectButton}
            onPress={() => setCreateProjectModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Create New Project"
          >
            <Text style={styles.newProjectButtonText}>+ New Project</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search projects by name or description..."
            placeholderTextColor={Colors.inputPlaceholder}
            style={styles.searchInput}
            accessibilityLabel="Search Projects"
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch("")} style={styles.clearSearchBtn}>
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Loading */}
        {isLoading && (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading your projects...</Text>
          </View>
        )}

        {/* Error */}
        {!isLoading && !!error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {/* Empty: 0 Projects */}
        {!isLoading && !error && projects.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📁</Text>
            <Text style={styles.emptyTitle}>No projects yet</Text>
            <Text style={styles.emptySubtitle}>
              Create your first project and start organizing your work into focused streams.
            </Text>
            <TouchableOpacity
              style={styles.emptyActionBtn}
              onPress={() => setCreateProjectModalVisible(true)}
              accessibilityRole="button"
            >
              <Text style={styles.emptyActionText}>+ Create First Project</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty: Search filter 0 results */}
        {!isLoading && !error && projects.length > 0 && filteredProjects.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No matching projects</Text>
            <Text style={styles.emptySubtitle}>Try a different project name or description.</Text>
            <TouchableOpacity style={styles.clearFilterBtn} onPress={() => setSearch("")}>
              <Text style={styles.clearFilterText}>Clear Search</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Project Cards Grid */}
        {!isLoading && !error && filteredProjects.length > 0 && (
          <View style={styles.projectGrid}>
            {filteredProjects.map((project) => {
              const styleTheme = getProjectStyle(project.id);
              const projectTasks = tasks.filter((t) => t.project === project.id);
              const completedCount = projectTasks.filter((t) => t.status === "completed").length;
              const totalCount = projectTasks.length;
              const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

              return (
                <TouchableOpacity
                  key={project.id}
                  style={styles.projectCard}
                  onPress={() => onSelectProject(project.id)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={`Open project ${project.name}`}
                >
                  {/* Card Header: Project Icon + Directional Chevron */}
                  <View style={styles.cardTop}>
                    <View
                      style={[
                        styles.projectIconBadge,
                        { backgroundColor: styleTheme.bg, borderColor: styleTheme.border },
                      ]}
                    >
                      <Text style={[styles.projectIconText, { color: styleTheme.iconColor }]}>
                        📁
                      </Text>
                    </View>

                    {/* Directional Chevron Navigation Pill */}
                    <View style={styles.navChevronPill}>
                      <Text style={styles.navChevronText}>›</Text>
                    </View>
                  </View>

                  {/* Title & Description */}
                  <Text style={styles.projName} numberOfLines={1}>
                    {project.name}
                  </Text>
                  <Text style={styles.projDesc} numberOfLines={2}>
                    {project.description || "No description provided."}
                  </Text>

                  {/* Progress Bar & Stats */}
                  <View style={styles.cardProgressSection}>
                    <View style={styles.cardProgressHeader}>
                      <Text style={styles.cardProgressLabel}>
                        {completedCount} of {totalCount} tasks completed
                      </Text>
                      <Text style={styles.cardProgressPercent}>{progressPercent}%</Text>
                    </View>

                    <View style={styles.progressBarTrack}>
                      <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                    </View>
                  </View>

                  {/* Footer: Updated Date + "+ Add Task" quick button */}
                  <View style={styles.cardFooter}>
                    <Text style={styles.updatedDate}>Updated {formatDate(project.updated_at)}</Text>

                    <TouchableOpacity
                      style={styles.quickAddTaskBtn}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        setTargetProjectId(project.id);
                        setTaskModalVisible(true);
                      }}
                      accessibilityRole="button"
                    >
                      <Text style={styles.quickAddTaskText}>+ Add Task</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Create Project Modal */}
      <ProjectEditorModal
        visible={createProjectModalVisible}
        onClose={() => setCreateProjectModalVisible(false)}
        onSave={async (payload) => {
          await onCreateProject(payload as CreateProjectPayload);
        }}
      />

      {/* Quick Add Task Modal */}
      <TaskEditorModal
        visible={taskModalVisible}
        projects={projects}
        defaultProjectId={targetProjectId}
        onClose={() => {
          setTaskModalVisible(false);
          setTargetProjectId(null);
        }}
        onSave={async (payload) => {
          await onCreateTask(payload as CreateTaskPayload);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Space.md,
    paddingBottom: Space["3xl"] + 20,
  },
  headerRow: {
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
  newProjectButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Space.xs,
    paddingHorizontal: Space.md,
    borderRadius: Radii.lg,
  },
  newProjectButtonText: {
    ...Typography.button,
    color: Colors.textInverse,
    fontSize: 13,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: Radii.lg,
    paddingHorizontal: Space.sm,
    marginBottom: Space.md,
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
  centerBox: {
    padding: Space.xl,
    alignItems: "center",
    gap: Space.sm,
    width: "100%",
  },
  loadingText: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.error,
    padding: Space.md,
    borderRadius: Radii.lg,
    marginBottom: Space.md,
    width: "100%",
  },
  errorBannerText: {
    ...Typography.bodySmall,
    color: Colors.errorText,
    textAlign: "center",
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
  projectGrid: {
    gap: Space.md,
    width: "100%",
  },
  projectCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Space.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Space.xs,
    width: "100%",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  projectIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  projectIconText: {
    fontSize: 16,
  },
  navChevronPill: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.borderMid,
  },
  navChevronText: {
    color: Colors.primaryText,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: Platform.OS === "android" ? -2 : 0,
  },
  projName: {
    ...Typography.cardTitle,
    color: Colors.text,
  },
  projDesc: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginTop: -2,
  },
  cardProgressSection: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radii.md,
    padding: Space.xs,
    marginVertical: 4,
    gap: 4,
    width: "100%",
  },
  cardProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardProgressLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 11,
  },
  cardProgressPercent: {
    ...Typography.caption,
    fontWeight: "700",
    color: Colors.primaryText,
    fontSize: 11,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: Colors.borderMid,
    borderRadius: Radii.full,
    overflow: "hidden",
    width: "100%",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Space.xs,
    marginTop: 4,
    width: "100%",
    flexWrap: "wrap",
    gap: 4,
  },
  updatedDate: {
    ...Typography.caption,
    color: Colors.textSubtle,
  },
  quickAddTaskBtn: {
    backgroundColor: Colors.primaryLight,
    paddingVertical: 3,
    paddingHorizontal: Space.xs,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.primaryFocus,
  },
  quickAddTaskText: {
    ...Typography.caption,
    color: Colors.primaryText,
    fontWeight: "700",
    fontSize: 11,
  },
});
