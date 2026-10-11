import { expect, test, type Locator, type Page } from '@playwright/test';

// SegmentedFilter and Tabs: keyboard, selection, accessible names, panels, closing, each shrink step,
// and the tab strip of Columns, which is the one Tabs draws.
const open = async (page: Page, id: string, width = 1280, height = 720) => {
  await page.setViewportSize({ width, height });
  await page.goto(`/iframe.html?id=${id}&viewMode=story`);
  await page.locator('#storybook-root > *').first().waitFor();
  // No font face is loaded ahead of time: one that first loads when a menu opens must disturb nothing.
  await page.evaluate(() => document.fonts.ready);
};

const press = async (page: Page, ...keys: string[]) => {
  for (const key of keys) await page.keyboard.press(key);
};
const names = (items: Locator) => items.evaluateAll((els) => els.map((el) => el.textContent));
const isCutShort = (el: Locator) => el.evaluate((node) => node.scrollWidth > node.clientWidth);
/** As `isCutShort`, with the pixel of tolerance a row of items with fractional widths needs. */
const overflows = (el: Locator) => el.evaluate((node) => node.scrollWidth > node.clientWidth + 1);
/** True when `inner` lies inside the visible box of `outer`. */
const isInside = async (inner: Locator, outer: Locator) =>
  inner.evaluate(
    (el, box) => {
      const a = el.getBoundingClientRect();
      const b = box!.getBoundingClientRect();
      return a.left >= b.left - 1 && a.right <= b.right + 1;
    },
    await outer.elementHandle(),
  );

// SegmentedFilter

test('a segmented filter is one tab stop: arrows, Home and End move, Space and Enter select', async ({
  page,
}) => {
  await open(page, 'inputs-segmentedfilter--selection');
  const group = page.getByRole('radiogroup', { name: 'Messages' });
  const radios = group.getByRole('radio');
  await expect(radios).toHaveCount(4);
  await expect(radios.first()).toBeChecked();

  await page.keyboard.press('Tab');
  await expect(radios.first()).toBeFocused();
  await expect(radios.first()).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('ArrowRight');
  await expect(radios.nth(1)).toBeFocused();
  // Arrow keys move focus only; the list below is filtered when the user chooses.
  await expect(page.getByText('Selected: all. Changes: 0')).toBeVisible();
  await page.keyboard.press('End');
  await expect(radios.nth(3)).toBeFocused();
  await page.keyboard.press('Home');
  await expect(radios.first()).toBeFocused();
  // The ends do not wrap.
  await page.keyboard.press('ArrowLeft');
  await expect(radios.first()).toBeFocused();
  await press(page, 'ArrowRight', 'ArrowRight');
  await expect(radios.nth(2)).toBeFocused();

  await page.keyboard.press('Space');
  await expect(radios.nth(2)).toBeChecked();
  await expect(radios.first()).not.toBeChecked();
  await expect(page.getByText('Selected: tasks. Changes: 1')).toBeVisible();
  await expect(page.getByText('Message 4')).toBeVisible();
  await expect(page.getByText('Message 5')).toHaveCount(0);
  // The selected one cannot be switched off, as in a radio group.
  await page.keyboard.press('Space');
  await expect(page.getByText('Selected: tasks. Changes: 1')).toBeVisible();
  await press(page, 'ArrowRight', 'Enter');
  await expect(page.getByText('Selected: unread. Changes: 2')).toBeVisible();

  // Tab leaves the whole control.
  await page.keyboard.press('Tab');
  expect(await group.evaluate((el) => el.contains(document.activeElement))).toBe(false);
});

