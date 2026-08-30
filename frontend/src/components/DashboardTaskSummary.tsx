"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Task,
  Project,
  selectDashboardTasks,
  isTaskOverdue,
  formatDueDate,
  getProjectId,
  getProjectName,
  getTodayDateString,
  normalizeDueDateString,
} from "@/lib/taskSummary";

type DashboardTaskSummaryProps = {
  tasks: Task[];
  projects?: Project[];
  loading?: boolean;
  error?: string;
};

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
  completed: {
    label: "Completed",
    background: "bg-emerald-100",
    text: "text-emerald-700",
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

const getStatusStyle = (status: string) => {
  const lower = status.toLowerCase();
  return (
    STATUS_STYLES[status] ||
    STATUS_STYLES[lower] || {
      label: status.replace("_", " "),
      background: "bg-slate-100",
      text: "text-slate-700",
    }
  );
};

const getPriorityStyle = (priority: string) => {
  const lower = priority.toLowerCase();
  return (
    PRIORITY_STYLES[priority] ||
    PRIORITY_STYLES[lower] || {
      label: priority,
      background: "bg-slate-100",
      text: "text-slate-700",
    }
  );
};

export default function DashboardTaskSummary({
  tasks,
  projects = [],
  loading = false,
  error = "",
}: DashboardTaskSummaryProps) {
  const projectsMap = useMemo(() => {
    return new Map(projects.map((p) => [p.id, p.name]));
  }, [projects]);

  const { selected: selectedTasks } = useMemo(() => {
    return selectDashboardTasks(tasks);
  }, [tasks]);

  const todayStr = useMemo(() => getTodayDateString(), []);

  return (
    <section className="mb-10" aria-label="Task Summary">
      {/* Section Header */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">
            Tasks Requiring Attention
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Your most urgent overdue and upcoming tasks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/tasks"
            className="text-sm font-semibold text-teal-700 transition hover:text-teal-800"
          >
            View all tasks →
          </Link>

          <Link
            href="/dashboard/projects"
            className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
          >
            + Add Task
          </Link>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((index) => (
            <div
              key={index}
              className="animate-pulse rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100"
            >
              <div className="mb-5 flex items-start justify-between">
                <div className="h-11 w-11 rounded-full bg-slate-200" />
                <div className="h-4 w-4 rounded bg-slate-200" />
              </div>
              <div className="h-5 w-3/4 rounded bg-slate-200" />
              <div className="mt-3 h-4 w-full rounded bg-slate-100" />
              <div className="mt-2 h-4 w-2/3 rounded bg-slate-100" />
              <div className="mt-4 h-3 w-1/4 rounded bg-slate-100" />
              <div className="mt-1 h-4 w-1/2 rounded bg-slate-200" />
              <div className="mt-5 flex gap-2">
                <div className="h-6 w-16 rounded-full bg-slate-200" />
                <div className="h-6 w-20 rounded-full bg-slate-200" />
              </div>
              <div className="mt-5 border-t border-slate-100 pt-4">
                <div className="h-3 w-28 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="rounded-2xl bg-red-50 p-5 text-sm text-red-700 shadow-sm ring-1 ring-red-100">
          <p className="font-semibold">Unable to load task summary</p>
          <p className="mt-1 text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Empty state: You're all caught up */}
      {!loading && !error && selectedTasks.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m4.5 12.75 6 6 9-13.5"
              />
            </svg>
          </div>

          <h4 className="mt-4 text-lg font-semibold text-slate-800">
            You&apos;re all caught up!
          </h4>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            No overdue or upcoming tasks need your attention.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard/projects"
              className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
            >
              + Add Task
            </Link>

            <Link
              href="/dashboard/tasks"
              className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              View all tasks
            </Link>
          </div>
        </div>
      )}      {/* Populated Task Cards (Max 3) */}
      {!loading && !error && selectedTasks.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {selectedTasks.map((task) => {
            const overdue = isTaskOverdue(task.due_date, task.status, todayStr, task.due_time, task.is_overdue);
            const projectId = getProjectId(task.project);
            const projectName = getProjectName(task, projectsMap);
            const dueDateFormatted = formatDueDate(task.due_date);
            const statusStyle = getStatusStyle(task.status);
            const priorityStyle = getPriorityStyle(task.priority);

            const isDueToday =
              normalizeDueDateString(task.due_date) === todayStr;

            const targetHref = projectId
              ? `/dashboard/projects/${projectId}`
              : "/dashboard/tasks";

            return (
              <Link
                key={task.id}
                href={targetHref}
                className={`group rounded-2xl p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                  overdue
                    ? "bg-rose-50/70 border border-rose-200 ring-1 ring-rose-200"
                    : "bg-white ring-1 ring-slate-100"
                }`}
              >
                {/* Card Top Row: Icon, Overdue Indicator, Arrow */}
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                        overdue
                          ? "bg-rose-100 text-rose-700"
                          : "bg-teal-100 text-teal-700"
                      }`}
                      aria-label={overdue ? "Overdue task" : "Task"}
                    >
                      {overdue ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="h-5 w-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                          />
                        </svg>
                      ) : (
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
                      )}
                    </div>

                    {overdue && (
                      <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-rose-700">
                        Overdue
                      </span>
                    )}
                  </div>

                  <span
                    className={`transition ${
                      overdue
                        ? "text-rose-400 group-hover:text-rose-700"
                        : "text-slate-300 group-hover:text-teal-600"
                    }`}
                  >
                    →
                  </span>
                </div>

                {/* Task Title */}
                <h4 className="text-lg font-semibold text-slate-900 line-clamp-1">
                  {task.title}
                </h4>

                {/* Task Description */}
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                  {task.description || "No description provided."}
                </p>

                {/* Project Name */}
                <div className="mt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Project
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {projectName}
                  </p>
                </div>

                {/* Status / Priority badges */}
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

                {/* Due Date Row */}
                <div
                  className={`mt-5 border-t pt-4 ${
                    overdue ? "border-rose-200/70 dark:border-rose-900/60" : "border-slate-100 dark:border-slate-800"
                  }`}
                >
                  <p
                    className={`text-xs ${
                      overdue
                        ? "font-semibold text-rose-600 dark:text-rose-400"
                        : "text-slate-600 dark:text-slate-300 font-medium"
                    }`}
                  >
                    {overdue
                      ? `Overdue · Due ${dueDateFormatted}${task.due_time ? ` at ${task.due_time.slice(0, 5)}` : ""}`
                      : isDueToday
                      ? `Due Today · ${dueDateFormatted}${task.due_time ? ` at ${task.due_time.slice(0, 5)}` : ""}`
                      : `Due ${dueDateFormatted}${task.due_time ? ` at ${task.due_time.slice(0, 5)}` : ""}`}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
