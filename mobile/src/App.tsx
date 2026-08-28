import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { TaskFloHeader } from "./components/TaskFloHeader";
import { Toast, ToastProps } from "./components/Toast";
import { DashboardScreen } from "./screens/DashboardScreen";
import { TasksScreen } from "./screens/TasksScreen";
import { ProjectsScreen } from "./screens/ProjectsScreen";
import { ProjectDetailScreen } from "./screens/ProjectDetailScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { RegisterScreen } from "./screens/RegisterScreen";
import {
  Task,
  Project,
  CreateTaskPayload,
  UpdateTaskPayload,
  CreateProjectPayload,
  UpdateProjectPayload,
  UserProfile,
} from "./sdk/types";
import { defaultOfflineCache } from "./offline/cacheManager";
import { Colors, Space, Radii } from "./theme";

type Tab = "dashboard" | "tasks" | "projects" | "profile" | "settings";

const MainShell: React.FC = () => {
  const {
    isInitializing,
    isAuthenticated,
    user,
    sdk,
    login,
    register,
    logout,
    updateUserLocally,
  } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [toast, setToast] = useState<{
    type: ToastProps["type"];
    message: string;
  } | null>(null);

  const showToast = (type: ToastProps["type"], message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (isAuthenticated) {
      sdk.tasks
        .listTasks()
        .then((data) => {
          setTasks(data);
          defaultOfflineCache.setTaskCache(data);
        })
        .catch(() => {
          setTasks(defaultOfflineCache.getTaskCache());
        });

      sdk.projects
        .listProjects()
        .then((data) => {
          setProjects(data);
          defaultOfflineCache.setProjectCache(data);
        })
        .catch(() => {
          setProjects(defaultOfflineCache.getProjectCache());
        });
    }
  }, [isAuthenticated, sdk]);

  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.spinner}>Loading TaskFlo...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    if (authMode === "register") {
      return (
        <RegisterScreen
          onRegister={async (username, email, password, passwordConfirm) => {
            await register(username, email, password, passwordConfirm);
          }}
          onNavigateToLogin={() => setAuthMode("login")}
        />
      );
    }
    return (
      <LoginScreen
        onLogin={async (username, password) => {
          await login(username, password);
        }}
        onNavigateToRegister={() => setAuthMode("register")}
      />
    );
  }

  // ── Task Handlers ─────────────────────────────────────────────────────────

  const handleToggleTask = async (task: Task) => {
    try {
      const updated = await sdk.tasks.toggleTaskCompletion(task);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      showToast(
        "success",
        updated.status === "completed"
          ? `Completed "${task.title}"`
          : `Reopened "${task.title}"`
      );
    } catch (err: unknown) {
      showToast("error", "Failed to update task status.");
    }
  };

  const handleCreateTask = async (payload: CreateTaskPayload) => {
    try {
      const created = await sdk.tasks.createTask(payload);
      setTasks((prev) => [created, ...prev]);
      showToast("success", `Created task "${created.title}"`);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Failed to create task.";
      showToast("error", msg);
      throw err;
    }
  };

  const handleUpdateTask = async (id: number, payload: UpdateTaskPayload) => {
    try {
      const updated = await sdk.tasks.updateTask(id, payload);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      showToast("success", `Updated task "${updated.title}"`);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Failed to update task.";
      showToast("error", msg);
      throw err;
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await sdk.tasks.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      showToast("success", "Task deleted successfully.");
    } catch (err: unknown) {
      showToast("error", "Failed to delete task.");
      throw err;
    }
  };

  // ── Project Handlers ──────────────────────────────────────────────────────

  const handleCreateProject = async (payload: CreateProjectPayload) => {
    try {
      const created = await sdk.projects.createProject(payload);
      setProjects((prev) => [...prev, created]);
      showToast("success", `Created project "${created.name}"`);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Failed to create project.";
      showToast("error", msg);
      throw err;
    }
  };

  const handleUpdateProject = async (id: number, payload: UpdateProjectPayload) => {
    try {
      const updated = await sdk.projects.updateProject(id, payload);
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
      showToast("success", `Updated project "${updated.name}"`);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Failed to update project.";
      showToast("error", msg);
      throw err;
    }
  };

  const handleDeleteProject = async (id: number) => {
    try {
      await sdk.projects.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setTasks((prev) => prev.filter((t) => t.project !== id));
      setSelectedProjectId(null);
      showToast("success", "Project deleted successfully.");
    } catch (err: unknown) {
      showToast("error", "Failed to delete project.");
      throw err;
    }
  };

  // ── Profile & Settings Handlers ───────────────────────────────────────────

  const handleUpdateProfile = async (data: {
    first_name?: string;
    last_name?: string;
    profile?: Partial<UserProfile>;
  }) => {
    try {
      const updatedUser = await sdk.profile.updateMe(data);
      updateUserLocally(updatedUser);
      showToast("success", "Profile updated.");
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Failed to update profile.";
      showToast("error", msg);
      throw err;
    }
  };

  const handleUploadAvatarUrl = async (url: string) => {
    try {
      const updatedUser = await sdk.profile.updateMe({
        profile: { avatar: url },
      });
      updateUserLocally(updatedUser);
      showToast("success", "Avatar updated.");
    } catch (err: unknown) {
      showToast("error", "Failed to set avatar.");
      throw err;
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      const updatedUser = await sdk.profile.updateMe({
        profile: { avatar: null },
      });
      updateUserLocally(updatedUser);
      showToast("success", "Avatar removed.");
    } catch (err: unknown) {
      showToast("error", "Failed to remove avatar.");
      throw err;
    }
  };

  const handleSavePreferences = async (prefs: Partial<UserProfile>) => {
    try {
      const updatedUser = await sdk.profile.updateMe({ profile: prefs });
      updateUserLocally(updatedUser);
      showToast("success", "Settings updated.");
    } catch (err: unknown) {
      console.error("Failed to save preferences:", err);
      throw err;
    }
  };

  const handleChangePassword = async (
    oldPass: string,
    newPass: string,
    confirmPass: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await sdk.auth.changePassword({
        old_password: oldPass,
        new_password: newPass,
        new_password_confirm: confirmPass,
      });
      showToast("success", "Password updated successfully.");
      return { success: true };
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Failed to change password.";
      return { success: false, error: msg };
    }
  };

  const handleExportData = async () => {
    try {
      await sdk.profile.exportData();
      showToast("success", "Account data exported.");
    } catch (err) {
      showToast("error", "Failed to export data.");
      throw err;
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await sdk.profile.deleteAccount();
      await logout();
    } catch (err) {
      showToast("error", "Failed to delete account.");
      throw err;
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const tabTitles: Record<Tab, string> = {
    dashboard: "Workload Overview",
    tasks: "Task Management",
    projects: selectedProject ? selectedProject.name : "Active Projects",
    profile: "User Profile",
    settings: "Workspace Settings",
  };

  return (
    <SafeAreaView style={styles.appWrapper}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Floating Toast Notification */}
      {!!toast && <Toast type={toast.type} message={toast.message} />}

      {/* Top Header with Brand & User Dropdown */}
      <TaskFloHeader
        user={user}
        activeTabTitle={tabTitles[activeTab]}
        onNavigateToProfile={() => {
          setSelectedProjectId(null);
          setActiveTab("profile");
        }}
        onNavigateToSettings={() => {
          setSelectedProjectId(null);
          setActiveTab("settings");
        }}
        onLogout={logout}
      />

      <View style={styles.contentArea}>
        {activeTab === "dashboard" && (
          <DashboardScreen
            user={user}
            tasks={tasks}
            projects={projects}
            onNavigateToTasks={() => {
              setSelectedProjectId(null);
              setActiveTab("tasks");
            }}
            onNavigateToProjects={() => {
              setSelectedProjectId(null);
              setActiveTab("projects");
            }}
            onSelectProject={(projId) => {
              setSelectedProjectId(projId);
              setActiveTab("projects");
            }}
            onToggleTask={handleToggleTask}
          />
        )}
        {activeTab === "tasks" && (
          <TasksScreen
            tasks={tasks}
            projects={projects}
            onToggleTask={handleToggleTask}
            onCreateTask={handleCreateTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onNavigateToProjects={() => {
              setSelectedProjectId(null);
              setActiveTab("projects");
            }}
          />
        )}
        {activeTab === "projects" &&
          (selectedProject ? (
            <ProjectDetailScreen
              project={selectedProject}
              tasks={tasks}
              projects={projects}
              onBack={() => setSelectedProjectId(null)}
              onUpdateProject={handleUpdateProject}
              onDeleteProject={handleDeleteProject}
              onToggleTask={handleToggleTask}
              onCreateTask={handleCreateTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
            />
          ) : (
            <ProjectsScreen
              projects={projects}
              tasks={tasks}
              onSelectProject={(projId) => setSelectedProjectId(projId)}
              onCreateProject={handleCreateProject}
              onCreateTask={handleCreateTask}
            />
          ))}
        {activeTab === "profile" && (
          <ProfileScreen
            user={user}
            onUpdateProfile={handleUpdateProfile}
            onUploadAvatarUrl={handleUploadAvatarUrl}
            onRemoveAvatar={handleRemoveAvatar}
            onDeleteAccount={handleDeleteAccount}
            onLogout={logout}
          />
        )}
        {activeTab === "settings" && (
          <SettingsScreen
            user={user}
            onSavePreferences={handleSavePreferences}
            onChangePassword={handleChangePassword}
            onExportData={handleExportData}
            onDeleteAccount={handleDeleteAccount}
          />
        )}
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.navBar}>
        {(["dashboard", "tasks", "projects", "profile", "settings"] as Tab[]).map(
          (tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => {
                setSelectedProjectId(null);
                setActiveTab(tab);
              }}
              style={[
                styles.navItem,
                activeTab === tab ? styles.navItemActive : {},
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === tab }}
              accessibilityLabel={`${tab} tab`}
            >
              <Text
                style={[
                  styles.navLabel,
                  activeTab === tab ? styles.navLabelActive : {},
                ]}
              >
                {tab.toUpperCase()}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>
    </SafeAreaView>
  );
};

export const MobileApp: React.FC = () => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MainShell />
      </AuthProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
  spinner: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginTop: Space.md,
  },
  appWrapper: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentArea: {
    flex: 1,
  },
  navBar: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderMid,
    paddingVertical: Space.xs,
    paddingHorizontal: Space.xs / 2,
    paddingBottom: Platform.OS === "ios" ? 20 : Space.xs,
  },
  navItem: {
    flex: 1,
    paddingVertical: Space.xs,
    paddingHorizontal: 2,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radii.sm,
  },
  navItemActive: {},
  navLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  navLabelActive: {
    color: Colors.primaryText,
  },
});