test('a segment reads its count with its label, and a disabled segment is skipped', async ({ page }) => {
  await open(page, 'inputs-segmentedfilter--variants');
  const messages = page.getByRole('radiogroup', { name: 'Messages', exact: true });
  await expect(messages.getByRole('radio', { name: 'Unread, 8' })).toBeVisible();
  await expect(messages.getByRole('radio', { name: 'Unread, 8' })).toHaveText('Unread(8)');
  await expect(messages.getByRole('radio', { name: 'All', exact: true })).toBeChecked();

  const regions = page.getByRole('radiogroup', { name: 'Regions' });
  const west = regions.getByRole('radio', { name: 'West, 31' });
  await expect(west).toBeDisabled();
  await regions.getByRole('radio', { name: 'North, 12' }).focus();
  await page.keyboard.press('End');
  await expect(regions.getByRole('radio', { name: 'East, 0' })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(regions.getByRole('radio', { name: 'East, 0' })).toBeFocused();
  await page.keyboard.press('Home');
  await expect(regions.getByRole('radio', { name: 'North, 12' })).toBeFocused();

  // A disabled control takes no focus at all.
  const disabled = page.getByRole('radiogroup', { name: 'Messages, disabled' });
  for (const radio of await disabled.getByRole('radio').all()) await expect(radio).toBeDisabled();
  // Nothing has to be selected to begin with.
  await expect(
    page.getByRole('radiogroup', { name: 'Window mode' }).getByRole('radio', { checked: true }),
  ).toHaveCount(0);
});

test('multiple selection is a toolbar of toggle buttons with a check on each selected one', async ({
  page,
}) => {
  await open(page, 'inputs-segmentedfilter--selection');
  const toolbar = page.getByRole('toolbar', { name: 'Regions', exact: true });
  const north = toolbar.getByRole('button', { name: 'North, 12' });
  const south = toolbar.getByRole('button', { name: 'South, 7' });
  await expect(north).toHaveAttribute('aria-pressed', 'true');
  await expect(south).toHaveAttribute('aria-pressed', 'false');
  await expect(north.locator('[data-part="check"]')).toBeVisible();
  await expect(south.locator('[data-part="check"]')).toHaveCount(0);

  await south.click();
  await expect(page.getByText('Regions: north, south')).toBeVisible();
  await expect(south.locator('[data-part="check"]')).toBeVisible();
  await north.focus();
  await page.keyboard.press('Space');
  await expect(page.getByText('Regions: south', { exact: true })).toBeVisible();
  await press(page, 'ArrowRight', 'Enter');
  await expect(page.getByText('Regions: none')).toBeVisible();
  await expect(toolbar.locator('[data-part="check"]')).toHaveCount(0);
});

test('the "All" segment stands for no filter and clears the others', async ({ page }) => {
  await open(page, 'inputs-segmentedfilter--selection');
  const many = page.getByRole('toolbar', { name: 'Regions or all' });
  const all = many.getByRole('button', { name: /^All/ });
  await expect(all).toHaveAttribute('aria-pressed', 'true');
  await many.getByRole('button', { name: /^North/ }).click();
  await many.getByRole('button', { name: /^East/ }).click();
  await expect(page.getByText('Regions or all: north, east')).toBeVisible();
  await expect(all).toHaveAttribute('aria-pressed', 'false');
  await all.click();
  await expect(page.getByText('Regions or all: all')).toBeVisible();
  await expect(many.getByRole('button', { pressed: true })).toHaveCount(1);
  // Switching the last one off selects "All" again.
  await many.getByRole('button', { name: /^South/ }).click();
  await many.getByRole('button', { name: /^South/ }).click();
  await expect(all).toHaveAttribute('aria-pressed', 'true');

  const one = page.getByRole('radiogroup', { name: 'One region or all' });
  await expect(one.getByRole('radio', { name: 'Any' })).toBeChecked();
  await one.getByRole('radio', { name: 'South, 7' }).click();
  await expect(page.getByText('One region: south')).toBeVisible();
  await one.getByRole('radio', { name: 'Any' }).click();
  await expect(page.getByText('One region: any')).toBeVisible();
});

test('a segmented filter hides its counts, then truncates its labels equally, then moves segments into a menu', async ({
  page,
}) => {
  await open(page, 'inputs-segmentedfilter--narrowing');
  const at = (width: number) => page.getByRole('radiogroup', { name: `Orders at ${width}` });
  const fits = async (filter: Locator) =>
    expect(await isInside(filter, filter.locator('xpath=ancestor::*[@data-narrow]'))).toBe(true);

  // Step 1: counts hide, labels are whole. The count is still read.
  await expect(at(620)).toHaveAttribute('data-level', '1');
  await expect(at(620).locator('[data-part="count"]').first()).toBeHidden();
  await expect(at(620).getByRole('radio', { name: 'Open orders, 12' })).toBeVisible();
  expect(await isCutShort(at(620).locator('[data-part="label"]').nth(1))).toBe(false);
  await fits(at(620));

  // Step 2: equal segments with truncated labels, nothing to scroll.
  for (const width of [470, 300]) {
    await expect(at(width)).toHaveAttribute('data-level', '2');
    const widths = await at(width)
      .getByRole('radio')
      .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().width)));
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(1);
    expect(await isCutShort(at(width).locator('[data-part="label"]').nth(1))).toBe(true);
    await expect(at(width).locator('[data-part="label"]').nth(1)).toHaveCSS('text-overflow', 'ellipsis');
    expect(await isCutShort(at(width))).toBe(false);
    await fits(at(width));
  }

  // Step 3: the segments that do not fit at their minimum width are in the "more" menu. The selected one stays.
  const small = at(150);
  const more = small.getByRole('button', { name: 'More' });
  await expect(more).toBeVisible();
  expect(await overflows(small)).toBe(false);
  await fits(small);
  expect(await small.getByRole('radio').count()).toBeLessThan(4);
  await expect(small.getByRole('radio', { name: 'Waiting for review, 3' })).toBeChecked();
  await expect(small.getByRole('radio', { name: 'Archived, 9' })).toHaveCount(0);

  // The button is the last stop of the arrow keys, and the menu lists what is not shown.
  await small.getByRole('radio', { checked: true }).focus();
  await press(page, 'End');
  await expect(more).toBeFocused();
  await page.keyboard.press('Enter');
  const menu = page.getByRole('menu', { name: 'More' });
  await expect(menu.getByRole('menuitemradio', { name: 'Closed this quarter (148)' })).toBeVisible();
  // Choosing a row selects it and brings it into the control; the menu then shows it with a check.
  await menu.getByRole('menuitemradio', { name: 'Archived (9)' }).click();
  await expect(small.getByRole('radio', { name: 'Archived, 9' })).toBeChecked();
  expect(await isInside(small.getByRole('radio', { name: 'Archived, 9' }), small)).toBe(true);
  await expect(small.getByRole('radio', { name: 'Waiting for review, 3' })).toHaveCount(0);
  await fits(small);
  await expect(menu).toBeHidden();
  await more.click();
  await expect(menu.getByRole('menuitemradio', { name: 'Archived (9)' })).toBeChecked();
  await expect(menu.getByRole('menuitemradio', { checked: true })).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();

  // Several selected: nothing is pulled out of the menu; the button shows that it holds a selected segment.
  const several = page.getByRole('toolbar', { name: 'Orders, several' });
  const moreSeveral = several.getByRole('button', { name: 'More' });
  await expect(moreSeveral).toHaveAttribute('data-has-selected', 'true');
  await moreSeveral.click();
  const archived = menu.getByRole('menuitemcheckbox', { name: 'Archived (9)' });
  await expect(archived).toBeChecked();
  await archived.click();
  await expect(archived).not.toBeChecked();
  await expect(moreSeveral).not.toHaveAttribute('data-has-selected');
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();

  // With room again the segments come back, and with less they leave again.
  const narrow = small.locator('xpath=ancestor::*[@data-narrow]');
  await narrow.evaluate((el) => (el.style.width = '900px'));
  await expect(small.getByRole('radio')).toHaveCount(4);
  await expect(more).toHaveCount(0);
  await narrow.evaluate((el) => (el.style.width = '150px'));
  await expect(more).toBeVisible();
  await fits(small);

  // With room, everything shows.
  await open(page, 'inputs-segmentedfilter--variants');
  const roomy = page.getByRole('radiogroup', { name: 'Messages', exact: true });
  await expect(roomy).toHaveAttribute('data-level', '0');
  await expect(roomy.locator('[data-part="count"]').first()).toBeVisible();
});

