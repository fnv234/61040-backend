 # Final Design Document
 
 ## Overview
 
 The initial concept (A2) envisioned straightforward CRUD operations across `Users`, `Places`, `Experience Logs`, and a recommendation engine, exposed via a REST API. The visual design (A4b) targeted a clean, tabbed UI for Saved and Logs, enriched Place pages, and a Profile with recommendations and an AI summary.
 
 The final implementation matured in three directions:
 - **Operational robustness**: split long operations into request/response sync pairs, add defensive error handling, and increase observability.
 - **Data and contracts**: migrate to MongoDB, standardize error returns, and normalize API responses on the client.
 - **User identity coherence**: ensure consistent user presence and behavior across environments.
 
 ## Differences vs. Initial Concept (A2)
 
 - **Persistence layer**
   - A2 assumed in‑memory or naïve persistence. Final design adopts MongoDB across concepts.
   - See `design/design_updates.md` ("Database Integration Refactoring"). Implementations live in `src/concepts/**`.
   - Impact: async/await throughout, DB lifecycle handling, and test isolation requirements.
 
 - **Synchronization model**
   - A2 implicitly used one sync per route. Final design splits some routes into explicit request/response pairs to avoid timeouts and clarify data flow.
     - Example: `GenerateProfileSummaryRequest` + `GenerateProfileSummaryResponse` in `src/syncs/authenticated_routes.sync.ts`.
   - Optional parameters (e.g., `notes`, `photo`) are removed from `when` and defaulted in `where` to prevent non‑matching frames (timeouts).
 
 - **Inter‑concept triggers**
   - Final design formalizes five cross‑concept syncs (see `design/design_updates.md`):
     - PlaceCreationSync, SavedPlaceRecommendationSync, PreferenceRecommendationSync, ExperienceRecommendationSync, GlobalPlaceRecommendationSync.
   - Rationale: keep recommendations fresh after writes in related concepts.
 
 - **Error contracts**
   - A2 assumed conventional HTTP error usage. Final standardizes `{ error: string }` returns for business logic (often with 200), per `design/design_updates.md` and concept methods in `src/concepts/**`.
   - The frontend API layer normalizes shapes and surfaces friendly messages.
 
 - **Testing & reliability**
   - Enhanced test infrastructure (connection lifecycle, isolation, LLM mocks) per `design/design_updates.md` and `design/design_changes.md`.
   - Emphasis on try/finally DB cleanup to avoid leaks.
 
 ## Differences vs. Visual Design (A4b)
 
 - **Saved vs. Logs UI**
   - Implemented as tabs with search and rating filters in `61040-frontend/src/views/CollectionView.vue`.
   - Empty and loading states align with the visual intent.
 
 - **Place details**
   - Photo fallbacks, explicit save/unsave, and immediate verification of saved state via `_get_saved_places` after writes.
 
 - **Profile**
   - Recommendations and AI Summary sections with clear fallbacks when data or secrets are missing.
   - AI summary invokes a guarded concept method; see `src/concepts/ExperienceLog/ExperienceLogConcept.ts`.
 
 ## Final Architecture (Concepts + Syncs)
 
 - **ExperienceLog** — `src/concepts/ExperienceLog/ExperienceLogConcept.ts`
   - CRUD for logs; fields: `rating`, `sweetness`, `strength`, optional `notes`, `photo`.
   - `generate_profile_summary({ userId, llm? })` computes aggregates, then calls Gemini (guarded by `GEMINI_API_KEY`). Returns `{ summary } | { error }`.
 
 - **UserDirectory** — `src/concepts/UserDirectory/UserDirectoryConcept.ts`
   - User registration, preference management, saved places (`save_place`, `unsave_place`, `_get_saved_places`).
   - Validates user existence; `save_place` is idempotent.
 
 - **PlaceDirectory** — `src/concepts/PlaceDirectory/PlaceDirectoryConcept.ts`
   - Nearby search via custom distance calculation (no geospatial index dependency), plus detail and search endpoints.
 
 - **RecommendationEngine** — `src/concepts/RecommendationEngine/**`
   - Scores by preferences, ratings/popularity, distance, and saved/tried places.
   - Refreshed via syncs described in `design/design_updates.md`.
 
 - **Sync patterns** — `src/syncs/authenticated_routes.sync.ts`
   - Keep `when` minimal; default optional params in `where`.
   - Split long operations into request/response, e.g., `GenerateProfileSummary*`.
   - Extract runtime values in `where` for user‑specific queries before calling concept methods.
 
 ## Notable Design Changes (with rationale)
 
 - **Request/Response sync split**
   - Rationale: Avoids timeouts for LLM or other slow operations; clarifies causality.
   - Files: `src/syncs/authenticated_routes.sync.ts` (create/update log response pairs, profile summary pairs).
 
 - **Optional parameter handling**
   - Rationale: `when` matching must not depend on optional inputs; defaults applied in `where` prevent non‑matches.
   - Files: `CreateLogRequest`, `UpdateLogRequest` in `src/syncs/authenticated_routes.sync.ts`.
 
 - **Error handling standardization**
   - Rationale: Predictable APIs across concepts; simpler client code. See `design/design_updates.md` and concept files.
   - Client layer converts mixed server shapes into consistent return objects.
 
 - **User existence guarantees**
   - Rationale: Production parity—users may exist locally but not in DB.
   - Changes: Frontend registers on login and auto‑registers on first save if backend reports missing user. See `61040-frontend/src/views/HomeView.vue` and `.../PlaceDetailView.vue`.
 
 - **Find nearby simplification**
   - Rationale: Reduce infra overhead for geospatial indexes while preserving expected UX.
   - Files: `src/concepts/PlaceDirectory/PlaceDirectoryConcept.ts`; notes in `design/design_updates.md` and `design/design_changes.md`.
 
 ## Trade‑offs & Alternatives
 
 - **200 + `{ error }` vs. 4xx**
   - Chosen to maintain backward compatibility during rapid iteration; frontend normalizes. Future: standardize to proper 4xx.
 
 - **Client‑side auto‑register vs. server‑side upsert**
   - Current approach avoids invasive backend changes late in the cycle. Alternative: perform upsert in `save_place`.
 
 - **Manual sync wiring vs. stricter contracts**
   - Present design favors velocity. Alternative: formal schemas (OpenAPI/zod) and contract tests across services.
 
 ## Deployment & Ops
 
 - **Backend**: Render (`https://matchamatch-backend.onrender.com`), environment variables documented in code (e.g., `GEMINI_API_KEY`).
 - **Frontend**: Uses `VITE_API_BASE_URL` to target backend; logs assist with diagnostics.
 - **Observability**: Extensive console logs; `curl` repros used to validate prod behavior.
 
 ## Outcomes vs. Goals
 
 - **Delivered**: Saved places, logs (create/update/delete), recommendations, AI summary, robust sync behavior.
 - **Improved**: Operational reliability (timeouts removed), error transparency, and user identity handling.
 - **Deferred**: Full server‑side upsert on save, formal schemas, and cross‑service contract tests.
 
 ## References
 
 - `design/design_updates.md` — high‑level updates and sync catalog.
 - `design/design_changes.md` — detailed change notes and evidence links.
 - `design/synchronizations.md` — synchronization intent and mapping.
 - `API_SPEC.md` — endpoint catalog.
 
 ```mermaid
 flowchart TD
   A[View Action] --> B[Requesting.request]
   B --> C{Sync: when}
   C -->|where defaulting| D[Concept method]
   D --> E[Sync: respond]
   E --> F[Requesting.respond]
 ```
