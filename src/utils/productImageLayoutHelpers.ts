import type { HomeConfig, StoreSettings } from '../types';

export type ProductImageFitMode = 'cover' | 'contain';
export type ProductImageAspectRatio = 'auto' | '3:4' | '4:5' | '2:3' | '1:1';

/**
 * Standard portrait book photography aspect ratio (3:4 = 0.75, e.g. 1536x2048).
 * Used as the baseline ratio in 'auto' mode before an image reports its natural dimensions,
 * and as the fixed portrait ratio in '3:4' mode.
 */
export const REFERENCE_BOOK_ASPECT_RATIO = 3 / 4;
export const DEFAULT_PRODUCT_IMAGE_ASPECT_RATIO: ProductImageAspectRatio = 'auto';

export interface ProductImageLayoutClasses {
  fitMode: ProductImageFitMode;
  aspectRatioMode: ProductImageAspectRatio;
  cardFrameClass: string;
  cardImgClass: string;
  detailFrameClass: string;
  detailImgClass: string;
  thumbFrameClass: string;
  thumbImgClass: string;
  listThumbFrameClass: string;
  listThumbImgClass: string;
  cartThumbClass: string;
  miniThumbClass: string;
  relatedBookThumbFrameClass: string;
  relatedBookThumbImgClass: string;
}

export interface ResolvedContainerAspect {
  aspectClass: string;
  aspectStyle?: string;
  numericRatio: number;
}

const VALID_ASPECT_MODES = new Set<ProductImageAspectRatio>([
  'auto',
  '3:4',
  '4:5',
  '2:3',
  '1:1',
]);

/**
 * Resolves whether product imagery uses edge-to-edge fill ('cover', default)
 * or padded uncropped fit ('contain'), dynamically controlled via Admin Panel & Firebase.
 */
export function resolveProductImageFitMode(
  settings?: Partial<StoreSettings> | null,
  homeConfig?: Partial<HomeConfig> | null
): ProductImageFitMode {
  const mode = settings?.productImageFitMode || homeConfig?.productImageFitMode;
  return mode === 'contain' ? 'contain' : 'cover';
}

/**
 * Resolves the store's product image aspect ratio setting from Firebase (`settings/homeConfig`
 * or `settings/general`). Defaults to `'auto'` (matches uploaded photo's natural aspect ratio,
 * using 3:4 portrait book ratio as the clean baseline).
 */
export function resolveProductImageAspectRatio(
  settings?: Partial<StoreSettings> | null,
  homeConfig?: Partial<HomeConfig> | null
): ProductImageAspectRatio {
  const candidate =
    homeConfig?.productImageAspectRatio || settings?.productImageAspectRatio;
  if (candidate && VALID_ASPECT_MODES.has(candidate)) {
    return candidate;
  }
  return DEFAULT_PRODUCT_IMAGE_ASPECT_RATIO;
}

/**
 * Computes a clean, clamped width/height numeric aspect ratio from an image's natural dimensions.
 * Prevents extreme panoramas or ultra-thin strips from distorting product grids while preserving
 * exact natural proportions for standard book & product photography (e.g., 3:4 = 0.75, 4:5 = 0.8, 1:1 = 1.0).
 */
export function computeSafeAutoAspectRatio(
  naturalWidth?: number | null,
  naturalHeight?: number | null,
  fallbackRatio = REFERENCE_BOOK_ASPECT_RATIO,
  minRatio = 0.65,
  maxRatio = 1.35
): number {
  const safeFallback =
    typeof fallbackRatio === 'number' && Number.isFinite(fallbackRatio) && fallbackRatio > 0
      ? Math.min(maxRatio, Math.max(minRatio, fallbackRatio))
      : REFERENCE_BOOK_ASPECT_RATIO;

  if (
    typeof naturalWidth !== 'number' ||
    typeof naturalHeight !== 'number' ||
    !Number.isFinite(naturalWidth) ||
    !Number.isFinite(naturalHeight) ||
    naturalWidth <= 0 ||
    naturalHeight <= 0
  ) {
    return Number(safeFallback.toFixed(4));
  }

  const raw = naturalWidth / naturalHeight;
  const clamped = Math.min(maxRatio, Math.max(minRatio, raw));
  return Number(clamped.toFixed(4));
}

