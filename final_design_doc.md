 # Final Design Document
 
 ## Overview
 
 The initial concept (A2) envisioned straightforward CRUD operations across `Users`, `Places`, `Experience Logs`, and a recommendation engine, exposed via a REST API. The visual design (A4b) targeted a clean, tabbed UI for Saved and Logs, enriched Place pages, and a Profile with recommendations and an AI summary.
 
 The final implementation matured in three directions:
 - **Operational robustness**: split long operations into request/response sync pairs, add defensive error handling, and increase observability.
 - **Data and contracts**: migrate to MongoDB, standardize error returns, and normalize API responses on the client.
 - **User identity coherence**: ensure consistent user presence and behavior across environments.
 - **UI development**: Added editable badges for sweetness and strength preferences, allowed for display of uploaded photos and notes to place details page, and coordinated color scheme (as well as improved font use).
 
 ## Differences vs. Initial Concept (A2)
 
 - **Persistence layer**
   - A2 assumed in‑memory or naive persistence. My final design adopts MongoDB across concepts.
   - See `design/design_updates.md` ("Database Integration Refactoring"). Implementations live in `src/concepts/**`.
   - Impact: async/await throughout, DB lifecycle handling, and test isolation requirements.
 
 - **Synchronization model**
   - A2 implicitly used one sync per route. Final design splits some routes into explicit request/response pairs to avoid timeouts and clarify data flow.
     - Example: `GenerateProfileSummaryRequest` + `GenerateProfileSummaryResponse` in `src/syncs/authenticated_routes.sync.ts`.
 
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
 
- **PlaceDirectory** — `src/concepts/PlaceDirectory/PlaceDirectoryConcept.ts`
  - Nearby search via custom distance calculation (no geospatial index dependency), plus detail and search endpoints.
 
- **RecommendationEngine** — `src/concepts/RecommendationEngine/**`
  - Scores by preferences, ratings/popularity, distance, and saved/tried places.
  - Refreshed via syncs described in `design/design_updates.md`.
  - New: `get_recommendations_within({ userId, allowedPlaces })` returns cached recs intersected with a provided set of place IDs (e.g., nearby). See `src/concepts/RecommendationEngine/RecommendationEngineConcept.ts`.
  - Exposed via sync route `/RecommendationEngine/get_recommendations_within` in `src/syncs/authenticated_routes.sync.ts`.
 
## Notable Design Changes (with rationale)
 
- **User existence guarantees**
  - Rationale: Production parity—users may exist locally but not in DB.
  - Changes: Frontend registers on login and auto‑registers on first save if backend reports missing user. See `61040-frontend/src/views/HomeView.vue` and `.../PlaceDetailView.vue`.
 
- **Find nearby simplification**
  - Rationale: Reduce infra overhead for geospatial indexes while preserving expected UX.
  - Files: `src/concepts/PlaceDirectory/PlaceDirectoryConcept.ts`; notes in `design/design_updates.md` and `design/design_changes.md`.
 
- **Server-side location constraint for recommendations**
  - Rationale: Prevent far-away places (e.g., other cities) from appearing in recs; enforce locality at the source.
  - Changes: Added `get_recommendations_within` and new sync route `/RecommendationEngine/get_recommendations_within`.
  - Frontend alignment: Views call `PlaceDirectory._find_nearby` to get `allowedPlaces`, then fetch constrained recs; client still applies a 50km filter as a guardrail.