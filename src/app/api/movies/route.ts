// GET /api/movies - Get all movies with optional filters
// POST /api/movies - Create new movie (admin only)
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { adminAuth } from '@/lib/firebase/admin';
import { uploadImage, uploadVideo } from '@/lib/cloudinary';
import { getBackupData, isQuotaError, isFirebaseDownOnServer, withTimeout, enforceMasterAdminOnly } from '@/lib/serverFallback';

// GET all movies
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    // MOCK DATA FALLBACK IF FIREBASE NOT CONFIGURED
    if (!process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID === 'your_project_id') {
      const mockMovies = [
        { id: '1', nameVn: 'Oppenheimer', nameEn: 'Oppenheimer', image: 'https://m.media-amazon.com/images/M/MV5BMDBmYTZjNjUtN2M1MS00MTQ2LTk2ODgtNzc2M2QyZGE5NTVjXkEyXkFqcGdeQXVyNzAwMjU2MTY@._V1_.jpg', format: 'IMAX 2D', time: 180, tags: ['Tâm Lý', 'Lịch Sử'], status: 'NOW_SHOWING', ratings: '9.5' },
        { id: '2', nameVn: 'Dune: Hành Tinh Cát 2', nameEn: 'Dune: Part Two', image: 'https://m.media-amazon.com/images/M/MV5BODQ0ZTFhZWItYTFiMi00ZjFmLTkwNjUtNWZiZDk2Y2QyNDlhXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_.jpg', format: '3D/IMAX', time: 166, tags: ['Hành Động', 'Viễn Tưởng'], status: 'NOW_SHOWING', ratings: '9.8' },
        { id: '3', nameVn: 'Godzilla x Kong', nameEn: 'The New Empire', image: 'https://m.media-amazon.com/images/M/MV5BN2E2YmZkOTMtNWVkMy00MGFkLWFjMDItOWZiMWUzZDkyZWNlXkEyXkFqcGdeQXVyMTE0MzQwMjgz._V1_.jpg', format: '2D/3D', time: 115, tags: ['Quái Vật', 'Hành Động'], status: 'COMMING_SOON', ratings: '8.0' },
        { id: '4', nameVn: 'Kung Fu Panda 4', nameEn: 'Kung Fu Panda 4', image: 'https://m.media-amazon.com/images/M/MV5BZjY5MmYxNzQtYWY2Ny00YzhkLTgxZGItNmNlNDMyNDU4MTMwXkEyXkFqcGdeQXVyMTg0MTE4NTY@._V1_.jpg', format: '2D/3D', time: 94, tags: ['Hoạt Hình', 'Hài Hước'], status: 'NOW_SHOWING', ratings: '8.5' }
      ];
      const filtered = status ? mockMovies.filter(m => m.status === status) : mockMovies;
      return NextResponse.json({ statusCode: 200, message: 'Mock Success', data: filtered.slice(0, limit) });
    }

    if (isFirebaseDownOnServer()) throw new Error('RESOURCE_EXHAUSTED: Cached Server Error');
    enforceMasterAdminOnly(request);

    let query: FirebaseFirestore.Query = adminDb.collection('movies');

    if (status) {
      query = query.where('status', '==', status);
    }

    // Do not use orderBy to avoid requiring a composite index setup on Firebase
    query = query.limit(limit);
    const snapshot = await withTimeout(query.get());

    const movies = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (movies.length === 0) {
      const mockMovies = [
        { id: '1', nameVn: 'Oppenheimer', nameEn: 'Oppenheimer', image: 'https://m.media-amazon.com/images/M/MV5BMDBmYTZjNjUtN2M1MS00MTQ2LTk2ODgtNzc2M2QyZGE5NTVjXkEyXkFqcGdeQXVyNzAwMjU2MTY@._V1_.jpg', format: 'IMAX 2D', time: 180, tags: ['Tâm Lý', 'Lịch Sử'], status: 'NOW_SHOWING', ratings: '9.5' },
        { id: '2', nameVn: 'Dune: Hành Tinh Cát 2', nameEn: 'Dune: Part Two', image: 'https://m.media-amazon.com/images/M/MV5BODQ0ZTFhZWItYTFiMi00ZjFmLTkwNjUtNWZiZDk2Y2QyNDlhXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_.jpg', format: '3D/IMAX', time: 166, tags: ['Hành Động', 'Viễn Tưởng'], status: 'NOW_SHOWING', ratings: '9.8' },
        { id: '3', nameVn: 'Godzilla x Kong', nameEn: 'The New Empire', image: 'https://m.media-amazon.com/images/M/MV5BN2E2YmZkOTMtNWVkMy00MGFkLWFjMDItOWZiMWUzZDkyZWNlXkEyXkFqcGdeQXVyMTE0MzQwMjgz._V1_.jpg', format: '2D/3D', time: 115, tags: ['Quái Vật', 'Hành Động'], status: 'COMMING_SOON', ratings: '8.0' },
        { id: '4', nameVn: 'Kung Fu Panda 4', nameEn: 'Kung Fu Panda 4', image: 'https://m.media-amazon.com/images/M/MV5BZjY5MmYxNzQtYWY2Ny00YzhkLTgxZGItNmNlNDMyNDU4MTMwXkEyXkFqcGdeQXVyMTg0MTE4NTY@._V1_.jpg', format: '2D/3D', time: 94, tags: ['Hoạt Hình', 'Hài Hước'], status: 'NOW_SHOWING', ratings: '8.5' }
      ];
      const filtered = status ? mockMovies.filter(m => m.status === status) : mockMovies;
      return NextResponse.json({ statusCode: 200, message: 'Mock Success', data: filtered.slice(0, limit) });
    }

    // Sort in memory instead
    movies.sort((a: any, b: any) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({ statusCode: 200, message: 'Success', data: movies });
  } catch (error) {
    console.error('GET /api/movies error:', error);
    if (isQuotaError(error)) {
      const limit = parseInt(new URL(request.url).searchParams.get('limit') || '50');
      const status = new URL(request.url).searchParams.get('status');
      let backupMovies = getBackupData('movies');
      if (status) backupMovies = backupMovies.filter((m: any) => m.status === status);
      backupMovies.sort((a: any, b: any) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      return NextResponse.json({ statusCode: 200, message: 'Success (Fallback)', data: backupMovies.slice(0, limit) });
    }
    return NextResponse.json({ statusCode: 500, message: 'Internal server error' }, { status: 500 });
  }
}

