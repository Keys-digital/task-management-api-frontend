"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardSidebar from "@/components/DashboardSidebar";
import UserMenu from "@/components/UserMenu";

type Project = {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const PROJECT_CARD_STYLES = [
  {
    card: "bg-teal-50",
    icon: "bg-teal-100 text-teal-700",
  },
  {
    card: "bg-blue-50",
    icon: "bg-blue-100 text-blue-700",
  },
  {
    card: "bg-violet-50",
    icon: "bg-violet-100 text-violet-700",
  },
  {
    card: "bg-rose-50",
    icon: "bg-rose-100 text-rose-700",
  },
  {
    card: "bg-amber-50",
    icon: "bg-amber-100 text-amber-700",
  },
  {
    card: "bg-emerald-50",
    icon: "bg-emerald-100 text-emerald-700",
  },
  {
    card: "bg-cyan-50",
    icon: "bg-cyan-100 text-cyan-700",
  },
  {
    card: "bg-indigo-50",
    icon: "bg-indigo-100 text-indigo-700",
  },
];

const getProjectCardStyle = (projectId: number) => {
  return (
    PROJECT_CARD_STYLES[
      projectId % PROJECT_CARD_STYLES.length
    ] ?? PROJECT_CARD_STYLES[0]
  );
};

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          window.location.href = "/";
          return;
        }
const storedUsername = localStorage.getItem("username");

if (storedUsername) {
  setUsername(storedUsername);
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

    fetchProjects();
  }, []);

  // Debugging: log theme state and resolved page background variable
  useEffect(() => {
    try {
      const root = document.documentElement;
      const pageBg = getComputedStyle(root).getPropertyValue('--color-page-bg');
      // eslint-disable-next-line no-console
      console.debug('[Theme Debug] html.classList=', Array.from(root.classList));
      // eslint-disable-next-line no-console
      console.debug('[Theme Debug] --color-page-bg=', pageBg.trim());
      const mainEl = document.querySelector('main');
      if (mainEl) {
        // eslint-disable-next-line no-console
        console.debug('[Theme Debug] main background computed=', getComputedStyle(mainEl).backgroundColor);
      }
    } catch (e) {}
  }, []);

  return (
    <main className="min-h-screen bg-[var(--color-page-bg)] text-slate-900">
      <div className="flex min-h-screen flex-col md:flex-row">

        {/* Sidebar */}
        <DashboardSidebar activePage="dashboard" />
        
        {/* Main content */}
        <section className="flex-1">

          {/* Top bar */}
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5 md:px-10">

            <div>
              <p className="text-sm text-slate-400">
                Workspace
              </p>

              <h2 className="text-xl font-semibold text-slate-900">
                Dashboard
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

        {/* UserMenu Avartar dropdown */}
<UserMenu />
              

            </div>

          </header>

          {/* Dashboard content */}
          <div className="mx-auto max-w-7xl px-6 py-8 md:px-10">

            {/* Welcome */}
            <div className="mb-8">
              <h3 className="text-3xl font-bold tracking-tight text-slate-900">
                Welcome back, {username || "User"}
              </h3>

              <p className="mt-2 text-slate-500">
                Here&apos;s what&apos;s happening with your work.
              </p>
            </div>

            {/* Summary */}
            <div className="mb-10 grid gap-4 sm:grid-cols-2">

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                <p className="text-sm font-medium text-slate-500">
                  Projects
                </p>

                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {projects.length}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  Projects in your workspace
                </p>
              </div>

              <div className="rounded-2xl bg-teal-700 p-6 text-white shadow-sm">
                <p className="text-sm font-medium text-teal-100">
                  TaskFlo
                </p>

                <p className="mt-3 text-2xl font-bold">
                  Your work, organized.
                </p>

                <p className="mt-2 text-sm text-teal-100">
                  Create projects and start organizing your tasks.
                </p>
              </div>

            </div>

            {/* Projects */}
            <div>

              <div className="mb-5 flex items-center justify-between">

                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Your Projects
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Projects belonging to your account.
                  </p>
                </div>

                <Link
                  href="/dashboard/projects/new"
                  className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
                >
                  + New Project
                </Link>

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

              {/* Project cards */}
              {!loading && !error && projects.length > 0 && (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

                  {projects.map((project) => {
                    const projectStyle = getProjectCardStyle(project.id);

                    return (
                      <Link
                        key={project.id}
                        href={`/dashboard/projects/${project.id}`}
                        className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md"
                      >

                        <div className="mb-5 flex items-start justify-between">

                          {/* Project avatar */}
                          <div
  className={`flex h-11 w-11 items-center justify-center rounded-full ${projectStyle.icon}`}
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

                        <p className="mt-5 text-xs text-slate-200">
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

          </div>

        </section>
      </div>
    </main>
  );
}