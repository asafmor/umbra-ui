import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectFocusKept, openStory, pressKeys, resizeTwice, settle } from './helpers';

// ContextBlock, EntitySwitcher, WidgetBoard and HorizontalScroller: what a still image cannot show.

const tooltip = (page: Page) => page.locator('[data-umbra="tooltip"]');
const box = async (el: Locator) => (await el.boundingBox())!;
/** Sets the width of the element around the first match of `selector`. */
const setParentWidth = (page: Page, selector: string, width: number) =>
  page.evaluate(
    ([sel, w]) => {
      const parent = document.querySelector(sel as string)!.parentElement!;
      parent.style.maxWidth = 'none';
      parent.style.width = `${w}px`;
    },
    [selector, width] as const,
  );
/** Reads a state at every width of a range, going down and then up again. */
async function sweep(page: Page, selector: string, from: number, to: number, read: () => Promise<string>) {
  const widths = Array.from({ length: from - to + 1 }, (_, i) => from - i);
  const down = new Map<number, string>();
  for (const width of widths) {
    await setParentWidth(page, selector, width);
    await settle(page);
    down.set(width, await read());
  }
  const up = new Map<number, string>();
  for (const width of [...widths].reverse()) {
    await setParentWidth(page, selector, width);
    await settle(page);
    up.set(width, await read());
  }
  return { widths, down, up };
}
/** The distinct states of a sweep, in the order they were met. */
const steps = (widths: number[], states: Map<number, string>) =>
  widths.map((w) => states.get(w)!).filter((state, i, all) => i === 0 || state !== all[i - 1]);

test.describe('ContextBlock', () => {
  const barState = (page: Page) => () =>
    page.evaluate(() => {
      const bar = document.querySelector<HTMLElement>('[data-umbra="top-bar"]')!;
      const block = bar.querySelector<HTMLElement>('[data-umbra="context-block"]');
      const has = (part: string) => (block?.querySelector(`[data-part="${part}"]`) ? part[0] : '');
      return `${bar.dataset.shrink}/${block ? `${block.dataset.shrink}${has('secondary')}${has('chip')}` : '-'}`;
    });

  test('in a bar it gives way first, one step at a time: second line, chip, then the whole block', async ({
    page,
  }) => {
    test.slow();
    await openStory(page, 'shell-contextblock--shrink', { width: 1400 });
    const read = barState(page);
    const { widths, down, up } = await sweep(page, '[data-umbra="top-bar"]', 1010, 800, read);
    // One state per width, whichever way it was reached: no step flips back and forth.
    expect(Object.fromEntries(up)).toEqual(Object.fromEntries(down));
    // Every step is taken, in order, each once; the bar's own first step comes after the block's two.
    expect(steps(widths, down)).toEqual(['0/0sc', '0/1c', '0/2', '1/-']);

    // Two sizes within one frame end on what the last one gives.
    for (const [first, second] of [
      [1010, 900],
      [820, 940],
      [1010, 820],
    ] as const) {
      await page.evaluate(() => {
        const bar = document.querySelector('[data-umbra="top-bar"]')!.parentElement!;
        bar.dataset.target = '';
      });
      await resizeTwice(page, '[data-target]', first, second);
      await settle(page);
      expect(await read(), `${first} then ${second}`).toBe(down.get(second));
    }

    // A fresh load at a width gives what the resize gave.
    await openStory(page, 'shell-contextblock--shrink', { width: 1400 });
    const fresh = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('[data-umbra="top-bar"]')].map((bar) => {
        const block = bar.querySelector<HTMLElement>('[data-umbra="context-block"]');
        return `${bar.parentElement!.offsetWidth}:${bar.dataset.shrink}/${block?.dataset.shrink ?? '-'}`;
      }),
    );
    expect(fresh).toEqual(['1000:0/0', '930:0/1', '880:0/2', '800:1/-']);
  });

  test('while a line is hidden the tooltip shows the whole text; with everything shown there is none', async ({
    page,
  }) => {
    await openStory(page, 'shell-contextblock--shrink', { width: 1400 });
    const bars = page.locator('[data-umbra="top-bar"]');
    await bars.nth(2).locator('[data-umbra="context-block"] button').focus();
    await page.keyboard.press('Shift+Tab');
    await pressKeys(page, 'Tab');
    await expect(tooltip(page)).toContainText('Sat 10 Oct 2026');
    await expect(tooltip(page)).toContainText('Quarter close in 6 days');
    await expect(tooltip(page)).toContainText('09:30');
    // Escape dismisses it and the focus stays.
    await pressKeys(page, 'Escape');
    await expect(tooltip(page)).toHaveCount(0);

    await bars.nth(0).locator('[data-umbra="context-block"] button').focus();
    await page.keyboard.press('Shift+Tab');
    await pressKeys(page, 'Tab');
    await expect(bars.nth(0).locator('[data-umbra="context-block"] button')).toBeFocused();
    await settle(page);
    await expect(tooltip(page)).toHaveCount(0);
  });

  test('outside a bar the lines end in an ellipsis and the tooltip shows them whole', async ({ page }) => {
    await openStory(page, 'shell-contextblock--truncated');
    const block = page.locator('[data-umbra="context-block"]').first();
    for (const part of ['primary', 'secondary']) {
      const line = block.locator(`[data-part="${part}"]`);
      await expect(line).toHaveCSS('text-overflow', 'ellipsis');
      expect(await line.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    }
    // Nothing leaves the strip it is in.
    const strip = await box(block.locator('xpath=..'));
    const own = await box(block);
    expect(own.x + own.width).toBeLessThanOrEqual(strip.x + strip.width + 0.5);
    await block.hover();
    await expect(tooltip(page)).toContainText('Quarter close in 6 days, then the yearly review');
    // The token caps the width of a block that has room.
    const capped = page.locator('[data-umbra="context-block"]').nth(1);
    expect((await box(capped)).width).toBeLessThanOrEqual(200.5);
  });

  test('a button, a link through renderLink, and a disabled block', async ({ page }) => {
    await openStory(page, 'shell-contextblock--interactive');
    const blocks = page.locator('[data-umbra="context-block"]');
    const button = blocks.nth(0).getByRole('button');
    await expect(button).toHaveAccessibleName(/Sat 10 Oct 2026.*Quarter close in 6 days.*09:30/);
    await button.click();
    await button.focus();
    await pressKeys(page, 'Enter', 'Space');
    await expect(page.getByText('Presses: 3')).toBeVisible();

    const link = blocks.nth(1).getByRole('link');
    await expect(link).toHaveAttribute('href', '#calendar');
    await expect(link).toHaveAccessibleName(/Sat 10 Oct 2026.*Quarter close in 6 days.*09:30/);

    const disabled = blocks.nth(2).getByRole('button');
    await expect(disabled).toBeDisabled();
    await expect(blocks.nth(2)).toHaveAttribute('data-disabled', 'true');
    await disabled.click({ force: true });
    await expect(page.getByText('Presses: 3')).toBeVisible();

    await expect(blocks.nth(3).locator('a[data-router-link]')).toHaveAttribute('href', '#router');
    // Plain text is no tab stop.
    await openStory(page, 'shell-contextblock--anatomy');
    expect(await page.locator('[data-umbra="context-block"] :is(a, button, [tabindex])').count()).toBe(0);
  });

  test('time is written in the chip as a <time>; a live clock moves on each minute and announces nothing', async ({
    page,
  }) => {
    await page.clock.install({ time: new Date('2026-03-01T12:00:20Z') });
    await openStory(page, 'shell-contextblock--live');
    const chips = page.locator('[data-umbra="context-block"] time[data-part="chip"]');
    await expect(chips).toHaveText(['09:30', '18:30']);
    await expect(chips.first()).toHaveAttribute('datetime', '2026-10-10T09:30:00.000Z');
    // Not before the minute is over.
    await page.clock.runFor(55_000);
    await expect(chips).toHaveText(['09:30', '18:30']);
    await page.clock.runFor(6_000);
    await expect(chips).toHaveText(['09:31', '18:31']);
    await expect(chips.first()).toHaveAttribute('datetime', '2026-10-10T09:31:00.000Z');
    await page.clock.runFor(60_000);
    await expect(chips).toHaveText(['09:32', '18:32']);
    expect(await page.locator('[data-umbra="context-block"] :is([aria-live], [role="timer"])').count()).toBe(
      0,
    );

    // Not live: the value stays.
    await openStory(page, 'shell-contextblock--anatomy');
    const still = page.locator('[data-umbra="context-block"] [data-part="chip"]').first();
    await expect(still).toHaveText('09:30');
    await page.clock.runFor(120_000);
    await expect(still).toHaveText('09:30');
  });

  test('the block takes the text colour of the bar it is on, on any brand', async ({ page }) => {
    await openStory(page, 'shell-contextblock--on-brands');
    const colours = await page.evaluate(() =>
      [...document.querySelectorAll('[data-umbra="top-bar"]')].map((bar) => {
        const of = (sel: string) => getComputedStyle(bar.querySelector(sel)!).color;
        return {
          bar: getComputedStyle(bar).color,
          primary: of('[data-part="primary"]'),
          secondary: of('[data-part="secondary"]'),
          chip: of('[data-part="chip"]'),
          border: getComputedStyle(bar.querySelector('[data-part="chip"]')!).borderTopColor,
        };
      }),
    );
    for (const c of colours) {
      expect([c.primary, c.secondary, c.chip, c.border]).toEqual([c.bar, c.bar, c.bar, c.bar]);
    }
    // The light bar has dark text, the others light text.
    expect(new Set(colours.map((c) => c.bar)).size).toBe(2);
  });

  test('parts as a node, null and a function; the blocks composed by hand', async ({ page }) => {
    await openStory(page, 'shell-contextblock--parts-and-blocks');
    const blocks = page.locator('[data-umbra="context-block"]');
    await expect(blocks.nth(0).locator('strong[data-custom]')).toHaveText('09:30 UTC');
    await expect(blocks.nth(0).locator('[data-part="chip"]')).toHaveCount(0);
    await expect(blocks.nth(1).locator('[data-part="secondary"]')).toHaveCount(0);
    await expect(blocks.nth(1).locator('[data-part="primary"]')).toBeVisible();
    await expect(blocks.nth(2).locator('[data-part="primary"]')).toHaveText('Today · Sat 10 Oct 2026');
    for (const part of ['text', 'primary', 'secondary', 'chip']) {
      await expect(blocks.nth(3).locator(`[data-part="${part}"]`)).toBeVisible();
    }
    await expect(blocks.nth(3).locator('time')).toHaveAttribute('datetime', '2026-10-10T09:30:00Z');
  });

  test('right to left: the chip is on the other side of the lines', async ({ page }) => {
    for (const direction of ['ltr', 'rtl'] as const) {
      await openStory(page, 'shell-contextblock--anatomy', { direction });
      const block = page.locator('[data-umbra="context-block"]').first();
      const text = await box(block.locator('[data-part="text"]'));
      const chip = await box(block.locator('[data-part="chip"]'));
      expect(chip.x > text.x, direction).toBe(direction === 'ltr');
    }
  });
});

