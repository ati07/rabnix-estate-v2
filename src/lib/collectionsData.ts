import type { Property } from './types';

export interface CuratedCollection {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  tagColor: string;
  iconName: string;
  heroImage: string;
  badge: string;
  actionText: string;
  overview: string;
  keyHighlights: {
    title: string;
    description: string;
  }[];
  filters: {
    isOwnerOnly?: boolean;
    isVerifiedOnly?: boolean;
    isReraApprovedOnly?: boolean;
    constructionStatus?: 'Ready to Move' | 'Under Construction' | 'New Launch';
    minPrice?: number;
    maxPrice?: number;
    category?: string;
    listingType?: 'buy' | 'rent' | 'commercial' | 'plot' | 'pg';
    bhk?: number[];
  };
  recommendedCities: string[];
  faqs: {
    question: string;
    answer: string;
  }[];
}

export const CURATED_COLLECTIONS: CuratedCollection[] = [
  {
    id: 'owner-direct',
    title: 'Owner Direct Homes',
    subtitle: 'Verified listings posted directly by property owners. Connect with them without middlemen.',
    tag: 'Owner Direct',
    tagColor: 'bg-[#18A67D]',
    iconName: 'CheckCircle2',
    heroImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',
    badge: '100% Owner Direct',
    actionText: 'View Owner Properties',
    overview: 'Speak directly with genuine property owners across major Indian metros. Every listing in this collection has gone through owner identity verification, title document checks, and direct contact validation by our legal team.',
    keyHighlights: [
      {
        title: 'Direct Owner Contact',
        description: 'Connect directly with homeowners and landlords — no middlemen in between.'
      },
      {
        title: 'Direct Video & In-Person Walkthroughs',
        description: 'Schedule site visits directly with owners at times that suit your calendar.'
      },
      {
        title: 'Transparent Negotiation',
        description: 'Discuss pricing, deposit terms, and furnishing items transparently with no middlemen.'
      },
      {
        title: 'Complimentary Legal Agreement Drafts',
        description: 'BayBayt provides standard stamp-paper and e-rental agreements for all direct deals.'
      }
    ],
    filters: {
      isOwnerOnly: true,
      isVerifiedOnly: false
    },
    recommendedCities: ['Bangalore', 'Mumbai', 'New Delhi', 'Pune', 'Hyderabad'],
    faqs: [
      {
        question: 'Are all properties in this collection posted directly by owners?',
        answer: 'Yes! Every property in this collection is listed directly by the individual owner or legal titleholder.'
      },
      {
        question: 'How do I contact the property owner?',
        answer: 'Simply click "Call Owner" or "Send Inquiry" on any listing. You will instantly receive the verified phone number and WhatsApp contact link.'
      }
    ]
  },
  {
    id: 'ready-to-move',
    title: 'Ready-to-Move Residences',
    subtitle: 'Immediate possession apartments with occupancy certificates (OC) and clear titles.',
    tag: 'Immediate Possession',
    tagColor: 'bg-[#0F2A43]',
    iconName: 'ShieldCheck',
    heroImage: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1400&q=80',
    badge: 'OC Received & Approved',
    actionText: 'Explore Ready Homes',
    overview: 'Eliminate construction delays and GST liabilities with fully completed, ready-to-move apartments and villas. All projects feature Occupancy Certificates (OC), physical power and water connections, and functional clubhouse amenities.',
    keyHighlights: [
      {
        title: 'Zero Construction Delay Risk',
        description: 'What you see is what you get. Inspect the exact flat, view, sunlight, and finishes before booking.'
      },
      {
        title: 'No 5% GST Applicable',
        description: 'Completed properties with Occupancy Certificates are exempt from GST, saving you lakhs.'
      },
      {
        title: 'Instant Rental Inflow or Self-Use',
        description: 'Move in immediately after registration or start earning monthly rental returns from day one.'
      },
      {
        title: 'Fully Operational Clubhouses',
        description: 'Enjoy pre-functioning gymnasiums, swimming pools, tennis courts, and security systems.'
      }
    ],
    filters: {
      constructionStatus: 'Ready to Move'
    },
    recommendedCities: ['Bangalore', 'New Delhi', 'Mumbai', 'Hyderabad', 'Chennai', 'Pune'],
    faqs: [
      {
        question: 'Do ready-to-move homes require GST payment?',
        answer: 'No. Properties that have received a valid Occupancy Certificate (OC) from the municipal corporation do not attract GST.'
      },
      {
        question: 'Can I get home loans approved quickly for ready homes?',
        answer: 'Yes, ready-to-move homes with OC are pre-approved by leading banks like SBI, HDFC, ICICI, and Axis Bank for fast loan disbursement within 5 to 7 working days.'
      }
    ]
  },
  {
    id: 'luxury-penthouses',
    title: 'Ultra Luxury & Penthouses',
    subtitle: 'Bespoke high-rises with private sky decks, infinity pools, and panoramic city vistas.',
    tag: 'Signature Living',
    tagColor: 'bg-amber-600',
    iconName: 'Crown',
    heroImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=80',
    badge: 'Curated HNI Portfolios',
    actionText: 'View Luxury Portfolios',
    overview: 'Discover architectural masterworks designed for elite connoisseurs. From sea-facing duplex penthouses in South Mumbai to sprawling lakefront villas in Bangalore and golf course estates in Gurgaon.',
    keyHighlights: [
      {
        title: 'Private Sky Decks & Plunge Pools',
        description: 'Unobstructed 270-degree skyline and sea views with expansive outdoor entertainment terraces.'
      },
      {
        title: 'Private Elevators & Biometric Access',
        description: 'Direct keyless elevator access opening exclusively into your private entrance foyer.'
      },
      {
        title: 'Italian Marble & Smart Home Automation',
        description: 'Integrated VRV climate controls, Lutron mood lighting, and automated floor-to-ceiling glass facades.'
      },
      {
        title: '7-Star Concierge & Valet Service',
        description: 'Dedicated concierge, temperature-controlled wine cellars, cigar lounges, and private helipads.'
      }
    ],
    filters: {
      minPrice: 20000000
    },
    recommendedCities: ['Mumbai', 'New Delhi', 'Bangalore', 'Hyderabad', 'Goa'],
    faqs: [
      {
        question: 'Does BayBayt provide private confidential showings?',
        answer: 'Yes, our Luxury Portfolio Managers provide discreet, NDA-protected private viewing sessions and dedicated legal consultation.'
      }
    ]
  },
  {
    id: 'budget-homes',
    title: 'Budget Homes under ₹50 Lac',
    subtitle: 'Pocket-friendly 1 & 2 BHK flats in high-growth corridors with excellent connectivity.',
    tag: 'High Value',
    tagColor: 'bg-[#0E7C5D]',
    iconName: 'IndianRupee',
    heroImage: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80',
    badge: 'Affordable & High Growth',
    actionText: 'Browse Affordable Homes',
    overview: 'High-quality, affordable urban homes strategically located near upcoming metro corridors, industrial hubs, and IT clusters. Perfect for first-time home buyers and smart rental yield investors.',
    keyHighlights: [
      {
        title: 'Low Down Payment & PMAY Benefits',
        description: 'Eligible for government interest subsidy schemes and flexible construction-linked payment plans.'
      },
      {
        title: 'Proximity to Metro & Public Transit',
        description: 'Reduced daily commute times with walking distance access to rapid transit stations.'
      },
      {
        title: 'Gated Township Amenities',
        description: 'Equipped with 24/7 security, power backup, landscaped jogging tracks, and community halls.'
      },
      {
        title: 'High Rental Demand',
        description: 'Always in high demand by working professionals, ensuring consistent monthly rental yields.'
      }
    ],
    filters: {
      maxPrice: 5000000
    },
    recommendedCities: ['Pune', 'Bangalore', 'Ahmedabad', 'Chennai', 'Kolkata', 'New Delhi'],
    faqs: [
      {
        question: 'What financing options are available for homes under ₹50 Lakhs?',
        answer: 'Most banks and housing finance companies offer home loans covering up to 80% to 90% of the property value, subject to your eligibility. We recommend speaking with your preferred lender for current interest rates and tenure options before you decide.'
      }
    ]
  },
  {
    id: 'gated-villas',
    title: 'Gated Villa Communities & Enclaves',
    subtitle: 'Private duplex residences with personal gardens, clubhouses, and serene leafy environs.',
    tag: 'Private Estates',
    tagColor: 'bg-emerald-700',
    iconName: 'Home',
    heroImage: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1400&q=80',
    badge: 'Independent Living',
    actionText: 'Explore Luxury Villas',
    overview: 'Enjoy the perfect blend of independent land ownership and secure 5-star gated community lifestyle. Sprawling layouts with private backyards, terrace sit-outs, and dedicated servant quarters.',
    keyHighlights: [
      {
        title: '100% Undivided Land Share',
        description: 'Complete ownership of your plot and independent terrace space with future vertical expansion rights.'
      },
      {
        title: 'Private Garden & Car Porch',
        description: 'Dedicated parking for 2 to 4 vehicles and private landscaped green lawns.'
      },
      {
        title: 'Multi-Acre Resort Clubhouses',
        description: 'Access to Olympic swimming pools, indoor squash, badminton courts, and dining cafes.'
      },
      {
        title: 'Multi-Tier Security & Surveillance',
        description: 'Boom barriers, perimeter infrared sensors, and 24/7 patrolling guards.'
      }
    ],
    filters: {
      category: 'Villa'
    },
    recommendedCities: ['Bangalore', 'Hyderabad', 'Chennai', 'New Delhi', 'Lucknow'],
    faqs: [
      {
        question: 'Do these villas come with freehold land titles?',
        answer: 'Yes, all verified villas in this collection have clear, encumbrance-free titles with complete land rights.'
      }
    ]
  },
  {
    id: 'commercial-tech-hubs',
    title: 'Grade-A Commercial & Tech Parks',
    subtitle: 'High-yield office spaces, retail showrooms, and corporate campuses in prime business districts.',
    tag: 'High Rental Yield',
    tagColor: 'bg-blue-700',
    iconName: 'Briefcase',
    heroImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80',
    badge: 'Pre-Leased & Bare Shell',
    actionText: 'Explore Commercial Spaces',
    overview: 'Generate superior passive rental income with Grade-A commercial office floors, tech-park spaces, and high-street retail showrooms pre-leased to Fortune 500 companies and leading Indian banks.',
    keyHighlights: [
      {
        title: 'Attractive 8.5% - 10.5% Cap Rates',
        description: 'Significantly higher recurring cash flow yields compared to standard residential real estate.'
      },
      {
        title: 'Long-term 9-Year Leases',
        description: 'Secure lock-ins with institutional corporate tenants and 15% escalation clauses every 3 years.'
      },
      {
        title: 'LEED Gold & Platinum Certified',
        description: 'Modern glass facades with central chiller air-conditioning, 100% power backup, and EV charging.'
      },
      {
        title: 'Prime CBD & SEZ Locations',
        description: 'Situated in Cyber City Gurgaon, BKC Mumbai, Whitefield Bangalore, and Hitec City Hyderabad.'
      }
    ],
    filters: {
      category: 'Commercial Office',
      listingType: 'commercial'
    },
    recommendedCities: ['Mumbai', 'Bangalore', 'New Delhi', 'Hyderabad', 'Pune'],
    faqs: [
      {
        question: 'What is the minimum investment for Grade-A commercial offices?',
        answer: 'Fractional and small bare-shell office units start from ₹85 Lakhs, while standalone floors and pre-leased assets range from ₹4 Cr to ₹30 Cr.'
      }
    ]
  }
];

