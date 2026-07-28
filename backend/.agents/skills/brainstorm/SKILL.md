---
name: brainstorm
description: Stress-test a plan or design by interviewing down each branch of the decision tree, before any code is written. Use when the user asks to "brainstorm", to "grill me", to "stress-test" or "poke holes in" a plan, to "think through" an approach, or to compare two options — and when the shape of a change is not yet obvious or it touches more than one module. Universal Flexii skill — same name/intent across all repos.
---

# Brainstorm

## When to use

- The task's shape is not obvious, or two approaches look equally reasonable.
- The change crosses an Express responsibility or touches more than one backend feature area.
- Someone is about to add a dependency, a shared module, or a new external contract.
- The requirements are a sentence long and the implementation would be a week long.
- The user asks to be grilled on a plan they already have.

## When NOT to use

- The change is mechanical and its shape is already agreed (rename, dependency bump, typo).
- A design has already been decided and written down. Move to implementation planning.
- You are debugging. Brainstorming a bug you have not reproduced is guessing.

## Related skills

- `review` — evaluates an implemented diff; brainstorming stops before code is written.
- `ship` — lands the eventual implementation after it has been reviewed and validated.

<!-- FLEXII:STANDARD:BEGIN — LOCAL to this repo. The drift check ignores everything between these markers. Name this repo's real architecture, feature boundaries, shared code, and validation responsibility. -->
## Standard

- Read: `package.json`, `src/server.js`, and the relevant files under `src/routes`,
  `src/controllers`, `src/models`, `src/middleware`, `src/services`, and `src/config`.
- Layering: `src/server.js` mounts global middleware and routers; `src/routes/*.js` maps HTTP methods
  and paths to middleware and request handlers; `src/controllers/*.js` reads `req`, performs the
  repository's inline input checks, calls model or service functions, and writes `res`;
  `src/models/*.js` owns PostgreSQL queries through the `pg` pool exported by `src/config/db.js`;
  `src/services/*.js` owns non-database integrations such as geocoding.
- Cross-cutting HTTP concerns live in Express middleware. Authentication is implemented by
  `src/middleware/requireAuthentication.js`, which verifies the bearer JWT and sets `req.user`.
- Feature boundary: a resource normally spans a router, controller, and model file. These are
  CommonJS modules, not independently built packages. The code does not require a service between
  every controller and model.
- Configuration: `dotenv` loads environment variables and code reads them through `process.env`.
  Database settings use `DB_USER`, `DB_HOST`, `DB_NAME`, `DB_PASSWORD`, and `DB_PORT`; authentication
  uses `JWT_SECRET`; the server uses `PORT` with a fallback of `5000`.
- Shared code: no separate shared package. Reuse existing modules under `src` before adding
  another dependency or abstraction.
- Validate with: nothing runs here. This skill produces a decision, not a diff.
- Access order: repository files and `git` first; use GitHub only when remote history matters.
<!-- FLEXII:STANDARD:END -->

## Preconditions

Inspect the actual backend before interviewing:

```bash
npm pkg get scripts dependencies devDependencies
rg -n "router\.|app\.use|module\.exports|pool\.query|process\.env" src
```

Run these from the backend directory. There is no separate module build, shared package checkout, or
repository preflight script.

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

3. **Establish the constraints before speculating.** Decide whether the responsibility belongs in
   server composition, a router, middleware, a controller, a model, or an external-integration
   service. Search before assuming.

4. **Check what is reusable.** Search the actual source tree and declared dependencies:

   ```bash
   rg -n "<concept>" src package.json
   ```

   State what was searched and what matched. The absence of a separate shared package does not mean
   existing routers, handlers, models, middleware, and services can be ignored.

5. **Ask whether it needs to exist at all.** The cheapest change is the one not made. If the need is
   speculative, say so and stop. Stopping here is a successful outcome, not a failed brainstorm.

6. **Enumerate 2–3 real approaches.** Not strawmen. For each, name the Express responsibility and
   files it touches, the convention it follows or changes, and what it forecloses.

7. **Walk the decision tree.** For each approach, in order:
   - Does it respect the dependency direction named as `Layering` in `Standard`?
   - Does it reuse an existing CommonJS module, installed dependency, or Node API?
   - Does it require a new dependency, endpoint, environment variable, query shape, or external
     contract?
   - Where are authentication, ownership checks, input validation, and error responses enforced?
   - What happens when PostgreSQL or an external HTTP service fails?
   - What breaks in six months when the next person changes the adjacent code?

8. **Recommend one**, and name what you gave up by choosing it. An approach with no stated cost has
   not been analyzed.

9. **Write down the open questions** that only a human can answer.

## Output / Verification

A short written recommendation, practical enough to hand directly into implementation planning:

- The restated problem.
- The approaches considered, and the decision-tree answers that eliminated the rejected ones.
- The recommendation, and the trade-off accepted with it.
- **The reuse check's exact search scope and result**, including relevant local modules and
  dependencies.
- The open questions.

No code. No files edited. `git status --short` unchanged from when you started.

Hand off to implementation planning.

## Guardrails

- **Do not write code.** Not even a sketch that "just shows the idea" — it becomes the
  implementation, and it does so without ever being planned or tested.
- **Do not invent layers the backend does not have.** Do not require a service, repository
  interface, transport wrapper, dependency-injection container, or centralized error system without
  evidence that the change needs one.
- **Ask one question at a time.** A batch of questions is a questionnaire, not an interview, and the
  branch you most needed to explore is the one that gets skipped.
- Do not ask the user what the codebase can answer.
- Do not invent requirements to justify a more interesting design.
- If every approach requires violating the architecture in `Standard`, revisit the problem
  statement rather than picking the least-bad violation.
- **Speculative generality is the default failure mode.** An interface with one implementation, a
  config flag for a value that never changes, a factory for one product, an abstraction added for the
  second consumer who never arrives — name these and cut them.
- Do not add a package when Node, Express, `pg`, or an existing module already covers the need.
- Treat the architecture in `Standard` as a boundary map, not a quota to create a file in every
  directory.
