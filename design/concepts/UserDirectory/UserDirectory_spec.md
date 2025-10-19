# UserDirectory Concept Specification

## Overview
The UserDirectory concept manages user accounts, their saved places, and preferences for the matcha tracking application.

# concept: UserDirectory

* **concept** UserDirectory

* **purpose** represent app users with identity, preferences, and saved places

* **principle** each user maintains independent saved places and preferences 

* **state**  

    a set of Users with
        a userId UserId
        a displayName String
        an email String
        preferences Map[String, String]
        savedPlaces set PlaceId

* **actions**  

    register_user(userId: UserId, displayName: String, email: String): UserId
        **requires** userId not in {u.userId | u in the set of Users} and displayName, email are non-empty
        **effects** adds new User with given attributes and empty savedPlaces, preferences to the set of Users

    save_place(userId: UserId, placeId: PlaceId)
        **requires** userId in {u.userId | u in the set of Users}
        **effects** update user u where u.userId = userId: u.savedPlaces' = u.savedPlaces + {placeId}

    unsave_place(userId: UserId, placeId: PlaceId)
        **requires** userId in {u.userId | u in the set of Users} and placeId in user.savedPlaces
        **effects** update user u where u.userId = userId: u.savedPlaces' = u.savedPlaces - {placeId}

    update_preferences(userId: UserId, newPrefs: Map[String, String])
        **requires** userId in {u.userId | u in the set of Users}
        **effects** update user u where u.userId = userId: u.preferences' = newPrefs

    get_saved_places(userId: UserId): set PlaceId
        **requires** userId in {u.userId | u in the set of Users}
        **effects** return u.savedPlaces where u.userId = userId

