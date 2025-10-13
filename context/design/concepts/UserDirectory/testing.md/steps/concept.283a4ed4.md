---
timestamp: 'Sun Oct 12 2025 20:45:20 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_204520.2878264f.md]]'
content_id: 283a4ed4dd69b90cb8ea3e54376689608382d18a370bd705bb1e56e4ff2fa6bd
---

# concept: UserDirectory

* **concept** UserDirectory

* **purpose** represent app users with identity, preferences, and saved places

* **principle** each user maintains independent saved places and preferences

* **state**

  a set of Users with
  a userId UserId
  a displayName String
  an email String
  preferences Map\[String, String]
  savedPlaces set PlaceId

* **actions**

  register\_user(userId: UserId, displayName: String, email: String): UserId
  **requires** userId not in {u.userId | u in the set of Users} and displayName, email are non-empty
  **effects** adds new User with given attributes and empty savedPlaces, preferences to the set of Users

  save\_place(userId: UserId, placeId: PlaceId)
  **requires** userId in {u.userId | u in the set of Users}
  **effects** update user u where u.userId = userId: u.savedPlaces' = u.savedPlaces + {placeId}

  unsave\_place(userId: UserId, placeId: PlaceId)
  **requires** userId in {u.userId | u in the set of Users} and placeId in user.savedPlaces
  **effects** update user u where u.userId = userId: u.savedPlaces' = u.savedPlaces - {placeId}

  update\_preferences(userId: UserId, newPrefs: Map\[String, String])
  **requires** userId in {u.userId | u in the set of Users}
  **effects** update user u where u.userId = userId: u.preferences' = newPrefs

  get\_saved\_places(userId: UserId): set PlaceId
  **requires** userId in {u.userId | u in the set of Users}
  **effects** return u.savedPlaces where u.userId = userId