test('segmented filter parts are replaced by a function or a node and hidden by null', async ({ page }) => {
  await open(page, 'inputs-segmentedfilter--parts-and-blocks');
  await expect(page.locator('b[data-part="count"]').first()).toHaveText('· 4 open');
  const node = page.getByRole('toolbar', { name: 'Check as a node' });
  await expect(node.locator('span[data-part="check"]')).toHaveText(['✓', '✓']);
  const hidden = page.getByRole('radiogroup', { name: 'Counts and icons hidden' });
  await expect(hidden.locator('[data-part="count"], [data-part="icon"]')).toHaveCount(0);
  await expect(hidden.getByRole('radio')).toHaveCount(5);
  const item = page.getByRole('radiogroup', { name: 'Item as a function' });
  await expect(item.getByRole('radio').first()).toHaveCSS('text-transform', 'uppercase');
  // The blocks by hand behave like the all-in-one.
  const blocks = page.getByRole('radiogroup', { name: 'By hand' });
  await expect(blocks.getByRole('radio', { name: 'Week, 5' })).toBeChecked();
  await blocks.getByRole('radio', { name: 'Day' }).click();
  await expect(blocks.getByRole('radio', { name: 'Day' })).toBeChecked();
  await expect(blocks.getByRole('radio', { name: 'Month' })).toBeDisabled();
});

