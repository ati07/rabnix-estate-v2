'use client';

import { upload } from '@vercel/blob/client';

// In production we upload large media straight to Vercel Blob from the browser
// (bypassing the 4.5MB serverless body limit). In local dev there's no Blob
// token, so we reuse the existing server route which writes to public/uploads.
// This mirrors USE_BLOB in src/app/api/upload/route.ts.
const USE_BLOB = process.env.NODE_ENV === 'production';

function safeName(file: File): string {
  const clean = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `uploads/${Date.now()}-${Math.random().toString(16).slice(2, 8)}-${clean}`;
}

/**
 * Upload one or more media files (360° panoramas, walkthrough videos, photos)
 * and return their public URLs. Large files are safe here — unlike a plain POST
 * to /api/upload, direct-to-Blob uploads aren't subject to the serverless body
 * size limit.
 */
export async function uploadMediaFiles(files: File[]): Promise<string[]> {
  if (files.length === 0) return [];

  if (USE_BLOB) {
    const urls: string[] = [];
    for (const file of files) {
      const result = await upload(safeName(file), file, {
        access: 'public',
        handleUploadUrl: '/api/upload/blob',
        contentType: file.type || undefined,
      });
      urls.push(result.url);
    }
    return urls;
  }

  // Dev fallback: stream through the server route (public/uploads).
  const form = new FormData();
  files.forEach((f) => form.append('files', f));
  const res = await fetch('/api/upload', { method: 'POST', body: form, credentials: 'same-origin' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success || !Array.isArray(data.urls)) {
    throw new Error(data.error || 'Upload failed. Please try again.');
  }
  return data.urls as string[];
}
