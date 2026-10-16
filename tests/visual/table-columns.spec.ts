import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { contextPresets } from '../../src/styles/tokens.generated';
import { expectFocusKept, pressKeys, runAxe, settle } from './helpers';

// The end user's column controls of DataTable (plan/specs/DataTable.md): the columns button and its
// list, the menu of a header, the resize handle, and how each of them meets the rule that hides
// columns by priority. Every pointer path has its keys beside it.
const open = async (
  page: Page,
  story: string,
  { width = 1280, height = 720, globals = '' }: { width?: number; height?: number; globals?: string } = {},
) => {
  await page.setViewportSize({ width, height });
  await page.goto(
    `/iframe.html?id=data-datatable--${story}&viewMode=story${globals && `&globals=${globals}`}`,
  );
  await page.locator('#storybook-root > *').first().waitFor();
  await page.evaluate(async () => {
    await Promise.all(
      [...document.fonts].filter((f) => f.unicodeRange.startsWith('U+0-FF')).map((f) => f.load()),
    );
    await document.fonts.ready;
  });
};
const grid = (scope: Page | Locator, name: string) => scope.getByRole('grid', { name, exact: true });
const header = (table: Locator, name: string) => table.getByRole('columnheader', { name, exact: true });
/** The ids of the columns drawn, in order, without the columns the table adds. */
const shown = (table: Locator) =>
  table
    .locator('thead > tr[data-row-key="head"] > th')
    .evaluateAll((cells) =>
      cells.map((cell) => (cell as HTMLElement).dataset.col!).filter((id) => !id.startsWith('__')),
    );
const widthOf = async (table: Locator, id: string) =>
  Math.round((await table.locator(`thead th[data-col="${id}"]`).boundingBox())!.width);
const said = (table: Locator) =>
  table.locator('xpath=ancestor::*[@data-umbra="data-table"][1]').locator('[role="status"]');
const dialog = (page: Page) => page.getByRole('dialog', { name: 'Columns' });
/** The ids of the rows of the column menu, in order. */
const listed = (page: Page) =>
  dialog(page)
    .locator('[data-part="columnMenuItem"]')
    .evaluateAll((rows) => rows.map((row) => (row as HTMLElement).dataset.col!));
const box = (page: Page, name: string, column: string) =>
  dialog(page).locator(`[data-col="${column}"]`).getByRole('checkbox', { name });
const state = (page: Page) => page.locator('p', { hasText: /^Columns: / });
/** What has the focus: the column of its cell, and whether it is the cell itself. */
const focused = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    const cell = el?.closest<HTMLElement>('[data-cell]');
    return {
      col: cell?.dataset.col ?? null,
      row: cell?.parentElement?.dataset.rowKey ?? null,
      isCell: el === cell,
    };
  });
/** Opens the menu of a column header with the keyboard, and chooses a row of it. */
const choose = async (page: Page, table: Locator, column: string, item: string) => {
  await table.locator(`thead th[data-col="${column}"]`).focus();
  await page.keyboard.press('Shift+F10');
  await page.getByRole('menuitem', { name: item, exact: true }).click();
  await expect(page.getByRole('menu')).toHaveCount(0);
  await expectFocusKept(page);
  // "Resize" hands the focus to the column's handle a frame after the menu has closed.
  if (item === 'Resize')
    await expect(table.locator(`thead th[data-col="${column}"] [role="separator"]`)).toBeFocused();
};
const noPageScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

