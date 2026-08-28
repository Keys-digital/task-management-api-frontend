import assert from "assert";
import { TaskFloSDK } from "../sdk/index";
import { TaskFloError, AuthenticationError, NetworkError, ValidationError } from "../sdk/client";
import { SecureStorageAdapter, secureStorageKeys } from "../security/secureStorage";
import { OfflineCacheManager } from "../offline/cacheManager";
import { NotificationService } from "../notifications/notificationService";

async function runAllMobileTests() {
  console.log("🚀 Starting TaskFlo Mobile & SDK Unit Test Suite...\n");
  let passed = 0;
  let total = 0;

  const test = async (name: string, fn: () => Promise<void> | void) => {
    total++;
    try {
      await fn();
      passed++;
      console.log(`  ✅ PASS: ${name}`);
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(err);
      process.exitCode = 1;
    }
  };

  // -------------------------------------------------------------
  // Test Suite 1: SDK & Client Unit Tests
  // -------------------------------------------------------------
  console.log("--- 1. SDK Client & Error Normalization Tests ---");

  await test("TaskFloClient initializes with default or custom base URL", () => {
    const sdk = new TaskFloSDK({ baseUrl: "https://api.taskflo.com" });
    assert.strictEqual(sdk.client.getBaseUrl(), "https://api.taskflo.com");
  });

  await test("TaskFloClient sets and gets access token correctly", () => {
    const sdk = new TaskFloSDK();
    sdk.client.setAccessToken("test_access_jwt");
    assert.strictEqual(sdk.client.getAccessToken(), "test_access_jwt");
  });

  await test("Custom Error classes extend TaskFloError and hold status codes", () => {
    const authErr = new AuthenticationError("Invalid token");
    assert.strictEqual(authErr.status, 401);
    assert.strictEqual(authErr.name, "AuthenticationError");

    const netErr = new NetworkError();
    assert.strictEqual(netErr.status, 0);

    const valErr = new ValidationError("Invalid payload", { title: ["This field is required."] });
    assert.strictEqual(valErr.status, 400);
    assert.strictEqual((valErr.errors.title as string[])[0], "This field is required.");
  });

  await test("Token Refresh Mutex locks concurrent refresh requests", async () => {
    let refreshCount = 0;
    const sdk = new TaskFloSDK({
      baseUrl: "http://localhost:8000",
      getRefreshToken: async () => "valid_refresh_token",
      onTokensRefreshed: async () => {
        refreshCount++;
      },
    });

    // Mock global fetch for token refresh endpoint
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url) => {
      if (String(url).includes("/api/auth/token/refresh/")) {
        return new Response(
          JSON.stringify({ access: "new_access_token", refresh: "new_refresh_token" }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response("{}", { status: 200 });
    };

    try {
      // Trigger two concurrent refresh calls
      const p1 = sdk.client.refreshTokenFlow();
      const p2 = sdk.client.refreshTokenFlow();

      const [res1, res2] = await Promise.all([p1, p2]);
      assert.strictEqual(res1, "new_access_token");
      assert.strictEqual(res2, "new_access_token");
      assert.strictEqual(refreshCount, 1, "Refresh count should be exactly 1 due to mutex deduplication");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await test("AuthModule sends correct login payload with username", async () => {
    let capturedBody: any = null;
    const sdk = new TaskFloSDK({ baseUrl: "http://192.168.0.152:8000" });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, init) => {
      if (String(url).includes("/api/auth/login/")) {
        capturedBody = JSON.parse(String(init?.body));
        return new Response(
          JSON.stringify({ access: "test_access", refresh: "test_refresh" }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response("{}", { status: 200 });
    };

    try {
      const tokens = await sdk.auth.login({ username: "testuser", password: "Password123!" });
      assert.strictEqual(tokens.access, "test_access");
      assert.deepStrictEqual(capturedBody, { username: "testuser", password: "Password123!" });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await test("AuthModule sends correct register payload", async () => {
    let capturedBody: any = null;
    const sdk = new TaskFloSDK({ baseUrl: "http://192.168.0.152:8000" });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, init) => {
      if (String(url).includes("/api/auth/register/")) {
        capturedBody = JSON.parse(String(init?.body));
        return new Response(
          JSON.stringify({
            message: "User registered successfully.",
            user: { id: 1, username: "newuser", email: "new@example.com" },
          }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response("{}", { status: 200 });
    };

    try {
      const res = await sdk.auth.register({
        username: "newuser",
        email: "new@example.com",
        password: "Password123!",
        password_confirm: "Password123!",
      });
      assert.strictEqual((res as any).user.username, "newuser");
      assert.deepStrictEqual(capturedBody, {
        username: "newuser",
        email: "new@example.com",
        password: "Password123!",
        password_confirm: "Password123!",
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
  await test("Label mappers correctly format backend choices to display labels", async () => {
    const { getStatusLabel, getPriorityLabel, getWeekStartLabel } = await import("../sdk/mappers");
    assert.strictEqual(getStatusLabel("todo"), "To Do");
    assert.strictEqual(getStatusLabel("in_progress"), "In Progress");
    assert.strictEqual(getStatusLabel("completed"), "Completed");
    assert.strictEqual(getPriorityLabel("low"), "Low");
    assert.strictEqual(getPriorityLabel("medium"), "Medium");
    assert.strictEqual(getPriorityLabel("high"), "High");
    assert.strictEqual(getWeekStartLabel("monday"), "Monday");
    assert.strictEqual(getWeekStartLabel("sunday"), "Sunday");
  });

  await test("ProfileModule sends correct preference payload with lowercase choice keys", async () => {
    let capturedBody: any = null;
    const sdk = new TaskFloSDK({ baseUrl: "http://192.168.0.152:8000" });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, init) => {
      if (String(url).includes("/api/auth/me/")) {
        capturedBody = JSON.parse(String(init?.body));
        return new Response(
          JSON.stringify({
            id: 1,
            username: "testuser",
            email: "test@example.com",
            profile: capturedBody.profile,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response("{}", { status: 200 });
    };

    try {
      await sdk.profile.updateMe({
        profile: {
          week_start: "monday",
          appearance: "system",
          default_task_priority: "medium",
          default_task_view: "list",
        },
      });
      assert.deepStrictEqual(capturedBody, {
        profile: {
          week_start: "monday",
          appearance: "system",
          default_task_priority: "medium",
          default_task_view: "list",
        },
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await test("AuthModule sends changePassword payload correctly", async () => {
    let capturedBody: any = null;
    const sdk = new TaskFloSDK({ baseUrl: "http://192.168.0.152:8000" });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, init) => {
      if (String(url).includes("/api/auth/change-password/")) {
        capturedBody = JSON.parse(String(init?.body));
        return new Response(
          JSON.stringify({ message: "Password changed successfully." }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response("{}", { status: 200 });
    };

    try {
      const res = await sdk.auth.changePassword({
        old_password: "OldPassword123!",
        new_password: "NewPassword123!",
        new_password_confirm: "NewPassword123!",
      });
      assert.strictEqual(res.message, "Password changed successfully.");
      assert.deepStrictEqual(capturedBody, {
        old_password: "OldPassword123!",
        new_password: "NewPassword123!",
        new_password_confirm: "NewPassword123!",
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await test("ProfileModule calls exportData and deleteAccount endpoints", async () => {
    let exportCalled = false;
    let deleteCalled = false;
    const sdk = new TaskFloSDK({ baseUrl: "http://192.168.0.152:8000" });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, init) => {
      if (String(url).includes("/api/auth/export-data/")) {
        exportCalled = true;
        return new Response(JSON.stringify({ exported_at: "2026-08-28" }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      if (String(url).includes("/api/auth/me/") && init?.method === "DELETE") {
        deleteCalled = true;
        return new Response(JSON.stringify({ message: "Account deleted successfully." }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      return new Response("{}", { status: 200 });
    };

    try {
      const exportRes = await sdk.profile.exportData();
      assert.strictEqual(exportRes.exported_at, "2026-08-28");
      assert.strictEqual(exportCalled, true);

      await sdk.profile.deleteAccount();
      assert.strictEqual(deleteCalled, true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
  await test("TasksModule listTasks sends proper query parameters", async () => {
    let capturedUrl = "";
    const sdk = new TaskFloSDK({ baseUrl: "http://192.168.0.152:8000" });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url) => {
      capturedUrl = String(url);
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    try {
      await sdk.tasks.listTasks({
        project: 5,
        status: "in_progress",
        priority: "high",
        search: "auth",
      });
      assert.ok(capturedUrl.includes("project=5"));
      assert.ok(capturedUrl.includes("status=in_progress"));
      assert.ok(capturedUrl.includes("priority=high"));
      assert.ok(capturedUrl.includes("search=auth"));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await test("TasksModule createTask, updateTask, toggleTaskCompletion, and deleteTask", async () => {
    let createBody: any = null;
    let updateBody: any = null;
    let deleteId: number | null = null;
    const sdk = new TaskFloSDK({ baseUrl: "http://192.168.0.152:8000" });
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async (url, init) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/projects/tasks/") && init?.method === "POST") {
        createBody = JSON.parse(String(init?.body));
        return new Response(
          JSON.stringify({ id: 101, ...createBody, created_at: "", updated_at: "" }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      }
      if (urlStr.includes("/api/projects/tasks/101/") && init?.method === "PATCH") {
        updateBody = JSON.parse(String(init?.body));
        return new Response(
          JSON.stringify({ id: 101, title: "Updated", status: updateBody.status || "todo", priority: "medium", due_date: null, project: null, created_at: "", updated_at: "" }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (urlStr.includes("/api/projects/tasks/101/") && init?.method === "DELETE") {
        deleteId = 101;
        return new Response(null, { status: 204 });
      }
      return new Response("{}", { status: 200 });
    };

    try {
      const created = await sdk.tasks.createTask({
        title: "Test Task",
        priority: "high",
        status: "todo",
      });
      assert.strictEqual(created.id, 101);
      assert.deepStrictEqual(createBody, { title: "Test Task", priority: "high", status: "todo" });

      const updated = await sdk.tasks.updateTask(101, { status: "in_progress" });
      assert.strictEqual(updated.status, "in_progress");
      assert.deepStrictEqual(updateBody, { status: "in_progress" });

      // Test toggle: todo -> completed
      const toggled = await sdk.tasks.toggleTaskCompletion({
        id: 101,
        title: "Test",
        description: "",
        status: "todo",
        priority: "low",
        due_date: null,
        project: null,
        created_at: "",
        updated_at: "",
      });
      assert.strictEqual(updateBody.status, "completed");

      await sdk.tasks.deleteTask(101);
      assert.strictEqual(deleteId, 101);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
  await test("ProjectsModule listProjects, createProject, updateProject, and deleteProject", async () => {
    let createBody: any = null;
    let updateBody: any = null;
    let deleteId: number | null = null;
    const sdk = new TaskFloSDK({ baseUrl: "http://192.168.0.152:8000" });
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async (url, init) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/projects/") && init?.method === "GET") {
        return new Response(
          JSON.stringify([{ id: 10, name: "Core API", description: "Backend project", created_at: "", updated_at: "" }]),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (urlStr.includes("/api/projects/") && init?.method === "POST") {
        createBody = JSON.parse(String(init?.body));
        return new Response(
          JSON.stringify({ id: 20, ...createBody, created_at: "", updated_at: "" }),
          { status: 201, headers: { "Content-Type": "application/json" } }
        );
      }
      if (urlStr.includes("/api/projects/20/") && init?.method === "PATCH") {
        updateBody = JSON.parse(String(init?.body));
        return new Response(
          JSON.stringify({ id: 20, name: "Renamed Project", description: "Updated", created_at: "", updated_at: "" }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (urlStr.includes("/api/projects/20/") && init?.method === "DELETE") {
        deleteId = 20;
        return new Response(null, { status: 204 });
      }
      return new Response("{}", { status: 200 });
    };

    try {
      const projects = await sdk.projects.listProjects();
      assert.strictEqual(projects.length, 1);
      assert.strictEqual(projects[0].name, "Core API");

      const created = await sdk.projects.createProject({
        name: "Mobile App 2.0",
        description: "Expo Native client",
      });
      assert.strictEqual(created.id, 20);
      assert.deepStrictEqual(createBody, { name: "Mobile App 2.0", description: "Expo Native client" });

      const updated = await sdk.projects.updateProject(20, { name: "Renamed Project" });
      assert.strictEqual(updated.name, "Renamed Project");

      await sdk.projects.deleteProject(20);
      assert.strictEqual(deleteId, 20);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
  console.log("\n--- 2. Secure Storage & Keychain Vault Tests ---");

  await test("SecureStorageAdapter securely stores, retrieves, and purges credentials", async () => {
    const storage = new SecureStorageAdapter();
    await storage.setItem(secureStorageKeys.ACCESS_TOKEN, "acc_12345");
    await storage.setItem(secureStorageKeys.REFRESH_TOKEN, "ref_67890");

    assert.strictEqual(await storage.getItem(secureStorageKeys.ACCESS_TOKEN), "acc_12345");
    assert.strictEqual(await storage.getItem(secureStorageKeys.REFRESH_TOKEN), "ref_67890");

    await storage.clear();
    assert.strictEqual(await storage.getItem(secureStorageKeys.ACCESS_TOKEN), null);
    assert.strictEqual(await storage.getItem(secureStorageKeys.REFRESH_TOKEN), null);
  });

  // -------------------------------------------------------------
  // Test Suite 3: Offline Cache Manager Tests
  // -------------------------------------------------------------
  console.log("\n--- 3. Offline Cache & Network Failure Isolation Tests ---");

  await test("OfflineCacheManager correctly distinguishes NetworkError from AuthError", () => {
    const cache = new OfflineCacheManager();
    const netErr = new NetworkError("Connection refused");
    const authErr = new AuthenticationError("Token expired");

    assert.strictEqual(cache.isNetworkFailure(netErr), true);
    assert.strictEqual(cache.isNetworkFailure(authErr), false);
  });

  await test("OfflineCacheManager manages multi-state lifecycle machine", () => {
    const cache = new OfflineCacheManager();
    assert.strictEqual(cache.getState(), "ONLINE");

    cache.setOnlineStatus(false);
    assert.strictEqual(cache.getState(), "OFFLINE");

    cache.queueMutation("CREATE_TASK", { title: "Offline Task" });
    assert.strictEqual(cache.getState(), "SYNC_PARTIAL_FAILED");

    cache.setState("SYNCED");
    assert.strictEqual(cache.getState(), "SYNCED");
    assert.strictEqual(cache.getFormattedStaleness(), "Last synced just now");
  });

  await test("OfflineCacheManager purges session cache on logout / user switch", () => {
    const cache = new OfflineCacheManager();
    cache.setCurrentUser(1);
    cache.setTaskCache([
      {
        id: 1,
        project: null,
        title: "User 1 Task",
        description: "",
        status: "todo",
        priority: "medium",
        due_date: null,
        created_at: "",
        updated_at: "",
      },
    ]);
    assert.strictEqual(cache.getTaskCache().length, 1);

    // Logout / clear session
    cache.clearUserSessionCache();
    assert.strictEqual(cache.getTaskCache().length, 0);
    assert.strictEqual(cache.getMutationQueue().length, 0);
    assert.strictEqual(cache.getLastSyncTimestamp(), null);
  });

  // -------------------------------------------------------------
  // Test Suite 4: Notification Abstraction Tests
  // -------------------------------------------------------------
  console.log("\n--- 4. Push & Local Notification Service Tests ---");

  await test("NotificationService respects user notification preferences", () => {
    const notifService = new NotificationService();
    const prefs = {
      due_date: false,
      overdue: true,
      project_activity: true,
      email_digest: true,
      in_app: true,
    };

    assert.strictEqual(notifService.shouldNotify("due_date", prefs), false);
    assert.strictEqual(notifService.shouldNotify("overdue", prefs), true);
  });

  await test("NotificationService schedules local task due date notifications", () => {
    const notifService = new NotificationService();
    const futureDate = new Date(Date.now() + 86400000).toISOString(); // 1 day in future
    const task = {
      id: 55,
      project: null,
      title: "Mobile App Release Prep",
      description: "Prepare TestFlight build",
      status: "todo" as const,
      priority: "high" as const,
      due_date: futureDate,
      created_at: "2026-08-25T00:00:00Z",
      updated_at: "2026-08-25T00:00:00Z",
    };

    const scheduled = notifService.scheduleTaskDueDateNotification(task);
    assert.notStrictEqual(scheduled, null);
    assert.strictEqual(scheduled?.taskId, 55);
    assert.strictEqual(notifService.getScheduledNotifications().length, 1);

    notifService.cancelTaskNotification(55);
    assert.strictEqual(notifService.getScheduledNotifications().length, 0);
  });

  console.log(`\n🎉 Summary: ${passed} / ${total} tests passed cleanly.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runAllMobileTests().catch((err) => {
  console.error("Test runner encountered error:", err);
  process.exit(1);
});
