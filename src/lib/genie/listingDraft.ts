import { Type } from '@google/genai';

/**
 * Tier-2 Genie tool: conversational post-a-property. The advisor gathers the
 * core listing details in chat, then this tool normalises them into a draft
 * that the client stashes and uses to PREFILL the /post-property wizard.
 *
 * It deliberately does NOT write to the DB — the user still reviews, adds
 * photos and submits through the normal flow, which enforces auth, listing
 * quota and admin review.
 */

/** sessionStorage key the drawer writes and /post-property reads on mount. */
export const GENIE_LISTING_DRAFT_KEY = 'baybayt:genie-listing-draft';

export interface GenieListingDraft {
  listingType: string;
  commercialListingType?: string;
  category: string;
  city: string;
  locality: string;
  subLocality?: string;
  title?: string;
  bhk?: number;
  bathrooms?: number;
  carpetAreaSqFt?: number;
  price?: number;
  furnishing?: string;
  constructionStatus?: string;
  description?: string;
}

export const draftPropertyListingDeclaration = {
  name: 'draft_property_listing',
  description:
    'Prepare a property listing draft from details the user wants to POST/sell/rent out ' +
    'on BayBayt. Call this once you have gathered at least the listing purpose, category, ' +
    'city, locality and price. The user will then review the pre-filled listing form, add ' +
    'photos and submit it themselves — so do NOT claim the listing is published. After ' +
    'calling, tell the user to tap "Review & publish listing" to finish.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      listingType: {
        type: Type.STRING,
        enum: ['buy', 'rent', 'pg', 'plot', 'commercial'],
        description: 'buy = sell a residential property; rent; pg; plot = sell land; commercial.',
      },
      commercialListingType: {
        type: Type.STRING,
        enum: ['rent', 'sale'],
        description: 'For commercial listings only: rent or sale.',
      },
      category: {
        type: Type.STRING,
        enum: [
          'Apartment', 'Villa', 'Builder Floor', 'Penthouse', 'Studio',
          'Commercial Office', 'Retail Shop', 'Warehouse', 'Commercial Land', 'Residential Plot',
        ],
      },
      city: { type: Type.STRING },
      locality: { type: Type.STRING },
      subLocality: { type: Type.STRING },
      title: { type: Type.STRING, description: 'Short listing headline. If missing, synthesise a sensible one.' },
      bhk: { type: Type.NUMBER },
      bathrooms: { type: Type.NUMBER },
      carpetAreaSqFt: { type: Type.NUMBER },
      price: { type: Type.NUMBER, description: 'Asking price (or monthly rent for rent/pg) in absolute INR.' },
      furnishing: { type: Type.STRING, enum: ['Furnished', 'Semi-Furnished', 'Unfurnished'] },
      constructionStatus: { type: Type.STRING, enum: ['Ready to Move', 'Under Construction', 'New Launch'] },
      description: { type: Type.STRING, description: 'A short, appealing listing description.' },
    },
    required: ['listingType', 'category', 'city', 'locality', 'price'],
  },
} as const;

/** Clean the model args into a safe, typed draft for the client to prefill. */
export function normalizeListingDraft(args: Record<string, unknown>): GenieListingDraft {
  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
  const num = (v: unknown) => (typeof v === 'number' && isFinite(v) && v >= 0 ? v : undefined);

  const listingType = str(args.listingType) || 'buy';
  const draft: GenieListingDraft = {
    listingType,
    category: str(args.category) || 'Apartment',
    city: str(args.city) || '',
    locality: str(args.locality) || '',
  };

  if (listingType === 'commercial') draft.commercialListingType = str(args.commercialListingType) || 'sale';
  const subLocality = str(args.subLocality); if (subLocality) draft.subLocality = subLocality;
  const title = str(args.title); if (title) draft.title = title;
  const bhk = num(args.bhk); if (bhk != null) draft.bhk = bhk;
  const bathrooms = num(args.bathrooms); if (bathrooms != null) draft.bathrooms = bathrooms;
  const carpet = num(args.carpetAreaSqFt); if (carpet != null) draft.carpetAreaSqFt = carpet;
  const price = num(args.price); if (price != null) draft.price = price;
  const furnishing = str(args.furnishing); if (furnishing) draft.furnishing = furnishing;
  const cs = str(args.constructionStatus); if (cs) draft.constructionStatus = cs;
  const description = str(args.description); if (description) draft.description = description;

  return draft;
}
