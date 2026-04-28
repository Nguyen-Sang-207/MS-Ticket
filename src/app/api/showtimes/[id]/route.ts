// GET /api/showtimes/[id] - Get single showtime
// PUT /api/showtimes/[id] - Update showtime (admin)
// DELETE /api/showtimes/[id] - Delete showtime (admin)
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

async function verifyAdmin(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return false;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    const role = userDoc.data()?.role;
    return role === 'ADMIN' || role === 'STAFF';
  } catch { return false; }
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const doc = await adminDb.collection('showtimes').doc(id).get();
    if (!doc.exists) return NextResponse.json({ statusCode: 404, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ statusCode: 200, data: { id: doc.id, ...doc.data() } });
  } catch {
    return NextResponse.json({ statusCode: 500, message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!await verifyAdmin(request)) return NextResponse.json({ statusCode: 403, message: 'Forbidden' }, { status: 403 });
  try {
    const body = await request.json();

    // If movieId or roomId changed, re-fetch denormalized data
    const updateData: Record<string, unknown> = { ...body, updatedAt: new Date().toISOString() };

    if (body.movieId) {
      const movieDoc = await adminDb.collection('movies').doc(body.movieId).get();
      const movie = movieDoc.data();
      if (movie) {
        updateData.movieNameVn = movie.nameVn || '';
        updateData.movieNameEn = movie.nameEn || '';
        updateData.movieImage = movie.image || '';
      }
    }

    if (body.roomId) {
      const roomDoc = await adminDb.collection('rooms').doc(body.roomId).get();
      const room = roomDoc.data();
      if (room) {
        updateData.roomName = room.name || '';
        updateData.totalSeats = room.totalSeats || 0;
      }
    }

    await adminDb.collection('showtimes').doc(id).update(updateData);
    return NextResponse.json({ statusCode: 200, message: 'Showtime updated' });
  } catch (error) {
    console.error('PUT /api/showtimes/[id] error:', error);
    return NextResponse.json({ statusCode: 500, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!await verifyAdmin(request)) return NextResponse.json({ statusCode: 403, message: 'Forbidden' }, { status: 403 });
  try {
    await adminDb.collection('showtimes').doc(id).delete();
    return NextResponse.json({ statusCode: 200, message: 'Showtime deleted' });
  } catch {
    return NextResponse.json({ statusCode: 500, message: 'Internal server error' }, { status: 500 });
  }
}
