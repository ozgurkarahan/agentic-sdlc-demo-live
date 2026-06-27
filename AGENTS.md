# AGENTS.md — repo-wide rule file for the agentic-SDLC demo

> This is the **active** rule file for `ozgurkarahan/agentic-sdlc-demo-live`: it sits at the repo root
> and is the **static context** every Copilot coding-agent instance loads — the single highest-leverage
> harness artifact (`Agent = Model + Harness`).
>
> **It does not enforce anything by itself.** Real enforcement comes from the repository ruleset,
> required status checks, required CODEOWNERS review, and Environments configured on this repo.

---

## 1. What this repo is

A small **URL-shortener REST API** — the system under test for the agentic-SDLC demo. It creates a
short code for a URL, redirects by code, and lists links. In-memory store (per-replica), exposed via a
`createApp()` factory in `src/app.ts`.

- **Stack:** Node 20 · TypeScript · Express.
- **Run locally:** `npm ci && npm run build && npm start`
- **Test:** `npm run test:unit` · `npm run test:e2e`  · **Lint:** `npm run lint`  · **Build:** `npm run build`
- **Routes:** `POST /shorten` (201) · `GET /api/links` (200) · `GET /:code` (302) · `GET /healthz` (200).
- **App factory:** `createApp(options)` in `src/app.ts` accepts `{ extraMiddleware?: RequestHandler[] }`.
  Behaviour you add (e.g. a rate limiter) must be wired **into `createApp()` so the app applies it by
  default** — not only via `extraMiddleware` (that path is for eval harness injection).

## 2. The discipline — Plan -> Validate -> Execute (non-negotiable)

1. **Plan first.** No implementation without an approved plan: Issues with acceptance criteria, a
   Definition of Done, a test/eval strategy, and a dependency graph.
2. **Validate the plan.** The plan passes a **rubber-duck / devil''s-advocate** review **and** a human
   approval **before any code is written**. This is a hard gate.
3. **Execute** only against a validated, approved plan.

**Never implement an unvalidated plan. Never parallelize dependent units.**

## 3. How you (a Development-fleet agent) must work

- You are assigned **exactly one** Issue (a work unit). Implement **only** that unit.
- Work on your **own branch**; open **one linked PR** that references the Issue (e.g. `Closes #N`).
- **Declare your lane — REQUIRED.** Your PR **MUST** add a file `.agent/unit.json` describing the
  unit''s scope, so the path-scope + trajectory gates can verify you stayed in bounds and did the
  declared work. **Copy the fenced ```json agentic-unit``` block from your assigned Issue verbatim
  into `.agent/unit.json`.** A work-unit PR missing `.agent/unit.json` **fails** path-scope +
  trajectory by design — it is not optional. Schema:
  - `unit` — the unit id (e.g. `"U1"`).
  - `declaredPaths` — every path you may touch (globs ok: `*`, `**`, trailing `/`). **Every changed
    file must match one of these**, and `.agent/unit.json` is itself listed. Touching another unit''s
    path -> path-scope RED.
  - `requiredTest` — the **exact** test file you must add (trajectory checks for this exact path).
  - `evals`, `evalRoute`, `evalMax`, `evalMethod` — the acceptance-eval contract the rubric runs.
- **Honor the acceptance contract exactly.** If your Issue''s eval contract declares `rate-limit-429`,
  the limiter you write **must read the `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW_MS` environment
  variables** (the eval harness sets them to drive the threshold; default to a safe high max when
  unset) and be wired into `createApp()` by default, returning **429** past the limit with a numeric
  **`Retry-After`** and **`RateLimit-Limit`** / **`RateLimit-Remaining`** headers. Add the required
  test at the **exact** path named in `requiredTest`.
- **Do not touch files owned by another unit.** If you discover a cross-unit dependency, stop and flag
  it on the Issue — it means the plan needs re-validation, not a workaround.
- Keep the change minimal and scoped to the Issue''s DoD. Do not refactor unrelated code.
- Ensure your PR''s tests **and** evals pass; do not weaken a check to make it green.
- **Never merge your own PR.** Humans approve via CODEOWNERS / required review.

## 4. Guardrails — "never do" rules

- Never commit secrets, credentials, or `.env` files. (Secret-scanning push protection is on.)
- Never add an unpinned or unverified dependency; watch for **hallucinated / slopsquatted** packages.
- Never disable, skip, or weaken a required check, test, or eval.
- Never deploy on a red gate; never bypass the merge queue.
- Never make architecture-impacting changes without updating the architecture docs/diagrams.

## 5. Conventions

- **Style:** match existing code (ESLint config in repo); don''t reformat unrelated lines.
- **Tests:** unit tests live under `test/unit/`, e2e under `test/e2e/` (Vitest + supertest); every
  behavior change ships with tests **and** evals.
- **Commits/PRs:** small, focused, linked to an Issue; PR description states what + why + how-verified.
- **Docs:** update `README` / API reference when behavior or interfaces change.

## 6. The harness around you (for reference)

| Role | Where it''s defined |
|---|---|
| Orchestrator / Dispatcher | `.github/agents/orchestrator.agent.md` |
| Planning / Requirements | `.github/agents/planning.agent.md` |
| Rubber-Duck / Plan-Validation | `.github/agents/rubber-duck.agent.md` |
| Quality / Test | `.github/agents/quality-test.agent.md` |
| Security / Compliance | `.github/agents/security-compliance.agent.md` |
| Code Review | `.github/agents/code-review.agent.md` |
| Deployment / Validation | `.github/agents/deployment.agent.md` |
| Repeatable procedures | `.github/prompts/*.prompt.md` |
| Work intake | `.github/ISSUE_TEMPLATE/work-unit.yml` |
| Verification | `.github/workflows/tests-and-evals.yml` |
| Security gate | `.github/workflows/security-gate.yml` |
| Safety overlay | `.github/instructions/agent-safety.instructions.md` |

> HIGH-ASSURANCE. Add: mandatory multi-party plan + release approval; a dedicated Security/Compliance
> owner; "all security + eval checks green before merge"; stricter rulesets and secret-scanning push
> protection enforced org-wide.
