import { CityInfo } from './types';

export const CITIES_DATA: CityInfo[] = [
  {
    name: 'Mumbai',
    state: 'Maharashtra',
    code: 'MUM',
    popularLocalities: ['Andheri West', 'Bandra West', 'Powai', 'Worli', 'Juhu', 'Thane West', 'Kandivali East', 'Borivali West'],
    avgPricePerSqFt: 22400,
    yoyGrowth: 9.4,
    totalListingsCount: 38420,
    image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Bangalore',
    state: 'Karnataka',
    code: 'BLR',
    popularLocalities: ['Whitefield', 'Indiranagar', 'HSR Layout', 'Sarjapur Road', 'Electronic City', 'Bellandur', 'Hebbal', 'Koramangala'],
    avgPricePerSqFt: 8650,
    yoyGrowth: 14.8,
    totalListingsCount: 42150,
    image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'New Delhi',
    state: 'Delhi',
    code: 'DEL',
    popularLocalities: ['Dwarka', 'Rohini', 'Saket', 'Vasant Kunj', 'Hauz Khas', 'Lajpat Nagar', 'Karol Bagh', 'Janakpuri'],
    avgPricePerSqFt: 12200,
    yoyGrowth: 11.4,
    totalListingsCount: 0,
    image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Noida',
    state: 'Uttar Pradesh',
    code: 'NOI',
    popularLocalities: ['Sector 62', 'Sector 150', 'Sector 137', 'Noida Extension', 'Greater Noida West', 'Sector 76', 'Sector 78', 'Sector 50'],
    avgPricePerSqFt: 8200,
    yoyGrowth: 13.8,
    totalListingsCount: 0,
    image: '',
  },
  {
    name: 'Gurgaon',
    state: 'Haryana',
    code: 'GUR',
    popularLocalities: ['Golf Course Road', 'Golf Course Extension', 'Sohna Road', 'DLF Phase 5', 'Cyber City', 'Sector 56', 'MG Road', 'New Gurgaon'],
    avgPricePerSqFt: 10900,
    yoyGrowth: 12.6,
    totalListingsCount: 0,
    image: '',
  },
  {
    name: 'Hyderabad',
    state: 'Telangana',
    code: 'HYD',
    popularLocalities: ['Gachibowli', 'Hitec City', 'Kondapur', 'Kokapet', 'Madhapur', 'Banjara Hills', 'Jubilee Hills', 'Financial District'],
    avgPricePerSqFt: 7800,
    yoyGrowth: 15.6,
    totalListingsCount: 29800,
    image: 'https://images.unsplash.com/photo-1605146769289-440113cc3d00?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Pune',
    state: 'Maharashtra',
    code: 'PUN',
    popularLocalities: ['Hinjawadi', 'Kharadi', 'Baner', 'Wakad', 'Viman Nagar', 'Koregaon Park', 'Hadapsar', 'Bavdhan'],
    avgPricePerSqFt: 7200,
    yoyGrowth: 10.3,
    totalListingsCount: 31400,
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Chennai',
    state: 'Tamil Nadu',
    code: 'CHE',
    popularLocalities: ['OMR', 'Anna Nagar', 'Velachery', 'Adyar', 'Porur', 'Sholinganallur', 'ECR', 'Guindy'],
    avgPricePerSqFt: 7900,
    yoyGrowth: 8.7,
    totalListingsCount: 21500,
    image: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Kolkata',
    state: 'West Bengal',
    code: 'KOL',
    popularLocalities: ['New Town', 'Salt Lake', 'Rajarhat', 'EM Bypass', 'Ballygunge', 'Alipore', 'Behala', 'Garia'],
    avgPricePerSqFt: 6100,
    yoyGrowth: 7.2,
    totalListingsCount: 18900,
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Ahmedabad',
    state: 'Gujarat',
    code: 'AMD',
    popularLocalities: ['SG Highway', 'Bopal', 'Satellite', 'Prahlad Nagar', 'Gota', 'Shela', 'Thaltej', 'GIFT City'],
    avgPricePerSqFt: 5400,
    yoyGrowth: 11.5,
    totalListingsCount: 16800,
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Lucknow',
    state: 'Uttar Pradesh',
    code: 'LKO',
    popularLocalities: ['Gomti Nagar', 'Amar Shaheed Path', 'Sushant Golf City', 'Hazratganj', 'Indira Nagar', 'Vibhuti Khand', 'Aliganj', 'Faizabad Road'],
    avgPricePerSqFt: 5250,
    yoyGrowth: 13.2,
    totalListingsCount: 14200,
    image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80',
  }
];

