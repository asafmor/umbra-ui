import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectChangeHighlights } from './live';

// ProgressBar and LevelMeter: roles and spoken values, positions, motion, and each step of showing
// less as the container shrinks.
const open = async (page: Page, id: string) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`/iframe.html?id=${id}&viewMode=story`);
  await page.locator('#storybook-root > *').first().waitFor();
  await page.evaluate(async () => {
    await Promise.all(
      [...document.fonts].filter((f) => f.unicodeRange.startsWith('U+0-FF')).map((f) => f.load()),
    );
    await document.fonts.ready;
  });
};

const box = async (locator: Locator) => (await locator.boundingBox())!;
const resize = (locator: Locator, size: { width?: number; height?: number }) =>
  locator.evaluate((el, s) => {
    if (s.width) (el as HTMLElement).style.width = `${s.width}px`;
    if (s.height) (el as HTMLElement).style.height = `${s.height}px`;
  }, size);
/** Where the centre of `mark` sits along `plot`, from 0 to 1. */
const along = async (mark: Locator, plot: Locator, axis: 'x' | 'y' = 'x') => {
  const [m, p] = [await box(mark), await box(plot)];
  return axis === 'x'
    ? (m.x + m.width / 2 - p.x) / p.width
    : (p.y + p.height - (m.y + m.height / 2)) / p.height;
};