test.describe('EntitySwitcher', () => {
  const switcher = (page: Page, n = 0) => page.locator('[data-umbra="entity-switcher"]').nth(n);
  const picker = (page: Page) => page.getByRole('dialog');
  const rows = (page: Page) => picker(page).locator('[data-part="row"]');

  test('the steppers go to the previous and the next entity, skip a disabled one and stop at the ends', async ({
    page,
  }) => {
    await openStory(page, 'shell-entityswitcher--default');
    const root = switcher(page);
    const previous = root.getByRole('button', { name: /^Previous/ });
    const next = root.getByRole('button', { name: /^Next/ });
    await expect(root.getByRole('group', { name: 'Switch region' })).toBeVisible();
    await expect(previous).toHaveAccessibleName('Previous: Region 1');
    await expect(next).toHaveAccessibleName('Next: Region 3');
    // Each is a full target.
    for (const stepper of [previous, next]) {
      const size = await box(stepper);
      expect(Math.min(size.width, size.height)).toBeGreaterThanOrEqual(24);
    }

    await next.focus();
    await pressKeys(page, 'Enter');
    await expect(page.getByText('Current: region-3 · last action: region-3')).toBeVisible();
    await pressKeys(page, 'Enter', 'Enter');
    // Region 6 is disabled: Region 5 is the last. The stepper is off, and still has the focus.
    await expect(page.getByText('Current: region-5')).toBeVisible();
    await expect(next).toHaveAttribute('aria-disabled', 'true');
    await expect(next).toHaveAccessibleName('Next');
    await expect(next).toBeFocused();
    await pressKeys(page, 'Enter');
    await expect(page.getByText('Current: region-5')).toBeVisible();

    await pressKeys(page, 'Shift+Tab');
    await expect(previous).toBeFocused();
    for (let i = 0; i < 4; i++) await pressKeys(page, 'Space');
    await expect(page.getByText('Current: region-1')).toBeVisible();
    await expect(previous).toHaveAttribute('aria-disabled', 'true');
    await expect(previous).toBeFocused();
  });

  test('wrap goes round; one entity has no steppers; a disabled switcher does nothing', async ({ page }) => {
    await openStory(page, 'shell-entityswitcher--variants');
    const wraps = switcher(page, 0);
    await expect(wraps.locator('[data-part="name"]')).toHaveText('Region 5');
    await wraps.getByRole('button', { name: 'Next: Region 1' }).click();
    await expect(wraps.locator('[data-part="name"]')).toHaveText('Region 1');
    await wraps.getByRole('button', { name: 'Previous: Region 5' }).click();
    await expect(wraps.locator('[data-part="name"]')).toHaveText('Region 5');

    // The steppers come first when asked.
    const first = switcher(page, 2);
    expect((await box(first.locator('[data-part="steppers"]'))).x).toBeLessThan(
      (await box(first.locator('[data-part="trigger"]'))).x,
    );
    await expect(switcher(page, 4).locator('[data-part="steppers"]')).toHaveCount(0);

    const disabled = switcher(page, 5);
    await expect(disabled.locator('[data-part="trigger"]')).toBeDisabled();
    await disabled.getByRole('button', { name: /^Next/ }).click({ force: true });
    await expect(disabled.locator('[data-part="name"]')).toHaveText('Region 2');

    // Nothing chosen: the placeholder, and "next" starts at the first.
    const none = switcher(page, 6);
    await expect(none.locator('[data-part="name"]')).toHaveText('Choose');
    await none.getByRole('button', { name: 'Next: Region 1' }).click();
    await expect(none.locator('[data-part="name"]')).toHaveText('Region 1');
  });

  test('the picker: opens from the trigger, is searched, walked with the arrow keys, and chooses', async ({
    page,
  }) => {
    await openStory(page, 'shell-entityswitcher--default');
    const trigger = switcher(page).locator('[data-part="trigger"]');
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.focus();
    await pressKeys(page, 'Enter');
    await expect(picker(page)).toHaveAccessibleName('Switch region');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const search = picker(page).getByRole('searchbox');
    await expect(search).toBeFocused();
    await expect(search).toHaveAccessibleName('Search');

    // Groups are lists named by their heading; the current row is marked beyond its colour.
    await expect(picker(page).getByRole('list', { name: 'North' }).getByRole('listitem')).toHaveCount(3);
    await expect(picker(page).getByRole('list', { name: 'South' }).getByRole('listitem')).toHaveCount(3);
    const current = rows(page).nth(1);
    await expect(current).toHaveAttribute('aria-current', 'true');
    await expect(current.locator('[data-part="check"]')).toBeVisible();
    await expect(rows(page).nth(5)).toBeDisabled();
    // The rows are one tab stop.
    expect(await rows(page).evaluateAll((all) => all.filter((el) => el.tabIndex === 0).length)).toBe(1);

    await pressKeys(page, 'ArrowDown');
    await expect(rows(page).nth(0)).toBeFocused();
    await pressKeys(page, 'ArrowDown', 'ArrowDown');
    await expect(rows(page).nth(2)).toBeFocused();
    await pressKeys(page, 'End');
    await expect(rows(page).nth(4)).toBeFocused();
    await pressKeys(page, 'ArrowDown');
    await expect(rows(page).nth(4)).toBeFocused();
    await pressKeys(page, 'Home');
    await expect(rows(page).nth(0)).toBeFocused();
    await pressKeys(page, 'ArrowUp');
    await expect(search).toBeFocused();

    await page.keyboard.type('REGION 4');
    await expect(rows(page)).toHaveText([/Region 4/]);
    await expect(picker(page).getByRole('list', { name: 'North' })).toHaveCount(0);
    await search.fill('teams');
    await expect(rows(page)).toHaveCount(5);
    await search.fill('nothing like this');
    await expect(picker(page).getByRole('status')).toHaveText('No matches');
    await search.fill('4');
    await pressKeys(page, 'ArrowDown', 'Enter');
    await expect(picker(page)).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(page.getByText('Current: region-4 · last action: region-4')).toBeVisible();
    await expect(trigger.locator('[data-part="name"]')).toHaveText('Region 4');

    // Escape closes without choosing; the search starts empty each time.
    await pressKeys(page, 'Space');
    await expect(picker(page).getByRole('searchbox')).toHaveValue('');
    await pressKeys(page, 'Escape');
    await expect(picker(page)).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(page.getByText('Current: region-4')).toBeVisible();

    // Choosing the current one again is an action, not a change.
    await trigger.click();
    await rows(page).nth(0).click();
    await expect(page.getByText('Current: region-1 · last action: region-1')).toBeVisible();
    await trigger.click();
    await rows(page).nth(0).click();
    await expect(page.getByText('Current: region-1 · last action: region-1')).toBeVisible();
    await expectFocusKept(page);
  });

  test('without a search field the focus starts on the current row; rows with href are router links', async ({
    page,
  }) => {
    await openStory(page, 'shell-entityswitcher--variants');
    await switcher(page, 3).locator('[data-part="trigger"]').click();
    await expect(picker(page).getByRole('searchbox')).toHaveCount(0);
    await expect(rows(page).nth(3)).toBeFocused();
    await pressKeys(page, 'ArrowUp');
    await expect(rows(page).nth(2)).toBeFocused();
    await pressKeys(page, 'Home', 'ArrowUp');
    await expect(rows(page).nth(0)).toBeFocused();
    await pressKeys(page, 'Escape');

    await openStory(page, 'shell-entityswitcher--links');
    await switcher(page).locator('[data-part="trigger"]').click();
    const links = picker(page).locator('a[data-part="row"][data-router-link]');
    await expect(links).toHaveCount(5);
    await expect(links.nth(2)).toHaveAttribute('href', '#region-3');
    // The disabled one is no link.
    await expect(picker(page).locator('button[data-part="row"]')).toBeDisabled();
    await links.nth(2).click();
    await expect(page).toHaveURL(/#region-3$/);
    await expect(page.getByText('Current: region-3 · last action: region-3')).toBeVisible();
    await expect(picker(page)).toHaveCount(0);
  });

  test('the picker while loading, and with nothing to choose from', async ({ page }) => {
    await openStory(page, 'shell-entityswitcher--picker-states');
    await expect(picker(page).locator('[data-part="list"]')).toHaveAttribute('aria-busy', 'true');
    await expect(picker(page).locator('[data-part="skeleton"]')).toHaveCount(5);
    await expect(rows(page)).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(picker(page)).toHaveCount(0);
    // No entity: no steppers.
    await expect(switcher(page, 1).locator('[data-part="steppers"]')).toHaveCount(0);
    await switcher(page, 1).locator('[data-part="trigger"]').click();
    await expect(picker(page).getByRole('status')).toHaveText('Nothing to choose from');
    await expectFocusKept(page);
  });

  test('as it narrows: the name is cut, then the steppers hide, then the icon is left; the same both ways', async ({
    page,
  }) => {
    test.slow();
    await openStory(page, 'shell-entityswitcher--shrink');
    const read = () =>
      page.evaluate(() => {
        const el = document.querySelector<HTMLElement>('[data-umbra="entity-switcher"]')!;
        const name = el.querySelector<HTMLElement>('[data-part="name"]');
        return [
          el.dataset.shrink,
          name ? (name.scrollWidth > name.clientWidth ? 'cut' : 'whole') : 'none',
          el.querySelector('[data-part="steppers"]') ? 'steppers' : '',
        ].join(' ');
      });
    const { widths, down, up } = await sweep(page, '[data-umbra="entity-switcher"]', 280, 40, read);
    expect(Object.fromEntries(up)).toEqual(Object.fromEntries(down));
    expect(steps(widths, down)).toEqual(['0 whole steppers', '0 cut steppers', '1 cut ', '2 none ']);
    // Nothing is ever drawn outside the room it has.
    for (const width of [200, 120, 80, 50]) {
      await setParentWidth(page, '[data-umbra="entity-switcher"]', width);
      await settle(page);
      expect((await box(switcher(page))).width).toBeLessThanOrEqual(width + 0.5);
    }
    // Two sizes within one frame end on what the last one gives.
    await page.evaluate(() => {
      document.querySelector('[data-umbra="entity-switcher"]')!.parentElement!.dataset.target = '';
    });
    for (const [first, second] of [
      [280, 60],
      [50, 130],
      [60, 280],
    ] as const) {
      await resizeTwice(page, '[data-target]', first, second);
      await settle(page);
      expect(await read(), `${first} then ${second}`).toBe(down.get(second));
    }
  });

  test('cut or hidden, the name is the tooltip; with the icon alone it is also the accessible name', async ({
    page,
  }) => {
    await openStory(page, 'shell-entityswitcher--shrink');
    const all = page.locator('[data-umbra="entity-switcher"]');
    await expect(all.nth(0)).toHaveAttribute('data-shrink', '0');
    await expect(all.nth(3)).toHaveAttribute('data-shrink', '2');
    const icon = all.nth(3).locator('[data-part="trigger"]');
    await expect(icon).toHaveAccessibleName('Region 2 and its districts');
    await expect(icon.locator('[data-part="name"]')).toHaveCount(0);
    await all.nth(1).locator('[data-part="trigger"]').focus();
    await page.keyboard.press('Shift+Tab');
    await pressKeys(page, 'Tab');
    await expect(tooltip(page)).toHaveText('Region 2 and its districts');
    await pressKeys(page, 'Escape');
    // The whole name needs no tooltip.
    await all.nth(0).locator('[data-part="trigger"]').hover();
    await settle(page);
    await page.waitForTimeout(700);
    await expect(tooltip(page)).toHaveCount(0);
    // The picker still opens from the icon, and the tooltip gives way to it.
    await icon.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(tooltip(page)).toHaveCount(0);
  });

  test('in a SubNav: side by side steppers, and the icon alone at the last step of the bar', async ({
    page,
  }) => {
    await openStory(page, 'shell-entityswitcher--in-sub-nav');
    const bars = page.locator('[data-umbra="sub-nav"]');
    const wide = bars.nth(0).locator('[data-umbra="entity-switcher"]');
    await expect(wide).toHaveAttribute('data-shrink', '0');
    const [previous, next] = [
      await box(wide.locator('[data-part="previous"]')),
      await box(wide.locator('[data-part="next"]')),
    ];
    expect(previous.y).toBe(next.y);
    expect(next.x).toBeGreaterThanOrEqual(previous.x + previous.width);
    expect(previous.height).toBeGreaterThanOrEqual(24);
    // Nothing is taller than the bar.
    const bar = await box(bars.nth(0));
    expect((await box(wide)).height).toBeLessThanOrEqual(bar.height);
    // The middle bar has moved pages into "More" and keeps the whole switcher.
    await expect(bars.nth(1).getByRole('button', { name: 'More' })).toBeVisible();
    await expect(bars.nth(1).locator('[data-umbra="entity-switcher"]')).toHaveAttribute('data-shrink', '0');
    // The narrow bar is at its last step: the switcher stays, as its icon.
    const narrow = bars.nth(2).locator('[data-umbra="entity-switcher"]');
    await expect(narrow).toHaveAttribute('data-shrink', '2');
    await expect(narrow.locator('[data-part="trigger"]')).toHaveAccessibleName('Region 2');
    await narrow.locator('[data-part="trigger"]').click();
    await page.getByRole('dialog').locator('[data-part="row"]').nth(3).click();
    await expect(page.getByText('Current: region-4')).toBeVisible();
    await expectFocusKept(page);
  });

  test('in a PageHeader the switcher is the title; in a TopBar it takes the bar’s colour', async ({
    page,
  }) => {
    await openStory(page, 'shell-entityswitcher--in-page-header');
    const header = page.locator('[data-umbra="page-header"]').first();
    const title = header.getByRole('heading', { level: 1 });
    await expect(title.locator('[data-part="name"]')).toHaveText('Region 2');
    expect(await title.locator('[data-part="name"]').evaluate((el) => getComputedStyle(el).fontSize)).toBe(
      await title.evaluate((el) => getComputedStyle(el).fontSize),
    );
    // The chevrons sit between the mark and the name.
    const media = await box(header.locator('[data-part="media"]'));
    const steppers = await box(header.locator('[data-part="steppers"]'));
    const name = await box(header.locator('[data-part="name"]'));
    expect(steppers.x).toBeGreaterThanOrEqual(media.x + media.width);
    expect(name.x).toBeGreaterThanOrEqual(steppers.x + steppers.width);
    await header.getByRole('button', { name: 'Next: Region 3' }).click();
    await expect(title.locator('[data-part="name"]')).toHaveText('Region 3');
    await expect(header.locator('[data-part="subtitle"]')).toHaveText('26 teams');

    await openStory(page, 'shell-entityswitcher--in-top-bar');
    for (const bar of await page.locator('[data-umbra="top-bar"]').all()) {
      const colour = await bar.evaluate((el) => getComputedStyle(el).color);
      await expect(bar.locator('[data-umbra="entity-switcher"] [data-part="name"]')).toHaveCSS(
        'color',
        colour,
      );
      await expect(bar.locator('[data-umbra="entity-switcher"] [data-part="next"]')).toHaveCSS(
        'color',
        colour,
      );
    }
  });

  test('parts as a node, null and a function; the blocks composed by hand', async ({ page }) => {
    await openStory(page, 'shell-entityswitcher--parts-and-blocks');
    const custom = switcher(page, 0);
    await expect(custom.locator('svg[data-custom]')).toBeVisible();
    await expect(custom.locator('[data-part="caret"]')).toHaveCount(0);
    const bare = switcher(page, 1);
    await expect(bare.locator('[data-part="steppers"], [data-part="previous"]')).toHaveCount(0);
    await expect(bare.locator('em[data-part="name"]')).toHaveText('Region 1');
    await switcher(page, 2).locator('[data-part="trigger"]').click();
    await expect(picker(page).getByRole('searchbox')).toHaveCount(0);
    await expect(picker(page).locator('[data-custom-row] > [data-part="row"]')).toHaveCount(6);
    await page.keyboard.press('Escape');
    // From blocks, in the order they were given: steppers first.
    const blocks = switcher(page, 3);
    expect((await box(blocks.locator('[data-part="steppers"]'))).x).toBeLessThan(
      (await box(blocks.locator('[data-part="trigger"]'))).x,
    );
    await blocks.getByRole('button', { name: 'Next: Region 4' }).click();
    await expect(blocks.locator('[data-part="name"]')).toHaveText('Region 4');
  });

  test('right to left: the steppers are on the other side, and the picker opens under the trigger', async ({
    page,
  }) => {
    await openStory(page, 'shell-entityswitcher--default', { direction: 'rtl' });
    const root = switcher(page);
    expect((await box(root.locator('[data-part="steppers"]'))).x).toBeLessThan(
      (await box(root.locator('[data-part="trigger"]'))).x,
    );
    await root.locator('[data-part="trigger"]').click();
    const panel = await box(picker(page));
    const trigger = await box(root.locator('[data-part="trigger"]'));
    expect(Math.abs(panel.x + panel.width - (trigger.x + trigger.width))).toBeLessThanOrEqual(2);
    await pressKeys(page, 'ArrowDown');
    await expect(rows(page).nth(0)).toBeFocused();
  });
});

test.describe('WidgetBoard', () => {
  const grid = (page: Page) => page.locator('[data-umbra="widget-board"] [data-part="grid"]').first();
  const items = (page: Page) => grid(page).locator('> [data-part="item"]');
  /** The cards of the first board: where each one is, in source order. */
  const layout = (page: Page) =>
    grid(page).evaluate((el) =>
      [...el.children].map((item) => {
        const r = item.firstElementChild!.getBoundingClientRect();
        return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
      }),
    );
  const columnsOf = (cards: { x: number }[]) => new Set(cards.map((c) => c.x)).size;
  const gapOf = (page: Page) => grid(page).evaluate((el) => parseFloat(getComputedStyle(el).columnGap));

  test('packs the cards: content height each, no overlap, one gap between neighbours, source order kept', async ({
    page,
  }) => {
    await openStory(page, 'layout-widgetboard--default');
    const cards = await layout(page);
    const gap = await gapOf(page);
    expect(cards).toHaveLength(12);
    expect(columnsOf(cards)).toBe(4);
    // Different heights: each card hugs its content.
    expect(new Set(cards.map((c) => c.h)).size).toBeGreaterThan(5);
    // No two cards overlap.
    for (const [i, a] of cards.entries()) {
      for (const b of cards.slice(i + 1)) {
        const apart = a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
        expect(apart).toBe(true);
      }
    }
    // In a column each card starts one gap under the one above it (rows of one pixel round it up).
    for (const x of new Set(cards.map((c) => c.x))) {
      const column = cards.filter((c) => c.x === x).sort((a, b) => a.y - b.y);
      for (let i = 1; i < column.length; i++) {
        const space = column[i]!.y - (column[i - 1]!.y + column[i - 1]!.h);
        expect(space).toBeGreaterThanOrEqual(gap);
        expect(space).toBeLessThanOrEqual(gap + 1);
      }
    }
    // The first row is the first cards, left to right; every later card is in the shortest column then.
    const firstRow = cards.slice(0, 4);
    expect(new Set(firstRow.map((c) => c.y)).size).toBe(1);
    expect(firstRow.map((c) => c.x)).toEqual([...firstRow.map((c) => c.x)].sort((a, b) => a - b));
    for (let i = 4; i < cards.length; i++) {
      const bottoms = [...new Set(cards.map((c) => c.x))].map((x) =>
        Math.max(
          ...cards
            .slice(0, i)
            .filter((c) => c.x === x)
            .map((c) => c.y + c.h),
        ),
      );
      expect(cards[i]!.y).toBeLessThanOrEqual(Math.min(...bottoms) + gap + 1);
    }
    // The page keeps the source order, so the tab order is Widget 1, 2, 3...
    await expect(items(page).locator('[data-part="title"]')).toHaveText(
      Array.from({ length: 12 }, (_, i) => `Widget ${i + 1}`),
    );
    await expect(grid(page)).toHaveAttribute('role', 'list');
    await expect(page.getByRole('list', { name: 'Widgets' }).getByRole('listitem')).toHaveCount(12);
  });

  test('the board scrolls inside itself, the page does not, and the stack around it leaves its cards alone', async ({
    page,
  }) => {
    await openStory(page, 'layout-widgetboard--default', { width: 1024, height: 600 });
    const view = page.locator('[data-umbra="widget-board"] [data-part="viewport"]').first();
    const sizes = await view.evaluate((el) => ({ scroll: el.scrollHeight, client: el.clientHeight }));
    expect(sizes.scroll).toBeGreaterThan(sizes.client);
    expect(
      await page.evaluate(() => {
        const d = document.documentElement;
        return [d.scrollWidth - d.clientWidth, d.scrollHeight - d.clientHeight];
      }),
    ).toEqual([0, 0]);
    await expect(page.locator('[data-umbra="card"][data-collapsed="layout"]')).toHaveCount(0);
    // The end of the board is the end of the last card: no trailing gap is left to scroll.
    const end = await view.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
      const last = Math.max(
        ...[...el.querySelectorAll('[data-umbra="card"]')].map((card) => card.getBoundingClientRect().bottom),
      );
      return Math.round(el.getBoundingClientRect().bottom - last);
    });
    expect(end).toBeGreaterThanOrEqual(0);
    expect(end).toBeLessThanOrEqual(1);
    // The caret buttons are reached in source order.
    await page.getByRole('button', { name: 'Collapse all' }).focus();
    for (const n of [1, 2, 3]) {
      await pressKeys(page, 'Tab');
      const title = await page.evaluate(
        () =>
          document.activeElement!.closest('[data-umbra="card"]')!.querySelector('[data-part="title"]')!
            .textContent,
      );
      expect(title).toBe(`Widget ${n}`);
    }
  });

  test('the number of columns follows the width of the board alone: a sweep never flips it', async ({
    page,
  }) => {
    test.slow();
    await openStory(page, 'layout-widgetboard--default', { width: 1300, height: 640 });
    const read = async () => {
      const cards = await layout(page);
      // Every card is inside the board, whatever the width.
      const board = await box(page.locator('[data-umbra="widget-board"]').first());
      for (const c of cards) expect(c.x + c.w).toBeLessThanOrEqual(Math.ceil(board.x + board.width) + 1);
      return String(columnsOf(cards));
    };
    const widths = Array.from({ length: 161 }, (_, i) => 1300 - i * 5);
    const at = async (width: number) => {
      await page.setViewportSize({ width, height: 640 });
      await settle(page);
      return read();
    };
    const down = new Map<number, string>();
    for (const width of widths) down.set(width, await at(width));
    const up = new Map<number, string>();
    for (const width of [...widths].reverse()) up.set(width, await at(width));
    expect(Object.fromEntries(up)).toEqual(Object.fromEntries(down));
    // Fewer columns as it narrows, one at a time, never back.
    expect(steps(widths, down)).toEqual(['4', '3', '2', '1']);

    // Around one change, pixel by pixel.
    const edge = widths.find((w) => down.get(w) === '3')!;
    const fine = Array.from({ length: 12 }, (_, i) => edge + 8 - i);
    const fineDown: string[] = [];
    for (const width of fine) fineDown.push(await at(width));
    const fineUp: string[] = [];
    for (const width of [...fine].reverse()) fineUp.unshift(await at(width));
    expect(fineUp).toEqual(fineDown);
    expect(fineDown.filter((s, i) => i > 0 && s !== fineDown[i - 1]).length).toBe(1);

    // A fresh load at a width gives what the resize gave.
    for (const width of [1300, 1000, 700, 520]) {
      await openStory(page, 'layout-widgetboard--default', { width, height: 640 });
      expect(await read(), `fresh at ${width}`).toBe(down.get(width));
    }
  });

  test('a caret collapses one card and the cards under it follow; the board reports the ids', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openStory(page, 'layout-widgetboard--default');
    await expect(page.getByText('Collapsed: widget-2', { exact: true })).toBeVisible();
    const before = await layout(page);
    const gap = await gapOf(page);
    const first = items(page).nth(0);
    await first.getByRole('button', { name: 'Collapse' }).focus();
    await pressKeys(page, 'Enter');
    await expect(page.getByText('Collapsed: widget-2, widget-1', { exact: true })).toBeVisible();
    await expect(first.locator('[data-umbra="card"]')).toHaveAttribute('data-collapsed', 'user');
    const after = await layout(page);
    expect(after[0]!.h).toBeLessThan(before[0]!.h);
    // The next card of that column has moved up to one gap under it.
    const under = after.filter((c, i) => i > 0 && c.x === after[0]!.x).sort((a, b) => a.y - b.y)[0]!;
    expect(under.y - (after[0]!.y + after[0]!.h)).toBeGreaterThanOrEqual(gap);
    expect(under.y - (after[0]!.y + after[0]!.h)).toBeLessThanOrEqual(gap + 1);
    // Expanding it again gives the first layout back.
    await pressKeys(page, 'Enter');
    await expect(page.getByText('Collapsed: widget-2', { exact: true })).toBeVisible();
    expect(await layout(page)).toEqual(before);
  });

  test('pressed, a card’s height animates and the card under it follows frame by frame; a resize is instant', async ({
    page,
  }) => {
    await openStory(page, 'layout-widgetboard--default');
    const gap = await gapOf(page);
    // Slow the animation down so a state in between can be read.
    await grid(page).evaluate((el) => el.style.setProperty('--umbra-motion-duration-base', '1200ms'));
    const start = await layout(page);
    await items(page).nth(0).getByRole('button', { name: 'Collapse' }).click();
    await expect
      .poll(async () => {
        const now = await layout(page);
        return now[0]!.h < start[0]!.h - 4 && now[0]!.h > 80;
      })
      .toBe(true);
    // In between: the card under it is exactly one gap below the moving edge.
    const moving = await layout(page);
    const under = moving.filter((c, i) => i > 0 && c.x === moving[0]!.x).sort((a, b) => a.y - b.y)[0]!;
    expect(under.y - (moving[0]!.y + moving[0]!.h)).toBeGreaterThanOrEqual(gap - 1);
    expect(under.y - (moving[0]!.y + moving[0]!.h)).toBeLessThanOrEqual(gap + 2);
    await expect(items(page).nth(0).locator('[data-umbra="card"]')).not.toHaveAttribute('data-resizing');

    // A resize moves the cards at once: no transition or animation runs on any of them.
    await page.setViewportSize({ width: 1000, height: 720 });
    expect(await grid(page).evaluate((el) => el.getAnimations({ subtree: true }).length)).toBe(0);
    const resized = await layout(page);
    await settle(page);
    expect(await layout(page)).toEqual(resized);
  });

  test('“Collapse all” collapses every widget and becomes “Expand all”, keeping the focus', async ({
    page,
  }) => {
    await openStory(page, 'layout-widgetboard--default');
    const button = page.locator('[data-part="collapseAll"]').getByRole('button');
    await expect(button).toHaveText('Collapse all');
    await button.focus();
    await pressKeys(page, 'Enter');
    await expect(button).toHaveText('Expand all');
    await expect(button).toBeFocused();
    await expect(items(page).locator('[data-umbra="card"][data-collapsed="user"]')).toHaveCount(12);
    await expect(page.getByText(/^Collapsed: (widget-\d+, ){11}widget-\d+$/)).toBeVisible();
    // Collapsed, all twelve fit: they are packed as headers.
    const cards = await layout(page);
    expect(new Set(cards.map((c) => c.h)).size).toBe(1);
    // Opening one makes it "Collapse all" again.
    await items(page).nth(4).getByRole('button', { name: 'Show content' }).click();
    await expect(button).toHaveText('Collapse all');
    await button.focus();
    await pressKeys(page, 'Space');
    await expect(button).toHaveText('Expand all');
    await pressKeys(page, 'Space');
    await expect(button).toHaveText('Collapse all');
    await expect(page.getByText('Collapsed: none', { exact: true })).toBeVisible();
    await expect(items(page).locator('[data-umbra="card"][data-collapsed]')).toHaveCount(0);
  });

  test('span widens a widget, and is cut to the columns the board has; columns fixes the count', async ({
    page,
  }) => {
    await openStory(page, 'layout-widgetboard--spans', { width: 1920, height: 1080 });
    let cards = await layout(page);
    const gap = await gapOf(page);
    const one = cards[1]!.w;
    expect(Math.abs(cards[0]!.w - (2 * one + gap))).toBeLessThanOrEqual(1);
    expect(Math.abs(cards[4]!.w - (3 * one + 2 * gap))).toBeLessThanOrEqual(1);
    await page.setViewportSize({ width: 700, height: 600 });
    await settle(page);
    cards = await layout(page);
    expect(columnsOf(cards)).toBe(2);
    // Three columns asked for, two there: it takes the two.
    expect(Math.abs(cards[4]!.w - (2 * cards[1]!.w + gap))).toBeLessThanOrEqual(1);
    const board = await box(page.locator('[data-umbra="widget-board"]'));
    for (const c of cards) expect(c.x + c.w).toBeLessThanOrEqual(Math.ceil(board.x + board.width) + 1);

    for (const width of [1920, 1024]) {
      await openStory(page, 'layout-widgetboard--fixed-columns', { width, height: 720 });
      expect(columnsOf(await layout(page))).toBe(2);
    }
  });

  test('loading, empty and failed', async ({ page }) => {
    await openStory(page, 'layout-widgetboard--loading');
    const board = page.locator('[data-umbra="widget-board"]');
    await expect(board).toHaveAttribute('aria-busy', 'true');
    await expect(board.locator('[data-part="skeleton"]')).toHaveCount(6);
    await expect(board.locator('[data-umbra="card"]')).toHaveCount(0);
    await expect(board.locator('[data-part="toolbar"]')).toHaveCount(0);
    // The skeletons are packed like cards.
    expect(columnsOf(await layout(page))).toBeGreaterThan(1);

    await openStory(page, 'layout-widgetboard--empty');
    await expect(page.locator('[data-umbra="widget-board"] [data-part="empty"]')).toContainText(
      'No widgets yet',
    );
    await expect(page.getByRole('button', { name: 'Add a widget' })).toBeVisible();

    await openStory(page, 'layout-widgetboard--failed');
    const alert = page.getByRole('alert');
    await expect(alert).toContainText('The widgets could not be loaded');
    await alert.getByRole('button', { name: 'Try again' }).focus();
    await pressKeys(page, 'Enter');
    await expect(page.getByText('Retries: 1')).toBeVisible();
  });

  test('height="content": the board is as tall as its widgets and the card around it scrolls', async ({
    page,
  }) => {
    await openStory(page, 'layout-widgetboard--content-height', { width: 1024, height: 600 });
    const board = page.locator('[data-umbra="widget-board"]');
    await expect(board).toHaveAttribute('data-height', 'content');
    const inner = await board
      .locator('[data-part="viewport"]')
      .first()
      .evaluate((el) => el.scrollHeight - el.clientHeight);
    expect(inner).toBeLessThanOrEqual(1);
    const outer = await page
      .locator('[data-umbra="card"] > [data-part="body"] > [data-part="viewport"]')
      .first()
      .evaluate((el) => el.scrollHeight - el.clientHeight);
    expect(outer).toBeGreaterThan(0);
  });

  test('parts as a node, null and a function; the blocks composed by hand', async ({ page }) => {
    await openStory(page, 'layout-widgetboard--parts-and-blocks', { width: 1920, height: 1080 });
    const boards = page.locator('[data-umbra="widget-board"]');
    const own = boards.nth(0).getByRole('button', { name: 'Close every widget' });
    await own.click();
    await expect(boards.nth(0).getByRole('button', { name: 'Open every widget' })).toBeVisible();
    await expect(boards.nth(0).locator('[data-umbra="card"][data-collapsed="user"]')).toHaveCount(4);
    await expect(boards.nth(1).locator('[data-part="toolbar"]')).toHaveCount(0);
    await expect(boards.nth(1).locator('[data-umbra="card"]')).toHaveCount(4);

    const blocks = boards.nth(2);
    await expect(blocks.locator('[data-part="toolbar"]')).toContainText('My board');
    await expect(blocks.getByRole('list', { name: 'From blocks' }).getByRole('listitem')).toHaveCount(4);
    // The widget that cannot collapse has no caret and is left alone; the card built by hand follows the board.
    const always = blocks.locator('[data-part="item"]').nth(1);
    await expect(always.getByRole('button')).toHaveCount(0);
    await blocks.getByRole('button', { name: 'Fold all' }).click();
    await expect(blocks.getByRole('button', { name: 'Unfold all' })).toBeFocused();
    await expect(blocks.locator('[data-umbra="card"][data-collapsed="user"]')).toHaveCount(2);
    await expect(always.locator('[data-umbra="card"]')).not.toHaveAttribute('data-collapsed');
    await blocks.locator('[data-part="item"]').nth(2).getByRole('button', { name: 'Show content' }).click();
    await expect(blocks.getByRole('button', { name: 'Fold all' })).toBeVisible();
    await expectFocusKept(page);
  });

  test('beside other content it takes its share and scrolls by itself; right to left it starts from the right', async ({
    page,
  }) => {
    await openStory(page, 'layout-widgetboard--in-columns');
    const board = await box(page.locator('[data-umbra="widget-board"]'));
    const card = await box(page.locator('[data-umbra="columns"] > [data-umbra="card"]'));
    expect(Math.round(board.width / card.width)).toBe(2);
    expect(board.height).toBe(card.height);
    await expect(page.getByRole('list', { name: 'Team widgets' })).toBeVisible();

    await openStory(page, 'layout-widgetboard--default', { direction: 'rtl' });
    const cards = await layout(page);
    const firstRow = cards.slice(0, 4).map((c) => c.x);
    expect(firstRow).toEqual([...firstRow].sort((a, b) => b - a));
  });
});