// Curated "Popular Cities" shown first in the city selector. Kept static so the
// headline markets always appear even when they have no live inventory yet.
// NCR is split into its real constituent cities (New Delhi / Gurgaon / Noida)
// rather than a single "Delhi / NCR" aggregate.
export const POPULAR_CITY_NAMES: string[] = [
  'Mumbai',
  'Navi Mumbai',
  'Thane',
  'Beyond Thane',
  'Bangalore',
  'New Delhi',
  'Gurgaon',
  'Noida',
  'Hyderabad',
  'Pune',
  'Chennai',
  'Kolkata',
  'Ahmedabad',
  'Jaipur',
  'Indore',
  'Lucknow',
];

// Resolve a city name to a CityInfo. Returns the rich CITIES_DATA entry when one
// exists (case-insensitive), otherwise a minimal object so cities that only live
// in the database (no curated image/localities) still flow through the app and
// persist across reloads. Keep in sync with the city selector + home page init.
export function resolveCityInfo(name: string): CityInfo {
  const trimmed = name.trim();
  const match = CITIES_DATA.find(
    (c) => c.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (match) return match;
  return {
    name: trimmed,
    state: '',
    code: trimmed.slice(0, 3).toUpperCase(),
    popularLocalities: [],
    avgPricePerSqFt: 0,
    yoyGrowth: 0,
    totalListingsCount: 0,
    image: '',
  };
}

// Comprehensive locality lists per city, used to power the Hero search
// autocomplete (MagicBricks-style). The `popularLocalities` above are the small
// curated set shown on tiles/sections; this is the full searchable set so that
// typing any area name surfaces it. Keyed by the exact CityInfo.name. Real
// area names only — kept broad but not exhaustive; live DB localities (from
// approved listings) are merged in at runtime and take precedence.
export const CITY_SEARCH_LOCALITIES: Record<string, string[]> = {
  'Mumbai': [
    'Andheri West', 'Andheri East', 'Bandra West', 'Bandra East', 'Powai', 'Worli', 'Juhu',
    'Thane West', 'Thane East', 'Kandivali East', 'Kandivali West', 'Borivali West', 'Borivali East',
    'Malad West', 'Malad East', 'Goregaon West', 'Goregaon East', 'Dadar', 'Lower Parel',
    'Mulund West', 'Mulund East', 'Chembur', 'Ghatkopar East', 'Ghatkopar West', 'Kurla', 'Vikhroli',
    'Santacruz West', 'Santacruz East', 'Vile Parle', 'Kharghar', 'Vashi', 'Nerul', 'Panvel',
    'Mira Road', 'Bhayandar', 'Dahisar', 'Colaba', 'Marine Drive', 'Byculla', 'Wadala', 'Sion', 'Matunga',
  ],
  'Bangalore': [
    'Whitefield', 'Indiranagar', 'HSR Layout', 'Sarjapur Road', 'Electronic City', 'Bellandur',
    'Hebbal', 'Koramangala', 'Marathahalli', 'BTM Layout', 'JP Nagar', 'Jayanagar', 'Banashankari',
    'Rajajinagar', 'Malleshwaram', 'Yelahanka', 'KR Puram', 'Mahadevapura', 'Varthur', 'Kadugodi',
    'Hoodi', 'Brookefield', 'CV Raman Nagar', 'Domlur', 'Ulsoor', 'MG Road', 'Frazer Town', 'RT Nagar',
    'Vijayanagar', 'Kengeri', 'Banaswadi', 'Horamavu', 'Kaggadasapura', 'Begur', 'Bommanahalli',
    'Hennur', 'Thanisandra', 'Jakkur', 'Devanahalli', 'Nagawara', 'Kanakapura Road',
    'Bannerghatta Road', 'Mysore Road', 'Tumkur Road',
  ],
  'New Delhi': [
    'Dwarka', 'Rohini', 'Pitampura', 'Saket', 'Vasant Vihar', 'Vasant Kunj', 'Hauz Khas',
    'Lajpat Nagar', 'Karol Bagh', 'Janakpuri', 'Rajouri Garden', 'Mayur Vihar', 'Preet Vihar',
    'Patparganj', 'South Extension',
  ],
  'Noida': [
    'Sector 62', 'Sector 150', 'Sector 137', 'Sector 76', 'Sector 78', 'Sector 50', 'Noida Extension',
    'Greater Noida West', 'Indirapuram', 'Vaishali', 'Vasundhara', 'Kaushambi', 'Raj Nagar Extension',
    'Crossings Republik',
  ],
  'Gurgaon': [
    'Golf Course Extension', 'Golf Course Road', 'Dwarka Expressway', 'Cyber City', 'Sohna Road',
    'MG Road', 'Sushant Lok', 'DLF Phase 1', 'DLF Phase 2', 'DLF Phase 3', 'DLF Phase 5', 'Sector 56',
    'New Gurgaon', 'Manesar',
  ],
  'Hyderabad': [
    'Gachibowli', 'Hitec City', 'Kondapur', 'Kokapet', 'Madhapur', 'Banjara Hills', 'Jubilee Hills',
    'Financial District', 'Kukatpally', 'Miyapur', 'Nizampet', 'Manikonda', 'Narsingi', 'Tellapur',
    'Nallagandla', 'KPHB', 'Begumpet', 'Ameerpet', 'Secunderabad', 'Uppal', 'LB Nagar', 'Dilsukhnagar',
    'Kompally', 'Alwal', 'Shamshabad', 'Attapur', 'Mehdipatnam', 'Tolichowki', 'Gopanpally',
    'Nanakramguda', 'Puppalaguda', 'Bachupally', 'Pragathi Nagar', 'Shamirpet', 'Adibatla',
  ],
  'Pune': [
    'Hinjawadi', 'Kharadi', 'Baner', 'Wakad', 'Viman Nagar', 'Koregaon Park', 'Hadapsar', 'Bavdhan',
    'Aundh', 'Balewadi', 'Wagholi', 'Kalyani Nagar', 'Magarpatta', 'Pimpri', 'Chinchwad', 'Ravet',
    'Pimple Saudagar', 'Pimple Nilakh', 'Pimple Gurav', 'Kothrud', 'Warje', 'Katraj', 'Undri',
    'Mohammadwadi', 'NIBM Road', 'Wanowrie', 'Dhanori', 'Lohegaon', 'Yerwada', 'Kondhwa',
    'Sinhagad Road', 'Bibwewadi', 'Tathawade', 'Punawale', 'Moshi', 'Chakan', 'Talegaon',
    'Shivaji Nagar', 'Deccan',
  ],
  'Chennai': [
    'OMR', 'Anna Nagar', 'Velachery', 'Adyar', 'Porur', 'Sholinganallur', 'ECR', 'Guindy', 'T Nagar',
    'Mylapore', 'Nungambakkam', 'Kilpauk', 'Perambur', 'Ambattur', 'Avadi', 'Tambaram', 'Chromepet',
    'Pallavaram', 'Pallikaranai', 'Medavakkam', 'Madipakkam', 'Thoraipakkam', 'Perungudi', 'Navalur',
    'Siruseri', 'Kelambakkam', 'Vadapalani', 'Ashok Nagar', 'KK Nagar', 'Saidapet', 'Thiruvanmiyur',
    'Besant Nagar', 'Egmore', 'Royapettah', 'Mogappair', 'Korattur', 'Poonamallee', 'Red Hills',
  ],
  'Kolkata': [
    'New Town', 'Salt Lake', 'Rajarhat', 'EM Bypass', 'Ballygunge', 'Alipore', 'Behala', 'Garia',
    'Tollygunge', 'Jadavpur', 'Park Street', 'Howrah', 'Dum Dum', 'Baguiati', 'Kestopur', 'Lake Town',
    'Barasat', 'Sonarpur', 'Narendrapur', 'Joka', 'Thakurpukur', 'Barrackpore', 'Shyambazar',
    'Belgharia', 'Dunlop', 'Madhyamgram', 'Santoshpur', 'Kasba', 'Maniktala', 'Beliaghata',
    'Ultadanga', 'Sinthee',
  ],
  'Ahmedabad': [
    'SG Highway', 'Bopal', 'Satellite', 'Prahlad Nagar', 'Gota', 'Shela', 'Thaltej', 'GIFT City',
    'Bodakdev', 'Vastrapur', 'Navrangpura', 'Chandkheda', 'Motera', 'Sabarmati', 'Naranpura',
    'Maninagar', 'Nikol', 'Naroda', 'Vastral', 'Bapunagar', 'Vatva', 'Vejalpur', 'Jodhpur', 'Makarba',
    'South Bopal', 'Science City', 'Sola', 'Ghatlodia', 'Ranip', 'Nava Vadaj', 'Paldi', 'Ellisbridge',
    'Ambawadi', 'Isanpur', 'Vasna',
  ],
  'Lucknow': [
    'Gomti Nagar', 'Gomti Nagar Extension', 'Amar Shaheed Path', 'Sushant Golf City', 'Hazratganj',
    'Indira Nagar', 'Vibhuti Khand', 'Aliganj', 'Faizabad Road', 'Alambagh', 'Aminabad', 'Chowk',
    'Rajajipuram', 'Jankipuram', 'Jankipuram Extension', 'Mahanagar', 'Vikas Nagar', 'Kalyanpur',
    'Chinhat', 'Telibagh', 'Raebareli Road', 'Sultanpur Road', 'Jopling Road', 'Ashiyana', 'LDA Colony',
    'Eldeco Udyan', 'Vrindavan Yojana', 'Hussainganj', 'Kapoorthala', 'Nirala Nagar', 'Munshi Pulia',
    'Gudamba', 'IIM Road', 'Sitapur Road', 'Kursi Road', 'Khurram Nagar', 'Vinamra Khand',
    'Vishwas Khand', 'Patrakarpuram', 'Vineet Khand', 'Vijay Khand', 'Viraj Khand',
  ],
};

