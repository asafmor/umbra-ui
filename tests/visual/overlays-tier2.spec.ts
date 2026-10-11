import { expect, test, type Locator, type Page } from '@playwright/test';
import { contextPresets } from '../../src/styles/tokens.generated';
import { expectFocusKept, openStory, settle } from './helpers';
import { contrast, pixels } from './pixels';

// Spotlight and ShortcutsSheet: keyboard, focus, layers and everything else a still image cannot show
// (plan/specs/Spotlight.md, plan/specs/ShortcutsSheet.md).

/** True when `el` is what a press at its centre would hit: nothing is painted over it. */
const onTop = (el: Locator) =>
  el.evaluate((node) => {
    const box = node.getBoundingClientRect();
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return !!hit && (node === hit || node.contains(hit));
  });
/** True when nothing around `el` makes it inert or hidden from assistive technology. */
const reachable = (el: Locator) => el.evaluate((node) => !node.closest('[inert], [aria-hidden="true"]'));
const rect = (el: Locator) =>
  el.evaluate((node) => {
    const { x, y, width, height } = node.getBoundingClientRect();
    return { x, y, width, height };
  });
const noPageScroll = (page: Page) =>
  page.evaluate(() => {
    const d = document.documentElement;
    return d.scrollWidth <= d.clientWidth && d.scrollHeight <= d.clientHeight;
  });

