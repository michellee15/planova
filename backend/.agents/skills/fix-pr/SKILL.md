---
name: fix-pr
description: Triage existing review comment threads on a pull request. For each unresolved thread, verify the claim against the current branch HEAD, fix what is real, reply with the outcome, and resolve it. Use when the user asks to "fix", "verify", "address", or "check" PR comments or review feedback — not to generate new findings. Universal Flexii skill — same name/intent across all repos.
---

# Fix PR

## When to use

- A pull request you authored has unresolved review comment threads.
- The user asks to address, verify, or check review feedback.
- A reviewer or CI has flagged something and you are addressing it.

## When NOT to use

- You are the reviewer, not the author, and the goal is finding new problems. That is `pr-review`.
- There are no comments; you just want ordinary implementation and verification before `commit`.

## Related skills

- `pr-review` — generates new findings; run it before this skill if both are needed.
- `commit` — this skill runs the same commit discipline before pushing.
- `review` — checks the resulting local diff before it leaves the branch.

<!-- FLEXII:STANDARD:BEGIN — LOCAL to this repo. The drift check ignores everything between these markers. Name this repo's architecture and real validation. -->
## Standard

- Read: `package.json`, `src/server.js`, the commented file, and the related router, controller,
  model, middleware, service, or configuration module.
- Architecture: Express routers map paths to middleware and handlers; controllers perform the
  current inline input checks and response mapping; `src/models` is the PostgreSQL persistence
  abstraction over the shared `pg` pool; `src/services` owns external HTTP integrations; JWT
  authentication is Express middleware that sets `req.user`.
- Error handling: request handlers currently use local `try/catch`, logging, and JSON responses.
  There is no centralized error-handling middleware to assume.
- Validate with: `npm start` from the backend directory, confirm the server startup message, then
  stop it. No test, lint, type-check, or format script exists; supplement the smoke check with the
  exact manual reproduction relevant to the review comment.
- Base branch: `main`.
- Access order: `gh` > `git` > other connectors.
<!-- FLEXII:STANDARD:END -->

## Preconditions

Confirm the tools and local state:

```bash
gh --version
git status --short
npm pkg get scripts
```

There is no repository preflight script. Do not write to review threads until the PR, repository,
and branch are confirmed.

## Workflow

1. **Collect the threads.** Enumerate them; do not work from memory of what someone said.

   Inline review threads — this query is the only source of the two ids step 9 needs, because the
   REST comments endpoint does not return thread ids:

   ```bash
   OWNER=$(gh repo view --json owner -q .owner.login)
   REPO=$(gh repo view --json name -q .name)

   gh api graphql -f query='
     query($owner:String!,$repo:String!,$number:Int!){
       repository(owner:$owner,name:$repo){ pullRequest(number:$number){
         reviewThreads(first:100){ nodes {
           id
           isResolved
           comments(first:100){ nodes { databaseId author{login} path line body } }
         } } } } }' \
     -f owner="$OWNER" -f repo="$REPO" -F number=<n>
   ```

   - `nodes[].id` — the **thread id**, for the resolve call in step 9.
   - `comments.nodes[0].databaseId` — the **comment id**, for the reply call in step 9.

   Top-level discussion, which is not threaded: `gh pr view <n> --comments`.

2. **Identify which threads are open.** Skip `isResolved: true`. Skip threads where a human
   teammate has already replied — a bot author (login ending in `[bot]`) is a comment to triage,
   not a reply that closes anything.

3. **Check out the branch**: `gh pr checkout <n>`.

4. **For each thread, verify the claim before acting on it.** This is the step people skip.
   - Read the **current file at HEAD**, not the diff hunk — the hunk is historical context and may
     already have been fixed: `git show origin/<branch>:<path>`.
   - Trace the Express request from router and middleware through controller to model or service.
   - Reproduce the status code, JSON body, authentication/ownership behavior, SQL result, or
     external-service failure the reviewer describes.
   - If they are wrong, say so, with the evidence. Agreeing performatively and implementing a wrong
     suggestion is worse than pushing back.
   - If the comment is ambiguous, ask rather than guess at what they meant.
   - Do not dismiss a bot comment as invalid without verifying the claim.

