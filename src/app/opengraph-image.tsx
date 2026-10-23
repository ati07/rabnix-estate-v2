import { ImageResponse } from 'next/og';

// Sitewide social-share card (Open Graph + Twitter). Next.js serves this at
// /opengraph-image and auto-wires it as the default og:image/twitter:image for
// every route that doesn't define its own (detail pages override with a real
// listing photo). 1200x630 is the standard large-summary card size.
export const alt = 'BayBayt — verified owner-direct real estate across India';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0C2943 0%, #0F2A43 55%, #123A5A 100%)',
          padding: '72px 80px',
          fontFamily: 'sans-serif',
          color: '#FFFFFF',
        }}
      >
        {/* Brand row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              display: 'flex',
              width: 20,
              height: 56,
              borderRadius: 6,
              background: '#18A67D',
            }}
          />
          <div style={{ display: 'flex', fontSize: 52, fontWeight: 800, letterSpacing: -1 }}>
            <span style={{ color: '#FFFFFF' }}>Bay</span>
            <span style={{ color: '#22C55E' }}>Bayt</span>
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              display: 'flex',
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 940,
            }}
          >
            Verified owner-direct properties across India
          </div>
          <div style={{ display: 'flex', fontSize: 34, color: '#9FD9C6', fontWeight: 600 }}>
            Buy · Rent · PG · Commercial · New Projects
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255,255,255,0.15)',
            paddingTop: 28,
          }}
        >
          <div style={{ display: 'flex', fontSize: 30, color: '#CBD5E1' }}>
            Zero brokerage · RERA-aware · AI valuation
          </div>
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, color: '#22C55E' }}>
            www.baybayt.com
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
