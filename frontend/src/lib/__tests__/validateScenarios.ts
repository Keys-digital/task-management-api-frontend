import {
  selectDashboardTasks,
  isTaskOverdue,
  isTaskUpcoming,
  isTaskCompleted,
  formatDueDate,
  getProjectName,
} from "../taskSummary";
import type { Task } from "../taskSummary";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

const TODAY = "2026-08-21";

console.log("--- Running Task Summary Scenario Tests ---\n");

// Scenario 1: 3 overdue + 3 upcoming -> 3 overdue
{
  const tasks: Task[] = [
    { id: 1, title: "Overdue 1", due_date: "2026-08-15", status: "todo", priority: "high" },
    { id: 2, title: "Overdue 2", due_date: "2026-08-18", status: "in_progress", priority: "medium" },
    { id: 3, title: "Overdue 3", due_date: "2026-08-20", status: "todo", priority: "low" },
    { id: 4, title: "Upcoming 1", due_date: "2026-08-22", status: "todo", priority: "high" },
    { id: 5, title: "Upcoming 2", due_date: "2026-08-25", status: "todo", priority: "medium" },
    { id: 6, title: "Upcoming 3", due_date: "2026-09-01", status: "todo", priority: "low" },
  ];

  const result = selectDashboardTasks(tasks, TODAY);
  assert(result.selected.length === 3, "Scenario 1: Selected length is exactly 3");
  assert(
    result.selected.map((t) => t.id).join(",") === "1,2,3",
    "Scenario 1: Shows exactly the 3 overdue tasks in ASC order (1, 2, 3)"
  );
}

// Scenario 2: 2 overdue + 3 upcoming -> 2 overdue + 1 nearest upcoming
{
  const tasks: Task[] = [
    { id: 2, title: "Overdue 2", due_date: "2026-08-18", status: "in_progress", priority: "medium" },
    { id: 1, title: "Overdue 1", due_date: "2026-08-15", status: "todo", priority: "high" },
    { id: 4, title: "Upcoming 1", due_date: "2026-08-22", status: "todo", priority: "high" },
    { id: 5, title: "Upcoming 2", due_date: "2026-08-25", status: "todo", priority: "medium" },
    { id: 6, title: "Upcoming 3", due_date: "2026-09-01", status: "todo", priority: "low" },
  ];

  const result = selectDashboardTasks(tasks, TODAY);
  assert(result.selected.length === 3, "Scenario 2: Selected length is exactly 3");
  assert(
    result.selected.map((t) => t.id).join(",") === "1,2,4",
    "Scenario 2: Shows 2 overdue + 1 nearest upcoming in correct order (1, 2, 4)"
  );
}

// Scenario 3: 1 overdue + 3 upcoming -> 1 overdue + 2 nearest upcoming
{
  const tasks: Task[] = [
    { id: 1, title: "Overdue 1", due_date: "2026-08-15", status: "todo", priority: "high" },
    { id: 6, title: "Upcoming 3", due_date: "2026-09-01", status: "todo", priority: "low" },
    { id: 4, title: "Upcoming 1", due_date: "2026-08-22", status: "todo", priority: "high" },
    { id: 5, title: "Upcoming 2", due_date: "2026-08-25", status: "todo", priority: "medium" },
  ];

  const result = selectDashboardTasks(tasks, TODAY);
  assert(result.selected.length === 3, "Scenario 3: Selected length is exactly 3");
  assert(
    result.selected.map((t) => t.id).join(",") === "1,4,5",
    "Scenario 3: Shows 1 overdue + 2 nearest upcoming (1, 4, 5)"
  );
}

// Scenario 4: 0 overdue + 3 upcoming -> 3 nearest upcoming
{
  const tasks: Task[] = [
    { id: 6, title: "Upcoming 3", due_date: "2026-09-01", status: "todo", priority: "low" },
    { id: 4, title: "Upcoming 1", due_date: "2026-08-22", status: "todo", priority: "high" },
    { id: 5, title: "Upcoming 2", due_date: "2026-08-25", status: "todo", priority: "medium" },
    { id: 7, title: "Upcoming 4", due_date: "2026-09-10", status: "todo", priority: "medium" },
  ];

  const result = selectDashboardTasks(tasks, TODAY);
  assert(result.selected.length === 3, "Scenario 4: Selected length is exactly 3");
  assert(
    result.selected.map((t) => t.id).join(",") === "4,5,6",
    "Scenario 4: Shows 3 nearest upcoming in ASC order (4, 5, 6)"
  );
}