5. **Classify each thread.**

   | Verdict | Criteria | Action |
   | --- | --- | --- |
   | **Valid** | The problem exists at HEAD | Fix → test → commit → push → reply → resolve |
   | **Already resolved** | A prior commit fixed it | Reply with the resolving hash → resolve |
   | **Invalid** | The code does not have the described problem | Reply with the evidence → leave open |
   | **Out of scope** | Real, but outside this PR | Reply, open a follow-up issue → leave open |

6. **Fix the real defects at the owning Express responsibility.** A comment names a symptom. Search
   callers and fix the root cause once. Do not put SQL in a router or controller, HTTP response
   logic in a model, authentication after an unprotected handler, or external API details in a
   persistence function.

7. **Prove the fix.** If the PR already contains an automated backend test harness, add the focused
   regression there. The repository baseline has no test framework or test script, so do not add a
   testing dependency without authorization. Otherwise record an exact manual reproduction plus the
   startup smoke check.

8. **Review, validate, commit, and push.** Run `review`, validate with `Standard`, and commit via the
   `commit` skill — one logical fix per commit, so a `resolved <sha>` reply points at something
   readable. Push before replying. Do not force-push a branch a reviewer may have pulled.

9. **Reply on every open thread, then resolve the ones you acted on.**

   **Reply.** `gh pr comment` is the wrong tool here — it posts a *top-level* PR comment, not a
   thread reply. Use the review-comment reply endpoint with the `databaseId` from step 1 (`gh`
   fills `{owner}` and `{repo}` from the checkout):

   ```bash
   gh api repos/{owner}/{repo}/pulls/<n>/comments \
     -X POST \
     -f body="resolved <COMMIT_SHA>" \
     -F in_reply_to=<COMMENT_ID>
   ```

   Reply bodies, by the step 5 verdict:
   - Valid, fixed here → `resolved <COMMIT_SHA>`
   - Already resolved → `resolved <PRIOR_SHA>`
   - Invalid → `invalid — <one sentence, with the evidence>`
   - Out of scope → `out of scope — <follow-up issue link>`

   **Resolve.** `gh pr` has no resolve subcommand; it takes the GraphQL mutation, with the thread
   `id` from step 1:

   ```bash
   gh api graphql -f query='
     mutation($threadId:ID!){
       resolveReviewThread(input:{threadId:$threadId}){ thread { isResolved } } }' \
     -f threadId=<THREAD_ID>
   ```

   Reply first, resolve second. Resolve only Valid and Already-resolved threads. Leave Invalid and
   Out-of-scope threads **open** after replying — the reviewer closes those, not you.

## Output / Verification

- One line per thread: the comment, the verdict (fixed / already-resolved / invalid / out-of-scope),
  and the commit or reply that closed it.
- The startup smoke result and the manual or automated reproduction used for each valid defect.
- The step 1 query re-run, showing every acted-on thread now `isResolved: true`.
- No thread left without a reply.

## Guardrails

- **Verify before you implement.** A reviewer's suggestion is a hypothesis, not an instruction.
  Blind implementation of a technically wrong suggestion is how bugs get review approval.
- **Disagreeing is allowed and often correct.** Bring evidence: the code, the test, the caller graph.
- Fix the root cause at the router, middleware, controller, model, service, or configuration boundary
  that owns it.
- Do not expand scope. A review comment is not license to refactor the file.
- Do not generate new findings — that is `pr-review`'s job.
- Do not introduce a validation, ORM, dependency-injection, or test library solely to imitate a
  mechanism from a different backend stack.
- Never force-push without checking whether anyone else is on the branch.
- **Never resolve a thread you did not act on and did not reply to.** A thread resolved without a
  reply tells the reviewer nothing.
