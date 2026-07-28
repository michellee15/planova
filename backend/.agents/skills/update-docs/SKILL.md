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
- The change is not written yet. Complete implementation planning first; docs describe what the
  code actually does.
- The only requested work is adding, renaming, or removing a *skill*. That is `new-skill`. When
  `ship` invokes this skill afterward, only classify whether maintained documentation is affected.

## Related skills

- `ship` — the usual caller; it calls this skill at step 5 and commits its edits at step 6.
- `new-skill` — owns skill paths and cross-references. This skill does not create registration
  infrastructure.
- `commit` — the doc edit ships in the same commit series as the code, never a follow-up.

<!-- FLEXII:STANDARD:BEGIN — LOCAL to this repo. The drift check ignores everything between these markers. Name this repo's governing doc, actual docs, base branch, and mirrors. -->
## Standard

- Governing doc: none.
- Docs in this repo:
  - Repository-root `README.md` — currently only the project title.
  - `frontend/README.md` — frontend-owned and outside the backend documentation surface.
  - No `backend/README.md`, `/docs` tree, API reference, architecture guide, development guide, or
    `CHANGELOG.md`.
- Backend facts to document if a maintained target is explicitly established: Express startup and
  router mounting in `src/server.js`; CommonJS modules; inline controller validation and error
  responses; JWT middleware; `pg` models; `dotenv`/`process.env`; npm scripts from `package.json`.
- Base branch: `main`.
- Mirror check: none. No docs mirrors or rule symlinks exist.
- Access order: local files and `git` first.
<!-- FLEXII:STANDARD:END -->

## Preconditions

Confirm the actual documentation surface before classifying:

```bash
rg --files -g "README*" -g "docs/**" -g "CHANGELOG*"
git status --short
```

There is no repository preflight script, governing docs constitution, or mirror setup.

## Workflow

1. **Enumerate what actually changed.** You cannot classify a change you have not read. Diff against
   the base branch named in `Standard`:

   ```bash
   git diff --name-status <base>...HEAD
   ```

   Work from this list, not from your memory of what you just did.

2. **Read the documentation surface named in `Standard`.** There is no governing decision table.
   Classify against what the existing docs actually own and say so in the verdict. Do not create a
   backend docs tree merely to produce an artifact.

3. **Classify every path from step 1.** Backend endpoint contracts, authentication requirements,
   environment variables, startup commands, and architecture boundaries are potentially
   doc-affecting. Internal bug fixes that preserve those surfaces are not. If a fact needs
   documentation but no maintained target owns it, report `unresolved doc ownership` rather than
   inventing a file.

4. **State the verdict. Always — in both directions.** This is the step the whole skill exists to
   make visible: a considered "nothing matched" and a skipped step are indistinguishable unless you
   say which one happened. Emit one of these two blocks verbatim, filled in:

   ```
   docs verdict: not doc-affecting
     changed:    <N paths> — <the paths, or the directories they group into>
     classified: <bug fix inside a layer | test-only | dependency bump, no behavior change | other>
     checked:    <the documentation surfaces in Standard>
     matched:    none — <the one sentence saying why>
   ```

   ```
   docs verdict: doc-affecting
     changed:    <N paths> — <the paths, or the directories they group into>
     matched:    <changed backend contract or command> → <maintained doc>
     edited:     <doc> — <the one fact that changed>
   ```

   Return this block to `ship`, which puts it in the PR body. A `not doc-affecting` verdict ends the
   run here, successfully. Steps 5–8 are for the other verdict.

5. **Pick exactly one doc per fact.** A fact recorded in two docs is a fact that will go stale in one.
   If it fits two, it belongs in the more specific one.

6. **Edit in place.** Extend an existing section rather than appending a new one. Delete the sentence
   that is now false in the same edit — deletion beats deprecation.

7. **Preserve the existing document structure.** Do not add YAML frontmatter or rule metadata to a
   README that does not use it.

8. **Clear stale TODO markers** in the edited section when the change resolves them:

   ```bash
   rg -n "TODO" <doc>
   ```

   Answer the ones this change resolves. Do not add new ones for anything you could have determined by
   reading the code.

9. **If a skill changed, do not invent registration infrastructure here.** `new-skill` owns skill
   paths and cross-references. This repository has no `AGENTS.md` routing table or skill-set version.

10. **Record mirror status.** `Standard` says none, so report `no docs mirrors in this repo` rather
    than inventing a check that passes vacuously.

## Output / Verification

- **The step 4 verdict block, always** — including, and especially, when the verdict is
  `not doc-affecting`. A run that reports no verdict has not run.
- Each doc changed, and for each, the one line of what fact changed.
- An explicit `no docs mirrors in this repo`.
- `git diff --name-only <base>...HEAD -- <doc-path>` showing any doc edits are in this branch, ready
  for `ship` to commit. An edit left unstaged and uncommitted did not ship.

## Guardrails

- **A correct "no" must never look like inaction.** This skill's reputation problem is that a
  considered verdict and a skipped step read identically from the outside. The verdict block is not
  ceremony — it is the deliverable on every run that changes no doc.
- **Do not pad a PR with doc churn to look thorough.** The pressure to produce a visible artifact is
  real, and editing a doc is the wrong way to relieve it. The verdict is the artifact.
- **Docs ship in the same pull request as the code.** Never a follow-up. A deferred doc update is a
  doc update that will not happen.
- **Do not create an `AGENTS.md` routing table, skill-set version, or docs mirror here.** None exists.
- **Never create a doc that duplicates another.** Extend the existing one.
- Do not write aspirational documentation. Document what the code does, not what it should do.
- Every command you add to a doc must have been run, from the repo root, exactly as written.
- Do not invent domain rules or an architecture copied from another backend. If documentation
  ownership is unresolved, report the ambiguity rather than guessing.
