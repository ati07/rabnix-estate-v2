import React from 'react';
import { ShieldCheck, Award, CheckCircle } from 'lucide-react';
import type { Property } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * Single source of truth for a listing's trust badges, rendered consistently on
 * the catalog card, the detail page, and the detail modal.
 *
 * Every badge maps to a real, selective field — never a cosmetic claim:
 *   • Owner Direct     — isExclusiveOwner or an Owner-type poster (our zero-brokerage wedge)
 *   • BayBayt Verified — isVerified (passed admin listing review). NOT a RERA claim.
 *   • RERA Registered  — reraApproved AND a reraId on file.
 *
 * Keeping these distinct matters: a listing can be admin-verified without RERA,
 * so we must not imply RERA unless it's actually registered.
 */

type TrustProperty = Pick<Property, 'isVerified' | 'reraApproved' | 'reraId' | 'isExclusiveOwner' | 'postedBy'>;

interface TrustBadgesProps {
  property: TrustProperty;
  /** "overlay" = light-on-dark pills for image overlays (cards); "light" = pills for light backgrounds (headers). */
  tone?: 'overlay' | 'light';
  size?: 'sm' | 'md';
  /** Show the actual RERA id instead of the generic "RERA Registered" label. */
  showReraId?: boolean;
  className?: string;
}

type BadgeKind = 'owner' | 'verified' | 'rera';

const ICONS: Record<BadgeKind, React.ComponentType<{ className?: string }>> = {
  owner: CheckCircle,
  verified: ShieldCheck,
  rera: Award,
};

// Per-tone pill styling. Mirrors the treatments already used across the app so
// this is a consolidation, not a redesign.
const PILL: Record<'overlay' | 'light', Record<BadgeKind, { pill: string; icon: string }>> = {
  overlay: {
    owner: { pill: 'bg-[#0E7C5D] text-white', icon: 'text-white' },
    verified: { pill: 'bg-[#0F2A43] text-white border border-white/10', icon: 'text-[#22C39A]' },
    rera: { pill: 'bg-[#0F2A43]/95 text-[#22C39A] border border-white/10', icon: 'text-[#22C39A]' },
  },
  light: {
    owner: { pill: 'bg-amber-50 text-amber-800 border border-amber-200', icon: 'text-amber-600' },
    verified: { pill: 'bg-[#E7F6F1] text-[#0E7C5D] border border-[#18A67D]/30', icon: 'text-[#18A67D]' },
    rera: { pill: 'bg-[#F1F5F9] text-[#0F2A43] border border-[#E2E8F0]', icon: 'text-[#18A67D]' },
  },
};

export function TrustBadges({ property, tone = 'light', size = 'sm', showReraId = false, className }: TrustBadgesProps) {
  const ownerDirect = property.isExclusiveOwner || property.postedBy?.type === 'Owner';
  const rera = property.reraApproved && !!property.reraId;

  const badges: { kind: BadgeKind; label: string }[] = [];
  if (ownerDirect) badges.push({ kind: 'owner', label: 'Owner Direct' });
  if (property.isVerified) badges.push({ kind: 'verified', label: 'BayBayt Verified' });
  if (rera) badges.push({ kind: 'rera', label: showReraId ? `RERA ${property.reraId}` : 'RERA Registered' });

  if (badges.length === 0) return null;

  const sizeCls = size === 'md' ? 'text-xs px-2.5 py-1' : 'text-[10px] px-2 py-1';
  const iconCls = size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3';

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {badges.map(({ kind, label }) => {
        const Icon = ICONS[kind];
        const style = PILL[tone][kind];
        return (
          <span
            key={kind}
            className={cn(
              'inline-flex items-center gap-1 rounded font-bold uppercase tracking-wider shadow-sm',
              sizeCls,
              style.pill,
            )}
          >
            <Icon className={cn(iconCls, style.icon)} />
            <span>{label}</span>
          </span>
        );
      })}
    </div>
  );
}
