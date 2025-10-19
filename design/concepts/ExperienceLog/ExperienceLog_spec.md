# ExperienceLog Concept Specification

## Overview
The ExperienceLog concept manages user matcha tasting logs, allowing users to record their experiences at different places with ratings, preferences, and notes.

# concept: ExperienceLog

* **concept** ExperienceLog[User, Place]

* **purpose**
    capture a user's personal experience at a place with structured ratings and notes,
    and enable AI-powered insights about their overall preferences and trends

* **principle**
    each log entry represents one user's assessment of one place at a specific time;
    users can track and reference their personal experiences;
    an AI model can generate summaries across a user’s logs to highlight patterns
    such as preferred sweetness, strength, or favorite places

* **state**

    a set of Logs with
        a logId LogId
        a userId User
        a placeId Place
        a timestamp DateTime
        a rating Integer
        sweetness Integer
        strength Integer
        notes optional String
        photo optional String (URL)

* **actions**

    create_log(userId: User, placeId: Place, rating: Integer, sweetness: Integer, strength: Integer): LogId
        **requires** rating is in the inclusive range [1,5]
        **effects** adds new Log with new logId, given params, timestamp = now() to the set of Logs

    update_log(logId: LogId, rating?: Integer, sweetness?: Integer, strength?: Integer, notes?: String, photo?: String)
        **requires** logId in {log.logId | log in the set of Logs} and if rating given then rating is in the inclusive range [1,5]
        **effects** update log where log.logId = logId with non-null parameters

    delete_log(logId: LogId)
        **requires** logId in {log.logId | log in Logs}
        **effects** Logs' = Logs - {log | log.logId = logId}

    get_user_logs(userId: User): set Log
        **effects** return {log | log in the set of Logs and log.userId = userId}

    get_place_logs(userId: User, placeId: Place): set Log
        **effects** return {log | log in the set of Logs and log.userId = userId and log.placeId = placeId}

    delete_log(logId: LogId)
        **requires** logId in {log.logId | log in the set of Logs}
        **effects** updates the set of Logs such that: logs' = logs - {log | log.logId = logId}

    get_average_rating(userId: User, placeId: Place): Float
        **effects** return average of {log.rating | log in the set of Logs and log.userId = userId and log.placeId = placeId}

    get_tried_places(userId: User): set Place
        **effects** return {log.placeId | log in Logs and log.userId = userId}

    async generate_profile_summary(userId: User, llm: GeminiLLM): String
        **requires** there exists at least one log in the set of Logs with log.userId = userId
        **effects** calls llm with the user's Logs (ratings, sweetness, strength, notes, and places)
                    and returns a concise textual summary describing the user's preferences and patterns
        **validators**
            - summary must not mention places not in user's logs
            - summary must be <= 3 sentences
            - sentiment of summary should align with overall average rating

* notes
    This augmented version of ExperienceLog integrates an AI model (GeminiLLM)
    to synthesize multiple logs into a readable "taste profile."
    The summary helps users recognize long-term trends and preferences
    that might be difficult to notice from individual entries alone.

    Any parameters marked with a ? at the end are optional.