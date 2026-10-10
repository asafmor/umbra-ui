import { expect, test, type Locator, type Page } from '@playwright/test';
import { densities } from '../../src/styles/tokens.generated';

// The three full-page reference stories (src/stories/pages): they fill any window without a page
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
] as const;
const [overview, listDetail, table] = pages;

const problems = new WeakMap<Page, string[]>();
const open = async (page: Page, id: string, width = 1280, height = 720, density = 'default') => {
  const seen: string[] = [];
  problems.set(page, seen);
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && seen.push(m.text()));
  page.on('pageerror', (error) => seen.push(String(error)));
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
    await expect(ranking.getByRole('columnheader', { name: 'Lost' })).toBeVisible();
    await expect(ranking.locator('tr[data-highlighted]')).toContainText('Region 5');
    await page.setViewportSize({ width: 1024, height: 600 });
    await expect(ranking.getByRole('columnheader', { name: 'Lost' })).toHaveCount(0);
    await expect(ranking.getByRole('columnheader', { name: 'Pts' })).toBeVisible();
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
