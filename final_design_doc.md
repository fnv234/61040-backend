 # Final Design Document

## Overview

The initial concept (A2) envisioned straightforward CRUD operations across `Users`, `Places`, `Experience Logs`, and a recommendation engine, exposed via a REST API. The visual design (A4b) specified a clean, tabbed UI for Saved and Logs, enriched Place pages, and a Profile with recommendations and an AI-generated summary.

The final implementation evolved in four areas:
- **Operational robustness**: Split long operations into request/response sync pairs, add defensive error handling, and increase observability.
- **Data and contracts**: Migrate to MongoDB, standardize error returns, and normalize API responses on the client.
- **User identity coherence**: Ensure consistent user presence and behavior across environments.
- **UI development**: Add editable badges for sweetness and strength preferences, support display of uploaded photos and notes on the place details page, and refine the color palette and typography.

## Differences vs. Initial Concept (A2)

- **Persistence layer**
  - A2 assumed in‑memory or naive persistence. The final design adopts MongoDB across concepts.
  - See `design/design_updates.md` ("Database Integration Refactoring"). Implementations live in `src/concepts/**`.
  - Impact: pervasive async/await, database lifecycle handling, and improved test isolation.

- **Synchronization model**
  - A2 implicitly used one sync per route. The final design splits select routes into explicit request/response pairs to avoid timeouts and clarify data flow.
    - Example: `GenerateProfileSummaryRequest` + `GenerateProfileSummaryResponse` in `src/syncs/authenticated_routes.sync.ts`.

- **Inter‑concept triggers**
  - The final design formalizes five cross‑concept syncs (see `design/design_updates.md`):
    - PlaceCreationSync, SavedPlaceRecommendationSync, PreferenceRecommendationSync, ExperienceRecommendationSync, GlobalPlaceRecommendationSync.
  - Rationale: Keep recommendations current after writes in related concepts.

- **Error contracts**
  - A2 assumed conventional HTTP error usage. The final design standardizes `{ error: string }` returns for business logic (often with HTTP 200), as documented in `design/design_updates.md` and implemented in `src/concepts/**`.
  - The frontend API layer normalizes response shapes and surfaces user‑friendly messages.

- **Testing & reliability**
  - Enhanced test infrastructure (connection lifecycle, isolation, LLM mocks) per `design/design_updates.md` and `design/design_changes.md`.
  - Emphasis on deterministic setup/teardown and defensive cleanup to avoid leaks.

## Differences vs. Visual Design (A4b)

- **Saved vs. Logs UI**
  - Implemented as tabs with search and rating filters in `61040-frontend/src/views/CollectionView.vue`.
  - Empty and loading states align with the visual intent.

- **Place details**
  - Photo fallbacks, explicit save/unsave, and immediate verification of saved state via `_get_saved_places` after writes.

- **Profile**
  - Recommendations and AI Summary sections with clear fallbacks when data or secrets are missing.
  - The AI summary invokes a guarded concept method; see `src/concepts/ExperienceLog/ExperienceLogConcept.ts`.

## Final Architecture (Concepts + Syncs)

- **ExperienceLog** — `src/concepts/ExperienceLog/ExperienceLogConcept.ts`
  - CRUD for logs; fields include `rating`, `sweetness`, `strength`, and optional `notes`, `photo`.
  - `generate_profile_summary({ userId, llm? })` computes aggregates, then calls Gemini (guarded by `GEMINI_API_KEY`). Returns `{ summary } | { error }`.

- **UserDirectory** — `src/concepts/UserDirectory/UserDirectoryConcept.ts`
  - User registration, preference management, and saved places (`save_place`, `unsave_place`, `_get_saved_places`).

- **PlaceDirectory** — `src/concepts/PlaceDirectory/PlaceDirectoryConcept.ts`
  - Nearby search via custom distance calculation (no geospatial index dependency), plus detail and search endpoints.

- **RecommendationEngine** — `src/concepts/RecommendationEngine/**`
  - Scores by preferences, ratings/popularity, distance, and saved/tried places.
  - Refreshed via syncs described in `design/design_updates.md`.
  - New: `get_recommendations_within({ userId, allowedPlaces })` returns cached recommendations intersected with a provided set of place IDs (e.g., nearby). See `src/concepts/RecommendationEngine/RecommendationEngineConcept.ts`.
  - Exposed via sync route `/RecommendationEngine/get_recommendations_within` in `src/syncs/authenticated_routes.sync.ts`.

## Notable Design Changes (with Rationale)

- **User existence guarantees**
  - Rationale: Production parity—users may exist locally but not in the database.
  - Changes: The frontend registers on login and auto‑registers on first save if the backend reports a missing user. See `61040-frontend/src/views/HomeView.vue` and `.../PlaceDetailView.vue`.

- **Find nearby simplification**
  - Rationale: Reduce infrastructure overhead for geospatial indexes while preserving the intended UX.
  - Files: `src/concepts/PlaceDirectory/PlaceDirectoryConcept.ts`; see also `design/design_updates.md` and `design/design_changes.md`.

- **Server-side location constraint for recommendations**
  - Rationale: Prevent far‑away places (e.g., other cities) from appearing in recommendations; enforce locality at the source.
  - Changes: Added `get_recommendations_within` and a new sync route `/RecommendationEngine/get_recommendations_within`.
  - Frontend alignment: Views call `PlaceDirectory._find_nearby` to obtain `allowedPlaces`, then fetch constrained recommendations; the client still applies a 50 km filter as a guardrail.

- **Immutable log entries**
  - Rationale: Preserve data integrity and audit trail by treating logs as immutable records.
  - Changes: Omitted `update_log` functionality; users must delete and recreate logs to modify them, ensuring accurate timestamps and preventing accidental data alteration.
  - Impact: Simplified data model and reduced potential for confusion, as each log entry represents a discrete point-in-time record.