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

<!-- FLEXII:STANDARD:BEGIN — LOCAL to this repo. The drift check ignores everything between these markers. Name this repo's real validation, base branch, message convention, and stowaways. -->
## Standard

- Read: `package.json`, `package-lock.json`, `src/server.js`, and every changed backend file. This
  backend has no separate architecture, coding-rules, or development document.
- Validate with: `npm start` from the backend directory. Confirm
  `Server is running on port <port>`, then stop the process. This is a startup smoke check, not a
  complete test: `package.json` defines no test, lint, type-check, or format script. Never report
  those checks as passing.
- Base branch: `main` — never commit application work directly on it.
- Architecture: CommonJS Express routers and request handlers call `src/models` for `pg` queries;
  middleware owns authentication; `src/services` owns external integrations; configuration comes
  from `dotenv` and `process.env`.
- Message format: a plain imperative subject describing the behavior change. Backend history uses
  subjects such as `Implement geocoding location when user typed in itinerary`; it does not
  consistently use Conventional Commits.
- Trailer: none.
- Pre-commit hook: none. The repository contains only sample hooks and has no configured hooks path.
- Stowaways:
  - `.env`, credentials, JWTs, database connection details, or request data containing PII.
  - `node_modules/`, editor files, logs, coverage/build output, or scratch scripts.
  - Unrelated `package-lock.json` churn when dependencies did not intentionally change.
  - Debug logging or unrelated changes in the sibling frontend.
- Access order: `git` first for local commits; use GitHub only when remote context is required.
<!-- FLEXII:STANDARD:END -->

## Preconditions

Run these read-only checks from the backend directory:

```bash
git branch --show-current
git status --short
npm pkg get scripts
```

There is no repository preflight script. If dependencies are unavailable, report that before
validation; do not silently substitute another package manager or build system.

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

3. **Check for stowaways.** Apply `Standard`'s list explicitly, including changes outside the
   backend. Anything staged that is not part of this commit comes back out:

   ```bash
   git restore --staged <path>
   ```

4. **Validate** with the command in `Standard`. Confirm startup, stop the process cleanly, and state
   the limits of the smoke check. No formatter or automated test script is configured.

   If validation fails, stop and report it rather than committing broken state. The one exception is
   an explicit user request to checkpoint over known failures — and then say so in the report.

5. **Stage deliberately.** Name every path, then confirm what landed:

   ```bash
   git add <path> <path>
   git diff --cached --stat
   ```

   Never `git add -A` or `git add .`. The staged list must be exactly what you intended, no more.

6. **Split by concern.** Separate commits when changes differ in kind: dependencies, application
   behavior, tests if a harness is later added, docs, skills, or unrelated feature areas. Keep
   together what forms one coherent behavior.
   More than one concern in the tree means repeating steps 5–9 per commit, not one commit that
   covers both.

7. **Write the message** in the format `Standard` names. The subject is imperative, under ~72
   characters, and describes the behavior change rather than the files touched. Add a body only
   when the *why* is not obvious from the subject. "fix bug" and "update code" are not commit
   messages.

8. **Commit** without bypassing hooks:

   ```bash
   git commit -m "<imperative subject>"
   ```

   Add a second `-m "<body>"` only when the reason is not obvious. Never use `--no-verify`.

9. **Confirm the commit is what you meant**, before moving on or reporting done:

   ```bash
   git show --stat HEAD
   git status --short
   ```

## Output / Verification

- The exact startup smoke-check result and the explicit fact that no automated test, lint, type
  check, or format script exists.
- `git show --stat HEAD` showing only the intended files, and the commit sha.
- `git status --short`, with any files still dirty named and explained — a leftover is either
  deliberate or a mistake, and the report must say which.
- State plainly if anything was skipped or is failing. A commit made over failing available
  validation must be announced as such.

## Guardrails

- **Never `git add -A` / `git add .`.** It is the single mechanism by which unrelated work, secrets,
  and half-finished experiments end up in a PR.
- **Never commit on the base branch named in `Standard`.**
- **Never commit a credential, a signing secret, or an env file.** They are gitignored for a reason;
  do not force them in.
- Never let an unrelated dependency or `package-lock.json` change ride along.
- **Committing is not authorization to push.** If the user asked to commit, commit — stop there.
  This skill has no push step, and adding one is `ship`'s job, under `ship`'s authorization rule.
- Never hand-edit `package-lock.json`; update it through npm only when dependencies intentionally
  change.
- Do not invent a passing test, lint, or formatter result when the npm script does not exist.
- Do not amend or rebase a commit that has already been pushed.
- Do not use interactive git flags (`-i`); they do not work in this environment.
- Do not bypass verification: no `--no-verify`.
