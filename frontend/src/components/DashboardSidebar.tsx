"use client";

import { useState } from "react";
import Link from "next/link";

type ActivePage = "dashboard" | "projects" | "tasks";

type DashboardSidebarProps = {
  activePage: ActivePage;
};

const navigation = [
  {
    label: "Dashboard",
    href: "/dashboard",
    key: "dashboard" as ActivePage,
  },
  {
    label: "Projects",
    href: "/dashboard/projects",
    key: "projects" as ActivePage,
  },
  {
    label: "Tasks",
    href: "/dashboard/tasks",
    key: "tasks" as ActivePage,
  },
];

export default function DashboardSidebar({
  activePage,
}: DashboardSidebarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    // Clear username so ThemeProvider won't re-apply authenticated theme
    localStorage.removeItem("username");
    // Clear theme classes immediately to avoid leakage onto unauthenticated pages
    try {
      document.documentElement.classList.remove("light", "dark");
    } catch (e) {}
    window.location.href = "/";
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden w-40 flex-col border-r border-slate-200 bg-white px-6 py-7 md:flex">
        <div className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight text-teal-700">
            TaskFlo
          </h1>

          <p className="mt-1 text-xs text-slate-400">
            Manage work. Keep moving.
          </p>
        </div>

        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = activePage === item.key;

            return (
              <Link
                key={item.key}
                href={item.href}
                className={
                  isActive
                    ? "flex items-center rounded-xl bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-700"
                    : "flex items-center rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        {/* Mobile Top Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.8"
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight text-teal-700">
              TaskFlo
            </h1>

            <p className="text-[10px] text-slate-400">
              Manage work. Keep moving.
            </p>
          </div>

          <div className="h-10 w-10" />
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <>
            {/* Overlay */}
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={closeMobileMenu}
              className="fixed inset-0 z-40 bg-slate-900/30"
            />

            {/* Drawer */}
            <aside className="fixed inset-y-0 left-0 z-50 flex w-48 max-w-[80vw] flex-col border-r border-slate-200 bg-white px-5 py-7 shadow-xl">
              <div className="mb-10 flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-teal-700">
                    TaskFlo
                  </h1>

                  <p className="mt-1 text-xs text-slate-400">
                    Manage work. Keep moving.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeMobileMenu}
                  aria-label="Close navigation menu"
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.8"
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 6l12 12M18 6L6 18"
                    />
                  </svg>
                </button>
              </div>

              <nav className="space-y-2">
                {navigation.map((item) => {
                  const isActive = activePage === item.key;

                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={closeMobileMenu}
                      className={
                        isActive
                          ? "flex items-center rounded-xl bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-700"
                          : "flex items-center rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                      }
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-auto">
               </div>
            </aside>
          </>
        )}
      </div>
    </>
  );
}