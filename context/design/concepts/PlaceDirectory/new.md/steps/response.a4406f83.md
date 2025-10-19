---
timestamp: 'Fri Oct 17 2025 14:45:18 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251017_144518.7f506e86.md]]'
content_id: a4406f83fcfcabd213bb18150ef9ca73b087b9b636395db95fd116f358559625
---

# response:

```python
import math
from typing import Set, Tuple, Optional, Dict, List

# Define type aliases for clarity
PlaceId = str
URL = str
Coordinates = Tuple[float, float]

class Place:
    def __init__(self,
                 placeId: PlaceId,
                 name: str,
                 address: str,
                 coordinates: Coordinates,
                 preparationStyles: Set[str],
                 priceRange: str,
                 hours: Optional[str] = None,
                 photos: Optional[Set[URL]] = None):
        self.placeId = placeId
        self.name = name
        self.address = address
        self.coordinates = coordinates
        self.preparationStyles = preparationStyles
        self.priceRange = priceRange
        self.hours = hours
        self.photos = photos if photos is not None else set()

    def __repr__(self) -> str:
        return (f"Place(placeId='{self.placeId}', name='{self.name}', address='{self.address}', "
                f"coordinates={self.coordinates}, preparationStyles={self.preparationStyles}, "
                f"priceRange='{self.priceRange}', hours='{self.hours}', photos={self.photos})")

    def __eq__(self, other):
        if not isinstance(other, Place):
            return NotImplemented
        return self.placeId == other.placeId

    def __hash__(self):
        return hash(self.placeId)

class PlaceDirectory:
    def __init__(self):
        self._places: Dict[PlaceId, Place] = {}
        self._next_id = 0

    def _generate_place_id(self) -> PlaceId:
        self._next_id += 1
        return str(self._next_id)

    def _distance(self, coords1: Coordinates, coords2: Coordinates) -> float:
        """Calculates the Euclidean distance between two coordinate pairs."""
        lat1, lon1 = coords1
        lat2, lon2 = coords2
        return math.sqrt((lat2 - lat1)**2 + (lon2 - lon1)**2)

    def create_place(self,
                     name: str,
                     address: str,
                     coords: Coordinates,
                     styles: Set[str],
                     priceRange: str,
                     hours: Optional[str] = None,
                     photos: Optional[Set[URL]] = None) -> PlaceId:
        """
        Adds a new Place with a unique placeId and all given attributes to the set of Places.

        Args:
            name: The name of the place.
            address: The address of the place.
            coords: The geographical coordinates (latitude, longitude) of the place.
            styles: A set of preparation styles offered (e.g., 'iced', 'hot', 'blended').
            priceRange: A string representing the price range (e.g., '$', '$$', '$$$').
            hours: Optional. The operating hours of the place.
            photos: Optional. A set of URLs to photos of the place.

        Returns:
            The unique PlaceId of the newly created place.

        Raises:
            ValueError: If name or address are empty.
        """
        if not name or not address:
            raise ValueError("Name and address cannot be empty.")

        place_id = self._generate_place_id()
        new_place = Place(
            placeId=place_id,
            name=name,
            address=address,
            coordinates=coords,
            preparationStyles=styles,
            priceRange=priceRange,
            hours=hours,
            photos=photos
        )
        self._places[place_id] = new_place
        return place_id

    def edit_place(self,
                   placeId: PlaceId,
                   name: Optional[str] = None,
                   address: Optional[str] = None,
                   coords: Optional[Coordinates] = None,
                   styles: Optional[Set[str]] = None,
                   priceRange: Optional[str] = None,
                   hours: Optional[str] = None,
                   photos: Optional[Set[URL]] = None):
        """
        Updates a place with the given placeId with any non-null parameters.

        Args:
            placeId: The ID of the place to edit.
            name: Optional. The new name of the place.
            address: Optional. The new address of the place.
            coords: Optional. The new geographical coordinates of the place.
            styles: Optional. The new set of preparation styles.
            priceRange: Optional. The new price range.
            hours: Optional. The new operating hours.
            photos: Optional. The new set of photo URLs.

        Raises:
            ValueError: If the placeId does not exist.
        """
        if placeId not in self._places:
            raise ValueError(f"Place with id '{placeId}' not found.")

        place = self._places[placeId]
        if name is not None:
            place.name = name
        if address is not None:
            place.address = address
        if coords is not None:
            place.coordinates = coords
        if styles is not None:
            place.preparationStyles = styles
        if priceRange is not None:
            place.priceRange = priceRange
        if hours is not None:
            place.hours = hours
        if photos is not None:
            place.photos = photos

    def delete_place(self, placeId: PlaceId):
        """
        Removes a place with the given placeId from the set of Places.

        Args:
            placeId: The ID of the place to delete.

        Raises:
            ValueError: If the placeId does not exist.
        """
        if placeId not in self._places:
            raise ValueError(f"Place with id '{placeId}' not found.")
        del self._places[placeId]

    def find_nearby(self, coords: Coordinates, radius: float) -> Set[PlaceId]:
        """
        Returns a set of PlaceIds for places within a given radius of the specified coordinates.

        Args:
            coords: The reference geographical coordinates (latitude, longitude).
            radius: The maximum distance from the reference coordinates.

        Returns:
            A set of PlaceIds that are within the specified radius.

        Raises:
            ValueError: If radius is not positive.
        """
        if radius <= 0:
            raise ValueError("Radius must be positive.")

        nearby_place_ids: Set[PlaceId] = set()
        for place_id, place in self._places.items():
            if self._distance(place.coordinates, coords) <= radius:
                nearby_place_ids.add(place_id)
        return nearby_place_ids

    def search_by_name(self, query: str) -> Set[PlaceId]:
        """
        Returns a set of PlaceIds for places whose names contain the given query string.

        Args:
            query: The search query string.

        Returns:
            A set of PlaceIds matching the search query.
        """
        matching_place_ids: Set[PlaceId] = set()
        for place_id, place in self._places.items():
            if query.lower() in place.name.lower():
                matching_place_ids.add(place_id)
        return matching_place_ids

    def filter_places(self,
                      priceRange: Optional[str] = None,
                      hours: Optional[str] = None,
                      style: Optional[str] = None) -> Set[PlaceId]:
        """
        Filters places based on price range, operating hours, and preparation style.

        Args:
            priceRange: Optional. The desired price range to filter by.
            hours: Optional. The desired operating hours to filter by.
            style: Optional. The desired preparation style to filter by.

        Returns:
            A set of PlaceIds that match all specified filter criteria.
        """
        filtered_place_ids: Set[PlaceId] = set()
        for place_id, place in self._places.items():
            price_match = (priceRange is None or place.priceRange == priceRange)
            hours_match = (hours is None or place.hours == hours)
            style_match = (style is None or style in place.preparationStyles)

            if price_match and hours_match and style_match:
                filtered_place_ids.add(place_id)
        return filtered_place_ids

    def get_details(self, placeId: PlaceId) -> Place:
        """
        Returns the full Place object for a given placeId.

        Args:
            placeId: The ID of the place to retrieve details for.

        Returns:
            The Place object.

        Raises:
            ValueError: If the placeId does not exist.
        """
        if placeId not in self._places:
            raise ValueError(f"Place with id '{placeId}' not found.")
        return self._places[placeId]

# Example Usage:
if __name__ == "__main__":
    directory = PlaceDirectory()

    # Create some places
    place1_id = directory.create_place(
        name="The Daily Grind",
        address="123 Coffee St",
        coords=(34.0522, -118.2437),
        styles={"iced", "hot"},
        priceRange="$$",
        hours="7 AM - 6 PM",
        photos={"http://example.com/photo1.jpg"}
    )
    print(f"Created Place 1 with ID: {place1_id}")

    place2_id = directory.create_place(
        name="Bean Scene",
        address="456 Espresso Ave",
        coords=(34.0550, -118.2500),
        styles={"hot", "blended"},
        priceRange="$",
        hours="8 AM - 5 PM"
    )
    print(f"Created Place 2 with ID: {place2_id}")

    place3_id = directory.create_place(
        name="The Cozy Cup",
        address="789 Cafe Rd",
        coords=(34.0600, -118.2300),
        styles={"iced"},
        priceRange="$$$",
        hours="9 AM - 7 PM",
        photos={"http://example.com/photo3.jpg", "http://example.com/photo4.jpg"}
    )
    print(f"Created Place 3 with ID: {place3_id}")

    # Get details of a place
    print("\nDetails of Place 1:")
    print(directory.get_details(place1_id))

    # Edit a place
    directory.edit_place(
        placeId=place1_id,
        hours="7 AM - 7 PM",
        photos={"http://example.com/new_photo1.jpg"}
    )
    print("\nEdited Place 1:")
    print(directory.get_details(place1_id))

    # Find nearby places
    central_coords = (34.0530, -118.2450)
    radius = 0.01  # A small radius for demonstration
    nearby_ids = directory.find_nearby(central_coords, radius)
    print(f"\nPlaces near {central_coords} within radius {radius}: {nearby_ids}")

    # Search by name
    search_query = "cup"
    search_results = directory.search_by_name(search_query)
    print(f"\nPlaces matching '{search_query}': {search_results}")

    # Filter places
    filtered_ids = directory.filter_places(priceRange="$", style="hot")
    print(f"\nPlaces with price range '$' and style 'hot': {filtered_ids}")

    filtered_ids_by_hours = directory.filter_places(hours="7 AM - 7 PM")
    print(f"\nPlaces open from '7 AM - 7 PM': {filtered_ids_by_hours}")

    # Delete a place
    directory.delete_place(place2_id)
    print(f"\nDeleted Place 2 (ID: {place2_id}).")

    # Verify deletion
    try:
        directory.get_details(place2_id)
    except ValueError as e:
        print(f"Attempting to get details of deleted place resulted in: {e}")

    # List all remaining places
    print("\nRemaining places in directory:")
    for pid, p in directory._places.items():
        print(f"- {pid}: {p.name}")
```
