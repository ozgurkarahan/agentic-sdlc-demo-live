# AGENTS.md — repo-wide rules for the Todo API (`agentic-sdlc-demo-live`)

This is the **static context** every Copilot coding-agent instance loads for this repo — the single
highest-leverage harness artifact (`Agent = Model + Harness`). It **shapes behavior**; it does not
enforce by itself. Real enforcement is this repo's rulesets, required status checks, required reviews
(CODEOWNERS), and Environments — wired by `deploy/github/enforce-protections.ps1` and
`deploy/azure/provision.ps1`.

## 1. What this repo is

A small **Todo REST API** — an Express + TypeScript service that manages todo items over HTTP,
deployed to **Azure Container Apps** (staging → production) with OIDC + managed identity (no secrets).
It is the live target the agentic-SDLC harness evolves through its full lifecycle.

- **Stack:** Node 20 · TypeScript (ESM, `NodeNext`) · Express 4.
- **Run locally:** `npm ci && npm run build && npm start` — listens on `:3000`; `GET /healthz` → `{ "status": "ok" }`.
- **Test:** `npm test` (all) · `npm run test:unit` · `npm run test:e2e` (vitest + supertest). **Lint:** `npm run lint`. **Build:** `npm run build` (`tsc` → `dist/`; entrypoint `dist/server.js`, app module `dist/app.js`).
- **Deploy:** `.github/workflows/deploy.yml` → ACR + Container Apps; digest-pinned; staging smoke + live E2E; production reviewer pause + 0% canary + traffic rollback.
- **Layout:** `src/` (`app.ts` = `createApp()`, `server.ts` = entry + FAULT switches, `config.ts`, `store/`), `test/unit`, `test/e2e`, `ci/scripts` (gate logic the workflows call), `deploy/` (Azure + GitHub enforcement).

> **Load-bearing:** `src/server.ts` keeps env-gated `FAULT_HEALTHZ` / `FAULT_HEALTHZ_PROD` switches the
> deploy workflow uses to exercise REAL rollback against a live revision. Do not remove them.
> `test/e2e/*.e2e.test.ts` is dual-mode: it hits `TEST_BASE_URL` (the live deployed URL) when set,
> else runs in-process. The deploy workflow's post-deploy acceptance gate relies on this.

## Operating mode / ownership summary

- The **local/root orchestrator** owns the lifecycle state machine and handoffs, starting from a fresh
  default-branch workspace and running `workspace-hygiene` before trusting `.harness` artifacts.
- **GitHub** owns durable records + native enforcement: Issues, PRs, required checks, branch protection,
  CODEOWNERS review, and environment/deploy approvals.
- **Copilot cloud agents** are implementation workers for exactly one approved work-unit Issue at a time;
  launch them by GraphQL assignment to the assignable Bot `copilot-swe-agent`.
- **Human gates are hard stops:** plan approval, PR merge / CODEOWNERS review, and deploy/live E2E approval.

## 2. The discipline — Enforce → Plan → Validate → Issues → Execute (non-negotiable)

0. **Workspace hygiene first.** Prove the checkout is on the current default-branch tip and quarantine
   stale `.harness` artifacts before trusting any local plan/dispatch/unit artifact.
0a. **Full-tool local orchestrator.** The orchestrator runs with the full harness tool profile
    (`read`, `search`, `edit`, `terminal`, `github`, `actions`, `workiq` or host equivalents). Do not
    leave it read/search-only.
1. **Enforce first.** Before any work Issue exists, GitHub-native gates must be LIVE — gate workflows,
   required status checks, branch protection + CODEOWNERS on `master` (prove with `verify-gates`).
2. **Plan first (locally).** No implementation without an approved plan: each unit specified with
   acceptance criteria, a Definition of Done, a test/eval strategy, declared paths, a required test, and
   a dependency graph — emitted as `.harness/work-plan.md`, not yet GitHub Issues.
3. **Validate the plan.** The plan passes a **rubber-duck / devil's-advocate** review **and** human
   approval **before any code is written**. Hard gate.
4. **Materialize as Issues.** Only the approved plan becomes GitHub Issues (one tracking Issue + one
   work-unit child per unit) via `plan-to-issues`.
5. **Execute** only against the validated, approved, Issue-tracked plan, on an enforced repo.

**Never implement an unvalidated plan. Never create Issues before validation + approval + live gates.
Never parallelize dependent units. Human gates (plan-approval · PR-merge · deploy) are HARD STOPS.**

## 3. How you (a Development-fleet agent) must work

- You are assigned **exactly one** parallel-safe Issue. Implement **only** that unit.
- Work on your **own branch**; open **one linked PR** that references the Issue. A work-unit PR MUST
  carry `.agent/unit.json` (`declaredPaths`, `requiredTest`, and any `evals`) — the gates require it.
- **Do not touch files owned by another unit.** Discover a cross-unit dependency → stop and flag on the
  Issue; it means the plan needs re-validation, not a workaround.
- Keep the change minimal and scoped to the Issue's DoD. Ship tests **and** evals; never weaken a check.
- **Never merge your own PR.** Humans approve via CODEOWNERS / required review.

## 4. Guardrails — "never do" rules

- Never commit secrets, credentials, or `.env` files. Trust Azure via **OIDC + managed identity only**.
- Never add an unpinned or unverified dependency; watch for hallucinated / slopsquatted packages.
- Never disable, skip, or weaken a required check, test, or eval. A skipped/empty check is RED, not green.
- Never deploy on a red gate; never bypass the merge queue.
- Never make architecture-impacting changes without updating the architecture docs.

## 5. Conventions

- **Style:** match existing code; don't reformat unrelated lines. `npm run lint` must pass.
- **Tests:** colocate under `test/unit` and `test/e2e`; every behavior change ships with tests **and** evals.
- **Commits/PRs:** small, focused, linked to an Issue; PR description states what + why + how-verified.
- **Docs:** update `README` / API reference when behavior or interfaces change.

## 6. The harness around you (for reference)

| Role | Where |
|---|---|
| Orchestrator / Dispatcher | `.github/agents/orchestrator.agent.md` |
| Planning / Requirements | `.github/agents/planning.agent.md` |
| Development fleet (one unit) | `.github/agents/dev-fleet.agent.md` |
| Rubber-Duck / Plan-Validation | `.github/agents/rubber-duck.agent.md` |
| Quality / Test | `.github/agents/quality-test.agent.md` |
| Security / Compliance | `.github/agents/security-compliance.agent.md` |
| Code Review | `.github/agents/code-review.agent.md` |
| Deployment / Validation | `.github/agents/deployment.agent.md` |
| Repeatable procedures | `.github/prompts/*.prompt.md` |
| Skills (checks agents invoke) | `.github/skills/*.skill.md` |
| Work intake | `.github/ISSUE_TEMPLATE/work-unit.yml` |
| Safety overlay | `.github/instructions/agent-safety.instructions.md` |
| Verification (GitHub phase) | `.github/workflows/tests-and-evals.yml` |
| Security gate (GitHub phase) | `.github/workflows/security-gate.yml` |
| Deploy (GitHub phase) | `.github/workflows/deploy.yml` |
| Code ownership (GitHub phase) | `CODEOWNERS` |
