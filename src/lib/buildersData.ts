export interface BuilderProject {
  id: string;
  name: string;
  tagline: string;
  builderId: string;
  builderName: string;
  locality: string;
  city: string;
  status: 'Ready to Move' | 'Under Construction' | 'New Launch';
  priceRangeFormatted: string;
  minPrice: number;
  maxPrice: number;
  bhkOptions: string[];
  carpetAreaRange: string;
  reraId: string;
  completionDate: string;
  coverImage: string;
  galleryImages: string[];
  totalUnits: string;
  totalTowers?: string;
  highlights: string[];
  amenities: string[];
  associatedPropertyIds?: string[];
}

export interface Builder {
  id: string;
  name: string;
  slug: string;
  logo: string;
  bannerImage: string;
  tagline: string;
  badge: string;
  experienceYears: number;
  experienceText: string;
  establishedYear: number;
  projectsDeliveredCount: number;
  projectsDeliveredText: string;
  ongoingProjectsCount: number;
  ongoingProjectsText: string;
  totalSqFtDelivered: string;
  rating: number;
  reviewsCount: number;
  headquarters: string;
  reraRegistrationNumber: string;
  citiesPresent: string[];
  about: string;
  specialties: string[];
  awards: string[];
  contactPhone: string;
  contactEmail: string;
  website: string;
  projects: BuilderProject[];
}

