import { expect, test, type Locator, type Page } from '@playwright/test';
import { contrast, pixels } from './pixels';

// Banner and Legend: keyboard, focus, roles, and each step of "show less as it narrows".
const open = async (page: Page, id: string, width = 1280, height = 720) => {
  await page.setViewportSize({ width, height });
  await page.goto(`/iframe.html?id=${id}&viewMode=story`);
  await page.locator('#storybook-root > *').first().waitFor();
  // Load every Latin font face now: a face that loads later restarts the shrink levels.
  await page.evaluate(async () => {
    await Promise.all(
      [...document.fonts].filter((f) => f.unicodeRange.startsWith('U+0-FF')).map((f) => f.load()),
    );
    await document.fonts.ready;
  });
};
const box = async (locator: Locator) => (await locator.boundingBox())!;
const banner = (page: Page, text: string) => page.locator('[data-umbra="banner"]', { hasText: text });

test.describe('Banner', () => {
  test('the role follows the tone and `live`', async ({ page }) => {
    await open(page, 'data-banner--dismissal');
    await expect(banner(page, 'It hides itself')).toHaveAttribute('role', 'status');
    await expect(banner(page, 'The app decides')).toHaveAttribute('role', 'alert');
    await expect(banner(page, 'Not announced')).not.toHaveAttribute('role');
  });

  test('each tone has a different default icon', async ({ page }) => {
    await open(page, 'data-banner--tones');
    const icons = await page
      .locator('[data-umbra="banner"][data-variant="subtle"] [data-part="icon"] svg')
      .evaluateAll((all) => all.map((svg) => svg.innerHTML));
    expect(icons).toHaveLength(6);
    expect(new Set(icons).size).toBe(6);
  });

  test('the dismiss button works from the keyboard, uncontrolled and controlled', async ({ page }) => {
    await open(page, 'data-banner--dismissal');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Dismiss', exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(banner(page, 'It hides itself')).toHaveCount(0);
    await expect(page.getByText('Dismissed: 1.')).toBeVisible();

    // The controlled banner hides only because the app sets `open`, and comes back when it does.
    const close = page.getByRole('button', { name: 'Close the warning' });
    await close.focus();
    await page.keyboard.press('Space');
    await expect(banner(page, 'The app decides')).toHaveCount(0);
    await expect(page.getByText('Controlled banner: closed.')).toBeVisible();
    await page.getByRole('button', { name: 'Show the controlled banner' }).click();
    await expect(banner(page, 'The app decides')).toBeVisible();
  });

  test('as it narrows the actions move below the text, then the icon hides', async ({ page }) => {
    await open(page, 'data-banner--shrink');
    const at = (width: number) => page.locator(`[data-width="${width}"]:not(:has([data-compact]))`);
    const parts = (width: number) => ({
      icon: at(width).locator('[data-part="icon"]'),
      content: at(width).locator('[data-part="content"]'),
      actions: at(width).locator('[data-part="actions"]'),
      dismiss: at(width).locator('[data-part="dismiss"]'),
    });

    // Wide: icon, text, actions and dismiss button share the first row.
    const wide = parts(520);
    await expect(wide.icon).toBeVisible();
    expect((await box(wide.actions)).y).toBeLessThan((await box(wide.content)).y + 4);
    expect((await box(wide.actions)).x).toBeGreaterThan((await box(wide.content)).x);

    // Step 1: the actions are below the text, in line with it; the dismiss button stays on the first row.
    const medium = parts(320);
    await expect(medium.icon).toBeVisible();
    const content = await box(medium.content);
    expect((await box(medium.actions)).y).toBeGreaterThanOrEqual(content.y + content.height - 1);
    expect(Math.abs((await box(medium.actions.getByRole('button'))).x - content.x)).toBeLessThan(2);
    expect((await box(medium.dismiss)).y).toBeLessThan(content.y + 4);

    // Step 2: the icon is hidden too.
    const small = parts(200);
    await expect(small.icon).toBeHidden();
    await expect(small.actions).toBeVisible();

    // Nothing leaves the banner at any width.
    for (const width of [520, 320, 200]) {
      const root = at(width).locator('[data-umbra="banner"]');
      expect(await root.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
      const outer = await box(root);
      for (const part of Object.values(parts(width))) {
        if (!(await part.isVisible())) continue;
        const inner = await box(part);
        expect(inner.x + inner.width).toBeLessThanOrEqual(outer.x + outer.width + 0.5);
      }
    }
  });

  test('the description clamps to `maxLines`, and a compact banner stays on one line', async ({ page }) => {
    await open(page, 'data-banner--shrink');
    const description = page.locator(
      '[data-width="200"]:not(:has([data-compact])) [data-part="description"]',
    );
    const lines = await description.evaluate(
      (el) => el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight),
    );
    expect(Math.round(lines)).toBe(3);
    expect(await description.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);

    for (const width of [320, 200]) {
      const compact = page.locator(`[data-width="${width}"] [data-umbra="banner"][data-compact]`);
      const text = compact.locator('[data-part="description"]');
      const lineHeight = await text.evaluate((el) => parseFloat(getComputedStyle(el).lineHeight));
      expect((await box(text)).height).toBeLessThan(lineHeight * 1.5);
      // The actions stay on the row in a compact banner.
      expect((await box(compact.locator('[data-part="actions"]'))).y).toBeLessThan((await box(text)).y + 4);
    }
    // Compact at 200px: the icon is hidden as well.
    await expect(page.locator('[data-width="200"] [data-compact] [data-part="icon"]')).toBeHidden();
    await expect(page.locator('[data-width="320"] [data-compact] [data-part="icon"]')).toBeVisible();
  });

  test('parts: a node replaces, null hides, a function wraps', async ({ page }) => {
    await open(page, 'data-banner--parts');
    await expect(banner(page, 'A node replaces the icon').getByText('NEW')).toBeVisible();
    const hidden = banner(page, 'Only the description is left');
    await expect(hidden.getByRole('button')).toHaveCount(0);
    await expect(hidden.locator('[data-part="title"]')).toHaveCount(0);
    await expect(banner(page, '(wrapped)').locator('[data-part="actions"]')).toContainText('3 new');
  });
});

