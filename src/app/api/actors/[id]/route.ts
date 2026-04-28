// PUT /api/actors/[id] - Update actor
// DELETE /api/actors/[id] - Delete actor
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

async function verifyAdmin(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return false;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    return userDoc.data()?.role === 'ADMIN';
  } catch { return false; }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!await verifyAdmin(request)) return NextResponse.json({ statusCode: 403, message: 'Forbidden' }, { status: 403 });
  const body = await request.json();
  await adminDb.collection('actors').doc(id).update({ ...body, updatedAt: new Date().toISOString() });
  return NextResponse.json({ statusCode: 200, message: 'Updated' });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!await verifyAdmin(request)) return NextResponse.json({ statusCode: 403, message: 'Forbidden' }, { status: 403 });
  await adminDb.collection('actors').doc(id).delete();
  return NextResponse.json({ statusCode: 200, message: 'Deleted' });
}
