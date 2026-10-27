import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  searchPropertiesDeclaration,
  runPropertySearch,
  type GeniePropertyCard,
  type PropertySearchArgs,
} from "@/lib/genie/propertySearch";
import { calculateEmiDeclaration, runEmiCalculation, type EmiArgs } from "@/lib/genie/finance";
import { createInquiryDeclaration, runCreateInquiry, type CreateInquiryArgs } from "@/lib/genie/leads";
import { draftPropertyListingDeclaration, normalizeListingDraft, normalizePartialDraft, type GenieListingDraft } from "@/lib/genie/listingDraft";
import { marketInsightsDeclaration, runMarketInsights, type MarketInsightsArgs } from "@/lib/genie/market";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
// Optional comma-separated fallbacks tried (in order) when the primary model is
// overloaded or out of quota, e.g.
// GEMINI_FALLBACK_MODELS="gemini-3.5-flash-lite,gemini-3.8-flash".
const GEMINI_FALLBACK_MODELS = (process.env.GEMINI_FALLBACK_MODELS || '')
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);
// Hard cap on each Gemini HTTP call so an overloaded model can't hang the request.
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 15000);

let genAIInstance: GoogleGenAI | null = null;

function getGenAI() {
  if (!genAIInstance) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    genAIInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        timeout: GEMINI_TIMEOUT_MS,
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIInstance;
}

// Classify a Gemini failure to decide how the fallback chain should react:
//  'retry' — transient server overload/timeout; retry the SAME model after backoff.
//  'next'  — quota/rate-limit exhausted or model unavailable; skip to the NEXT model now
//            (retrying the same model would just fail again / burn time).
//  'fatal' — our fault (bad key, malformed request); stop and surface it.
function classifyGeminiError(err: any): 'retry' | 'next' | 'fatal' {
  const code = Number(err?.status ?? err?.code);
  const msg = (err?.message || '').toString();
  if (code === 429 || /RESOURCE_EXHAUSTED|quota|rate limit/i.test(msg)) return 'next';
  if (code === 404 || /not found|not available|no longer available/i.test(msg)) return 'next';
  if (
    code === 503 ||
    code === 500 ||
    code === 504 ||
    err?.name === 'AbortError' ||
    /UNAVAILABLE|high demand|overloaded|deadline|timeout/i.test(msg)
  ) {
    return 'retry';
  }
  return 'fatal';
}