test.describe('Legend', () => {
  const toolbar = (page: Page, name: string) => page.getByRole('toolbar', { name, exact: true });

  test('an interactive legend is one tab stop with arrow keys, and toggles with Space and Enter', async ({
    page,
  }) => {
    await open(page, 'data-legend--interactive');
    const items = toolbar(page, 'Controlled legend').getByRole('button');
    await expect(items).toHaveCount(6);
    await expect(items.nth(0)).toHaveAttribute('aria-pressed', 'true');
    await expect(items.nth(2)).toHaveAttribute('aria-pressed', 'false');

    await page.keyboard.press('Tab');
    await expect(items.nth(0)).toBeFocused();
    await expect(page.getByText('Highlighted: s1.')).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(items.nth(1)).toBeFocused();
    await expect(page.getByText('Highlighted: s2.')).toBeVisible();
    await page.keyboard.press('Space');
    await expect(items.nth(1)).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByText('Hidden: s3, s2.')).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(items.nth(1)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('Hidden: s3.')).toBeVisible();

    // The disabled item is skipped; the last arrow press stays on the last item.
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(items.nth(3)).toBeFocused();
    await expect(items.nth(4)).toBeDisabled();
    await page.keyboard.press('ArrowRight');
    await expect(items.nth(5)).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(items.nth(3)).toBeFocused();

    // One tab stop: Tab leaves the legend for the next one, and Shift+Tab comes back to the same item.
    await page.keyboard.press('Tab');
    const vertical = toolbar(page, 'Uncontrolled legend').getByRole('button');
    await expect(vertical.nth(0)).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(items.nth(3)).toBeFocused();
  });

  test('a vertical legend uses the up and down arrows, and works uncontrolled', async ({ page }) => {
    await open(page, 'data-legend--interactive');
    const items = toolbar(page, 'Uncontrolled legend').getByRole('button');
    await expect(items.nth(1)).toHaveAttribute('aria-pressed', 'false');
    await items.nth(0).focus();
    await page.keyboard.press('ArrowDown');
    await expect(items.nth(1)).toBeFocused();
    await page.keyboard.press('Space');
    await expect(items.nth(1)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('Changes: 1.')).toBeVisible();
    await page.keyboard.press('ArrowUp');
    await expect(items.nth(0)).toBeFocused();
  });

  test('hover reports a highlight and clears it, also on a legend that is not interactive', async ({
    page,
  }) => {
    await open(page, 'data-legend--interactive');
    await toolbar(page, 'Controlled legend').getByRole('button', { name: 'Region 4' }).hover();
    await expect(page.getByText('Highlighted: s4.')).toBeVisible();
    // A disabled item is not highlighted.
    await toolbar(page, 'Controlled legend').getByRole('button', { name: 'Region 5' }).hover({ force: true });
    await expect(page.getByText('Highlighted: none.')).toBeVisible();
    const list = page.getByRole('list', { name: 'Static legend' });
    await expect(list.getByRole('button')).toHaveCount(0);
    await list.getByText('Region 2').hover();
    await expect(page.getByText('Highlighted: s2.')).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(page.getByText('Highlighted: none.')).toBeVisible();
  });

  test('a horizontal legend wraps to `maxRows` and collapses the rest behind a button', async ({ page }) => {
    await open(page, 'data-legend--wrapping');
    const rows = async (legend: Locator) =>
      new Set(
        await legend.locator('> *').evaluateAll((all) => all.map((el) => el.getBoundingClientRect().top)),
      ).size;
    for (const [name, max] of [
      ['Two rows', 2],
      ['One row', 1],
      ['Three rows', 3],
      ['Narrow', 2],
    ] as const) {
      const legend = page.locator(`[data-umbra="legend"][aria-label="${name}"]`);
      expect(await rows(legend), name).toBeLessThanOrEqual(max);
      const shown = await legend.locator('[data-part="item"]').count();
      expect(shown, name).toBeLessThan(12);
      // The button counts exactly the items that are not shown, and nothing is clipped.
      await expect(legend.getByRole('button', { name: `+${12 - shown} more` })).toBeVisible();
      expect(await legend.evaluate((el) => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
      expect(await legend.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    }
    // At 140px a long label truncates with an ellipsis instead of widening the legend.
    const label = page.locator('[aria-label="Narrow"] [data-part="label"]').first();
    await expect(label).toHaveCSS('text-overflow', 'ellipsis');
    expect(await label.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  });

  test('the more button opens the full list, which stays in step with the legend', async ({ page }) => {
    await open(page, 'data-legend--wrapping');
    const legend = toolbar(page, 'One row');
    const more = legend.getByRole('button', { name: /^\+\d+ more$/ });

    // The button is reached with the arrow keys, as part of the same tab stop.
    await legend.getByRole('button').first().focus();
    const shown = await legend.locator('[data-part="item"]').count();
    for (let i = 0; i < shown; i++) await page.keyboard.press('ArrowRight');
    await expect(more).toBeFocused();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'All items' });
    const all = dialog.getByRole('button');
    await expect(all).toHaveCount(12 + 1); // the twelve items and the popover's hidden dismiss button
    await expect(all.nth(9)).toHaveAttribute('aria-pressed', 'false');

    // Toggling in the list changes the legend behind it.
    await all.nth(0).click();
    await expect(all.nth(0)).toHaveAttribute('aria-pressed', 'false');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(more).toBeFocused();
    await expect(legend.getByRole('button', { name: 'Region 1', exact: true })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  test('the legend shows more items when it gets wider, and all of them when they fit', async ({ page }) => {
    await open(page, 'data-legend--markers', 1024, 720);
    const legend = page.locator('[data-umbra="legend"]').last();
    const count = () => legend.locator('[data-part="item"]').count();
    const narrow = await count();
    expect(narrow).toBeLessThan(12);
    await expect(legend.getByRole('button', { name: `+${12 - narrow} more` })).toBeVisible();
    // A legend that is not interactive opens the same list, as plain items.
    await legend.getByRole('button').click();
    await expect(page.getByRole('dialog').getByRole('listitem')).toHaveCount(12);
    await expect(page.getByRole('dialog').locator('[data-kind="stripes"]')).toHaveCount(4);
    await page.keyboard.press('Escape');

    await page.setViewportSize({ width: 2600, height: 720 });
    await expect.poll(count).toBe(12);
    await expect(legend.getByRole('button')).toHaveCount(0);
    await page.setViewportSize({ width: 1024, height: 720 });
    await expect.poll(count).toBeLessThan(narrow + 1);
    await expect(legend.getByRole('button')).toHaveCount(1);
  });

  test('items without a colour take the series palette in order', async ({ page }) => {
    await open(page, 'data-legend--markers');
    const colours = await page
      .locator('[data-umbra="legend"]')
      .first()
      .locator('[data-part="marker"]')
      .evaluateAll((all) => all.map((el) => getComputedStyle(el).color));
    expect(colours).toHaveLength(8);
    expect(new Set(colours).size).toBe(8);
    const tokens = await page.evaluate(() => {
      const probe = document.querySelector('[data-umbra="legend"]')!.appendChild(document.createElement('i'));
      const read = Array.from({ length: 8 }, (_, i) => {
        probe.style.color = `var(--umbra-color-series-${i + 1})`;
        return getComputedStyle(probe).color;
      });
      probe.remove();
      return read;
    });
    expect(colours).toEqual(tokens);
  });
});

// --- Review fixes, 2026-10-11 -------------------------------------------------------------------------

test.describe('Banner: focus, one line, steps', () => {
  test('in a solid banner the focus ring of an action lies on the fill, with 3:1 against it', async ({
    page,
  }) => {
    await open(page, 'data-banner--content');
    const solid = page.locator('[data-umbra="banner"][data-variant="solid"]').first();
    const action = solid.getByRole('button').first();
    // Reached with the keyboard, so the ring shows.
    await action.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(action).toBeFocused();
    const ring = await action.evaluate((el) => {
      const style = getComputedStyle(el);
      const reach = parseFloat(style.outlineOffset) + parseFloat(style.outlineWidth);
      const r = el.getBoundingClientRect();
      const b = el.closest('[data-umbra="banner"]')!.getBoundingClientRect();
      return {
        inside: r.top - reach >= b.top && r.bottom + reach <= b.bottom && r.left - reach >= b.left,
        // The middle of the ring's top edge, and the fill just inside the banner's start edge.
        onRing: [r.left + r.width / 2, r.top - reach + 0.5] as [number, number],
        onFill: [b.left + 4, b.top + b.height / 2] as [number, number],
      };
    });
    expect(ring.inside).toBe(true);
    const [edge, fill] = await pixels(page, [ring.onRing, ring.onFill]);
    expect(contrast(edge!, fill!)).toBeGreaterThanOrEqual(3);
  });

  test('the ring of the dismiss button is drawn inside it, so it stays in the banner', async ({ page }) => {
    await open(page, 'data-banner--dismissal');
    await page.keyboard.press('Tab');
    const dismiss = page.getByRole('button', { name: 'Dismiss', exact: true });
    await expect(dismiss).toBeFocused();
    expect(await dismiss.evaluate((el) => parseFloat(getComputedStyle(el).outlineOffset))).toBeLessThan(0);
  });

  test('after a dismissal the focus goes to the next control, or the one before, not to the page', async ({
    page,
  }) => {
    await open(page, 'data-banner--dismissal');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(banner(page, 'It hides itself')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Close the warning' })).toBeFocused();
    // Controlled, and the app removes it: the same.
    await page.keyboard.press('Enter');
    await expect(banner(page, 'The app decides')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Show the controlled banner' })).toBeFocused();
  });

  test('a compact banner with actions is one line at every width', async ({ page }) => {
    await open(page, 'data-banner--shrink');
    const holder = page.locator('[data-width="200"]:has([data-compact])');
    const compact = holder.locator('[data-umbra="banner"]');
    const wide = (await box(compact)).height;
    for (const width of [140, 110, 100, 80, 60]) {
      await holder.evaluate((el, w) => (el.style.width = `${w}px`), width);
      expect((await box(compact)).height, `${width}px`).toBe(wide);
      expect(await compact.evaluate((el) => el.scrollWidth <= el.clientWidth), `${width}px`).toBe(true);
    }
  });

  test('the steps are at 26em and 14em of the content box (416 and 224px at the default density)', async ({
    page,
  }) => {
    await open(page, 'data-banner--shrink');
    const holder = page.locator('[data-width="520"]');
    const root = holder.locator('[data-umbra="banner"]');
    // Padding and border on both sides: what the outer width has more than the content box.
    const extra = await root.evaluate((el) => {
      const s = getComputedStyle(el);
      return (
        parseFloat(s.paddingLeft) +
        parseFloat(s.paddingRight) +
        parseFloat(s.borderLeftWidth) +
        parseFloat(s.borderRightWidth)
      );
    });
    const state = async (content: number) => {
      await holder.evaluate((el, w) => (el.style.width = `${w}px`), content + extra);
      return {
        below: await root
          .locator('[data-part="actions"]')
          .evaluate((el) => getComputedStyle(el).order === '1'),
        icon: await root.locator('[data-part="icon"]').isVisible(),
      };
    };
    expect(await state(417)).toEqual({ below: false, icon: true });
    expect(await state(416)).toEqual({ below: true, icon: true });
    expect(await state(225)).toEqual({ below: true, icon: true });
    expect(await state(224)).toEqual({ below: true, icon: false });
  });
});

test.describe('Legend: states, names, tooltip', () => {
  test('empty and error are the shared states; loading hides its placeholders from assistive technology', async ({
    page,
  }) => {
    await open(page, 'data-legend--loading');
    const busy = page.locator('[data-umbra="legend"][aria-busy="true"]');
    await expect(busy).toHaveCount(2);
    await expect(busy.first().getByRole('listitem')).toHaveCount(0);
    await expect(busy.first().locator('[data-part="skeleton"]')).toHaveCount(3);
    await expect(busy.first().locator('[data-part="skeleton"]').first()).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    // A placeholder's marker is as large as a real one, so nothing moves when the items arrive.
    const size = (target: Locator) => target.evaluate((el) => Math.round(el.getBoundingClientRect().width));
    expect(await size(busy.first().locator('[data-shape="circle"]').first())).toBe(
      await size(page.locator('[data-umbra="legend"]:not([aria-busy]) [data-part="marker"]').first()),
    );

    await expect(page.locator('[data-umbra="legend"] [data-part="empty"]').first()).toHaveText('No items');
    await expect(page.getByText('Choose a region to compare.')).toBeVisible();
    await expect(page.getByRole('alert').first()).toHaveText('Something went wrong');
    await expect(page.getByText('Nothing to compare yet.')).toBeVisible();
  });

  test('Retry keeps the focus in the legend through loading, and the items arrive in the same element', async ({
    page,
  }) => {
    await open(page, 'data-legend--loading');
    const legend = page.locator('[data-umbra="legend"][aria-label="Retried legend"]');
    await expect(legend.getByRole('alert')).toContainText('The series did not load');
    const inLegend = () =>
      page.evaluate(() =>
        document.activeElement?.closest('[data-umbra="legend"]')?.getAttribute('aria-label'),
      );
    // Keys only: the retry button is the last control before the story's own button.
    const finish = page.getByRole('button', { name: 'Fail again' });
    await finish.focus();
    await page.keyboard.press('Shift+Tab');
    await expect(legend.getByRole('button', { name: 'Try again' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(legend).toHaveAttribute('aria-busy', 'true');
    await expect.poll(inLegend).toBe('Retried legend');
    // The data arrives without a press inside the legend: it is the same element, and keeps the focus.
    await page.getByRole('button', { name: 'Finish loading' }).dispatchEvent('click');
    await expect(legend.getByRole('button', { name: 'Region 1' })).toBeVisible();
    expect(await inLegend()).toBe('Retried legend');
  });

  test('a truncated label shows its whole text in the library tooltip, on hover and on keyboard focus', async ({
    page,
  }) => {
    await open(page, 'data-legend--wrapping');
    const tooltip = page.getByRole('tooltip');
    const label = page.locator('[aria-label="Narrow"] [data-part="label"]').first();
    await expect(label).not.toHaveAttribute('title');
    await label.hover();
    await expect(tooltip).toHaveText('Region 1, with a long name');
    await page.mouse.move(0, 0);
    await expect(tooltip).toHaveCount(0);

    // Interactive: the toggle button is the tab stop, and focusing it with the keyboard shows the tip.
    const toolbar = page.getByRole('toolbar', { name: 'Narrow, interactive' });
    await toolbar.getByRole('button').nth(1).focus();
    await page.keyboard.press('ArrowLeft');
    await expect(toolbar.getByRole('button').first()).toBeFocused();
    await expect(tooltip).toHaveText('Region 1, with a long name');
    await page.keyboard.press('Escape');
    await expect(tooltip).toHaveCount(0);
    // A label that fits has no tip.
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    await expect(tooltip).toHaveCount(0);
  });

  test('the more button carries its data-part, and the focus offset has a legend token', async ({ page }) => {
    await open(page, 'data-legend--wrapping');
    const legend = page.locator('[data-umbra="legend"][aria-label="One row"]');
    await expect(legend.locator('[data-part="more"]')).toHaveCount(1);
    await legend.evaluate((el) => el.parentElement!.style.setProperty('--umbra-legend-focus-offset', '-4px'));
    await legend.getByRole('button').first().focus();
    await page.keyboard.press('ArrowRight');
    expect(await page.evaluate(() => getComputedStyle(document.activeElement!).outlineOffset)).toBe('-4px');
  });
});
