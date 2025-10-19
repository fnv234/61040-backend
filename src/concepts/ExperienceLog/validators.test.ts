import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.217.0/assert/mod.ts";
import {
  ExperienceLogValidator,
  validateGeneratedSummary,
} from "./validators.ts"; // Adjust the import path if necessary

Deno.test("ExperienceLogValidator: validateNoHallucinatedPlaces", () => {
  const validPlaces = ["Zen Tea House", "MatchaLab", "Green Leaf Cafe"];

  // Test case 1: Valid summary with known places
  const validSummary1 = "I had a great time at Zen Tea House and also tried MatchaLab.";
  ExperienceLogValidator.validateNoHallucinatedPlaces(validSummary1, validPlaces); // Should not throw

  // Test case 2: Valid summary with partial matches and correct capitalization
  const validSummary2 = "The experience at the Zen Tea House was nice.";
  ExperienceLogValidator.validateNoHallucinatedPlaces(validSummary2, validPlaces); // Should not throw

  // Test case 3: Summary with no known places mentioned (should warn, not throw)
  const validSummary3 = "I visited a new cafe today.";
  // We can't easily assert console warnings with Deno's default testing, but we can ensure it doesn't throw.
  ExperienceLogValidator.validateNoHallucinatedPlaces(validSummary3, validPlaces); // Should not throw

  // Test case 4: Empty summary
  ExperienceLogValidator.validateNoHallucinatedPlaces("", validPlaces); // Should not throw

  // Test case 5: Null/undefined summary
  // @ts-ignore: Testing invalid input
  ExperienceLogValidator.validateNoHallucinatedPlaces(null, validPlaces); // Should not throw
  // @ts-ignore: Testing invalid input
  ExperienceLogValidator.validateNoHallucinatedPlaces(undefined, validPlaces); // Should not throw

  // Test case 6: Hallucinated place name
  const hallucinatedSummary1 = "I loved the coffee at Starbuckz.";
  assertThrows(
    () => ExperienceLogValidator.validateNoHallucinatedPlaces(hallucinatedSummary1, validPlaces),
    Error,
    "Validator error: Detected possible fabricated place names in summary: Starbuckz",
  );

  // Test case 7: Multiple hallucinated place names (apostrophe splits "Bob's" into "Bob" and "Burgers")
  const hallucinatedSummary2 = "We went to Bob's Burgers and then to The Golden Spoon.";
  assertThrows(
    () => ExperienceLogValidator.validateNoHallucinatedPlaces(hallucinatedSummary2, validPlaces),
    Error,
    "Validator error: Detected possible fabricated place names in summary: Bob, Burgers, The Golden Spoon",
  );

  // Test case 8: Stopwords and short words shouldn't be flagged
  const neutralSummary = "This is a test.";
  ExperienceLogValidator.validateNoHallucinatedPlaces(neutralSummary, validPlaces); // Should not throw

  // Test case 9: Capitalized phrases that are not proper nouns and not in validPlaces
  const nonPlaceCapitalized = "The Quick Brown Fox jumped over the lazy Dog.";
  assertThrows(
    () => ExperienceLogValidator.validateNoHallucinatedPlaces(nonPlaceCapitalized, validPlaces),
    Error,
    "Validator error: Detected possible fabricated place names in summary: The Quick Brown Fox, Dog",
  );

  // Test case 10: Case insensitivity for matching valid places
  const caseInsensitiveSummary = "i visited zen tea house.";
  ExperienceLogValidator.validateNoHallucinatedPlaces(caseInsensitiveSummary, validPlaces); // Should not throw
});

Deno.test("ExperienceLogValidator: validateSentimentConsistency", () => {
  // Test case 1: Low rating, positive sentiment (should throw)
  const lowRatingSummary1 = "I really love the coffee here!";
  assertThrows(
    () => ExperienceLogValidator.validateSentimentConsistency(lowRatingSummary1, 1.5),
    Error,
    "Validator error: Positive tone detected despite low average rating (1.5).",
  );

  // Test case 2: High rating, negative sentiment (should throw)
  const highRatingSummary1 = "This was a terrible experience, I disliked it immensely.";
  assertThrows(
    () => ExperienceLogValidator.validateSentimentConsistency(highRatingSummary1, 4.2),
    Error,
    "Validator error: Negative tone detected despite high average rating (4.2).",
  );

  // Test case 3: Low rating, neutral/negative sentiment (should not throw)
  const lowRatingSummary2 = "It was okay, nothing special.";
  ExperienceLogValidator.validateSentimentConsistency(lowRatingSummary2, 2.0); // Should not throw

  // Test case 4: High rating, positive sentiment (should not throw)
  const highRatingSummary2 = "Absolutely amazing! I loved every sip.";
  ExperienceLogValidator.validateSentimentConsistency(highRatingSummary2, 4.8); // Should not throw

  // Test case 5: Neutral sentiment, low rating (should not throw)
  const neutralLowRating = "The drink was average.";
  ExperienceLogValidator.validateSentimentConsistency(neutralLowRating, 2.5); // Should not throw

  // Test case 6: Neutral sentiment, high rating (should not throw)
  const neutralHighRating = "It was fine.";
  ExperienceLogValidator.validateSentimentConsistency(neutralHighRating, 3.5); // Should not throw

  // Test case 7: Empty summary
  ExperienceLogValidator.validateSentimentConsistency("", 3.0); // Should not throw

  // Test case 8: Null/undefined summary
  // @ts-ignore: Testing invalid input
  ExperienceLogValidator.validateSentimentConsistency(null, 3.0); // Should not throw
  // @ts-ignore: Testing invalid input
  ExperienceLogValidator.validateSentimentConsistency(undefined, 3.0); // Should not throw

  // Test case 9: Mixed positive and negative words with average rating
  const mixedSentiment = "I loved the sweetness but the strength was weak.";
  ExperienceLogValidator.validateSentimentConsistency(mixedSentiment, 3.0); // Should not throw
});

