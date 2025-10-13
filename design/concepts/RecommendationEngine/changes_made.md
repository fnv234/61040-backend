# Changes Made to RecommendationEngine

Now parameters (like savedPlaces, preferences, and triedPlaces) are passed explicitly to maintain modularity — RecommendationEngine does not directly access other concepts (instead, it takes parameters).

I also decided to keep the Map for lastUpdated, but clarified purpose as Map[User, DateTime] (standard way to associate timestamps)