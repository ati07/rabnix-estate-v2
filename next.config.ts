import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Expose the Google Maps browser values to client code under their plain names.
  // The Maps JavaScript API runs in the browser, so the key MUST be inlined into
  // the client bundle; Next only auto-inlines NEXT_PUBLIC_* vars, so we map the
  // project's GOOGLE_MAP_KEY / GOOGLE_MAP_ID here explicitly. The key is a
  // browser (referrer-restricted) Maps key, not a server secret.
  env: {
    GOOGLE_MAP_KEY: process.env.GOOGLE_MAP_KEY ?? '',
    GOOGLE_MAP_ID: process.env.GOOGLE_MAP_ID ?? '',
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow access to remote image placeholders and Unsplash real estate photos.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  transpilePackages: ['motion'],
  // Baseline security headers (Lighthouse "Trust and Safety"). Kept to the
  // low-risk set — no CSP/Trusted-Types here, which would need careful allow-
  // listing for Google Maps and Next's inline runtime.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
