import Image from 'next/image';

interface BrandLogoProps {
  /** 'onLight' = for white/light surfaces (navbar, page headers).
   *  'onDark'  = for dark surfaces (footer). */
  variant?: 'onLight' | 'onDark';
  /** Tailwind sizing — set the height, keep width auto. */
  className?: string;
  priority?: boolean;
}

// Centralised BayBayt wordmark. The asset is chosen by the surface it sits on:
//  - logo-white.png: transparent/near-white bg, navy+teal text (light surfaces)
//  - logo.png:       navy bg (#0C2943 ≈ footer), white+teal text (dark surfaces)
export function BrandLogo({ variant = 'onLight', className = 'h-9 w-auto', priority = false }: BrandLogoProps) {
  const isDark = variant === 'onDark';
  return (
    <Image
      src={isDark ? '/logo.png' : '/logo-white.png'}
      alt="BayBayt"
      width={isDark ? 692 : 991}
      height={isDark ? 167 : 231}
      priority={priority}
      // The wordmark renders ~150–175px wide (h-9/h-10). Cap the generated
      // variant so Next doesn't ship the full-resolution asset for a tiny slot.
      sizes="180px"
      className={className}
    />
  );
}
