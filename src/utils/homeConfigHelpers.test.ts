import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_HOME_CONFIG,
  resolveHomeConfig,
  shouldRenderHomeReviewsSection,
  shouldRenderHomeAuthorsSection,
  resolveHomeReviewsSlotMode,
  resolveHomeAuthorsSlotMode,
  buildSettingsMirrorFromHomeConfig,
  buildHomeConfigMirrorFromSettings,
  resolveNewArrivalsTitle,
} from './homeConfigHelpers';

describe('homeConfigHelpers', () => {
  it('returns default HomeConfig with showReviews=true and showAuthors=true when no config or settings are passed', () => {
    const cfg = resolveHomeConfig(undefined, undefined);
    assert.equal(cfg.showReviews, true);
    assert.equal(cfg.showAuthors, true);
    assert.equal(cfg.reviewsSlotReplacement, 'reviews');
    assert.equal(cfg.authorsSlotReplacement, 'writers');
    assert.equal(cfg.reviewIconStyle, DEFAULT_HOME_CONFIG.reviewIconStyle);
  });

  it('prioritizes explicit homeConfig.showReviews and homeConfig.showAuthors over fallback settings', () => {
    const cfg = resolveHomeConfig(
      { showReviews: false, showAuthors: false },
      { showHomeReviewsSection: true, showHomeWritersSection: true }
    );
    assert.equal(cfg.showReviews, false);
    assert.equal(cfg.showAuthors, false);
    assert.equal(shouldRenderHomeReviewsSection(cfg), false);
    assert.equal(shouldRenderHomeAuthorsSection(cfg), false);
    assert.equal(resolveHomeReviewsSlotMode(cfg), 'off');
    assert.equal(resolveHomeAuthorsSlotMode(cfg), 'off');
  });

  it('falls back to StoreSettings flags when homeConfig fields are undefined', () => {
    const cfg = resolveHomeConfig(
      {},
      { showHomeReviewsSection: false, showHomeWritersSection: true }
    );
    assert.equal(cfg.showReviews, false);
    assert.equal(cfg.showAuthors, true);
    assert.equal(shouldRenderHomeReviewsSection({}, { showHomeReviewsSection: false }), false);
    assert.equal(shouldRenderHomeAuthorsSection({}, { showHomeWritersSection: true }), true);
  });

  it('resolves replacement slot modes when showReviews or showAuthors is true', () => {
    const cfg = resolveHomeConfig({
      showReviews: true,
      reviewsSlotReplacement: 'trust_features',
      showAuthors: true,
      authorsSlotReplacement: 'publishers_spotlight',
    });
    assert.equal(resolveHomeReviewsSlotMode(cfg), 'trust_features');
    assert.equal(resolveHomeAuthorsSlotMode(cfg), 'publishers_spotlight');
  });

  it('builds bi-directional mirrors between HomeConfig and StoreSettings', () => {
    const settingsMirror = buildSettingsMirrorFromHomeConfig({
      showReviews: false,
      showAuthors: true,
    });
    assert.equal(settingsMirror.showHomeReviewsSection, false);
    assert.equal(settingsMirror.homeReviewsSlotReplacement, 'off');
    assert.equal(settingsMirror.showHomeWritersSection, true);
    assert.equal(settingsMirror.homeWritersSlotReplacement, 'writers');

    const homeConfigMirror = buildHomeConfigMirrorFromSettings({
      showHomeReviewsSection: true,
      showHomeWritersSection: false,
      homeWritersSlotReplacement: 'off',
    });
    assert.ok(homeConfigMirror);
    assert.equal(homeConfigMirror.showReviews, true);
    assert.equal(homeConfigMirror.showAuthors, false);
    assert.equal(homeConfigMirror.authorsSlotReplacement, 'off');
  });

  it('resolves New Arrivals heading cleanly in English without Bengali suffix and allows Admin override', () => {
    assert.equal(resolveNewArrivalsTitle(undefined), 'New Arrivals Collection');
    assert.equal(
      resolveNewArrivalsTitle({ newArrivalsTitle: 'New Arrivals Collection / নতুন বই কালেকশন' }),
      'New Arrivals Collection'
    );
    assert.equal(
      resolveNewArrivalsTitle({ newArrivalsTitle: 'Latest Releases' }),
      'Latest Releases'
    );
  });

  it('defaults productImageFitMode to cover and mirrors changes between HomeConfig and StoreSettings', () => {
    const defaultCfg = resolveHomeConfig(undefined, undefined);
    assert.equal(defaultCfg.productImageFitMode, 'cover');

    const settingsMirror = buildSettingsMirrorFromHomeConfig({
      productImageFitMode: 'contain',
    });
    assert.equal(settingsMirror.productImageFitMode, 'contain');

    const homeConfigMirror = buildHomeConfigMirrorFromSettings({
      productImageFitMode: 'contain',
    });
    assert.ok(homeConfigMirror);
    assert.equal(homeConfigMirror.productImageFitMode, 'contain');
  });
});
