---
name: pr-review
description: Review someone else's GitHub pull request, or a branch you did not author, for bugs and rule violations — and optionally post the findings as inline review comments. Use when the user asks to "review", "PR review", "code review", "look at", or "check" a PR number, PR URL, or a teammate's branch — not your own local diff. Universal Flexii skill — same name/intent across all repos.
---

# PR Review

## When to use

- Reviewing an open GitHub pull request, by number or URL.
- Reviewing a branch you did not author, that has no PR open yet.
- The user asks what in a change does not align with this repo's conventions.

## When NOT to use

- Reviewing your own uncommitted or branch-local work. That is `review`.
- Acting on review threads that already exist on a PR — verifying, fixing, replying, resolving.
  That is `fix-pr`. This skill *generates* findings; `fix-pr` *closes* them.
- You have been asked to fix what you find. Review first, report, then let the user decide. This
  skill never repairs.

## Related skills

- `review` — the same judgement applied to *your own* diff, before you ship it.
- `fix-pr` — run it after this skill if the findings are to be addressed on the PR.

<!-- FLEXII:STANDARD:BEGIN — LOCAL to this repo. The drift check ignores everything between these markers. Name this repo's architecture, real validation, base branch, and setup. -->
## Standard

- Read: `package.json`, `src/server.js`, every changed file, and the related route, controller,
  model, middleware, service, or configuration module.
- Architecture: `src/server.js` composes Express; routers declare paths and middleware; controllers
  own request parsing, inline validation, model/service calls, and responses; models own PostgreSQL
  queries through `src/config/db.js`; services own external HTTP integrations; authentication
  middleware verifies JWTs and sets `req.user`.
- Error handling: request handlers currently use local `try/catch` and JSON responses. No
  centralized error-handling middleware exists.
- Validate with: `npm start` on the checked-out branch, confirm the server startup message, then
  stop it. This is only a boot smoke check: no test, lint, type-check, or format script exists.
- Base branch: `main`.
- Pre-build setup: from the backend directory run `npm ci` when dependencies are absent or stale.
  The lockfile is `package-lock.json`; no separate module seeding or shared checkout is required.
- Access order: `gh` > `git` > other connectors.
<!-- FLEXII:STANDARD:END -->

## Preconditions

Confirm the tools and repository state:

```bash
gh --version
git status --short
npm pkg get scripts
```

There is no repository preflight script. Do not treat a missing dependency install or local
environment value as the author's defect.

## Workflow

1. **Identify the review surface and fetch the change.** Do not review from a title or description
   alone.

   For a **pull request** — intent, then the change:

   ```bash
   gh pr view <n>          # description, author, base
   gh pr diff <n>          # the change itself
   ```

   For a **branch with no PR**, diff it against the base branch named in `Standard`. The
   three-dot form diffs against the merge base, so unrelated commits landed on the base since the
   branch forked do not pollute the review:

   ```bash
   git fetch origin
   git diff origin/<base>...origin/<branch>              # the change
   git diff --name-only origin/<base>...origin/<branch>  # the file list
   ```

   A PR whose description does not match its diff is itself a finding.

2. **Check it out and run the available validation.** Do not review only from a remote diff.

   ```bash
   gh pr checkout <n>      # PR
   git checkout <branch>   # branch with no PR
   ```

   Then run the dependency setup only if needed and the startup smoke command in `Standard`.

   If startup fails, decide whose failure it is before writing it down. A failure that reproduces on
   `main`, or that dependency setup fixes, is environmental.

3. **Check the Express boundaries first.** Routers should compose middleware and handlers;
   controllers should not embed SQL; models should not depend on Express request/response objects;
   authentication must run before protected handlers; services should isolate external HTTP
   details. Judge the current CommonJS code, not the architecture of another repository.

4. **Check correctness.** For every changed function, grep its callers on the PR branch. Does the
   change hold for all of them, or only the path the author was thinking about? Sibling callers left
   broken is the most common real bug in a passing PR.

5. **Check verification.** If the PR adds or uses a backend test harness, confirm a regression test
   would fail without the fix and asserts observable behavior. The baseline has no test framework,
   so do not claim an automated test command ran. Require a reproducible manual API/data scenario
   when automated coverage is unavailable.

