import { Db } from "npm:mongodb";
import ExperienceLogConcept from "@concepts/ExperienceLog/ExperienceLogConcept.ts";
import PlaceDirectoryConcept from "@concepts/PlaceDirectory/PlaceDirectoryConcept.ts";
import UserDirectoryConcept from "@concepts/UserDirectory/UserDirectoryConcept.ts";
import RecommendationEngineConcept from "@concepts/RecommendationEngine/RecommendationEngineConcept.ts";
import { ID } from "@utils/types.ts";

/**
 * Synchronization function to get personalized recommendations for a user.
 * This orchestrates multiple concepts while maintaining their modularity.
 *
 * @param db - MongoDB database instance
 * @param userId - The ID of the user to get recommendations for
 * @returns Enriched recommendations with place details
 */
export async function getPersonalizedRecommendations(
  db: Db,
  userId: ID,
) {
  // Initialize all concepts
  const experienceLog = new ExperienceLogConcept(db);
  const placeDirectory = new PlaceDirectoryConcept(db);
  const userDirectory = new UserDirectoryConcept(db);
  const recommendationEngine = new RecommendationEngineConcept(db);

  try {
    const savedPlacesResult = await userDirectory._get_saved_places({ userId });
    if ("error" in savedPlacesResult) {
      return { error: savedPlacesResult.error };
    }
    const savedPlaces = savedPlacesResult.placeIds;

    const user = await userDirectory["users"].findOne({ _id: userId });
    const preferences = new Map(Object.entries(user?.preferences || {}));

    const triedPlacesResult = await experienceLog._get_tried_places({ userId });
    const triedPlaces = triedPlacesResult.places; // _get_tried_places returns { places: PlaceId[] }

    const allPlacesCollection = await placeDirectory.places.find({}).toArray();
    const allAvailablePlaces = allPlacesCollection.map((place) => place._id);

    // Ensure recommendations are fresh before retrieving them.
    await recommendationEngine.refresh_recommendations({
      userId,
      savedPlaces,
      preferences,
      triedPlaces,
      allAvailablePlaces,
    });

    const recommendationsResult = await recommendationEngine
      .get_recommendations({ userId });
    const recommendations = recommendationsResult.places; // get_recommendations returns { places: Place[] }

    const enrichedRecommendations = await Promise.all(
      recommendations.map(async (placeId) => {
        const detailsResult = await placeDirectory._get_details({ placeId });
        return "error" in detailsResult ? null : detailsResult.place; // _get_details returns { place: Place }
      }),
    );

    const validRecommendations = enrichedRecommendations.filter((p) =>
      p !== null
    );

    return {
      success: true,
      recommendations: validRecommendations,
      count: validRecommendations.length,
    };
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return {
      error: "Failed to generate recommendations",
      details: (error as Error).message,
    };
  }
}

/**
 * Trigger a recommendation refresh when a user logs a new experience,
 * saves a place, or updates preferences.
 * This ensures recommendations stay up-to-date with user behavior.
 *
 * @param db - MongoDB database instance
 * @param userId - The ID of the user
 */
export async function refreshRecommendationsAfterNewLog(
  db: Db,
  userId: ID,
): Promise<{ success: true } | { error: string }> {
  const experienceLog = new ExperienceLogConcept(db);
  const placeDirectory = new PlaceDirectoryConcept(db);
  const userDirectory = new UserDirectoryConcept(db);
  const recommendationEngine = new RecommendationEngineConcept(db);

  try {
    // Gather updated user data
    const savedPlacesResult = await userDirectory._get_saved_places({ userId });
    const savedPlaces = "error" in savedPlacesResult
      ? []
      : savedPlacesResult.placeIds;

    const user = await userDirectory["users"].findOne({ _id: userId });
    const preferences = new Map(Object.entries(user?.preferences || {}));

    const triedPlacesResult = await experienceLog._get_tried_places({ userId });
    const triedPlaces = triedPlacesResult.places; // _get_tried_places returns { places: PlaceId[] }

    const allPlacesCollection = await placeDirectory.places.find({}).toArray();
    const allAvailablePlaces = allPlacesCollection.map((place) => place._id);

    await recommendationEngine.refresh_recommendations({
      userId,
      savedPlaces,
      preferences,
      triedPlaces,
      allAvailablePlaces,
    });

    return { success: true };
  } catch (error) {
    console.error("Error refreshing recommendations:", error);
    return { error: "Failed to refresh recommendations" };
  }
}
