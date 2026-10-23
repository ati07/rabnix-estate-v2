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
import { draftPropertyListingDeclaration, normalizeListingDraft, type GenieListingDraft } from "@/lib/genie/listingDraft";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

let genAIInstance: GoogleGenAI | null = null;

function getGenAI() {
  if (!genAIInstance) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    genAIInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIInstance;
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

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
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

Tone: Professional, friendly, highly knowledgeable about Indian cities & real estate law. Keep responses scannable, using bullet points and bold highlights. Keep answers concise (150-250 words max).`;

      const tools = [{
        functionDeclarations: [
          searchPropertiesDeclaration as any,
          calculateEmiDeclaration as any,
          createInquiryDeclaration as any,
          draftPropertyListingDeclaration as any,
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
        const response = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
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
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process AI request. Please try again.'
      },
      { status: 500 }
    );
  }
}