/**
 * Resolves the exact Tailwind aspect class or inline CSS `aspectRatio` string for a product
 * image container based on Admin setting (`auto` | `3:4` | `4:5` | `2:3` | `1:1`) and image metadata.
 */
export function resolveContainerAspectRatio({
  mode,
  naturalWidth,
  naturalHeight,
  savedRatio,
  minRatio = 0.65,
  maxRatio = 1.35,
}: {
  mode: ProductImageAspectRatio;
  naturalWidth?: number | null;
  naturalHeight?: number | null;
  savedRatio?: number | null;
  minRatio?: number;
  maxRatio?: number;
}): ResolvedContainerAspect {
  if (mode === '3:4') {
    return { aspectClass: 'aspect-[3/4]', numericRatio: 0.75 };
  }
  if (mode === '4:5') {
    return { aspectClass: 'aspect-[4/5]', numericRatio: 0.8 };
  }
  if (mode === '2:3') {
    return { aspectClass: 'aspect-[2/3]', numericRatio: Number((2 / 3).toFixed(4)) };
  }
  if (mode === '1:1') {
    return { aspectClass: 'aspect-square', numericRatio: 1 };
  }

  // 'auto' mode: prefer live loaded image natural ratio, then saved upload ratio, then 3:4 reference book ratio
  const hasLiveDims =
    typeof naturalWidth === 'number' &&
    typeof naturalHeight === 'number' &&
    naturalWidth > 0 &&
    naturalHeight > 0;

  const fallback =
    typeof savedRatio === 'number' && Number.isFinite(savedRatio) && savedRatio > 0
      ? savedRatio
      : REFERENCE_BOOK_ASPECT_RATIO;

  const numericRatio = hasLiveDims
    ? computeSafeAutoAspectRatio(naturalWidth, naturalHeight, fallback, minRatio, maxRatio)
    : computeSafeAutoAspectRatio(undefined, undefined, fallback, minRatio, maxRatio);

  return {
    aspectClass: '',
    aspectStyle: String(numericRatio),
    numericRatio,
  };
}

/**
 * Formats a human-readable aspect ratio label (e.g. "3:4 Portrait", "1:1 Square") for Admin previews.
 */
export function formatAspectRatioBadge(ratio?: number | null): string {
  if (typeof ratio !== 'number' || !Number.isFinite(ratio) || ratio <= 0) {
    return '3:4 Portrait';
  }
  if (Math.abs(ratio - 0.75) <= 0.03) return '3:4 Portrait';
  if (Math.abs(ratio - 0.8) <= 0.03) return '4:5 Portrait';
  if (Math.abs(ratio - 2 / 3) <= 0.03) return '2:3 Book';
  if (Math.abs(ratio - 1) <= 0.04) return '1:1 Square';
  if (ratio < 1) return `${ratio.toFixed(2)} Portrait`;
  return `${ratio.toFixed(2)} Landscape`;
}

/**
 * Returns deterministic Tailwind container and image classes for product cards,
 * detail gallery, thumbnails, and catalog list views.
 */
