// GET /api/combos - Get all combos
// POST /api/combos - Create combo (admin)
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { isQuotaError, getBackupData, isFirebaseDownOnServer } from '@/lib/serverFallback';

const DEFAULT_COMBOS = [
  { id: 'c1', name: 'Combo Đơn', description: '1 Bắp ngọt lớn + 1 Nước ngọt lớn', price: 69000, image: '' },
  { id: 'c2', name: 'Combo Đôi', description: '1 Bắp lớn + 2 Nước lớn', price: 109000, image: '' },
  { id: 'c3', name: 'Nước Ngọt', description: '1 Nước ngọt size L', price: 39000, image: '' },
  { id: 'c4', name: 'Bắp Rang Bơ', description: '1 Bắp rang bơ size L', price: 45000, image: '' },
];

export async function GET() {
  try {
    if (isFirebaseDownOnServer()) throw new Error('RESOURCE_EXHAUSTED: Cached Server Error');
    const snapshot = await adminDb.collection('combos').get();
    const combos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (combos.length === 0) return NextResponse.json({ statusCode: 200, message: 'Default', data: DEFAULT_COMBOS });
    return NextResponse.json({ statusCode: 200, message: 'Success', data: combos });
  } catch (error) {
    if (isQuotaError(error)) {
      return NextResponse.json({ statusCode: 200, message: 'Success (Fallback)', data: getBackupData('combos') });
    }
    return NextResponse.json({ statusCode: 200, message: 'Default', data: DEFAULT_COMBOS });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ statusCode: 401, message: 'Unauthorized' }, { status: 401 });
    const decoded = await adminAuth.verifyIdToken(token);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    if (userDoc.data()?.role !== 'ADMIN') return NextResponse.json({ statusCode: 403, message: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const now = new Date().toISOString();
    const data = { name: body.name, description: body.description || '', price: parseInt(body.price || '0'), image: body.image || '', createdAt: now, updatedAt: now };
    const docRef = await adminDb.collection('combos').add(data);
    return NextResponse.json({ statusCode: 201, message: 'Combo created', data: { id: docRef.id, ...data } });
  } catch {
    return NextResponse.json({ statusCode: 500, message: 'Internal server error' }, { status: 500 });
  }
}
