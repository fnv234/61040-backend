# Project Reflection

## What Was Hard vs. Easy

- **Hard**
  - **Sync patterns**: Long‑running tasks (e.g., `generate_profile_summary`) necessitated splitting into request/response syncs. Including optional fields (e.g., `notes`, `photo`) in `when` produced non‑matches and timeouts that required targeted fixes. Determining which actions should be authenticated versus directly passed through also required careful design.
  - **Production vs. local parity**: Unregistered users in production led to successful `save_place` responses but empty reads from `_get_saved_places`.
  - **Error surfacing**: Backends returning `{ error }` with HTTP 200 required explicit client‑side checks and conservative defaults.
  - **Identity continuity**: Maintaining a consistent `userId` across localStorage, client state, and backend collections.
- **Easy**
  - Implementing core CRUD concept methods and configuring Requesting passthrough routes.
  - API plumbing with axios, typed DTOs, and environment configuration.
  - Leveraging Context to generate repetitive code and scaffold refactors.

## What Went Well

- **Observability**: Verbose client/server logs differentiated timeouts from data issues and accelerated diagnosis.
- **Incremental fixes**: Converting selected syncs to request/response pairs eliminated timeouts without broad refactors.
- **Resilient client**: The API layer tolerated response‑shape drift and returned stable structures to views.

## Mistakes & Preventive Tactics

- **Optional parameters in `when`** → timeouts.
  - Keep `when` minimal; handle optional inputs in `where` or downstream.
- **Assuming user existence** → saves not persisted in production.
  - Register on login and auto‑register on the first save if necessary.
- **Assuming API shape stability** → brittle UIs.
  - Centralize response normalization; add runtime validation or contract tests.

## Skills Gained & Remaining Gaps

- **Gained**
  - Designing robust sync flows with clear `when/where/then` responsibilities.
  - Production debugging via reproducible cases, dashboards, and log correlation.
  - Defensive networking practices: timeouts, `validateStatus`, and user‑friendly error messaging.
  - Effective use of Context (agentic tooling) to offload repetitive edits and validate changes, improving architectural understanding.
- **Gaps**
  - End‑to‑end tests across deployment targets.
  - Formal schemas (zod/OpenAPI) to reduce contract drift.

## The Role of LLMs in Development

LLMs are effective for scaffolding refactors and generating defensive patterns, particularly with concrete repository context and tight feedback loops (testing, logging, and iterative validation). They should be used judiciously; outputs require review and verification.

## Key Takeaways

- **Keep `when` lean; default in `where`** to avoid sync non‑matches.
- **Assume nothing in production**: verify identity, data presence, and environment.
- **Normalize responses** at the API layer so views remain stable as services evolve.

