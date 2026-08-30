"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DashboardSidebar from "@/components/DashboardSidebar";
import UserMenu from "@/components/UserMenu";
import NotificationCenter from "@/components/NotificationCenter";
import { useUserProfile } from "@/components/UserProfileContext";
import { authFetch } from "@/lib/api";

type Project = {
  id: number;
  name?: string;
};

type Task = {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  start_date?: string | null;
  start_time?: string | null;
  due_date?: string | null;
  due_time?: string | null;
  reminder_offset?: string;
  reminder_datetime?: string | null;
  is_overdue?: boolean;
  created_at?: string;
  updated_at?: string;
  project?: number | Project;
  project_name?: string;
};

const STATUS_STYLES: Record<
  string,
  {
    label: string;
    background: string;
    text: string;
  }
> = {
  todo: {
    label: "To Do",
    background: "bg-slate-100",
    text: "text-slate-700",
  },
  in_progress: {
    label: "In Progress",
    background: "bg-blue-100",
    text: "text-blue-700",
  },
  completed: {
    label: "Completed",
    background: "bg-emerald-100",
    text: "text-emerald-700",
  },
};

const PRIORITY_STYLES: Record<
  string,
  {
    label: string;
    background: string;
    text: string;
  }
> = {
  low: {
    label: "Low",
    background: "bg-slate-100",
    text: "text-slate-600",
  },
  medium: {
    label: "Medium",
    background: "bg-amber-100",
    text: "text-amber-700",
  },
  high: {
    label: "High",
    background: "bg-rose-100",
    text: "text-rose-700",
  },
};

const getStatusStyle = (status: string) =>
  STATUS_STYLES[status] || {
    label: status.replace("_", " "),
    background: "bg-slate-100",
    text: "text-slate-700",
  };

const getPriorityStyle = (priority: string) =>
  PRIORITY_STYLES[priority] || {
    label: priority,
    background: "bg-slate-100",
    text: "text-slate-700",
  };

const getProjectId = (project?: number | Project) => {
  if (typeof project === "number") {
    return project;
  }

  if (project && typeof project === "object") {
    return project.id;
  }

  return null;
};

const getProjectName = (task: Task) => {
  if (task.project_name) {
    return task.project_name;
  }

  if (task.project && typeof task.project === "object") {
    return task.project.name || `Project #${task.project.id}`;
  }

  if (typeof task.project === "number") {
    return `Project #${task.project}`;
  }

  return "Project";
};

