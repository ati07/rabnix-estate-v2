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

// 1. FEATURED & TOP PROJECTS DATA
export const HOME_FEATURED_PROJECTS: FeaturedProjectItem[] = [
  {
    id: 'proj-eldeco-solano',
    name: 'Eldeco Solano Gardens',
    builderName: 'Eldeco Housing and Industries',
    builderLogo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=200&q=80',
    city: 'Lucknow',
    locality: 'New Jail Road, Mohanlalganj',
    address: 'Sector 4, New Jail Road, Mohanlalganj, Lucknow, UP 226301',
    marketedBy: 'Ayana Proptech LLP',
    bhkConfig: '2, 3 BHK Luxury Villas',
    priceFormatted: '₹ 1.24 Cr - ₹ 1.95 Cr',
    minPrice: 12400000,
    maxPrice: 19500000,
    pricePerSqFt: '₹ 6,880 / sqft',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80'
    ],
    status: 'Ready to Move',
    builderId: 'eldeco-group',
    tag: 'Exclusive Villas',
    reraNumber: 'UPRERAPRJ668472',
    possessionDate: 'Ready for Immediate Possession',
    launchDate: 'March 2022',
    totalAreaAcres: '25 Acres',
    totalTowers: 1,
    totalUnits: 340,
    openSpacePercent: '72% Green & Landscaped Open Area',
    description: 'Eldeco Solano Gardens is an exquisite luxury Spanish-inspired villa enclave located on New Jail Road, Mohanlalganj, Lucknow. Designed for those who value privacy, serenity, and contemporary elegance, every villa features sprawling private terraces, manicured front lawns, high ceilings, and double-height living areas.',
    highlights: [
      'Private garden & car porch with every villa',
      'Grand 18,000 sq.ft Clubhouse with temperature-controlled pool',
      'Gated community with 3-tier 24/7 AI-enabled security',
      'Zero traffic ground movement for pedestrian safety',
      'Rainwater harvesting and 100% solar-assisted common lighting'
    ],
    amenities: [
      'Clubhouse', 'Swimming Pool', 'Gymnasium', 'Tennis Court', 'Badminton Court',
      'Children Play Area', 'Jogging Track', '24x7 Power Backup', 'Landscaped Gardens',
      'EV Charging Stations', 'Amphitheatre', 'Meditation Lawn', 'CCTV Surveillance'
    ],
    floorPlans: [
      {
        bhk: '2 BHK Villa',
        type: 'Deluxe Courtyard Villa',
        carpetAreaSqFt: 1350,
        superBuiltUpAreaSqFt: 1780,
        price: '₹ 1.24 Cr',
        priceNum: 12400000,
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
      },
      {
        bhk: '3 BHK Villa',
        type: 'Imperial Duplex Villa',
        carpetAreaSqFt: 1850,
        superBuiltUpAreaSqFt: 2420,
        price: '₹ 1.68 Cr',
        priceNum: 16800000,
        image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80'
      },
      {
        bhk: '3.5 BHK Villa + Servant',
        type: 'Presidential Signature Villa',
        carpetAreaSqFt: 2200,
        superBuiltUpAreaSqFt: 2950,
        price: '₹ 1.95 Cr',
        priceNum: 19500000,
        image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80'
      }
    ],
    nearbyLandmarks: [
      { name: 'Amar Shaheed Path Corridor', distance: '4.5 km (8 mins)', type: 'highway' },
      { name: 'Medanta Super Specialty Hospital', distance: '6.2 km (12 mins)', type: 'hospital' },
      { name: 'Lulu Mall Lucknow', distance: '7.0 km (14 mins)', type: 'mall' },
      { name: 'Charbagh Railway Station', distance: '12.0 km (22 mins)', type: 'metro' },
      { name: 'Chaudhary Charan Singh International Airport', distance: '14.5 km (20 mins)', type: 'airport' }
    ],
    builderExperience: '35+ Years in North Indian Real Estate',
    builderDeliveredProjects: 175
  },
  {
    id: 'proj-shalimar-gallant',
    name: 'Shalimar Gallant West',
    builderName: 'Shalimar Corp Ltd',
    builderLogo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=200&q=80',
    city: 'Lucknow',
    locality: 'Mahanagar, Lucknow',
    address: 'Vigyan Puri, Mahanagar, Lucknow, UP 226006',
    marketedBy: 'Shalimar Corp Ltd',
    bhkConfig: '3, 4, 5 BHK Ultra Luxury Residences',
    priceFormatted: '₹ 4.20 Cr - ₹ 6.85 Cr',
    minPrice: 42000000,
    maxPrice: 68500000,
    pricePerSqFt: '₹ 14,250 / sqft',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
    ],
    status: 'Under Construction',
    builderId: 'shalimar-corp',
    tag: 'Ultra Luxury',
    reraNumber: 'UPRERAPRJ882194',
    possessionDate: 'December 2026',
    launchDate: 'January 2023',
    totalAreaAcres: '14.5 Acres',
    totalTowers: 6,
    totalUnits: 280,
    openSpacePercent: '80% Open Lush Landscape',
    description: 'Shalimar Gallant West sets the gold benchmark for ultra-luxury residential living in prime Mahanagar, Lucknow. Featuring bespoke panoramic glass façades, private elevator access directly into individual residences, heated infinity pool, and concierge hospitality services.',
    highlights: [
      'Private dedicated elevator landing for each luxury apartment',
      'Heated Olympic-size rooftop infinity pool with city skyline views',
      'Italian marble flooring and imported German modular kitchens',
      'Smart home automation and central air-purified VRV climate control',
      'IGBC Platinum certified green building design'
    ],
    amenities: [
      'Rooftop Infinity Pool', 'Sky Lounge & Cigar Bar', 'State-of-the-art Gym',
      'Squash Court', 'Private Cinema Screening Theatre', 'Spa & Wellness Salon',
      'High Speed Elevators', 'Concierge Desk 24/7', 'Valet Parking', 'Children Play Park'
    ],
    floorPlans: [
      {
        bhk: '3 BHK + Servant',
        type: 'Grand Royale Flat',
        carpetAreaSqFt: 2450,
        superBuiltUpAreaSqFt: 3100,
        price: '₹ 4.20 Cr',
        priceNum: 42000000,
        image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80'
      },
      {
        bhk: '4 BHK + Servant',
        type: 'Signature Presidential Suite',
        carpetAreaSqFt: 3400,
        superBuiltUpAreaSqFt: 4350,
        price: '₹ 5.70 Cr',
        priceNum: 57000000,
        image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80'
      },
      {
        bhk: '5 BHK Penthouse',
        type: 'Imperial Sky Villa Duplex',
        carpetAreaSqFt: 4800,
        superBuiltUpAreaSqFt: 6200,
        price: '₹ 6.85 Cr',
        priceNum: 68500000,
        image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'
      }
    ],
    nearbyLandmarks: [
      { name: 'Hazratganj City Center', distance: '3.8 km (8 mins)', type: 'mall' },
      { name: 'Mahanagar Metro Station', distance: '1.2 km (3 mins)', type: 'metro' },
      { name: 'La Martiniere College', distance: '4.5 km (10 mins)', type: 'school' },
      { name: 'Sahara Hospital Gomti Nagar', distance: '5.0 km (12 mins)', type: 'hospital' },
      { name: 'CCS International Airport', distance: '18.0 km (25 mins)', type: 'airport' }
    ],
    builderExperience: '30+ Years of Iconic Landmark Construction',
    builderDeliveredProjects: 65
  },
  {
    id: 'proj-godrej-woods',
    name: 'Godrej Woods Residences',
    builderName: 'Godrej Properties Ltd',
    builderLogo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=200&q=80',
    city: 'Noida',
    locality: 'Sector 62 Noida',
    address: 'Sector 62, Near Electronic City Metro, Noida, UP 201309',
    marketedBy: 'Godrej Partner Desk',
    bhkConfig: '2, 3, 4 BHK Forest Apartments',
    priceFormatted: '₹ 2.45 Cr - ₹ 4.10 Cr',
    minPrice: 24500000,
    maxPrice: 41000000,
    pricePerSqFt: '₹ 11,800 / sqft',
    image: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
    ],
    status: 'Ready to Move',
    builderId: 'godrej-properties',
    tag: 'Forest Theme',
    reraNumber: 'UPRERAPRJ7047',
    possessionDate: 'Ready to Move',
    launchDate: 'August 2021',
    totalAreaAcres: '11 Acres',
    totalTowers: 8,
    totalUnits: 720,
    openSpacePercent: '84% Forest & Green Belt',
    description: 'Godrej Woods brings lush nature into urban life with an authentic forest trail comprising over 1,100 indigenous trees, double swimming pools, wellness clubhouse, and seamless metro connectivity.',
    highlights: [
      'Urban forest sanctuary with 1,100+ native trees',
      'Elevated forest walkway with birdwatching viewpoints',
      'Walking distance to Sector 62 Noida Metro Station',
      'Energy efficient GRIHA 4-star certified design'
    ],
    amenities: [
      'Resort Pool', 'Forest Walkway', 'Clubhouse', 'Gym', 'Badminton Court',
      'Co-Working Lounge', 'Kids Play Zone', 'Jogging Track', 'EV Charging'
    ],
    floorPlans: [
      {
        bhk: '2 BHK Luxury',
        type: 'Urban Classic',
        carpetAreaSqFt: 1150,
        superBuiltUpAreaSqFt: 1540,
        price: '₹ 2.45 Cr',
        priceNum: 24500000,
        image: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80'
      },
      {
        bhk: '3 BHK + 2T',
        type: 'Forest View Premium',
        carpetAreaSqFt: 1620,
        superBuiltUpAreaSqFt: 2150,
        price: '₹ 3.15 Cr',
        priceNum: 31500000,
        image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80'
      }
    ],
    nearbyLandmarks: [
      { name: 'Noida Electronic City Metro', distance: '0.8 km (2 mins)', type: 'metro' },
      { name: 'Fortis Hospital Sector 62', distance: '1.5 km (4 mins)', type: 'hospital' },
      { name: 'Indira Gandhi International Airport', distance: '34 km (45 mins)', type: 'airport' }
    ],
    builderExperience: '125+ Years of Godrej Brand Heritage',
    builderDeliveredProjects: 140
  },
  {
    id: 'proj-prestige-lakeside',
    name: 'Prestige Lakeside Habitat',
    builderName: 'Prestige Group',
    builderLogo: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=200&q=80',
    city: 'Bangalore',
    locality: 'Varthur Main Road, Whitefield',
    address: 'SH 35, Gunjur Village, Varthur Main Road, Bangalore 560087',
    marketedBy: 'Prestige Direct Advisory',
    bhkConfig: '3, 4 BHK Luxury Flats & Villas',
    priceFormatted: '₹ 2.10 Cr - ₹ 4.50 Cr',
    minPrice: 21000000,
    maxPrice: 45000000,
    pricePerSqFt: '₹ 9,600 / sqft',
    image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
    ],
    status: 'Ready to Move',
    builderId: 'prestige-group',
    tag: 'Lakeview Resort Living',
    reraNumber: 'PRM/KA/RERA/1251/446/PR/170915/000176',
    possessionDate: 'Ready to Move',
    launchDate: 'January 2020',
    totalAreaAcres: '102 Acres',
    totalTowers: 24,
    totalUnits: 3426,
    openSpacePercent: '80% Open Space facing Varthur Lake',
    description: 'Prestige Lakeside Habitat is a sprawling township project overlooking the scenic Varthur Lake in Whitefield. Features Disney-inspired theme parks, four grand clubhouses, sports complexes, and pristine landscaped avenues.',
    highlights: [
      'Overlooking 180-acre serene Varthur Lake',
      '4 massive clubhouses with indoor sports and swimming pools',
      'Proximity to ITPL and Outer Ring Road tech corridors'
    ],
    amenities: [
      '4 Clubhouses', '4 Swimming Pools', 'Cricket Pitch', 'Tennis Courts',
      'Skating Rink', 'Mini Golf Course', 'Supermarket', 'Pharmacy', 'Jogging Tracks'
    ],
    floorPlans: [
      {
        bhk: '3 BHK High Rise',
        type: 'Lakeview Premium',
        carpetAreaSqFt: 1750,
        superBuiltUpAreaSqFt: 2280,
        price: '₹ 2.10 Cr',
        priceNum: 21000000,
        image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80'
      }
    ],
    nearbyLandmarks: [
      { name: 'ITPL Tech Park Whitefield', distance: '5.5 km (12 mins)', type: 'tech_park' },
      { name: 'Columbia Asia Hospital Whitefield', distance: '3.0 km (7 mins)', type: 'hospital' }
    ],
    builderExperience: '36+ Years in South India',
    builderDeliveredProjects: 250
  },
  {
    id: 'proj-sobha-neopolis',
    name: 'Sobha Neopolis Greek Town',
    builderName: 'Sobha Developers',
    builderLogo: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=200&q=80',
    city: 'Bangalore',
    locality: 'Panathur Road, Marathahalli',
    address: 'Panathur Main Road, Off Outer Ring Road, Bangalore 560087',
    marketedBy: 'Sobha Sales Central',
    bhkConfig: '3, 4 BHK Smart Homes',
    priceFormatted: '₹ 1.95 Cr - ₹ 3.40 Cr',
    minPrice: 19500000,
    maxPrice: 34000000,
    pricePerSqFt: '₹ 10,400 / sqft',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
    ],
    status: 'Under Construction',
    builderId: 'sobha-developers',
    tag: 'Greek Architecture',
    reraNumber: 'PRM/KA/RERA/1251/446/PR/200923/006282',
    possessionDate: 'December 2027',
    launchDate: 'September 2023',
    totalAreaAcres: '25.3 Acres',
    totalTowers: 19,
    totalUnits: 1875,
    openSpacePercent: '78% Greek Themed Gardens',
    description: 'Sobha Neopolis is a Mediterranean Greek-architecture inspired master development near Marathahalli and Panathur. Boasts authentic Santorini style arches, columns, three large clubhouses, and Olympian athletic facilities.',
    highlights: [
      'Santorini Greek themed architecture with white & blue aesthetics',
      '77,000 sq.ft expansive clubhouse facilities across 3 hubs',
      'Immediate access to Outer Ring Road tech hubs (Bellandur/Marathahalli)'
    ],
    amenities: [
      '3 Clubhouses', 'Olympian Pool', 'Aqua Park', 'Squash & Tennis', 'Outdoor Amphitheater', 'Co-working Cafes'
    ],
    floorPlans: [
      {
        bhk: '3 BHK Smart',
        type: 'Athenian Classic',
        carpetAreaSqFt: 1610,
        superBuiltUpAreaSqFt: 2150,
        price: '₹ 1.95 Cr',
        priceNum: 19500000,
        image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'
      }
    ],
    nearbyLandmarks: [
      { name: 'Cessna Business Park', distance: '3.5 km (10 mins)', type: 'tech_park' },
      { name: 'Outer Ring Road Bellandur', distance: '4.0 km (10 mins)', type: 'highway' }
    ],
    builderExperience: '28+ Years of Backward Integrated Quality',
    builderDeliveredProjects: 160
  },
  {
    id: 'proj-dlf-camellias',
    name: 'DLF The Camellias Super Luxury',
    builderName: 'DLF Limited',
    builderLogo: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=200&q=80',
    city: 'Gurgaon',
    locality: 'Golf Course Road, Gurgaon',
    address: 'DLF 5, Golf Course Road, Sector 42, Gurgaon 122002',
    marketedBy: 'DLF Signature Advisory',
    bhkConfig: '4, 5 BHK Penthouses',
    priceFormatted: '₹ 18.50 Cr - ₹ 35.00 Cr',
    minPrice: 185000000,
    maxPrice: 350000000,
    pricePerSqFt: '₹ 32,500 / sqft',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'
    ],
    status: 'Ready to Move',
    builderId: 'dlf-limited',
    tag: 'Signature Living',
    reraNumber: 'HRERA-GGM-123-2017',
    possessionDate: 'Ready for Immediate Fitouts',
    launchDate: 'March 2018',
    totalAreaAcres: '17.5 Acres',
    totalTowers: 9,
    totalUnits: 429,
    openSpacePercent: '85% Golf Course Greens',
    description: 'DLF The Camellias stands as India’s foremost super-luxury residential community. Overlooking the Arnold Palmer and Gary Player golf courses in DLF 5 Gurgaon, it provides world-class clubhouses, Michelin-grade dining, and bespoke private residences.',
    highlights: [
      'Unobstructed front-row views of 18-hole signature golf course',
      '1.3 lakh sq.ft Clubhouse with 7 international wellness zones',
      'LEED Platinum Certified sustainable construction'
    ],
    amenities: [
      'Super Luxury Clubhouse', 'Heated Indoor & Outdoor Pools', 'Michelin Grade Chef Dining',
      'Helipad Access', 'Pilates & Yoga Studios', 'Private Screening Rooms', '24/7 Butler Services'
    ],
    floorPlans: [
      {
        bhk: '4 BHK Luxury Penthouse',
        type: 'Camellia Royal',
        carpetAreaSqFt: 5800,
        superBuiltUpAreaSqFt: 7400,
        price: '₹ 18.50 Cr',
        priceNum: 185000000,
        image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80'
      }
    ],
    nearbyLandmarks: [
      { name: 'Cyber Hub Gurgaon', distance: '4.5 km (8 mins)', type: 'tech_park' },
      { name: 'IGI International Airport', distance: '16.0 km (20 mins)', type: 'airport' }
    ],
    builderExperience: '75+ Years in Indian Real Estate',
    builderDeliveredProjects: 300
  }
];

