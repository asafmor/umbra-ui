import { expect, test, type Locator, type Page } from '@playwright/test';

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

  test('the meta text hides when the header is narrow, then the title truncates', async ({ page }) => {
    await open(page, 'data-groupheader--shrink');
    const wide = box(page, 'wide');
    const medium = box(page, 'medium');
    const narrow = box(page, 'narrow');
    await expect(part(wide, 'meta')).toBeVisible();
    await expect(part(medium, 'meta')).toHaveCount(0);
    expect(await truncated(part(medium, 'title'))).toBe(false);
    await expect(part(medium, 'actions')).toBeVisible();
    expect(await truncated(part(narrow, 'title'))).toBe(true);

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
    await group.getByRole('row', { name: /Training review/ }).click();
    await expect(group.getByText('Selected: m1 · Opened: none')).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(group.getByText('Selected: m1 · Opened: m1')).toBeVisible();
    await group.getByRole('row', { name: /Site 20 report/ }).dblclick();
    await expect(group.getByText('Selected: m6 · Opened: m6')).toBeVisible();

    // Arrow keys pass over group headers, and the selection follows them.
    await group.getByRole('row', { name: /Selection advice/ }).click();
    await page.keyboard.press('ArrowDown');
    await expect(group.getByRole('row', { name: /Trainee catches the eye/ })).toBeFocused();
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
    await expect(groups.getByText('Training review')).toHaveCount(0);
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
    await open(page, 'data-list--states', 1280, 520);
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
