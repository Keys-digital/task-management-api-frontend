"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function NewTaskPage() {
  const params = useParams();
  const router = useRouter();

  const projectId = params.id;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
            due_date: dueDate || null,
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
    <main className="min-h-screen bg-[#f7f8f6] text-slate-900">
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
              Add a task to this project and keep the work moving.
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
                placeholder="e.g. Build authentication system"
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
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Describe what needs to be done..."
                rows={5}
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
                  <option value="done">Done</option>
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
                  onChange={(event) =>
                    setPriority(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

            </div>

            <div>
              <label
                htmlFor="task-due-date"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Due date
              </label>

              <input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
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