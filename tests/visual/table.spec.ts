import { expect, test, type Locator, type Page } from '@playwright/test';

// DataTable: sorting, selection, the keyboard grid, priority hiding, groups, virtualisation, data states,
// change highlighting, row actions and pinned columns. Everything a still image cannot show.
const open = async (page: Page, story: string, width = 1280, height = 720) => {
  await page.setViewportSize({ width, height });
  await page.goto(`/iframe.html?id=data-datatable--${story}&viewMode=story`);
  await page.locator('#storybook-root > *').first().waitFor();
  await page.evaluate(async () => {
    await Promise.all(
      [...document.fonts].filter((f) => f.unicodeRange.startsWith('U+0-FF')).map((f) => f.load()),
    );
    await document.fonts.ready;
  });
};
const card = (page: Page, title: string) =>
  page
    .locator('[data-umbra="card"]')
    .filter({ has: page.getByRole('heading', { name: title, exact: true }) });
const grid = (scope: Page | Locator, name: string) => scope.getByRole('grid', { name, exact: true });
const bodyRows = (table: Locator) => table.locator('tbody > tr[data-kind="row"]');
const header = (table: Locator, name: string) => table.getByRole('columnheader', { name, exact: true });
/** The text of one column, top to bottom. */
const column = (table: Locator, id: string) =>
  table.locator(`tbody > tr[data-kind="row"] > [data-col="${id}"]`).allTextContents();
/** What has focus: its text, its row key and its column id. */
const focused = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    const cell = el?.closest<HTMLElement>('[data-cell]');
    return {
      text: (el?.textContent ?? '').trim(),
      row: cell?.parentElement?.dataset.rowKey ?? null,
      col: cell?.dataset.col ?? null,
      isCell: el === cell,
    };
  });
const press = async (page: Page, ...keys: string[]) => {
  for (const key of keys) await page.keyboard.press(key);
};
const viewport = (table: Locator) => table.locator('xpath=ancestor::*[@data-part="viewport"][1]');

test.describe('sorting', () => {
  test('a click cycles descending, ascending and unsorted on a number column, with aria-sort', async ({
    page,
  }) => {
    await open(page, 'sorting', 1920, 1080);
    const group = card(page, 'Single sort');
    const table = grid(group, 'Single sort');
    const score = header(table, 'Score');
    await expect(score).toHaveAttribute('aria-sort', 'none');
    await expect(header(table, 'Tasks')).not.toHaveAttribute('aria-sort', /.*/);

    await score.getByRole('button').click();
    await expect(score).toHaveAttribute('aria-sort', 'descending');
    await expect(group.getByText('Sort: score desc')).toBeVisible();
    expect((await column(table, 'score')).map(Number)).toEqual([97, 89, 80, 72, 63, 55, 46, 38]);
    // The direction is the shape of the arrow, not a colour.
    await expect(score.locator('[data-part="sort-indicator"]')).toHaveAttribute('data-direction', 'desc');

    await score.getByRole('button').click();
    await expect(score).toHaveAttribute('aria-sort', 'ascending');
    expect((await column(table, 'score')).map(Number)).toEqual([38, 46, 55, 63, 72, 80, 89, 97]);

    await score.getByRole('button').click();
    await expect(score).toHaveAttribute('aria-sort', 'none');
    await expect(group.getByText('Sort: none')).toBeVisible();
    expect((await column(table, 'name'))[0]).toBe('Person A');

    // Text starts ascending; a custom comparator sorts roles by seniority, not by name.
    await header(table, 'Role').getByRole('button').click();
    await expect(group.getByText('Sort: role asc')).toBeVisible();
    const roles = await column(table, 'role');
    expect([roles[0], roles[2], roles[4], roles[7]]).toEqual(['Analyst', 'Planner', 'Reviewer', 'Lead']);
  });

  test('Enter and Space on a header sort it; Shift+Enter and Shift+click add to a multiple sort', async ({
    page,
  }) => {
    await open(page, 'sorting');
    const single = card(page, 'Single sort');
    await page.keyboard.press('Tab');
    expect(await focused(page)).toMatchObject({ row: 'head', col: 'name', isCell: true });
    await page.keyboard.press('Enter');
    await expect(single.getByText('Sort: name asc')).toBeVisible();
    await page.keyboard.press('Space');
    await expect(single.getByText('Sort: name desc')).toBeVisible();
    // Focus stays on the header cell through the sort.
    expect(await focused(page)).toMatchObject({ row: 'head', col: 'name', isCell: true });
    // Without `multiSort`, Shift+Enter replaces the sort.
    await press(page, 'ArrowRight', 'Shift+Enter');
    await expect(single.getByText('Sort: team asc')).toBeVisible();

    const multi = card(page, 'Multiple sort');
    const table = grid(multi, 'Multiple sort');
    await expect(multi.getByText('Sort: team asc')).toBeVisible();
    await header(table, 'Score')
      .getByRole('button')
      .click({ modifiers: ['Shift'] });
    await expect(multi.getByText('Sort: team asc, score desc')).toBeVisible();
    await expect(header(table, 'Score').locator('[data-part="sort-indicator"]')).toHaveText('2');
    expect((await column(table, 'name')).slice(0, 4)).toEqual([
      'Person E',
      'Person A',
      'Person F',
      'Person B',
    ]);

    await header(table, 'Name').focus();
    await page.keyboard.press('Shift+Enter');
    await expect(multi.getByText('Sort: team asc, score desc, name asc')).toBeVisible();
    // A plain press replaces the whole sort.
    await page.keyboard.press('Enter');
    await expect(multi.getByText('Sort: name desc')).toBeVisible();
  });

  test('manual sorting reports the sort and leaves the rows alone', async ({ page }) => {
    await open(page, 'sorting');
    const group = card(page, 'Manual sort');
    const table = grid(group, 'Manual sort');
    await header(table, 'Score').getByRole('button').click();
    await expect(group.getByText('Sort: score desc')).toBeVisible();
    await expect(header(table, 'Score')).toHaveAttribute('aria-sort', 'descending');
    expect((await column(table, 'name')).slice(0, 3)).toEqual(['Person A', 'Person B', 'Person C']);
  });
});

