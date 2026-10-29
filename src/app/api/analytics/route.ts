import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isAdminRole } from '@/lib/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Bucket = { label: string; start: Date; end: Date };

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Build contiguous time buckets ending at "now": 7 daily / 4 weekly / 6 monthly.
function buildBuckets(range: string): Bucket[] {
  const now = new Date();
  const buckets: Bucket[] = [];

  if (range === '7d') {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    for (let i = 6; i >= 0; i--) {
      const start = new Date(today);
      start.setDate(start.getDate() - i);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      buckets.push({ label: WEEKDAYS[start.getDay()], start, end });
    }
  } else if (range === '6m') {
    const firstThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    for (let i = 5; i >= 0; i--) {
      const start = new Date(firstThisMonth.getFullYear(), firstThisMonth.getMonth() - i, 1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
      buckets.push({ label: MONTHS[start.getMonth()], start, end });
    }
  } else {
    // Default "30d": last 4 weeks as weekly buckets.
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const firstStart = new Date(today);
    firstStart.setDate(firstStart.getDate() - 27);
    for (let i = 0; i < 4; i++) {
      const start = new Date(firstStart);
      start.setDate(start.getDate() + i * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      buckets.push({ label: `Week ${i + 1}`, start, end });
    }
  }

  return buckets;
}

// GET /api/analytics?range=7d|30d|6m
// Returns real views / unique visitors / inquiries bucketed over time.
// Scope: admin sees the whole platform; everyone else sees only their own
// listings' activity. Unauthenticated requests get zeroed buckets.
export async function GET(req: NextRequest) {
  const range = req.nextUrl.searchParams.get('range') || '30d';
  const buckets = buildBuckets(range);
  const rangeStart = buckets[0].start;

  const zeroPoints = buckets.map((b) => ({ day: b.label, views: 0, uniqueVisitors: 0, inquiries: 0 }));

  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: true, points: zeroPoints });

    const isAdmin = isAdminRole(user.role);

    const [views, inquiries] = await Promise.all([
      prisma.propertyView.findMany({
        where: { createdAt: { gte: rangeStart }, ...(isAdmin ? {} : { ownerUserId: user.id }) },
        select: { createdAt: true, visitorKey: true },
      }),
      prisma.inquiry.findMany({
        where: { createdAt: { gte: rangeStart }, ...(isAdmin ? {} : { sellerUserId: user.id }) },
        select: { createdAt: true },
      }),
    ]);

    const points = buckets.map((b) => {
      const bucketViews = views.filter((v) => v.createdAt >= b.start && v.createdAt < b.end);
      const uniqueVisitors = new Set(bucketViews.map((v) => v.visitorKey)).size;
      const bucketInquiries = inquiries.filter((q) => q.createdAt >= b.start && q.createdAt < b.end).length;
      return { day: b.label, views: bucketViews.length, uniqueVisitors, inquiries: bucketInquiries };
    });

    return NextResponse.json({ success: true, points });
  } catch (err: any) {
    console.error('GET /api/analytics error', err);
    return NextResponse.json({ success: true, points: zeroPoints });
  }
}