export const HOME_TOP_PROJECTS: FeaturedProjectItem[] = [
  {
    id: 'proj-suraksha-enclave',
    name: 'Suraksha Enclave',
    builderName: 'The SMJ Groups',
    builderLogo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=200&q=80',
    city: 'Lucknow',
    locality: 'Raibareli Road, Lucknow',
    address: 'Near SGPGI, Raibareli Road, Lucknow, UP 226014',
    marketedBy: 'Sanskaar Properties',
    bhkConfig: '3, 4 BHK Villas',
    priceFormatted: '₹ 1.28 Cr - ₹ 1.75 Cr',
    minPrice: 12800000,
    maxPrice: 17500000,
    pricePerSqFt: '₹ 6,200 / sqft',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'
    ],
    status: 'Ready to Move',
    tag: 'Township Living',
    reraNumber: 'UPRERAPRJ11245',
    possessionDate: 'Ready for Immediate Possession',
    launchDate: 'February 2021',
    totalAreaAcres: '18 Acres',
    totalTowers: 1,
    totalUnits: 190,
    openSpacePercent: '68% Open Greenery',
    description: 'Suraksha Enclave is a gated villa community nestled right off Raibareli Road near SGPGI Lucknow. Designed with wide 40-foot internal avenues, independent water supply, clubhouse, children’s play gardens, and complete boundary perimeter security.',
    highlights: [
      'Located 5 minutes from SGPGI Medical Campus',
      'Independent simplex and duplex villa architecture',
      'Underground power cabling and LED street lighting',
      'Commercial shopping plaza within the township'
    ],
    amenities: [
      'Township Clubhouse', 'Swimming Pool', 'Badminton Court', 'Kids Play Zone', 'Gated Security 24/7', 'Convenience Store'
    ],
    floorPlans: [
      {
        bhk: '3 BHK Villa',
        type: 'Executive Duplex',
        carpetAreaSqFt: 1550,
        superBuiltUpAreaSqFt: 2050,
        price: '₹ 1.28 Cr',
        priceNum: 12800000,
        image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80'
      },
      {
        bhk: '4 BHK Grand Villa',
        type: 'Corner Luxury Villa',
        carpetAreaSqFt: 2100,
        superBuiltUpAreaSqFt: 2750,
        price: '₹ 1.75 Cr',
        priceNum: 17500000,
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
      }
    ],
    nearbyLandmarks: [
      { name: 'SGPGI Super Specialty Hospital', distance: '2.5 km (5 mins)', type: 'hospital' },
      { name: 'Amar Shaheed Path Raibareli Exit', distance: '4.0 km (7 mins)', type: 'highway' },
      { name: 'Charbagh Railway Station', distance: '10.5 km (18 mins)', type: 'metro' }
    ],
    builderExperience: '18+ Years Building Residential Townships',
    builderDeliveredProjects: 24
  },
  {
    id: 'proj-rishita-manhattan',
    name: 'Rishita Manhattan Towers',
    builderName: 'Rishita Developers',
    builderLogo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=200&q=80',
    city: 'Lucknow',
    locality: 'Amar Shaheed Path, Gomti Nagar Ext',
    address: 'Sector 7, Gomti Nagar Extension, Shaheed Path, Lucknow 226010',
    marketedBy: 'Rishita Sales Desk',
    bhkConfig: '2, 3, 4 BHK Apartments',
    priceFormatted: '₹ 95 Lac - ₹ 2.10 Cr',
    minPrice: 9500000,
    maxPrice: 21000000,
    pricePerSqFt: '₹ 7,100 / sqft',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
    ],
    status: 'Ready to Move',
    tag: 'Sky High Club',
    reraNumber: 'UPRERAPRJ4281',
    possessionDate: 'Ready to Move',
    launchDate: 'May 2019',
    totalAreaAcres: '11.5 Acres',
    totalTowers: 8,
    totalUnits: 980,
    openSpacePercent: '75% Open Greens',
    description: 'Rishita Manhattan brings the iconic Manhattan skyline concept to Gomti Nagar Extension, Lucknow. Features sky-high club lounge, international architectural standards, infinity pool, and direct access onto Amar Shaheed Path.',
    highlights: [
      'Prime location opposite Ekana International Cricket Stadium',
      '30,000 sq.ft Manhattan Club with rooftop lounge',
      'Direct connectivity to Airport and Gomti Nagar CBD'
    ],
    amenities: [
      'Clubhouse', 'Swimming Pool', 'Gym', 'Squash Court', 'Mini Theatre', 'Jogging Track', 'Kids Play Zone'
    ],
    floorPlans: [
      {
        bhk: '2 BHK Smart',
        type: 'Urban Tower Unit',
        carpetAreaSqFt: 980,
        superBuiltUpAreaSqFt: 1320,
        price: '₹ 95 Lac',
        priceNum: 9500000,
        image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80'
      },
      {
        bhk: '3 BHK Premium',
        type: 'Skyline Residence',
        carpetAreaSqFt: 1450,
        superBuiltUpAreaSqFt: 1950,
        price: '₹ 1.45 Cr',
        priceNum: 14500000,
        image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'
      }
    ],
    nearbyLandmarks: [
      { name: 'Ekana International Stadium & Mall', distance: '1.0 km (2 mins)', type: 'mall' },
      { name: 'Phoenix Palassio Mall', distance: '2.5 km (5 mins)', type: 'mall' },
      { name: 'Medanta Hospital', distance: '3.5 km (6 mins)', type: 'hospital' }
    ],
    builderExperience: '16+ Years in Premium High-Rise Construction',
    builderDeliveredProjects: 18
  },
  {
    id: 'proj-brigade-caladium',
    name: 'Brigade Caladium Suites',
    builderName: 'Brigade Group',
    builderLogo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=200&q=80',
    city: 'Bangalore',
    locality: 'Hebbal, Bangalore',
    address: 'Outer Ring Road, Hebbal, Bangalore 560024',
    marketedBy: 'Brigade Prime Connect',
    bhkConfig: '3, 4 BHK Luxury Residences',
    priceFormatted: '₹ 3.10 Cr - ₹ 5.20 Cr',
    minPrice: 31000000,
    maxPrice: 52000000,
    pricePerSqFt: '₹ 12,800 / sqft',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'
    ],
    status: 'Ready to Move',
    tag: 'Rooftop Water Lounge',
    reraNumber: 'PRM/KA/RERA/1251/309/PR/171014/000412',
    possessionDate: 'Ready to Move',
    launchDate: 'June 2020',
    totalAreaAcres: '4.5 Acres',
    totalTowers: 2,
    totalUnits: 120,
    openSpacePercent: '75% Open',
    description: 'Brigade Caladium is an exclusive boutique residential high-rise with water-droplet architectural geometry in Hebbal, North Bangalore. Offers rooftop infinity swimming pool and uninterrupted panoramic vistas of Hebbal Lake.',
    highlights: [
      'Hebbal Lake facing luxury high-rise residences',
      'Rooftop water lounge and temperature-controlled infinity pool',
      'Rapid 25-minute direct signal-free highway drive to Kempegowda Airport'
    ],
    amenities: [
      'Rooftop Infinity Pool', 'Boutique Clubhouse', 'Gym & Aerobics', 'Lakeview Observatory Lounge', '24/7 Security'
    ],
    floorPlans: [
      {
        bhk: '3 BHK Suite',
        type: 'Lakeview Droplet',
        carpetAreaSqFt: 2150,
        superBuiltUpAreaSqFt: 2850,
        price: '₹ 3.10 Cr',
        priceNum: 31000000,
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
      }
    ],
    nearbyLandmarks: [
      { name: 'Manyata Tech Park', distance: '3.5 km (8 mins)', type: 'tech_park' },
      { name: 'Kempegowda International Airport', distance: '26 km (25 mins)', type: 'airport' }
    ],
    builderExperience: '37+ Years of Real Estate Excellence',
    builderDeliveredProjects: 270
  },
  {
    id: 'proj-lodha-bellissimo',
    name: 'Lodha Bellissimo Sky Villas',
    builderName: 'Lodha Group',
    builderLogo: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=200&q=80',
    city: 'Mumbai',
    locality: 'Mahalaxmi, Mumbai',
    address: 'N M Joshi Marg, Mahalaxmi, Mumbai 400011',
    marketedBy: 'Lodha Direct Channel',
    bhkConfig: '3, 4 BHK Sea View Homes',
    priceFormatted: '₹ 7.25 Cr - ₹ 14.50 Cr',
    minPrice: 72500000,
    maxPrice: 145000000,
    pricePerSqFt: '₹ 42,000 / sqft',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80'
    ],
    status: 'Ready to Move',
    tag: 'Iconic Skyline',
    reraNumber: 'P51900000128',
    possessionDate: 'Ready to Move',
    launchDate: 'April 2019',
    totalAreaAcres: '7.5 Acres',
    totalTowers: 2,
    totalUnits: 240,
    openSpacePercent: '80% Sea Breeze Greenery',
    description: 'Lodha Bellissimo is one of South Mumbai’s celebrated architectural marvels. Situated in Mahalaxmi, it provides mesmerizing views of the Mahalaxmi Racecourse and the Arabian Sea.',
    highlights: [
      'Panoramic Arabian Sea and Mahalaxmi Racecourse views',
      'Grand residential pavilions designed by world-renowned architects',
      'Full private clubhouse with 5-star concierge hospitality'
    ],
    amenities: [
      'Grand Clubhouse', 'Sea Facing Swimming Pool', 'Tennis Court', 'Squash Arena', 'Private Theatre', 'Spa'
    ],
    floorPlans: [
      {
        bhk: '3 BHK Sea View',
        type: 'Ocean Suite',
        carpetAreaSqFt: 1850,
        superBuiltUpAreaSqFt: 2500,
        price: '₹ 7.25 Cr',
        priceNum: 72500000,
        image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'
      }
    ],
    nearbyLandmarks: [
      { name: 'Mahalaxmi Race Course', distance: '1.2 km (4 mins)', type: 'mall' },
      { name: 'Bandra-Worli Sea Link', distance: '4.0 km (10 mins)', type: 'highway' }
    ],
    builderExperience: '44+ Years of Real Estate Leadership',
    builderDeliveredProjects: 320
  }
];