// Tabs

const tabStops = (list: Locator) =>
  list.getByRole('tab').evaluateAll((els) => els.filter((el) => (el as HTMLElement).tabIndex === 0).length);

test('tabs: arrow keys select, Home and End jump, a disabled tab is skipped, one tab stop', async ({
  page,
}) => {
  await open(page, 'inputs-tabs--variants', 1920, 1080);
  const list = page.getByRole('tablist', { name: 'underline, default' });
  const tabs = list.getByRole('tab');
  await expect(tabs).toHaveCount(4);
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
  expect(await tabStops(list)).toBe(1);
  await expect(list).toHaveAttribute('aria-orientation', 'horizontal');

  await page.keyboard.press('Tab');
  await expect(tabs.first()).toBeFocused();
  await expect(tabs.first()).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'false');
  expect(await tabStops(list)).toBe(1);
  // End lands on the last tab that is not disabled, and one more step wraps to the first.
  await page.keyboard.press('End');
  await expect(tabs.nth(2)).toBeFocused();
  await expect(tabs.nth(3)).toBeDisabled();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.first()).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Home');
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
  // Up and Down belong to a vertical list.
  await page.keyboard.press('ArrowDown');
  await expect(tabs.first()).toBeFocused();

  // Tab moves on to the panel, not to the next tab.
  await page.keyboard.press('Tab');
  await expect(page.getByRole('tabpanel', { name: 'Orders, 12' }).first()).toBeFocused();
});

