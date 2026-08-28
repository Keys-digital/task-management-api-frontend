# TaskFlo Mobile Architecture & SDK Specification

## Architecture Overview

```text
+-------------------------------------------------------------------+
|                        TaskFlo Mobile App                         |
|  +-------------------------------------------------------------+  |
|  | Screens: Dashboard | Tasks | Projects | Profile | Settings |  |
|  +-------------------------------------------------------------+  |
|  | AuthContext | ThemeProvider | Offline Cache | Notifications |  |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                     TaskFlo Mobile SDK (`sdk/`)                   |
|  +-------------------+  +-------------------+  +---------------+  |
|  | Auth Module       |  | Tasks Module      |  | Profile Mod   |  |
|  +-------------------+  +-------------------+  +---------------+  |
|  | Projects Module   |  | Preferences Mod   |  | Types System  |  |
|  +-------------------+  +-------------------+  +---------------+  |
|  | Client & Mutex    |  | Error Normalizer  |  | Safe Retries  |  |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|              Secure Storage Layer (`secureStorage.ts`)             |
|  - Production: iOS Keychain / Android Keystore (expo-secure-store) |
|  - Node / Test Vault: Encrypted In-Memory Storage Adapter          |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                     Django REST Framework Backend                 |
|  - JWT Auth (/api/auth/token/refresh/, /api/auth/login/)          |
|  - User Profile & Preferences (/api/auth/me/)                      |
|  - Projects & Tasks (/api/projects/, /api/projects/tasks/)        |
+-------------------------------------------------------------------+
```

## Directory Structure

```text
mobile/
├── package.json
├── tsconfig.json
├── ARCHITECTURE.md
├── src/
│   ├── index.ts
│   ├── sdk/
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── client.ts
│   │   └── modules/
│   │       ├── auth.ts
│   │       ├── profile.ts
│   │       ├── projects.ts
│   │       └── tasks.ts
│   ├── security/
│   │   └── secureStorage.ts
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── offline/
│   │   └── cacheManager.ts
│   ├── notifications/
│   │   └── notificationService.ts
│   ├── screens/
│   │   ├── DashboardScreen.tsx
│   │   ├── TasksScreen.tsx
│   │   ├── ProjectsScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   └── LoginScreen.tsx
│   └── __tests__/
│       ├── client.test.ts
│       ├── auth.test.ts
│       ├── secureStorage.test.ts
│       └── cacheManager.test.ts
```

## Security & Storage Architecture

1. **Tokens**:
   - `access`: Held in memory by `TaskFloClient`.
   - `refresh`: Saved via `secureStorage.ts`.
2. **Refresh Flow**:
   - On 401: SDK acquires token refresh lock (mutex).
   - If another request triggers 401 simultaneously, it waits for the pending refresh promise.
   - Upon successful refresh, queued requests are retried with the new access token.
   - Upon failed refresh, session is cleared and `onSessionExpired` handler triggers logout.
3. **Idempotency Safeguard**:
   - Automatic retry on 401 only re-executes GET requests or safe queries. Mutation requests (`POST`, `PATCH`, `DELETE`) check token validity before execution to prevent duplicate server side state mutations.

