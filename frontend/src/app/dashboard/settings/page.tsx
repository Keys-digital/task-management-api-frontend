"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import UserMenu from "@/components/UserMenu";
import { useTheme } from "@/components/ThemeProvider/ThemeProvider";
import { useUserProfile } from "@/components/UserProfileContext";

type SettingsTab =
  | "appearance"
  | "preferences"
  | "tasks"
  | "notifications"
  | "security"
  | "data"
  | "integrations";

const TIMEZONES = [
  { value: "UTC", label: "UTC — Coordinated Universal Time" },
  { value: "Africa/Lagos", label: "Africa/Lagos — West Africa Time (WAT, UTC+1)" },
  { value: "Africa/Nairobi", label: "Africa/Nairobi — East Africa Time (EAT, UTC+3)" },
  { value: "Africa/Cairo", label: "Africa/Cairo — Eastern European Time (EET, UTC+2)" },
  { value: "Africa/Johannesburg", label: "Africa/Johannesburg — South Africa Standard Time (SAST, UTC+2)" },
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

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("appearance");
  const { theme, preference, setTheme } = useTheme();
  const { user, loading, updateUser, patchLocalProfile } = useUserProfile();

  // General preferences state
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("UTC");
  const [dateFormat, setDateFormat] = useState("YYYY-MM-DD");
  const [timeFormat, setTimeFormat] = useState("24h");
  const [weekStart, setWeekStart] = useState("monday");

  // Task defaults state
  const [defaultTaskPriority, setDefaultTaskPriority] = useState("medium");
  const [defaultTaskView, setDefaultTaskView] = useState("list");
  const [defaultTaskSort, setDefaultTaskSort] = useState("due_date");
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);

  // Notification preferences state
  const [notifyDueDate, setNotifyDueDate] = useState(true);
  const [notifyOverdue, setNotifyOverdue] = useState(true);
  const [notifyProjectActivity, setNotifyProjectActivity] = useState(true);
  const [notifyEmailDigest, setNotifyEmailDigest] = useState(false);
  const [notifyInApp, setNotifyInApp] = useState(true);

  // Security / password change state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Data export state
  const [exporting, setExporting] = useState(false);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Saving state for tabs
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [savingTasks, setSavingTasks] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Appearance auto-save feedback
  const [appearanceSaved, setAppearanceSaved] = useState(false);
  const appearanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dirty-state baseline refs (initialised after first profile load)
  const prefBaseline = useRef({ language: "en", timezone: "UTC", dateFormat: "YYYY-MM-DD", timeFormat: "24h", weekStart: "monday" });
  const taskBaseline = useRef({ defaultTaskPriority: "medium", defaultTaskView: "list", defaultTaskSort: "due_date", showCompletedTasks: true });
  const notifBaseline = useRef({ notifyDueDate: true, notifyOverdue: true, notifyProjectActivity: true, notifyEmailDigest: false, notifyInApp: true });
  const isSettingsInitialized = useRef(false);

  // Dirty-state derived booleans (computed from current state vs baselines)
  const prefDirty =
    language !== prefBaseline.current.language ||
    timezone !== prefBaseline.current.timezone ||
    dateFormat !== prefBaseline.current.dateFormat ||
    timeFormat !== prefBaseline.current.timeFormat ||
    weekStart !== prefBaseline.current.weekStart;
  const taskDirty =
    defaultTaskPriority !== taskBaseline.current.defaultTaskPriority ||
    defaultTaskView !== taskBaseline.current.defaultTaskView ||
    defaultTaskSort !== taskBaseline.current.defaultTaskSort ||
    showCompletedTasks !== taskBaseline.current.showCompletedTasks;
  const notifDirty =
    notifyDueDate !== notifBaseline.current.notifyDueDate ||
    notifyOverdue !== notifBaseline.current.notifyOverdue ||
    notifyProjectActivity !== notifBaseline.current.notifyProjectActivity ||
    notifyEmailDigest !== notifBaseline.current.notifyEmailDigest ||
    notifyInApp !== notifBaseline.current.notifyInApp;

  // ─── Per-field dirty-guard sync from UserProfileContext ─────────────────
  // First load: initialize all fields + baselines unconditionally.
  // Subsequent context updates: only overwrite fields that are currently clean
  // (local === baseline). Dirty fields are preserved; their baselines are
  // not advanced until the user saves or discards.
  useEffect(() => {
    if (!user?.profile) return;
    const p = user.profile;

    const sv = {
      language:             p.language             || "en",
      timezone:             p.timezone             || "UTC",
      dateFormat:           p.date_format          || "YYYY-MM-DD",
      timeFormat:           p.time_format          || "24h",
      weekStart:            p.week_start           || "monday",
      defaultTaskPriority:  p.default_task_priority || "medium",
      defaultTaskView:      p.default_task_view    || "list",
      defaultTaskSort:      p.default_task_sort    || "due_date",
      showCompletedTasks:   p.show_completed_tasks ?? true,
      notifyDueDate:        p.notify_due_date      ?? true,
      notifyOverdue:        p.notify_overdue       ?? true,
      notifyProjectActivity: p.notify_project_activity ?? true,
      notifyEmailDigest:    p.notify_email_digest  ?? false,
      notifyInApp:          p.notify_in_app        ?? true,
    };

    if (!isSettingsInitialized.current) {
      // First load — set everything unconditionally.
      isSettingsInitialized.current = true;
      setLanguage(sv.language); setTimezone(sv.timezone); setDateFormat(sv.dateFormat);
      setTimeFormat(sv.timeFormat); setWeekStart(sv.weekStart);
      prefBaseline.current = { language: sv.language, timezone: sv.timezone, dateFormat: sv.dateFormat, timeFormat: sv.timeFormat, weekStart: sv.weekStart };

      setDefaultTaskPriority(sv.defaultTaskPriority); setDefaultTaskView(sv.defaultTaskView);
      setDefaultTaskSort(sv.defaultTaskSort); setShowCompletedTasks(sv.showCompletedTasks);
      taskBaseline.current = { defaultTaskPriority: sv.defaultTaskPriority, defaultTaskView: sv.defaultTaskView, defaultTaskSort: sv.defaultTaskSort, showCompletedTasks: sv.showCompletedTasks };

      setNotifyDueDate(sv.notifyDueDate); setNotifyOverdue(sv.notifyOverdue);
      setNotifyProjectActivity(sv.notifyProjectActivity); setNotifyEmailDigest(sv.notifyEmailDigest); setNotifyInApp(sv.notifyInApp);
      notifBaseline.current = { notifyDueDate: sv.notifyDueDate, notifyOverdue: sv.notifyOverdue, notifyProjectActivity: sv.notifyProjectActivity, notifyEmailDigest: sv.notifyEmailDigest, notifyInApp: sv.notifyInApp };
      return;
    }

    // Subsequent updates — per-field dirty check.
    const pb = prefBaseline.current;
    const nextPB = { ...pb };
    if (language   === pb.language)   { setLanguage(sv.language);     nextPB.language   = sv.language;   }
    if (timezone   === pb.timezone)   { setTimezone(sv.timezone);     nextPB.timezone   = sv.timezone;   }
    if (dateFormat === pb.dateFormat) { setDateFormat(sv.dateFormat); nextPB.dateFormat = sv.dateFormat; }
    if (timeFormat === pb.timeFormat) { setTimeFormat(sv.timeFormat); nextPB.timeFormat = sv.timeFormat; }
    if (weekStart  === pb.weekStart)  { setWeekStart(sv.weekStart);   nextPB.weekStart  = sv.weekStart;  }
    prefBaseline.current = nextPB;

    const tb = taskBaseline.current;
    const nextTB = { ...tb };
    if (defaultTaskPriority === tb.defaultTaskPriority) { setDefaultTaskPriority(sv.defaultTaskPriority); nextTB.defaultTaskPriority = sv.defaultTaskPriority; }
    if (defaultTaskView     === tb.defaultTaskView)     { setDefaultTaskView(sv.defaultTaskView);         nextTB.defaultTaskView     = sv.defaultTaskView;     }
    if (defaultTaskSort     === tb.defaultTaskSort)     { setDefaultTaskSort(sv.defaultTaskSort);         nextTB.defaultTaskSort     = sv.defaultTaskSort;     }
    if (showCompletedTasks  === tb.showCompletedTasks)  { setShowCompletedTasks(sv.showCompletedTasks);   nextTB.showCompletedTasks  = sv.showCompletedTasks;  }
    taskBaseline.current = nextTB;

    const nb = notifBaseline.current;
    const nextNB = { ...nb };
    if (notifyDueDate        === nb.notifyDueDate)        { setNotifyDueDate(sv.notifyDueDate);               nextNB.notifyDueDate        = sv.notifyDueDate;        }
    if (notifyOverdue        === nb.notifyOverdue)        { setNotifyOverdue(sv.notifyOverdue);               nextNB.notifyOverdue        = sv.notifyOverdue;        }
    if (notifyProjectActivity === nb.notifyProjectActivity) { setNotifyProjectActivity(sv.notifyProjectActivity); nextNB.notifyProjectActivity = sv.notifyProjectActivity; }
    if (notifyEmailDigest    === nb.notifyEmailDigest)    { setNotifyEmailDigest(sv.notifyEmailDigest);       nextNB.notifyEmailDigest    = sv.notifyEmailDigest;    }
    if (notifyInApp          === nb.notifyInApp)          { setNotifyInApp(sv.notifyInApp);                   nextNB.notifyInApp          = sv.notifyInApp;          }
    notifBaseline.current = nextNB;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const showToast = useCallback((type: "success" | "error", text: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage({ type, text });
    toastTimer.current = setTimeout(() => setToastMessage(null), 5000);
  }, []);

  const handleThemeChange = useCallback(async (val: "system" | "light" | "dark") => {
    setAppearanceSaved(false);
    if (appearanceTimer.current) clearTimeout(appearanceTimer.current);
    await setTheme(val);
    appearanceTimer.current = setTimeout(() => setAppearanceSaved(true), 400);
  }, [setTheme]);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPreferences(true);
    const res = await updateUser({
      profile: { language, timezone, date_format: dateFormat, time_format: timeFormat, week_start: weekStart },
    });
    setSavingPreferences(false);
    if (res.success) {
      // Advance prefBaseline to server-confirmed values — dirty state cleared.
      prefBaseline.current = { language, timezone, dateFormat, timeFormat, weekStart };
      showToast("success", "Preferences saved successfully.");
    } else {
      // Do NOT advance baseline — API rejected the values; local edits preserved.
      showToast("error", res.error || "Failed to save preferences.");
    }
  };

  const handleSaveTaskDefaults = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTasks(true);
    const res = await updateUser({
      profile: {
        default_task_priority: defaultTaskPriority,
        default_task_view: defaultTaskView,
        default_task_sort: defaultTaskSort,
        show_completed_tasks: showCompletedTasks,
      },
    });
    setSavingTasks(false);
    if (res.success) {
      // Advance taskBaseline to server-confirmed values.
      taskBaseline.current = { defaultTaskPriority, defaultTaskView, defaultTaskSort, showCompletedTasks };
      showToast("success", "Task preferences saved successfully.");
    } else {
      showToast("error", res.error || "Failed to save task preferences.");
    }
  };

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNotifications(true);
    const res = await updateUser({
      profile: {
        notify_due_date: notifyDueDate,
        notify_overdue: notifyOverdue,
        notify_project_activity: notifyProjectActivity,
        notify_email_digest: notifyEmailDigest,
        notify_in_app: notifyInApp,
      },
    });
    setSavingNotifications(false);
    if (res.success) {
      // Advance notifBaseline to server-confirmed values.
      notifBaseline.current = { notifyDueDate, notifyOverdue, notifyProjectActivity, notifyEmailDigest, notifyInApp };
      showToast("success", "Notification preferences updated.");
    } else {
      showToast("error", res.error || "Failed to update notification preferences.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== newPasswordConfirm) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMsg({
        type: "error",
        text: "New password must be at least 8 characters long.",
      });
      return;
    }

    setChangingPassword(true);
    const token = localStorage.getItem("access_token");
    const API_URL =
      process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

    try {
      const response = await fetch(`${API_URL}/api/auth/change-password/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
          new_password_confirm: newPasswordConfirm,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        const errorText =
          data.old_password?.[0] ||
          data.new_password?.[0] ||
          data.new_password_confirm?.[0] ||
          data.non_field_errors?.[0] ||
          "Failed to change password.";
        throw new Error(errorText);
      }

      setPasswordMsg({
        type: "success",
        text: "Your password has been changed successfully.",
      });
      setOldPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
    } catch (err) {
      setPasswordMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Error changing password",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    const token = localStorage.getItem("access_token");
    const API_URL =
      process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

    try {
      const response = await fetch(`${API_URL}/api/auth/export-data/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to export data");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `taskflo_export_${user?.username || "user"}_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast("success", "Your account data export has started downloading.");
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Failed to export data"
      );
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmText !== user.username) {
      setDeleteError(`Please type "${user?.username}" exactly to confirm.`);
      return;
    }

    setDeletingAccount(true);
    setDeleteError("");

    const token = localStorage.getItem("access_token");
    const API_URL =
      process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

    try {
      const response = await fetch(`${API_URL}/api/auth/me/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete account. Please try again.");
      }

      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("username");
      window.location.href = "/";
    } catch (err) {
      setDeletingAccount(false);
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete account"
      );
    }
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode; badge?: boolean }[] = [
    {
      id: "appearance",
      label: "Appearance",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
          />
        </svg>
      ),
    },
    {
      id: "preferences",
      label: "Preferences",
      badge: prefDirty,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
          />
        </svg>
      ),
    },
    {
      id: "tasks",
      label: "Task Defaults",
      badge: taskDirty,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      ),
    },
    {
      id: "notifications",
      label: "Notifications",
      badge: notifDirty,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>
      ),
    },
    {
      id: "security",
      label: "Security",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
          />
        </svg>
      ),
    },
    {
      id: "data",
      label: "Data & Privacy",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
          />
        </svg>
      ),
    },
    {
      id: "integrations",
      label: "Integrations & Mobile",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-4 w-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
          />
        </svg>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-[var(--color-page-bg)] text-slate-900">
      <div className="flex min-h-screen flex-col md:flex-row">
        {/* Sidebar */}
        <DashboardSidebar activePage="settings" />

        {/* Main Content */}
        <section className="flex-1">
          {/* Header */}
          <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5 md:px-10">
            <div className="min-w-0">
              <p className="text-sm text-slate-400">Workspace</p>
              <h2 className="text-xl font-semibold text-slate-900 truncate">Settings</h2>
            </div>
            <UserMenu />
          </header>

          <div className="mx-auto max-w-6xl px-6 py-8 md:px-10">
            {/* Title */}
            <div className="mb-8">
              <h3 className="text-3xl font-bold tracking-tight text-slate-900">
                Workspace Settings
              </h3>
              <p className="mt-2 text-slate-500">
                Manage your themes, task preferences, notifications, and security.
              </p>
            </div>

            {/* Notification Toast */}
            {toastMessage && (
              <div
                className={`mb-6 flex items-center justify-between rounded-2xl p-4 text-sm font-medium ${
                  toastMessage.type === "success"
                    ? "bg-teal-50 text-teal-800 ring-1 ring-teal-200"
                    : "bg-red-50 text-red-800 ring-1 ring-red-200"
                }`}
              >
                <span>{toastMessage.text}</span>
                <button
                  type="button"
                  onClick={() => setToastMessage(null)}
                  className="text-xs opacity-70 hover:opacity-100"
                >
                  Dismiss
                </button>
              </div>
            )}

            {loading ? (
              <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-xl bg-slate-100" />)}
                  <div className="h-24 rounded-xl bg-slate-100" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6 lg:flex-row lg:gap-8 lg:items-start">
                {/* Sidebar / Mobile Navigation */}
                <aside className="w-full shrink-0 lg:w-56">
                  {/* Mobile: compact select */}
                  <div className="lg:hidden">
                    <label htmlFor="settings-mobile-nav" className="sr-only">Settings section</label>
                    <div className="relative">
                      <select
                        id="settings-mobile-nav"
                        value={activeTab}
                        onChange={(e) => setActiveTab(e.target.value as SettingsTab)}
                        className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-10 text-sm font-medium text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      >
                        {tabs.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}{t.badge ? " ●" : ""}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>
                      </div>
                    </div>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {tabs.find((t) => t.id === activeTab)?.label ?? "Settings"}
                    </p>
                  </div>

                  {/* Desktop: vertical nav */}
                  <nav role="tablist" aria-label="Settings sections" className="hidden lg:flex flex-col gap-1">
                    {tabs.map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          id={`settings-tab-${tab.id}`}
                          role="tab"
                          aria-selected={isActive}
                          aria-controls={`settings-panel-${tab.id}`}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                            isActive
                              ? "bg-teal-50 font-semibold text-teal-700"
                              : "font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          <span className={isActive ? "text-teal-600" : "text-slate-400"}>{tab.icon}</span>
                          <span className="flex-1">{tab.label}</span>
                          {tab.badge && (
                            <span aria-label="Unsaved changes" className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </aside>

                {/* Tab Content Panel */}
                <div className="min-w-0 flex-1">
                  {/* 1. APPEARANCE TAB */}
                  {activeTab === "appearance" && (

                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
                      <div className="mb-6">
                        <h4 className="text-lg font-bold text-slate-900">
                          Theme & Appearance
                        </h4>
                        <p className="mt-1 text-sm text-slate-500">
                          Choose how TaskFlo looks to you. Saved automatically to your profile.
                        </p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        {/* Use System Default */}
                        <button
                          type="button"
                          onClick={() => handleThemeChange("system")}
                          className={`relative flex flex-col items-start rounded-2xl border p-5 text-left transition ${
                            preference === "system"
                              ? "border-teal-600 bg-teal-50 ring-2 ring-teal-600 shadow-sm"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                          }`}
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              className="h-5 w-5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0H3"
                              />
                            </svg>
                          </div>
                          <p className="mt-4 font-semibold text-slate-900">
                            Use system default
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Sync with device settings ({theme === "dark" ? "night" : "light"} active)
                          </p>
                        </button>

                        {/* Light Mode */}
                        <button
                          type="button"
                          onClick={() => handleThemeChange("light")}
                          className={`relative flex flex-col items-start rounded-2xl border p-5 text-left transition ${
                            preference === "light"
                              ? "border-teal-600 bg-teal-50 ring-2 ring-teal-600 shadow-sm"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                          }`}
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              className="h-5 w-5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                              />
                            </svg>
                          </div>
                          <p className="mt-4 font-semibold text-slate-900">
                            Light mode
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Crisp light aesthetic for daytime clarity
                          </p>
                        </button>

                        {/* Night Mode */}
                        <button
                          type="button"
                          onClick={() => handleThemeChange("dark")}
                          className={`relative flex flex-col items-start rounded-2xl border p-5 text-left transition ${
                            preference === "dark"
                              ? "border-teal-600 bg-teal-50 ring-2 ring-teal-600 shadow-sm"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                          }`}
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              className="h-5 w-5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
                              />
                            </svg>
                          </div>
                          <p className="mt-4 font-semibold text-slate-900">
                            Night mode
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Sleek dark interface designed for low light
                          </p>
                        </button>
                      </div>
                      {/* Auto-save feedback */}
                      <div aria-live="polite" className="mt-4 flex items-center gap-2 text-xs text-slate-400 min-h-[1.25rem]">
                        {appearanceSaved && (
                          <>
                            <svg className="h-3.5 w-3.5 text-teal-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                            <span className="text-teal-600 font-medium">Saved to your profile</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 2. PREFERENCES TAB */}
                  {activeTab === "preferences" && (
                    <form
                      onSubmit={handleSavePreferences}
                      className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8"
                    >
                      <div className="mb-6">
                        <h4 className="text-lg font-bold text-slate-900">
                          Regional & Language Preferences
                        </h4>
                        <p className="mt-1 text-sm text-slate-500">
                          Customize your time zone, calendar start day, and localization.
                        </p>
                      </div>

                      <div className="grid gap-6 sm:grid-cols-2">
                        {/* Language */}
                        <div>
                          <label
                            htmlFor="settings_language"
                            className="block text-sm font-medium text-slate-700"
                          >
                            Language
                          </label>
                          <select
                            id="settings_language"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                          >
                            <option value="en">English (US / UK)</option>
                            <option value="es">Español (Spanish)</option>
                            <option value="fr">Français (French)</option>
                            <option value="de">Deutsch (German)</option>
                          </select>
                        </div>

                        {/* Timezone */}
                        <div>
                          <label
                            htmlFor="settings_timezone"
                            className="block text-sm font-medium text-slate-700"
                          >
                            Timezone
                          </label>
                          <select
                            id="settings_timezone"
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                          >
                            {TIMEZONES.map((tz) => (
                              <option key={tz.value} value={tz.value}>
                                {tz.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Date Format */}
                        <div>
                          <label
                            htmlFor="settings_date_format"
                            className="block text-sm font-medium text-slate-700"
                          >
                            Date Format
                          </label>
                          <select
                            id="settings_date_format"
                            value={dateFormat}
                            onChange={(e) => setDateFormat(e.target.value)}
                            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                          >
                            <option value="YYYY-MM-DD">YYYY-MM-DD (2026-08-21)</option>
                            <option value="MM/DD/YYYY">MM/DD/YYYY (08/21/2026)</option>
                            <option value="DD/MM/YYYY">DD/MM/YYYY (21/08/2026)</option>
                          </select>
                        </div>

                        {/* Time Format */}
                        <div>
                          <label
                            htmlFor="settings_time_format"
                            className="block text-sm font-medium text-slate-700"
                          >
                            Time Format
                          </label>
                          <select
                            id="settings_time_format"
                            value={timeFormat}
                            onChange={(e) => setTimeFormat(e.target.value)}
                            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                          >
                            <option value="24h">24 Hours (14:30)</option>
                            <option value="12h">12 Hours (2:30 PM)</option>
                          </select>
                        </div>

                        {/* Start of Week */}
                        <div className="sm:col-span-2">
                          <label
                            htmlFor="settings_week_start"
                            className="block text-sm font-medium text-slate-700"
                          >
                            First Day of the Week
                          </label>
                          <select
                            id="settings_week_start"
                            value={weekStart}
                            onChange={(e) => setWeekStart(e.target.value)}
                            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 sm:w-1/2"
                          >
                            <option value="monday">Monday (Standard)</option>
                            <option value="sunday">Sunday</option>
                            <option value="saturday">Saturday</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
                        <div className="flex items-center gap-2 text-xs text-slate-400 min-h-[1.25rem]" aria-live="polite">
                          {prefDirty && !savingPreferences && (
                            <><span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />Unsaved changes</>
                          )}
                          {savingPreferences && (
                            <><svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Saving...</>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {prefDirty && !savingPreferences && (
                            <button
                              type="button"
                              onClick={() => {
                                const b = prefBaseline.current;
                                setLanguage(b.language); setTimezone(b.timezone);
                                setDateFormat(b.dateFormat); setTimeFormat(b.timeFormat); setWeekStart(b.weekStart);
                              }}
                              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                            >
                              Discard
                            </button>
                          )}
                          <button
                            type="submit"
                            disabled={savingPreferences || !prefDirty}
                            className="rounded-xl bg-teal-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {savingPreferences ? "Saving..." : "Save Preferences"}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* 3. TASK DEFAULTS TAB */}
                  {activeTab === "tasks" && (
                    <form
                      onSubmit={handleSaveTaskDefaults}
                      className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8"
                    >
                      <div className="mb-6">
                        <h4 className="text-lg font-bold text-slate-900">
                          Task & Board Defaults
                        </h4>
                        <p className="mt-1 text-sm text-slate-500">
                          Set initial values when creating tasks and viewing workspaces.
                        </p>
                      </div>

                      <div className="grid gap-6 sm:grid-cols-2">
                        {/* Default Priority */}
                        <div>
                          <label
                            htmlFor="default_priority"
                            className="block text-sm font-medium text-slate-700"
                          >
                            Default Task Priority
                          </label>
                          <select
                            id="default_priority"
                            value={defaultTaskPriority}
                            onChange={(e) => setDefaultTaskPriority(e.target.value)}
                            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                          >
                            <option value="low">Low Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="high">High Priority</option>
                          </select>
                        </div>

                        {/* Default View */}
                        <div>
                          <label
                            htmlFor="default_view"
                            className="block text-sm font-medium text-slate-700"
                          >
                            Default Task Layout
                          </label>
                          <select
                            id="default_view"
                            value={defaultTaskView}
                            onChange={(e) => setDefaultTaskView(e.target.value)}
                            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                          >
                            <option value="list">List View</option>
                            <option value="board">Board View</option>
                          </select>
                        </div>

                        {/* Default Sorting */}
                        <div>
                          <label
                            htmlFor="default_sort"
                            className="block text-sm font-medium text-slate-700"
                          >
                            Default Task Sorting
                          </label>
                          <select
                            id="default_sort"
                            value={defaultTaskSort}
                            onChange={(e) => setDefaultTaskSort(e.target.value)}
                            className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                          >
                            <option value="due_date">Due Date</option>
                            <option value="priority">Priority</option>
                            <option value="created_at">Created Date</option>
                            <option value="title">Alphabetical (Title)</option>
                          </select>
                        </div>

                        {/* Show completed tasks toggle */}
                        <div className="flex items-center justify-between sm:col-span-2 rounded-xl border border-slate-200 p-4">
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              Show Completed Tasks by Default
                            </p>
                            <p className="text-xs text-slate-400">
                              Keep completed tasks visible in project lists and boards.
                            </p>
                          </div>

                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              checked={showCompletedTasks}
                              onChange={(e) => setShowCompletedTasks(e.target.checked)}
                              className="peer sr-only"
                            />
                            <div className="h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-teal-600 peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:top-[2px] after:start-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-['']"></div>
                          </label>
                        </div>
                      </div>

                      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
                        <div className="flex items-center gap-2 text-xs text-slate-400 min-h-[1.25rem]" aria-live="polite">
                          {taskDirty && !savingTasks && (
                            <><span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />Unsaved changes</>
                          )}
                          {savingTasks && (
                            <><svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Saving...</>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {taskDirty && !savingTasks && (
                            <button
                              type="button"
                              onClick={() => {
                                const b = taskBaseline.current;
                                setDefaultTaskPriority(b.defaultTaskPriority); setDefaultTaskView(b.defaultTaskView);
                                setDefaultTaskSort(b.defaultTaskSort); setShowCompletedTasks(b.showCompletedTasks);
                              }}
                              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                            >
                              Discard
                            </button>
                          )}
                          <button
                            type="submit"
                            disabled={savingTasks || !taskDirty}
                            className="rounded-xl bg-teal-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {savingTasks ? "Saving..." : "Save Task Defaults"}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* 4. NOTIFICATIONS TAB */}
                  {activeTab === "notifications" && (
                    <form
                      onSubmit={handleSaveNotifications}
                      className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8"
                    >
                      <div className="mb-6">
                        <h4 className="text-lg font-bold text-slate-900">
                          Notification Preferences
                        </h4>
                        <p className="mt-1 text-sm text-slate-500">
                          Control how and when TaskFlo notifies you about deadlines and activity.
                        </p>
                      </div>

                      <div className="space-y-4">
                        {/* Due Date Reminders */}
                        <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              Task Due-Date Reminders
                            </p>
                            <p className="text-xs text-slate-400">
                              Get notified when tasks are approaching their due date.
                            </p>
                          </div>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              checked={notifyDueDate}
                              onChange={(e) => setNotifyDueDate(e.target.checked)}
                              className="peer sr-only"
                            />
                            <div className="h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-teal-600 peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:top-[2px] after:start-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-['']"></div>
                          </label>
                        </div>

                        {/* Overdue Alerts */}
                        <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              Overdue Task Alerts
                            </p>
                            <p className="text-xs text-slate-400">
                              Receive alerts for tasks that have passed their deadline.
                            </p>
                          </div>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              checked={notifyOverdue}
                              onChange={(e) => setNotifyOverdue(e.target.checked)}
                              className="peer sr-only"
                            />
                            <div className="h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-teal-600 peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:top-[2px] after:start-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-['']"></div>
                          </label>
                        </div>

                        {/* Project Activity */}
                        <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              Project Activity & Updates
                            </p>
                            <p className="text-xs text-slate-400">
                              Notifications for project changes, new assignments, and completions.
                            </p>
                          </div>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              checked={notifyProjectActivity}
                              onChange={(e) => setNotifyProjectActivity(e.target.checked)}
                              className="peer sr-only"
                            />
                            <div className="h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-teal-600 peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:top-[2px] after:start-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-['']"></div>
                          </label>
                        </div>

                        {/* Email Digest */}
                        <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              Weekly Email Digest
                            </p>
                            <p className="text-xs text-slate-400">
                              Receive a weekly summary of completed tasks and upcoming milestones.
                            </p>
                          </div>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              checked={notifyEmailDigest}
                              onChange={(e) => setNotifyEmailDigest(e.target.checked)}
                              className="peer sr-only"
                            />
                            <div className="h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-teal-600 peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:top-[2px] after:start-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-['']"></div>
                          </label>
                        </div>

                        {/* In-App Notifications */}
                        <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              In-App Banners & Badges
                            </p>
                            <p className="text-xs text-slate-400">
                              Show badges and banner notifications in the workspace top bar.
                            </p>
                          </div>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              checked={notifyInApp}
                              onChange={(e) => setNotifyInApp(e.target.checked)}
                              className="peer sr-only"
                            />
                            <div className="h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-teal-600 peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:top-[2px] after:start-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-['']"></div>
                          </label>
                        </div>
                      </div>

                      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
                        <div className="flex items-center gap-2 text-xs text-slate-400 min-h-[1.25rem]" aria-live="polite">
                          {notifDirty && !savingNotifications && (
                            <><span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />Unsaved changes</>
                          )}
                          {savingNotifications && (
                            <><svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Saving...</>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {notifDirty && !savingNotifications && (
                            <button
                              type="button"
                              onClick={() => {
                                const b = notifBaseline.current;
                                setNotifyDueDate(b.notifyDueDate); setNotifyOverdue(b.notifyOverdue);
                                setNotifyProjectActivity(b.notifyProjectActivity); setNotifyEmailDigest(b.notifyEmailDigest); setNotifyInApp(b.notifyInApp);
                              }}
                              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                            >
                              Discard
                            </button>
                          )}
                          <button
                            type="submit"
                            disabled={savingNotifications || !notifDirty}
                            className="rounded-xl bg-teal-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {savingNotifications ? "Saving..." : "Save Notifications"}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* 5. SECURITY TAB */}
                  {activeTab === "security" && (
                    <div className="space-y-6">
                      <form
                        onSubmit={handleChangePassword}
                        className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8"
                      >
                        <div className="mb-6">
                          <h4 className="text-lg font-bold text-slate-900">
                            Change Password
                          </h4>
                          <p className="mt-1 text-sm text-slate-500">
                            Update your account password. Must be at least 8 characters.
                          </p>
                        </div>

                        {passwordMsg && (
                          <div
                            className={`mb-6 rounded-xl p-4 text-sm font-medium ${
                              passwordMsg.type === "success"
                                ? "bg-teal-50 text-teal-800 ring-1 ring-teal-200"
                                : "bg-red-50 text-red-800 ring-1 ring-red-200"
                            }`}
                          >
                            {passwordMsg.text}
                          </div>
                        )}

                        <div className="space-y-4 max-w-md">
                          <div>
                            <label
                              htmlFor="old_password"
                              className="block text-sm font-medium text-slate-700"
                            >
                              Current Password
                            </label>
                            <input
                              id="old_password"
                              type="password"
                              required
                              value={oldPassword}
                              onChange={(e) => setOldPassword(e.target.value)}
                              className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="new_password"
                              className="block text-sm font-medium text-slate-700"
                            >
                              New Password
                            </label>
                            <input
                              id="new_password"
                              type="password"
                              required
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="new_password_confirm"
                              className="block text-sm font-medium text-slate-700"
                            >
                              Confirm New Password
                            </label>
                            <input
                              id="new_password_confirm"
                              type="password"
                              required
                              value={newPasswordConfirm}
                              onChange={(e) => setNewPasswordConfirm(e.target.value)}
                              className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                            />
                          </div>
                        </div>

                        <div className="mt-8 flex justify-start">
                          <button
                            type="submit"
                            disabled={changingPassword}
                            className="rounded-xl bg-teal-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-50"
                          >
                            {changingPassword ? "Updating..." : "Update Password"}
                          </button>
                        </div>
                      </form>

                      {/* Active Session Info */}
                      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
                        <h4 className="text-lg font-bold text-slate-900">
                          Active Session
                        </h4>
                        <p className="mt-1 text-sm text-slate-500">
                          Current authenticated web browser session.
                        </p>

                        <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="h-4 w-4"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">
                                Current Browser Session
                              </p>
                              <p className="text-xs text-slate-400">
                                JWT Authenticated • Active now
                              </p>
                            </div>
                          </div>

                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            Active
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 6. DATA & PRIVACY TAB */}
                  {activeTab === "data" && (
                    <div className="space-y-6">
                      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
                        <div className="mb-6">
                          <h4 className="text-lg font-bold text-slate-900">
                            Export Account Data
                          </h4>
                          <p className="mt-1 text-sm text-slate-500">
                            Download a full copy of your profile, projects, and task records in JSON format.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              TaskFlo Data Archive (.json)
                            </p>
                            <p className="text-xs text-slate-400">
                              Includes projects, tasks, descriptions, statuses, and timestamps.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={handleExportData}
                            disabled={exporting}
                            className="flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-50"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className="h-4 w-4"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                              />
                            </svg>
                            <span>{exporting ? "Generating..." : "Export Data"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Danger Zone */}
                      <div className="rounded-2xl border border-red-200 bg-red-50/40 p-6 sm:p-8">
                        <h4 className="text-lg font-bold text-red-900">
                          Delete Account
                        </h4>
                        <p className="mt-1 text-sm text-red-700">
                          Permanently delete your account and all associated workspace data.
                        </p>

                        <div className="mt-6 flex justify-end border-t border-red-200/60 pt-6">
                          <button
                            type="button"
                            onClick={() => {
                              setShowDeleteModal(true);
                              setDeleteConfirmText("");
                              setDeleteError("");
                            }}
                            className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                          >
                            Delete Account
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 7. INTEGRATIONS & MOBILE TAB */}
                  {activeTab === "integrations" && (
                    <div className="space-y-6">
                      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
                        <div className="mb-6">
                          <h4 className="text-lg font-bold text-slate-900">
                            Productivity Integrations
                          </h4>
                          <p className="mt-1 text-sm text-slate-500">
                            Connect external calendar, collaboration, and code repository tools.
                          </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          {/* Google Calendar */}
                          <div className="flex flex-col justify-between rounded-xl border border-slate-200 p-5">
                            <div>
                              <div className="flex items-center justify-between">
                                <h5 className="font-semibold text-slate-900">
                                  Google Calendar
                                </h5>
                                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                                  Coming Soon
                                </span>
                              </div>
                              <p className="mt-2 text-xs leading-5 text-slate-500">
                                Synchronize task due dates with Google Calendar events.
                              </p>
                            </div>
                            <button
                              type="button"
                              disabled
                              className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-400 cursor-not-allowed"
                            >
                              Connect
                            </button>
                          </div>

                          {/* Slack */}
                          <div className="flex flex-col justify-between rounded-xl border border-slate-200 p-5">
                            <div>
                              <div className="flex items-center justify-between">
                                <h5 className="font-semibold text-slate-900">
                                  Slack
                                </h5>
                                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                                  Coming Soon
                                </span>
                              </div>
                              <p className="mt-2 text-xs leading-5 text-slate-500">
                                Broadcast project notifications and updates to Slack channels.
                              </p>
                            </div>
                            <button
                              type="button"
                              disabled
                              className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-400 cursor-not-allowed"
                            >
                              Connect
                            </button>
                          </div>

                          {/* GitHub */}
                          <div className="flex flex-col justify-between rounded-xl border border-slate-200 p-5">
                            <div>
                              <div className="flex items-center justify-between">
                                <h5 className="font-semibold text-slate-900">
                                  GitHub
                                </h5>
                                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                                  Coming Soon
                                </span>
                              </div>
                              <p className="mt-2 text-xs leading-5 text-slate-500">
                                Link pull requests and commits directly to TaskFlo tasks.
                              </p>
                            </div>
                            <button
                              type="button"
                              disabled
                              className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-400 cursor-not-allowed"
                            >
                              Connect
                            </button>
                          </div>

                          {/* Webhooks */}
                          <div className="flex flex-col justify-between rounded-xl border border-slate-200 p-5">
                            <div>
                              <div className="flex items-center justify-between">
                                <h5 className="font-semibold text-slate-900">
                                  Custom Webhooks
                                </h5>
                                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                                  Beta
                                </span>
                              </div>
                              <p className="mt-2 text-xs leading-5 text-slate-500">
                                Send real-time events to your custom endpoints.
                              </p>
                            </div>
                            <button
                              type="button"
                              disabled
                              className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-400 cursor-not-allowed"
                            >
                              Configure
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Apps Section */}
                      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
                        <div className="mb-4">
                          <h4 className="text-lg font-bold text-slate-900">
                            TaskFlo Mobile App
                          </h4>
                          <p className="mt-1 text-sm text-slate-500">
                            Take your workspaces on the go with dedicated mobile experiences.
                          </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="rounded-xl border border-slate-200 p-4">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-slate-800">
                                iOS (iPhone & iPad)
                              </p>
                              <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
                                Coming Soon
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-400">
                              Native iOS application with offline sync and widget support.
                            </p>
                          </div>

                          <div className="rounded-xl border border-slate-200 p-4">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-slate-800">
                                Android
                              </p>
                              <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
                                Coming Soon
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-400">
                              Native Android build with push notifications and quick capture.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-delete-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            </div>

            <h3
              id="settings-delete-modal-title"
              className="mt-4 text-xl font-bold text-slate-900"
            >
              Delete Your Account?
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              This action is <strong className="text-red-600">irreversible</strong>.
              All your created projects, tasks, and settings will be permanently destroyed.
            </p>

            <div className="mt-4">
              <label
                htmlFor="settings_confirm_username"
                className="block text-xs font-medium text-slate-700"
              >
                Type your username{" "}
                <span className="font-bold text-slate-900">
                  {user?.username}
                </span>{" "}
                to confirm:
              </label>
              <input
                id="settings_confirm_username"
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={user?.username}
                className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            {deleteError && (
              <p className="mt-2 text-xs font-medium text-red-600">
                {deleteError}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deletingAccount}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deletingAccount || deleteConfirmText !== user?.username}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deletingAccount ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
