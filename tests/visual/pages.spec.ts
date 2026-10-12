import { expect, test, type Locator, type Page } from '@playwright/test';
import { densities } from '../../src/styles/tokens.generated';
import { expectFocusKept, openStory, pressKeys, settle } from './helpers';

// The five full-page reference stories (src/stories/pages): they fill any window without a page
// scroll, turn into tabs below the minimum window, and work from the keyboard end to end.
const pages = [
  {
    id: 'pages-overview--overview',
    name: 'Overview',
    tabs: ['Inbox', 'Summary', 'Status'],
    action: 'Updates',
  },
  {
    id: 'pages-list-and-detail--list-and-detail',
    name: 'List and detail',
    tabs: ['Requests', 'Request'],
    action: 'Search requests',
  },
  { id: 'pages-table--table', name: 'Table', tabs: ['Orders', 'Summary'], action: 'Export' },
  { id: 'pages-planning--planning', name: 'Planning', tabs: ['Schedule', 'Week'], action: 'Copy month' },
  { id: 'pages-analysis--analysis', name: 'Analysis', tabs: ['Charts', 'Sites'], action: 'Scale' },
] as const;
const [overview, listDetail, table, planning, analysis] = pages;

const problems = new WeakMap<Page, string[]>();
const open = async (
  page: Page,
  id: string,
  width = 1280,
  height = 720,
  density = 'default',
  direction = 'ltr',
) => {
  const seen: string[] = [];
  problems.set(page, seen);
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && seen.push(m.text()));
  page.on('pageerror', (error) => seen.push(String(error)));
  await page.setViewportSize({ width, height });
  await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=density:${density};direction:${direction}`);
  await page.locator('#storybook-root > *').first().waitFor();
  // No font face is loaded ahead of time: one that first loads when a menu opens must disturb nothing.
  await page.evaluate(() => document.fonts.ready);
};

/** How far the document scrolls, and the cards and bars that reach outside the window. */
const overflow = (page: Page) =>
  page.evaluate(async () => {
    // Two frames: the layout measures itself after a resize.
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
    const d = document.documentElement;
    const outside = [
      ...document.querySelectorAll('[data-umbra="card"], [data-umbra="top-bar"], [data-umbra="sub-nav"]'),
    ]
      .filter((el) => {
        // The widgets of a board scroll inside it: one below its edge is not outside the window.
        if (el.closest('[data-part="grid"]')) return false;
        const r = el.getBoundingClientRect();
        return (
          r.width > 0 &&
          (r.left < 0 || r.top < 0 || r.right > innerWidth + 0.5 || r.bottom > innerHeight + 0.5)
        );
      })
      .map((el) => el.textContent?.slice(0, 30));
    return { x: d.scrollWidth - d.clientWidth, y: d.scrollHeight - d.clientHeight, outside };
  });
const fits = { x: 0, y: 0, outside: [] };

const card = (page: Page, title: string) =>
  page
    .locator('[data-umbra="card"]')
    .filter({ has: page.getByRole('heading', { name: title, exact: true }) });
/** Presses Tab until `target` has focus. */
const tabTo = async (page: Page, target: Locator, max = 80) => {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    if (await target.evaluate((el) => el === document.activeElement || el.contains(document.activeElement)))
      return;
  }
  throw new Error(`Tab did not reach ${target}`);
};
/** What has focus in a table: its row key and its column id. */
const focusedCell = (page: Page) =>
  page.evaluate(() => {
    const cell = document.activeElement?.closest<HTMLElement>('[data-cell]');
    return { row: cell?.parentElement?.dataset.rowKey ?? null, col: cell?.dataset.col ?? null };
  });

const widths = [1024, 1280, 1440, 1920, 2560];
const heights = [600, 720, 900, 1080, 1200, 1440];
// Sizes no screen has, but a window can: very tall, very wide, very large.
const odd = [
  [1024, 1400],
  [2560, 600],
  [3840, 2160],
] as const;

for (const { id, name, tabs, action } of pages) {
  test.describe(name, () => {
    for (const density of densities) {
      test(`fills every window without a page scroll, ${density}`, async ({ page }) => {
        test.slow();
        await open(page, id, 1024, 600, density);
        for (const [width, height] of [
          ...widths.flatMap((w) => heights.map((h) => [w, h] as const)),
          ...odd,
        ]) {
          await page.setViewportSize({ width, height });
          expect(await overflow(page), `${width}x${height}`).toEqual(fits);
        }
        expect(problems.get(page)).toEqual([]);
      });
    }

    test('stays inside the window after a rapid sequence of resizes', async ({ page }) => {
      await open(page, id);
      const sizes = [
        [1920, 1080], [1024, 600], [900, 560], [2560, 600], [1024, 1400], [800, 500],
        [1280, 720], [1024, 600], [3840, 2160], [640, 480], [1440, 900], [1024, 600],
      ] as const; // prettier-ignore
      // No waiting between them: the layout must settle on the last size only.
      for (const [width, height] of sizes) await page.setViewportSize({ width, height });
      expect(await overflow(page)).toEqual(fits);
      await expect(page.getByRole('tablist', { name: 'Columns' })).toHaveCount(0);
      for (const [width, height] of [...sizes].reverse()) await page.setViewportSize({ width, height });
      expect(await overflow(page)).toEqual(fits);
      expect(problems.get(page)).toEqual([]);
    });

    test('below the minimum window every column is a tab', async ({ page }) => {
      await open(page, id, 900, 560);
      const strip = page.getByRole('tablist', { name: 'Columns' });
      await expect(strip.getByRole('tab')).toHaveText([...tabs]);
      await strip.getByRole('tab').first().focus();
      for (const [i, label] of tabs.entries()) {
        if (i > 0) await page.keyboard.press('ArrowRight');
        const tab = strip.getByRole('tab', { name: label, exact: true });
        await expect(tab).toHaveAttribute('aria-selected', 'true');
        const panel = page.locator(`#${await tab.getAttribute('aria-controls')}`);
        await expect(panel).toBeVisible();
        expect((await panel.innerText()).trim().length).toBeGreaterThan(20);
        expect(await overflow(page)).toEqual(fits);
      }
      // Back at the minimum window the columns return.
      await page.setViewportSize({ width: 1024, height: 600 });
      await expect(strip).toHaveCount(0);
    });

    test('keyboard: the skip link, the navigation, the page content and a card action', async ({ page }) => {
      await open(page, id);
      await page.keyboard.press('Tab');
      await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();

      // The navigation is one tab stop; arrow keys move inside it.
      const nav = page.getByRole('navigation', { name: 'Main' });
      await tabTo(page, nav);
      const start = await page.evaluate(() => document.activeElement?.textContent);
      await page.keyboard.press('ArrowRight');
      expect(await page.evaluate(() => document.activeElement?.textContent)).not.toBe(start);
      await expect(nav.locator(':focus')).toHaveCount(1);

      // Every control of the page is reached by Tab alone, down to an action inside a card or header.
      const main = page.getByRole('main');
      await tabTo(page, main);
      const control = main
        .getByRole('button', { name: action })
        .or(main.getByRole('searchbox', { name: action }));
      await tabTo(page, control.first());
      await expect(control.first()).toBeFocused();
    });

    test('Mod+K opens the command palette, and a command goes to another page', async ({ page }) => {
      await open(page, id);
      await page.keyboard.press('Control+k');
      const palette = page.getByRole('dialog');
      await expect(palette).toBeVisible();
      const target = id === table.id ? ['Summary', 'Inbox'] : ['All orders', 'Orders'];
      await page.keyboard.type(target[0]!);
      await expect(palette.getByRole('option').first()).toContainText(target[0]!);
      await page.keyboard.press('Enter');
      await expect(palette).toHaveCount(0);
      await expect(card(page, target[1]!)).toBeVisible();
      expect(await overflow(page)).toEqual(fits);

      // The history buttons walk the places the palette and the navigation went to.
      await page.getByRole('button', { name: 'Back', exact: true }).click();
      await expect(card(page, target[1]!)).toHaveCount(0);
      await page.getByRole('button', { name: 'Forward', exact: true }).click();
      await expect(card(page, target[1]!)).toBeVisible();
      // F16 of review 3: the history keys work from a link of the navigation too. There the arrow
      // keys alone move between the links, and took the key with Alt as well.
      await page.getByRole('navigation', { name: 'Main' }).locator('a, button').first().focus();
      await pressKeys(page, 'Alt+ArrowLeft');
      await expect(card(page, target[1]!)).toHaveCount(0);
      await pressKeys(page, 'Alt+ArrowRight');
      await expect(card(page, target[1]!)).toBeVisible();
      expect(problems.get(page)).toEqual([]);
    });
  });
}

