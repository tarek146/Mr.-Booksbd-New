export interface CategorySliderMetrics {
  scrollLeft: number;
  clientWidth: number;
  scrollWidth: number;
  stepWidth: number;
}

/**
 * Computes the next horizontal scroll offset for the single-line auto-sliding
 * category strip. Wraps back to `0` once it reaches the end of the row.
 */
export function computeNextCategorySlideOffset(metrics: CategorySliderMetrics): number {
  const scrollWidth = Math.max(0, metrics.scrollWidth);
  const clientWidth = Math.max(0, metrics.clientWidth);
  const maxScrollLeft = Math.max(0, scrollWidth - clientWidth);

  if (maxScrollLeft <= 2) {
    return 0;
  }

  const currentLeft = Math.max(0, metrics.scrollLeft);
  const step = Math.max(40, metrics.stepWidth || Math.round(clientWidth * 0.45));

  if (currentLeft >= maxScrollLeft - 6) {
    return 0;
  }

  const nextLeft = currentLeft + step;
  if (nextLeft >= maxScrollLeft - 6) {
    return maxScrollLeft;
  }
  return nextLeft;
}

/**
 * Computes the target horizontal scroll offset when clicking Left/Right
 * controls manually on the single-line category slider.
 */
export function computeDirectionalCategorySlideOffset(
  metrics: CategorySliderMetrics,
  direction: 'left' | 'right'
): number {
  const scrollWidth = Math.max(0, metrics.scrollWidth);
  const clientWidth = Math.max(0, metrics.clientWidth);
  const maxScrollLeft = Math.max(0, scrollWidth - clientWidth);

  if (maxScrollLeft <= 2) {
    return 0;
  }

  const currentLeft = Math.max(0, metrics.scrollLeft);
  const step = Math.max(60, metrics.stepWidth || Math.round(clientWidth * 0.7));

  if (direction === 'right') {
    if (currentLeft >= maxScrollLeft - 6) {
      return 0;
    }
    const next = currentLeft + step;
    return next >= maxScrollLeft - 6 ? maxScrollLeft : next;
  }

  if (currentLeft <= 6) {
    return maxScrollLeft;
  }
  const prev = currentLeft - step;
  return prev <= 6 ? 0 : prev;
}