// 2. PREFERRED AGENTS DATA
export const HOME_PREFERRED_AGENTS: PreferredAgentItem[] = [
  {
    id: 'agent-ved-prakash',
    name: 'Ved Prakash Mishra',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
    badge: 'BayBayt Preferred',
    agencyName: 'Lumero House Private Limited',
    agencyLogo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=200&q=80',
    operatingSince: 2014,
    experienceYears: 12,
    buyersServed: '100+',
    propertiesForSaleCount: 111,
    propertiesForRentCount: 38,
    city: 'Lucknow',
    rating: 4.9,
    phone: '+91 94150 78901',
    email: 'ved.mishra@lumerohouse.com',
    reraId: 'UPRERAAGT12984',
    address: '402, Shalimar Titanium, Vibhuti Khand, Gomti Nagar, Lucknow, UP 226010',
    about: 'Ved Prakash Mishra is a premier real estate consultant in Lucknow with over 12 years of experience specializing in luxury villas, residential high-rises, and prime commercial plots across Gomti Nagar, Amar Shaheed Path, and Sushant Golf City.',
    specializations: ['Luxury Villas', 'High-Rise Apartments', 'Commercial Retail', 'Gated Townships'],
    areasServed: ['Gomti Nagar', 'Gomti Nagar Extension', 'Amar Shaheed Path', 'Sushant Golf City', 'Mahanagar', 'Vibhuti Khand'],
    languages: ['Hindi', 'English'],
    verifiedDocuments: ['RERA Agent Registration Certificate', 'GST Identification Number', 'Identity Verification', 'Agency Ownership Deed'],
    reviews: [
      {
        id: 'rev-1',
        author: 'Dr. Alok Srivastava',
        rating: 5,
        date: '2 weeks ago',
        comment: 'Ved Prakash helped us find our dream 3 BHK in Shalimar Grand. His pricing transparency, legal paperwork support, and negotiation assistance was top-notch.',
        propertyType: '3 BHK Luxury Apartment'
      },
      {
        id: 'rev-2',
        author: 'Suman Verma',
        rating: 5,
        date: '1 month ago',
        comment: 'Very professional, polite and punctual. Guided us with verified RERA documentation and loan processing in 5 days!',
        propertyType: 'Independent Villa'
      },
      {
        id: 'rev-3',
        author: 'Ravi Teja (NRI Buyer)',
        rating: 4.8,
        date: '3 months ago',
        comment: 'Coordinated video walkthroughs and legal verification seamlessly while I was in Singapore. Highly trustworthy agent.',
        propertyType: 'Plot Investment'
      }
    ]
  },
  {
    id: 'agent-ashwini-tiwari',
    name: 'Ashwini Tiwari',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    badge: 'BayBayt Preferred',
    agencyName: 'Vedara Properties',
    agencyLogo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=200&q=80',
    operatingSince: 2020,
    experienceYears: 6,
    buyersServed: '500+',
    propertiesForSaleCount: 64,
    propertiesForRentCount: 22,
    city: 'Lucknow',
    rating: 4.8,
    phone: '+91 94150 44556',
    email: 'ashwini@vedaraproperties.in',
    reraId: 'UPRERAAGT44812',
    address: 'G-12, Cyber Heights, Vibhuti Khand, Gomti Nagar, Lucknow',
    about: 'Ashwini Tiwari leads Vedara Properties, helping families and investors find verified residential flats, penthouses, and rental properties direct from owners on selected mandates.',
    specializations: ['Ready-to-Move Flats', 'Resale Portfolios', 'Rental Management', 'Plot Layouts'],
    areasServed: ['Gomti Nagar Ext', 'Indira Nagar', 'Faizabad Road', 'Jankipuram', 'Aliganj'],
    languages: ['Hindi', 'English'],
    verifiedDocuments: ['RERA Agent Certificate', 'Background Verification Checked'],
    reviews: [
      {
        id: 'rev-4',
        author: 'Pooja Agarwal',
        rating: 5,
        date: '3 weeks ago',
        comment: 'Ashwini was extremely helpful in arranging quick site visits and finding a verified 2 BHK on Shaheed Path directly from the owner.',
        propertyType: '2 BHK Apartment'
      }
    ]
  },
  {
    id: 'agent-anoop-shukla',
    name: 'Anoop Shukla',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    badge: 'BayBayt Preferred',
    agencyName: 'Anoop Shukla Realty Hub',
    agencyLogo: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=200&q=80',
    operatingSince: 2011,
    experienceYears: 15,
    buyersServed: '8000+',
    propertiesForSaleCount: 82,
    propertiesForRentCount: 45,
    city: 'Lucknow',
    rating: 4.9,
    phone: '+91 98390 12345',
    email: 'anoop@shuklarealty.com',
    reraId: 'UPRERAAGT09123',
    address: '105, Rohtas Presidential Arcade, Vibhuti Khand, Lucknow',
    about: 'With 15 years of industry leadership and 8,000+ satisfied clients, Anoop Shukla Realty Hub is synonymous with integrity, accurate market valuations, and exclusive builder partnerships in Uttar Pradesh.',
    specializations: ['Builder Floors', 'Luxury Townships', 'Commercial Showrooms', 'Investment Consulting'],
    areasServed: ['Gomti Nagar', 'Hazratganj', 'Mahanagar', 'Sushant Golf City', 'Raibareli Road'],
    languages: ['Hindi', 'English'],
    verifiedDocuments: ['RERA Registered', 'ISO Certified Real Estate Agency'],
    reviews: [
      {
        id: 'rev-5',
        author: 'Mahesh Chandra',
        rating: 5,
        date: '1 month ago',
        comment: 'Anoop ji has deep knowledge of Lucknow real estate. Saved us 5 lakhs in negotiation for our 4 BHK in Omaxe City.',
        propertyType: '4 BHK Duplex'
      }
    ]
  },
  {
    id: 'agent-akansha',
    name: 'Akansha Srivastava',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    badge: 'BayBayt Preferred',
    agencyName: 'Bhumi Realtors',
    agencyLogo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=200&q=80',
    operatingSince: 2016,
    experienceYears: 10,
    buyersServed: '2500+',
    propertiesForSaleCount: 68,
    propertiesForRentCount: 30,
    city: 'Lucknow',
    rating: 4.9,
    phone: '+91 94151 55667',
    email: 'akansha@bhumirealtors.com',
    reraId: 'UPRERAAGT22301',
    address: 'B-4, Saharaganj Commercial Complex, Hazratganj, Lucknow',
    about: 'Akansha Srivastava is an award-winning real estate advisor in Lucknow dedicated to transparent property advisory, female homebuyer empowerment, and seamless bank loan disbursements.',
    specializations: ['Women Homebuyer Consulting', 'Residential Apartments', 'Villa Portfolios', 'Affordable Housing'],
    areasServed: ['Indira Nagar', 'Hazratganj', 'Gomti Nagar', 'Aliganj', 'Vikas Nagar'],
    languages: ['Hindi', 'English'],
    verifiedDocuments: ['RERA Agent Certified', 'Top Women Entrepreneur in Proptech 2024'],
    reviews: [
      {
        id: 'rev-6',
        author: 'Neelam Gupta',
        rating: 5,
        date: '2 weeks ago',
        comment: 'Akansha made our first home purchase totally stress-free. Very transparent and polite.',
        propertyType: '3 BHK Flat'
      }
    ]
  },
  {
    id: 'agent-rajesh-sharma',
    name: 'Rajesh Sharma',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
    badge: 'BayBayt Preferred',
    agencyName: 'Apex Bangalore Homes',
    agencyLogo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=200&q=80',
    operatingSince: 2012,
    experienceYears: 14,
    buyersServed: '4200+',
    propertiesForSaleCount: 145,
    city: 'Bangalore',
    rating: 4.9,
    phone: '+91 98450 67890',
    email: 'rajesh@apexbangalore.com',
    reraId: 'PRM/KA/RERA/AGT/0029',
    address: '14, 100ft Road, Indiranagar, Bangalore 560038',
    about: 'Rajesh Sharma is a veteran Bangalore real estate consultant specializing in Whitefield, Indiranagar, and Sarjapur Road tech corridor properties.',
    specializations: ['Techie Relocation Suites', 'Luxury Gated Communities', 'Pre-Launch Investments'],
    areasServed: ['Whitefield', 'Indiranagar', 'Sarjapur Road', 'Bellandur', 'HSR Layout'],
    languages: ['Kannada', 'English', 'Hindi']
  },
  {
    id: 'agent-priya-menon',
    name: 'Priya Menon',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    badge: 'BayBayt Preferred',
    agencyName: 'Silicon Valley Realty Desk',
    agencyLogo: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=200&q=80',
    operatingSince: 2015,
    experienceYears: 11,
    buyersServed: '3100+',
    propertiesForSaleCount: 92,
    city: 'Bangalore',
    rating: 4.8,
    phone: '+91 98800 23456',
    email: 'priya@siliconrealty.in',
    reraId: 'PRM/KA/RERA/AGT/0188',
    address: '2nd Floor, Brigade Plaza, Koramangala 5th Block, Bangalore',
    about: 'Specializing in prime Koramangala, HSR Layout, and Electronic City smart homes and high-yield rental properties.',
    specializations: ['NRI Advisory', 'Penthouse Collections', 'Smart Villas'],
    areasServed: ['Koramangala', 'HSR Layout', 'Electronic City', 'JP Nagar'],
    languages: ['English', 'Malayalam', 'Hindi', 'Tamil']
  },
  {
    id: 'agent-vikram-malhotra',
    name: 'Vikram Malhotra',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    badge: 'BayBayt Preferred',
    agencyName: 'NCR Prime Estates',
    agencyLogo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=200&q=80',
    operatingSince: 2008,
    experienceYears: 18,
    buyersServed: '9500+',
    propertiesForSaleCount: 178,
    city: 'Gurgaon',
    rating: 5.0,
    phone: '+91 98100 88990',
    email: 'vikram@ncrprime.com',
    reraId: 'HRERA-AGT-9018',
    address: 'Level 5, DLF Horizon Center, Golf Course Road, Gurgaon 122002',
    about: 'Vikram Malhotra is NCR’s distinguished luxury estate consultant with top developer syndications on Golf Course Road, Dwarka Expressway, and Greater Noida.',
    specializations: ['Golf Course Luxury', 'Ultra HNI Portfolios', 'Commercial REITs'],
    areasServed: ['Golf Course Road', 'Golf Course Ext', 'Dwarka Expressway', 'Sector 62 Noida', 'Greater Noida'],
    languages: ['English', 'Hindi', 'Punjabi']
  },
  {
    id: 'agent-sameer-merchant',
    name: 'Sameer Merchant',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    badge: 'BayBayt Preferred',
    agencyName: 'South Bombay Luxury Portfolios',
    agencyLogo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=200&q=80',
    operatingSince: 2010,
    experienceYears: 16,
    buyersServed: '6000+',
    propertiesForSaleCount: 120,
    city: 'Mumbai',
    rating: 4.9,
    phone: '+91 98200 11223',
    email: 'sameer@southbombayrealty.com',
    reraId: 'MAHARERA-AGT-00912',
    address: 'One BKC, G Block, Bandra Kurla Complex, Mumbai 400051',
    about: 'Specialist in South Mumbai and Bandra sea-facing luxury apartments, penthouses, and heritage bungalows.',
    specializations: ['Sea Facing High Rises', 'Bandra Luxe', 'BKC Corporate Housing'],
    areasServed: ['Bandra West', 'Worli', 'Mahalaxmi', 'Juhu', 'Powai'],
    languages: ['English', 'Hindi', 'Gujarati', 'Marathi']
  }
];

