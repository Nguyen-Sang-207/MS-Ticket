// PUT /api/rooms/[id] - Update room
// DELETE /api/rooms/[id] - Delete room
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

async function verifyAdmin(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    return userDoc.data()?.role === 'ADMIN' ? decoded : null;
  } catch { return null; }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!await verifyAdmin(request)) return NextResponse.json({ statusCode: 403, message: 'Forbidden' }, { status: 403 });
  try {
    const body = await request.json();
    const updateData = { ...body, totalSeats: parseInt(body.totalSeats || '0'), rows: parseInt(body.rows || '10'), cols: parseInt(body.cols || '10'), updatedAt: new Date().toISOString() };
    await adminDb.collection('rooms').doc(id).update(updateData);
    return NextResponse.json({ statusCode: 200, message: 'Room updated' });
  } catch (error) {
    return NextResponse.json({ statusCode: 500, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!await verifyAdmin(request)) return NextResponse.json({ statusCode: 403, message: 'Forbidden' }, { status: 403 });
  try {
    await adminDb.collection('rooms').doc(id).delete();
    return NextResponse.json({ statusCode: 200, message: 'Room deleted' });
  } catch (error) {
    return NextResponse.json({ statusCode: 500, message: 'Internal server error' }, { status: 500 });
  }
}
