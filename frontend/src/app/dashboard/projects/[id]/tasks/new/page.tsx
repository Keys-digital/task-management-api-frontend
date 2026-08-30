"use client";

import { FormEvent, useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useUserProfile } from "@/components/UserProfileContext";
import DatePicker from "@/components/pickers/DatePicker";
import TimePicker from "@/components/pickers/TimePicker";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const REMINDER_OPTIONS = [
  { value: "none", label: "No reminder" },
  { value: "at_start", label: "At start time" },
  { value: "15m", label: "15 minutes before due" },
  { value: "30m", label: "30 minutes before due" },
  { value: "1h", label: "1 hour before due" },
  { value: "2h", label: "2 hours before due" },
  { value: "1d", label: "1 day before due" },
  { value: "1w", label: "1 week before due" },
  { value: "custom", label: "Custom date & time..." },
];

export default function NewTaskPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUserProfile();

  const projectId = params.id;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");

  // Scheduling state
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [reminderOffset, setReminderOffset] = useState("none");
  const [customReminderDate, setCustomReminderDate] = useState("");
  const [customReminderTime, setCustomReminderTime] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Calculated preview calculation
  const calculatedReminderSummary = useMemo(() => {
    if (reminderOffset === "none") return null;

    if (reminderOffset === "custom") {
      if (customReminderDate) {
        return `Custom reminder: ${customReminderDate}${customReminderTime ? ` at ${customReminderTime}` : ""}`;
      }
      return "Select custom date and time for reminder";
    }

    if (reminderOffset === "at_start") {
      if (startDate) {
        return `Reminder will trigger at start: ${startDate}${startTime ? ` at ${startTime}` : " (00:00)"}`;
      }
      return "Requires Start Date to be configured";
    }

    if (dueDate) {
      const timeStr = dueTime || "23:59";
      const dueDt = new Date(`${dueDate}T${timeStr.length === 5 ? `${timeStr}:00` : timeStr}`);

      if (!isNaN(dueDt.getTime())) {
        const offsetMinutesMap: Record<string, number> = {
          "15m": 15,
          "30m": 30,
          "1h": 60,
          "2h": 120,
          "1d": 1440,
          "1w": 10080,
        };
        const mins = offsetMinutesMap[reminderOffset] || 0;
        const reminderDt = new Date(dueDt.getTime() - mins * 60000);
        return `Reminder: ${reminderDt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} at ${reminderDt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} (${REMINDER_OPTIONS.find((o) => o.value === reminderOffset)?.label})`;
      }
    }

    return "Requires Due Date to calculate reminder time";
  }, [reminderOffset, dueDate, dueTime, startDate, startTime, customReminderDate, customReminderTime]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        window.location.href = "/";
        return;
      }

      let reminderDatetimePayload = null;
      if (reminderOffset === "custom" && customReminderDate) {
        const customT = customReminderTime || "09:00:00";
        reminderDatetimePayload = `${customReminderDate}T${customT.length === 5 ? `${customT}:00` : customT}`;
      }

      const response = await fetch(
        `${API_URL}/api/projects/tasks/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            project: Number(projectId),
            title,
            description,
            status,
            priority,
            start_date: startDate || null,
            start_time: startTime || null,
            due_date: dueDate || null,
            due_time: dueTime || null,
            reminder_offset: reminderOffset,
            reminder_datetime: reminderDatetimePayload,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/";
        return;
      }

      if (!response.ok) {
        setError(
          data.title?.[0] ||
            data.description?.[0] ||
            data.status?.[0] ||
            data.priority?.[0] ||
            data.due_date?.[0] ||
            data.due_time?.[0] ||
            data.start_date?.[0] ||
            data.reminder_offset?.[0] ||
            data.project?.[0] ||
            "Unable to create task."
        );
        return;
      }

      router.push(`/dashboard/projects/${projectId}`);
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--color-page-bg)] text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-10 md:px-10">

        <div className="mb-8">
          <Link
            href={`/dashboard/projects/${projectId}`}
            className="text-sm font-medium text-slate-500 transition hover:text-teal-700"
          >
            ← Back to Project
          </Link>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 md:p-8">

          <div className="mb-8">
            <p className="text-sm font-medium text-teal-700">
              New Task
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Create a task
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Schedule your task with precise start/due dates, times, and automated reminder alerts.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            <div>
              <label
                htmlFor="task-title"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Task title
              </label>

              <input
                id="task-title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Release v2 Deployment"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </div>

            <div>
              <label
                htmlFor="task-description"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Description
              </label>

              <textarea
                id="task-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe what needs to be done..."
                rows={4}
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">

              <div>
                <label
                  htmlFor="task-status"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Status
                </label>

                <select
                  id="task-status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="task-priority"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Priority
                </label>

                <select
                  id="task-priority"
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

            </div>

            {/* Schedule & Reminders Card */}
            <div className="rounded-2xl border border-teal-100 bg-teal-50/20 p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-teal-700">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.253 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v7.5" />
                    </svg>
                    Schedule & Reminders
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Distinguish planned start times from exact deadlines and notification alerts ({user?.profile?.timezone || "UTC"} timezone).
                  </p>
                </div>
              </div>

              {/* 1. Start Schedule (Optional) */}
              <div className="mb-5 pb-5 border-b border-slate-200/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-800">
                    Start (Planned Begin Date & Time)
                  </span>
                  <span className="text-xs text-slate-400">Optional</span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <DatePicker
                    id="task-start-date"
                    label="Start Date"
                    value={startDate}
                    onChange={setStartDate}
                    placeholder="Choose start date..."
                  />

                  <TimePicker
                    id="task-start-time"
                    label="Start Time"
                    value={startTime}
                    onChange={setStartTime}
                    placeholder="Choose start time..."
                  />
                </div>
              </div>

              {/* 2. Due Deadline */}
              <div className="mb-5 pb-5 border-b border-slate-200/60">
                <span className="block text-sm font-semibold text-slate-800 mb-2">
                  Due (Completion Deadline)
                </span>

                <div className="grid gap-3 sm:grid-cols-2">
                  <DatePicker
                    id="task-due-date"
                    label="Due Date"
                    value={dueDate}
                    onChange={setDueDate}
                    placeholder="Choose due date..."
                  />

                  <TimePicker
                    id="task-due-time"
                    label="Due Time (Minute-accurate)"
                    value={dueTime}
                    onChange={setDueTime}
                    placeholder="Choose due time..."
                  />
                </div>
              </div>

              {/* 3. Reminder Configuration */}
              <div>
                <label htmlFor="task-reminder-offset" className="block text-sm font-semibold text-slate-800 mb-1">
                  Reminder (Notification Time)
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  When TaskFlo should alert you before the deadline.
                </p>

                <select
                  id="task-reminder-offset"
                  value={reminderOffset}
                  onChange={(e) => setReminderOffset(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                >
                  {REMINDER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {reminderOffset === "custom" && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 rounded-xl bg-white p-3 border border-slate-200">
                    <DatePicker
                      id="custom-reminder-date"
                      label="Reminder Date"
                      value={customReminderDate}
                      onChange={setCustomReminderDate}
                      placeholder="Choose reminder date..."
                    />

                    <TimePicker
                      id="custom-reminder-time"
                      label="Reminder Time"
                      value={customReminderTime}
                      onChange={setCustomReminderTime}
                      placeholder="Choose reminder time..."
                    />
                  </div>
                )}

                {/* Visual Calculated Summary */}
                {calculatedReminderSummary && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-teal-100/70 px-3.5 py-2 text-xs font-semibold text-teal-900">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-teal-700">
                      <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clipRule="evenodd" />
                    </svg>
                    <span>{calculatedReminderSummary}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">

              <Link
                href={`/dashboard/projects/${projectId}`}
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Creating..." : "Create Task"}
              </button>

            </div>

          </form>
        </div>
      </div>
    </main>
  );
}