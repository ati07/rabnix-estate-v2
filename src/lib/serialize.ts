import type {
  Property as DbProperty,
  Inquiry as DbInquiry,
  ActivityLog as DbLog,
  Builder as DbBuilder,
  FeaturedProject as DbFeaturedProject,
  User as DbUser,
  Collection as DbCollection,
} from '@prisma/client';
import type { Property, PropertyInquiry, SystemActivityLog } from '@/lib/types';
import type { Builder, BuilderProject } from '@/lib/buildersData';
import type { FeaturedProjectItem, PreferredAgentItem, ProjectFloorPlan, ProjectNearby } from '@/lib/homeSectionsData';
import type { CuratedCollection } from '@/lib/collectionsData';

/** Remove the owner/agent phone from a Property's contact block. Used for public
 * payloads (list/detail) so contact numbers can't be harvested in bulk. */
export function stripPropertyContact(p: Property): Property {
  return { ...p, postedBy: { ...p.postedBy, phone: undefined } };
}

/**
 * Convert a DB Property row into the Property shape the UI expects.
 * `includeContact` defaults to FALSE: the phone is withheld from public
 * responses and only included for the listing's owner, an admin, or the gated
 * contact-reveal endpoint. See POST /api/properties/[id]/contact.
 */
export function serializeProperty(p: DbProperty, includeContact = false): Property {
  const rawPostedBy = p.postedBy as Property['postedBy'];
  const postedBy = includeContact ? rawPostedBy : { ...rawPostedBy, phone: undefined };
  return {
    postedBy,
    id: p.id,
    title: p.title,
    tagline: p.tagline ?? undefined,
    listingType: p.listingType as Property['listingType'],
    commercialListingType: (p.commercialListingType as Property['commercialListingType']) ?? undefined,
    category: p.category as Property['category'],
    city: p.city,
    state: p.state ?? undefined,
    country: p.country ?? undefined,
    locality: p.locality,
    subLocality: p.subLocality ?? undefined,
    address: p.address ?? undefined,
    price: p.price,
    priceFormatted: p.priceFormatted,
    pricePerSqFt: p.pricePerSqFt ?? undefined,
    maintenance: p.maintenance ?? undefined,
    bhk: p.bhk ?? undefined,
    bathrooms: p.bathrooms,
    balconies: p.balconies ?? undefined,
    carpetAreaSqFt: p.carpetAreaSqFt,
    superBuiltUpAreaSqFt: p.superBuiltUpAreaSqFt ?? undefined,
    furnishing: p.furnishing as Property['furnishing'],
    floor: p.floor ?? undefined,
    totalFloors: p.totalFloors ?? undefined,
    facing: (p.facing as Property['facing']) ?? undefined,
    constructionStatus: p.constructionStatus as Property['constructionStatus'],
    possessionDate: p.possessionDate ?? undefined,
    ageOfProperty: p.ageOfProperty ?? undefined,
    reraId: p.reraId ?? undefined,
    reraApproved: p.reraApproved,
    isVerified: p.isVerified,
    verificationStatus: p.verificationStatus as Property['verificationStatus'],
    rejectionReason: p.rejectionReason ?? undefined,
    postedByUserId: p.postedByUserId ?? undefined,
    inquiriesCount: p.inquiriesCount,
    viewsCount: p.viewsCount,
    documentsSubmitted: p.documentsSubmitted,
    isFeatured: p.isFeatured,
    isExclusiveOwner: p.isExclusiveOwner,
    priceDrop: p.priceDrop,
    images: p.images,
    floorPlanImage: p.floorPlanImage ?? undefined,
    description: p.description,
    amenities: p.amenities,
    nearbyLandmarks: (p.nearbyLandmarks as Property['nearbyLandmarks']) ?? undefined,
    coordinates: (p.coordinates as Property['coordinates']) ?? undefined,
    createdAt: p.createdAt.toISOString().split('T')[0],
  };
}

export function serializeInquiry(i: DbInquiry): PropertyInquiry {
  return {
    id: i.id,
    propertyId: i.propertyId,
    propertyTitle: i.propertyTitle,
    sellerUserId: i.sellerUserId ?? undefined,
    buyerUserId: i.buyerUserId ?? undefined,
    buyerName: i.buyerName,
    buyerPhone: i.buyerPhone,
    buyerEmail: i.buyerEmail,
    message: i.message,
    preferredTime: i.preferredTime ?? undefined,
    status: i.status as PropertyInquiry['status'],
    createdAt: i.createdAt.toISOString(),
  };
}

/** DB Builder row -> the Builder shape the UI expects (from buildersData.ts). */
export function serializeBuilder(b: DbBuilder): Builder {
  return {
    id: b.id,
    name: b.name,
    slug: b.slug,
    logo: b.logo,
    bannerImage: b.bannerImage,
    tagline: b.tagline,
    badge: b.badge,
    experienceYears: b.experienceYears,
    experienceText: b.experienceText,
    establishedYear: b.establishedYear,
    projectsDeliveredCount: b.projectsDeliveredCount,
    projectsDeliveredText: b.projectsDeliveredText,
    ongoingProjectsCount: b.ongoingProjectsCount,
    ongoingProjectsText: b.ongoingProjectsText,
    totalSqFtDelivered: b.totalSqFtDelivered,
    rating: b.rating,
    reviewsCount: b.reviewsCount,
    headquarters: b.headquarters,
    reraRegistrationNumber: b.reraRegistrationNumber,
    citiesPresent: b.citiesPresent,
    about: b.about,
    specialties: b.specialties,
    awards: b.awards,
    contactPhone: b.contactPhone,
    contactEmail: b.contactEmail,
    website: b.website,
    projects: (b.projects as unknown as BuilderProject[]) ?? [],
  };
}