// Whether the final failure is worth telling the user "busy, try again" (overload
// or quota) rather than a generic error.
function isOverloadedOrQuota(err: any): boolean {
  const code = Number(err?.status ?? err?.code);
  const msg = (err?.message || '').toString();
  return (
    code === 503 || code === 500 || code === 504 || code === 429 ||
    err?.name === 'AbortError' ||
    /UNAVAILABLE|high demand|overloaded|deadline|timeout|RESOURCE_EXHAUSTED|quota|rate limit/i.test(msg)
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Call Gemini across the model chain (primary + fallbacks). Each model gets a
// short retry on transient overload; quota/unavailable jumps straight to the
// next model; our-fault errors throw immediately.
async function generateWithRetry(
  ai: GoogleGenAI,
  params: Omit<Parameters<GoogleGenAI['models']['generateContent']>[0], 'model'>,
  retriesPerModel = 1,
) {
  const models = [GEMINI_MODEL, ...GEMINI_FALLBACK_MODELS.filter((m) => m !== GEMINI_MODEL)];
  let lastErr: any;
  for (const model of models) {
    for (let attempt = 0; attempt <= retriesPerModel; attempt++) {
      try {
        return await ai.models.generateContent({ ...params, model });
      } catch (err) {
        lastErr = err;
        const action = classifyGeminiError(err);
        if (action === 'fatal') throw err;
        if (action === 'next') break; // quota/unavailable — move to the next model now
        if (attempt < retriesPerModel) {
          await sleep(600 * 2 ** attempt); // transient overload — brief backoff, same model
        }
      }
    }
    // this model is exhausted — fall through to the next model in the chain, if any
  }
  throw lastErr;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;
    const ai = getGenAI();

    // Action 1: AI Property Valuation & Fair Market Price Estimator
    if (action === 'valuation') {
      const { city, locality, category, areaSqFt, bhk, furnishing, age } = payload;

      const prompt = `You are BayBayt India's Senior Chief Real Estate Valuer and Market Analyst.
Evaluate fair market pricing, rental yields, and investment forecast for the following Indian property:
- City: ${city || 'Mumbai'}
- Locality: ${locality || 'Central'}
- Category: ${category || 'Apartment'}
- Carpet Area: ${areaSqFt || 1000} sq.ft
- BHK: ${bhk || 2} BHK
- Furnishing: ${furnishing || 'Semi-Furnished'}
- Age: ${age || 'New'}

Provide accurate, realistic Indian real estate valuation metrics with INR figures, yield percentages, market drivers, pros and cons.`;

      const response = await generateWithRetry(ai, {
        contents: prompt,
        config: {
          systemInstruction: 'You are BayBayt AI Property Valuation Engine. Return accurate, data-backed Indian real estate analytics in structured JSON.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              estimatedPriceMin: { type: Type.NUMBER, description: 'Minimum estimated market price in INR total' },
              estimatedPriceMax: { type: Type.NUMBER, description: 'Maximum estimated market price in INR total' },
              fairValueEstimate: { type: Type.NUMBER, description: 'Fair valuation midpoint in INR total' },
              confidenceScore: { type: Type.NUMBER, description: 'Confidence percentage (e.g. 92)' },
              fairPriceSqFt: { type: Type.NUMBER, description: 'Estimated price per sq.ft in INR' },
              estimatedRentalMin: { type: Type.NUMBER, description: 'Minimum monthly rental in INR' },
              estimatedRentalMax: { type: Type.NUMBER, description: 'Maximum monthly rental in INR' },
              rentalYield: { type: Type.NUMBER, description: 'Annual gross rental yield percentage e.g. 4.2' },
              fiveYearAppreciationForecast: { type: Type.NUMBER, description: 'Projected 5-year capital growth percentage e.g. 45' },
              localityGrade: { type: Type.STRING, description: 'Locality Grade e.g. A+ Prime / Tier-1 Tech Corridor' },
              keyDrivers: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Key price driving factors like upcoming metro, IT hubs, infrastructure'
              },
              marketPros: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 strong advantages of investing in this locality/property'
              },
              marketCons: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2 to 3 points of caution or considerations'
              },
              comparableLocalityAverages: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    avgRate: { type: Type.NUMBER }
                  }
                },
                description: '3 nearby localities with their average price per sq.ft'
              },
              summary: { type: Type.STRING, description: 'Executive valuation summary in 2-3 concise sentences' }
            },
            required: [
              'estimatedPriceMin',
              'estimatedPriceMax',
              'fairValueEstimate',
              'fairPriceSqFt',
              'rentalYield',
              'summary',
              'marketPros',
              'marketCons'
            ]
          }
        }
      });

      const responseText = response.text || '{}';
      const parsed = JSON.parse(responseText);
      return NextResponse.json({ success: true, data: parsed });
    }

    // Action: Describe-and-fill — turn an owner's free-text description of their
    // own property into structured listing fields for the /post-property form.
    // Extraction only: unmentioned fields are omitted (never fabricated), so the
    // result can be applied over a form the user has already started.
    if (action === 'extract_listing') {
      const text: string = (payload?.text || '').toString();
      if (!text.trim()) {
        return NextResponse.json({ success: false, error: 'Please describe your property first.' }, { status: 400 });
      }

      const response = await generateWithRetry(ai, {
        contents: `Extract structured BayBayt listing fields from this property owner's description. ` +
          `Only fill a field if the text clearly states or strongly implies it; OMIT anything not mentioned. ` +
          `Do NOT invent a price, area, RERA number, locality or city. Prices are absolute INR ` +
          `(e.g. 8500000; use the monthly amount for rent/pg).\n\nDescription:\n"""${text.trim()}"""`,
        config: {
          systemInstruction:
            'You convert a property owner\'s free-text description into structured listing fields for ' +
            'BayBayt (India). Return JSON only. Never fabricate values that are not present in the text.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              listingType: { type: Type.STRING, enum: ['buy', 'rent', 'pg', 'plot', 'commercial'], description: 'buy = sell residential; rent; pg; plot = sell land; commercial.' },
              commercialListingType: { type: Type.STRING, enum: ['rent', 'sale'], description: 'Commercial listings only.' },
              category: { type: Type.STRING, enum: ['Apartment', 'Villa', 'Builder Floor', 'Penthouse', 'Studio', 'Commercial Office', 'Retail Shop', 'Warehouse', 'Commercial Land', 'Residential Plot'] },
              city: { type: Type.STRING },
              locality: { type: Type.STRING },
              subLocality: { type: Type.STRING },
              title: { type: Type.STRING },
              bhk: { type: Type.NUMBER },
              bathrooms: { type: Type.NUMBER },
              carpetAreaSqFt: { type: Type.NUMBER },
              price: { type: Type.NUMBER, description: 'Asking price, or monthly rent for rent/pg, in absolute INR.' },
              furnishing: { type: Type.STRING, enum: ['Furnished', 'Semi-Furnished', 'Unfurnished'] },
              constructionStatus: { type: Type.STRING, enum: ['Ready to Move', 'Under Construction', 'New Launch'] },
              description: { type: Type.STRING },
            },
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      const draft = normalizePartialDraft(parsed);
      return NextResponse.json({ success: true, draft });
    }

    // Action: Listing copywriter — generate a title + description from the specs
    // the user has already entered. Factual to the given details only; no made-up
    // amenities, prices or RERA numbers, and never a phone number.
    if (action === 'listing_copy') {
      const specs = payload?.specs || {};
      const response = await generateWithRetry(ai, {
        contents: `Write a listing TITLE and DESCRIPTION for this BayBayt property. Be specific and ` +
          `factual to the details provided; do NOT invent amenities, prices, RERA numbers or a phone ` +
          `number.\n\nDetails (JSON):\n${JSON.stringify(specs)}`,
        config: {
          systemInstruction:
            'You are a BayBayt copywriter for Indian real-estate listings. Return JSON { title, description }. ' +
            'Title <= 70 characters, catchy, include the BHK and locality when known. Description 2-4 ' +
            'sentences, factual, appealing, no fabricated claims and no phone numbers.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
            },
            required: ['title', 'description'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return NextResponse.json({
        success: true,
        title: (parsed.title || '').toString(),
        description: (parsed.description || '').toString(),
      });
    }

    // Action 2: BayBayt Genie Chatbot & Real Estate Consultation
    if (action === 'chat') {
      const { userQuery, contextProperty } = payload;
      // Same-origin fetch carries the session cookie, so a signed-in user's
      // inquiries get attributed to their account.
      const currentUser = await getCurrentUser();

      let prompt = `User Query: ${userQuery}\n`;
      if (contextProperty) {
        prompt += `\nCurrently viewed property context:\npropertyId: ${contextProperty.id}\nTitle: ${contextProperty.title}\nCity: ${contextProperty.city}, Locality: ${contextProperty.locality}\nPrice: ${contextProperty.priceFormatted} (${contextProperty.pricePerSqFt} / sq.ft)\nBHK: ${contextProperty.bhk || 'N/A'}, Carpet Area: ${contextProperty.carpetAreaSqFt} sq.ft\nRERA: ${contextProperty.reraId || 'Approved'}\n(Use this propertyId for create_inquiry if the user wants to contact the owner or book a visit for this listing.)\n`;
      }

      const systemInstruction = `You are "BayBayt Genie", the official AI Real Estate Advisor at BayBayt (India's Premier Real Estate & Property Portal).
You help buyers, tenants, sellers, and NRI investors navigate Indian real estate with expertise in:
1. Locality recommendations, price per sq.ft trends across Mumbai, Bangalore, Delhi-NCR, Hyderabad, Pune, Chennai, etc.
2. Home Loans, interest rates (Repo-linked lending rates), Section 80C and Section 24(b) tax deductions.
3. RERA regulations, carpet area vs super built-up calculations, encumbrance certificates, title verification.
4. Stamp duty & registration charges by state (Maharashtra, Karnataka, Delhi, Telangana, etc.).
5. Rental agreements, security deposit norms, and negotiation tactics.

INVENTORY RULES (critical):
- When the user wants to find, show, browse, compare, or count ACTUAL properties on BayBayt, you MUST call the search_properties tool. Never invent listings, prices, or RERA numbers.
- The listing cards are rendered in the UI from the tool result, so do NOT repeat every listing in prose — briefly summarise what you found (e.g. how many, price range, standout options) and invite the user to tap a card.
- If the tool returns zero results, say so honestly and suggest widening the budget/area or a nearby locality. Do not fabricate alternatives.
- Never share owner/agent phone numbers; tell users to tap a listing and use "Get Owner Contact" to reveal it.

LOAN / EMI RULES:
- For any EMI, affordability, or "how much can I borrow" question, call the calculate_emi tool — never compute EMI yourself. Present the EMI, total interest, and (if income was given) the eligibility verdict clearly.

BOOKING / LEAD RULES:
- If the user wants to contact the owner, book a site visit, or "I'm interested", offer to pass their details to the owner. Collect their NAME and PHONE first (ask for them if missing), then call create_inquiry with the correct propertyId (from the current listing context or a listing they picked from search results). Confirm once it's filed. This notifies the owner — it does not reveal the owner's number to the user.

POST-A-PROPERTY RULES:
- If the user wants to list / post / sell / rent out their own property, help them conversationally. Ask for the missing essentials one or two at a time: purpose (sell/rent/pg/plot/commercial), property type, city, locality, size, BHK, and price. Once you have at least purpose, type, city, locality and price, call draft_property_listing. If no title/description was given, synthesise sensible ones.
- After draft_property_listing, DO NOT say the listing is live. Tell the user to tap "Review & publish listing" to open the pre-filled form, add photos and submit for verification.

MARKET / ADVISORY RULES:
- For pricing (₹/sq.ft), rental-yield, buy-vs-rent, or "is this a good area/investment" questions, call market_insights to get real stats from our listings. To compare two areas, call it once per area. Base your analysis on the returned numbers; if a field is null, say the data is limited rather than guessing. Always note these stats come from BayBayt listings and are indicative.

Tone: Professional, friendly, highly knowledgeable about Indian cities & real estate law. Keep responses scannable, using bullet points and bold highlights. Keep answers concise (150-250 words max).`;

      const tools = [{
        functionDeclarations: [
          searchPropertiesDeclaration as any,
          calculateEmiDeclaration as any,
          createInquiryDeclaration as any,
          draftPropertyListingDeclaration as any,
          marketInsightsDeclaration as any,
        ],
      }];

      // Multi-turn function-calling loop. Gemini may ask us to run a property
      // search; we execute it against the DB, feed the results back, and let it
      // compose the final reply. We also collect the raw cards so the drawer can
      // render real, clickable listings (dedup by id, cap the payload).
      const contents: any[] = [{ role: 'user', parts: [{ text: prompt }] }];
      const collected: GeniePropertyCard[] = [];
      const seen = new Set<string>();
      let propertyDraft: GenieListingDraft | null = null;
      let reply = '';

      for (let turn = 0; turn < 4; turn++) {
        const response = await generateWithRetry(ai, {
          contents,
          config: { systemInstruction, tools },
        });

        const calls = response.functionCalls || [];
        if (calls.length === 0) {
          reply = response.text || '';
          break;
        }

        // Record the model's tool-call turn, then answer each call.
        if (response.candidates?.[0]?.content) {
          contents.push(response.candidates[0].content);
        }

        const responseParts: any[] = [];
        for (const call of calls) {
          if (call.name === 'search_properties') {
            const { count, results } = await runPropertySearch((call.args || {}) as PropertySearchArgs);
            for (const r of results) {
              if (!seen.has(r.id)) {
                seen.add(r.id);
                collected.push(r);
              }
            }
            responseParts.push({
              functionResponse: {
                name: call.name,
                response: {
                  totalMatches: count,
                  returned: results.length,
                  listings: results,
                },
              },
            });
          } else if (call.name === 'calculate_emi') {
            const emi = runEmiCalculation((call.args || {}) as unknown as EmiArgs);
            responseParts.push({
              functionResponse: { name: call.name, response: emi as any },
            });
          } else if (call.name === 'create_inquiry') {
            const outcome = await runCreateInquiry(
              (call.args || {}) as unknown as CreateInquiryArgs,
              currentUser?.id,
            );
            responseParts.push({
              functionResponse: { name: call.name, response: outcome as any },
            });
          } else if (call.name === 'market_insights') {
            const stats = await runMarketInsights((call.args || {}) as unknown as MarketInsightsArgs);
            responseParts.push({
              functionResponse: { name: call.name, response: stats as any },
            });
          } else if (call.name === 'draft_property_listing') {
            propertyDraft = normalizeListingDraft(call.args || {});
            responseParts.push({
              functionResponse: {
                name: call.name,
                response: {
                  ready: true,
                  draft: propertyDraft,
                  note: 'Draft prepared. The user must tap "Review & publish listing" to add photos and submit.',
                },
              },
            });
          } else {
            responseParts.push({
              functionResponse: { name: call.name || 'unknown', response: { error: 'Unknown tool.' } },
            });
          }
        }
        contents.push({ role: 'user', parts: responseParts });
      }

      return NextResponse.json({
        success: true,
        reply: reply || 'I can help guide you through Indian real estate, property valuation, home loans, or locality recommendations.',
        properties: collected.slice(0, 10),
        propertyDraft,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action specified' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in BayBayt AI route:', error);
    // Surface overload/timeout as a retryable 503 with a friendly message so the
    // UI can say "busy, try again" rather than showing a generic failure.
    if (isOverloadedOrQuota(error)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Genie is handling a lot of requests right now. Please try again in a moment.',
          retryable: true,
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process AI request. Please try again.'
      },
      { status: 500 }
    );
  }
}
