import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectFocusKept, openStory, pressKeys, settle } from './helpers';

// DateChip, ScheduleSlot, WeekStrip and Planner: names and roles, the keyboard grid, month navigation,
// right to left, and each step of showing less as the room shrinks. The stories pass a fixed `today`
// (Wednesday 14 October 2026) and the browser's locale is en-US, so weeks start on Sunday.

const cell = (scope: Page | Locator, date: string, line = 0) =>
  scope.locator(`[data-cell][data-date="${date}"][data-line="${line}"]`);
/** The day and line the focus is on, as `2026-10-14:0`; `aside:<week>` on the side cell of a week. */
const at = (page: Page) =>
  page.evaluate(() => {
    const el = (document.activeElement as HTMLElement | null)?.closest<HTMLElement>('[data-cell]');
    if (!el) return null;
    return el.dataset.date ? `${el.dataset.date}:${el.dataset.line}` : `aside:${el.dataset.week}`;
  });
/** Presses the keys one by one; after each, the focus is on an element and, at the end, on `where`. */
const move = async (page: Page, keys: string[], where: string) => {
  await pressKeys(page, ...keys);
  expect(await at(page)).toBe(where);
};
/** What is drawn: a chip holds the texts of more than one width, and shows one. */
const inner = { useInnerText: true };
const box = async (locator: Locator) => (await locator.boundingBox())!;
const tabStops = (grid: Locator) => grid.locator('[data-cell][tabindex="0"]');
/** True when the label of a slot is drawn: not hidden for the icon alone. */
const labelShown = (slot: Locator) =>
  slot.locator('[data-part="label"]').evaluate((el) => (el as HTMLElement).clientWidth > 1);
/** Presses a "Show …" button of a Changes story as the app would change a prop: the focus stays where it is. */
const show = (page: Page, view: string) =>
  page.evaluate((name) => {
    const buttons = [...document.querySelectorAll<HTMLElement>('button')];
    buttons.find((button) => button.textContent === `Show ${name}`)!.click();
  }, view);
/**
 * Narrows a strip a pixel at a time and reads the header of every day at each width: what its chip
 * draws, the room inside the day, and whether anything of the date is cut. Then widens it again.
 */
const sweep = (strip: Locator, from: number, to: number) =>
  strip.evaluate(
    (el, [from, to]) => {
      const root = el as HTMLElement;
      root.style.maxWidth = 'none';
      const read = (width: number) => {
        root.style.width = `${width}px`;
        const cells = [...root.querySelectorAll<HTMLElement>('[data-cell][data-line="0"]')];
        let cut = false;
        for (const cell of cells) {
          const chip = cell.querySelector<HTMLElement>('[data-umbra="date-chip"]')!;
          const text = chip.querySelector<HTMLElement>('[aria-hidden="true"]')!;
          const [c, t, k] = [cell, text, chip].map((node) => node.getBoundingClientRect());
          const day = text.querySelector<HTMLElement>('[data-part="day"]');
          const d = day?.getBoundingClientRect();
          // The number is drawn, whole, inside the chip, and the chip inside its day.
          if (!d || d.width === 0 || d.left < t!.left - 0.5 || d.right > t!.right + 0.5) cut = true;
          if (d && (d.top < t!.top - 0.5 || d.bottom > t!.bottom + 0.5)) cut = true;
          if (text.scrollWidth > text.clientWidth) cut = true;
          if (k!.left < c!.left - 0.5 || k!.right > c!.right + 0.5) cut = true;
        }
        const style = getComputedStyle(cells[3]!);
        const room =
          cells[3]!.getBoundingClientRect().width -
          parseFloat(style.paddingLeft) -
          parseFloat(style.paddingRight);
        const drawn = cells[3]!.querySelector<HTMLElement>('[aria-hidden="true"]')!.innerText;
        return { width, room, drawn: drawn.replace(/\s+/g, ' ').trim(), cut };
      };
      const down = [];
      for (let width = from; width >= to; width--) down.push(read(width));
      const up = [];
      for (let width = to; width <= from; width++) up.push(read(width));
      return { down, up: up.reverse() };
    },
    [from, to] as const,
  );

test.describe('Time: DateChip', () => {
  test('says the whole date, with today and selected in words, whatever it draws', async ({ page }) => {
    await openStory(page, 'time-datechip--states');
    const chips = page.locator('[data-umbra="date-chip"]');
    const today = chips.and(page.locator('[data-today]:not([data-selected])')).first();
    await expect(today).toHaveAttribute('datetime', '2026-10-14');
    await expect(today).toHaveText('14Wednesday, October 14, 2026, Today');
    await expect(today.locator('[aria-hidden="true"]')).toHaveText('14');
    await expect(chips.and(page.locator('[data-selected]')).first()).toHaveText(
      '15Thursday, October 15, 2026, Selected',
    );
    // The first day of a month shows its month by itself; `showMonth` forces or removes it.
    await expect(page.locator('time[datetime="2026-10-01"] [aria-hidden="true"]')).toHaveText(
      ['Oct 1', '1'],
      inner,
    );
    await expect(page.locator('time[datetime="2026-09-28"] [aria-hidden="true"]')).toHaveText(
      'Sep 28',
      inner,
    );
  });

  test('today and selected each have a cue that is not their colour', async ({ page }) => {
    await openStory(page, 'time-datechip--states');
    const today = page.locator('time[datetime="2026-10-14"][data-today]:not([data-selected])').first();
    // Today: a bar under the number. Selected: a ring.
    expect(await today.evaluate((el) => getComputedStyle(el, '::after').height)).toBe('2px');
    const selected = page.locator('time[datetime="2026-10-15"][data-selected]').first();
    expect(await selected.evaluate((el) => getComputedStyle(el).boxShadow)).toContain('inset');
    const plain = page.locator('time[datetime="2026-10-13"]').first();
    expect(await plain.evaluate((el) => getComputedStyle(el, '::after').content)).toBe('none');
  });

  test('right to left: the weekday is on the right of the number, in the words of the locale', async ({
    page,
  }) => {
    await openStory(page, 'time-datechip--right-to-left');
    const chip = page.locator('time[datetime="2026-10-13"]:has([data-part="weekday"])').first();
    await expect(chip).toHaveCSS('direction', 'rtl');
    const [weekday, day] = [
      await box(chip.locator('[data-part="weekday"]')),
      await box(chip.locator('[data-part="day"]')),
    ];
    expect(weekday.x).toBeGreaterThan(day.x);
    await expect(chip.locator('[data-part="weekday"]')).not.toHaveText('Tue');
  });
});

