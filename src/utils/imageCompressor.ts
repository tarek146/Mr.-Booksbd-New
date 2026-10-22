/**
 * Validates whether a string is a usable, non-corrupted image URL or data URI.
 *Specifically guards against corrupted canvas outputs like "data:," or "data:image/png;base64,"
 */
export function isValidImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed === 'data:,' || trimmed === 'data:' || trimmed === 'null' || trimmed === 'undefined' || trimmed === 'about:blank') {
    return false;
  }
  if (trimmed.startsWith('data:')) {
    if (!trimmed.startsWith('data:image/')) return false;
    const commaIdx = trimmed.indexOf(',');
    if (commaIdx === -1) return false;
    const payload = trimmed.slice(commaIdx + 1).trim();
    return payload.length > 16;
  }
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('blob:')
  );
}

/**
 * Returns a clean, valid image URL string, or '' if the URL is empty or corrupted (such as "data:,").
 */
export function sanitizeImageUrl(url?: string | null): string {
  if (!isValidImageUrl(url)) return '';
  return (url as string).trim();
}

/**
 * Compresses an image File using HTML Canvas to prevent exceeding
 * Firestore's 1MB document size limit while preserving crisp resolution and transparency.
 * Supports both 4-arg (file, maxWidth, maxHeight, quality) and 3-arg (file, maxDimension, quality) calls.
 */
export async function compressImageFile(
  file: File,
  maxWidth = 1600,
  maxHeightOrQuality = 1200,
  qualityArg = 0.85
): Promise<string> {
  // Smartly detect 3-argument call: compressImageFile(file, 400, 0.88)
  let targetMaxWidth = maxWidth > 1 ? maxWidth : 1600;
  let targetMaxHeight = maxHeightOrQuality;
  let quality = qualityArg;

  if (maxHeightOrQuality > 0 && maxHeightOrQuality <= 1) {
    quality = maxHeightOrQuality;
    targetMaxHeight = targetMaxWidth;
  }
  if (targetMaxHeight <= 1) {
    targetMaxHeight = targetMaxWidth;
  }
  if (quality <= 0 || quality > 1) {
    quality = 0.85;
  }

  return new Promise((resolve, reject) => {
    const fileName = (file.name || '').toLowerCase();
    const isImageMime = file.type.startsWith('image/');
    const isIconOrSvgExt =
      fileName.endsWith('.ico') ||
      fileName.endsWith('.svg') ||
      fileName.endsWith('.png') ||
      fileName.endsWith('.webp') ||
      fileName.endsWith('.jpg') ||
      fileName.endsWith('.jpeg') ||
      fileName.endsWith('.gif') ||
      fileName.endsWith('.avif');

    if (!isImageMime && !isIconOrSvgExt) {
      return reject(new Error('Selected file is not a valid image'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (event) => {
      const rawDataUrl = (event.target?.result as string) || '';
      if (!rawDataUrl) {
        return reject(new Error('Empty image file'));
      }

      const isSvgOrIco =
        file.type === 'image/svg+xml' ||
        file.type === 'image/x-icon' ||
        file.type === 'image/vnd.microsoft.icon' ||
        fileName.endsWith('.svg') ||
        fileName.endsWith('.ico');

      // For SVG or small ICO files (< 250KB), preserve the direct vector/icon data URL
      if (isSvgOrIco && file.size <= 250 * 1024 && isValidImageUrl(rawDataUrl)) {
        return resolve(rawDataUrl);
      }

      const img = new Image();
      img.onerror = () => {
        // If browser Image decoder cannot rasterize .ico/.svg, fallback to raw data URL if valid
        if (isValidImageUrl(rawDataUrl) && file.size <= 500 * 1024) {
          return resolve(rawDataUrl);
        }
        return reject(new Error('Failed to load image into canvas'));
      };

      img.onload = () => {
        let width = img.naturalWidth || img.width || targetMaxWidth;
        let height = img.naturalHeight || img.height || targetMaxHeight;

        if (width <= 0) width = targetMaxWidth;
        if (height <= 0) height = targetMaxHeight;

        // Calculate aspect-ratio-preserving dimensions
        if (width > targetMaxWidth) {
          height = Math.max(1, Math.round((height * targetMaxWidth) / width));
          width = targetMaxWidth;
        }
        if (height > targetMaxHeight) {
          width = Math.max(1, Math.round((width * targetMaxHeight) / height));
          height = targetMaxHeight;
        }

        width = Math.max(1, Math.round(width));
        height = Math.max(1, Math.round(height));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(rawDataUrl);
        }

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Preserve transparency for PNG, WebP, SVG, GIF, ICO (important for logos, favicons & payment icons)
        const prefersAlpha =
          file.type === 'image/png' ||
          file.type === 'image/webp' ||
          file.type === 'image/gif' ||
          isSvgOrIco ||
          fileName.endsWith('.png') ||
          fileName.endsWith('.webp');

        let outputDataUrl = '';
        if (prefersAlpha) {
          outputDataUrl = canvas.toDataURL('image/png');
          // If PNG output is too large for Firestore (> 650KB string), try WebP or JPEG
          if (outputDataUrl.length > 650 * 1024) {
            const webpTry = canvas.toDataURL('image/webp', quality);
            outputDataUrl = isValidImageUrl(webpTry) && webpTry.length < outputDataUrl.length
              ? webpTry
              : canvas.toDataURL('image/jpeg', quality);
          }
        } else {
          outputDataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        if (isValidImageUrl(outputDataUrl)) {
          resolve(outputDataUrl);
        } else if (isValidImageUrl(rawDataUrl)) {
          resolve(rawDataUrl);
        } else {
          reject(new Error('Failed to encode compressed image'));
        }
      };

      img.src = rawDataUrl;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Strips all undefined properties from an object recursively
 * so Firestore `setDoc()` or `updateDoc()` never rejects the payload.
 */
export function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => cleanForFirestore(item)) as unknown as T;
  }

  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned as T;
  }

  return data;
}

/**
 * Normalizes an image URL safely without constantly invalidating browser image cache on every render.
 */
export function addCacheBust(url?: string | null, version?: number | string): string {
  if (!isValidImageUrl(url)) return '';
  const cleanUrl = (url as string).trim();
  if (cleanUrl.startsWith('data:') || cleanUrl.startsWith('blob:')) return cleanUrl;
  if (cleanUrl.includes('cb=') || cleanUrl.includes('_t=') || cleanUrl.includes('v=')) return cleanUrl;
  if (version) {
    const separator = cleanUrl.includes('?') ? '&' : '?';
    return `${cleanUrl}${separator}v=${version}`;
  }
  return cleanUrl;
}