test.describe('selection', () => {
  test('a click toggles a row; Shift+click selects the range; disabled rows are left out', async ({
    page,
  }) => {
    await open(page, 'selection');
    const group = card(page, 'Multiple selection');
    const table = grid(group, 'Multiple selection');
    await expect(table).toHaveAttribute('aria-multiselectable', 'true');
    const row = (name: string) => table.getByRole('row', { name: new RegExp(name) });
    await expect(row('Person B')).toHaveAttribute('aria-selected', 'true');
    await expect(row('Person B').getByRole('checkbox')).toBeChecked();
    await expect(row('Person A')).toHaveAttribute('aria-selected', 'false');

    await row('Person A').getByRole('rowheader').click();
    await expect(group.getByText('Selected: p2, p3, p1 ·')).toBeVisible();
    await row('Person B').getByRole('rowheader').click();
    await expect(group.getByText('Selected: p3, p1 ·')).toBeVisible();

    // The anchor is the last row toggled (Person B); the range runs to Person G and skips the disabled row.
    await row('Person G')
      .getByRole('rowheader')
      .click({ modifiers: ['Shift'] });
    await expect(group.getByText('Selected: p3, p1, p2, p4, p6, p7 ·')).toBeVisible();
    await expect(row('Person E')).toHaveAttribute('aria-disabled', 'true');
    await expect(row('Person E').getByRole('checkbox')).toBeDisabled();
    await row('Person E').getByRole('rowheader').click({ force: true });
    await expect(group.getByText('Selected: p3, p1, p2, p4, p6, p7 ·')).toBeVisible();

    // A Shift+click on a checkbox is a range too.
    await row('Person I').getByRole('rowheader').click();
    await row('Person J')
      .locator('[data-umbra="checkbox"]')
      .click({ modifiers: ['Shift'] });
    await expect(group.getByText('Selected: p3, p1, p2, p4, p6, p7, p9, p10 ·')).toBeVisible();

    // A double click activates the row.
    await row('Person H').getByRole('rowheader').dblclick();
    await expect(group.getByText('Opened: p8')).toBeVisible();
  });

  test('the header checkbox selects all rows, and shows "some" in between', async ({ page }) => {
    await open(page, 'selection');
    const group = card(page, 'Multiple selection');
    const all = group.getByRole('checkbox', { name: 'Select all rows' });
    await expect(all).not.toBeChecked();
    expect(await all.evaluate((el: HTMLInputElement) => el.indeterminate)).toBe(true);
    await group.locator('thead [data-umbra="checkbox"]').click();
    await expect(group.getByText('Selected: p2, p3, p1, p4, p6, p7, p8, p9, p10 ·')).toBeVisible();
    await expect(all).toBeChecked();
    await group.locator('thead [data-umbra="checkbox"]').click();
    await expect(group.getByText('Selected: none ·')).toBeVisible();
  });

  test('Space toggles the focused row, and Shift+Arrow extends the selection', async ({ page }) => {
    await open(page, 'selection');
    const group = card(page, 'Multiple selection');
    const table = grid(group, 'Multiple selection');
    await table
      .getByRole('row', { name: /Person F/ })
      .getByRole('gridcell', { name: 'Team 2' })
      .focus();
    await page.keyboard.press('Space');
    await expect(group.getByText('Selected: p2, p3, p6 ·')).toBeVisible();
    await press(page, 'Shift+ArrowDown', 'Shift+ArrowDown');
    await expect(group.getByText('Selected: p2, p3, p6, p7, p8 ·')).toBeVisible();
    // Coming back shrinks the range again.
    await page.keyboard.press('Shift+ArrowUp');
    await expect(group.getByText('Selected: p2, p3, p6, p7 ·')).toBeVisible();
    expect(await focused(page)).toMatchObject({ row: 'r:p7', col: 'team' });
    await page.keyboard.press('Space');
    await expect(group.getByText('Selected: p2, p3, p6 ·')).toBeVisible();
  });

  test('single selection keeps one row', async ({ page }) => {
    await open(page, 'selection');
    const group = card(page, 'Single selection');
    const table = grid(group, 'Single selection');
    await expect(table).not.toHaveAttribute('aria-multiselectable', /.*/);
    await expect(group.getByRole('checkbox', { name: 'Select all rows' })).toHaveCount(0);
    await table
      .getByRole('row', { name: /Person D/ })
      .getByRole('rowheader')
      .click();
    await expect(group.getByText('Selected: p4 ·')).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');
    await expect(group.getByText('Selected: p6 ·')).toBeVisible();
    await page.keyboard.press('Space');
    await expect(group.getByText('Selected: none ·')).toBeVisible();
  });
});

