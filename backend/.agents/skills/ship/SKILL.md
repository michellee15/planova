---
name: ship
description: Ship a completed change — validate, update the docs it affects, commit, push, and open a pull request. Use when the user asks to ship, open a PR, push for review, or prepare a change to land. Universal Flexii skill — same name/intent across all repos.
---

# Ship

## When to use

- The change is complete, the repository's available validation passes, and `review` has run clean.
- The user has asked for a PR, or has authorized pushing.

## When NOT to use

- The startup smoke check is failing. Ship nothing known-broken.
- The user asked only to commit, with no push. That is `commit`.
- There are unresolved review comments on an existing PR. That is `fix-pr`.

## Related skills

- `review` — run it on the branch diff before this skill; do not ship its findings.
- `commit` — this skill runs the same commit discipline, at step 6.
- `update-docs` — this skill calls it, at step 5.

<!-- FLEXII:STANDARD:BEGIN — LOCAL to this repo. The drift check ignores everything between these markers. Name this repo's architecture, real validation, base branch, and documentation reality. -->
## Standard

- Read: `package.json`, `package-lock.json`, `src/server.js`, every changed backend file, and the
  repository root `README.md` only when documentation is in scope.
- Architecture: CommonJS Express routers and handlers; JWT authentication middleware; inline
  handler validation and local `try/catch`; PostgreSQL access in `src/models` through
  `src/config/db.js`; external HTTP integrations in `src/services`; environment configuration via
  `dotenv` and `process.env`.
- Validate with: `npm start` from the backend directory. Confirm the server startup message, then
  stop the process. No test, lint, type-check, or format script exists, and no GitHub Actions
  workflow is present to supply that missing gate. State this limitation in the PR.
- Base branch: `main`.
- Changelog: none. Do not create one implicitly.
- Pull request template: none currently present.
- Access order: `gh` > `git` > other connectors.
<!-- FLEXII:STANDARD:END -->

## Preconditions

Confirm authorization, branch, and available scripts:

```bash
git branch --show-current
git status --short
npm pkg get scripts
gh --version
```

There is no repository preflight script. Do not replace missing npm gates with another build system
or claim checks that do not exist.

## Workflow

1. **Confirm authorization.** Pushing and opening a PR are outward-facing. Do not do either unless
   the user asked. Approval to commit is not approval to push.
2. **Run `review`** on the branch diff if it has not already run. Do not ship findings.
3. **Confirm the branch.** Never push to the base branch named in `Standard`. If you are on it,
   branch first.
4. **Validate** with the command in `Standard`. Paste the startup result, stop the process cleanly,
   and state that no automated test/lint/format gate exists. If startup fails, stop and say so.
5. **Call `update-docs`.** This is mandatory, not optional. It decides whether the change is
   doc-affecting and updates the docs in *this* PR. If it determines nothing is doc-affecting, that
   is a valid outcome — **record it explicitly**, or a correct decision is indistinguishable from a
   skipped step.
6. **Commit everything this PR ships**, via the `commit` skill's discipline: stage intentionally,
   split by concern, keep unrelated dirty work out.

   This step is what puts step 5's doc edits into the PR. Skipping it means `update-docs` ran,
   edited the docs, and the edits never left your working tree.

   If `Standard` names a changelog and the change is user-visible, update it here too. If `Standard`
   says `none`, there is nothing to update — do not create one.

7. **Check for stowaways one last time.** Unrelated dependency or lockfile changes, `node_modules`,
   `.env`, secrets, debug logs, and sibling frontend work do not ship. Unstage them.
8. **Push**: `git push -u origin <branch>`.
9. **Look for a PR template** — `.github/pull_request_template.md` or
   `.github/PULL_REQUEST_TEMPLATE/` — and structure the description with it if one exists. Preserve
   its headings; fill every applicable section; `N/A` the rest; check a box only when it is true.
10. **Open the PR** against the base branch in `Standard`. `gh pr create` fails non-interactively
    without a title, so always pass one:

    ```bash
    gh pr create --base <base> --title "<title>" --body-file <path>
    ```

    The description states: what changed, why, how it was verified (the actual command and its
    result), and which docs moved. Keep local-only detail out — no absolute home paths, usernames,
    hostnames, or machine-specific wrappers. Validation commands must be ones a teammate can run.
11. **Report the PR URL** back as a full link.

## Output / Verification

- The startup smoke result and an explicit statement that no automated test/lint/format script ran.
- The list of docs `update-docs` changed, or an explicit "not doc-affecting".
- `git status --short` clean of anything this PR should have shipped.
- The PR URL, as a markdown link.

## Guardrails

- **Docs ship with the code.** A doc update deferred to a follow-up PR is a doc update that will not
  happen. This is the single rule that keeps code, docs, rules, and skills in sync.
- **Never push to the base branch.**
- Do not open a PR over a failing startup smoke check to "get eyes on it". Say it is failing instead.
- Do not force-push a branch someone else may have pulled.
- **Never push a credential, a signing secret, or an env file.** Not in a commit, not in a PR body.
- Never bundle an unrelated npm dependency or lockfile change with the feature.
- Do not add a generated-by footer; this repository has no such PR-body convention.
