import type { HomeConfig, StoreSettings } from '../types';

export type ProductImageFitMode = 'cover' | 'contain';

export interface ProductImageLayoutClasses {
  fitMode: ProductImageFitMode;
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

/**
 * Resolves whether product imagery uses full-bleed 1:1 square fill ('cover', default)
 * or padded uncropped fit ('contain'), allowing dynamic Admin Panel control via Firebase.
 */
export function resolveProductImageFitMode(
  settings?: Partial<StoreSettings> | null,
  homeConfig?: Partial<HomeConfig> | null
): ProductImageFitMode {
  const mode = settings?.productImageFitMode || homeConfig?.productImageFitMode;
  return mode === 'contain' ? 'contain' : 'cover';
}

/**
 * Returns deterministic Tailwind container and image classes for product cards,
 * detail gallery, thumbnails, and catalog list views.
 */
export function getProductImageLayoutClasses(
  fitMode: ProductImageFitMode
): ProductImageLayoutClasses {
  if (fitMode === 'contain') {
    return {
      fitMode: 'contain',
      cardFrameClass:
        'w-full aspect-square relative bg-[#F8F9FA] rounded-xl p-2 flex items-center justify-center overflow-hidden border border-neutral-100',
      cardImgClass:
        'relative z-1 h-full w-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.06)] group-hover:scale-105 transition-transform duration-300 ease-out',
      detailFrameClass:
        'w-full aspect-square bg-neutral-50 rounded-xl p-6 sm:p-8 border border-neutral-200/80 flex items-center justify-center relative overflow-hidden group',
      detailImgClass:
        'w-full h-full object-contain transition-transform duration-300 ease-out group-hover:scale-[1.03]',
      thumbFrameClass: 'p-1 bg-white',
      thumbImgClass: 'w-full h-full object-contain',
      listThumbFrameClass:
        'w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-[#F8F9FA] border border-neutral-100 p-2 flex items-center justify-center shrink-0 overflow-hidden',
      listThumbImgClass:
        'w-full h-full object-contain group-hover:scale-105 transition-transform',
      cartThumbClass:
        'w-20 h-20 object-contain bg-[#F7F7F8] rounded-xl p-2 shrink-0 border border-[#E5E5E5]',
      miniThumbClass:
        'w-11 h-11 object-contain bg-neutral-50 dark:bg-slate-800 rounded-lg p-1 border border-neutral-200 dark:border-slate-700 shrink-0',
      relatedBookThumbFrameClass:
        'w-14 h-14 rounded-lg bg-neutral-50 border border-neutral-100 dark:border-[#1E2838] p-1 flex items-center justify-center shrink-0 overflow-hidden',
      relatedBookThumbImgClass:
        'w-full h-full object-contain group-hover:scale-105 transition-transform duration-200',
    };
  }

  return {
    fitMode: 'cover',
    cardFrameClass:
      'w-full aspect-square relative bg-[#F8F9FA] rounded-xl flex items-center justify-center overflow-hidden border border-neutral-100',
    cardImgClass:
      'relative z-1 h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300 ease-out',
    detailFrameClass:
      'w-full aspect-square bg-neutral-50 rounded-xl border border-neutral-200/80 flex items-center justify-center relative overflow-hidden group',
    detailImgClass:
      'w-full h-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-[1.03]',
    thumbFrameClass: 'bg-neutral-50',
    thumbImgClass: 'w-full h-full object-cover object-center',
    listThumbFrameClass:
      'w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-[#F8F9FA] border border-neutral-100 flex items-center justify-center shrink-0 overflow-hidden',
    listThumbImgClass:
      'w-full h-full object-cover object-center group-hover:scale-105 transition-transform',
    cartThumbClass:
      'w-20 h-20 object-cover object-center bg-[#F7F7F8] rounded-xl shrink-0 border border-[#E5E5E5]',
    miniThumbClass:
      'w-11 h-11 object-cover object-center bg-neutral-50 dark:bg-slate-800 rounded-lg border border-neutral-200 dark:border-slate-700 shrink-0',
    relatedBookThumbFrameClass:
      'w-14 h-14 rounded-lg bg-neutral-50 border border-neutral-100 dark:border-[#1E2838] flex items-center justify-center shrink-0 overflow-hidden',
    relatedBookThumbImgClass:
      'w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-200',
  };
}
