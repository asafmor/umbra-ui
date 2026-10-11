import { expect, test, type Locator, type Page } from '@playwright/test';

// Select and SearchField: keyboard, selection, filtering, form values, the wiring a screen reader depends
// on, placement near the window's edges, and each step of "show less as it narrows".
const open = async (page: Page, id: string, width = 1280, height = 720) => {
  await page.setViewportSize({ width, height });
  await page.goto(`/iframe.html?id=${id}&viewMode=story`);
  await page.locator('#storybook-root > *').first().waitFor();
  await page.evaluate(() => document.fonts.ready);
};
/** The element's box once the motion of the overlay it is in has finished. */
const box = async (locator: Locator) => {
  await locator.evaluate(async (el) => {
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
    const moving = [el, el.closest('[data-umbra-overlay]'), el.closest('[data-part="field"]')];
    await Promise.all(moving.flatMap((m) => m?.getAnimations() ?? []).map((a) => a.finished));
  });
  return (await locator.boundingBox())!;
};
/** The element's width, once it has stopped changing. */
const expectWidth = (locator: Locator, width: number) =>
  expect.poll(async () => Math.round((await locator.boundingBox())!.width)).toBe(width);
const trigger = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
/** The select whose own accessible name (`aria-label`) is `label`, whatever it shows. */
const select = (page: Page, label: string) =>
  page.locator(`[data-umbra="select"]:has([data-part="trigger"][aria-label="${label}"])`);
const list = (page: Page) => page.getByRole('listbox');
/** Closes the list a story opens by itself. */
const close = async (page: Page) => {
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-umbra-overlay]')).toHaveCount(0);
};
const option = (page: Page, name: string) => page.getByRole('option', { name, exact: true });
const submit = async (page: Page) => {
  await page.getByRole('button', { name: 'Save' }).click();
  return page.getByText(/^Sent: /);
};
const at = (page: Page, width: number) => page.locator(`[data-width="${width}"]`);

