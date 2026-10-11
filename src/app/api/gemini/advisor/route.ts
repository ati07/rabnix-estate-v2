import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

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
      const { messages, userQuery, contextProperty } = payload;

      let prompt = `User Query: ${userQuery}\n`;
      if (contextProperty) {
        prompt += `\nCurrently viewed property context:\nTitle: ${contextProperty.title}\nCity: ${contextProperty.city}, Locality: ${contextProperty.locality}\nPrice: ${contextProperty.priceFormatted} (${contextProperty.pricePerSqFt} / sq.ft)\nBHK: ${contextProperty.bhk || 'N/A'}, Carpet Area: ${contextProperty.carpetAreaSqFt} sq.ft\nRERA: ${contextProperty.reraId || 'Approved'}\n`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          systemInstruction: `You are "BayBayt Genie", the official AI Real Estate Advisor at BayBayt (India's Premier Real Estate & Property Portal).
You help buyers, tenants, sellers, and NRI investors navigate Indian real estate with expertise in:
1. Locality recommendations, price per sq.ft trends across Mumbai, Bangalore, Delhi-NCR, Hyderabad, Pune, Chennai, etc.
2. Home Loans, interest rates (Repo-linked lending rates), Section 80C and Section 24(b) tax deductions.
3. RERA regulations, carpet area vs super built-up calculations, encumbrance certificates, title verification.
4. Stamp duty & registration charges by state (Maharashtra, Karnataka, Delhi, Telangana, etc.).
5. Rental agreements, security deposit norms, and negotiation tactics.

Tone: Professional, friendly, highly knowledgeable about Indian cities & real estate law. Keep responses scannable, using bullet points and bold highlights. Keep answers concise (150-250 words max).`
        }
      });

      return NextResponse.json({
        success: true,
        reply: response.text || 'I can help guide you through Indian real estate, property valuation, home loans, or locality recommendations.'
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
