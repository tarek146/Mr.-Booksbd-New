import { HomeConfig, StoreSettings } from '../types';

export const DEFAULT_HOME_CONFIG: HomeConfig = {
  showReviews: true,
  showAuthors: true,
  reviewsSlotReplacement: 'reviews',
  authorsSlotReplacement: 'writers',
  reviewIconStyle: 'heart',
  productCardReviewSlotMode: 'green_rating',
  productCardWriterSlotMode: 'writer_name',
};

/**
 * Resolves a complete `HomeConfig` object by merging the `homeConfig` document
 * from Firebase (`settings/homeConfig`) with fallback values from `StoreSettings`.
 */
export function resolveHomeConfig(
  rawConfig?: Partial<HomeConfig> | null,
  fallbackSettings?: Partial<StoreSettings> | null
): HomeConfig {
  const showReviewsFromSettings =
    fallbackSettings?.showHomeReviewsSection !== undefined
      ? fallbackSettings.showHomeReviewsSection !== false
      : DEFAULT_HOME_CONFIG.showReviews;

  const showAuthorsFromSettings =
    fallbackSettings?.showHomeWritersSection !== undefined
      ? fallbackSettings.showHomeWritersSection !== false
      : DEFAULT_HOME_CONFIG.showAuthors;

  const showReviews =
    typeof rawConfig?.showReviews === 'boolean'
      ? rawConfig.showReviews
      : showReviewsFromSettings;

  const showAuthors =
    typeof rawConfig?.showAuthors === 'boolean'
      ? rawConfig.showAuthors
      : showAuthorsFromSettings;

  const reviewsSlotReplacement =
    rawConfig?.reviewsSlotReplacement ||
    fallbackSettings?.homeReviewsSlotReplacement ||
    (showReviews ? 'reviews' : 'off');

  const authorsSlotReplacement =
    rawConfig?.authorsSlotReplacement ||
    fallbackSettings?.homeWritersSlotReplacement ||
    (showAuthors ? 'writers' : 'off');

  return {
    showReviews,
    showAuthors,
    reviewsSlotReplacement,
    authorsSlotReplacement,
    reviewIconStyle:
      rawConfig?.reviewIconStyle ||
      fallbackSettings?.homeReviewIconStyle ||
      DEFAULT_HOME_CONFIG.reviewIconStyle,
    productCardReviewSlotMode:
      rawConfig?.productCardReviewSlotMode ||
      fallbackSettings?.productCardReviewSlotMode ||
      DEFAULT_HOME_CONFIG.productCardReviewSlotMode,
    productCardWriterSlotMode:
      rawConfig?.productCardWriterSlotMode ||
      fallbackSettings?.productCardWriterSlotMode ||
      DEFAULT_HOME_CONFIG.productCardWriterSlotMode,
    updatedAt: rawConfig?.updatedAt,
  };
}

/**
 * Determines whether the Homepage Reviews section is enabled (`showReviews === true`).
 */
export function shouldRenderHomeReviewsSection(
  homeConfig?: Partial<HomeConfig> | null,
  settings?: Partial<StoreSettings> | null
): boolean {
  const resolved = resolveHomeConfig(homeConfig, settings);
  return resolved.showReviews !== false && resolved.reviewsSlotReplacement !== 'off';
}

/**
 * Determines whether the Homepage Authors section is enabled (`showAuthors === true`).
 */
export function shouldRenderHomeAuthorsSection(
  homeConfig?: Partial<HomeConfig> | null,
  settings?: Partial<StoreSettings> | null
): boolean {
  const resolved = resolveHomeConfig(homeConfig, settings);
  return resolved.showAuthors !== false && resolved.authorsSlotReplacement !== 'off';
}

/**
 * Resolves the active slot mode for the Reviews section on the Home page.
 * When `homeConfig.showReviews` is false, returns `'off'` unless a non-reviews replacement feature was explicitly chosen.
 */
export function resolveHomeReviewsSlotMode(
  homeConfig?: Partial<HomeConfig> | null,
  settings?: Partial<StoreSettings> | null
): NonNullable<HomeConfig['reviewsSlotReplacement']> {
  const resolved = resolveHomeConfig(homeConfig, settings);
  if (!resolved.showReviews) {
    return 'off';
  }
  return resolved.reviewsSlotReplacement && resolved.reviewsSlotReplacement !== 'off'
    ? resolved.reviewsSlotReplacement
    : 'reviews';
}

/**
 * Resolves the active slot mode for the Authors section on the Home page.
 * When `homeConfig.showAuthors` is false, returns `'off'`.
 */
