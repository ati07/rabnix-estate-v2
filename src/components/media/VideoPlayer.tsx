'use client';

// Property walkthrough video. `url` may be either a self-hosted file (Vercel
// Blob URL / /uploads path) or an external YouTube / Vimeo link — we detect the
// latter and render an embed, otherwise fall back to a native <video> element.

function toEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

export default function VideoPlayer({ url }: { url: string }) {
  if (!url) return null;
  const embed = toEmbedUrl(url);

  if (embed) {
    return (
      <iframe
        src={embed}
        title="Property walkthrough"
        className="w-full aspect-video rounded-2xl border border-[#E2E8F0] bg-black"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <video
      src={url}
      controls
      playsInline
      preload="metadata"
      className="w-full aspect-video rounded-2xl border border-[#E2E8F0] bg-black object-contain"
    />
  );
}
