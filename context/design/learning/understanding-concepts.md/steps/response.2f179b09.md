---
timestamp: 'Wed Oct 08 2025 15:54:55 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251008_155455.d4d37d33.md]]'
content_id: 2f179b0980fe3d39157ef2a2415476700f0eba2e453ccda64ce2e4304997b9c9
---

# response:

The provided text doesn't explicitly state "where" you would add a new concept within a broader system or framework. However, it gives strong clues based on the principles of concept design.

Here's a breakdown of where you would effectively "add" a new concept, inferred from the text:

**1. As a Separable, Modular Service:**

The fundamental idea is that a concept is a "separable, modular service." So, when you identify a distinct piece of user-facing functionality that can be understood and managed independently, that's where you would define and add a new concept.

**2. To Address a Specific, Well-Defined Purpose:**

Each concept "serves a well-defined and intelligible purpose." If you have a new purpose you want to fulfill within your application, you'd create a concept for it. The text emphasizes focusing on "the purposes and motivations of the functionality."

**3. As a New Backend Service (Typically):**

The text states, "A concept will generally be implemented as a backend service." This implies that adding a new concept often means developing a new backend service dedicated to that concept's functionality.

**4. By Specifying its State, Behavior (API), and Human Behavioral Protocol:**

Once you've identified the need for a new concept, you would "add" it by:
\* **Defining its state:** What information does this concept need to maintain? (e.g., for a new `Rating` concept, you might need to store the item being rated and the user who rated it).
\* **Specifying its API:** What actions can be performed on or by this concept? This forms its "human behavioral protocol" from the user's perspective and its API from the developer's perspective.
\* **Ensuring it's independent:** This is a crucial aspect. A new concept should be designed without relying on the internal workings of other concepts.

**5. Potentially as a New Entry in a "Concept Catalog":**

The text mentions the possibility of "concept catalogs that capture all this knowledge, along with relationships between concepts." If such a catalog exists, adding a new concept would involve adding its description, knowledge, and relationships to this catalog.

**6. Through "Composition by Synchronization":**

While not directly *adding* the concept itself, the way a new concept integrates with existing ones is through synchronizations. So, after defining your new concept, you would add new `sync` rules to define how it interacts with other concepts.

**In summary, you would "add" a new concept when you:**

* **Identify a new, distinct piece of user-facing functionality.**
* **Can define its purpose clearly and independently.**
* **Are ready to design its state and behavior as a self-contained unit.**
* **Plan to implement it as a backend service.**
* **Will then define its interactions with other concepts using synchronizations.**

Think of it as introducing a new, specialized worker into your application's workforce. Each worker (concept) has a specific job, the tools (state) to do it, and a way to communicate (API/actions) about its work. The composition through syncs is how these workers coordinate their efforts to achieve the overall application's goals.
