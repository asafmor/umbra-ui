import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectFocusKept, openStory, pressKeys, settle } from './helpers';
import { expectChangeHighlights } from './live';
import { contrast, pixels } from './pixels';
import { contextPresets } from '../../src/styles/tokens.generated';

// Tier 2 meters and charts: PieIndicator, DivergingMeter, Sparkline, Heatmap and Scatter. What a still
// image cannot show: values for assistive technology, keyboard, tooltips, legends, the data states and
// each step of "show less as the slot shrinks".

const box = async (el: Locator) => (await el.boundingBox())!;
const part = (el: Locator, name: string) => el.locator(`[data-part="${name}"]`);
const meter = (page: Page, name: string) => page.getByRole('meter', { name, exact: true });
/** The tooltip the library opens by itself is in the modal's own layer, where it can be read. */
const inModalLayer = (tip: Locator) =>
  tip.evaluate((node) => !!node.closest('[data-umbra="modal-backdrop"]') && !node.closest('[inert]'));

test.describe('PieIndicator', () => {
  test('is a meter whose wedges, tone and text follow the value', async ({ page }) => {
    await openStory(page, 'meters-pieindicator--variants');
    const half = meter(page, 'Half');
    await expect(half).toHaveAttribute('aria-valuenow', '50');
    await expect(half).toHaveAttribute('aria-valuetext', '50%');
    await expect(part(half, 'value')).toHaveText('50%');
    // Eight wedges: eight gaps cut the disc, and the fill covers four of them.
    await expect(half.locator('mask line')).toHaveCount(8);
    await expect(part(half, 'fill').locator('path')).toHaveAttribute('d', /A1 1 0 0 1 0\.0000 1\.0000Z$/);
    // The disc is decoration: the meter carries the value.
    await expect(part(half, 'disc')).toHaveAttribute('aria-hidden', 'true');

    // 3 of 5 on five wedges, with the app's own text.
    const five = meter(page, 'Five wedges');
    await expect(five.locator('mask line')).toHaveCount(5);
    await expect(five).toHaveAttribute('aria-valuetext', '3 of 5');

    // Continuous: no gaps, and the sector ends at the exact value; a full disc is a circle.
    const exact = meter(page, 'Exact');
    await expect(exact).toHaveAttribute('data-variant', 'continuous');
    await expect(exact.locator('mask')).toHaveCount(0);
    await expect(part(exact, 'fill').locator('path')).toHaveAttribute('d', /A1 1 0 1 1 -0\.68/);
    await expect(part(meter(page, 'Full'), 'fill').locator('circle')).toHaveCount(1);

    // A name without a visible label.
    await expect(meter(page, 'Coverage').first()).toHaveAttribute('aria-valuetext', '62%');
  });

  test('thresholds colour the fill by band, name the band, and mirror when low is good', async ({ page }) => {
    await openStory(page, 'meters-pieindicator--variants');
    const levels = page.getByRole('meter', { name: 'Knowledge' });
    await expect(levels).toHaveCount(4);
    const looks = await levels.evaluateAll((els) =>
      els.map((el) => [
        el.getAttribute('data-band'),
        el.querySelector('[data-part="fill"]')?.getAttribute('data-tone'),
        el.getAttribute('aria-valuetext'),
      ]),
    );
    expect(looks).toEqual([
      ['0', 'ramp-1', '10%, Minimal'],
      ['1', 'ramp-2', '40%, Basic'],
      ['2', 'ramp-3', '60%, Fair'],
      ['3', 'ramp-4', '95%, Extensive'],
    ]);
    await expect(part(levels.first(), 'value')).toHaveText('10% · Minimal');
    // The amount is the cue that is not colour: more wedges are filled as the level rises.
    const filled = await levels.evaluateAll((els) =>
      els.map((el) => el.querySelector('[data-part="fill"]')!.getBoundingClientRect().width),
    );
    expect(filled[0]!).toBeLessThan(filled[3]!);
    // Thirds: 45 of 100 is the middle band. Low is good: the lowest third takes the best look.
    await expect(part(meter(page, 'Thirds'), 'fill')).toHaveAttribute('data-tone', 'warning');
    await expect(part(meter(page, 'Risk: low is good'), 'fill')).toHaveAttribute('data-tone', 'success');
    await expect(part(meter(page, 'Boundaries on the ramp'), 'fill')).toHaveAttribute('data-tone', 'ramp-4');
  });

  test('edge values: a little lights one wedge, outside the scale clamps, no value says so', async ({
    page,
  }) => {
    await openStory(page, 'meters-pieindicator--edge-values');
    await expect(part(meter(page, 'Zero'), 'fill')).toHaveCount(0);
    await expect(meter(page, 'Zero')).toHaveAttribute('aria-valuetext', '0%');
    // 2% of eight wedges rounds to none, and still lights one.
    await expect(part(meter(page, 'A little'), 'fill').locator('path')).toHaveAttribute(
      'd',
      /A1 1 0 0 1 0\.7071 -0\.7071Z$/,
    );
    await expect(part(meter(page, 'Full'), 'fill').locator('circle')).toHaveCount(1);

    const over = meter(page, 'Over');
    await expect(over).toHaveAttribute('data-out-of-range', 'over');
    await expect(over).toHaveAttribute('aria-valuenow', '100');
    await expect(part(over, 'value')).toHaveText('120%');
    await expect(meter(page, 'Under')).toHaveAttribute('data-out-of-range', 'under');
    await expect(part(meter(page, 'Under'), 'fill')).toHaveCount(0);

    const none = meter(page, 'Not measured');
    await expect(none).toHaveAttribute('data-empty', 'true');
    await expect(none).toHaveAttribute('aria-valuetext', 'No value');
    await expect(part(none, 'value')).toHaveText('—');
    await expect(part(none, 'fill')).toHaveCount(0);
    // A dashed edge, so the empty disc is not read as zero.
    expect(await part(none, 'track').evaluate((el) => getComputedStyle(el).strokeDasharray)).not.toBe('none');
    expect(
      await part(meter(page, 'Zero'), 'track').evaluate((el) => getComputedStyle(el).strokeDasharray),
    ).toBe('none');
    const custom = meter(page, 'Not rated');
    await expect(custom).toHaveAttribute('aria-valuetext', 'Not available');
    await expect(part(custom, 'value')).toHaveText('n/a');
  });

  test('loading shows skeletons in the same layout and is not a meter', async ({ page }) => {
    await openStory(page, 'meters-pieindicator--edge-values');
    const loading = page.locator('[data-umbra="pie-indicator"][data-loading]').first();
    await expect(loading).toHaveAttribute('aria-busy', 'true');
    await expect(loading).toContainText('Coverage');
    await expect(loading.getByRole('meter')).toHaveCount(0);
    const skeleton = loading.locator('[data-part="skeleton"] > [data-umbra="skeleton"]').first();
    const disc = part(meter(page, 'Zero'), 'disc');
    expect((await box(skeleton)).width).toBe((await box(disc)).width);
    expect((await box(skeleton)).height).toBe((await box(disc)).height);
    // With a name and no label it is a named group while it loads.
    await expect(page.getByRole('group', { name: 'Quality' })).toHaveAttribute('aria-busy', 'true');
  });

  test('as the row narrows the value hides first, then the label truncates; the disc keeps its size', async ({
    page,
  }) => {
    await openStory(page, 'meters-pieindicator--shrink');
    const at = async (px: number) => {
      const root = page.locator(`[data-width="${px}"] [data-umbra="pie-indicator"]`);
      const label = part(root, 'label');
      return {
        value: await part(root, 'value').count(),
        cut: await label.evaluate((el) => el.scrollWidth > el.clientWidth),
        disc: (await box(part(root, 'disc'))).width,
        inside: (await box(root)).width <= px,
      };
    };
    expect(await at(240)).toEqual({ value: 1, cut: false, disc: 16, inside: true });
    expect(await at(180)).toEqual({ value: 0, cut: false, disc: 16, inside: true });
    expect(await at(90)).toEqual({ value: 0, cut: true, disc: 16, inside: true });
    expect(await at(20)).toMatchObject({ value: 0, disc: 16, inside: true });
    // The hidden value is still read, and shown on hover.
    const narrow = page.locator('[data-width="90"]').getByRole('meter');
    await expect(narrow).toHaveAttribute('aria-valuetext', '62%');
    await expect(narrow).toHaveAttribute('data-value-hidden', 'true');
    await narrow.hover();
    await expect(page.getByRole('tooltip')).toHaveText('62%');
  });

  test('sizes for cells and text, and the disc mirrors with the page but fills clockwise', async ({
    page,
  }) => {
    await openStory(page, 'meters-pieindicator--variants');
    const size = async (name: string) => (await box(part(meter(page, name), 'disc'))).width;
    expect([await size('Small'), await size('Default'), await size('Large')]).toEqual([12, 16, 24]);
    // Inside a line of text the indicator sits on the line.
    const inText = meter(page, 'Coverage of Region 2');
    const line = await box(inText.locator('xpath=..'));
    expect((await box(inText)).height).toBeLessThanOrEqual(line.height);
    expect(await inText.evaluate((el) => getComputedStyle(el).display)).toBe('inline-flex');

    await openStory(page, 'meters-pieindicator--right-to-left');
    const rtl = meter(page, 'Coverage');
    expect((await box(part(rtl, 'disc'))).x).toBeGreaterThan((await box(part(rtl, 'label'))).x);
    // A quarter is still the first quarter after 12 o'clock.
    await expect(part(rtl, 'fill').locator('path')).toHaveAttribute('d', /A1 1 0 0 1 1\.0000 -0\.0000Z$/);
  });

  test('tokens, parts and blocks', async ({ page }) => {
    await openStory(page, 'meters-pieindicator--customised');
    const tokens = meter(page, 'Coverage');
    expect((await box(part(tokens, 'disc'))).width).toBe(28);
    expect(
      await tokens
        .locator('mask line')
        .first()
        .evaluate((el) => getComputedStyle(el).strokeWidth),
    ).toBe('0.3px');
    // A replaced label no longer names the meter, so its text does.
    await expect(meter(page, 'A node replaces the label')).toContainText('Replaced label');
    await expect(part(meter(page, 'null hides the value'), 'value')).toHaveCount(0);
    await expect(part(meter(page, 'A function adjusts the value'), 'value')).toHaveText('5 of 8');
    await expect(part(meter(page, 'A replaced disc'), 'disc')).toHaveCount(0);
    await expect(meter(page, 'A replaced disc')).toContainText('◔');
    await expect(page.locator('[data-loading]', { hasText: 'A replaced skeleton' })).toContainText('…');
    // Blocks in another order: the disc last.
    const built = meter(page, 'Value first');
    await expect(built).toHaveAttribute('aria-valuetext', '5 of 8');
    expect((await box(part(built, 'disc'))).x).toBeGreaterThan((await box(part(built, 'value'))).x);
  });

  test('highlights a changed value', async ({ page }) => {
    await expectChangeHighlights(page, 'meters-pieindicator--live-updates', false);
  });

  test('the tooltip of the exact value opens inside a modal, for both meters', async ({ page }) => {
    await openStory(page, 'meters-pieindicator--in-modal');
    const dialog = page.getByRole('dialog', { name: 'Readiness' });
    await expect(dialog).toBeVisible();
    await expect(page.locator('[data-umbra="modal-backdrop"]')).not.toHaveAttribute('data-entering');
    await dialog.getByRole('meter', { name: 'Knowledge' }).hover();
    const tip = page.getByRole('tooltip');
    await expect(tip).toHaveText('62%, Fair');
    expect(await inModalLayer(tip)).toBe(true);
    await dialog.getByRole('meter', { name: 'Change' }).hover();
    await expect(tip).toHaveText('−35');
    expect(await inModalLayer(tip)).toBe(true);
    // Escape dismisses the tooltip only.
    await page.keyboard.press('Escape');
    await expect(tip).toHaveCount(0);
    await expect(dialog).toBeVisible();
    await expectFocusKept(page);
  });
});