test.describe('Select', () => {
  test('ArrowDown, Enter and Space open it on the chosen option; Escape closes it and changes nothing', async ({
    page,
  }) => {
    await open(page, 'inputs-select--states');
    const button = trigger(page, 'Every time With a value');
    await expect(button).toHaveAttribute('aria-haspopup', 'listbox');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    for (const key of ['ArrowDown', 'Enter', 'Space']) {
      await button.focus();
      await page.keyboard.press(key);
      await expect(list(page)).toBeVisible();
      await expect(button).toHaveAttribute('aria-expanded', 'true');
      await expect(option(page, 'Every time')).toBeFocused();
      await expect(option(page, 'Every time')).toHaveAttribute('aria-selected', 'true');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Escape');
      await expect(list(page)).toHaveCount(0);
      await expect(button).toBeFocused();
      await expect(button).toHaveText('Every time');
    }
    // Closed, the arrow keys and typing change the choice.
    const value = select(page, 'With a value').locator('[data-part="value"]');
    await page.keyboard.press('ArrowRight');
    await expect(value).toHaveText(/^When an item needs a review/);
    await page.keyboard.type('nev');
    await expect(value).toHaveText('Never');
    await expect(list(page)).toHaveCount(0);
  });

  test('arrows, Home, End and type-ahead move through the options; Enter chooses and returns focus', async ({
    page,
  }) => {
    await open(page, 'inputs-select--open');
    await close(page);
    const button = page.locator('[data-part="trigger"]');
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(option(page, 'Region 2 8')).toBeFocused();
    // The disabled option is passed over.
    await page.keyboard.press('ArrowDown');
    await expect(option(page, 'Region 4 21')).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(option(page, 'Region 2 8')).toBeFocused();
    await page.keyboard.press('End');
    await expect(option(page, 'Region 5 3')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(option(page, 'Region 1 12')).toBeFocused();
    await page.keyboard.type('region 4');
    await expect(option(page, 'Region 4 21')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(list(page)).toHaveCount(0);
    await expect(button).toBeFocused();
    await expect(button).toHaveText('Region 4');

    // The chosen option has a check as well as its colour; the others have none.
    await page.keyboard.press('Space');
    await expect(option(page, 'Region 4 21').locator('[data-part="check"] svg')).toHaveCount(1);
    await expect(option(page, 'Region 2 8').locator('[data-part="check"] svg')).toHaveCount(0);
    await expect(page.getByRole('group', { name: 'North' })).toBeVisible();
    await expect(option(page, 'Region 3 0')).toHaveAttribute('aria-disabled', 'true');
  });

  test('a press opens it and chooses; a controlled select reports the id; clear empties it', async ({
    page,
  }) => {
    await open(page, 'inputs-select--states');
    const root = select(page, 'Controlled');
    await root.locator('[data-part="trigger"]').click();
    await option(page, 'Compact').click();
    await expect(list(page)).toHaveCount(0);
    await expect(page.getByText('Value: "compact".')).toBeVisible();

    const clear = root.getByRole('button', { name: 'Clear' });
    await clear.click();
    await expect(page.getByText('Value: "".')).toBeVisible();
    await expect(root.locator('[data-part="value"]')).toHaveText('Select');
    await expect(root.locator('[data-part="value"]')).toHaveAttribute('data-empty', 'true');
    await expect(clear).toHaveCount(0);
    await expect(root.locator('[data-part="trigger"]')).toBeFocused();
    // The list did not open because of the press on the clear button.
    await expect(list(page)).toHaveCount(0);
  });

  test('disabled and read-only selects do not open and have no clear button', async ({ page }) => {
    await open(page, 'inputs-select--states');
    const disabled = select(page, 'Disabled');
    await expect(disabled.locator('[data-part="trigger"]')).toBeDisabled();
    await expect(disabled.getByRole('button', { name: 'Clear' })).toHaveCount(0);

    const readOnly = select(page, 'Read-only');
    const button = readOnly.locator('[data-part="trigger"]');
    await button.click();
    await expect(list(page)).toHaveCount(0);
    await button.focus();
    await expect(button).toBeFocused();
    for (const key of ['ArrowDown', 'Enter', 'ArrowLeft', 'e']) await page.keyboard.press(key);
    await expect(list(page)).toHaveCount(0);
    await expect(button).toHaveText('Never');
    await expect(readOnly.getByRole('button', { name: 'Clear' })).toHaveCount(0);
  });

  test('an invalid select shows an icon, and a long label truncates inside the box', async ({ page }) => {
    await open(page, 'inputs-select--states');
    const invalid = select(page, 'Invalid');
    await expect(invalid).toHaveAttribute('data-invalid', 'true');
    await expect(invalid.locator('[data-part="invalidIcon"] svg')).toBeVisible();

    const long = select(page, 'Long');
    const label = long.locator('[data-part="value"] span span').first();
    expect(await label.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    // The cut label shows its full text in a tooltip; a label that fits shows none.
    await long.hover();
    const tip = page.locator('[data-umbra="tooltip"]');
    await expect(tip).toHaveText(await label.evaluate((el) => el.textContent!));
    await page.mouse.move(0, 0);
    await expect(tip).toHaveCount(0);
    await invalid.hover();
    await page.waitForTimeout(700);
    await expect(tip).toHaveCount(0);
    const outer = await box(long);
    const caret = await box(long.locator(':scope > [data-part="icon"]'));
    expect(caret.x + caret.width).toBeLessThan(outer.x + outer.width);
  });

  test('multiple: options toggle and the list stays open; the trigger shows labels, then a count', async ({
    page,
  }) => {
    await open(page, 'inputs-select--multiple');
    await close(page);
    const wide = at(page, 360);
    const narrow = at(page, 180);
    await expect(wide.locator('[data-part="value"]')).toHaveText('Region 1, Region 2, Region 4');
    // The same three do not fit in 180px.
    await expect(narrow.locator('[data-part="value"]')).toHaveText('3 selected');

    await narrow.locator('[data-part="trigger"]').click();
    await expect(list(page)).toHaveAttribute('aria-multiselectable', 'true');
    await expect(option(page, 'Region 1 12')).toHaveAttribute('aria-selected', 'true');
    await expect(option(page, 'Region 1 12').locator('[data-part="check"] svg')).toHaveCount(1);
    await expect(option(page, 'Region 5 3').locator('[data-part="check"] svg')).toHaveCount(0);
    await option(page, 'Region 2 8').click();
    await expect(list(page)).toBeVisible();
    await expect(narrow.getByText('Values: region-1, region-4.')).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');
    await expect(list(page)).toBeVisible();
    await expect(narrow.getByText(/^Values: /)).not.toHaveText('Values: region-1, region-4.');
    await page.keyboard.press('Escape');
    await expect(list(page)).toHaveCount(0);

    // One label fits, so the count gives way to it.
    await narrow.locator('[data-part="trigger"]').click();
    for (const name of ['Region 4 21', 'Region 5 3']) {
      if ((await option(page, name).getAttribute('aria-selected')) === 'true')
        await option(page, name).click();
    }
    await page.keyboard.press('Escape');
    await expect(narrow.locator('[data-part="value"]')).toHaveText('Region 1');
  });

  test('searchable: typing filters, the arrows and Enter choose, and closing resets the filter', async ({
    page,
  }) => {
    await open(page, 'inputs-select--searchable');
    await close(page);
    const button = page.locator('[data-part="trigger"]');
    await button.focus();
    await page.keyboard.press('ArrowDown');
    const search = page.getByRole('searchbox', { name: 'Filter options' });
    await expect(search).toBeFocused();
    await expect(search).toHaveAttribute('aria-autocomplete', 'list');
    await expect(page.getByRole('option')).toHaveCount(24);

    await page.keyboard.type('item 2');
    await expect(page.getByRole('option')).toHaveCount(6);
    await expect(page.getByText('Search: "item 2".')).toBeVisible();
    // Focus stays in the field; the option the keys are on is its active descendant.
    await page.keyboard.press('ArrowDown');
    await expect(search).toBeFocused();
    const active = () =>
      search.evaluate(
        (el) => document.getElementById(el.getAttribute('aria-activedescendant')!)?.textContent,
      );
    await expect.poll(active).toBe('Item 20');
    await page.keyboard.press('Enter');
    await expect(list(page)).toHaveCount(0);
    await expect(button).toBeFocused();
    await expect(page.getByText('Value: "item-20". Search: "".')).toBeVisible();

    // Nothing matches: the list says so. Escape empties the filter first, then closes the list.
    await page.keyboard.press('Enter');
    await expect(page.getByRole('option')).toHaveCount(24);
    await page.keyboard.type('zzz');
    await expect(page.getByRole('option')).toHaveCount(0);
    await expect(page.locator('[data-part="empty"]')).toHaveText('No results');
    await page.keyboard.press('Escape');
    await expect(search).toHaveValue('');
    await expect(page.getByRole('option')).toHaveCount(24);
    await page.keyboard.press('Escape');
    await expect(list(page)).toHaveCount(0);
    await expect(button).toBeFocused();
  });

  test('the list shows skeleton rows while loading, a text when empty, and an error with a retry', async ({
    page,
  }) => {
    await open(page, 'inputs-select--loading');
    await expect(page.locator('[data-part="empty"]')).toHaveAttribute('aria-busy', 'true');
    await expect(page.locator('[data-part="empty"] [data-umbra="skeleton"]')).toHaveCount(3);
    await expect(page.getByRole('progressbar', { name: 'Loading' })).toBeVisible();

    await open(page, 'inputs-select--empty');
    await expect(page.locator('[data-part="empty"]')).toContainText('No items yet');

    await open(page, 'inputs-select--error-state');
    await expect(page.getByRole('alert')).toContainText('The items could not be loaded');
    await expect(page.getByRole('option')).toHaveCount(0);
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByText('Retries: 1.')).toBeVisible();
    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('a form receives the chosen ids, and a required select holds the form back until it has one', async ({
    page,
  }) => {
    await open(page, 'inputs-select--in-form-field');
    await expect(await submit(page)).toHaveText('Sent: nothing yet');

    await trigger(page, 'Choose a role Role').click();
    await option(page, 'Editor Can change content').click();
    await page.getByRole('button', { name: /Regions/ }).click();
    await option(page, 'Region 1 12').click();
    await option(page, 'Region 4 21').click();
    await page.keyboard.press('Escape');
    // The disabled field sends nothing.
    await expect(await submit(page)).toHaveText(
      'Sent: [["role","editor"],["regions","region-1"],["regions","region-4"],["view","detail"]]',
    );
  });

  test('inside a FormField it takes the label, description, error and disabled state', async ({ page }) => {
    await open(page, 'inputs-select--in-form-field');
    const role = page.locator('[data-part="trigger"]').nth(0);
    await expect(role).toHaveAccessibleName('Choose a role Role');
    await expect(role).toHaveAccessibleDescription('What this person may do.');
    await expect(page.locator('[data-part="trigger"]').nth(2)).toBeDisabled();
    const stage = page.locator('[data-part="trigger"]').nth(4);
    await expect(page.locator('[data-part="trigger"]')).toHaveCount(5);
    await expect(stage).toHaveAccessibleName('Stage Stage');
    await expect(stage).toHaveAccessibleDescription('Choose a stage');
    await expect(page.locator('[data-umbra="select"]').nth(4)).toHaveAttribute('data-invalid', 'true');
    // The field's label is a label for the trigger.
    const id = await role.getAttribute('id');
    await expect(page.locator(`label[for="${id}"]`)).toContainText('Role');
  });

  test('in a cell the chosen colour fills the trigger, and the label says the same', async ({ page }) => {
    await open(page, 'inputs-select--in-cell');
    const stage = page.locator('[data-umbra="select"]').nth(2);
    await expect(stage.locator('[data-part="trigger"]')).toHaveAccessibleName('In review Stage of order 2');
    await expect(stage).toHaveAttribute('data-tone', 'warning');
    const fill = () => stage.evaluate((el) => getComputedStyle(el).backgroundColor);
    const before = await fill();
    expect(before).not.toBe('rgba(0, 0, 0, 0)');
    const cell = await box(stage.locator('xpath=..'));
    expect((await box(stage)).width).toBeCloseTo(cell.width, 0);

    await stage.locator('[data-part="trigger"]').click();
    await option(page, 'Blocked').click();
    await expect(stage).toHaveAttribute('data-tone', 'danger');
    await expect(stage.locator('[data-part="value"]')).toHaveText('Blocked');
    expect(await fill()).not.toBe(before);
    // An option without a colour leaves the cell plain.
    await stage.locator('[data-part="trigger"]').click();
    await option(page, 'Draft').click();
    await expect(stage).not.toHaveAttribute('data-tone');
  });

  test('the list opens under the trigger, flips above it near the bottom edge, and scrolls inside', async ({
    page,
  }) => {
    await open(page, 'inputs-select--placement');
    const opened = async (name: string) => {
      const root = select(page, name);
      await root.locator('[data-part="trigger"]').click();
      const panel = page.locator('[data-part="popover"]:not([data-exiting])');
      await expect(panel).toBeVisible();
      return { anchor: await box(root), panel: await box(panel) };
    };

    let { anchor, panel } = await opened('Top start');
    expect(panel.y).toBeGreaterThanOrEqual(anchor.y + anchor.height);
    expect(panel.x).toBeCloseTo(anchor.x, 0);
    // 24 options are taller than the list may be: it scrolls, inside the window.
    expect(panel.height).toBeLessThanOrEqual(320);
    expect(await list(page).evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
    await close(page);

    ({ anchor, panel } = await opened('Top end'));
    expect(panel.x + panel.width).toBeCloseTo(anchor.x + anchor.width, 0);
    await close(page);

    ({ anchor, panel } = await opened('Bottom start'));
    expect(panel.y + panel.height).toBeLessThanOrEqual(anchor.y);
    expect(panel.y).toBeGreaterThanOrEqual(0);
    await page.keyboard.press('Escape');

    // `matchTriggerWidth`: exactly as wide as the trigger, so the long option truncates.
    ({ anchor, panel } = await opened('Bottom end'));
    expect(panel.width).toBeCloseTo(anchor.width, 0);
    expect(panel.y + panel.height).toBeLessThanOrEqual(anchor.y);
    expect(panel.x + panel.width).toBeLessThanOrEqual(1280);
  });

  test('the list is never taller than the window', async ({ page }) => {
    await open(page, 'inputs-select--placement', 1024, 300);
    await select(page, 'Top start').locator('[data-part="trigger"]').click();
    const panel = await box(page.locator('[data-part="popover"]'));
    expect(panel.y + panel.height).toBeLessThanOrEqual(300);
    await page.keyboard.press('End');
    await expect(option(page, 'Item 24')).toBeInViewport();
  });

  test('parts replace, hide and wrap pieces; blocks compose the same select', async ({ page }) => {
    await open(page, 'inputs-select--parts');
    await expect(select(page, 'Custom caret').locator('.lucide-chevrons-up-down')).toBeVisible();
    await expect(select(page, 'No caret').locator('.lucide-chevron-down')).toHaveCount(0);
    await expect(select(page, 'Wrapped value').locator('.lucide-eye')).toBeVisible();

    await trigger(page, 'Detail Wrapped options').click();
    await expect(option(page, 'Detail #detail')).toHaveAttribute('aria-selected', 'true');
    await expect(option(page, 'Detail #detail').locator('.lucide-globe')).toBeVisible();
    await close(page);

    await trigger(page, 'Select Custom empty').click();
    await expect(page.getByText('Nothing here.')).toBeVisible();
    await close(page);

    // Options given as blocks.
    const fromChildren = trigger(page, 'Option B From children');
    await fromChildren.click();
    await expect(page.getByRole('group', { name: 'More' })).toBeVisible();
    await expect(option(page, 'Option C')).toHaveAttribute('aria-disabled', 'true');
    await option(page, 'Option A').click();
    await expect(trigger(page, 'Option A From children')).toBeVisible();

    // Composed by hand: extra content in the trigger, and a list as wide as the trigger.
    const byHand = select(page, 'By hand');
    await byHand.locator('[data-part="trigger"]').click();
    expect((await box(page.locator('[data-part="popover"]:not([data-exiting])'))).width).toBeCloseTo(
      (await box(byHand)).width,
      0,
    );
    await option(page, 'Owner Full access, including billing').click();
    await expect(byHand.locator('[data-part="value"]')).toHaveText('Owner');
  });

  test('rich options: the description is a second line in the list and, when asked, in the trigger', async ({
    page,
  }) => {
    await open(page, 'inputs-select--rich-options');
    await expect(option(page, 'Person B Assistant reviewer').locator('[data-umbra="avatar"]')).toBeVisible();
    await option(page, 'Person D Coordinator').click();
    const reviewer = select(page, 'Reviewer');
    await expect(reviewer.locator('[data-umbra="avatar"]')).toBeVisible();
    expect((await box(reviewer)).height).toBeGreaterThan(36);
    // renderValue and renderOption replace the content.
    await trigger(page, 'Role: Owner Custom').click();
    await expect(option(page, 'Current: Owner')).toHaveAttribute('aria-selected', 'true');
  });
});

test.describe('SearchField', () => {
  const field = (page: Page, name: string) =>
    page.locator('[data-umbra="search-field"]').filter({ has: page.getByLabel(name, { exact: true }) });

  test('typing reports the text, Enter submits it, and the clear button empties it and keeps focus', async ({
    page,
  }) => {
    await open(page, 'inputs-searchfield--states');
    const input = page.getByRole('searchbox', { name: 'Controlled' });
    await input.fill('Region 2');
    await expect(page.getByText('Value: "Region 2". Submitted: nothing. Cleared: 0.')).toBeVisible();
    await input.press('Enter');
    await expect(page.getByText('Submitted: Region 2.')).toBeVisible();

    const clear = field(page, 'Controlled').getByRole('button', { name: 'Clear' });
    await input.press('Tab');
    await expect(clear).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByText('Value: "". Submitted: Region 2. Cleared: 1.')).toBeVisible();
    await expect(input).toBeFocused();
    await expect(clear).toHaveCount(0);
  });

  test('Escape empties the field, then takes focus off it', async ({ page }) => {
    await open(page, 'inputs-searchfield--states');
    const input = page.getByRole('searchbox', { name: 'Controlled' });
    await input.focus();
    await page.keyboard.press('Escape');
    await expect(input).toHaveValue('');
    await expect(input).toBeFocused();
    await expect(page.getByText('Value: "". Submitted: nothing. Cleared: 1.')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(input).not.toBeFocused();
  });

  test('the key hint shows while empty and not focused; the key focuses the field, but not while typing', async ({
    page,
  }) => {
    await open(page, 'inputs-searchfield--states');
    const slash = field(page, 'Slash');
    const hint = slash.locator('[data-part="shortcut"]');
    await expect(hint).toHaveText('/');
    await page.keyboard.press('/');
    const input = slash.getByRole('searchbox');
    await expect(input).toBeFocused();
    await expect(input).toHaveValue('');
    await expect(hint).toHaveCount(0);
    // While typing, the key is a character.
    await page.keyboard.press('/');
    await expect(input).toHaveValue('/');
    await input.fill('');
    await input.blur();
    await expect(hint).toBeVisible();

    // A shortcut from the provider's list.
    const orders = field(page, 'Orders');
    await expect(orders.locator('[data-part="shortcut"]')).toHaveText(/E$/);
    await page.keyboard.press('ControlOrMeta+e');
    await expect(orders.getByRole('searchbox')).toBeFocused();
    // A disabled field has no hint to follow.
    await expect(field(page, 'Disabled').getByRole('searchbox')).toBeDisabled();
  });

  test('loading shows a named spinner; landmark makes a search region; states are marked', async ({
    page,
  }) => {
    await open(page, 'inputs-searchfield--states');
    await expect(field(page, 'Loading').getByRole('progressbar', { name: 'Loading' })).toBeVisible();
    await expect(page.getByRole('search', { name: 'Site search' })).toBeVisible();
    await expect(field(page, 'Invalid')).toHaveAttribute('data-invalid', 'true');
    await expect(field(page, 'Invalid').locator('[data-part="invalidIcon"] svg')).toBeVisible();
    const readOnly = page.getByRole('searchbox', { name: 'Read-only' });
    await expect(readOnly).toHaveAttribute('readonly', '');
    await expect(field(page, 'Read-only').getByRole('button', { name: 'Clear' })).toHaveCount(0);
  });

  test('debounce: onChange waits for a pause in typing; Enter does not wait', async ({ page }) => {
    await open(page, 'inputs-searchfield--debounce');
    const input = page.getByRole('searchbox', { name: 'Debounced' });
    // The times are taken inside the page, where the debounce runs: measured from the test, a busy
    // machine adds its own delays, and this test failed now and then on a 200ms limit.
    await page.evaluate(() => {
      const log: { at: number; what: string }[] = [];
      (window as unknown as { umbraLog: typeof log }).umbraLog = log;
      const calls = () => /Calls: (\d+)\./.exec(document.body.textContent ?? '')?.[1] ?? '';
      let last = calls();
      document.addEventListener('input', () => log.push({ at: performance.now(), what: 'input' }), true);
      document.addEventListener(
        'keydown',
        (event) => event.key === 'Enter' && log.push({ at: performance.now(), what: 'enter' }),
        true,
      );
      new MutationObserver(() => {
        const now = calls();
        if (now !== last) log.push({ at: performance.now(), what: `calls:${now}` });
        last = now;
      }).observe(document.body, { subtree: true, childList: true, characterData: true });
    });
    const timeline = () =>
      page.evaluate(() => (window as unknown as { umbraLog: { at: number; what: string }[] }).umbraLog);
    const at = (log: { at: number; what: string }[], what: string, last = false) =>
      (last ? log.findLast((entry) => entry.what === what) : log.find((entry) => entry.what === what))!.at;

    await input.pressSequentially('order');
    await expect(input).toHaveValue('order');
    await expect(page.getByText('Value: "order". Calls: 1.')).toBeVisible();
    let log = await timeline();
    // One call for the five keys, and not before the pause (400ms) after the last of them.
    expect(log.filter((entry) => entry.what.startsWith('calls')).map((entry) => entry.what)).toEqual([
      'calls:1',
    ]);
    expect(at(log, 'calls:1') - at(log, 'input', true)).toBeGreaterThanOrEqual(390);

    await input.pressSequentially(' 12');
    await input.press('Enter');
    await expect(page.getByText('Value: "order 12". Calls: 2.')).toBeVisible();
    log = await timeline();
    // Enter does not wait for the pause.
    expect(at(log, 'calls:2') - at(log, 'enter')).toBeLessThan(200);
    // Nothing more arrives after the wait.
    await page.waitForTimeout(600);
    await expect(page.getByText('Value: "order 12". Calls: 2.')).toBeVisible();
    expect((await timeline()).filter((entry) => entry.what.startsWith('calls')).length).toBe(2);
  });

  test('collapsible, overlay: it opens over its neighbours, which do not move, and closes when empty and blurred', async ({
    page,
  }) => {
    await open(page, 'inputs-searchfield--collapsible');
    const bar = page.locator('[data-bar="overlay"]');
    const neighbours = () =>
      bar.evaluate((el) =>
        [...el.children].map((c) => {
          const r = c.getBoundingClientRect();
          return [r.x, r.width];
        }),
      );
    const root = bar.locator('[data-umbra="search-field"]');
    const visible = root.locator('[data-part="field"]');
    const before = await neighbours();
    await expectWidth(visible, 36);
    await expect(root).toHaveAttribute('data-collapsed', 'true');

    // A press on the icon opens it.
    await visible.click();
    const input = root.getByRole('searchbox', { name: 'Search orders' });
    await expect(input).toBeFocused();
    await expect(root).not.toHaveAttribute('data-collapsed');
    const opened = await box(visible);
    expect(opened.width).toBe(240);
    // It grows towards the start: the end edge stays where the icon was.
    expect(opened.x + opened.width).toBeCloseTo(before[4]![0]! + before[4]![1]!, 0);
    expect(await neighbours()).toEqual(before);

    // Empty and blurred: it closes. With text it stays open.
    await page.keyboard.press('Escape');
    await expect(root).toHaveAttribute('data-collapsed', 'true');
    await expectWidth(visible, 36);
    await input.focus();
    await page.keyboard.type('order');
    await bar.getByRole('button', { name: 'Orders' }).focus();
    await expect(root).not.toHaveAttribute('data-collapsed');
    expect(await neighbours()).toEqual(before);

    // Tab reaches the collapsed field, and the shortcut opens it.
    await input.fill('');
    await input.blur();
    await expect(root).toHaveAttribute('data-collapsed', 'true');
    await page.keyboard.press('/');
    await expect(input).toBeFocused();
    await expect(root).not.toHaveAttribute('data-collapsed');
  });

  test('collapsible, overlay towards the end: the label shows while collapsed and the start edge stays', async ({
    page,
  }) => {
    await open(page, 'inputs-searchfield--collapsible');
    const bar = page.locator('[data-bar="overlay-end"]');
    const root = bar.locator('[data-umbra="search-field"]');
    const visible = root.locator('[data-part="field"]');
    await expect(root.locator('[data-part="label"]')).toHaveText('Search');
    const closed = await box(visible);
    const orders = await box(bar.getByRole('button', { name: 'Orders' }));
    await bar.getByRole('button', { name: 'Orders' }).focus();
    await page.keyboard.press('Shift+Tab');
    await expect(root.getByRole('searchbox')).toBeFocused();
    const opened = await box(visible);
    expect(opened.x).toBeCloseTo(closed.x, 0);
    expect(opened.width).toBe(240);
    await expect(root.locator('[data-part="label"]')).toHaveCount(0);
    expect(await box(bar.getByRole('button', { name: 'Orders' }))).toEqual(orders);
  });

  test('collapsible, inline: it takes the space and its neighbours move', async ({ page }) => {
    await open(page, 'inputs-searchfield--collapsible');
    const bar = page.locator('[data-bar="inline"]');
    const root = bar.locator('[data-umbra="search-field"]');
    const exportButton = bar.getByRole('button', { name: 'Export' });
    const end = async () => {
      const b = await box(exportButton);
      return b.x + b.width;
    };
    const before = await box(root);
    const fixed = await end();
    await root.locator('[data-part="field"]').click();
    const after = await box(root);
    expect(after.width).toBe(240);
    expect(after.x).toBeLessThan(before.x);
    expect(await end()).toBe(fixed);
    // Still inside the bar.
    const outer = await box(bar);
    expect(after.x).toBeGreaterThan(outer.x);
  });

  test('suggestions: recent searches while empty, rows for the text typed, arrows and Enter choose', async ({
    page,
  }) => {
    await open(page, 'inputs-searchfield--suggestions');
    const input = page.getByRole('combobox', { name: 'Search' });
    await expect(input).toHaveAttribute('aria-autocomplete', 'list');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await input.focus();
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('group', { name: 'Recent searches' })).toBeVisible();
    await expect(page.getByRole('option')).toHaveText(['Order 12', 'Region 4']);
    // The list is as wide as the field, under it.
    const panel = await box(page.locator('[data-part="suggestions"]'));
    const anchor = await box(page.locator('[data-part="field"]'));
    expect(panel.x).toBeCloseTo(anchor.x, 0);
    expect(panel.width).toBeCloseTo(anchor.width, 0);
    expect(panel.y).toBeGreaterThanOrEqual(anchor.y + anchor.height);

    await page.keyboard.type('or');
    await expect(page.getByRole('option')).toHaveText(['Reports', 'Order 12Region 1', 'Order 120Region 4']);
    await expect(page.getByRole('group', { name: 'Orders' })).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(input).toBeFocused();
    const active = () =>
      input.evaluate((el) => document.getElementById(el.getAttribute('aria-activedescendant')!)?.textContent);
    await expect.poll(active).toBe('Order 12Region 1');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Text: "Order 12". Last: selected order-12.')).toBeVisible();
    await expect(input).toHaveValue('Order 12');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(input).toBeFocused();

    // Enter with no row active submits the text.
    await page.keyboard.type('0');
    await expect(page.getByRole('option')).toHaveCount(1);
    await page.keyboard.press('Enter');
    await expect(page.getByText('Text: "Order 120". Last: submitted Order 120.')).toBeVisible();
  });

  test('suggestions: Escape closes the list, then empties the field, then blurs; no match says so', async ({
    page,
  }) => {
    await open(page, 'inputs-searchfield--suggestions');
    const input = page.getByRole('combobox', { name: 'Search' });
    await input.focus();
    await page.keyboard.type('person');
    await expect(page.getByRole('option')).toHaveCount(2);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(input).toHaveValue('person');
    await page.keyboard.press('Escape');
    await expect(input).toHaveValue('');
    await expect(input).toBeFocused();
    // Empty again: the recent searches are back; Escape closes them, and once more leaves the field.
    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(input).not.toBeFocused();

    await input.focus();
    await page.keyboard.type('zzz');
    await expect(page.locator('[data-part="empty"]')).toHaveText('No results');
  });

  test('recent searches: choosing one submits it; the button on its row and Shift+Delete remove it', async ({
    page,
  }) => {
    await open(page, 'inputs-searchfield--suggestions');
    const input = page.getByRole('combobox', { name: 'Search' });
    await input.focus();
    await page.getByRole('option', { name: 'Region 4' }).locator('[data-part="remove"]').click();
    await expect(page.getByText('Recent: Order 12.')).toBeVisible();
    await expect(page.getByText('Last: nothing.')).toBeVisible();
    await expect(input).toBeFocused();
    await expect(input).toHaveValue('');

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Shift+Delete');
    await expect(page.getByText('Recent: none.')).toBeVisible();

    await open(page, 'inputs-searchfield--suggestions');
    await input.focus();
    await page.getByRole('option', { name: 'Order 12' }).click();
    await expect(page.getByText('Text: "Order 12". Last: submitted Order 12.')).toBeVisible();
  });

  test('suggestions while loading: a spinner in the field and skeleton rows in the list', async ({
    page,
  }) => {
    await open(page, 'inputs-searchfield--suggestions-loading');
    const input = page.getByRole('combobox', { name: 'Search' });
    await expect(page.getByRole('progressbar', { name: 'Loading' })).toBeVisible();
    await input.focus();
    await page.keyboard.type('x');
    await expect(page.locator('[data-part="empty"]')).toHaveAttribute('aria-busy', 'true');
    await expect(page.locator('[data-part="empty"] [data-umbra="skeleton"]')).toHaveCount(2);
  });

  test('inside a FormField it takes the label, description and error, and a form receives its text', async ({
    page,
  }) => {
    await open(page, 'inputs-searchfield--in-form-field');
    const order = page.getByRole('searchbox', { name: 'Find an order' });
    await expect(order).toHaveAccessibleDescription('By number or region.');
    const person = page.getByRole('searchbox', { name: 'Find a person' });
    const region = page.getByRole('searchbox', { name: 'Find a region' });
    await expect(region).toHaveAccessibleDescription('Type at least two letters');
    await expect(region).toHaveAttribute('aria-invalid', 'true');
    await page.getByText('Find an order').click();
    await expect(order).toBeFocused();
    await person.fill('Person A');
    await expect(await submit(page)).toHaveText('Sent: [["query","Order 12"],["person","Person A"]]');
    // Without `onSubmit`, Enter submits the form.
    await order.fill('Order 7');
    await order.press('Enter');
    await expect(page.getByText(/^Sent: /)).toHaveText('Sent: [["query","Order 7"],["person","Person A"]]');
  });

  test('as it narrows the key hint hides; a collapsible field that takes space opens over its neighbour instead', async ({
    page,
  }) => {
    await open(page, 'inputs-searchfield--narrow');
    await expect(at(page, 260).locator('[data-part="shortcut"]')).toBeVisible();
    for (const width of [150, 90]) {
      const slot = at(page, width);
      await expect(slot.locator('[data-part="shortcut"]')).toHaveCount(0);
      await expect(slot.locator('[data-umbra="search-field"]')).toHaveAttribute('data-shrink', '1');
      const outer = await box(slot);
      const inner = await box(slot.locator('[data-part="field"]'));
      expect(inner.x + inner.width).toBeLessThanOrEqual(outer.x + outer.width);
    }

    // With room, the open field sits beside the button.
    const roomy = page.locator('[data-row="320"]');
    await expect(roomy.locator('[data-umbra="search-field"]')).not.toHaveAttribute('data-overlay');
    await expectWidth(roomy.locator('[data-part="field"]'), 240);
    // Without room it does not squeeze: it opens over what follows it, at its full width.
    const tight = page.locator('[data-row="150"]');
    const root = tight.locator('[data-umbra="search-field"]');
    await expect(root).toHaveAttribute('data-overlay', 'true');
    await expectWidth(root.locator('[data-part="field"]'), 240);
    await expectWidth(root, 36);
    const button = await box(tight.getByRole('button', { name: 'Export' }));
    expect((await box(root)).x).toBeGreaterThanOrEqual(button.x + button.width);
  });

  test('parts replace, hide and wrap pieces; blocks compose the same field', async ({ page }) => {
    await open(page, 'inputs-searchfield--parts');
    await expect(field(page, 'Custom icon').locator('.lucide-scan-search')).toBeVisible();
    await expect(field(page, 'No icon').locator('[data-part="icon"]')).toHaveCount(0);
    await expect(field(page, 'No clear button').getByRole('button')).toHaveCount(0);
    await expect(field(page, 'Wrapped hint')).toContainText('press/');

    await page.getByRole('combobox', { name: 'Wrapped rows' }).focus();
    await expect(page.getByRole('option').first()).toContainText('#order-12');
    await page.keyboard.press('Escape');

    const byHand = field(page, 'By hand');
    const clear = byHand.getByRole('button', { name: 'Empty the field' });
    await clear.click();
    await expect(byHand.getByRole('searchbox')).toHaveValue('');
    await expect(byHand.getByRole('searchbox')).toBeFocused();
  });
});
