"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DashboardSidebar from "@/components/DashboardSidebar";
import UserMenu from "@/components/UserMenu";
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
  due_date?: string | null;
  created_at?: string;
  updated_at?: string;
  project?: number | Project;
  project_name?: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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
  Completed: {
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

  return parsedDate.toLocaleDateString();
};

const isOverdue = (dueDate?: string | null, status?: string) => {
  if (!dueDate || status === "completed") {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(`${dueDate}T00:00:00`);

  return due < today;
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

      // Supports either:
      // 1. [task, task, task]
      // 2. { results: [task, task, task] }
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

  const todoCount = tasks.filter(
    (task) => task.status === "todo"
  ).length;

  const inProgressCount = tasks.filter(
    (task) => task.status === "in_progress"
  ).length;

  const completedCount = tasks.filter(
    (task) => task.status === "completed"
  ).length;

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

        {/* UserMenu Avartar dropdown */}
<UserMenu />
              
            </div>
          </header>

          <div className="mx-auto max-w-7xl px-6 py-8 md:px-10">

            {/* Page heading */}
            <div className="mb-8">
              <h3 className="text-3xl font-bold tracking-tight text-slate-900">
                Your Tasks
              </h3>

              <p className="mt-2 text-slate-500">
                View and manage tasks across all your projects.
              </p>
            </div>

            {/* Summary */}
            {!loading && !error && tasks.length > 0 && (
              <div className="mb-6 grid gap-4 sm:grid-cols-3">

                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                  <p className="text-sm font-medium text-slate-500">
                    To Do
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {todoCount}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                  <p className="text-sm font-medium text-slate-500">
                    In Progress
                  </p>

                  <p className="mt-2 text-2xl font-bold text-blue-700">
                    {inProgressCount}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                  <p className="text-sm font-medium text-slate-500">
                    Completed
                  </p>

                  <p className="mt-2 text-2xl font-bold text-emerald-700">
                    {completedCount}
                  </p>
                </div>

              </div>
            )}

            {/* Filters */}
            <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <div className="grid gap-4 md:grid-cols-[1fr_180px_180px]">

                <div>
                  <label
                    htmlFor="task-search"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Search tasks
                  </label>

                  <input
                    id="task-search"
                    type="search"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search by task, description, or project..."
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="status-filter"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Status
                  </label>

                  <select
                    id="status-filter"
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  >
                    <option value="all">All statuses</option>
                    <option value="todo">To Do</option>
                    <option value="in_progress">
                      In Progress
                    </option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="priority-filter"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Priority
                  </label>

                  <select
                    id="priority-filter"
                    value={priorityFilter}
                    onChange={(event) =>
                      setPriorityFilter(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  >
                    <option value="all">All priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
                Loading your tasks...
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="rounded-2xl bg-red-50 p-5 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Empty */}
            {!loading &&
              !error &&
              tasks.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">

                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-6 w-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5h6M9 9h6M9 13h4M6.75 3.75h10.5A1.75 1.75 0 0 1 19 5.5v13A1.75 1.75 0 0 1 17.25 20H6.75A1.75 1.75 0 0 1 5 18.5v-13a1.75 1.75 0 0 1 1.75-1.75Z"
                      />
                    </svg>
                  </div>

                  <h4 className="mt-4 text-lg font-semibold text-slate-800">
                    No tasks yet
                  </h4>

                  <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                    Create a task from one of your projects to start
                    tracking your work.
                  </p>

                  <Link
                    href="/dashboard/projects"
                    className="mt-5 inline-block rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
                  >
                    View Projects
                  </Link>
                </div>
              )}

            {/* No filtered results */}
            {!loading &&
              !error &&
              tasks.length > 0 &&
              filteredTasks.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">

                  <h4 className="text-lg font-semibold text-slate-800">
                    No matching tasks
                  </h4>

                  <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                    Try changing your search or filters.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("all");
                      setPriorityFilter("all");
                    }}
                    className="mt-5 rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                  >
                    Clear filters
                  </button>
                </div>
              )}

            {/* Task cards */}
            {!loading &&
              !error &&
              filteredTasks.length > 0 && (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

                  {filteredTasks.map((task) => {
                    const statusStyle = getStatusStyle(task.status);
                    const priorityStyle = getPriorityStyle(
                      task.priority
                    );

                    const projectId = getProjectId(task.project);
                    const projectName = getProjectName(task);
                    const dueDate = formatDate(task.due_date);
                    const overdue = isOverdue(
                      task.due_date,
                      task.status
                    );

                    return (
                      <Link
                        key={task.id}
                        href={
                          projectId
                            ? `/dashboard/projects/${projectId}`
                            : "/dashboard/tasks"
                        }
                        className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        {/* Card header */}
                        <div className="mb-5 flex items-start justify-between gap-4">

                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">
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
                                d="M9 5h6M9 9h6M9 13h4M6.75 3.75h10.5A1.75 1.75 0 0 1 19 5.5v13A1.75 1.75 0 0 1 17.25 20H6.75A1.75 1.75 0 0 1 5 18.5v-13A1.75 1.75 0 0 1 6.75 3.75Z"
                              />
                            </svg>
                          </div>

                          <span className="text-slate-300 transition group-hover:text-teal-600">
                            →
                          </span>

                        </div>

                        {/* Task title */}
                        <h4 className="text-lg font-semibold text-slate-900">
                          {task.title}
                        </h4>

                        {/* Description */}
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                          {task.description ||
                            "No description provided."}
                        </p>

                        {/* Project */}
                        <div className="mt-4">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Project
                          </p>

                          <p className="mt-1 text-sm font-medium text-slate-700">
                            {projectName}
                          </p>
                        </div>

                        {/* Status / Priority */}
                        <div className="mt-5 flex flex-wrap gap-2">

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle.background} ${statusStyle.text}`}
                          >
                            {statusStyle.label}
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityStyle.background} ${priorityStyle.text}`}
                          >
                            {priorityStyle.label} priority
                          </span>

                        </div>

                        {/* Due date */}
                        <div className="mt-5 border-t border-slate-100 pt-4">
                          {dueDate ? (
                            <p
                              className={`text-xs ${
                                overdue
                                  ? "font-semibold text-rose-600"
                                  : "text-slate-400"
                              }`}
                            >
                              {overdue
                                ? `Overdue · Due ${dueDate}`
                                : `Due ${dueDate}`}
                            </p>
                          ) : (
                            <p className="text-xs text-slate-400">
                              No due date
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
