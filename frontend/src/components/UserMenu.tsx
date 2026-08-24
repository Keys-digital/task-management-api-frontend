"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider/ThemeProvider";
import { useUserProfile } from "@/components/UserProfileContext";

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { user, loading, initials, avatarUrl } = useUserProfile();
  const { preference, setTheme } = useTheme();

  // Reset imageError if avatarUrl changes
  useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("username");
    window.location.href = "/";
  };

  const selectTheme = (selectedTheme: "system" | "light" | "dark") => {
    setTheme(selectedTheme);
  };

  const displayName =
    user?.profile?.full_name ||
    (user?.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : "") ||
    user?.username ||
    "User";

  const displayEmail = user?.email || "";

  return (
    <div ref={menuRef} className="relative hidden md:block">
      {loading || !user ? (
        <div className="h-10 w-10 rounded-full bg-slate-200 animate-pulse" />
      ) : (
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="Open user menu"
          className="group flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-teal-100 ring-2 ring-transparent transition hover:ring-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          {avatarUrl && !imageError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              onError={() => setImageError(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-sm font-semibold text-teal-700 group-hover:text-teal-800">
              {initials}
            </span>
          )}
        </button>
      )}

      {open && (
        <div
          className="absolute right-0 top-12 z-50 w-64 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl ring-1 ring-slate-900/5 transition"
          role="menu"
        >
          {/* User info summary */}
          <div className="border-b border-slate-100 px-3 py-3">
            {loading || !user ? (
              <div className="flex items-center gap-3 animate-pulse">
                <div className="h-9 w-9 shrink-0 rounded-full bg-slate-200" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="h-3.5 w-24 rounded bg-slate-200" />
                  <div className="h-2.5 w-32 rounded bg-slate-100" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal-100 text-sm font-semibold text-teal-700">
                  {avatarUrl && !imageError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      onError={() => setImageError(true)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {displayName}
                  </p>
                  {displayEmail && (
                    <p className="truncate text-xs text-slate-400">
                      {displayEmail}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <div className="py-1">
            <Link
              href="/dashboard/profile"
              onClick={() => setOpen(false)}
              role="menuitem"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4 text-slate-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
              <span>Profile</span>
            </Link>

            <Link
              href="/dashboard/settings"
              onClick={() => setOpen(false)}
              role="menuitem"
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4 text-slate-400"
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
              <span>Settings</span>
            </Link>
          </div>

          <div className="my-1 border-t border-slate-100" />

          {/* Theme Switcher */}
          <div className="px-3 py-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Appearance
            </p>
          </div>

          <button
            type="button"
            role="menuitemradio"
            aria-checked={preference === "system"}
            onClick={() => selectTheme("system")}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
              preference === "system"
                ? "bg-teal-50 font-medium text-teal-700"
                : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span>Use system default</span>
          </button>

          <button
            type="button"
            role="menuitemradio"
            aria-checked={preference === "light"}
            onClick={() => selectTheme("light")}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
              preference === "light"
                ? "bg-teal-50 font-medium text-teal-700"
                : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span>Light mode</span>
          </button>

          <button
            type="button"
            role="menuitemradio"
            aria-checked={preference === "dark"}
            onClick={() => selectTheme("dark")}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
              preference === "dark"
                ? "bg-teal-50 font-medium text-teal-700"
                : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span>Night mode</span>
          </button>

          <div className="my-1 border-t border-slate-100" />

          {/* Sign Out */}
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
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
                d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
              />
            </svg>
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}