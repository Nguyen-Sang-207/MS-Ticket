// GET /api/bookings - Get all bookings (admin)
// Admin needs to see all bookings, not filtered by user
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { isQuotaError, getBackupData, isFirebaseDownOnServer, withTimeout } from '@/lib/serverFallback';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get('userId');

    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ statusCode: 401, message: 'Unauthorized', data: [] });

    let decoded;
    try {
      decoded = await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ statusCode: 401, message: 'Invalid token', data: [] });
    }

    if (isFirebaseDownOnServer()) throw new Error('RESOURCE_EXHAUSTED: Cached Server Error');
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    const role = userDoc.data()?.role;
    const isAdmin = role === 'ADMIN' || role === 'STAFF';

    // If queryUserId is provided, fetch bookings explicitly for that user
    if (queryUserId) {
      // Must be either the owner or an Admin
      if (decoded.uid !== queryUserId && !isAdmin) {
        return NextResponse.json({ statusCode: 403, message: 'Forbidden' });
      }

      const snapshot = await withTimeout(adminDb.collection('bookings').where('userId', '==', queryUserId).limit(50).get());
      const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      bookings.sort((a: any, b: any) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0));
      return NextResponse.json({ statusCode: 200, message: 'Success', data: bookings });
    }

    // If no queryUserId provided, only Admin can fetch ALL bookings
    if (isAdmin) {
      const snapshot = await withTimeout(adminDb.collection('bookings').limit(200).get());
      const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      bookings.sort((a: any, b: any) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0));
      return NextResponse.json({ statusCode: 200, message: 'Success', data: bookings });
    }

    return NextResponse.json({ statusCode: 403, message: 'Forbidden', data: [] });
  } catch (error) {
    console.error('GET /api/bookings error:', error);
    if (isQuotaError(error)) {
      const { searchParams } = new URL(request.url);
      const queryUserId = searchParams.get('userId');
      let backupBookings = getBackupData('bookings');
      if (queryUserId) backupBookings = backupBookings.filter((b: any) => b.userId === queryUserId);
      backupBookings.sort((a: any, b: any) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0));
      return NextResponse.json({ statusCode: 200, message: 'Success (Fallback)', data: backupBookings.slice(0, 200) });
    }
    return NextResponse.json({ statusCode: 500, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ statusCode: 401, message: 'Unauthorized' }, { status: 401 });

    if (isFirebaseDownOnServer()) {
      const body = await request.json();
      return NextResponse.json({ 
        statusCode: 201, 
        message: 'Mock Booking created', 
        data: { 
          id: 'mock_booking_' + Date.now(), 
          ...body,
          status: 'PENDING'
        } 
      });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const userId = decoded.uid;

    const body = await request.json();
    const { showtimeId, seats, combos, totalAmount } = body;

    if (!showtimeId || !seats || seats.length === 0) {
      return NextResponse.json({ statusCode: 400, message: 'Missing required fields' }, { status: 400 });
    }

    // Embed extra useful data by resolving the showtime
    const stDoc = await adminDb.collection('showtimes').doc(showtimeId).get();
    let stData: any = {};
    if (stDoc.exists) stData = stDoc.data();

    const newBooking = {
      userId,
      showtimeId,
      movieNameVn: stData.movieNameVn || 'Unknown Movie',
      movieNameEn: stData.movieNameEn || '',
      theaterName: stData.theaterName || 'Unknown Theater',
      roomName: stData.roomName || 'Unknown Room',
      date: stData.date || '',
      startTime: stData.startTime || '',
      seats,
      combos: combos || [],
      totalAmount,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    const docRef = await adminDb.collection('bookings').add(newBooking);

    // Update showtime's available seats counter
    if (stDoc.exists) {
      const currentAvailable = stData.availableSeats || stData.totalSeats || 50;
      const newAvailable = Math.max(0, currentAvailable - seats.length);
      await adminDb.collection('showtimes').doc(showtimeId).update({
        availableSeats: newAvailable
      });
    }

    return NextResponse.json({ statusCode: 201, message: 'Booking created', data: { id: docRef.id, ...newBooking } });
  } catch (error) {
    console.error('POST /api/bookings error:', error);
    return NextResponse.json({ statusCode: 500, message: 'Internal server error' }, { status: 500 });
  }
}
