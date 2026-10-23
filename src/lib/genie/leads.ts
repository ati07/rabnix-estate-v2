import { Type } from '@google/genai';
import { prisma } from '@/lib/prisma';

/**
 * Tier-2 Genie tool: lead capture. Lets the advisor file an inquiry / site-visit
 * request to a listing's owner on the user's behalf, mirroring POST /api/inquiries.
 *
 * Safety: this only CREATES a lead for the owner — it never reveals the owner's
 * phone to the buyer (contact stays behind the gated OTP reveal). The model must
 * collect the buyer's own name + phone before calling this.
 */

export const createInquiryDeclaration = {
  name: 'create_inquiry',
  description:
    "File an inquiry / site-visit request to a listing's owner on the user's behalf. " +
    'Only call this AFTER you have the propertyId (from the current listing context or ' +
    'a listing the user picked from search results) AND the user has given their name ' +
    'and phone number. Never guess the phone number. This notifies the owner; it does ' +
    'NOT reveal the owner\'s contact to the user.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      propertyId: { type: Type.STRING, description: 'ID of the property the user is interested in.' },
      buyerName: { type: Type.STRING, description: "The user's full name." },
      buyerPhone: { type: Type.STRING, description: "The user's phone number (as provided by the user)." },
      buyerEmail: { type: Type.STRING, description: "The user's email (optional)." },
      message: { type: Type.STRING, description: 'Optional note / requirement from the user.' },
      preferredTime: { type: Type.STRING, description: 'Optional preferred time/date for a site visit or callback.' },
    },
    required: ['propertyId', 'buyerName', 'buyerPhone'],
  },
} as const;

export interface CreateInquiryArgs {
  propertyId: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string;
  message?: string;
  preferredTime?: string;
}

export async function runCreateInquiry(
  args: CreateInquiryArgs,
  buyerUserId?: string,
): Promise<{ success: boolean; propertyTitle?: string; error?: string }> {
  if (!args.propertyId || !args.buyerName || !args.buyerPhone) {
    return { success: false, error: 'propertyId, buyerName and buyerPhone are all required.' };
  }

  const property = await prisma.property.findUnique({ where: { id: args.propertyId } });
  if (!property || property.verificationStatus !== 'approved') {
    return { success: false, error: 'That listing could not be found. Ask the user to pick a listing from the search results.' };
  }

  await prisma.inquiry.create({
    data: {
      propertyId: property.id,
      propertyTitle: property.title,
      sellerUserId: property.postedByUserId ?? undefined,
      buyerUserId: buyerUserId ?? undefined,
      buyerName: args.buyerName,
      buyerPhone: args.buyerPhone,
      buyerEmail: args.buyerEmail || '',
      message: args.message || 'Inquiry submitted via BayBayt Genie.',
      preferredTime: args.preferredTime || undefined,
    },
  });

  await prisma.property.update({
    where: { id: property.id },
    data: { inquiriesCount: { increment: 1 } },
  });

  await prisma.activityLog.create({
    data: {
      action: 'inquiry_received',
      actorName: args.buyerName,
      actorRole: 'Buyer',
      details: `New inquiry for "${property.title}" via BayBayt Genie.`,
      targetTitle: property.title,
      targetId: property.id,
      severity: 'info',
    },
  });

  return { success: true, propertyTitle: property.title };
}