test.describe('DivergingMeter', () => {
  /** Where the fill and the origin are, as shares of the track. */
  const shape = async (root: Locator) => {
    const track = await box(part(root, 'track'));
    const share = (x: number) => Math.round(((x - track.x) / track.width) * 1000) / 10;
    const fill = (await part(root, 'fill').count()) ? await box(part(root, 'fill')) : null;
    const origin = (await part(root, 'origin').count()) ? await box(part(root, 'origin')) : null;
    return {
      fill: fill && [share(fill.x), share(fill.x + fill.width)],
      origin: origin && share(origin.x + origin.width / 2),
    };
  };
  const hatched = (root: Locator) =>
    part(root, 'fill').evaluate((el) => getComputedStyle(el).backgroundImage.includes('repeating-linear'));

  test('fills from the origin to the value, on the side of its sign', async ({ page }) => {
    await openStory(page, 'meters-divergingmeter--variants');
    const positive = meter(page, 'Positive');
    await expect(positive).toHaveAttribute('data-direction', 'positive');
    await expect(positive).toHaveAttribute('aria-valuenow', '40');
    await expect(positive).toHaveAttribute('aria-valuetext', '+40');
    await expect(part(positive, 'value')).toHaveText('+40');
    expect(await shape(positive)).toEqual({ fill: [50, 70], origin: 50 });
    await expect(part(positive, 'fill')).toHaveAttribute('data-tone', 'success');

    // Below the origin: the other tone, a real minus sign, and a hatch that does not depend on colour.
    const negative = meter(page, 'Negative');
    await expect(negative).toHaveAttribute('data-direction', 'negative');
    await expect(negative).toHaveAttribute('aria-valuetext', '−65');
    expect(await shape(negative)).toEqual({ fill: [17.5, 50], origin: 50 });
    await expect(part(negative, 'fill')).toHaveAttribute('data-tone', 'danger');
    expect(await hatched(negative)).toBe(true);
    expect(await hatched(positive)).toBe(false);

    // At the origin nothing is drawn but the tick.
    const neutral = meter(page, 'Neutral');
    await expect(neutral).toHaveAttribute('data-direction', 'neutral');
    await expect(neutral).toHaveAttribute('aria-valuetext', '0');
    expect(await shape(neutral)).toEqual({ fill: null, origin: 50 });

    await expect(meter(page, 'Formatted')).toHaveAttribute('aria-valuetext', '+12%');
    expect((await shape(meter(page, 'No tick at the origin'))).origin).toBeNull();
  });

  test('the origin can be any value, and defaults to the middle of a scale without zero', async ({
    page,
  }) => {
    await openStory(page, 'meters-divergingmeter--variants');
    const target = page.getByRole('meter', { name: 'Against a target of 60' });
    expect(await shape(target.first())).toEqual({ fill: [60, 85], origin: 60 });
    await expect(target.first()).toHaveAttribute('aria-valuetext', '+25');
    expect(await shape(target.last())).toEqual({ fill: [25, 60], origin: 60 });
    await expect(target.last()).toHaveAttribute('aria-valuetext', '−35');
    // 20 to 80 has no zero: the origin is 50, and 35 is 15 below it.
    const middle = meter(page, 'Middle of 20 to 80');
    expect(await shape(middle)).toEqual({ fill: [25, 50], origin: 50 });
    await expect(middle).toHaveAttribute('aria-valuetext', '−15');
  });

  test('tones per side, swapped when low is good, and thresholds', async ({ page }) => {
    await openStory(page, 'meters-divergingmeter--variants');
    const tone = (root: Locator) => part(root, 'fill').getAttribute('data-tone');
    const other = page.getByRole('meter', { name: 'Other tones' });
    expect([await tone(other.first()), await tone(other.last())]).toEqual(['info', 'warning']);
    // Low is good: below the origin is the good side. The hatch still marks "below".
    const cost = page.getByRole('meter', { name: 'Cost: low is good' });
    expect([await tone(cost.first()), await tone(cost.last())]).toEqual(['success', 'danger']);
    expect([await hatched(cost.first()), await hatched(cost.last())]).toEqual([true, false]);

    const banded = page.getByRole('meter', { name: 'Banded' });
    await expect(banded.first()).toHaveAttribute('data-band', '0');
    await expect(banded.first()).toHaveAttribute('aria-valuetext', '−60, Much worse');
    await expect(part(banded.first(), 'value')).toHaveText('−60 · Much worse');
    expect(await tone(banded.first())).toBe('danger');
    await expect(banded.last()).toHaveAttribute('data-band', '3');
    expect(await tone(banded.last())).toBe('success');
  });

  test('edge values, no value and loading', async ({ page }) => {
    await openStory(page, 'meters-divergingmeter--edge-values');
    expect((await shape(meter(page, 'Lowest'))).fill).toEqual([0, 50]);
    expect((await shape(meter(page, 'Highest'))).fill).toEqual([50, 100]);
    const over = meter(page, 'Over');
    await expect(over).toHaveAttribute('data-out-of-range', 'over');
    await expect(over).toHaveAttribute('aria-valuenow', '100');
    await expect(part(over, 'value')).toHaveText('+140');
    expect((await shape(over)).fill).toEqual([50, 100]);
    await expect(meter(page, 'Under')).toHaveAttribute('data-out-of-range', 'under');

    const none = meter(page, 'Not measured');
    await expect(none).toHaveAttribute('data-empty', 'true');
    await expect(none).not.toHaveAttribute('data-direction');
    await expect(none).toHaveAttribute('aria-valuetext', 'No value');
    await expect(part(none, 'value')).toHaveText('—');
    expect((await shape(none)).fill).toBeNull();
    await expect(meter(page, 'Not rated')).toHaveAttribute('aria-valuetext', 'Not available');

    const loading = page.locator('[data-umbra="diverging-meter"][data-loading]').first();
    await expect(loading).toHaveAttribute('aria-busy', 'true');
    await expect(loading.getByRole('meter')).toHaveCount(0);
    await expect(part(loading, 'fill')).toHaveCount(0);
    await expect(part(loading, 'origin')).toHaveCount(0);
    const skeleton = loading.locator(
      '[data-part="track"] > [data-part="skeleton"] > [data-umbra="skeleton"]',
    );
    await expect(skeleton).toBeVisible();
    expect((await box(part(loading, 'track'))).height).toBe(
      (await box(part(meter(page, 'Lowest'), 'track'))).height,
    );
  });

  test('as the meter narrows the value hides first, then the label truncates; the bar keeps a minimum', async ({
    page,
  }) => {
    await openStory(page, 'meters-divergingmeter--shrink');
    const at = async (layout: string, px: number) => {
      const root = page.locator(`[data-width="${px}"] [data-layout="${layout}"]`);
      return {
        value: await part(root, 'value').count(),
        cut: await part(root, 'label').evaluate((el) => el.scrollWidth > el.clientWidth),
        track: Math.round((await box(part(root, 'track'))).width),
      };
    };
    expect(await at('block', 320)).toEqual({ value: 1, cut: false, track: 320 });
    expect(await at('block', 170)).toEqual({ value: 0, cut: false, track: 170 });
    expect(await at('block', 90)).toEqual({ value: 0, cut: true, track: 90 });
    expect(await at('block', 28)).toMatchObject({ value: 0, cut: true });
    expect(await at('inline', 320)).toMatchObject({ value: 1, cut: false });
    const narrow = await at('inline', 200);
    expect(narrow).toMatchObject({ value: 0, cut: false });
    expect(narrow.track).toBeGreaterThanOrEqual(24);
    const narrower = await at('inline', 120);
    expect(narrower).toMatchObject({ value: 0, cut: true });
    expect(narrower.track).toBeGreaterThanOrEqual(24);
    // The hidden value is on the tooltip.
    await page.locator('[data-width="170"]').getByRole('meter').hover();
    await expect(page.getByRole('tooltip')).toHaveText('−42');
  });

  test('right to left: positive is towards the end of the line, so the bar mirrors', async ({ page }) => {
    await openStory(page, 'meters-pieindicator--right-to-left');
    const meters = page.getByRole('meter', { name: 'Change' });
    // +40: the fill is left of the origin, where the line ends.
    expect(await shape(meters.first())).toEqual({ fill: [30, 50], origin: 50 });
    expect(await shape(meters.nth(1))).toEqual({ fill: [50, 82.5], origin: 50 });
    expect(await hatched(meters.nth(1))).toBe(true);
    await expect(part(meters.first(), 'value')).toHaveText('+40');
  });

  test('tokens, parts, blocks and live updates', async ({ page }) => {
    await openStory(page, 'meters-divergingmeter--customised');
    const tokens = page.getByRole('meter', { name: 'Change' }).first();
    expect((await box(part(tokens, 'track'))).height).toBe(10);
    await expect(meter(page, 'A node replaces the label')).toContainText('Replaced label');
    const hidden = meter(page, 'null hides the value and the tick');
    await expect(part(hidden, 'value')).toHaveCount(0);
    await expect(part(hidden, 'origin')).toHaveCount(0);
    const adjusted = meter(page, 'A function adjusts the fill and the value');
    await expect(part(adjusted, 'fill')).toHaveAttribute('data-tone', 'accent');
    await expect(part(adjusted, 'value')).toHaveText('40 above plan');
    await expect(page.locator('[data-loading]', { hasText: 'A replaced skeleton' })).toContainText(
      'Loading…',
    );
    // Blocks: a fill of a free colour, no tick, the value after the bar.
    const built = page.getByRole('meter', { name: 'Change' }).last();
    await expect(part(built, 'fill')).not.toHaveAttribute('data-tone');
    await expect(part(built, 'origin')).toHaveCount(0);
    await expect(built).toHaveAttribute('aria-valuetext', '−25');

    await expectChangeHighlights(page, 'meters-divergingmeter--live-updates', false);
  });
});

