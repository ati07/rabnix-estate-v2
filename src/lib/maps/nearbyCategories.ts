/**
 * Amenity categories for the property-detail "nearby places" panel. Each maps to
 * a set of Google Places (New) place types used in Place.searchNearby. Keep the
 * list short and the type sets tight so each category is one cheap request.
 *
 * Reference: Places API (New) table B place types.
 */

export interface NearbyCategory {
  id: string;
  label: string;
  /** lucide-react icon name rendered by the panel. */
  icon: 'GraduationCap' | 'Hospital' | 'UtensilsCrossed' | 'ShoppingCart' | 'TrainFront' | 'Trees';
  /** Google Places (New) included types for this category. */
  types: string[];
}

export const NEARBY_CATEGORIES: NearbyCategory[] = [
  {
    id: 'education',
    label: 'Schools',
    icon: 'GraduationCap',
    types: ['school', 'primary_school', 'secondary_school', 'university'],
  },
  {
    id: 'health',
    label: 'Hospitals',
    icon: 'Hospital',
    types: ['hospital', 'doctor', 'pharmacy'],
  },
  {
    id: 'food',
    label: 'Food & Cafes',
    icon: 'UtensilsCrossed',
    types: ['restaurant', 'cafe'],
  },
  {
    id: 'shopping',
    label: 'Shopping',
    icon: 'ShoppingCart',
    types: ['shopping_mall', 'supermarket', 'grocery_store'],
  },
  {
    id: 'transit',
    label: 'Transit',
    icon: 'TrainFront',
    types: ['subway_station', 'train_station', 'bus_station', 'transit_station'],
  },
  {
    id: 'parks',
    label: 'Parks',
    icon: 'Trees',
    types: ['park'],
  },
];
