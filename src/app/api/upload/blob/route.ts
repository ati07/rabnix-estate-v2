import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';

// Client-side direct-to-Blob upload token endpoint.
//
// Vercel serverless functions cap the request body at ~4.5MB, so large media
// (360° panoramas 10–30MB, walkthrough videos) can't be streamed through our
// regular /api/upload route in production. Instead the browser uploads straight
// to Vercel Blob using @vercel/blob/client's `upload()`, which calls here first
// to mint a scoped token. See src/lib/clientUpload.ts for the caller.
//
// In local dev there's usually no BLOB_READ_WRITE_TOKEN, so clientUpload falls
// back to the server /api/upload route (public/uploads) and never hits this.
const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
];

const MAX_BYTES = 200 * 1024 * 1024; // 200MB — comfortably covers 360° panos + short walkthroughs

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const user = await getCurrentUser();
        if (!user) throw new Error('Please sign in to upload.');
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: true,
        };
      },
      // Fires after the browser finishes the direct upload. Nothing to persist
      // here — the client gets the URL back and saves it with the listing.
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Upload authorization failed.' },
      { status: 400 },
    );
  }
}
