// PUT /api/theaters/[id] - Update theater (admin)
// DELETE /api/theaters/[id] - Delete theater (admin)
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ statusCode: 401, message: 'Unauthorized' }, { status: 401 });
    const decoded = await adminAuth.verifyIdToken(token);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    if (userDoc.data()?.role !== 'ADMIN') return NextResponse.json({ statusCode: 403, message: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const updateData = { ...body, updatedAt: new Date().toISOString() };
    await adminDb.collection('theaters').doc(id).update(updateData);
    return NextResponse.json({ statusCode: 200, message: 'Theater updated successfully' });
  } catch (error) {
    return NextResponse.json({ statusCode: 500, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ statusCode: 401, message: 'Unauthorized' }, { status: 401 });
    const decoded = await adminAuth.verifyIdToken(token);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    if (userDoc.data()?.role !== 'ADMIN') return NextResponse.json({ statusCode: 403, message: 'Forbidden' }, { status: 403 });

    await adminDb.collection('theaters').doc(id).delete();
    return NextResponse.json({ statusCode: 200, message: 'Theater deleted successfully' });
  } catch (error) {
    return NextResponse.json({ statusCode: 500, message: 'Internal server error' }, { status: 500 });
  }
}
