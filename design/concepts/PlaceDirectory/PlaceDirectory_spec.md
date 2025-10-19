# PlaceDirectory Concept Specification

## Overview
The PlaceDirectory concept manages information about matcha places, including their locations, preparation styles, pricing, and other details.

# concept: PlaceDirectory

* **concept** PlaceDirectory

* **purpose** represent and manage known matcha-serving locations

* **principle** places store structured metadata and can be discovered through search and location-based queries

* **state**  

    a set of Places with
        a placeId PlaceId
        a name String
        an address String
        coordinates (Float, Float)
        preparationStyles set String
        priceRange String
        hours String?
        photos set URL


* **actions**  

    create_place(name: String, address: String, coords: (Float, Float), styles: set String, priceRange: String, hours: String?): PlaceId
        **requires** name and address are non-empty
        **effects** adds new Place with placeId and all given attributes to the set of Places

    edit_place(placeId: PlaceId, name: String?, address: String?, coords: (Float, Float)?, styles: set String?, priceRange: String?, hours: String?, photos: set URL?)
        **requires** placeId in {p.placeId | p in the set of Places}
        **effects** update place where p.placeId = placeId with any non-null parameters

    delete_place(placeId: PlaceId)
        **requires** placeId in {p.placeId | p in the set of Places}
        **effects** removes p where p.placeId = placeId from the set of Places

    find_nearby(coords: (Float, Float), radius: Float): set PlaceId
        **requires** radius > 0
        **effects** return {p.placeId | p in the set of Places and distance(p.coordinates, coords) <= radius}

    search_by_name(query: String): set PlaceId
        **effects** return {p.placeId | p in the set of Places and query in p.name}

    filter_places(priceRange: String?, hours: String?, style: String?): set PlaceId
        **effects** return {p.placeId | p in the set of Places
                        and (priceRange = null or p.priceRange = priceRange)
                        and (hours = null or p.hours = hours)
                        and (style = null or style in p.preparationStyles)}

    get_details(placeId: PlaceId): Place
        **requires** placeId in {p.placeId | p in the set of Places}
        **effects** return p where p.placeId = placeId