test.describe('Sparkline', () => {
  const sample = (page: Page, title: string) =>
    page.locator(`[data-sample="${title}"] [data-umbra="sparkline"]`);

  test('is an image with a generated summary, which the app can replace', async ({ page }) => {
    await openStory(page, 'charts-sparkline--variants');
    const line = sample(page, 'Line');
    await expect(line).toHaveAttribute('role', 'img');
    await expect(line).toHaveAttribute(
      'aria-label',
      '12 values, first 42, last 90, lowest 42, highest 90, rising',
    );
    await expect(line.locator('svg')).toHaveAttribute('aria-hidden', 'true');
    // Not a tab stop unless it is interactive.
    await expect(line).not.toHaveAttribute('tabindex');
    await expect(sample(page, 'Lowest and highest')).toHaveAttribute(
      'aria-label',
      '12 values, first 64, last 36, lowest 36, highest 66, falling',
    );

    await openStory(page, 'charts-sparkline--interactive');
    await expect(sample(page, "A summary of the app's own")).toHaveAttribute(
      'aria-label',
      'From 64% to 36%, down',
    );
    await openStory(page, 'charts-sparkline--states');
    await expect(sample(page, 'One value')).toHaveAttribute('aria-label', '1 value: 42');
    await expect(sample(page, 'All the same')).toHaveAttribute('aria-label', /flat$/);
  });

  test('variants: a line, an area, bars from zero, and signed bars; markers and a reference', async ({
    page,
  }) => {
    await openStory(page, 'charts-sparkline--variants');
    await expect(sample(page, 'Line').locator('path')).toHaveCount(1);
    await expect(sample(page, 'Area').locator('path')).toHaveCount(2);
    await expect(part(sample(page, 'Last point'), 'lastPoint')).toHaveCount(1);
    await expect(part(sample(page, 'Line'), 'lastPoint')).toHaveCount(0);
    const extremes = sample(page, 'Lowest and highest');
    await expect(part(extremes, 'minPoint')).toHaveCount(1);
    await expect(part(extremes, 'maxPoint')).toHaveCount(1);
    // The highest value is drawn above the lowest.
    expect((await box(part(extremes, 'maxPoint'))).y).toBeLessThan((await box(part(extremes, 'minPoint'))).y);

    // Bars: one per value, each at most 6px wide, packed from the left, taller for a larger value.
    const bars = part(sample(page, 'Bars').first(), 'bar');
    await expect(bars).toHaveCount(5);
    const sizes = await bars.evaluateAll((els) => els.map((el) => el.getBoundingClientRect()));
    expect(Math.max(...sizes.map((b) => b.width))).toBeLessThanOrEqual(6);
    expect(sizes[3]!.height).toBeGreaterThan(sizes[2]!.height);
    expect(new Set(sizes.map((b) => Math.round(b.bottom))).size).toBe(1);
    // By threshold: the band of each bar.
    expect(
      await part(sample(page, 'By threshold'), 'bar').evaluateAll((els) =>
        els.map((el) => el.getAttribute('data-band')),
      ),
    ).toEqual(['1', '2', '0', '2', '1']);
    // Below zero: bars hang from the zero line.
    const mixed = await part(sample(page, 'Below zero'), 'bar').evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect()),
    );
    expect(Math.round(mixed[2]!.top)).toBe(Math.round(mixed[0]!.bottom));
    // Signed: up, down or a tick in the middle, by the sign alone.
    const signed = part(sample(page, 'Signed: a run of outcomes'), 'bar');
    expect(await signed.evaluateAll((els) => els.map((el) => el.getAttribute('data-sign')))).toEqual([
      '1',
      '1',
      '-1',
      '0',
      '1',
      '-1',
      '-1',
      '1',
      '1',
      '1',
    ]);
    const [up, down] = [await box(signed.nth(0)), await box(signed.nth(2))];
    expect(up.y + up.height).toBeLessThanOrEqual(down.y + 1);
    expect(up.height).toBe(down.height);

    await expect(part(sample(page, 'Reference line'), 'reference').locator('line')).toHaveCount(1);
    const band = part(sample(page, 'Reference band'), 'reference');
    await expect(band.locator('rect')).toHaveCount(1);
    await expect(band.locator('line')).toHaveCount(2);
  });

  test('fills the width of its container at a fixed small height, and its drawing never mirrors', async ({
    page,
  }) => {
    await openStory(page, 'charts-sparkline--variants');
    const line = sample(page, 'Line');
    const [root, svg, holder] = [
      await box(line),
      await box(line.locator('svg')),
      await box(line.locator('xpath=..')),
    ];
    expect(root.height).toBe(20);
    // The drawing is the whole pixels of its box.
    expect(Math.abs(svg.width - root.width)).toBeLessThan(1);
    expect(svg.height).toBe(20);
    expect(root.x + root.width).toBeLessThanOrEqual(holder.x + holder.width + 0.5);
    expect((await box(sample(page, '40px high'))).height).toBe(40);

    await page.setViewportSize({ width: 1024, height: 600 });
    await expect.poll(async () => (await box(line.locator('svg'))).width).toBeLessThan(svg.width);
    expect(Math.abs((await box(line.locator('svg'))).width - (await box(line)).width)).toBeLessThan(1);

    await openStory(page, 'charts-sparkline--right-to-left');
    const rtl = sample(page, 'Line');
    const dot = await box(part(rtl, 'lastPoint'));
    const frame = await box(rtl);
    // The last value is still at the right end.
    expect(dot.x).toBeGreaterThan(frame.x + frame.width / 2);
  });

  test('loading, no values and missing values', async ({ page }) => {
    await openStory(page, 'charts-sparkline--states');
    const loading = sample(page, 'Loading');
    await expect(loading).toHaveAttribute('aria-busy', 'true');
    await expect(loading).toHaveAttribute('aria-label', 'Orders');
    await expect(loading.locator('[data-part="skeleton"] [data-umbra="skeleton"]')).toBeVisible();
    await expect(loading.locator('svg')).toHaveCount(0);
    expect((await box(loading)).height).toBe(20);

    const none = sample(page, 'No values');
    await expect(none).toHaveAttribute('data-empty', 'true');
    await expect(none).toHaveAttribute('aria-label', 'No data');
    await expect(part(none, 'empty')).toHaveText('—');
    const missing = sample(page, 'Only missing values');
    await expect(missing).toHaveAttribute('aria-label', 'Not measured');
    await expect(part(missing, 'empty')).toHaveText('n/a');

    // A gap breaks the line; a value between two gaps is a dot; a missing value has no bar.
    const gaps = sample(page, 'Missing values');
    await expect(gaps).toHaveAttribute('aria-label', /^6 values, first 42, last 78/);
    expect((await gaps.locator('path').getAttribute('d'))!.match(/M/g)).toHaveLength(4);
    await expect(gaps.locator('circle')).toHaveCount(2);
    await expect(part(sample(page, 'Missing, as bars'), 'bar')).toHaveCount(6);
    await expect(sample(page, 'One value').locator('circle')).toHaveCount(1);
  });

  test('interactive: one tab stop, the arrow keys and the pointer show the nearest value', async ({
    page,
  }) => {
    await openStory(page, 'charts-sparkline--interactive');
    const line = sample(page, 'Line');
    const tip = page.getByRole('tooltip');
    await page.keyboard.press('Tab');
    await expect(line).toBeFocused();
    // Focus shows the last value, and marks it.
    await expect(tip).toHaveText('Dec: 90 orders');
    await expect(part(line, 'activePoint')).toHaveCount(1);
    await pressKeys(page, 'ArrowLeft');
    await expect(tip).toHaveText('Nov: 84 orders');
    await pressKeys(page, 'Home');
    await expect(tip).toHaveText('Jan: 42 orders');
    await pressKeys(page, 'ArrowLeft');
    await expect(tip).toHaveText('Jan: 42 orders');
    await pressKeys(page, 'End', 'ArrowRight');
    await expect(tip).toHaveText('Dec: 90 orders');
    // Escape dismisses the tooltip; the focus stays.
    await pressKeys(page, 'Escape');
    await expect(tip).toHaveCount(0);
    await expect(line).toBeFocused();
    await pressKeys(page, 'ArrowLeft');
    await expect(tip).toHaveText('Dec: 90 orders');

    await pressKeys(page, 'Tab');
    const bars = sample(page, 'Bars');
    await expect(bars).toBeFocused();
    await expect(tip).toHaveText('6.9 · Fair');
    // Leaving closes it; coming back shows the last value again.
    await pressKeys(page, 'Shift+Tab');
    await expect(tip).toHaveText('Dec: 90 orders');
    await pressKeys(page, 'Escape');
    await expect(tip).toHaveCount(0);

    // The pointer: the value nearest to it.
    const frame = await box(line);
    await page.mouse.move(frame.x + 4, frame.y + 10);
    await expect(tip).toHaveText('Jan: 42 orders');
    await page.mouse.move(frame.x + frame.width / 2, frame.y + 10);
    await expect(tip).toHaveText(/^(Jun|Jul): /);
    await page.mouse.move(2, 2);
    await expect(tip).toHaveCount(0);
  });

  test('its tooltip opens inside a modal', async ({ page }) => {
    await openStory(page, 'charts-sparkline--in-modal');
    const dialog = page.getByRole('dialog', { name: 'Orders' });
    await expect(page.locator('[data-umbra="modal-backdrop"]')).not.toHaveAttribute('data-entering');
    const spark = dialog.locator('[data-umbra="sparkline"]');
    await spark.focus();
    const tip = page.getByRole('tooltip');
    await expect(tip).toHaveText('Dec: 90');
    expect(await inModalLayer(tip)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(tip).toHaveCount(0);
    await expect(dialog).toBeVisible();
    await expectFocusKept(page);
  });

  test('`sparklineColumn` draws a sparkline per row of a DataTable, and sorts by the last value', async ({
    page,
  }) => {
    await openStory(page, 'charts-sparkline--in-table');
    const table = page.getByRole('grid', { name: 'Items' });
    const sparks = table.locator('[data-umbra="sparkline"]');
    await expect(sparks).toHaveCount(12);
    // Each stays inside its cell.
    for (const spark of [sparks.nth(0), sparks.nth(1), sparks.nth(2)]) {
      const [inner, cell] = [await box(spark), await box(spark.locator('xpath=ancestor::td'))];
      expect(inner.x).toBeGreaterThanOrEqual(cell.x);
      expect(inner.x + inner.width).toBeLessThanOrEqual(cell.x + cell.width + 0.5);
      expect(inner.height).toBeLessThanOrEqual(cell.height);
    }
    // A row with no values shows the "no value" mark, in every sparkline column.
    const empty = table.getByRole('row', { name: /Item 4/ }).locator('[data-umbra="sparkline"]');
    await expect(empty).toHaveCount(3);
    await expect(empty.first()).toHaveAttribute('aria-label', 'No data');
    // Props per row.
    await expect(table.getByRole('img', { name: 'Outcomes of Item 1' })).toHaveCount(1);

    const names = () => table.locator('tbody th[scope="row"]').allTextContents();
    expect(await names()).toEqual(['Item 1', 'Item 2', 'Item 3', 'Item 4']);
    await table.getByRole('columnheader', { name: 'Trend' }).getByRole('button').click();
    // By the last value of each run: 36, 58, 90, and the row without one.
    const sorted = await names();
    expect(sorted.filter((name) => name !== 'Item 4')).toEqual(['Item 2', 'Item 3', 'Item 1']);
  });

  test('composes into a SummaryTile, and takes tokens, parts and blocks', async ({ page }) => {
    await openStory(page, 'charts-sparkline--in-summary-tile');
    const tiles = page.locator('[data-umbra="summary-tile"]');
    await expect(tiles).toHaveCount(3);
    for (const tile of await tiles.all()) {
      const [spark, frame] = [await box(tile.locator('[data-umbra="sparkline"]')), await box(tile)];
      expect(spark.width).toBeGreaterThan(60);
      expect(spark.x + spark.width).toBeLessThanOrEqual(frame.x + frame.width);
      expect(spark.y + spark.height).toBeLessThanOrEqual(frame.y + frame.height);
    }

    await openStory(page, 'charts-sparkline--customised');
    const sparks = page.locator('[data-umbra="sparkline"]');
    expect((await box(sparks.first())).height).toBe(32);
    expect(
      await sparks
        .first()
        .locator('path')
        .evaluate((el) => getComputedStyle(el).strokeWidth),
    ).toBe('3px');
    await expect(part(sample(page, 'A node replaces the reference'), 'reference')).toHaveCount(0);
    await expect(sample(page, 'A node replaces the reference').locator('line')).toHaveCount(1);
    await expect(part(sample(page, 'null hides the markers'), 'markers')).toHaveCount(0);
    await expect(
      sample(page, 'A function wraps the marks').locator('g[opacity] [data-part="marks"]'),
    ).toHaveCount(1);
    await expect(sample(page, 'A replaced skeleton')).toHaveText('Loading…');
    // Blocks in another order: the reference over the marks.
    const built = sparks.last();
    expect(
      await built
        .locator('svg > [data-part]')
        .evaluateAll((els) => els.map((el) => el.getAttribute('data-part'))),
    ).toEqual(['marks', 'reference', 'markers']);
  });
});

// --- Heatmap and Scatter: the shared chart frame ---------------------------------------------------------

/** Opens a chart story with its fonts loaded, as the charts' own tests do: labels are measured in them. */
const openChart = async (page: Page, id: string, width = 1280, height = 720) => {
  await openStory(page, id, { width, height });
  await page.evaluate(async () => {
    await Promise.all(
      [...document.fonts].filter((f) => f.unicodeRange.startsWith('U+0-FF')).map((f) => f.load()),
    );
    await document.fonts.ready;
  });
};
const tile = (page: Page, id: string) => page.locator(`[data-tile="${id}"] figure`);
const sized = (page: Page, size: string) => page.locator(`[data-size="${size}"] figure`);
const marks = (chart: Locator) => chart.getByRole('listbox');
const tooltip = (chart: Locator) => part(chart, 'tooltip');
const current = async (chart: Locator) => {
  const id = await marks(chart).getAttribute('aria-activedescendant');
  return id ? chart.locator(`[id="${id}"]`).getAttribute('aria-label') : null;
};
const inside = async (inner: Locator, outer: Locator) => {
  const [a, b] = [await box(inner), await box(outer)];
  expect(a.x).toBeGreaterThanOrEqual(b.x - 1);
  expect(a.y).toBeGreaterThanOrEqual(b.y - 1);
  expect(a.x + a.width).toBeLessThanOrEqual(b.x + b.width + 1);
  expect(a.y + a.height).toBeLessThanOrEqual(b.y + b.height + 1);
};
/** What a chart still shows at a size of its Shrink story. */
const shown = async (page: Page, size: string, labels: string) => {
  const chart = sized(page, size);
  await inside(chart.locator('svg').first(), chart);
  return {
    level: await chart.getAttribute('data-level'),
    legend: await part(chart, 'legend').count(),
    labels: (await chart.locator(`[data-part="${labels}"] text`).count()) > 0,
    titles: await chart.locator('[data-part="xTitle"], [data-part="yTitle"]').count(),
    axes: await part(chart, 'axes').count(),
  };
};
/** The loading, empty and error states of a States story, the same for both charts. */
const expectStates = async (page: Page, id: string, emptyText: string, points: number) => {
  await openChart(page, id);
  const charts = page.locator('figure');
  await expect(charts.nth(0)).toHaveAttribute('aria-busy', 'true');
  await expect(part(charts.nth(0), 'skeleton')).toBeVisible();
  await expect(charts.nth(0).getByRole('listbox')).toHaveCount(0);
  await expect(charts.nth(1)).toHaveAttribute('data-state', 'empty');
  await expect(charts.nth(1)).toContainText(emptyText);
  await expect(charts.nth(1).locator('table')).toHaveCount(0);
  const failed = charts.nth(2);
  await expect(failed.getByRole('alert')).toContainText('Retries: 0.');
  await failed.getByRole('button', { name: 'Try again' }).click();
  await expect(failed.getByRole('alert')).toContainText('Retries: 1.');
  await expectFocusKept(page);
  expect(points).toBeGreaterThan(0);
};

