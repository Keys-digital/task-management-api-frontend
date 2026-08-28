/**
 * TaskFlo Mobile — Typography Design Tokens
 *
 * Source of truth: frontend/src/app/globals.css + web page.tsx/dashboard markup.
 *
 * The web app uses:
 *   font-family: var(--font-geist-sans), Arial, Helvetica, sans-serif
 *
 * React Native cannot load Geist Sans without explicit font loading via expo-font.
 * The system font stack is used as a compatible match for the initial release.
 * Geist Sans can be added later via expo-font without changing these token shapes.
 *
 * Type scale is derived from the Tailwind class usage observed in the web app:
 *   text-3xl (30px) → h1 / page title  (web: <h1 className="text-3xl font-bold">TaskFlo</h1>)
 *   text-xl  (20px) → section headers
 *   text-base(16px) → body
 *   text-sm  (14px) → labels, card body text
 *   text-xs  (12px) → captions, badges, helper text
 *
 * Font weights observed:
 *   font-bold      (700) — page titles
 *   font-semibold  (600) — section headings, buttons
 *   font-medium    (500) — field labels, metadata
 *   font-normal    (400) — body text
 */

import { TextStyle } from "react-native";

// ── Font family ──────────────────────────────────────────────────────────────
// System sans-serif matching Geist Sans visual rhythm for the initial release.
const fontFamily = {
  sans: undefined as string | undefined, // undefined → RN uses system default (San Francisco / Roboto)
} as const;

// ── Font sizes (px — matches Tailwind rem scale at 16px root) ───────────────
export const FontSize = {
  xs: 12,   // text-xs  — captions, badges, helper text
  sm: 14,   // text-sm  — labels, secondary body, card text
  base: 16, // text-base — primary body text
  lg: 18,   // text-lg  — sub-headings
  xl: 20,   // text-xl  — section titles
  "2xl": 24, // text-2xl — dashboard headings
  "3xl": 30, // text-3xl — page/screen titles (web: h1 "TaskFlo")
} as const;

// ── Font weights ──────────────────────────────────────────────────────────────
export const FontWeight = {
  normal: "400" as TextStyle["fontWeight"],
  medium: "500" as TextStyle["fontWeight"],
  semibold: "600" as TextStyle["fontWeight"],
  bold: "700" as TextStyle["fontWeight"],
  extrabold: "800" as TextStyle["fontWeight"],
} as const;

// ── Line heights ──────────────────────────────────────────────────────────────
export const LineHeight = {
  tight: 1.2,   // leading-tight — headings
  snug: 1.375,  // leading-snug
  normal: 1.5,  // leading-normal — body text
  relaxed: 1.625, // leading-relaxed
} as const;

// ── Reusable text style presets ───────────────────────────────────────────────
// Corresponds directly to the web typography hierarchy.
export const Typography = {
  // Screen / page title — maps to web <h1 className="text-3xl font-bold text-slate-900">
  screenTitle: {
    fontSize: FontSize["3xl"],
    fontWeight: FontWeight.bold,
    lineHeight: FontSize["3xl"] * LineHeight.tight,
  } as TextStyle,

  // Section heading — maps to web <h2> / text-xl font-bold
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    lineHeight: FontSize.xl * LineHeight.tight,
  } as TextStyle,

  // Card / panel title — maps to web text-lg font-semibold
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.lg * LineHeight.snug,
  } as TextStyle,

  // Primary body text
  body: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.normal,
    lineHeight: FontSize.base * LineHeight.normal,
  } as TextStyle,

  // Small body text — maps to web text-sm (most card content)
  bodySmall: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.normal,
    lineHeight: FontSize.sm * LineHeight.normal,
  } as TextStyle,

  // Field labels — maps to web <label className="text-sm font-medium">
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.sm * LineHeight.snug,
  } as TextStyle,

  // Caption / helper — maps to web text-xs
  caption: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.normal,
    lineHeight: FontSize.xs * LineHeight.normal,
  } as TextStyle,

  // Badge text — maps to web text-xs font-semibold (priority/status badges)
  badge: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.xs * LineHeight.tight,
    textTransform: "uppercase" as TextStyle["textTransform"],
    letterSpacing: 0.5,
  } as TextStyle,

  // Button label — maps to web font-medium / font-semibold text-sm/base
  button: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.sm * LineHeight.snug,
  } as TextStyle,

  // Navigation tab labels
  navTab: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.5,
  } as TextStyle,
} as const;
