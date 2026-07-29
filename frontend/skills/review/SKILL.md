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
- You already know what is broken and want it fixed. That is `plan` → `test` → `commit`.

## Related skills

- `pr-review` — the same lenses, aimed at someone else's PR. It is the only one of the two that
  touches GitHub.
- `ship` — calls this skill on the branch diff before pushing. Do not ship this skill's findings.
- `test` — step 6's regression-test bar follows it.

<!-- FLEXII:STANDARD:BEGIN — LOCAL to this repo. The drift check ignores everything between these markers. Name this repo's rule docs, its real executed validation command, the branch its work diverges from, and the tool that owns formatting. -->

## Standard

- Read: `docs/coding-constitution.md`, `docs/architecture.md`, and the domain rule docs (`docs/react-patterns.md`, `docs/rhf-form-patterns.md`, `docs/types-conventions.md`, `docs/useeffect-patterns.md`, `docs/file-folder-structure.md`)
- Validate with: `mise exec -- pnpm --filter <app> lint`, `mise exec -- pnpm --filter <app> build` (`tsc -b`), and `mise exec -- pnpm --filter <app> test` for touched apps
- Base branch: `dev`
- Formatter: `oxfmt` (config `.oxfmtrc.json`; run via `mise exec -- pnpm format`) — NOT prettier. Review never comments on what the formatter owns. `oxfmt` ignores `*.md`, and prettier appears only as the VSCode `[scss]` editor formatter — Markdown is formatted by nothing here
- Access order: `git` > `gh` > MCP. This skill reads; it does not publish.

<!-- FLEXII:STANDARD:END -->

## Preconditions

Run this first. It checks what this skill needs in *this* repo, fixes what is safe to fix on its
own, and stops with steps if something needs you:

```bash
./.agents/preflight.sh review
```

Exit 0 — ready; whatever it auto-fixed is printed. Exit 1 — blocked; follow the steps it printed
rather than working around them. An environment problem worked around quietly does not stay an
environment problem — it becomes a wrong answer reported as a right one.


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

2. **Read the rules named in `Standard` before judging anything against them.** They are the
   standard this diff is measured by. Reviewing from memory of what the rules probably say is how a
   review invents a rule the repo does not have and misses the one it does.

3. **Check the boundaries first.** These are the rules no tool enforces and the ones most often
   broken. The architecture doc from `Standard` names this repo's layers and its dependency
   direction; these are the shapes that violate it whatever the layers are called:

   - Does the outermost layer — HTTP controller, route handler, page, widget — reach past its seam
     into a repository, a database client, or a store directly? → blocking.
   - Does the innermost layer — domain, entity, model — import a web framework, a transport type, or
     a persistence type? → blocking.
   - Does a transport type — DTO, request/response, wire model — travel below the seam that owns it?
     → blocking.
   - Is there an `if` in an adapter that changes what the caller gets back? That is a business rule
     in the wrong layer. → blocking.
   - Is a dependency hand-constructed inline instead of injected the way the architecture doc says?
     → blocking.
   - Does the change alter a surface other repos consume — a signature, a return type, a public
     name? → blocking unless intended and called out.

4. **Check secrets and logging.** Does any log line, error message, fixture, or test expose a token,
   a JWT, a signing secret, a session cookie, a password, a connection string, or PII? → blocking.
   This is the finding most likely to leak and the one no tool catches.

5. **Check correctness.** For each changed function, grep its callers. Does the change hold for all
   of them, or only the path the ticket named? A fix that is correct on one caller and wrong on the
   other three is a regression with a green build.

6. **Check the tests.** A bug fix without a regression test is not done. Does the test fail without
   the fix — actually, not presumably? Does it assert on a value, or only that a mock was called?

7. **Check for reinvention.** Does this repo, a shared Flexii library, or the standard library
   already do this? A new dependency for one utility method is a finding.

8. **Check for speculative generality.** An interface with one implementation, a config for a value
   that never changes, a factory for one product, an abstraction for a second caller that does not
   exist. Each is a finding.

9. **Check the stowaways.** A dependency or submodule bump that is not the point of the change,
   `.DS_Store`, build output, IDE files, `.env` or any secret file, debug logging, commented-out
   code, lockfile churn nobody asked for.

10. **Validate with the command in `Standard`.** Do not report on a diff you have not built. If it is
    red, that is finding number one and it outranks everything you found by reading.

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
  `gh api`, no MCP write. The findings go to the user, in the conversation, and the author decides.
  Posting to GitHub is `pr-review`'s job and only when a PR exists — this diff may not even be
  committed yet.
- **Do not fix while reviewing.** Report, then let the author decide. Mixing them hides the
  findings — a fixed diff and a reviewed diff look identical afterwards, and nobody learns what was
  wrong.
- **Do not report a finding you have not verified against the actual code.** "This might be a
  problem" is not a finding. Open the file, follow the callers, then write it down.
- Formatting belongs to the tool named in `Standard`. Never leave a formatting comment.
- Do not restate what the code does. The author knows.
- Do not expand scope. Code the diff did not touch is not under review, however much you want it to
  be.
- **A clean review is not a green build, and a green build is not a clean review.** Report both.