test.describe('Heatmap', () => {
  test('arrow keys move through the grid of cells from one tab stop, and Enter presses one', async ({
    page,
  }) => {
    await openChart(page, 'charts-heatmap--interaction');
    const chart = tile(page, 'controlled');
    await page.getByRole('button', { name: 'Show all' }).focus();
    await pressKeys(page, 'Tab');
    await expect(marks(chart)).toBeFocused();
    expect(await current(chart)).toBeNull();

    await pressKeys(page, 'ArrowRight');
    expect(await current(chart)).toBe('Mon, 08: 4 orders');
    await expect(part(chart, 'focusRing')).toHaveAttribute('data-keyboard', 'true');
    // One value: its row and column are its name, with no title above.
    await expect(tooltip(chart)).toHaveText('Mon, 084 orders');
    await pressKeys(page, 'ArrowRight');
    expect(await current(chart)).toBe('Mon, 09: 12 orders');
    await pressKeys(page, 'ArrowDown');
    expect(await current(chart)).toBe('Tue, 09: 18 orders');
    await pressKeys(page, 'ArrowUp', 'ArrowUp');
    expect(await current(chart)).toBe('Mon, 09: 12 orders');
    await pressKeys(page, 'End');
    expect(await current(chart)).toBe('Mon, 15: 14 orders');
    await pressKeys(page, 'Home', 'ArrowDown', 'ArrowDown');
    expect(await current(chart)).toBe('Wed, 08: 3 orders');
    // Past the missing value of Wednesday at 12, to the nearest cell of the next row.
    await pressKeys(page, 'ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowRight');
    expect(await current(chart)).toBe('Wed, 13: 15 orders');

    await pressKeys(page, 'Enter');
    await expect(page.getByText('Pressed: Wed, 13, 15.')).toBeVisible();
    await pressKeys(page, 'Escape');
    expect(await current(chart)).toBeNull();
    await expect(tooltip(chart)).toHaveCount(0);
    await expect(marks(chart)).toBeFocused();
    // One tab stop: the next Tab leaves the cells for the legend.
    await pressKeys(page, 'Tab');
    await expect(chart.getByRole('button', { name: '0 – 10' })).toBeFocused();
  });

  test('hovering a cell shows its value, and clicking presses it', async ({ page }) => {
    await openChart(page, 'charts-heatmap--interaction');
    const chart = tile(page, 'controlled');
    await chart.getByRole('option', { name: 'Thu, 11: 48 orders' }).hover();
    await expect(tooltip(chart)).toBeVisible();
    await expect(tooltip(chart)).toContainText('48 orders');
    await expect(part(chart, 'focusRing')).not.toHaveAttribute('data-keyboard', 'true');
    await chart.getByRole('option', { name: 'Thu, 11: 48 orders' }).click();
    await expect(page.getByText('Pressed: Thu, 11, 48.')).toBeVisible();
    await page.mouse.move(2, 2);
    await expect(tooltip(chart)).toHaveCount(0);
  });

  test('the legend reads from low to high, and switches a step of the scale off', async ({ page }) => {
    await openChart(page, 'charts-heatmap--interaction');
    const chart = tile(page, 'controlled');
    const legend = part(chart, 'legend');
    await expect(part(legend, 'lowLabel')).toHaveText('Low');
    await expect(part(legend, 'highLabel')).toHaveText('High');
    // Five steps, named by their range; the swatches run from the low end to the high end.
    const steps = legend.getByRole('button');
    expect(await steps.evaluateAll((els) => els.map((el) => el.textContent))).toEqual([
      '0 – 10',
      '10 – 20',
      '20 – 30',
      '30 – 40',
      '40 – 50',
    ]);
    expect((await box(part(legend, 'lowLabel'))).x).toBeLessThan((await box(steps.first())).x);
    expect((await box(steps.last())).x).toBeLessThan((await box(part(legend, 'highLabel'))).x);

    await expect(chart.getByRole('option')).toHaveCount(39);
    await steps.first().hover();
    await expect(chart.locator('[data-series="step-4"]').first()).toHaveAttribute('data-dim', 'true');
    await steps.first().click();
    await expect(page.getByText('Hidden: step-0.')).toBeVisible();
    await expect(chart.locator('[data-series="step-0"]')).toHaveCount(0);
    await expect(chart.getByRole('option')).toHaveCount(31);
    await expect(steps.first()).toHaveAttribute('aria-pressed', 'false');
    await page.getByRole('button', { name: 'Show all' }).click();
    await expect(chart.getByRole('option')).toHaveCount(39);

    // Bands carry their own names, and need no "low" and "high".
    const banded = tile(page, 'uncontrolled');
    await expect(part(banded, 'lowLabel')).toHaveCount(0);
    await expect(banded.getByRole('button', { name: 'Quiet' })).toHaveAttribute('aria-pressed', 'false');
    await expect(banded.locator('[data-series="step-0"]')).toHaveCount(0);
    await banded.getByRole('button', { name: 'Quiet' }).press('Enter');
    await expect(banded.locator('[data-series="step-0"]')).not.toHaveCount(0);
    // With every band switched off the chart says so, and the legend stays to switch one back on.
    for (const name of ['Quiet', 'Busy', 'Full']) await banded.getByRole('button', { name }).click();
    await expect(banded).toContainText('All series are hidden');
    await banded.getByRole('button', { name: 'Full' }).click();
    await expect(banded.getByRole('option')).toHaveCount(6);
  });

  test('colour has a second cue: the printed value, or else the size of the mark', async ({ page }) => {
    await openChart(page, 'charts-heatmap--variants');
    const printed = tile(page, 'categories');
    await expect(printed.locator('[data-part="valueLabels"] text')).toHaveCount(39);
    // Printed: every cell is the whole of its cell.
    const full = await part(printed, 'cell').evaluateAll((els) =>
      els.map((el) => Math.round(el.getBoundingClientRect().width)),
    );
    expect(new Set(full).size).toBe(1);

    // Not printed: the mark grows with the step, from the smallest to the whole cell.
    const bySize = tile(page, 'sizes');
    await expect(bySize.locator('[data-part="valueLabels"] text')).toHaveCount(0);
    const width = async (name: string) =>
      (await box(bySize.getByRole('option', { name }).locator('[data-part="cell"]'))).width;
    const [low, mid, high] = [
      await width('Mon, 08: 4'),
      await width('Mon, 10: 28'),
      await width('Thu, 11: 48'),
    ];
    expect(low).toBeLessThan(mid);
    expect(mid).toBeLessThan(high);
    // The pointer still has the whole cell.
    const target = bySize.getByRole('option', { name: 'Mon, 08: 4' });
    expect((await box(target)).width).toBeGreaterThan(low * 1.5);

    // Low is good: the looks mirror, so the lowest values take the strongest look.
    const lower = tile(page, 'lower');
    const side = async (name: string) =>
      (await box(lower.getByRole('option', { name }).locator('[data-part="cell"]'))).width;
    expect(await side('Fri, 08: 2')).toBeGreaterThan(await side('Thu, 11: 48'));
  });

  test('thresholds make bands, with their names in the value; a fixed scale and a format', async ({
    page,
  }) => {
    await openChart(page, 'charts-heatmap--variants');
    const banded = tile(page, 'thresholds');
    await expect(banded.getByRole('option', { name: 'Mon, 08: 4 · Quiet' })).toHaveAttribute(
      'data-band',
      '0',
    );
    await expect(banded.getByRole('option', { name: 'Mon, 10: 28 · Busy' })).toHaveAttribute(
      'data-band',
      '1',
    );
    await expect(banded.getByRole('option', { name: 'Thu, 11: 48 · Full' })).toHaveAttribute(
      'data-band',
      '2',
    );
    expect(await part(banded, 'legend').getByRole('button').allTextContents()).toEqual([
      'Quiet',
      'Busy',
      'Full',
    ]);

    const fixed = tile(page, 'domain');
    await expect(fixed.getByRole('option', { name: 'Tue, 11: 41%' })).toHaveAttribute(
      'data-series',
      'step-2',
    );
    expect(await part(fixed, 'legend').getByRole('button').first().textContent()).toBe('0 – 20');
  });

  test('points are summed into bins, named by their ranges', async ({ page }) => {
    await openChart(page, 'charts-heatmap--variants');
    const binned = tile(page, 'binned');
    // The first row is the highest range; a bin without a point has no cell.
    const first = binned.getByRole('option').first();
    await expect(first).toHaveAttribute('aria-label', /^50 – 60, 0 – 10: \d+$/);
    expect(await binned.getByRole('option').count()).toBeLessThan(60);
    const total = await binned
      .getByRole('option')
      .evaluateAll((els) =>
        els.reduce((sum, el) => sum + Number(el.getAttribute('aria-label')!.split(': ')[1]), 0),
      );
    expect(total).toBe(160);
  });

  test('the same values are a table for screen readers, with a summary', async ({ page }) => {
    await openChart(page, 'charts-heatmap--variants');
    const chart = tile(page, 'thresholds');
    await expect(chart).toHaveAttribute('aria-label', 'Load by day and hour');
    const table = chart.locator('table');
    expect(await table.locator('thead th').allTextContents()).toEqual([
      '08',
      '09',
      '10',
      '11',
      '12',
      '13',
      '14',
      '15',
    ]);
    expect(await table.locator('tbody th').allTextContents()).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
    expect(await table.locator('tbody tr').nth(2).locator('td').allTextContents()).toEqual([
      '3 · Quiet',
      '10 · Quiet',
      '24 · Busy',
      '30 · Busy',
      '',
      '15 · Quiet',
      '27 · Busy',
      '11 · Quiet',
    ]);
    const description = await chart.getAttribute('aria-describedby');
    await expect(chart.locator(`[id="${description}"]`)).toHaveText(/^Mon, Tue, Wed, Thu, Fri: 08, 09/);
  });

  test('sheds the legend, the printed values, the axis titles and the axes as the slot shrinks', async ({
    page,
  }) => {
    await openChart(page, 'charts-heatmap--shrink');
    const at = (size: string) => shown(page, size, 'valueLabels');
    expect(await at('420x270')).toEqual({ level: '0', legend: 1, labels: true, titles: 2, axes: 1 });
    expect(await at('330x230')).toEqual({ level: '1', legend: 0, labels: true, titles: 2, axes: 1 });
    expect(await at('270x180')).toEqual({ level: '2', legend: 0, labels: false, titles: 2, axes: 1 });
    expect(await at('210x140')).toEqual({ level: '3', legend: 0, labels: false, titles: 0, axes: 1 });
    expect(await at('140x80')).toEqual({ level: '4', legend: 0, labels: false, titles: 0, axes: 0 });
    // Without printed values the size of the marks takes over; every cell is still there, to the last step.
    for (const size of ['270x180', '140x80']) {
      const cells = part(sized(page, size), 'cell');
      await expect(cells).toHaveCount(29);
      const widths = await cells.evaluateAll((els) =>
        els.map((el) => Math.round(el.getBoundingClientRect().width)),
      );
      expect(new Set(widths).size).toBeGreaterThan(1);
    }
  });

  test('a backdrop is drawn behind the cells at the size of the plot; without axes it takes all of it', async ({
    page,
  }) => {
    await openChart(page, 'charts-heatmap--over-backdrop');
    const plain = tile(page, 'plain');
    const backdrop = part(plain, 'backdrop');
    await expect(backdrop.locator('[data-backdrop="floor-plan"]')).toBeVisible();
    await expect(backdrop).toHaveAttribute('aria-hidden', 'true');
    await expect(part(plain, 'axes')).toHaveCount(0);
    // The whole plot but a hairline of margin, and the drawing stretched to it.
    const [plot, behind, drawing] = [
      await box(part(plain, 'plot')),
      await box(backdrop),
      await box(backdrop.locator('svg')),
    ];
    expect(behind.width).toBeGreaterThanOrEqual(plot.width - 8);
    expect(behind.height).toBeGreaterThanOrEqual(plot.height - 8);
    expect(Math.round(drawing.width)).toBe(Math.round(behind.width));
    expect(Math.round(drawing.height)).toBe(Math.round(behind.height));
    // Behind: the backdrop comes before the cells, which let it show through and still take the pointer.
    expect(
      await plain
        .locator('svg [data-part]')
        .evaluateAll((els) =>
          els.map((el) => el.getAttribute('data-part')).filter((p) => p === 'backdrop' || p === 'cells'),
        ),
    ).toEqual(['backdrop', 'cells']);
    expect(
      await part(plain, 'cell')
        .first()
        .evaluate((el) => getComputedStyle(el).opacity),
    ).toBe('0.8');
    await plain.getByRole('option').first().hover();
    await expect(tooltip(plain)).toBeVisible();

    // With axes the backdrop is the area between them.
    const withAxes = tile(page, 'axes');
    await expect(part(withAxes, 'axes')).toHaveCount(1);
    const [area, cells] = [await box(part(withAxes, 'backdrop')), await box(part(withAxes, 'cells'))];
    expect(cells.x).toBeGreaterThanOrEqual(area.x - 1);
    expect(cells.x + cells.width).toBeLessThanOrEqual(area.x + area.width + 1);
    expect(area.width).toBeLessThan((await box(part(withAxes, 'plot'))).width - 30);
  });

  test('loading, empty and error states', async ({ page }) => {
    await expectStates(page, 'charts-heatmap--states', 'No orders in this period', 1);
  });

  test('tokens, parts and blocks', async ({ page }) => {
    await openChart(page, 'charts-heatmap--customised');
    const tokens = tile(page, 'tokens');
    expect(
      await part(tokens, 'cell')
        .first()
        .evaluate((el) => getComputedStyle(el).stroke),
    ).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
    const custom = tile(page, 'parts');
    await expect(custom.locator('[data-custom-legend]')).toHaveText('Orders per hour, from few to many');
    await custom.getByRole('option').first().hover();
    await expect(part(custom, 'focusRing')).toHaveCount(1);
    await expect(tooltip(custom)).toHaveCount(0);

    const functions = tile(page, 'functions').first();
    await functions.getByRole('option', { name: 'Mon, 08: 4' }).hover();
    await expect(functions.locator('[data-custom-tooltip]')).toHaveText('Mon, 08: 4');
    await expect(tile(page, 'functions').nth(1)).toContainText('Loading the grid…');

    const blocks = tile(page, 'blocks');
    await expect(part(blocks, 'axes')).toHaveCount(0);
    await expect(part(blocks, 'backdrop')).toHaveCount(0);
    await expect(blocks.getByRole('option')).toHaveCount(39);
    await expect(blocks.locator('[data-part="valueLabels"] text')).toHaveCount(39);
  });
});

