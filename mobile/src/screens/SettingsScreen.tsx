import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Modal,
} from "react-native";
import {
  User,
  UserProfile,
  TaskPriority,
  TaskView,
  TaskSort,
  DateFormat,
  TimeFormat,
  WeekStart,
  Language,
} from "../sdk/types";
import {
  getPriorityLabel,
  getLanguageLabel,
  getViewLabel,
  getSortLabel,
  getWeekStartLabel,
} from "../sdk/mappers";
import { Colors, Radii, Space, Typography } from "../theme";

export interface SettingsScreenProps {
  user: User | null;
  onSavePreferences: (prefs: Partial<UserProfile>) => Promise<void>;
  onChangePassword?: (
    oldPass: string,
    newPass: string,
    confirmPass: string
  ) => Promise<{ success: boolean; error?: string }>;
  onExportData?: () => Promise<void>;
  onDeleteAccount?: () => Promise<void>;
}

type SettingsTab =
  | "appearance"
  | "preferences"
  | "task_defaults"
  | "notifications"
  | "security"
  | "data_privacy"
  | "integrations";

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "appearance", label: "Appearance" },
  { id: "preferences", label: "Preferences" },
  { id: "task_defaults", label: "Task Defaults" },
  { id: "notifications", label: "Notifications" },
  { id: "security", label: "Security" },
  { id: "data_privacy", label: "Data & Privacy" },
  { id: "integrations", label: "Integrations & Mobile" },
];

