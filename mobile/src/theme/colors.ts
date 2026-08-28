/**
 * TaskFlo Mobile — Color Design Tokens
 *
 * Source of truth: frontend/src/app/globals.css
 * The mobile app uses dark mode as the default (matches the web dark theme).
 *
 * Dark theme CSS variables from globals.css:
 *   --color-page-bg:      #050506
 *   --color-surface:      #0b0b0c
 *   --color-text-primary: #e6eef0
 *   --color-text-muted:   #94a3b8
 *   --color-border:       #1f2937
 *   --color-input-bg:     #0b0b0c
 *
 * Brand (primary) color: Tailwind teal-700 (#0f766e)
 *   — Sourced from bg-teal-700 used on all primary CTA buttons across the web app.
 *   — teal-600 (#0d9488) is used for focus rings and interactive states.
 *   — teal-800 (#115e59) is used for hover states.
 *
 * NOTE: React Native cannot consume globals.css directly. These values are
 * translated into TypeScript-compatible constants.
 */

export const Colors = {
  // ── Page / background ──────────────────────────────────────────────────────
  background: "#050506",        // --color-page-bg (dark)
  backgroundAlt: "#0b0b0c",     // --color-surface (dark)

  // ── Surface / cards ────────────────────────────────────────────────────────
  surface: "#0b0b0c",           // --color-surface (dark)
  surfaceElevated: "#111113",   // slightly lifted surface
  card: "#111827",              // Tailwind slate-900 — used for dark cards in web

  // ── Primary brand — Teal ───────────────────────────────────────────────────
  primary: "#0f766e",           // teal-700 — main CTA buttons (web: bg-teal-700)
  primaryHover: "#115e59",      // teal-800 — hover state (web: hover:bg-teal-800)
  primaryFocus: "#0d9488",      // teal-600 — focus rings (web: focus:border-teal-600)
  primaryLight: "rgba(13,148,136,0.15)", // teal dark-adapted surface (web dark: .dark .bg-teal-50)
  primaryText: "#2dd4bf",       // teal-400 — text on dark bg (web dark: .dark .text-teal-600)

  // ── Text ───────────────────────────────────────────────────────────────────
  text: "#e6eef0",              // --color-text-primary (dark)
  textMuted: "#94a3b8",         // --color-text-muted (dark) / Tailwind slate-400
  textSubtle: "#64748b",        // Tailwind slate-500 — tertiary / disabled text
  textInverse: "#ffffff",       // white text on colored backgrounds

  // ── Borders / dividers ─────────────────────────────────────────────────────
  border: "#1f2937",            // --color-border (dark) / Tailwind slate-800
  borderMid: "#334155",         // Tailwind slate-700 — visible borders in UI
  borderLight: "#475569",       // Tailwind slate-600 — lighter dividers

  // ── Input fields ───────────────────────────────────────────────────────────
  inputBackground: "#0b0b0c",   // --color-input-bg (dark)
  inputBorder: "#334155",       // visible input border (slate-700)
  inputPlaceholder: "#64748b",  // slate-500

  // ── Status colors ──────────────────────────────────────────────────────────
  success: "#10b981",           // Tailwind emerald-500
  successLight: "rgba(16,185,129,0.15)",
  successText: "#34d399",       // emerald-400 (web dark: .dark .text-emerald-700)

  warning: "#f59e0b",           // Tailwind amber-500
  warningLight: "rgba(245,158,11,0.15)",
  warningText: "#fbbf24",       // amber-400 (web dark: .dark .text-amber-700)

  error: "#ef4444",             // Tailwind red-500
  errorLight: "rgba(239,68,68,0.12)",
  errorText: "#f87171",         // red-400 (web dark: .dark .text-red-700)
  errorDark: "#7f1d1d",         // deep red background for inline error banners

  // ── Supplementary accent colors (mirrors web project card palette) ─────────
  blue: "#3b82f6",              // Tailwind blue-500
  blueText: "#60a5fa",          // blue-400 (web dark: .dark .text-blue-700)
  violet: "#8b5cf6",            // Tailwind violet-500
  violetText: "#a78bfa",        // violet-400 (web dark: .dark .text-violet-700)
  rose: "#f43f5e",              // Tailwind rose-500
  roseText: "#fb7185",          // rose-400 (web dark: .dark .text-rose-700)
  cyan: "#06b6d4",              // Tailwind cyan-500
  cyanText: "#22d3ee",          // cyan-400 (web dark: .dark .text-cyan-700)
} as const;

export type ColorToken = keyof typeof Colors;
