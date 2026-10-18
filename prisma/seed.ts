import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { INITIAL_PROPERTIES } from '../src/lib/realEstateData';
import type { Property } from '../src/lib/types';
import { BUILDERS_DATA } from '../src/lib/buildersData';
import { HOME_FEATURED_PROJECTS, HOME_TOP_PROJECTS, HOME_PREFERRED_AGENTS } from '../src/lib/homeSectionsData';
import { CURATED_COLLECTIONS } from '../src/lib/collectionsData';
import { coordinateColumns } from '../src/lib/maps/config';

const prisma = new PrismaClient();

// Demo accounts — password shown so you can log in immediately.
const DEMO_ACCOUNTS = [
  { key: 'admin',   name: 'BayBayt Master Admin', email: 'admin@baybayt.com', phone: '+91 80000 99099', role: 'admin',   password: 'admin123',    city: 'National (HQ)', companyName: 'BayBayt Verification Division' },
  { key: 'owner',   name: 'Priya Venkatesh',     email: 'owner@baybayt.com',       phone: '+91 98450 11223', role: 'owner',   password: 'password123', city: 'Bangalore' },
  { key: 'buyer',   name: 'Rahul Sharma',        email: 'buyer@baybayt.com',       phone: '+91 98765 43210', role: 'buyer',   password: 'password123', city: 'Bangalore' },
  { key: 'agent',   name: 'Vikram Deshmukh',     email: 'agent@baybayt.com',       phone: '+91 98200 99887', role: 'agent',   password: 'password123', city: 'Mumbai',    companyName: 'Prestige Realty Advisors', reraNumber: 'PRM/KA/RERA/1251/310/AG/210412/00189' },
  { key: 'builder', name: 'Amit Singhal',        email: 'builder@baybayt.com',     phone: '+91 99110 55443', role: 'builder', password: 'password123', city: 'Delhi / NCR', companyName: 'Godrej Properties Ltd', reraNumber: 'DLRERA2019P0004' },
] as const;

