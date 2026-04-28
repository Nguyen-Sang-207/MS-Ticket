// POST /api/ai/recommend - Hybrid movie recommendation (replaces Python FastAPI)
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { hybridRecommendation } from '@/lib/ai/recommendation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, movieId, topN = 10 } = body;

    if (!userId || !movieId) {
      return NextResponse.json(
        { statusCode: 400, message: 'userId and movieId are required' },
        { status: 400 }
      );
    }

    // Fetch all movies from Firestore
    const moviesSnapshot = await adminDb.collection('movies').get();
    const moviesData = moviesSnapshot.docs.map((doc) => ({
      id: doc.id,
      genres: (doc.data().listGenre || [])
        .map((g: { nameEn: string }) => g.nameEn)
        .join('|'),
    }));

    // Fetch all reviews from Firestore
    const reviewsSnapshot = await adminDb.collection('reviews').get();
    const reviewsData = reviewsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        userId: data.userId as string,
        movieId: data.movieId as string,
        rating: data.rating as number,
      };
    });

    // Run hybrid recommendation
    const recommendations = hybridRecommendation(
      moviesData,
      reviewsData,
      userId,
      movieId,
      topN
    );

    // Fetch full movie details for recommended IDs
    const recommendedMovieIds = recommendations.map((r) => r.movieId);
    const movieDetails = await Promise.all(
      recommendedMovieIds.map(async (id) => {
        const doc = await adminDb.collection('movies').doc(id).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
      })
    );

    const result = recommendations
      .map((rec, index) => ({
        ...movieDetails[index],
        score: rec.hybridScore,
      }))
      .filter(Boolean);

    return NextResponse.json({ statusCode: 200, message: 'Success', data: result });
  } catch (error) {
    console.error('POST /api/ai/recommend error:', error);
    return NextResponse.json({ statusCode: 500, message: 'Internal server error' }, { status: 500 });
  }
}