const TIMEZONES = [
  { value: "UTC", label: "UTC — Coordinated Universal Time" },
  { value: "Africa/Lagos", label: "Africa/Lagos — West Africa Time (WAT, UTC+1)" },
  { value: "Africa/Nairobi", label: "Africa/Nairobi — East Africa Time (EAT, UTC+3)" },
  { value: "Africa/Cairo", label: "Africa/Cairo — Eastern European Time (EET, UTC+2)" },
  { value: "Africa/Johannesburg", label: "Africa/Johannesburg — South Africa (SAST, UTC+2)" },
  { value: "America/New_York", label: "America/New_York — Eastern Time (ET)" },
  { value: "America/Chicago", label: "America/Chicago — Central Time (CT)" },
  { value: "America/Denver", label: "America/Denver — Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles — Pacific Time (PT)" },
  { value: "America/Sao_Paulo", label: "America/Sao_Paulo — Brasilia Time (BRT, UTC-3)" },
  { value: "Europe/London", label: "Europe/London — GMT / BST" },
  { value: "Europe/Paris", label: "Europe/Paris — Central European Time (CET)" },
  { value: "Europe/Berlin", label: "Europe/Berlin — Central European Time (CET)" },
  { value: "Europe/Moscow", label: "Europe/Moscow — Moscow Standard Time (MSK, UTC+3)" },
  { value: "Asia/Dubai", label: "Asia/Dubai — Gulf Standard Time (GST, UTC+4)" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata — India Standard Time (IST, UTC+5:30)" },
  { value: "Asia/Singapore", label: "Asia/Singapore — Singapore Time (SGT, UTC+8)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo — Japan Standard Time (JST, UTC+9)" },
  { value: "Australia/Sydney", label: "Australia/Sydney — Australian Eastern Time (AET)" },
];

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  user,
  onSavePreferences,
  onChangePassword,
  onExportData,
  onDeleteAccount,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("appearance");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Appearance
  const [appearance, setAppearance] = useState<"system" | "light" | "dark">("system");

  // Preferences
  const [language, setLanguage] = useState<Language>("en");
  const [timezone, setTimezone] = useState("UTC");
  const [dateFormat, setDateFormat] = useState<DateFormat>("YYYY-MM-DD");
  const [timeFormat, setTimeFormat] = useState<TimeFormat>("24h");
  const [weekStart, setWeekStart] = useState<WeekStart>("monday");

  // Task Defaults
  const [defaultPriority, setDefaultPriority] = useState<TaskPriority>("medium");
  const [defaultView, setDefaultView] = useState<TaskView>("list");
  const [defaultSort, setDefaultSort] = useState<TaskSort>("due_date");
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);

  // Notifications
  const [notifyDueDate, setNotifyDueDate] = useState(true);
  const [notifyOverdue, setNotifyOverdue] = useState(true);
  const [notifyProjectActivity, setNotifyProjectActivity] = useState(true);
  const [notifyEmailDigest, setNotifyEmailDigest] = useState(false);
  const [notifyInApp, setNotifyInApp] = useState(true);

  // Security Form
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Data & Delete Modal State
  const [exporting, setExporting] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteConfirmUsername, setDeleteConfirmUsername] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Sync state from profile
  useEffect(() => {
    if (user?.profile) {
      const p = user.profile;
      if (p.appearance) setAppearance(p.appearance);
      if (p.language) setLanguage(p.language as Language);
      if (p.timezone) setTimezone(p.timezone);
      if (p.date_format) setDateFormat(p.date_format);
      if (p.time_format) setTimeFormat(p.time_format);
      if (p.week_start) setWeekStart(p.week_start);
      if (p.default_task_priority) setDefaultPriority(p.default_task_priority);
      if (p.default_task_view) setDefaultView(p.default_task_view);
      if (p.default_task_sort) setDefaultSort(p.default_task_sort);
      if (p.show_completed_tasks !== undefined) setShowCompletedTasks(p.show_completed_tasks);
      if (p.notify_due_date !== undefined) setNotifyDueDate(p.notify_due_date);
      if (p.notify_overdue !== undefined) setNotifyOverdue(p.notify_overdue);
      if (p.notify_project_activity !== undefined) setNotifyProjectActivity(p.notify_project_activity);
      if (p.notify_email_digest !== undefined) setNotifyEmailDigest(p.notify_email_digest);
      if (p.notify_in_app !== undefined) setNotifyInApp(p.notify_in_app);
    }
  }, [user]);

  const showToast = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleSaveCurrentSection = async (data: Partial<UserProfile>) => {
    setSaving(true);
    try {
      await onSavePreferences(data);
      showToast("success", "Settings updated successfully.");
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Failed to update settings.";
      showToast("error", msg);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePasswordSubmit = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      showToast("error", "Please fill in all password fields.");
      return;
    }
    if (newPassword.length < 8) {
      showToast("error", "New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("error", "New passwords do not match.");
      return;
    }
    if (!onChangePassword) return;

    setChangingPassword(true);
    try {
      const res = await onChangePassword(oldPassword, newPassword, confirmPassword);
      if (res.success) {
        showToast("success", "Password updated successfully.");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showToast("error", res.error || "Failed to update password.");
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleExportSubmit = async () => {
    if (!onExportData) return;
    setExporting(true);
    try {
      await onExportData();
      showToast("success", "Your workspace data has been prepared for download.");
    } catch (err: unknown) {
      showToast("error", "Failed to export workspace data.");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccountSubmit = async () => {
    if (deleteConfirmUsername !== user?.username) {
      setDeleteError(`Type "${user?.username}" exactly to confirm.`);
      return;
    }
    if (!onDeleteAccount) return;
    setDeletingAccount(true);
    setDeleteError("");
    try {
      await onDeleteAccount();
    } catch (err: unknown) {
      setDeletingAccount(false);
      setDeleteError((err as { message?: string })?.message || "Failed to delete account.");
    }
  };

  // Selector Cycling Helpers
  const cycleLanguage = () => {
    const langs: Language[] = ["en", "es", "fr", "de"];
    const next = langs[(langs.indexOf(language) + 1) % langs.length];
    setLanguage(next);
  };

  const cycleTimezone = () => {
    const curIdx = TIMEZONES.findIndex((t) => t.value === timezone);
    const nextIdx = (curIdx + 1) % TIMEZONES.length;
    setTimezone(TIMEZONES[nextIdx].value);
  };

  const cycleDateFormat = () => {
    const formats: DateFormat[] = ["YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY"];
    const next = formats[(formats.indexOf(dateFormat) + 1) % formats.length];
    setDateFormat(next);
  };

  const cycleTimeFormat = () => {
    const formats: TimeFormat[] = ["24h", "12h"];
    const next = formats[(formats.indexOf(timeFormat) + 1) % formats.length];
    setTimeFormat(next);
  };

  const cycleWeekStart = () => {
    const starts: WeekStart[] = ["monday", "sunday", "saturday"];
    const next = starts[(starts.indexOf(weekStart) + 1) % starts.length];
    setWeekStart(next);
  };

  const cycleDefaultPriority = () => {
    const priorities: TaskPriority[] = ["low", "medium", "high"];
    const next = priorities[(priorities.indexOf(defaultPriority) + 1) % priorities.length];
    setDefaultPriority(next);
  };

  const cycleDefaultView = () => {
    const views: TaskView[] = ["list", "board"];
    const next = views[(views.indexOf(defaultView) + 1) % views.length];
    setDefaultView(next);
  };

  const cycleDefaultSort = () => {
    const sorts: TaskSort[] = ["due_date", "priority", "created_at", "title"];
    const next = sorts[(sorts.indexOf(defaultSort) + 1) % sorts.length];
    setDefaultSort(next);
  };

  return (
    <View style={styles.container}>
      {/* Horizontal Tabs Header */}
      <View style={styles.tabsHeaderContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[
                styles.tabButton,
                activeTab === tab.id && styles.activeTabButton,
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === tab.id }}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === tab.id && styles.activeTabButtonText,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Global Feedback Banner */}
        {!!feedback && (
          <View
            style={[
              styles.feedbackBanner,
              feedback.type === "success" ? styles.successBanner : styles.errorBanner,
            ]}
            accessibilityRole="alert"
          >
            <Text
              style={[
                styles.feedbackText,
                feedback.type === "success" ? styles.successText : styles.errorText,
              ]}
            >
              {feedback.message}
            </Text>
          </View>
        )}

        {/* ── 1. APPEARANCE TAB ── */}
        {activeTab === "appearance" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Interface Appearance</Text>
            <Text style={styles.cardSubtitle}>
              Customize TaskFlo color theme for your device.
            </Text>

            <View style={styles.themeRow}>
              {(["system", "light", "dark"] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.themeButton,
                    appearance === mode && styles.activeThemeButton,
                  ]}
                  onPress={() => {
                    setAppearance(mode);
                    handleSaveCurrentSection({ appearance: mode });
                  }}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.themeButtonText,
                      appearance === mode && styles.activeThemeButtonText,
                    ]}
                  >
                    {mode.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── 2. PREFERENCES TAB ── */}
        {activeTab === "preferences" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Regional & Display Preferences</Text>
            <Text style={styles.cardSubtitle}>
              Adjust language, timezone, calendar, and clock formats.
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Language</Text>
              <TouchableOpacity style={styles.selectorRow} onPress={cycleLanguage} accessibilityRole="button">
                <Text style={styles.selectorValue}>{getLanguageLabel(language)}</Text>
                <Text style={styles.cycleHint}>Tap to change</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Timezone</Text>
              <TouchableOpacity style={styles.selectorRow} onPress={cycleTimezone} accessibilityRole="button">
                <Text style={styles.selectorValue} numberOfLines={1}>
                  {TIMEZONES.find((t) => t.value === timezone)?.label || timezone}
                </Text>
                <Text style={styles.cycleHint}>Tap</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Date Format</Text>
              <TouchableOpacity style={styles.selectorRow} onPress={cycleDateFormat} accessibilityRole="button">
                <Text style={styles.selectorValue}>{dateFormat}</Text>
                <Text style={styles.cycleHint}>Tap</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Time Format</Text>
              <TouchableOpacity style={styles.selectorRow} onPress={cycleTimeFormat} accessibilityRole="button">
                <Text style={styles.selectorValue}>{timeFormat}</Text>
                <Text style={styles.cycleHint}>Tap</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>First Day of the Week</Text>
              <TouchableOpacity style={styles.selectorRow} onPress={cycleWeekStart} accessibilityRole="button">
                <Text style={styles.selectorValue}>{getWeekStartLabel(weekStart)}</Text>
                <Text style={styles.cycleHint}>Tap to change</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.disabledBtn]}
              onPress={() =>
                handleSaveCurrentSection({
                  language,
                  timezone,
                  date_format: dateFormat,
                  time_format: timeFormat,
                  week_start: weekStart,
                })
              }
              disabled={saving}
              accessibilityRole="button"
            >
              {saving ? <ActivityIndicator color={Colors.textInverse} size="small" /> : <Text style={styles.saveBtnText}>Save Preferences</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* ── 3. TASK DEFAULTS TAB ── */}
        {activeTab === "task_defaults" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Default Task Configuration</Text>
            <Text style={styles.cardSubtitle}>
              Pre-selected options applied when creating new items.
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Default Priority</Text>
              <TouchableOpacity style={styles.selectorRow} onPress={cycleDefaultPriority} accessibilityRole="button">
                <Text style={styles.selectorValue}>{getPriorityLabel(defaultPriority)}</Text>
                <Text style={styles.cycleHint}>Tap to change</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Default Task View</Text>
              <TouchableOpacity style={styles.selectorRow} onPress={cycleDefaultView} accessibilityRole="button">
                <Text style={styles.selectorValue}>{getViewLabel(defaultView)}</Text>
                <Text style={styles.cycleHint}>Tap</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Default Task Sort</Text>
              <TouchableOpacity style={styles.selectorRow} onPress={cycleDefaultSort} accessibilityRole="button">
                <Text style={styles.selectorValue}>{getSortLabel(defaultSort)}</Text>
                <Text style={styles.cycleHint}>Tap</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchLabel}>Show Completed Tasks</Text>
                <Text style={styles.switchSubtitle}>Display completed items in default views</Text>
              </View>
              <Switch
                value={showCompletedTasks}
                onValueChange={setShowCompletedTasks}
                trackColor={{ false: Colors.borderMid, true: Colors.primary }}
                thumbColor={Colors.textInverse}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.disabledBtn]}
              onPress={() =>
                handleSaveCurrentSection({
                  default_task_priority: defaultPriority,
                  default_task_view: defaultView,
                  default_task_sort: defaultSort,
                  show_completed_tasks: showCompletedTasks,
                })
              }
              disabled={saving}
              accessibilityRole="button"
            >
              {saving ? <ActivityIndicator color={Colors.textInverse} size="small" /> : <Text style={styles.saveBtnText}>Save Task Defaults</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* ── 4. NOTIFICATIONS TAB ── */}
        {activeTab === "notifications" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notification Channels</Text>
            <Text style={styles.cardSubtitle}>
              Control which task events trigger alerts.
            </Text>

            <View style={styles.switchRow}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchLabel}>Due Date Alerts</Text>
                <Text style={styles.switchSubtitle}>Notify when tasks reach due date</Text>
              </View>
              <Switch
                value={notifyDueDate}
                onValueChange={setNotifyDueDate}
                trackColor={{ false: Colors.borderMid, true: Colors.primary }}
                thumbColor={Colors.textInverse}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchLabel}>Overdue Reminders</Text>
                <Text style={styles.switchSubtitle}>Alert for incomplete past-due tasks</Text>
              </View>
              <Switch
                value={notifyOverdue}
                onValueChange={setNotifyOverdue}
                trackColor={{ false: Colors.borderMid, true: Colors.primary }}
                thumbColor={Colors.textInverse}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchLabel}>Project Activity</Text>
                <Text style={styles.switchSubtitle}>Updates on project members & changes</Text>
              </View>
              <Switch
                value={notifyProjectActivity}
                onValueChange={setNotifyProjectActivity}
                trackColor={{ false: Colors.borderMid, true: Colors.primary }}
                thumbColor={Colors.textInverse}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchLabel}>Daily Email Digest</Text>
                <Text style={styles.switchSubtitle}>Daily morning email overview</Text>
              </View>
              <Switch
                value={notifyEmailDigest}
                onValueChange={setNotifyEmailDigest}
                trackColor={{ false: Colors.borderMid, true: Colors.primary }}
                thumbColor={Colors.textInverse}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchLabel}>In-App Alerts</Text>
                <Text style={styles.switchSubtitle}>Show badges and banner banners</Text>
              </View>
              <Switch
                value={notifyInApp}
                onValueChange={setNotifyInApp}
                trackColor={{ false: Colors.borderMid, true: Colors.primary }}
                thumbColor={Colors.textInverse}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.disabledBtn]}
              onPress={() =>
                handleSaveCurrentSection({
                  notify_due_date: notifyDueDate,
                  notify_overdue: notifyOverdue,
                  notify_project_activity: notifyProjectActivity,
                  notify_email_digest: notifyEmailDigest,
                  notify_in_app: notifyInApp,
                })
              }
              disabled={saving}
              accessibilityRole="button"
            >
              {saving ? <ActivityIndicator color={Colors.textInverse} size="small" /> : <Text style={styles.saveBtnText}>Save Notification Settings</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* ── 5. SECURITY TAB ── */}
        {activeTab === "security" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Account Security</Text>
            <Text style={styles.cardSubtitle}>
              Change your password to keep your account safe.
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Current Password</Text>
              <TextInput
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry
                placeholder="Enter current password"
                placeholderTextColor={Colors.inputPlaceholder}
                style={styles.input}
                accessibilityLabel="Current Password"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="Min 8 characters"
                placeholderTextColor={Colors.inputPlaceholder}
                style={styles.input}
                accessibilityLabel="New Password"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Repeat new password"
                placeholderTextColor={Colors.inputPlaceholder}
                style={styles.input}
                accessibilityLabel="Confirm New Password"
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, changingPassword && styles.disabledBtn]}
              onPress={handleChangePasswordSubmit}
              disabled={changingPassword}
              accessibilityRole="button"
            >
              {changingPassword ? <ActivityIndicator color={Colors.textInverse} size="small" /> : <Text style={styles.saveBtnText}>Update Password</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* ── 6. DATA & PRIVACY TAB ── */}
        {activeTab === "data_privacy" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Data & Account Privacy</Text>
            <Text style={styles.cardSubtitle}>
              Export your data or permanently delete your account.
            </Text>

            <View style={styles.privacySectionBox}>
              <Text style={styles.privacyBoxTitle}>Export Workspace Data</Text>
              <Text style={styles.privacyBoxDesc}>
                Download a complete JSON export of your profile, projects, and task history.
              </Text>
              <TouchableOpacity
                style={styles.exportBtn}
                onPress={handleExportSubmit}
                disabled={exporting}
                accessibilityRole="button"
              >
                {exporting ? <ActivityIndicator color={Colors.text} size="small" /> : <Text style={styles.exportBtnText}>Export JSON Archive</Text>}
              </TouchableOpacity>
            </View>

            <View style={styles.dangerZoneBox}>
              <Text style={styles.dangerZoneTitle}>Danger Zone: Delete Account</Text>
              <Text style={styles.dangerZoneDesc}>
                Permanently erase your user profile and all associated data. This action is irreversible.
              </Text>
              <TouchableOpacity
                style={styles.deleteAccountBtn}
                onPress={() => {
                  setDeleteConfirmUsername("");
                  setDeleteError("");
                  setDeleteModalVisible(true);
                }}
                accessibilityRole="button"
              >
                <Text style={styles.deleteAccountText}>Delete Account Permanently</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── 7. INTEGRATIONS & MOBILE TAB ── */}
        {activeTab === "integrations" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Integrations & Runtime</Text>
            <Text style={styles.cardSubtitle}>
              Connected productivity tooling and local environment telemetry.
            </Text>

            <View style={styles.integrationItem}>
              <Text style={styles.integrationName}>Google Calendar</Text>
              <Text style={styles.integrationStatus}>Sync due dates & reminders</Text>
            </View>

            <View style={styles.integrationItem}>
              <Text style={styles.integrationName}>Slack & Webhooks</Text>
              <Text style={styles.integrationStatus}>Real-time project activity alerts</Text>
            </View>

            <View style={styles.integrationItem}>
              <Text style={styles.integrationName}>Mobile Client Diagnostics</Text>
              <Text style={styles.integrationStatus}>TaskFlo Expo Native v0.1.0 (SDK 52)</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitleDanger}>Confirm Account Deletion</Text>
            <Text style={styles.modalSubtitle}>
              Type your username <Text style={styles.boldText}>"{user?.username}"</Text> to confirm permanent deletion:
            </Text>

            {!!deleteError && <Text style={styles.errorText}>{deleteError}</Text>}

            <TextInput
              value={deleteConfirmUsername}
              onChangeText={setDeleteConfirmUsername}
              placeholder={user?.username}
              placeholderTextColor={Colors.inputPlaceholder}
              autoCapitalize="none"
              style={styles.modalInput}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setDeleteModalVisible(false)}
                disabled={deletingAccount}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalDeleteBtn,
                  (deleteConfirmUsername !== user?.username || deletingAccount) && styles.disabledBtn,
                ]}
                onPress={handleDeleteAccountSubmit}
                disabled={deleteConfirmUsername !== user?.username || deletingAccount}
              >
                {deletingAccount ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.modalDeleteText}>Confirm Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabsHeaderContainer: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderMid,
    paddingVertical: Space.xs,
    width: "100%",
  },
  tabScrollContent: {
    paddingHorizontal: Space.sm,
    gap: Space.xs,
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: Space.md,
    borderRadius: Radii.full,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderMid,
  },
  activeTabButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryFocus,
  },
  tabButtonText: {
    ...Typography.caption,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  activeTabButtonText: {
    color: Colors.textInverse,
  },
  content: {
    padding: Space.md,
    paddingBottom: Space["3xl"] + 20,
    gap: Space.md,
  },
  feedbackBanner: {
    paddingVertical: Space.sm,
    paddingHorizontal: Space.md,
    borderRadius: Radii.lg,
    width: "100%",
  },
  successBanner: {
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  feedbackText: {
    ...Typography.bodySmall,
    textAlign: "center",
  },
  successText: {
    color: Colors.successText,
  },
  errorText: {
    color: Colors.errorText,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Space.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Space.sm,
    width: "100%",
  },
  cardTitle: {
    ...Typography.cardTitle,
    color: Colors.text,
  },
  cardSubtitle: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: -Space.xs / 2,
    marginBottom: Space.xs / 2,
  },
  themeRow: {
    flexDirection: "row",
    gap: Space.xs,
    width: "100%",
  },
  themeButton: {
    flex: 1,
    paddingVertical: Space.sm,
    borderRadius: Radii.lg,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.borderMid,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
  },
  activeThemeButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryFocus,
  },
  themeButtonText: {
    ...Typography.button,
    color: Colors.textMuted,
    fontSize: 12,
  },
  activeThemeButtonText: {
    color: Colors.textInverse,
  },
  formGroup: {
    gap: Space.xs / 2,
    width: "100%",
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
    width: "100%",
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
    width: "100%",
  },
  selectorValue: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
    minWidth: 0,
  },
  cycleHint: {
    ...Typography.caption,
    color: Colors.primaryText,
    marginLeft: Space.xs,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Space.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    width: "100%",
  },
  switchTextContainer: {
    flex: 1,
    marginRight: Space.sm,
    minWidth: 0,
  },
  switchLabel: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.text,
  },
  switchSubtitle: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Space.sm,
    paddingHorizontal: Space.md,
    borderRadius: Radii.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
    marginTop: Space.xs,
    width: "100%",
  },
  saveBtnText: {
    ...Typography.button,
    color: Colors.textInverse,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  privacySectionBox: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radii.lg,
    padding: Space.md,
    borderWidth: 1,
    borderColor: Colors.borderMid,
    gap: Space.xs,
    width: "100%",
  },
  privacyBoxTitle: {
    ...Typography.body,
    fontWeight: "700",
    color: Colors.text,
  },
  privacyBoxDesc: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  exportBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingVertical: Space.xs,
    paddingHorizontal: Space.md,
    borderRadius: Radii.md,
    alignItems: "center",
    marginTop: Space.xs,
    width: "100%",
  },
  exportBtnText: {
    ...Typography.button,
    color: Colors.text,
    fontSize: 12,
  },
  dangerZoneBox: {
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    borderRadius: Radii.lg,
    padding: Space.md,
    gap: Space.xs,
    marginTop: Space.xs,
    width: "100%",
  },
  dangerZoneTitle: {
    ...Typography.body,
    fontWeight: "700",
    color: Colors.errorText,
  },
  dangerZoneDesc: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  deleteAccountBtn: {
    backgroundColor: Colors.errorDark,
    paddingVertical: Space.xs,
    paddingHorizontal: Space.md,
    borderRadius: Radii.md,
    alignItems: "center",
    marginTop: Space.xs,
    width: "100%",
  },
  deleteAccountText: {
    ...Typography.button,
    color: Colors.textInverse,
  },
  integrationItem: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radii.lg,
    padding: Space.md,
    borderWidth: 1,
    borderColor: Colors.borderMid,
    gap: 2,
    width: "100%",
  },
  integrationName: {
    ...Typography.body,
    fontWeight: "700",
    color: Colors.text,
  },
  integrationStatus: {
    ...Typography.caption,
    color: Colors.primaryText,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: Space.md,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    padding: Space.lg,
    width: "92%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Space.sm,
  },
  modalTitleDanger: {
    ...Typography.cardTitle,
    color: Colors.errorText,
  },
  modalSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  boldText: {
    fontWeight: "700",
    color: Colors.text,
  },
  modalInput: {
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    color: Colors.text,
    paddingVertical: Space.sm,
    paddingHorizontal: Space.md,
    borderRadius: Radii.lg,
    ...Typography.body,
    marginTop: Space.xs,
    width: "100%",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Space.sm,
    marginTop: Space.sm,
  },
  modalCancelBtn: {
    paddingVertical: Space.xs,
    paddingHorizontal: Space.md,
  },
  modalCancelText: {
    ...Typography.button,
    color: Colors.textMuted,
  },
  modalDeleteBtn: {
    backgroundColor: Colors.errorDark,
    paddingVertical: Space.xs,
    paddingHorizontal: Space.md,
    borderRadius: Radii.md,
  },
  modalDeleteText: {
    ...Typography.button,
    color: Colors.textInverse,
  },
});
