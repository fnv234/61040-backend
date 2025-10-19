# syncs for concepts

sync PlaceCreationSync:
    when PlaceDirectory.create_place(...) returns placeId
    then placeId becomes available for UserDirectory.save_place(userId, placeId)

sync SavedPlaceRecommendationSync:
    when UserDirectory.save_place(userId, placeId)
    then RecommendationEngine.refresh_recommendations(userId, savedPlaces, preferences, triedPlaces)

sync PreferenceRecommendationSync:
    when UserDirectory.update_preferences(userId, prefs)
    then RecommendationEngine.refresh_recommendations(userId, savedPlaces, prefs, triedPlaces)

sync ExperienceRecommendationSync:
    when ExperienceLog.create_log(userId, placeId, rating, sweetness, strength)
    then RecommendationEngine.refresh_recommendations(userId, savedPlaces, preferences, triedPlaces)

sync GlobalPlaceRecommendationSync:
    when PlaceDirectory.create_place(...) adds new place
    then RecommendationEngine.refresh_recommendations(all users, savedPlaces, preferences, triedPlaces)
