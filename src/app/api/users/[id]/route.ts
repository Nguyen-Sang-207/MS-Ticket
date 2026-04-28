// PUT /api/users/[id] - Update user role or locked status (admin only)
// DELETE /api/users/[id] - Delete user (admin only)
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ statusCode: 401, message: 'Unauthorized' }, { status: 401 });
    const decoded = await adminAuth.verifyIdToken(token);
    const callerDoc = await adminDb.collection('users').doc(decoded.uid).get();
    if (callerDoc.data()?.role !== 'ADMIN') {
      return NextResponse.json({ statusCode: 403, message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (body.role !== undefined) updateData.role = body.role;
    if (body.locked !== undefined) updateData.locked = body.locked;

    await adminDb.collection('users').doc(id).update(updateData);
    return NextResponse.json({ statusCode: 200, message: 'User updated successfully' });
  } catch (error) {
    console.error('PUT /api/users/[id] error:', error);
    return NextResponse.json({ statusCode: 500, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ statusCode: 401, message: 'Unauthorized' }, { status: 401 });
    const decoded = await adminAuth.verifyIdToken(token);
    const callerDoc = await adminDb.collection('users').doc(decoded.uid).get();
    if (callerDoc.data()?.role !== 'ADMIN') {
      return NextResponse.json({ statusCode: 403, message: 'Forbidden' }, { status: 403 });
    }

    await adminDb.collection('users').doc(id).delete();
    return NextResponse.json({ statusCode: 200, message: 'User deleted' });
  } catch (error) {
    return NextResponse.json({ statusCode: 500, message: 'Internal server error' }, { status: 500 });
  }
}