test.describe('column menu', () => {
  test('the columns button lists every column; "No room" is not "hidden by me"; a tick overrules the table', async ({
    page,
  }) => {
    await open(page, 'column-controls');
    const table = grid(page, 'People');
    expect(await shown(table)).toEqual([
      'name',
      'id',
      'team',
      'role',
      'status',
      'tasks',
      'progress',
      'score',
    ]);
    const mark = header(table, '2 columns hidden');
    await expect(mark.getByRole('button', { name: '2 columns hidden' })).toHaveText('+2');
    await expect(mark).toHaveAccessibleDescription('Level, Change');

    // Keys only: the button's cell is the last of the header row, and Enter opens the list.
    await header(table, 'Name').focus();
    await pressKeys(page, 'End');
    await expect(mark).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(dialog(page)).toBeVisible();
    await expectFocusKept(page);
    await expect(mark.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
    expect(await listed(page)).toEqual([
      'name',
      'id',
      'team',
      'role',
      'status',
      'tasks',
      'level',
      'change',
      'progress',
      'score',
    ]);
    await expect(box(page, 'Team', 'team')).toBeChecked();
    await expect(box(page, 'Level No room', 'level')).not.toBeChecked();
    await expect(box(page, 'Change No room', 'change')).not.toBeChecked();
    await expect(box(page, 'Name Pin to start', 'name')).toBeChecked();

    // A column the table hid: ticking it wins over the priority rule, and another column gives way.
    await box(page, 'Level No room', 'level').check({ force: true });
    expect(await shown(table)).toEqual([
      'name',
      'team',
      'role',
      'status',
      'tasks',
      'level',
      'progress',
      'score',
    ]);
    await expect(box(page, 'Level', 'level')).toBeChecked();
    await expect(box(page, 'Id No room', 'id')).not.toBeChecked();

    // A column the user hides is not "no room": it has no note, and no width brings it back.
    await box(page, 'Team', 'team').uncheck({ force: true });
    await expect(dialog(page).locator('[data-col="team"] [data-part="noRoom"]')).toHaveCount(0);
    expect(await shown(table)).not.toContain('team');
    await expect(state(page)).toHaveText('Columns: {"visibility":{"level":true,"team":false}}');
    await page.setViewportSize({ width: 1900, height: 720 });
    await expect
      .poll(() => shown(table))
      .toEqual(['name', 'id', 'role', 'status', 'tasks', 'level', 'change', 'progress', 'score']);
    await expect(header(table, '1 column hidden')).toHaveAccessibleDescription('Team');

    // The count and the positions are those of every column, in the order they have now.
    await expect(table).toHaveAttribute('aria-colcount', '12');
    await expect(header(table, 'Role')).toHaveAttribute('aria-colindex', '5');
    await expect(header(table, 'Score')).toHaveAttribute('aria-colindex', '11');

    // Escape closes the list and the focus is back in the grid, on the button's cell.
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toHaveCount(0);
    await expectFocusKept(page);
    await expect.poll(() => focused(page)).toMatchObject({ col: '__hidden', row: 'head' });
  });

  test('a handle moves its column with Alt or Ctrl + Arrow, keeps the focus and says where it went', async ({
    page,
  }) => {
    await open(page, 'column-controls');
    const table = grid(page, 'People');
    await table.getByRole('button', { name: '2 columns hidden' }).click();
    // Tab reaches every control: close, search, show all, reset, then each row's handle and box.
    await pressKeys(page, 'Tab', 'Tab', 'Tab', 'Tab', 'Tab');
    await expect(dialog(page).getByRole('button', { name: 'Move Name' })).toBeFocused();
    await pressKeys(page, 'Tab');
    await expect(box(page, 'Name Pin to start', 'name')).toBeFocused();
    await pressKeys(page, 'Tab', 'Tab', 'Tab');
    const handle = dialog(page).getByRole('button', { name: 'Move Team' });
    await expect(handle).toBeFocused();

    await pressKeys(page, 'Alt+ArrowDown');
    expect((await listed(page)).slice(0, 4)).toEqual(['name', 'id', 'role', 'team']);
    expect((await shown(table)).slice(0, 4)).toEqual(['name', 'id', 'role', 'team']);
    await expect(handle).toBeFocused();
    await expect(said(table)).toHaveText('Team moved to position 4 of 10');
    await expect(header(table, 'Team')).toHaveAttribute('aria-colindex', '5');
    await pressKeys(page, 'Control+ArrowUp', 'Control+ArrowUp');
    expect((await listed(page)).slice(0, 4)).toEqual(['name', 'team', 'id', 'role']);
    await expect(said(table)).toHaveText('Team moved to position 2 of 10');
    // It stops at the pinned column: a move stays among the columns of its own edge.
    await pressKeys(page, 'Alt+ArrowUp');
    expect((await listed(page)).slice(0, 2)).toEqual(['name', 'team']);
    await expect(handle).toBeFocused();
    await expect(state(page)).toContainText('"order":["name","team","id","role"');

    // Enter opens the handle's actions: the same moves without a drag or a chord, and the pins.
    await pressKeys(page, 'Enter');
    const actions = page.getByRole('menu', { name: 'Move Team' });
    await expect(actions.getByRole('menuitem')).toHaveText([
      'Move up',
      'Move down',
      'Pin to start',
      'Pin to end',
    ]);
    await expect(actions.getByRole('menuitem', { name: 'Move up' })).toHaveAttribute('aria-disabled', 'true');
    await actions.getByRole('menuitem', { name: 'Move down' }).click();
    expect((await listed(page)).slice(0, 3)).toEqual(['name', 'id', 'team']);
    await expect(handle).toBeFocused();

    await handle.click();
    await page.getByRole('menuitem', { name: 'Pin to end' }).click();
    expect((await listed(page)).at(-1)).toBe('team');
    expect((await shown(table)).at(-1)).toBe('team');
    await expect(header(table, 'Team')).toHaveAttribute('data-pin', 'end');
    await expect(box(page, 'Team Pin to end', 'team')).toBeChecked();
    await expect(handle).toBeFocused();
    await handle.click();
    await page.getByRole('menuitem', { name: 'Unpin' }).click();
    await expect(header(table, 'Team')).not.toHaveAttribute('data-pin');
    await expectFocusKept(page);
  });

  test('a pointer drags a handle; a line shows where the column lands; a press without a drag opens the actions', async ({
    page,
  }) => {
    await open(page, 'column-controls');
    const table = grid(page, 'People');
    await table.getByRole('button', { name: '2 columns hidden' }).click();
    const handle = dialog(page).getByRole('button', { name: 'Move Score' });
    const from = (await handle.boundingBox())!;
    const target = (await dialog(page).locator('[data-col="status"]').boundingBox())!;
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(from.x + 12, from.y - 20, { steps: 3 });
    await page.mouse.move(from.x + 12, target.y + 2, { steps: 5 });
    const line = dialog(page).locator('[data-part="dropIndicator"]');
    await expect(line).toBeVisible();
    // The line is at the top edge of the row the column will stand before.
    expect(Math.abs((await line.boundingBox())!.y - target.y)).toBeLessThanOrEqual(2);
    await page.mouse.up();
    await expect(line).toHaveCount(0);
    expect(await listed(page)).toEqual([
      'name',
      'id',
      'team',
      'role',
      'score',
      'status',
      'tasks',
      'level',
      'change',
      'progress',
    ]);
    expect((await shown(table)).slice(3, 6)).toEqual(['role', 'score', 'status']);
    await expect(said(table)).toHaveText('Score moved to position 5 of 10');
    // The press that ended the drag did not open the actions.
    await expect(page.getByRole('menu')).toHaveCount(0);

    // Dragged past the pinned column, it stops below it.
    const again = (await handle.boundingBox())!;
    await page.mouse.move(again.x + 12, again.y + 12);
    await page.mouse.down();
    await page.mouse.move(again.x + 12, again.y - 400, { steps: 6 });
    await page.mouse.up();
    expect((await listed(page)).slice(0, 3)).toEqual(['name', 'score', 'id']);

    await handle.click();
    await expect(page.getByRole('menu', { name: 'Move Score' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(handle).toBeFocused();
  });

  test('search narrows the list; "Show all" asks for every column; "Reset" returns to the app\'s columns', async ({
    page,
  }) => {
    await open(page, 'column-controls');
    const table = grid(page, 'People');
    await table.getByRole('button', { name: '2 columns hidden' }).click();
    const search = dialog(page).getByRole('searchbox', { name: 'Search columns' });
    await search.fill('ta');
    expect(await listed(page)).toEqual(['status', 'tasks']);
    await search.fill('zz');
    await expect(dialog(page).getByText('No columns match')).toBeVisible();
    await search.fill('');
    expect(await listed(page)).toHaveLength(10);

    // Every column asked for: none hides, and what does not fit scrolls sideways inside the table.
    await page.setViewportSize({ width: 1024, height: 600 });
    await dialog(page).getByRole('button', { name: 'Show all' }).click();
    await expect.poll(() => shown(table)).toHaveLength(10);
    const view = table.locator('xpath=ancestor::*[@data-part="viewport"][1]');
    expect(await view.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeGreaterThan(0);
    expect(await noPageScroll(page)).toBe(true);
    await expect(table.getByRole('button', { name: 'Columns', exact: true })).toBeVisible();
    await expect(dialog(page).locator('[data-part="noRoom"]')).toHaveCount(0);

    await dialog(page).getByRole('button', { name: 'Reset' }).click();
    await expect(state(page)).toHaveText('Columns: {}');
    await expect.poll(async () => (await shown(table)).length).toBeLessThan(10);
    expect(await view.evaluate((el) => el.scrollWidth - el.clientWidth)).toBe(0);
    await expectFocusKept(page);
  });
});

test.describe('columns and the width of the table', () => {
  const narrow = (page: Page) => page.locator('[data-box]').filter({ has: grid(page, 'Narrow people') });
  /** The list is open, under the columns button and lined up with its end ("bottom end"). */
  const expectOnButton = (page: Page, table: Locator) =>
    expect(async () => {
      const button = (await table.locator('[data-part="columnsButton"]').boundingBox())!;
      const list = (await dialog(page).boundingBox())!;
      expect(Math.abs(list.x + list.width - (button.x + button.width))).toBeLessThanOrEqual(2);
      expect(list.y).toBeGreaterThanOrEqual(button.y + button.height);
    }).toPass({ timeout: 2000 });

  test('by default the button comes with the first column that is not shown, and goes with the last', async ({
    page,
  }) => {
    await open(page, 'column-controls');
    const table = grid(page, 'Narrow people');
    expect(await shown(table)).toEqual(['name', 'team', 'score']);
    await table.getByRole('button', { name: '3 columns hidden' }).click();
    await expect(box(page, 'Role No room', 'role')).not.toBeChecked();

    // Wide enough for every column: the button waits for the list to close before it goes with its
    // column, so the list stays on it and does not jump to the corner of the window.
    await narrow(page).evaluate((el) => (el.style.width = '700px'));
    await expect.poll(() => shown(table)).toHaveLength(6);
    await expect(dialog(page).locator('[data-part="noRoom"]')).toHaveCount(0);
    await expectOnButton(page, table);
    // Closing it with nothing to return to puts the focus on the grid's tab stop, not on the page.
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toHaveCount(0);
    await expect(table.locator('[data-col="__hidden"]')).toHaveCount(0);
    await expectFocusKept(page);
    await expect.poll(async () => (await focused(page)).isCell).toBe(true);

    // With no button, the list is one step away in every header's menu.
    await choose(page, table, 'team', 'Columns…');
    await expect(dialog(page)).toBeVisible();
    await box(page, 'Role', 'role').uncheck({ force: true });
    await expect(table.getByRole('button', { name: '1 column hidden' })).toHaveText('+1');
    await page.keyboard.press('Escape');
    await expectFocusKept(page);

    // The same with a tick: showing the last column the user hid keeps the list on the button.
    await table.getByRole('button', { name: '1 column hidden' }).click();
    await box(page, 'Role', 'role').check({ force: true });
    await expect.poll(() => shown(table)).toHaveLength(6);
    await expectOnButton(page, table);
    await page.keyboard.press('Escape');
    await expect(table.locator('[data-col="__hidden"]')).toHaveCount(0);

    // Opened from a header's menu, the list loses that header when its column is hidden from the list:
    // it moves to the button the hidden column brings.
    await choose(page, table, 'team', 'Columns…');
    await box(page, 'Team', 'team').uncheck({ force: true });
    await expect.poll(() => shown(table)).toHaveLength(5);
    await expectOnButton(page, table);
    await page.keyboard.press('Escape');
    await expectFocusKept(page);
  });

  test('a 1px sweep: one layout per width, the column asked for always there, the hidden one never', async ({
    page,
  }) => {
    test.slow();
    await open(page, 'column-controls');
    const table = grid(page, 'Narrow people');
    await table.getByRole('button', { name: '3 columns hidden' }).click();
    await box(page, 'Role No room', 'role').check({ force: true });
    await box(page, 'Score', 'score').uncheck({ force: true });
    await page.keyboard.press('Escape');
    expect(await shown(table)).toEqual(['name', 'team', 'role']);

    // Down and up again, a pixel at a time: what is drawn at each width, and whether anything spills.
    const sweep = await narrow(page).evaluate(async (el) => {
      const frame = () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
      const seen = { down: [] as string[], up: [] as string[] };
      const spills: number[] = [];
      const widths = Array.from({ length: 330 }, (_, i) => 600 - i);
      for (const [pass, list] of [
        ['down', widths],
        ['up', [...widths].reverse()],
      ] as const) {
        for (const width of list) {
          el.style.width = `${width}px`;
          await frame();
          const ids = [...el.querySelectorAll<HTMLElement>('thead th')].map((th) => th.dataset.col);
          seen[pass][600 - width] = ids.join(' ');
          const view = el.querySelector('[data-part="viewport"]')!;
          // Sideways scroll only once nothing more may hide: the columns left are those that must stay.
          if (view.scrollWidth > view.clientWidth && ids.join(' ') !== 'name role __hidden')
            spills.push(width);
          if (document.documentElement.scrollWidth > window.innerWidth) spills.push(-width);
        }
      }
      return { ...seen, spills };
    });
    expect(sweep.up).toEqual(sweep.down);
    expect(sweep.spills).toEqual([]);
    for (const layout of sweep.down) {
      expect(layout).toContain('role');
      expect(layout).not.toContain('score');
      expect(layout).toContain('__hidden');
    }
    // Wide: every column but the hidden one. Narrow: the one that must stay and the one asked for.
    expect(sweep.down[0]).toBe('name team role status tasks __hidden');
    expect(sweep.down.at(-1)).toBe('name role __hidden');
    expect(new Set(sweep.down).size).toBe(4);
  });
});

test.describe('header menu', () => {
  test('Enter still sorts; Shift+F10, the menu key, a right click and the "more" button open the menu', async ({
    page,
  }) => {
    await open(page, 'column-controls');
    const table = grid(page, 'People');
    const team = header(table, 'Team');
    await team.focus();
    await pressKeys(page, 'Enter');
    await expect(team).toHaveAttribute('aria-sort', 'ascending');
    await expect(team).toHaveAttribute('aria-haspopup', 'menu');

    await pressKeys(page, 'Shift+F10');
    const menu = page.getByRole('menu', { name: 'Column options Team' });
    await expect(menu.getByRole('menuitem')).toHaveText([
      'Sort ascending',
      'Sort descending',
      'Clear sort',
      'Move left',
      'Move right',
      'Pin to start',
      'Pin to end',
      'Hide column',
      'Resize',
      'Fit to content',
      'Reset width',
      'Columns…',
    ]);
    // The first row that can be chosen has the focus: the column is already sorted ascending.
    await expect(menu.getByRole('menuitem', { name: 'Sort descending' })).toBeFocused();
    await pressKeys(page, 'Enter');
    await expect(team).toHaveAttribute('aria-sort', 'descending');
    await expect(team).toBeFocused();

    await pressKeys(page, 'ContextMenu');
    await expect(menu).toBeVisible();
    await pressKeys(page, 'Escape');
    await expect(menu).toHaveCount(0);
    await expect(team).toBeFocused();

    await team.click({ button: 'right' });
    await menu.getByRole('menuitem', { name: 'Clear sort' }).click();
    await expect(team).toHaveAttribute('aria-sort', 'none');

    // The button shows when the header is pointed at, and takes no room.
    const more = team.locator('[data-part="headerMenuButton"]');
    await expect(more).toBeHidden();
    const before = await widthOf(table, 'team');
    await team.hover();
    await expect(more).toBeVisible();
    expect(await widthOf(table, 'team')).toBe(before);
    await more.click();
    await expect(menu).toBeVisible();
    await expect(more).toBeVisible();
    await page.keyboard.press('Escape');
    await expectFocusKept(page);
  });

  test('move, pin and hide from the menu; the focus follows the column, or goes to its neighbour', async ({
    page,
  }) => {
    await open(page, 'column-controls');
    const table = grid(page, 'People');
    await choose(page, table, 'team', 'Move right');
    expect((await shown(table)).slice(0, 4)).toEqual(['name', 'id', 'role', 'team']);
    await expect(header(table, 'Team')).toBeFocused();
    await expect(header(table, 'Team')).toHaveAttribute('aria-colindex', '5');
    await expect(said(table)).toHaveText('Team moved to position 4 of 10');
    // Every row follows: the cells of the body and of the footer are in the header's order.
    const order = (row: string) =>
      table
        .locator(`${row} > [data-col]`)
        .evaluateAll((cells) => cells.map((c) => (c as HTMLElement).dataset.col));
    expect(await order('tbody > tr[data-kind="row"]:first-child')).toEqual(
      await order('thead > tr[data-row-key="head"]'),
    );
    expect(await order('tfoot > tr')).toEqual(await order('thead > tr[data-row-key="head"]'));

    await choose(page, table, 'team', 'Move left');
    await choose(page, table, 'team', 'Move left');
    expect((await shown(table)).slice(0, 3)).toEqual(['name', 'team', 'id']);
    // At the edge of its group there is nowhere to go.
    await header(table, 'Team').focus();
    await page.keyboard.press('Shift+F10');
    await expect(page.getByRole('menuitem', { name: 'Move left' })).toHaveAttribute('aria-disabled', 'true');
    await page.keyboard.press('Escape');

    await choose(page, table, 'team', 'Pin to end');
    await expect(header(table, 'Team')).toHaveAttribute('data-pin', 'end');
    await expect(header(table, 'Team')).toBeFocused();
    expect((await shown(table)).at(-1)).toBe('team');
    await choose(page, table, 'team', 'Unpin');
    await expect(header(table, 'Team')).toBeFocused();

    // Hidden: the focus is on the header that took its place.
    await choose(page, table, 'team', 'Hide column');
    expect(await shown(table)).not.toContain('team');
    expect(await focused(page)).toMatchObject({ row: 'head', col: 'id', isCell: true });
    await expect(state(page)).toContainText('"visibility":{"team":false}');
    // The arrow keys go on from there.
    await pressKeys(page, 'ArrowRight');
    expect(await focused(page)).toMatchObject({ row: 'head', col: 'role' });
  });
});

test.describe('resize', () => {
  test('by keys: "Resize" hands the arrows to a separator; Enter keeps the width and Escape puts it back', async ({
    page,
  }) => {
    await open(page, 'column-controls');
    const table = grid(page, 'People');
    const start = await widthOf(table, 'status');
    await choose(page, table, 'status', 'Resize');
    const handle = header(table, 'Status').getByRole('separator', { name: 'Resize Status' });
    await expect(handle).toBeFocused();
    await expect(handle).toHaveAttribute('aria-orientation', 'vertical');
    await expect(handle).toHaveAttribute('aria-valuenow', String(start));
    await expect(handle).toHaveAttribute('aria-valuemin', '48');
    await expect(handle).toHaveAttribute('aria-valuemax', '800');

    await pressKeys(page, 'ArrowRight', 'ArrowRight');
    await expect(handle).toHaveAttribute('aria-valuenow', String(start + 16));
    expect(await widthOf(table, 'status')).toBe(start + 16);
    // Nothing is kept until Enter.
    await expect(state(page)).toHaveText('Columns: {}');
    await pressKeys(page, 'Escape');
    expect(await widthOf(table, 'status')).toBe(start);
    await expect(header(table, 'Status')).toBeFocused();
    await expect(state(page)).toHaveText('Columns: {}');

    await choose(page, table, 'status', 'Resize');
    await pressKeys(page, 'Home');
    await expect(handle).toHaveAttribute('aria-valuenow', '48');
    await pressKeys(page, 'ArrowLeft');
    await expect(handle).toHaveAttribute('aria-valuenow', '48');
    await pressKeys(page, 'ArrowRight', 'ArrowRight', 'ArrowRight', 'Enter');
    await expect(header(table, 'Status')).toBeFocused();
    expect(await widthOf(table, 'status')).toBe(72);
    await expect(state(page)).toHaveText('Columns: {"widths":{"status":72}}');
    await expect(said(table)).toHaveText('Status width 72 pixels');
    // The arrows are the grid's again.
    await pressKeys(page, 'ArrowRight');
    expect(await focused(page)).toMatchObject({ row: 'head', col: 'tasks' });

    // "Fit to content": no cell of the column is cut. "Reset width": the column is the app's again.
    await choose(page, table, 'status', 'Fit to content');
    const cut = await table
      .locator('tbody [data-col="status"] [data-umbra="status-indicator"]')
      .evaluateAll((els) => els.filter((el) => el.scrollWidth > el.clientWidth).length);
    expect(cut).toBe(0);
    expect(await widthOf(table, 'status')).toBeLessThan(start);
    expect(await widthOf(table, 'status')).toBeGreaterThan(72);
    await choose(page, table, 'status', 'Reset width');
    await expect(state(page)).toHaveText('Columns: {"widths":{}}');
    expect(await widthOf(table, 'status')).toBe(start);
  });

  test('by pointer: 24px across the border; the others share the rest; a double click fits the content', async ({
    page,
  }) => {
    await open(page, 'column-controls');
    const table = grid(page, 'People');
    const edge = async (id: string) => {
      const b = (await table.locator(`thead th[data-col="${id}"]`).boundingBox())!;
      return { x: b.x + b.width, y: b.y + b.height / 2 };
    };
    const total = () => table.evaluate((el) => el.getBoundingClientRect().width);
    const full = await total();
    const start = await widthOf(table, 'tasks');
    let at = await edge('tasks');
    // The pointer target: 12px on each side of the border.
    for (const dx of [-11, 11]) {
      const hit = await page.evaluate(
        ([x, y]) => document.elementFromPoint(x!, y!)?.getAttribute('data-part'),
        [at.x + dx, at.y],
      );
      expect(hit).toBe('resizeHandle');
    }
    await page.mouse.move(at.x - 3, at.y);
    await expect(header(table, 'Tasks').getByRole('separator')).toHaveCSS('cursor', 'col-resize');
    await page.mouse.down();
    await page.mouse.move(at.x + 37, at.y, { steps: 4 });
    // While it moves: the column follows, the table keeps its width, and nothing is kept yet.
    expect(await widthOf(table, 'tasks')).toBe(start + 40);
    expect(await total()).toBe(full);
    await expect(state(page)).toHaveText('Columns: {}');
    await page.mouse.up();
    await expect(state(page)).toHaveText(`Columns: {"widths":{"tasks":${start + 40}}}`);
    await expect(said(table)).toHaveText(`Tasks width ${start + 40} pixels`);
    expect(await widthOf(table, 'tasks')).toBe(start + 40);
    expect(await total()).toBe(full);
    expect(await noPageScroll(page)).toBe(true);

    // From the half of the target that lies in the next header, down to the column's limit.
    at = await edge('tasks');
    await page.mouse.move(at.x + 6, at.y);
    await page.mouse.down();
    await page.mouse.move(at.x - 300, at.y, { steps: 4 });
    await page.mouse.up();
    expect(await widthOf(table, 'tasks')).toBe(48);

    at = await edge('tasks');
    await page.mouse.dblclick(at.x - 4, at.y);
    await expect.poll(() => widthOf(table, 'tasks')).toBeGreaterThan(48);
    const texts = await table
      .locator('thead th[data-col="tasks"], tbody td[data-col="tasks"]')
      .evaluateAll((cells) => cells.filter((cell) => cell.scrollWidth > cell.clientWidth).length);
    expect(texts).toBe(0);
    // A resize is not a sort, and selects no text.
    await expect(header(table, 'Tasks')).toHaveAttribute('aria-sort', 'none');
    expect(await page.evaluate(() => window.getSelection()?.toString())).toBe('');
  });

  test('a width the user set is kept: lower priorities hide for it, then the table scrolls inside', async ({
    page,
  }) => {
    await open(page, 'column-controls');
    const table = grid(page, 'People');
    const view = table.locator('xpath=ancestor::*[@data-part="viewport"][1]');
    const before = await shown(table);
    const start = await widthOf(table, 'status');
    await choose(page, table, 'status', 'Resize');
    await pressKeys(page, ...Array<string>(12).fill('ArrowRight'), 'Enter');
    expect(await widthOf(table, 'status')).toBe(start + 96);
    // The lowest priorities gave their place; nothing spills.
    expect(await shown(table)).toEqual(before.filter((id) => id !== 'id' && id !== 'progress'));
    expect(await view.evaluate((el) => el.scrollWidth - el.clientWidth)).toBe(0);

    // A column that never hides, made wider than the table: the rest hide, and it scrolls sideways inside.
    await choose(page, table, 'name', 'Resize');
    await pressKeys(page, 'End', 'Enter');
    expect(await widthOf(table, 'name')).toBe(800);
    expect(await shown(table)).toEqual(['name']);
    await page.setViewportSize({ width: 1024, height: 600 });
    await expect.poll(() => view.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeGreaterThan(0);
    expect(await widthOf(table, 'name')).toBe(800);
    expect(await noPageScroll(page)).toBe(true);
    await expectFocusKept(page);
  });

  test('right to left: the handle is on the left edge, and left grows the column', async ({ page }) => {
    await open(page, 'column-controls', { globals: 'direction:rtl' });
    const table = grid(page, 'People');
    const start = await widthOf(table, 'status');
    const cell = (await table.locator('thead th[data-col="status"]').boundingBox())!;
    await page.mouse.move(cell.x + 3, cell.y + cell.height / 2);
    await page.mouse.down();
    await page.mouse.move(cell.x - 27, cell.y + cell.height / 2, { steps: 3 });
    await page.mouse.up();
    expect(await widthOf(table, 'status')).toBe(start + 30);

    await choose(page, table, 'status', 'Resize');
    await pressKeys(page, 'ArrowLeft', 'Enter');
    expect(await widthOf(table, 'status')).toBe(start + 38);
    await expect(header(table, 'Status')).toBeFocused();

    // "Left" and "right" are named as the table is drawn: left is towards the end.
    const before = await shown(table);
    await choose(page, table, 'team', 'Move left');
    expect((await shown(table)).indexOf('team')).toBe(before.indexOf('team') + 1);
    await expect(header(table, 'Team')).toBeFocused();
    await pressKeys(page, 'ArrowLeft');
    expect((await focused(page)).col).toBe((await shown(table))[before.indexOf('team') + 2]);
  });

  test('10,000 rows: dragging a handle writes column widths only, and renders no row', async ({ page }) => {
    test.slow();
    await open(page, 'virtualised');
    const table = grid(page, '10,000 orders');
    // Storybook's accessibility addon checks the story once after it renders: let it finish first.
    await page.waitForTimeout(3000);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Performance.enable');
    const script = async () =>
      (await cdp.send('Performance.getMetrics')).metrics.find((m) => m.name === 'ScriptDuration')!.value;
    const loop = () =>
      page.evaluate(() => {
        const begin = performance.now();
        let sum = 0;
        for (let i = 0; i < 3e7; i++) sum += i % 7;
        return (performance.now() - begin + Math.min(sum, 0)) / 1000;
      });
    // Every change under the body: a rendered row would at least touch one of them.
    await table.evaluate((el) => {
      const w = window as unknown as { bodyChanges: number };
      w.bodyChanges = 0;
      new MutationObserver((records) => (w.bodyChanges += records.length)).observe(
        el.querySelector('tbody')!,
        {
          subtree: true,
          childList: true,
          attributes: true,
          characterData: true,
        },
      );
    });
    const start = await widthOf(table, 'category');
    const b = (await table.locator('thead th[data-col="category"]').boundingBox())!;
    const pace = await loop();
    const before = await script();
    await page.mouse.move(b.x + b.width - 3, b.y + 10);
    await page.mouse.down();
    for (let i = 1; i <= 120; i++) {
      await page.mouse.move(b.x + b.width - 3 + (i % 2 ? i : -i) / 2, b.y + 10);
    }
    await page.mouse.move(b.x + b.width + 57, b.y + 10);
    const seconds = (await script()) - before;
    expect(await widthOf(table, 'category')).toBe(start + 60);
    expect(await page.evaluate(() => (window as unknown as { bodyChanges: number }).bodyChanges)).toBe(0);
    // Measured: about 0.3 of a loop for the 121 moves; a render of the window per move costs more than 20.
    expect(seconds / Math.max(pace, await loop())).toBeLessThan(6);
    await page.mouse.up();
    await expect.poll(() => widthOf(table, 'category')).toBe(start + 60);
    await expect(said(table)).toHaveText(`Category width ${start + 60} pixels`);
  });
});

test.describe('with the rest of the table', () => {
  test('groups and their totals, and the rows of hidden columns, follow the columns', async ({ page }) => {
    await open(page, 'grouping');
    const table = grid(page, 'Orders by status');
    await choose(page, table, 'amount', 'Move left');
    expect(await shown(table)).toEqual(['item', 'owner', 'amount', 'quantity']);
    // The totals of a group row stand under their headers.
    const group = table.locator('tbody > tr[data-kind="group"]').first();
    expect(
      await group
        .locator('> [data-col]')
        .evaluateAll((cells) => cells.map((c) => (c as HTMLElement).dataset.col)),
    ).toEqual(['amount', 'quantity']);
    await choose(page, table, 'owner', 'Hide column');
    await expect(table.getByRole('button', { name: '1 column hidden' })).toBeVisible();
    expect(await focused(page)).toMatchObject({ row: 'head', col: 'amount' });
    await expect(table.locator('tbody > tr[data-kind="group"]').first()).toBeVisible();

    // `expandableHidden`: a row's details hold the columns with no room, not the one the user hid.
    await open(page, 'narrowing');
    const wide = grid(page, 'Table expandable 330 wide');
    await choose(page, wide, 'team', 'Hide column');
    await wide.getByRole('button', { name: 'Show hidden columns' }).first().click();
    const detail = wide.locator('[data-part="detail"]').first();
    await expect(detail).toBeVisible();
    await expect(detail).not.toContainText('Team');
    await expect(detail).toContainText('Tasks');
  });

  test('parts add to the header menu, leave a column out of the list and remove the handles', async ({
    page,
  }) => {
    await open(page, 'column-controls-parts');
    const table = grid(page, 'With parts');
    await choose(page, table, 'team', 'Export column');
    await expect(page.locator('[data-box^="Parts: exported team"]')).toBeVisible();
    await expect(table.locator('[data-part="resizeHandle"]')).toHaveCount(0);
    await header(table, 'Team').focus();
    await page.keyboard.press('Shift+F10');
    await expect(page.getByRole('menuitem', { name: 'Resize' })).toHaveCount(1);
    await page.keyboard.press('Escape');
    await table.getByRole('button', { name: '3 columns hidden' }).click();
    expect(await listed(page)).toEqual(['name', 'team', 'role', 'status', 'score']);
  });

  test('switched off: the plain mark, no menus and no handles', async ({ page }) => {
    await open(page, 'column-controls-parts');
    const table = grid(page, 'Without controls');
    const mark = header(table, '3 columns hidden');
    await expect(mark.locator('[data-part="hiddenIndicator"]')).toHaveText('+3');
    await expect(table.getByRole('button')).toHaveCount(0);
    await expect(table.locator('[data-part="resizeHandle"], [data-part="headerMenuButton"]')).toHaveCount(0);
    await header(table, 'Team').focus();
    await pressKeys(page, 'Shift+F10');
    await header(table, 'Team').click({ button: 'right' });
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(header(table, 'Team')).not.toHaveAttribute('aria-haspopup');
  });

  test('blocks: the list and a handle on a table composed by hand, with the state in the app', async ({
    page,
  }) => {
    await open(page, 'column-controls-parts');
    const table = grid(page, 'Composed columns');
    const list = page.locator('[data-box^="DataTable.ColumnMenu"]');
    await expect(table.getByRole('columnheader')).toHaveText(['Name', 'Team', 'Score']);
    await list.getByRole('checkbox', { name: 'Role' }).check({ force: true });
    await list.getByRole('button', { name: 'Move Role' }).focus();
    await pressKeys(page, 'Alt+ArrowUp');
    await expect(table.getByRole('columnheader')).toHaveText(['Name', 'Role', 'Team', 'Score']);
    await expect(list.getByRole('button', { name: 'Move Role' })).toBeFocused();
    // Fewer than ten columns: no search field. No `onShowAll`: no such button.
    await expect(list.getByRole('searchbox')).toHaveCount(0);
    await expect(list.getByRole('button', { name: 'Show all' })).toHaveCount(0);

    const handle = table.getByRole('separator', { name: 'Resize Name' });
    await expect(handle).toHaveAttribute('aria-valuenow', '120');
    await handle.focus();
    await pressKeys(page, 'ArrowRight', 'End');
    await expect(handle).toHaveAttribute('aria-valuenow', '240');
    expect(await widthOf(table, 'name')).toBe(240);
    await list.getByRole('button', { name: 'Reset' }).click();
    await expect(table.getByRole('columnheader')).toHaveText(['Name', 'Team', 'Role', 'Score']);
  });

  test('inside the popover of a collapsed card the menus open above it and work', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/iframe.html?id=layout-content-height--collapsed-cards&viewMode=story');
    await page.locator('[data-collapsed="layout"]').getByRole('button', { name: 'Table' }).click();
    const table = page.getByRole('dialog').getByRole('grid', { name: 'Collapsed table' });
    const count = await table.getByRole('columnheader').count();
    const first = table.getByRole('columnheader').first();
    await first.click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Columns…' }).click();
    await expect(dialog(page)).toBeVisible();
    const last = dialog(page).getByRole('checkbox').last();
    await last.uncheck({ force: true });
    await expect(table.getByRole('columnheader')).toHaveCount(count);
    await expect(table.getByRole('button', { name: '1 column hidden' })).toBeVisible();
    // The card's popover is still open under the list.
    await expect(table).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toHaveCount(0);
    await expect(table).toBeVisible();
    await expectFocusKept(page);
  });
});

test.describe('accessibility of the open menus', () => {
  const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
  const check = async (page: Page) => {
    await settle(page);
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((a) => Number.isFinite(a.effect?.getComputedTiming().endTime))
          .map((a) => a.finished.catch(() => null)),
      ),
    );
    const { violations } = await runAxe(page, new AxeBuilder({ page }).withTags(tags));
    expect(violations.flatMap((v) => v.nodes.map((n) => `${v.id}: ${n.html.slice(0, 400)}`))).toEqual([]);
  };
  for (const context of contextPresets) {
    test(`the column menu, a handle's actions and a header's menu on ${context}`, async ({ page }) => {
      await open(page, 'column-controls', { globals: `context:${context}` });
      const table = grid(page, 'People');
      await table.getByRole('button', { name: '2 columns hidden' }).click();
      await box(page, 'Team', 'team').uncheck({ force: true });
      await expect(dialog(page)).toBeVisible();
      await check(page);
      await dialog(page).getByRole('button', { name: 'Move Role' }).click();
      await expect(page.getByRole('menu')).toBeVisible();
      await check(page);
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
      await header(table, 'Status').focus();
      await page.keyboard.press('Shift+F10');
      await expect(page.getByRole('menu')).toBeVisible();
      await check(page);
      await page.keyboard.press('Escape');
      await choose(page, table, 'status', 'Resize');
      await page.keyboard.press('ArrowRight');
      await check(page);
    });
  }
});
