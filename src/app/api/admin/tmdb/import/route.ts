// POST /api/admin/tmdb/import - Import a movie from TMDB into Firestore
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const TMDB_BASE = 'https://api.themoviedb.org/3';

const GENRE_MAP: Record<number, string> = {
  28: 'Hành Động', 12: 'Phiêu Lưu', 16: 'Hoạt Hình', 35: 'Hài Hước',
  80: 'Tội Phạm', 99: 'Tài Liệu', 18: 'Tâm Lý', 10751: 'Gia Đình',
  14: 'Kỳ Ảo', 36: 'Lịch Sử', 27: 'Kinh Dị', 10402: 'Âm Nhạc',
  9648: 'Bí Ẩn', 10749: 'Tình Cảm', 878: 'Khoa Học Viễn Tưởng',
  53: 'Ly Kỳ', 10752: 'Chiến Tranh',
};

export async function POST(request: NextRequest) {
  try {
    // Verify admin
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ statusCode: 401, message: 'Unauthorized' }, { status: 401 });
    const decoded = await adminAuth.verifyIdToken(token);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    if (userDoc.data()?.role !== 'ADMIN') {
      return NextResponse.json({ statusCode: 403, message: 'Forbidden' }, { status: 403 });
    }

    const { tmdbId, status } = await request.json();
    if (!tmdbId) return NextResponse.json({ statusCode: 400, message: 'Missing tmdbId' }, { status: 400 });

    // Check if already imported
    const existing = await adminDb.collection('movies').where('tmdbId', '==', tmdbId).limit(1).get();
    if (!existing.empty) {
      return NextResponse.json({ statusCode: 409, message: 'Phim này đã được nhập vào hệ thống' }, { status: 409 });
    }

    // Fetch full movie detail from TMDB
    const [movieRes, videosRes, creditsRes] = await Promise.all([
      fetch(`${TMDB_BASE}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=vi-VN`),
      fetch(`${TMDB_BASE}/movie/${tmdbId}/videos?api_key=${TMDB_API_KEY}&language=en-US`),
      fetch(`${TMDB_BASE}/movie/${tmdbId}/credits?api_key=${TMDB_API_KEY}&language=vi-VN`),
    ]);

    const [movie, videosData, creditsData] = await Promise.all([
      movieRes.json(),
      videosRes.json(),
      creditsRes.json(),
    ]);

    const videos = videosData.results || [];
    const cast = creditsData.cast || [];
    const crew = creditsData.crew || [];

    // Find trailer
    const trailer = videos.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube')
      || videos.find((v: any) => v.site === 'YouTube');

    // Director
    const director = crew.find((p: any) => p.job === 'Director')?.name || '';

    // Genres
    const genreNames = (movie.genres || []).map((g: any) => GENRE_MAP[g.id] || g.name).filter(Boolean);

    // Top actors
    const actors = cast.slice(0, 10).map((c: any) => c.name).join(', ');

    // Production country
    const country = movie.production_countries?.[0];

    const now = new Date().toISOString();
    const movieData = {
      tmdbId: movie.id,
      nameVn: movie.title,
      nameEn: movie.original_title || movie.title,
      director,
      actor: actors,
      releaseDate: movie.release_date || '',
      endDate: '',
      briefVn: movie.overview || '',
      briefEn: movie.overview || '',
      image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
      backdrop: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : '',
      trailer: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : '',
      status: status || (movie.release_date && new Date(movie.release_date) <= new Date() ? 'NOW_SHOWING' : 'COMING_SOON'),
      ratings: movie.vote_average ? movie.vote_average.toFixed(1) : '0',
      time: movie.runtime || 0,
      countryVn: country?.name || '',
      countryEn: country?.name || '',
      limitageNameVn: 'T16',
      listGenre: genreNames,
      format: '2D',
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await adminDb.collection('movies').add(movieData);

    return NextResponse.json({
      statusCode: 201,
      message: `Đã nhập phim "${movie.title}" thành công`,
      data: { id: docRef.id, ...movieData },
    });
  } catch (error) {
    console.error('TMDB import error:', error);
    return NextResponse.json({ statusCode: 500, message: 'Lỗi khi nhập phim từ TMDB' }, { status: 500 });
  }
}
