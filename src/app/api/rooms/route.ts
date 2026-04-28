// GET /api/rooms - Get rooms with optional theaterId filter
// POST /api/rooms - Create room (admin)
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { isQuotaError, getBackupData, isFirebaseDownOnServer, withTimeout, enforceMasterAdminOnly } from '@/lib/serverFallback';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const theaterId = searchParams.get('theaterId');

    if (isFirebaseDownOnServer()) throw new Error('RESOURCE_EXHAUSTED: Cached Server Error');
    enforceMasterAdminOnly(request);

    let snapshot;
    if (theaterId) {
      try {
        snapshot = await withTimeout(adminDb.collection('rooms').where('theaterId', '==', theaterId).get());
      } catch {
        snapshot = await withTimeout(adminDb.collection('rooms').get());
      }
    } else {
      snapshot = await withTimeout(adminDb.collection('rooms').get());
    }

    const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (rooms.length === 0) {
      return NextResponse.json({
        statusCode: 200, message: 'Mock', data: [
          { id: 'r1', name: 'Phòng 1', theaterId: theaterId || 't1', type: '2D', totalSeats: 120, rows: 10, cols: 12, status: 'ACTIVE' },
          { id: 'r2', name: 'Phòng 2', theaterId: theaterId || 't1', type: '3D', totalSeats: 90, rows: 9, cols: 10, status: 'ACTIVE' },
          { id: 'r3', name: 'Phòng IMAX', theaterId: theaterId || 't2', type: 'IMAX', totalSeats: 200, rows: 16, cols: 14, status: 'ACTIVE' },
        ]
      });
    }

    return NextResponse.json({ statusCode: 200, message: 'Success', data: rooms });
  } catch (error) {
    if (isQuotaError(error)) {
      const theaterId = new URL(request.url).searchParams.get('theaterId');
      let backupRooms = getBackupData('rooms');
      if (theaterId) backupRooms = backupRooms.filter((r: any) => r.theaterId === theaterId);
      return NextResponse.json({ statusCode: 200, message: 'Success (Fallback)', data: backupRooms });
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

    // Fetch theater name for denormalization
    const theaterDoc = await adminDb.collection('theaters').doc(body.theaterId).get();
    const theaterName = theaterDoc.data()?.nameVn || '';

    const now = new Date().toISOString();
    const roomData = {
      name: body.name,
      theaterId: body.theaterId,
      theaterName,
      type: body.type || '2D',
      totalSeats: parseInt(body.totalSeats || '0'),
      rows: parseInt(body.rows || '10'),
      cols: parseInt(body.cols || '10'),
      status: body.status || 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await adminDb.collection('rooms').add(roomData);
    return NextResponse.json({ statusCode: 201, message: 'Room created', data: { id: docRef.id, ...roomData } });
  } catch (error) {
    return NextResponse.json({ statusCode: 500, message: 'Internal server error' }, { status: 500 });
  }
}