test.describe('Scatter', () => {
  test('arrow keys move along the x axis and between series, and Enter gives the id of the point', async ({
    page,
  }) => {
    await openChart(page, 'charts-scatter--interaction');
    const chart = tile(page, 'controlled');
    await page.getByRole('button', { name: 'Show all' }).focus();
    await pressKeys(page, 'Tab');
    await expect(marks(chart)).toBeFocused();
    await pressKeys(page, 'ArrowRight');
    expect(await current(chart)).toBe('North, Site 1: Distance 12, Score 64, Orders 40');
    await expect(part(chart, 'focusRing')).toHaveAttribute('data-keyboard', 'true');
    await expect(tooltip(chart)).toContainText('Site 1');
    await expect(tooltip(chart)).toContainText('Distance 12, Score 64, Orders 40');
    await pressKeys(page, 'ArrowRight');
    expect(await current(chart)).toBe('North, Site 2: Distance 28, Score 38, Orders 90');
    await pressKeys(page, 'End');
    expect(await current(chart)).toBe('North, Site 4: Distance 55, Score 72, Orders 60');
    // To the other series: its point nearest along the x axis.
    await pressKeys(page, 'ArrowDown');
    expect(await current(chart)).toBe('South, Site 5: Distance 44, Score 22, Orders 25');
    await pressKeys(page, 'Enter');
    await expect(page.getByText('Pressed: site-5.')).toBeVisible();
    await pressKeys(page, 'ArrowRight', 'Space');
    await expect(page.getByText('Pressed: site-6.')).toBeVisible();
    await pressKeys(page, 'Escape');
    expect(await current(chart)).toBeNull();
    await expect(marks(chart)).toBeFocused();
    await pressKeys(page, 'Tab');
    await expect(chart.getByRole('button', { name: 'North' })).toBeFocused();
  });

  test('hover shows a tooltip inside the chart, a click presses, and a point without an id gets one', async ({
    page,
  }) => {
    await openChart(page, 'charts-scatter--interaction');
    const chart = tile(page, 'controlled');
    const point = chart.getByRole('option', { name: /Site 7/ });
    await point.hover();
    await expect(tooltip(chart)).toContainText('Distance 86, Score 30, Orders 50');
    await inside(tooltip(chart), chart);
    await point.click();
    await expect(page.getByText('Pressed: site-7.')).toBeVisible();
    await page.mouse.move(2, 2);
    await expect(tooltip(chart)).toHaveCount(0);
    // Every point is at least 24px to the pointer.
    expect((await box(chart.getByRole('option', { name: /Site 3/ }))).width).toBeGreaterThanOrEqual(24);
  });

  test('a legend item hides its series, controlled and uncontrolled; each series has its own shape', async ({
    page,
  }) => {
    await openChart(page, 'charts-scatter--interaction');
    const chart = tile(page, 'controlled');
    await expect(chart.getByRole('option')).toHaveCount(7);
    await chart.getByRole('button', { name: 'South' }).hover();
    // Every point of the other series fades (a point is its own group, so the largest are drawn first).
    await expect(chart.locator('g[data-series="north"][data-dim]')).toHaveCount(4);
    await chart.getByRole('button', { name: 'South' }).click();
    await expect(page.getByText('Hidden: south.')).toBeVisible();
    await expect(chart.getByRole('option')).toHaveCount(4);
    await page.getByRole('button', { name: 'Show all' }).click();
    await expect(chart.getByRole('option')).toHaveCount(7);

    const other = tile(page, 'uncontrolled');
    await expect(other.locator('g[data-series="c"]')).toHaveCount(0);
    await other.getByRole('button', { name: 'Group C' }).press('Enter');
    await expect(other.locator('g[data-series="c"]')).not.toHaveCount(0);
    // Shape and colour: the marks of a series and its legend marker share the shape.
    for (const [id, name, shape] of [
      ['a', 'Group A', 'dot'],
      ['b', 'Group B', 'square'],
      ['c', 'Group C', 'diamond'],
    ] as const) {
      await expect(other.locator(`g[data-series="${id}"] [data-shape]`).first()).toHaveAttribute(
        'data-shape',
        shape,
      );
      await expect(other.getByRole('button', { name }).locator(`[data-kind="${shape}"]`)).toHaveCount(1);
    }
  });

  test('bubbles grow with their size, and a label that would cover a point is left out', async ({ page }) => {
    await openChart(page, 'charts-scatter--variants');
    const chart = tile(page, 'bubbles');
    const width = async (name: RegExp) =>
      (await box(chart.getByRole('option', { name }).locator('[data-shape]'))).width;
    const [small, medium, large] = [await width(/Site 3/), await width(/Site 1/), await width(/Site 2/)];
    expect(small).toBeLessThan(medium);
    expect(medium).toBeLessThan(large);
    // The area follows the size: 90 against 40 is a radius 1.5 times as large, less the smallest radius.
    expect(large / medium).toBeGreaterThan(1.25);
    expect(large / medium).toBeLessThan(1.6);

    const labels = chart.locator('[data-part="pointLabels"] text');
    const texts = await labels.allTextContents();
    // Site 3 sits inside Site 2: its label has no room.
    expect(texts).not.toContain('Site 3');
    expect(texts).toContain('Site 1');
    expect(texts.length).toBeGreaterThanOrEqual(5);
    const boxes = await labels.evaluateAll((els) => els.map((el) => el.getBoundingClientRect()));
    for (const [i, a] of boxes.entries())
      for (const b of boxes.slice(i + 1))
        expect(a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom).toBe(false);
    // Without sizes every point is the same.
    const plain = tile(page, 'series');
    const sizes = await plain
      .locator('[data-series="a"] [data-shape]')
      .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().width)));
    expect(new Set(sizes).size).toBe(1);
  });

  test('numeric and time axes, reference lines and bands, and the data table', async ({ page }) => {
    await openChart(page, 'charts-scatter--variants');
    const chart = tile(page, 'series');
    expect(await chart.locator('[data-part="yTicks"] text').allTextContents()).toEqual([
      '0',
      '20',
      '40',
      '60',
      '80',
    ]);
    expect(await chart.locator('[data-part="xTicks"] text').allTextContents()).toEqual(['0', '50', '100']);
    await expect(part(chart, 'xTitle')).toHaveText('Time');
    await expect(part(chart, 'yTitle')).toHaveText('Cost');
    // A point further along x is further right; a higher one is further up.
    const at = async (name: string) => box(chart.getByRole('option', { name }));
    const [a, b] = [await at('Group A: Time 5, Cost 10'), await at('Group A: Time 22, Cost 33')];
    expect(b.x).toBeGreaterThan(a.x);
    expect(b.y).toBeLessThan(a.y);

    const dated = tile(page, 'time');
    expect(await dated.locator('[data-part="xTicks"] text').allTextContents()).toEqual([
      'Jan 4',
      'Jan 11',
      'Jan 18',
      'Jan 25',
    ]);
    await expect(dated.getByRole('option', { name: 'Web: Jan 2, Visits 20' })).toHaveCount(1);

    const noted = tile(page, 'annotations');
    await expect(noted.locator('[data-part="annotations"] [data-kind="line"]')).toContainText('Budget');
    await expect(noted.locator('[data-part="annotations"] [data-kind="band"]')).toContainText('Target');

    const formatted = tile(page, 'one');
    await expect(formatted.getByRole('option').first()).toHaveAttribute('aria-label', 'Group A: 5 h, 10 k');

    const table = tile(page, 'bubbles').locator('table');
    expect(await table.locator('thead th').allTextContents()).toEqual(['Distance', 'Score', 'Orders']);
    expect(await table.locator('tbody tr').first().locator('th, td').allTextContents()).toEqual([
      'North, Site 1',
      '12',
      '64',
      '40',
    ]);
    await expect(table.locator('tbody tr')).toHaveCount(7);
  });

  test('sheds the legend, the point labels, the axis titles and the axes as the slot shrinks', async ({
    page,
  }) => {
    await openChart(page, 'charts-scatter--shrink');
    const at = (size: string) => shown(page, size, 'pointLabels');
    expect(await at('420x270')).toEqual({ level: '0', legend: 1, labels: true, titles: 2, axes: 1 });
    expect(await at('330x230')).toEqual({ level: '1', legend: 0, labels: true, titles: 2, axes: 1 });
    expect(await at('270x180')).toEqual({ level: '2', legend: 0, labels: false, titles: 2, axes: 1 });
    expect(await at('210x140')).toEqual({ level: '3', legend: 0, labels: false, titles: 0, axes: 1 });
    expect(await at('140x80')).toEqual({ level: '4', legend: 0, labels: false, titles: 0, axes: 0 });
    // The points are all there at every size.
    for (const size of ['420x270', '140x80'])
      await expect(sized(page, size).getByRole('option')).toHaveCount(7);
  });

  test('a backdrop is drawn behind the points at the size of the plot; without axes it takes all of it', async ({
    page,
  }) => {
    await openChart(page, 'charts-scatter--over-backdrop');
    const plain = tile(page, 'plain');
    const backdrop = part(plain, 'backdrop');
    await expect(backdrop.locator('[data-backdrop="floor-plan"]')).toBeVisible();
    await expect(part(plain, 'axes')).toHaveCount(0);
    await expect(part(plain, 'grid')).toHaveCount(0);
    const [plot, behind] = [await box(part(plain, 'plot')), await box(backdrop)];
    expect(behind.width).toBeGreaterThanOrEqual(plot.width - 8);
    expect(behind.height).toBeGreaterThanOrEqual(plot.height - 8);
    // The numbered places are labelled on the drawing, and each can be reached.
    expect(await plain.locator('[data-part="pointLabels"] text').allTextContents()).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
    ]);
    await plain.getByRole('option', { name: 'Team 1, 4: 48, 30' }).hover();
    await expect(tooltip(plain)).toContainText('48, 30');
    await inside(plain.getByRole('option').first(), backdrop);

    const withAxes = tile(page, 'axes');
    await expect(part(withAxes, 'axes')).toHaveCount(1);
    await expect(part(withAxes, 'backdrop').locator('[data-backdrop="blob"]')).toBeVisible();
    expect((await box(part(withAxes, 'backdrop'))).width).toBeLessThan(
      (await box(part(withAxes, 'plot'))).width - 20,
    );
  });

  test('loading, empty and error states', async ({ page }) => {
    await expectStates(page, 'charts-scatter--states', 'Nothing measured yet', 1);
  });

  test('tokens, parts and blocks', async ({ page }) => {
    await openChart(page, 'charts-scatter--customised');
    const tokens = tile(page, 'tokens');
    expect(
      await tokens
        .locator('[data-shape]')
        .first()
        .locator('xpath=..')
        .evaluate((el) => getComputedStyle(el).fillOpacity),
    ).toBe('0.2');
    const custom = tile(page, 'parts');
    await expect(custom.locator('[data-custom-legend]')).toHaveText('Three groups of runs');
    await custom.getByRole('option').first().hover();
    await expect(tooltip(custom)).toHaveCount(0);
    const functions = tile(page, 'functions').first();
    await expect(part(functions, 'backdrop').locator('[data-backdrop="blob"]')).toBeVisible();
    await functions.getByRole('option', { name: /Site 6/ }).hover();
    await expect(functions.locator('[data-custom-tooltip]')).toHaveText('Site 6: 70, 48, Size 120');
    await expect(tile(page, 'functions').nth(1)).toContainText('Loading the points…');
    const blocks = tile(page, 'blocks');
    await expect(part(blocks, 'axes')).toHaveCount(0);
    await expect(part(blocks, 'grid')).toHaveCount(0);
    await expect(blocks.locator('[data-part="annotations"] [data-kind="band"]')).toHaveCount(1);
    await expect(blocks.getByRole('option')).toHaveCount(26);
  });

  test('right to left: neither plot mirrors, and what is around them does', async ({ page }) => {
    await openChart(page, 'charts-right-to-left--heatmap-and-scatter');
    const heat = tile(page, 'heatmap');
    expect(
      await heat
        .locator('svg')
        .first()
        .evaluate((el) => getComputedStyle(el).direction),
    ).toBe('ltr');
    const [q1, q4] = [
      await box(heat.getByRole('option', { name: 'Region 1, Q1: 12' })),
      await box(heat.getByRole('option', { name: 'Region 1, Q4: 31' })),
    ];
    expect(q1.x).toBeLessThan(q4.x);
    // The row names stay beside their rows, on the left.
    expect((await box(heat.locator('[data-part="yTicks"]'))).x).toBeLessThan(q1.x);
    await expect(heat.locator('[data-part="yTicks"]')).toContainText('אזור 4');
    // The legend around the plot follows the page: "Low" is on the right.
    expect((await box(part(heat, 'lowLabel'))).x).toBeGreaterThan((await box(part(heat, 'highLabel'))).x);

    const scatter = tile(page, 'scatter');
    const [first, last] = [
      await box(scatter.getByRole('option', { name: /Run 1/ })),
      await box(scatter.getByRole('option', { name: /Run 4/ })),
    ];
    expect(first.x).toBeLessThan(last.x);
    // A label still follows its point.
    const label = await box(scatter.locator('[data-part="pointLabels"] text', { hasText: 'Run 1' }));
    expect(label.x).toBeGreaterThan(first.x);
    // The arrow keys follow what is drawn.
    await marks(scatter).focus();
    await pressKeys(page, 'ArrowRight', 'ArrowRight');
    expect(await current(scatter)).toMatch(/Run 2/);
  });
});

