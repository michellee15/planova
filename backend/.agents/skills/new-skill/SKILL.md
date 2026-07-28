---
name: new-skill
description: Add, rename, or remove a repo-specific skill in .agents/skills and keep the skill set's local cross-references honest. Use when the user asks to "create a skill", "add a skill", "codify this workflow", "rename a skill", or "remove"/"delete a skill". Universal Flexii skill — same name/intent across all repos.
---

# New Skill

## When to use

- A repeatable task shape is being performed for the second time and no skill covers it.
- The user asks to create or add a skill, or to codify a workflow as one.
- An existing **repo-specific** skill needs renaming or removing.

## When NOT to use

- **The skill is universal.** A universal skill is authored in `flexii-agent-skills` and installed —
  never hand-written into one repo. See step 1; this is the single most important routing decision
  in this skill.
- Editing the body of an existing skill without adding, renaming, or removing it. Edit
  `.agents/skills/<name>/SKILL.md` directly.
- Adding a guardrail on what *correct Express code* looks like. Put it in the relevant skill's
  `Standard` or guardrails; this repository has no separate coding constitution.
- The task is a one-off. A skill that runs once is a note.

## Related skills

- `update-docs` — decides whether a completed skill change affects maintained documentation.
- `ship` — a skill change is a change like any other. It lands as a PR.

<!-- FLEXII:STANDARD:BEGIN — LOCAL to this repo. The drift check ignores everything between these markers. Name the real skill source, registration mechanism, mirrors, and backend context. -->
## Standard

- Backend context: CommonJS Express 5, routers and request handlers, `pg` models, JWT middleware,
  `dotenv`/`process.env` configuration, and npm scripts from `package.json`.
- Skills source of truth: `.agents/skills/<name>/SKILL.md`
- Routing table: none. There is no `AGENTS.md`; do not create or update a routing row unless a
  separate user request establishes one.
- Mirror dirs: none. There are no Claude, Cursor, Copilot, or Windsurf skill mirrors.
- Preflight: none.
- Validation: inspect frontmatter and required sections, then search cross-references with `rg`.
- Access order: local files and `git` first.
<!-- FLEXII:STANDARD:END -->

## Preconditions

List the actual skill set before changing it:

```bash
rg --files .agents/skills
rg -n "^name:|^description:|FLEXII:STANDARD" .agents/skills
```

Do not infer an `AGENTS.md`, mirror, installer, or external drift system that is not present.

## Workflow

1. **Decide universal or repo-specific. This decides whether you do the work here at all.**

   | | Universal | Repo-specific |
   | --- | --- | --- |
   | Examples | `brainstorm`, `commit`, `review`, `ship`, `pr-review`, `fix-pr`, `update-docs`, `new-skill` | a workflow owned only by this Express backend |
   | Lives in | `flexii-agent-skills`, installed into every repo | only this repo |
   | Identical across repos? | Yes — byte-for-byte outside its `Standard` | N/A |
   | `FLEXII:STANDARD` markers? | **Required** — the drift check reads them | **No** — nothing compares it, so nothing needs marking |

   **This skill creates repo-specific skills only.** If what you are about to write belongs in every
   Flexii repo — same name, same intent — hand-writing it here is precisely the drift this whole
   effort exists to stop. Stop and route it: author it in `flexii-agent-skills` under
   `skills/<name>/SKILL.template.md`, then install it. The same applies to renaming or removing a
   universal skill: that is a cross-repo change made at the canonical repo and propagated with
   `bin/update.sh`, never a local edit.

   To identify locally adapted universal workflows:

   ```bash
   rg -l "FLEXII:STANDARD" .agents/skills
   ```

   A skill that carries the markers is universal. Do not remove or rename it locally.

2. **Decide skill vs. rule vs. meta-rule.** Only one of these is a skill.

   | If the content is… | It goes in… |
   | --- | --- |
   | A step-by-step recipe for a task | a new skill |
   | An Express architecture fact or local command used by the workflow | the skill's `Standard` |
   | A correctness or safety boundary for the workflow | the skill's `Guardrails` |

3. **Check it does not already exist**, under a different name. Extend before you add.

   ```bash
   rg --files .agents/skills
   rg -n "<the task in your own words>" .agents/skills
   ```

