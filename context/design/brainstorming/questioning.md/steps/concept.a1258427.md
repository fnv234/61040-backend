---
timestamp: 'Thu Oct 16 2025 19:47:46 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_194746.73211cab.md]]'
content_id: a1258427d99c934a8cafc4be5311cfc572259cf637f7ecfd1bd6a68cc65b2fda
---

# concept: RecommendationEngine

* **concept** RecommendationEngine\[User, Place]

* **purpose** suggest places for users to try based on basic matching criteria

* **principle** recommendations are computed from user preferences, saved places, and experience history, then cached until user behavior changes warrant a refresh

* **state**

  a Map (called `recommendations`) mapping
  a user User to a set Place

  a Map (called `lastUpdated`) mapping
  a user User to a DateTime

* **actions**

  get\_recommendations(userId: User): set Place
  **effects** return recommendations\[userId] if exists and recent; otherwise compute fresh

  refresh\_recommendations(userId: User, savedPlaces: set Place, preferences: Map\[String, String], triedPlaces: set Place)
  **effects** recommendations\[userId] = compute\_suggestions(savedPlaces, preferences, triedPlaces),
  lastUpdated\[userId] = now()

  compute\_suggestions(savedPlaces: set Place, preferences: Map\[String, String], triedPlaces: set Place): set Place
  **effects** return {p | p not in triedPlaces} ranked by similarity to savedPlaces and preference match

  clear\_recommendations(userId: User)
  **effects** remove recommendations\[userId] and lastUpdated\[userId]

* Notes: the recommendation scoring here is simplified for this design phase.