// POST create movie
export async function POST(request: NextRequest) {
  try {
    // Verify admin token
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ statusCode: 401, message: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await adminAuth.verifyIdToken(token);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    if (userDoc.data()?.role !== 'ADMIN') {
      return NextResponse.json({ statusCode: 403, message: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    const trailerFile = formData.get('trailer') as File | null;

    let imageUrl = formData.get('imageUrl') as string || '';
    let trailerUrl = formData.get('trailerUrl') as string || '';

    // Upload image to Cloudinary
    if (imageFile) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      imageUrl = await uploadImage(buffer, 'cineme/movies');
    }

    // Upload trailer to Cloudinary
    if (trailerFile) {
      const buffer = Buffer.from(await trailerFile.arrayBuffer());
      trailerUrl = await uploadVideo(buffer, 'cineme/trailers');
    }

    const now = new Date().toISOString();
    const movieData = {
      nameVn: formData.get('nameVn') as string,
      nameEn: formData.get('nameEn') as string,
      director: formData.get('director') as string,
      releaseDate: formData.get('releaseDate') as string,
      endDate: formData.get('endDate') as string,
      briefVn: formData.get('briefVn') as string,
      briefEn: formData.get('briefEn') as string,
      image: imageUrl,
      trailer: trailerUrl,
      status: formData.get('status') as string || 'COMING_SOON',
      ratings: formData.get('ratings') as string || '0',
      time: parseInt(formData.get('time') as string || '0'),
      countryId: formData.get('countryId') as string || '',
      limitageId: formData.get('limitageId') as string || '',
      listActor: JSON.parse(formData.get('listActor') as string || '[]'),
      listGenre: JSON.parse(formData.get('listGenre') as string || '[]'),
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await adminDb.collection('movies').add(movieData);

    return NextResponse.json({
      statusCode: 201,
      message: 'Movie created successfully',
      data: { id: docRef.id, ...movieData },
    });
  } catch (error) {
    console.error('POST /api/movies error:', error);
    return NextResponse.json({ statusCode: 500, message: 'Internal server error' }, { status: 500 });
  }
}