test('a tab and its panel point at each other, and the count is read with the label', async ({ page }) => {
  await open(page, 'inputs-tabs--variants', 1920, 1080);
  const list = page.getByRole('tablist', { name: 'pill, default' });
  const orders = list.getByRole('tab', { name: 'Orders, 12' });
  await expect(orders).toHaveText('Orders(12)');
  const people = list.getByRole('tab', { name: 'People, 5' });
  const panelId = (await orders.getAttribute('aria-controls'))!;
  const panel = page.locator(`[id="${panelId}"]`);
  await expect(panel).toHaveRole('tabpanel');
  await expect(panel).toHaveAttribute('aria-labelledby', (await orders.getAttribute('id'))!);
  await expect(panel).toContainText('Order 1');
  // A tab whose panel is not in the document does not point at one.
  await expect(people).not.toHaveAttribute('aria-controls');

  await people.click();
  await expect(panel).toHaveCount(0);
  const next = page.locator(`[id="${await people.getAttribute('aria-controls')}"]`);
  await expect(next).toContainText('Person 1');
  await expect(orders).not.toHaveAttribute('aria-controls');
  // The panel takes what the list leaves of the slot.
  const sizes = await next.evaluate((el) => {
    const root = el.closest('[data-umbra="tabs"]')!.getBoundingClientRect();
    const own = el.getBoundingClientRect();
    return { bottom: Math.round(root.bottom - own.bottom), width: Math.round(root.width - own.width) };
  });
  expect(sizes).toEqual({ bottom: 0, width: 0 });
});

test('manual activation: arrow keys move focus, Enter and Space select', async ({ page }) => {
  await open(page, 'inputs-tabs--behaviour', 1920, 1080);
  const list = page.getByRole('tablist', { name: 'Manual activation' });
  const tabs = list.getByRole('tab');
  await tabs.first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'false');
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText('Changes: none')).toBeVisible();
  expect(await tabStops(list)).toBe(1);

  await page.keyboard.press('Enter');
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText('Changes: people', { exact: true })).toBeVisible();
  await press(page, 'End', 'Space');
  await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText('Changes: people, reports')).toBeVisible();
  // Selecting the selected tab again is not a change.
  await page.keyboard.press('Enter');
  await expect(page.getByText('Changes: people, reports')).toBeVisible();
});

test('a vertical tab list moves with Up and Down', async ({ page }) => {
  await open(page, 'inputs-tabs--vertical');
  const list = page.getByRole('tablist', { name: 'underline, vertical' });
  await expect(list).toHaveAttribute('aria-orientation', 'vertical');
  const tabs = list.getByRole('tab');
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await tabs.nth(1).focus();
  await page.keyboard.press('ArrowDown');
  await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
  await press(page, 'ArrowDown', 'ArrowUp');
  await expect(tabs.nth(2)).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(2)).toBeFocused();
  // The list is beside its panel.
  const boxes = await list.evaluate((el) => {
    const panel = el.closest('[data-umbra="tabs"]')!.querySelector('[role="tabpanel"]')!;
    return { list: el.getBoundingClientRect().right, panel: panel.getBoundingClientRect().left };
  });
  expect(boxes.panel).toBeGreaterThanOrEqual(boxes.list);
});

test('panels that stay mounted keep their state; unmounted panels start again', async ({ page }) => {
  await open(page, 'inputs-tabs--behaviour', 1920, 1080);
  for (const [name, kept] of [
    ['Kept mounted', true],
    ['Unmounted', false],
  ] as const) {
    const root = page.locator('[data-umbra="tabs"]', { has: page.getByRole('tablist', { name }) });
    await root.getByRole('button', { name: 'Orders clicks: 0' }).click();
    await expect(root.getByRole('button', { name: 'Orders clicks: 1' })).toBeVisible();
    await expect(root.locator('[role="tabpanel"]')).toHaveCount(kept ? 3 : 1);
    await root.getByRole('tab', { name: 'People' }).click();
    await expect(root.getByRole('tabpanel')).toHaveCount(1);
    await expect(root.getByRole('button', { name: /Orders clicks/ })).toBeHidden();
    await root.getByRole('tab', { name: 'Orders' }).click();
    await expect(root.getByRole('button', { name: `Orders clicks: ${kept ? 1 : 0}` })).toBeVisible();
  }
});

