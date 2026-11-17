import React from 'react';
import { Users } from 'lucide-react';
import { renderGreenReviewIcon } from '../../ProductCard';
import {
  type HomeVisibilityTabProps,
  SettingsSectionHeader,
  SettingsSwitch,
  S_INPUT,
  S_LABEL,
  S_SELECT,
} from './settingsShared';

export const AdminSettingsHomeTab: React.FC<HomeVisibilityTabProps> = ({
  settings,
  siteSettings,
  homeConfig,
  updateSiteSettings,
  updateHomeConfig,
  setToast,
}) => {
  const reviewDisplayOn = siteSettings.reviewDisplay !== false;
  const authorInfoOn = siteSettings.authorInfo !== false;
  const deliveryTimingOn = siteSettings.deliveryTimingDisplay !== false;
  const showReviewsOnHome = homeConfig.showReviews !== false;
  const showAuthorsOnHome = homeConfig.showAuthors !== false;

  return (
    <div
      data-testid="admin-home-page-settings-section"
      className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200/80"
    >
      {/* Global Storefront Visibility */}
      <div className="p-4 sm:px-5">
        <SettingsSectionHeader
          title="Global Storefront Visibility"
          description="Control visibility of ratings, author names, and delivery estimates across Home, product cards, and product detail pages."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50/40">
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-900">Review Display</div>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                Ratings, Home reviews &amp; detail reviews
              </p>
            </div>
            <SettingsSwitch
              checked={reviewDisplayOn}
              ariaLabel="Toggle global Review Display"
              testId="site-settings-review-display-toggle"
              onChange={async () => {
                const nextVal = !reviewDisplayOn;
                await updateSiteSettings({ reviewDisplay: nextVal });
                setToast({
                  show: true,
                  type: 'success',
                  message: `Review Display ${nextVal ? 'enabled' : 'hidden'}.`,
                });
              }}
            />
          </div>

          <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50/40">
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-900">Author Info</div>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                Writer names on cards &amp; Home Authors
              </p>
            </div>
            <SettingsSwitch
              checked={authorInfoOn}
              ariaLabel="Toggle global Author Info"
              testId="site-settings-author-info-toggle"
              onChange={async () => {
                const nextVal = !authorInfoOn;
                await updateSiteSettings({ authorInfo: nextVal });
                setToast({
                  show: true,
                  type: 'success',
                  message: `Author Info ${nextVal ? 'enabled' : 'hidden'}.`,
                });
              }}
            />
          </div>

          <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50/40">
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-900">Delivery Timing</div>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                Delivery timing block on product pages
              </p>
            </div>
            <SettingsSwitch
              checked={deliveryTimingOn}
              ariaLabel="Toggle global Delivery Timing section"
              testId="site-settings-delivery-timing-toggle"
              onChange={async () => {
                const nextVal = !deliveryTimingOn;
                await updateSiteSettings({ deliveryTimingDisplay: nextVal });
                setToast({
                  show: true,
                  type: 'success',
                  message: `Delivery Timing ${nextVal ? 'enabled' : 'hidden'}.`,
                });
              }}
            />
          </div>
        </div>
      </div>

      {/* Home Sections Configuration (Reviews & Authors) */}
      <div className="p-4 sm:px-5">
        <SettingsSectionHeader
          title="Home Page Sections"
          description="Choose which featured modules appear on the homepage and how cards display metadata."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Reviews Section */}
          <div
            data-testid="home-config-reviews-card"
            className="p-3.5 rounded-lg border border-slate-200 space-y-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                    showReviewsOnHome
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-slate-100 border-slate-200 text-slate-400'
                  }`}
                >
                  {renderGreenReviewIcon(
                    homeConfig.reviewIconStyle || settings.homeReviewIconStyle,
                    14
                  )}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900">Reviews Section</div>
                  <p className="text-[11px] text-slate-500 truncate">
                    {showReviewsOnHome ? 'Visible on Home' : 'Hidden on Home'}
                  </p>
                </div>
              </div>
              <SettingsSwitch
                checked={showReviewsOnHome}
                ariaLabel="Toggle Reviews component on Home page"
                testId="home-config-reviews-toggle"
                onChange={async () => {
                  const nextShow = !showReviewsOnHome;
                  await updateHomeConfig({
                    showReviews: nextShow,
                    reviewsSlotReplacement: nextShow
                      ? homeConfig.reviewsSlotReplacement === 'off'
                        ? 'reviews'
                        : homeConfig.reviewsSlotReplacement || 'reviews'
                      : 'off',
                  });
                  setToast({
                    show: true,
                    type: 'success',
                    message: `Home Reviews section ${nextShow ? 'enabled' : 'hidden'}.`,
                  });
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2.5 border-t border-slate-100">
              <div>
                <label className={S_LABEL}>Reviews Slot Mode</label>
                <select
                  data-testid="home-config-reviews-slot-select"
                  value={
                    homeConfig.showReviews === false
                      ? 'off'
                      : homeConfig.reviewsSlotReplacement || 'reviews'
                  }
                  onChange={async e => {
                    const val = e.target.value as
                      | 'reviews'
                      | 'trust_features'
                      | 'publishers_spotlight'
                      | 'reading_benefits'
                      | 'off';
                    await updateHomeConfig({
                      showReviews: val !== 'off',
                      reviewsSlotReplacement: val,
                    });
                    setToast({
                      show: true,
                      type: 'success',
                      message: `Updated Reviews slot mode to ${val}.`,
                    });
                  }}
                  className={S_SELECT}
                >
                  <option value="reviews">Customer Reviews Carousel</option>
                  <option value="trust_features">Store Trust Guarantees</option>
                  <option value="publishers_spotlight">Official Publications</option>
                  <option value="reading_benefits">Reader Perks Banner</option>
                  <option value="off">Off (Hidden)</option>
                </select>
              </div>

              <div>
                <label className={S_LABEL}>Review Rating Icon</label>
                <select
                  data-testid="home-config-reviews-icon-select"
                  value={homeConfig.reviewIconStyle || settings.homeReviewIconStyle || 'heart'}
                  onChange={async e => {
                    const style = e.target.value as
                      | 'heart'
                      | 'verified_shield'
                      | 'thumbs_up'
                      | 'check_badge'
                      | 'sparkles'
                      | 'book_love';
                    await updateHomeConfig({ reviewIconStyle: style });
                    setToast({
                      show: true,
                      type: 'success',
                      message: `Updated review icon style.`,
                    });
                  }}
                  className={S_SELECT}
                >
                  <option value="heart">Green Heart</option>
                  <option value="verified_shield">Trust Shield</option>
                  <option value="thumbs_up">Thumbs Up</option>
                  <option value="check_badge">Check Badge</option>
                  <option value="sparkles">Sparkles</option>
                  <option value="book_love">Book Icon</option>
                </select>
              </div>
            </div>
          </div>

          {/* Authors Section */}
          <div
            data-testid="home-config-authors-card"
            className="p-3.5 rounded-lg border border-slate-200 space-y-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                    showAuthorsOnHome
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-slate-100 border-slate-200 text-slate-400'
                  }`}
                >
                  <Users size={14} />
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900">Authors Section</div>
                  <p className="text-[11px] text-slate-500 truncate">
                    {showAuthorsOnHome ? 'Visible on Home' : 'Hidden on Home'}
                  </p>
                </div>
              </div>
              <SettingsSwitch
                checked={showAuthorsOnHome}
                ariaLabel="Toggle Authors component on Home page"
                testId="home-config-authors-toggle"
                onChange={async () => {
                  const nextShow = !showAuthorsOnHome;
                  await updateHomeConfig({
                    showAuthors: nextShow,
                    authorsSlotReplacement: nextShow
                      ? homeConfig.authorsSlotReplacement === 'off'
                        ? 'writers'
                        : homeConfig.authorsSlotReplacement || 'writers'
                      : 'off',
                  });
                  setToast({
                    show: true,
                    type: 'success',
                    message: `Home Authors section ${nextShow ? 'enabled' : 'hidden'}.`,
                  });
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2.5 border-t border-slate-100">
              <div>
                <label className={S_LABEL}>Authors Slot Mode</label>
                <select
                  data-testid="home-config-authors-slot-select"
                  value={
                    homeConfig.showAuthors === false
                      ? 'off'
                      : homeConfig.authorsSlotReplacement || 'writers'
                  }
                  onChange={async e => {
                    const val = e.target.value as
                      | 'writers'
                      | 'publishers_spotlight'
                      | 'bestsellers_showcase'
                      | 'trust_features'
                      | 'reading_benefits'
                      | 'off';
                    await updateHomeConfig({
                      showAuthors: val !== 'off',
                      authorsSlotReplacement: val,
                    });
                    setToast({
                      show: true,
                      type: 'success',
                      message: `Updated Authors slot mode to ${val}.`,
                    });
                  }}
                  className={S_SELECT}
                >
                  <option value="writers">Featured Authors Carousel</option>
                  <option value="publishers_spotlight">Official Publications</option>
                  <option value="bestsellers_showcase">Bestsellers Showcase</option>
                  <option value="trust_features">Store Trust Guarantees</option>
                  <option value="reading_benefits">Reader Perks Banner</option>
                  <option value="off">Off (Hidden)</option>
                </select>
              </div>

              <div>
                <label className={S_LABEL}>Book Card Subtitle Line</label>
                <select
                  data-testid="home-config-card-writer-select"
                  value={homeConfig.productCardWriterSlotMode || settings.productCardWriterSlotMode || 'writer_name'}
                  onChange={async e => {
                    const mode = e.target.value as
                      | 'writer_name'
                      | 'publisher_name'
                      | 'category_name'
                      | 'edition_info'
                      | 'delivery_badge'
                      | 'off';
                    await updateHomeConfig({ productCardWriterSlotMode: mode });
                    setToast({
                      show: true,
                      type: 'success',
                      message: `Updated book card subtitle line.`,
                    });
                  }}
                  className={S_SELECT}
                >
                  <option value="writer_name">Show Writer Name</option>
                  <option value="publisher_name">Show Publisher Name</option>
                  <option value="category_name">Show Category Name</option>
                  <option value="edition_info">Show Edition Badge</option>
                  <option value="delivery_badge">Fast COD Badge</option>
                  <option value="off">Hide Writer Line</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Storefront Catalog Display */}
      <div className="p-4 sm:px-5">
        <SettingsSectionHeader
          title="Catalog Section & Product Media"
          description="Set the New Arrivals heading and how cover images fit inside product card thumbnails."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={S_LABEL}>New Arrivals Section Heading</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                data-testid="home-config-new-arrivals-title-input"
                defaultValue={homeConfig.newArrivalsTitle || 'New Arrivals Collection'}
                key={homeConfig.newArrivalsTitle || 'New Arrivals Collection'}
                onBlur={async e => {
                  const nextVal = e.target.value.trim() || 'New Arrivals Collection';
                  if (nextVal !== (homeConfig.newArrivalsTitle || 'New Arrivals Collection')) {
                    await updateHomeConfig({ newArrivalsTitle: nextVal });
                    setToast({
                      show: true,
                      type: 'success',
                      message: `Updated New Arrivals heading to ${nextVal}.`,
                    });
                  }
                }}
                placeholder="New Arrivals Collection"
                className={S_INPUT}
              />
              <button
                type="button"
                onClick={async e => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement | null;
                  const nextVal = input?.value.trim() || 'New Arrivals Collection';
                  await updateHomeConfig({ newArrivalsTitle: nextVal });
                  setToast({
                    show: true,
                    type: 'success',
                    message: `Saved heading: ${nextVal}`,
                  });
                }}
                className="h-8 px-3 rounded-lg bg-[#D71920] hover:bg-[#B9151B] text-white text-xs font-medium cursor-pointer shrink-0 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>

          <div>
            <label className={S_LABEL}>Product Image Display Ratio</label>
            <select
              data-testid="home-config-image-fit-select"
              value={homeConfig.productImageFitMode || settings.productImageFitMode || 'cover'}
              onChange={async e => {
                const mode = e.target.value as 'cover' | 'contain';
                await updateHomeConfig({ productImageFitMode: mode });
                setToast({
                  show: true,
                  type: 'success',
                  message: `Updated product image mode to ${mode === 'cover' ? 'Square Full-Bleed' : 'Uncropped Fit'}.`,
                });
              }}
              className={S_SELECT}
            >
              <option value="cover">1:1 Square Full-Bleed Zoom (Default)</option>
              <option value="contain">Padded Uncropped Fit (Letterboxed)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