test.describe('ProgressBar', () => {
  test('task progress is a progressbar and a measured level is a meter, with the value in words', async ({
    page,
  }) => {
    await open(page, 'meters-progressbar--variants');
    const progress = page.getByRole('progressbar', { name: 'Budget used' }).nth(1);
    await expect(progress).toHaveAttribute('aria-valuenow', '64');
    await expect(progress).toHaveAttribute('aria-valuetext', '64%');

    const storage = page.getByRole('meter', { name: 'Storage' });
    await expect(storage).toHaveAttribute('aria-valuenow', '320');
    await expect(storage).toHaveAttribute('aria-valuemax', '500');
    await expect(storage).toHaveAttribute('aria-valuetext', '320 GB');

    // The parts of a stacked bar and the target are read out, since they are only drawn.
    await expect(page.getByRole('meter', { name: 'Budget used' }).first()).toHaveAttribute(
      'aria-valuetext',
      '75%, Region 1 40%, Region 2 25%, Region 3 10%',
    );
    await expect(page.getByRole('meter', { name: 'Past the goal' })).toHaveAttribute(
      'aria-valuetext',
      '92%, Goal: 75%',
    );
  });

  test('hovering a bar shows its exact value in a tooltip, unless `tooltip` is off', async ({ page }) => {
    await open(page, 'meters-progressbar--variants');
    const tooltip = page.getByRole('tooltip');
    await page.getByRole('meter', { name: 'Storage' }).hover();
    await expect(tooltip).toHaveText('320 GB');
    // The tooltip says everything the bar only draws: the parts of a stack, the target.
    await page.getByRole('meter', { name: 'Budget used' }).first().hover();
    await expect(tooltip).toHaveText('75%, Region 1 40%, Region 2 25%, Region 3 10%');
    await page.keyboard.press('Escape');
    await expect(tooltip).toHaveCount(0);
    await page.getByRole('meter', { name: 'Past the goal' }).hover();
    await page.waitForTimeout(700);
    await expect(tooltip).toHaveCount(0);
  });

  test('the fill, the segments and the target sit at their share of the track', async ({ page }) => {
    await open(page, 'meters-progressbar--variants');
    const bar = page.getByRole('meter', { name: 'Budget used' }).nth(1);
    const track = bar.locator('[data-part="track"]');
    const [fill, whole] = [await box(bar.locator('[data-part="fill"]')), await box(track)];
    expect(fill.width / whole.width).toBeCloseTo(0.64, 2);
    expect(await along(bar.locator('[data-part="target"]'), track)).toBeCloseTo(0.8, 2);

    // 3 of 5 segments are full and 2 are empty.
    const steps = page.getByRole('progressbar', { name: 'Steps done' }).locator('[data-part="fill"]');
    await expect(steps).toHaveCount(5);
    const widths = await steps.evaluateAll((fills) =>
      fills.map((f) => Math.round((100 * f.clientWidth) / f.parentElement!.clientWidth)),
    );
    expect(widths).toEqual([100, 100, 100, 0, 0]);

    // Explicit stops at 20, 50 and 80: the value 62 fills two segments and 40% of the third.
    const stops = page.getByRole('progressbar', { name: 'Explicit stops' }).locator('[data-part="fill"]');
    expect(
      await stops.evaluateAll((fills) =>
        fills.map((f) => Math.round((100 * f.clientWidth) / f.parentElement!.clientWidth)),
      ),
    ).toEqual([100, 100, 40, 0]);
  });

  test('a threshold sets the tone, a pattern and the spoken label; lowerIsBetter mirrors the tones', async ({
    page,
  }) => {
    await open(page, 'meters-progressbar--thresholds');
    const low = page.getByRole('meter', { name: 'Skill level' }).first();
    await expect(low).toHaveAttribute('aria-valuetext', '20%, Low');
    await expect(low.locator('[data-part="value"]')).toHaveText('20% · Low');
    const fill = low.locator('[data-part="fill"]');
    await expect(fill).toHaveAttribute('data-tone', 'danger');
    await expect(fill).toHaveAttribute('data-pattern', 'diagonal');
    expect(await fill.evaluate((el) => getComputedStyle(el).backgroundImage)).toContain(
      'repeating-linear-gradient',
    );

    const inverted = page.getByRole('meter', { name: 'Budget used' });
    await expect(inverted.first().locator('[data-part="fill"]')).toHaveAttribute('data-tone', 'success');
    await expect(inverted.first()).toHaveAttribute('aria-valuetext', '20%, Low');
    await expect(inverted.last().locator('[data-part="fill"]')).toHaveAttribute('data-tone', 'danger');
  });

  test('values outside the scale clamp the bar and keep the real value in the text', async ({ page }) => {
    await open(page, 'meters-progressbar--edge-values');
    const over = page.getByRole('meter', { name: 'Over: budget used' });
    await expect(over).toHaveAttribute('data-out-of-range', 'over');
    await expect(over).toHaveAttribute('aria-valuenow', '100');
    await expect(over).toHaveAttribute('aria-valuetext', '120%, High');
    const [fill, track] = [
      await box(over.locator('[data-part="fill"]')),
      await box(over.locator('[data-part="track"]')),
    ];
    expect(fill.width).toBeCloseTo(track.width, 0);

    const negative = page.getByRole('meter', { name: 'Negative' });
    await expect(negative).toHaveAttribute('data-out-of-range', 'under');
    await expect(negative).toHaveAttribute('aria-valuenow', '0');
    await expect(negative.locator('[data-part="value"]')).toHaveText('-20%');
    expect((await box(negative.locator('[data-part="fill"]'))).width).toBe(0);
  });

  test('a bar with no value is empty and says so, instead of reading as zero', async ({ page }) => {
    await open(page, 'meters-progressbar--edge-values');
    const none = page.getByRole('meter', { name: 'Not measured' });
    await expect(none).toHaveAttribute('data-empty', 'true');
    await expect(none).toHaveAttribute('aria-valuetext', 'No value');
    await expect(none.locator('[data-part="value"]')).toHaveText('—');
    expect((await box(none.locator('[data-part="fill"]'))).width).toBe(0);
    await expect(none).not.toHaveAttribute('data-out-of-range');

    const custom = page.getByRole('progressbar', { name: 'Not started' });
    await expect(custom).toHaveAttribute('aria-valuetext', 'Not available');
    await expect(custom.locator('[data-part="value"]')).toHaveText('n/a');
    // The target is still read out.
    await expect(page.getByRole('meter', { name: 'Capacity' })).toHaveAttribute(
      'aria-valuetext',
      'No value, Target: 80%',
    );
    // Zero stays zero.
    await expect(page.getByRole('progressbar', { name: 'Zero' })).toHaveAttribute('aria-valuetext', '0%');
  });

  test('loading shows skeletons in the same layout and no value', async ({ page }) => {
    await open(page, 'meters-progressbar--edge-values');
    const loading = page.locator('[data-umbra="progress-bar"][data-loading]').first();
    await expect(loading).toHaveAttribute('aria-busy', 'true');
    await expect(loading).toContainText('Budget used');
    await expect(
      loading.locator('[data-part="track"] > [data-part="skeleton"] > [data-umbra="skeleton"]'),
    ).toBeVisible();
    await expect(loading.locator('[data-part="fill"]')).toHaveCount(0);
    await expect(loading.getByRole('progressbar')).toHaveCount(0);
    const [loaded, skeleton] = [
      await box(page.getByRole('progressbar', { name: 'Zero' }).locator('[data-part="track"]')),
      await box(loading.locator('[data-part="track"]')),
    ];
    expect(skeleton.height).toBe(loaded.height);
  });

  test('an indeterminate bar moves, and stands still with stripes when motion is reduced', async ({
    page,
  }) => {
    await open(page, 'meters-progressbar--edge-values');
    const bars = page.getByRole('progressbar', { name: 'Syncing' });
    await expect(bars.first()).not.toHaveAttribute('aria-valuenow');
    const state = (bar: Locator) =>
      bar.locator('[data-part="fill"]').evaluate((el) => {
        const style = getComputedStyle(el);
        const width = el.clientWidth / el.parentElement!.clientWidth;
        const travel = el.getAnimations()[0]?.effect as KeyframeEffect;
        el.getAnimations()[0]!.currentTime = 700;
        const moved = getComputedStyle(el).translate;
        // The stripes are drawn in the first colour stop after `transparent`.
        const ink = /rgba?\([^)]*\)|oklab\([^)]*\)|color\([^)]*\)/g;
        return { width, moved, stripes: style.backgroundImage.match(ink)?.[2], keyframes: !!travel };
      });

    const moving = await state(bars.first());
    expect(moving.width).toBeCloseTo(0.4, 2);
    expect(moving.moved).not.toMatch(/^(none|0px|0%)$/);

    // The third and fourth bars sit in a scope with the motion scale at 0, like reduced motion.
    const still = await state(bars.nth(2));
    expect(still.width).toBeCloseTo(1, 2);
    expect(still.moved).toMatch(/^(none|0px|0%)$/);
    expect(still.stripes).not.toBe(moving.stripes);

    // The system setting does the same to the first bar.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const reduced = await state(bars.first());
    expect(reduced.width).toBeCloseTo(1, 2);
    expect(reduced.moved).toMatch(/^(none|0px|0%)$/);
  });

  test('as the width shrinks the value hides, then the label truncates, and the bar stays', async ({
    page,
  }) => {
    await open(page, 'meters-progressbar--shrink');
    for (const [panel, steps] of [
      [0, { roomy: 320, noValue: 150, truncated: 90, tiny: 28 }],
      [1, { roomy: 320, noValue: 175, truncated: 100, tiny: 60 }],
    ] as const) {
      const holder = page.locator('section').nth(panel).locator('[data-width="320"]');
      const bar = holder.getByRole('progressbar');
      const label = bar.locator('[data-part="label"]');
      const value = bar.locator('[data-part="value"]');
      const track = bar.locator('[data-part="track"]');
      const truncated = () => label.evaluate((el) => el.scrollWidth > el.clientWidth);

      await expect(value).toHaveText('64%');
      expect(await truncated()).toBe(false);

      await resize(holder, { width: steps.noValue });
      await expect(value).toHaveCount(0);
      await expect(bar).toHaveAttribute('data-value-hidden', 'true');
      expect(await truncated()).toBe(false);
      // The value is still there for assistive technology.
      await expect(bar).toHaveAttribute('aria-valuetext', '64%');

      await resize(holder, { width: steps.truncated });
      expect(await truncated()).toBe(true);
      expect((await box(track)).width).toBeGreaterThanOrEqual(24);

      await resize(holder, { width: steps.tiny });
      await expect(track).toBeVisible();
      expect((await box(track)).width).toBeGreaterThanOrEqual(24);
      expect(await bar.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);

      // Growing again brings everything back.
      await resize(holder, { width: steps.roomy });
      await expect(value).toHaveText('64%');
      expect(await truncated()).toBe(false);
    }
  });

  test('a value drawn inside a thick bar hides when the bar is too short for it', async ({ page }) => {
    await open(page, 'meters-progressbar--shrink');
    const holder = page.locator('section').nth(2).locator('[data-width="200"]');
    const value = holder.locator('[data-part="value"]');
    await expect(value).toBeVisible();
    const [text, track] = [await box(value), await box(holder.locator('[data-part="track"]'))];
    expect(text.x).toBeGreaterThanOrEqual(track.x);
    expect(text.x + text.width).toBeLessThanOrEqual(track.x + track.width * 0.64 + 1);
    await resize(holder, { width: 60 });
    await expect(value).toBeHidden();
  });

  test('parts replace, hide and adjust pieces, and blocks compose the same bar', async ({ page }) => {
    await open(page, 'meters-progressbar--customised');
    // A replaced label still names the bar.
    const replaced = page.getByRole('progressbar', { name: 'A node replaces the label' });
    await expect(replaced).toContainText('Replaced label');
    const hidden = page.getByRole('progressbar', { name: 'null hides the value and the target' });
    await expect(hidden.locator('[data-part="value"], [data-part="target"]')).toHaveCount(0);
    await expect(hidden).toHaveAttribute('aria-valuetext', '64%, Target: 80%');
    const adjusted = page.getByRole('progressbar', { name: 'A function adjusts the fill and the value' });
    await expect(adjusted.locator('[data-part="fill"]')).toHaveAttribute('data-tone', 'info');
    await expect(adjusted.locator('[data-part="value"]')).toHaveText('64 of 100');
    await expect(page.getByText('Loading…')).toBeVisible();

    const byHand = page.getByRole('meter', { name: 'Capacity' });
    await expect(byHand).toHaveAttribute('aria-valuetext', '64%, Target: 80%');
    await expect(byHand.locator('[data-part="target"]')).toBeVisible();

    // Tokens: height and fill colour come from the scope.
    const themed = page.getByRole('progressbar', { name: 'Capacity' });
    expect((await box(themed.locator('[data-part="track"]'))).height).toBe(10);
  });

  test('a bar is not a tab stop', async ({ page }) => {
    await open(page, 'meters-progressbar--variants');
    await page.keyboard.press('Tab');
    expect(
      await page.evaluate(() => document.activeElement?.closest('[data-umbra="progress-bar"]')),
    ).toBeNull();
  });
});

