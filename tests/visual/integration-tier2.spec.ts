import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectFocusKept, openStory, pressKeys, settle } from './helpers';

// Tier 2 components used together and inside tier 1 containers (the integration pass of Milestone 2,
// plan/reviews/milestone-2.md). The stories are `Integration/Tier 2`, and the groups' own where one fits.

const DATA = 'integration-tier-2--in-data';
const ALL = 'integration-tier-2--compositions';
const small = ['sparkline', 'star-rating', 'sequence-dots', 'pie-indicator', 'diverging-meter'];

const noPageScroll = async (page: Page) =>
  expect(
    await page.evaluate(() => {
      const d = document.documentElement;
      return [d.scrollWidth - d.clientWidth, d.scrollHeight - d.clientHeight];
    }),
  ).toEqual([0, 0]);

/** Every element is drawn (not a sliver) and lies inside the nearest ancestor that matches `within`. */
async function drawnInside(items: Locator, within: string) {
  const boxes = await items.evaluateAll((list, selector) => {
    return list.map((el) => {
      const a = el.getBoundingClientRect();
      const b = el.closest(selector)!.getBoundingClientRect();
      return { width: a.width, height: a.height, inside: a.left >= b.left - 1 && a.right <= b.right + 1 };
    });
  }, within);
  for (const box of boxes) {
    expect(box.width).toBeGreaterThan(12);
    expect(box.height).toBeGreaterThan(6);
    expect(box.inside).toBe(true);
  }
  return boxes.length;
}

const card = (page: Page, title: string) =>
  page
    .locator('[data-umbra="card"]')
    .filter({ has: page.getByRole('heading', { name: title, exact: true }) });

