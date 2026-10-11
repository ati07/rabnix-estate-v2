export type ListingType = 'buy' | 'rent' | 'pg' | 'plot' | 'commercial';

// For commercial listings only: whether the space is offered for rent or sale.
export type CommercialListingType = 'rent' | 'sale';

export type PropertyCategory =
  | 'Apartment'
  | 'Villa'
  | 'Builder Floor'
  | 'Penthouse'
  | 'Studio'
  | 'Commercial Office'
  | 'Retail Shop'
  | 'Warehouse'
  | 'Commercial Land'
  | 'Residential Plot'
  | 'PG / Co-Living';

export type ConstructionStatus = 'Ready to Move' | 'Under Construction' | 'New Launch';
export type FurnishingStatus = 'Furnished' | 'Semi-Furnished' | 'Unfurnished';
export type PostedByType = 'Owner' | 'Builder' | 'Verified Agent';
export type FacingDirection = 'East' | 'North' | 'North-East' | 'West' | 'South';

export interface Property {
  id: string;
  title: string;
  tagline?: string;
  listingType: ListingType;
  commercialListingType?: CommercialListingType; // only when listingType==='commercial'
  category: PropertyCategory;
  city: string;
  locality: string;
  subLocality?: string;
  price: number; // in INR (total for buy, monthly for rent/pg)
  priceFormatted: string; // e.g. "₹1.45 Cr" or "₹45,000 / mo"
  pricePerSqFt?: number;
  maintenance?: number;
  bhk?: number; // 1, 2, 3, 4, 5
  bathrooms: number;
  balconies?: number;
  carpetAreaSqFt: number;
  superBuiltUpAreaSqFt?: number;
  furnishing: FurnishingStatus;
  floor?: number;
  totalFloors?: number;
  facing?: FacingDirection;
  constructionStatus: ConstructionStatus;
  possessionDate?: string;
  ageOfProperty?: string;
  reraId?: string;
  reraApproved: boolean;
  isVerified: boolean;
  verificationStatus?: VerificationStatus;
  rejectionReason?: string;
  postedByUserId?: string;
  inquiriesCount?: number;
  viewsCount?: number;
  documentsSubmitted?: string[];
  isFeatured?: boolean;
  isExclusiveOwner?: boolean;
  priceDrop?: boolean;
  images: string[];
  floorPlanImage?: string;
  description: string;
  amenities: string[];
  postedBy: {
    name: string;
    type: PostedByType;
    // Contact number is intentionally OMITTED from public list/detail payloads to
    // prevent bulk scraping. It is only returned by the gated reveal endpoint
    // (POST /api/properties/[id]/contact) or to the listing's owner/an admin.
    phone?: string;
    companyName?: string;
    responseTime?: string;
    rating?: number;
    avatar?: string;
  };
  nearbyLandmarks?: {
    name: string;
    distance: string;
    type: 'metro' | 'airport' | 'school' | 'hospital' | 'tech_park' | 'mall';
  }[];
  coordinates?: {
    lat: number;
    lng: number;
  };
  createdAt: string;
}

export interface CityInfo {
  name: string;
  state: string;
  code: string;
  popularLocalities: string[];
  avgPricePerSqFt: number;
  yoyGrowth: number;
  totalListingsCount: number;
  image: string;
}

export interface SearchFilters {
  city?: string;
  listingType: ListingType;
  commercialListingType?: CommercialListingType;
  locality?: string;
  localities?: string[];
  category?: PropertyCategory;
  categories?: PropertyCategory[];
  minPrice?: number;
  maxPrice?: number;
  minSizeSqFt?: number;
  maxSizeSqFt?: number;
  bhk?: number[];
  constructionStatus?: ConstructionStatus | ConstructionStatus[];
  furnishing?: FurnishingStatus | FurnishingStatus[];
  postedBy?: PostedByType[];
  isVerifiedOnly?: boolean;
  verifiedOnly?: boolean;
  isReraApprovedOnly?: boolean;
  reraOnly?: boolean;
  isOwnerOnly?: boolean;
  ownerOnly?: boolean;
  isFeaturedOnly?: boolean;
  amenities?: string[];
  sortBy?: 'recommended' | 'relevance' | 'price_asc' | 'price_desc' | 'area_desc' | 'newest';
}

export interface PostPropertyFormState {
  listingType: ListingType;
  commercialListingType?: CommercialListingType;
  category: PropertyCategory;
  city: string;
  locality: string;
  title: string;
  bhk: number;
  bathrooms: number;
  carpetAreaSqFt: number;
  superBuiltUpAreaSqFt: number;
  price: number;
  maintenance: number;
  furnishing: FurnishingStatus;
  floor: number;
  totalFloors: number;
  facing: FacingDirection;
  constructionStatus: ConstructionStatus;
  possessionDate: string;
  reraId: string;
  amenities: string[];
  description: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  imageUrls: string[];
}

export interface LocalityTrend {
  locality: string;
  city: string;
  avgPricePerSqFt: number;
  rentalYield: string;
  yoyGrowth: number;
  livabilityScore: number;
  topProjects: string[];
  overview: string;
}

export type UserRole = 'buyer' | 'owner' | 'agent' | 'builder' | 'admin';
export type VerificationStatus = 'approved' | 'pending' | 'rejected' | 'under_review';

export interface PropertyInquiry {
  id: string;
  propertyId: string;
  propertyTitle: string;
  sellerUserId?: string;
  buyerUserId?: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  message: string;
  preferredTime?: string;
  status: 'new' | 'contacted' | 'scheduled' | 'closed';
  createdAt: string;
}

export interface SystemActivityLog {
  id: string;
  timestamp: string;
  action: 'property_created' | 'property_verified' | 'property_rejected' | 'property_promoted' | 'user_registered' | 'user_blocked' | 'user_unblocked' | 'inquiry_received' | 'property_deleted' | 'contact_revealed';
  actorName: string;
  actorRole: string;
  details: string;
  targetTitle?: string;
  targetId?: string;
  severity: 'info' | 'success' | 'warning' | 'danger';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  city?: string;
  avatar?: string;
  companyName?: string;
  reraNumber?: string;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  isBlocked?: boolean;
  blockedReason?: string;
  blockedAt?: string;
  lastActive?: string;
  createdAt: string;
  savedSearchesCount?: number;
  shortlistedCount?: number;
  postedListingsCount?: number;
  totalInquiriesReceived?: number;
  // Preferred Agent directory profile (only meaningful for role='agent').
  isPreferredAgent?: boolean;
  agencyLogo?: string;
  agentBadge?: string;   // editorial, admin-set
  agentRating?: number;  // editorial, admin-set
  operatingSince?: number;
  experienceYears?: number;
  buyersServed?: string;
  specializations?: string[];
  areasServed?: string[];
  languages?: string[];
  agentAbout?: string;
}

export interface AiValuationResult {
  estimatedPriceMin: number;
  estimatedPriceMax: number;
  fairValueEstimate: number;
  confidenceScore: number;
  fairPriceSqFt: number;
  estimatedRentalMin: number;
  estimatedRentalMax: number;
  rentalYield: number;
  fiveYearAppreciationForecast: number;
  localityGrade: string;
  keyDrivers: string[];
  marketPros: string[];
  marketCons: string[];
  comparableLocalityAverages: { name: string; avgRate: number }[];
  summary: string;
}