6. **Check for reinvention** in `src`, installed dependencies, or Node itself, and for speculative
   wrappers, configuration, or abstractions with no second use.

7. **Check the stowaways**: unrelated dependencies or lockfile churn, `node_modules`, `.env` or
   credentials, debug logging, build output, commented-out code, or sibling frontend changes.

8. **Verify every finding before reporting it.** Read the surrounding code at HEAD; do not report
   from the diff hunk alone. Construct the failure: inputs or state → wrong output or crash. If you
   cannot construct one, it is a preference, not a finding. Drop it.

9. **Post the review — only if the user asked for it.** Reporting back in chat is the default; see
   the Guardrails. When the user does ask, post **one** review carrying every finding inline.

   `gh pr review` and `gh pr comment` cannot do this — neither has a `--path` or `--line` flag, and
   both post a single top-level body with no anchor. Only the REST reviews endpoint takes a
   `comments[]` array. One POST creates and submits the whole review atomically — that is what
   "submit once" means; there is no pending state to manage.

   Pass the payload as JSON on stdin. Do **not** build it from repeated `-f 'comments[][path]=…'`
   flags: `gh` groups repeated `-f` array fields correctly but sends every value as a *string*, and
   the endpoint rejects a string `line`; mixing in `-F` to get an integer `line` makes `gh` fill the
   objects in the wrong order and silently misattribute findings to the wrong files.

   ```bash
   gh api repos/{owner}/{repo}/pulls/<n>/reviews -X POST --input - <<'JSON'
   {
     "event": "COMMENT",
     "body": "<the summary — what you reviewed, and whether the startup smoke check passed>",
     "comments": [
       {"path": "<repo-relative/path.ext>", "line": 42, "side": "RIGHT", "body": "<finding>"},
       {"path": "<repo-relative/path.ext>", "line": 7,  "side": "RIGHT", "body": "<finding>"}
     ]
   }
   JSON
   ```

   - `gh` fills `{owner}` and `{repo}` from the checkout — leave them literal.
   - `path` is repo-relative. `line` is the line number **in the head file**, and must fall inside
     the diff — take it from `gh pr diff <n>`, counting on the right-hand side. `side` is `RIGHT`
     for added or context lines, `LEFT` for a line the PR deletes.
   - A `line` or `path` outside the diff fails the whole call with
     `422 Path could not be resolved`. Nothing is posted — fix the anchor and re-run.
   - Every finding body must be a valid JSON string: escape `"` and write newlines as `\n`. If a
     body is long or awkward to escape, write the payload to a file and use `--input <file>`.
   - This step is **PR-only**. A branch with no PR has no review threads to post to — report those
     findings in chat.

## Output / Verification

Findings ranked most-severe first, never in file order. One layering violation outranks five naming
nits. Each finding gives:

- File and line.
- One sentence naming the defect.
- A concrete failure scenario: inputs or state → wrong output or crash.

Then:

- Say plainly whether the startup smoke check passed and that the repository has no automated
  test/lint/format gate. Name any environmental failure.
- Call out pre-existing failures outside the changed surface, and any area you could not verify.
- If nothing survives step 8, report **zero findings** — that is a valid review, and a better one
  than a padded list.
- If you posted the review, give its URL back as a link.

## Guardrails

- **Do not post anything to GitHub unless the user asked.** The default output of this skill is a
  report in chat. Posting is step 9, on request only.
- **Never `APPROVE` or `REQUEST_CHANGES` on the user's behalf.** Use `event: "COMMENT"` unless the
  user explicitly asks for one of the others. An approval is a human's signature, not an agent's.
- **Never push a fix to someone else's branch**, and never edit the code under review. Report, do
  not repair. If the user wants the findings fixed, that is a separate, authorized task.
- **An environmental startup failure is not a finding.** Missing `node_modules`, a stale install, or
  absent local environment values are checkout problems until proven introduced by the PR. Apply
  `Pre-build setup` and compare with `main` before blaming the author.
- **Do not report unverified suspicions.** "This could be null" without tracing the callers is
  noise. Step 8 is not optional.
- Do not invent a formatting gate; no formatter or lint script is configured.
- Do not restate the diff back to the author. They wrote it.
- Do not use this skill as a substitute for `review`. Catching a defect before you open the PR is
  cheaper than catching it after; this skill is the safety net, not the first pass.
