---
name: update-docs
description: Decide whether a completed change is doc-affecting, and update the docs it affects in the same pull request as the code. Use when the user asks to "update the docs", "update /docs", "document this", or "sync the docs" — and whenever `ship` calls it at step 5. Concluding that a change is *not* doc-affecting is a successful outcome of this skill, but it must be stated as a verdict, never left silent. Universal Flexii skill — same name/intent across all repos.
---

# Update Docs

## When to use

- `ship` calls it, at step 5, on **every** change — not only the ones you expect to be doc-affecting.
  Deciding is this skill's job, not the caller's.
- A change alters architecture, commands, conventions, or an externally-visible contract.
- The user asks to update, sync, or write the docs for a change that is already made.

## When NOT to use

- **Bug fixes inside an existing layer, test-only changes, and dependency bumps with no behavioral
  change are explicitly not doc-affecting.** Do not pad a PR with doc churn to look thorough. Run the
  skill, reach the verdict, report it — but change no doc.
- The change is not written yet. Docs describe what the code does. That is `plan`.
- You are adding, renaming, or removing a *skill*. That is `new-skill`, which owns the routing table
  and the skill set version. See step 6.

## Related skills

- `ship` — the usual caller; it calls this skill at step 5 and commits its edits at step 6.
- `new-skill` — owns skill registration and the skill set version bump. This skill never does either.
- `commit` — the doc edit ships in the same commit series as the code, never a follow-up.

<!-- FLEXII:STANDARD:BEGIN — LOCAL to this repo. The drift check ignores everything between these markers. Name this repo's governing doc, the docs it actually has, its base branch, and its real mirror-verification command. A repo with no docs/ says so — do not invent one. -->

## Standard

- Governing doc: `docs/docs-constitution.md` — its "When to update a doc" section decides what changes
- Docs in this repo: `architecture.md` (monorepo layout + stack), `development.md` (build/test/lint/format commands), `coding-constitution.md` (index of rule docs), `docs-constitution.md` (how /docs itself works + the mirroring model), `tooling.md` (DTO codegen); plus narrow single-topic rule docs — `file-folder-structure.md`, `types-conventions.md`, `string-constants.md`, `react-patterns.md`, `useeffect-patterns.md`, `atomic-design-patterns.md`, `i18n-conventions.md`, `rhf-form-patterns.md`, `data-fetching.md`, `state-management.md`, `ag-grid-patterns.md`, `admin-table-patterns.md`, `admin-embed-auth.md`
- Base branch: `dev`
- Mirror check: `find -L .cursor/rules -type l -print` must resolve (no broken links). Rule docs also have a hand-maintained (non-symlink) Copilot mirror under `.github/instructions/*.instructions.md` — update it by hand when the `/docs` file changes (see `docs-constitution.md`)
- Access order: `gh` > `git` > MCP.

<!-- FLEXII:STANDARD:END -->

## Preconditions

Run this first. It checks what this skill needs in *this* repo, fixes what is safe to fix on its
own, and stops with steps if something needs you:

```bash
./.agents/preflight.sh update-docs
```

Exit 0 — ready; whatever it auto-fixed is printed. Exit 1 — blocked; follow the steps it printed
rather than working around them. An environment problem worked around quietly does not stay an
environment problem — it becomes a wrong answer reported as a right one.


## Workflow

1. **Enumerate what actually changed.** You cannot classify a change you have not read. Diff against
   the base branch named in `Standard`:

   ```bash
   git diff --name-status <base>...HEAD
   ```

   Work from this list, not from your memory of what you just did.

2. **Read the governing doc named in `Standard`.** Its "when a doc must change" table is the decision
   procedure. Do not improvise one.

   If `Standard` says `none`, this repo has no governing doc — classify against what the docs named in
   `Standard` each own, and say in step 4's verdict that you did so and why. If `Standard` names no
   docs either, the verdict is `no docs in this repo`; report it and stop. Do not create a docs tree
   to have something to update; that is a deliberate, separate decision the repo team makes.

3. **Classify every path from step 1** against that table. A change is doc-affecting only if a rule
   row matches it. Name the row that matched — "it felt architectural" is not a match.

