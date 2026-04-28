// GET /api/pricing - Get all pricing rules
// POST /api/pricing - Create pricing rule (admin)
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { isQuotaError, getBackupData, isFirebaseDownOnServer } from '@/lib/serverFallback';

const DEFAULT_PRICING = [
  { id: 'p1', name: 'Standard 2D - Thường ngày', seatType: 'Standard', format: '2D', dayType: 'WEEKDAY', price: 55000 },
  { id: 'p2', name: 'Standard 2D - Cuối tuần', seatType: 'Standard', format: '2D', dayType: 'WEEKEND', price: 75000 },
  { id: 'p3', name: 'VIP 2D - Thường ngày', seatType: 'VIP', format: '2D', dayType: 'WEEKDAY', price: 95000 },
  { id: 'p4', name: 'VIP 2D - Cuối tuần', seatType: 'VIP', format: '2D', dayType: 'WEEKEND', price: 120000 },
  { id: 'p5', name: 'Couple - Thường ngày', seatType: 'Couple', format: '2D', dayType: 'WEEKDAY', price: 180000 },
  { id: 'p6', name: 'Couple - Cuối tuần', seatType: 'Couple', format: '2D', dayType: 'WEEKEND', price: 220000 },
  { id: 'p7', name: 'IMAX - Tất cả ngày', seatType: 'Standard', format: 'IMAX', dayType: 'ALL', price: 150000 },
  { id: 'p8', name: '3D - Thường ngày', seatType: 'Standard', format: '3D', dayType: 'WEEKDAY', price: 80000 },
  { id: 'p9', name: '4DX - Tất cả ngày', seatType: 'Standard', format: '4DX', dayType: 'ALL', price: 175000 },
];

export async function GET() {
  try {
    if (isFirebaseDownOnServer()) throw new Error('RESOURCE_EXHAUSTED: Cached Server Error');
    const snapshot = await adminDb.collection('pricing').get();
    const pricing = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (pricing.length === 0) return NextResponse.json({ statusCode: 200, message: 'Default', data: DEFAULT_PRICING });
    return NextResponse.json({ statusCode: 200, message: 'Success', data: pricing });
  } catch (error) {
    if (isQuotaError(error)) {
      return NextResponse.json({ statusCode: 200, message: 'Success (Fallback)', data: getBackupData('pricing') });
    }
    return NextResponse.json({ statusCode: 200, message: 'Default', data: DEFAULT_PRICING });
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
    const data = { ...body, price: parseInt(body.price || '0'), createdAt: now, updatedAt: now };
    const docRef = await adminDb.collection('pricing').add(data);
    return NextResponse.json({ statusCode: 201, message: 'Pricing rule created', data: { id: docRef.id, ...data } });
  } catch (error) {
    return NextResponse.json({ statusCode: 500, message: 'Internal server error' }, { status: 500 });
  }
}