test.describe('Time: ScheduleSlot', () => {
  test('is a button, a link or plain text; a disabled one does nothing', async ({ page }) => {
    await openStory(page, 'time-scheduleslot--variants');
    const log = page.locator('p', { hasText: /^(Nothing pressed|Pressed)/ });
    await page.getByRole('button', { name: 'Planning', exact: true }).click();
    await expect(log).toHaveText('Pressed Planning');
    await expectFocusKept(page);
    await expect(page.getByRole('button', { name: 'Delivery', exact: true }).first()).toBeDisabled();
    await expect(page.getByRole('link', { name: 'Delivery' })).toHaveAttribute('href', '#delivery');
    // The app's router link receives the props.
    const routed = page.getByRole('link', { name: 'Router link' });
    await expect(routed).toHaveAttribute('data-router', '');
    await expect(routed).toHaveAttribute('data-umbra', 'schedule-slot');
    // A static slot is neither.
    const still = page.locator('span[data-umbra="schedule-slot"]', { hasText: 'Quarterly review' }).first();
    await expect(still).not.toHaveAttribute('role');
    await still.click();
    await expect(log).toHaveText('Pressed Planning');
  });

  test('every slot has an icon or a label besides its colour', async ({ page }) => {
    await openStory(page, 'time-scheduleslot--variants');
    const bare = await page
      .locator('[data-umbra="schedule-slot"]:not([data-loading])')
      .evaluateAll((slots) =>
        slots.filter((slot) => !slot.querySelector('svg') && !slot.textContent?.trim()),
      );
    expect(bare).toHaveLength(0);
  });

  test('icon only: the label is hidden, stays the name, and shows in a tooltip on hover and on focus', async ({
    page,
  }) => {
    await openStory(page, 'time-scheduleslot--variants');
    const slot = page.locator('[data-umbra="schedule-slot"][data-display="icon"]:has(svg)');
    await expect(slot).toHaveCount(3);
    expect(await labelShown(slot.first())).toBe(false);
    const button = page.getByRole('button', { name: 'Delivery', exact: true }).last();
    await expect(button).toHaveAttribute('data-display', 'icon');
    const tooltip = page.getByRole('tooltip');
    await slot.first().hover();
    await expect(tooltip).toHaveText('Planning');
    await page.keyboard.press('Escape');
    await expect(tooltip).toHaveCount(0);
    await button.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(button).toBeFocused();
    await expect(tooltip).toHaveText('Delivery');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Pressed Delivery')).toBeVisible();
    // Without an icon the label is the only cue, so it stays.
    expect(await labelShown(page.locator('[data-display="icon"]', { hasText: 'Keeps its label' }))).toBe(
      true,
    );
  });

  test('no label: the slot is the empty look with a dash; loading: a placeholder of its size', async ({
    page,
  }) => {
    await openStory(page, 'time-scheduleslot--variants');
    const none = page.locator('[data-umbra="schedule-slot"]', { hasText: /^—$/ });
    await expect(none).toHaveAttribute('data-variant', 'empty');
    await expect(none).toHaveCSS('border-top-style', 'dashed');
    const skeleton = page.locator('[data-umbra="schedule-slot"][data-part="skeleton"]').first();
    const filled = page.locator('[data-umbra="schedule-slot"][data-size="default"]').first();
    expect((await box(skeleton)).height).toBe((await box(filled)).height);
  });

  test('a label that does not fit ends in an ellipsis and is whole in a tooltip', async ({ page }) => {
    await openStory(page, 'time-scheduleslot--truncated');
    const slots = page.getByRole('button', { name: 'Quarterly review' });
    const tooltip = page.getByRole('tooltip');
    for (const [index, cut] of [false, true, true, true].entries()) {
      const slot = slots.nth(index);
      const holder = await box(slot.locator('xpath=..'));
      const own = await box(slot);
      // Never wider than its container.
      expect(own.x + own.width).toBeLessThanOrEqual(holder.x + holder.width + 0.5);
      const label = slot.locator('[data-part="label"]');
      await expect(label).toHaveCSS('text-overflow', 'ellipsis');
      expect(await label.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(cut);
      await page.keyboard.press('Tab');
      await expect(slot).toBeFocused();
      if (cut) await expect(tooltip).toHaveText('Quarterly review');
      else await expect(tooltip).toHaveCount(0);
    }
  });

  test('right to left: the stripe and the icon are on the right', async ({ page }) => {
    await openStory(page, 'time-scheduleslot--right-to-left');
    const slot = page.locator('[data-umbra="schedule-slot"][data-variant="filled"]:has(svg)').first();
    await expect(slot).toHaveCSS('border-right-width', '3px');
    await expect(slot).toHaveCSS('border-left-width', '1px');
    const [icon, label] = [
      await box(slot.locator('[data-part="icon"]')),
      await box(slot.locator('[data-part="label"]')),
    ];
    expect(icon.x).toBeGreaterThan(label.x);
  });
});

test.describe('Time: WeekStrip', () => {
  test('is a grid of seven days with one tab stop', async ({ page }) => {
    await openStory(page, 'time-weekstrip--default');
    const strip = page.getByRole('grid', { name: 'This week', exact: true });
    await expect(strip.getByRole('columnheader')).toHaveCount(7);
    await expect(strip.getByRole('row')).toHaveCount(3);
    await expect(strip.getByRole('gridcell')).toHaveCount(14);
    await expect(strip.getByRole('columnheader').first()).toHaveText(/Sunday, October 11, 2026/);
    await expect(cell(strip, '2026-10-14')).toHaveAttribute('aria-current', 'date');
    await expect(cell(strip, '2026-10-16')).toHaveAttribute('aria-selected', 'true');
    await expect(cell(strip, '2026-10-15')).toHaveAttribute('aria-selected', 'false');
    // The selected day holds the tab stop; where no day is selected, today does.
    await expect(tabStops(strip)).toHaveCount(1);
    await expect(cell(strip, '2026-10-16')).toHaveAttribute('tabindex', '0');
    const plain = page.getByRole('grid', { name: 'This week, numbers' });
    await expect(tabStops(plain)).toHaveCount(1);
    await expect(cell(plain, '2026-10-14')).toHaveAttribute('tabindex', '0');
    await expect(cell(plain, '2026-10-14')).not.toHaveAttribute('aria-selected');
    // A free slot is named.
    await expect(cell(strip, '2026-10-12', 1)).toHaveText('Free');
  });

  test('the arrow keys, Home and End move through the days and their slots', async ({ page }) => {
    await openStory(page, 'time-weekstrip--default');
    await page.keyboard.press('Tab');
    expect(await at(page)).toBe('2026-10-16:0');
    await move(page, ['ArrowRight'], '2026-10-17:0');
    // The last day of the week: the strip has no next week to go to.
    await move(page, ['ArrowRight'], '2026-10-17:0');
    await move(page, ['ArrowDown', 'ArrowDown'], '2026-10-17:2');
    await move(page, ['ArrowDown'], '2026-10-17:2');
    await move(page, ['ArrowLeft', 'ArrowLeft'], '2026-10-15:2');
    await move(page, ['Home'], '2026-10-11:2');
    await move(page, ['ArrowLeft'], '2026-10-11:2');
    await move(page, ['End'], '2026-10-17:2');
    await move(page, ['ArrowUp', 'ArrowUp', 'ArrowUp'], '2026-10-17:0');
    await move(page, ['Control+Home'], '2026-10-11:0');
    await move(page, ['Control+End'], '2026-10-17:2');
    // PageDown has no other month to show here.
    await move(page, ['PageDown'], '2026-10-17:2');
    // One tab stop: Tab leaves the strip, and Shift+Tab returns to the cell the user was on.
    const strip = page.getByRole('grid', { name: 'This week', exact: true });
    await expect(tabStops(strip)).toHaveCount(1);
    await page.keyboard.press('Tab');
    expect(await at(page)).toBe('2026-10-14:0');
    await page.keyboard.press('Shift+Tab');
    expect(await at(page)).toBe('2026-10-17:2');
  });

  test('Enter and Space activate an item, and select and report a day', async ({ page }) => {
    await openStory(page, 'time-weekstrip--default');
    const log = page.getByText(/· selected/);
    await page.keyboard.press('Tab');
    await pressKeys(page, 'ArrowLeft', 'Enter');
    await expect(log).toHaveText('Day 2026-10-15 · selected 2026-10-15');
    const strip = page.getByRole('grid', { name: 'This week', exact: true });
    await expect(cell(strip, '2026-10-15')).toHaveAttribute('aria-selected', 'true');
    await expect(cell(strip, '2026-10-15').locator('[data-umbra="date-chip"]')).toHaveAttribute(
      'data-selected',
      'true',
    );
    await pressKeys(page, 'ArrowDown', ' ');
    await expect(log).toHaveText('Item 2026-10-15-0 · selected 2026-10-15');
    // A free slot stands for its day.
    await pressKeys(page, 'ArrowDown', 'Enter');
    await expect(log).toHaveText('Day 2026-10-15 · selected 2026-10-15');
    await cell(strip, '2026-10-13', 2).click();
    await expect(log).toHaveText('Item 2026-10-13-1 · selected 2026-10-15');
    expect(await at(page)).toBe('2026-10-13:2');
    // A strip without callbacks is still moved through, and its cells do nothing.
    const plain = page.getByRole('grid', { name: 'This week, numbers' });
    await expect(cell(plain, '2026-10-13', 1)).not.toHaveAttribute('data-action');
  });

  test('right to left: the first day is on the right and the arrows follow what is drawn', async ({
    page,
  }) => {
    await openStory(page, 'time-weekstrip--right-to-left');
    const strip = page.getByRole('grid', { name: 'This week', exact: true });
    const [first, last] = [await box(cell(strip, '2026-10-11')), await box(cell(strip, '2026-10-17'))];
    expect(first.x).toBeGreaterThan(last.x);
    await page.keyboard.press('Tab');
    expect(await at(page)).toBe('2026-10-16:0');
    await move(page, ['ArrowLeft'], '2026-10-17:0');
    await move(page, ['ArrowRight', 'ArrowRight'], '2026-10-15:0');
    await move(page, ['Home'], '2026-10-11:0');
    await move(page, ['End'], '2026-10-17:0');
  });

  test('as it narrows: the weekday names shorten, then the labels give way to the icons', async ({
    page,
  }) => {
    await openStory(page, 'time-weekstrip--shrinking');
    const steps = [
      { width: 1040, weekday: 'Wednesday', labels: true },
      { width: 760, weekday: 'Wed', labels: true },
      { width: 520, weekday: 'Wed', labels: true },
      // The last step: no room for a weekday and a number, so the number alone.
      { width: 380, weekday: null, labels: false },
      { width: 250, weekday: null, labels: false },
    ];
    for (const step of steps) {
      const strip = page.locator(`[data-width="${step.width}"] [data-umbra="week-strip"]`);
      const shown = strip.locator('[data-date="2026-10-14"] [data-weekday]').filter({ visible: true });
      if (step.weekday) await expect(shown, `weekday at ${step.width}`).toHaveText(step.weekday);
      else await expect(shown, `weekday at ${step.width}`).toHaveCount(0);
      const chip = cell(strip, '2026-10-14').locator('[data-umbra="date-chip"]');
      // The number stays at every step, and is never cut: a number cut short would read as another day.
      await expect(chip.locator('span[data-part="day"]'), `number at ${step.width}`).toBeVisible();
      expect(
        await chip.locator('[aria-hidden="true"]').evaluate((el) => el.scrollWidth <= el.clientWidth),
      ).toBe(true);
      await expect(chip).toHaveText(/Wednesday, October 14, 2026/);
      const slot = cell(strip, '2026-10-14', 1).locator('[data-umbra="schedule-slot"]');
      expect(await labelShown(slot), `labels at ${step.width}`).toBe(step.labels);
      // The name stays for assistive technology at every step, and nothing is wider than the strip.
      await expect(cell(strip, '2026-10-14', 1)).toHaveText('Planning');
      expect(await strip.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
      const holder = await box(page.locator(`[data-width="${step.width}"]`));
      for (const date of ['2026-10-11', '2026-10-17']) {
        const chip = await box(cell(strip, date).locator('[data-umbra="date-chip"]'));
        expect(chip.x).toBeGreaterThanOrEqual(holder.x - 0.5);
        expect(chip.x + chip.width).toBeLessThanOrEqual(holder.x + holder.width + 0.5);
      }
    }
    // The steps are a function of the width: growing brings back what shrinking took.
    const holder = page.locator('[data-width="250"]');
    const strip = holder.locator('[data-umbra="week-strip"]');
    await holder.evaluate((el) => ((el as HTMLElement).style.width = '760px'));
    await expect(
      strip.locator('[data-date="2026-10-14"] [data-weekday]').filter({ visible: true }),
    ).toHaveText('Wed');
    expect(await labelShown(cell(strip, '2026-10-14', 1).locator('[data-umbra="schedule-slot"]'))).toBe(true);
  });

  test('with icons only, the focused cell shows the label in a tooltip', async ({ page }) => {
    await openStory(page, 'time-weekstrip--shrinking');
    const strip = page.locator('[data-width="250"] [data-umbra="week-strip"]');
    const tooltip = page.getByRole('tooltip');
    await cell(strip, '2026-10-14').focus();
    await pressKeys(page, 'ArrowDown');
    await expect(tooltip).toHaveText('Planning');
    await pressKeys(page, 'ArrowDown');
    await expect(tooltip).toHaveText('Upkeep');
    // Where the labels are drawn there is nothing to add.
    const wide = page.locator('[data-width="760"] [data-umbra="week-strip"]');
    await cell(wide, '2026-10-14').focus();
    await pressKeys(page, 'ArrowDown');
    await expect(tooltip).toHaveCount(0);
  });

  test('loading, free, empty and error; a retry keeps the focus', async ({ page }) => {
    await openStory(page, 'time-weekstrip--states');
    const loading = page.getByRole('grid', { name: 'Loading week' });
    await expect(loading).toHaveAttribute('aria-busy', 'true');
    await expect(loading.locator('[data-part="skeleton"]')).toHaveCount(14);
    await expect(loading.getByRole('columnheader')).toHaveCount(7);
    // Without items and without an `empty` text, the days are there with free slots.
    await expect(page.getByRole('grid', { name: 'Free week' }).getByText('Free')).toHaveCount(14);
    await expect(page.getByText('Nothing planned this week')).toBeVisible();
    await expect(page.getByRole('grid', { name: 'Empty week' })).toHaveCount(0);
    const alert = page.getByRole('alert');
    await expect(alert).toHaveText(/The week could not be loaded/);
    await page.getByRole('button', { name: 'Try again' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('grid', { name: 'Failing week' })).toBeVisible();
    await expectFocusKept(page);
    expect(await at(page)).toBe('2026-10-14:0');
  });

  test('the first day of the week and the names come from the locale, or from `weekStartsOn`', async ({
    page,
  }) => {
    await openStory(page, 'time-weekstrip--locales');
    const first = (name: string) => page.getByRole('grid', { name }).getByRole('columnheader').first();
    await expect(first('Week, en-US')).toHaveText(/Sunday, October 11, 2026/);
    await expect(first('Week, en-GB')).toHaveText(/Monday,? 12 October 2026/);
    await expect(first('Week, de-DE')).toHaveText(/Montag, 12\. Oktober 2026/);
    await expect(first('Week, fr-FR')).toHaveText(/lundi 12 octobre 2026/);
    await expect(first('Week from Wednesday')).toHaveText(/Wednesday, October 14, 2026/);
    // A strip from a given day starts there, and says the month where a new one starts.
    const given = page.getByRole('grid', { name: 'Week from the 29th' });
    await expect(first('Week from the 29th')).toHaveText(/Thursday, October 29, 2026/);
    await expect(cell(given, '2026-11-01').locator('[data-month]')).toHaveText('Nov 1');
    await expect(given.locator('[aria-current="date"]')).toHaveCount(0);
  });

  test('parts replace, hide and wrap; the blocks make the same grid by hand', async ({ page }) => {
    await openStory(page, 'time-weekstrip--parts-and-blocks');
    const functions = page.getByRole('grid', { name: 'Parts as functions' });
    await expect(functions.locator('[data-umbra="schedule-slot"][data-variant="outlined"]')).toHaveCount(12);
    await expect(functions.locator('[data-part="placeholder"]')).toHaveCount(2);
    const nodes = page.getByRole('grid', { name: 'Parts as nodes' });
    await expect(nodes.getByRole('columnheader').first()).toHaveText('Day');
    await expect(cell(nodes, '2026-10-12', 1)).toBeEmpty();
    await expect(page.getByText('A state of the app')).toBeVisible();
    const hand = page.getByRole('grid', { name: 'By hand' });
    await expect(hand.getByRole('columnheader')).toHaveCount(7);
    await cell(hand, '2026-10-14').focus();
    await move(page, ['ArrowDown', 'ArrowRight'], '2026-10-15:1');
    await expect(tabStops(hand)).toHaveCount(1);
  });

  for (const density of ['compact', 'default', 'spacious']) {
    for (const [size, story, name, steps] of [
      ['default', 'time-weekstrip--shrinking', 'Week at 1040 pixels', [128, 68, 52]],
      ['small', 'time-weekstrip--default', 'This week, both', [128, 56, 44]],
    ] as const) {
      test(`a date is never drawn cut, pixel by pixel: ${size} chips at the ${density} density`, async ({
        page,
      }) => {
        await openStory(page, story, { density });
        await page.evaluate(() => document.fonts.ready);
        // From days wide enough for the long name down to days of 29px, narrower than a planner allows (40px).
        const { down, up } = await sweep(page.getByRole('grid', { name, exact: true }), 1000, 203);
        expect(down.filter((at) => at.cut).map((at) => at.width)).toEqual([]);
        // The steps are a function of the width: the same on the way up as on the way down.
        expect(up).toEqual(down);
        // Each step is at its stated room inside a day, to the pixel; the weekday gives way, never the number.
        const [long, short, none] = steps;
        for (const at of down) {
          const expected =
            at.room > long ? 'Wednesday 14' : at.room > short ? 'Wed 14' : at.room > none ? 'W 14' : '14';
          expect(at.drawn, `at ${at.width}px, ${at.room}px inside a day`).toBe(expected);
        }
        expect(new Set(down.map((at) => at.drawn)).size).toBe(4);
      });
    }
  }

  test('the Shrinking stories fit the smallest window at the spacious density', async ({ page }) => {
    for (const story of ['time-weekstrip--shrinking', 'time-planner--shrinking']) {
      await openStory(page, story, { width: 1024, height: 600, density: 'spacious' });
      const outside = await page
        .locator('[data-width]')
        .evaluateAll(
          (holders) =>
            holders
              .map((holder) => holder.getBoundingClientRect())
              .filter((box) => box.right > window.innerWidth || box.bottom > window.innerHeight).length,
        );
      expect(outside, story).toBe(0);
    }
  });

  test('a cell that can be pressed is never under 24 pixels, and a strip that is only read stays low', async ({
    page,
  }) => {
    for (const density of ['compact', 'default', 'spacious']) {
      await openStory(page, 'time-weekstrip--changes', { density });
      const strip = page.getByRole('grid', { name: 'Changing week' });
      const heights = await strip
        .locator('[data-cell][data-action]')
        .evaluateAll((cells) => cells.map((el) => el.getBoundingClientRect().height));
      expect(heights).toHaveLength(21);
      expect(Math.min(...heights), density).toBeGreaterThanOrEqual(24);
      // The mark of hidden items is a button of its own.
      // The mark of hidden items is a button of its own: 24 pixels each way, all of it its own to press.
      const pressed = await page.locator('[data-part="hiddenItems"]').evaluate((mark) => {
        const { x, y, width, height } = mark.getBoundingClientRect();
        const corners = [3, width - 3].flatMap((dx) =>
          [1, height - 1].map((dy) => document.elementFromPoint(x + dx, y + dy) === mark),
        );
        return { width, height, corners };
      });
      expect(pressed.width, density).toBeGreaterThanOrEqual(24);
      expect(pressed.height, density).toBeGreaterThanOrEqual(24);
      expect(pressed.corners, density).toEqual([true, true, true, true]);
    }
    // What is drawn keeps its size: the small slot is 16px at the compact density, in a 24px cell.
    await openStory(page, 'time-weekstrip--changes', { density: 'compact' });
    const slot = page.locator('[aria-label="Changing week"] [data-part="slot"]').first();
    expect((await box(slot)).height).toBe(16);
    // A strip without callbacks has nothing to press, and is not made taller.
    await openStory(page, 'time-weekstrip--default', { density: 'compact' });
    const read = page.getByRole('grid', { name: 'This week, both' });
    expect((await box(cell(read, '2026-10-13', 1))).height).toBe(20);
  });

  test('focus in the grid is kept when the strip changes to its error or empty state, and back', async ({
    page,
  }) => {
    await openStory(page, 'time-weekstrip--changes');
    const strip = page.locator('[data-width="420"] [data-umbra="week-strip"]');
    await cell(strip, '2026-10-14').focus();
    await move(page, ['ArrowRight', 'ArrowDown'], '2026-10-15:1');
    await show(page, 'error');
    await expect(page.getByRole('alert')).toBeVisible();
    await expectFocusKept(page);
    await expect(page.getByRole('button', { name: 'Try again' })).toBeFocused();
    // Retry brings the grid back, and the focus returns to the cell the user was on.
    await pressKeys(page, 'Enter');
    await expect.poll(() => at(page)).toBe('2026-10-15:1');
    // The empty state has no control: the strip itself takes the focus.
    await show(page, 'empty');
    await expect(page.getByText('Nothing planned this week')).toBeVisible();
    await expectFocusKept(page);
    await expect(strip).toBeFocused();
    await show(page, 'data');
    await expect.poll(() => at(page)).toBe('2026-10-15:1');
    await move(page, ['ArrowLeft'], '2026-10-14:1');
  });

  test('loading holds the layout: no cell moves when the data arrives', async ({ page }) => {
    await openStory(page, 'time-weekstrip--changes');
    const strip = page.locator('[data-width="420"] [data-umbra="week-strip"]');
    const boxes = () =>
      strip.locator('[data-cell]').evaluateAll((cells) =>
        cells.map((el) => {
          const { x, y, width, height } = el.getBoundingClientRect();
          return [x, y, width, height];
        }),
      );
    const loaded = await boxes();
    expect(loaded).toHaveLength(21);
    await show(page, 'loading');
    await expect(strip).toHaveAttribute('aria-busy', 'true');
    expect(await boxes()).toEqual(loaded);
    await show(page, 'data');
    await expect(strip).not.toHaveAttribute('aria-busy');
    expect(await boxes()).toEqual(loaded);
  });

  test('an item whose slot is past the last line, or not a whole number, takes a free slot', async ({
    page,
  }) => {
    await openStory(page, 'time-weekstrip--changes');
    const strip = page.getByRole('grid', { name: 'Odd input' });
    // Slots 0 and 2 of a day with two lines: both are drawn, and nothing is "hidden" beside a free slot.
    await expect(cell(strip, '2026-10-14', 1)).toHaveText('Planning');
    await expect(cell(strip, '2026-10-14', 2)).toHaveText('Delivery');
    await expect(cell(strip, '2026-10-14').locator('[data-part="hiddenItems"]')).toHaveCount(0);
    // Slot 1.5 is no slot: the item is not lost.
    await expect(cell(strip, '2026-10-13', 1)).toHaveText('Upkeep');
    // Only a day that is full has a mark.
    await expect(strip.locator('[data-part="hiddenItems"]')).toHaveText(['+2']);
  });

  test('text that is not a date is left out or falls back, and nothing fails', async ({ page }) => {
    await openStory(page, 'time-weekstrip--changes');
    const strip = page.getByRole('grid', { name: 'Odd input' });
    // `date` is not a date: the week of today. `selectedDate` is not one: no day is selected.
    await expect(strip.getByRole('columnheader').first()).toHaveText(/Sunday, October 11, 2026/);
    await expect(strip.locator('[aria-selected="true"]')).toHaveCount(0);
    await expect(strip.locator('[aria-selected="false"]')).toHaveCount(7);
    // The item without a date is not drawn; the chip without one draws nothing.
    await expect(strip.locator('[data-part="slot"]')).toHaveCount(6);
    await expect(page.locator('time[datetime="2026-02-30"]')).toHaveCount(0);
    // A month and limits that are not months: the month of today, and no limit.
    await openStory(page, 'time-planner--changes');
    const grid = page.getByRole('grid');
    await expect(grid).toHaveAccessibleName('Changing, October 2026');
    const next = page.getByRole('button', { name: 'Next month' });
    await next.click();
    await next.click();
    await next.click();
    await expect(grid).toHaveAccessibleName('Changing, January 2027');
    await expect(next).toBeEnabled();
  });

  test('parts carry their names, and a selected slot named by the app says that it is selected', async ({
    page,
  }) => {
    await openStory(page, 'time-weekstrip--changes');
    const strip = page.getByRole('grid', { name: 'Odd input' });
    await expect(strip.locator('[data-umbra="date-chip"][data-part="day"]')).toHaveCount(7);
    await expect(strip.locator('[data-umbra="schedule-slot"][data-part="slot"]')).toHaveCount(6);
    await expect(strip.locator('[data-umbra="schedule-slot"][data-part="placeholder"]')).toHaveCount(8);
    const named = cell(strip, '2026-10-15', 1).locator('[data-part="slot"]');
    await expect(named).toHaveAttribute('aria-label', 'Workshop, Selected');
    await expect(cell(strip, '2026-10-15', 1)).toHaveAccessibleName('Workshop, Selected');
  });

  test('the font tokens resize the small chip and the small slot', async ({ page }) => {
    await openStory(page, 'time-weekstrip--default');
    await page.evaluate(() => {
      document.body.style.setProperty('--umbra-date-chip-font', '700 19px/1 serif');
      document.body.style.setProperty('--umbra-schedule-slot-font', '400 18px/1 serif');
    });
    const strip = page.getByRole('grid', { name: 'This week, both' });
    await expect(strip.locator('[data-umbra="date-chip"][data-size="small"]').first()).toHaveCSS(
      'font-size',
      '19px',
    );
    await expect(strip.locator('[data-umbra="schedule-slot"][data-size="small"]').first()).toHaveCSS(
      'font-size',
      '18px',
    );
  });

  test('the "+N" of a full day opens its hidden items, by pointer and from the grid by keyboard', async ({
    page,
  }) => {
    await openStory(page, 'time-weekstrip--changes');
    const strip = page.getByRole('grid', { name: 'Odd input' });
    const log = page.getByText(/^(Nothing pressed|Item|Day)/);
    const mark = strip.getByRole('button', { name: /^2 more: Quarterly review, Upkeep$/ });
    const list = page.getByRole('dialog', { name: /^2 more/ });
    // The press is the mark's: the day around it is not pressed.
    await mark.click();
    await expect(list.getByRole('button', { name: 'Upkeep' })).toBeDisabled();
    await expect(log).toHaveText('Nothing pressed');
    await list.getByRole('button', { name: 'Quarterly review' }).click();
    await expect(log).toHaveText('Item three');
    await expect(list).toHaveCount(0);
    await expect(mark).toBeFocused();
    await pressKeys(page, 'Escape');
    expect(await at(page)).toBe('2026-10-12:0');
    // Enter on the day is still the day; F2 moves to the mark, which opens with Enter.
    await pressKeys(page, 'Enter');
    await expect(log).toHaveText('Day 2026-10-12');
    await pressKeys(page, 'F2');
    await expect(mark).toBeFocused();
    await pressKeys(page, 'Enter');
    await expect(list).toBeVisible();
    await expectFocusKept(page);
    await list.getByRole('button', { name: 'Quarterly review' }).focus();
    await pressKeys(page, 'Enter');
    await expect(log).toHaveText('Item three');
    await expect(mark).toBeFocused();
    // From the mark the arrows still move through the grid.
    await move(page, ['ArrowRight'], '2026-10-13:0');
  });
});

test.describe('Time: Planner', () => {
  const grid = (page: Page) => page.getByRole('grid');

  test('is a grid named by its month, with weekday names, a side cell per week and one tab stop', async ({
    page,
  }) => {
    await openStory(page, 'time-planner--default');
    await expect(grid(page)).toHaveAccessibleName('Schedule, October 2026');
    const headers = grid(page).getByRole('columnheader');
    await expect(headers).toHaveCount(8);
    await expect(headers.nth(0)).toHaveText('Week');
    await expect(headers.nth(1)).toHaveText(/Sunday$/);
    const asides = grid(page).getByRole('rowheader');
    await expect(asides).toHaveCount(5);
    await expect(asides.first()).toHaveAccessibleName(/^Week, Sep 27\s–\sOct 3$/);
    await expect(cell(page, '2026-10-14')).toHaveAttribute('aria-current', 'date');
    await expect(cell(page, '2026-09-27')).toHaveAttribute('data-outside', 'true');
    // The first day shown and the first of the month say their month.
    await expect(cell(page, '2026-09-27').locator('[aria-hidden="true"]')).toHaveText('Sep 27', inner);
    await expect(cell(page, '2026-10-01').locator('[aria-hidden="true"]')).toHaveText('Oct 1', inner);
    // A slot is described by its day, since the weekday names alone do not say it.
    await expect(cell(page, '2026-10-14', 1)).toHaveAccessibleDescription(/Wednesday, October 14, 2026/);
    // The controls of the side cells are out of the tab order: the toolbar, then one cell.
    await expect(tabStops(grid(page))).toHaveCount(1);
    await pressKeys(page, 'Tab', 'Tab', 'Tab', 'Tab');
    await expect(page.getByRole('button', { name: 'Today' })).toBeFocused();
    await pressKeys(page, 'Tab');
    expect(await at(page)).toBe('2026-10-14:0');
    await pressKeys(page, 'Shift+Tab');
    await expect(page.getByRole('button', { name: 'Today' })).toBeFocused();
  });

  test('a week without items shows the headers of its days and one line', async ({ page }) => {
    await openStory(page, 'time-planner--default');
    const week = page.locator('[data-part="week"]').nth(3);
    await expect(week.locator('[data-part="dayCell"]')).toHaveCount(7);
    await expect(week.locator('[data-part="slotCell"]')).toHaveCount(0);
    await expect(week.locator('[data-part="weekEmpty"]')).toHaveText('Nothing planned');
    await openStory(page, 'time-planner--empty-weeks');
    await expect(page.locator('[data-part="weekEmpty"]')).toHaveCount(5);
    await expect(page.locator('[data-part="slotCell"]')).toHaveCount(0);
  });

  test('the arrow keys move through days, slots, empty weeks and the side cells', async ({ page }) => {
    await openStory(page, 'time-planner--default');
    await cell(page, '2026-10-14').focus();
    await move(page, ['ArrowDown', 'ArrowDown', 'ArrowDown'], '2026-10-14:3');
    // The next week has no slots: its header, then the header of the week after.
    await move(page, ['ArrowDown'], '2026-10-21:0');
    await move(page, ['ArrowDown'], '2026-10-28:0');
    await move(page, ['ArrowUp', 'ArrowUp'], '2026-10-14:3');
    await move(page, ['ArrowRight', 'ArrowRight', 'ArrowRight'], '2026-10-17:3');
    // Past the last day of the week: the first day of the next, which has only headers.
    await move(page, ['ArrowRight'], '2026-10-18:0');
    await move(page, ['End'], '2026-10-24:0');
    await move(page, ['ArrowUp'], '2026-10-17:3');
    await move(page, ['Home'], '2026-10-11:3');
    await move(page, ['End', 'Home', 'ArrowUp'], '2026-10-11:2');
    // Before the first day of a week is its side cell; from it, back to the line the user was on.
    await move(page, ['ArrowLeft'], 'aside:2026-10-11');
    await move(page, ['ArrowLeft'], 'aside:2026-10-11');
    await move(page, ['ArrowDown'], 'aside:2026-10-18');
    await move(page, ['ArrowUp', 'ArrowUp'], 'aside:2026-10-04');
    await move(page, ['ArrowRight'], '2026-10-04:2');
    await move(page, ['Control+Home'], '2026-10-01:0');
    await move(page, ['Control+End'], '2026-10-31:3');
    await expect(tabStops(grid(page))).toHaveCount(1);
  });

  test('the controls of a side cell are entered with Enter and left with Escape', async ({ page }) => {
    await openStory(page, 'time-planner--default');
    await cell(page, '2026-10-11').focus();
    await move(page, ['ArrowLeft'], 'aside:2026-10-11');
    const aside = page.getByRole('rowheader', { name: /Week, Oct 11\s–\s17/ });
    await pressKeys(page, 'Enter');
    await expect(aside.getByRole('button', { name: /Focus of the week/ })).toBeFocused();
    // Tab stays among the controls of the cell (Paste is disabled).
    await pressKeys(page, 'Tab');
    await expect(aside.getByRole('button', { name: 'Copy' })).toBeFocused();
    await pressKeys(page, 'Tab');
    await expect(aside.getByRole('button', { name: 'Clear' })).toBeFocused();
    await pressKeys(page, 'Tab');
    await expect(aside.getByRole('button', { name: /Focus of the week/ })).toBeFocused();
    await pressKeys(page, 'Shift+Tab', 'Shift+Tab');
    await expect(aside.getByRole('button', { name: 'Copy' })).toBeFocused();
    await pressKeys(page, 'Enter');
    await expect(page.getByText('Copied 2026-10-11')).toBeVisible();
    await expect(aside.getByRole('button', { name: 'Copy' })).toBeFocused();
    await pressKeys(page, 'Escape');
    expect(await at(page)).toBe('aside:2026-10-11');
    // From a button, the arrows still move through the grid.
    await pressKeys(page, 'F2', 'Tab');
    await move(page, ['ArrowRight'], '2026-10-11:0');
  });

  test("the app's buttons in the side column copy, paste and clear a week, and the focus stays", async ({
    page,
  }) => {
    await openStory(page, 'time-planner--default');
    const week = (start: string) => page.locator(`[data-part="week"]:has([data-week="${start}"])`);
    const aside = (start: string) => week(start).getByRole('rowheader');
    await aside('2026-10-11').getByRole('button', { name: 'Copy' }).click();
    await expect(week('2026-10-18').locator('[data-part="weekEmpty"]')).toHaveCount(1);
    await aside('2026-10-18').getByRole('button', { name: 'Paste' }).click();
    await expect(page.getByText('Pasted into 2026-10-18')).toBeVisible();
    await expectFocusKept(page);
    await expect(week('2026-10-18').locator('[data-part="weekEmpty"]')).toHaveCount(0);
    await expect(cell(page, '2026-10-21', 1)).toHaveText(await cell(page, '2026-10-14', 1).innerText());
    await aside('2026-10-18').getByRole('button', { name: 'Clear' }).click();
    await expectFocusKept(page);
    await expect(week('2026-10-18').locator('[data-part="weekEmpty"]')).toHaveText('Nothing planned');
    await expect(aside('2026-10-18').getByRole('button', { name: 'Clear' })).toBeFocused();
  });

  test('PageDown and PageUp change the month and keep the day; an arrow past the edge does too', async ({
    page,
  }) => {
    await openStory(page, 'time-planner--default');
    const log = page.getByText(/· selected/);
    await cell(page, '2026-10-14').focus();
    await pressKeys(page, 'ArrowDown');
    await move(page, ['PageDown'], '2026-11-14:1');
    await expect(grid(page)).toHaveAccessibleName('Schedule, November 2026');
    await expect(log).toHaveText(/^Month 2026-11/);
    // The change is said, since nothing the focus is on has changed its name.
    await expect(page.locator('[data-umbra="planner"] [aria-live="polite"]')).toHaveText('November 2026');
    await move(page, ['PageUp', 'PageUp'], '2026-09-14:1');
    // A year on there are no items: the header of the day.
    await move(page, ['Shift+PageDown'], '2027-09-14:0');
    await move(page, ['Shift+PageUp', 'PageDown'], '2026-10-14:0');
    // The 31st has no twin in November: its last day.
    await move(page, ['Control+End', 'ArrowUp', 'ArrowUp', 'ArrowUp', 'PageDown'], '2026-11-30:0');
    await move(page, ['PageUp'], '2026-10-30:0');
    // Down from the last week, and up from the first.
    await move(page, ['ArrowDown', 'ArrowDown', 'ArrowDown'], '2026-10-30:3');
    await move(page, ['ArrowDown'], '2026-11-06:0');
    await expect(grid(page)).toHaveAccessibleName('Schedule, November 2026');
    // The first week of November starts on its first day, so one more step up leaves the month.
    await move(page, ['ArrowUp'], '2026-10-30:3');
    await expect(grid(page)).toHaveAccessibleName('Schedule, October 2026');
    await expect(tabStops(grid(page))).toHaveCount(1);
  });

  test('the toolbar goes to the previous, next and current month and to a month of its list', async ({
    page,
  }) => {
    await openStory(page, 'time-planner--default');
    const next = page.getByRole('button', { name: 'Next month' });
    await next.click();
    await next.click();
    await expect(grid(page)).toHaveAccessibleName('Schedule, December 2026');
    await expect(next).toBeFocused();
    await page.getByRole('button', { name: 'Previous month' }).click();
    await expect(grid(page)).toHaveAccessibleName('Schedule, November 2026');
    await expect(cell(page, '2026-11-01')).toHaveAttribute('tabindex', '0');
    const today = page.getByRole('button', { name: 'Today' });
    await today.focus();
    await pressKeys(page, 'Enter');
    await expect(grid(page)).toHaveAccessibleName('Schedule, October 2026');
    await expect(today).toBeFocused();
    await expect(today).toBeEnabled();
    await expect(cell(page, '2026-10-14')).toHaveAttribute('tabindex', '0');
    const month = page.getByRole('button', { name: /Month/ });
    await expect(month).toHaveText(/October 2026/);
    await month.click();
    await page.getByRole('option', { name: 'March 2027' }).click();
    await expect(grid(page)).toHaveAccessibleName('Schedule, March 2027');
    await expectFocusKept(page);
  });

  test('a first and a last month stop the buttons and the keys; the title replaces the list', async ({
    page,
  }) => {
    await openStory(page, 'time-planner--plain');
    await expect(page.locator('[data-umbra="planner"] [data-part="title"]')).toHaveText('October 2026');
    await expect(page.getByRole('button', { name: /^Month/ })).toHaveCount(0);
    // `weekStartsOn` is Monday here, against the locale.
    await expect(grid(page).getByRole('columnheader')).toHaveCount(7);
    await expect(grid(page).getByRole('columnheader').first()).toHaveText(/Monday$/);
    await expect(cell(page, '2026-10-16')).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Tab');
    await pressKeys(page, 'Tab', 'Tab', 'Tab');
    // The selected day holds the tab stop.
    expect(await at(page)).toBe('2026-10-16:0');
    await move(page, ['PageDown'], '2026-11-16:0');
    await expect(page.getByRole('button', { name: 'Next month' })).toBeDisabled();
    // December is past the last month: the key does nothing, and the focus stays.
    await move(page, ['PageDown'], '2026-11-16:0');
    await move(page, ['Control+End', 'ArrowDown'], '2026-11-30:2');
    await expect(grid(page)).toHaveAccessibleName('Plain schedule, November 2026');
    await move(page, ['PageUp', 'PageUp'], '2026-09-30:2');
    await expect(page.getByRole('button', { name: 'Previous month' })).toBeDisabled();
    await move(page, ['PageUp'], '2026-09-30:2');
    // Without a side column, the arrow before the first day of a week goes to the day before.
    await move(page, ['Home', 'ArrowLeft'], '2026-09-27:2');
  });

  test('a click selects a day and reports it; items and free slots report too', async ({ page }) => {
    await openStory(page, 'time-planner--default');
    const log = page.getByText(/· selected/);
    await cell(page, '2026-10-08').click();
    await expect(log).toHaveText('Day 2026-10-08 · selected 2026-10-08');
    await expect(cell(page, '2026-10-08')).toHaveAttribute('aria-selected', 'true');
    await expect(grid(page).locator('[aria-selected="true"]')).toHaveCount(1);
    expect(await at(page)).toBe('2026-10-08:0');
    await cell(page, '2026-10-08', 1).click();
    await expect(log).toHaveText('Item 2026-10-08-0 · selected 2026-10-08');
    // The second slot of the 8th is free: it stands for its day.
    await cell(page, '2026-10-08', 2).click();
    await expect(log).toHaveText('Day 2026-10-08 · selected 2026-10-08');
    await cell(page, '2026-10-09', 1).focus();
    await pressKeys(page, ' ');
    await expect(log).toHaveText('Item 2026-10-09-0 · selected 2026-10-08');
  });

  test('scrolls inside itself, under weekday names that stay, and brings the focused cell into view', async ({
    page,
  }) => {
    await openStory(page, 'time-planner--default', { width: 1024, height: 600 });
    const view = page.locator('[data-umbra="planner"] [data-part="viewport"]');
    const sizes = await view.evaluate((el) => [el.scrollHeight, el.clientHeight]);
    expect(sizes[0]).toBeGreaterThan(sizes[1]! + 100);
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true);
    // Today is in view when the planner opens.
    const inView = async (target: Locator) => {
      const [c, v, h] = [
        await box(target),
        await box(view),
        await box(page.locator('[data-part="weekdays"]')),
      ];
      return c.y >= h.y + h.height - 0.5 && c.y + c.height <= v.y + v.height + 0.5;
    };
    expect(await inView(cell(page, '2026-10-14'))).toBe(true);
    const names = page.locator('[data-part="weekdays"]');
    const top = (await box(names)).y;
    await cell(page, '2026-10-14').focus();
    await pressKeys(page, 'Control+End');
    await settle(page);
    expect(await inView(cell(page, '2026-10-31', 3))).toBe(true);
    expect((await box(names)).y).toBe(top);
    // Back up: the cell is not left under the weekday names.
    await pressKeys(page, 'Control+Home');
    await settle(page);
    expect(await inView(cell(page, '2026-10-01'))).toBe(true);
    // "Today" brings the day back without taking the focus.
    await page.getByRole('button', { name: 'Today' }).click();
    await settle(page);
    expect(await inView(cell(page, '2026-10-14'))).toBe(true);
    await expect(page.getByRole('button', { name: 'Today' })).toBeFocused();
  });

  test('as it narrows: labels are cut, then slots show icons only, then the side column collapses', async ({
    page,
  }) => {
    // Step 1, at the smallest window: the labels are drawn, and those that do not fit end in an ellipsis.
    await openStory(page, 'time-planner--default', { width: 1024, height: 600 });
    const labels = page.locator('[data-part="slotCell"] [data-part="label"]');
    const state = await labels.evaluateAll((all) => ({
      shown: all.every((el) => el.clientWidth > 1),
      cut: all.filter((el) => el.scrollWidth > el.clientWidth).length,
    }));
    expect(state.shown).toBe(true);
    expect(state.cut).toBeGreaterThan(0);
    await expect(labels.first()).toHaveCSS('text-overflow', 'ellipsis');
    await expect(grid(page)).toHaveAttribute('data-aside', 'open');

    await openStory(page, 'time-planner--shrinking');
    // Step 2, 620 pixels: icons only, the side column still open.
    const middle = page.locator('[data-width="620"]');
    await expect(middle.getByRole('grid')).toHaveAttribute('data-aside', 'open');
    expect(await labelShown(cell(middle, '2026-10-14', 1))).toBe(false);
    await expect(cell(middle, '2026-10-14', 1)).toHaveText('Planning');
    await expect(middle.getByRole('button', { name: 'Focus of the week' }).first()).toBeVisible();
    // Step 3, 440 pixels: the side column is a button per week that opens its content.
    const small = page.locator('[data-width="440"]');
    await expect(small.getByRole('grid')).toHaveAttribute('data-aside', 'collapsed');
    await expect(small.getByRole('button', { name: 'Focus of the week' })).toHaveCount(0);
    expect(await labelShown(cell(small, '2026-10-14', 1))).toBe(false);
    for (const holder of [middle, small]) {
      const g = holder.getByRole('grid');
      expect(await g.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
      const [h, last] = [await box(holder), await box(cell(holder, '2026-10-17', 1))];
      expect(last.x + last.width).toBeLessThanOrEqual(h.x + h.width + 0.5);
    }
    // A day too narrow for "Sep 27" shows the number, and still says the whole date.
    await expect(
      cell(small, '2026-09-27').locator('span[data-part="day"] > span').filter({ visible: true }),
    ).toHaveText('27');
    await expect(cell(small, '2026-09-27')).toHaveText(/Sunday, September 27, 2026/);
    // The weekday names: short here, and narrow once the room inside a day is 48 pixels or less.
    const wednesday = small
      .getByRole('columnheader')
      .nth(4)
      .locator('[data-weekday]')
      .filter({ visible: true });
    await expect(wednesday).toHaveText('Wed');
    await small.evaluate((el) => ((el as HTMLElement).style.width = '340px'));
    await expect(wednesday).toHaveText('W');
    expect(await small.getByRole('grid').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  });

  test('the collapsed side column opens its content in a popover, by pointer and by keyboard', async ({
    page,
  }) => {
    await openStory(page, 'time-planner--shrinking');
    const small = page.locator('[data-width="440"]');
    await cell(small, '2026-10-11').focus();
    await move(page, ['ArrowLeft'], 'aside:2026-10-11');
    // The move scrolled the cell into view. A popover closes when the page around its anchor scrolls,
    // as every anchored overlay does, so that scroll has to be over before the popover opens.
    await settle(page);
    await pressKeys(page, 'Enter');
    const dialog = page.getByRole('dialog', { name: /Week, Oct 11\s–\s17/ });
    await expect(dialog.getByRole('button', { name: 'Copy' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Clear' }).click();
    await expect(small.getByText('Cleared 2026-10-11')).toBeVisible();
    await pressKeys(page, 'Escape');
    await expect(dialog).toHaveCount(0);
    await expect(small.getByRole('button', { name: /Week, Oct 11\s–\s17/ })).toBeFocused();
    await pressKeys(page, 'Escape');
    expect(await at(page)).toBe('aside:2026-10-11');
    // The step is a function of the width alone: wider opens the column again, narrower collapses it.
    const middle = page.locator('[data-width="620"]');
    await middle.evaluate((el) => ((el as HTMLElement).style.width = '440px'));
    await expect(middle.getByRole('grid')).toHaveAttribute('data-aside', 'collapsed');
    await middle.evaluate((el) => ((el as HTMLElement).style.width = '620px'));
    await expect(middle.getByRole('grid')).toHaveAttribute('data-aside', 'open');
    await expect(middle.getByRole('button', { name: 'Focus of the week' }).first()).toBeVisible();
  });

  test('loading keeps the days and marks the grid busy; empty and error take the place of the weeks', async ({
    page,
  }) => {
    await openStory(page, 'time-planner--loading');
    await expect(grid(page)).toHaveAttribute('aria-busy', 'true');
    await expect(page.locator('[data-part="dayCell"]')).toHaveCount(35);
    await expect(page.locator('[data-part="slotCell"] [data-part="skeleton"]')).toHaveCount(105);
    await expect(page.locator('[data-part="weekEmpty"]')).toHaveCount(0);

    await openStory(page, 'time-planner--empty');
    await expect(page.locator('[data-part="empty"]')).toHaveText(/Nothing planned.*Pick a day to start\./);
    await expect(grid(page)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Next month' })).toBeVisible();

    await openStory(page, 'time-planner--error-state');
    await expect(page.getByRole('alert')).toHaveText(/Something went wrong/);
    await page.getByRole('button', { name: 'Try again' }).focus();
    await pressKeys(page, 'Enter');
    await expect(grid(page)).toBeVisible();
    await expectFocusKept(page);
  });

  test('parts replace, hide and wrap; the blocks compose the toolbar and the grid in any order', async ({
    page,
  }) => {
    await openStory(page, 'time-planner--parts');
    const nodes = page.locator('[data-umbra="planner"]').first();
    await expect(nodes.locator('[data-part="toolbar"]')).toHaveText('October, by the app');
    await expect(nodes.getByRole('columnheader')).toHaveCount(0);
    await expect(nodes.locator('[data-part="weekEmpty"]')).toHaveText('A quiet week');
    const functions = page.locator('[data-umbra="planner"]').last();
    await expect(functions.getByRole('button', { name: 'This month' })).toBeVisible();
    await expect(functions.getByRole('button', { name: 'Export' })).toBeVisible();
    await expect(functions.locator('[data-part="weekEmpty"]')).toHaveText('Nothing planned from 2026-10-18');
    await expect(cell(functions, '2026-10-14').locator('[data-part="weekday"]')).toHaveText('W');
    await expect(functions.locator('[data-umbra="schedule-slot"][data-variant="filled"]')).toHaveCount(0);

    await openStory(page, 'time-planner--blocks');
    const blocks = page.locator('[data-umbra="planner"]');
    const [bar, weeks] = [
      await box(blocks.locator('[data-part="toolbar"]')),
      await box(blocks.getByRole('grid')),
    ];
    expect(bar.y).toBeGreaterThan(weeks.y);
    await expect(blocks.locator('[data-part="weekEmpty"]')).toHaveText('Nothing this week');
    await blocks.getByRole('button', { name: 'Next month' }).click();
    await expect(blocks.getByRole('grid')).toHaveAccessibleName('From blocks, November 2026');
  });

  test('`height`: fills its slot by default, or is as tall as its weeks, or a number of pixels', async ({
    page,
  }) => {
    await openStory(page, 'time-planner--heights');
    const planners = page.locator('[data-umbra="planner"]');
    const content = planners.first();
    await expect(content).toHaveAttribute('data-height', 'content');
    const view = content.locator('[data-part="viewport"]');
    expect(await view.evaluate((el) => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1);
    expect((await box(planners.last())).height).toBe(300);
    await openStory(page, 'time-planner--default');
    const [planner, body] = [
      await box(page.locator('[data-umbra="planner"]')),
      await box(page.locator('[data-umbra="card"] [data-part="body"]')),
    ];
    expect(planner.height).toBeGreaterThan(body.height - 40);
    expect(planner.height).toBeLessThanOrEqual(body.height);
  });

  test('right to left: days run from the right, the side column is on the right, the arrows follow', async ({
    page,
  }) => {
    await openStory(page, 'time-planner--right-to-left');
    const [first, last, aside] = [
      await box(cell(page, '2026-10-11')),
      await box(cell(page, '2026-10-17')),
      await box(page.getByRole('rowheader').nth(2)),
    ];
    expect(first.x).toBeGreaterThan(last.x);
    expect(aside.x).toBeGreaterThan(first.x);
    await cell(page, '2026-10-14').focus();
    await move(page, ['ArrowLeft'], '2026-10-15:0');
    await move(page, ['ArrowRight', 'ArrowRight'], '2026-10-13:0');
    await move(page, ['Home'], '2026-10-11:0');
    await move(page, ['ArrowRight'], 'aside:2026-10-11');
    await move(page, ['ArrowLeft'], '2026-10-11:0');
    await move(page, ['End', 'ArrowLeft'], '2026-10-18:0');
    // The arrows of the toolbar point the other way.
    const [previous, next] = [
      await box(page.getByRole('button').nth(1)),
      await box(page.getByRole('button').nth(2)),
    ];
    expect(previous.x).toBeGreaterThan(next.x);
  });

  test('Next and Previous keep the focus when they disable themselves at the last and the first month', async ({
    page,
  }) => {
    await openStory(page, 'time-planner--plain');
    const next = page.getByRole('button', { name: 'Next month' });
    const previous = page.getByRole('button', { name: 'Previous month' });
    await next.focus();
    await pressKeys(page, 'Enter');
    await expect(grid(page)).toHaveAccessibleName('Plain schedule, November 2026');
    await expect(next).toBeDisabled();
    await expect(previous).toBeFocused();
    await pressKeys(page, 'Enter');
    await expect(previous).toBeFocused();
    await pressKeys(page, 'Enter');
    await expect(grid(page)).toHaveAccessibleName('Plain schedule, September 2026');
    await expect(previous).toBeDisabled();
    await expect(next).toBeFocused();
    // By pointer too.
    await next.click();
    await next.click();
    await expect(next).toBeDisabled();
    await expectFocusKept(page);
    await expect(previous).toBeFocused();
  });

  test('focus in the grid is kept when the planner changes to its error or empty state, and back', async ({
    page,
  }) => {
    await openStory(page, 'time-planner--changes');
    await cell(page, '2026-10-14').focus();
    await move(page, ['ArrowDown'], '2026-10-14:1');
    await show(page, 'error');
    await expect(page.getByRole('alert')).toBeVisible();
    await expectFocusKept(page);
    await expect(page.getByRole('button', { name: 'Try again' })).toBeFocused();
    await pressKeys(page, 'Enter');
    await expect.poll(() => at(page)).toBe('2026-10-14:1');
    await show(page, 'empty');
    await expect(page.getByText('Nothing planned')).toBeVisible();
    await expectFocusKept(page);
    await expect(page.locator('[data-umbra="planner"] [data-part="state"]')).toBeFocused();
    await show(page, 'data');
    await expect.poll(() => at(page)).toBe('2026-10-14:1');
  });

  test('PageDown and PageUp from a day of the month before: the same day of the month shown, or its own month', async ({
    page,
  }) => {
    await openStory(page, 'time-planner--default');
    // 28 September is shown in October. A page forward is 28 October: no month to change.
    await cell(page, '2026-09-28').focus();
    await move(page, ['PageDown'], '2026-10-28:0');
    await expect(grid(page)).toHaveAccessibleName('Schedule, October 2026');
    // A page back from it shows its own month, September, and not August.
    await cell(page, '2026-09-28').focus();
    await move(page, ['PageUp'], '2026-09-28:0');
    await expect(grid(page)).toHaveAccessibleName('Schedule, September 2026');
    await expect(cell(page, '2026-09-28')).not.toHaveAttribute('data-outside');
    await move(page, ['PageUp'], '2026-08-28:0');
    // And from a day of the month after: 1 October is shown in September.
    await move(page, ['PageDown'], '2026-09-28:0');
    await cell(page, '2026-10-01').focus();
    await move(page, ['PageUp'], '2026-09-01:0');
    await expect(grid(page)).toHaveAccessibleName('Schedule, September 2026');
    await cell(page, '2026-10-01').focus();
    await move(page, ['PageDown'], '2026-10-01:0');
    await expect(grid(page)).toHaveAccessibleName('Schedule, October 2026');
    await expect(tabStops(grid(page))).toHaveCount(1);
  });

  test('with the side column every cell says its column, and the side cell spans the rows of its week', async ({
    page,
  }) => {
    await openStory(page, 'time-planner--default');
    await expect(grid(page)).toHaveAttribute('aria-colcount', '8');
    const headers = grid(page).getByRole('columnheader');
    expect(await headers.evaluateAll((all) => all.map((el) => el.getAttribute('aria-colindex')))).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
    ]);
    // A slot of a Monday is under "Monday", though its row has no side cell before it.
    const monday = await headers.filter({ hasText: /Monday$/ }).getAttribute('aria-colindex');
    expect(monday).toBe('3');
    for (const line of [0, 1, 3]) {
      await expect(cell(page, '2026-10-12', line)).toHaveAttribute('aria-colindex', monday!);
    }
    await expect(cell(page, '2026-10-17', 2)).toHaveAttribute('aria-colindex', '8');
    const aside = (week: string) => page.locator(`[data-part="weekAside"][data-week="${week}"]`);
    await expect(aside('2026-10-11')).toHaveAttribute('aria-colindex', '1');
    await expect(aside('2026-10-11')).toHaveAttribute('aria-rowspan', '4');
    // The week without items: its headers and one line, which starts under the first day.
    await expect(aside('2026-10-18')).toHaveAttribute('aria-rowspan', '2');
    await expect(page.locator('[data-part="weekEmpty"]')).toHaveAttribute('aria-colindex', '2');
    // Without a side column the cells are in order, and say nothing.
    await openStory(page, 'time-planner--plain');
    await expect(grid(page)).not.toHaveAttribute('aria-colcount');
    await expect(cell(page, '2026-10-12', 1)).not.toHaveAttribute('aria-colindex');
  });

  test('a hidden line of an empty week leaves no row; the "+N" opens from the grid', async ({ page }) => {
    await openStory(page, 'time-planner--changes');
    const week = page.locator('[data-part="week"]:has([data-week="2026-10-18"])');
    await expect(week.getByRole('row')).toHaveCount(1);
    await expect(week.locator('[data-part="weekEmpty"]')).toHaveCount(0);
    await expect(week.getByRole('rowheader')).toHaveAttribute('aria-rowspan', '1');
    const headers = await box(cell(page, '2026-10-18'));
    expect((await box(week)).height).toBeLessThan(headers.height + 16);
    // The day of today has more items than slots.
    const mark = cell(page, '2026-10-14').getByRole('button', { name: /more: / });
    await expect(mark).toHaveText(/^\+\d$/);
    await cell(page, '2026-10-14').focus();
    await pressKeys(page, 'F2');
    await expect(mark).toBeFocused();
    await pressKeys(page, 'Enter');
    const list = page.getByRole('dialog', { name: /more: / });
    await expect(list.getByRole('button', { name: 'Team workshop' })).toBeDisabled();
    await list.getByRole('button').first().focus();
    await pressKeys(page, 'Enter');
    await expect(page.getByText(/^Item extra-/)).toBeVisible();
    await expect(mark).toBeFocused();
    await pressKeys(page, 'Escape');
    expect(await at(page)).toBe('2026-10-14:0');
  });
});
