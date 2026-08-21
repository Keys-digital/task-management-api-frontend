"use client";

import { useState } from "react";
import Link from "next/link";
import { useUserProfile } from "@/components/UserProfileContext";

type ActivePage = "dashboard" | "projects" | "tasks" | "profile" | "settings";

type DashboardSidebarProps = {
  activePage: ActivePage;
};

const navigation = [
  {
    label: "Dashboard",
    href: "/dashboard",
    key: "dashboard" as ActivePage,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-4 w-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
        />
      </svg>
    ),
  },
  {
    label: "Projects",
    href: "/dashboard/projects",
    key: "projects" as ActivePage,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-4 w-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 7.5h5.086a2.25 2.25 0 0 1 1.591.659l1.328 1.328a2.25 2.25 0 0 0 1.591.659h6.904a1.75 1.75 0 0 1 1.75 1.75v6.354a1.75 1.75 0 0 1-1.75 1.75H5.5a1.75 1.75 0 0 1-1.75-1.75V7.5Z"
        />
      </svg>
    ),
  },
  {
    label: "Tasks",
    href: "/dashboard/tasks",
    key: "tasks" as ActivePage,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-4 w-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    key: "settings" as ActivePage,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-4 w-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        />
      </svg>
    ),
  },
];

export default function DashboardSidebar({
  activePage,
}: DashboardSidebarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarImgError, setSidebarImgError] = useState(false);
  const { user, initials, avatarUrl } = useUserProfile();

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const displayName =
    user?.profile?.full_name ||
    (user?.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : "") ||
    user?.username ||
    "User";

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden w-56 flex-col justify-between border-r border-slate-200 bg-white px-5 py-7 md:flex">
        <div>
          <div className="mb-8 px-2">
            <Link href="/dashboard" className="group block">
              <h1 className="text-2xl font-bold tracking-tight text-teal-700 transition group-hover:text-teal-800">
                TaskFlo
              </h1>
              <p className="mt-1 text-xs text-slate-400">
                Manage work. Keep moving.
              </p>
            </Link>
          </div>

          <nav className="space-y-1.5">
            {navigation.map((item) => {
              const isActive = activePage === item.key;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={
                    isActive
                      ? "flex items-center gap-3 rounded-xl bg-teal-50 px-3.5 py-2.5 text-sm font-semibold text-teal-700"
                      : "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  }
                >
                  <span className={isActive ? "text-teal-600" : "text-slate-400"}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card at bottom of sidebar */}
        <div className="border-t border-slate-100 pt-4">
          <Link
            href="/dashboard/profile"
            className={
              activePage === "profile"
                ? "flex items-center gap-3 rounded-xl bg-teal-50 p-2.5 text-teal-700"
                : "group flex items-center gap-3 rounded-xl p-2.5 text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
            }
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal-100 text-xs font-semibold text-teal-700 ring-1 ring-teal-200">
              {avatarUrl && !sidebarImgError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={displayName}
                  onError={() => setSidebarImgError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-800">
                {displayName}
              </p>
              <p className="truncate text-[11px] text-slate-400">
                @{user?.username || "profile"}
              </p>
            </div>
          </Link>
        </div>
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

          <Link
            href="/dashboard/profile"
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-teal-100 text-xs font-semibold text-teal-700"
          >
            {avatarUrl && !sidebarImgError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={displayName}
                onError={() => setSidebarImgError(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </Link>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <>
            {/* Overlay */}
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={closeMobileMenu}
              className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs"
            />

            {/* Drawer */}
            <aside className="fixed inset-y-0 left-0 z-50 flex w-64 max-w-[80vw] flex-col justify-between border-r border-slate-200 bg-white px-5 py-7 shadow-2xl">
              <div>
                <div className="mb-8 flex items-start justify-between">
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

                <nav className="space-y-1.5">
                  {navigation.map((item) => {
                    const isActive = activePage === item.key;

                    return (
                      <Link
                        key={item.key}
                        href={item.href}
                        onClick={closeMobileMenu}
                        className={
                          isActive
                            ? "flex items-center gap-3 rounded-xl bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-700"
                            : "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                        }
                      >
                        <span className={isActive ? "text-teal-600" : "text-slate-400"}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Mobile Drawer Profile Footer */}
              <div className="border-t border-slate-100 pt-4">
                <Link
                  href="/dashboard/profile"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal-100 text-xs font-semibold text-teal-700">
                    {avatarUrl && !sidebarImgError ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        onError={() => setSidebarImgError(true)}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-800">
                      {displayName}
                    </p>
                    <p className="truncate text-[11px] text-slate-400">
                      @{user?.username || "profile"}
                    </p>
                  </div>
                </Link>
              </div>
            </aside>
          </>
        )}
      </div>
    </>
  );
}