Deno.test("ExperienceLogValidator: validateLengthAndFormat", () => {
  // Test case 1: Valid summary (within limits, ends with punctuation)
  const validSummary1 = "This is a short summary. It has two sentences. And it ends with punctuation.";
  ExperienceLogValidator.validateLengthAndFormat(validSummary1); // Should not throw

  // Test case 2: Valid summary with different punctuation
  const validSummary2 = "This is another good one! It's concise and clear?";
  ExperienceLogValidator.validateLengthAndFormat(validSummary2); // Should not throw

  // Test case 3: Summary too long (sentences)
  const longSentenceSummary = "Sentence one. Sentence two. Sentence three. Sentence four. This is too many sentences.";
  assertThrows(
    () => ExperienceLogValidator.validateLengthAndFormat(longSentenceSummary),
    Error,
    "Validator error: Summary too long — 5 sentences (limit is 3).",
  );

  // Test case 4: Summary too long (words)
  const longWordSummary = "This is a very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, very, only. This is a very long sentence. And it still needs more words. To make sure it exceeds the word limit, I will continue typing. We are getting closer to the limit now. I think this will be enough words to test the word limit. And it ends with punctuation.";
  assertThrows(
    () => ExperienceLogValidator.validateLengthAndFormat(longWordSummary),
    Error,
    "Validator error: Summary too long — 7 sentences (limit is 3).", // This might need adjustment based on exact word count
  );

  // Test case 5: Summary not ending with punctuation
  const noPunctuationSummary = "This is a sentence without punctuation";
  assertThrows(
    () => ExperienceLogValidator.validateLengthAndFormat(noPunctuationSummary),
    Error,
    "Validator error: Summary must end with punctuation (., ! or ?).",
  );

  // Test case 6: Empty summary
  ExperienceLogValidator.validateLengthAndFormat(""); // Should not throw

  // Test case 7: Null/undefined summary
  // @ts-ignore: Testing invalid input
  ExperienceLogValidator.validateLengthAndFormat(null); // Should not throw
  // @ts-ignore: Testing invalid input
  ExperienceLogValidator.validateLengthAndFormat(undefined); // Should not throw

  // Test case 8: Summary with only punctuation - actually passes validation
  // because it ends with punctuation and has no sentences/words to count
  const onlyPunctuation = "...";
  // This actually doesn't throw because the regex /[.!?]\s*$/ matches
  ExperienceLogValidator.validateLengthAndFormat(onlyPunctuation); // Should not throw
});

Deno.test("validateGeneratedSummary - Orchestration", () => {
  // Test case 1: All validators pass
  const validSummary = "I enjoyed my visit to Zen Tea House. The matcha was perfect!";
  const validLogs1 = [
    { placeId: "Zen Tea House", rating: 4 },
    { placeId: "Zen Tea House", rating: 5 },
  ];
  // Should not throw
  validateGeneratedSummary(validSummary, validLogs1);

  // Test case 2: validateNoHallucinatedPlaces fails
  const hallucinatedSummary = "I loved the matcha at The Coffee Shop.";
  const validLogs2 = [
    { placeId: "Zen Tea House", rating: 4 },
  ];
  assertThrows(
    () => validateGeneratedSummary(hallucinatedSummary, validLogs2),
    Error,
    "Validator error: Detected possible fabricated place names in summary: The Coffee Shop",
  );

  // Test case 3: validateSentimentConsistency - negative sentiment with low rating should NOT throw
  const negativeSentimentSummary = "I really disliked this place.";
  const validLogs3 = [
    { placeId: "Zen Tea House", rating: 1 },
    { placeId: "Zen Tea House", rating: 2 },
  ];
  // Negative sentiment matches low rating, so this should NOT throw
  validateGeneratedSummary(negativeSentimentSummary, validLogs3); // Should not throw

  // Test the negative sentiment logic specifically for high ratings:

  const negativeSentimentSummaryForHighRating = "This was a terrible experience.";
  const validLogs4 = [
    { placeId: "Zen Tea House", rating: 4 },
    { placeId: "Zen Tea House", rating: 5 },
  ];
  assertThrows(
    () => validateGeneratedSummary(negativeSentimentSummaryForHighRating, validLogs4),
    Error,
    "Validator error: Negative tone detected despite high average rating (4.5).",
  );


  // Test case 4: validateLengthAndFormat fails (too long)
  const longSummary = "This is sentence one. This is sentence two. This is sentence three. And this is sentence four. This summary is definitely too long for the allowed limit of three sentences.";
  const validLogs5 = [
    { placeId: "Zen Tea House", rating: 4 },
  ];
  assertThrows(
    () => validateGeneratedSummary(longSummary, validLogs5),
    Error,
    "Validator error: Summary too long — 5 sentences (limit is 3).",
  );

  // Test case 5: No logs provided (should not throw, but might warn internally - not testable here directly)
  const summaryForNoLogs = "This is a summary.";
  validateGeneratedSummary(summaryForNoLogs, []); // Should not throw
});