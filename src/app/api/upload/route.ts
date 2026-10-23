import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { put } from '@vercel/blob';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export const runtime = 'nodejs';

// NOTE: in production, Vercel caps the request body at ~4.5MB, so this route is
// only reliable for regular photos. Large media (360° panoramas, videos) goes
// through client-side direct-to-Blob uploads instead (see /api/upload/blob and
// src/lib/clientUpload.ts). The 200MB cap below mainly benefits the local-dev
// fallback, where files are written to public/uploads with no platform limit.
const MAX_BYTES = 200 * 1024 * 1024; // 200MB
const ALLOWED = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
];

// Use Vercel Blob in production (the serverless filesystem is ephemeral/
// read-only); write to public/uploads in local development so no Blob token
// is needed to work on the app.
const USE_BLOB = process.env.NODE_ENV === 'production';

// POST /api/upload  (multipart/form-data, field "files" one or many)
// Returns { success, urls } — Vercel Blob URLs in prod, /uploads/* paths in dev.
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Please sign in to upload.' }, { status: 401 });

    if (USE_BLOB && !process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { success: false, error: 'Image storage is not configured. Please set BLOB_READ_WRITE_TOKEN.' },
        { status: 500 }
      );
    }

    const form = await req.formData();
    const files = form.getAll('files').filter((f): f is File => f instanceof File);
    if (files.length === 0) {
      return NextResponse.json({ success: false, error: 'No files provided.' }, { status: 400 });
    }

    // Local dev target directory (created lazily, only when not using Blob).
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!USE_BLOB) await mkdir(uploadDir, { recursive: true });

    const urls: string[] = [];
    for (const file of files) {
      if (!ALLOWED.includes(file.type)) {
        return NextResponse.json({ success: false, error: `Unsupported file type: ${file.type}` }, { status: 400 });
      }
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ success: false, error: `${file.name} exceeds 200MB.` }, { status: 400 });
      }
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
      const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;

      if (USE_BLOB) {
        const blob = await put(`uploads/${name}`, file, { access: 'public', contentType: file.type });
        urls.push(blob.url);
      } else {
        const buf = Buffer.from(await file.arrayBuffer());
        await writeFile(path.join(uploadDir, name), buf);
        urls.push(`/uploads/${name}`);
      }
    }

    return NextResponse.json({ success: true, urls });
  } catch (err: any) {
    console.error('upload error', err);
    return NextResponse.json({ success: false, error: 'Upload failed.' }, { status: 500 });
  }
}
