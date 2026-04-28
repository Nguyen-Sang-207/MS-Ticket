// GET /api/users - Get all users (admin only)
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ statusCode: 401, message: 'Unauthorized' }, { status: 401 });
    const decoded = await adminAuth.verifyIdToken(token);
    const callerDoc = await adminDb.collection('users').doc(decoded.uid).get();
    if (callerDoc.data()?.role !== 'ADMIN') {
      return NextResponse.json({ statusCode: 403, message: 'Forbidden' }, { status: 403 });
    }

    const snapshot = await adminDb.collection('users').limit(200).get();
    let users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

    // Hide admin/staff accounts from the user management list
    users = users.filter((u: any) => u.role === 'USER' || !u.role);


    // Sort by createdAt descending in memory
    users.sort((a: any, b: any) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });

    return NextResponse.json({ statusCode: 200, message: 'Success', data: users });
  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json({ statusCode: 500, message: 'Internal server error' }, { status: 500 });
  }
}
