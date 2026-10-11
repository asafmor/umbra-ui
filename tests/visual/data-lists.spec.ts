import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectChangeHighlights } from './live';
import { contrast, pixels } from './pixels';

// EmptyState, GroupHeader, ListItem and List: keyboard, focus, selection, data states and every shrink step.
const open = async (page: Page, id: string, width = 1280, height = 720) => {
  await page.setViewportSize({ width, height });
  await page.goto(`/iframe.html?id=${id}&viewMode=story`);
  await page.locator('#storybook-root > *').first().waitFor();
  await page.evaluate(async () => {
    await Promise.all(
      [...document.fonts].filter((f) => f.unicodeRange.startsWith('U+0-FF')).map((f) => f.load()),
    );
    await document.fonts.ready;
  });
};
const box = (page: Page, label: string) => page.locator(`[data-box^="${label}:"]`);
const card = (page: Page, title: string) =>
  page
    .locator('[data-umbra="card"]')
    .filter({ has: page.getByRole('heading', { name: title, exact: true }) });
const part = (root: Locator, name: string) => root.locator(`[data-part="${name}"]`);
const truncated = (target: Locator) => target.evaluate((el) => el.scrollWidth > el.clientWidth);

test.describe('EmptyState', () => {
  test('a block hides its icon, then its description, as it gets shorter, and shows them again', async ({
    page,
  }) => {
    await open(page, 'data-emptystate--shrink');
    const roomy = box(page, 'roomy');
    const short = box(page, 'short');
    const tiny = box(page, 'tiny');
    await expect(part(roomy, 'icon')).toBeVisible();
    await expect(part(roomy, 'description')).toBeVisible();
    await expect(part(short, 'icon')).toBeHidden();
    await expect(part(short, 'description')).toBeVisible();
    await expect(part(tiny, 'icon')).toBeHidden();
    await expect(part(tiny, 'description')).toBeHidden();
    await expect(part(tiny, 'title')).toBeVisible();

    await tiny.evaluate((el) => (el.style.height = '160px'));
    await expect(part(tiny, 'icon')).toBeVisible();
    await expect(part(tiny, 'description')).toBeVisible();
    await tiny.evaluate((el) => (el.style.height = '76px'));
    await expect(part(tiny, 'icon')).toBeHidden();
    await expect(part(tiny, 'description')).toBeVisible();
  });

  test('an inline one hides its icon, then its description, then truncates its title', async ({ page }) => {
    await open(page, 'data-emptystate--shrink');
    const wide = box(page, 'wide');
    const medium = box(page, 'medium');
    const narrow = box(page, 'narrow');
    const narrowest = box(page, 'narrowest');
    await expect(part(wide, 'icon')).toBeVisible();
    await expect(part(medium, 'icon')).toBeHidden();
    await expect(part(medium, 'description')).toBeVisible();
    await expect(part(narrow, 'description')).toBeHidden();
    expect(await truncated(part(narrow, 'title'))).toBe(false);
    await expect(part(narrowest, 'description')).toBeHidden();
    expect(await truncated(part(narrowest, 'title'))).toBe(true);

    await narrowest.evaluate((el) => (el.style.width = '460px'));
    await expect(part(narrowest, 'icon')).toBeVisible();
  });

  test('parts can be replaced or hidden', async ({ page }) => {
    await open(page, 'data-emptystate--parts-and-blocks');
    await expect(card(page, 'Parts: function and node').locator('h3[data-part="title"]')).toHaveText(
      'No orders',
    );
    const hidden = card(page, 'Parts: hidden');
    await expect(part(hidden, 'icon')).toHaveCount(0);
    await expect(part(hidden, 'action')).toHaveCount(0);
    await expect(part(hidden, 'description')).toBeVisible();
  });
});

