import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectChangeHighlights } from './live';

// Behaviour of the Data value components that a still image cannot show: fallbacks, names for
// assistive technology, keyboard and focus, and every "show less as it shrinks" step.
const open = async (page: Page, id: string, width = 1280, height = 720, density = 'default') => {
  await page.setViewportSize({ width, height });
  await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=density:${density}`);
  await page.locator('#storybook-root > *').first().waitFor();
  await page.evaluate(async () => {
    await Promise.all(
      [...document.fonts].filter((f) => f.unicodeRange.startsWith('U+0-FF')).map((f) => f.load()),
    );
    await document.fonts.ready;
  });
};

const section = (page: Page, label: string) => page.locator('section', { hasText: label });
const clipped = (locator: Locator) => locator.evaluate((el) => el.scrollWidth > el.clientWidth);
const fits = (locator: Locator) => locator.evaluate((el) => el.scrollWidth <= el.clientWidth + 1);

test.describe('Avatar', () => {
  test('an image that fails falls back to the initials, then to the silhouette, and keeps its name', async ({
    page,
  }) => {
    await open(page, 'data-avatar--avatars');
    const failing = section(page, 'An image that fails').locator('[data-umbra="avatar"]');
    await expect(failing.nth(0).locator('[data-part="initials"]')).toHaveText('PC');
    await expect(failing.nth(0).getByRole('img', { name: 'Person C' })).toBeVisible();
    await expect(failing.nth(1).locator('[data-part="fallback"] svg')).toBeVisible();
    await expect(failing.nth(1).getByRole('img', { name: 'Unknown person' })).toBeVisible();
    await expect(failing.locator('img')).toHaveCount(0);
    // A loaded image is an <img> named by `alt` or `name`.
    await expect(page.getByRole('img', { name: 'Person A' }).first()).toHaveJSProperty('tagName', 'IMG');
  });

  test('without a size the avatar is as tall as a control at every density', async ({ page }) => {
    for (const [density, size] of [
      ['compact', 28],
      ['default', 36],
      ['spacious', 44],
    ] as const) {
      await open(page, 'data-avatar--avatars', 1280, 720, density);
      const box = await page.locator('[data-umbra="avatar"][data-size="density"]').first().boundingBox();
      expect([box!.width, box!.height]).toEqual([size, size]);
    }
  });

  test('a group counts the avatars over `max` and those that do not fit in "+N"', async ({ page }) => {
    await open(page, 'data-avatar--groups');
    const group = (name: string) => page.getByRole('group', { name, exact: true });
    const shown = (name: string) => group(name).locator('[data-part="initials"]');
    const more = (name: string) => group(name).locator('[data-part="overflow"]');

    await expect(shown('Team').first()).toBeVisible();
    await expect(section(page, 'All fit').locator('[data-part="overflow"]')).toHaveCount(0);
    await expect(section(page, 'max={3}').locator('[data-part="initials"]')).toHaveCount(3);
    await expect(section(page, 'max={3}').locator('[data-part="overflow"]')).toHaveText('+4');
    await expect(section(page, 'max={3}').getByRole('img', { name: '4 more' })).toBeVisible();
    await expect(section(page, 'total={40}').locator('[data-part="overflow"]')).toHaveText('+36');

    // Narrow groups show fewer avatars, never overflow, and always account for all seven.
    for (const name of ['Narrow team', 'Narrower team']) {
      const count = await shown(name).count();
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThan(7);
      await expect(more(name)).toHaveText(`+${7 - count}`);
      expect(await fits(group(name))).toBe(true);
    }
    expect(await shown('Narrow team').count()).toBeGreaterThan(await shown('Narrower team').count());
    // The first avatar always stays.
    await expect(shown('Narrowest team')).toHaveCount(1);
    await expect(more('Narrowest team')).toHaveText('+6');
  });
});

test.describe('EntityIcon', () => {
  test('a mark without a label is a named image; next to its label it is decorative', async ({ page }) => {
    await open(page, 'data-entityicon--marks');
    const first = section(page, 'Image, icon, generated');
    await expect(first.getByRole('img', { name: 'Region 2' })).toHaveText('R');
    // The broken image falls back to the generated mark, or to the icon when there is one.
    await expect(first.getByRole('img', { name: 'Client B' })).toHaveAttribute('data-kind', 'generated');
    await expect(first.getByRole('img', { name: 'Web orders' })).toHaveAttribute('data-kind', 'icon');

    const labelled = section(page, 'With a label').locator('[data-umbra="entity-icon"]').first();
    await expect(labelled.locator('[data-part="label"]')).toHaveText('Region 2');
    await expect(labelled.locator('[data-part="mark"]')).toHaveAttribute('aria-hidden', 'true');
    await expect(labelled.getByRole('img')).toHaveCount(0);
  });

  test('the generated colour is the same for the same name and differs between names', async ({ page }) => {
    await open(page, 'data-entityicon--marks');
    const colour = (name: string) =>
      page
        .getByRole('img', { name, exact: true })
        .first()
        .evaluate((el) => getComputedStyle(el).backgroundColor);
    const sizes = page
      .locator('section', { hasText: 'Sizes xs to xl' })
      .getByRole('img', { name: 'Client B' });
    const all = await sizes.evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor));
    expect(new Set(all).size).toBe(1);
    expect(await colour('Region 1')).not.toBe(await colour('Region 2'));
    // One letter up to `sm`, two from `md`.
    await expect(sizes).toHaveText(['C', 'C', 'CB', 'CB', 'CB']);
  });

  test('a label that does not fit truncates and the mark keeps its size', async ({ page }) => {
    await open(page, 'data-entityicon--marks');
    const narrow = section(page, 'A label that does not fit').locator('[data-umbra="entity-icon"]');
    for (const icon of await narrow.all()) {
      expect(await clipped(icon.locator('[data-part="label"]'))).toBe(true);
      expect((await icon.boundingBox())!.width).toBeLessThanOrEqual(140);
    }
    expect((await narrow.nth(1).locator('[data-part="mark"]').boundingBox())!.width).toBe(24);
  });
});

test.describe('KeyValue', () => {
  test('rows share one label column, and long values truncate or wrap', async ({ page }) => {
    await open(page, 'data-keyvalue--rows');
    const starts = await page
      .locator('dl[aria-label="Contract"]')
      .locator('dd[data-part="value"]')
      .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().left)));
    expect(starts).toHaveLength(5);
    expect(new Set(starts).size).toBe(1);

    const truncated = page.locator('dl[aria-label="Truncated"]');
    expect(await clipped(truncated.locator('dd').nth(1))).toBe(true);
    expect(await clipped(truncated.locator('dt span').first())).toBe(true);
    expect(await fits(truncated)).toBe(true);
    // The whole value is the tooltip of a truncated one. A value that fits or wraps has none.
    const tooltip = page.getByRole('tooltip');
    const long = truncated.locator('dd').nth(1);
    await long.hover();
    await expect(tooltip).toHaveText((await long.textContent())!);
    await page.locator('dl[aria-label="Wrapped"] dd').first().hover();
    await page.waitForTimeout(700);
    await expect(tooltip).toHaveCount(0);

    const wrapped = page.locator('dl[aria-label="Wrapped"]');
    for (const value of await wrapped.locator('dd').all()) {
      expect(await clipped(value)).toBe(false);
      expect((await value.boundingBox())!.height).toBeGreaterThan(30);
    }
    expect(await fits(wrapped)).toBe(true);
  });

  test('a single KeyValue is a one-row description list; a list holds its rows in one', async ({ page }) => {
    await open(page, 'data-keyvalue--rows');
    const single = section(page, 'A single KeyValue').locator('[data-umbra="key-value"]').first();
    await expect(single).toHaveJSProperty('tagName', 'DL');
    const row = page.locator('dl[aria-label="Contract"] > [data-umbra="key-value"]').first();
    await expect(row).toHaveJSProperty('tagName', 'DIV');
    await expect(row.locator('dt')).toHaveText('Client');
  });

  test('the grid uses fewer columns in a narrow card', async ({ page }) => {
    await open(page, 'data-keyvalue--layouts');
    const columns = (name: string) =>
      page
        .locator(`dl[aria-label="${name}"] > *`)
        .evaluateAll((els) => new Set(els.map((el) => Math.round(el.getBoundingClientRect().left))).size);
    expect(await columns('Grid of three')).toBe(3);
    expect(await columns('Narrow grid')).toBeLessThan(3);
    expect(await columns('Facts in columns')).toBe(4);
    expect(await fits(page.locator('dl[aria-label="Narrow grid"]'))).toBe(true);
  });

  test('loading is busy, empty shows its text, and the retry action of an error is reachable', async ({
    page,
  }) => {
    await open(page, 'data-keyvalue--states');
    const loading = page.locator('[data-umbra="key-value-list"][aria-label="Loading"]');
    await expect(loading).toHaveAttribute('aria-busy', 'true');
    await expect(loading.locator('[data-umbra="key-value"]')).toHaveCount(4);
    await expect(page.locator('[aria-label="Loading two"] [data-umbra="key-value"]')).toHaveCount(2);
    await expect(page.locator('[aria-label="Empty"]')).toHaveText('No data');
    await expect(page.locator('[aria-label="Empty contract"]')).toHaveText('No contract yet.');

    const failed = page.locator('[aria-label="Failed"]');
    await expect(failed.getByRole('alert')).toContainText('could not be loaded');
    await expect(failed.locator('dt')).toHaveCount(0);
    await page.keyboard.press('Tab');
    await expect(failed.getByRole('button', { name: 'Try again' })).toBeFocused();
  });
});

test.describe('StatValue', () => {
  test('each step hides one more piece as the card gets shorter; the value stays', async ({ page }) => {
    await open(page, 'data-statvalue--shrinking');
    // Per size: the font size of the value at full size, and one step down.
    const fonts = { md: ['19px', '16px'], lg: ['28px', '19px'], xl: ['40px', '28px'] } as const;
    for (const [size, [full, small]] of Object.entries(fonts)) {
      const stats = page.locator(`[data-umbra="stat-value"][data-size="${size}"]`);
      await expect(stats).toHaveCount(4);
      const visible = async (index: number) => {
        const stat = stats.nth(index);
        return Promise.all(
          ['caption', 'meter', 'label', 'value'].map((part) =>
            stat.locator(`[data-part="${part}"]`).isVisible(),
          ),
        );
      };
      expect(await visible(0), `${size}: everything`).toEqual([true, true, true, true]);
      expect(await visible(1), `${size}: caption hidden`).toEqual([false, true, true, true]);
      expect(await visible(2), `${size}: meter hidden`).toEqual([false, false, true, true]);
      expect(await visible(3), `${size}: label hidden`).toEqual([false, false, false, true]);
      await expect(stats.nth(2).locator('[data-part="figure"]')).toHaveCSS('font-size', full);
      await expect(stats.nth(3).locator('[data-part="figure"]')).toHaveCSS('font-size', small);
      // A hidden label still names the group.
      await expect(page.getByRole('group', { name: 'Available' })).toHaveCount(12);
      // Nothing is cut off at any step.
      for (const body of await page.locator('[data-umbra="card"] [data-part="body"]').all()) {
        expect(await body.evaluate((el) => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
      }
    }
  });

  test('a value that does not fit truncates, and loading marks the stat busy', async ({ page }) => {
    await open(page, 'data-statvalue--stats');
    const narrow = section(page, 'A value that does not fit').locator('[data-umbra="stat-value"]');
    expect(await clipped(narrow.locator('[data-part="value"]'))).toBe(true);
    await expect(narrow.locator('[data-part="unit"]')).toBeVisible();
    expect((await narrow.boundingBox())!.width).toBeLessThanOrEqual(120);

    const loading = section(page, 'Loading').locator('[data-umbra="stat-value"]');
    await expect(loading.first()).toHaveAttribute('aria-busy', 'true');
    await expect(loading.first().locator('[data-part="value"]')).toHaveCount(0);
    await expect(loading.first().locator('[data-part="label"]')).toHaveText('Orders');
    await expect(page.getByRole('group', { name: 'Open orders' })).toHaveText('12');
  });
});

test.describe('SummaryTile', () => {
  test('a tile is one tab stop; Enter and Space press a button tile, and a disabled tile is skipped', async ({
    page,
  }) => {
    await open(page, 'data-summarytile--tiles');
    const advice = page.getByRole('button', { name: /Advice/ });
    const duties = page.getByRole('button', { name: /Duties/ });
    await expect(advice).toHaveAttribute('aria-pressed', 'true');
    await expect(duties).toHaveAttribute('aria-pressed', 'false');

    await page.getByRole('link', { name: /No icon/ }).focus();
    await expect(page.getByRole('link', { name: /No icon/ })).toHaveAttribute('aria-current', 'true');
    await page.keyboard.press('Tab');
    await expect(advice).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(duties).toBeFocused();
    // The focus ring is drawn inside the tile, in the focus colour.
    await expect(duties).toHaveCSS('outline-style', 'solid');
    await expect(duties).toHaveCSS('outline-offset', '-2px');

    await page.keyboard.press('Enter');
    await expect(page.getByText('Pressed 1 times')).toBeVisible();
    await expect(duties).toHaveAttribute('aria-pressed', 'true');
    await expect(advice).toHaveAttribute('aria-pressed', 'false');
    await expect(
      page.locator('[data-umbra="summary-tile"][data-selected]', { hasText: 'Duties' }),
    ).toBeVisible();
    await page.keyboard.press('Space');
    await expect(page.getByText('Pressed 2 times')).toBeVisible();

    // The disabled button is skipped: the next stop is the loading link (the static tile has no stop).
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: /Targets/ })).toBeFocused();
    await page.locator('[data-umbra="summary-tile"][data-disabled]').first().click({ force: true });
    await expect(page.getByText('Pressed 2 times')).toBeVisible();
  });

  test('hover lightens a tile and darkens a selected one', async ({ page }) => {
    await open(page, 'data-summarytile--tiles');
    const background = (tile: Locator) => tile.evaluate((el) => getComputedStyle(el).backgroundColor);
    for (const name of [/Advice Insights/, /No icon/]) {
      const tile = page.getByRole('link', { name });
      const rest = await background(tile);
      await tile.hover();
      await expect(tile).toHaveAttribute('data-hovered', 'true');
      await expect.poll(() => background(tile)).not.toBe(rest);
    }
    await expect(page.locator('[data-umbra="summary-tile"][data-loading]')).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });

  test('as a tile narrows the caption hides, then the trend, then the icon', async ({ page }) => {
    await open(page, 'data-summarytile--narrowing');
    const tiles = page.locator('[data-umbra="summary-tile"]');
    const expected = [
      [true, true, true],
      [false, true, true],
      [false, false, true],
      [false, false, false],
      [false, false, false],
    ];
    for (const [index, parts] of expected.entries()) {
      const tile = tiles.nth(index);
      const visible = await Promise.all(
        ['caption', 'trend', 'icon'].map((part) => tile.locator(`[data-part="${part}"]`).isVisible()),
      );
      expect(visible, `tile ${index}`).toEqual(parts);
      await expect(tile.locator('[data-part="title"]')).toBeVisible();
      await expect(tile.locator('[data-part="value"]')).toBeVisible();
      expect(await fits(tile.locator('[data-part="surface"]'))).toBe(true);
    }
    expect(await clipped(tiles.nth(4).locator('[data-part="title"]'))).toBe(true);
    // A truncated title is whole in a tooltip; a title that fits has none.
    const tooltip = page.getByRole('tooltip');
    const title = tiles.nth(4).locator('[data-part="title"]');
    await title.hover();
    await expect(tooltip).toHaveText((await title.textContent())!);
    await tiles.nth(0).locator('[data-part="title"]').hover();
    await page.waitForTimeout(700);
    await expect(tooltip).toHaveCount(0);
  });

  test('tiles are layout children: they share a row equally and fill a stack by weight', async ({ page }) => {
    await open(page, 'data-summarytile--in-layout');
    const row = page.locator('[data-umbra="columns"] [data-umbra="columns"] [data-umbra="summary-tile"]');
    const widths = await row.evaluateAll((els) =>
      els.map((el) => Math.round(el.getBoundingClientRect().width)),
    );
    expect(widths).toHaveLength(4);
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(1);
    expect(await clipped(row.nth(1).locator('[data-part="value"]'))).toBe(true);

    const heights = await Promise.all(
      ['Open', 'Late', 'Done'].map(
        async (title) =>
          (await page.getByRole('link', { name: new RegExp(`^${title}`) }).boundingBox())!.height,
      ),
    );
    expect(Math.abs(heights[0]! - heights[1]!)).toBeLessThanOrEqual(1);
    expect(heights[2]! / heights[0]!).toBeGreaterThan(1.9);
  });
});

test.describe('highlightChanges', () => {
  test('StatValue: a changed value flashes once with a sign for its direction', async ({ page }) => {
    await expectChangeHighlights(page, 'data-statvalue--live-updates');
  });
  test('KeyValue: a changed value flashes once with a sign for its direction', async ({ page }) => {
    await expectChangeHighlights(page, 'data-keyvalue--live-updates');
  });
  test('SummaryTile: a changed value flashes once with a sign for its direction', async ({ page }) => {
    await expectChangeHighlights(page, 'data-summarytile--live-updates');
  });
});