test.describe('ShortcutsSheet', () => {
  const sheet = (page: Page) => page.getByRole('dialog', { name: 'Keyboard shortcuts' });
  const sections = (page: Page) => sheet(page).locator('[data-part="sectionTitle"]');
  const line = (page: Page, label: string) =>
    sheet(page).locator('[data-part="item"]').filter({ hasText: label });
  const caps = (item: Locator) => item.locator('[data-part="key"]').allTextContents();

  test('? opens it with the focus in the search, Escape closes it and the focus goes back', async ({
    page,
  }) => {
    await openStory(page, 'overlays-shortcutssheet--closed');
    const filters = page.getByRole('button', { name: 'Filters' });
    await filters.focus();
    await page.keyboard.press('?');
    await expect(sheet(page)).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Search shortcuts' })).toBeFocused();
    // In the search field `?` is text, not the shortcut.
    await page.keyboard.press('?');
    await expect(page.getByRole('textbox', { name: 'Search shortcuts' })).toHaveValue('?');
    await expect(sheet(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(sheet(page)).toHaveCount(0);
    await expect(filters).toBeFocused();
    // The key also closes it, from a control that is not a field.
    await page.keyboard.press('?');
    await expect(sheet(page)).toBeVisible();
    await sheet(page).getByRole('button', { name: 'Close' }).focus();
    await page.keyboard.press('?');
    await expect(sheet(page)).toHaveCount(0);
    await expectFocusKept(page);
  });

  test('? typed in a field of the page is text and opens nothing', async ({ page }) => {
    await openStory(page, 'overlays-shortcutssheet--closed');
    const note = page.getByRole('textbox', { name: 'Note' });
    await note.focus();
    await page.keyboard.press('?');
    await expect(note).toHaveValue('?');
    await expect(sheet(page)).toHaveCount(0);
  });

  test('the button opens it, and closing returns the focus to the button', async ({ page }) => {
    await openStory(page, 'overlays-shortcutssheet--closed');
    const trigger = page.getByRole('button', { name: 'Keyboard shortcuts' });
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(sheet(page)).toBeVisible();
    await expectFocusKept(page);
    // Focus stays inside: Shift+Tab from the first control goes to the last, not to the page.
    await page.keyboard.press('Shift+Tab');
    await expect.poll(() => sheet(page).evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  });

  test('lists the registry in groups, the library’s own apart, then the app’s extra sections', async ({
    page,
  }) => {
    await openStory(page, 'overlays-shortcutssheet--default');
    await expect(sections(page)).toHaveText([
      'Orders',
      'Reports',
      'Shortcuts',
      'General',
      'In a table',
      'In a dialog',
    ]);
    // Keys are written for the platform, one cap per key.
    expect(await caps(line(page, 'New order'))).toEqual(['Ctrl', 'Shift', 'O']);
    expect(await caps(line(page, 'Refresh the figures'))).toEqual(['R']);
    // The library's own: only those that would run now. No history buttons are mounted here.
    const general = sheet(page).getByRole('region', { name: 'General' });
    await expect(general.locator('[data-part="label"]')).toHaveText([
      'Open command palette',
      'Show keyboard shortcuts',
    ]);
    expect(await caps(line(page, 'Open command palette'))).toEqual(['Ctrl', 'K']);
    expect(await caps(line(page, 'Show keyboard shortcuts'))).toEqual(['?']);
    // Alternatives of one line, with the word between them.
    expect(await caps(line(page, 'Move between cells'))).toEqual(['↑', '↓', '←', '→']);
    await expect(line(page, 'First and last row').locator('[data-part="keys"]')).toHaveText(
      'CtrlHomeorCtrlEnd',
    );
  });

  test('the search filters by label, keys and section; nothing found is said, and clearing restores', async ({
    page,
  }) => {
    await openStory(page, 'overlays-shortcutssheet--default');
    const search = page.getByRole('textbox', { name: 'Search shortcuts' });
    const total = await sheet(page).locator('[data-part="item"]').count();
    await search.fill('print');
    await expect(sections(page)).toHaveText(['Reports']);
    await expect(sheet(page).locator('[data-part="label"]')).toHaveText(['Print']);
    await search.fill('ctrl+shift');
    await expect(sheet(page).locator('[data-part="label"]')).toHaveText(['New order']);
    // A section's title finds all its lines; every word must match.
    await search.fill('table row');
    await expect(sheet(page).locator('[data-part="label"]')).toHaveText([
      'First and last row',
      'Select the row',
      'Open the row',
    ]);
    await search.fill('zzz');
    await expect(sheet(page).locator('[data-part="item"]')).toHaveCount(0);
    await expect(sheet(page).getByRole('status')).toHaveText('No shortcuts match');
    await sheet(page).getByRole('button', { name: 'Clear' }).click();
    await expect(sheet(page).locator('[data-part="item"]')).toHaveCount(total);
    await expectFocusKept(page);
  });

  test('the sheet opens on `defaultQuery`, with the empty state when it matches nothing', async ({
    page,
  }) => {
    await openStory(page, 'overlays-shortcutssheet--no-match');
    await expect(page.getByRole('textbox', { name: 'Search shortcuts' })).toHaveValue('zzz');
    await expect(sheet(page).getByRole('status')).toHaveText('No shortcuts match');
  });

  test('columns reflow with the width, and the list scrolls inside the sheet', async ({ page }) => {
    const columns = () =>
      sheet(page)
        .locator('[data-part="section"]')
        .evaluateAll((all) => new Set(all.map((el) => Math.round(el.getBoundingClientRect().x))).size);
    await openStory(page, 'overlays-shortcutssheet--default', { width: 1920, height: 1080 });
    await expect(sheet(page)).toBeVisible();
    expect(await columns()).toBe(2);
    await page.setViewportSize({ width: 1024, height: 600 });
    await expect.poll(columns).toBe(2);
    // Below the minimum window the modal fills the window: wider than the `lg` panel, so three.
    await page.setViewportSize({ width: 900, height: 560 });
    await expect.poll(columns).toBe(3);
    await page.setViewportSize({ width: 560, height: 560 });
    await expect.poll(columns).toBe(1);
    // One column is taller than the window: the body scrolls, the page does not, the search stays.
    const body = sheet(page).locator('[data-part="body"]');
    expect(
      await body.evaluate(
        (el) => !![el, ...el.querySelectorAll('*')].find((n) => n.scrollHeight > n.clientHeight + 1),
      ),
    ).toBe(true);
    expect(await noPageScroll(page)).toBe(true);
    await expect(page.getByRole('textbox', { name: 'Search shortcuts' })).toBeInViewport();
    await line(page, 'Next control').scrollIntoViewIfNeeded();
    await expect(line(page, 'Next control')).toBeInViewport();
    // The keys are never cut: a long label gives way.
    const keys = line(page, 'Move between cells').locator('[data-part="keys"]');
    expect(await keys.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  });

  test('conflicts are shown as the registry resolves them, and the sheet’s key can be rebound', async ({
    page,
  }) => {
    await openStory(page, 'overlays-shortcutssheet--conflicts');
    await expect(sheet(page)).toBeVisible();
    // "Find" took Ctrl+K: the palette has no keys and is not listed. Of the two on G, the last.
    await expect(sheet(page).locator('[data-part="label"]')).toHaveText([
      'Find',
      'Show the grid',
      'Show keyboard shortcuts',
    ]);
    expect(await caps(line(page, 'Show keyboard shortcuts'))).toEqual(['Ctrl', '/']);
    await page.keyboard.press('Escape');
    await expect(sheet(page)).toHaveCount(0);
    // The old key is free, the new one opens the sheet (also from a field: it has a modifier).
    await page.getByRole('button', { name: 'Filters' }).focus();
    await page.keyboard.press('?');
    await expect(sheet(page)).toHaveCount(0);
    await page.keyboard.press('Control+/');
    await expect(sheet(page)).toBeVisible();
  });

  test('a drawer is attached to the end edge and is as tall as the window', async ({ page }) => {
    for (const direction of ['ltr', 'rtl']) {
      await openStory(page, 'overlays-shortcutssheet--drawer', { direction });
      // OP-9: the sheet is found by its own name, as a `ConfirmDialog` is.
      const panel = page.locator('[data-umbra="shortcuts-sheet"]');
      await expect(page.locator('[data-umbra="modal"]')).toHaveCount(0);
      await expect(panel).toHaveAttribute('data-variant', 'drawer');
      await expect(sheet(page)).toBeVisible();
      await expect
        .poll(async () => {
          const box = await rect(panel);
          return [Math.round(direction === 'ltr' ? box.x + box.width : box.x), Math.round(box.height)];
        })
        .toEqual([direction === 'ltr' ? 1280 : 0, 720]);
      expect(await sheet(page).evaluate((el) => getComputedStyle(el).direction)).toBe(direction);
    }
  });

  test('parts: a hidden search, sections and lines changed by a function, translated texts', async ({
    page,
  }) => {
    await openStory(page, 'overlays-shortcutssheet--parts');
    const dialog = page.getByRole('dialog', { name: 'Raccourcis clavier' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('textbox')).toHaveCount(0);
    await expect(dialog.locator('[data-part="sectionTitle"]')).toHaveText([
      'Orders ·',
      'Reports ·',
      'Divers ·',
      'Application ·',
      'In a table ·',
    ]);
    await expect(dialog.locator('[data-part="label"] em').first()).toHaveText('New order');
    await expect(dialog.locator('[data-part="keys"]').filter({ hasText: 'ou' })).toHaveCount(2);
    await expect(dialog.getByRole('button', { name: 'Fermer' })).toBeVisible();
    // Without a search the focus still goes inside.
    await expect.poll(() => dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  });

  test('blocks: sections, lines and keys composed by hand in a modal', async ({ page }) => {
    await openStory(page, 'overlays-shortcutssheet--blocks');
    const dialog = page.getByRole('dialog', { name: 'Keys of the planner' });
    await expect(dialog.getByRole('region', { name: 'Days' }).locator('[data-part="item"]')).toHaveCount(2);
    await expect(dialog.locator('p [data-part="key"]')).toHaveText(['Ctrl', 'Enter']);
  });

  for (const direction of ['ltr', 'rtl'] as const) {
    test(`layers: above a popover and below the command palette, ${direction}`, async ({ page }) => {
      await openStory(page, 'overlays-shortcutssheet--closed', { direction });
      await page.getByRole('button', { name: 'Filters' }).focus();
      await page.keyboard.press('Enter');
      const popover = page.getByRole('dialog', { name: 'Filters' });
      await expect(popover).toBeVisible();
      await expect(popover).toBeFocused();
      // The focus is in the popover, not in a field: the key opens the sheet over it.
      await page.keyboard.press('?');
      const search = page.getByRole('textbox', { name: 'Search shortcuts' });
      await expect(search).toBeFocused();
      expect(await onTop(search)).toBe(true);
      expect(await reachable(sheet(page))).toBe(true);
      // The popover under it is gone or out of reach, never on top.
      await expect.poll(async () => (await popover.count()) === 0 || !(await reachable(popover))).toBe(true);

      // The palette opens on top of the sheet (they stack), from the sheet's search field.
      await page.keyboard.press('ControlOrMeta+k');
      const input = page.getByRole('combobox');
      await expect(input).toBeFocused();
      expect(await onTop(input)).toBe(true);
      expect(await input.evaluate((el) => getComputedStyle(el).direction)).toBe(direction);
      await expect(sheet(page)).toBeAttached();
      // Closing the palette returns to the sheet; closing the sheet returns to the page.
      await page.keyboard.press('Escape');
      await expect(input).toHaveCount(0);
      await expect(sheet(page)).toBeVisible();
      await expect.poll(() => sheet(page).evaluate((el) => el.contains(document.activeElement))).toBe(true);
      await page.keyboard.press('Escape');
      await expect(sheet(page)).toHaveCount(0);
      await expectFocusKept(page);
    });
  }

  test('the command palette lists the same shortcuts with the same keys', async ({ page }) => {
    await openStory(page, 'overlays-commandpalette--shortcuts');
    const rows = page.getByRole('group', { name: 'Keyboard shortcuts' }).getByRole('option');
    await expect(rows).toHaveText(['ContinueCtrl+Enter']);
  });
});

test.describe('Spotlight', () => {
  const root = (page: Page) => page.locator('[data-umbra="spotlight"]');
  const ring = (page: Page) => root(page).locator('[data-part="ring"]');
  const callout = (page: Page) => root(page).getByRole('dialog');
  /** The ring is around the target, `padding` away from it. */
  const expectRingAround = async (page: Page, target: Locator, padding = 4) => {
    await expect
      .poll(async () => {
        const [r, t] = [await rect(ring(page)), await rect(target)];
        return [r.x - t.x, r.y - t.y, r.width - t.width, r.height - t.height].map((n) => Math.round(n));
      })
      .toEqual([-padding, -padding, 2 * padding, 2 * padding]);
  };
  /** The callout is inside the window, and beside the cut-out wherever a side has `room` for it. */
  const expectCalloutBeside = async (page: Page, room = true) => {
    await expect
      .poll(async () => {
        const [c, r] = [await rect(callout(page)), await rect(ring(page))];
        const view = page.viewportSize()!;
        const inside = c.x >= 0 && c.y >= 0 && c.x + c.width <= view.width && c.y + c.height <= view.height;
        const apart =
          c.x >= r.x + r.width || c.x + c.width <= r.x || c.y >= r.y + r.height || c.y + c.height <= r.y;
        return inside && (apart || !room);
      })
      .toBe(true);
  };

  test('a coach mark: a dialog beside the target, everything else out of reach', async ({ page }) => {
    await openStory(page, 'overlays-spotlight--default');
    const dialog = page.getByRole('dialog', { name: 'Your inbox' });
    await expect(dialog).toBeFocused();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAccessibleDescription('New messages arrive here. The newest is at the top.');
    const target = page.locator('.spot-inbox');
    await expectRingAround(page, target);
    await expectCalloutBeside(page);
    // Nothing but the callout can be used: the page and the target itself are inert.
    expect(await reachable(dialog)).toBe(true);
    expect(await reachable(target)).toBe(false);
    expect(await reachable(page.getByRole('button', { name: 'Show the tip', includeHidden: true }))).toBe(
      false,
    );
    expect(await noPageScroll(page)).toBe(true);
    // Tab stays in the callout: its button is the only stop.
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', { name: 'Done' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(root(page)).toHaveCount(0);
    await expect(page.getByText('Spotlight: closed. Finished: 1')).toBeVisible();
    // The page is usable again, and the focus is on something.
    await expectFocusKept(page);
    expect(await reachable(target)).toBe(true);
    await expect(page.locator('html')).not.toHaveAttribute('data-umbra-spotlight');
  });

  test('Escape and a press on the dim close it, and the focus returns to the opener', async ({ page }) => {
    await openStory(page, 'overlays-spotlight--default');
    await expect(callout(page)).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(root(page)).toHaveCount(0);
    await expectFocusKept(page);
    const opener = page.getByRole('button', { name: 'Show the tip' });
    await opener.focus();
    await page.keyboard.press('Enter');
    await expect(callout(page)).toBeFocused();
    // A press on the target is a press on the dim too: it is not interactive.
    const box = await rect(page.locator('.spot-inbox'));
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(root(page)).toHaveCount(0);
    await expect(opener).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(callout(page)).toBeFocused();
    await page.mouse.click(1270, 710);
    await expect(root(page)).toHaveCount(0);
    await expect(opener).toBeFocused();
    await expect(page.getByText('Spotlight: closed. Finished: 0')).toBeVisible();
  });

  for (const context of contextPresets) {
    test(`the ring has 3:1 against the dim and the target, and the target is not dimmed, ${context}`, async ({
      page,
    }) => {
      await openStory(page, 'overlays-spotlight--default', { context });
      await expect(callout(page)).toBeFocused();
      await expectRingAround(page, page.locator('.spot-inbox'));
      await root(page).evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
      const r = await rect(ring(page));
      const y = r.y + r.height / 2;
      // From outside in: the dim, the 2px ring, the space between ring and target, the target.
      const points: [number, number][] = [
        [r.x - 6, y],
        [r.x - 1, y],
        [r.x + 1, y],
        [r.x + 40, y],
      ];
      const [dim, line, gap, lit] = await pixels(page, points);
      expect(contrast(line!, dim!)).toBeGreaterThanOrEqual(3);
      expect(contrast(line!, gap!)).toBeGreaterThanOrEqual(3);
      expect(contrast(line!, lit!)).toBeGreaterThanOrEqual(3);
      // The ring is crisp: two pixels, then the dim at once.
      const [inner, outer] = await pixels(page, [
        [r.x - 2, y],
        [r.x - 3, y],
      ]);
      expect(inner).toEqual(line);
      expect(outer).toEqual(dim);
      // The target keeps its own colours: the same pixel with the spotlight closed.
      await page.keyboard.press('Escape');
      await expect(root(page)).toHaveCount(0);
      const [plain, undimmed] = await pixels(page, [points[3]!, points[0]!]);
      expect(lit).toEqual(plain);
      expect(dim).not.toEqual(undimmed);
    });
  }

  test('interactive: the target is used as usual, and what it opens is above the dim', async ({ page }) => {
    await openStory(page, 'overlays-spotlight--interactive');
    const dialog = page.getByRole('dialog', { name: 'Try the tools' });
    await expect(dialog).toBeFocused();
    await expect(dialog).not.toHaveAttribute('aria-modal');
    const tools = page.locator('.spot-tools');
    await expectRingAround(page, tools);
    await expectCalloutBeside(page);
    expect(await reachable(tools)).toBe(true);
    expect(await reachable(page.getByRole('button', { name: 'Show the tip', includeHidden: true }))).toBe(
      false,
    );
    // A press reaches the target through the cut-out.
    const send = page.getByRole('button', { name: 'Send' });
    expect(await onTop(send)).toBe(true);
    await send.click();
    await expect(page.getByText('Last: send')).toBeVisible();
    await expect(root(page)).toHaveCount(1);
    // Its tooltip is above the dim and describes it.
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(send).toBeFocused();
    const tooltip = page.getByRole('tooltip');
    await expect(tooltip).toHaveText('Sends the summary by mail');
    expect(await reachable(tooltip)).toBe(true);
    expect(await onTop(tooltip)).toBe(true);
    // Its menu opens above the dim and a row can be chosen.
    await page.getByRole('button', { name: 'More' }).focus();
    await page.keyboard.press('Enter');
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    expect(await reachable(menu)).toBe(true);
    expect(await onTop(menu.getByRole('menuitem', { name: 'Archive' }))).toBe(true);
    await menu.getByRole('menuitem', { name: 'Archive' }).click();
    await expect(page.getByText('Last: archive')).toBeVisible();
    await expect(root(page)).toHaveCount(1);
    await expectFocusKept(page);
    // Escape in the target closes the spotlight.
    await page.getByRole('button', { name: 'Send' }).focus();
    await page.keyboard.press('Escape');
    await expect(root(page)).toHaveCount(0);
    await expectFocusKept(page);
  });

  test('a target that leaves the page closes the spotlight: no dim is left behind', async ({ page }) => {
    await openStory(page, 'overlays-spotlight--interactive');
    await expect(callout(page)).toBeFocused();
    await page.getByRole('button', { name: 'Remove these tools' }).click();
    await expect(root(page)).toHaveCount(0);
    await expect(page.getByText('Spotlight: closed')).toBeVisible();
    await expect(page.locator('#storybook-root [inert]')).toHaveCount(0);
    await expectFocusKept(page);
    // Opened again without a target, it closes at once.
    await page.getByRole('button', { name: 'Show the tip' }).click();
    await expect(page.getByText('Spotlight: closed')).toBeVisible();
    await expect(root(page)).toHaveCount(0);
  });

  for (const [width, height] of [
    [1280, 720],
    [1024, 600],
  ] as const) {
    test(`a tour: steps, a missing target passed over, scrolled into view, focus at every step, ${width}x${height}`, async ({
      page,
    }) => {
      await openStory(page, 'overlays-spotlight--tour', { width, height });
      const step = async (name: string, progress: string, target: Locator, room = true) => {
        const dialog = page.getByRole('dialog', { name });
        await expect(dialog).toBeFocused();
        await expect(dialog.locator('[data-part="progress"]')).toHaveText(progress);
        await expectRingAround(page, target);
        await expectCalloutBeside(page, room);
        expect(await noPageScroll(page)).toBe(true);
        return dialog;
      };
      let dialog = await step('Inbox', '1 of 5', page.locator('.spot-inbox'));
      await expect(dialog.getByRole('button', { name: 'Back' })).toHaveCount(0);
      // The text of the step is in a live region: it is spoken when the step changes.
      await expect(dialog.locator('[aria-live="polite"]')).toHaveText('InboxNew messages arrive here.');
      await dialog.getByRole('button', { name: 'Next' }).click();
      // Step 2 has no target: the tour goes on to step 3.
      dialog = await step('Summary', '3 of 5', page.locator('.spot-summary'), width > 1024);
      await expect(page.getByText('Tour: step 3')).toBeAttached();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await expect(dialog.getByRole('button', { name: 'Back' })).toBeFocused();
      await page.keyboard.press('Enter');
      dialog = await step('Inbox', '1 of 5', page.locator('.spot-inbox'));
      await dialog.getByRole('button', { name: 'Next' }).click();
      dialog = await step('Summary', '3 of 5', page.locator('.spot-summary'), width > 1024);
      await dialog.getByRole('button', { name: 'Next' }).click();

      // Step 4: the last row of the inbox was out of sight; it has been scrolled into view.
      const row = page.locator('.spot-inbox [data-part="body"] > div > div > div:last-child');
      dialog = await step('Older messages', '4 of 5', row);
      await expect(row).toBeInViewport({ ratio: 1 });
      // The ring and the callout follow the target while its scroll area scrolls.
      const before = await rect(ring(page));
      await row.evaluate((el) => {
        let scroller: Element | null = el;
        while (scroller && scroller.scrollHeight <= scroller.clientHeight + 1)
          scroller = scroller.parentElement;
        scroller!.scrollTop -= 40;
      });
      await expectRingAround(page, row);
      expect(Math.round((await rect(ring(page))).y - before.y)).toBe(40);
      await expectCalloutBeside(page);
      // And when the window changes size.
      await page.setViewportSize({ width: width - 60, height: height - 40 });
      await expectRingAround(page, row);
      await expectCalloutBeside(page);
      await page.setViewportSize({ width, height });

      await dialog.getByRole('button', { name: 'Next' }).click();
      dialog = await step('Budget', '5 of 5', page.locator('.spot-budget'));
      await expect(dialog.getByRole('button', { name: 'Skip' })).toHaveCount(0);
      await dialog.getByRole('button', { name: 'Done' }).click();
      await expect(root(page)).toHaveCount(0);
      await expect(page.getByText('Tour: closed')).toBeVisible();
      await expectFocusKept(page);
    });
  }

  test('a tour: Skip closes it, and the next start is at the first step', async ({ page }) => {
    await openStory(page, 'overlays-spotlight--tour');
    await callout(page).getByRole('button', { name: 'Next' }).click();
    await expect(page.getByRole('dialog', { name: 'Summary' })).toBeFocused();
    await callout(page).getByRole('button', { name: 'Skip' }).click();
    await expect(root(page)).toHaveCount(0);
    await expectFocusKept(page);
    await page.getByRole('button', { name: 'Start the tour' }).click();
    await expect(page.getByRole('dialog', { name: 'Inbox' })).toBeFocused();
  });

  test('not dismissable: Escape and a press on the dim do nothing, and the focus stays', async ({ page }) => {
    await openStory(page, 'overlays-spotlight--persistent');
    const dialog = page.getByRole('dialog', { name: 'Set a budget first' });
    await expect(dialog).toBeFocused();
    await expectRingAround(page, page.locator('.spot-budget'), 8);
    expect(await ring(page).evaluate((el) => getComputedStyle(el).borderRadius)).toBe('16px');
    await page.keyboard.press('Escape');
    await page.mouse.click(20, 700);
    await settle(page);
    await expect(dialog).toBeVisible();
    await expect(dialog).toBeFocused();
    // The app's own button is in place of the built-in ones.
    await expect(dialog.locator('[data-part="footer"]').getByRole('button')).toHaveText(['Set the budget']);
  });

  test('right to left: the callout is on the other side, the ring still around the target', async ({
    page,
  }) => {
    const side = async (direction: string) => {
      await openStory(page, 'overlays-spotlight--default', { direction });
      await expect(callout(page)).toBeFocused();
      await expectRingAround(page, page.locator('.spot-inbox'));
      await expectCalloutBeside(page);
      expect(await callout(page).evaluate((el) => getComputedStyle(el).direction)).toBe(direction);
      const [c, r] = [await rect(callout(page)), await rect(ring(page))];
      return c.x >= r.x + r.width ? 'right' : 'left';
    };
    expect(await side('ltr')).toBe('right');
    expect(await side('rtl')).toBe('left');
  });

  test('parts and blocks', async ({ page }) => {
    await openStory(page, 'overlays-spotlight--parts');
    const dialog = page.getByRole('dialog', { name: '★ Summary' });
    await expect(dialog).toBeFocused();
    await expect(dialog.locator('[data-part="body"]')).toHaveCount(0);
    await expect(dialog.locator('[data-part="progress"]')).toHaveText('Étape 1 sur 2');
    await expect(dialog.locator('[data-part="footer"]').getByRole('button')).toHaveText(['Fermer']);

    await openStory(page, 'overlays-spotlight--blocks');
    const built = page.getByRole('dialog', { name: 'Built from blocks' });
    await expect(built).toBeFocused();
    await expect(built).toHaveAccessibleDescription(/The root, the callout/);
    await expectRingAround(page, page.locator('.spot-inbox'));
    await built.getByRole('button', { name: 'Later' }).click();
    await expect(root(page)).toHaveCount(0);
    await expectFocusKept(page);
  });

  for (const direction of ['ltr', 'rtl'] as const) {
    test(`layers: over a modal’s content, its tooltip above the dim, the palette above all, ${direction}`, async ({
      page,
    }) => {
      await openStory(page, 'overlays-spotlight--in-modal', { direction });
      const modal = page.getByRole('dialog', { name: 'Edit order' });
      const dialog = page.getByRole('dialog', { name: 'Dispatch from here' });
      await expect(modal).toBeVisible();
      await expect(dialog).toBeFocused();
      const dispatch = page.getByRole('button', { name: 'Dispatch' });
      await expectRingAround(page, dispatch.locator('xpath=ancestor::div[1]'));
      await expectCalloutBeside(page);
      // The spotlight is in the modal's layer, above the modal: the rest of the modal is dimmed and inert.
      expect(await root(page).evaluate((el) => !!el.closest('[data-umbra="modal-backdrop"]'))).toBe(true);
      expect(await onTop(dialog)).toBe(true);
      expect(await reachable(dialog)).toBe(true);
      expect(await reachable(modal.getByRole('button', { name: 'Close', includeHidden: true }).last())).toBe(
        false,
      );
      // The interactive target works, and its tooltip is above the dim.
      expect(await reachable(dispatch)).toBe(true);
      await dispatch.click();
      await expect(page.getByText('Last: dispatch')).toBeAttached();
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Tab');
      await expect(dispatch).toBeFocused();
      const tooltip = page.getByRole('tooltip');
      await expect(tooltip).toHaveText('Sends the order to the warehouse');
      expect(await onTop(tooltip)).toBe(true);
      expect(await reachable(tooltip)).toBe(true);
      // A press on the dim closes the spotlight only: the modal under it stays.
      // First the palette: it opens above the spotlight.
      await page.keyboard.press('ControlOrMeta+k');
      const input = page.getByRole('combobox');
      await expect(input).toBeFocused();
      expect(await onTop(input)).toBe(true);
      await page.keyboard.type('exp');
      await page.keyboard.press('Enter');
      await expect(page.getByText('Last: Export orders')).toBeAttached();
      await expect(input).toHaveCount(0);
      await expect(dialog).toBeVisible();
      await expect(modal).toBeVisible();
      await expectFocusKept(page);

      await page.mouse.click(direction === 'ltr' ? 20 : 1260, 700);
      await expect(root(page)).toHaveCount(0);
      await expect(modal).toBeVisible();
      await expect.poll(() => modal.evaluate((el) => el.contains(document.activeElement))).toBe(true);
      // Opened again from inside the modal; Escape closes the spotlight, the next one the modal.
      await modal.getByRole('button', { name: 'Show the tip' }).click();
      await expect(dialog).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(root(page)).toHaveCount(0);
      await expect(modal).toBeVisible();
      await expect(modal.getByRole('button', { name: 'Show the tip' })).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(modal).toHaveCount(0);
      await expectFocusKept(page);
    });
  }

  test('the layers are tokens, in order: popover, tooltip, modal, spotlight, palette', async ({ page }) => {
    await openStory(page, 'overlays-spotlight--default');
    await expect(callout(page)).toBeFocused();
    const layers = await page.evaluate(() => {
      const css = getComputedStyle(document.querySelector('[data-umbra-root]')!);
      return ['popover', 'tooltip', 'modal', 'spotlight', 'palette'].map((name) =>
        Number(css.getPropertyValue(`--umbra-layer-${name}`)),
      );
    });
    expect(layers.every((value, i) => i === 0 || value > layers[i - 1]!)).toBe(true);
    expect(await root(page).evaluate((el) => Number(getComputedStyle(el).zIndex))).toBe(layers[3]);
  });

  test('reduced motion: the spotlight only fades, nothing moves', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openStory(page, 'overlays-spotlight--default');
    await expect(callout(page)).toBeFocused();
    const moving = await root(page).evaluate((el) =>
      [el, ...el.querySelectorAll('*')]
        .flatMap((node) => node.getAnimations())
        .flatMap((animation) => (animation.effect as KeyframeEffect).getKeyframes())
        .flatMap((frame) => Object.keys(frame))
        .filter(
          (property) => !['offset', 'computedOffset', 'easing', 'composite', 'opacity'].includes(property),
        ),
    );
    expect(moving).toEqual([]);
  });
});
