# Web UI Cleanup Plan

## Goal

Make Tailwind CSS and shadcn/ui the primary styling and component strategy for
the web application, beginning with the Planning workflow.

## 1. Establish the UI Foundation

- Keep the TweakCN-generated tokens in `frontend/lib/theme/globals.css` as the
  canonical shared web theme.
- Keep Tailwind v4 integrated through Vite.
- Add new shadcn primitives through the shadcn CLI and maintain their settings
  in `frontend/app/web/components.json`.
- Use the configured `@/components` and `@/lib` aliases for web imports.

## 2. Standardize Core Primitives

- Replace the custom Button with the shadcn Button.
- Add and use shadcn `Avatar`, `Card`, `Badge`, `Dialog`, `Input`, `Select`,
  `ToggleGroup`, `Separator`, `Alert`, `Skeleton`, and `Empty` where each is
  the appropriate product primitive.
- Do not add new hand-built equivalents of those patterns.

## 3. Refactor Planning First

Split `frontend/app/web/src/features/planning/index.tsx` into focused,
readable components:

- `planning-page`
- `event-header`
- `planning-filters`
- `team-card`
- `volunteer-roster`
- `volunteer-picker`
- `volunteer-role-editor`

Format JSX as readable multiline component composition. Migrate
`planning-schedule-board.css` incrementally to Tailwind utilities and shadcn
components; remove bespoke CSS only after its replacement is active.

## 4. Improve Role Editing

- Use a shadcn Popover or Dialog for role editing.
- Make the emoji control open an emoji picker rather than accepting typed text.
- Preserve the existing API mutation that persists role name and emoji.

## 5. Migrate Remaining Web Workflows

Apply the same strategy to Volunteer, Dashboard, authentication, navigation,
and theme controls. Retire old feature-specific CSS one workflow at a time,
not through a risky application-wide rewrite.

## 6. Add Guardrails

- Adopt automatic formatting with Biome or Prettier.
- Add linting rules that discourage raw controls where a shadcn primitive is
  available and prevent unreadable JSX formatting.
- Require web typechecking and production builds after each migration slice.
