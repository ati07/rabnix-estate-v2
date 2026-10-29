import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { serializeFeaturedProject } from '@/lib/serialize';
import { type FeaturedProjectItem } from '@/lib/homeSectionsData';
import { isAdminRole } from '@/lib/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ProjectStatus = 'approved' | 'pending' | 'rejected' | 'under_review';

// GET /api/projects/:id — a single project. Non-approved projects are only
// visible to their submitter or an admin.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const row = await prisma.featuredProject.findUnique({ where: { id } });
    if (row) {
      if (row.submissionStatus !== 'approved') {
        const user = await getCurrentUser();
        const canView = user && (isAdminRole(user.role) || row.submittedByUserId === user.id);
        if (!canView) {
          return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
        }
      }
      return NextResponse.json({ success: true, project: serializeFeaturedProject(row) });
    }
  } catch (err: any) {
    console.error('GET /api/projects/[id] error for', id, err?.message || err);
  }

  return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
}

// PATCH /api/projects/:id
//   - submitter can edit their own project's content fields
//   - admin can additionally change submissionStatus (approve/reject/review)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

    const existing = await prisma.featuredProject.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });

    const isOwner = existing.submittedByUserId === user.id;
    const isAdmin = isAdminRole(user.role);
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Not allowed' }, { status: 403 });
    }

    const b = (await req.json()) as Partial<FeaturedProjectItem> & {
      submissionStatus?: ProjectStatus;
      rejectionReason?: string;
      section?: 'featured' | 'top';
    };
    const data: any = {};

    // Home-section placement (Featured / Top): admin-only curation.
    if (b.section !== undefined) {
      if (!isAdmin) return NextResponse.json({ success: false, error: 'Only admins can change section placement.' }, { status: 403 });
      if (b.section !== 'featured' && b.section !== 'top') {
        return NextResponse.json({ success: false, error: 'Invalid section.' }, { status: 400 });
      }
      data.section = b.section;
    }

    // Moderation changes: admin only.
    if (b.submissionStatus !== undefined) {
      if (!isAdmin) return NextResponse.json({ success: false, error: 'Only admins can moderate projects.' }, { status: 403 });
      const status = b.submissionStatus;
      data.submissionStatus = status;
      data.rejectionReason = status === 'rejected' ? (b.rejectionReason || 'Rejected by admin.') : null;

      await prisma.activityLog.create({
        data: {
          action: status === 'approved' ? 'project_verified' : status === 'rejected' ? 'project_rejected' : 'project_created',
          actorName: user.name,
          actorRole: 'Admin',
          details:
            status === 'approved' ? `Approved project "${existing.name}" — now live in the catalog.` :
            status === 'rejected' ? `Rejected project "${existing.name}". Reason: ${b.rejectionReason || 'Not specified'}` :
            `Moved project "${existing.name}" to under review.`,
          targetTitle: existing.name,
          targetId: existing.id,
          severity: status === 'approved' ? 'success' : status === 'rejected' ? 'warning' : 'info',
        },
      });
    }

    // Content fields editable by the submitter (and admin).
    const editable: (keyof FeaturedProjectItem)[] = [
      'name', 'builderName', 'builderLogo', 'city', 'locality', 'address', 'marketedBy',
      'bhkConfig', 'priceFormatted', 'minPrice', 'maxPrice', 'pricePerSqFt', 'image',
      'galleryImages', 'status', 'tag', 'reraNumber', 'possessionDate', 'launchDate',
      'totalAreaAcres', 'totalTowers', 'totalUnits', 'openSpacePercent', 'description',
      'highlights', 'amenities', 'builderExperience', 'builderDeliveredProjects',
    ];
    let contentChanged = false;
    for (const key of editable) {
      if (b[key] !== undefined) { data[key] = b[key]; contentChanged = true; }
    }
    if (b.floorPlans !== undefined) { data.floorPlans = b.floorPlans as unknown as object; contentChanged = true; }
    if (b.nearbyLandmarks !== undefined) { data.nearbyLandmarks = b.nearbyLandmarks as unknown as object; contentChanged = true; }

    // When a builder edits their own already-approved (live) project, the changes
    // must be re-moderated: send it back to review and take it out of the live
    // catalog until an admin re-approves. Admin edits do not trigger re-review.
    let sentToReview = false;
    if (contentChanged && isOwner && !isAdmin && existing.submissionStatus === 'approved') {
      data.submissionStatus = 'under_review';
      data.rejectionReason = null;
      sentToReview = true;
    }

    const updated = await prisma.featuredProject.update({ where: { id }, data });

    if (sentToReview) {
      await prisma.activityLog.create({
        data: {
          action: 'project_created',
          actorName: user.name,
          actorRole: existing.submittedByUserId === user.id ? 'Builder' : 'User',
          details: `Edited approved project "${existing.name}" — sent back to review pending re-approval.`,
          targetTitle: existing.name,
          targetId: existing.id,
          severity: 'info',
        },
      });
    }
    return NextResponse.json({ success: true, project: serializeFeaturedProject(updated) });
  } catch (err: any) {
    console.error('PATCH /api/projects/[id] error', err);
    return NextResponse.json({ success: false, error: 'Failed to update project' }, { status: 500 });
  }
}

// DELETE /api/projects/:id — submitter or admin.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

    const existing = await prisma.featuredProject.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });

    if (existing.submittedByUserId !== user.id && !isAdminRole(user.role)) {
      return NextResponse.json({ success: false, error: 'Not allowed' }, { status: 403 });
    }

    await prisma.featuredProject.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        action: 'project_deleted',
        actorName: user.name,
        actorRole: user.role.toUpperCase(),
        details: `Deleted project "${existing.name}".`,
        targetTitle: existing.name,
        targetId: existing.id,
        severity: 'danger',
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /api/projects/[id] error', err);
    return NextResponse.json({ success: false, error: 'Failed to delete project' }, { status: 500 });
  }
}
