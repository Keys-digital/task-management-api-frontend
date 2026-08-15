"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/ThemeProvider/ThemeProvider";

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [username, setUsername] = useState("");

  const { preference, setTheme } = useTheme();

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");

    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

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
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("username");

    // Do not modify the user's saved appearance.
    // The preference remains stored on the backend and will
    // be restored from /api/auth/me/ when the user logs in again.

    window.location.href = "/";
  };

  const selectTheme = (
    selectedTheme: "system" | "light" | "dark"
  ) => {
    setTheme(selectedTheme);
  };

  const initial = username
    ? username.charAt(0).toUpperCase()
    : null;

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open user menu"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-700 transition hover:bg-teal-200"
      >
        {initial ? (
          <span className="text-sm font-semibold">
            {initial}
          </span>
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20 21a8 8 0 0 0-16 0"
            />
            <circle
              cx="12"
              cy="7"
              r="4"
            />
          </svg>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"
          role="menu"
        >
          <div className="px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Appearance
            </p>
          </div>

          <button
            type="button"
            role="menuitemradio"
            aria-checked={preference === "system"}
            onClick={() => selectTheme("system")}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${
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
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${
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
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${
              preference === "dark"
                ? "bg-teal-50 font-medium text-teal-700"
                : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span>Night mode</span>
          </button>

          <div className="my-2 border-t border-slate-100" />

          <button
            type="button"
            onClick={logout}
            className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}