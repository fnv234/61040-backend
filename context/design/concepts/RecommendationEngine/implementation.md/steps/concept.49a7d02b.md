---
timestamp: 'Sun Oct 12 2025 19:37:32 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_193732.3ca672dd.md]]'
content_id: 49a7d02b26cbd38b18a0286cc9f8874127a1fe1709421be010736630989349e0
---

# concept: RecommendationEngine

**concept** RecommendationEngine\[User, Place]

**purpose** suggest places for users to try based on basic matching criteria

**principle** recommendations are computed from user preferences, saved places, and experience history, then cached until user behavior changes warrant a refresh

**state**

```
a Map (called recommendations) mapping
    a user User to a set Place

a Map (called lastUpdated) mapping 
    a user User to a DateTime
```

**actions**

```
get_recommendations(userId: User): set Place
    **effects** return recommendations[userId] if exists and recent; otherwise compute fresh

refresh_recommendations(userId: User, savedPlaces: set Place, preferences: Map[String, String], triedPlaces: set Place)
    **effects** recommendations[userId] = compute_suggestions(savedPlaces, preferences, triedPlaces),
            lastUpdated[userId] = now()

compute_suggestions(savedPlaces: set Place, preferences: Map[String, String], triedPlaces: set Place): set Place
    **effects** return {p | p not in triedPlaces} ranked by similarity to savedPlaces and preference match

clear_recommendations(userId: User)
    **effects** remove recommendations[userId] and lastUpdated[userId]
```

Notes: the recommendation scoring here is simplified for this design phase.
