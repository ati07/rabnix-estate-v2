import { Property } from './types';

export interface ProjectFloorPlan {
  bhk: string;
  type: string;
  carpetAreaSqFt: number;
  superBuiltUpAreaSqFt: number;
  price: string;
  priceNum: number;
  image: string;
}

export interface ProjectNearby {
  name: string;
  distance: string;
  type: 'metro' | 'airport' | 'school' | 'hospital' | 'tech_park' | 'mall' | 'highway';
}

export interface FeaturedProjectItem {
  id: string;
  name: string;
  builderName: string;
  builderLogo: string;
  city: string;
  locality: string;
  address?: string;
  marketedBy: string;
  bhkConfig: string;
  priceFormatted: string;
  minPrice: number;
  maxPrice?: number;
  pricePerSqFt?: string;
  image: string;
  galleryImages?: string[];
  status: 'Ready to Move' | 'Under Construction' | 'New Launch';
  builderId?: string;
  tag?: string;
  reraNumber?: string;
  possessionDate?: string;
  launchDate?: string;
  totalAreaAcres?: string;
  totalTowers?: number;
  totalUnits?: number;
  openSpacePercent?: string;
  description?: string;
  highlights?: string[];
  amenities?: string[];
  floorPlans?: ProjectFloorPlan[];
  nearbyLandmarks?: ProjectNearby[];
  builderExperience?: string;
  builderDeliveredProjects?: number;
  // Home-section placement. Admin-curated: 'featured' → Featured Projects row,
  // 'top' → Top Projects row. New builder submissions default to 'featured'.
  section?: 'featured' | 'top';
  // Submission & moderation (builder-submitted projects). Curated catalog
  // entries are implicitly 'approved'.
  submissionStatus?: 'approved' | 'pending' | 'rejected' | 'under_review';
  rejectionReason?: string;
  submittedByUserId?: string;
}

export interface AgentReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  propertyType?: string;
}

export interface PreferredAgentItem {
  id: string;
  name: string;
  avatar: string;
  badge: string;
  agencyName: string;
  agencyLogo: string;
  operatingSince: number;
  experienceYears?: number;
  buyersServed: string;
  propertiesForSaleCount: number;
  propertiesForRentCount?: number;
  city: string;
  rating: number;
  phone: string;
  email?: string;
  reraId?: string;
  address?: string;
  about?: string;
  specializations?: string[];
  areasServed?: string[];
  languages?: string[];
  reviews?: AgentReview[];
  verifiedDocuments?: string[];
}

export interface PopularLocalityCardItem {
  id: string;
  name: string;
  city: string;
  priceRangeSqFt: string;
  rating?: number;
  reviewsCount?: number;
  thumbnail: string;
  propertiesCount: number;
}

// Map real properties onto an agent for their profile page. Only ever operates
// on live properties passed in by the caller — no static/demo data.
// Generate realistic properties for an agent from catalog or customized realistic listings
export function getAgentProperties(agent: PreferredAgentItem, allProperties: Property[]): Property[] {
  // 1. Check if any properties match the agent's name or agency
  const matched = allProperties.filter((p) => 
    (p.postedBy?.name && p.postedBy.name.toLowerCase().includes(agent.name.toLowerCase().split(' ')[0])) ||
    (p.postedBy?.companyName && p.postedBy.companyName.toLowerCase().includes(agent.agencyName.toLowerCase().split(' ')[0]))
  );

  if (matched.length >= 3) return matched;

  // 2. Filter properties by the agent's city
  const cityProps = allProperties.filter((p) => p.city.toLowerCase() === agent.city.toLowerCase());
  if (cityProps.length > 0) {
    return cityProps.map((p, idx) => ({
      ...p,
      postedBy: {
        ...p.postedBy,
        name: agent.name,
        type: 'Verified Agent',
        phone: agent.phone,
        companyName: agent.agencyName,
        rating: agent.rating,
        avatar: agent.avatar
      },
      isVerified: true
    }));
  }

  // 3. Fallback to top catalog properties
  return allProperties.slice(0, 6).map((p) => ({
    ...p,
    city: agent.city,
    postedBy: {
      ...p.postedBy,
      name: agent.name,
      type: 'Verified Agent',
      phone: agent.phone,
      companyName: agent.agencyName,
      rating: agent.rating,
      avatar: agent.avatar
    },
    isVerified: true
  }));
}
