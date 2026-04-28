// GET /api/showtimes - Get showtimes with filters
// POST /api/showtimes - Create showtime (admin)
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { isQuotaError, getBackupData, isFirebaseDownOnServer, withTimeout, enforceMasterAdminOnly } from '@/lib/serverFallback';

// =====================================================================
// ETERNAL ROLLING SCHEDULE
// The showtimes were seeded on this date. All dates are shifted forward
// by the number of full weeks since then, keeping the weekly pattern.
// This means the schedule is always "current" without any DB updates.
// =====================================================================
const SEED_REFERENCE_DATE = '2026-04-18';

function getWeekOffset(): number {
  const ref = new Date(SEED_REFERENCE_DATE);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = today.getTime() - ref.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7) * 7; // round to full weeks
}

function shiftDate(dateStr: string, offsetDays: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const movieId = searchParams.get('movieId');
    const theaterId = searchParams.get('theaterId');
    const requestedDate = searchParams.get('date');
    const limit = parseInt(searchParams.get('limit') || '1000');
    const adminMode = searchParams.get('adminMode') === '1'; // fetch all dates, no date filter

    if (!process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID === 'your_project_id') {
      return NextResponse.json({
        statusCode: 200, message: 'Mock Success', data: [
          { id: 'st1', startTime: '09:00', endTime: '11:30', roomName: 'Phòng 1', movieId, theaterId },
          { id: 'st2', startTime: '12:00', endTime: '14:00', roomName: 'Phòng 2', movieId, theaterId },
          { id: 'st3', startTime: '14:30', endTime: '16:30', roomName: 'Phòng VIP', movieId, theaterId },
          { id: 'st4', startTime: '17:00', endTime: '19:00', roomName: 'Phòng 1', movieId, theaterId },
          { id: 'st5', startTime: '19:30', endTime: '21:30', roomName: 'Phòng 2', movieId, theaterId },
          { id: 'st6', startTime: '20:00', endTime: '22:00', roomName: 'Phòng VIP', movieId, theaterId },
        ]
      });
    }

    if (isFirebaseDownOnServer()) throw new Error('RESOURCE_EXHAUSTED: Cached Server Error');
    enforceMasterAdminOnly(request);

    const weekOffset = getWeekOffset();

    // Reverse-shift the requested date to match original DB dates
    const originalDate = requestedDate ? shiftDate(requestedDate, -weekOffset) : null;

    // ---------------------------------------------------------------
    // Query strategy: use only single-field filters (no composite index needed).
    // Firestore auto-indexes every field individually.
    // Apply extra filters in-memory after fetching.
    // Each movie has ~97 showtimes, so fetching by movieId is safe.
    // ---------------------------------------------------------------
    let showtimes: any[] = [];

    if (movieId) {
      // Most common case: fetch all showtimes for this movie (single-field query)
      const snap = await withTimeout(adminDb.collection('showtimes')
        .where('movieId', '==', movieId)
        .limit(limit)
        .get());
      showtimes = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Apply additional filters in memory
      if (theaterId) showtimes = showtimes.filter((s: any) => s.theaterId === theaterId);
      if (requestedDate) {
         showtimes = showtimes.filter((s: any) => s.date === originalDate || s.date === requestedDate);
      }

    } else if (theaterId) {
      // Fetch by theater (single-field query)
      const snap = await withTimeout(adminDb.collection('showtimes')
        .where('theaterId', '==', theaterId)
        .limit(limit)
        .get());
      showtimes = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (requestedDate) {
         showtimes = showtimes.filter((s: any) => s.date === originalDate || s.date === requestedDate);
      }

    } else if (requestedDate) {
      // Fetch specifically by dates to avoid missing showtimes
      const dateFilters = Array.from(new Set([originalDate, requestedDate].filter(Boolean)));
      const snap = await withTimeout(adminDb.collection('showtimes')
        .where('date', 'in', dateFilters)
        .limit(limit)
        .get());
      showtimes = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    } else {
      // No filters - return recent batch only
      const snap = await withTimeout(adminDb.collection('showtimes').limit(limit).get());
      showtimes = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    // Always shift seed dates forward to current week so all callers see consistent dates.
    showtimes = showtimes.map((s: any) => {
      // Newly created sandbox records have a recent createdAt - keep them as-is.
      const isSeedRecord = (!s.createdAt || s.createdAt < '2026-04-28');
      return {
        ...s,
        date: (isSeedRecord && weekOffset !== 0) ? shiftDate(s.date, weekOffset) : s.date,
      };
    });

    // Dedup: remove duplicate slots created when multiple seed weeks shift to the same current date.
    // Keep the record with the most recent createdAt (sandbox records always win).
    const seenSlots = new Map<string, any>();
    for (const s of showtimes) {
      const key = `${s.movieId}|${s.theaterId}|${s.roomId}|${s.date}|${s.startTime}`;
      const ex = seenSlots.get(key);
      if (!ex || (s.createdAt && (!ex.createdAt || s.createdAt > ex.createdAt))) {
        seenSlots.set(key, s);
      }
    }
    showtimes = Array.from(seenSlots.values());

    // Sort by date then startTime
    showtimes.sort((a: any, b: any) => {
      const dc = (a.date || '').localeCompare(b.date || '');
      return dc !== 0 ? dc : (a.startTime || '').localeCompare(b.startTime || '');
    });

    return NextResponse.json({ statusCode: 200, message: 'Success', data: showtimes });
  } catch (error) {
    console.error('GET /api/showtimes error:', error);
    if (isQuotaError(error)) {
      const { searchParams } = new URL(request.url);
      const movieId = searchParams.get('movieId');
      const theaterId = searchParams.get('theaterId');
      const requestedDate = searchParams.get('date');
      const limit = parseInt(searchParams.get('limit') || '1000');

      let backupShowtimes = getBackupData('showtimes');
      
      const weekOffset = getWeekOffset();
      const originalDate = requestedDate ? shiftDate(requestedDate, -weekOffset) : null;

      if (movieId) backupShowtimes = backupShowtimes.filter((s: any) => s.movieId === movieId);
      if (theaterId) backupShowtimes = backupShowtimes.filter((s: any) => s.theaterId === theaterId);
      if (requestedDate) {
         backupShowtimes = backupShowtimes.filter((s: any) => s.date === originalDate || s.date === requestedDate);
      }

      backupShowtimes = backupShowtimes.slice(0, limit);

      // Always shift seed dates forward
      backupShowtimes = backupShowtimes.map((s: any) => {
        const isSeedRecord = (!s.createdAt || s.createdAt < '2026-04-28');
        return {
          ...s,
          date: (isSeedRecord && weekOffset !== 0) ? shiftDate(s.date, weekOffset) : s.date,
        };
      });

      backupShowtimes.sort((a: any, b: any) => {
        const dc = (a.date || '').localeCompare(b.date || '');
        return dc !== 0 ? dc : (a.startTime || '').localeCompare(b.startTime || '');
      });

      return NextResponse.json({ statusCode: 200, message: 'Success (Fallback)', data: backupShowtimes });
    }
    return NextResponse.json({ statusCode: 500, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin/staff
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ statusCode: 401, message: 'Unauthorized' }, { status: 401 });
    const decoded = await adminAuth.verifyIdToken(token);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    const role = userDoc.data()?.role;
    if (role !== 'ADMIN' && role !== 'STAFF') {
      return NextResponse.json({ statusCode: 403, message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Fetch movie, theater, and room info to denormalize
    const [movieDoc, theaterDoc, roomDoc] = await Promise.all([
      adminDb.collection('movies').doc(body.movieId).get(),
      adminDb.collection('theaters').doc(body.theaterId).get(),
      adminDb.collection('rooms').doc(body.roomId).get(),
    ]);

    const movie = movieDoc.data();
    const theater = theaterDoc.data();
    const room = roomDoc.data();

    const now = new Date().toISOString();
    const showtimeData = {
      movieId: body.movieId,
      movieNameVn: movie?.nameVn || '',
      movieNameEn: movie?.nameEn || '',
      movieImage: movie?.image || '',
      theaterId: body.theaterId,
      theaterName: theater?.nameVn || theater?.name || '',
      roomId: body.roomId,
      roomName: room?.name || '',
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      languageVn: body.languageVn || '',
      languageEn: body.languageEn || '',
      formatVn: body.formatVn || '',
      formatEn: body.formatEn || '',
      totalSeats: room?.totalSeats || 0,
      availableSeats: room?.totalSeats || 0,
      bookedSeats: 0,
      isAvailable: true,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await adminDb.collection('showtimes').add(showtimeData);

    return NextResponse.json({
      statusCode: 201,
      message: 'Showtime created successfully',
      data: { id: docRef.id, ...showtimeData },
    });
  } catch (error) {
    console.error('POST /api/showtimes error:', error);
    return NextResponse.json({ statusCode: 500, message: 'Internal server error' }, { status: 500 });
  }
}
