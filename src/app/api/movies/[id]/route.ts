// GET /api/movies/[id] - Get movie detail
// PUT /api/movies/[id] - Update movie (admin)
// DELETE /api/movies/[id] - Delete movie (admin)
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { uploadImage, uploadVideo } from '@/lib/cloudinary';
import { isQuotaError, getBackupData, isFirebaseDownOnServer, withTimeout } from '@/lib/serverFallback';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID === 'your_project_id') {
      return NextResponse.json({
        statusCode: 200,
        message: 'Mock Success',
        data: {
          id,
          nameVn: 'Oppenheimer',
          nameEn: 'Oppenheimer',
          image: 'https://m.media-amazon.com/images/M/MV5BMDBmYTZjNjUtN2M1MS00MTQ2LTk2ODgtNzc2M2QyZGE5NTVjXkEyXkFqcGdeQXVyNzAwMjU2MTY@._V1_.jpg',
          format: 'IMAX 2D',
          time: 180,
          listActor: [],
          listGenre: [],
          briefVn: 'Oppenheimer là một bộ phim lịch sử do Christopher Nolan đạo diễn...',
          trailer: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
          ratings: '9.5',
          status: 'NOW_SHOWING'
        }
      });
    }

    if (isFirebaseDownOnServer()) throw new Error('RESOURCE_EXHAUSTED: Cached Server Error');
    const movieDoc = await withTimeout(adminDb.collection('movies').doc(id).get());

    if (!movieDoc.exists) {
      return NextResponse.json({
        statusCode: 200,
        message: 'Mock Success (Fallback)',
        data: {
          id,
          nameVn: 'Khởi Nguyên (Oppenheimer)',
          nameEn: 'Oppenheimer',
          image: 'https://m.media-amazon.com/images/M/MV5BMDBmYTZjNjUtN2M1MS00MTQ2LTk2ODgtNzc2M2QyZGE5NTVjXkEyXkFqcGdeQXVyNzAwMjU2MTY@._V1_.jpg',
          format: 'IMAX 2D',
          time: 180,
          listActor: [],
          listGenre: [],
          briefVn: 'Vào thế chiến thứ II, nhà vật lý người Mỹ J. Robert Oppenheimer được chọn để dẫn dắt quân đội Mỹ phát triển bom nguyên tử trong một nỗ lực tuyệt mật có tên Dự án Manhattan, nhằm kết thúc chiến tranh.',
          trailer: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
          ratings: '9.5',
          status: 'NOW_SHOWING'
        }
      });
    }

    return NextResponse.json({
      statusCode: 200,
      message: 'Success',
      data: { id: movieDoc.id, ...movieDoc.data() },
    });
  } catch (error) {
    console.error('GET /api/movies/[id] error:', error);
    if (isQuotaError(error)) {
      const { id: movieId } = await params;
      const backupMovie = getBackupData('movies').find((m: any) => m.id === movieId);
      if (backupMovie) return NextResponse.json({ statusCode: 200, message: 'Success (Fallback)', data: backupMovie });
    }
    return NextResponse.json({ statusCode: 500, message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ statusCode: 401, message: 'Unauthorized' }, { status: 401 });
    const decoded = await adminAuth.verifyIdToken(token);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    if (userDoc.data()?.role !== 'ADMIN') {
      return NextResponse.json({ statusCode: 403, message: 'Forbidden' }, { status: 403 });
    }

    // Support both JSON and FormData
    const contentType = request.headers.get('content-type') || '';
    let body: Record<string, unknown>;

    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      // FormData fallback
      const formData = await request.formData();
      body = {
        nameVn: formData.get('nameVn'),
        nameEn: formData.get('nameEn'),
        director: formData.get('director'),
        actor: formData.get('actor'),
        releaseDate: formData.get('releaseDate'),
        briefVn: formData.get('briefVn'),
        briefEn: formData.get('briefEn'),
        status: formData.get('status'),
        ratings: formData.get('ratings'),
        time: parseInt(formData.get('time') as string || '0'),
        format: formData.get('format'),
        limitageNameVn: formData.get('limitageNameVn'),
        image: formData.get('imageUrl') || formData.get('image'),
        trailer: formData.get('trailerUrl') || formData.get('trailer'),
        listGenre: JSON.parse(formData.get('listGenre') as string || '[]'),
        listActor: JSON.parse(formData.get('listActor') as string || '[]'),
      };
    }

    const updateData: Record<string, unknown> = {
      ...body,
      time: parseInt(body.time as string || '0'),
      updatedAt: new Date().toISOString(),
    };

    // Remove undefined values
    Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);

    await adminDb.collection('movies').doc(id).update(updateData);
    return NextResponse.json({ statusCode: 200, message: 'Movie updated successfully' });
  } catch (error) {
    console.error('PUT /api/movies/[id] error:', error);
    return NextResponse.json({ statusCode: 500, message: 'Internal server error' }, { status: 500 });
  }
}


export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ statusCode: 401, message: 'Unauthorized' }, { status: 401 });
    const decoded = await adminAuth.verifyIdToken(token);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    if (userDoc.data()?.role !== 'ADMIN') {
      return NextResponse.json({ statusCode: 403, message: 'Forbidden' }, { status: 403 });
    }

    await adminDb.collection('movies').doc(id).delete();
    return NextResponse.json({ statusCode: 200, message: 'Movie deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/movies/[id] error:', error);
    return NextResponse.json({ statusCode: 500, message: 'Internal server error' }, { status: 500 });
  }
}
