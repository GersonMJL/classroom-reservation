---
description: "Use when building or changing frontend UI (React, MUI, CSS) to enforce the project design system, interaction quality, and layout consistency."
applyTo: "frontend/app/**/*.{ts,tsx,css}"
---
# Frontend Design System Rules

## Scope
- Apply these rules to all UI changes in the frontend app with no exceptions.
- Prefer extending shared theme/layout patterns instead of creating one-off page styles.
- Scope is limited to app UI files only (`frontend/app/**/*.{ts,tsx,css}`).

## Visual Direction
- Keep the current visual identity: earthy light palette, atmospheric background, rounded surfaces, and expressive typography.
- Use existing theme tokens and component overrides in root theme before introducing per-component colors.
- Avoid generic defaults (plain white screens, default font stacks, weak contrast buttons).

## Typography And Copy
- Maintain expressive heading hierarchy and clear scanning structure (title, support text, actions).
- Keep developer-facing code/comments in English.
- Keep end-user UI text in pt-BR.

## Layout And Components
- Build pages with clear sections: header/context, primary actions, content surface (table/card/form).
- Prefer MUI components aligned with theme defaults (Paper, Button, Chip, Table, Dialog).
- Preserve responsive behavior for desktop and mobile; avoid fixed widths that break small screens.

## Motion And Interaction
- Every animation must have purpose (feedback, state change, spatial continuity).
- Use transitions on specific properties only (never `transition: all`).
- Default to strong ease-out/ease-in-out curves for UI motion; keep common UI animations under 300ms.
- Add subtle press feedback for interactive elements (`:active` scale around 0.97).
- Never animate element entry from `scale(0)`; use opacity with scale near 0.95 when needed.
- Respect reduced motion preferences.

## Consistency Rules
- New pages should match existing shell patterns: top navigation, spacing rhythm, card/table treatment, and button hierarchy.
- Reuse established patterns for auth pages and management pages instead of introducing alternate visual systems.
- If a new pattern is required, add it to shared theme/styles first, then consume it in feature pages.
- Do not bypass this instruction for prototypes or temporary screens.

## Change Quality Checklist
- Is the UI text in pt-BR?
- Does the page look coherent with existing screens?
- Are interactions responsive (hover/press/loading/disabled)?
- Are animations purposeful, short, and interruptible?
- Does it work on mobile and desktop?