export function getProductImageLayoutClasses(
  fitMode: ProductImageFitMode,
  aspectRatioMode: ProductImageAspectRatio = DEFAULT_PRODUCT_IMAGE_ASPECT_RATIO
): ProductImageLayoutClasses {
  const staticAspectClass =
    aspectRatioMode === '1:1'
      ? 'aspect-square'
      : aspectRatioMode === '4:5'
        ? 'aspect-[4/5]'
        : aspectRatioMode === '2:3'
          ? 'aspect-[2/3]'
          : aspectRatioMode === '3:4'
            ? 'aspect-[3/4]'
            : 'aspect-[3/4]';

  // Use portrait 3:4 proportions for small book thumbnails unless Admin explicitly chooses 1:1 square
  const isSquareLock = aspectRatioMode === '1:1';
  const listThumbSize = isSquareLock
    ? 'w-20 h-20 sm:w-24 sm:h-24'
    : 'w-16 h-[86px] sm:w-20 sm:h-[106px]';
  const cartThumbSize = isSquareLock ? 'w-20 h-20' : 'w-[66px] h-[88px]';
  const miniThumbSize = isSquareLock ? 'w-11 h-11' : 'w-10 h-[53px]';
  const relatedThumbSize = isSquareLock ? 'w-14 h-14' : 'w-12 h-16';

  if (fitMode === 'contain') {
    return {
      fitMode: 'contain',
      aspectRatioMode,
      cardFrameClass:
        `w-full ${aspectRatioMode === 'auto' ? '' : staticAspectClass} relative bg-[#F8F9FA] rounded-xl p-2 flex items-center justify-center overflow-hidden border border-neutral-100`.replace(/\s+/g, ' ').trim(),
      cardImgClass:
        'relative z-1 h-full w-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.06)] group-hover:scale-105 transition-transform duration-300 ease-out',
      detailFrameClass:
        `w-full ${aspectRatioMode === 'auto' ? '' : staticAspectClass} bg-neutral-50 rounded-xl p-5 sm:p-7 border border-neutral-200/80 flex items-center justify-center relative overflow-hidden group`.replace(/\s+/g, ' ').trim(),
      detailImgClass:
        'w-full h-full object-contain transition-transform duration-300 ease-out group-hover:scale-[1.03]',
      thumbFrameClass: 'p-1 bg-white',
      thumbImgClass: 'w-full h-full object-contain',
      listThumbFrameClass:
        `${listThumbSize} rounded-xl bg-[#F8F9FA] border border-neutral-100 p-1.5 flex items-center justify-center shrink-0 overflow-hidden`,
      listThumbImgClass:
        'w-full h-full object-contain group-hover:scale-105 transition-transform',
      cartThumbClass:
        `${cartThumbSize} object-contain bg-[#F7F7F8] rounded-xl p-1.5 shrink-0 border border-[#E5E5E5]`,
      miniThumbClass:
        `${miniThumbSize} object-contain bg-neutral-50 dark:bg-slate-800 rounded-lg p-1 border border-neutral-200 dark:border-slate-700 shrink-0`,
      relatedBookThumbFrameClass:
        `${relatedThumbSize} rounded-lg bg-neutral-50 border border-neutral-100 dark:border-[#1E2838] p-1 flex items-center justify-center shrink-0 overflow-hidden`,
      relatedBookThumbImgClass:
        'w-full h-full object-contain group-hover:scale-105 transition-transform duration-200',
    };
  }

  return {
    fitMode: 'cover',
    aspectRatioMode,
    cardFrameClass:
      `w-full ${aspectRatioMode === 'auto' ? '' : staticAspectClass} relative bg-[#F8F9FA] rounded-xl flex items-center justify-center overflow-hidden border border-neutral-100`.replace(/\s+/g, ' ').trim(),
    cardImgClass:
      'relative z-1 h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300 ease-out',
    detailFrameClass:
      `w-full ${aspectRatioMode === 'auto' ? '' : staticAspectClass} bg-neutral-50 rounded-xl border border-neutral-200/80 flex items-center justify-center relative overflow-hidden group`.replace(/\s+/g, ' ').trim(),
    detailImgClass:
      'w-full h-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-[1.03]',
    thumbFrameClass: 'bg-neutral-50',
    thumbImgClass: 'w-full h-full object-cover object-center',
    listThumbFrameClass:
      `${listThumbSize} rounded-xl bg-[#F8F9FA] border border-neutral-100 flex items-center justify-center shrink-0 overflow-hidden`,
    listThumbImgClass:
      'w-full h-full object-cover object-center group-hover:scale-105 transition-transform',
    cartThumbClass:
      `${cartThumbSize} object-cover object-center bg-[#F7F7F8] rounded-xl shrink-0 border border-[#E5E5E5]`,
    miniThumbClass:
      `${miniThumbSize} object-cover object-center bg-neutral-50 dark:bg-slate-800 rounded-lg border border-neutral-200 dark:border-slate-700 shrink-0`,
    relatedBookThumbFrameClass:
      `${relatedThumbSize} rounded-lg bg-neutral-50 border border-neutral-100 dark:border-[#1E2838] flex items-center justify-center shrink-0 overflow-hidden`,
    relatedBookThumbImgClass:
      'w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-200',
  };
}