test('a tab is closed with its button or the Delete key, and the "add" button sits outside the list', async ({
  page,
}) => {
  await open(page, 'inputs-tabs--behaviour', 1920, 1080);
  const list = page.getByRole('tablist', { name: 'Open reports' });
  const root = page.locator('[data-umbra="tabs"]', { has: list });
  const tabs = root.getByRole('tab');
  await expect(tabs).toHaveText(['Home', 'Report 1', 'Report 2', 'Report 3']);
  // The close buttons are real buttons beside their tabs, so the list owns the tabs by id.
  expect(await list.getAttribute('aria-owns')).toBe(
    (await tabs.evaluateAll((els) => els.map((el) => el.id))).join(' '),
  );
  await expect(root.getByRole('button', { name: /^Close/ })).toHaveCount(3);
  await expect(root.getByRole('button', { name: 'Close Home' })).toHaveCount(0);

  await root.getByRole('button', { name: 'Close Report 1' }).click();
  await expect(tabs).toHaveText(['Home', 'Report 2', 'Report 3']);
  await expect(root.getByRole('tabpanel')).toContainText('The content of Report 2');

  // Delete closes the focused tab and moves focus to its neighbour.
  const second = root.getByRole('tab', { name: 'Report 2' });
  await expect(second).toHaveAttribute('aria-keyshortcuts', 'Delete');
  await second.focus();
  await page.keyboard.press('Delete');
  await expect(tabs).toHaveText(['Home', 'Report 3']);
  await expect(root.getByRole('tab', { name: 'Report 3' })).toBeFocused();
  // A tab that may not be closed ignores the key.
  await page.keyboard.press('Home');
  await page.keyboard.press('Delete');
  await expect(tabs).toHaveText(['Home', 'Report 3']);
  await expect(root.getByRole('tabpanel')).toContainText('Open reports: 1');

  const add = root.getByRole('button', { name: 'Add report' });
  expect(await add.evaluate((el) => !!el.closest('[role="tablist"]'))).toBe(false);
  await add.click();
  await expect(tabs).toHaveText(['Home', 'Report 3', 'Report 4']);
  await expect(root.getByRole('tab', { name: 'Report 4' })).toHaveAttribute('aria-selected', 'true');
});

test('the indicator sits on the selected tab, slides to the next, and does not slide with reduced motion', async ({
  page,
}) => {
  await open(page, 'inputs-tabs--variants', 1920, 1080);
  const list = page.getByRole('tablist', { name: 'underline, default' });
  const indicator = list.locator('[data-part="indicator"]');
  const offset = (tab: Locator) =>
    tab.evaluate((el) => {
      const a = el.closest('[data-part="tab"]')!.getBoundingClientRect();
      const b = el
        .closest('[role="tablist"]')!
        .querySelector('[data-part="indicator"]')!
        .getBoundingClientRect();
      return [Math.round(a.left - b.left), Math.round(a.width - b.width), Math.round(a.bottom - b.bottom)];
    });
  await expect(indicator).toBeVisible();
  expect(await offset(list.getByRole('tab').first())).toEqual([0, 0, 0]);
  await expect(indicator).toHaveCSS('transition-duration', '0.18s, 0.18s, 0.18s');

  const third = list.getByRole('tab').nth(2);
  await third.click();
  // Part of the way there first, then on the tab.
  await expect.poll(() => offset(third)).toEqual([0, 0, 0]);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(indicator).toHaveCSS('transition-duration', '0s, 0s, 0s');
  await list.getByRole('tab').first().click();
  expect(await offset(list.getByRole('tab').first())).toEqual([0, 0, 0]);
});

