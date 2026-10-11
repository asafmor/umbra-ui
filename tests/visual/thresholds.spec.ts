import { expect, test, type Page } from '@playwright/test';
import { openStory } from './helpers';

// One `thresholds` list for every component that colours by value: the same value lands in the same
// band everywhere, and each band has its colour, a cue that is not colour, and its label.
const story = 'foundation-thresholds--one-list';
const sample = (page: Page, id: string) => page.locator(`[data-sample="${id}"]`);
const bandsOf = (page: Page, id: string, selector: string) =>
  sample(page, id)
    .locator(selector)
    .evaluateAll((els) => els.map((el) => el.getAttribute('data-band')));

test('the same list puts the same values in the same bands in every component', async ({ page }) => {
  await openStory(page, story);
  // The values 25, 55, 80 and 95 against bands that start at 0, 40, 70 and 90.
  const expected = ['0', '1', '2', '3'];
  expect(await bandsOf(page, 'pill', '[data-umbra="value-pill"]')).toEqual(expected);
  expect(await bandsOf(page, 'bar', '[data-umbra="progress-bar"]')).toEqual(expected);
  expect(await bandsOf(page, 'meter', '[data-umbra="level-meter"]')).toEqual(expected);
  expect(await bandsOf(page, 'bars', '[data-part="bars"] > g')).toEqual(expected);
  expect(await bandsOf(page, 'donut', '[data-part="segments"] > g')).toEqual(expected);
});

test('a band gives its tone, free colour or ramp step, with a cue that is not colour', async ({ page }) => {
  await openStory(page, story);
  const attrs = (id: string, selector: string, name: string) =>
    sample(page, id)
      .locator(selector)
      .evaluateAll((els, attr) => els.map((el) => el.getAttribute(attr)), name);
  const paint = (id: string, selector: string, property: string) =>
    sample(page, id)
      .locator(selector)
      .evaluateAll(
        (els, p) => els.map((el) => getComputedStyle(el)[p as 'fill' | 'backgroundColor']),
        property,
      );
  const free = 'rgb(90, 169, 255)';

  // ValuePill: tones, the free colour with a text colour chosen for contrast, and the ramp step.
  expect(await attrs('pill', '[data-umbra="value-pill"]', 'data-tone')).toEqual([
    'danger',
    'warning',
    'custom',
    null,
  ]);
  expect(await attrs('pill', '[data-umbra="value-pill"]', 'data-level')).toEqual([
    'none',
    'none',
    'none',
    '5',
  ]);
  expect((await paint('pill', '[data-umbra="value-pill"]', 'backgroundColor'))[2]).toBe(free);
  // Its marker shows the band's position on the ramp, and the label is read with the value.
  expect(
    await sample(page, 'pill')
      .locator('[data-part="level"]')
      .evaluateAll((marks) => marks.map((m) => m.querySelectorAll('[data-on]').length)),
  ).toEqual([1, 2, 4, 5]);
  await expect(sample(page, 'pill').locator('[data-umbra="value-pill"]').first()).toContainText('Low');
  await expect(sample(page, 'pill').locator('[data-umbra="value-pill"]').nth(2)).toHaveAttribute(
    'title',
    'High',
  );

  // ProgressBar: a pattern by position on every band but the top one, also on the free colour.
  expect(await attrs('bar', '[data-part="fill"]', 'data-pattern')).toEqual([
    'diagonal',
    'vertical',
    'reverse',
    'none',
  ]);
  expect(await attrs('bar', '[data-part="fill"]', 'data-tone')).toEqual([
    'danger',
    'warning',
    null,
    'ramp-5',
  ]);
  expect((await paint('bar', '[data-part="fill"]', 'backgroundColor'))[2]).toBe(free);
  await expect(page.getByRole('meter', { name: 'Region 3' }).first()).toHaveAttribute(
    'aria-valuetext',
    '80%, High',
  );

  // LevelMeter: the marker's colour, a taller tick where a band starts, and the label.
  expect(await attrs('meter', '[data-part="marker"]', 'data-tone')).toEqual([
    'danger',
    'warning',
    'custom',
    'ramp-5',
  ]);
  expect((await paint('meter', '[data-part="marker"]', 'backgroundColor'))[2]).toBe(free);
  await expect(sample(page, 'meter').locator('[data-part="value"]').nth(2)).toHaveText('80 · High');

  // BarChart: the fills in turn (solid, stripes, dots), and the label with the value.
  expect(await attrs('bars', '[data-part="bars"] rect', 'data-pattern')).toEqual([
    null,
    'stripes',
    'dots',
    null,
  ]);
  expect((await paint('bars', '[data-part="bars"] rect', 'stroke'))[2]).toBe(free);
  await expect(
    sample(page, 'bars').getByRole('option', { name: 'Completed, Region 3: 80 · High' }),
  ).toHaveCount(1);

  // DonutChart: the colour, with the number in the centre and the label in the text.
  expect((await paint('donut', '[data-part="segments"] path', 'fill'))[2]).toBe(free);
  await expect(sample(page, 'donut').getByRole('option', { name: /80%.*· High/ })).toHaveCount(1);
});

test('numbers are boundaries on the value ramp, and lower is better mirrors the bands', async ({ page }) => {
  await openStory(page, story);
  const pills = sample(page, 'shorthand').locator('[data-umbra="value-pill"]');
  expect(await pills.evaluateAll((els) => els.map((el) => el.getAttribute('data-level')))).toEqual([
    '1',
    '2',
    '4',
    '5',
  ]);
  const numbers = page.getByRole('meter', { name: 'Numbers' });
  await expect(numbers.locator('[data-part="fill"]')).toHaveAttribute('data-tone', 'ramp-2');
  await expect(numbers).toHaveAttribute('data-band', '1');
  // The lowest band takes the look of the top one; its own label stays.
  const low = page.getByRole('meter', { name: 'Lower is better' });
  await expect(low).toHaveAttribute('data-band', '0');
  await expect(low.locator('[data-part="fill"]')).toHaveAttribute('data-tone', 'ramp-5');
  await expect(low.locator('[data-part="fill"]')).toHaveAttribute('data-pattern', 'none');
  await expect(low).toHaveAttribute('aria-valuetext', '25%, Low');
});
