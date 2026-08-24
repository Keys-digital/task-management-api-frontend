"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import UserMenu from "@/components/UserMenu";
import { useUserProfile } from "@/components/UserProfileContext";

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

export default function ProfilePage() {
  const {
    user,
    loading,
    initials,
    avatarUrl,
    updateUser,
    uploadAvatar,
    removeAvatar,
  } = useUserProfile();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [dateFormat, setDateFormat] = useState("YYYY-MM-DD");
  const [timeFormat, setTimeFormat] = useState("24h");

  // Status & feedback
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [removingAvatarState, setRemovingAvatarState] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // ─── Sync baseline refs ───────────────────────────────────────────────────
  // Tracks the last-committed (server-confirmed) value for each editable field.
  // A field is "clean" when its current state equals the baseline.
  // A field is "dirty" when the user has changed it but not yet saved.
  // Only clean fields are overwritten by incoming UserProfileContext updates.
  const isProfileInitialized = useRef(false);
  const profileBaseline = useRef({
    firstName: "",
    lastName: "",
    fullName: "",
    bio: "",
    timezone: "UTC",
    dateFormat: "YYYY-MM-DD",
    timeFormat: "24h",
  });

  // ─── Per-field dirty-guard sync from UserProfileContext ─────────────────
  // On first load: initialize all fields and set baselines.
  // On subsequent context updates (e.g. another page saved a shared field):
  //   - Only overwrite fields that are currently clean (local === baseline).
  //   - Dirty fields are never overwritten; their baseline is not advanced.
  //   - This ensures in-progress edits survive external context changes.
  useEffect(() => {
    if (!user) return;
    const p = user.profile;

    const serverValues = {
      firstName: user.first_name || "",
      lastName: user.last_name || "",
      fullName: p?.full_name || "",
      bio: p?.bio || "",
      timezone: p?.timezone || "UTC",
      dateFormat: p?.date_format || "YYYY-MM-DD",
      timeFormat: p?.time_format || "24h",
    };

    if (!isProfileInitialized.current) {
      // First load — initialize everything unconditionally.
      isProfileInitialized.current = true;
      setFirstName(serverValues.firstName);
      setLastName(serverValues.lastName);
      setFullName(serverValues.fullName);
      setBio(serverValues.bio);
      setTimezone(serverValues.timezone);
      setDateFormat(serverValues.dateFormat);
      setTimeFormat(serverValues.timeFormat);
      profileBaseline.current = { ...serverValues };
      return;
    }

    // Subsequent updates — per-field dirty check.
    // Clean field: current value === baseline → follow context, advance baseline.
    // Dirty field: current value !== baseline → preserve local value and baseline.
    const bl = profileBaseline.current;
    const nextBaseline = { ...bl };

    if (firstName === bl.firstName) { setFirstName(serverValues.firstName); nextBaseline.firstName = serverValues.firstName; }
    if (lastName === bl.lastName) { setLastName(serverValues.lastName); nextBaseline.lastName = serverValues.lastName; }
    if (fullName === bl.fullName) { setFullName(serverValues.fullName); nextBaseline.fullName = serverValues.fullName; }
    if (bio === bl.bio) { setBio(serverValues.bio); nextBaseline.bio = serverValues.bio; }
    if (timezone === bl.timezone) { setTimezone(serverValues.timezone); nextBaseline.timezone = serverValues.timezone; }
    if (dateFormat === bl.dateFormat) { setDateFormat(serverValues.dateFormat); nextBaseline.dateFormat = serverValues.dateFormat; }
    if (timeFormat === bl.timeFormat) { setTimeFormat(serverValues.timeFormat); nextBaseline.timeFormat = serverValues.timeFormat; }

    profileBaseline.current = nextBaseline;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSaveProfile = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    const result = await updateUser({
      first_name: firstName,
      last_name: lastName,
      profile: {
        full_name: fullName,
        bio: bio,
        timezone: timezone,
        date_format: dateFormat,
        time_format: timeFormat,
      },
    });

    setSaving(false);
    if (result.success) {
      // Advance baselines to server-confirmed values so dirty state clears.
      // updateUser sets user in context with the API response body, so the
      // values in context are now canonical. Mirror them into the baseline.
      profileBaseline.current = {
        ...profileBaseline.current,
        firstName,
        lastName,
        fullName,
        bio,
        timezone,
        dateFormat,
        timeFormat,
      };
      setStatusMessage({
        type: "success",
        text: "Profile updated successfully.",
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } else {
      // Do NOT advance baselines — the API rejected the values.
      // Local state (user's in-progress edits) is preserved.
      setStatusMessage({
        type: "error",
        text: result.error || "Failed to update profile.",
      });
    }
  }, [updateUser, firstName, lastName, fullName, bio, timezone, dateFormat, timeFormat]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setUploadingAvatar(true);
    setAvatarError(null);

    const res = await uploadAvatar(file);
    setUploadingAvatar(false);

    if (!res.success) {
      setAvatarError(res.error || "Failed to upload avatar.");
    } else {
      setStatusMessage({
        type: "success",
        text: "Avatar updated successfully.",
      });
      setTimeout(() => setStatusMessage(null), 4000);
    }

    // Reset file input value
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    setRemovingAvatarState(true);
    setAvatarError(null);

    const res = await removeAvatar();
    setRemovingAvatarState(false);

    if (!res.success) {
      setAvatarError(res.error || "Failed to remove avatar.");
    } else {
      setStatusMessage({
        type: "success",
        text: "Avatar removed. Initials restored.",
      });
      setTimeout(() => setStatusMessage(null), 4000);
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

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("username");
    window.location.href = "/";
  };

  const formattedJoinDate = user?.date_joined
    ? new Date(user.date_joined).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    : null;

  // Calculate profile completion
  const completionScore = (() => {
    if (!user) return 0;
    let score = 0;
    if (user.username) score += 20;
    if (user.email) score += 20;
    if (user.first_name || user.profile?.full_name) score += 20;
    if (user.profile?.bio) score += 20;
    if (user.profile?.avatar) score += 20;
    return score;
  })();

  const displayName =
    fullName ||
    (firstName ? `${firstName} ${lastName}`.trim() : "") ||
    user?.username ||
    "User";

  return (
    <main className="min-h-screen bg-[var(--color-page-bg)] text-slate-900">
      <div className="flex min-h-screen flex-col md:flex-row">
        {/* Sidebar */}
        <DashboardSidebar activePage="profile" />

        {/* Main Content Area */}
        <section className="flex-1">
          {/* Top Bar */}
          <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5 md:px-10">
            <div className="min-w-0">
              <p className="text-sm text-slate-400">Account</p>
              <h2 className="text-xl font-semibold text-slate-900 truncate">Profile</h2>
            </div>
            <UserMenu />
          </header>

          {/* Profile Body */}
          <div className="mx-auto max-w-5xl px-6 py-8 md:px-10">
            {/* Page Header */}
            <div className="mb-8">
              <h3 className="text-3xl font-bold tracking-tight text-slate-900">
                Your Profile
              </h3>
              <p className="mt-2 text-slate-500">
                Manage your personal details, avatar, and account preferences.
              </p>
            </div>

            {/* Notification Toast */}
            {statusMessage && (
              <div
                className={`mb-6 flex items-center justify-between rounded-2xl p-4 text-sm font-medium ${statusMessage.type === "success"
                    ? "bg-teal-50 text-teal-800 ring-1 ring-teal-200"
                    : "bg-red-50 text-red-800 ring-1 ring-red-200"
                  }`}
              >
                <span>{statusMessage.text}</span>
                <button
                  type="button"
                  onClick={() => setStatusMessage(null)}
                  className="text-xs opacity-70 hover:opacity-100"
                >
                  Dismiss
                </button>
              </div>
            )}

            {loading ? (
              <div className="rounded-2xl bg-white p-12 text-center text-slate-400 shadow-sm ring-1 ring-slate-100">
                Loading profile details...
              </div>
            ) : (
              <div className="space-y-8">
                {/* 1. Overview & Avatar Card */}
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col items-center gap-5 sm:flex-row">
                      {/* Avatar preview / upload trigger */}
                      <div className="relative group">
                        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-teal-100 text-2xl font-bold text-teal-700 ring-4 ring-slate-100 shadow-md">
                          {avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={avatarUrl}
                              alt={displayName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span>{initials}</span>
                          )}
                        </div>

                        {uploadingAvatar && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-900/60 text-xs font-semibold text-white">
                            Uploading...
                          </div>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="text-center sm:text-left">
                        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                          <h4 className="text-xl font-bold text-slate-900">
                            {displayName}
                          </h4>
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                            @{user?.username}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          {user?.email}
                        </p>

                        {formattedJoinDate && (
                          <p className="mt-2 text-xs text-slate-400">
                            Member since {formattedJoinDate}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Avatar Actions */}
                    <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-end">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        aria-label="Upload profile avatar"
                      />

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-50"
                      >
                        {uploadingAvatar ? "Uploading..." : "Change Avatar"}
                      </button>

                      {user?.profile?.avatar && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          disabled={removingAvatarState}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50 disabled:opacity-50"
                        >
                          {removingAvatarState ? "Removing..." : "Remove"}
                        </button>
                      )}
                    </div>
                  </div>

                  {avatarError && (
                    <p className="mt-3 text-xs text-red-600 font-medium">
                      {avatarError}
                    </p>
                  )}

                  {/* Profile Completion Bar */}
                  <div className="mt-6 border-t border-slate-100 pt-6">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-500">Profile Completion</span>
                      <span className="text-teal-700">{completionScore}%</span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-teal-600 transition-all duration-500"
                        style={{ width: `${completionScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Personal Information Form */}
                <form
                  onSubmit={handleSaveProfile}
                  className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8"
                >
                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-slate-900">
                      Personal Information
                    </h4>
                    <p className="mt-1 text-sm text-slate-500">
                      Update your name, bio, and time preferences.
                    </p>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    {/* First Name */}
                    <div>
                      <label
                        htmlFor="first_name"
                        className="block text-sm font-medium text-slate-700"
                      >
                        First Name
                      </label>
                      <input
                        id="first_name"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>

                    {/* Last Name */}
                    <div>
                      <label
                        htmlFor="last_name"
                        className="block text-sm font-medium text-slate-700"
                      >
                        Last Name
                      </label>
                      <input
                        id="last_name"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>

                    {/* Display / Full Name */}
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="full_name"
                        className="block text-sm font-medium text-slate-700"
                      >
                        Display Name
                      </label>
                      <input
                        id="full_name"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Johnathan Doe"
                        className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                      <p className="mt-1 text-xs text-slate-400">
                        How your name will appear across TaskFlo workspaces.
                      </p>
                    </div>

                    {/* Bio */}
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="bio"
                        className="block text-sm font-medium text-slate-700"
                      >
                        Bio / Role
                      </label>
                      <textarea
                        id="bio"
                        rows={3}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell your team about your role, focus areas, or interests..."
                        className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>

                    {/* Email (Read-only) */}
                    <div>
                      <label
                        htmlFor="email_address"
                        className="block text-sm font-medium text-slate-700"
                      >
                        Email Address
                      </label>
                      <div className="relative mt-2">
                        <input
                          id="email_address"
                          type="email"
                          value={user?.email || ""}
                          readOnly
                          className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                        />
                        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="h-3 w-3"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Primary
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        Authenticated email address associated with your account.
                      </p>
                    </div>

                    {/* Timezone */}
                    <div>
                      <label
                        htmlFor="timezone"
                        className="block text-sm font-medium text-slate-700"
                      >
                        Timezone
                      </label>
                      <select
                        id="timezone"
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
                        htmlFor="date_format"
                        className="block text-sm font-medium text-slate-700"
                      >
                        Preferred Date Format
                      </label>
                      <select
                        id="date_format"
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
                        htmlFor="time_format"
                        className="block text-sm font-medium text-slate-700"
                      >
                        Preferred Time Format
                      </label>
                      <select
                        id="time_format"
                        value={timeFormat}
                        onChange={(e) => setTimeFormat(e.target.value)}
                        className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      >
                        <option value="24h">24 Hours (14:30)</option>
                        <option value="12h">12 Hours (2:30 PM)</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-xl bg-teal-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-50"
                    >
                      {saving ? "Saving Changes..." : "Save Changes"}
                    </button>
                  </div>
                </form>

                {/* 3. Account Actions / Danger Zone */}
                <div className="rounded-2xl border border-red-200 bg-red-50/40 p-6 sm:p-8">
                  <h4 className="text-lg font-bold text-red-900">
                    Account Actions & Danger Zone
                  </h4>
                  <p className="mt-1 text-sm text-red-700">
                    Manage session sign-out or permanently delete your account.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-red-200/60 pt-6">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Sign Out
                      </p>
                      <p className="text-xs text-slate-500">
                        End your current active session on this device.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-xs transition hover:bg-slate-50"
                    >
                      Sign Out
                    </button>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-red-200/60 pt-6">
                    <div>
                      <p className="text-sm font-semibold text-red-900">
                        Delete Account
                      </p>
                      <p className="text-xs text-red-700">
                        Permanently remove your account, profile, all projects, and tasks.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteModal(true);
                        setDeleteConfirmText("");
                        setDeleteError("");
                      }}
                      className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
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
              id="delete-modal-title"
              className="mt-4 text-xl font-bold text-slate-900"
            >
              Delete Your Account?
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              This action is <strong className="text-red-600">irreversible</strong>.
              All your created projects, tasks, and profile data will be permanently wiped.
            </p>

            <div className="mt-4">
              <label
                htmlFor="confirm_username"
                className="block text-xs font-medium text-slate-700"
              >
                Type your username{" "}
                <span className="font-bold text-slate-900">
                  {user?.username}
                </span>{" "}
                to confirm:
              </label>
              <input
                id="confirm_username"
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
