/**
 * Country → State → (popular) City dataset powering the cascading location
 * pickers on the post-property flows. India is seeded in full; the other
 * countries carry a minimal starter set so the dropdowns work but can be
 * expanded later. The city list for a state is a curated "popular" set — users
 * can still add any city not listed (validated against this set to avoid
 * duplicates). See `LocationSelect`.
 */

export interface CountryInfo {
  code: string;
  name: string;
}

// Country dropdown order. India first (primary audience); a few majors follow.
export const COUNTRIES: CountryInfo[] = [
  { code: 'IN', name: 'India' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
];

export const DEFAULT_COUNTRY = 'India';

// country name -> state/region name -> popular cities
export const LOCATIONS: Record<string, Record<string, string[]>> = {
  India: {
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Tirupati', 'Kakinada', 'Rajahmundry'],
    'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat'],
    Assam: ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tezpur'],
    Bihar: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga', 'Purnia'],
    Chhattisgarh: ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg'],
    Goa: ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda'],
    Gujarat: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar', 'Bhavnagar', 'Jamnagar'],
    Haryana: ['Gurgaon', 'Faridabad', 'Panipat', 'Ambala', 'Karnal', 'Hisar', 'Rohtak', 'Sonipat'],
    'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Manali'],
    Jharkhand: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Hazaribagh'],
    Karnataka: ['Bangalore', 'Mysore', 'Mangalore', 'Hubli', 'Belgaum', 'Davangere', 'Shimoga'],
    Kerala: ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kannur', 'Kollam', 'Kottayam'],
    'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar'],
    Maharashtra: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane', 'Aurangabad', 'Navi Mumbai', 'Kolhapur'],
    Manipur: ['Imphal', 'Thoubal'],
    Meghalaya: ['Shillong', 'Tura'],
    Mizoram: ['Aizawl', 'Lunglei'],
    Nagaland: ['Kohima', 'Dimapur'],
    Odisha: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri'],
    Punjab: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali'],
    Rajasthan: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner', 'Bhilwara'],
    Sikkim: ['Gangtok', 'Namchi'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Erode', 'Vellore'],
    Telangana: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam'],
    Tripura: ['Agartala', 'Udaipur'],
    'Uttar Pradesh': ['Noida', 'Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Prayagraj', 'Meerut', 'Greater Noida', 'Bareilly'],
    Uttarakhand: ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rishikesh', 'Nainital'],
    'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Darjeeling'],
    // Union Territories with notable real-estate markets
    Delhi: ['New Delhi', 'Dwarka', 'Rohini', 'Saket', 'Pitampura'],
    'Jammu and Kashmir': ['Srinagar', 'Jammu'],
    Chandigarh: ['Chandigarh'],
    Puducherry: ['Puducherry'],
  },
  'United Arab Emirates': {
    Dubai: ['Dubai', 'Jumeirah', 'Business Bay', 'Dubai Marina', 'Deira'],
    'Abu Dhabi': ['Abu Dhabi', 'Al Ain'],
    Sharjah: ['Sharjah'],
  },
  'United States': {
    California: ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Sacramento'],
    'New York': ['New York City', 'Buffalo', 'Rochester'],
    Texas: ['Houston', 'Dallas', 'Austin', 'San Antonio'],
    Florida: ['Miami', 'Orlando', 'Tampa', 'Jacksonville'],
  },
  'United Kingdom': {
    England: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool'],
    Scotland: ['Edinburgh', 'Glasgow', 'Aberdeen'],
    Wales: ['Cardiff', 'Swansea'],
  },
};

/** Country names in dropdown order. */
export function getCountryNames(): string[] {
  return COUNTRIES.map((c) => c.name);
}

/** States/regions for a country, alphabetically. */
export function getStates(country: string): string[] {
  const states = LOCATIONS[country];
  if (!states) return [];
  return Object.keys(states).sort((a, b) => a.localeCompare(b));
}

/** Popular cities for a state, alphabetically. */
export function getCities(country: string, state: string): string[] {
  const cities = LOCATIONS[country]?.[state];
  if (!cities) return [];
  return [...cities].sort((a, b) => a.localeCompare(b));
}

/**
 * Case-insensitive lookup of a city within a state. Returns the canonical
 * spelling from the dataset if it already exists, else null. Used to prevent
 * duplicate entries when a user adds a city that's really already listed
 * (e.g. "noida" → "Noida").
 */
export function findCityInState(country: string, state: string, city: string): string | null {
  const needle = city.trim().toLowerCase();
  if (!needle) return null;
  const cities = LOCATIONS[country]?.[state] || [];
  return cities.find((c) => c.toLowerCase() === needle) ?? null;
}

/**
 * Best-effort reverse lookup: find the state (and country) that already lists a
 * given city. Lets the existing flows backfill state/country from a legacy
 * city-only value. Searches India first.
 */
export function findStateForCity(city: string): { country: string; state: string } | null {
  const needle = city.trim().toLowerCase();
  if (!needle) return null;
  for (const country of Object.keys(LOCATIONS)) {
    for (const [state, cities] of Object.entries(LOCATIONS[country])) {
      if (cities.some((c) => c.toLowerCase() === needle)) {
        return { country, state };
      }
    }
  }
  return null;
}

/** Title-case a user-typed city for consistent storage ("new  town" → "New Town"). */
export function normalizeCityName(city: string): string {
  return city
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ');
}
