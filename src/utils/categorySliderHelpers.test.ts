import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeNextCategorySlideOffset,
  computeDirectionalCategorySlideOffset,
} from './categorySliderHelpers';

describe('categorySliderHelpers', () => {
  it('returns 0 when all categories already fit without overflow', () => {
    assert.equal(
      computeNextCategorySlideOffset({
        scrollLeft: 0,
        clientWidth: 1200,
        scrollWidth: 1180,
        stepWidth: 260,
      }),
      0
    );
  });

  it('advances smoothly by stepWidth and snaps cleanly to maxScrollLeft near the end', () => {
    assert.equal(
      computeNextCategorySlideOffset({
        scrollLeft: 0,
        clientWidth: 1000,
        scrollWidth: 1400,
        stepWidth: 140,
      }),
      140
    );

    assert.equal(
      computeNextCategorySlideOffset({
        scrollLeft: 270,
        clientWidth: 1000,
        scrollWidth: 1400,
        stepWidth: 140,
      }),
      400
    );
  });

  it('wraps back to 0 once the slider has reached the end', () => {
    assert.equal(
      computeNextCategorySlideOffset({
        scrollLeft: 400,
        clientWidth: 1000,
        scrollWidth: 1400,
        stepWidth: 140,
      }),
      0
    );
  });

  it('supports manual left and right directional stepping with wrap-around', () => {
    assert.equal(
      computeDirectionalCategorySlideOffset(
        { scrollLeft: 0, clientWidth: 400, scrollWidth: 1000, stepWidth: 220 },
        'right'
      ),
      220
    );
    assert.equal(
      computeDirectionalCategorySlideOffset(
        { scrollLeft: 600, clientWidth: 400, scrollWidth: 1000, stepWidth: 220 },
        'right'
      ),
      0
    );
    assert.equal(
      computeDirectionalCategorySlideOffset(
        { scrollLeft: 0, clientWidth: 400, scrollWidth: 1000, stepWidth: 220 },
        'left'
      ),
      600
    );
    assert.equal(
      computeDirectionalCategorySlideOffset(
        { scrollLeft: 300, clientWidth: 400, scrollWidth: 1000, stepWidth: 220 },
        'left'
      ),
      80
    );
  });
});