// Review 2 of Milestone 2 (plan/reviews/milestone-2.md): one test or more per finding, each failing
// without its fix. The stories are `Charts/Edge cases`.
test.describe('Review 2', () => {
  const EDGE = 'charts-edge-cases--';
  const options = (page: Page, id: string) => tile(page, id).getByRole('option');
  const names = (page: Page, id: string) =>
    options(page, id).evaluateAll((els) => els.map((el) => el.getAttribute('aria-label')));

  test('MC-1, MC-4, MC-13: invalid input is never a crash or a blank chart; the bad value is no value', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await openChart(page, `${EDGE}invalid-input`);
    // Every chart is drawn: none is empty, and none has taken the page down.
    await expect(page.locator('figure')).toHaveCount(7);
    await expect(page.locator('figure[data-state]')).toHaveCount(0);
    // NaN, Infinity and null are left out, and so is the second series of one id.
    expect(await names(page, 'line')).toEqual(['Orders, Jan: 10', 'Orders, May: 30', 'Orders, Jul: 20']);
    expect(await names(page, 'bar')).toEqual(['Orders, Jan: 10', 'Orders, May: 30', 'Orders, Jul: 20']);
    expect(await names(page, 'donut')).toEqual(['Region 1: 30 (38%)', 'Region 4: 50 (63%)']);
    expect(await names(page, 'radar')).toEqual(['Orders, Jan: 4', 'Orders, May: 3']);
    expect(await names(page, 'scatter')).toEqual(['Group 1: 1, 1', 'Group 1: 5, 5']);
    expect((await names(page, 'binned')).length).toBe(2);
    // Two rows and two columns of one name are all drawn, each cell in its own place.
    expect(await names(page, 'heatmap')).toEqual([
      'A, y: 1',
      'A, y (2): 2',
      'A (2), x: 2',
      'A (2), y (2): 3',
      'B, y: 4',
    ]);
    const places = await options(page, 'heatmap').evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return `${Math.round(r.x)},${Math.round(r.y)}`;
      }),
    );
    expect(new Set(places).size).toBe(5);
    // The lines and shapes hold no NaN.
    expect(
      await page
        .locator('figure svg')
        .evaluateAll((svgs) => svgs.filter((s) => /NaN|Infinity/.test(s.innerHTML)).length),
    ).toBe(0);

    const small = page.locator('[data-tile="small"]');
    await expect(small.getByRole('img')).toHaveAttribute(
      'aria-label',
      '3 values, first 10, last 20, lowest 10, highest 30, rising',
    );
    const meters = small.locator('[role="meter"], [role="progressbar"]');
    await expect(meters).toHaveCount(5);
    for (const m of await meters.all()) {
      await expect(m).toHaveAttribute('aria-valuetext', 'No value');
      await expect(m).toHaveAttribute('data-empty', 'true');
      await expect(part(m, 'value')).toHaveText('—');
    }
    // The keyboard still walks what is drawn.
    await marks(tile(page, 'heatmap')).focus();
    await pressKeys(page, 'ArrowRight', 'ArrowRight', 'ArrowDown');
    expect(await current(tile(page, 'heatmap'))).toBe('A (2), y (2): 3');
    expect(errors).toEqual([]);
  });

  const set = async (page: Page, state: string) => {
    await page.evaluate((s) => document.querySelector<HTMLElement>(`[data-set="${s}"]`)!.click(), state);
    await settle(page);
  };
  const focusIn = (chart: Locator) => chart.evaluate((el) => el.contains(document.activeElement));

  for (const id of ['line', 'bar', 'donut', 'radar', 'heatmap', 'scatter']) {
    test(`MC-6: ${id}: focus stays in the chart when the app changes its state`, async ({ page }) => {
      await openChart(page, `${EDGE}state-change`);
      const chart = tile(page, id);
      await marks(chart).focus();
      await pressKeys(page, 'ArrowRight');
      expect(await current(chart)).not.toBeNull();
      for (const state of ['loading', 'error', 'loading', 'data']) {
        await set(page, state);
        expect(await chart.getAttribute('data-state')).toBe(state === 'data' ? null : state);
        await expectFocusKept(page);
        expect(await focusIn(chart)).toBe(true);
      }
      // Back on the data, the arrow keys work again without another Tab.
      await expect(marks(chart)).toBeFocused();
      await pressKeys(page, 'ArrowRight');
      expect(await current(chart)).not.toBeNull();
    });
  }

  test('MC-6: an interactive Sparkline keeps the focus through loading', async ({ page }) => {
    await openChart(page, `${EDGE}state-change`);
    const spark = page.locator('[data-tile="sparkline"] [data-umbra="sparkline"]');
    await spark.focus();
    await pressKeys(page, 'ArrowLeft');
    for (const state of ['loading', 'data']) {
      await set(page, state);
      expect(await spark.getAttribute('aria-busy')).toBe(state === 'loading' ? 'true' : null);
      await expectFocusKept(page);
      await expect(spark).toBeFocused();
    }
    await pressKeys(page, 'Home');
    await expect(page.getByRole('tooltip')).toHaveText('3');
  });

  test('X-5: a chart keeps the aria-describedby it is given, beside its own summary, in every state', async ({
    page,
  }) => {
    await openChart(page, `${EDGE}state-change`);
    for (const state of ['data', 'loading', 'error']) {
      await set(page, state);
      for (const id of ['line', 'bar', 'donut', 'radar', 'heatmap', 'scatter']) {
        const described = ((await tile(page, id).getAttribute('aria-describedby')) ?? '').split(' ');
        expect(described, `${id} ${state}`).toContain('edge-note');
        // In the data state the chart's own summary is there too.
        if (state === 'data') expect(described.length, id).toBe(2);
      }
      await expect(page.locator('[data-tile="sparkline"] [data-umbra="sparkline"]')).toHaveAttribute(
        'aria-describedby',
        'edge-note',
      );
    }
  });

  test('MC-2: a PieIndicator with the disc above shows its value', async ({ page }) => {
    await openStory(page, 'meters-pieindicator--variants');
    const block = (name: string) =>
      page.locator('[data-umbra="pie-indicator"][data-layout="block"]', { hasText: name });
    for (const name of ['Coverage', 'Quality']) {
      await expect(block(name)).toHaveCount(1);
      await expect(part(block(name), 'value')).toBeVisible();
      expect(await block(name).getAttribute('data-value-hidden')).toBeNull();
    }
    await expect(part(block('Coverage'), 'value')).toHaveText('75%');
  });

  test('MC-3: a Heatmap value below the first band is drawn, and is a keyboard stop', async ({ page }) => {
    await openChart(page, `${EDGE}scale-edges`);
    expect(await names(page, 'below')).toEqual([
      'A, x: 2',
      'A, y: 12 · Busy',
      'A, z: 25 · Full',
      'B, x: 5',
      'B, y: 15 · Busy',
      'B, z: 40 · Full',
    ]);
    const chart = tile(page, 'below');
    await marks(chart).focus();
    await pressKeys(page, 'ArrowRight');
    expect(await current(chart)).toBe('A, x: 2');
    // It is in no band: it carries none.
    expect(await chart.getByRole('option', { name: 'A, x: 2' }).getAttribute('data-band')).toBeNull();
  });

  test('MC-5: the last point of a Sparkline line takes the colour of its band', async ({ page }) => {
    await openStory(page, 'charts-sparkline--variants');
    const fill = (sample: string) =>
      page
        .locator(`[data-sample="${sample}"] [data-part="lastPoint"]`)
        .evaluate((el) => getComputedStyle(el).fill);
    const plain = await fill('Last point');
    const banded = await fill('Last point by threshold');
    expect(banded).not.toBe(plain);
  });

  test('MC-7: a small point under a larger bubble of a later series can be hovered', async ({ page }) => {
    await openChart(page, `${EDGE}scale-edges`);
    const chart = tile(page, 'under');
    const small = await box(
      chart
        .getByRole('option', { name: /Small point/ })
        .locator('circle')
        .first(),
    );
    const centre = { x: small.x + small.width / 2, y: small.y + small.height / 2 };
    await page.mouse.move(centre.x, centre.y);
    await expect(tooltip(chart)).toContainText('Small');
    // The bubble around it is still reached, outside the small point's target.
    await page.mouse.move(centre.x + 18, centre.y);
    await expect(tooltip(chart)).toContainText('Large');
  });

  test('MC-12: Scatter points outside the domains are not drawn; without axes none is cut by the edge', async ({
    page,
  }) => {
    await openChart(page, `${EDGE}scale-edges`);
    expect(await names(page, 'outside')).toEqual(['Group 1: 2, 2', 'Group 1: 3, 3', 'Group 1: 4, 4']);
    const edge = tile(page, 'edge');
    await expect(edge.getByRole('option')).toHaveCount(7);
    const svg = await box(edge.locator('svg').first());
    for (const point of await edge.locator('[data-part="point"] > g').all()) {
      const b = await box(point);
      expect(b.x).toBeGreaterThanOrEqual(svg.x);
      expect(b.y).toBeGreaterThanOrEqual(svg.y);
      expect(b.x + b.width).toBeLessThanOrEqual(svg.x + svg.width);
      expect(b.y + b.height).toBeLessThanOrEqual(svg.y + svg.height);
    }
  });

  test('MC-14: a DivergingMeter shows a difference without the noise of binary fractions', async ({
    page,
  }) => {
    await openChart(page, `${EDGE}scale-edges`);
    const m = meter(page, 'Fraction');
    await expect(part(m, 'value')).toHaveText('+0.2');
    await expect(m).toHaveAttribute('aria-valuetext', '+0.2');
  });

  for (const [story, selector, from, to] of [
    ['meters-pieindicator--shrink', '[data-width="240"]', 240, 150],
    ['meters-divergingmeter--shrink', '[data-width="320"]:has([data-layout="block"])', 320, 160],
    ['meters-divergingmeter--shrink', '[data-width="320"]:has([data-layout="inline"])', 320, 180],
  ] as const) {
    test(`MC-15: ${story} ${selector}: the value is never shown beside a cut label, at any width`, async ({
      page,
    }) => {
      await openStory(page, story);
      await page.evaluate(() => document.fonts.ready);
      const holder = page.locator(selector).first();
      const wrong: number[] = [];
      let hidden = 0;
      for (let px = from; px >= to; px -= 1) {
        await holder.evaluate((el, w) => ((el as HTMLElement).style.width = `${w}px`), px);
        await settle(page);
        const state = await holder.evaluate((el) => {
          const label = el.querySelector<HTMLElement>('[data-part="label"]')!;
          const range = document.createRange();
          range.selectNodeContents(label);
          return {
            value: !!el.querySelector('[data-part="value"]'),
            cut: range.getBoundingClientRect().width > label.getBoundingClientRect().width + 0.01,
          };
        });
        if (state.value && state.cut) wrong.push(px);
        if (!state.value) hidden += 1;
      }
      expect(wrong).toEqual([]);
      // The sweep crossed the step: the value did hide.
      expect(hidden).toBeGreaterThan(0);
    });
  }

  test('MC-9: a chart that fills, beside other content in a modal body, takes its content height', async ({
    page,
  }) => {
    await openChart(page, `${EDGE}in-modal`);
    const dialog = page.getByRole('dialog');
    expect((await box(part(dialog.locator('figure'), 'plot'))).height).toBe(240);
    const viewport = dialog.locator('[data-part="viewport"]');
    expect(await viewport.evaluate((el) => el.scrollHeight - el.clientHeight)).toBe(0);
  });
});

