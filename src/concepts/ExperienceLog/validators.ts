// validators.ts
// Validators for AI-generated experience summaries.

const STOPWORDS = new Set([
  'the','a','an','and','or','but','if','while','when','you','your','they','this','that','it',
  'in','on','with','at','for','from','by','to','of','is','are','was','were','be','has','have',
  'i','we','he','she','them','their','our','us','as','so','too','very', 'just','not','no','my','me', 'however', 'also','than','then','there','here','all','any','some','such','more','most','less','least',
  'overall', 'generally', 'usually', 'often', 'sometimes', 'rarely', 'never', 'always', 'definitely', 'probably', 'maybe', 'perhaps','mostly','mainly','partly','slightly','slightly','kind of','sort of', 'bit','a bit','a little','a lot', 
  'moreover', 'additionally', 'furthermore', 'indeed', 'actually', 'basically', 'essentially','literally','figuratively','simply','clearly','obviously','evidently','surely','certainly','undoubtedly','unquestionably'
]);

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract capitalized "proper-noun-like" phrases from a string.
 * Matches sequences like "Zen Tea House", "MatchaLab", but ignores single letters.
 */
function extractCapitalizedPhrases(text: string): string[] {
  // Match groups of words that start with capital letter and have at least 3 letters (heuristic)
  const regex = /\b([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})*)\b/g;
  const matches = new Set<string>();
  let m;
  while ((m = regex.exec(text)) !== null) {
    matches.add(m[1].trim());
  }
  return Array.from(matches);
}

export class ExperienceLogValidator {
  /**
   * Ensures the summary does not reference places not present in validPlaces.
   * Throws Error on detected hallucinated place mentions.
   *
   * validPlaces: array of place names as they appear in logs (e.g. ['Zen Tea House', 'MatchaLab'])
   */
  static validateNoHallucinatedPlaces(summary: string, validPlaces: string[]): void {
    if (!summary || typeof summary !== 'string') return;

    const summaryLower = summary.toLowerCase();
    const normalizedPlaces = validPlaces.map(p => p.toLowerCase().trim());
    const mentionedPlaces = normalizedPlaces.filter(p => summaryLower.includes(p));

    // If no known place is mentioned, just warn (not a hard failure)
    if (mentionedPlaces.length === 0 && normalizedPlaces.length > 0) {
      console.warn('⚠️ Validator warning: Summary did not mention any known places (may be under-specific).');
    }

    // Collect candidate proper-noun phrases from the summary
    const candidates = extractCapitalizedPhrases(summary);

    // Filter candidates that are actually part of validPlaces (allow partial matches)
    const likelyPlaceCandidates = candidates.filter(candidate => {
      const candLower = candidate.toLowerCase();
      // if any valid place contains candidate or vice-versa, treat as matched
      return normalizedPlaces.some(placeLower =>
        placeLower.includes(candLower) || candLower.includes(placeLower)
      );
    });

    // Candidates that remain after removing matched ones are suspicious
    const suspicious = candidates.filter(c => !likelyPlaceCandidates.includes(c));

    // Now filter suspicious tokens by stopwords and short length (to avoid 'You', 'This', etc.)
    const hallucinated = suspicious.filter(token => {
      const tokenWords = token.split(/\s+/).map(w => w.toLowerCase());
      // if every word is a stopword, ignore it
      const allStop = tokenWords.every(w => STOPWORDS.has(w));
      if (allStop) return false;
      // ignore tokens with any word shorter than 3 characters (likely not proper nouns)
      if (tokenWords.some(w => w.length < 3)) return false;
      return true; // treat as hallucinated
    });

    if (hallucinated.length > 0) {
      // throw a helpful error listing the suspect tokens
      throw new Error(`Validator error: Detected possible fabricated place names in summary: ${hallucinated.join(', ')}`);
    }
  }

  /**
   * Ensures sentiment roughly matches the user's numeric average rating.
   * Throws Error for clear mismatches.
   *
   * averageRating: average rating across logs (1-5)
   */
  static validateSentimentConsistency(summary: string, averageRating: number): void {
    if (!summary || typeof summary !== 'string') return;

    const positiveWords = ['love','enjoy','great','favorite','amazing','perfect','delicious','excellent','wonderful'];
    const negativeWords = ['bad','poor','disappoint','terrible','awful','bitter','bland','undrinkable','weak','mediocre'];

    let posCount = 0;
    let negCount = 0;

    for (const w of positiveWords) {
      const re = new RegExp(`\\b${escapeRegExp(w)}\\b`, 'i');
      if (re.test(summary)) posCount++;
    }
    for (const w of negativeWords) {
      const re = new RegExp(`\\b${escapeRegExp(w)}\\b`, 'i');
      if (re.test(summary)) negCount++;
    }

    // thresholds:
    // avg <= 2 -> expect negative or neutral (error if summary strongly positive)
    // avg >= 4 -> expect positive or neutral (error if summary strongly negative)
    if (averageRating <= 2 && posCount > negCount) {
      throw new Error(`Validator error: Positive tone detected despite low average rating (${averageRating.toFixed(1)}).`);
    }
    if (averageRating >= 4 && negCount > posCount) {
      throw new Error(`Validator error: Negative tone detected despite high average rating (${averageRating.toFixed(1)}).`);
    }
  }

  /**
   * Enforces brevity and basic format.
   */
  static validateLengthAndFormat(summary: string): void {
  if (!summary || typeof summary !== 'string') return;

  // Improved sentence splitting: splits only on punctuation followed by a space and uppercase letter
  const sentenceRegex = /(?<!\d)[.!?](?=\s+[A-Z])/g;
  const sentences = summary
    .split(sentenceRegex)
    .map((s) => s.trim())
    .filter(Boolean);

  const words = summary.split(/\s+/).map((s) => s.trim()).filter(Boolean);

  if (sentences.length > 3) {
    throw new Error(
      `Validator error: Summary too long — ${sentences.length} sentences (limit is 3).`
    );
  }

  if (words.length > 120) {
    throw new Error(
      `Validator error: Summary too verbose — ${words.length} words (limit is 120).`
    );
  }

  // Ensure it ends in punctuation
  if (!/[.!?]\s*$/.test(summary)) {
    throw new Error(
      'Validator error: Summary must end with punctuation (., ! or ?).'
    );
  }
}

}

/**
 * Helper to run all validators together (call this after LLM response).
 * Throws on validation failure.
 */
export function validateGeneratedSummary(summary: string, logs: { placeId: string; rating: number }[]): void {
  const places = Array.from(new Set(logs.map(l => l.placeId)));
  const avgRating = logs.length > 0 ? logs.reduce((s, l) => s + l.rating, 0) / logs.length : 0;

  ExperienceLogValidator.validateNoHallucinatedPlaces(summary, places);
  ExperienceLogValidator.validateSentimentConsistency(summary, avgRating);
  ExperienceLogValidator.validateLengthAndFormat(summary);
}