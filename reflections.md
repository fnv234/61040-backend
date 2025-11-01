# Project Reflection

- **Scope**: Full‑stack matcha app with saved places, logs, recommendations, and AI profile summaries.
- **Stack**: Deno + TypeScript (concepts/sync engine), MongoDB, Vue 3 + Vite + Pinia, Render.

## What Was Hard vs. Easy

- **Hard**
  - **Sync patterns**: Long‑running tasks (e.g., `generate_profile_summary`) required splitting into request/response syncs. Including optional fields (e.g., `notes`, `photo`) in `when` caused non‑matches and timeouts.
  - **Prod vs local parity**: Unregistered users in prod led to successful `save_place` responses but empty reads from `_get_saved_places`.
  - **Error surfacing**: Backends returning `{ error }` with 200 forced explicit frontend checks and safer defaults.
  - **Identity continuity**: Keeping `userId` consistent across localStorage, store, and backend collections.
- **Easy**
  - Implementing core CRUD concept methods and passthrough Requesting routes.
  - API plumbing with axios, typed DTOs, and environment config.

## What Went Well

- **Observability**: Verbose logs (client/server) made timeouts vs. data issues easy to distinguish.
- **Incremental fixes**: Converting single syncs to request/response pairs removed timeouts without broad refactors.
- **Resilient client**: API layer tolerated response‑shape drift and returned stable structures to views.

## Mistakes & Preventive Tactics

- **Optional params in `when`** → timeouts.
  - Keep `when` minimal; default optional inputs in `where`.
- **Assuming user existence** → saves not persisted in prod.
  - Register user on login and auto‑register fallback on first save.
- **Assuming API shape stability** → brittle UIs.
  - Centralize response normalization; add runtime validation or contract tests.

## Skills Gained & Remaining Gaps

- **Gained**
  - Designing robust sync flows with `when/where/then` responsibilities.
  - Production debugging via curl repros, dashboards, and log correlation.
  - Defensive networking: timeouts, validateStatus, and friendly error messages.
- **Gaps**
  - End‑to‑end tests across deploy targets.
  - Formal schemas (zod/OpenAPI) to prevent contract drift.

## How I Used the Context Tool

- Jumped directly to relevant files (`authenticated_routes.sync.ts`, service APIs, and views) to trace data flows.
- Queried for symbols and terms to build a quick map of concept interactions and sync boundaries.

## How I Used an Agentic Coding Tool

- Offloaded repetitive edits (splitting syncs, adding logs, shaping responses) and executed targeted curl checks against local/prod.
- Maintained guardrails: verify changes via logs and small repros before expanding scope.

## The Role of LLMs in Development

- **Great for** boilerplate, scaffolding refactors, and generating defensive patterns.
- **Works best with** concrete repo context and tight feedback loops (logs, tests, curl repros).
- **Use with care**: do not rely on unstated assumptions; enforce schemas and validate at boundaries.

## Key Takeaways

- **Keep `when` lean; default in `where`** to avoid sync non‑matches.
- **Assume nothing in prod**: verify identity, data presence, and environment.
- **Normalize responses** at the API layer so views remain stable as services evolve.

