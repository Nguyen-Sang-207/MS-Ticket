// GET /api/actors - Get all actors
// POST /api/actors - Create actor (admin)
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { isQuotaError, getBackupData, isFirebaseDownOnServer } from '@/lib/serverFallback';

export async function GET() {
  try {
    if (isFirebaseDownOnServer()) throw new Error('RESOURCE_EXHAUSTED: Cached Server Error');
    const snapshot = await adminDb.collection('actors').limit(200).get();
    const actors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    actors.sort((a: any, b: any) => (a.nameEn || '').localeCompare(b.nameEn || ''));
    return NextResponse.json({ statusCode: 200, message: 'Success', data: actors });
  } catch (error) {
    if (isQuotaError(error)) {
      const backupActors = getBackupData('actors');
      backupActors.sort((a: any, b: any) => (a.nameEn || '').localeCompare(b.nameEn || ''));
      return NextResponse.json({ statusCode: 200, message: 'Success (Fallback)', data: backupActors });
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
    if (userDoc.data()?.role !== 'ADMIN') return NextResponse.json({ statusCode: 403, message: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const now = new Date().toISOString();
    const actorData = {
      nameVn: body.nameVn || body.nameEn,
      nameEn: body.nameEn,
      image: body.image || '',
      dob: body.dob || '',
      nationality: body.nationality || '',
      bio: body.bio || '',
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await adminDb.collection('actors').add(actorData);
    return NextResponse.json({ statusCode: 201, message: 'Actor created', data: { id: docRef.id, ...actorData } });
  } catch (error) {
    return NextResponse.json({ statusCode: 500, message: 'Internal server error' }, { status: 500 });
  }
}
