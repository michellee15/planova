---
name: new-ui-component
description: Create a new shared UI component in the `packages/ui` package, using shadcn/ui as the base and adapting it to Flexii conventions. Use when adding a reusable atom/molecule to the design system — never for feature-specific components.
---

# New UI Component (packages/ui)

## When to use
- Adding a new reusable primitive (atom or simple molecule) to the shared design system
- Porting a shadcn/ui component into this repo and adapting it to Flexii conventions
- Extending the component gallery with a design-system-level component consumed by multiple apps

## When NOT to use
- The component is feature-specific — it belongs in `apps/<app>/src/features/<domain>/<feature>/components/`, not `packages/ui` (see `atomic-design-patterns.mdc`)
- You are migrating a Formik form → use `formik-to-rhf-refactor`
- You only need to compose existing `@ui/components/*` in an app — just import them
- The change is a bug fix or tweak to an existing component — edit it directly and follow the same conventions

## Related skills
- `pr-review` / `review` — review the new component against repo rules before shipping
- `commit` / `ship` — commit and open the PR
- `formik-to-rhf-refactor` — when the component is a form input meant to bind to RHF in consumers

## Standard
- Package: **`packages/ui`** (package name `~ui`). Create components **only** under `packages/ui/src/components/*.tsx`.
- shadcn config: `packages/ui/components.json` — style `new-york`, base color `neutral`, icon library `lucide`, Tailwind **v4** (no `tailwind.config`, CSS-variable driven), aliases `@ui/components`, `@ui/lib/utils`, `@ui/lib`, `@ui/hooks`.
- Read before editing:
  - `docs/atomic-design-patterns.md` — placement (atoms/molecules → `packages/ui`) and the MUI→shadcn migration rule
  - `docs/react-patterns.md`, `docs/types-conventions.md`, `docs/string-constants.md`
  - `packages/ui/src/components/Button.tsx` — the canonical example (`cva` variants, `cn`, `data-slot`, named exports)
  - `packages/ui/src/shadcn.css` and `packages/ui/src/theme.css` — the semantic color tokens and base palette
- Validate with (run inside `packages/ui`):
  - `pnpm lint` (eslint, `--max-warnings=0`)
  - `pnpm format` (oxfmt)
  - `pnpm start` (vite preview app) to view the component in the gallery

## Required rule reads
- `.cursor/rules/atomic-design-patterns.mdc` — hierarchy + `packages/ui` placement, shadcn-over-MUI mandate
- `.cursor/rules/react-patterns.mdc` — component structure, separation of concerns
- `.cursor/rules/types-conventions.mdc` — inference over assertions, prop typing
- `.cursor/rules/string-constants.mdc` — no bare string literals in logic (variant keys use `as const`/`cva`)

## Workflow

### 1. Confirm placement
- Confirm the component is a design-system atom/molecule reused across apps. If it is feature-specific, stop — it does not belong in `packages/ui` (`atomic-design-patterns.mdc`).
- Pick a `PascalCase` name matching the existing convention (`Button.tsx`, `SearchInput.tsx`). Check `packages/ui/src/components/` first — do not duplicate an existing component.

### 2. Scaffold from shadcn (optional starting point)
- From inside `packages/ui`, you may seed the file with `npx shadcn@latest add <name>`. The CLI emits a lowercase file (e.g. `button.tsx`) — treat its output as raw material, not the final file.
- If not using the CLI, hand-write the component using an existing sibling component as the template.

### 3. Adapt to Flexii conventions
- **Rename** the file to `PascalCase` (`src/components/<Name>.tsx`).
- **Imports**: pull `cn` from `@ui/lib/utils`; use Radix / `@base-ui/react` primitives already in `packages/ui/package.json` (add a new dep only if genuinely required, and note it in the PR).
- **Variants**: use `cva` + `VariantProps` for style variants, mirroring `Button.tsx`.
- **Props**: type with `React.ComponentProps<'element'>` (or the primitive's props) intersected with variant/extra props; prefer inference over assertions.
- **Slots**: add `data-slot="<name>"` on rendered elements, consistent with existing components.
- **Exports**: named exports (`export { Foo, fooVariants }`) — matches how apps import `@ui/components/<Name>`.

### 4. Wire colors through semantic tokens
- Do **not** hardcode raw shadcn default tokens or hex values in the component. Use the repo's semantic tokens (e.g. `bg-button-background`, `text-secondary-foreground`).
- If the component needs a new semantic token, define it in `packages/ui/src/shadcn.css` (under `@theme inline`) mapped onto the base palette in `packages/ui/src/theme.css` — do not invent new base colors casually.

### 5. Register in the preview gallery
- Add a `ComponentDemo` entry to the appropriate category file under `packages/ui/src/gallery/demos/*.tsx` (or create one). The gallery registry auto-collects it via `import.meta.glob`, so the sidebar and the `/components/$slug` page pick it up with no route edits.

### 6. Validate
- From `packages/ui`: `pnpm lint` and `pnpm format`.
- Run `pnpm start` and confirm the component renders correctly in the gallery, including each variant/size.

## Output / Verification
- New file `packages/ui/src/components/<Name>.tsx`, `PascalCase`, named export(s), uses `cn` + `cva` + `data-slot`.
- Any new color goes through a semantic token in `shadcn.css`/`theme.css`, not a hardcoded value.
- Component is registered as a `ComponentDemo` in a `packages/ui/src/gallery/demos/*.tsx` file and renders in the gallery.
- `pnpm lint` passes with zero warnings; `pnpm format` clean.
- Consumers can import it as `import { <Name> } from '@ui/components/<Name>'`.

## Boundaries
- Do not create the component anywhere except `packages/ui/src/components/` — feature components live in app `features/` folders.
- Do not add business logic, data fetching, i18n, or feature-specific behavior to a shared UI component — keep it presentational and prop-driven.
- Do not introduce raw hex colors or default shadcn tokens — route color through the repo's semantic tokens.
- Do not add new npm dependencies silently; call them out and prefer primitives already present in `packages/ui`.
- Do not modify the component gallery or shared CSS beyond what the new component requires.