export function getCollectionById(id: string): CuratedCollection | undefined {
  return CURATED_COLLECTIONS.find((c) => c.id === id);
}

// Does a property satisfy a collection's saved filter? Mirrors the server-side
// whereFromFilters (api/collections/[id]) so client-side counts and price bands
// match exactly what the collection detail page lists.
export function matchesCollectionFilters(p: Property, f: CuratedCollection['filters']): boolean {
  if (p.verificationStatus && p.verificationStatus !== 'approved') return false;
  if (f.isOwnerOnly && p.postedBy?.type !== 'Owner' && !p.isExclusiveOwner) return false;
  if (f.isVerifiedOnly && !p.isVerified) return false;
  if (f.isReraApprovedOnly && !p.reraApproved) return false;
  if (f.constructionStatus && p.constructionStatus !== f.constructionStatus) return false;
  if (f.category && p.category.toLowerCase() !== f.category.toLowerCase()) return false;
  if (f.listingType && p.listingType !== f.listingType) return false;
  if (Array.isArray(f.bhk) && f.bhk.length && (p.bhk == null || !f.bhk.includes(p.bhk))) return false;
  if (f.minPrice != null && p.price < f.minPrice) return false;
  if (f.maxPrice != null && p.price > f.maxPrice) return false;
  return true;
}

// Real price band for a set of matched listings, using each listing's own
// formatted price. Returns null when there are no matches (caller hides it) so
// we never show a fabricated range.
export function collectionPriceRange(matched: Property[]): string | null {
  if (matched.length === 0) return null;
  let lo = matched[0];
  let hi = matched[0];
  for (const p of matched) {
    if (p.price < lo.price) lo = p;
    if (p.price > hi.price) hi = p;
  }
  return lo.priceFormatted === hi.priceFormatted
    ? lo.priceFormatted
    : `${lo.priceFormatted} - ${hi.priceFormatted}`;
}
