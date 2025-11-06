/**
 * Synchronizations for authenticated routes.
 * These routes require user authentication before executing.
 * 
 * TODO: Add Authenticating/Sessioning concept for proper authentication.
 * For now, these syncs simply pass through the requests.
 * 
 * NOTE: These syncs use the instrumented concept instances from @concepts,
 * which are already connected to the database and the sync engine.
 */

import { actions, Sync, Frames } from "@engine";
import { Requesting, ExperienceLog, PlaceDirectory, UserDirectory, RecommendationEngine } from "@concepts";

// ============================================================================
// ExperienceLog Routes
// ============================================================================

export const CreateLogRequest: Sync = ({ request, userId, placeId, rating, sweetness, strength, notes, photo }) => ({
  when: actions([Requesting.request, { path: "/ExperienceLog/create_log", userId, placeId, rating, sweetness, strength }, { request }]),
  where: async (frames) => {
    // Add optional parameters to frame if they don't exist
    if (!(notes in frames[0])) {
      frames[0][notes] = null;
    }
    if (!(photo in frames[0])) {
      frames[0][photo] = null;
    }
    return frames;
  },
  then: actions([ExperienceLog.create_log, { userId, placeId, rating, sweetness, strength, notes, photo }]),
});

export const CreateLogResponse: Sync = ({ request, logId }) => ({
  when: actions(
    [Requesting.request, { path: "/ExperienceLog/create_log" }, { request }],
    [ExperienceLog.create_log, {}, { logId }]
  ),
  then: actions([Requesting.respond, { request, logId }]),
});

export const DeleteLogRequest: Sync = ({ request, logId }) => ({
  when: actions([Requesting.request, { path: "/ExperienceLog/delete_log", logId }, { request }]),
  then: actions(
    [ExperienceLog.delete_log, { logId }, {}],
    [Requesting.respond, { request }]
  ),
});

