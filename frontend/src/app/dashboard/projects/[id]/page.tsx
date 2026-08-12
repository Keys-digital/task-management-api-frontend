"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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
  due_date: string | null;
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
const [taskDueDate, setTaskDueDate] = useState("");

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

        const projectTasks = tasksData.filter(
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
  setTaskDueDate(task.due_date || "");
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
          due_date: taskDueDate || null,
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
      <main className="min-h-screen bg-[#f7f8f6] px-6 py-10">
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
      <main className="min-h-screen bg-[#f7f8f6] px-6 py-10">
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
    <main className="min-h-screen bg-[#f7f8f6] text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-10 md:px-10">

        {/* Navigation */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-500 transition hover:text-teal-700"
          >
            ← Back to Dashboard
          </Link>
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

                  <p className="mt-3 max-w-2xl leading-7 text-slate-500">
                    {project.description ||
                      "No description provided."}
                  </p>
                </div>

                <div className="flex gap-3">
<button
  type="button"
  onClick={() => setEditing(true)}
  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
>
  Edit
</button>

                  <button
                    type="button"
                    onClick={deleteProject}
                    disabled={deleting}
                    className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-5 text-xs text-slate-400">
                Updated{" "}
                {new Date(
                  project.updated_at
                ).toLocaleDateString()}
              </div>
            </>
          ) : (
            <form
              onSubmit={updateProject}
              className="space-y-6"
            >
              <div>
                <h1 className="text-2xl font-bold">
                  Edit Project
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Update your project details.
                </p>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="project-name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Project name
                </label>

                <input
                  id="project-name"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
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
                Add a task to start organizing the work for this
                project.
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

    return (
      <div
        key={task.id}
        className={`rounded-2xl p-5 shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-md ${styles.card}`}
      >
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

          <div className="min-w-0">
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
            </div>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {task.description || "No description provided."}
            </p>

            {task.due_date && (
              <p className="mt-4 text-xs font-medium text-slate-500">
                Due {task.due_date}
              </p>
            )}
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
          Update the details and status of this task.
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
            onChange={(event) =>
              setTaskDescription(event.target.value)
            }
            rows={5}
            className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-3">
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
              onChange={(event) =>
                setTaskStatus(event.target.value)
              }
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
              onChange={(event) =>
                setTaskPriority(event.target.value)
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="edit-task-due-date"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Due date
            </label>

            <input
              id="edit-task-due-date"
              type="date"
              value={taskDueDate}
              onChange={(event) =>
                setTaskDueDate(event.target.value)
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
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