test('tabs hide their counts, then show icons only, then move into a menu and keep the selected tab', async ({
  page,
}) => {
  await open(page, 'inputs-tabs--narrowing');
  const at = (width: number) => page.getByRole('tablist', { name: `Sections at ${width}` });
  const label = (list: Locator, text: string) => list.locator('[data-part="label"]', { hasText: text });
  const shown = (el: Locator) => el.evaluate((node) => node.getBoundingClientRect().width > 2);

  await expect(at(860)).toHaveAttribute('data-level', '0');
  await expect(at(860).locator('[data-part="count"]').first()).toBeVisible();

  // Step 1: counts hide; they are still read.
  await expect(at(700)).toHaveAttribute('data-level', '1');
  await expect(at(700).locator('[data-part="count"]').first()).toBeHidden();
  await expect(at(700).getByRole('tab', { name: 'Open orders, 12' })).toBeVisible();
  expect(await shown(label(at(700), 'Open orders'))).toBe(true);

  // Step 2: a tab with an icon shows the icon only and keeps its name; a tab without one keeps its label.
  await expect(at(480)).toHaveAttribute('data-level', '2');
  expect(await shown(label(at(480), 'Open orders'))).toBe(false);
  await expect(
    at(480).getByRole('tab', { name: 'Open orders, 12' }).locator('[data-part="icon"]'),
  ).toBeVisible();
  await expect(at(480).getByRole('tab', { name: 'Open orders, 12' })).not.toHaveAttribute('title');
  expect(await shown(label(at(480), 'Archive'))).toBe(true);
  expect(await isCutShort(at(480))).toBe(false);

  // Step 3: the tabs that do not fit are in the "more" menu, and the selected tab stays in the list.
  const underline = page.getByRole('tablist', { name: 'Underline at 220' });
  const menu = page.getByRole('menu', { name: 'More tabs' });
  for (const list of [at(220), underline]) {
    const whole = list.locator('xpath=ancestor::*[@data-part="list"]');
    expect(await overflows(list)).toBe(false);
    expect(await isInside(whole, list.locator('xpath=ancestor::*[@data-narrow]'))).toBe(true);
    expect(await list.getByRole('tab').count()).toBeLessThan(5);
    expect(await isInside(list.getByRole('tab', { selected: true }), list)).toBe(true);
    await expect(whole.getByRole('button', { name: 'More tabs' })).toBeVisible();
  }
  // The selected tab would not have fitted: it is drawn, and the menu shows it with a check.
  const more = underline
    .locator('xpath=ancestor::*[@data-part="list"]')
    .getByRole('button', { name: 'More tabs' });
  await expect(underline.getByRole('tab', { name: 'Archive' })).toHaveAttribute('aria-selected', 'true');
  await more.click();
  await expect(menu.getByRole('menuitemradio', { checked: true })).toHaveText('Archive');
  // Choosing a row selects that tab and brings it into the list.
  await menu.getByRole('menuitemradio', { name: 'Settings (2)' }).click();
  await expect(underline.getByRole('tab', { name: 'Settings, 2' })).toHaveAttribute('aria-selected', 'true');
  await expect(underline.getByRole('tab', { name: 'Archive' })).toHaveCount(0);
  expect(await isInside(underline.getByRole('tab', { selected: true }), underline)).toBe(true);
  // The button keeps focus after the menu closes; it is the stop after the tab list.
  await expect(more).toBeFocused();
  await underline.getByRole('tab', { selected: true }).focus();
  await page.keyboard.press('Home');
  await expect(underline.getByRole('tab').first()).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Tab');
  await expect(more).toBeFocused();

  // With room again every tab is back, and with less they leave again.
  const narrow = underline.locator('xpath=ancestor::*[@data-narrow]');
  await narrow.evaluate((el) => (el.style.width = '900px'));
  await expect(underline.getByRole('tab')).toHaveCount(5);
  await expect(more).toHaveCount(0);
  await narrow.evaluate((el) => (el.style.width = '220px'));
  await expect(more).toBeVisible();
  expect(await underline.getByRole('tab').count()).toBeLessThan(5);
});

