export type Project = {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
};

export type Task = {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  start_date?: string | null;
  start_time?: string | null;
  due_date?: string | null;
  due_time?: string | null;
  reminder_offset?: string;
  reminder_datetime?: string | null;
  is_overdue?: boolean;
  created_at?: string;
  updated_at?: string;
  project?: number | Project;
  project_name?: string;
};

export const isTaskCompleted = (status?: string): boolean => {
  if (!status) return false;
  return status.trim().toLowerCase() === "completed";
};

export const getProjectId = (project?: number | Project): number | null => {
  if (typeof project === "number") {
    return project;
  }
  if (project && typeof project === "object" && typeof project.id === "number") {
    return project.id;
  }
  return null;
};

export const getProjectName = (
  task: Task,
  projectsMap?: Map<number, string>
): string => {
  const projectId = getProjectId(task.project);

  if (projectId !== null && projectsMap?.has(projectId)) {
    return projectsMap.get(projectId)!;
  }

  if (task.project_name) {
    return task.project_name;
  }

  if (task.project && typeof task.project === "object" && task.project.name) {
    return task.project.name;
  }

  if (projectId !== null) {
    return `Project #${projectId}`;
  }

  return "Project";
};

export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const normalizeDueDateString = (dueDate?: string | null): string | null => {
  if (!dueDate) return null;
  // If dueDate has a full ISO string (e.g. 2026-08-15T00:00:00Z), extract YYYY-MM-DD
  const match = dueDate.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : dueDate;
};

export const isTaskOverdue = (
  dueDate?: string | null,
  status?: string,
  todayStr?: string,
  dueTime?: string | null,
  backendIsOverdue?: boolean
): boolean => {
  if (backendIsOverdue !== undefined) return backendIsOverdue;
  const normalizedDue = normalizeDueDateString(dueDate);
  if (!normalizedDue || isTaskCompleted(status)) {
    return false;
  }

  if (dueTime) {
    const timeStr = dueTime.length === 5 ? `${dueTime}:00` : dueTime;
    const dueDt = new Date(`${normalizedDue}T${timeStr}`);
    if (!isNaN(dueDt.getTime())) {
      return dueDt < new Date();
    }
  }

  const today = todayStr || getTodayDateString();
  return normalizedDue < today;
};

export const isTaskUpcoming = (
  dueDate?: string | null,
  status?: string,
  todayStr?: string
): boolean => {
  const normalizedDue = normalizeDueDateString(dueDate);
  if (!normalizedDue || isTaskCompleted(status)) {
    return false;
  }

  const today = todayStr || getTodayDateString();
  return normalizedDue >= today;
};

export const formatDueDate = (dueDate?: string | null): string | null => {
  if (!dueDate) {
    return null;
  }

  const normalizedDue = normalizeDueDateString(dueDate);
  if (!normalizedDue) {
    return null;
  }

  // Parse YYYY-MM-DD in local time
  const parts = normalizedDue.split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const dateObj = new Date(year, month, day);

    if (!Number.isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  }

  const parsedDate = new Date(dueDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return dueDate;
  }

  return parsedDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export type DashboardTaskSelection = {
  selected: Task[];
  overdue: Task[];
  upcoming: Task[];
  totalOverdue: number;
  totalUpcoming: number;
};

/**
 * Selects up to 3 tasks for the Dashboard Task Summary.
 * Priority:
 * 1. Overdue tasks first (sorted by due_date ASC - oldest missed first)
 * 2. Upcoming tasks second (sorted by due_date ASC - nearest upcoming first)
 * Hard maximum of 3 cards total.
 * Completed tasks and tasks without due dates are excluded.
 */
export const selectDashboardTasks = (
  tasks: Task[],
  todayStr?: string
): DashboardTaskSelection => {
  const today = todayStr || getTodayDateString();

  const overdueTasks: Task[] = [];
  const upcomingTasks: Task[] = [];

  for (const task of tasks) {
    if (!task.due_date || isTaskCompleted(task.status)) {
      continue;
    }

    const normDue = normalizeDueDateString(task.due_date);
    if (!normDue) {
      continue;
    }

    if (normDue < today) {
      overdueTasks.push(task);
    } else {
      upcomingTasks.push(task);
    }
  }

  // Sort overdue tasks ascending by due date (oldest missed first)
  overdueTasks.sort((a, b) => {
    const dateA = normalizeDueDateString(a.due_date) || "";
    const dateB = normalizeDueDateString(b.due_date) || "";
    return dateA.localeCompare(dateB);
  });

  // Sort upcoming tasks ascending by due date (nearest first)
  upcomingTasks.sort((a, b) => {
    const dateA = normalizeDueDateString(a.due_date) || "";
    const dateB = normalizeDueDateString(b.due_date) || "";
    return dateA.localeCompare(dateB);
  });

  const selectedOverdue = overdueTasks.slice(0, 3);
  const remainingSlots = 3 - selectedOverdue.length;
  const selectedUpcoming =
    remainingSlots > 0 ? upcomingTasks.slice(0, remainingSlots) : [];

  const selected = [...selectedOverdue, ...selectedUpcoming];

  return {
    selected,
    overdue: overdueTasks,
    upcoming: upcomingTasks,
    totalOverdue: overdueTasks.length,
    totalUpcoming: upcomingTasks.length,
  };
};