// Helper Functions for lookup
export function getAllProjects(): FeaturedProjectItem[] {
  // Combine featured and top projects, avoiding duplicate IDs
  const map = new Map<string, FeaturedProjectItem>();
  HOME_FEATURED_PROJECTS.forEach((p) => map.set(p.id, p));
  HOME_TOP_PROJECTS.forEach((p) => map.set(p.id, p));
  return Array.from(map.values());
}

export function getProjectById(id: string): FeaturedProjectItem | undefined {
  if (!id) return undefined;
  const lower = id.toLowerCase();
  return getAllProjects().find((p) => 
    p.id.toLowerCase() === lower || 
    p.name.toLowerCase().replace(/[^a-z0-9]/g, '-') === lower ||
    p.id.replace('proj-', '') === lower
  );
}

export function getAgentById(id: string): PreferredAgentItem | undefined {
  if (!id) return undefined;
  const lower = id.toLowerCase();
  return HOME_PREFERRED_AGENTS.find((a) => 
    a.id.toLowerCase() === lower || 
    a.name.toLowerCase().replace(/[^a-z0-9]/g, '-') === lower ||
    a.id.replace('agent-', '') === lower
  );
}

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

// 3. POPULAR LOCALITIES DATA WITH PHOTO & PRICE RATE
export const POPULAR_LOCALITIES_TILES: Record<string, PopularLocalityCardItem[]> = {
  'Lucknow': [
    {
      id: 'loc-lko-gomti',
      name: 'Gomti Nagar',
      city: 'Lucknow',
      priceRangeSqFt: '₹ 5,344 - ₹ 40,000 per sqft',
      rating: 4.2,
      reviewsCount: 494,
      thumbnail: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=200&q=80',
      propertiesCount: 1224
    },
    {
      id: 'loc-lko-shaheed-path',
      name: 'Amar Shaheed Path',
      city: 'Lucknow',
      priceRangeSqFt: '₹ 5,105 - ₹ 40,000 per sqft',
      rating: 3.8,
      reviewsCount: 76,
      thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=200&q=80',
      propertiesCount: 634
    },
    {
      id: 'loc-lko-patrakarpuram',
      name: 'Patrakarpuram Crossing',
      city: 'Lucknow',
      priceRangeSqFt: '₹ 12,779 - ₹ 40,000 per sqft',
      rating: 4.7,
      reviewsCount: 8,
      thumbnail: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=200&q=80',
      propertiesCount: 1225
    },
    {
      id: 'loc-lko-sushant-golf',
      name: 'Sushant Golf City',
      city: 'Lucknow',
      priceRangeSqFt: '₹ 4,800 - ₹ 18,500 per sqft',
      rating: 4.5,
      reviewsCount: 182,
      thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=200&q=80',
      propertiesCount: 850
    },
    {
      id: 'loc-lko-indira-nagar',
      name: 'Indira Nagar',
      city: 'Lucknow',
      priceRangeSqFt: '₹ 6,200 - ₹ 22,000 per sqft',
      rating: 4.4,
      reviewsCount: 310,
      thumbnail: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=200&q=80',
      propertiesCount: 720
    }
  ],
  'Bangalore': [
    {
      id: 'loc-blr-whitefield',
      name: 'Whitefield',
      city: 'Bangalore',
      priceRangeSqFt: '₹ 7,800 - ₹ 18,500 per sqft',
      rating: 4.5,
      reviewsCount: 1820,
      thumbnail: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=200&q=80',
      propertiesCount: 3450
    },
    {
      id: 'loc-blr-indiranagar',
      name: 'Indiranagar',
      city: 'Bangalore',
      priceRangeSqFt: '₹ 14,500 - ₹ 35,000 per sqft',
      rating: 4.8,
      reviewsCount: 1250,
      thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=200&q=80',
      propertiesCount: 1420
    },
    {
      id: 'loc-blr-hsr',
      name: 'HSR Layout',
      city: 'Bangalore',
      priceRangeSqFt: '₹ 9,200 - ₹ 24,000 per sqft',
      rating: 4.6,
      reviewsCount: 940,
      thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=200&q=80',
      propertiesCount: 2180
    },
    {
      id: 'loc-blr-sarjapur',
      name: 'Sarjapur Road',
      city: 'Bangalore',
      priceRangeSqFt: '₹ 6,900 - ₹ 16,200 per sqft',
      rating: 4.3,
      reviewsCount: 810,
      thumbnail: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=200&q=80',
      propertiesCount: 2950
    },
    {
      id: 'loc-blr-hebbal',
      name: 'Hebbal',
      city: 'Bangalore',
      priceRangeSqFt: '₹ 8,900 - ₹ 22,500 per sqft',
      rating: 4.4,
      reviewsCount: 620,
      thumbnail: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=200&q=80',
      propertiesCount: 1840
    }
  ],
  'New Delhi': [
    {
      id: 'loc-del-vasant-kunj',
      name: 'Vasant Kunj',
      city: 'New Delhi',
      priceRangeSqFt: '₹ 18,000 - ₹ 45,000 per sqft',
      rating: 4.8,
      reviewsCount: 740,
      thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=200&q=80',
      propertiesCount: 980
    }
  ],
  'Noida': [
    {
      id: 'loc-del-noida-62',
      name: 'Sector 62',
      city: 'Noida',
      priceRangeSqFt: '₹ 7,500 - ₹ 16,800 per sqft',
      rating: 4.4,
      reviewsCount: 980,
      thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=200&q=80',
      propertiesCount: 1950
    }
  ],
  'Gurgaon': [
    {
      id: 'loc-del-golf-course',
      name: 'Golf Course Extension',
      city: 'Gurgaon',
      priceRangeSqFt: '₹ 12,500 - ₹ 32,000 per sqft',
      rating: 4.7,
      reviewsCount: 1450,
      thumbnail: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=200&q=80',
      propertiesCount: 2890
    },
    {
      id: 'loc-del-dwarka-exp',
      name: 'Dwarka Expressway',
      city: 'Gurgaon',
      priceRangeSqFt: '₹ 8,200 - ₹ 19,500 per sqft',
      rating: 4.3,
      reviewsCount: 1120,
      thumbnail: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=200&q=80',
      propertiesCount: 3100
    }
  ],
  'Mumbai': [
    {
      id: 'loc-mum-bandra-w',
      name: 'Bandra West',
      city: 'Mumbai',
      priceRangeSqFt: '₹ 38,000 - ₹ 95,000 per sqft',
      rating: 4.9,
      reviewsCount: 2210,
      thumbnail: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=200&q=80',
      propertiesCount: 1850
    },
    {
      id: 'loc-mum-andheri-w',
      name: 'Andheri West',
      city: 'Mumbai',
      priceRangeSqFt: '₹ 22,000 - ₹ 42,000 per sqft',
      rating: 4.6,
      reviewsCount: 1980,
      thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=200&q=80',
      propertiesCount: 3400
    },
    {
      id: 'loc-mum-powai',
      name: 'Powai',
      city: 'Mumbai',
      priceRangeSqFt: '₹ 24,000 - ₹ 48,000 per sqft',
      rating: 4.7,
      reviewsCount: 1420,
      thumbnail: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=200&q=80',
      propertiesCount: 2200
    },
    {
      id: 'loc-mum-worli',
      name: 'Worli Sea Face',
      city: 'Mumbai',
      priceRangeSqFt: '₹ 45,000 - ₹ 120,000 per sqft',
      rating: 4.9,
      reviewsCount: 890,
      thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=200&q=80',
      propertiesCount: 920
    }
  ]
};

// Fallback localities generator for any selected city
export function getPopularLocalitiesForCity(cityName: string, defaultLocalities: string[] = []): PopularLocalityCardItem[] {
  if (POPULAR_LOCALITIES_TILES[cityName]) {
    return POPULAR_LOCALITIES_TILES[cityName];
  }

  const baseImages = [
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=200&q=80'
  ];

  const locs = defaultLocalities.length > 0 ? defaultLocalities : ['City Center', 'Tech Corridor', 'High Street Central', 'Lake District', 'Greenfield Zone'];
  return locs.map((loc, idx) => ({
    id: `loc-${cityName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${idx}`,
    name: loc,
    city: cityName,
    priceRangeSqFt: `₹ ${5500 + idx * 1200} - ₹ ${18000 + idx * 3500} per sqft`,
    rating: Number((4.2 + (idx % 7) * 0.1).toFixed(1)),
    reviewsCount: 120 + idx * 85,
    thumbnail: baseImages[idx % baseImages.length],
    propertiesCount: 350 + idx * 180
  }));
}
