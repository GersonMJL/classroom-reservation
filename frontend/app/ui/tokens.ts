/**
 * Design tokens for use in MUI `sx` props and `theme` configuration.
 * For Tailwind/global CSS usage, see the CSS vars in `app.css` (:root block).
 */
// frontend/app/ui/tokens.ts
export const tokens = {
  color: {
    primary:    { main: "#1f6f5f", dark: "#184f44", light: "#4a9a8a", contrast: "#f8fbf9" },
    secondary:  { main: "#b25e2e", dark: "#8b4721", light: "#d98b58", contrast: "#fff9f5" },
    surface:    { default: "#f3f5ef", paper: "#ffffff", elevated: "#fbfcfa" },
    text:       { primary: "#17322d", secondary: "#4f665f", disabled: "#8a9c95" },
    border:     { subtle: "rgba(31, 111, 95, 0.12)", strong: "rgba(31, 111, 95, 0.28)" },
    status: {
      success: "#1f6f5f",
      warning: "#b25e2e",
      danger:  "#9b2c2c",
      info:    "#2c5a8a",
      neutral: "#6b7a73",
    },
  },
  space:  { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48 },
  radius: { sm: 6, md: 10, lg: 14, pill: 999 },
  shadow: {
    sm: "0 4px 12px rgba(23, 50, 45, 0.06)",
    md: "0 10px 30px rgba(23, 50, 45, 0.08)",
    lg: "0 18px 48px rgba(23, 50, 45, 0.12)",
  },
  motion: {
    duration: { fast: 120, base: 200, slow: 280 },
    easing:   { standard: "cubic-bezier(0.23, 1, 0.32, 1)", emphasized: "cubic-bezier(0.2, 0, 0, 1)" },
  },
  typography: {
    fontHeading: '"Space Grotesk", "Sora", sans-serif',
    fontBody:    '"Sora", "Space Grotesk", "Segoe UI", sans-serif',
    scale: { xs: 12, sm: 14, md: 16, lg: 18, xl: 24, "2xl": 32, "3xl": 40 },
  },
} as const;

export type Tokens = typeof tokens;
