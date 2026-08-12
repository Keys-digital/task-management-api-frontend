"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Project = {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const PROJECT_ICONS = [
  {
    background: "bg-teal-100",
    icon: "text-teal-700",
  },
  {
    background: "bg-blue-100",
    icon: "text-blue-700",
  },
  {
    background: "bg-violet-100",
    icon: "text-violet-700",
  },
  {
    background: "bg-rose-100",
    icon: "text-rose-700",
  },
  {
    background: "bg-amber-100",
    icon: "text-amber-700",
  },
  {
    background: "bg-emerald-100",
    icon: "text-emerald-700",
  },
];

const getProjectIconStyle = (projectId: number) =>
  PROJECT_ICONS[projectId % PROJECT_ICONS.length];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");

  const [search, setSearch] = useState("");

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        window.location.href = "/";
        return;
      }

      const response = await fetch(`${API_URL}/api/projects/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/";
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to load projects.");
      }

      const data = await response.json();
      setProjects(data);
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
  fetchProjects();
}, []);

useEffect(() => {
  const storedUsername = localStorage.getItem("username");

  if (storedUsername) {
    setUsername(storedUsername);
  }
}, []);

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/";
  };

  const filteredProjects = projects.filter((project) => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return (
      project.name.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query)
    );
  });

  return (
    <main className="min-h-screen bg-[#f7f8f6] text-slate-900">
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white px-6 py-7 md:flex">
          <div className="mb-10">
            <h1 className="text-2xl font-bold tracking-tight text-teal-700">
              TaskFlo
            </h1>

            <p className="mt-1 text-xs text-slate-400">
              Manage work. Keep moving.
            </p>
          </div>

          <nav className="space-y-2">
            <Link
              href="/dashboard"
              className="flex items-center rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              Dashboard
            </Link>

            <Link
              href="/dashboard/projects"
              className="flex items-center rounded-xl bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-700"
            >
              Projects
            </Link>

            <Link
              href="/dashboard/tasks"
              className="flex items-center rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              Tasks
            </Link>
          </nav>

          <div className="mt-auto">
            <button
              type="button"
              onClick={logout}
              className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
            >
              Sign out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <section className="flex-1">
          {/* Top bar */}
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5 md:px-10">
            <div>
              <p className="text-sm text-slate-400">
                Workspace
              </p>

              <h2 className="text-xl font-semibold text-slate-900">
                Projects
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-800">
  {username || "User"}
</p>

                <p className="text-xs text-slate-400">
                  Workspace owner
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 font-semibold text-teal-700">
  {(username || "User").charAt(0).toUpperCase()}
</div>
            </div>
          </header>

          <div className="mx-auto max-w-7xl px-6 py-8 md:px-10">
            {/* Page heading */}
            <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <h3 className="text-3xl font-bold tracking-tight text-slate-900">
                  Your Projects
                </h3>

                <p className="mt-2 text-slate-500">
                  Review and manage all projects belonging to your account.
                </p>
              </div>

              <Link
                href="/dashboard/projects/new"
                className="inline-flex w-fit rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
              >
                + New Project
              </Link>
            </div>

            {/* Search */}
            <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <label
                htmlFor="project-search"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Search projects
              </label>

              <input
                id="project-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by project name or description..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </div>

            {/* Loading */}
            {loading && (
              <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
                Loading your projects...
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="rounded-2xl bg-red-50 p-5 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && projects.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                <h4 className="text-lg font-semibold text-slate-800">
                  No projects yet
                </h4>

                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  Create your first project and start organizing your work.
                </p>

                <Link
                  href="/dashboard/projects/new"
                  className="mt-5 inline-block rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
                >
                  Create your first project
                </Link>
              </div>
            )}

            {/* No search results */}
            {!loading &&
              !error &&
              projects.length > 0 &&
              filteredProjects.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                  <h4 className="text-lg font-semibold text-slate-800">
                    No matching projects
                  </h4>

                  <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                    Try a different project name or description.
                  </p>

                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="mt-5 rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                  >
                    Clear search
                  </button>
                </div>
              )}

            {/* Project cards */}
            {!loading &&
              !error &&
              filteredProjects.length > 0 && (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {filteredProjects.map((project) => {
                    const iconStyle = getProjectIconStyle(project.id);

                    return (
                      <Link
                        key={project.id}
                        href={`/dashboard/projects/${project.id}`}
                        className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="mb-5 flex items-start justify-between">
                          <div
                            className={`flex h-11 w-11 items-center justify-center rounded-full ${iconStyle.background} ${iconStyle.icon}`}
                            aria-label="Project"
                          >
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
                                d="M3.75 7.5h5.086a2.25 2.25 0 0 1 1.591.659l1.328 1.328a2.25 2.25 0 0 0 1.591.659h6.904a1.75 1.75 0 0 1 1.75 1.75v6.354a1.75 1.75 0 0 1-1.75 1.75H5.5a1.75 1.75 0 0 1-1.75-1.75V7.5Z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3.75 7.5V6.25A1.75 1.75 0 0 1 5.5 4.5h4.086a2.25 2.25 0 0 1 1.591.659l1.328 1.328a2.25 2.25 0 0 0 1.591.659h1.995"
                              />
                            </svg>
                          </div>

                          <span className="text-slate-300 transition group-hover:text-teal-600">
                            →
                          </span>
                        </div>

                        <h4 className="text-lg font-semibold text-slate-900">
                          {project.name}
                        </h4>

                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                          {project.description || "No description provided."}
                        </p>

                        <p className="mt-5 text-xs text-slate-400">
                          Updated{" "}
                          {new Date(
                            project.updated_at
                          ).toLocaleDateString()}
                        </p>
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