test.describe('Overview', () => {
  test('at a short height the stack collapses its lowest-priority cards, and one opens in a popover', async ({
    page,
  }) => {
    await open(page, overview.id, 1920, 1080);
    const collapsed = page.locator('[data-umbra="card"][data-collapsed="layout"]');
    await expect(collapsed).toHaveCount(0);

    await page.setViewportSize({ width: 1280, height: 720 });
    // "This week" has the lowest priority; "Insights" the highest.
    await expect(card(page, 'This week')).toHaveAttribute('data-collapsed', 'layout');
    await expect(card(page, 'Insights')).not.toHaveAttribute('data-collapsed');
    await expect(card(page, 'Next review')).not.toHaveAttribute('data-collapsed');

    const header = card(page, 'This week').getByRole('button', { name: 'This week' });
    await header.focus();
    await page.keyboard.press('Enter');
    const popover = page.getByRole('dialog');
    await expect(popover.getByText('Quarter close')).toBeVisible();
    // A banner fills the width it is given (it used to collapse to its padding in a row).
    const banner = await popover.locator('[data-umbra="banner"]').boundingBox();
    const body = await popover.locator('[data-part="body"]').boundingBox();
    expect(banner!.width).toBeGreaterThan(body!.width * 0.8);
    // The card is at the bottom of the window: its popover opens upwards, whole and inside the window.
    await expect
      .poll(async () => {
        const [panel, anchor] = [await popover.boundingBox(), await header.boundingBox()];
        return panel!.y >= 0 && panel!.y + panel!.height <= anchor!.y && panel!.height > 100;
      })
      .toBe(true);
    await page.keyboard.press('Escape');
    await expect(popover).toHaveCount(0);
    await expect(header).toBeFocused();

    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(collapsed).toHaveCount(0);
  });

  test('the cards of the stack change state once as the height changes, the same from either side', async ({
    page,
    browser,
  }) => {
    // The highest-priority card used to flip open and closed on every pixel between 600 and 628 here:
    // its floor was measured from the open header while it was open, and from the collapsed one after.
    test.slow();
    const states = (target: Page) =>
      target.evaluate(() =>
        [...document.querySelectorAll('[data-umbra="stack"]')]
          .map((stack) =>
            [...stack.querySelectorAll(':scope > [data-umbra="card"]')]
              .map((el) => ((el as HTMLElement).dataset.collapsed ? 'c' : 'o'))
              .join(''),
          )
          .join('|'),
      );
    const at = async (height: number) => {
      await page.setViewportSize({ width: 1024, height });
      await settle(page);
      return states(page);
    };
    await openStory(page, overview.id, { width: 1024, height: 700, density: 'spacious' });
    const heights = Array.from({ length: 101 }, (_, i) => 700 - i);
    const down = new Map<number, string>();
    for (const height of heights) down.set(height, await at(height));
    const up = new Map<number, string>();
    for (const height of [...heights].reverse()) up.set(height, await at(height));

    // The same state at every height, whichever way it was reached.
    expect(Object.fromEntries(up)).toEqual(Object.fromEntries(down));
    // Each card changes state at most once over the sweep.
    const cards = down.get(700)!.length;
    for (let i = 0; i < cards; i++) {
      const sequence = heights.map((height) => down.get(height)![i]);
      const changes = sequence.filter((state, n) => n > 0 && state !== sequence[n - 1]).length;
      expect(changes, `card ${i}: ${sequence.join('')}`).toBeLessThanOrEqual(1);
    }
    // The column is never left with headers only (the old state at 600, 606, 613 and 620).
    expect([...down.values()].every((state) => state.includes('o'))).toBe(true);
    // A fresh load at a height gives the state the resize gave.
    for (const height of [600, 606, 613, 620, 628, 650, 700]) {
      const fresh = await browser.newPage();
      await openStory(fresh, overview.id, { width: 1024, height, density: 'spacious' });
      await fresh.evaluate(() => document.fonts.ready);
      await settle(fresh);
      expect(await states(fresh), `fresh load at ${height}`).toBe(down.get(height));
      await fresh.close();
    }
  });

  test('the inbox filters, and selecting a message marks it read', async ({ page }) => {
    await open(page, overview.id);
    const inbox = card(page, 'Inbox');
    const rows = inbox.locator('[role="row"][aria-selected]');
    await expect(rows).toHaveCount(18);
    await inbox.getByRole('radio', { name: /Unread/ }).click();
    await expect(rows).toHaveCount(6);
    await expect(page.getByRole('button', { name: /Notifications/ })).toHaveAccessibleName(/6/);
    // A selected message is read: the counts follow, and the row stays until another is selected.
    await inbox.getByRole('row', { name: 'Onboarding review' }).click();
    await expect(inbox.getByRole('row', { name: 'Onboarding review' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(rows).toHaveCount(6);
    await expect(inbox.getByRole('radio', { name: /Unread/ })).toContainText('5');
    await expect(page.getByRole('button', { name: /Notifications/ })).toHaveAccessibleName(/5/);
  });

  test('a table in the summary card hides columns in a narrow window and keeps its highlighted row', async ({
    page,
  }) => {
    await open(page, overview.id, 1920, 1080);
    const ranking = page.getByRole('grid', { name: 'Regional ranking' });
    await expect(ranking.getByRole('columnheader', { name: 'Late' })).toBeVisible();
    await expect(ranking.locator('tr[data-highlighted]')).toContainText('Region 5');
    await page.setViewportSize({ width: 1024, height: 600 });
    await expect(ranking.getByRole('columnheader', { name: 'Late' })).toHaveCount(0);
    await expect(ranking.getByRole('columnheader', { name: 'Val' })).toBeVisible();
  });
});

test.describe('List and detail', () => {
  const title = (page: Page) => page.locator('[data-umbra="page-header"]').getByRole('heading');

  test('selecting a row changes the detail, by click and by arrow keys; the search filters', async ({
    page,
  }) => {
    await open(page, listDetail.id);
    const list = card(page, 'Requests');
    await expect(title(page)).toHaveText('Trainee stands out in audit');
    await list.getByRole('row', { name: /Planning advice/ }).click();
    await expect(title(page)).toHaveText('Planning advice');
    await expect(page.getByText('Must respond')).toBeVisible();

    await page.keyboard.press('ArrowDown');
    await expect(title(page)).toHaveText('Schedule clash for Team 2');
    await expect(page.getByText('No answer needed')).toBeVisible();

    await list.getByRole('searchbox', { name: 'Search requests' }).fill('invoice');
    await expect(list.getByRole('row')).toHaveCount(1);
    await list.getByRole('searchbox', { name: 'Search requests' }).fill('nothing like this');
    await expect(list.getByText('No requests found')).toBeVisible();
  });

  test('the approve modal opens from the keyboard and returns focus; declining asks first', async ({
    page,
  }) => {
    await open(page, listDetail.id);
    const approve = page.getByRole('group', { name: 'Decision' }).getByRole('button', { name: 'Approve' });
    await approve.focus();
    await page.keyboard.press('Enter');
    const modal = page.getByRole('dialog', { name: 'Approve the request' });
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('textbox', { name: /Note/ })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(modal).toHaveCount(0);
    await expect(approve).toBeFocused();

    const decline = page.getByRole('button', { name: 'Decline' });
    await decline.click();
    const confirm = page.getByRole('alertdialog', { name: 'Decline this request?' });
    await expect(confirm.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(confirm).toHaveCount(0);
    await expect(decline).toBeFocused();

    await approve.click();
    await modal.getByRole('button', { name: 'Approve' }).click();
    await expect(modal).toHaveCount(0);
    await expect(page.getByRole('group', { name: 'Decision' })).toContainText('Approved');
    await expect(approve).toBeDisabled();
  });

  test('the header menu opens with its submenu, and the tabs switch the pane', async ({ page }) => {
    await open(page, listDetail.id, 1920, 1080);
    await page.getByRole('button', { name: 'More actions' }).click();
    const menu = page.getByRole('menu');
    await expect(menu.getByRole('menuitem', { name: 'Archive' })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Reopen' })).toHaveAttribute('aria-disabled', 'true');
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);

    await page.getByRole('tab', { name: /Activity/ }).click();
    await expect(page.getByRole('grid', { name: 'Activity' })).toBeVisible();
  });
});

test.describe('Table', () => {
  const grid = (page: Page) => page.getByRole('grid', { name: 'Orders' });
  const rows = (page: Page) => grid(page).locator('tbody > tr[data-kind="row"]');
  const amounts = async (page: Page) =>
    (await grid(page).locator('tbody > tr[data-kind="row"] > [data-col="amount"]').allTextContents()).map(
      (text) => Number(text.replace(/[^0-9]/g, '')),
    );

  test('sorts by a column from the keyboard', async ({ page }) => {
    await open(page, table.id);
    const header = grid(page).getByRole('columnheader', { name: 'Amount' });
    await header.getByRole('button').focus();
    await page.keyboard.press('Enter');
    await expect(header).toHaveAttribute('aria-sort', 'descending');
    // The rows in view belong to the first group, and are sorted inside it.
    const values = (await amounts(page)).slice(0, 8);
    expect(values).toEqual([...values].sort((a, b) => b - a));
    await page.keyboard.press('Enter');
    await expect(header).toHaveAttribute('aria-sort', 'ascending');
  });

  test('selected rows show the bulk action bar, and archiving removes them', async ({ page }) => {
    await open(page, table.id);
    const bar = page.getByRole('group', { name: 'Selected orders' });
    await expect(bar).toBeHidden();
    for (const row of [0, 2])
      await rows(page).nth(row).locator('[data-col="__select"] [data-umbra="checkbox"]').click();
    await expect(grid(page).getByRole('checkbox', { name: 'Select Order 1009' })).toBeChecked();
    await expect(bar).toBeVisible();
    await expect(bar).toContainText('2 selected');
    await bar.getByRole('button', { name: 'Archive' }).click();
    await expect(bar).toBeHidden();
    await expect(grid(page).getByRole('rowheader', { name: 'Order 1001' })).toHaveCount(0);
    await expect(grid(page).locator('tfoot')).toContainText('598 orders');
  });

  test('the table holds 600 rows but renders only those in view', async ({ page }) => {
    await open(page, table.id);
    await expect(grid(page)).toHaveAttribute('aria-rowcount', /^6\d\d$/);
    expect(await rows(page).count()).toBeLessThan(80);
  });

  test('columns hide as the window narrows and return as it widens', async ({ page }) => {
    await open(page, table.id, 2560, 1080);
    const header = (name: string) => grid(page).getByRole('columnheader', { name, exact: true });
    const count = () => grid(page).getByRole('columnheader').count();
    const wide = await count();
    expect(wide).toBeGreaterThan(20);
    await page.setViewportSize({ width: 1024, height: 600 });
    await expect(header('Owner')).toHaveCount(0);
    // The pinned first column and the most important ones stay.
    for (const name of ['Order', 'Status', 'Amount']) await expect(header(name)).toBeVisible();
    expect(await count()).toBeLessThan(wide - 8);
    await page.setViewportSize({ width: 2560, height: 1080 });
    await expect(header('Owner')).toBeVisible();
    expect(await count()).toBe(wide);
  });

  test('arrow keys move the focused cell', async ({ page }) => {
    await open(page, table.id);
    await rows(page).first().locator('[data-col="client"]').click();
    const start = await focusedCell(page);
    expect(start.col).toBe('client');
    await page.keyboard.press('ArrowRight');
    const right = await focusedCell(page);
    expect(right.row).toBe(start.row);
    expect(right.col).not.toBe('client');
    await page.keyboard.press('ArrowDown');
    const down = await focusedCell(page);
    expect(down.col).toBe(right.col);
    expect(down.row).not.toBe(start.row);
    await page.keyboard.press('Home');
    expect((await focusedCell(page)).row).toBe(down.row);
  });

  test('the toolbar and the views filter the rows, and the summary follows', async ({ page }) => {
    await open(page, table.id, 1920, 1080);
    const foot = grid(page).locator('tfoot');
    await expect(foot).toContainText('600 orders');
    await page.getByRole('radio', { name: /Blocked/ }).click();
    await expect(foot).toContainText('85 orders');
    await page.getByRole('button', { name: 'Reset' }).click();
    await page
      .getByRole('navigation', { name: 'Views' })
      .getByRole('button', { name: /My orders/ })
      .click();
    await expect(foot).toContainText('24 orders');
    await expect(page.locator('[data-umbra="summary-tile"]').first()).toContainText('24 orders');
    // Without groups the group header rows go.
    await expect(grid(page).locator('tr[data-kind="group"]')).not.toHaveCount(0);
    const grouping = page.getByRole('button', { name: /Group by/ });
    await expect(grouping).toContainText('By stage');
    await grouping.click();
    await page.getByRole('option', { name: 'No groups' }).click();
    await expect(grouping).toContainText('No groups');
    await expect(grid(page).locator('tr[data-kind="group"]')).toHaveCount(0);
  });

  test('at the spacious density the selection column draws no ellipsis beside its checkbox', async ({
    page,
  }) => {
    await open(page, table.id, 1280, 720, 'spacious');
    const cell = rows(page).first().locator('[data-col="__select"]');
    expect(await cell.evaluate((el) => getComputedStyle(el).textOverflow)).toBe('clip');
  });
});

// The two pages of tier 2: the time group, the new charts, the tour and the sheet of shortcuts.
const tier2 = [
  {
    ...planning,
    steps: ['Move between months', 'Settings of a week', 'The week at a glance', 'Another team'],
    own: 'Copy the month',
    other: 'Edit the scale',
    regions: ['entity-switcher', 'planner', 'week-strip', 'list'],
  },
  {
    ...analysis,
    steps: ['Pick a report', 'A board of widgets', 'One scale for the page'],
    own: 'Edit the scale',
    other: 'Copy the month',
    regions: ['horizontal-scroller', 'widget-board', 'data-table', 'action-bar'],
  },
];

for (const { id, name, steps, own, other, regions } of tier2) {
  test.describe(name, () => {
    test('Tab walks through every region of the page, and focus is never lost', async ({ page }) => {
      await open(page, id, 1920, 1080);
      const seen = new Set<string>();
      let stops = 0;
      for (; stops < 80; stops++) {
        await page.keyboard.press('Tab');
        const around = await page.evaluate(() => {
          const names: string[] = [];
          for (let el = document.activeElement; el && el !== document.body; el = el.parentElement)
            if (el instanceof HTMLElement && el.dataset.umbra) names.push(el.dataset.umbra);
          return document.activeElement === document.body ? null : names;
        });
        // The body has the focus only once the walk is past the last control of the document.
        if (!around) break;
        for (const region of around) seen.add(region);
      }
      expect(stops).toBeGreaterThan(20);
      for (const region of regions) expect([...seen], region).toContain(region);
      // The next Tab starts again at the skip link.
      await pressKeys(page, 'Tab');
      await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
      expect(problems.get(page)).toEqual([]);
    });

    test('the tour lights real elements of the page step by step, and returns the focus', async ({
      page,
    }) => {
      await open(page, id);
      const button = page.getByRole('button', { name: 'Tour', exact: true });
      await button.click();
      const callout = page.getByRole('dialog');
      for (const [i, title] of steps.entries()) {
        await expect(callout).toHaveAccessibleName(title);
        await expect(callout).toContainText(`${i + 1} of ${steps.length}`);
        // The ring is around something that is drawn, inside the window.
        await expect
          .poll(async () => {
            const ring = await page.locator('[data-umbra="spotlight"] [data-part="ring"]').boundingBox();
            return (
              !!ring && ring.width > 20 && ring.height > 10 && ring.x >= -1 && ring.x + ring.width <= 1281
            );
          })
          .toBe(true);
        await expectFocusKept(page);
        expect(await overflow(page)).toEqual(fits);
        await callout.getByRole('button', { name: i === steps.length - 1 ? 'Done' : 'Next' }).click();
      }
      await expect(callout).toHaveCount(0);
      await expect(button).toBeFocused();

      // Its shortcut starts it again from the first step; Escape leaves it.
      await page.keyboard.press('Shift+T');
      await expect(callout).toHaveAccessibleName(steps[0]!);
      await page.keyboard.press('Escape');
      await expect(callout).toHaveCount(0);
      await expectFocusKept(page);
      expect(problems.get(page)).toEqual([]);
    });

    test('? and the help button open the sheet of shortcuts, and the palette runs one', async ({ page }) => {
      await open(page, id);
      await page.keyboard.press('?');
      const sheet = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
      // Only what can run here: the keys of the other page are bound by nothing on this one.
      await expect(sheet.getByText('Take the tour')).toBeVisible();
      await expect(sheet.getByText(own)).toBeVisible();
      await expect(sheet.getByText(other)).toHaveCount(0);
      expect(await overflow(page)).toEqual(fits);
      await page.keyboard.press('Escape');
      await expect(sheet).toHaveCount(0);

      const help = page.getByRole('button', { name: 'Keyboard shortcuts' });
      await help.click();
      await page.keyboard.type('tour');
      await expect(sheet.getByRole('listitem')).toHaveCount(1);
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
      await expect(sheet).toHaveCount(0);
      await expect(help).toBeFocused();

      await page.keyboard.press('Control+k');
      await page.keyboard.type('Take the tour');
      const palette = page.getByRole('dialog', { name: 'Command palette' });
      await expect(palette.getByRole('option').first()).toContainText('Take the tour');
      await page.keyboard.press('Enter');
      await expect(page.getByRole('dialog', { name: steps[0]! })).toBeVisible();
      await expect(palette).toHaveCount(0);
      expect(problems.get(page)).toEqual([]);
    });

    test('right to left: the page mirrors and still fits', async ({ page }) => {
      await open(page, id, 1280, 720, 'default', 'rtl');
      await expect(page.locator('[data-umbra-root]').last()).toHaveAttribute('dir', 'rtl');
      // The navigation starts at the right, and the main action of the bar is at the left.
      const nav = await page.getByRole('navigation', { name: 'Main' }).boundingBox();
      const action = await page.locator('[data-umbra="primary-action"]').boundingBox();
      expect(nav!.x).toBeGreaterThan(action!.x + action!.width);
      for (const [width, height] of [
        [1920, 1080],
        [1280, 720],
        [1024, 600],
        [900, 560],
      ] as const) {
        await page.setViewportSize({ width, height });
        expect(await overflow(page), `${width}x${height}`).toEqual(fits);
      }
      expect(problems.get(page)).toEqual([]);
    });
  });
}

test.describe('Planning', () => {
  test.beforeEach(({ page }) => open(page, planning.id));
  const planner = (page: Page) => page.locator('[data-umbra="planner"]');

  test('the month changes by the buttons, the list and the keyboard, within its limits', async ({ page }) => {
    const grid = planner(page).getByRole('grid');
    await expect(grid).toHaveAccessibleName('Schedule, October 2026');
    const next = planner(page).getByRole('button', { name: 'Next month' });
    await next.click();
    await expect(grid).toHaveAccessibleName('Schedule, November 2026');
    await expect(next).toBeDisabled();
    await planner(page).getByRole('button', { name: 'Today' }).click();
    await expect(grid).toHaveAccessibleName('Schedule, October 2026');

    await planner(page).locator('[data-part="toolbar"] [data-part="trigger"]').click();
    await page.getByRole('option', { name: 'September 2026' }).click();
    await expect(grid).toHaveAccessibleName('Schedule, September 2026');
    await expect(planner(page).getByRole('button', { name: 'Previous month' })).toBeDisabled();

    // In the grid, Page Down and Page Up change the month and the focus stays in the grid.
    await tabTo(page, grid);
    await pressKeys(page, 'PageDown');
    await expect(grid).toHaveAccessibleName('Schedule, October 2026');
    await expect(grid.locator(':focus')).toHaveCount(1);
    await pressKeys(page, 'PageDown', 'PageDown');
    await expect(grid).toHaveAccessibleName('Schedule, November 2026');
    // The arrow keys move through the days and their slots, and never out of the grid.
    await pressKeys(page, 'ArrowRight', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'End', 'Home', 'ArrowUp');
    await expect(grid.locator(':focus')).toHaveCount(1);
    expect(await overflow(page)).toEqual(fits);
    expect(problems.get(page)).toEqual([]);
  });

  test('selecting a day moves the week strip, and clearing a week empties it', async ({ page }) => {
    const strip = page.locator('[data-umbra="week-strip"]');
    await expect(strip.locator('time').first()).toHaveAttribute('datetime', '2026-10-05');
    await planner(page).getByRole('gridcell', { name: 'Tuesday, October 20, 2026' }).click();
    await expect(strip.locator('time').first()).toHaveAttribute('datetime', '2026-10-19');

    const planned = page.locator('[data-umbra="page-header"]').getByText('Planned').locator('..');
    await expect(planned).toContainText('234');
    const week = planner(page).getByRole('rowheader', { name: 'Week, Oct 19 – 25' });
    const clear = week.getByRole('button', { name: 'Clear' });
    await clear.click();
    await expect(clear).toBeDisabled();
    await expect(planned).not.toContainText('234');
    await expect(strip.locator('[data-umbra="schedule-slot"]:not([data-variant="empty"])')).toHaveCount(0);
    await expectFocusKept(page);
    expect(problems.get(page)).toEqual([]);
  });

  test('the controls beside a week keep their own values', async ({ page }) => {
    const week = planner(page).getByRole('rowheader', { name: 'Week, Oct 5 – 11' });
    await week.getByRole('slider').focus();
    await pressKeys(page, 'ArrowRight');
    await expect(week.getByRole('status')).toHaveText('65% · Normal');
    await pressKeys(page, 'End');
    await expect(week.getByRole('status')).toHaveText('100% · Heavy');
    await week.getByRole('button', { name: 'Focus of the week' }).click();
    await page.getByRole('option', { name: 'Reviews first' }).click();
    await expect(week.getByRole('button', { name: 'Focus of the week' })).toContainText('Reviews first');
    // The week before is as it was.
    const before = planner(page).getByRole('rowheader', { name: 'Week, Sep 28 – Oct 4' });
    await expect(before.getByRole('status')).toHaveText('60% · Normal');
    await expect(before.getByRole('button', { name: 'Focus of the week' })).toContainText('Balanced');
  });

  test('the switcher in the bar steps to the next team and finds one by name', async ({ page }) => {
    const bar = page.getByRole('navigation', { name: 'Section' });
    const overline = page.locator('[data-umbra="page-header"] [data-part="overline"]');
    await expect(overline).toHaveText('Team 2');
    await bar.getByRole('button', { name: 'Next: Team 3' }).click();
    await expect(overline).toHaveText('Team 3');
    await bar.getByRole('button', { name: 'Team 3', exact: true }).click();
    await page.keyboard.type('Team 6');
    const rows = page.getByRole('dialog').locator('[data-part="row"]');
    await expect(rows).toHaveCount(1);
    await rows.click();
    await expect(overline).toHaveText('Team 6');
    await expectFocusKept(page);
    expect(problems.get(page)).toEqual([]);
  });
});

test.describe('Analysis', () => {
  test.beforeEach(({ page }) => open(page, analysis.id));
  /** The band of every bar, the colour of every cell of the heatmap, and the text of the table's indicators. */
  const looks = (page: Page) =>
    page.evaluate(() => ({
      bars: [...document.querySelectorAll<SVGElement>('[data-part="bars"] [data-band]')].map(
        (el) => el.dataset.band,
      ),
      cells: [...document.querySelectorAll('[data-part="cells"] [data-part="cell"]')].map(
        (el) => getComputedStyle(el).fill,
      ),
      pies: [...document.querySelectorAll('[data-umbra="data-table"] [data-umbra="pie-indicator"]')].map(
        (el) => el.textContent,
      ),
    }));

  test('the scale editor recolours the charts and the table while it is open', async ({ page }) => {
    const before = await looks(page);
    expect(before.bars).toHaveLength(8);
    expect(before.cells).toHaveLength(50);

    await page.keyboard.press('Shift+S');
    const dialog = page.getByRole('dialog', { name: 'Scale' });
    const from = dialog.getByRole('spinbutton', { name: 'Stop 3: From' });
    await from.fill('85');
    await from.press('Tab');
    await expect.poll(() => looks(page)).not.toEqual(before);
    // Every part of the page follows: the bars change band, the cells colour, the table its labels.
    const moved = await looks(page);
    expect(moved.bars).not.toEqual(before.bars);
    expect(moved.cells).not.toEqual(before.cells);
    expect(moved.pies).not.toEqual(before.pies);

    // Another colour for a band reaches the cells too.
    await dialog.getByRole('button', { name: 'Stop 1: Colour' }).click();
    await page.getByRole('option', { name: 'Info' }).click();
    await expect.poll(async () => (await looks(page)).cells).not.toEqual(moved.cells);

    await dialog.getByRole('group', { name: 'Scale' }).getByRole('button', { name: 'Reset' }).click();
    await expect.poll(() => looks(page)).toEqual(before);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expectFocusKept(page);
    expect(await overflow(page)).toEqual(fits);
    expect(problems.get(page)).toEqual([]);
  });

  test('the stepper and the slider of the settings change the charts', async ({ page }) => {
    const scale = page.getByRole('button', { name: 'Scale', exact: true });
    await scale.click();
    const dialog = page.getByRole('dialog', { name: 'Scale' });
    await dialog.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(dialog.getByRole('spinbutton', { name: 'Sites in the bar chart' })).toHaveAttribute(
      'aria-valuenow',
      '10',
    );
    await expect(page.locator('[data-part="bars"] [data-band]')).toHaveCount(10);
    await dialog.getByRole('slider', { name: 'Target' }).focus();
    await pressKeys(page, 'ArrowRight', 'ArrowRight');
    await expect(dialog.getByRole('group', { name: 'Target' }).getByRole('status')).toHaveText('70 · Good');
    await dialog.getByRole('button', { name: 'Done' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(scale).toBeFocused();
  });

  test('picking a report changes the table, and the row of reports scrolls inside itself', async ({
    page,
  }) => {
    const table = page.locator('[data-umbra="data-table"]');
    const first = () => table.getByRole('row').nth(1).innerText();
    const before = await first();
    const report = page.locator('[data-umbra="media-card"]').filter({ hasText: 'Region 2' });
    await expect(report).not.toContainText('Shown');
    await report.getByRole('button').click();
    await expect.poll(first).not.toBe(before);
    await expect(report).toContainText('Shown');

    await page.setViewportSize({ width: 1024, height: 600 });
    const scroller = page.locator('[data-umbra="horizontal-scroller"]');
    const left = () =>
      scroller.evaluate((el) =>
        Math.max(...[el, ...el.querySelectorAll('*')].map((node) => Math.abs(node.scrollLeft))),
      );
    expect(await left()).toBe(0);
    await scroller.getByRole('button', { name: 'Next' }).click();
    await expect.poll(left).toBeGreaterThan(100);
    expect(await overflow(page)).toEqual(fits);
  });

  test('the widgets collapse one by one and all at once', async ({ page }) => {
    const board = page.locator('[data-umbra="widget-board"]');
    const collapsed = board.locator('[data-umbra="card"][data-collapsed]');
    await expect(collapsed).toHaveCount(0);
    await card(page, 'Score by site').getByRole('button').first().click();
    await expect(collapsed).toHaveCount(1);
    await board.getByRole('button', { name: 'Collapse all' }).click();
    await expect(collapsed).toHaveCount(4);
    await board.getByRole('button', { name: 'Expand all' }).click();
    await expect(collapsed).toHaveCount(0);
    await expectFocusKept(page);
    expect(await overflow(page)).toEqual(fits);
  });

  test('the split button exports by its action, its menu and its shortcut', async ({ page }) => {
    const bar = page.locator('[data-umbra="action-bar"]');
    await bar.getByRole('button', { name: 'Export', exact: true }).click();
    await expect(bar).toContainText('Exported All regions as PDF');
    await bar.getByRole('button', { name: 'More ways to export' }).click();
    await page.getByRole('menuitem', { name: 'Export as CSV' }).click();
    await expect(bar).toContainText('Exported All regions as CSV');
    await expectFocusKept(page);
    await page.keyboard.press('Control+e');
    await expect(bar).toContainText('Exported All regions as PDF');
    expect(problems.get(page)).toEqual([]);
  });
});

// The findings of review 2 on the two tier 2 pages (plan/reviews/milestone-2.md, OP-4 to OP-7).
test.describe('Review 2 on the pages', () => {
  for (const density of densities) {
    test(`analysis, ${density}: every star of the Rating column is inside its cell (OP-4)`, async ({
      page,
    }) => {
      await open(page, analysis.id, 1920, 1080, density);
      const ratings = page.locator('[data-col="rating"] [data-umbra="star-rating"]');
      await expect(ratings.first()).toBeVisible();
      const cut = await ratings.evaluateAll((all) =>
        all
          .map((el) => {
            const cell = el.closest('td')!;
            const style = getComputedStyle(cell);
            const inner = cell.getBoundingClientRect().right - parseFloat(style.paddingRight);
            const stars = [...el.querySelectorAll('[data-part="star"]')];
            return {
              stars: stars.length,
              compact: el.hasAttribute('data-compact'),
              over: Math.round(Math.max(...stars.map((star) => star.getBoundingClientRect().right)) - inner),
              clipped: el.scrollWidth > el.clientWidth + 1,
            };
          })
          .filter((r) => r.stars !== 5 || r.compact || r.over > 0 || r.clipped),
      );
      expect(cut).toEqual([]);
      expect(await ratings.count()).toBe(12);
    });
  }

  test('a rating in a cell too narrow for its stars is one star and the number, not a cut row (OP-4)', async ({
    page,
  }) => {
    await open(page, analysis.id, 1920, 1080);
    const rating = page.locator('[data-col="rating"] [data-umbra="star-rating"]').first();
    const name = await rating.getAttribute('aria-label');
    await rating.evaluate((el) => (el.closest('td')!.style.maxWidth = el.style.maxWidth = '40px'));
    await expect(rating).toHaveAttribute('data-compact', '');
    await expect(rating.locator('[data-part="star"]')).toHaveCount(1);
    await expect(rating.locator('[data-part="value"]')).toHaveText(/^\d(\.5)?$/);
    expect(await rating.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    await expect(rating).toHaveAttribute('aria-label', name!);
  });

  test('the labels of reference lines are drawn above the bars and lines, with an outline (OP-5)', async ({
    page,
  }) => {
    await open(page, analysis.id, 1920, 1080);
    const labels = page.locator('[data-part="annotationLabels"] text');
    await expect(labels.first()).toBeVisible();
    const drawn = await labels.evaluateAll((all) =>
      all.map((label) => {
        const picture = (label as SVGElement).ownerSVGElement!;
        const marks = picture.querySelectorAll(
          '[data-part="bars"], [data-part="series"], [data-part="lines"]',
        );
        const style = getComputedStyle(label);
        return {
          text: label.textContent,
          // Later in the picture is on top.
          above: [...marks].every(
            (mark) => !!(mark.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING),
          ),
          marks: marks.length > 0,
          halo: style.paintOrder.startsWith('stroke') && style.stroke !== 'none',
        };
      }),
    );
    expect(drawn.length).toBeGreaterThan(1);
    for (const label of drawn) expect(label).toMatchObject({ above: true, marks: true, halo: true });
    expect(drawn.map((label) => label.text)).toContain('Target');
  });

  const planner = (page: Page) => page.locator('[data-umbra="planner"]');
  /** How far today's week is from the visible part of the month: 0 when it is all in view. */
  const todayOutOfView = (page: Page) =>
    planner(page).evaluate((el) => {
      const view = el.querySelector('[data-part="grid"]')!.closest('[data-part="viewport"]')!;
      const top = el.querySelector('[data-part="weekdays"]')!.getBoundingClientRect().bottom;
      const bottom = view.getBoundingClientRect().bottom;
      const day = el.querySelector('[aria-current="date"]')!.getBoundingClientRect();
      return Math.round(Math.max(0, top - day.top, day.top + 24 - bottom));
    });

  for (const [width, height, density] of [
    [900, 560, 'spacious'],
    [900, 560, 'default'],
    [1024, 600, 'spacious'],
    [1280, 720, 'default'],
  ] as const) {
    test(`planning ${width}x${height} ${density}: the month opens on today's week (OP-6)`, async ({
      page,
    }) => {
      await open(page, planning.id, width, height, density);
      await expect(planner(page).locator('[aria-current="date"]')).toBeAttached();
      await settle(page);
      expect(await todayOutOfView(page)).toBe(0);
      // And stays there through a resize, until the user scrolls.
      await page.setViewportSize({ width: width + 60, height: height + 40 });
      await settle(page);
      expect(await todayOutOfView(page)).toBe(0);
      const view = planner(page)
        .locator('[data-part="grid"]')
        .locator('xpath=ancestor::*[@data-part="viewport"][1]');
      await view.hover();
      await page.mouse.wheel(0, -2000);
      // The wheel is delivered after this call returns.
      await expect.poll(() => view.evaluate((el) => el.scrollTop)).toBe(0);
      await page.setViewportSize({ width, height });
      await settle(page);
      expect(await view.evaluate((el) => el.scrollTop)).toBe(0);
    });
  }

  test('the tour lights a week clear of the weekday names (OP-7)', async ({ page }) => {
    await open(page, planning.id);
    await page.keyboard.press('Shift+T');
    const callout = page.locator('[data-umbra="spotlight"] [role="dialog"]');
    await callout.getByRole('button', { name: 'Next' }).click();
    await expect(callout).toHaveAccessibleName('Settings of a week');
    await settle(page);
    const gap = await page.evaluate(() => {
      const ring = document
        .querySelector('[data-umbra="spotlight"] [data-part="ring"]')!
        .getBoundingClientRect();
      const names = document
        .querySelector('[data-umbra="planner"] [data-part="weekdays"]')!
        .getBoundingClientRect();
      const target = document
        .querySelector('[data-umbra="planner"] [data-part="weekAside"]')!
        .getBoundingClientRect();
      return { ring: Math.round(ring.top - names.bottom), target: Math.round(target.top - names.bottom) };
    });
    // The target starts at or below the names; the ring is 4px outside the target.
    expect(gap.target).toBeGreaterThanOrEqual(0);
    expect(gap.ring).toBeGreaterThanOrEqual(-5);
  });
});