4. **Name it.** Use kebab-case and name the task rather than a library. Keep the directory name and
   frontmatter `name` identical. If another repository canonically owns the same universal task,
   re-read step 1 before creating a local fork.

5. **Take exactly one branch: A (add), B (rename), or C (remove).** Each branch owns the skill file
   and all cross-references from the surviving skills. `Standard` declares no separate routing table.

   ### Branch A — add

   ```bash
   mkdir -p .agents/skills/<name>
   ```

   Write `.agents/skills/<name>/SKILL.md` with these sections:

   ```md
   ---
   name: <skill-name>
   description: <one sentence — the task, plus the literal words a user would say to trigger it>
   ---

   # <Skill Title>

   ## When to use
   ## When NOT to use
   ## Related skills
   ## Standard
   ## Preconditions
   ## Workflow
   ## Output / Verification
   ## Guardrails
   ```

   - **When to use** — concrete task shapes, not abstractions.
   - **When NOT to use** — name the skills it will be confused with.
   - **Related skills** — what sequences with it. `None — this is a meta skill` is a valid answer.
   - **Standard** — the actual Express responsibilities, installed libraries, paths, and npm
     commands relevant to the workflow. **No `FLEXII:STANDARD` markers** for a repo-specific skill.
   - **Workflow** — numbered steps. Every step that writes to an external system carries the exact
     command that does it. If there is no command to give, the step does not go in.
   - **Output / Verification** — what done looks like, with the commands that show it.
   - **Guardrails** — what it must not do. Point at rules; do not restate them.

   Do not create a routing row or mirror; neither mechanism exists in this repository.

   ### Branch B — rename

   Confirm first, via step 1, that the skill is repo-specific. Then move it — do not create a second
   copy and delete the first:

   ```bash
   git mv .agents/skills/<old> .agents/skills/<new>
   ```

   Then, in order:

   1. Update the `name:` field in `.agents/skills/<new>/SKILL.md` front matter to `<new>`.
   2. Sweep for stale references — other skills cross-reference each other by name in
      `Related skills` and `When NOT to use`, and those references do not move themselves:

      ```bash
      rg -n "<old>" .agents/skills
      ```

      This must print nothing when you are done. Fix every hit.
   3. Record the reason in the commit message rather than permanent process history inside the skill.

   ### Branch C — remove

   Confirm first, via step 1, that the skill is repo-specific, and check nothing else depends on it:

   ```bash
   rg -n "<name>" .agents/skills
   ```

   Then remove the skill:

   ```bash
   git rm -r .agents/skills/<name>
   ```

   Update every real surviving cross-reference, then re-run the search; it must print nothing.

6. **Do not create routing or mirror infrastructure.** That would be a separate repository-level
   decision, not an implicit half of skill work.

7. **Review the metadata and behavior.** Preserve precise triggers, imperative instructions, safety
   constraints, and the distinction from related skills.

8. **Verify**, per the table in Output / Verification. Then land it via `ship`.

## Output / Verification

For an added or renamed skill:

```bash
rg -n "^name:|^description:|^## " .agents/skills/<name>/SKILL.md
rg -n "<old-name>" .agents/skills
```

- Frontmatter contains `name` and `description`.
- The directory name and frontmatter `name` match.
- All required sections are present.
- Express, CommonJS, PostgreSQL, environment, and npm facts match the repository when relevant.
- Rename verification finds no stale old name.
- Removal verification finds neither the removed file nor stale cross-references.
- `git status --short` names only the intended skill paths.

## Guardrails

- **Do not fork a canonically owned universal workflow locally.** Put repository differences in its
  `Standard`.
- **Markers follow ownership.** A universal skill must carry exactly one `FLEXII:STANDARD` block
  around its `Standard`, because the drift check compares everything outside it. A repo-specific
  skill must not — nothing compares it, and a marker on it is a claim that is not true.
- **One source of truth:** `.agents/skills`. Do not create mirrors that the repository does not use.
- Never hardcode conventions from another backend stack into an Express backend skill.
- Never name an npm validation script that is absent from `package.json`.
- **Every step that writes carries its command.** A step that commands an outcome and supplies no
  mechanism does not fail loudly — the agent picks the nearest wrong tool and reports success.
- A skill with no `When NOT to use` is a skill that will be invoked wrongly.
- Do not invent domain or architecture rules the source tree does not demonstrate.