// Review 2, what is measured: contrast as it is drawn, on the four tints, and the cost of 5,000 marks.
test.describe('Review 2: measured', () => {
  /**
   * The strongest contrast a pixel of each box has against the surface beside it: what the eye has to
   * tell the mark from its background, blur of the edges included. One screenshot for all the boxes.
   */
  const strongest = async (page: Page, marks: Locator) => {
    const boxes = await marks.evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      }),
    );
    const points: [number, number][] = [];
    const spans: [number, number][] = [];
    for (const b of boxes) {
      const from = points.length;
      // The surface: three pixels before the box, at its middle.
      points.push([b.x - 3, b.y + b.height / 2]);
      const [x1, y1] = [Math.floor(b.x) - 1, Math.floor(b.y) - 1];
      const [x2, y2] = [Math.ceil(b.x + b.width) + 1, Math.ceil(b.y + b.height) + 1];
      for (let x = x1; x < x2; x++) for (let y = y1; y < y2; y++) points.push([x + 0.5, y + 0.5]);
      spans.push([from, points.length]);
    }
    const colours = await pixels(page, points);
    return spans.map(([from, to]) =>
      Math.max(...colours.slice(from + 1, to).map((c) => contrast(c, colours[from]!))),
    );
  };

  for (const context of contextPresets) {
    test(`MC-10: the edge of a Heatmap cell has 3:1 against the card as it is drawn (${context})`, async ({
      page,
    }) => {
      await openStory(page, 'charts-heatmap--variants', { context });
      await page.evaluate(() => document.fonts.ready);
      // Marks of every size, so their edges start at every fraction of a pixel; the lowest step has
      // the fill nearest to the card's, so its edge is what shows it.
      const cells = page.locator('[data-tile="sizes"] [data-series="step-0"] [data-part="cell"]');
      expect(await cells.count()).toBeGreaterThan(5);
      // Each of the four edges, where it is weakest: across the edge at the middle of the side.
      const boxes = await cells.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON()));
      const across = [-2, -1, 0, 1, 2];
      const points = boxes.flatMap((b): [number, number][] => [
        [b.x - 4, b.y + b.height / 2],
        ...across.map((d): [number, number] => [b.x + d, b.y + b.height / 2]),
        ...across.map((d): [number, number] => [b.right + d, b.y + b.height / 2]),
        ...across.map((d): [number, number] => [b.x + b.width / 2, b.y + d]),
        ...across.map((d): [number, number] => [b.x + b.width / 2, b.bottom + d]),
      ]);
      const colours = await pixels(page, points);
      const found = boxes.flatMap((_, i) => {
        const of = colours.slice(i * 21, i * 21 + 21);
        return [0, 1, 2, 3].map((side) =>
          Math.max(...of.slice(1 + side * 5, 6 + side * 5).map((c) => contrast(c, of[0]!))),
        );
      });
      expect(Math.min(...found), `${found.map((c) => c.toFixed(2))}`).toBeGreaterThanOrEqual(3);
    });

    test(`MC-11: the edge of an empty PieIndicator has 3:1, at zero and with no value (${context})`, async ({
      page,
    }) => {
      await openStory(page, 'meters-pieindicator--edge-values', { context });
      await page.evaluate(() => document.fonts.ready);
      const discs = page
        .locator('[data-umbra="pie-indicator"]')
        .filter({ hasText: /Zero|Under|Not measured|Not rated/ })
        .locator('[data-part="disc"]');
      await expect(discs).toHaveCount(4);
      const found = await strongest(page, discs);
      expect(Math.min(...found), `${found.map((c) => c.toFixed(2))}`).toBeGreaterThanOrEqual(3);
    });
  }

  test('MC-11: zero and no value differ without colour: wedges against a dashed ring with a dash', async ({
    page,
  }) => {
    await openStory(page, 'meters-pieindicator--edge-values');
    const zero = part(meter(page, 'Zero'), 'disc');
    const none = part(meter(page, 'Not measured'), 'disc');
    // Zero: a filled disc cut into its eight wedges. No value: a hollow ring, dashed, with a dash in it.
    await expect(zero.locator('mask line')).toHaveCount(8);
    await expect(part(zero, 'none')).toHaveCount(0);
    await expect(none.locator('mask')).toHaveCount(0);
    await expect(part(none, 'none')).toHaveCount(1);
    const look = (disc: Locator) =>
      part(disc, 'track').evaluate((el) => {
        const style = getComputedStyle(el);
        return { fill: style.fill, dash: style.strokeDasharray };
      });
    expect(await look(zero)).toMatchObject({ dash: 'none' });
    expect(await look(none)).toEqual({ fill: 'none', dash: '3px, 2px' });
    // As drawn: the dash is in the middle of the ring that has no value, and nothing is in the other's.
    const [a, b] = [await box(zero), await box(none)];
    const [beside, inZero, inNone] = await pixels(page, [
      [a.x - 3, a.y + a.height / 2],
      [a.x + a.width / 2 - 2, a.y + a.height / 2 - 0.5],
      [b.x + b.width / 2 - 2, b.y + b.height / 2 - 0.5],
    ]);
    expect(contrast(inNone!, beside!)).toBeGreaterThanOrEqual(3);
    expect(contrast(inZero!, beside!)).toBeLessThan(1.5);
  });

  test('MC-16: 5,000 marks: a resize measures no label again, and a key builds nothing again', async ({
    page,
  }) => {
    test.slow();
    await openChart(page, 'charts-edge-cases--many-marks');
    await page.getByRole('button', { name: 'Draw 5,000 marks each' }).click();
    for (const id of ['scatter', 'heatmap'])
      await expect(tile(page, id).getByRole('option')).toHaveCount(5000);
    // What the work is made of, counted: labels measured in the page, and values formatted.
    await page.evaluate(() => {
      const counts = ((window as unknown as { counts: Record<string, number> }).counts = {
        measured: 0,
        formatted: 0,
      });
      const text = SVGTextContentElement.prototype;
      const length = text.getComputedTextLength;
      text.getComputedTextLength = function () {
        counts.measured!++;
        return length.call(this);
      };
      const format = Object.getOwnPropertyDescriptor(Intl.NumberFormat.prototype, 'format')!;
      Object.defineProperty(Intl.NumberFormat.prototype, 'format', {
        get() {
          const real = format.get!.call(this) as (value: number) => string;
          return (value: number) => {
            counts.formatted!++;
            return real(value);
          };
        },
      });
    });
    const counts = () =>
      page.evaluate(() => {
        const w = window as unknown as { counts: Record<string, number> };
        const now = { ...w.counts };
        w.counts.measured = w.counts.formatted = 0;
        return now;
      });
    /** Milliseconds until the frame after the one that did the work; at most two frames of it are waiting. */
    const timed = (run: string, id: string) =>
      page.evaluate(
        async ([run, id]) => {
          const el = document.querySelector<HTMLElement>(`[data-tile="${id}"]`)!;
          const start = performance.now();
          if (run === 'resize') el.style.width = `${el.offsetWidth - 7}px`;
          else
            document.activeElement!.dispatchEvent(
              new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
            );
          await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
          return performance.now() - start;
        },
        [run, id] as const,
      );
    for (const id of ['scatter', 'heatmap']) {
      const chart = tile(page, id);
      // The first resize may measure labels of new ticks; from then on everything is known.
      await timed('resize', id);
      await counts();
      const resizes = [await timed('resize', id), await timed('resize', id), await timed('resize', id)];
      const resized = await counts();
      // Each resize builds the chart once (it formats its values), and measures next to nothing: the
      // 5,000 names of the points were measured once. They were measured again on every resize.
      expect(resized.formatted, id).toBeGreaterThan(0);
      expect(resized.measured, id).toBeLessThan(100);

      await marks(chart).focus();
      await timed('key', id);
      await counts();
      const keys = [await timed('key', id), await timed('key', id), await timed('key', id)];
      expect(await current(chart), id).not.toBeNull();
      // A key moves the ring: the chart is not built again, so no value is formatted. It was, 5,000 times.
      expect((await counts()).formatted, id).toBe(0);
      // The clock, with room for a slow machine: the best of three. Before, a resize of the labelled
      // scatter took 357 to 458ms and a key 143ms.
      expect(Math.min(...resizes), `${id} resize ${resizes.map(Math.round)}`).toBeLessThan(250);
      expect(Math.min(...keys), `${id} key ${keys.map(Math.round)}`).toBeLessThan(100);
    }
  });
});

