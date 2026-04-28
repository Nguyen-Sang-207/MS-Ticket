// GET /api/admin/tmdb/search?query=... - Search movies from TMDB
// GET /api/admin/tmdb/popular - Get popular/now-playing movies from TMDB
import { NextRequest, NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const TMDB_BASE = 'https://api.themoviedb.org/3';

// Vietnamese genre mapping from TMDB genre IDs
const GENRE_MAP: Record<number, string> = {
  28: 'Hành Động', 12: 'Phiêu Lưu', 16: 'Hoạt Hình', 35: 'Hài Hước',
  80: 'Tội Phạm', 99: 'Tài Liệu', 18: 'Tâm Lý', 10751: 'Gia Đình',
  14: 'Kỳ Ảo', 36: 'Lịch Sử', 27: 'Kinh Dị', 10402: 'Âm Nhạc',
  9648: 'Bí Ẩn', 10749: 'Tình Cảm', 878: 'Khoa Học Viễn Tưởng',
  10770: 'Phim TV', 53: 'Ly Kỳ', 10752: 'Chiến Tranh', 37: 'Cao Bồi',
};

function mapTmdbMovie(movie: any, videos?: any[], credits?: any[]) {
  const genreNames = (movie.genre_ids || movie.genres?.map((g: any) => g.id) || [])
    .map((id: number) => GENRE_MAP[id] || '')
    .filter(Boolean);

  // Get YouTube trailer key
  let trailerUrl = '';
  if (videos) {
    const trailer = videos.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube')
      || videos.find((v: any) => v.site === 'YouTube');
    if (trailer) trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
  }

  // Get cast names
  const actors = credits ? credits.slice(0, 5).map((c: any) => c.name).join(', ') : '';

  return {
    tmdbId: movie.id,
    nameVn: movie.title,
    nameEn: movie.original_title || movie.title,
    image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
    backdrop: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : '',
    briefEn: movie.overview || '',
    briefVn: movie.overview || '', // Will use same until we have translation
    ratings: movie.vote_average ? (movie.vote_average).toFixed(1) : 'N/A',
    time: movie.runtime || 0,
    releaseDate: movie.release_date || '',
    status: movie.release_date && new Date(movie.release_date) <= new Date() ? 'NOW_SHOWING' : 'COMING_SOON',
    trailer: trailerUrl,
    actor: actors,
    listGenre: genreNames,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const type = searchParams.get('type') || 'popular'; // popular | now_playing | upcoming | search

  if (!TMDB_API_KEY) {
    return NextResponse.json({ 
      statusCode: 500, 
      message: 'TMDB_API_KEY chưa được cấu hình trong .env.local' 
    }, { status: 500 });
  }

  try {
    let endpoint = '';
    if (query) {
      endpoint = `${TMDB_BASE}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=vi-VN&region=VN`;
    } else {
      switch (type) {
        case 'now_playing':
          endpoint = `${TMDB_BASE}/movie/now_playing?api_key=${TMDB_API_KEY}&language=vi-VN&region=VN`;
          break;
        case 'upcoming':
          endpoint = `${TMDB_BASE}/movie/upcoming?api_key=${TMDB_API_KEY}&language=vi-VN&region=VN`;
          break;
        default:
          endpoint = `${TMDB_BASE}/movie/popular?api_key=${TMDB_API_KEY}&language=vi-VN`;
      }
    }

    // No cache - always fetch fresh data
    const res = await fetch(endpoint, { cache: 'no-store' });

    if (!res.ok) {
      const errText = await res.text();
      console.error('TMDB API error:', res.status, errText);
      return NextResponse.json({ 
        statusCode: 500, 
        message: `TMDB trả về lỗi ${res.status}: Kiểm tra lại API Key` 
      }, { status: 500 });
    }

    const data = await res.json();
    console.log('TMDB response total:', data.total_results);

    const movies = (data.results || []).slice(0, 20).map((m: any) => mapTmdbMovie(m));

    return NextResponse.json({ statusCode: 200, message: 'Success', data: movies });
  } catch (error) {
    console.error('TMDB fetch error:', error);
    return NextResponse.json({ statusCode: 500, message: `Lỗi kết nối TMDB: ${error}` }, { status: 500 });
  }
}
