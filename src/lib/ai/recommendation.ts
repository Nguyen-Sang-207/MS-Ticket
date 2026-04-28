// AI Recommendation engine - ported from Python (TF-IDF + Cosine Similarity)

interface MovieData {
  id: string;
  genres: string; // pipe-separated: "Action|Drama|Thriller"
}

interface ReviewData {
  userId: string;
  movieId: string;
  rating: number;
}

// ==================== TF-IDF HELPERS ====================

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[|,]/g, ' ').split(/\s+/).filter(Boolean);
}

function computeTfIdf(corpus: string[][]): Map<string, number>[] {
  const n = corpus.length;

  // Compute DF (document frequency)
  const df = new Map<string, number>();
  for (const doc of corpus) {
    const unique = new Set(doc);
    for (const term of unique) {
      df.set(term, (df.get(term) || 0) + 1);
    }
  }

  // Compute TF-IDF for each document
  return corpus.map((doc) => {
    const tf = new Map<string, number>();
    for (const term of doc) {
      tf.set(term, (tf.get(term) || 0) + 1);
    }
    const tfidf = new Map<string, number>();
    for (const [term, count] of tf) {
      const idf = Math.log((n + 1) / ((df.get(term) || 0) + 1)) + 1;
      tfidf.set(term, (count / doc.length) * idf);
    }
    return tfidf;
  });
}

function dotProduct(a: Map<string, number>, b: Map<string, number>): number {
  let result = 0;
  for (const [term, val] of a) {
    if (b.has(term)) result += val * b.get(term)!;
  }
  return result;
}

function magnitude(vec: Map<string, number>): number {
  let sum = 0;
  for (const val of vec.values()) sum += val * val;
  return Math.sqrt(sum);
}

function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  const mag = magnitude(a) * magnitude(b);
  if (mag === 0) return 0;
  return dotProduct(a, b) / mag;
}

// ==================== CONTENT-BASED FILTERING ====================

export function contentBasedFiltering(
  movies: MovieData[],
  targetMovieId: string,
  topN: number = 10
): Array<{ movieId: string; cbfScore: number }> {
  const corpus = movies.map((m) => tokenize(m.genres));
  const tfidfVectors = computeTfIdf(corpus);

  const targetIndex = movies.findIndex((m) => m.id === targetMovieId);
  if (targetIndex === -1) return [];

  const targetVector = tfidfVectors[targetIndex];

  const scores = movies
    .map((movie, i) => ({
      movieId: movie.id,
      cbfScore: i === targetIndex ? -1 : cosineSimilarity(targetVector, tfidfVectors[i]),
    }))
    .filter((s) => s.movieId !== targetMovieId)
    .sort((a, b) => b.cbfScore - a.cbfScore)
    .slice(0, topN);

  return scores;
}

// ==================== COLLABORATIVE FILTERING ====================

function userCosineSimilarity(
  matrix: Map<string, Map<string, number>>,
  userA: string,
  userB: string
): number {
  const ratingsA = matrix.get(userA);
  const ratingsB = matrix.get(userB);
  if (!ratingsA || !ratingsB) return 0;

  let dot = 0, magA = 0, magB = 0;
  for (const [movieId, ratingA] of ratingsA) {
    const ratingB = ratingsB.get(movieId) || 0;
    dot += ratingA * ratingB;
    magA += ratingA * ratingA;
  }
  for (const ratingB of ratingsB.values()) magB += ratingB * ratingB;
  const mag = Math.sqrt(magA) * Math.sqrt(magB);
  return mag === 0 ? 0 : dot / mag;
}

export function collaborativeFiltering(
  reviews: ReviewData[],
  userId: string,
  topN: number = 10
): Array<{ movieId: string; cfScore: number }> {
  // Build user-item matrix
  const matrix = new Map<string, Map<string, number>>();
  const allMovies = new Set<string>();

  for (const r of reviews) {
    if (!matrix.has(r.userId)) matrix.set(r.userId, new Map());
    matrix.get(r.userId)!.set(r.movieId, r.rating);
    allMovies.add(r.movieId);
  }

  const userRatings = matrix.get(userId);
  if (!userRatings) return [];

  const watchedMovies = new Set(userRatings.keys());
  const unwatchedMovies = [...allMovies].filter((m) => !watchedMovies.has(m));

  // Compute similarity with all other users
  const similarities = new Map<string, number>();
  for (const [otherUser] of matrix) {
    if (otherUser !== userId) {
      similarities.set(otherUser, userCosineSimilarity(matrix, userId, otherUser));
    }
  }

  // Predict ratings for unwatched movies
  const predictions: Array<{ movieId: string; cfScore: number }> = [];
  for (const movieId of unwatchedMovies) {
    let weightedSum = 0, simSum = 0;
    for (const [otherUser, sim] of similarities) {
      const rating = matrix.get(otherUser)?.get(movieId);
      if (rating !== undefined) {
        weightedSum += sim * rating;
        simSum += Math.abs(sim);
      }
    }
    if (simSum > 0) {
      predictions.push({ movieId, cfScore: weightedSum / simSum });
    }
  }

  return predictions.sort((a, b) => b.cfScore - a.cfScore).slice(0, topN);
}

// ==================== HYBRID RECOMMENDATION ====================

export function hybridRecommendation(
  movies: MovieData[],
  reviews: ReviewData[],
  userId: string,
  targetMovieId: string,
  topN: number = 10,
  alpha: number = 0.5
): Array<{ movieId: string; hybridScore: number }> {
  const cbfResults = contentBasedFiltering(movies, targetMovieId, topN * 2);
  const cfResults = collaborativeFiltering(reviews, userId, topN * 2);

  // Normalize CF scores to 0-1 range
  const maxCf = Math.max(...cfResults.map((r) => r.cfScore), 0.001);
  const cfMap = new Map(cfResults.map((r) => [r.movieId, r.cfScore / maxCf]));
  const cbfMap = new Map(cbfResults.map((r) => [r.movieId, r.cbfScore]));

  // Collect all unique movie IDs from both results
  const allMovieIds = new Set([...cbfMap.keys(), ...cfMap.keys()]);

  const hybrid = [...allMovieIds].map((movieId) => ({
    movieId,
    hybridScore: alpha * (cfMap.get(movieId) || 0) + (1 - alpha) * (cbfMap.get(movieId) || 0),
  }));

  return hybrid.sort((a, b) => b.hybridScore - a.hybridScore).slice(0, topN);
}