export const GetUserLogsRequest: Sync = ({ request, userId, logs }) => ({
  when: actions([Requesting.request, { path: "/ExperienceLog/_get_user_logs", userId }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    const userIdValue = originalFrame[userId];
    const result = await ExperienceLog._get_user_logs({ userId: userIdValue });
    return new Frames({ ...originalFrame, [logs]: result.logs });
  },
  then: actions([Requesting.respond, { request, logs }]),
});

export const GetPlaceLogsRequest: Sync = ({ request, userId, placeId, logs }) => ({
  when: actions([Requesting.request, { path: "/ExperienceLog/_get_place_logs", userId, placeId }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    const userIdValue = originalFrame[userId];
    const placeIdValue = originalFrame[placeId];
    const result = await ExperienceLog._get_place_logs({ userId: userIdValue, placeId: placeIdValue });
    return new Frames({ ...originalFrame, [logs]: result.logs });
  },
  then: actions([Requesting.respond, { request, logs }]),
});

export const GetAverageRatingRequest: Sync = ({ request, userId, placeId, averageRating }) => ({
  when: actions([Requesting.request, { path: "/ExperienceLog/_get_average_rating", userId, placeId }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    const userIdValue = originalFrame[userId];
    const placeIdValue = originalFrame[placeId];
    const result = await ExperienceLog._get_average_rating({ userId: userIdValue, placeId: placeIdValue });
    return new Frames({ ...originalFrame, [averageRating]: result.averageRating });
  },
  then: actions([Requesting.respond, { request, averageRating }]),
});

export const GetTriedPlacesRequest: Sync = ({ request, userId, places }) => ({
  when: actions([Requesting.request, { path: "/ExperienceLog/_get_tried_places", userId }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    const userIdValue = originalFrame[userId];
    const result = await ExperienceLog._get_tried_places({ userId: userIdValue });
    return new Frames({ ...originalFrame, [places]: result.places });
  },
  then: actions([Requesting.respond, { request, places }]),
});

export const GenerateProfileSummaryRequest: Sync = ({ request, userId }) => ({
  when: actions([Requesting.request, { path: "/ExperienceLog/generate_profile_summary", userId }, { request }]),
  then: actions([ExperienceLog.generate_profile_summary, { userId }]),
});

export const GenerateProfileSummaryResponse: Sync = ({ request, summary }) => ({
  when: actions(
    [Requesting.request, { path: "/ExperienceLog/generate_profile_summary" }, { request }],
    [ExperienceLog.generate_profile_summary, {}, { summary }]
  ),
  then: actions([Requesting.respond, { request, summary }]),
});

// ============================================================================
// PlaceDirectory Routes (Write Operations)
// ============================================================================

export const CreatePlaceRequest: Sync = ({ request, name, address, coords, hours, priceRange, style, place }) => ({
  when: actions([Requesting.request, { path: "/PlaceDirectory/create_place", name, address, coords, hours, priceRange, style }, { request }]),
  then: actions(
    [PlaceDirectory.create_place, { name, address, coords, hours, priceRange, style }, { place }],
    [Requesting.respond, { request, place }]
  ),
});

export const EditPlaceRequest: Sync = ({ request, placeId, name, address, coords, hours, priceRange, style }) => ({
  when: actions([Requesting.request, { path: "/PlaceDirectory/edit_place", placeId, name, address, coords, hours, priceRange, style }, { request }]),
  then: actions(
    [PlaceDirectory.edit_place, { placeId, name, address, coords, hours, priceRange, style }, {}],
    [Requesting.respond, { request }]
  ),
});

export const DeletePlaceRequest: Sync = ({ request, placeId }) => ({
  when: actions([Requesting.request, { path: "/PlaceDirectory/delete_place", placeId }, { request }]),
  then: actions(
    [PlaceDirectory.delete_place, { placeId }, {}],
    [Requesting.respond, { request }]
  ),
});

// ============================================================================
// UserDirectory Routes
// ============================================================================

export const SavePlaceRequest: Sync = ({ request, userId, placeId }) => ({
  when: actions([Requesting.request, { path: "/UserDirectory/save_place", userId, placeId }, { request }]),
  then: actions(
    [UserDirectory.save_place, { userId, placeId }, {}],
    [Requesting.respond, { request }]
  ),
});

export const UnsavePlaceRequest: Sync = ({ request, userId, placeId }) => ({
  when: actions([Requesting.request, { path: "/UserDirectory/unsave_place", userId, placeId }, { request }]),
  then: actions(
    [UserDirectory.unsave_place, { userId, placeId }, {}],
    [Requesting.respond, { request }]
  ),
});

export const UpdatePreferencesRequest: Sync = ({ request, userId, newPrefs }) => ({
  when: actions([Requesting.request, { path: "/UserDirectory/update_preferences", userId, newPrefs }, { request }]),
  then: actions(
    [UserDirectory.update_preferences, { userId, newPrefs }, {}],
    [Requesting.respond, { request }]
  ),
});

export const GetSavedPlacesRequest: Sync = ({ request, userId, placeIds }) => ({
  when: actions([Requesting.request, { path: "/UserDirectory/_get_saved_places", userId }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    const userIdValue = originalFrame[userId];
    const result = await UserDirectory._get_saved_places({ userId: userIdValue });
    if ('error' in result) {
      return new Frames({ ...originalFrame, [placeIds]: [] });
    }
    return new Frames({ ...originalFrame, [placeIds]: result.placeIds });
  },
  then: actions([Requesting.respond, { request, placeIds }]),
});

// ============================================================================
// RecommendationEngine Routes
// ============================================================================

export const GetRecommendationsRequest: Sync = ({ request, userId, places }) => ({
  when: actions([Requesting.request, { path: "/RecommendationEngine/get_recommendations", userId }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    const userIdValue = originalFrame[userId];
    const result = await RecommendationEngine.get_recommendations({ userId: userIdValue });
    return new Frames({ ...originalFrame, [places]: result.places });
  },
  then: actions([Requesting.respond, { request, places }]),
});

export const RefreshRecommendationsRequest: Sync = ({ request, userId, savedPlaces, preferences, triedPlaces, allAvailablePlaces }) => ({
  when: actions([Requesting.request, { path: "/RecommendationEngine/refresh_recommendations", userId, savedPlaces, preferences, triedPlaces, allAvailablePlaces }, { request }]),
  then: actions(
    [RecommendationEngine.refresh_recommendations, { userId, savedPlaces, preferences, triedPlaces, allAvailablePlaces }, {}],
    [Requesting.respond, { request }]
  ),
});

export const ComputeSuggestionsRequest: Sync = ({ request, userId, savedPlaces, preferences, triedPlaces, allAvailablePlaces, suggestions }) => ({
  when: actions([Requesting.request, { path: "/RecommendationEngine/compute_suggestions", userId, savedPlaces, preferences, triedPlaces, allAvailablePlaces }, { request }]),
  then: actions(
    [RecommendationEngine.compute_suggestions, { userId, savedPlaces, preferences, triedPlaces, allAvailablePlaces }, { suggestions }],
    [Requesting.respond, { request, suggestions }]
  ),
});

export const ClearRecommendationsRequest: Sync = ({ request, userId }) => ({
  when: actions([Requesting.request, { path: "/RecommendationEngine/clear_recommendations", userId }, { request }]),
  then: actions(
    [RecommendationEngine.clear_recommendations, { userId }, {}],
    [Requesting.respond, { request }]
  ),
});

export const GetUserRecommendationsRequest: Sync = ({ request, userId, places }) => ({
  when: actions([Requesting.request, { path: "/RecommendationEngine/_get_user_recommendations", userId }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    const userIdValue = originalFrame[userId];
    const result = await RecommendationEngine._get_user_recommendations({ userId: userIdValue });
    return new Frames({ ...originalFrame, [places]: result.places });
  },
  then: actions([Requesting.respond, { request, places }]),
});

export const GetLastUpdatedRequest: Sync = ({ request, userId, lastUpdated }) => ({
  when: actions([Requesting.request, { path: "/RecommendationEngine/_get_last_updated", userId }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    const userIdValue = originalFrame[userId];
    const result = await RecommendationEngine._get_last_updated({ userId: userIdValue });
    return new Frames({ ...originalFrame, [lastUpdated]: result.lastUpdated });
  },
  then: actions([Requesting.respond, { request, lastUpdated }]),
});

// Returns recommendations intersected with the provided allowedPlaces (e.g., nearby IDs)
export const GetRecommendationsWithinRequest: Sync = ({ request, userId, allowedPlaces, places }) => ({
  when: actions([Requesting.request, { path: "/RecommendationEngine/get_recommendations_within", userId, allowedPlaces }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    const userIdValue = originalFrame[userId];
    const allowed = originalFrame[allowedPlaces] ?? [];
    const result = await RecommendationEngine.get_recommendations_within({ userId: userIdValue, allowedPlaces: allowed });
    return new Frames({ ...originalFrame, [places]: result.places });
  },
  then: actions([Requesting.respond, { request, places }]),
});
