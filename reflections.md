# Project Reflection

## What Was Hard vs. Easy

- **Hard**
  - **Sync patterns**: Long‑running tasks (e.g., `generate_profile_summary`) required splitting into request/response syncs. Including optional fields (e.g., `notes`, `photo`) in `when` caused non‑matches and timeouts that had to be resolved.
  - **Prod vs local parity**: Unregistered users in prod led to successful `save_place` responses but empty reads from `_get_saved_places`.
  - **Error surfacing**: Backends returning `{ error }` with 200 forced explicit frontend checks and safer defaults.
  - **Identity continuity**: Keeping `userId` consistent across localStorage, store, and backend collections.
- **Easy**
  - Implementing core CRUD concept methods and passthrough Requesting routes.
  - API plumbing with axios, typed DTOs, and environment config.
  - Generally, prompting Context to generate code was straightforward and easy.

## What Went Well

- **Observability**: Verbose logs (client/server) made timeouts vs. data issues easy to distinguish.
- **Incremental fixes**: Converting single syncs to request/response pairs removed timeouts without broad refactors.
- **Resilient client**: API layer tolerated response‑shape drift and returned stable structures to views.

## Mistakes & Preventive Tactics

- **Optional params in `when`** -> timeouts.
  - Keep `when` minimal; default optional inputs in `where`.
- **Assuming user existence** -> saves not persisted in prod.
  - Register user on login and auto‑register fallback on first save.
- **Assuming API shape stability** -> brittle UIs.
  - Centralize response normalization; add runtime validation or contract tests.

## Skills Gained & Remaining Gaps

- **Gained**
  - Designing robust sync flows with `when/where/then` responsibilities.
  - Production debugging via curl repros, dashboards, and log correlation.
  - Defensive networking: timeouts, validateStatus, and friendly error messages.
  - Working with Context / an agentic tool to offload repetitive edits and verify changes -- I enjoyed being able to "discuss" my work with an agent and also have a deeper understanding of the architecture of my application as well as edits to be made.
- **Gaps**
  - End‑to‑end tests across deploy targets.
  - Formal schemas (zod/OpenAPI) to prevent contract drift.

## The Role of LLMs in Development

LLMs are great for scaffolding refactors and generating defensive patterns. They worked best when the input is concrete repo context and tight feedback loops with testing, logging, etc. However, I find it best to use them with caution and not rely fully on them since their work is never guaranteed correct. 

## Key Takeaways

- **Keep `when` lean; default in `where`** to avoid sync non‑matches.
- **Assume nothing in prod**: verify identity, data presence, and environment.
- **Normalize responses** at the API layer so views remain stable as services evolve.

