"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import NotificationCenter from "@/components/NotificationCenter";
import UserMenu from "@/components/UserMenu";
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

type Project = {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
};

type Task = {
  id: number;
  project: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  start_date?: string | null;
  start_time?: string | null;
  due_date?: string | null;
  due_time?: string | null;
  reminder_offset?: string;
  reminder_datetime?: string | null;
  is_overdue?: boolean;
  created_at: string;
  updated_at: string;
};

const getTaskStatusStyles = (status: string) => {
  switch (status) {
    case "todo":
      return {
        card: "bg-rose-50 ring-rose-100",
        badge: "bg-rose-100 text-rose-700",
        label: "To Do",
      };

    case "in_progress":
      return {
        card: "bg-amber-50 ring-amber-100",
        badge: "bg-amber-100 text-amber-700",
        label: "In Progress",
      };

    case "completed":
      return {
        card: "bg-emerald-50 ring-emerald-100",
        badge: "bg-emerald-100 text-emerald-700",
        label: "Completed",
      };

    default:
      return {
        card: "bg-white ring-slate-100",
        badge: "bg-slate-100 text-slate-600",
        label: status,
      };
  }
};

const formatTime12h = (timeStr?: string | null) => {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();

  const projectId = params.id;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskStatus, setTaskStatus] = useState("todo");
  const [taskPriority, setTaskPriority] = useState("medium");

  // Scheduling state for edit modal
  const [taskStartDate, setTaskStartDate] = useState("");
  const [taskStartTime, setTaskStartTime] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskDueTime, setTaskDueTime] = useState("");
  const [taskReminderOffset, setTaskReminderOffset] = useState("none");
  const [taskCustomReminderDate, setTaskCustomReminderDate] = useState("");
  const [taskCustomReminderTime, setTaskCustomReminderTime] = useState("");

  const [savingTask, setSavingTask] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          window.location.href = "/";
          return;
        }

        const [projectResponse, tasksResponse] = await Promise.all([
          fetch(`${API_URL}/api/projects/${projectId}/`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),

          fetch(`${API_URL}/api/projects/tasks/`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        if (
          projectResponse.status === 401 ||
          tasksResponse.status === 401
        ) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/";
          return;
        }

        if (!projectResponse.ok) {
          throw new Error("Unable to load project.");
        }

        if (!tasksResponse.ok) {
          throw new Error("Unable to load tasks.");
        }

        const projectData = await projectResponse.json();
        const tasksData = await tasksResponse.json();

        setProject(projectData);
        setName(projectData.name);
        setDescription(projectData.description || "");

        const taskList: Task[] = Array.isArray(tasksData) ? tasksData : tasksData.results || [];
        const projectTasks = taskList.filter(
          (task: Task) => task.project === Number(projectId)
        );

        setTasks(projectTasks);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  const updateProject = async (event: FormEvent) => {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        window.location.href = "/";
        return;
      }

      const response = await fetch(
        `${API_URL}/api/projects/${projectId}/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            description,
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
          data.name?.[0] ||
            data.description?.[0] ||
            "Unable to update project."
        );
        return;
      }

      setProject(data);
      setName(data.name);
      setDescription(data.description || "");
      setEditing(false);
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setSaving(false);
    }
  };

  const startEditingTask = (task: Task) => {
    setEditingTaskId(task.id);
    setTaskTitle(task.title);
    setTaskDescription(task.description || "");
    setTaskStatus(task.status);
    setTaskPriority(task.priority);
    setTaskStartDate(task.start_date || "");
    setTaskStartTime(task.start_time ? task.start_time.slice(0, 5) : "");
    setTaskDueDate(task.due_date || "");
    setTaskDueTime(task.due_time ? task.due_time.slice(0, 5) : "");
    setTaskReminderOffset(task.reminder_offset || "none");

    if (task.reminder_offset === "custom" && task.reminder_datetime) {
      const rdt = new Date(task.reminder_datetime);
      setTaskCustomReminderDate(rdt.toISOString().slice(0, 10));
      setTaskCustomReminderTime(rdt.toTimeString().slice(0, 5));
    } else {
      setTaskCustomReminderDate("");
      setTaskCustomReminderTime("");
    }
    setError("");
  };

  const updateTask = async (event: FormEvent) => {
    event.preventDefault();

    if (editingTaskId === null) {
      return;
    }

    setSavingTask(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        window.location.href = "/";
        return;
      }

      let reminderDatetimePayload = null;
      if (taskReminderOffset === "custom" && taskCustomReminderDate) {
        const customT = taskCustomReminderTime || "09:00:00";
        reminderDatetimePayload = `${taskCustomReminderDate}T${customT.length === 5 ? `${customT}:00` : customT}`;
      }

      const response = await fetch(
        `${API_URL}/api/projects/tasks/${editingTaskId}/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: taskTitle,
            description: taskDescription,
            status: taskStatus,
            priority: taskPriority,
            start_date: taskStartDate || null,
            start_time: taskStartTime || null,
            due_date: taskDueDate || null,
            due_time: taskDueTime || null,
            reminder_offset: taskReminderOffset,
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
            "Unable to update task."
        );
        return;
      }

      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === editingTaskId ? data : task
        )
      );

      setEditingTaskId(null);
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setSavingTask(false);
    }
  };

  const deleteTask = async (taskId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) {
      return;
    }

    setDeletingTaskId(taskId);
    setError("");

    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        window.location.href = "/";
        return;
      }

      const response = await fetch(
        `${API_URL}/api/projects/tasks/${taskId}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/";
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to delete task.");
      }

      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== taskId)
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete task."
      );
    } finally {
      setDeletingTaskId(null);
    }
  };

  const deleteProject = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project?"
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        window.location.href = "/";
        return;
      }

      const response = await fetch(
        `${API_URL}/api/projects/${projectId}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/";
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to delete project.");
      }

      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete project."
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--color-page-bg)] px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
            Loading project...
          </div>
        </div>
      </main>
    );
  }

  if (error && !project) {
    return (
      <main className="min-h-screen bg-[var(--color-page-bg)] px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-500 hover:text-teal-700"
          >
            ← Back to Dashboard
          </Link>

          <div className="mt-6 rounded-2xl bg-red-50 p-6 text-sm text-red-700">
            {error}
          </div>
        </div>
      </main>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[var(--color-page-bg)] text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-10 md:px-10">

        {/* Navigation & Header Controls */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-500 transition hover:text-teal-700"
          >
            ← Back to Dashboard
          </Link>

          <div className="flex items-center gap-3">
            <NotificationCenter />
            <UserMenu />
          </div>
        </div>

        {/* Project header */}
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 md:p-8">

          {!editing ? (
            <>
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-medium text-teal-700">
                    Project
                  </p>

                  <h1 className="mt-2 text-3xl font-bold tracking-tight">
                    {project.name}
                  </h1>

                  <p className="mt-2 text-sm text-slate-500">
                    {project.description || "No project description provided."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Edit Project
                  </button>

                  <button
                    type="button"
                    onClick={deleteProject}
                    disabled={deleting}
                    className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
                  >
                    {deleting ? "Deleting..." : "Delete Project"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <form onSubmit={updateProject} className="space-y-6">
              <div>
                <label
                  htmlFor="project-name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Project name
                </label>

                <input
                  id="project-name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div>
                <label
                  htmlFor="project-description"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Description
                </label>

                <textarea
                  id="project-description"
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  rows={5}
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setName(project.name);
                    setDescription(project.description || "");
                    setError("");
                  }}
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </div>
       
        {/* Tasks */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                Tasks
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Tasks belonging to this project.
              </p>
            </div>

            <Link
              href={`/dashboard/projects/${projectId}/tasks/new`}
              className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
            >
              + New Task
            </Link>
          </div>

          {tasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <h3 className="text-lg font-semibold text-slate-800">
                No tasks yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Add a task to start organizing the work for this project.
              </p>

              <Link
                href={`/dashboard/projects/${projectId}/tasks/new`}
                className="mt-5 inline-block rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
              >
                Create your first task
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => {
                const styles = getTaskStatusStyles(task.status);
                const isOverdue = task.is_overdue || (task.due_date && task.status !== "completed" && new Date(`${task.due_date}T${task.due_time || "23:59:59"}`) < new Date());

                return (
                  <div
                    key={task.id}
                    className={`rounded-2xl p-5 shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-md ${styles.card}`}
                  >
                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {task.title}
                          </h3>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${styles.badge}`}
                          >
                            {styles.label}
                          </span>

                          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-600">
                            {task.priority}
                          </span>

                          {isOverdue && (
                            <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-xs">
                              Overdue
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {task.description || "No description provided."}
                        </p>

                        {/* Scheduling & Reminders Tag List */}
                        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                          {task.start_date && (
                            <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/80 shadow-2xs">
                              <span className="text-slate-500 dark:text-slate-400 font-normal">Start:</span>
                              <span className="font-semibold text-slate-900 dark:text-slate-100">{task.start_date}</span>
                              {task.start_time && <span className="text-slate-700 dark:text-slate-300">at {formatTime12h(task.start_time)}</span>}
                            </div>
                          )}

                          {task.due_date && (
                            <div className={`flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-lg border shadow-2xs ${
                              isOverdue
                                ? "bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800/80"
                                : "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/90 dark:text-slate-200 dark:border-slate-700/80"
                            }`}>
                              <span className={isOverdue ? "text-rose-600 dark:text-rose-400 font-normal" : "text-slate-500 dark:text-slate-400 font-normal"}>Due:</span>
                              <span className={`font-semibold ${isOverdue ? "text-rose-950 dark:text-rose-100" : "text-slate-900 dark:text-slate-100"}`}>{task.due_date}</span>
                              {task.due_time && <span className={isOverdue ? "text-rose-800 dark:text-rose-300" : "text-slate-700 dark:text-slate-300"}>at {formatTime12h(task.due_time)}</span>}
                            </div>
                          )}

                          {task.reminder_offset && task.reminder_offset !== "none" && (
                            <div className="flex items-center gap-1.5 font-medium text-teal-900 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-700/80 shadow-2xs">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400">
                                <path d="M10 2a6 6 0 0 0-6 6v3.586l-.707.707A1 1 0 0 0 4 14h12a1 1 0 0 0 .707-1.707L16 11.586V8a6 6 0 0 0-6-6ZM10 18a3 3 0 0 1-3-3h6a3 3 0 0 1-3 3Z" />
                              </svg>
                              <span>Reminder: <strong className="font-semibold text-teal-950 dark:text-teal-100">{REMINDER_OPTIONS.find((r) => r.value === task.reminder_offset)?.label || task.reminder_offset}</strong></span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="relative z-20 flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => startEditingTask(task)}
                          className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteTask(task.id)}
                          disabled={deletingTaskId === task.id}
                          className="relative z-20 cursor-pointer rounded-xl bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingTaskId === task.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Edit Task Modal */}
        {editingTaskId !== null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-task-title"
          >
            <div
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl md:p-8"
            >
              <div className="mb-6">
                <p className="text-sm font-medium text-teal-700">
                  Edit Task
                </p>

                <h2
                  id="edit-task-title"
                  className="mt-2 text-2xl font-bold tracking-tight text-slate-900"
                >
                  Update task
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Update schedule, start/due dates, times, and reminder settings.
                </p>
              </div>

              {error && (
                <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={updateTask} className="space-y-6">
                <div>
                  <label
                    htmlFor="edit-task-title"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Task title
                  </label>

                  <input
                    id="edit-task-title"
                    value={taskTitle}
                    onChange={(event) => setTaskTitle(event.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-task-description"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Description
                  </label>

                  <textarea
                    id="edit-task-description"
                    value={taskDescription}
                    onChange={(event) => setTaskDescription(event.target.value)}
                    rows={4}
                    className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="edit-task-status"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Status
                    </label>

                    <select
                      id="edit-task-status"
                      value={taskStatus}
                      onChange={(event) => setTaskStatus(event.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="edit-task-priority"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Priority
                    </label>

                    <select
                      id="edit-task-priority"
                      value={taskPriority}
                      onChange={(event) => setTaskPriority(event.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                {/* Schedule & Reminders Sub-section */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5 space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-teal-700">
                      <path fillRule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z" clipRule="evenodd" />
                    </svg>
                    Schedule & Reminder Settings
                  </h4>

                  {/* Start Date & Time */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DatePicker
                      id="edit-task-start-date"
                      label="Start Date (Optional)"
                      value={taskStartDate}
                      onChange={setTaskStartDate}
                      placeholder="Choose start date..."
                    />

                    <TimePicker
                      id="edit-task-start-time"
                      label="Start Time"
                      value={taskStartTime}
                      onChange={setTaskStartTime}
                      placeholder="Choose start time..."
                    />
                  </div>

                  {/* Due Date & Time */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DatePicker
                      id="edit-task-due-date"
                      label="Due Date"
                      value={taskDueDate}
                      onChange={setTaskDueDate}
                      placeholder="Choose due date..."
                    />

                    <TimePicker
                      id="edit-task-due-time"
                      label="Due Time"
                      value={taskDueTime}
                      onChange={setTaskDueTime}
                      placeholder="Choose due time..."
                    />
                  </div>

                  {/* Reminder Offset */}
                  <div>
                    <label htmlFor="edit-task-reminder-offset" className="block text-xs font-semibold text-slate-700 mb-1">
                      Reminder
                    </label>
                    <select
                      id="edit-task-reminder-offset"
                      value={taskReminderOffset}
                      onChange={(e) => setTaskReminderOffset(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-600"
                    >
                      {REMINDER_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    {taskReminderOffset === "custom" && (
                      <div className="mt-2 grid gap-3 sm:grid-cols-2 rounded-xl bg-white p-3 border border-slate-200">
                        <DatePicker
                          id="edit-custom-reminder-date"
                          label="Reminder Date"
                          value={taskCustomReminderDate}
                          onChange={setTaskCustomReminderDate}
                          placeholder="Choose reminder date..."
                        />

                        <TimePicker
                          id="edit-custom-reminder-time"
                          label="Reminder Time"
                          value={taskCustomReminderTime}
                          onChange={setTaskCustomReminderTime}
                          placeholder="Choose reminder time..."
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTaskId(null);
                      setError("");
                    }}
                    className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={savingTask}
                    className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingTask ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}