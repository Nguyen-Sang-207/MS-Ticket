// GET /api/promotions - Get all promotions
// POST /api/promotions - Create promotion (admin)
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { isQuotaError, getBackupData, isFirebaseDownOnServer } from '@/lib/serverFallback';

export async function GET() {
  try {
    if (isFirebaseDownOnServer()) throw new Error('RESOURCE_EXHAUSTED: Cached Server Error');
    const snapshot = await adminDb.collection('promotions').get();
    const promos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    promos.sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return NextResponse.json({ statusCode: 200, message: 'Success', data: promos });
  } catch (error) {
    if (isQuotaError(error)) {
      return NextResponse.json({ statusCode: 200, message: 'Success (Fallback)', data: getBackupData('promotions') });
    }
    return NextResponse.json({ statusCode: 200, message: 'Empty', data: [] });
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
    const data = {
      code: body.code?.toUpperCase(),
      name: body.name,
      description: body.description || '',
      discountType: body.discountType || 'PERCENT', // PERCENT | AMOUNT
      discountValue: parseFloat(body.discountValue || '0'),
      minOrderAmount: parseInt(body.minOrderAmount || '0'),
      maxUsage: parseInt(body.maxUsage || '0'),
      usedCount: 0,
      expireDate: body.expireDate || '',
      active: true,
      applicableFor: body.applicableFor || 'ALL', // ALL | MEMBER | BANK
      bankName: body.bankName || '',
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await adminDb.collection('promotions').add(data);
    return NextResponse.json({ statusCode: 201, message: 'Promotion created', data: { id: docRef.id, ...data } });
  } catch (error) {
    return NextResponse.json({ statusCode: 500, message: 'Internal server error' }, { status: 500 });
  }
}
