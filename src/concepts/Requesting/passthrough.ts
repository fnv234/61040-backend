/**
 * The Requesting concept exposes passthrough routes by default,
 * which allow POSTs to the route:
 *
 * /{REQUESTING_BASE_URL}/{Concept name}/{action or query}
 *
 * to passthrough directly to the concept action or query.
 * This is a convenient and natural way to expose concepts to
 * the world, but should only be done intentionally for public
 * actions and queries.
 *
 * This file allows you to explicitly set inclusions and exclusions
 * for passthrough routes:
 * - inclusions: those that you can justify their inclusion
 * - exclusions: those to exclude, using Requesting routes instead
 */

/**
 * INCLUSIONS
 *
 * Each inclusion must include a justification for why you think
 * the passthrough is appropriate (e.g. public query).
 *
 * inclusions = {"route": "justification"}
 */

export const inclusions: Record<string, string> = {
  // Public queries - no authentication needed
  "/api/PlaceDirectory/_find_nearby": "public query to find nearby matcha places",
  "/api/PlaceDirectory/_search_by_name": "public query to search places by name",
  "/api/PlaceDirectory/_filter_places": "public query to filter places",
  "/api/PlaceDirectory/_get_details": "public query to get place details",
  
  // User registration - must be public to allow new users
  "/api/UserDirectory/register_user": "allow new users to register",
};

/**
 * EXCLUSIONS
 *
 * Excluded routes fall back to the Requesting concept, and will
 * instead trigger the normal Requesting.request action. As this
 * is the intended behavior, no justification is necessary.
 *
 * exclusions = ["route"]
 */

export const exclusions: Array<string> = [
  // ExperienceLog - all require authentication
  "/api/ExperienceLog/create_log",
  "/api/ExperienceLog/update_log",
  "/api/ExperienceLog/delete_log",
  "/api/ExperienceLog/_get_user_logs",
  "/api/ExperienceLog/_get_place_logs",
  "/api/ExperienceLog/_get_average_rating",
  "/api/ExperienceLog/_get_tried_places",
  "/api/ExperienceLog/generate_profile_summary",
  
  // PlaceDirectory - write operations require authentication
  "/api/PlaceDirectory/create_place",
  "/api/PlaceDirectory/edit_place",
  "/api/PlaceDirectory/delete_place",
  
  // UserDirectory - user-specific operations require authentication
  "/api/UserDirectory/save_place",
  "/api/UserDirectory/unsave_place",
  "/api/UserDirectory/update_preferences",
  "/api/UserDirectory/_get_saved_places",
  
  // RecommendationEngine - all require authentication
  "/api/RecommendationEngine/get_recommendations",
  "/api/RecommendationEngine/refresh_recommendations",
  "/api/RecommendationEngine/compute_suggestions",
  "/api/RecommendationEngine/clear_recommendations",
  "/api/RecommendationEngine/_get_user_recommendations",
  "/api/RecommendationEngine/_get_last_updated",
];