test('tabs inside a card: the list in the toolbar switches the panels in the body', async ({ page }) => {
  await open(page, 'inputs-tabs--in-card');
  const card = page.locator('[data-umbra="card"]', { hasText: 'Activity' });
  const list = card.locator('[data-part="toolbar"]').getByRole('tablist', { name: 'Activity' });
  const body = card.locator('[data-part="body"]');
  await expect(body.getByRole('tabpanel', { name: 'Orders, 12' })).toContainText('Order 30');
  await list.getByRole('tab', { name: 'People, 5' }).click();
  await expect(body.getByRole('tabpanel', { name: 'People, 5' })).toContainText('Person 5');
  await expect(body.getByText('Order 1', { exact: true })).toHaveCount(0);
  // The card fills the tabs, which fill their column.
  const gap = await card.evaluate((el) => {
    const root = el.closest('[data-umbra="tabs"]')!.getBoundingClientRect();
    const own = el.getBoundingClientRect();
    return [Math.round(own.height - root.height), Math.round(own.width - root.width)];
  });
  expect(gap).toEqual([0, 0]);
});

test('tab parts are replaced by a function or a node and hidden by null, and blocks compose by hand', async ({
  page,
}) => {
  await open(page, 'inputs-tabs--parts-and-blocks', 1920, 1080);
  const fn = page.getByRole('tablist', { name: 'List from a function' });
  await expect(fn.locator('b[data-part="count"]').first()).toHaveText('· 12');
  await expect(fn.locator('[data-part="tab"]').first()).toHaveCSS('text-transform', 'uppercase');
  await expect(page.getByText('Wrapped panel: orders')).toBeVisible();

  const nodes = page.locator('[data-umbra="tabs"]', {
    has: page.getByRole('tablist', { name: 'Parts as nodes' }),
  });
  await expect(nodes.locator('span[data-part="close"]')).toHaveText(['×', '×', '×']);
  await expect(nodes.getByRole('button', { name: /^Close/ })).toHaveCount(0);

  const hidden = page.getByRole('tablist', { name: 'Parts hidden' });
  await expect(
    hidden.locator('[data-part="icon"], [data-part="count"], [data-part="indicator"]'),
  ).toHaveCount(0);
  expect(await names(hidden.getByRole('tab'))).toEqual(['Orders', 'People', 'Reports', 'Settings']);

  const hand = page.getByRole('tablist', { name: 'By hand' });
  await expect(hand.getByRole('tab', { name: 'View B, 3' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel', { name: 'View B, 3' })).toContainText('Item B 1');
  await hand.getByRole('tab', { name: 'View A' }).click();
  await expect(page.getByRole('tabpanel', { name: 'View A' })).toContainText('Item A 1');
  await expect(hand.getByRole('tab', { name: 'View C' })).toBeDisabled();
  const end = page.getByRole('button', { name: 'New view' });
  expect(await end.evaluate((el) => !!el.closest('[role="tablist"]'))).toBe(false);
});

// Columns

test('the tab strip of Columns is the one Tabs draws', async ({ page }) => {
  await open(page, 'layout-page-layouts--three-columns', 900, 560);
  const strip = page.locator('[data-umbra="columns"] > [data-part="tabs"]');
  const list = strip.getByRole('tablist', { name: 'Columns' });
  await expect(strip.locator('[data-part="list"]')).toHaveAttribute('data-variant', 'underline');
  await expect(list.locator('[data-part="indicator"]')).toBeVisible();
  const tabs = list.getByRole('tab');
  await expect(tabs).toHaveText(['Inbox', 'Summary', 'Status']);
  expect(await tabStops(list)).toBe(1);

  // Each tab points at its column, which is the panel.
  const panel = page.getByRole('tabpanel');
  await expect(panel).toHaveCount(1);
  await expect(panel).toHaveAttribute('id', (await tabs.first().getAttribute('aria-controls'))!);

  await tabs.first().focus();
  await page.keyboard.press('End');
  await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel')).toContainText('Next review');
  await page.keyboard.press('ArrowRight');
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Home');
  await expect(page.getByRole('tabpanel')).toContainText('Message 1');
});
