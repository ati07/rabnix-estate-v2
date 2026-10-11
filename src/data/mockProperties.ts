import { Property } from '@/types';

export const INDIAN_CITIES = [
  'All Cities',
  'Bengaluru',
  'Mumbai',
  'Delhi NCR',
  'Hyderabad',
  'Pune',
  'Chennai',
  'Kolkata',
  'Ahmedabad'
];

export const MOCK_PROPERTIES: Property[] = [
  {
    id: 'baybayt-blr-101',
    title: 'Prestige Lakeside Habitat Luxury 3 BHK',
    tagline: 'Lake-facing premium high-rise apartment with panoramic skyline views',
    propertyType: 'apartment',
    listingType: 'buy',
    price: 18500000,
    priceDisplay: '₹1.85 Cr',
    pricePerSqFt: 11212,
    carpetArea: 1650,
    superArea: 2100,
    bedrooms: 3,
    bathrooms: 3,
    balconies: 2,
    furnishing: 'semi-furnished',
    floor: '18th of 29 Floors',
    facing: 'North-East (Vaastu Compliant)',
    ageOfProperty: '1-2 Years (Ready to Move)',
    reraId: 'PRM/KA/RERA/1251/446/PR/170915/000176',
    isVerified: true,
    isDirectOwner: true,
    isFeatured: true,
    location: {
      locality: 'Whitefield - Varthur Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560087',
      landmark: 'Near Forum Shantiniketan & Columbia Asia'
    },
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80'
    ],
    amenities: [
      'Infinity Swimming Pool',
      'Clubhouse (40,000 sq ft)',
      'Tennis & Badminton Courts',
      '24/7 Multi-tier Security',
      '100% Power Backup',
      'EV Vehicle Charging Bay',
      'Jogging & Cycling Track',
      'Kids Play Area'
    ],
    ownerOrAgent: {
      name: 'Dr. Arvind Swaminathan',
      type: 'Owner',
      phone: '+91 98450 21980',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      rating: 4.9,
      responseTime: 'Responds within 10 mins'
    },
    description: 'Direct owner listing! Stunning 3 BHK + Servant room lake-facing corner flat in Prestige Lakeside Habitat. Features Italian marble flooring, modular German kitchen with Hafele fittings, soundproof UPVC windows, and 2 covered basement car parking slots.',
    postedDate: 'Yesterday',
    aiInsights: {
      estimatedFairValue: '₹1.80 Cr – ₹1.92 Cr',
      rentalYield: '4.2% p.a. (₹65,000/mo)',
      predicted5YearAppreciation: '+38.5%',
      demandScore: 94,
      priceRating: 'Fair Price',
      summary: 'High rental demand locality due to upcoming Metro Phase 2 extension and tech park proximity.'
    }
  },
  {
    id: 'baybayt-mum-202',
    title: 'Sea-View Seawoods Grand Central 2 BHK',
    tagline: 'Ultra-modern transit-oriented residence directly connected to station & mall',
    propertyType: 'apartment',
    listingType: 'buy',
    price: 24000000,
    priceDisplay: '₹2.40 Cr',
    pricePerSqFt: 22857,
    carpetArea: 1050,
    superArea: 1380,
    bedrooms: 2,
    bathrooms: 2,
    balconies: 1,
    furnishing: 'furnished',
    floor: '24th of 35 Floors',
    facing: 'West (Arabian Sea Facing)',
    ageOfProperty: '0-1 Year (New Construction)',
    reraId: 'P51700000122',
    isVerified: true,
    isDirectOwner: false,
    isFeatured: true,
    location: {
      locality: 'Seawoods, Navi Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400706',
      landmark: 'Integrated Grand Central Railway Station'
    },
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80'
    ],
    amenities: [
      'Sky Lounge & Observation Deck',
      'Smart Home Automation',
      'World-Class Gym & Spa',
      'Direct Mall Access',
      'Valet Parking',
      'Biometric Door Access'
    ],
    ownerOrAgent: {
      name: 'Rohan Mehta (L&T Realty Partner)',
      type: 'Prime Agent',
      phone: '+91 98200 44319',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      rating: 4.8,
      responseTime: 'Responds within 30 mins'
    },
    description: 'Fully designer-furnished 2 BHK with breathtaking western sea and creek sunset views. Built by L&T with cutting-edge Mivan concrete shuttering. Walking distance to Navi Mumbai International Airport link road.',
    postedDate: '2 days ago',
    aiInsights: {
      estimatedFairValue: '₹2.35 Cr – ₹2.50 Cr',
      rentalYield: '3.8% p.a. (₹72,000/mo)',
      predicted5YearAppreciation: '+42.0%',
      demandScore: 91,
      priceRating: 'Great Deal',
      summary: 'High capital appreciation driven by Navi Mumbai International Airport and Atal Setu (MTHL).'
    }
  },
  {
    id: 'baybayt-hyd-303',
    title: 'My Home Bhooja 4 BHK Signature Sky Villa',
    tagline: 'Palatial 4000 sq ft luxury residence in the heart of HITEC City',
    propertyType: 'villa',
    listingType: 'buy',
    price: 49000000,
    priceDisplay: '₹4.90 Cr',
    pricePerSqFt: 12250,
    carpetArea: 3400,
    superArea: 4000,
    bedrooms: 4,
    bathrooms: 5,
    balconies: 3,
    furnishing: 'furnished',
    floor: '28th of 36 Floors',
    facing: 'East Facing',
    ageOfProperty: '2-3 Years',
    reraId: 'P02400000098',
    isVerified: true,
    isDirectOwner: true,
    isFeatured: true,
    location: {
      locality: 'HITEC City - Knowledge City',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500081',
      landmark: 'Next to ITC Kohenur & Biodiversity Park'
    },
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80'
    ],
    amenities: [
      'Private Elevator Access',
      'Olympic Size Swimming Pool',
      'Squash & Indoor Golf Sim',
      'Private Terrace Garden',
      '3 Dedicated Basement Car Parks',
      'Concierge & Banquet Hall'
    ],
    ownerOrAgent: {
      name: 'Vikram & Sanya Reddy',
      type: 'Owner',
      phone: '+91 99890 11200',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      rating: 5.0,
      responseTime: 'Responds within 5 mins'
    },
    description: 'Rare signature 4 BHK residence in My Home Bhooja overlooking the Biodiversity park and Durgam Cheruvu cable bridge. Custom customized by interior architect with Daikin central VRV AC and imported Italian wardrobes.',
    postedDate: '3 days ago',
    aiInsights: {
      estimatedFairValue: '₹4.75 Cr – ₹5.10 Cr',
      rentalYield: '4.5% p.a. (₹1,85,000/mo)',
      predicted5YearAppreciation: '+46.0%',
      demandScore: 97,
      priceRating: 'Fair Price',
      summary: 'Tier-1 ultra-luxury development with unmatched NRI buyer interest and Fortune 500 leadership tenant profile.'
    }
  },
  {
    id: 'baybayt-del-404',
    title: 'DLF The Crest 3 BHK Golf Course Road',
    tagline: 'Ultra-exclusive residential address with private elevator and club',
    propertyType: 'apartment',
    listingType: 'rent',
    price: 185000,
    priceDisplay: '₹1.85 Lakh / mo',
    carpetArea: 2600,
    superArea: 3100,
    bedrooms: 3,
    bathrooms: 4,
    balconies: 3,
    furnishing: 'furnished',
    floor: '12th of 26 Floors',
    facing: 'North-East',
    ageOfProperty: '3-4 Years',
    reraId: '63 OF 2017',
    isVerified: true,
    isDirectOwner: false,
    isFeatured: false,
    location: {
      locality: 'Sector 54, Golf Course Road',
      city: 'Delhi NCR',
      state: 'Haryana',
      pincode: '122011',
      landmark: 'Opposite DLF Golf and Country Club'
    },
    images: [
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=800&q=80'
    ],
    amenities: [
      'Heated Indoor Pool',
      'Exclusive Resident Lounge',
      'Professional Squash Court',
      'VRV Air Conditioning',
      'Sub-Zero & Wolf Appliances'
    ],
    ownerOrAgent: {
      name: 'Kapil Chawla Estates',
      type: 'Verified Builder',
      phone: '+91 98110 59281',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
      rating: 4.7,
      responseTime: 'Responds within 1 hour'
    },
    description: 'Exquisite 3 BHK fully furnished apartment with imported modular fixtures, wooden flooring in all suites, maid room with separate entrance, and unhindered green views of the Aravalli ridge.',
    postedDate: 'Just now',
    aiInsights: {
      estimatedFairValue: '₹1.75 L – ₹1.95 L / mo',
      rentalYield: '3.6% p.a.',
      predicted5YearAppreciation: '+32.0%',
      demandScore: 89,
      priceRating: 'Fair Price',
      summary: 'Golf Course Road continues to be the premier micro-market for corporate CXO expat leasing.'
    }
  },
  {
    id: 'baybayt-pun-505',
    title: 'Kharadi EON Free Zone 2 BHK Gated Society',
    tagline: 'Modern tech-corridor apartment direct from owner',
    propertyType: 'apartment',
    listingType: 'rent',
    price: 36000,
    priceDisplay: '₹36,000 / mo',
    carpetArea: 840,
    superArea: 1080,
    bedrooms: 2,
    bathrooms: 2,
    balconies: 2,
    furnishing: 'semi-furnished',
    floor: '8th of 18 Floors',
    facing: 'East Facing',
    ageOfProperty: '1 Year',
    reraId: 'P52100021489',
    isVerified: true,
    isDirectOwner: true,
    isFeatured: false,
    location: {
      locality: 'Kharadi IT Park Corridor',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411014',
      landmark: '5 mins to EON Free Zone & World Trade Center'
    },
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80'
    ],
    amenities: [
      'Swimming Pool & Gym',
      'Dedicated Work-From-Home Pods',
      'High Speed Optical Fiber',
      'Covered Car Parking',
      'Piped Natural Gas (PNG)'
    ],
    ownerOrAgent: {
      name: 'Pooja Kulkarni',
      type: 'Owner',
      phone: '+91 97630 89104',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
      rating: 4.9,
      responseTime: 'Responds within 15 mins'
    },
    description: 'Direct from owner! Beautiful sunlit 2 BHK flat available for immediate move-in for IT professionals/families. Equipped with dry balcony, piped gas, geysers, wardrobes, and modular kitchen chimney.',
    postedDate: '4 days ago',
    aiInsights: {
      estimatedFairValue: '₹34,000 – ₹38,000 / mo',
      rentalYield: '5.1% p.a.',
      predicted5YearAppreciation: '+35.0%',
      demandScore: 92,
      priceRating: 'Great Deal',
      summary: 'Exceptional rental yield driven by constant inflow of IT/FinTech workforce at EON & WTC.'
    }
  },
  {
    id: 'baybayt-com-606',
    title: 'Grade-A Commercial IT Office Space in BKC',
    tagline: 'Fully plug-and-play furnished commercial space in Bandra Kurla Complex',
    propertyType: 'commercial',
    listingType: 'commercial',
    price: 650000,
    priceDisplay: '₹6.50 Lakh / mo',
    pricePerSqFt: 185,
    carpetArea: 3500,
    superArea: 4800,
    bedrooms: 0,
    bathrooms: 4,
    furnishing: 'furnished',
    floor: '7th of 14 Floors',
    ageOfProperty: 'Ready to Occupy',
    reraId: 'P51800008432',
    isVerified: true,
    isDirectOwner: false,
    isFeatured: true,
    location: {
      locality: 'Bandra Kurla Complex (BKC) G-Block',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400051',
      landmark: 'Near Mumbai Cricket Association & Jio World Centre'
    },
    images: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80'
    ],
    amenities: [
      '45 Workstations + 3 Executive Cabins',
      '14-Seater Boardroom with Video Conf',
      'Dedicated Server Room with Precision AC',
      '100% DG Power Redundancy',
      'Cafeteria & Breakout Zone',
      '6 Dedicated Reserved Car Parks'
    ],
    ownerOrAgent: {
      name: 'CBRE Certified Corporate Partners',
      type: 'Prime Agent',
      phone: '+91 98201 99201',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80',
      rating: 4.9,
      responseTime: 'Responds within 20 mins'
    },
    description: 'Premium LEED Platinum certified commercial office space in Mumbai’s premier financial hub. Complete acoustic insulation, biometric access gates, high-capacity Otis elevators, and immediate occupation clearance.',
    postedDate: '5 days ago',
    aiInsights: {
      estimatedFairValue: '₹6.20 L – ₹6.80 L / mo',
      rentalYield: '8.4% p.a.',
      predicted5YearAppreciation: '+28.0%',
      demandScore: 96,
      priceRating: 'Fair Price',
      summary: 'Prime financial district real estate with low vacancy rates and institutional grade covenants.'
    }
  },
  {
    id: 'baybayt-pg-707',
    title: 'Zolo Stays Premium Co-Living / PG Koramangala',
    tagline: 'Private & twin sharing suites with daily housekeeping, meals, and 200 Mbps Wi-Fi',
    propertyType: 'pg_coliving',
    listingType: 'pg',
    price: 14500,
    priceDisplay: '₹14,500 / mo',
    carpetArea: 220,
    bedrooms: 1,
    bathrooms: 1,
    furnishing: 'furnished',
    floor: '2nd of 4 Floors',
    ageOfProperty: 'Newly Renovated',
    isVerified: true,
    isDirectOwner: true,
    isFeatured: false,
    location: {
      locality: 'Koramangala 4th Block',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560034',
      landmark: 'Near Sony World Signal & Wipro Park'
    },
    images: [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80'
    ],
    amenities: [
      '3 Times Hygienic Meals Daily',
      'High Speed 200 Mbps Wi-Fi',
      'Smart TV in Lounge',
      'Bi-weekly Professional Laundry',
      'PlayStation & Community Gaming Area',
      'Zero Maintenance Deposit Lock-in'
    ],
    ownerOrAgent: {
      name: 'Ramesh Gowda (Zolo Partner)',
      type: 'Owner',
      phone: '+91 99002 38472',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
      rating: 4.8,
      responseTime: 'Responds immediately'
    },
    description: 'Hassle-free, all-inclusive co-living accommodation for young professionals and startup founders in Bengaluru’s startup capital. Fully air-conditioned, attached bathroom with geyser, and biometric security.',
    postedDate: '1 day ago',
    aiInsights: {
      estimatedFairValue: '₹14,000 – ₹16,000 / mo',
      rentalYield: 'N/A',
      predicted5YearAppreciation: 'N/A',
      demandScore: 98,
      priceRating: 'Great Deal',
      summary: 'Centrally located within 500m of leading cafes, co-working incubators, and gyms.'
    }
  },
  {
    id: 'baybayt-np-808',
    title: 'Godrej Woodsman Estate Phase 2 (New Launch)',
    tagline: 'Forest-themed 2, 3 & 4 BHK apartments with 80% open green landscapes',
    propertyType: 'apartment',
    listingType: 'new_projects',
    price: 13500000,
    priceDisplay: '₹1.35 Cr Onwards',
    pricePerSqFt: 8800,
    carpetArea: 1450,
    superArea: 1900,
    bedrooms: 3,
    bathrooms: 3,
    balconies: 2,
    furnishing: 'unfurnished',
    floor: 'Multiple Units Available',
    facing: 'All Options Available',
    ageOfProperty: 'Under Construction (Possession Dec 2026)',
    reraId: 'PRM/KA/RERA/1251/309/PR/220120/004652',
    isVerified: true,
    isDirectOwner: false,
    isFeatured: true,
    location: {
      locality: 'Hebbal - Airport Corridor',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560024',
      landmark: 'Near Manyata Tech Park & Hebbal Flyover'
    },
    images: [
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=800&q=80'
    ],
    amenities: [
      'Forest Canopy Walk & Zen Gardens',
      '3-Tier Clubhouse with Bowling Alley',
      'Organic Hydroponic Farming Deck',
      'EV Supercharging Stations',
      'Olympic Lap Pool & Kids Splash Zone'
    ],
    ownerOrAgent: {
      name: 'Godrej Properties Official Desk',
      type: 'Verified Builder',
      phone: '+91 80 4968 1100',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80',
      rating: 4.9,
      responseTime: 'Responds within 10 mins'
    },
    description: 'Pre-launch bookings open with special flexible 20:80 payment construction-linked plan. 15 minutes drive to Kempegowda International Airport and 5 minutes to Manyata Tech Park.',
    postedDate: 'New Launch Today',
    aiInsights: {
      estimatedFairValue: '₹1.30 Cr – ₹1.45 Cr',
      rentalYield: '4.8% (Estimated at possession)',
      predicted5YearAppreciation: '+48.0%',
      demandScore: 99,
      priceRating: 'Great Deal',
      summary: 'High ROI project supported by Blue Line Metro construction and North Bengaluru aerospace corridor.'
    }
  }
];

export const CITY_MARKET_TRENDS = [
  { month: 'Jan', Bengaluru: 8400, Mumbai: 21500, 'Delhi NCR': 7200, Hyderabad: 7600, Pune: 6800 },
  { month: 'Mar', Bengaluru: 8650, Mumbai: 21800, 'Delhi NCR': 7350, Hyderabad: 7850, Pune: 6950 },
  { month: 'May', Bengaluru: 8900, Mumbai: 22100, 'Delhi NCR': 7500, Hyderabad: 8100, Pune: 7100 },
  { month: 'Jul', Bengaluru: 9200, Mumbai: 22500, 'Delhi NCR': 7700, Hyderabad: 8400, Pune: 7300 },
  { month: 'Sep', Bengaluru: 9550, Mumbai: 22900, 'Delhi NCR': 7900, Hyderabad: 8700, Pune: 7550 },
  { month: 'Nov', Bengaluru: 9950, Mumbai: 23400, 'Delhi NCR': 8150, Hyderabad: 9050, Pune: 7800 },
  { month: 'Jan (Now)', Bengaluru: 10400, Mumbai: 24100, 'Delhi NCR': 8400, Hyderabad: 9450, Pune: 8100 }
];