test.describe('GroupHeader', () => {
  test('the caret collapses and expands its group by keyboard', async ({ page }) => {
    await open(page, 'data-groupheader--variants');
    const group = card(page, 'Collapsible');
    const caret = group.getByRole('button', { name: 'Collapse Incoming' });
    await expect(caret).toHaveAttribute('aria-expanded', 'true');
    await expect(group.getByText('Order 1')).toBeVisible();

    await caret.focus();
    await page.keyboard.press('Enter');
    await expect(group.getByText('Order 1')).toHaveCount(0);
    await expect(group.getByText('Incoming is collapsed')).toBeVisible();
    const expand = group.getByRole('button', { name: 'Expand Incoming' });
    await expect(expand).toBeFocused();
    await expect(expand).toHaveAttribute('aria-expanded', 'false');
    await page.keyboard.press('Space');
    await expect(group.getByText('Order 1')).toBeVisible();

    // An uncontrolled header keeps its own state.
    await group.getByRole('button', { name: 'Expand Outgoing' }).click();
    await expect(group.getByRole('button', { name: 'Collapse Outgoing' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  test('the title is a heading of the given level', async ({ page }) => {
    await open(page, 'data-groupheader--variants');
    await expect(page.getByRole('heading', { name: 'Fri 9 Oct', level: 3 }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Level 4 heading', level: 4 })).toBeVisible();
  });

  test('a sticky header stays at the top while its group scrolls', async ({ page }) => {
    await open(page, 'data-groupheader--variants');
    const viewport = card(page, 'Sticky').locator('[data-part="viewport"]');
    const first = viewport.locator('[data-umbra="group-header"]').first();
    await viewport.evaluate((el) => (el.scrollTop = 100));
    const [top, headerTop] = await Promise.all([
      viewport.evaluate((el) => el.getBoundingClientRect().top),
      first.evaluate((el) => el.getBoundingClientRect().top),
    ]);
    expect(Math.abs(top - headerTop)).toBeLessThan(1);
  });

  test('as the header narrows the meta text hides, the actions move into a menu, then the title truncates', async ({
    page,
  }) => {
    await open(page, 'data-groupheader--shrink');
    const wide = box(page, 'wide');
    const medium = box(page, 'medium');
    const narrow = box(page, 'narrow');
    await expect(part(wide, 'meta')).toBeVisible();
    await expect(part(medium, 'meta')).toHaveCount(0);
    expect(await truncated(part(medium, 'title'))).toBe(false);
    await expect(medium.getByRole('button', { name: 'Add' })).toBeVisible();
    // The action is a row of the overflow menu before the title gives way.
    expect(await truncated(part(narrow, 'title'))).toBe(true);
    await expect(narrow.getByRole('button', { name: 'Add' })).toHaveCount(0);
    await narrow.getByRole('button', { name: 'More actions' }).click();
    await expect(page.getByRole('menu', { name: 'More actions' }).getByRole('menuitem')).toHaveText(['Add']);
    await page.keyboard.press('Escape');

    await narrow.evaluate((el) => (el.style.width = '420px'));
    await expect(part(narrow, 'meta')).toBeVisible();
  });
});

test.describe('ListItem', () => {
  test('trailing hides, then the description, then the meta text; the title truncates', async ({ page }) => {
    await open(page, 'data-listitem--shrink');
    const boxes = card(page, 'Default').locator('[data-box]');
    const visible = async (index: number) =>
      Promise.all(
        ['trailing', 'description', 'meta'].map((name) => part(boxes.nth(index), name).isVisible()),
      );
    expect(await visible(0)).toEqual([true, true, true]);
    expect(await visible(1)).toEqual([false, true, true]);
    expect(await visible(2)).toEqual([false, false, true]);
    expect(await visible(3)).toEqual([false, false, false]);
    expect(await truncated(part(boxes.nth(3), 'title'))).toBe(true);
    // A truncated title is whole in a tooltip; a title that fits has none.
    const tooltip = page.getByRole('tooltip');
    await part(boxes.nth(3), 'title').hover();
    await expect(tooltip).toHaveText((await part(boxes.nth(3), 'title').textContent())!);
    await page.mouse.move(0, 0);
    await expect(tooltip).toHaveCount(0);
    await boxes.nth(0).evaluate((el) => (el.style.width = '600px'));
    await part(boxes.nth(0), 'title').hover();
    await page.waitForTimeout(700);
    await expect(tooltip).toHaveCount(0);
    // The unread dot stays when the meta text has gone: it is not the time that says "unread".
    await expect(part(boxes.nth(3), 'unread')).toBeVisible();

    await boxes.nth(3).evaluate((el) => (el.style.width = '320px'));
    expect(await visible(3)).toEqual([true, true, true]);
  });

  test('a row with onPress or href is one control; a control inside it keeps its own press', async ({
    page,
  }) => {
    await open(page, 'data-listitem--default');
    const group = card(page, 'Link and button');
    const row = group.locator('[data-umbra="list-item"]').first();
    // A click anywhere on the row presses it.
    await row.click({ position: { x: 200, y: 20 } });
    await expect(group.getByText('Last action: Pressed the row')).toBeVisible();
    await group.getByRole('button', { name: 'Pin' }).click();
    await expect(group.getByText('Last action: Pinned')).toBeVisible();

    await group.getByRole('button', { name: 'Opens with a press' }).focus();
    await page.keyboard.press('Enter');
    await expect(group.getByText('Last action: Pressed the row')).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(group.getByRole('button', { name: 'Pin' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(group.getByRole('link', { name: 'Goes to a page' })).toBeFocused();
    await expect(group.getByRole('button', { name: 'Disabled' })).toBeDisabled();
  });

  test('unread and accent are not carried by colour alone', async ({ page }) => {
    await open(page, 'data-listitem--message');
    const rows = page.locator('[data-umbra="list-item"]');
    await expect(rows.nth(0)).toContainText('Unread');
    await expect(rows.nth(0).locator('[data-part="title"]')).toHaveCSS('font-weight', '700');
    await expect(rows.nth(1)).not.toContainText('Unread');
    await expect(rows.nth(3)).toContainText('Category: introduction');
  });
});

test.describe('List', () => {
  test('one tab stop; arrow keys, Home, End and type-ahead move between rows', async ({ page }) => {
    await open(page, 'data-list--rows');
    const rows = card(page, 'Ranking').getByRole('row');
    await page.keyboard.press('Tab');
    await expect(rows.nth(0)).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(rows.nth(2)).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(rows.nth(1)).toBeFocused();
    await page.keyboard.press('End');
    await expect(rows.nth(11)).toBeFocused();
    await page.keyboard.press('Home');
    await expect(rows.nth(0)).toBeFocused();
    await page.keyboard.type('Region 7');
    await expect(rows.nth(6)).toBeFocused();
    // Tab leaves the list: the next stop is the next list, at its first selected row.
    await page.keyboard.press('Tab');
    await expect(card(page, 'Multiple selection').getByRole('row').nth(1)).toBeFocused();
  });

  test('multiple selection: Space toggles, a disabled row is skipped, Ctrl+A selects all', async ({
    page,
  }) => {
    await open(page, 'data-list--rows');
    const group = card(page, 'Multiple selection');
    const rows = group.getByRole('row');
    await expect(rows.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(rows.nth(1).locator('[data-umbra="list-item"]')).toHaveAttribute('data-selected', 'true');
    // Every row has a checkbox that shows its selection, so it is not carried by the fill alone.
    const boxes = group.getByRole('checkbox');
    await expect(boxes).toHaveCount(await rows.count());
    await expect(boxes.nth(1)).toBeChecked();
    await expect(boxes.nth(0)).not.toBeChecked();
    await expect(boxes.nth(0)).toHaveAccessibleName(/Select/);
    // It is not a tab stop of its own: Tab leaves the list. A click on it toggles its row only.
    await rows.nth(0).focus();
    await page.keyboard.press('Tab');
    expect(
      await group.evaluate((el) => el.querySelector('[role="grid"]')!.contains(document.activeElement)),
    ).toBe(false);
    await rows.nth(0).locator('[data-umbra="checkbox"]').click();
    await expect(rows.nth(0)).toHaveAttribute('aria-selected', 'true');
    await expect(boxes.nth(0)).toBeChecked();
    await rows.nth(0).locator('[data-umbra="checkbox"]').click();
    await expect(rows.nth(0)).toHaveAttribute('aria-selected', 'false');
    // A single selection has no checkboxes.
    await expect(card(page, 'Inbox').getByRole('checkbox')).toHaveCount(0);

    await rows.nth(0).focus();
    await page.keyboard.press('Space');
    await expect(group.getByText('Selected: r2, r3, r1')).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');
    await expect(group.getByText('Selected: r3, r1')).toBeVisible();

    await rows.nth(3).click();
    await expect(group.getByText('Selected: r3, r1, r4')).toBeVisible();
    await expect(rows.nth(4)).toHaveAttribute('aria-disabled', 'true');
    await rows.nth(4).click({ force: true });
    await expect(group.getByText('Selected: r3, r1, r4')).toBeVisible();

    await page.keyboard.press('Control+a');
    await expect(group.getByText('Selected: r1, r2, r3, r4, r5, r6')).toBeVisible();
  });

  test('single selection with an action: a click selects, Enter and a double click open', async ({
    page,
  }) => {
    await open(page, 'data-list--inbox');
    const group = card(page, 'Inbox');
    const rows = group.getByRole('row');
    await expect(group.getByText('Selected: m4 · Opened: none')).toBeVisible();
    await group.getByRole('row', { name: /Quarterly review/ }).click();
    await expect(group.getByText('Selected: m1 · Opened: none')).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(group.getByText('Selected: m1 · Opened: m1')).toBeVisible();
    await group.getByRole('row', { name: /Site 20 report/ }).dblclick();
    await expect(group.getByText('Selected: m6 · Opened: m6')).toBeVisible();

    // Arrow keys pass over group headers, and the selection follows them.
    await group.getByRole('row', { name: /Supplier advice/ }).click();
    await page.keyboard.press('ArrowDown');
    await expect(group.getByRole('row', { name: /Audit finds a labelling gap/ })).toBeFocused();
    await expect(group.getByText('Selected: m5')).toBeVisible();
    expect(await rows.count()).toBe(13);
  });

  test('group headers stick, and a collapsed group hides its rows', async ({ page }) => {
    await open(page, 'data-list--inbox', 1280, 600);
    const inbox = card(page, 'Inbox');
    const viewport = inbox.locator('[data-part="viewport"]').last();
    await viewport.evaluate((el) => (el.scrollTop = 120));
    const [top, headerTop] = await Promise.all([
      viewport.evaluate((el) => el.getBoundingClientRect().top),
      inbox
        .getByRole('heading', { name: 'Fri 9 Oct' })
        .evaluate((el) => el.closest('[data-umbra="group-header"]')!.getBoundingClientRect().top),
    ]);
    expect(Math.abs(top - headerTop)).toBeLessThan(1);

    const groups = card(page, 'Collapsible groups');
    await expect(groups.getByText('Site 20 report')).toHaveCount(0);
    await groups.getByRole('button', { name: 'Expand Thu 8 Oct' }).click();
    await expect(groups.getByText('Site 20 report')).toBeVisible();
    await groups.getByRole('button', { name: 'Collapse Fri 9 Oct' }).click();
    await expect(groups.getByText('Quarterly review')).toHaveCount(0);
  });

  test('a control inside a row is reached with the arrow keys and keeps its own press', async ({ page }) => {
    await open(page, 'data-list--rows');
    const group = card(page, 'Controls inside rows');
    await group.getByRole('row').first().focus();
    await page.keyboard.press('Enter');
    await expect(group.getByText('Last action: Opened r1')).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(group.getByRole('button', { name: 'Pin Person A' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(group.getByText('Last action: Pinned Person A')).toBeVisible();
    await page.keyboard.press('ArrowLeft');
    await expect(group.getByRole('row').first()).toBeFocused();
  });

  test('loading is busy with skeleton rows; an error is an alert and its retry button recovers', async ({
    page,
  }) => {
    await open(page, 'data-list--states');
    const loading = card(page, 'Loading').locator('[data-umbra="list"]');
    await expect(loading).toHaveAttribute('aria-busy', 'true');
    await expect(loading.locator('[data-umbra="list-item"]')).toHaveCount(3);
    await expect(loading.getByRole('grid')).toHaveCount(0);

    await expect(card(page, 'Empty, default text').getByText('No items')).toBeVisible();
    await expect(card(page, 'Error, default text').getByRole('alert')).toHaveText('Something went wrong');

    const failed = card(page, 'Error, with retry');
    await expect(failed.getByRole('alert')).toContainText('Orders did not load');
    await expect(failed.getByRole('row')).toHaveCount(0);
    await failed.getByRole('button', { name: 'Try again' }).click();
    await expect(failed.getByRole('alert')).toHaveCount(0);
    await expect(failed.getByRole('row')).toHaveCount(2);
  });

  test('reaching the end asks for more, and the loading row is announced', async ({ page }) => {
    // Short, and still at the minimum window: below it the columns of the story would be tabs.
    await open(page, 'data-list--states', 1280, 600);
    const group = card(page, 'Loading more');
    await expect(group.getByText('Rows: 12')).toBeVisible();
    await expect(group.getByRole('status', { name: 'Loading more' })).toBeAttached();
    const viewport = group.locator('[data-umbra="list"] [data-part="viewport"]');
    await viewport.evaluate((el) => (el.scrollTop = el.scrollHeight));
    await expect(group.getByText('Rows: 24')).toBeVisible();
    await expect(group.getByRole('row')).toHaveCount(24);
  });

  test('blocks compose a list by hand, and parts replace its skeleton and state', async ({ page }) => {
    await open(page, 'data-list--parts-and-blocks');
    const blocks = card(page, 'Blocks');
    await expect(blocks.getByRole('row', { name: 'Item 2' })).toHaveAttribute('aria-selected', 'true');
    await blocks.getByRole('row', { name: /Item 4/ }).click();
    await expect(blocks.getByRole('row', { name: /Item 4/ })).toHaveAttribute('aria-selected', 'true');
    await expect(
      blocks.getByRole('row', { name: /Item 4/ }).locator('[data-umbra="list-item"]'),
    ).toHaveAttribute('data-selected', 'true');
    await expect(page.getByText('Loading row 2…')).toBeVisible();
    await expect(page.getByText('A custom empty state.')).toBeVisible();
    await expect(card(page, 'Part: loading-more row hidden').getByRole('status')).toHaveCount(0);
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

test.describe('List height', () => {
  const root = (scope: Page | Locator, name: string) =>
    scope.locator(`[data-umbra="list"]:has([role="grid"][aria-label="${name}"])`);

  test('with no height to fill a list is as tall as its rows; "content" says so', async ({ page }) => {
    await openHeight(page, 'flowing');
    const flowing = await heightOf(root(page, 'Flowing list'));
    expect(flowing).toMatchObject({ mode: 'fill', hidden: 0 });
    expect(flowing.height).toBeGreaterThan(3 * 30);
    const content = await heightOf(root(page, 'Content list'));
    expect(content).toMatchObject({ mode: 'content', hidden: 0, height: flowing.height });
    await expect(root(page, 'Content list').getByRole('row')).toHaveCount(3);
  });

  test('the popover of a collapsed card shows the whole list', async ({ page }) => {
    await openHeight(page, 'collapsed-cards');
    const dialog = await openCollapsed(page, 'List');
    await expect(dialog.getByRole('row')).toHaveCount(5);
    const list = await heightOf(root(dialog, 'Collapsed list'));
    expect(list.height).toBeGreaterThan(5 * 30);
    expect(list.hidden).toBe(0);
  });
});

test.describe('List selection when the selected row leaves', () => {
  const story = 'data-list--removed-on-selection';
  const log = (page: Page) => card(page, 'Open tasks').locator('[data-part="footer"]');
  /** The text of the log now, and after the list had time to react to itself. */
  const settled = async (page: Page, text: string) => {
    await expect(log(page)).toHaveText(text);
    await page.waitForTimeout(300);
    await expect(log(page)).toHaveText(text);
  };

  test('with the mouse: only the pressed row is selected, not the row that slides under the pointer', async ({
    page,
  }) => {
    await open(page, story);
    const rows = page.locator('[role="row"][aria-selected]');
    await expect(rows).toHaveCount(5);
    // Pressed and released at the same place: by then "Task C" is under the pointer.
    await rows.filter({ hasText: 'Task B' }).click();
    await settled(page, 'Selected: b · Reports: 1 · Open: a, c, d, e');
    // The selection stays on the row that left; no other row is marked selected.
    await expect(page.locator('[role="row"][aria-selected="true"]')).toHaveCount(0);

    // A press and a release on the same row still select it.
    await rows.filter({ hasText: 'Task E' }).click();
    await settled(page, 'Selected: e · Reports: 2 · Open: a, c, d');
  });

  test('with the keyboard: focus moves to the next row, the selection does not', async ({ page }) => {
    await open(page, story);
    await page.keyboard.press('Tab');
    await settled(page, 'Selected: a · Reports: 1 · Open: b, c, d, e');
    await expect(page.getByRole('row', { name: 'Task B' })).toBeFocused();
    await expect(page.getByRole('row', { name: 'Task B' })).toHaveAttribute('aria-selected', 'false');
    await page.keyboard.press('ArrowDown');
    await settled(page, 'Selected: c · Reports: 2 · Open: b, d, e');
  });
});

test.describe('highlightChanges', () => {
  test('ListItem meta: a changed value flashes once with a sign for its direction', async ({ page }) => {
    await expectChangeHighlights(page, 'data-listitem--live-updates');
  });
});

// --- Review fixes, 2026-10-11 -------------------------------------------------------------------------

const activeName = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    return (el?.getAttribute('aria-label') ?? el?.textContent ?? '').trim();
  });
const press = async (page: Page, ...keys: string[]) => {
  for (const key of keys) await page.keyboard.press(key);
};
/** The middle of the row's leading edge, of its trailing edge, and a point of its fill. */
const edges = (row: Locator) =>
  row.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const y = r.top + r.height / 2;
    return {
      left: [r.left + 1, y],
      right: [r.right - 2, y],
      fill: [r.left + r.width / 2, r.top + 4],
    } as Record<'left' | 'right' | 'fill', [number, number]>;
  });

test.describe('List group headers and the keyboard', () => {
  test('the arrow keys and Tab reach every caret and header action, with keys only', async ({ page }) => {
    await open(page, 'data-list--inbox');
    const groups = card(page, 'Collapsible groups');
    // Tab enters each list at a row, as before.
    await press(page, 'Tab', 'Tab');
    await expect(groups.getByRole('row', { name: /Quarterly review/ })).toBeFocused();

    // Up from the first row: the caret of its group. Enter and Space toggle it, and the focus stays.
    await press(page, 'ArrowUp');
    await expect(groups.getByRole('button', { name: 'Collapse Fri 9 Oct' })).toBeFocused();
    await press(page, 'Enter');
    await expect(groups.getByRole('button', { name: 'Expand Fri 9 Oct' })).toBeFocused();
    await expect(groups.getByText('Quarterly review')).toHaveCount(0);
    // React Aria moves the focus when the focused row goes away; it must not take it from the caret.
    await page.waitForTimeout(200);
    await expect(groups.getByRole('button', { name: 'Expand Fri 9 Oct' })).toBeFocused();
    await press(page, 'Space');
    await expect(groups.getByRole('button', { name: 'Collapse Fri 9 Oct' })).toBeFocused();
    await expect(groups.getByText('Quarterly review')).toBeVisible();

    // Down from a header: the first row under it. Up from a row under a header: that header.
    await press(page, 'ArrowDown');
    await expect(groups.getByRole('row', { name: /Quarterly review/ })).toBeFocused();
    await press(page, 'End', 'ArrowUp', 'ArrowUp');
    expect(await activeName(page)).toBe('Collapse Wed 7 Oct');
    // Left and right move between the controls of one header.
    await press(page, 'ArrowRight');
    expect(await activeName(page)).toBe('Archive');
    await press(page, 'ArrowRight');
    expect(await activeName(page)).toBe('Archive');
    await press(page, 'ArrowLeft');
    expect(await activeName(page)).toBe('Collapse Wed 7 Oct');
    // A collapsed group is still a stop; above it is the last row of the group before.
    await press(page, 'ArrowUp');
    expect(await activeName(page)).toBe('Expand Thu 8 Oct');
    await press(page, 'ArrowUp');
    await expect(groups.getByRole('row', { name: /Supplier advice/ })).toBeFocused();

    // Tab walks the header controls and the list's one row stop, in the order they are shown.
    await press(page, 'Shift+Tab');
    expect(await activeName(page)).toBe('Collapse Fri 9 Oct');
    await press(page, 'Tab');
    await expect(groups.getByRole('row', { name: /Supplier advice/ })).toBeFocused();
    await press(page, 'Tab');
    expect(await activeName(page)).toBe('Expand Thu 8 Oct');
    await press(page, 'Tab', 'Tab');
    expect(await activeName(page)).toBe('Archive');
    // After the last stop Tab leaves the list.
    await press(page, 'Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('[data-umbra="list"]'))).toBe(false);
  });

  test('a list without header controls keeps one tab stop, and its headers are passed over', async ({
    page,
  }) => {
    await open(page, 'data-list--inbox');
    const inbox = card(page, 'Inbox');
    await press(page, 'Tab');
    await expect(inbox.getByRole('row', { name: /Supplier advice/ })).toBeFocused();
    await press(page, 'ArrowDown');
    await expect(inbox.getByRole('row', { name: /Audit finds a labelling gap/ })).toBeFocused();
    await press(page, 'Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('[aria-label="Inbox"]'))).toBe(false);
  });

  test('a group is named by its title alone, not by its caret', async ({ page }) => {
    await open(page, 'data-list--inbox');
    const groups = card(page, 'Collapsible groups');
    await expect(groups.getByRole('rowgroup', { name: 'Fri 9 Oct', exact: true })).toBeVisible();
    await expect(groups.getByRole('rowgroup', { name: 'Wed 7 Oct', exact: true })).toBeVisible();
  });

  test('a row brought into view by the arrow keys is not left under the stuck header', async ({ page }) => {
    await open(page, 'data-list--inbox', 1280, 600);
    await press(page, 'Tab', 'End');
    for (let i = 0; i < 9; i++) {
      await press(page, 'ArrowUp');
      // Nothing but the row itself is drawn over the top of the focused row.
      const covered = () =>
        page.evaluate(() => {
          const row = document.activeElement!;
          const r = row.getBoundingClientRect();
          const top = document.elementFromPoint(r.left + r.width / 2, r.top + 2);
          return !row.contains(top);
        });
      await expect.poll(covered, `after ${i + 1} presses`).toBe(false);
    }
  });

  test('a plain header that is stuck in a list covers the rows under it', async ({ page }) => {
    await open(page, 'data-list--parts-and-blocks');
    const plain = card(page, 'Blocks').locator('[data-umbra="group-header"][data-variant="plain"]');
    const alpha = await plain.evaluate((el) => {
      const probe = document.createElement('canvas').getContext('2d')!;
      probe.fillStyle = getComputedStyle(el).backgroundColor;
      probe.fillRect(0, 0, 1, 1);
      return probe.getImageData(0, 0, 1, 1).data[3];
    });
    expect(alpha).toBe(255);
  });
});

test.describe('List rows: disabled, names, tokens', () => {
  test('a disabled row has the default cursor', async ({ page }) => {
    await open(page, 'data-list--rows');
    const disabled = card(page, 'Multiple selection').locator('[role="row"][aria-disabled="true"]');
    await expect(disabled).toHaveCSS('cursor', 'default');
    await expect(disabled.locator('[data-umbra="list-item"]')).toHaveCSS('cursor', 'default');
    await expect(card(page, 'Multiple selection').getByRole('row').first()).toHaveCSS('cursor', 'pointer');
  });

  test('the list keeps its name while it is loading, empty or in error', async ({ page }) => {
    await open(page, 'data-list--states');
    await expect(page.getByRole('group', { name: 'Loading list' })).toHaveAttribute('aria-busy', 'true');
    await expect(page.getByRole('group', { name: 'Empty list' })).toContainText('No items');
    await expect(page.getByRole('group', { name: 'Failed list' }).getByRole('alert')).toBeVisible();
    // With rows the grid carries the name, once.
    await expect(page.getByRole('group', { name: 'Orders, page by page' })).toHaveCount(0);
    await expect(page.getByRole('grid', { name: 'Orders, page by page' })).toBeVisible();
  });

  test('after Retry the focus moves into the list instead of falling to the page', async ({ page }) => {
    await open(page, 'data-list--states');
    const failed = card(page, 'Error, with retry');
    await failed.getByRole('button', { name: 'Try again' }).focus();
    await press(page, 'Enter');
    await expect(failed.getByRole('row')).toHaveCount(2);
    await expect
      .poll(() => page.evaluate(() => !!document.activeElement?.closest('[data-umbra="list"]')))
      .toBe(true);
  });

  test("a striped list leaves the item's own background token to the app", async ({ page }) => {
    await open(page, 'data-list--rows');
    const list = card(page, 'Ranking').locator('[data-umbra="list"]');
    const items = list.locator('[data-umbra="list-item"]');
    // The stripe is on the row around the item.
    await expect(items.nth(0)).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    expect(
      await list
        .getByRole('row')
        .first()
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    ).not.toBe('rgba(0, 0, 0, 0)');
    // Set on an ancestor, the app's value reaches every item, striped or not.
    await list.evaluate((el) => el.parentElement!.style.setProperty('--umbra-list-item-bg', 'rgb(1, 2, 3)'));
    await expect(items.nth(0)).toHaveCSS('background-color', 'rgb(1, 2, 3)');
    await expect(items.nth(1)).toHaveCSS('background-color', 'rgb(1, 2, 3)');
  });

  test('every piece carries its data-part', async ({ page }) => {
    await open(page, 'data-list--states');
    await expect(card(page, 'Loading').locator('[data-part="skeleton"]')).toHaveCount(3);
    await expect(card(page, 'Empty, default text').locator('[data-part="empty"]')).toBeVisible();
    await expect(card(page, 'Error, default text').locator('[data-part="error"]')).toBeVisible();
    await expect(card(page, 'Loading more').locator('[data-part="loadingMore"]')).toBeAttached();
    await open(page, 'data-list--inbox');
    const groups = card(page, 'Collapsible groups');
    await expect(groups.locator('[data-part="groupHeader"]')).toHaveCount(3);
    await expect(groups.locator('[data-part="row"]')).toHaveCount(6);
    await expect(groups.locator('[data-umbra="list"] [data-part="toggle"]')).toHaveCount(3);
  });
});

test.describe('List: multiple selection with replace', () => {
  test('a click or an arrow key selects one row; Shift extends and Ctrl adds', async ({ page }) => {
    await open(page, 'data-list--replace-selection');
    const group = card(page, 'Multiple, replace');
    const rows = group.getByRole('row');
    const log = (text: string) => expect(group.getByText(text, { exact: true })).toBeVisible();
    await log('Selected: r2');
    // No checkboxes: the rows are selected like files, not ticked.
    await press(page, 'Tab');
    await expect(rows.nth(1)).toBeFocused();
    // Selection follows the arrow keys and drops the rest.
    await press(page, 'ArrowDown');
    await log('Selected: r3');
    // Shift extends it to a range, from the row where the run started.
    await press(page, 'Shift+ArrowDown', 'Shift+ArrowDown');
    await log('Selected: r3, r4, r5');
    await press(page, 'Shift+ArrowUp');
    await log('Selected: r3, r4');
    // A click replaces the selection; Ctrl+click adds a row and takes one away.
    await rows.nth(0).click();
    await log('Selected: r1');
    await rows.nth(5).click({ modifiers: ['ControlOrMeta'] });
    await log('Selected: r1, r6');
    await rows.nth(0).click({ modifiers: ['ControlOrMeta'] });
    await log('Selected: r6');
    // The last selected row cannot be deselected (`disallowEmptySelection` is on with `replace`).
    await rows.nth(5).click({ modifiers: ['ControlOrMeta'] });
    await log('Selected: r6');
    await press(page, 'Control+a');
    await log('Selected: r1, r2, r3, r4, r5, r6');
  });
});

test.describe('ListItem: selection stripe, pair and media rows', () => {
  for (const tint of ['violet', 'teal', 'green', 'slate']) {
    test(`the selection stripe has 3:1 against the fill and against the rows beside it (${tint})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto(`/iframe.html?id=data-list--inbox&viewMode=story&globals=context:${tint}`);
      const inbox = card(page, 'Inbox');
      const at = await edges(inbox.locator('[data-umbra="list-item"][data-selected]'));
      const other = await edges(inbox.locator('[data-umbra="list-item"]:not([data-selected])').first());
      const [stripe, fill, row] = await pixels(page, [at.left, at.fill, other.fill]);
      expect(contrast(stripe!, fill!)).toBeGreaterThanOrEqual(3);
      expect(contrast(stripe!, row!)).toBeGreaterThanOrEqual(3);
    });
  }

  test('the centres of pair rows line up, and a long name truncates on its own side', async ({ page }) => {
    await open(page, 'data-listitem--pair-and-media');
    const rows = card(page, 'Pair').locator('[data-umbra="list-item"]');
    await expect(rows).toHaveCount(4);
    const centres = await rows.locator('[data-part="center"]').evaluateAll((all) =>
      all.map((el) => {
        const r = el.getBoundingClientRect();
        return Math.round(r.left + r.width / 2);
      }),
    );
    expect(Math.max(...centres) - Math.min(...centres)).toBeLessThanOrEqual(1);
    // The centre is in the middle of the row.
    const row = (await rows.first().boundingBox())!;
    expect(Math.abs(centres[0]! - (row.x + row.width / 2))).toBeLessThanOrEqual(2);
    // First side: name, then icon, then value, towards the centre. The other side mirrors it.
    const order = (side: Locator) =>
      side.locator('> [data-part]').evaluateAll((all) =>
        all
          .map((el) => ({ part: el.getAttribute('data-part'), x: el.getBoundingClientRect().left }))
          .sort((a, b) => a.x - b.x)
          .map((p) => p.part),
      );
    expect(await order(rows.first().locator('[data-part="side"]'))).toEqual(['title', 'leading', 'meta']);
    expect(await order(rows.first().locator('[data-part="opposite"]'))).toEqual(['meta', 'leading', 'title']);
    expect(await truncated(rows.nth(1).locator('[data-part="side"] [data-part="title"]'))).toBe(true);
    expect(await rows.nth(1).evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    // A pair row is selected and striped like any other.
    await expect(rows.nth(3)).toHaveAttribute('data-selected', 'true');
    // The blocks build the same row.
    const blocks = card(page, 'Pair, from blocks');
    await expect(blocks.locator('[data-variant="pair"] [data-part="center"]')).toHaveText('→');
  });

  test('as a pair row narrows the icons of its sides hide, then the values', async ({ page }) => {
    await open(page, 'data-listitem--pair-and-media');
    const row = card(page, 'Pair').locator('[data-umbra="list-item"]').first();
    await expect(row.locator('[data-part="leading"]').first()).toBeVisible();
    await row.evaluate((el) => (el.style.width = '190px'));
    await expect(row.locator('[data-part="leading"]').first()).toBeHidden();
    await expect(row.locator('[data-part="meta"]').first()).toBeVisible();
    await row.evaluate((el) => (el.style.width = '130px'));
    await expect(row.locator('[data-part="meta"]').first()).toBeHidden();
    await expect(row.locator('[data-part="center"]')).toBeVisible();
  });

  test('`descriptionLines` lets the description wrap, and clamps it', async ({ page }) => {
    await open(page, 'data-listitem--pair-and-media');
    const descriptions = card(page, 'Media').locator('[data-part="description"]');
    const lines = (index: number) =>
      descriptions
        .nth(index)
        .evaluate((el) =>
          Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)),
        );
    expect(await lines(0)).toBeGreaterThan(1);
    expect(await lines(0)).toBeLessThanOrEqual(3);
    expect(await lines(1)).toBe(2);
    expect(await descriptions.nth(1).evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
    expect(await lines(2)).toBe(1);
  });
});

test.describe('Right to left', () => {
  const story = 'data-list--right-to-left';

  test('the selection and accent stripes are at the leading edge, on the right', async ({ page }) => {
    await open(page, story);
    await expect(page.locator('[data-umbra-scope]').first()).toHaveAttribute('dir', 'rtl');
    const group = card(page, 'Selection and accent');
    const selected = await edges(group.locator('[data-umbra="list-item"][data-selected]'));
    const accent = await edges(group.locator('[data-umbra="list-item"][data-accent]'));
    const [stripe, fill, far, mark, plain] = await pixels(page, [
      selected.right,
      selected.fill,
      selected.left,
      accent.right,
      accent.left,
    ]);
    expect(contrast(stripe!, fill!)).toBeGreaterThanOrEqual(3);
    expect(far).toEqual(fill);
    expect(contrast(mark!, plain!)).toBeGreaterThanOrEqual(3);
  });

  test('the numbers and the pair row mirror, and a collapsed caret points left', async ({ page }) => {
    await open(page, story);
    const ranking = card(page, 'Ranking and pair');
    const first = ranking.locator('[data-umbra="list-item"]').first();
    const title = (await first.locator('[data-part="title"]').boundingBox())!;
    const meta = (await first.locator('[data-part="meta"]').boundingBox())!;
    expect(title.x).toBeGreaterThan(meta.x);
    const pair = ranking.locator('[data-variant="pair"]');
    const side = (await pair.locator('[data-part="side"]').boundingBox())!;
    const opposite = (await pair.locator('[data-part="opposite"]').boundingBox())!;
    expect(side.x).toBeGreaterThan(opposite.x);

    const carets = card(page, 'Selection and accent').locator('[data-part="toggle"] > *');
    expect(await carets.nth(1).evaluate((el) => getComputedStyle(el).rotate)).toBe('90deg');
    expect(await carets.nth(0).evaluate((el) => getComputedStyle(el).rotate)).toBe('none');
  });

  test('the arrow keys follow the reading order: in a group header and in a legend', async ({ page }) => {
    await open(page, story);
    const group = card(page, 'Selection and accent');
    await press(page, 'Tab');
    await expect(group.getByRole('row', { name: /Item 2/ })).toBeFocused();
    await press(page, 'ArrowUp', 'ArrowUp');
    expect(await activeName(page)).toBe('Collapse Today');
    // The action is to the left of the caret, and the left arrow goes to it.
    await press(page, 'ArrowLeft');
    expect(await activeName(page)).toBe('Archive');
    await press(page, 'ArrowRight');
    expect(await activeName(page)).toBe('Collapse Today');

    const legend = page.getByRole('toolbar', { name: 'Regions' });
    const items = legend.getByRole('button');
    await items.first().focus();
    await press(page, 'ArrowLeft');
    await expect(items.nth(1)).toBeFocused();
    expect((await items.nth(1).boundingBox())!.x).toBeLessThan((await items.nth(0).boundingBox())!.x);
    await press(page, 'ArrowRight');
    await expect(items.nth(0)).toBeFocused();
  });
});
