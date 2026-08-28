# TaskFlo Mobile Architecture & Technology Decision (Part G)

## Executive Summary

This document records the architectural audit, technology evaluation, threat model, and deployment roadmap for the **TaskFlo Mobile Application & Mobile SDK**.

---

## 1. Repository Audit

### Backend Stack
- **Framework**: Django 6.1 + Django REST Framework 3.16
- **Authentication**: `rest_framework_simplejwt` (JWT)
  - `ROTATE_REFRESH_TOKENS: True`
  - `BLACKLIST_AFTER_ROTATION: True`
  - Access Token Lifetime: 30 minutes
  - Refresh Token Lifetime: 7 days
- **API Endpoints**:
  - `POST /api/auth/register/`
  - `POST /api/auth/login/`
  - `POST /api/auth/token/refresh/`
  - `GET /api/auth/me/`, `PATCH /api/auth/me/`, `DELETE /api/auth/me/`
  - `GET /api/auth/preferences/`, `PATCH /api/auth/preferences/`
  - `POST /api/auth/change-password/`, `GET /api/auth/export-data/`
  - `GET /api/projects/`, `POST /api/projects/`, `GET/PATCH/DELETE /api/projects/<id>/`
  - `GET /api/projects/tasks/`, `POST /api/projects/tasks/`, `GET/PATCH/DELETE /api/projects/tasks/<id>/`

### Web Frontend Stack
- Next.js 16.3 (App Router), React 19, TypeScript 5, Tailwind CSS 4.

---

## 2. Technology Options Evaluated

| Option | Evaluation | Verdict |
|---|---|---|
| **React Native (Expo + TypeScript)** | 100% TypeScript type sharing with Next.js web frontend, native UI performance, iOS Keychain / Android Keystore platform binding, standard Expo EAS build channels & TestFlight / Play Console deployment. | **RECOMMENDED (Selected)** |
| **Flutter (Dart)** | High performance render pipeline, but zero type/code sharing with TS frontend, separate Dart language introduces team overhead. | Rejected |
| **Capacitor / WebView Wrapper** | Fast initial wrapper over web app, but poor touch UX, sluggish transitions, sub-par offline capability. | Rejected |
| **Standalone PWA** | No binary required, but limited iOS background push support, cannot be installed via mobile enterprise MDM or app stores directly without native shell wrapper. | Retained as secondary web access option; rejected as primary mobile strategy. |

---

## 3. Decision Rationale

We select **React Native with Expo & TypeScript**.
1. **API Contract & Type Sharing**: TypeScript models match Django DRF serializers directly (`User`, `UserProfile`, `UserPreferences`, `Task`, `Project`).
2. **Security & Credentials**: Uses native iOS Keychain (via `expo-secure-store`) and Android Keystore to satisfy strict security requirements (never storing refresh tokens in unencrypted `AsyncStorage`).
3. **Modular SDK Design**: The API client and auth layer are structured as a standalone typed TS SDK (`@taskflo/mobile-sdk`) usable across native mobile app, web fallback, CLI, or test runners.

---

## 4. Threat Model & Security Controls

- **Transport**: HTTPS mandatory for non-localhost endpoints.
- **Secrets Policy**: Zero production API secrets or private keys embedded in mobile client binaries. All mobile secrets are environment variables provided at build time (`EXPO_PUBLIC_API_URL`).
- **Token Lifecycle**: Short-lived access tokens (30m) held in memory; long-lived refresh tokens (7d) stored in Keychain / Keystore. Automatic rotation handled upon 401 response via atomic mutex lock to prevent refresh race conditions.
- **Data Protection**: Local cache is cleared on explicit user logout or unrecoverable HTTP 401 error.

---

## 5. Mobile Release & Distribution Strategy

- **Development**: Expo CLI / React Native Metro bundler.
- **Beta Preview / Internal Testing**:
  - **iOS**: Apple TestFlight via Expo Application Services (EAS Build).
  - **Android**: Google Play Internal Testing track / signed APK download via EAS.
- **Web Distribution Hub**: Accessible at `/dashboard/settings/mobile` with accurate build versioning, PWA guidance, and real QR code links.

