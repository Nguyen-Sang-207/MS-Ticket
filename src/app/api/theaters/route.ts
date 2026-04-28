// GET /api/theaters - Get all theaters
// POST /api/theaters - Create theater (admin)
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { isQuotaError, getBackupData, isFirebaseDownOnServer, withTimeout, enforceMasterAdminOnly } from '@/lib/serverFallback';

export async function GET(request: NextRequest) {
  try {
    if (!process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID === 'your_project_id') {
      return NextResponse.json({
        statusCode: 200, message: 'Mock Success', data: [
          { id: 't1', nameVn: 'MS Cinema Center', nameEn: 'MS Cinema Center', status: 'ACTIVE' },
          { id: 't2', nameVn: 'MS Cinema IMAX', nameEn: 'MS Cinema IMAX', status: 'ACTIVE' },
          { id: 't3', nameVn: 'MS Cinema Vincom', nameEn: 'MS Cinema Vincom', status: 'ACTIVE' },
        ]
      });
    }
    
    if (isFirebaseDownOnServer()) throw new Error('RESOURCE_EXHAUSTED: Cached Server Error');
    enforceMasterAdminOnly(request);

    let snapshot;
    try {
      snapshot = await withTimeout(adminDb.collection('theaters').orderBy('nameVn', 'asc').get());
    } catch {
      snapshot = await withTimeout(adminDb.collection('theaters').get());
    }

    const theaters = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    if (theaters.length === 0) {
      return NextResponse.json({
        statusCode: 200, message: 'Mock Success', data: [
          { id: 't1', nameVn: 'MS Cinema IMAX Landmark 81', nameEn: 'MS Cinema IMAX Landmark 81', status: 'ACTIVE' },
          { id: 't2', nameVn: 'MS Cinema Vincom Center Q1', nameEn: 'MS Cinema Vincom Center D1', status: 'ACTIVE' },
          { id: 't3', nameVn: 'MS Cinema Aeon Mall Tân Phú', nameEn: 'MS Cinema Aeon Mall Tan Phu', status: 'ACTIVE' },
          { id: 't4', nameVn: 'MS Cinema Lotte Liễu Giai', nameEn: 'MS Cinema Lotte Lieu Giai', status: 'ACTIVE' },
          { id: 't5', nameVn: 'MS Cinema Vincom Bà Triệu', nameEn: 'MS Cinema Vincom Ba Trieu', status: 'ACTIVE' },
          { id: 't6', nameVn: 'MS Cinema Đà Nẵng Center', nameEn: 'MS Cinema Da Nang Center', status: 'ACTIVE' },
        ]
      });
    }

    return NextResponse.json({ statusCode: 200, message: 'Success', data: theaters });
  } catch (error) {
    console.error('GET /api/theaters error:', error);
    if (isQuotaError(error)) {
      return NextResponse.json({ statusCode: 200, message: 'Success (Fallback)', data: getBackupData('theaters') });
    }
    return NextResponse.json({ statusCode: 500, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ statusCode: 401, message: 'Unauthorized' }, { status: 401 });
    const decoded = await adminAuth.verifyIdToken(token);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    if (userDoc.data()?.role !== 'ADMIN') {
      return NextResponse.json({ statusCode: 403, message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const now = new Date().toISOString();
    const theaterData = { ...body, createdAt: now, updatedAt: now };
    const docRef = await adminDb.collection('theaters').add(theaterData);

    return NextResponse.json({
      statusCode: 201,
      message: 'Theater created successfully',
      data: { id: docRef.id, ...theaterData },
    });
  } catch (error) {
    console.error('POST /api/theaters error:', error);
    return NextResponse.json({ statusCode: 500, message: 'Internal server error' }, { status: 500 });
  }
}