const formatDate = (date?: string | null) => {
  if (!date) {
    return null;
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
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

const isOverdue = (dueDate?: string | null, dueTime?: string | null, status?: string, backendIsOverdue?: boolean) => {
  if (backendIsOverdue !== undefined) return backendIsOverdue;
  if (!dueDate || status === "completed") {
    return false;
  }

  const timeStr = dueTime || "23:59:59";
  const due = new Date(`${dueDate}T${timeStr.length === 5 ? `${timeStr}:00` : timeStr}`);
  if (isNaN(due.getTime())) return false;

  return due < new Date();
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user, loading: userLoading } = useUserProfile();

  const userDisplayName =
    user?.profile?.full_name ||
    (user?.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : "") ||
    user?.username ||
    "User";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        window.location.href = "/";
        return;
      }

      const response = await authFetch("/api/projects/tasks/");

      if (response.status === 401) {
        window.location.href = "/";
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to load tasks.");
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setTasks(data);
      } else if (Array.isArray(data.results)) {
        setTasks(data.results);
      } else {
        setTasks([]);
      }
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

  useEffect(() => {
    fetchTasks();
  }, []);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch =
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        getProjectName(task).toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        task.status === statusFilter;

      const matchesPriority =
        priorityFilter === "all" ||
        task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, search, statusFilter, priorityFilter]);

  const todoCount = tasks.filter((task) => task.status === "todo").length;
  const inProgressCount = tasks.filter((task) => task.status === "in_progress").length;
  const completedCount = tasks.filter((task) => task.status === "completed").length;

  return (
    <main className="min-h-screen bg-[var(--color-page-bg)] text-slate-900">
      <div className="flex min-h-screen flex-col md:flex-row">

        {/* Sidebar */}
        <DashboardSidebar activePage="tasks" />

        {/* Main content */}
        <section className="flex-1">

          {/* Top bar */}
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5 md:px-10">

            <div>
              <p className="text-sm text-slate-400">
                Workspace
              </p>

              <h2 className="text-xl font-semibold text-slate-900">
                Tasks
              </h2>
            </div>

            <div className="flex items-center gap-3">

              <div className="hidden text-right sm:block">
                {userLoading || !user ? (
                  <div className="space-y-1 animate-pulse">
                    <div className="ml-auto h-4 w-24 rounded bg-slate-200" />
                    <div className="ml-auto h-3 w-28 rounded bg-slate-100" />
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-slate-800">
                      {userDisplayName}
                    </p>
                    <p className="text-xs text-slate-400">
                      Workspace owner
                    </p>
                  </>
                )}
              </div>

              {/* In-App Notification Center */}
              <NotificationCenter />

              {/* User Menu */}
              <UserMenu />

            </div>

          </header>

          {/* Page Content */}
          <div className="mx-auto max-w-7xl px-6 py-8 md:px-10">

            {/* Header section */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h3 className="text-3xl font-bold tracking-tight text-slate-900">
                  All Tasks
                </h3>

                <p className="mt-2 text-slate-500">
                  Track schedule, start times, deadlines, and progress across all workspace projects.
                </p>
              </div>

              <Link
                href="/dashboard/projects"
                className="inline-flex items-center justify-center rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
              >
                + New Project / Task
              </Link>

            </div>

            {/* Summary counters */}
            <div className="mb-8 grid grid-cols-3 gap-4">

              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  To Do
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {todoCount}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  In Progress
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {inProgressCount}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Completed
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {completedCount}
                </p>
              </div>

            </div>

            {/* Search & Filters */}
            <div className="mb-8 flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between">

              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search tasks by title, description, or project..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                >
                  <option value="all">All Statuses</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                >
                  <option value="all">All Priorities</option>
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>

            </div>

            {/* Task list grid */}
            {loading ? (
              <div className="rounded-2xl bg-white p-12 text-center text-sm text-slate-400 shadow-sm">
                Loading tasks...
              </div>
            ) : error ? (
              <div className="rounded-2xl bg-red-50 p-6 text-sm text-red-700">
                {error}
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                <h4 className="text-lg font-semibold text-slate-800">
                  No tasks found
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                  {tasks.length === 0 ? "You haven't created any tasks yet." : "No tasks match your filter criteria."}
                </p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredTasks.map((task) => {
                  const statusStyle = getStatusStyle(task.status);
                  const priorityStyle = getPriorityStyle(task.priority);
                  const projectId = getProjectId(task.project);
                  const projectName = getProjectName(task);
                  const dueDate = formatDate(task.due_date);
                  const startDate = formatDate(task.start_date);
                  const overdue = isOverdue(task.due_date, task.due_time, task.status, task.is_overdue);

                  return (
                    <Link
                      key={task.id}
                      href={
                        projectId
                          ? `/dashboard/projects/${projectId}`
                          : "/dashboard/tasks"
                      }
                      className="group flex flex-col justify-between rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div>
                        {/* Header */}
                        <div className="mb-4 flex items-start justify-between gap-4">
                          <span className="text-xs font-semibold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100">
                            {projectName}
                          </span>

                          <span className="text-slate-300 transition group-hover:text-teal-600">
                            →
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-lg font-semibold text-slate-900 group-hover:text-teal-950">
                          {task.title}
                        </h4>

                        {/* Description */}
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                          {task.description || "No description provided."}
                        </p>

                        {/* Status & Priority */}
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle.background} ${statusStyle.text}`}
                          >
                            {statusStyle.label}
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityStyle.background} ${priorityStyle.text}`}
                          >
                            {priorityStyle.label}
                          </span>

                          {overdue && (
                            <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-xs">
                              Overdue
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Scheduling Footer */}
                      <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-1.5 text-xs">
                        {startDate && (
                          <p className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                            <span className="text-slate-400 dark:text-slate-400 font-normal">Start:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-100">{startDate}</span>
                            {task.start_time && <span className="text-slate-600 dark:text-slate-300">at {formatTime12h(task.start_time)}</span>}
                          </p>
                        )}

                        {dueDate ? (
                          <p
                            className={`flex items-center gap-1.5 ${
                              overdue
                                ? "font-semibold text-rose-600 dark:text-rose-400"
                                : "text-slate-600 dark:text-slate-300"
                            }`}
                          >
                            <span className={overdue ? "text-rose-600 dark:text-rose-400 font-normal" : "text-slate-400 dark:text-slate-400 font-normal"}>Due:</span>
                            <span className={`font-semibold ${overdue ? "text-rose-900 dark:text-rose-200" : "text-slate-800 dark:text-slate-100"}`}>{dueDate}</span>
                            {task.due_time && <span className={overdue ? "text-rose-700 dark:text-rose-300" : "text-slate-600 dark:text-slate-300"}>at {formatTime12h(task.due_time)}</span>}
                          </p>
                        ) : (
                          <p className="text-slate-400 dark:text-slate-400">No due date</p>
                        )}

                        {task.reminder_offset && task.reminder_offset !== "none" && (
                          <p className="text-teal-700 dark:text-teal-300 font-medium flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 shrink-0 text-teal-600 dark:text-teal-400">
                              <path d="M10 2a6 6 0 0 0-6 6v3.586l-.707.707A1 1 0 0 0 4 14h12a1 1 0 0 0 .707-1.707L16 11.586V8a6 6 0 0 0-6-6ZM10 18a3 3 0 0 1-3-3h6a3 3 0 0 1-3 3Z" />
                            </svg>
                            <span>Reminder: <strong className="font-semibold text-teal-800 dark:text-teal-200">{task.reminder_offset}</strong></span>
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

          </div>
        </section>
      </div>
    </main>
  );
}
