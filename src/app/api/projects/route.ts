import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { serializeFeaturedProject } from '@/lib/serialize';
import { getEntitlement, canCreateInCity, consumeListingCredit } from '@/lib/billing';
import { HOME_FEATURED_PROJECTS, HOME_TOP_PROJECTS, getAllProjects, type FeaturedProjectItem } from '@/lib/homeSectionsData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Generate a URL-friendly, unique-ish project id from its name.
function makeProjectId(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'project';
  return `proj-${slug}-${Math.random().toString(36).slice(2, 7)}`;
}

// GET /api/projects
//   ?section=featured | top   -> only that home section (approved only)
//   ?city=Lucknow             -> only projects in that city (public reads)
//   ?mine=1                   -> only the current user's submissions (any status)
//   ?scope=all                -> everything (admin only)
//   (default)                 -> approved projects, plus the viewer's own submissions
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const section = searchParams.get('section');
  const city = searchParams.get('city');
  const mine = searchParams.get('mine');
  const scope = searchParams.get('scope');

  try {
    const user = await getCurrentUser();
    const where: any = {};
    if (section) where.section = section;
    // City filter applies to public reads (home sections pass it); admin/owner
    // dashboards fetch everything and filter client-side.
    if (city && mine !== '1' && scope !== 'all') where.city = city;

    if (mine === '1') {
      if (!user) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
      where.submittedByUserId = user.id;
    } else if (scope === 'all') {
      if (user?.role !== 'admin') {
        return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
      }
      // no status filter — return everything
    } else {
      // public: approved projects, plus the viewer's own (so they see pending ones)
      where.OR = [
        { submissionStatus: 'approved' },
        ...(user ? [{ submittedByUserId: user.id }] : []),
      ];
    }

    const rows = await prisma.featuredProject.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
    if (rows.length > 0 || mine === '1' || scope === 'all') {
      return NextResponse.json({ success: true, projects: rows.map(serializeFeaturedProject) });
    }
  } catch (err: any) {
    console.warn('Prisma projects fallback to static data:', err?.message || err);
  }

  // Static fallback (curated data is implicitly approved) — only for public reads.
  let projects: FeaturedProjectItem[] =
    section === 'featured' ? HOME_FEATURED_PROJECTS
    : section === 'top' ? HOME_TOP_PROJECTS
    : getAllProjects();
  // Strict per-city fallback so a city shows only its own demo projects.
  if (city) projects = projects.filter((p) => p.city.toLowerCase() === city.toLowerCase());
  return NextResponse.json({ success: true, projects });
}

// POST /api/projects — submit a new project for review (builders only).
// Always starts "pending" and consumes one listing credit (same quota as properties).
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Please sign in to submit a project.' }, { status: 401 });
    }
    if (user.isBlocked) {
      return NextResponse.json({ success: false, error: 'Blocked accounts cannot submit projects.' }, { status: 403 });
    }
    if (user.role !== 'builder' && user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only builder accounts can submit projects.' },
        { status: 403 },
      );
    }

    const b = (await req.json()) as Partial<FeaturedProjectItem>;

    if (!b.name || !b.city || !b.locality || !b.minPrice) {
      return NextResponse.json(
        { success: false, error: 'Project name, city, locality and starting price are required.' },
        { status: 400 },
      );
    }
    const name = b.name;
    const city = b.city;
    const locality = b.locality;
    const minPrice = b.minPrice;

    // Listing quota: admins unlimited; builders draw from the global free tier +
    // active packs bought for THIS city.
    const entitlement = await getEntitlement(user.id, user.role);
    if (!entitlement.unlimited && !canCreateInCity(entitlement, city)) {
      return NextResponse.json(
        {
          success: false,
          error: 'listing-quota-exceeded',
          message: `You have no listings left for ${city}. Buy a ${city} pack from your dashboard to submit projects here.`,
        },
        { status: 402 },
      );
    }

    const created = await prisma.$transaction(async (tx) => {
      if (!entitlement.unlimited) {
        const consumed = await consumeListingCredit(tx, user.id, city);
        if (!consumed) throw new Error('listing-quota-exceeded');
      }

      const project = await tx.featuredProject.create({
        data: {
          id: makeProjectId(name),
          section: 'featured',
          name,
          builderName: b.builderName || user.companyName || user.name,
          builderLogo: b.builderLogo || user.agencyLogo || '',
          builderId: b.builderId,
          city,
          locality,
          address: b.address,
          marketedBy: b.marketedBy || user.companyName || user.name,
          bhkConfig: b.bhkConfig || '',
          priceFormatted: b.priceFormatted || `₹${minPrice.toLocaleString('en-IN')}`,
          minPrice,
          maxPrice: b.maxPrice,
          pricePerSqFt: b.pricePerSqFt,
          image: b.image || (b.galleryImages && b.galleryImages[0]) || '',
          galleryImages: b.galleryImages || [],
          status: b.status || 'New Launch',
          tag: b.tag,
          reraNumber: b.reraNumber,
          possessionDate: b.possessionDate,
          launchDate: b.launchDate,
          totalAreaAcres: b.totalAreaAcres,
          totalTowers: b.totalTowers,
          totalUnits: b.totalUnits,
          openSpacePercent: b.openSpacePercent,
          description: b.description,
          highlights: b.highlights || [],
          amenities: b.amenities || [],
          floorPlans: (b.floorPlans ?? undefined) as unknown as object | undefined,
          nearbyLandmarks: (b.nearbyLandmarks ?? undefined) as unknown as object | undefined,
          builderExperience: b.builderExperience,
          builderDeliveredProjects: b.builderDeliveredProjects,
          // Enforced by server: new submissions await admin approval.
          submissionStatus: 'pending',
          submittedByUserId: user.id,
        },
      });

      await tx.activityLog.create({
        data: {
          action: 'project_created',
          actorName: user.name,
          actorRole: user.role.toUpperCase(),
          details: `Submitted new project "${project.name}" for review in ${project.city}.`,
          targetTitle: project.name,
          targetId: project.id,
          severity: 'info',
        },
      });

      return project;
    });

    return NextResponse.json({ success: true, project: serializeFeaturedProject(created) });
  } catch (err: any) {
    if (err?.message === 'listing-quota-exceeded') {
      return NextResponse.json(
        {
          success: false,
          error: 'listing-quota-exceeded',
          message: 'You have used all your listings. Buy a plan to submit more projects.',
        },
        { status: 402 },
      );
    }
    console.error('POST /api/projects error', err);
    return NextResponse.json({ success: false, error: 'Failed to submit project' }, { status: 500 });
  }
}