test.describe('keyboard grid', () => {
  test('the table is one tab stop, and focus comes back to the same cell', async ({ page }) => {
    await open(page, 'selection');
    await page.keyboard.press('Tab');
    expect(await focused(page)).toMatchObject({ row: 'head', col: '__select', isCell: true });
    await press(page, 'ArrowDown', 'ArrowDown', 'ArrowRight', 'ArrowRight');
    expect(await focused(page)).toMatchObject({ row: 'r:p2', col: 'team', text: 'Team 2' });
    // Tab leaves the table: the checkboxes and the other cells are not tab stops.
    await page.keyboard.press('Tab');
    const second = grid(card(page, 'Single selection'), 'Single selection');
    expect(await second.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Shift+Tab');
    expect(await focused(page)).toMatchObject({ row: 'r:p2', col: 'team', isCell: true });
    await page.keyboard.press('Shift+Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('table'))).toBe(false);
  });

  test('arrows, Home, End, Ctrl+Home, Ctrl+End and the page keys move the focused cell', async ({ page }) => {
    await open(page, 'people');
    const table = grid(page, 'People');
    await table
      .getByRole('row', { name: /Person C/ })
      .getByRole('gridcell', { name: 'Team 3' })
      .focus();
    await page.keyboard.press('ArrowRight');
    expect(await focused(page)).toMatchObject({ row: 'r:p3', col: 'role' });
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowUp');
    expect(await focused(page)).toMatchObject({ row: 'r:p2', col: 'team', text: 'Team 2' });
    await page.keyboard.press('Home');
    expect(await focused(page)).toMatchObject({ row: 'r:p2', col: '__select' });
    await page.keyboard.press('End');
    expect(await focused(page)).toMatchObject({ row: 'r:p2', col: 'actions' });
    await page.keyboard.press('Control+Home');
    expect(await focused(page)).toMatchObject({ row: 'head', col: '__select' });
    // At the edge nothing happens.
    await press(page, 'ArrowUp', 'ArrowLeft');
    expect(await focused(page)).toMatchObject({ row: 'head', col: '__select' });
    await page.keyboard.press('Control+End');
    expect(await focused(page)).toMatchObject({ row: 'r:p24', col: 'actions' });

    // A page is the rows that fit. The focused cell is scrolled clear of the sticky header.
    await page.keyboard.press('Control+Home');
    await press(page, 'ArrowDown', 'PageDown', 'PageDown');
    const far = await focused(page);
    expect(Number(far.row?.slice(3))).toBeGreaterThan(18);
    await page.keyboard.press('PageUp');
    const back = await focused(page);
    expect(Number(back.row?.slice(3))).toBeLessThan(Number(far.row?.slice(3)));
    const clear = await page.evaluate(() => {
      const cell = document.activeElement!.getBoundingClientRect();
      const head = document
        .activeElement!.closest('table')!
        .querySelector('thead th')!
        .getBoundingClientRect();
      return cell.top >= head.bottom - 0.5;
    });
    expect(clear).toBe(true);
  });

  test('Enter acts on the row, forwards to a single control, or enters a cell with several', async ({
    page,
  }) => {
    await open(page, 'people');
    const group = card(page, 'People');
    const table = grid(page, 'People');
    const row = table.getByRole('row', { name: /Person C/ });
    // A plain cell: Enter is the row action.
    await row.getByRole('gridcell', { name: 'Team 3' }).focus();
    await page.keyboard.press('Enter');
    await expect(group.getByText('Last action: Open p3')).toBeVisible();

    // Several controls: Enter moves into the cell, Tab stays among them, Escape returns to the cell.
    await page.keyboard.press('End');
    expect(await focused(page)).toMatchObject({ col: 'actions', isCell: true });
    await page.keyboard.press('Enter');
    await expect(row.getByRole('button', { name: 'Edit Person C' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(row.getByRole('button', { name: 'Remove Person C' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(row.getByRole('button', { name: 'More actions for Person C' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(row.getByRole('button', { name: 'Edit Person C' })).toBeFocused();
    await press(page, 'Shift+Tab', 'Shift+Tab');
    await expect(row.getByRole('button', { name: 'Remove Person C' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(group.getByText('Last action: Remove p3')).toBeVisible();
    await page.keyboard.press('Escape');
    expect(await focused(page)).toMatchObject({ row: 'r:p3', col: 'actions', isCell: true });
    // F2 enters as well.
    await page.keyboard.press('F2');
    await expect(row.getByRole('button', { name: 'Edit Person C' })).toBeFocused();
    await page.keyboard.press('Escape');

    // One control (the row's checkbox): Enter is forwarded to it.
    await page.keyboard.press('Home');
    await page.keyboard.press('Enter');
    await expect(group.getByText('Selected: p2, p3 ·')).toBeVisible();
    expect(await focused(page)).toMatchObject({ row: 'r:p3', col: '__select', isCell: true });
  });

  test('a cell with one control forwards Enter and Space to it', async ({ page }) => {
    await open(page, 'cell-widgets');
    const group = card(page, 'Cell widgets');
    const table = grid(page, 'Cell widgets');
    const row = table.getByRole('row', { name: /Person B/ });
    await row.locator('[data-col="done"]').focus();
    await page.keyboard.press('Space');
    await expect(group.getByText('Done: p1, p3, p2 ·')).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(group.getByText('Done: p1, p3 ·')).toBeVisible();
    // A link is followed.
    await page.keyboard.press('ArrowLeft');
    expect(await focused(page)).toMatchObject({ col: 'link', isCell: true });
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#p2$/);
    // No control in the table is a tab stop.
    expect(
      await table.evaluate(
        (el) => el.querySelectorAll('a[href]:not([tabindex="-1"]), button:not([tabindex="-1"])').length,
      ),
    ).toBe(0);
  });

  test('focus follows its row through a sort, and its row through hidden columns', async ({ page }) => {
    await open(page, 'sorting');
    const table = grid(card(page, 'Single sort'), 'Single sort');
    await table
      .getByRole('row', { name: /Person C/ })
      .getByRole('gridcell', { name: 'Team 3' })
      .focus();
    // Sorted from outside the keyboard's reach (a click that does not move focus).
    await header(table, 'Score')
      .getByRole('button')
      .evaluate((el: HTMLElement) => el.click());
    await expect(header(table, 'Score')).toHaveAttribute('aria-sort', 'descending');
    expect(await focused(page)).toMatchObject({ row: 'r:p3', col: 'team', text: 'Team 3', isCell: true });
    await page.keyboard.press('ArrowDown');
    expect(await focused(page)).toMatchObject({ row: 'r:p6', col: 'team' });

    await open(page, 'narrowing');
    const box = page.locator('[data-box^="560:"]');
    await box
      .getByRole('row', { name: /Person C/ })
      .locator('[data-col="status"]')
      .focus();
    await box.evaluate((el) => (el.style.width = '330px'));
    await expect(box.getByRole('columnheader')).toHaveCount(3);
    const after = await focused(page);
    expect(after).toMatchObject({ row: 'r:p3', isCell: true });
    expect(['name', 'team', 'score']).toContain(after.col);
  });

  test('right to left: the left and right arrows follow what is seen', async ({ page }) => {
    await open(page, 'right-to-left');
    const table = grid(page, 'Output by site');
    await table
      .getByRole('row', { name: /Site 2 / })
      .getByRole('rowheader')
      .focus();
    await page.keyboard.press('ArrowLeft');
    expect(await focused(page)).toMatchObject({ row: 'r:s2', col: 'area' });
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    expect(await focused(page)).toMatchObject({ row: 'r:s2', col: '__select' });
    // The pinned start column sits at the right edge.
    const edges = await table.evaluate((el: HTMLTableElement) => {
      const view = el.closest('[data-part="viewport"]')!;
      view.scrollLeft = -200;
      const cell = el.querySelector('tbody [data-col="__select"]')!.getBoundingClientRect();
      const box = view.getBoundingClientRect();
      return Math.abs(box.right - cell.right);
    });
    expect(edges).toBeLessThan(2);
  });
});

test.describe('columns', () => {
  const headers = (box: Locator) => box.getByRole('columnheader').allTextContents();

  test('columns hide by priority as the table narrows, and return when it widens', async ({ page }) => {
    await open(page, 'narrowing');
    const box = (label: string) => page.locator(`[data-box^="${label}:"]`);
    expect(await headers(box('560'))).toEqual(['Name', 'Team', 'Role', 'Status', 'Tasks', 'Score']);
    expect(await headers(box('440'))).toEqual(['Name', 'Team', 'Role', 'Score']);
    expect(await headers(box('330'))).toEqual(['Name', 'Team', 'Score']);
    expect(await headers(box('240'))).toEqual(['Name', 'Score']);
    // `always` stays, and the table scrolls sideways inside its box when even that does not fit.
    expect(await headers(box('150'))).toEqual(['Name']);
    await expect(page.locator('[data-box^="440:"]')).toHaveAttribute('data-box', '440: hidden status, tasks');

    // One large resize in each direction lands on the same answer as the small steps.
    const wide = box('560');
    await wide.evaluate((el) => (el.style.width = '150px'));
    await expect(wide.getByRole('columnheader')).toHaveCount(1);
    await expect(wide).toHaveAttribute('data-box', '560: hidden team, role, status, tasks, score');
    await wide.evaluate((el) => (el.style.width = '560px'));
    await expect(wide.getByRole('columnheader')).toHaveCount(6);
    await expect(wide).toHaveAttribute('data-box', '560: hidden none');
    // Nothing overflows: every table is as wide as its viewport.
    for (const label of ['560', '440', '330', '240']) {
      const table = box(label).getByRole('grid');
      expect(await table.evaluate((el) => el.scrollWidth - el.parentElement!.clientWidth)).toBe(0);
    }
  });

  test('no oscillation at a threshold: the columns are a function of the width alone', async ({ page }) => {
    await open(page, 'narrowing');
    const box = page.locator('[data-box^="560:"]');
    // Records every change of the header row while the box sits at, just under and just over a threshold.
    await box.evaluate((el) => {
      const counts: number[] = [];
      (window as unknown as { counts: number[] }).counts = counts;
      new MutationObserver(() => counts.push(el.querySelectorAll('thead th').length)).observe(
        el.querySelector('thead')!,
        { childList: true, subtree: true },
      );
    });
    const settle = () =>
      page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    const seen: number[] = [];
    // The threshold: 518px of minimum widths, the box's 2px of border, and the scrollbar's room (none
    // with overlay scrollbars). One pixel less hides one column: the later of the two with the lowest priority.
    const at =
      520 +
      (await box
        .locator('[data-part="viewport"]')
        .evaluate((el: HTMLElement) => el.offsetWidth - el.clientWidth));
    for (const width of [at, at - 1, at, at - 0.5, at, at - 1, at - 1, at]) {
      await box.evaluate((el, w) => (el.style.width = `${w}px`), width);
      await settle();
      await settle();
      seen.push(await box.getByRole('columnheader').count());
    }
    expect(seen).toEqual([6, 5, 6, 5, 6, 5, 5, 6]);
    // The header changed only when the width crossed the threshold: no extra flips in between.
    const changes = await page.evaluate(() => (window as unknown as { counts: number[] }).counts);
    expect(changes.filter((count, i) => count !== changes[i - 1]).length).toBeLessThanOrEqual(6);
  });

  test('expandableHidden: a row shows its hidden columns, and they return to the table when there is room', async ({
    page,
  }) => {
    await open(page, 'narrowing');
    const box = page.locator('[data-box^="expandable 330:"]');
    const table = box.getByRole('grid');
    expect(await headers(box)).toEqual(['', 'Name', 'Team', 'Score']);
    await expect(box.getByRole('columnheader', { name: 'Show hidden columns' })).toBeVisible();
    const row = table.getByRole('row', { name: /Person B/ });
    const toggle = row.getByRole('button', { name: 'Show hidden columns' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    const detail = table.locator('tr[data-kind="detail"]');
    await expect(detail).toHaveCount(1);
    await expect(detail).toContainText('Role');
    await expect(detail).toContainText('Planner');
    await expect(detail).toContainText('Status');
    await expect(detail).toContainText('Offline');
    await expect(detail).toContainText('Tasks');
    await expect(row.getByRole('button', { name: 'Hide hidden columns' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    // By keyboard: the control is the only one in its cell, and the detail is a row of the grid.
    await table
      .getByRole('row', { name: /Person D/ })
      .locator('[data-col="__expand"]')
      .focus();
    await page.keyboard.press('Enter');
    await expect(detail).toHaveCount(2);
    await page.keyboard.press('ArrowDown');
    expect(await focused(page)).toMatchObject({ row: 'd:p4' });

    await box.evaluate((el) => (el.style.width = '640px'));
    await expect(detail).toHaveCount(0);
    expect(await headers(box)).toEqual(['Name', 'Team', 'Role', 'Status', 'Tasks', 'Score']);
  });

  test('pinned columns stay in view while the table scrolls sideways', async ({ page }) => {
    await open(page, 'numeric', 1024, 600);
    const table = grid(page, 'Output by site and quarter, in units');
    const view = viewport(table);
    const root = page.locator('[data-umbra="data-table"]');
    expect(await view.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    await expect(root).not.toHaveAttribute('data-scrolled-start', /.*/);
    await view.evaluate((el) => (el.scrollLeft = 260));
    await expect(root).toHaveAttribute('data-scrolled-start', '');
    const edges = await table.evaluate((el: HTMLTableElement) => {
      const view = el.closest<HTMLElement>('[data-part="viewport"]')!;
      const box = view.getBoundingClientRect();
      const rect = (selector: string) => el.querySelector(selector)!.getBoundingClientRect();
      return {
        first: rect('tbody [data-col="name"]').left - box.left,
        firstHeader: rect('thead [data-col="name"]').left - box.left,
        firstFooter: rect('tfoot [data-col="name"]').left - box.left,
        last: box.left + view.clientWidth - rect('tbody [data-col="cost"]').right,
        q1: rect('tbody [data-col="q1"]').left - box.left,
      };
    });
    expect(Math.abs(edges.first)).toBeLessThan(1);
    expect(Math.abs(edges.firstHeader)).toBeLessThan(1);
    expect(Math.abs(edges.firstFooter)).toBeLessThan(1);
    expect(Math.abs(edges.last)).toBeLessThan(1);
    // An unpinned column has scrolled under the pinned one.
    expect(edges.q1).toBeLessThan(150);

    // The keyboard scrolls a cell out from under the pinned columns.
    await table
      .getByRole('row', { name: /Site 3 / })
      .locator('[data-col="q3"]')
      .focus();
    await press(page, 'ArrowLeft', 'ArrowLeft', 'ArrowLeft');
    expect(await focused(page)).toMatchObject({ col: 'area' });
    const visible = await table.evaluate((el: HTMLTableElement) => {
      const pinned = el.querySelector('tbody [data-col="name"]')!.getBoundingClientRect();
      return document.activeElement!.getBoundingClientRect().left >= pinned.right - 0.5;
    });
    expect(visible).toBe(true);
  });

  test('headers that span columns, the footer and the caption', async ({ page }) => {
    await open(page, 'numeric');
    const table = grid(page, 'Output by site and quarter, in units');
    await expect(page.locator('[data-part="caption"]')).toBeVisible();
    await expect(table).toHaveAttribute('aria-colcount', '10');
    await expect(table).toHaveAttribute('aria-rowcount', '43');
    const half = header(table, 'First half');
    await expect(half).toHaveAttribute('colspan', '2');
    await expect(table.getByRole('rowheader', { name: 'Site 1', exact: true })).toBeVisible();
    await expect(header(table, 'Cost')).toHaveAccessibleDescription('Cost per unit');
    await expect(table.locator('tfoot [data-col="q1"]')).toHaveText('8,280');

    // The footer stays at the bottom and the two header rows at the top while the body scrolls.
    const view = viewport(table);
    await view.evaluate((el) => (el.scrollTop = 300));
    const stuck = await table.evaluate((el: HTMLTableElement) => {
      const box = el.closest<HTMLElement>('[data-part="viewport"]')!;
      const view = box.getBoundingClientRect();
      const rows = [...el.tHead!.rows].map((row) => row.cells[1]!.getBoundingClientRect());
      const foot = el.tFoot!.rows[0]!.cells[0]!.getBoundingClientRect();
      return {
        first: rows[0]!.top - view.top,
        second: rows[1]!.top - rows[0]!.bottom,
        foot: view.top + box.clientHeight - foot.bottom,
      };
    });
    expect(Math.abs(stuck.first)).toBeLessThan(1);
    expect(Math.abs(stuck.second)).toBeLessThan(1);
    expect(Math.abs(stuck.foot)).toBeLessThan(1);

    // Up from a column header lands on the header that spans it.
    await header(table, 'Q2').focus();
    await page.keyboard.press('ArrowUp');
    expect(await focused(page)).toMatchObject({ row: 'head-groups', text: 'First half' });
    await page.keyboard.press('ArrowDown');
    expect(await focused(page)).toMatchObject({ row: 'head', col: 'q2' });
  });
});

test.describe('groups', () => {
  test('group rows show title, count and totals; collapsing hides the rows', async ({ page }) => {
    await open(page, 'grouping');
    const group = card(page, 'Collapsible groups');
    const table = grid(group, 'Orders by status');
    const groups = table.locator('tr[data-kind="group"]');
    await expect(groups).toHaveCount(4);
    await expect(groups.nth(0)).toContainText('Open12');
    await expect(groups.nth(0).locator('[data-col="quantity"]')).toHaveText('386');
    await expect(groups.nth(1)).toContainText('Leaves today');
    // A listed group with no rows is still shown.
    await expect(groups.nth(3)).toContainText('Returned0');
    // The expanded state is on the caret: a row of a grid cannot carry it.
    await expect(groups.nth(0).getByRole('button')).toHaveAttribute('aria-expanded', 'true');
    await expect(groups.nth(1).getByRole('button')).toHaveAttribute('aria-expanded', 'false');
    await expect(groups.nth(1)).toHaveAttribute('data-collapsed', 'true');
    await expect(bodyRows(table)).toHaveCount(24);

    await group.getByRole('button', { name: 'Collapse Open' }).click();
    await expect(group.getByText('Collapsed: packed, open')).toBeVisible();
    await expect(bodyRows(table)).toHaveCount(12);
    await expect(groups.nth(0).getByRole('button')).toHaveAttribute('aria-expanded', 'false');

    // By keyboard: the group row is a row of the grid, and Enter or Space works its caret.
    await groups.nth(1).locator('[data-cell]').first().focus();
    await page.keyboard.press('Enter');
    await expect(group.getByText('Collapsed: open', { exact: true })).toBeVisible();
    await expect(bodyRows(table)).toHaveCount(24);
    expect(await focused(page)).toMatchObject({ row: 'g:packed', isCell: true });
    await page.keyboard.press('ArrowDown');
    expect(await focused(page)).toMatchObject({ row: 'r:o3' });
    await press(page, 'ArrowUp', 'Space');
    await expect(group.getByText('Collapsed: open, packed')).toBeVisible();
  });

  test('rows sort inside their group, and group rows stick below the header', async ({ page }) => {
    await open(page, 'grouping', 1280, 600);
    const table = grid(card(page, 'Groups by a function'), 'Orders by category');
    const amounts = (await column(table, 'amount')).slice(0, 5).map((text) => Number(text.replace(',', '')));
    expect(amounts).toEqual([...amounts].sort((a, b) => b - a));
    const groups = table.locator('tr[data-kind="group"]');
    await expect(groups.first()).toContainText('Category 1');

    const view = viewport(table);
    await view.evaluate((el) => (el.scrollTop = 220));
    const gap = await table.evaluate((el: HTMLTableElement) => {
      const head = el.querySelector('thead th')!.getBoundingClientRect();
      const stuck = [...el.querySelectorAll('tr[data-kind="group"] > td')]
        .map((cell) => cell.getBoundingClientRect())
        .filter((rect) => Math.abs(rect.top - head.bottom) < 1);
      return stuck.length;
    });
    expect(gap).toBeGreaterThan(0);
  });
});

test.describe('virtualisation', () => {
  test('ten thousand rows: only the rows in view are in the page, and the row indices are right', async ({
    page,
  }) => {
    await open(page, 'virtualised');
    const table = grid(page, '10,000 orders');
    await expect(table).toHaveAttribute('aria-rowcount', '10002');
    expect(await bodyRows(table).count()).toBeLessThan(60);
    await expect(table.getByRole('row', { name: /Item 1 / })).toHaveAttribute('aria-rowindex', '2');

    const view = viewport(table);
    await view.evaluate((el) => (el.scrollTop = el.scrollHeight));
    const last = table.getByRole('row', { name: /Item 10000 / });
    await expect(last).toBeVisible();
    await expect(last).toHaveAttribute('aria-rowindex', '10001');
    expect(await bodyRows(table).count()).toBeLessThan(60);
    // The last row ends exactly where the footer begins: the spacers add up.
    const gap = await table.evaluate((el: HTMLTableElement) => {
      const rows = el.querySelectorAll('tbody > tr[data-kind="row"]');
      return el.tFoot!.getBoundingClientRect().top - rows[rows.length - 1]!.getBoundingClientRect().bottom;
    });
    expect(Math.abs(gap)).toBeLessThan(1);

    // Scrolling in steps keeps rows under the pointer the whole way.
    await view.evaluate((el) => (el.scrollTop = 0));
    for (let i = 0; i < 12; i++) {
      await view.evaluate((el) => (el.scrollTop += 1900));
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      const covered = await table.evaluate((el: HTMLTableElement) => {
        const box = el.closest('[data-part="viewport"]')!.getBoundingClientRect();
        const hit = document.elementFromPoint(box.left + 120, box.top + box.height / 2);
        return hit?.closest('tr')?.getAttribute('data-kind');
      });
      expect(covered).toBe('row');
    }
  });

  test('the keyboard reaches every row, and focus survives scrolling away', async ({ page }) => {
    await open(page, 'virtualised');
    const table = grid(page, '10,000 orders');
    await table
      .getByRole('row', { name: /Item 3 / })
      .getByRole('gridcell', { name: 'Category 3' })
      .focus();
    await press(page, 'ArrowDown', 'ArrowDown');
    expect(await focused(page)).toMatchObject({ row: 'r:o5', col: 'category' });

    await page.keyboard.press('Control+End');
    expect(await focused(page)).toMatchObject({ row: 'foot' });
    await page.keyboard.press('ArrowUp');
    expect(await focused(page)).toMatchObject({ row: 'r:o10000' });
    await press(page, 'PageUp', 'PageUp');
    const up = await focused(page);
    expect(Number(up.row?.slice(3))).toBeLessThan(9990);
    expect(Number(up.row?.slice(3))).toBeGreaterThan(9900);
    await expect(table.locator(`tr[data-row-key="${up.row}"]`)).toBeInViewport();

    // Scrolled far away with the wheel: the focused row is kept, and the arrows continue from it.
    const view = viewport(table);
    await view.evaluate((el) => (el.scrollTop = 0));
    await expect(table.getByRole('row', { name: /Item 1 / })).toBeVisible();
    expect(await focused(page)).toMatchObject({ row: up.row, isCell: true });
    await page.keyboard.press('ArrowDown');
    const next = await focused(page);
    expect(Number(next.row?.slice(3))).toBe(Number(up.row?.slice(3)) + 1);
    await expect(table.locator(`tr[data-row-key="${next.row}"]`)).toBeInViewport();

    await page.keyboard.press('Control+Home');
    expect(await focused(page)).toMatchObject({ row: 'head' });
    await press(page, 'ArrowDown', 'PageDown', 'PageDown', 'PageDown');
    const down = await focused(page);
    expect(Number(down.row?.slice(3))).toBeGreaterThan(40);
    await expect(table.locator(`tr[data-row-key="${down.row}"]`)).toBeInViewport();

    // Leaving and coming back returns to that cell, also after scrolling it out of the window.
    await view.evaluate((el) => (el.scrollTop = 90000));
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    expect(await focused(page)).toMatchObject({ row: down.row, isCell: true });
    await expect(table.locator(`tr[data-row-key="${down.row}"]`)).toBeInViewport();
  });

  test('selection and sorting work across the window', async ({ page }) => {
    await open(page, 'virtualised');
    const group = card(page, '10,000 orders');
    const table = grid(page, '10,000 orders');
    await table
      .getByRole('row', { name: /Item 2 / })
      .getByRole('rowheader')
      .click();
    await expect(group.getByText('Selected: o2')).toBeVisible();
    const view = viewport(table);
    // Row 500 is far outside the rendered window.
    await view.evaluate((el) => (el.scrollTop = 26 * 495));
    await table
      .getByRole('row', { name: /Item 501 / })
      .getByRole('rowheader')
      .click({ modifiers: ['Shift'] });
    await expect(group.getByText('Selected: 500 rows')).toBeVisible();

    await group.locator('thead [data-umbra="checkbox"]').click();
    await expect(group.getByText('Selected: 10000 rows')).toBeVisible();
    await group.locator('thead [data-umbra="checkbox"]').click();
    await expect(group.getByText('Selected: none')).toBeVisible();

    await header(table, 'Amount').getByRole('button').click();
    await expect(header(table, 'Amount')).toHaveAttribute('aria-sort', 'descending');
    await view.evaluate((el) => (el.scrollTop = 0));
    await expect(bodyRows(table).first().locator('[data-col="amount"]')).toHaveText(/^4,99\d$/);
    const amounts = (await column(table, 'amount')).slice(0, 10).map((text) => Number(text.replace(',', '')));
    expect(amounts).toEqual([...amounts].sort((a, b) => b - a));
    await expect(table.locator('tfoot [data-col="amount"]')).toHaveText('25,091,660');
  });
});

test.describe('data states', () => {
  test('loading shows skeleton rows in the real columns and marks the table busy', async ({ page }) => {
    await open(page, 'states');
    const loading = card(page, 'Loading');
    await expect(loading.locator('[data-umbra="data-table"]')).toHaveAttribute('aria-busy', 'true');
    const rows = loading.locator('tr[data-kind="skeleton"]');
    await expect(rows).toHaveCount(5);
    await expect(rows.first().locator('td')).toHaveCount(5);
    await expect(rows.first()).toHaveAttribute('aria-hidden', 'true');
    await expect(loading.getByRole('columnheader')).toHaveCount(5);
    await expect(bodyRows(loading)).toHaveCount(0);
  });

  test('empty and error states keep the header; retry recovers', async ({ page }) => {
    await open(page, 'states');
    const empty = card(page, 'Empty');
    await expect(empty.getByText('No people yet')).toBeVisible();
    await expect(empty.getByRole('columnheader')).toHaveCount(4);

    const failed = card(page, 'Error, with retry');
    await expect(failed.getByRole('alert')).toContainText('People did not load');
    await expect(bodyRows(failed)).toHaveCount(0);
    await failed.getByRole('button', { name: 'Try again' }).click();
    await expect(failed.getByRole('alert')).toHaveCount(0);
    await expect(bodyRows(failed)).toHaveCount(5);
  });

  test('reaching the end asks for more, and the wait is announced', async ({ page }) => {
    await open(page, 'states');
    const group = card(page, 'Loading more');
    const table = grid(group, 'Loading more');
    await expect(group.getByText('Rows: 20')).toBeVisible();
    await expect(group.getByRole('status')).toHaveText('Loading more');
    await expect(table.locator('tr[data-kind="skeleton"]')).toHaveCount(1);
    const view = viewport(table);
    await view.evaluate((el) => (el.scrollTop = el.scrollHeight));
    await expect(group.getByText('Rows: 40')).toBeVisible();
    await view.evaluate((el) => (el.scrollTop = el.scrollHeight));
    await expect(group.getByText('Rows: 60')).toBeVisible();
    await expect(bodyRows(table)).toHaveCount(60);
    await expect(group.getByRole('status')).toHaveText('');
    await expect(table.locator('tr[data-kind="skeleton"]')).toHaveCount(0);
  });
});

test.describe('highlightChanges', () => {
  test('a changed value flashes once with a sign for its direction', async ({ page }) => {
    await open(page, 'live-updates');
    const table = grid(page, 'Live values');
    await expect(table.locator('[data-part="change-flash"]')).toHaveCount(0);
    await page.getByRole('button', { name: 'Update values' }).click();
    const cell = (person: string) =>
      table.getByRole('row', { name: new RegExp(person) }).locator('[data-col="score"]');
    await expect(cell('Person A').locator('[data-part="change-flash"]')).toHaveAttribute(
      'data-direction',
      'up',
    );
    await expect(cell('Person A').locator('[data-part="change-sign"]')).toHaveText('▲increased');
    await expect(cell('Person B').locator('[data-part="change-flash"]')).toHaveAttribute(
      'data-direction',
      'down',
    );
    await expect(cell('Person B').locator('[data-part="change-sign"]')).toHaveText('▼decreased');
    // Text has no direction: a neutral flash and no sign.
    const role = table.getByRole('row', { name: /Person C/ }).locator('[data-col="role"]');
    await expect(role.locator('[data-part="change-flash"]')).toHaveAttribute('data-direction', 'neutral');
    await expect(role.locator('[data-part="change-sign"]')).toHaveCount(0);
    // Only what changed flashes, and the value is not counted up: it is simply the new one.
    await expect(table.locator('[data-part="change-flash"]')).toHaveCount(3);
    await expect(cell('Person A')).toContainText('41');
    expect(
      await cell('Person A')
        .locator('[data-part="change-flash"]')
        .evaluate((el) => getComputedStyle(el).animationName),
    ).not.toBe('none');
    // The sign goes away by itself.
    await expect(table.locator('[data-part="change-sign"]')).toHaveCount(0, { timeout: 8000 });
  });

  test('with reduced motion there is no flash, only the sign', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, 'live-updates');
    const table = grid(page, 'Live values');
    await page.getByRole('button', { name: 'Update values' }).click();
    const flash = table.locator('[data-part="change-flash"]').first();
    await expect(flash).toBeAttached();
    // The fade has no duration, so nothing is drawn.
    expect(await flash.evaluate((el) => parseFloat(getComputedStyle(el).animationDuration))).toBe(0);
    expect(await flash.evaluate((el) => getComputedStyle(el).opacity)).toBe('0');
    await expect(table.locator('[data-part="change-sign"]')).toHaveCount(2);
  });
});

test.describe('rows', () => {
  test('a row action runs on a click and on Enter; a disabled row does nothing', async ({ page }) => {
    await open(page, 'row-features');
    const group = card(page, 'Row action and disabled rows');
    const table = grid(group, 'Row action');
    await table
      .getByRole('row', { name: /Person B/ })
      .getByRole('gridcell', { name: 'Team 2' })
      .click();
    await expect(group.getByText('Last action: Opened p2')).toBeVisible();
    await press(page, 'ArrowDown', 'Enter');
    // Person C is disabled: focusable, but not activated.
    expect(await focused(page)).toMatchObject({ row: 'r:p3' });
    await expect(table.getByRole('row', { name: /Person C/ })).toHaveAttribute('aria-disabled', 'true');
    await expect(group.getByText('Last action: Opened p2')).toBeVisible();
    await table
      .getByRole('row', { name: /Person C/ })
      .getByRole('rowheader')
      .click({ force: true });
    await expect(group.getByText('Last action: Opened p2')).toBeVisible();
    await press(page, 'ArrowDown', 'Enter');
    await expect(group.getByText('Last action: Opened p4')).toBeVisible();
  });

  test('a row with an href holds a real link, followed by a click anywhere and by Enter', async ({
    page,
  }) => {
    await open(page, 'row-features');
    const table = grid(page, 'Rows that are links');
    const row = table.getByRole('row', { name: /Person B/ });
    await expect(row.getByRole('link', { name: 'Person B' })).toHaveAttribute('href', '#p2');
    await row.getByRole('gridcell', { name: 'Planner' }).click();
    await expect(page).toHaveURL(/#p2$/);
    await press(page, 'ArrowDown', 'Enter');
    await expect(page).toHaveURL(/#p3$/);
  });

  test('highlight and accent are not carried by colour alone', async ({ page }) => {
    await open(page, 'row-features');
    const table = grid(page, 'Highlight and accent');
    const mine = table.getByRole('row', { name: /Person B/ });
    await expect(mine).toHaveAttribute('data-highlighted', 'true');
    await expect(mine.getByRole('rowheader')).toHaveCSS('font-weight', '700');
    await expect(mine).toContainText('Yours');
    await expect(mine).toContainText('Team 2 Yours Person B');
    const other = table.getByRole('row', { name: /Person D/ });
    await expect(other).not.toHaveAttribute('data-accent', /.*/);
    // The marker is drawn at the start edge of the row.
    const width = await mine.getByRole('rowheader').evaluate((el) => getComputedStyle(el, '::before').width);
    expect(width).toBe('3px');
  });
});

test.describe('parts and blocks', () => {
  test('parts are replaced by a function, a node and null', async ({ page }) => {
    await open(page, 'parts-and-blocks');
    const table = grid(page, 'Parts');
    await expect(bodyRows(table).first()).toHaveAttribute('data-team', 'Team 4');
    await expect(bodyRows(table).first().locator('[data-col="score"]')).toHaveCSS('font-weight', '700');
    await expect(header(table, 'Score').locator('[data-part="sort-indicator"]')).toHaveText('↕');
    await expect(table.locator('tfoot')).toHaveCount(0);
    await expect(grid(page, 'Custom skeleton').locator('tr[data-kind="skeleton"]').first()).toContainText(
      '…',
    );
    await expect(page.getByText('A custom empty state.')).toBeVisible();
  });

  test('a table composed from the blocks is a grid with the same keyboard', async ({ page }) => {
    await open(page, 'parts-and-blocks');
    const group = card(page, 'Blocks');
    const table = grid(group, 'Composed by hand');
    await header(table, 'Name').focus();
    await press(page, 'ArrowRight', 'ArrowRight');
    await expect(header(table, 'Score')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(header(table, 'Score')).toHaveAttribute('aria-sort', 'descending');
    expect((await bodyRows(table).first().textContent())!).toContain('Person D');

    // Down through the group row (one cell that spans the table) and back into the same column.
    await press(page, 'ArrowDown', 'ArrowDown');
    await expect(bodyRows(table).first().getByRole('gridcell').last()).toBeFocused();
    await page.keyboard.press('Space');
    await expect(group.getByText('Selected: p2, p4')).toBeVisible();
    await expect(bodyRows(table).first()).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Control+End');
    await expect(table.locator('tfoot td')).toBeFocused();

    await group.getByRole('button', { name: 'Collapse Everyone' }).click();
    await expect(bodyRows(table)).toHaveCount(0);
    await expect(table.locator('tr[data-kind="group"]')).toHaveAttribute('data-collapsed', 'true');
  });
});

test.describe('tooltips and the actions menu', () => {
  test("a header hint shows on hover and on keyboard focus, and is the header's description", async ({
    page,
  }) => {
    await open(page, 'people');
    const table = grid(page, 'People');
    const score = header(table, 'Score');
    await expect(score).toHaveAccessibleDescription('Average of the last five reviews');
    const tip = page.locator('[data-umbra="tooltip"]');
    await expect(tip).toHaveCount(0);
    await score.hover();
    await expect(tip).toHaveText('Average of the last five reviews');
    await page.mouse.move(5, 5);
    await expect(tip).toHaveCount(0);
    // By keyboard it shows at once, and goes when focus moves on.
    await header(table, 'Status').focus();
    await page.keyboard.press('ArrowRight');
    await expect(score).toBeFocused();
    await expect(tip).toHaveText('Average of the last five reviews');
    await page.keyboard.press('ArrowLeft');
    await expect(tip).toHaveCount(0);
  });

  test('a cell shows its full text in a tooltip only while the text is cut', async ({ page }) => {
    await open(page, 'people');
    const table = grid(page, 'People');
    const cell = table.getByRole('row', { name: /Person C/ }).locator('[data-col="team"]');
    const tip = page.locator('[data-umbra="tooltip"]');
    await cell.hover();
    await page.waitForTimeout(800);
    await expect(tip).toHaveCount(0);
    await page.mouse.move(5, 5);
    // Cut the text (as a narrow column would), and point at it again.
    await cell.evaluate((el: HTMLElement) => (el.style.letterSpacing = '60px'));
    expect(await cell.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    await cell.hover();
    await expect(tip).toHaveText('Team 3');
    // The browser's own tooltip is not used.
    await expect(cell).not.toHaveAttribute('title', /.*/);
    await table.locator('xpath=ancestor::*[@data-part="viewport"][1]').evaluate((el) => (el.scrollTop = 40));
    await expect(tip).toHaveCount(0);
  });

  test('the actions menu opens from its cell by keyboard and reports the row', async ({ page }) => {
    await open(page, 'people');
    const group = card(page, 'People');
    const table = grid(page, 'People');
    const row = table.getByRole('row', { name: /Person B/ });
    await row.getByRole('button', { name: 'More actions for Person B' }).click();
    await page.getByRole('menuitem', { name: 'Duplicate' }).click();
    await expect(group.getByText('Last action: duplicate p2')).toBeVisible();

    // From the cell: Enter moves in, Tab reaches the button, Enter opens the menu. Escape closes the menu
    // first, and then returns to the cell.
    await expect(row.getByRole('button', { name: 'More actions for Person B' })).toBeFocused();
    await page.keyboard.press('Escape');
    expect(await focused(page)).toMatchObject({ row: 'r:p2', col: 'actions', isCell: true });
    await press(page, 'Enter', 'Shift+Tab');
    await expect(row.getByRole('button', { name: 'More actions for Person B' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(row.getByRole('button', { name: 'More actions for Person B' })).toBeFocused();
    await page.keyboard.press('Escape');
    expect(await focused(page)).toMatchObject({ row: 'r:p2', col: 'actions', isCell: true });
    await press(page, 'Enter', 'Shift+Tab', 'Enter', 'ArrowDown', 'ArrowDown', 'Enter');
    await expect(group.getByText('Last action: archive p2')).toBeVisible();
  });
});

// `height`: the stories of "Layout/Content height" hold a table, a list and a chart side by side.
const openHeight = async (page: Page, story: string) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`/iframe.html?id=layout-content-height--${story}&viewMode=story`);
  await page.locator('#storybook-root > *').first().waitFor();
  await page.evaluate(() => document.fonts.ready);
};
/** The root's height, and how much of its content is scrolled out of view inside it. */
const heightOf = (root: Locator) =>
  root.evaluate((el) => {
    const view = el.querySelector('[data-part="viewport"]');
    return {
      mode: el.getAttribute('data-height'),
      height: Math.round(el.getBoundingClientRect().height),
      hidden: view ? view.scrollHeight - view.clientHeight : 0,
    };
  });
/** Opens the popover of the card the stack collapsed. */
const openCollapsed = async (page: Page, title: string) => {
  await page.locator('[data-collapsed="layout"]').getByRole('button', { name: title }).click();
  return page.getByRole('dialog');
};

test.describe('height', () => {
  const root = (scope: Page | Locator, name: string) =>
    scope.locator(`[data-umbra="data-table"]:has([role="grid"][aria-label="${name}"])`);

  test('with no height to fill a table is as tall as its rows; "content" and a number say so', async ({
    page,
  }) => {
    await openHeight(page, 'flowing');
    // In a flowing wrapper: the default falls back to the content, and the next table follows it.
    const first = await heightOf(root(page, 'First table'));
    const second = await heightOf(root(page, 'Second table'));
    expect(first).toMatchObject({ mode: 'fill', hidden: 0 });
    expect(second).toMatchObject({ mode: 'fill', hidden: 0 });
    // A header and four or six rows of 26px.
    expect(first.height).toBeGreaterThanOrEqual(4 * 26 + 26);
    expect(second.height - first.height).toBe(2 * 26);
    const [a, b] = [
      (await root(page, 'First table').boundingBox())!,
      (await root(page, 'Second table').boundingBox())!,
    ];
    expect(b.y).toBeGreaterThanOrEqual(a.y + a.height);

    // In a body that has a height: explicit.
    const content = await heightOf(root(page, 'Content table'));
    expect(content).toMatchObject({ mode: 'content', hidden: 0 });
    expect(content.height).toBe(first.height + 26);
    const fixed = await heightOf(root(page, 'Fixed table'));
    expect(fixed).toMatchObject({ mode: 'fixed', height: 120 });
    expect(fixed.hidden).toBeGreaterThan(100);

    // The default in a slot with a height still fills it and scrolls inside.
    const filling = root(page, 'Filling table');
    const body = (await card(page, 'The default still fills').locator('> [data-part="body"]').boundingBox())!;
    expect((await heightOf(filling)).height).toBe(Math.round(body.height) - 16);
    expect((await heightOf(filling)).hidden).toBe(0);
    // Shorter, and still above the minimum window (below it the columns would be tabs).
    await page.setViewportSize({ width: 1280, height: 600 });
    await expect.poll(async () => (await heightOf(filling)).hidden).toBeGreaterThan(40);
  });

  test('the popover of a collapsed card shows the whole table', async ({ page }) => {
    await openHeight(page, 'collapsed-cards');
    const dialog = await openCollapsed(page, 'Table');
    await expect(dialog.getByRole('grid', { name: 'Collapsed table' }).locator('tbody > tr')).toHaveCount(8);
    const table = await heightOf(root(dialog, 'Collapsed table'));
    expect(table.height).toBeGreaterThanOrEqual(8 * 26 + 26);
    expect(table.hidden).toBe(0);
  });

  test('a table in an accordion panel has its height', async ({ page }) => {
    await openHeight(page, 'panel-and-modal');
    await page.keyboard.press('Escape');
    const table = await heightOf(root(page, 'Table in a panel'));
    expect(table.height).toBeGreaterThanOrEqual(3 * 26 + 26);
    expect(table.hidden).toBe(0);
  });
});

test.describe('column widths', () => {
  const at = async (page: Page, story: string, density: string, width = 1280) => {
    await page.setViewportSize({ width, height: 720 });
    await page.goto(`/iframe.html?id=data-datatable--${story}&viewMode=story&globals=density:${density}`);
    await page.locator('#storybook-root > *').first().waitFor();
    await page.evaluate(() => document.fonts.ready);
  };

  test('a width in pixels is for the default density and scales with the cell font', async ({ page }) => {
    // "Won" is 64 pixels wide at the default density, where the cell font is 13px.
    for (const [density, width] of [
      ['compact', 59],
      ['default', 64],
      ['spacious', 69],
    ] as const) {
      await at(page, 'ranking', density);
      const table = page.getByRole('grid').first();
      await expect.poll(async () => (await header(table, 'Won').boundingBox())!.width, density).toBe(width);
    }
  });

  test('a content width fits the longest text of its column at every density', async ({ page }) => {
    for (const density of ['compact', 'default', 'spacious']) {
      // Wide enough for every column of the three tables.
      await at(page, 'sorting', density, 2400);
      const table = page.getByRole('grid').first();
      const cut = await table.evaluate((el) =>
        [...el.querySelectorAll<HTMLElement>('[data-col="score"], [data-col="tasks"]')]
          .filter((cell) => cell.scrollWidth > cell.clientWidth)
          .map((cell) => cell.textContent),
      );
      expect(cut, density).toEqual([]);
      // As wide as its text needs, not a fixed 80 pixels.
      const tasks = (await header(table, 'Tasks').boundingBox())!.width;
      expect(tasks, density).toBeLessThan(80);
      expect(tasks, density).toBeGreaterThan(40);
    }
  });

  test('stripes have the strength of the stripes of List and KeyValueList', async ({ page }) => {
    await at(page, 'ranking', 'default');
    const table = page.getByRole('grid').first();
    /** The red channel of a row's fill, 0 to 255. Chromium reports a mixed colour as `color(srgb r g b)`. */
    const light = (row: string) =>
      table
        .locator(`tbody > tr[data-kind="row"]${row} > td`)
        .nth(1)
        .evaluate((cell) => {
          const colour = getComputedStyle(cell).backgroundColor;
          const red = Number(colour.match(/[0-9.]+/)![0]);
          return colour.startsWith('color(') ? red * 255 : red;
        });
    const [striped, plain] = [
      await light('[data-striped]:not([data-highlighted])'),
      await light(':not([data-striped], [data-highlighted])'),
    ];
    // 5% of the text colour over the surface: about 12 levels of 255 on a dark card (it was 3).
    expect(striped - plain).toBeGreaterThanOrEqual(8);
    expect(
      await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--umbra-state-stripe-strength'),
      ),
    ).toBe('5%');
  });
});
