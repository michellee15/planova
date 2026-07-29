---
name: brainstorm
description: Stress-test a plan or design by interviewing down each branch of the decision tree, before any code is written. Use when the user asks to "brainstorm", to "grill me", to "stress-test" or "poke holes in" a plan, to "think through" an approach, or to compare two options — and when the shape of a change is not yet obvious or it touches more than one module. Universal Flexii skill — same name/intent across all repos.
---

# Brainstorm

## When to use

- The task's shape is not obvious, or two approaches look equally reasonable.
- The change crosses a layer boundary, or touches more than one module — `Standard` names what
  counts as a module here.
- Someone is about to add a dependency, a module, or a new external contract.
- The requirements are a sentence long and the implementation would be a week long.
- The user asks to be grilled on a plan they already have.

## When NOT to use

- The change is mechanical and its shape is already agreed (rename, dependency bump, typo).
- A design has already been decided and written down. Go to `plan`.
- You are debugging. Brainstorming a bug you have not reproduced is guessing.

<!-- FLEXII:STANDARD:BEGIN — LOCAL to this repo. The drift check ignores everything between these markers. Name this repo's docs, its real layering rule, what counts as a module, and where shared code lives — every one of these is a per-repo fact the Workflow must not hardcode. -->

## Standard

- Read: `docs/architecture.md`, `docs/coding-constitution.md` (the index of rule docs), and the domain rule doc matching the plan (forms → `docs/rhf-form-patterns.md`, data → `docs/data-fetching.md`, tables → `docs/ag-grid-patterns.md` / `docs/admin-table-patterns.md`)
- Layering: `apps/* (React SPAs) → packages/{ui,api,common,analytics} → packages/lint (shared config)`; an app never imports another app, a package never imports an app
- Module boundary: one pnpm workspace package under `apps/*` or `packages/*` (`pnpm-workspace.yaml`); the live list is `mise exec -- pnpm -r list --depth -1`
- Shared code: `packages/common` (`~common`), `packages/ui` (`~ui`), `packages/api` (`~api`) — workspace packages in this monorepo, not git submodules (there is no `.gitmodules`)
- Validate with: nothing runs here — this skill produces a decision, not a diff
- Access order: `gh` > `git` > MCP.

<!-- FLEXII:STANDARD:END -->

## Preconditions

Run this first. It checks what this skill needs in *this* repo, fixes what is safe to fix on its
own, and stops with steps if something needs you:

```bash
./.agents/preflight.sh brainstorm
```

Exit 0 — ready; whatever it auto-fixed is printed. Exit 1 — blocked; follow the steps it printed
rather than working around them. An environment problem worked around quietly does not stay an
environment problem — it becomes a wrong answer reported as a right one.


## Workflow

1. **Restate the problem** in one sentence, in terms of what the consumer of this code observes. If
   you cannot, you do not understand it yet — ask.

2. **Interview, one question at a time.** Walk down each branch of the design tree, resolving the
   dependencies between decisions one by one. Never batch five questions into one message — the user
   answers the easy one and the expensive branch goes unexplored.

   For every question, give your own recommended answer alongside it. A question without a
   recommendation makes the user do your thinking.

   **If a question can be answered by reading the codebase, read the codebase instead of asking it.**
   Spend the user's attention only on what the code cannot tell you.

3. **Establish the constraints before speculating.** Which layer does this belong in, per the
   `Layering` chain in `Standard`? What already exists that does part of this? Grep — do not assume.

4. **Check what is reusable — and prove the check actually ran.** If `Standard` says
   `Shared code: none`, skip this step and say so. Otherwise, shared code is frequently a git
   submodule, and an uninitialized submodule is an **empty directory**: every grep returns zero hits
   and the answer looks exactly like "nothing is reusable".

   Establish presence first. Both commands are repo-agnostic; the path comes from `Standard`:

   ```bash
   git submodule status
   ```

   - Prints nothing → this repo has no submodules; the `Shared code` path is an ordinary directory.
   - A line prefixed `-` → **not initialized**. The directory is empty. Any grep of it is invalid.
   - A line prefixed `+` → checked out at a commit other than the pinned one. It may be missing
     code that exists at the pin, or carry code that does not exist for anyone else.

   Initialize it — only if a `-` or `+` line appeared:

   ```bash
   git submodule update --init --recursive
   ```

   Then, and only then, search it:

   ```bash
   grep -rni '<concept>' <the Shared code path named in Standard>
   ```

   Zero hits from a directory you confirmed is populated is a finding. Zero hits from an empty one is
   not a finding — it is a failed check. Say which one you got.

5. **Ask whether it needs to exist at all.** The cheapest change is the one not made. If the need is
   speculative, say so and stop. Stopping here is a successful outcome, not a failed brainstorm.

6. **Enumerate 2–3 real approaches.** Not strawmen. For each: where the code lands, which modules it
   touches, what it forecloses.

7. **Walk the decision tree.** For each approach, in order:
   - Does it respect the dependency direction named as `Layering` in `Standard`?
   - Does it reuse what step 4 found — in this repo, in the `Shared code` path, or in the standard
     library?
   - Does it require a new dependency, module, or external contract? Each is a cost. A change to a
     surface other teams consume is that cost multiplied by every consumer.
   - Where is the data boundary, and does the approach cross one it should not?
   - What breaks in six months when the next person changes the adjacent code?

8. **Recommend one**, and name what you gave up by choosing it. An approach with no stated cost has
   not been analyzed.

9. **Write down the open questions** that only a human can answer.

## Output / Verification

A short written recommendation, practical enough to be handed straight to `plan` as its input:

- The restated problem.
- The approaches considered, and the decision-tree answers that eliminated the rejected ones.
- The recommendation, and the trade-off accepted with it.
- **The reuse check's status, stated explicitly**: the `Shared code` path was populated and searched,
  or `Standard` declares none. "I found nothing reusable" is not reportable unless you can say which.
- The open questions.

No code. No files edited. `git status --short` unchanged from when you started.

Hand off to `plan`.

## Guardrails

- **Do not write code.** Not even a sketch that "just shows the idea" — it becomes the
  implementation, and it does so without ever being planned or tested.
- **An empty directory is not evidence.** Zero grep hits from an uninitialized submodule means the
  reuse check did not run. Concluding "nothing is reusable" from it is a fabricated finding, and it
  is the most expensive mistake this skill can make: it justifies rebuilding what already exists.
- **Ask one question at a time.** A batch of questions is a questionnaire, not an interview, and the
  branch you most needed to explore is the one that gets skipped.
- Do not ask the user what the codebase can answer.
- Do not invent requirements to justify a more interesting design.
- If every approach requires violating the coding constitution named in `Standard`, the problem
  statement is wrong. Escalate rather than picking the least-bad violation.
- **Speculative generality is the default failure mode.** An interface with one implementation, a
  config flag for a value that never changes, a factory for one product, an abstraction added for the
  second consumer who never arrives — name these and cut them.
- Do not default to the heavyweight pattern for a small change. The architecture named in `Standard`
  is a constraint on where code goes, not a quota to fill.