/** DB FeaturedProject row -> FeaturedProjectItem (from homeSectionsData.ts). */
export function serializeFeaturedProject(p: DbFeaturedProject): FeaturedProjectItem {
  return {
    id: p.id,
    name: p.name,
    builderName: p.builderName,
    builderLogo: p.builderLogo,
    city: p.city,
    locality: p.locality,
    address: p.address ?? undefined,
    marketedBy: p.marketedBy,
    bhkConfig: p.bhkConfig,
    priceFormatted: p.priceFormatted,
    minPrice: p.minPrice,
    maxPrice: p.maxPrice ?? undefined,
    pricePerSqFt: p.pricePerSqFt ?? undefined,
    image: p.image,
    galleryImages: p.galleryImages,
    status: p.status as FeaturedProjectItem['status'],
    builderId: p.builderId ?? undefined,
    tag: p.tag ?? undefined,
    reraNumber: p.reraNumber ?? undefined,
    possessionDate: p.possessionDate ?? undefined,
    launchDate: p.launchDate ?? undefined,
    totalAreaAcres: p.totalAreaAcres ?? undefined,
    totalTowers: p.totalTowers ?? undefined,
    totalUnits: p.totalUnits ?? undefined,
    openSpacePercent: p.openSpacePercent ?? undefined,
    description: p.description ?? undefined,
    highlights: p.highlights,
    amenities: p.amenities,
    floorPlans: (p.floorPlans as unknown as ProjectFloorPlan[]) ?? undefined,
    nearbyLandmarks: (p.nearbyLandmarks as unknown as ProjectNearby[]) ?? undefined,
    builderExperience: p.builderExperience ?? undefined,
    builderDeliveredProjects: p.builderDeliveredProjects ?? undefined,
    section: p.section as FeaturedProjectItem['section'],
    submissionStatus: p.submissionStatus as FeaturedProjectItem['submissionStatus'],
    rejectionReason: p.rejectionReason ?? undefined,
    submittedByUserId: p.submittedByUserId ?? undefined,
  };
}

// Generic professional placeholders when an agent hasn't uploaded imagery yet.
const AGENT_DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80';
const AGENT_DEFAULT_LOGO = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=200&q=80';

/**
 * A preferred-agent User row -> PreferredAgentItem (from homeSectionsData.ts).
 * Preferred agents are now Users (role='agent', isPreferredAgent=true), so the
 * directory card is derived from their account + marketing profile. Listing
 * counts are computed live from their properties and passed in by the caller.
 */
export function serializeAgentUser(
  u: DbUser,
  counts: { forSale: number; forRent: number },
): PreferredAgentItem {
  return {
    id: u.id,
    name: u.name,
    avatar: u.avatar || AGENT_DEFAULT_AVATAR,
    badge: u.agentBadge || 'BayBayt Preferred',
    agencyName: u.companyName || 'Independent Agent',
    agencyLogo: u.agencyLogo || AGENT_DEFAULT_LOGO,
    operatingSince: u.operatingSince ?? u.createdAt.getFullYear(),
    experienceYears: u.experienceYears ?? undefined,
    buyersServed: u.buyersServed ?? '0',
    propertiesForSaleCount: counts.forSale,
    propertiesForRentCount: counts.forRent,
    city: u.city ?? '',
    rating: u.agentRating ?? 4.5,
    phone: u.phone,
    email: u.email ?? undefined,
    reraId: u.reraNumber ?? undefined,
    address: undefined,
    about: u.agentAbout ?? undefined,
    specializations: u.specializations,
    areasServed: u.areasServed,
    languages: u.languages,
    reviews: undefined,
    verifiedDocuments: undefined,
  };
}

/** DB Collection row -> CuratedCollection (from collectionsData.ts). */
export function serializeCollection(c: DbCollection): CuratedCollection {
  return {
    id: c.id,
    title: c.title,
    subtitle: c.subtitle,
    tag: c.tag,
    tagColor: c.tagColor,
    iconName: c.iconName,
    heroImage: c.heroImage,
    badge: c.badge,
    actionText: c.actionText,
    overview: c.overview,
    keyHighlights: c.keyHighlights as unknown as CuratedCollection['keyHighlights'],
    filters: c.filters as unknown as CuratedCollection['filters'],
    recommendedCities: c.recommendedCities,
    faqs: c.faqs as unknown as CuratedCollection['faqs'],
  };
}

export function serializeLog(l: DbLog): SystemActivityLog {
  return {
    id: l.id,
    timestamp: l.createdAt.toISOString(),
    action: l.action as SystemActivityLog['action'],
    actorName: l.actorName,
    actorRole: l.actorRole,
    details: l.details,
    targetTitle: l.targetTitle ?? undefined,
    targetId: l.targetId ?? undefined,
    severity: l.severity as SystemActivityLog['severity'],
  };
}
