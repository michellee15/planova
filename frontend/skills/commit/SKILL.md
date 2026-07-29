---
name: commit
description: Record a coherent unit of work as a local commit — read the diff, check for stowaways, validate, stage by hand, and write a message that names the behavior change. Use when the user asks to "commit", "save progress", "stage changes", or "checkpoint" work without opening a PR, and as the commit discipline `ship` runs before it pushes. This skill never pushes. Universal Flexii skill — same name/intent across all repos.
---

# Commit

## When to use

- A coherent unit of work is finished, tested, and validated.
- Mid-feature, to checkpoint a passing state before the next step.
- The user asks to commit, save progress, stage changes, or checkpoint work without opening a PR.
- `ship` has reached its step 6, or `fix-pr` its step 8. This skill is the discipline those steps
  run. It is the same workflow either way — standalone it is the whole job, inside `ship` it is the
  step that puts the change, and `update-docs`'s doc edits, into the PR.

## When NOT to use

- Validation has not been run, or has not passed. Checkpointing over a known-red build is allowed
  only if the user explicitly asks for it, and it must be announced.
- The user asked to push or open a PR as well. That is `ship`. Do not push from here — `ship` runs
  this discipline and then pushes; this skill stops at the commit.

## Related skills

- `ship` — runs this skill's discipline at its step 6, then pushes and opens the PR.
- `fix-pr` — runs this same discipline before pushing each fix.
- `review` — run it on the diff before this skill; do not commit its findings.
- `test` — the tests it wrote should be passing before anything here is committed.

<!-- FLEXII:STANDARD:BEGIN — LOCAL to this repo. The drift check ignores everything between these markers. Name this repo's docs, its real executed validation command, its base branch, and its message conventions — these differ per repo and must never be inlined into the Workflow above. -->

## Standard

- Read: `docs/coding-constitution.md`, `docs/development.md`
- Validate with: `mise exec -- pnpm --filter <app> lint` and `mise exec -- pnpm --filter <app> test` for touched apps; type errors surface via `mise exec -- pnpm --filter <app> build` (`tsc -b`). Run all tooling through `mise exec --` so the mise-pinned Node/pnpm (`mise.toml`) are used, not whatever is on `PATH`
- Base branch: `dev` — never commit directly on it
- Message format: Conventional Commits — `type(scope): subject` (e.g. `fix(flex-store): …`, `chore(deps): …`); scope is usually the app or package
- Trailer: none required; AI-assisted commits add a `Co-authored-by:` line
- Pre-commit hook: `.husky/pre-commit` bootstraps mise shims then runs `pnpm nano-staged` (oxfmt on staged files, skipping generated read-only files) — do not bypass with `--no-verify`
- Stowaways: `pnpm-lock.yaml`, generated DTOs in `packages/api/lib`, generated `*.gen.ts` (i18n keys and the route manifest — built by Vite plugins, never hand-edited), and app `dist/` output — none of these belong in an unrelated commit
- Access order: `gh` > `git` > MCP.

<!-- FLEXII:STANDARD:END -->

## Preconditions

Run this first. It checks what this skill needs in *this* repo, fixes what is safe to fix on its
own, and stops with steps if something needs you:

```bash
./.agents/preflight.sh commit
```

Exit 0 — ready; whatever it auto-fixed is printed. Exit 1 — blocked; follow the steps it printed
rather than working around them. An environment problem worked around quietly does not stay an
environment problem — it becomes a wrong answer reported as a right one.


## Workflow

1. **Confirm the branch before anything else.** Validating and staging on the wrong branch wastes
   both:

   ```bash
   git branch --show-current
   ```

   If that prints the base branch named in `Standard`, do not commit. Branch first:

   ```bash
   git switch -c <branch>
   ```

2. **Read the whole diff.** Do not commit a diff you have not read.

   ```bash
   git status --short
   git diff
   git diff --staged
   ```

3. **Check for stowaways.** Go through `Standard`'s `Stowaways` list explicitly, and always look for
   `.DS_Store`, IDE files, scratch files, build output, and debug logging left in. Anything already
   staged that is not the point of this commit comes back out:

   ```bash
   git restore --staged <path>
   ```

4. **Format, then validate**, with the command in `Standard`. It must pass. If the formatter rewrote
   files, those edits are part of your change now — go back to step 2 and re-read the diff before
   staging.

   If validation fails, stop and report it rather than committing broken state. The one exception is
   an explicit user request to checkpoint over known failures — and then say so in the report.

5. **Stage deliberately.** Name every path, then confirm what landed:

   ```bash
   git add <path> <path>
   git diff --cached --stat
   ```

   Never `git add -A` or `git add .`. The staged list must be exactly what you intended, no more.

6. **Split by concern.** Separate commits when the changes differ in kind: dependency or tooling
   bumps, generated files, behavior implementation, tests, docs and agent config, unrelated feature
   areas. Keep together what is one coherent change — an implementation and its focused tests.
   More than one concern in the tree means repeating steps 5–9 per commit, not one commit that
   covers both.

7. **Write the message** in the format `Standard` names. The subject is imperative, under ~72
   characters, and describes the behavior change rather than the files touched. Add a body only
   when the *why* is not obvious from the subject. "fix bug" and "update code" are not commit
   messages.

8. **Commit.** Pass the message on stdin — this is the only form that gets a multi-line body and a
   trailer right without shell-quoting hazards:

   ```bash
   git commit -F - <<'EOF'
   <subject>

   <body, only if the why is not obvious>

   <the trailer from Standard, omitted entirely if Standard says none>
   EOF
   ```

   The blank line before the trailer is required — Git does not parse a trailer glued to the body.

   If `Standard` names a pre-commit hook, let it run. If it fails, fix the cause, re-stage (step 5),
   and commit again. Never `--no-verify`.

9. **Confirm the commit is what you meant**, before moving on or reporting done:

   ```bash
   git show --stat HEAD
   git status --short
   ```

## Output / Verification

- The validation command from `Standard`, with its output showing success — paste it, do not
  paraphrase it.
- `git show --stat HEAD` showing only the intended files, and the commit sha.
- `git status --short`, with any files still dirty named and explained — a leftover is either
  deliberate or a mistake, and the report must say which.
- State plainly if anything was skipped or is failing. A commit made over a failing build must be
  announced as such.

## Guardrails

- **Never `git add -A` / `git add .`.** It is the single mechanism by which unrelated work, secrets,
  and half-finished experiments end up in a PR.
- **Never commit on the base branch named in `Standard`.**
- **Never commit a credential, a signing secret, or an env file.** They are gitignored for a reason;
  do not force them in.
- **Never let a shared-dependency or submodule bump ride along.** It changes every consuming repo.
  It lands as its own PR, in the repo that owns it, first.
- **Committing is not authorization to push.** If the user asked to commit, commit — stop there.
  This skill has no push step, and adding one is `ship`'s job, under `ship`'s authorization rule.
- Never hand-edit generated files to make validation pass. Regenerate them via the documented path.
- Do not amend or rebase a commit that has already been pushed.
- Do not use interactive git flags (`-i`); they do not work in this environment.
- Do not bypass verification: no `--no-verify`.