export function resolveHomeAuthorsSlotMode(
  homeConfig?: Partial<HomeConfig> | null,
  settings?: Partial<StoreSettings> | null
): NonNullable<HomeConfig['authorsSlotReplacement']> {
  const resolved = resolveHomeConfig(homeConfig, settings);
  if (!resolved.showAuthors) {
    return 'off';
  }
  return resolved.authorsSlotReplacement && resolved.authorsSlotReplacement !== 'off'
    ? resolved.authorsSlotReplacement
    : 'writers';
}

/**
 * Maps a `HomeConfig` update patch to corresponding `StoreSettings` fields
 * so `settings/general` and `settings/homeConfig` stay synchronized.
 */
export function buildSettingsMirrorFromHomeConfig(
  configPatch: Partial<HomeConfig>
): Partial<StoreSettings> {
  const mirror: Partial<StoreSettings> = {};

  if (typeof configPatch.showReviews === 'boolean') {
    mirror.showHomeReviewsSection = configPatch.showReviews;
    if (!configPatch.showReviews && !configPatch.reviewsSlotReplacement) {
      mirror.homeReviewsSlotReplacement = 'off';
    } else if (configPatch.showReviews && !configPatch.reviewsSlotReplacement) {
      mirror.homeReviewsSlotReplacement = 'reviews';
    }
  }
  if (configPatch.reviewsSlotReplacement !== undefined) {
    mirror.homeReviewsSlotReplacement = configPatch.reviewsSlotReplacement;
  }
  if (typeof configPatch.showAuthors === 'boolean') {
    mirror.showHomeWritersSection = configPatch.showAuthors;
    if (!configPatch.showAuthors && !configPatch.authorsSlotReplacement) {
      mirror.homeWritersSlotReplacement = 'off';
    } else if (configPatch.showAuthors && !configPatch.authorsSlotReplacement) {
      mirror.homeWritersSlotReplacement = 'writers';
    }
  }
  if (configPatch.authorsSlotReplacement !== undefined) {
    mirror.homeWritersSlotReplacement = configPatch.authorsSlotReplacement;
  }
  if (configPatch.reviewIconStyle !== undefined) {
    mirror.homeReviewIconStyle = configPatch.reviewIconStyle;
  }
  if (configPatch.productCardReviewSlotMode !== undefined) {
    mirror.productCardReviewSlotMode = configPatch.productCardReviewSlotMode;
  }
  if (configPatch.productCardWriterSlotMode !== undefined) {
    mirror.productCardWriterSlotMode = configPatch.productCardWriterSlotMode;
  }

  return mirror;
}

/**
 * Maps a `StoreSettings` update patch to corresponding `HomeConfig` fields if any homepage
 * visibility or slot fields were modified.
 */
export function buildHomeConfigMirrorFromSettings(
  settingsPatch: Partial<StoreSettings>
): Partial<HomeConfig> | null {
  const patch: Partial<HomeConfig> = {};
  let hasChanges = false;

  if (typeof settingsPatch.showHomeReviewsSection === 'boolean') {
    patch.showReviews = settingsPatch.showHomeReviewsSection;
    hasChanges = true;
  }
  if (settingsPatch.homeReviewsSlotReplacement !== undefined) {
    patch.reviewsSlotReplacement = settingsPatch.homeReviewsSlotReplacement;
    if (settingsPatch.homeReviewsSlotReplacement === 'off') {
      patch.showReviews = false;
    } else if (settingsPatch.showHomeReviewsSection === undefined) {
      patch.showReviews = true;
    }
    hasChanges = true;
  }
  if (typeof settingsPatch.showHomeWritersSection === 'boolean') {
    patch.showAuthors = settingsPatch.showHomeWritersSection;
    hasChanges = true;
  }
  if (settingsPatch.homeWritersSlotReplacement !== undefined) {
    patch.authorsSlotReplacement = settingsPatch.homeWritersSlotReplacement;
    if (settingsPatch.homeWritersSlotReplacement === 'off') {
      patch.showAuthors = false;
    } else if (settingsPatch.showHomeWritersSection === undefined) {
      patch.showAuthors = true;
    }
    hasChanges = true;
  }
  if (settingsPatch.homeReviewIconStyle !== undefined) {
    patch.reviewIconStyle = settingsPatch.homeReviewIconStyle;
    hasChanges = true;
  }
  if (settingsPatch.productCardReviewSlotMode !== undefined) {
    patch.productCardReviewSlotMode = settingsPatch.productCardReviewSlotMode;
    hasChanges = true;
  }
  if (settingsPatch.productCardWriterSlotMode !== undefined) {
    patch.productCardWriterSlotMode = settingsPatch.productCardWriterSlotMode;
    hasChanges = true;
  }

  return hasChanges ? patch : null;
}
