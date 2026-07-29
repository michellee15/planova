---
name: gh-verify-and-comment-issue
description: Verifies a GitHub issue against the current codebase. Produces evidence-backed findings and can post a concise comment on the issue when asked. Use this skill to confirm reported bugs, trace data flows, and identify blockers (e.g., frontend, backend, or contract mismatch). Can also create or link follow-up GitHub issues.
---

# GitHub Issue Verification

## When to use
- Input is a GitHub Issue URL (`/issues/NUMBER`)
- Goal is to confirm a reported bug, trace a data flow, or identify a blocker

## When NOT to use
- Input is a PR review comment thread → use `fix-pr` instead
- Goal is reviewing new code changes in a PR → use `pr-review` instead

## Related skills
- `pr-review` — for reviewing code changes rather than verifying an issue
- `fix-pr` — for acting on existing PR comment threads

## Required rule reads

Load as needed based on the affected surface:
- `.cursor/rules/react-patterns.mdc`
- `.cursor/rules/rhf-form-patterns.mdc`
- `.cursor/rules/types-conventions.mdc`

## Workflow

### 1. GitHub access order

1. `gh` CLI first — issue reads, comments, follow-up issue creation
2. `git` next — local branch/commit evidence
3. MCP GitHub tools — final fallback only

### 2. Resolve the issue context

Fetch the issue title and body before drawing conclusions. Restate the exact reported behavior in concrete terms.

### 3. Trace the code path locally

- Start from the user-facing component or file named in the issue
- Follow the data path upstream: props → form model → loader → API client → DTOs → mutations
- Use `rg` or `grep` for targeted search; read only the files needed
- Prefer line-referenced evidence over broad summaries

### 4. Separate facts from inference

Confirm:
- What fields exist in the form model
- What the API response type exposes
- Whether the save path reads or writes the missing field

If a conclusion depends on inference, say so explicitly.

### 5. Classify the issue

| Classification | Meaning |
|---|---|
| FE missing wiring | Data exists in API, but form/UI does not map it |
| BE missing data | Endpoint does not expose the needed field |
| Contract mismatch | Data exists elsewhere, but not in the response this flow uses |
| Ticket scope mismatch | Report names the wrong layer or entity |

### 6. Draft findings before writing to GitHub

Post the comment only when the user explicitly asks for the GitHub write action.

## Output shape

```md
Verified current flow for [feature].

Findings:
- The edit modal loads from `api.listings.getListingShifts(id)`.
- The response type does not include `selectedTags`.
- The form model also does not define a `tags` field.

Conclusion:
- This needs a backend contract change first, then FE wiring.

Created follow-up: owner/backend-repo#123
```

## Boundaries
- Do not post to GitHub unless the user asked for the write action.
- Do not blame BE or FE without confirming the exact payload and consuming component.
- If repository scope is unclear, stop and identify the correct repo before creating follow-up issues.