test.describe('the small pieces where data is listed', () => {
  for (const direction of ['ltr', 'rtl']) {
    test(`${direction}: drawn inside table cells, list rows, KeyValue rows and a SummaryTile`, async ({
      page,
    }) => {
      await openStory(page, DATA, { direction, width: 1920, height: 1080 });
      for (const name of small) {
        const all = page.locator(`[data-umbra="${name}"]`);
        expect(
          await drawnInside(
            page.locator(`tr[data-kind="row"] [data-col] [data-umbra="${name}"]`),
            '[data-col]',
          ),
        ).toBe(4);
        expect(
          await drawnInside(
            page.locator(`[data-umbra="list"] [role="row"] [data-umbra="${name}"]`),
            '[role="row"]',
          ),
        ).toBe(1);
        expect(
          await drawnInside(
            page.locator(`[data-umbra="key-value"] [data-umbra="${name}"]`),
            '[data-umbra="key-value"]',
          ),
        ).toBe(1);
        await expect(all.first()).toBeVisible();
      }
      // A sparkline has no content to take a width from: in a slot that hugs it has one of its own.
      const trailing = page.locator('[data-umbra="list"] [role="row"] [data-umbra="sparkline"]');
      expect((await trailing.boundingBox())!.width).toBeGreaterThanOrEqual(48);
      await expect(page.locator('[data-umbra="summary-tile"] [data-umbra="sparkline"] svg')).toBeVisible();
      await noPageScroll(page);
    });
  }

  test('a scope of another density and tint reaches the pieces and what they open', async ({ page }) => {
    await openStory(page, DATA);
    const spark = page.locator('[data-umbra="list"] [role="row"] [data-umbra="sparkline"]');
    const density = (el: Locator) =>
      el.evaluate((node) => node.closest('[data-umbra-density]')?.getAttribute('data-umbra-density'));
    expect(await density(spark)).toBe('compact');
    expect(
      await density(page.locator('tr[data-kind="row"] [data-col] [data-umbra="sparkline"]').first()),
    ).toBe('default');
    // Its tooltip is drawn in a portal, and still in the scope's density and tint.
    await spark.hover();
    const tip = page.getByRole('tooltip');
    await expect(tip).toBeVisible();
    expect(await density(tip)).toBe('compact');
    expect(
      await tip.evaluate((node) => node.closest('[data-umbra-context]')?.getAttribute('data-umbra-context')),
    ).toBe('teal');
  });

  test('table grid: a disabled button is not a control of its cell, so Enter presses the other one', async ({
    page,
  }) => {
    await openStory(page, DATA);
    const cell = page.locator('tr[data-row-key="r:item-2"] > [data-col="open"]');
    await cell.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByText('Opened: Item 2')).toBeVisible();
    await expectFocusKept(page);
  });

  test('a spotlight on a table row: around the row, and it follows a row that moves with no event', async ({
    page,
  }) => {
    await openStory(page, DATA);
    const opener = page.getByRole('button', { name: 'Show me' });
    await opener.click();
    const dialog = page.getByRole('dialog', { name: 'A row' });
    await expect(dialog).toBeVisible();
    const row = page.locator('tr[data-row-key="r:item-2"]');
    const ring = page.locator('[data-umbra="spotlight"] [data-part="ring"]');
    const around = async () => {
      const [r, t] = [(await ring.boundingBox())!, (await row.boundingBox())!];
      return Math.abs(r.y + r.height / 2 - (t.y + t.height / 2)) < 2 && r.width >= t.width;
    };
    await expect.poll(around).toBe(true);
    // The callout is beside the row, not over it.
    const apart = async () => {
      const [d, t] = [(await dialog.boundingBox())!, (await row.boundingBox())!];
      return d.x >= t.x + t.width || d.x + d.width <= t.x || d.y >= t.y + t.height || d.y + d.height <= t.y;
    };
    expect(await apart()).toBe(true);
    // Moved by a style alone: no resize, no scroll, no transition.
    const before = (await row.boundingBox())!.y;
    await page.locator('table[aria-label="Items"]').evaluate((table) => (table.style.translate = '0 40px'));
    expect((await row.boundingBox())!.y).toBeCloseTo(before + 40, 0);
    await expect.poll(around).toBe(true);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test('a spotlight with no room at either side of its target goes below it, not over it', async ({
    page,
  }) => {
    // Below the minimum width the table has the whole window: nothing is left beside a row.
    await openStory(page, DATA, { width: 900, height: 700 });
    await page.getByRole('button', { name: 'Show me' }).click();
    const dialog = page.getByRole('dialog', { name: 'A row' });
    await expect(dialog).toBeVisible();
    const row = page.locator('tr[data-row-key="r:item-2"]');
    await expect
      .poll(async () => {
        const [d, t] = [(await dialog.boundingBox())!, (await row.boundingBox())!];
        return d.y >= t.y + t.height - 1 && d.x >= 0 && d.x + d.width <= 900;
      })
      .toBe(true);
  });
});

test.describe('controls in rows of actions', () => {
  test('wide: a SplitButton, a Stepper and a Slider work in a card header and an ActionBar', async ({
    page,
  }) => {
    await openStory(page, ALL, { width: 1920, height: 1080 });
    for (const [name, host] of [
      ['card', card(page, 'Plan').locator('[data-part="header"]')],
      ['bar', page.locator('[data-umbra="action-bar"]')],
    ] as const) {
      const slider = host.getByRole('slider', { name: `Zoom, ${name}` });
      await slider.focus();
      await pressKeys(page, 'ArrowRight');
      await expect(slider).toHaveAttribute('aria-valuetext', '41');
      const stepper = host.getByRole('spinbutton', { name: `View, ${name}` });
      await stepper.focus();
      await pressKeys(page, 'ArrowUp');
      await expect(stepper).toHaveAttribute('aria-valuetext', 'Month');
      await host.getByRole('button', { name: 'More options' }).click();
      await expect(page.getByRole('menuitem', { name: 'Save a copy' })).toBeVisible();
      await pressKeys(page, 'Escape');
      // Each control keeps the height of its row: none makes the row taller than a button does.
      const heights = await host
        .locator('[data-umbra="split-button"], [data-umbra="stepper"], [data-umbra="slider"]')
        .evaluateAll((list) => list.map((el) => el.getBoundingClientRect().height));
      expect(heights).toHaveLength(3);
      for (const height of heights) expect(height).toBeLessThanOrEqual(40);
    }
  });

  test('narrow card header: the buttons move into the menu; the Stepper and the Slider stay, with their state', async ({
    page,
  }) => {
    await openStory(page, ALL, { width: 1920, height: 1080 });
    const header = card(page, 'Plan').locator('[data-part="header"]');
    const stepper = header.getByRole('spinbutton', { name: 'View, card' });
    await stepper.focus();
    await pressKeys(page, 'ArrowUp');
    await expect(stepper).toHaveAttribute('aria-valuetext', 'Month');
    await page.setViewportSize({ width: 1280, height: 720 });
    await settle(page);
    // The focused control stayed where it was: the same element, with its value.
    await expect(stepper).toBeFocused();
    await expect(stepper).toHaveAttribute('aria-valuetext', 'Month');
    await expect(header.getByRole('slider', { name: 'Zoom, card' })).toBeVisible();
    await expect(header.locator('[data-umbra="split-button"]')).toHaveCount(0);
    await header.getByRole('button', { name: 'More actions' }).click();
    const menu = page.getByRole('menu', { name: 'More actions' });
    await expect(menu.getByRole('menuitem', { name: 'Save', exact: true })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'More options' })).toBeVisible();
    await expect(menu.getByRole('spinbutton')).toHaveCount(0);
    await pressKeys(page, 'Escape');
    await expect(header.getByRole('button', { name: 'More actions' })).toBeFocused();
  });

  test('Planner toolbar: the app’s actions move into a menu before the list of months is unreadable', async ({
    page,
  }) => {
    await openStory(page, ALL);
    const toolbar = card(page, 'Plan').locator('[data-umbra="planner"] [data-part="toolbar"]');
    await expect(toolbar.getByRole('button', { name: 'Copy month' })).toHaveCount(0);
    const month = toolbar.locator('[data-umbra="select"]');
    expect((await month.boundingBox())!.width).toBeGreaterThanOrEqual(95);
    await expect(toolbar.getByRole('button', { name: 'Today' })).toBeVisible();
    const more = toolbar.getByRole('button', { name: 'More actions' });
    await more.click();
    // A control inside a component of the app stays in the row, as a control given directly does: the
    // menu holds the buttons only, and is whole.
    await expect(page.getByRole('menuitem')).toHaveText(['Copy month', 'Clear']);
    await expect(toolbar.getByRole('spinbutton', { name: 'Wrapped' })).toBeAttached();
    await pressKeys(page, 'Escape');
    await expect(more).toBeFocused();
    await noPageScroll(page);
    // Below the minimum window the columns are tabs and the planner has the whole width: all of it fits.
    await page.setViewportSize({ width: 1000, height: 720 });
    await settle(page);
    await expect(toolbar.getByRole('button', { name: 'Copy month' })).toBeVisible();
    await expect(toolbar.getByRole('spinbutton', { name: 'Wrapped' })).toBeVisible();
    await expect(more).toHaveCount(0);
    await expectFocusKept(page);
  });

  test('MediaCard: its actions move into a menu when the card is too narrow for them', async ({ page }) => {
    await openStory(page, ALL);
    const first = page.locator('[data-umbra="horizontal-scroller"] [data-part="item"]').first();
    await expect(first.getByRole('button', { name: 'Share' })).toBeVisible();
    await first.evaluate((el) => (el.style.width = '110px'));
    await settle(page);
    await expect(first.getByRole('button', { name: 'Share' })).toHaveCount(0);
    const more = first.getByRole('button', { name: 'More actions' });
    await more.click();
    await expect(page.getByRole('menuitem')).toHaveText(['Save', 'Share']);
    await pressKeys(page, 'Escape');
    await first.evaluate((el) => (el.style.width = ''));
    await expect(first.getByRole('button', { name: 'Share' })).toBeVisible();
  });

  test('a press on a field label focuses a Stepper', async ({ page }) => {
    await openStory(page, 'inputs-stepper--in-field');
    await page.locator('label', { hasText: 'Target' }).click();
    await expect(page.getByRole('spinbutton', { name: 'Target' })).toBeFocused();
  });
});