4. **State the verdict. Always — in both directions.** This is the step the whole skill exists to
   make visible: a considered "nothing matched" and a skipped step are indistinguishable unless you
   say which one happened. Emit one of these two blocks verbatim, filled in:

   ```
   docs verdict: not doc-affecting
     changed:    <N paths> — <the paths, or the directories they group into>
     classified: <bug fix inside a layer | test-only | dependency bump, no behavior change | other>
     checked:    <the governing doc's rule rows, named>
     matched:    none — <the one sentence saying why>
   ```

   ```
   docs verdict: doc-affecting
     changed:    <N paths> — <the paths, or the directories they group into>
     matched:    <rule row> → <doc>
     edited:     <doc> — <the one fact that changed>
   ```

   Return this block to `ship`, which puts it in the PR body. A `not doc-affecting` verdict ends the
   run here, successfully. Steps 5–8 are for the other verdict.

5. **Pick exactly one doc per fact.** A fact recorded in two docs is a fact that will go stale in one.
   If it fits two, it belongs in the more specific one.

6. **Edit in place.** Extend an existing section rather than appending a new one. Delete the sentence
   that is now false in the same edit — deletion beats deprecation.

7. **Confirm the frontmatter survived**, if you touched a rule doc. A mangled block breaks the rule
   silently in the tools that read it. The first line must be exactly `---`:

   ```bash
   head -5 <doc>
   ```

8. **Clear stale `TODO(flexii)` markers** you are now able to answer. Find them:

   ```bash
   git grep -n "TODO(flexii)" -- <doc>
   ```

   Answer the ones this change resolves. Do not add new ones for anything you could have determined by
   reading the code.

9. **If a skill changed, do not register it here.** `new-skill` owns the `AGENTS.md` routing table row
   and the skill set version line. On the normal `new-skill` → `ship` → `update-docs` path it has
   already done both, and bumping again would land the version two ahead of reality for one change.

   Confirm rather than repeat — the routing row and the version, against the current diff:

   ```bash
   git diff -- AGENTS.md
   ```

   Only if the diff shows the row or the bump is genuinely missing, add the missing half and say in
   your report that you did. Never bump a version that this change already bumped.

10. **Verify the mirrors still resolve**, with the mirror check command from `Standard`. If `Standard`
    says `none`, there is nothing to verify — say so rather than inventing a check that passes
    vacuously.

## Output / Verification

- **The step 4 verdict block, always** — including, and especially, when the verdict is
  `not doc-affecting`. A run that reports no verdict has not run.
- Each doc changed, and for each, the one line of what fact changed.
- The mirror check from `Standard`, with its output showing success — or an explicit "no mirrors in
  this repo".
- `git diff --name-only <base>...HEAD -- <docs>` showing the doc edits are in this branch, ready for
  `ship` to commit. An edit left unstaged and uncommitted did not ship.

## Guardrails

- **A correct "no" must never look like inaction.** This skill's reputation problem is that a
  considered verdict and a skipped step read identically from the outside. The verdict block is not
  ceremony — it is the deliverable on every run that changes no doc.
- **Do not pad a PR with doc churn to look thorough.** The pressure to produce a visible artifact is
  real, and editing a doc is the wrong way to relieve it. The verdict is the artifact.
- **Docs ship in the same pull request as the code.** Never a follow-up. A deferred doc update is a
  doc update that will not happen.
- **Never bump the skill set version here.** `new-skill` owns it. Two skills bumping one integer for
  one change is how a version stops meaning anything.
- **Never copy rule text into a mirror.** Mirrors are symlinks into the docs. If you are pasting, stop
  — you are about to create a second source of truth.
- **Never create a doc that duplicates another.** Extend the existing one.
- Do not write aspirational documentation. Document what the code does, not what it should do.
- Every command you add to a doc must have been run, from the repo root, exactly as written.
- Do not invent this repo's domain rules. Architecture decisions and coding conventions are owned by
  the repo team. Leave a `TODO(flexii)` naming what is unknown rather than guessing.