test.describe('LevelMeter', () => {
  test('it is a meter whose value text gives the level, the zone, the range and the comparison', async ({
    page,
  }) => {
    await open(page, 'meters-levelmeter--variants');
    const numeric = page.getByRole('meter', { name: 'Skill level' }).nth(1);
    await expect(numeric).toHaveAttribute('aria-valuenow', '7');
    await expect(numeric).toHaveAttribute('aria-valuemax', '10');
    await expect(numeric).toHaveAttribute('aria-valuetext', '7');

    // A named scale reads the level's label; its number is the index of the level.
    const named = page.getByRole('meter', { name: 'Skill level' }).nth(2);
    await expect(named).toHaveAttribute('aria-valuetext', 'Basic');
    await expect(named).toHaveAttribute('aria-valuenow', '1');
    await expect(named).toHaveAttribute('aria-valuemax', '4');
    await expect(named.locator('[data-part="marker"]')).toHaveAttribute('data-tone', 'ramp-2');

    await expect(page.getByRole('meter', { name: 'Estimate', exact: true })).toHaveAttribute(
      'aria-valuetext',
      'Range: 40 – 65',
    );
    await expect(page.getByRole('meter', { name: 'Estimate with a value' })).toHaveAttribute(
      'aria-valuetext',
      '58, Range: 40 – 65',
    );
    await expect(page.getByRole('meter', { name: 'Named range' })).toHaveAttribute(
      'aria-valuetext',
      'Fair, Range: Basic – Good',
    );
    await expect(page.getByRole('meter', { name: 'Capacity' }).nth(1)).toHaveAttribute(
      'aria-valuetext',
      '62, Last month: 45',
    );
    const zoned = page.getByRole('meter', { name: 'Capacity' }).nth(2);
    await expect(zoned).toHaveAttribute('aria-valuetext', '22, Poor');
    await expect(zoned.locator('[data-part="value"]')).toHaveText('22 · Poor');
    await expect(zoned.locator('[data-part="marker"]')).toHaveAttribute('data-tone', 'danger');
  });

  test('hovering a meter shows its exact value in a tooltip, unless `tooltip` is off', async ({ page }) => {
    await open(page, 'meters-levelmeter--variants');
    const tooltip = page.getByRole('tooltip');
    await page.getByRole('meter', { name: 'Skill level' }).nth(2).hover();
    await expect(tooltip).toHaveText('Basic');
    await page.getByRole('meter', { name: 'Skill level' }).nth(1).hover();
    await expect(tooltip).toHaveText('7');
    await page.mouse.move(0, 0);
    await expect(tooltip).toHaveCount(0);
    await page.getByRole('meter', { name: 'Capacity' }).first().hover();
    await page.waitForTimeout(700);
    await expect(tooltip).toHaveCount(0);
  });

  test('the marker, the band, the comparison and the zone edges sit at their place on the scale', async ({
    page,
  }) => {
    await open(page, 'meters-levelmeter--variants');
    const parts = (meter: Locator) => ({
      plot: meter.locator('[data-part="plot"]'),
      part: (name: string) => meter.locator(`[data-part="${name}"]`),
    });

    const plain = parts(page.getByRole('meter', { name: 'Skill level' }).first());
    expect(await along(plain.part('marker'), plain.plot)).toBeCloseTo(0.7, 2);
    await expect(plain.part('tick')).toHaveCount(10);
    // Ticks up to the marker are lit: 0, 1/9 … 6/9 of the scale.
    await expect(plain.plot.locator('[data-part="tick"][data-lit]')).toHaveCount(7);
    // The marker is taller and wider than a tick: it does not depend on its colour.
    const [marker, tick] = [await box(plain.part('marker')), await box(plain.part('tick').first())];
    expect(marker.height).toBeGreaterThan(tick.height);
    expect(marker.width).toBeGreaterThan(tick.width);

    const named = parts(page.getByRole('meter', { name: 'Skill level' }).nth(3));
    expect(await along(named.part('marker'), named.plot)).toBeCloseTo(0.75, 2);
    expect(await along(named.part('tick').nth(3), named.plot)).toBeCloseTo(0.75, 2);

    const ranged = parts(page.getByRole('meter', { name: 'Estimate with a value' }));
    const [band, plot] = [await box(ranged.part('band')), await box(ranged.plot)];
    expect((band.x - plot.x) / plot.width).toBeCloseTo(0.4, 2);
    expect(band.width / plot.width).toBeCloseTo(0.25, 2);
    expect(await along(ranged.part('marker'), ranged.plot)).toBeCloseTo(0.58, 2);

    const compared = parts(page.getByRole('meter', { name: 'Capacity' }).nth(1));
    expect(await along(compared.part('compare'), compared.plot)).toBeCloseTo(0.45, 2);

    const zoned = parts(page.getByRole('meter', { name: 'Capacity' }).nth(2));
    await expect(zoned.part('boundary')).toHaveCount(2);
    expect(await along(zoned.part('boundary').first(), zoned.plot)).toBeCloseTo(0.4, 2);
    expect((await box(zoned.part('boundary').first())).height).toBeGreaterThan(
      (await box(zoned.part('tick').first())).height,
    );
  });

  test('values outside the scale clamp the marker, and a missing value draws none', async ({ page }) => {
    await open(page, 'meters-levelmeter--edge-values');
    const over = page.getByRole('meter', { name: 'Over' });
    await expect(over).toHaveAttribute('data-out-of-range', 'over');
    await expect(over).toHaveAttribute('aria-valuetext', '140');
    expect(await along(over.locator('[data-part="marker"]'), over.locator('[data-part="plot"]'))).toBeCloseTo(
      1,
      2,
    );
    const negative = page.getByRole('meter', { name: 'Negative' });
    await expect(negative).toHaveAttribute('data-out-of-range', 'under');
    expect(
      await along(negative.locator('[data-part="marker"]'), negative.locator('[data-part="plot"]')),
    ).toBeCloseTo(0, 2);

    const balance = page.getByRole('meter', { name: 'Balance' }).first();
    await expect(balance).toHaveAttribute('aria-valuemin', '-50');
    expect(
      await along(balance.locator('[data-part="marker"]'), balance.locator('[data-part="plot"]')),
    ).toBeCloseTo(0.3, 2);

    // No value is not zero (B6): no marker, no lit tick, a dash for the eye and words for the ear.
    for (const name of ['No value', 'Unknown level']) {
      const meter = page.getByRole('meter', { name });
      await expect(meter).toHaveAttribute('data-empty', 'true');
      await expect(meter.locator('[data-part="marker"]')).toHaveCount(0);
      await expect(meter.locator('[data-part="tick"][data-lit]')).toHaveCount(0);
      await expect(meter).toHaveAttribute('aria-valuetext', 'No value');
      await expect(meter.locator('[data-part="value"]')).toHaveText('—');
    }
    const custom = page.getByRole('meter', { name: 'Not rated' });
    await expect(custom).toHaveAttribute('aria-valuetext', 'Not rated yet');
    await expect(custom.locator('[data-part="value"]')).toHaveText('n/a');

    const loading = page.locator('[data-umbra="level-meter"][data-loading]').first();
    await expect(loading).toHaveAttribute('aria-busy', 'true');
    await expect(loading.locator('[data-part="skeleton"] > [data-umbra="skeleton"]')).toBeVisible();
    await expect(loading.locator('[data-umbra="skeleton"]').first()).toBeVisible();
    await expect(loading.locator('[data-part="tick"]')).toHaveCount(0);
    expect((await box(loading.locator('[data-umbra="skeleton"]').first())).height).toBe(
      (await box(over.locator('[data-part="strip"]'))).height,
    );
  });

  test('as the width shrinks the end labels hide, then the ticks thin; the marker and the band stay', async ({
    page,
  }) => {
    await open(page, 'meters-levelmeter--shrink');
    const holder = page.locator('[data-width="360"]');
    const meter = holder.getByRole('meter');
    const ticks = meter.locator('[data-part="tick"]');
    const ends = meter.locator('[data-part="minLabel"], [data-part="maxLabel"]');
    const stays = async () => {
      await expect(meter.locator('[data-part="marker"]')).toBeVisible();
      await expect(meter.locator('[data-part="band"]')).toBeVisible();
      expect(await meter.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
      expect(
        await along(meter.locator('[data-part="marker"]'), meter.locator('[data-part="plot"]')),
      ).toBeCloseTo(0.6, 1);
    };

    await expect(ends).toHaveText(['Empty', 'Full']);
    await expect(ticks).toHaveCount(21);
    await expect(meter).not.toHaveAttribute('data-shrink');
    await stays();

    await resize(holder, { width: 240 });
    await expect(ends).toHaveCount(0);
    await expect(ticks).toHaveCount(21);
    await expect(meter).toHaveAttribute('data-shrink', '1');
    await stays();

    await resize(holder, { width: 150 });
    await expect(ticks).toHaveCount(11);
    await expect(meter).toHaveAttribute('data-shrink', '2');
    await stays();

    await resize(holder, { width: 100 });
    await expect(ticks).toHaveCount(5);
    await expect(meter).toHaveAttribute('data-shrink', '3');
    await stays();

    // Last of all the label truncates.
    await resize(holder, { width: 70 });
    await expect(ticks).toHaveCount(5);
    expect(await meter.locator('[data-part="label"]').evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
      true,
    );
    await stays();

    await resize(holder, { width: 360 });
    await expect(ends).toHaveText(['Empty', 'Full']);
    await expect(ticks).toHaveCount(21);
  });

  test('a vertical meter runs from the bottom up, and shows less as its height shrinks', async ({ page }) => {
    await open(page, 'meters-levelmeter--vertical');
    const tall = page.getByRole('meter', { name: 'Capacity' }).first();
    const plot = tall.locator('[data-part="plot"]');
    expect(await along(tall.locator('[data-part="marker"]'), plot, 'y')).toBeCloseTo(0.35, 1);
    const [strip, max, min] = [
      await box(tall.locator('[data-part="strip"]')),
      await box(tall.locator('[data-part="maxLabel"]')),
      await box(tall.locator('[data-part="minLabel"]')),
    ];
    expect(strip.height).toBeGreaterThan(strip.width);
    expect(max.y).toBeLessThan(strip.y);
    expect(min.y).toBeGreaterThan(strip.y);

    const holder = page.locator('[data-height="60"]');
    const short = holder.getByRole('meter');
    const ticks = short.locator('[data-part="tick"]');
    const ends = short.locator('[data-part="minLabel"], [data-part="maxLabel"]');
    await expect(ends).toHaveCount(0);
    // 60px holds every 5th of the 21 ticks; 80px holds every 2nd.
    await expect(ticks).toHaveCount(5);
    await expect(short.locator('[data-part="marker"]')).toBeVisible();
    await resize(holder, { height: 80 });
    await expect(ticks).toHaveCount(11);
    await expect(ends).toHaveCount(0);
    await resize(holder, { height: 60 });
    await expect(ticks).toHaveCount(5);
    await resize(holder, { height: 200 });
    await expect(ticks).toHaveCount(21);
    await expect(ends).toHaveCount(2);
    expect(
      await along(short.locator('[data-part="marker"]'), short.locator('[data-part="plot"]'), 'y'),
    ).toBeCloseTo(0.7, 1);
  });

  test('parts replace, hide and adjust pieces, and blocks compose the same meter', async ({ page }) => {
    await open(page, 'meters-levelmeter--customised');
    await expect(page.getByRole('meter', { name: 'A node replaces the label' })).toContainText(
      'Replaced label',
    );
    const hidden = page.getByRole('meter', { name: 'null hides the end labels and the band' });
    await expect(
      hidden.locator('[data-part="minLabel"], [data-part="maxLabel"], [data-part="band"]'),
    ).toHaveCount(0);
    await expect(hidden.locator('[data-part="marker"]')).toBeVisible();
    await expect(
      page.getByRole('meter', { name: 'A function adjusts the value' }).locator('[data-part="value"]'),
    ).toHaveText('60 of 100');
    await expect(page.getByText('Loading…')).toBeVisible();

    const byHand = page.getByRole('meter', { name: 'Value first, label last' });
    await expect(byHand).toHaveAttribute('aria-valuetext', '60, Fair, Before: 40');
    await expect(byHand.locator('[data-part="compare"]')).toBeVisible();
    await expect(page.getByRole('meter', { name: 'Estimate' })).toHaveAttribute(
      'aria-valuetext',
      'Range: 20 – 50',
    );

    // Tokens: the strip's height and its longest length come from the scope.
    const themed = await box(page.getByRole('meter', { name: 'Capacity' }).locator('[data-part="strip"]'));
    expect(themed.height).toBe(24);
    expect(themed.width).toBe(160);
  });

  test('a meter is not a tab stop', async ({ page }) => {
    await open(page, 'meters-levelmeter--variants');
    await page.keyboard.press('Tab');
    expect(
      await page.evaluate(() => document.activeElement?.closest('[data-umbra="level-meter"]')),
    ).toBeNull();
  });
});

test.describe('highlightChanges', () => {
  test('ProgressBar: a changed value flashes once with a sign for its direction', async ({ page }) => {
    await expectChangeHighlights(page, 'meters-progressbar--live-updates', false);
  });
  test('LevelMeter: a changed value flashes once with a sign for its direction', async ({ page }) => {
    await expectChangeHighlights(page, 'meters-levelmeter--live-updates', false);
  });
});

// Non-text contrast (B7, B15): the unfilled scale and the hatch are information, so they need 3:1
// against what is behind them, on every tint. Colours are resolved by the browser and compared.
test.describe('contrast', () => {
  const ratio = (page: Page, a: string, b: string) =>
    page.evaluate(
      ([a, b]) => {
        const ctx = Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext(
          '2d',
        )!;
        const rgb = (css: string, under?: number[]) => {
          ctx.clearRect(0, 0, 1, 1);
          if (under) {
            ctx.fillStyle = `rgb(${under.join(',')})`;
            ctx.fillRect(0, 0, 1, 1);
          }
          ctx.fillStyle = css;
          ctx.fillRect(0, 0, 1, 1);
          return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
        };
        const lum = (c: number[]) => {
          const [r, g, b] = c.map((v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
          return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
        };
        const under = rgb(b!);
        const [hi, lo] = [lum(rgb(a!, under)), lum(under)].sort((x, y) => y - x);
        return (hi! + 0.05) / (lo! + 0.05);
      },
      [a, b],
    );
  /** A computed colour of an element: a property, or the colour of its first box shadow. */
  const colour = (locator: Locator, property: 'backgroundColor' | 'borderTopColor' | 'boxShadow') =>
    locator.evaluate((el, property) => {
      const value = getComputedStyle(el)[property];
      return property === 'boxShadow' ? value.slice(0, value.indexOf(')') + 1) : value;
    }, property);
  /** A private colour variable of a fill (`--ink` is the hatch, `--paint` the colour under it), resolved. */
  const variable = (fill: Locator, name: string) =>
    fill.evaluate((el, name) => {
      const probe = el.appendChild(document.createElement('i'));
      probe.style.background = `var(${name})`;
      const value = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return value;
    }, name);

  for (const tint of ['violet', 'teal', 'green', 'slate']) {
    test(`the track outline, the unlit ticks, the meter box and the hatch have 3:1 on ${tint}`, async ({
      page,
    }) => {
      await page.goto(
        `/iframe.html?id=meters-progressbar--thresholds&viewMode=story&globals=context:${tint}`,
      );
      await page.locator('[data-umbra="progress-bar"]').first().waitFor();
      const panel = await colour(page.locator('section').first(), 'backgroundColor');
      const bar = page.locator('[data-umbra="progress-bar"]').first();
      const outline = await colour(bar.locator('[data-part="cells"] > div').first(), 'boxShadow');
      expect(await ratio(page, outline, panel)).toBeGreaterThanOrEqual(3);
      // Every hatched fill in the story, against its own colour.
      const fills = page.locator('[data-part="fill"]:not([data-pattern="none"])');
      expect(await fills.count()).toBeGreaterThan(0);
      for (const fill of await fills.all()) {
        const ink = await variable(fill, '--ink');
        const paint = await variable(fill, '--paint');
        expect(
          await ratio(page, ink, paint),
          `${await fill.getAttribute('data-tone')} hatch`,
        ).toBeGreaterThanOrEqual(3);
      }

      await page.goto(`/iframe.html?id=meters-levelmeter--variants&viewMode=story&globals=context:${tint}`);
      const meter = page.locator('[data-umbra="level-meter"][data-boxed]').first();
      await meter.waitFor();
      const strip = meter.locator('[data-part="strip"]');
      const [surface, border] = [
        await colour(strip, 'backgroundColor'),
        await colour(strip, 'borderTopColor'),
      ];
      const card = await colour(page.locator('section').first(), 'backgroundColor');
      expect(await ratio(page, border, card)).toBeGreaterThanOrEqual(3);
      const unlit = await colour(
        meter.locator('[data-part="tick"]:not([data-lit])').first(),
        'backgroundColor',
      );
      expect(await ratio(page, unlit, surface)).toBeGreaterThanOrEqual(3);
    });
  }
});

test.describe('right to left', () => {
  const rtl = async (page: Page, id: string) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`/iframe.html?id=${id}&viewMode=story`);
    await page.locator('#storybook-root > *').first().waitFor();
  };

  test('ProgressBar: the fill, the target and the gradient start from the right (B14)', async ({ page }) => {
    await rtl(page, 'meters-progressbar--right-to-left');
    const bar = page.getByRole('progressbar', { name: 'Budget used' });
    await expect(bar).toHaveCSS('direction', 'rtl');
    const [fill, track, target] = [
      await box(bar.locator('[data-part="fill"]')),
      await box(bar.locator('[data-part="track"]')),
      await box(bar.locator('[data-part="target"]')),
    ];
    // 30% filled: the fill ends at the right edge of the track; the 80% target is in the left part.
    expect(fill.x + fill.width).toBeCloseTo(track.x + track.width, 0);
    expect(fill.width / track.width).toBeCloseTo(0.3, 1);
    expect((track.x + track.width - (target.x + target.width / 2)) / track.width).toBeCloseTo(0.8, 1);
    // The gradient runs from the start (right) to the end (left): 270deg.
    const image = await bar
      .locator('[data-part="fill"]')
      .evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(image).toContain('270deg');

    // The travelling fill moves towards the left: its keyframes are multiplied by -1.
    const travel = await page
      .getByRole('progressbar', { name: 'Syncing' })
      .evaluate((el) => getComputedStyle(el).getPropertyValue('--travel').trim());
    expect(travel).toBe('-1');
  });

  test('LevelMeter: the scale, the marker and the end labels mirror', async ({ page }) => {
    await rtl(page, 'meters-levelmeter--right-to-left');
    const meter = page.getByRole('meter', { name: 'Skill level' }).first();
    const [marker, plot, low, high] = [
      await box(meter.locator('[data-part="marker"]')),
      await box(meter.locator('[data-part="plot"]')),
      await box(meter.locator('[data-part="minLabel"]')),
      await box(meter.locator('[data-part="maxLabel"]')),
    ];
    // A value of 20 sits 20% from the right end.
    expect((plot.x + plot.width - (marker.x + marker.width / 2)) / plot.width).toBeCloseTo(0.2, 1);
    expect(low.x).toBeGreaterThan(plot.x + plot.width);
    expect(high.x + high.width).toBeLessThan(plot.x);
  });
});
