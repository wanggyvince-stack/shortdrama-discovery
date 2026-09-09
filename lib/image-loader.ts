/**
 * Custom Next.js Image Loader using wsrv.nl (free, zero-cost image optimization CDN)
 * 
 * Features:
 * - Automatic WebP/AVIF conversion (40-94% size reduction)
 * - Responsive resizing via width parameter
 * - Quality control via q parameter
 * - Global CDN with CORS support (access-control-allow-origin: *)
 * - No cost, no API key, no rate limits for reasonable usage
 * 
 * @see https://wsrv.nl/docs/
 */

interface LoaderProps {
  src: string;
  width: number;
  quality?: number;
}

export default function wsrvLoader({ src, width, quality }: LoaderProps): string {
  const params = new URLSearchParams({
    url: src,
    w: String(width),
    q: String(quality ?? 80),
    output: 'webp',
  });
  return `https://wsrv.nl/?${params.toString()}`;
}
