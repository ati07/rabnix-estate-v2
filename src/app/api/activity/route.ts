import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { serializeLog } from '@/lib/serialize';
import { isAdminRole } from '@/lib/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/activity — admin only. Latest 50 activity logs.
export async function GET() {
  const me = await getCurrentUser();
  if (!isAdminRole(me?.role)) {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
  }
  const rows = await prisma.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
  return NextResponse.json({ success: true, logs: rows.map(serializeLog) });
}
