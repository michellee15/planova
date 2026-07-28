---
name: review
description: Review your own local diff — uncommitted or branch-local — against this repo's rules, before it goes anywhere. Use when the user asks to "review", "code review", "check my changes", "look over this", or "sanity check" their own work, or wants a pre-commit or pre-ship pass. Not for someone else's pull request. Universal Flexii skill — same name/intent across all repos.
---

# Review

## When to use

- Before `commit` or `ship`, on your own uncommitted or branch-local changes.
- After an AI agent has written code you are about to take responsibility for.
- The user asks what is wrong with what they just wrote, before anyone else sees it.

## When NOT to use

- Reviewing a GitHub pull request or someone else's branch. That is `pr-review`.
- Resolving review comments someone left for you. That is `fix-pr`.
- You already know what is broken and want it fixed. Implement and verify it before `commit`.

## Related skills

- `pr-review` — the same lenses, aimed at someone else's PR. It is the only one of the two that
  touches GitHub.
- `ship` — calls this skill on the branch diff before pushing. Do not ship this skill's findings.
- `commit` — records the reviewed change after findings are addressed.

<!-- FLEXII:STANDARD:BEGIN — LOCAL to this repo. The drift check ignores everything between these markers. Name this repo's architecture, real validation, base branch, and formatting reality. -->
## Standard

- Read: `package.json`, `src/server.js`, every changed file, and the related route, controller,
  model, middleware, service, or configuration module. No separate architecture or coding-rules
  document exists.
- Architecture: Express composition in `src/server.js` → routers and authentication middleware →
  request handlers → `src/models` for PostgreSQL or `src/services` for external HTTP. Models use the
  `pg` pool from `src/config/db.js`; controllers use inline request validation and local
  `try/catch` because no validation library or centralized error middleware is configured.
- Validate with: `npm start` from the backend directory. Confirm the startup message, then stop the
  process. This is only a boot smoke check; there is no test, lint, type-check, or format script.
- Base branch: `main` — review unstaged, staged, and `git diff main...HEAD` branch-local changes.
- Formatter: none configured. Review correctness and maintainability, but do not invent a style
  gate or present personal formatting preferences as defects.
- Access order: `git` > `gh` > other connectors. This skill reads; it does not publish.
<!-- FLEXII:STANDARD:END -->

## Preconditions

Inspect the local state and available npm scripts:

```bash
git status --short
git branch --show-current
npm pkg get scripts
```

There is no repository preflight script. Do not substitute another build system or an npm script
the package does not define.

## Workflow

1. **Get the diff.** All three views, because each hides work the others show. `<base>` is the base
   branch named in `Standard`:

   ```bash
   git status --short                 # untracked files and anything unstaged
   git diff                           # unstaged, tracked
   git diff --staged                  # staged
   git diff <base>...HEAD             # everything this branch adds on top of <base>
   ```

   `...` (three dots) is the branch view — it diffs against the merge base, so unrelated commits
   landed on `<base>` since you branched do not appear as your changes. Two dots would show them and
   send you reviewing other people's code.

   Read every hunk. A diff you skimmed is a review you did not do.

2. **Read the architecture named in `Standard` and verify it in the source tree.** Reviewing from
   memory of another backend invents rules this repository does not have.

3. **Check the Express boundaries first.**

   - Does `src/server.js` remain composition-only rather than absorbing feature behavior?
   - Does a router declare the method, path, middleware order, and handler without querying
     PostgreSQL or implementing response behavior?
   - Does protected routing run `requireAuthentication` before the handler, and does ownership reach
     the model query through `req.user.id`?
   - Does a controller parse `req.params`/`req.body`, apply the existing inline validation approach,
     call model/service functions, and return intentional status codes and JSON?
   - Does a model own parameterized SQL through the shared `pg` pool without importing Express
     request/response objects?
   - Does an external HTTP integration remain in `src/services` rather than a database model?
   - If centralized error middleware or a validation package is introduced, is it an intentional
     architecture change applied consistently rather than a framework-shaped one-off?

4. **Check secrets and logging.** Does any log line, error message, fixture, or test expose a token,
   a JWT, a signing secret, a session cookie, a password, a connection string, or PII? → blocking.
   This is the finding most likely to leak and the one no tool catches.

5. **Check correctness.** For each changed function, grep its callers. Does the change hold for all
   of them, or only the path the ticket named? A fix that is correct on one caller and wrong on the
   other three is a regression even when the server still starts.

6. **Check verification.** If the diff includes a backend test harness, verify the regression test
   fails without the fix and asserts observable behavior. The baseline has no test framework, so do
   not claim an automated test command passed. Require a concrete manual request/data failure
   scenario when automated coverage is unavailable.

7. **Check for reinvention.** Does `src`, an installed dependency, or Node already do this? A new
   dependency for one small utility is a finding.

8. **Check for speculative generality.** An interface with one implementation, a config for a value
   that never changes, a factory for one product, an abstraction for a second caller that does not
   exist. Each is a finding.

9. **Check the stowaways.** Unrelated dependencies or lockfile churn, `node_modules`, sibling
   frontend edits, editor/build output, `.env` or secrets, debug logging, or commented-out code.

10. **Validate with the command in `Standard`.** Report startup failure first, but distinguish a
    local environment problem from a failure introduced by the diff. State clearly that no
    automated test/lint/format gate exists.

## Output / Verification

Findings ranked most-severe first — by severity, never by file order. Each finding states:

- The file and line.
- One sentence naming the defect.
- A concrete failure scenario — inputs or state → wrong output. If you cannot write one, it is a
  preference, not a finding; drop it.

Then:

- The validation command from `Standard`, with its actual output.
- The diff commands from step 1 you ran, so the scope you reviewed is auditable.

If nothing survives, say so plainly. An empty review is a valid review; padding it with nits is not.

## Guardrails

- **Report locally. This skill publishes nothing.** No `gh pr comment`, no `gh pr review`, no
  `gh api`, and no connector write. The findings go to the user, in the conversation, and the author decides.
  Posting to GitHub is `pr-review`'s job and only when a PR exists — this diff may not even be
  committed yet.
- **Do not fix while reviewing.** Report, then let the author decide. Mixing them hides the
  findings — a fixed diff and a reviewed diff look identical afterwards, and nobody learns what was
  wrong.
- **Do not report a finding you have not verified against the actual code.** "This might be a
  problem" is not a finding. Open the file, follow the callers, then write it down.
- Do not invent a formatting rule when `Standard` names no formatter.
- Do not restate what the code does. The author knows.
- Do not expand scope. Code the diff did not touch is not under review, however much you want it to
  be.
- **A clean review is not a successful smoke check, and a successful smoke check is not a clean
  review.** Report both, including the absence of an automated test gate.
