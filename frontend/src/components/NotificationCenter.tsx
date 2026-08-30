"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { authFetch } from "@/lib/api";
import { useUserProfile } from "@/components/UserProfileContext";

export type AppNotification = {
  id: number;
  task: number | null;
  task_title: string | null;
  project: number | null;
  project_id: number | null;
  project_name: string | null;
  notification_type: "reminder" | "overdue" | "project_activity" | "system" | string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

const formatRelativeTime = (isoString?: string) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 45) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>("default");
  const menuRef = useRef<HTMLDivElement>(null);
  const knownNotificationIds = useRef<Set<number>>(new Set());
  const isInitialFetch = useRef(true);
  const { user } = useUserProfile();

  // Check browser Notification API permission
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermissionState(Notification.permission);
    }
  }, []);

  const requestDesktopPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        setPermissionState(perm);
      } catch {
        // Fallback for older browsers
      }
    }
  };

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      if (!token) return;

      // 1. Trigger server check-reminders for sync
      try {
        await authFetch("/api/projects/notifications/check-reminders/", { method: "POST" });
      } catch {
        // Non-blocking if offline
      }

      // 2. Fetch current notification list
      const res = await authFetch("/api/projects/notifications/");
      if (!res.ok) return;

      const data = await res.json();
      const items: AppNotification[] = Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : [];
      const unread: number = typeof data.unread_count === "number" ? data.unread_count : items.filter((n) => !n.read).length;

      // Trigger Web Desktop Notification for newly discovered unread items
      if (
        !isInitialFetch.current &&
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        items.forEach((item) => {
          if (!item.read && !knownNotificationIds.current.has(item.id)) {
            try {
              new Notification(item.title, {
                body: item.message,
                icon: "/icon.png",
              });
            } catch {
              // Notification creation failed
            }
          }
        });
      }

      // Update known IDs
      items.forEach((item) => knownNotificationIds.current.add(item.id));
      isInitialFetch.current = false;

      setNotifications(items);
      setUnreadCount(unread);
    } catch {
      // Ignored
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Periodic sync every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id: number) => {
    try {
      const res = await authFetch(`/api/projects/notifications/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch {
      // Ignored
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await authFetch("/api/projects/notifications/mark-all-read/", {
        method: "POST",
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch {
      // Ignored
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "reminder":
        return (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
        );
      case "overdue":
        return (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
        );
      case "project_activity":
        return (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 7.5h5.086a2.25 2.25 0 0 1 1.591.659l1.328 1.328a2.25 2.25 0 0 0 1.591.659h6.904a1.75 1.75 0 0 1 1.75 1.75v6.354a1.75 1.75 0 0 1-1.75 1.75H5.5a1.75 1.75 0 0 1-1.75-1.75V7.5Z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div ref={menuRef} className="relative">
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => {
          setOpen((curr) => !curr);
          if (!open) fetchNotifications(true);
        }}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Drawer */}
      {open && (
        <div
          className="absolute right-0 top-12 z-50 w-80 sm:w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-900/5 transition"
          role="dialog"
          aria-label="Notification Center"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs font-medium text-teal-700 hover:text-teal-800 hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Desktop Notification Permission Banner */}
          {permissionState === "default" && (
            <div className="flex items-center justify-between bg-teal-50/70 px-4 py-2.5 text-xs border-b border-teal-100">
              <div className="flex items-center gap-2 text-teal-900">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-teal-700 shrink-0">
                  <path fillRule="evenodd" d="M10 2a6 6 0 0 0-6 6v3.586l-.707.707A1 1 0 0 0 4 14h12a1 1 0 0 0 .707-1.707L16 11.586V8a6 6 0 0 0-6-6ZM10 18a3 3 0 0 1-3-3h6a3 3 0 0 1-3 3Z" clipRule="evenodd" />
                </svg>
                <span>Enable desktop alerts</span>
              </div>
              <button
                type="button"
                onClick={requestDesktopPermission}
                className="rounded-lg bg-teal-700 px-2.5 py-1 font-semibold text-white hover:bg-teal-800 transition"
              >
                Enable
              </button>
            </div>
          )}

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">
                <svg className="mx-auto h-6 w-6 animate-spin text-teal-600 mb-2" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Checking notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-800">All caught up!</p>
                <p className="mt-1 text-xs text-slate-400">No new task reminders or activity alerts.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 p-3.5 transition hover:bg-slate-50 ${
                    !notif.read ? "bg-teal-50/30" : "bg-white"
                  }`}
                >
                  {getTypeIcon(notif.notification_type)}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="truncate text-xs font-bold text-slate-900">
                        {notif.title}
                      </p>
                      <span className="shrink-0 text-[10px] text-slate-400">
                        {formatRelativeTime(notif.created_at)}
                      </span>
                    </div>

                    <p className="mt-0.5 text-xs text-slate-600 leading-4 line-clamp-2">
                      {notif.message}
                    </p>

                    <div className="mt-2 flex items-center justify-between">
                      {notif.project_id ? (
                        <Link
                          href={`/dashboard/projects/${notif.project_id}`}
                          onClick={() => {
                            if (!notif.read) markAsRead(notif.id);
                            setOpen(false);
                          }}
                          className="text-[11px] font-medium text-teal-700 hover:text-teal-800 hover:underline"
                        >
                          View {notif.project_name || "Project"} →
                        </Link>
                      ) : (
                        <span />
                      )}

                      {!notif.read && (
                        <button
                          type="button"
                          onClick={() => markAsRead(notif.id)}
                          className="text-[11px] font-medium text-slate-500 hover:text-slate-800"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