// MeterList (the owner's O-7): the labels in one column, the bars in the next, the values in the last.
test.describe('MeterList', () => {
  const list = (page: Page, name: string) => page.getByRole('group', { name, exact: true });
  /** Where each row's label, bar and value start and end, rounded. */
  const columns = (rows: Locator) =>
    rows.evaluateAll((els) =>
      els.map((row) => {
        const edge = (selector: string) => {
          const el = row.querySelector(`:scope > ${selector}`);
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return [Math.round(r.left), Math.round(r.right)];
        };
        return {
          label: edge('[data-part="label"]'),
          bar: edge(':is([data-part="track"], [data-part="strip"], [data-part="disc"], [data-part="bar"])'),
          value: edge('[data-part="value"]'),
        };
      }),
    );
  const one = (values: (number | undefined)[]) => new Set(values).size === 1;

  test('any of the four meters share a column of labels, one of bars and one of values', async ({ page }) => {
    await openStory(page, 'meters-meterlist--variants');
    for (const name of ['Skills', 'Figures', 'Figures, half']) {
      const group = list(page, name);
      const rows = await columns(group.locator('> [data-umbra]'));
      expect(rows.length).toBe(4);
      // Labels start together, bars start together, values end together.
      expect(one(rows.map((r) => r.label?.[0])), name).toBe(true);
      expect(one(rows.map((r) => r.bar?.[0])), name).toBe(true);
      expect(one(rows.map((r) => r.value?.[1])), name).toBe(true);
      // The bars start after the longest label.
      expect(rows[0]!.bar![0]!).toBeGreaterThan(Math.max(...rows.map((r) => r.label![1]!)));
    }
    // The four kinds are in one list, each still what it is for assistive technology.
    const mixed = list(page, 'Figures');
    await expect(mixed.locator('> [data-umbra]')).toHaveCount(4);
    expect(
      await mixed
        .locator('> [data-umbra]')
        .evaluateAll((els) => els.map((el) => el.getAttribute('data-umbra'))),
    ).toEqual(['progress-bar', 'level-meter', 'pie-indicator', 'diverging-meter']);
    await expect(mixed.getByRole('progressbar', { name: 'Budget used' })).toHaveAttribute(
      'aria-valuetext',
      '62%',
    );
    await expect(mixed.getByRole('meter', { name: 'Coverage of the region' })).toHaveAttribute(
      'aria-valuetext',
      '75%',
    );
    // A bar or strip takes the whole of its column; a meter in a list is laid out on one line.
    const bars = await columns(mixed.locator('> [data-umbra]'));
    expect(bars[0]!.bar![1]).toBe(bars[1]!.bar![1]);
    expect(bars[0]!.bar![1]).toBe(bars[3]!.bar![1]);
    await expect(mixed.locator('[data-umbra="progress-bar"]')).toHaveAttribute('data-layout', 'inline');

    // Without values there is no third column: the bars reach the end of the list.
    const plain = list(page, 'Progress');
    const end = (await box(plain)).x + (await box(plain)).width;
    for (const row of await columns(plain.locator('> [data-umbra]')))
      expect(row.bar![1]).toBe(Math.round(end));

    // A row of its own may load, or have no value: it keeps its columns.
    const states = await columns(list(page, 'States of rows').locator('> [data-umbra]'));
    expect(one(states.map((r) => r.label?.[0]))).toBe(true);
    expect(one(states.map((r) => r.value?.[1]))).toBe(true);
  });

  test('`labelWidth` sets the label column; a cut label shows its text in a tooltip', async ({ page }) => {
    await openStory(page, 'meters-meterlist--variants');
    const narrow = list(page, 'Skills, narrow labels');
    const rows = await columns(narrow.locator('> [data-umbra]'));
    for (const row of rows) expect(row.label![1]! - row.label![0]!).toBe(96);
    expect(one(rows.map((r) => r.bar?.[0]))).toBe(true);
    const label = part(narrow.getByRole('meter', { name: 'Knowledge of the region' }), 'label');
    expect(await label.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    await label.hover();
    await expect(page.getByRole('tooltip')).toHaveText('Knowledge of the region');
    // A label that fits has none of its own: the tooltip is the meter's exact value.
    await page.mouse.move(0, 0);
    await expect(page.getByRole('tooltip')).toHaveCount(0);
    await part(narrow.getByRole('meter', { name: 'Care' }), 'label').hover();
    await expect(page.getByRole('tooltip')).toHaveText('5');
    // A percentage, or any track size.
    const half = list(page, 'Figures, half');
    const first = (await columns(half.locator('> [data-umbra]')))[0]!;
    const width = (await box(half)).width;
    expect(Math.abs(first.label![1]! - first.label![0]! - width / 2)).toBeLessThanOrEqual(1);
  });

  test('as the list narrows the values hide, then each label moves above its bar', async ({ page }) => {
    await openStory(page, 'meters-meterlist--shrink');
    const at = async (px: number) => {
      const group = page.locator(`[data-width="${px}"] [data-umbra="meter-list"]`);
      const rows = group.locator('> [data-umbra]');
      const first = rows.first();
      const [label, bar] = [await box(part(first, 'label')), await box(part(first, 'track'))];
      return {
        shrink: await group.getAttribute('data-shrink'),
        values: await group.locator('[data-part="value"]:visible').count(),
        above: label.y + label.height <= bar.y + 1,
        cut: await group
          .locator('[data-part="label"]')
          .evaluateAll((els) => els.filter((el) => el.scrollWidth > el.clientWidth).length),
        inside: await group.evaluate((el) => el.scrollWidth <= el.clientWidth),
      };
    };
    expect(await at(320)).toEqual({ shrink: null, values: 4, above: false, cut: 0, inside: true });
    expect(await at(230)).toEqual({ shrink: '1', values: 0, above: false, cut: 0, inside: true });
    expect(await at(160)).toEqual({ shrink: '2', values: 0, above: true, cut: 0, inside: true });
    // With a `labelWidth` a cut label is the app's choice: only the values give way.
    expect(await at(200)).toEqual({ shrink: '1', values: 0, above: false, cut: 1, inside: true });

    // The hidden value is still read, and on the tooltip.
    const hidden = page.locator('[data-width="230"]').getByRole('progressbar', { name: 'Budget used' });
    await expect(hidden).toHaveAttribute('aria-valuetext', '62%');
    await part(hidden, 'track').hover();
    await expect(page.getByRole('tooltip')).toHaveText('62%');

    // The step is a function of the width: the same on the way down, on the way up, and afresh.
    const holder = page.locator('[data-width="320"]');
    const sweep: Record<number, string | null> = {};
    const level = () => holder.locator('[data-umbra="meter-list"]').getAttribute('data-shrink');
    for (let px = 320; px >= 140; px -= 6) {
      await holder.evaluate((el, w) => ((el as HTMLElement).style.width = `${w}px`), px);
      await settle(page);
      sweep[px] = await level();
    }
    expect(Object.values(sweep)).toContain('1');
    expect(sweep[140]).toBe('2');
    for (let px = 140; px <= 320; px += 6) {
      await holder.evaluate((el, w) => ((el as HTMLElement).style.width = `${w}px`), px);
      await settle(page);
      expect(await level(), `${px}px on the way up`).toBe(sweep[px]);
    }
    // Each step comes once, in order.
    const order = Object.keys(sweep)
      .map(Number)
      .sort((a, b) => b - a)
      .map((px) => Number(sweep[px] ?? 0));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  test('loading shows skeleton rows in the three columns; empty and error take the list’s place', async ({
    page,
  }) => {
    await openStory(page, 'meters-meterlist--states');
    const loading = list(page, 'Loading');
    await expect(loading).toHaveAttribute('aria-busy', 'true');
    await expect(loading).toHaveAttribute('data-state', 'loading');
    await expect(loading.getByRole('meter')).toHaveCount(0);
    const rows = await columns(loading.locator('> [data-part="skeleton"]'));
    expect(rows.length).toBe(3);
    expect(one(rows.map((r) => r.bar?.[0]))).toBe(true);
    expect(one(rows.map((r) => r.value?.[1]))).toBe(true);
    expect(rows[0]!.bar![0]!).toBeGreaterThan(Math.max(...rows.map((r) => r.label![1]!)));

    await expect(list(page, 'Empty')).toHaveAttribute('data-state', 'empty');
    await expect(list(page, 'Empty')).toContainText('Nothing measured yet');
    const failed = list(page, 'Failed');
    await expect(failed.getByRole('alert')).toContainText('Retries: 0.');
    await expect(failed.getByRole('meter')).toHaveCount(0);
    await failed.getByRole('button', { name: 'Try again' }).focus();
    await pressKeys(page, 'Enter');
    await expect(failed.getByRole('alert')).toContainText('Retries: 1.');
  });

  test('right to left: the labels are on the right, the values on the left', async ({ page }) => {
    await openStory(page, 'meters-meterlist--right-to-left');
    const rows = await columns(list(page, 'Figures').locator('> [data-umbra]'));
    expect(one(rows.map((r) => r.label?.[1]))).toBe(true);
    expect(one(rows.map((r) => r.bar?.[1]))).toBe(true);
    expect(one(rows.map((r) => r.value?.[0]))).toBe(true);
    for (const row of rows) {
      expect(row.label![0]!).toBeGreaterThan(row.bar![1]!);
      expect(row.value![1]!).toBeLessThan(row.bar![0]!);
    }
  });

  test('tokens, parts and the root block', async ({ page }) => {
    await openStory(page, 'meters-meterlist--customised');
    const tokens = list(page, 'Tokens');
    const style = await tokens.evaluate((el) => {
      const s = getComputedStyle(el);
      return { row: s.rowGap, column: s.columnGap };
    });
    expect(style).toEqual({ row: '4px', column: '24px' });
    const label = part(tokens.getByRole('progressbar'), 'label');
    const primary = await page.evaluate(() => {
      const probe = document.body.appendChild(document.createElement('i'));
      probe.style.color = 'var(--umbra-color-base-text-primary)';
      const colour = getComputedStyle(probe).color;
      probe.remove();
      return colour;
    });
    expect(await label.evaluate((el) => getComputedStyle(el).color)).toBe(primary);
    // The shortest bar is 120px here, so in this panel the values give way to it.
    expect((await box(part(tokens.getByRole('progressbar'), 'track'))).width).toBeGreaterThanOrEqual(120);

    await expect(list(page, 'Skeleton node')).toHaveText('Loading the figures…');
    await expect(list(page, 'Skeleton null').locator('*')).toHaveCount(0);
    await expect(list(page, 'Skeleton function')).toHaveText('4 rows on their way');
    await expect(list(page, 'Empty part')).toHaveText('No figures.');
    await expect(list(page, 'Error part').locator('[data-own="error"]').getByRole('alert')).toContainText(
      'Not loaded',
    );
    const byHand = list(page, 'By hand');
    await expect(byHand).toHaveClass(/own/);
    expect(await byHand.evaluate((el) => el.style.opacity)).toBe('0.9');
    await expect(byHand.getByRole('meter')).toHaveCount(4);
  });

  test('on the detail screen the strips of the scores start in one line (O-7)', async ({ page }) => {
    await openStory(page, 'pages-list-and-detail--list-and-detail', { width: 1920, height: 1080 });
    const scores = list(page, 'Scores by attribute');
    const rows = await columns(scores.locator('> [data-umbra="level-meter"]'));
    expect(rows.length).toBe(5);
    expect(one(rows.map((r) => r.bar?.[0]))).toBe(true);
    expect(one(rows.map((r) => r.bar?.[1]))).toBe(true);
    expect(one(rows.map((r) => r.label?.[0]))).toBe(true);
  });
});
