import { expect, test, type Locator, type Page } from '@playwright/test';

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
      '75%, Team A 40%, Team B 25%, Team C 10%',
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
    await expect(tooltip).toHaveText('75%, Team A 40%, Team B 25%, Team C 10%');
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

  test('a threshold sets the tone, a pattern and the spoken label; invert swaps the tones', async ({
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

  test('loading shows skeletons in the same layout and no value', async ({ page }) => {
    await open(page, 'meters-progressbar--edge-values');
    const loading = page.locator('[data-umbra="progress-bar"][data-loading]').first();
    await expect(loading).toHaveAttribute('aria-busy', 'true');
    await expect(loading).toContainText('Budget used');
    await expect(loading.locator('[data-part="track"] [data-umbra="skeleton"]')).toBeVisible();
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
      plot: meter.locator('[data-part="strip"] > div'),
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
    expect(
      await along(over.locator('[data-part="marker"]'), over.locator('[data-part="strip"] > div')),
    ).toBeCloseTo(1, 2);
    const negative = page.getByRole('meter', { name: 'Negative' });
    await expect(negative).toHaveAttribute('data-out-of-range', 'under');
    expect(
      await along(negative.locator('[data-part="marker"]'), negative.locator('[data-part="strip"] > div')),
    ).toBeCloseTo(0, 2);

    const balance = page.getByRole('meter', { name: 'Balance' }).first();
    await expect(balance).toHaveAttribute('aria-valuemin', '-50');
    expect(
      await along(balance.locator('[data-part="marker"]'), balance.locator('[data-part="strip"] > div')),
    ).toBeCloseTo(0.3, 2);

    for (const name of ['No value', 'Unknown level']) {
      const meter = page.getByRole('meter', { name });
      await expect(meter.locator('[data-part="marker"]')).toHaveCount(0);
      await expect(meter.locator('[data-part="tick"][data-lit]')).toHaveCount(0);
    }

    const loading = page.locator('[data-umbra="level-meter"][data-loading]').first();
    await expect(loading).toHaveAttribute('aria-busy', 'true');
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
        await along(meter.locator('[data-part="marker"]'), meter.locator('[data-part="strip"] > div')),
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
    const plot = tall.locator('[data-part="strip"] > div');
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
      await along(short.locator('[data-part="marker"]'), short.locator('[data-part="strip"] > div'), 'y'),
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
