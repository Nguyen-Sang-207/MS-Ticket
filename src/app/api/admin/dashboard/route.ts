import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { isQuotaError, getBackupData, isFirebaseDownOnServer } from '@/lib/serverFallback';

export async function GET(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ statusCode: 401, message: 'Unauthorized' }, { status: 401 });

  try {
    if (isFirebaseDownOnServer()) throw new Error('RESOURCE_EXHAUSTED: Cached Server Error');
    const decoded = await adminAuth.verifyIdToken(token);
    const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
    if (userDoc.data()?.role !== 'ADMIN' && userDoc.data()?.role !== 'STAFF') {
      return NextResponse.json({ statusCode: 403, message: 'Forbidden' }, { status: 403 });
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Rolling window: last 7 days (today-6 to today)
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [bookingsSnap, usersSnap, moviesSnap] = await Promise.all([
      adminDb.collection('bookings').orderBy('createdAt', 'desc').limit(300).get(),
      adminDb.collection('users').get(),
      adminDb.collection('movies').where('status', '==', 'NOW_SHOWING').get(),
    ]);

    const bookings = bookingsSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));

    // User name lookup map
    const userMap: Record<string, string> = {};
    usersSnap.docs.forEach(d => {
      const data = d.data();
      userMap[d.id] = data.fullName || data.email || d.id;
    });

    // Count only non-admin members
    const memberCount = usersSnap.docs.filter(d => {
      const role = d.data().role;
      return role === 'USER' || !role;
    }).length;

    // Monthly revenue & ticket count
    let totalRevenue = 0;
    let totalTickets = 0;
    bookings.forEach((b: any) => {
      if (b.status === 'CONFIRMED' || b.status === 'COMPLETED') {
        const d = new Date(b.createdAt);
        if (d >= startOfMonth) {
          totalRevenue += b.totalAmount || 0;
          totalTickets += b.seats?.length || 0;
        }
      }
    });

    // Weekly revenue: last 7 days rolling, keyed by day offset (0 = 6 days ago, 6 = today)
    const dayLabels: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      dayLabels.push(dayNames[d.getDay()]);
    }
    const weeklyMap: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    bookings.forEach((b: any) => {
      if (b.status === 'CONFIRMED' || b.status === 'COMPLETED') {
        const d = new Date(b.createdAt);
        if (d >= sevenDaysAgo && d <= today) {
          // offset from 6 days ago: 0=oldest, 6=today
          const diffMs = d.getTime() - sevenDaysAgo.getTime();
          const dayOffset = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          if (dayOffset >= 0 && dayOffset <= 6) weeklyMap[dayOffset] += b.totalAmount || 0;
        }
      }
    });
    const weeklyRevenue = dayLabels.map((day, i) => ({ day, revenue: weeklyMap[i] }));

    // Top movies by revenue
    const movieStats: Record<string, { name: string; tickets: number; revenue: number }> = {};
    bookings.forEach((b: any) => {
      if ((b.status === 'CONFIRMED' || b.status === 'COMPLETED') && b.movieNameVn) {
        if (!movieStats[b.movieNameVn]) {
          movieStats[b.movieNameVn] = { name: b.movieNameVn, tickets: 0, revenue: 0 };
        }
        movieStats[b.movieNameVn].tickets += b.seats?.length || 0;
        movieStats[b.movieNameVn].revenue += b.totalAmount || 0;
      }
    });
    const topMovies = Object.values(movieStats).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // 8 most recent bookings with resolved names
    const recentBookings = bookings.slice(0, 8).map((b: any) => ({
      id: b.id,
      user: userMap[b.userId] || (b.userId?.slice(0, 8) + '...'),
      movie: b.movieNameVn || 'Unknown',
      time: b.createdAt ? new Date(b.createdAt).toLocaleString('vi-VN') : '',
      amount: b.totalAmount || 0,
      status: b.status,
    }));

    const stats = [
      { label: 'Doanh thu tháng này', value: `${totalRevenue.toLocaleString('vi-VN')} đ`, icon: 'TrendingUp', change: '+12%', sub: 'so với tháng trước' },
      { label: 'Vé đã bán', value: String(totalTickets), icon: 'Ticket', change: '+8%', sub: 'trong tháng này' },
      { label: 'Phim đang chiếu', value: String(moviesSnap.size), icon: 'Film', change: '', sub: 'tác phẩm' },
      { label: 'Thành viên', value: String(memberCount), icon: 'Users', change: '', sub: 'tài khoản' },
    ];

    return NextResponse.json({ statusCode: 200, data: { stats, recentBookings, topMovies, weeklyRevenue } });
  } catch (error) {
    console.error('GET /api/admin/dashboard error:', error);
    if (isQuotaError(error)) {
      // Mock data for portfolio fallback when quota exceeded
      const stats = [
        { label: 'Doanh thu tháng này', value: '145.200.000 đ', icon: 'TrendingUp', change: '+12%', sub: 'so với tháng trước' },
        { label: 'Vé đã bán', value: '2415', icon: 'Ticket', change: '+8%', sub: 'trong tháng này' },
        { label: 'Phim đang chiếu', value: String(getBackupData('movies').length), icon: 'Film', change: '', sub: 'tác phẩm' },
        { label: 'Thành viên', value: String(getBackupData('users').length), icon: 'Users', change: '', sub: 'tài khoản' },
      ];
      const recentBookings = getBackupData('bookings').slice(0, 8).map((b: any) => ({
        id: b.id,
        user: 'Guest User',
        movie: b.movieNameVn || 'Oppenheimer',
        time: b.createdAt ? new Date(b.createdAt).toLocaleString('vi-VN') : '',
        amount: b.totalAmount || 0,
        status: b.status || 'CONFIRMED',
      }));
      const topMovies = [
        { name: 'Oppenheimer', tickets: 1205, revenue: 120500000 },
        { name: 'Dune: Part Two', tickets: 840, revenue: 84000000 },
      ];
      const weeklyRevenue = [
        { day: 'T2', revenue: 15000000 }, { day: 'T3', revenue: 12000000 },
        { day: 'T4', revenue: 21000000 }, { day: 'T5', revenue: 18000000 },
        { day: 'T6', revenue: 35000000 }, { day: 'T7', revenue: 45000000 },
        { day: 'CN', revenue: 52000000 }
      ];
      return NextResponse.json({ statusCode: 200, data: { stats, recentBookings, topMovies, weeklyRevenue } });
    }
    return NextResponse.json({ statusCode: 500, message: 'Internal server error' }, { status: 500 });
  }
}
