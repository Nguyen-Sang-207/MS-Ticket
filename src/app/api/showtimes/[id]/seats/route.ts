// GET /api/showtimes/[id]/seats - Get seat status for a showtime
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { isQuotaError, isFirebaseDownOnServer, withTimeout, getBackupData } from '@/lib/serverFallback';

// Generate a default seat map for a room (used as fallback)
function generateDefaultSeats(bookedSeatIds: Set<string> = new Set()) {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const seats = [];
  for (const row of rows) {
    for (let i = 1; i <= 12; i++) {
      // Walkway at column 7 — push a spacer and skip regular seat
      if (i === 7) {
        seats.push({ id: `W_${row}7`, seatNumber: `W_${row}7`, row, seatType: 'WALKWAY', price: 0, status: 'WALKWAY' });
        continue; // <-- do NOT also push a regular seat for this column
      }
      // Shift column numbers after the walkway so they don't overlap
      const col = i > 7 ? i - 1 : i;
      const seatId = `${row}${col}`;
      const seatType = ['E', 'F'].includes(row) ? 'VIP' : ['G', 'H'].includes(row) && col >= 4 && col <= 7 ? 'Couple' : 'Standard';
      const price = seatType === 'VIP' ? 100000 : seatType === 'Couple' ? 200000 : 55000;
      seats.push({
        id: seatId,
        seatNumber: seatId,
        row,
        seatType,
        price,
        status: bookedSeatIds.has(seatId) ? 'BOOKED' : 'AVAILABLE',
      });
    }
  }
  return seats;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: showtimeId } = await params;

    // Return mock seats immediately if Firebase not configured
    if (!process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID === 'your_project_id') {
      return NextResponse.json({ statusCode: 200, message: 'Mock Success', data: generateDefaultSeats() });
    }

    // Return mock seats immediately if Firebase is known to be down
    if (isFirebaseDownOnServer()) {
      const backupSeats = getBackupData('seats');
      return NextResponse.json({ 
        statusCode: 200, 
        message: 'Success (Fallback)', 
        data: backupSeats.length > 0 ? backupSeats : generateDefaultSeats()
      });
    }

    // Run both queries in PARALLEL with a 3-second timeout each
    let showtimeDoc, bookingsSnapshot;
    try {
      [showtimeDoc, bookingsSnapshot] = await withTimeout(
        Promise.all([
          adminDb.collection('showtimes').doc(showtimeId).get(),
          adminDb.collection('bookings').where('showtimeId', '==', showtimeId).get(),
        ])
      );
    } catch (err) {
      if (isQuotaError(err)) {
        return NextResponse.json({ statusCode: 200, message: 'Success (Fallback)', data: generateDefaultSeats() });
      }
      throw err;
    }

    if (!showtimeDoc.exists) {
      return NextResponse.json({ statusCode: 200, message: 'Success (Fallback)', data: generateDefaultSeats() });
    }

    const showtime = showtimeDoc.data()!;
    const roomId = showtime.roomId;

    // Collect already-booked seat IDs
    const bookedSeatIds = new Set<string>();
    for (const booking of bookingsSnapshot.docs) {
      const data = booking.data();
      if (!['CANCELLED'].includes(data.status)) {
        const bSeats = data.seats as Array<{ seatId: string }> | undefined;
        if (Array.isArray(bSeats)) {
          bSeats.forEach((s) => s.seatId && bookedSeatIds.add(s.seatId));
        }
      }
    }

    // Fetch seats for this room with timeout
    let seatsSnapshot;
    try {
      seatsSnapshot = await withTimeout(
        adminDb.collection('seats').where('roomId', '==', roomId).get()
      );
    } catch (err) {
      if (isQuotaError(err)) {
        return NextResponse.json({ statusCode: 200, message: 'Success (Fallback)', data: generateDefaultSeats(bookedSeatIds) });
      }
      throw err;
    }

    let seats = seatsSnapshot.docs.map((doc) => {
      const seat = doc.data();
      return {
        id: doc.id,
        seatNumber: seat.seatNumber || doc.id,
        seatType: seat.seatType || 'Standard',
        price: seat.price || 55000,
        row: seat.row || '',
        status: bookedSeatIds.has(doc.id) ? 'BOOKED' : 'AVAILABLE',
      };
    });

    // Sort by seatNumber
    seats.sort((a, b) => (a.seatNumber < b.seatNumber ? -1 : a.seatNumber > b.seatNumber ? 1 : 0));

    // Fallback if no seats found in DB
    if (seats.length === 0) {
      seats = generateDefaultSeats(bookedSeatIds);
    }

    return NextResponse.json({ statusCode: 200, message: 'Success', data: seats });
  } catch (error) {
    console.error('GET /api/showtimes/[id]/seats error:', error);
    if (isQuotaError(error)) {
      return NextResponse.json({ statusCode: 200, message: 'Success (Fallback)', data: generateDefaultSeats() });
    }
    return NextResponse.json({ statusCode: 500, message: 'Internal server error' }, { status: 500 });
  }
}