test.describe('HorizontalScroller', () => {
  const root = (page: Page, n = 0) => page.locator('[data-umbra="horizontal-scroller"]').nth(n);
  const view = (page: Page, n = 0) => root(page, n).locator('[data-part="viewport"]').first();
  const cells = (page: Page, n = 0) => root(page, n).locator('[data-part="item"]');
  const scrolled = (page: Page, n = 0) => view(page, n).evaluate((el) => Math.abs(Math.round(el.scrollLeft)));
  const previous = (page: Page, n = 0) => root(page, n).getByRole('button', { name: 'Previous' });
  const next = (page: Page, n = 0) => root(page, n).getByRole('button', { name: 'Next' });
  /** How far the leading edge of the first item that is fully in view is from the leading edge of the row. */
  const lead = (page: Page, rtl = false) =>
    view(page).evaluate((el, isRtl) => {
      const frame = el.getBoundingClientRect();
      const offsets = [...el.querySelectorAll('[data-part="item"]')].map((item) => {
        const r = item.getBoundingClientRect();
        return isRtl ? frame.right - r.right : r.left - frame.left;
      });
      return Math.round(Math.min(...offsets.filter((o) => o >= -1)));
    }, rtl);

  test('a row that is too narrow scrolls inside itself: a list, with a button at the edge that has more', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openStory(page, 'layout-horizontalscroller--default', { width: 700 });
    await expect(page.getByRole('list', { name: 'Summary' }).getByRole('listitem')).toHaveCount(11);
    // The page does not scroll sideways, and the row does.
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
    const sizes = await view(page).evaluate((el) => ({
      scroll: el.scrollWidth,
      client: el.clientWidth,
    }));
    expect(sizes.scroll).toBeGreaterThan(sizes.client);
    // The row is as tall as its items, and the card under it has the rest.
    expect((await box(root(page))).height).toBe((await box(cells(page).first())).height);
    await expect(page.locator('[data-umbra="card"][data-collapsed]')).toHaveCount(0);
    // The last item in view is cut by the edge.
    const frame = await box(view(page));
    const cut = await cells(page).evaluateAll(
      (all, right) => all.filter((el) => el.getBoundingClientRect().left < right).length,
      frame.x + frame.width,
    );
    expect(cut).toBeLessThan(11);

    await expect(previous(page)).toHaveCount(0);
    await expect(root(page).locator('[data-umbra="scroll-area"]')).toHaveAttribute('data-fade-end', 'true');
    await expect(root(page).locator('[data-umbra="scroll-area"]')).not.toHaveAttribute('data-fade-start');
    await next(page).focus();
    await pressKeys(page, 'Enter');
    await expect.poll(() => scrolled(page)).toBeGreaterThan(0);
    // It stops at the start of an item, and "previous" is there now.
    expect(await lead(page)).toBeLessThanOrEqual(1);
    await expect(previous(page)).toBeVisible();
    await expect(root(page).locator('[data-umbra="scroll-area"]')).toHaveAttribute('data-fade-start', 'true');
    // The item that was cut is now the first one: nothing was skipped.
    const first = await cells(page).evaluateAll(
      (all, left) => all.findIndex((el) => el.getBoundingClientRect().left >= left - 1),
      frame.x,
    );
    expect(first).toBe(cut - 1);

    // To the end: "next" goes, and the focus moves to "previous" instead of being lost.
    await pressKeys(page, 'Enter', 'Enter');
    await expect(next(page)).toHaveCount(0);
    await expect(previous(page)).toBeFocused();
    const max = await view(page).evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(await scrolled(page)).toBe(max);
    // And back to the start: "previous" goes, the focus moves to "next".
    await pressKeys(page, 'Enter', 'Enter', 'Enter');
    await expect(previous(page)).toHaveCount(0);
    await expect(next(page)).toBeFocused();
    expect(await scrolled(page)).toBe(0);
  });

  test('a button scrolls to the start of an item, and under reduced motion it is there at once', async ({
    page,
  }) => {
    await openStory(page, 'layout-horizontalscroller--default', { width: 700 });
    await next(page).click();
    await expect.poll(() => scrolled(page)).toBe(600);
    expect(await lead(page)).toBeLessThanOrEqual(1);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openStory(page, 'layout-horizontalscroller--default', { width: 700 });
    // Read in the same task as the press: nothing is animated.
    const target = await next(page).evaluate((button: HTMLElement) => {
      button.click();
      return Math.round(
        button.closest('[data-umbra="horizontal-scroller"]')!.querySelector('[data-part="viewport"]')!
          .scrollLeft,
      );
    });
    expect(target).toBe(600);
  });

  test('the arrow keys move between items on top of the tab order, and bring the item into view', async ({
    page,
  }) => {
    await openStory(page, 'layout-horizontalscroller--interactive');
    const control = (n: number) => cells(page).nth(n).locator('a, button').first();
    await control(0).focus();
    await pressKeys(page, 'ArrowRight');
    await expect(control(1)).toBeFocused();
    await pressKeys(page, 'ArrowRight', 'ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'ArrowLeft');
    await expect(control(0)).toBeFocused();
    // Tab is untouched: it goes to the next item too.
    await pressKeys(page, 'Tab');
    await expect(control(1)).toBeFocused();
    await pressKeys(page, 'End');
    await expect(control(10)).toBeFocused();
    await expect(control(10)).toBeInViewport({ ratio: 1 });
    await expect.poll(() => scrolled(page)).toBeGreaterThan(0);
    await pressKeys(page, 'ArrowRight');
    await expect(control(10)).toBeFocused();
    await pressKeys(page, 'Enter');
    await expect(page.getByText('Last pressed: Item 11')).toBeVisible();
    await pressKeys(page, 'Home');
    await expect(control(0)).toBeFocused();
    await expect(control(0)).toBeInViewport({ ratio: 1 });
    // With a modifier the keys are the browser's.
    await pressKeys(page, 'Shift+ArrowRight');
    await expect(control(0)).toBeFocused();
  });

  test('onReachEnd is called once each time the far edge is reached', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openStory(page, 'layout-horizontalscroller--interactive');
    await expect(page.getByText('reached the end: 0')).toBeVisible();
    await view(page).evaluate((el) => el.scrollTo({ left: el.scrollWidth }));
    await expect(page.getByText('reached the end: 1')).toBeVisible();
    await view(page).evaluate((el) => el.scrollTo({ left: 0 }));
    // The row has seen that it left the end (its scroll event has been handled) before it goes back.
    await expect(root(page).locator('[data-umbra="scroll-area"]')).toHaveAttribute('data-fade-end', 'true');
    await expect(previous(page)).toHaveCount(0);
    await view(page).evaluate((el) => el.scrollTo({ left: el.scrollWidth }));
    await expect(page.getByText('reached the end: 2')).toBeVisible();
  });

  test('a vertical wheel is left alone; a sideways one scrolls the row', async ({ page }) => {
    await openStory(page, 'layout-horizontalscroller--default');
    const frame = await box(view(page));
    await page.mouse.move(frame.x + 200, frame.y + frame.height / 2);
    await page.mouse.wheel(0, 240);
    await settle(page);
    expect(await scrolled(page)).toBe(0);
    await page.mouse.wheel(240, 0);
    await expect.poll(() => scrolled(page)).toBeGreaterThan(0);
  });

  test('items without a control: the row itself is the tab stop and the arrow keys scroll it', async ({
    page,
  }) => {
    await openStory(page, 'layout-horizontalscroller--default');
    await expect(view(page)).toHaveAttribute('tabindex', '0');
    await expect(view(page)).toHaveAccessibleName('Summary');
    await view(page).focus();
    await pressKeys(page, 'ArrowRight', 'ArrowRight');
    await expect.poll(() => scrolled(page)).toBeGreaterThan(0);
    await expect(view(page)).toBeFocused();
    // With controls inside, it is not a tab stop of its own.
    await openStory(page, 'layout-horizontalscroller--interactive');
    await expect(view(page)).not.toHaveAttribute('tabindex');
  });

  test('scrolling comes to rest at the start of an item; the thumb shows only when asked for', async ({
    page,
  }) => {
    await openStory(page, 'layout-horizontalscroller--variants');
    await expect(view(page, 0)).toHaveCSS('scroll-snap-type', 'x');
    await expect(cells(page, 0).first()).toHaveCSS('scroll-snap-align', 'start');
    await expect(view(page, 1)).toHaveCSS('scroll-snap-type', 'none');
    // The default draws no thumb at all; `auto` and `hover` keep the thin one of a ScrollArea.
    const thumb = (n: number) =>
      view(page, n).evaluate((el) => getComputedStyle(el, '::-webkit-scrollbar').display);
    expect(await thumb(0)).not.toBe('none');
    expect(await thumb(1)).not.toBe('none');
    expect(await thumb(2)).toBe('none');
    // Items of their own width, with the wider gap.
    const widths = await cells(page, 2).evaluateAll((all) =>
      all.map((el) => el.getBoundingClientRect().width),
    );
    expect(new Set(widths.map(Math.round)).size).toBeGreaterThan(3);
    const [a, b] = [await box(cells(page, 2).nth(0)), await box(cells(page, 2).nth(1))];
    expect(Math.round(b.x - (a.x + a.width))).toBe(32);
    await expect(root(page, 2).locator('[data-umbra="scroll-area"]')).not.toHaveAttribute('data-fade-end');
    await expect(view(page, 2)).toHaveCSS('mask-image', /linear-gradient/);
  });

  test('few items: nothing to scroll, no button and no fade', async ({ page }) => {
    await openStory(page, 'layout-horizontalscroller--fits');
    await expect(cells(page)).toHaveCount(3);
    await expect(root(page).getByRole('button')).toHaveCount(0);
    await expect(root(page).locator('[data-umbra="scroll-area"]')).not.toHaveAttribute('data-fade-end');
    // Narrowed until it overflows, the button comes; widened, it goes.
    await page.setViewportSize({ width: 500, height: 720 });
    await expect(next(page)).toBeVisible();
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(next(page)).toHaveCount(0);
  });

  test('loading, empty and failed', async ({ page }) => {
    await openStory(page, 'layout-horizontalscroller--states');
    await expect(root(page, 0)).toHaveAttribute('aria-busy', 'true');
    await expect(root(page, 0).locator('[data-part="skeleton"]')).toHaveCount(6);
    await expect(root(page, 0).locator('[data-umbra="summary-tile"]')).toHaveCount(0);
    expect((await box(root(page, 0).locator('[data-part="skeleton"]').first())).width).toBe(180);
    await expect(root(page, 1).locator('[data-part="empty"]')).toContainText('No items yet');
    const alert = root(page, 2).getByRole('alert');
    await expect(alert).toContainText('Something went wrong');
    await alert.getByRole('button', { name: 'Try again' }).focus();
    await pressKeys(page, 'Enter');
    await expect(page.getByText('Retries: 1')).toBeVisible();
  });

  test('given a share of the height, the items stretch to it', async ({ page }) => {
    await openStory(page, 'layout-horizontalscroller--fills-height');
    const row = await box(root(page));
    expect(row.height).toBeGreaterThan(200);
    const card = await box(cells(page).first().locator('[data-umbra="card"]'));
    expect(card.height).toBe(row.height);
    expect(card.width).toBe(320);
    // The cards belong to the row: the stack around it does not collapse them.
    await expect(root(page).locator('[data-umbra="card"][data-collapsed]')).toHaveCount(0);
  });

  test('parts as a node, null and a function; the blocks composed by hand', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openStory(page, 'layout-horizontalscroller--parts-and-blocks');
    await expect(root(page, 0).getByRole('button')).toHaveCount(0);
    await expect(root(page, 0).locator('[data-part="previous"], [data-part="next"]')).toHaveCount(0);
    await root(page, 1).getByRole('button', { name: 'More' }).click();
    expect(await scrolled(page, 1)).toBeGreaterThan(0);
    await expect(root(page, 1).locator('[data-custom]')).toBeVisible();
    // From blocks: an item sets its own width over the row's.
    await expect(root(page, 2).getByRole('list', { name: 'From blocks' }).getByRole('listitem')).toHaveCount(
      8,
    );
    expect((await box(cells(page, 2).nth(0))).width).toBe(320);
    expect((await box(cells(page, 2).nth(1))).width).toBe(200);
  });

  test('right to left: the row starts from the right, and buttons and arrow keys follow what is drawn', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openStory(page, 'layout-horizontalscroller--default', { direction: 'rtl', width: 700 });
    const frame = await box(view(page));
    const first = await box(cells(page).first());
    expect(Math.abs(first.x + first.width - (frame.x + frame.width))).toBeLessThanOrEqual(1);
    // "Next" is at the left edge, and its arrow points left.
    const button = await box(next(page));
    expect(button.x).toBeLessThan(frame.x + frame.width / 2);
    expect(
      await next(page)
        .locator('[data-mirror]')
        .evaluate((el) => getComputedStyle(el).scale),
    ).toBe('-1 1');
    await next(page).click();
    expect(await scrolled(page)).toBeGreaterThan(0);
    expect(await lead(page, true)).toBeLessThanOrEqual(1);
    await expect(previous(page)).toBeVisible();
    expect((await box(previous(page))).x).toBeGreaterThan(frame.x + frame.width / 2);

    await openStory(page, 'layout-horizontalscroller--interactive', { direction: 'rtl' });
    const control = (n: number) => cells(page).nth(n).locator('a, button').first();
    await control(0).focus();
    await pressKeys(page, 'ArrowLeft');
    await expect(control(1)).toBeFocused();
    expect((await box(control(1))).x).toBeLessThan((await box(control(0))).x);
    await pressKeys(page, 'ArrowRight');
    await expect(control(0)).toBeFocused();
  });
});