// Scenario 5: 0 overdue + 2 upcoming -> 2 upcoming
{
  const tasks: Task[] = [
    { id: 5, title: "Upcoming 2", due_date: "2026-08-25", status: "todo", priority: "medium" },
    { id: 4, title: "Upcoming 1", due_date: "2026-08-22", status: "todo", priority: "high" },
  ];

  const result = selectDashboardTasks(tasks, TODAY);
  assert(result.selected.length === 2, "Scenario 5: Selected length is exactly 2");
  assert(
    result.selected.map((t) => t.id).join(",") === "4,5",
    "Scenario 5: Shows 2 upcoming in ASC order (4, 5)"
  );
}

// Scenario 6: Completed task with past due date -> excluded from overdue
{
  const tasks: Task[] = [
    { id: 10, title: "Completed Past Due", due_date: "2026-08-10", status: "completed", priority: "high" },
    { id: 11, title: "Completed Past Due 2", due_date: "2026-08-10", status: "Completed", priority: "high" },
    { id: 4, title: "Upcoming 1", due_date: "2026-08-22", status: "todo", priority: "high" },
  ];

  const result = selectDashboardTasks(tasks, TODAY);
  assert(result.selected.length === 1, "Scenario 6: Completed tasks excluded");
  assert(result.selected[0].id === 4, "Scenario 6: Only non-completed task selected");
  assert(
    !isTaskOverdue("2026-08-10", "completed", TODAY),
    "Scenario 6: isTaskOverdue returns false for completed status"
  );
  assert(
    !isTaskOverdue("2026-08-10", "Completed", TODAY),
    "Scenario 6: isTaskOverdue returns false for capitalized Completed status"
  );
}

// Scenario 7: Task with no due date -> excluded from summary
{
  const tasks: Task[] = [
    { id: 20, title: "No due date 1", due_date: null, status: "todo", priority: "high" },
    { id: 21, title: "No due date 2", due_date: undefined, status: "todo", priority: "high" },
    { id: 22, title: "No due date 3", due_date: "", status: "in_progress", priority: "medium" },
    { id: 4, title: "Upcoming 1", due_date: "2026-08-22", status: "todo", priority: "high" },
  ];

  const result = selectDashboardTasks(tasks, TODAY);
  assert(result.selected.length === 1, "Scenario 7: Tasks without due date excluded");
  assert(result.selected[0].id === 4, "Scenario 7: Only task with due date selected");
}

// Scenario 8: No actionable tasks -> clean empty state
{
  const tasks: Task[] = [
    { id: 30, title: "No due date", due_date: null, status: "todo", priority: "low" },
    { id: 31, title: "Completed task", due_date: "2026-08-10", status: "completed", priority: "low" },
  ];

  const result = selectDashboardTasks(tasks, TODAY);
  assert(result.selected.length === 0, "Scenario 8: No tasks selected (empty state)");
  assert(result.totalOverdue === 0, "Scenario 8: totalOverdue is 0");
  assert(result.totalUpcoming === 0, "Scenario 8: totalUpcoming is 0");
}

// Additional test: Task due TODAY is treated as UPCOMING, NOT overdue
{
  const tasks: Task[] = [
    { id: 40, title: "Due Today", due_date: TODAY, status: "todo", priority: "high" },
  ];

  const result = selectDashboardTasks(tasks, TODAY);
  assert(result.selected.length === 1, "Due today task is included");
  assert(result.overdue.length === 0, "Due today task is NOT overdue");
  assert(result.upcoming.length === 1, "Due today task IS upcoming");
  assert(isTaskUpcoming(TODAY, "todo", TODAY), "isTaskUpcoming returns true for today");
  assert(!isTaskOverdue(TODAY, "todo", TODAY), "isTaskOverdue returns false for today");
}

// Project Name Resolution test
{
  const projectsMap = new Map<number, string>([
    [1, "Alpha Project"],
    [2, "Beta Project"],
  ]);

  const task1: Task = { id: 1, title: "T1", status: "todo", priority: "low", project: 1 };
  const task2: Task = { id: 2, title: "T2", status: "todo", priority: "low", project: { id: 2, name: "Beta Project" } };
  const task3: Task = { id: 3, title: "T3", status: "todo", priority: "low", project_name: "Gamma Project" };
  const task4: Task = { id: 4, title: "T4", status: "todo", priority: "low", project: 99 };

  assert(getProjectName(task1, projectsMap) === "Alpha Project", "Project name resolved from map");
  assert(getProjectName(task2, projectsMap) === "Beta Project", "Project name resolved from object");
  assert(getProjectName(task3, projectsMap) === "Gamma Project", "Project name resolved from project_name");
  assert(getProjectName(task4, projectsMap) === "Project #99", "Project name fallback to Project #99");
}

console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!");
