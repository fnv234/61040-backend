---
timestamp: 'Sun Oct 19 2025 11:02:08 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_110208.5962f5a3.md]]'
content_id: 725cd05192cff10824a7a2b1110087a90faab4c461a644813cb622083cb660ae
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

* Notes: the recommendation scoring here works as follows:

  1. **Filter tried places**: Excludes places the user has already visited

  2. **Prioritize saved places**: Places the user has saved are given higher priority

  3. **Include other places**: Adds other available places that haven't been tried

  4. **Special case handling**: For users with exactly one saved place and no tried places, returns only the saved place