async function main() {
  console.log('Seeding database...');

  // Wipe (safe: dev seed) in FK-safe order.
  await prisma.inquiry.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();
  await prisma.builder.deleteMany();
  await prisma.featuredProject.deleteMany();
  await prisma.collection.deleteMany();

  // --- Users ---
  const userIdByKey: Record<string, string> = {};
  for (const acc of DEMO_ACCOUNTS) {
    const passwordHash = await bcrypt.hash(acc.password, 10);
    const user = await prisma.user.create({
      data: {
        name: acc.name,
        email: acc.email,
        phone: acc.phone,
        passwordHash,
        role: acc.role,
        city: acc.city,
        companyName: 'companyName' in acc ? acc.companyName : undefined,
        reraNumber: 'reraNumber' in acc ? acc.reraNumber : undefined,
        isPhoneVerified: true,
        isEmailVerified: true,
      },
    });
    userIdByKey[acc.key] = user.id;
  }
  console.log(`Created ${DEMO_ACCOUNTS.length} demo users.`);

  // Map a property's poster type to one of our demo users.
  const ownerFor = (p: Property): string | undefined => {
    switch (p.postedBy?.type) {
      case 'Builder': return userIdByKey.builder;
      case 'Verified Agent': return userIdByKey.agent;
      case 'Owner': return userIdByKey.owner;
      default: return userIdByKey.owner;
    }
  };

  // --- Properties --- (mirror propertyContext seed: a few pending/under_review/rejected)
  let count = 0;
  for (let idx = 0; idx < INITIAL_PROPERTIES.length; idx++) {
    const p = INITIAL_PROPERTIES[idx];

    let verificationStatus = 'approved';
    let isVerified = true;
    if (idx === 1) { verificationStatus = 'pending'; isVerified = false; }
    else if (idx === 5) { verificationStatus = 'under_review'; isVerified = false; }
    else if (idx === 7) { verificationStatus = 'rejected'; isVerified = false; }

    await prisma.property.create({
      data: {
        id: p.id, // keep original seed ids
        title: p.title,
        tagline: p.tagline,
        listingType: p.listingType,
        category: p.category,
        city: p.city,
        locality: p.locality,
        subLocality: p.subLocality,
        price: p.price,
        priceFormatted: p.priceFormatted,
        pricePerSqFt: p.pricePerSqFt,
        maintenance: p.maintenance,
        bhk: p.bhk,
        bathrooms: p.bathrooms,
        balconies: p.balconies,
        carpetAreaSqFt: p.carpetAreaSqFt,
        superBuiltUpAreaSqFt: p.superBuiltUpAreaSqFt,
        furnishing: p.furnishing,
        floor: p.floor,
        totalFloors: p.totalFloors,
        facing: p.facing,
        constructionStatus: p.constructionStatus,
        possessionDate: p.possessionDate,
        ageOfProperty: p.ageOfProperty,
        reraId: p.reraId,
        reraApproved: p.reraApproved,
        isVerified,
        verificationStatus,
        rejectionReason: verificationStatus === 'rejected'
          ? 'RERA registration number mismatch with state portal records. Please re-upload verified certificate.'
          : undefined,
        inquiriesCount: 0,
        viewsCount: 0,
        documentsSubmitted: [
          'Encumbrance Certificate (EC)',
          'Approved Floor Sanction Plan',
          'Property Tax Clearance Receipt',
        ],
        isFeatured: p.isFeatured ?? false,
        isExclusiveOwner: p.isExclusiveOwner ?? false,
        priceDrop: p.priceDrop ?? false,
        images: p.images,
        floorPlanImage: p.floorPlanImage,
        description: p.description,
        amenities: p.amenities,
        postedBy: p.postedBy as object,
        nearbyLandmarks: (p.nearbyLandmarks ?? undefined) as object | undefined,
        coordinates: (p.coordinates ?? undefined) as object | undefined,
        ...coordinateColumns(p.coordinates),
        postedByUserId: ownerFor(p),
        createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
      },
    });
    count++;
  }
  console.log(`Created ${count} properties.`);

  // --- A couple of activity logs + one inquiry against a real property ---
  const firstProp = INITIAL_PROPERTIES[0];
  await prisma.inquiry.create({
    data: {
      propertyId: firstProp.id,
      propertyTitle: firstProp.title,
      sellerUserId: userIdByKey.builder,
      buyerUserId: userIdByKey.buyer,
      buyerName: 'Rahul Sharma',
      buyerPhone: '+91 98765 43210',
      buyerEmail: 'buyer@baybayt.com',
      message: 'Interested in visiting this weekend. Is the price negotiable?',
      preferredTime: 'Saturday 11:00 AM',
      status: 'new',
    },
  });

  await prisma.activityLog.createMany({
    data: [
      { action: 'property_verified', actorName: 'BayBayt Master Admin', actorRole: 'Admin', details: 'Awarded Green Verified Seal after RERA check.', targetTitle: firstProp.title, targetId: firstProp.id, severity: 'success' },
      { action: 'user_registered', actorName: 'Rahul Sharma', actorRole: 'Buyer', details: 'New buyer account registered in Bangalore.', severity: 'info' },
    ],
  });

  // --- Catalog: Builders ---
  for (const b of BUILDERS_DATA) {
    const { projects, ...scalars } = b;
    await prisma.builder.create({
      data: { ...scalars, projects: projects as unknown as object },
    });
  }
  console.log(`Created ${BUILDERS_DATA.length} builders.`);

  // --- Catalog: Featured / Top projects (dedupe shared ids, keep first section) ---
  const seenProjectIds = new Set<string>();
  let projectCount = 0;
  for (const [section, list] of [
    ['featured', HOME_FEATURED_PROJECTS] as const,
    ['top', HOME_TOP_PROJECTS] as const,
  ]) {
    for (const p of list) {
      if (seenProjectIds.has(p.id)) continue;
      seenProjectIds.add(p.id);
      const { floorPlans, nearbyLandmarks, ...rest } = p;
      await prisma.featuredProject.create({
        data: {
          ...rest,
          section,
          floorPlans: (floorPlans ?? undefined) as unknown as object | undefined,
          nearbyLandmarks: (nearbyLandmarks ?? undefined) as unknown as object | undefined,
        },
      });
      projectCount++;
    }
  }
  console.log(`Created ${projectCount} featured/top projects.`);

  // --- Preferred agents are now Users (role='agent', isPreferredAgent=true) ---
  // Single source of truth: the directory profile + login account are one record.
  // Listing counts (for sale / for rent) are computed live from their properties,
  // so they are not stored here.
  const agentPasswordHash = await bcrypt.hash('password123', 10);
  let agentCount = 0;
  for (const a of HOME_PREFERRED_AGENTS) {
    const email = (a.email && a.email.trim())
      ? a.email.toLowerCase().trim()
      : `${a.id}@baybayt-agents.com`;
    // Skip if this email collides with a demo account already created.
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) continue;
    await prisma.user.create({
      data: {
        name: a.name,
        email,
        phone: a.phone,
        passwordHash: agentPasswordHash,
        role: 'agent',
        city: a.city,
        avatar: a.avatar,
        companyName: a.agencyName,
        reraNumber: a.reraId ?? undefined,
        isPhoneVerified: true,
        isEmailVerified: true,
        isPreferredAgent: true,
        agencyLogo: a.agencyLogo,
        agentBadge: a.badge,
        agentRating: a.rating,
        operatingSince: a.operatingSince,
        experienceYears: a.experienceYears ?? undefined,
        buyersServed: a.buyersServed,
        specializations: a.specializations ?? [],
        areasServed: a.areasServed ?? [],
        languages: a.languages ?? [],
        agentAbout: a.about ?? undefined,
      },
    });
    agentCount++;
  }
  console.log(`Created ${agentCount} preferred agent users.`);

  // --- Catalog: Curated collections ---
  for (const c of CURATED_COLLECTIONS) {
    await prisma.collection.create({
      data: {
        ...c,
        keyHighlights: c.keyHighlights as unknown as object,
        filters: c.filters as unknown as object,
        faqs: c.faqs as unknown as object,
      },
    });
  }
  console.log(`Created ${CURATED_COLLECTIONS.length} collections.`);

  console.log('Seed complete.');
  console.log('\nLogin credentials:');
  console.table(DEMO_ACCOUNTS.map((a) => ({ role: a.role, email: a.email, password: a.password })));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