test.describe('larger pieces together', () => {
  test('MediaCards in a HorizontalScroller and in a WidgetBoard', async ({ page }) => {
    await openStory(page, ALL);
    const scroller = page.locator('[data-umbra="horizontal-scroller"]');
    const items = scroller.locator('[data-part="item"]');
    await expect(items).toHaveCount(6);
    const widths = await items.evaluateAll((list) =>
      list.map((el) => Math.round(el.getBoundingClientRect().width)),
    );
    expect(new Set(widths)).toEqual(new Set([220]));
    const track = scroller.locator('[data-part="track"]');
    const at = () => items.first().evaluate((el) => el.getBoundingClientRect().left);
    const start = await at();
    await scroller.getByRole('button', { name: 'Next' }).click();
    await expect.poll(at).toBeLessThan(start - 100);
    await expectFocusKept(page);
    await expect(track).toBeVisible();
    // On the board each card is as tall as the media card inside it, and collapses to its header.
    const board = page.locator('[data-umbra="widget-board"]');
    const widget = board.locator('[data-umbra="card"]').first();
    await expect(widget.locator('[data-umbra="media-card"]')).toBeVisible();
    const open = (await widget.boundingBox())!.height;
    await widget.getByRole('button', { name: /collapse/i }).click();
    await expect.poll(async () => (await widget.boundingBox())!.height).toBeLessThan(open - 40);
    await expectFocusKept(page);
    await noPageScroll(page);
  });

  test('the layout collapses the Planner’s card: its popover holds a planner with a height and a working grid', async ({
    page,
  }) => {
    await openStory(page, ALL, { width: 1280, height: 600 });
    const plan = card(page, 'Plan');
    await expect(plan).toHaveAttribute('data-collapsed', /.+/);
    // The week strip, of the higher priority, stays open and whole.
    await expect(card(page, 'This week').locator('[data-umbra="week-strip"]')).toBeVisible();
    await plan.getByRole('button', { name: 'Plan' }).click();
    const planner = page.locator(
      '[data-umbra="popover"] [data-umbra="planner"], [role="dialog"] [data-umbra="planner"]',
    );
    await expect(planner).toBeVisible();
    expect((await planner.boundingBox())!.height).toBeGreaterThan(150);
    const today = planner.locator('[data-cell][data-date="2026-10-14"][data-line="0"]');
    await today.focus();
    await pressKeys(page, 'ArrowRight');
    await expect(planner.locator('[data-cell][data-date="2026-10-15"][data-line="0"]')).toBeFocused();
    await pressKeys(page, 'Escape');
    await expect(planner).toBeHidden();
    await expectFocusKept(page);
    await noPageScroll(page);
  });

  test('a Planner and a WeekStrip in a Modal: as tall as their content, one tab stop each', async ({
    page,
  }) => {
    await openStory(page, ALL);
    const opener = page.getByRole('button', { name: 'In a modal' });
    await opener.click();
    const modal = page.getByRole('dialog', { name: 'Plan' });
    const week = modal.locator('[data-umbra="week-strip"]');
    const planner = modal.locator('[data-umbra="planner"]');
    await expect(week).toBeVisible();
    expect((await week.boundingBox())!.height).toBeGreaterThan(60);
    expect((await planner.boundingBox())!.height).toBeGreaterThan(150);
    await week.locator('[data-cell][data-date="2026-10-14"][data-line="0"]').focus();
    await pressKeys(page, 'ArrowRight');
    await expect(week.locator('[data-cell][data-date="2026-10-15"][data-line="0"]')).toBeFocused();
    expect(await week.locator('[data-cell][tabindex="0"]').count()).toBe(1);
    expect(await planner.locator('[data-cell][tabindex="0"]').count()).toBe(1);
    await pressKeys(page, 'Escape');
    await expect(modal).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test('the shortcuts of buttons: pressed by their keys, and listed by the ShortcutsSheet', async ({
    page,
  }) => {
    await openStory(page, ALL);
    await page.getByRole('button', { name: 'Keys' }).focus();
    await page.keyboard.press('Control+s');
    await expect(page.getByText('Saved 1 times')).toBeVisible();
    await page.getByRole('button', { name: 'Keys' }).click();
    const sheet = page.getByRole('dialog');
    const save = sheet.locator('[data-part="item"]', { hasText: 'Save the plan' });
    await expect(save.locator('[data-part="key"]')).toHaveText(['Ctrl', 'S']);
    await expect(sheet.locator('[data-part="item"]', { hasText: 'Show the tour' })).toBeVisible();
    await pressKeys(page, 'Escape');
    await expect(page.getByRole('button', { name: 'Keys' })).toBeFocused();
  });

  for (const direction of ['ltr', 'rtl']) {
    test(`${direction}: a spotlight on a day of the Planner, opened by a button’s shortcut`, async ({
      page,
    }) => {
      await openStory(page, ALL, { direction });
      await page.getByRole('button', { name: 'Keys' }).focus();
      await page.keyboard.press('Shift+T');
      const dialog = page.getByRole('dialog', { name: 'Today' });
      await expect(dialog).toBeVisible();
      const day = card(page, 'Plan').locator('[data-cell][data-date="2026-10-14"][data-line="0"]');
      const ring = page.locator('[data-umbra="spotlight"] [data-part="ring"]');
      await expect
        .poll(async () => {
          const [r, t] = [(await ring.boundingBox())!, (await day.boundingBox())!];
          return (
            Math.abs(r.x + r.width / 2 - (t.x + t.width / 2)) < 2 &&
            Math.abs(r.y + r.height / 2 - (t.y + t.height / 2)) < 2
          );
        })
        .toBe(true);
      // The callout is whole in the window and not over the day.
      const [d, t] = [(await dialog.boundingBox())!, (await day.boundingBox())!];
      expect(d.x).toBeGreaterThanOrEqual(0);
      expect(d.x + d.width).toBeLessThanOrEqual(1280);
      expect(
        d.x >= t.x + t.width || d.x + d.width <= t.x || d.y >= t.y + t.height || d.y + d.height <= t.y,
      ).toBe(true);
      await pressKeys(page, 'Escape');
      await expect(dialog).toBeHidden();
      await expectFocusKept(page);
      await noPageScroll(page);
    });
  }

  test('one ColorScaleEditor value colours a Slider, a PieIndicator, a Sparkline and a Heatmap', async ({
    page,
  }) => {
    await openStory(page, ALL);
    const scope = card(page, 'One scale (compact, teal)');
    const pie = scope.locator('[data-umbra="pie-indicator"]');
    const output = scope.locator('[data-umbra="slider"] [data-part="output"]');
    const bar = scope.locator('[data-umbra="sparkline"] [data-part="bar"]').nth(2);
    const cell = scope.locator('[data-part="cells"] [data-band]').nth(2).locator('[data-part="cell"]');
    // The level is 55: in the second band, "Fair", from 40.
    await expect(pie).toHaveAttribute('data-band', '1');
    await expect(output).toContainText('Fair');
    await expect(bar).toHaveAttribute('data-band', '1');
    const colour = (el: Locator) => el.evaluate((node) => getComputedStyle(node).fill);
    const fair = await colour(cell);
    // The second stop now starts at 60: 55 is in the first band, "Low", everywhere.
    const from = scope
      .locator('[data-umbra="color-scale-editor"]')
      .getByRole('spinbutton', { name: 'Stop 2: From' });
    await from.fill('60');
    await from.press('Enter');
    await expect(pie).toHaveAttribute('data-band', '0');
    await expect(output).toContainText('Low');
    await expect(bar).toHaveAttribute('data-band', '0');
    await expect.poll(() => colour(cell)).not.toBe(fair);
    // The scope: its density and tint reach the list a stop's colour choice opens.
    await scope.locator('[data-umbra="color-scale-editor"] [data-umbra="select"]').first().click();
    const list = page.locator('[role="listbox"][data-part="list"]');
    await expect(list).toBeVisible();
    expect(
      await list.evaluate((node) => [
        node.closest('[data-umbra-density]')?.getAttribute('data-umbra-density'),
        node.closest('[data-umbra-context]')?.getAttribute('data-umbra-context'),
      ]),
    ).toEqual(['compact', 'teal']);
    await pressKeys(page, 'Escape');
  });

  test('right to left: the scroller starts at the right, and the arrow keys of the week follow what is drawn', async ({
    page,
  }) => {
    await openStory(page, ALL, { direction: 'rtl' });
    const scroller = page.locator('[data-umbra="horizontal-scroller"]');
    const first = scroller.locator('[data-part="item"]').first();
    const [box, view] = [(await first.boundingBox())!, (await scroller.boundingBox())!];
    expect(Math.abs(box.x + box.width - (view.x + view.width))).toBeLessThan(4);
    const next = (await scroller.getByRole('button', { name: 'Next' }).boundingBox())!;
    expect(next.x).toBeLessThan(view.x + view.width / 2);
    const week = card(page, 'This week').locator('[data-umbra="week-strip"]');
    await week.locator('[data-cell][data-date="2026-10-14"][data-line="0"]').focus();
    await pressKeys(page, 'ArrowLeft');
    await expect(week.locator('[data-cell][data-date="2026-10-15"][data-line="0"]')).toBeFocused();
    await noPageScroll(page);
  });
});

test.describe('EntitySwitcher and ContextBlock in one TopBar', () => {
  test('as the bar narrows nothing overlaps or leaves the bar, and the switcher keeps its name', async ({
    page,
  }) => {
    await openStory(page, 'shell-entityswitcher--in-top-bar');
    const bar = page.locator('[data-umbra="top-bar"]').first();
    const switcher = bar.locator('[data-umbra="entity-switcher"]');
    for (const width of [1280, 900, 640, 420, 320]) {
      await page.setViewportSize({ width, height: 720 });
      await settle(page);
      const view = (await bar.boundingBox())!;
      const boxes = await bar
        .locator(
          '[data-umbra="entity-switcher"], [data-umbra="context-block"], [data-umbra="primary-action"]',
        )
        .evaluateAll((list) =>
          list
            .map((el) => el.getBoundingClientRect())
            .filter((box) => box.width > 0)
            .map((box) => [box.left, box.right]),
        );
      for (const [left, right] of boxes as [number, number][]) {
        expect(left).toBeGreaterThanOrEqual(view.x - 1);
        expect(right).toBeLessThanOrEqual(view.x + view.width + 1);
      }
      const sorted = [...(boxes as [number, number][])].sort((a, b) => a[0] - b[0]);
      for (let i = 1; i < sorted.length; i++)
        expect(sorted[i]![0]).toBeGreaterThanOrEqual(sorted[i - 1]![1] - 1);
      await expect(switcher.getByRole('button', { name: /Region 2/ }).first()).toBeVisible();
      await noPageScroll(page);
    }
  });
});

test.describe('content-sized cards in a stack that is too short', () => {
  const CARDS = 'integration-tier-2--content-cards';

  test('no card is shorter than its header: the content-sized cards give way, and scroll inside', async ({
    page,
  }) => {
    await openStory(page, CARDS, { width: 1024, height: 600, density: 'spacious' });
    await settle(page);
    const stack = page.locator('[data-umbra="stack"]').first();
    const cards = await stack.locator('> [data-umbra="card"]').evaluateAll((list) =>
      list.map((el) => {
        const header = el.querySelector<HTMLElement>(':scope > [data-part="header"]')!;
        const title = header.querySelector('h1, h2, h3, h4, h5, h6')!.getBoundingClientRect();
        const box = el.getBoundingClientRect();
        return {
          cut: header.scrollHeight - Math.round(box.height),
          titleInside: title.bottom <= box.bottom + 1,
        };
      }),
    );
    expect(cards).toHaveLength(4);
    await expect(card(page, 'Notes')).toHaveAttribute('data-collapsed', 'layout');
    for (const one of cards) {
      expect(one.cut).toBeLessThanOrEqual(1);
      expect(one.titleInside).toBe(true);
    }
    // Nothing leaves the stack.
    expect(
      await stack.evaluate((el) => {
        const last = el.lastElementChild!.getBoundingClientRect();
        return last.bottom <= el.getBoundingClientRect().bottom + 1;
      }),
    ).toBe(true);
    await noPageScroll(page);
  });

  test('a Comparison in a content-sized card keeps its rows, whatever sizes the window had before', async ({
    page,
  }) => {
    await openStory(page, CARDS);
    const sites = card(page, 'Sites');
    const whole = async () => {
      await settle(page);
      await expect(sites.locator('[data-part="strip"]')).toHaveCount(0);
      await expect(sites.getByText('On time')).toBeAttached();
    };
    await whole();
    const fresh = (await sites.boundingBox())!.height;
    await page.setViewportSize({ width: 1024, height: 600 });
    await whole();
    await page.setViewportSize({ width: 1280, height: 720 });
    await whole();
    expect((await sites.boundingBox())!.height).toBeCloseTo(fresh, 0);
  });

  test('a Sparkline in the trend slot of a SummaryTile has a width', async ({ page }) => {
    await openStory(page, CARDS);
    const spark = page.locator('[data-umbra="summary-tile"] [data-umbra="sparkline"]');
    expect((await spark.boundingBox())!.width).toBeGreaterThanOrEqual(48);
    await expect(spark.locator('svg')).toBeVisible();
  });

  test('a selected MediaCard: the selected fill, an edge that is not the fill, and aria-current', async ({
    page,
  }) => {
    await openStory(page, CARDS);
    const look = (el: Locator) =>
      el.evaluate((node) => [getComputedStyle(node).backgroundColor, getComputedStyle(node).boxShadow]);
    const cards = page.locator('[data-umbra="media-card"]');
    const [chosen, other] = [await look(cards.nth(0)), await look(cards.nth(1))];
    await expect(cards.nth(0)).toHaveAttribute('aria-current', 'true');
    await expect(cards.nth(1)).not.toHaveAttribute('aria-current', 'true');
    expect(chosen[0]).not.toBe(other[0]);
    expect(chosen[1]).not.toBe('none');
    expect(other[1]).toBe('none');
  });
});

test('a day with more items than slots says so: "+1" beside the date, named by the items it stands for', async ({
  page,
}) => {
  await openStory(page, 'integration-tier-2--content-cards');
  const day = page.locator('[data-umbra="week-strip"] [data-cell][data-date="2026-10-11"][data-line="0"]');
  const mark = day.locator('[data-part="hiddenItems"]');
  await expect(mark).toHaveText('+1');
  await expect(mark).toHaveAttribute('aria-label', /^1 more: \S/);
  // A day whose items all have a slot has no mark.
  await expect(
    page.locator('[data-umbra="week-strip"] [data-cell][data-date="2026-10-15"] [data-part="hiddenItems"]'),
  ).toHaveCount(0);
  await mark.hover();
  await expect(page.getByRole('tooltip')).toContainText('1 more: ');
});
