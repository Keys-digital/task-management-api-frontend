/**
 * TaskFlo Mobile — Spacing Design Tokens
 *
 * Source of truth: Tailwind default spacing scale used in the web application.
 * The web app uses Tailwind's 4px base unit system:
 *   p-1 = 4px, p-2 = 8px, p-3 = 12px, p-4 = 16px, p-5 = 20px, p-6 = 24px, p-8 = 32px
 *
 * Observed usage in web pages:
 *   - Card padding:    p-4  (16px) or p-8 (32px) on login card
 *   - Section gaps:   space-y-5 (20px)
 *   - Label margins:  mb-2 (8px)
 *   - Form fields:    px-4 py-3 (16px horizontal, 12px vertical)
 *   - Border radius:  rounded-lg (8px), rounded-xl (12px), rounded-2xl (16px)
 */

export const Spacing = {
  // ── Base unit: 4px ──────────────────────────────────────────────────────
  "0": 0,
  "0.5": 2,   // Tailwind 0.5 — hairline spacing
  "1": 4,     // Tailwind 1
  "1.5": 6,   // Tailwind 1.5
  "2": 8,     // Tailwind 2 — label bottom margin (mb-2)
  "2.5": 10,  // Tailwind 2.5
  "3": 12,    // Tailwind 3 — input vertical padding (py-3)
  "3.5": 14,  // Tailwind 3.5
  "4": 16,    // Tailwind 4 — standard card padding / input horizontal (px-4)
  "5": 20,    // Tailwind 5 — form field gaps (space-y-5)
  "6": 24,    // Tailwind 6 — section padding
  "7": 28,    // Tailwind 7
  "8": 32,    // Tailwind 8 — login card padding (p-8)
  "10": 40,   // Tailwind 10
  "12": 48,   // Tailwind 12
  "16": 64,   // Tailwind 16
  "20": 80,   // Tailwind 20
} as const;

// ── Semantic aliases ─────────────────────────────────────────────────────────
// Named after their use in the web design system, mapped to Spacing values.

export const Space = {
  // Micro / inline
  hairline: Spacing["0.5"],  // 2px — borders, dividers
  xxs: Spacing["1"],         // 4px
  xs: Spacing["2"],          // 8px — label margins, icon gaps
  sm: Spacing["3"],          // 12px — inner padding
  md: Spacing["4"],          // 16px — standard padding (px-4, p-4)
  lg: Spacing["5"],          // 20px — form gaps, section spacing
  xl: Spacing["6"],          // 24px — section padding
  "2xl": Spacing["8"],       // 32px — card padding (p-8 on web login)
  "3xl": Spacing["12"],      // 48px — large section margins
} as const;

// ── Border radii (matched to Tailwind rounded-* classes used in web) ─────────
export const Radii = {
  sm: 4,    // rounded
  md: 6,    // rounded-md (used on badges, small elements)
  lg: 8,    // rounded-lg (used on input fields, buttons)
  xl: 12,   // rounded-xl (used on form inputs: rounded-xl border...)
  "2xl": 16, // rounded-2xl (used on login card: rounded-2xl)
  "3xl": 24, // rounded-3xl
  full: 9999, // rounded-full (avatars, pills)
} as const;

export type SpaceToken = keyof typeof Space;
export type RadiusToken = keyof typeof Radii;
