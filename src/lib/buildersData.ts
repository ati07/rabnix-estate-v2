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

export const BUILDERS_DATA: Builder[] = [
  {
    id: 'godrej-properties',
    name: 'Godrej Properties',
    slug: 'godrej-properties',
    logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
    tagline: '90+ years of trust, eco-friendly luxury townships & smart green architectures',
    badge: 'RERA Certified A+',
    experienceYears: 34,
    experienceText: '34 Years Experience',
    establishedYear: 1990,
    projectsDeliveredCount: 124,
    projectsDeliveredText: '124+ Delivered',
    ongoingProjectsCount: 38,
    ongoingProjectsText: '38 Active Projects',
    totalSqFtDelivered: '48 Million Sq.Ft',
    rating: 4.9,
    reviewsCount: 1420,
    headquarters: 'Mumbai, Maharashtra',
    reraRegistrationNumber: 'RERA-IND-GP-0091',
    citiesPresent: ['New Delhi', 'Mumbai', 'Bangalore', 'Pune', 'Kolkata', 'Ahmedabad'],
    about: 'Godrej Properties brings the Godrej Group philosophy of innovation, sustainability, and excellence to the real estate industry. Each Godrej Properties development combines a 127-year legacy of excellence and trust with cutting-edge design and technology.',
    specialties: ['Sustainable Green Buildings', 'Luxury Urban Townships', 'Smart Integrated Living', 'Zero-Waste Landscapes'],
    awards: ['Real Estate Company of the Year - Construction Week India', 'Golden Peacock National Quality Award', 'Most Trusted Real Estate Brand 2025'],
    contactPhone: '+91 1800 258 2588',
    contactEmail: 'sales@godrejproperties-desk.in',
    website: 'https://www.godrejproperties.com',
    projects: [
      {
        id: 'godrej-woods',
        name: 'Godrej Woods',
        tagline: 'Nestled in an urban forest with 600+ mature trees & grand clubhouse',
        builderId: 'godrej-properties',
        builderName: 'Godrej Properties',
        locality: 'Sector 62 Noida',
        city: 'New Delhi',
        status: 'Ready to Move',
        priceRangeFormatted: '₹2.45 Cr - ₹4.80 Cr',
        minPrice: 24500000,
        maxPrice: 48000000,
        bhkOptions: ['2 BHK', '3 BHK', '4 BHK'],
        carpetAreaRange: '1,250 - 2,450 sq.ft',
        reraId: 'UPRERAPRJ7047',
        completionDate: 'Ready (Immediate Possession)',
        coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
        galleryImages: [
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80'
        ],
        totalUnits: '550 Luxury Residences',
        totalTowers: '8 Towers (G+32)',
        highlights: [
          'Dense urban forest theme with 600+ grown trees',
          '40,000 sq.ft luxury clubhouse with heated indoor pool',
          'Walking distance from Noida Electronic City Metro',
          'Triple-level basements with dedicated EV fast chargers'
        ],
        amenities: [
          'Infinity Swimming Pool',
          'TechnoGym Fitness Center',
          'Squash & Badminton Courts',
          'Forest Cafe & Open Air Amphitheatre',
          '24/7 Multi-Tier Security with Biometrics'
        ],
        associatedPropertyIds: ['mb-prop-101']
      },
      {
        id: 'godrej-splendour',
        name: 'Godrej Splendour',
        tagline: 'Futuristic lifestyle community on Belathur Main Road, Whitefield',
        builderId: 'godrej-properties',
        builderName: 'Godrej Properties',
        locality: 'Whitefield',
        city: 'Bangalore',
        status: 'Under Construction',
        priceRangeFormatted: '₹85 Lac - ₹1.65 Cr',
        minPrice: 8500000,
        maxPrice: 16500000,
        bhkOptions: ['1 BHK', '2 BHK', '3 BHK'],
        carpetAreaRange: '605 - 1,234 sq.ft',
        reraId: 'PRM/KA/RERA/1251/446/PR/220601/004952',
        completionDate: 'Dec 2026',
        coverImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80',
        galleryImages: [
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
        ],
        totalUnits: '1,160 Tech-Savvy Apartments',
        totalTowers: '9 Towers (27 Floors)',
        highlights: [
          'Adjacent to upcoming Purple Line Metro Extension',
          '8.8 acres of lush green master planned landscape',
          '100+ native plants and dedicated Miyawaki forest',
          'Proximity to ITPL & EPIP Zone tech hubs'
        ],
        amenities: [
          '2 Mega Clubhouses (65,000 sq.ft)',
          'Co-working Lounges with Hi-Speed Wi-Fi',
          'Cricket Net Practice Pitch',
          'Olympic Length Pool',
          'Pharmacy & Organic Grocery store on site'
        ]
      },
      {
        id: 'godrej-horizon',
        name: 'Godrej Horizon',
        tagline: '5-acre high-rise landmark with 5 storeys of luxury lifestyle podiums in Wadala',
        builderId: 'godrej-properties',
        builderName: 'Godrej Properties',
        locality: 'Wadala West',
        city: 'Mumbai',
        status: 'New Launch',
        priceRangeFormatted: '₹3.10 Cr - ₹6.50 Cr',
        minPrice: 31000000,
        maxPrice: 65000000,
        bhkOptions: ['2 BHK', '3 BHK'],
        carpetAreaRange: '740 - 1,480 sq.ft',
        reraId: 'P51900034851',
        completionDate: 'June 2028',
        coverImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80',
        galleryImages: [
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
        ],
        totalUnits: '420 Signature Residences',
        totalTowers: '3 Towers (44 Floors)',
        highlights: [
          'Overlooking Eastern Freeway & Mumbai Bay',
          '15 mins drive from Bandra Kurla Complex (BKC)',
          '5-storey active recreational podium deck',
          'Sky lounge with stargazing telescope'
        ],
        amenities: [
          'Rooftop Observatory & Sky Deck',
          'Temperature-Controlled Indoor Pool',
          'Private Mini Theatre',
          'Electric Vehicle Supercharging Hub'
        ]
      }
    ]
  },
  {
    id: 'prestige-group',
    name: 'Prestige Group',
    slug: 'prestige-group',
    logo: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1600&q=80',
    tagline: 'Leading residential communities, luxury golf villas & Grade-A commercial tech parks',
    badge: 'Platinum Builder',
    experienceYears: 38,
    experienceText: '38 Years Experience',
    establishedYear: 1986,
    projectsDeliveredCount: 205,
    projectsDeliveredText: '205+ Completed',
    ongoingProjectsCount: 45,
    ongoingProjectsText: '45 Ongoing Projects',
    totalSqFtDelivered: '150 Million Sq.Ft',
    rating: 4.9,
    reviewsCount: 1890,
    headquarters: 'Bangalore, Karnataka',
    reraRegistrationNumber: 'RERA-IND-PG-0012',
    citiesPresent: ['Bangalore', 'Hyderabad', 'Chennai', 'Mumbai', 'Goa'],
    about: 'Prestige Group is one of India’s most reliable and diversified real estate conglomerates. Having transformed the skyline of South India with iconic master townships like Prestige Shantiniketan, Prestige Golfshire, and Prestige Lakeside Habitat.',
    specialties: ['Master Planned Enclaves', 'Golf Course Villa Resorts', 'Grade-A Tech Parks', 'Luxury Shopping Malls (Forum)'],
    awards: ['Best Developer South India - CNBC Awaaz Real Estate Awards', 'Excellence in Master Planning - FIABCI Prix d’Excellence'],
    contactPhone: '+91 80 2559 1080',
    contactEmail: 'corporate.sales@prestigeconstructions.com',
    website: 'https://www.prestigeconstructions.com',
    projects: [
      {
        id: 'prestige-lakeside-habitat',
        name: 'Prestige Lakeside Habitat',
        tagline: '102-acre Disney-themed township overlooking pristine Varthur Lake',
        builderId: 'prestige-group',
        builderName: 'Prestige Group',
        locality: 'Whitefield',
        city: 'Bangalore',
        status: 'Ready to Move',
        priceRangeFormatted: '₹1.85 Cr - ₹4.20 Cr',
        minPrice: 18500000,
        maxPrice: 42000000,
        bhkOptions: ['2 BHK', '3 BHK', '4 BHK Villa'],
        carpetAreaRange: '1,216 - 3,100 sq.ft',
        reraId: 'PRM/KA/RERA/1251/446/PR/170915/000176',
        completionDate: 'Ready (Occupancy Certificate Received)',
        coverImage: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1000&q=80',
        galleryImages: [
          'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80'
        ],
        totalUnits: '3,426 Apartments & 271 Luxury Villas',
        totalTowers: '24 Towers & Villa Enclave',
        highlights: [
          '80 acres of open green landscape with Disney fairy-tale statues',
          '4 magnificent independent clubhouses',
          'Direct lakefront promenade and walking boardwalk',
          '5 minutes from ITPL and Outer Ring Road'
        ],
        amenities: [
          '4 Olympic Length Swimming Pools',
          'Tennis, Basketball & Skating Courts',
          'Full-scale Supermarket & Healthcare Pharmacy on site',
          '100% DG Power Backup & Smart Surveillance'
        ],
        associatedPropertyIds: ['mb-prop-103']
      },
      {
        id: 'prestige-high-fields',
        name: 'Prestige High Fields',
        tagline: 'Disney-themed high-rise sanctuary in Hyderabad’s prime Financial District',
        builderId: 'prestige-group',
        builderName: 'Prestige Group',
        locality: 'Financial District, Gachibowli',
        city: 'Hyderabad',
        status: 'Ready to Move',
        priceRangeFormatted: '₹1.40 Cr - ₹3.10 Cr',
        minPrice: 14000000,
        maxPrice: 31000000,
        bhkOptions: ['2 BHK', '3 BHK', '4 BHK'],
        carpetAreaRange: '1,283 - 2,848 sq.ft',
        reraId: 'P02400000021',
        completionDate: 'Ready (Immediate Handover)',
        coverImage: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1000&q=80',
        galleryImages: [
          'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80'
        ],
        totalUnits: '2,240 Residences',
        totalTowers: '10 Towers (33 Floors)',
        highlights: [
          'Located in the heart of Gachibowli Financial District',
          'Walk to Microsoft, Google, Amazon, and Apple campuses',
          '55,000 sq.ft clubhouse with world-class facilities'
        ],
        amenities: [
          'Dual Clubhouses with Heated Pools',
          'Badminton & Squash Courts',
          'Children Splash Park & Crèche',
          'EV Rapid Charging Stations'
        ]
      },
      {
        id: 'prestige-jasdan-classic',
        name: 'Prestige Jasdan Classic',
        tagline: 'Ultra-exclusive South Mumbai sky residences on NM Joshi Marg, Byculla',
        builderId: 'prestige-group',
        builderName: 'Prestige Group',
        locality: 'Byculla / Mahalaxmi',
        city: 'Mumbai',
        status: 'Under Construction',
        priceRangeFormatted: '₹5.20 Cr - ₹12.50 Cr',
        minPrice: 52000000,
        maxPrice: 125000000,
        bhkOptions: ['3 BHK', '4 BHK'],
        carpetAreaRange: '1,250 - 2,800 sq.ft',
        reraId: 'P51900031285',
        completionDate: 'Dec 2026',
        coverImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80',
        galleryImages: [
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
        ],
        totalUnits: '230 Ultra Luxury Suites',
        totalTowers: '2 Towers (45 Floors)',
        highlights: [
          'Unobstructed Arabian Sea & Mahalaxmi Racecourse views',
          'Private elevator foyers for every residence',
          'Bespoke Italian marble and imported fittings'
        ],
        amenities: [
          'Sky Infinity Pool & Sunken Lounges',
          'Private Cigar & Wine Tasting Lounge',
          'Concierge & Chauffeur Services'
        ]
      }
    ]
  },
  {
    id: 'sobha-developers',
    name: 'Sobha Developers',
    slug: 'sobha-developers',
    logo: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1600&q=80',
    tagline: 'German architectural precision, backward integration & flawless zero-delay track record',
    badge: 'Zero Delay Record',
    experienceYears: 29,
    experienceText: '29 Years Experience',
    establishedYear: 1995,
    projectsDeliveredCount: 118,
    projectsDeliveredText: '118+ Projects',
    ongoingProjectsCount: 28,
    ongoingProjectsText: '28 Active Sites',
    totalSqFtDelivered: '62 Million Sq.Ft',
    rating: 4.8,
    reviewsCount: 1210,
    headquarters: 'Bangalore, Karnataka',
    reraRegistrationNumber: 'RERA-IND-SD-0044',
    citiesPresent: ['Bangalore', 'New Delhi', 'Chennai', 'Pune', 'Hyderabad', 'Kochi'],
    about: 'Sobha is India’s only backward integrated real estate company, manufacturing its own concrete blocks, German woodworking doors, architectural metal glazing, and interior craftsmanship. This unmatched precision guarantees 0% quality defects.',
    specialties: ['Backward Integrated Engineering', 'German Quality Standards', 'Precast Concrete Precision', 'Soundproof Acoustic Walls'],
    awards: ['Most Reliable Real Estate Brand of India - Track2Realty Report', 'Best Construction Quality Award - EPC World Awards'],
    contactPhone: '+91 80 4646 4500',
    contactEmail: 'sobha.direct@sobha.com',
    website: 'https://www.sobha.com',
    projects: [
      {
        id: 'sobha-neopolis',
        name: 'Sobha Neopolis',
        tagline: 'Magnificent Greek-architectural themed township in Panathur, Bangalore',
        builderId: 'sobha-developers',
        builderName: 'Sobha Developers',
        locality: 'Panathur / Marathahalli',
        city: 'Bangalore',
        status: 'Under Construction',
        priceRangeFormatted: '₹1.75 Cr - ₹3.80 Cr',
        minPrice: 17500000,
        maxPrice: 38000000,
        bhkOptions: ['3 BHK', '4 BHK'],
        carpetAreaRange: '1,611 - 2,481 sq.ft',
        reraId: 'PRM/KA/RERA/1251/446/PR/200923/006269',
        completionDate: 'Dec 2027',
        coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
        galleryImages: [
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
        ],
        totalUnits: '1,875 Greek Mediterranean Flats',
        totalTowers: '19 Towers (G+18)',
        highlights: [
          'Classical Greek Corinthian columns & Santorini-inspired domes',
          '3 massive themed clubhouses over 77,000 sq.ft',
          'Seamless link to Outer Ring Road and Bellandur IT Corridor'
        ],
        amenities: [
          'Greek Agora Plaza & Dionysus Amphitheatre',
          'Olympic Swimming Pool & Water Aerobics',
          'Indoor Squash, Badminton & Co-Working Hubs'
        ]
      },
      {
        id: 'sobha-city-gurgaon',
        name: 'Sobha City',
        tagline: '39-acre urban park residences on Dwarka Expressway, Gurgaon',
        builderId: 'sobha-developers',
        builderName: 'Sobha Developers',
        locality: 'Sector 108, Dwarka Expressway',
        city: 'New Delhi',
        status: 'Ready to Move',
        priceRangeFormatted: '₹2.10 Cr - ₹4.90 Cr',
        minPrice: 21000000,
        maxPrice: 49000000,
        bhkOptions: ['2 BHK', '3 BHK', '4 BHK'],
        carpetAreaRange: '1,381 - 2,900 sq.ft',
        reraId: '08 OF 2017',
        completionDate: 'Ready (Occupancy Certificate Handed Over)',
        coverImage: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1000&q=80',
        galleryImages: [
          'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80'
        ],
        totalUnits: '1,728 Residences',
        totalTowers: '22 Towers (G+25)',
        highlights: [
          'Direct 15-minute access to IGI Airport Terminal 3',
          '8.5-acre contiguous central park with lakelet',
          'Twin 40,000 sq.ft sports clubhouses'
        ],
        amenities: [
          'Full-size Cricket Ground & FIFA-spec Football field',
          '90m diameter Island Pool',
          'Indoor all-weather heated lap pool'
        ]
      }
    ]
  },
  {
    id: 'dlf-limited',
    name: 'DLF Limited',
    slug: 'dlf-limited',
    logo: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80',
    tagline: 'Pioneers of luxury master-planned living, championship golf resorts & cyber cities',
    badge: 'Iconic Legacy',
    experienceYears: 75,
    experienceText: '75+ Years Experience',
    establishedYear: 1946,
    projectsDeliveredCount: 150,
    projectsDeliveredText: '150+ Landmarks',
    ongoingProjectsCount: 24,
    ongoingProjectsText: '24 Mega Projects',
    totalSqFtDelivered: '220 Million Sq.Ft',
    rating: 4.9,
    reviewsCount: 2150,
    headquarters: 'Gurgaon / New Delhi',
    reraRegistrationNumber: 'RERA-IND-DLF-0001',
    citiesPresent: ['New Delhi', 'Chandigarh', 'Chennai', 'Kolkata', 'Lucknow'],
    about: 'With over 75 years of real estate excellence, DLF has created the modern face of Gurgaon with DLF Cybercity, DLF Phase 1-5, and super-luxury golf developments like The Camellias, The Magnolias, and The Aralias.',
    specialties: ['Super Luxury Penthouses', 'Cyber City Grade-A Office Campuses', 'Arnold Palmer Championship Golf Courses', 'Master Gated Cities'],
    awards: ['Sword of Honour - British Safety Council (17 Consecutive Years)', 'Iconic Real Estate Developer of India - NDTV Property Awards'],
    contactPhone: '+91 124 433 4200',
    contactEmail: 'luxuryresidences@dlf.in',
    website: 'https://www.dlf.in',
    projects: [
      {
        id: 'dlf-the-camellias',
        name: 'The Camellias by DLF',
        tagline: 'India’s most celebrated ultra-luxury address on Golf Course Road, Gurgaon',
        builderId: 'dlf-limited',
        builderName: 'DLF Limited',
        locality: 'Golf Course Road, DLF Phase 5',
        city: 'New Delhi',
        status: 'Ready to Move',
        priceRangeFormatted: '₹35 Cr - ₹85 Cr',
        minPrice: 350000000,
        maxPrice: 850000000,
        bhkOptions: ['4 BHK', '5 BHK', '6 BHK Penthouse'],
        carpetAreaRange: '7,400 - 16,000 sq.ft',
        reraId: 'HRERA-PKL-GGM-1036-2018',
        completionDate: 'Ready (Occupancy Handover Complete)',
        coverImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80',
        galleryImages: [
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
        ],
        totalUnits: '429 Super Luxury Residences',
        totalTowers: '9 Towers (G+38)',
        highlights: [
          '1.3 lakh sq.ft Clubhouse with 7 distinct energy zones',
          'Championship 18-hole Gary Player signature golf course views',
          'Private helipad, golf buggy concierge & Michellin-star dining'
        ],
        amenities: [
          'Indoor Heated Saltwater Pool & Outdoor Lagoon',
          'Full-service Spa by ESPA London',
          'Private Bowling Alley, Golf Simulator & Cigar Room',
          '7-Tier Pentagon-Grade Security and Bomb-Shelter basements'
        ]
      },
      {
        id: 'dlf-one-midtown',
        name: 'DLF One Midtown',
        tagline: 'Luxury high-rises surrounded by 128 acres of preserved green parks in Central Delhi',
        builderId: 'dlf-limited',
        builderName: 'DLF Limited',
        locality: 'Moti Nagar / Shivaji Marg',
        city: 'New Delhi',
        status: 'Under Construction',
        priceRangeFormatted: '₹3.80 Cr - ₹8.50 Cr',
        minPrice: 38000000,
        maxPrice: 85000000,
        bhkOptions: ['2 BHK', '3 BHK', '4 BHK'],
        carpetAreaRange: '1,732 - 3,030 sq.ft',
        reraId: 'DLRERA2021P0007',
        completionDate: 'March 2027',
        coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
        galleryImages: [
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
        ],
        totalUnits: '913 Residences',
        totalTowers: '4 Towers (39 Floors)',
        highlights: [
          '45,000 sq.ft ultra-modern clubhouse',
          'Connected to 3 Delhi Metro lines (Blue, Green, Pink)',
          'Adjacent to 128-acre DDA Green Forest Parkland'
        ],
        amenities: [
          'Dual Swimming Pools & Aqua Gym',
          'Multi-Cuisine Restaurant & Cafe',
          'Professional Tennis, Squash & Badminton'
        ]
      }
    ]
  },
  {
    id: 'brigade-group',
    name: 'Brigade Group',
    slug: 'brigade-group',
    logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1600&q=80',
    tagline: 'Crafting iconic skylines, integrated enclaves & world-class hospitality hubs',
    badge: 'Premier Builder',
    experienceYears: 38,
    experienceText: '38 Years Experience',
    establishedYear: 1986,
    projectsDeliveredCount: 250,
    projectsDeliveredText: '250+ Buildings',
    ongoingProjectsCount: 30,
    ongoingProjectsText: '30 Active Sites',
    totalSqFtDelivered: '80 Million Sq.Ft',
    rating: 4.8,
    reviewsCount: 1350,
    headquarters: 'Bangalore, Karnataka',
    reraRegistrationNumber: 'RERA-IND-BG-0078',
    citiesPresent: ['Bangalore', 'Hyderabad', 'Chennai', 'Mysore', 'Ahmedabad'],
    about: 'Brigade Group has developed landmark integrated townships like Brigade Gateway (home to World Trade Center Bangalore and Orion Mall) and Brigade Metropolis, delivering exceptional commercial, residential, and hospitality spaces.',
    specialties: ['Integrated Smart Cities', 'World Trade Center Licensor', 'Grade-A SEZ Tech Parks', 'Five-Star Hotels (Sheraton, Grand Mercure)'],
    awards: ['Great Place to Work - Top 100 Indian Companies (13 Consecutive Years)', 'Best Developer of the Year - Construction Times'],
    contactPhone: '+91 80 4046 7600',
    contactEmail: 'sales@brigadegroup.com',
    website: 'https://www.brigadegroup.com',
    projects: [
      {
        id: 'brigade-utopia',
        name: 'Brigade Cornerstone Utopia',
        tagline: '47-acre smart integrated township on Varthur Road, Whitefield',
        builderId: 'brigade-group',
        builderName: 'Brigade Group',
        locality: 'Varthur Main Road',
        city: 'Bangalore',
        status: 'Under Construction',
        priceRangeFormatted: '₹95 Lac - ₹2.40 Cr',
        minPrice: 9500000,
        maxPrice: 24000000,
        bhkOptions: ['2 BHK', '3 BHK'],
        carpetAreaRange: '850 - 1,821 sq.ft',
        reraId: 'PRM/KA/RERA/1251/446/PR/181122/002176',
        completionDate: 'Dec 2026',
        coverImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80',
        galleryImages: [
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'
        ],
        totalUnits: '4,000+ Smart Homes & High Street Retail',
        totalTowers: '12 Towers',
        highlights: [
          'Contains Cinepolis Multiplex, High Street Retail, and Grade-A Tech Offices',
          'Biophilic architecture with 80% open landscaped parks',
          'Walking access to international schools & IT parks'
        ],
        amenities: [
          'Multi-Level Clubhouses with Heated Pools',
          'Art Gallery, Co-Working Pods & Sensory Garden',
          'Skateboarding Bowl & Full Size Football Turf'
        ]
      }
    ]
  },
  {
    id: 'lodha-group',
    name: 'Lodha Group (Macrotech)',
    slug: 'lodha-group',
    logo: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80',
    tagline: 'Building India’s finest addresses, world towers & smart green cities',
    badge: 'Master Developer',
    experienceYears: 44,
    experienceText: '44 Years Experience',
    establishedYear: 1980,
    projectsDeliveredCount: 350,
    projectsDeliveredText: '350+ Projects',
    ongoingProjectsCount: 40,
    ongoingProjectsText: '40 Active Projects',
    totalSqFtDelivered: '95 Million Sq.Ft',
    rating: 4.8,
    reviewsCount: 2400,
    headquarters: 'Mumbai, Maharashtra',
    reraRegistrationNumber: 'RERA-IND-LG-0015',
    citiesPresent: ['Mumbai', 'Pune', 'Bangalore', 'London'],
    about: 'Lodha is India’s largest real estate developer by sales bookings. Known for creating globally renowned landmarks like Lodha World Towers (one of the tallest residential towers in India), Lodha Altamount, and India’s first greenfield smart city, Palava.',
    specialties: ['Ultra-Luxury Sky Towers', 'Private Golf Estates', 'Palava Greenfield Smart City', 'Saint Amand 5-Star Hospitality'],
    awards: ['India’s No. 1 Real Estate Developer - Brand Trust Report', 'Global Sustainability Leadership Award'],
    contactPhone: '+91 22 6133 4400',
    contactEmail: 'lodha.residences@lodhagroup.com',
    website: 'https://www.lodhagroup.in',
    projects: [
      {
        id: 'lodha-world-towers',
        name: 'Lodha World Towers',
        tagline: 'Iconic 117-storey curved glass skyscraper in Lower Parel, Mumbai',
        builderId: 'lodha-group',
        builderName: 'Lodha Group (Macrotech)',
        locality: 'Lower Parel / Worli',
        city: 'Mumbai',
        status: 'Ready to Move',
        priceRangeFormatted: '₹12.0 Cr - ₹45.0 Cr',
        minPrice: 120000000,
        maxPrice: 450000000,
        bhkOptions: ['3 BHK', '4 BHK', '5 BHK Duplex'],
        carpetAreaRange: '2,600 - 8,500 sq.ft',
        reraId: 'P51900008345',
        completionDate: 'Ready (Immediate Handover)',
        coverImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80',
        galleryImages: [
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
        ],
        totalUnits: '350 Iconic Residences',
        totalTowers: '3 Towers (117 Floors)',
        highlights: [
          'Architectural marvel designed by Pei Cobb Freed & Partners (Architects of Louvre Pyramid)',
          'Interior design by Armani/Casa with private viewing balconies',
          '7-acre elevated landscaped park by Ken Smith'
        ],
        amenities: [
          'Six Senses Luxury Spa & Fitness Pavilion',
          'Private Cricket Pitch & Heated Infinity Sky Pool',
          'Helipad and Private Chauffeured Rolls-Royce fleet'
        ]
      },
      {
        id: 'lodha-palava-city',
        name: 'Lodha Palava Smart City',
        tagline: '4,500-acre international greenfield smart city in Mumbai MMR',
        builderId: 'lodha-group',
        builderName: 'Lodha Group (Macrotech)',
        locality: 'Dombivli / Kalyan-Shil Road',
        city: 'Mumbai',
        status: 'Ready to Move',
        priceRangeFormatted: '₹45 Lac - ₹1.15 Cr',
        minPrice: 4500000,
        maxPrice: 11500000,
        bhkOptions: ['1 BHK', '2 BHK', '3 BHK'],
        carpetAreaRange: '450 - 1,120 sq.ft',
        reraId: 'P51700000125',
        completionDate: 'Ready (Phase 1 & 2 Handed Over)',
        coverImage: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80',
        galleryImages: [
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80'
        ],
        totalUnits: '35,000+ Happy Families',
        totalTowers: 'Master Planned City',
        highlights: [
          'Includes 2 ICSE schools, Xperia Shopping Mall, and Palava University',
          '100-acre commercial hub providing walk-to-work culture',
          '50,000+ trees with Olympic sports complex'
        ],
        amenities: [
          '9-hole Golf Course & FIFA standard football arena',
          '5 Large Clubhouses & Multiple Swimming Pools',
          'Smart City command center with 24/7 CCTV surveillance'
        ]
      }
    ]
  }
];

export function getBuilderById(id: string): Builder | undefined {
  return BUILDERS_DATA.find((b) => b.id === id || b.slug === id);
}

export function getAllProjects(): BuilderProject[] {
  return BUILDERS_DATA.flatMap((b) => b.projects);
}

export function getProjectById(projectId: string): { project: BuilderProject; builder: Builder } | undefined {
  for (const builder of BUILDERS_DATA) {
    const proj = builder.projects.find((p) => p.id === projectId);
    if (proj) {
      return { project: proj, builder };
    }
  }
  return undefined;
}
