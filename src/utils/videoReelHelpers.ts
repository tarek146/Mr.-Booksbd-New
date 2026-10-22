import { Product, Reel } from '../types';

/**
 * Deduplicate any array of objects by their `id` property.
 * Guarantees that no duplicate records can exist in React state or arrays.
 */
export function dedupeById<T extends { id: string }>(items: T[]): T[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (!item || !item.id) continue;
    if (!seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }
  return result;
}

/**
 * Extracts YouTube Video ID from standard YouTube URLs, YouTube Shorts, or shortened youtu.be links.
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const clean = url.trim();

  // 1. YouTube Shorts: https://www.youtube.com/shorts/VIDEO_ID or youtube.com/shorts/VIDEO_ID
  const shortsMatch = clean.match(/(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i);
  if (shortsMatch && shortsMatch[1]) return shortsMatch[1];

  // 2. youtu.be/VIDEO_ID
  const youtuBeMatch = clean.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (youtuBeMatch && youtuBeMatch[1]) return youtuBeMatch[1];

  // 3. youtube.com/watch?v=VIDEO_ID
  const watchMatch = clean.match(/(?:youtube\.com\/(?:watch\?.*v=|embed\/|v\/))([a-zA-Z0-9_-]{11})/i);
  if (watchMatch && watchMatch[1]) return watchMatch[1];

  return null;
}

/**
 * Generates official high-quality YouTube thumbnail URL from a YouTube Video ID.
 */
export function getYouTubeThumbnailUrl(videoId: string): string {
  if (!videoId) return '';
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Checks if a URL is a direct video link (MP4, WebM, OGG, MOV, Blob, Data URL)
 */
export function isDirectVideoUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const lower = url.trim().toLowerCase();
  return (
    lower.startsWith('data:video/') ||
    lower.startsWith('blob:') ||
    /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(lower) ||
    lower.includes('assets.mixkit.co/videos') ||
    lower.includes('firebasestorage.googleapis.com') ||
    lower.includes('cloudinary.com')
  );
}

/**
 * Filters a list of products by search query matching title, author, category, publisher, or SKU.
 */
export function searchProductsForReel(products: Product[], query: string): Product[] {
  if (!Array.isArray(products)) return [];
  if (!query || !query.trim()) return products;

  const normalized = query.trim().toLowerCase();
  return products.filter(p => {
    const title = (p.title || '').toLowerCase();
    const author = (p.author || '').toLowerCase();
    const category = (p.category || '').toLowerCase();
    const sku = (p.sku || '').toLowerCase();
    const publisher = (p.publisher || '').toLowerCase();

    return (
      title.includes(normalized) ||
      author.includes(normalized) ||
      category.includes(normalized) ||
      sku.includes(normalized) ||
      publisher.includes(normalized)
    );
  });
}

/**
 * Automatically captures a thumbnail frame from an HTML5 video source (URL or File).
 * Returns a compressed JPEG Data URL.
 */
export function captureVideoFrame(videoSource: string | File, seekTimeSeconds = 0.5): Promise<string> {
  return new Promise((resolve, reject) => {
    // If running in Node/non-browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return reject(new Error('captureVideoFrame requires a browser environment'));
    }

    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';

    let objectUrlToRevoke: string | null = null;
    if (typeof videoSource === 'string') {
      video.src = videoSource;
    } else {
      objectUrlToRevoke = URL.createObjectURL(videoSource);
      video.src = objectUrlToRevoke;
    }

    const cleanUp = () => {
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
      video.removeAttribute('src');
      video.load();
    };

    const timeout = setTimeout(() => {
      cleanUp();
      reject(new Error('Video thumbnail extraction timed out.'));
    }, 12000);

    video.onloadedmetadata = () => {
      // Seek to either seekTimeSeconds or halfway through if video is very short
      const duration = video.duration || 1;
      video.currentTime = Math.min(seekTimeSeconds, duration > 0.3 ? duration / 2 : 0.1);
    };

    video.onseeked = () => {
      clearTimeout(timeout);
      try {
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 360;

        // Scale to max width 720 for compact storage
        const maxDim = 720;
        let targetW = width;
        let targetH = height;
        if (targetW > maxDim) {
          targetH = Math.round((targetH * maxDim) / targetW);
          targetW = maxDim;
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanUp();
          return reject(new Error('Canvas 2D context not available'));
        }

        ctx.drawImage(video, 0, 0, targetW, targetH);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        cleanUp();
        resolve(dataUrl);
      } catch (err) {
        cleanUp();
        reject(err);
      }
    };

    video.onerror = () => {
      clearTimeout(timeout);
      cleanUp();
      reject(new Error('Failed to load video for thumbnail extraction.'));
    };
  });
}
