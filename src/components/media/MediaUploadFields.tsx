'use client';

import React, { useRef, useState } from 'react';
import { Loader2, Upload, X, Video, Compass, Link2 } from 'lucide-react';
import { uploadMediaFiles } from '@/lib/clientUpload';

export interface PropertyMediaValue {
  panoramaImages: string[];
  videoUrl: string;
  virtualTourUrl: string;
}

interface Props {
  value: PropertyMediaValue;
  onChange: (next: PropertyMediaValue) => void;
}

/**
 * Optional rich-media block shared by every property-posting flow
 * (post-property page, home PostPropertyModal, dashboard inline upload):
 *   • 360° panoramas  -> panoramaImages[]  (Photo Sphere Viewer on the detail page)
 *   • walkthrough video -> videoUrl        (uploaded file OR YouTube/Vimeo link)
 *   • virtual tour      -> virtualTourUrl   (external Matterport/3D embed)
 *
 * All file uploads go through uploadMediaFiles() which uploads large media
 * directly to Vercel Blob in production (and to public/uploads in dev).
 */
export function MediaUploadFields({ value, onChange }: Props) {
  const panoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [panoBusy, setPanoBusy] = useState(false);
  const [videoBusy, setVideoBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<PropertyMediaValue>) => onChange({ ...value, ...patch });

  const handlePanoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setError(null);
    setPanoBusy(true);
    try {
      const urls = await uploadMediaFiles(Array.from(files));
      set({ panoramaImages: [...value.panoramaImages, ...urls] });
    } catch (err) {
      setError((err as Error).message || 'Upload failed.');
    } finally {
      setPanoBusy(false);
      if (panoInputRef.current) panoInputRef.current.value = '';
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setError(null);
    setVideoBusy(true);
    try {
      const urls = await uploadMediaFiles([files[0]]);
      if (urls[0]) set({ videoUrl: urls[0] });
    } catch (err) {
      setError((err as Error).message || 'Upload failed.');
    } finally {
      setVideoBusy(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const removePano = (idx: number) =>
    set({ panoramaImages: value.panoramaImages.filter((_, i) => i !== idx) });

  return (
    <div className="space-y-6 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 sm:p-5">
      <div>
        <h4 className="text-sm font-bold text-[#0F2A43]">Immersive media <span className="font-medium text-[#64748B]">(optional)</span></h4>
        <p className="text-xs text-[#64748B] mt-0.5">360° photos, a walkthrough video, or a virtual tour help listings stand out.</p>
      </div>

      {error && (
        <div className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
      )}

      {/* 360° panoramas */}
      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-bold text-[#0F2A43]">
          <Compass className="w-3.5 h-3.5 text-[#18A67D]" /> 360° Photos
        </label>
        <p className="text-[11px] text-[#64748B]">Upload equirectangular (2:1) panoramas exported from a 360° camera or phone app.</p>
        {value.panoramaImages.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {value.panoramaImages.map((img, idx) => (
              <div key={idx} className="relative w-24 h-16 rounded-lg overflow-hidden border border-[#E2E8F0]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt={`360° ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <span className="absolute bottom-0.5 left-0.5 text-[9px] font-bold bg-[#0F2A43]/80 text-white px-1 rounded">360°</span>
                <button
                  type="button"
                  onClick={() => removePano(idx)}
                  className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 hover:bg-red-600"
                  aria-label="Remove 360° photo"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <input ref={panoInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handlePanoUpload} className="hidden" />
        <button
          type="button"
          onClick={() => panoInputRef.current?.click()}
          disabled={panoBusy}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#0E7C5D] bg-white border border-[#18A67D]/40 rounded-lg px-3 py-2 hover:bg-[#E7F6F1] disabled:opacity-60"
        >
          {panoBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {panoBusy ? 'Uploading…' : 'Add 360° Photo'}
        </button>
      </div>

      {/* Walkthrough video */}
      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-bold text-[#0F2A43]">
          <Video className="w-3.5 h-3.5 text-[#18A67D]" /> Walkthrough Video
        </label>
        <input
          type="url"
          value={value.videoUrl}
          onChange={(e) => set({ videoUrl: e.target.value })}
          placeholder="Paste a YouTube / Vimeo link, or upload a file →"
          className="w-full text-sm rounded-lg border border-[#E2E8F0] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#18A67D]/40"
        />
        <div className="flex items-center gap-2">
          <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/quicktime" onChange={handleVideoUpload} className="hidden" />
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            disabled={videoBusy}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#0E7C5D] bg-white border border-[#18A67D]/40 rounded-lg px-3 py-2 hover:bg-[#E7F6F1] disabled:opacity-60"
          >
            {videoBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {videoBusy ? 'Uploading…' : 'Upload video file'}
          </button>
          {value.videoUrl && (
            <button type="button" onClick={() => set({ videoUrl: '' })} className="text-xs font-bold text-red-600 hover:underline">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Virtual tour */}
      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-bold text-[#0F2A43]">
          <Link2 className="w-3.5 h-3.5 text-[#18A67D]" /> Virtual Tour Link
        </label>
        <input
          type="url"
          value={value.virtualTourUrl}
          onChange={(e) => set({ virtualTourUrl: e.target.value })}
          placeholder="Matterport / 3D tour URL"
          className="w-full text-sm rounded-lg border border-[#E2E8F0] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#18A67D]/40"
        />
      </div>
    </div>
  );
}
