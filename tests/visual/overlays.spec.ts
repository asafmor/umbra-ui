import { expect, test, type Locator, type Page } from '@playwright/test';

// Popover, Tooltip and Menu: keyboard, focus, dismissal and everything else a still image cannot show.
const open = async (page: Page, id: string, width = 1280, height = 720, globals = '') => {
  await page.setViewportSize({ width, height });
  await page.goto(`/iframe.html?id=${id}&viewMode=story${globals && `&globals=${globals}`}`);
  await page.locator('#storybook-root > *').first().waitFor();
  await page.evaluate(async () => {
    await Promise.all(
      [...document.fonts].filter((f) => f.unicodeRange.startsWith('U+0-FF')).map((f) => f.load()),
    );
    await document.fonts.ready;
  });
};
/** The element's box once its enter motion (a short slide) has finished. */
const box = async (locator: Locator) => {
  await locator.evaluate(async (el) => {
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
    const moving = [el, ...(el.closest('[data-umbra-overlay]') ? [el.closest('[data-umbra-overlay]')!] : [])];
    await Promise.all(moving.flatMap((m) => m.getAnimations()).map((a) => a.finished));
  });
  return (await locator.boundingBox())!;
};

// Popover

test('popover: Enter opens it and moves focus in; Escape closes it and returns focus to the trigger', async ({
  page,
}) => {
  await open(page, 'overlays-popover--behaviour');
  const trigger = page.getByRole('button', { name: 'Open' });
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'With a menu inside' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  // No backdrop, and the page is not hidden from assistive technology.
  await expect(page.locator('[data-testid="underlay"]')).toHaveCount(0);
  await expect(page.locator('#storybook-root')).not.toHaveAttribute('inert');

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');

  // The trigger toggles it.
  await trigger.click();
  await expect(dialog).toBeVisible();
  await trigger.click();
  await expect(dialog).toHaveCount(0);
});

test('popover: a press outside closes it, and the page behind takes that press', async ({ page }) => {
  await open(page, 'overlays-popover--behaviour');
  await page.getByRole('button', { name: 'Open' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  // A press inside does not close it.
  await dialog.getByRole('heading').click();
  await expect(dialog).toBeVisible();

  // Pressing another trigger closes this popover and opens that one, in one press.
  await page.getByRole('button', { name: 'Stays on blur' }).click();
  await expect(page.getByRole('dialog', { name: 'With a menu inside' })).toHaveCount(0);
  await expect(page.getByRole('dialog', { name: 'dismissOnBlur off' })).toBeVisible();
});

test('popover: focus leaving closes it, unless dismissOnBlur is off; then Escape still closes it', async ({
  page,
}) => {
  await open(page, 'overlays-popover--behaviour');
  const elsewhere = page.getByRole('button', { name: 'Elsewhere on the page' });
  await page.getByRole('button', { name: 'Open' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeFocused();
  await elsewhere.focus();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(elsewhere).toBeFocused();

  await page.getByRole('button', { name: 'Stays on blur' }).focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'dismissOnBlur off' });
  await expect(dialog).toBeFocused();
  await elsewhere.focus();
  await page.waitForTimeout(300);
  await expect(dialog).toBeVisible();
  // Focus is on the page now; Escape closes the popover and leaves focus where it is.
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(elsewhere).toBeFocused();
});

test('popover: a menu opened inside it does not close it, and it flips when its side has no room', async ({
  page,
}) => {
  await open(page, 'overlays-popover--behaviour');
  await page.getByRole('button', { name: 'Open' }).click();
  const dialog = page.getByRole('dialog', { name: 'With a menu inside' });
  await dialog.getByRole('button', { name: 'Choose' }).click();
  await page.getByRole('menuitem', { name: 'Item 2' }).click();
  await expect(page.getByText('Last action: two')).toBeVisible();
  await expect(page.getByRole('menu')).toHaveCount(0);
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);

  // Asked to open above a trigger at the top of the window, it opens below.
  await page.getByRole('button', { name: 'Flips' }).click();
  await expect(page.getByRole('dialog', { name: 'Flips' })).toHaveAttribute('data-placement', 'bottom');
});

test('popover: a function child gets close; a label names a panel without a title; a plain button works', async ({
  page,
}) => {
  await open(page, 'overlays-popover--basic');
  const share = page.getByRole('dialog', { name: 'Share this view' });
  await expect(share).toBeVisible();
  await expect(share.getByRole('heading', { level: 2, name: 'Share this view' })).toBeVisible();
  await share.getByRole('button', { name: 'Copy link' }).click();
  await expect(page.getByText('Copied 1 times')).toBeVisible();

  const settingsTrigger = page.getByRole('button', { name: 'Settings' });
  await settingsTrigger.click();
  const settings = page.getByRole('dialog', { name: 'Settings' });
  await settings.getByRole('button', { name: 'Done' }).click();
  await expect(settings).toHaveCount(0);
  await expect(settingsTrigger).toBeFocused();

  const plain = page.getByRole('button', { name: 'A plain button' });
  await plain.focus();
  await page.keyboard.press('Enter');
  const fromPlain = page.getByRole('dialog', { name: 'From a plain button' });
  await expect(fromPlain).toBeFocused();
  await fromPlain.getByRole('button', { name: 'Close' }).click();
  await expect(fromPlain).toHaveCount(0);
  await expect(plain).toBeFocused();
});

test('popover: anchored to an element, it matches its width, scrolls inside its maximum height, and is controlled', async ({
  page,
}) => {
  await open(page, 'overlays-popover--anchored');
  const dialog = page.getByRole('dialog', { name: 'Details' });
  await expect(dialog).toBeVisible();
  const anchor = await box(page.getByText('The anchor'));
  const panel = await box(dialog);
  expect(Math.abs(panel.width - anchor.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(panel.y - (anchor.y + anchor.height + 8))).toBeLessThanOrEqual(1);
  expect(panel.height).toBeLessThanOrEqual(180);
  const viewport = dialog.locator('[data-part="body"] > [data-part="viewport"]');
  expect(await viewport.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  await expect(viewport).toHaveCSS('padding', '0px');

  await page.getByRole('button', { name: 'Toggle' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText('Open: no')).toBeVisible();
  await page.getByRole('button', { name: 'Toggle' }).click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByText('Open: no')).toBeVisible();
});

for (const [width, height] of [
  [1920, 1080],
  [1024, 600],
  // Narrower than the panel's own width: it takes the window's width, less a margin.
  [520, 600],
] as const) {
  test(`popover: the large panel stays in a ${width}x${height} window and scrolls its body`, async ({
    page,
  }) => {
    await open(page, 'overlays-popover--large', width, height);
    const dialog = page.getByRole('dialog', { name: 'Review notes' });
    const panel = await box(dialog);
    expect(panel.y + panel.height).toBeLessThanOrEqual(height);
    expect(panel.x + panel.width).toBeLessThanOrEqual(width);
    expect(panel.x).toBeGreaterThanOrEqual(0);
    for (const part of ['header', 'toolbar', 'body', 'footer']) {
      await expect(dialog.locator(`[data-part="${part}"]`).first()).toBeVisible();
    }
    // In the small window the body scrolls, and the footer stays in view below it.
    const viewport = dialog.locator('[data-part="body"] > [data-part="viewport"]');
    expect(await viewport.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(height === 600);
    const footer = await box(dialog.locator('[data-part="footer"]'));
    expect(footer.y + footer.height).toBeLessThanOrEqual(panel.y + panel.height);

    await dialog.getByRole('button', { name: 'Apply all actions' }).click();
    await expect(dialog.getByText('3 of 3 applied')).toBeVisible();
    await expect(dialog).toBeVisible();
  });
}

test('popover: parts and blocks', async ({ page }) => {
  await open(page, 'overlays-popover--parts-and-blocks');
  const parts = page.getByRole('dialog').nth(0);
  await expect(parts.locator('[data-part="header"]')).toHaveCount(0);
  await expect(parts.locator('[data-part="body"]')).toHaveAttribute('data-padding', 'none');
  await expect(parts.locator('[data-part="footer"]')).toHaveText('A footer from a node');

  const blocks = page.getByRole('dialog', { name: 'Built from blocks' });
  for (const part of ['header', 'toolbar', 'body', 'footer']) {
    await expect(blocks.locator(`[data-part="${part}"]`)).toHaveCount(1);
  }
  await blocks.getByRole('button', { name: 'Close', exact: true }).first().click();
  await expect(blocks).toHaveCount(0);
});

test('popover: it keeps the scope it was opened from, and its motion follows the reduced-motion setting', async ({
  page,
}) => {
  await open(page, 'overlays-popover--keeps-its-scope', 1280, 720, 'density:spacious;context:green');
  const fromPage = page.getByRole('dialog', { name: 'Page scope' });
  await expect(fromPage).toHaveAttribute('data-umbra-density', 'spacious');
  await expect(fromPage).toHaveAttribute('data-umbra-context', 'green');
  const scoped = page.getByRole('dialog', { name: 'Scope kept' });
  await expect(scoped).toHaveAttribute('data-umbra-density', 'compact');
  await expect(scoped).toHaveAttribute('data-umbra-context', 'teal');
  await expect(scoped).toHaveCSS('border-radius', '0px');
  await expect(fromPage).toHaveCSS('border-radius', '8px');

  // 180ms, and a slide that the motion scale removes.
  await expect(scoped).toHaveCSS('transition-duration', '0.18s, 0.18s');
  const scale = () => scoped.evaluate((el) => getComputedStyle(el).getPropertyValue('--umbra-motion-scale'));
  expect(await scale()).toBe('1');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await scale()).toBe('0');
});

// Tooltip

test('tooltip: shows on keyboard focus at once and on hover, describes its control, and Escape hides it', async ({
  page,
}) => {
  await open(page, 'overlays-tooltip--triggers');
  const tooltip = page.getByRole('tooltip');
  const button = page.getByRole('button', { name: 'Button', exact: true });
  await page.keyboard.press('Tab');
  await expect(button).toBeFocused();
  await expect(tooltip).toHaveText('On an umbra-ui button');
  const id = await tooltip.getAttribute('id');
  await expect(button).toHaveAttribute('aria-describedby', id!);
  await page.keyboard.press('Escape');
  await expect(tooltip).toHaveCount(0);

  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Plain' })).toBeFocused();
  await expect(tooltip).toHaveText('On a plain button');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Link' })).toBeFocused();
  await expect(tooltip).toHaveText('On a link');

  // Hover, after the delay.
  await page.locator('body').click({ position: { x: 600, y: 600 } });
  await expect(tooltip).toHaveCount(0);
  await page.getByRole('button', { name: 'Plain' }).hover();
  await expect(tooltip).toHaveText('On a plain button');
  await page.mouse.move(600, 600);
  await expect(tooltip).toHaveCount(0);
});

test('tooltip: a disabled control gets a focusable wrapper; a disabled or empty tooltip never shows', async ({
  page,
}) => {
  await open(page, 'overlays-tooltip--triggers');
  const tooltip = page.getByRole('tooltip');
  const wrapper = page.locator('[data-part="wrapper"]').first();
  await expect(wrapper).toHaveAttribute('aria-disabled', 'true');
  await expect(wrapper).toHaveAccessibleName('Disabled');
  await page.getByRole('link', { name: 'Link' }).focus();
  await page.keyboard.press('Tab');
  await expect(wrapper).toBeFocused();
  await expect(tooltip).toHaveText('Nothing to save yet');
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-part="wrapper"]').nth(1)).toBeFocused();
  await expect(page.locator('[data-part="wrapper"]').nth(1)).toHaveAccessibleName('Workspace settings');
  await expect(tooltip).toHaveText('You do not have access');
  await page.keyboard.press('Escape');
  await page.mouse.move(600, 600);
  await wrapper.hover();
  await expect(tooltip).toHaveText('Nothing to save yet');
  await page.mouse.move(600, 600);
  await expect(tooltip).toHaveCount(0);

  await page.getByRole('button', { name: 'Tooltip off' }).focus();
  await page.waitForTimeout(200);
  await expect(tooltip).toHaveCount(0);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Empty content' })).toBeFocused();
  await page.waitForTimeout(200);
  await expect(tooltip).toHaveCount(0);
});

test('tooltip: rich content, the key hint, parts, and the scope it was opened from', async ({ page }) => {
  await open(page, 'overlays-tooltip--plain-and-rich');
  const tooltips = page.getByRole('tooltip');
  await expect(tooltips).toHaveCount(3);
  await expect(tooltips.nth(1).locator('[data-part="hint"]')).toHaveText('Ctrl+S');
  const rich = tooltips.nth(2);
  await expect(rich).toHaveAttribute('data-rich', 'true');
  await expect(rich.locator('[data-part="title"]')).toHaveText('Projected value');
  await expect(rich.locator('[data-part="body"]')).toContainText('An estimate');
  // Nothing in a tooltip can take focus.
  expect(await rich.evaluate((el) => el.querySelectorAll('a, button, input, [tabindex]').length)).toBe(0);
  // It wraps instead of leaving the window.
  expect((await box(rich)).width).toBeLessThanOrEqual(320);

  await open(page, 'overlays-tooltip--triggers');
  await page.getByRole('button', { name: 'Parts' }).focus();
  const tooltip = page.getByRole('tooltip');
  await expect(tooltip.locator('[data-part="title"]')).toHaveCount(0);
  await expect(tooltip.locator('em[data-part="body"]')).toHaveText('Body from a function');
  await expect(tooltip.locator('[data-part="hint"]')).toHaveText('custom hint');

  await page.getByRole('button', { name: 'In a scope' }).focus();
  await expect(tooltip).toHaveText('Compact, from a teal scope');
  await expect(tooltip).toHaveAttribute('data-umbra-context', 'teal');
  await expect(tooltip).toHaveAttribute('data-umbra-density', 'compact');
  await expect(tooltip).toHaveCSS('border-radius', '0px');
});

test('tooltip: placement puts it on the asked side', async ({ page }) => {
  await open(page, 'overlays-tooltip--placements');
  const side = async (name: string) => {
    const trigger = await box(page.getByRole('button', { name, exact: true }));
    const tip = await box(page.getByRole('tooltip').filter({ hasText: new RegExp(`^Placed ${name}$`) }));
    return { trigger, tip };
  };
  const top = await side('top');
  expect(top.tip.y + top.tip.height).toBeLessThanOrEqual(top.trigger.y);
  const bottom = await side('bottom');
  expect(bottom.tip.y).toBeGreaterThanOrEqual(bottom.trigger.y + bottom.trigger.height);
  const start = await side('start');
  expect(start.tip.x + start.tip.width).toBeLessThanOrEqual(start.trigger.x);
  const end = await side('end');
  expect(end.tip.x).toBeGreaterThanOrEqual(end.trigger.x + end.trigger.width);
  const topStart = await side('top start');
  expect(Math.abs(topStart.tip.x - topStart.trigger.x)).toBeLessThanOrEqual(1);
  const bottomEnd = await side('bottom end');
  expect(
    Math.abs(bottomEnd.tip.x + bottomEnd.tip.width - (bottomEnd.trigger.x + bottomEnd.trigger.width)),
  ).toBeLessThanOrEqual(1);
});

// Menu

test('menu: arrow keys, Home and End, type-ahead, a skipped disabled row, Enter, and focus back on the trigger', async ({
  page,
}) => {
  await open(page, 'overlays-menu--closed');
  const trigger = page.getByRole('button', { name: 'Item actions' });
  await expect(trigger).toHaveAttribute('aria-haspopup', 'true');
  await trigger.focus();
  await page.keyboard.press('ArrowDown');
  const menu = page.getByRole('menu', { name: 'Item actions' });
  await expect(menu).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  const item = (name: string) => menu.getByRole('menuitem', { name });
  await expect(item('Rename')).toBeFocused();
  await expect(item('Rename').locator('[data-part="hint"]')).toHaveText('F2');
  await expect(item('Duplicate').locator('[data-part="hint"]')).toHaveText('Ctrl+D');
  await expect(item('Export').locator('[data-part="description"]')).toHaveText('As a spreadsheet');
  await expect(menu.getByRole('separator')).toHaveCount(1);
  await expect(menu.getByRole('group', { name: 'Danger zone' }).getByRole('menuitem')).toHaveCount(1);

  await page.keyboard.press('ArrowDown');
  await expect(item('Duplicate')).toBeFocused();
  await page.keyboard.press('End');
  await expect(item('Delete')).toBeFocused();
  await page.keyboard.press('Home');
  await expect(item('Rename')).toBeFocused();
  // Type-ahead.
  await page.keyboard.press('e');
  await expect(item('Export')).toBeFocused();
  // The disabled row is passed over.
  await expect(item('Archive')).toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('ArrowDown');
  await expect(item('Delete')).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(page.getByText('Last action: delete')).toBeVisible();
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();

  // Escape closes without an action; a press outside does too.
  await page.keyboard.press('Enter');
  await expect(menu).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.getByText('Last action: delete')).toBeVisible();
  await trigger.click();
  await expect(menu).toBeVisible();
  await page.mouse.click(900, 500);
  await expect(menu).toHaveCount(0);
});

test('menu: checkbox rows toggle and keep the menu open; radio rows are one group; a check marks them', async ({
  page,
}) => {
  await open(page, 'overlays-menu--selection-closed');
  await page.getByRole('button', { name: 'View options' }).click();
  const menu = page.getByRole('menu');
  const owner = menu.getByRole('menuitemcheckbox', { name: 'Owner' });
  const status = menu.getByRole('menuitemcheckbox', { name: 'Status' });
  await expect(menu.getByRole('group', { name: 'Columns' }).getByRole('menuitemcheckbox')).toHaveCount(3);
  await expect(status).toHaveAttribute('aria-checked', 'true');
  await expect(status.locator('[data-part="check"] svg')).toBeVisible();
  await expect(owner).toHaveAttribute('aria-checked', 'false');
  await expect(owner.locator('[data-part="check"] svg')).toHaveCount(0);
  // A plain row in the same menu keeps the gutter, so the labels line up.
  const reset = menu.getByRole('menuitem', { name: 'Reset view' });
  expect((await box(reset.locator('[data-part="label"]'))).x).toBe(
    (await box(owner.locator('[data-part="label"]'))).x,
  );

  await owner.click();
  await expect(owner).toHaveAttribute('aria-checked', 'true');
  await expect(menu).toBeVisible();
  await expect(page.getByText('Selected: status, owner, updated, regular')).toBeVisible();
  await status.focus();
  await page.keyboard.press('Space');
  await expect(status).toHaveAttribute('aria-checked', 'false');
  await expect(menu).toBeVisible();

  const radios = menu.getByRole('group', { name: 'Row height' }).getByRole('menuitemradio');
  await expect(radios).toHaveCount(3);
  await expect(radios.nth(1)).toHaveAttribute('aria-checked', 'true');
  await radios.nth(2).click();
  await expect(page.getByText('Selected: owner, updated, tall')).toBeVisible();
});

test('menu: submenus open with ArrowRight and Enter, close with ArrowLeft, and a leaf closes them all', async ({
  page,
}) => {
  await open(page, 'overlays-menu--submenus');
  const trigger = page.getByRole('button', { name: 'Column' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const menus = page.getByRole('menu');
  const insert = page.getByRole('menuitem', { name: 'Insert column' });
  await expect(insert).toBeFocused();
  await expect(insert).toHaveAttribute('aria-haspopup', 'menu');
  await expect(insert.locator('[data-part="submenuIndicator"]')).toBeVisible();

  await page.keyboard.press('ArrowRight');
  await expect(menus).toHaveCount(2);
  await expect(page.getByRole('menuitem', { name: 'General' })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(menus).toHaveCount(3);
  await expect(page.getByRole('menuitem', { name: 'Status field 1' })).toBeFocused();

  await page.keyboard.press('ArrowLeft');
  await expect(menus).toHaveCount(2);
  await expect(page.getByRole('menuitem', { name: 'Status', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Last action: insert-Status-2')).toBeVisible();
  await expect(menus).toHaveCount(0);
  await expect(trigger).toBeFocused();

  // With the pointer: hovering a row opens its submenu beside it, inside the window.
  await trigger.click();
  await insert.hover();
  await expect(menus).toHaveCount(2);
  const parent = await box(menus.nth(0));
  const sub = await box(menus.nth(1));
  expect(sub.x).toBeGreaterThanOrEqual(parent.x + parent.width - 8);
});

test('menu: rows with href are links, the current page is marked, and renderLink plugs in a router', async ({
  page,
}) => {
  await open(page, 'overlays-menu--links');
  const menu = page.getByRole('menu', { name: 'Go to' });
  const reports = menu.getByRole('menuitem', { name: 'Reports' });
  await expect(reports).toHaveAttribute('aria-current', 'page');
  await expect(reports).toHaveAttribute('href', '#reports');
  await expect(reports).toHaveCSS('font-weight', '700');
  expect(await reports.evaluate((el) => getComputedStyle(el).boxShadow)).toContain('inset');
  const summary = menu.getByRole('menuitem', { name: 'Summary' });
  await expect(summary).not.toHaveAttribute('aria-current');
  expect(await summary.evaluate((el) => el.tagName)).toBe('A');
  await expect(summary).toHaveAttribute('data-router-link', '');
  // A disabled link is not a link.
  await expect(menu.getByRole('menuitem', { name: 'Archive' })).not.toHaveAttribute('href');

  await summary.click();
  await expect(page.getByText('Current page: summary. The router went to: #summary')).toBeVisible();
  await expect(menu).toHaveCount(0);
  expect(new URL(page.url()).hash).toBe('');
});

test('menu: the block form, parts, a plain trigger and the empty text', async ({ page }) => {
  await open(page, 'overlays-menu--blocks-and-parts');
  const menu = page.getByRole('menu', { name: 'Built from blocks' });
  const pinned = menu.getByRole('menuitemcheckbox', { name: 'Pinned' });
  await expect(pinned).toHaveAttribute('aria-checked', 'true');
  await expect(menu.getByRole('group', { name: 'Share' }).getByRole('menuitem')).toHaveText([
    'Copy link',
    'Send to',
  ]);
  await pinned.click();
  await expect(page.getByText('Pinned: no')).toBeVisible();
  await menu.getByRole('menuitem', { name: 'Send to' }).click();
  await page.getByRole('menuitem', { name: 'Person B' }).click();
  await expect(page.getByText('Last action: send-b.')).toBeVisible();
  await expect(page.getByRole('menu')).toHaveCount(0);

  await page.getByRole('button', { name: 'Parts' }).click();
  const parts = page.getByRole('menu', { name: 'Parts' });
  await expect(
    parts.getByRole('menuitemcheckbox', { name: 'Item 1' }).locator('[data-custom-check]'),
  ).toHaveText('●');
  await expect(parts.getByRole('menuitemcheckbox', { name: 'Item 2' })).toHaveText('Item 2 (custom row)');
  await expect(parts.locator('[data-part="sectionHeader"]')).toHaveCount(0);
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'A plain button' }).click();
  await expect(page.getByRole('menu', { name: 'A plain button' })).toHaveText('Nothing here');
});

test('menu: a context menu opens at the pointer on a right click, and with Shift+F10 or the context-menu key', async ({
  page,
}) => {
  await open(page, 'overlays-menu--context-menu');
  const menu = page.getByRole('menu', { name: 'Row actions' });
  await page
    .getByText('Item 3')
    .first()
    .click({ button: 'right', position: { x: 20, y: 8 } });
  await expect(menu).toBeVisible();
  const target = await box(page.getByText('Item 3').first());
  const at = await box(page.locator('[data-umbra="menu"]'));
  expect(Math.abs(at.x - (target.x + 20))).toBeLessThanOrEqual(2);
  expect(Math.abs(at.y - (target.y + 8))).toBeLessThanOrEqual(2);
  await expect(menu.getByRole('menuitem', { name: 'Open' })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Last action: rename')).toBeVisible();
  await expect(menu).toHaveCount(0);

  const row = page.getByRole('button', { name: 'A focusable row' });
  for (const key of ['Shift+F10', 'ContextMenu']) {
    await row.focus();
    await page.keyboard.press(key);
    await expect(menu).toBeVisible();
    const anchor = await box(row);
    const opened = await box(page.locator('[data-umbra="menu"]'));
    expect(Math.abs(opened.y - (anchor.y + anchor.height))).toBeLessThanOrEqual(2);
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await expect(row).toBeFocused();
  }

  // Outside the region there is no menu.
  await page.getByRole('region', { name: 'No context menu here' }).click({ button: 'right' });
  await expect(menu).toHaveCount(0);
});

test('menu: a long menu is no taller than the window and scrolls to the focused row', async ({ page }) => {
  for (const height of [720, 400]) {
    await open(page, 'overlays-menu--long', 1280, height);
    const panel = await box(page.locator('[data-umbra="menu"]'));
    expect(panel.y + panel.height).toBeLessThanOrEqual(height);
    const list = page.getByRole('menu');
    expect(await list.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
    await list.focus();
    await page.keyboard.press('End');
    await expect(page.getByRole('menuitem', { name: 'Item 40' })).toBeFocused();
    await expect(page.getByRole('menuitem', { name: 'Item 40' })).toBeInViewport();
  }
  // A label wider than the menu may be is cut short with an ellipsis.
  expect((await box(page.locator('[data-umbra="menu"]'))).width).toBeLessThanOrEqual(360);
  const label = page.getByRole('menuitem', { name: /^Item 2,/ }).locator('[data-part="label"]');
  expect(await label.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  await expect(label).toHaveCSS('text-overflow', 'ellipsis');
});

test('menu: anchored to an element, it is named by label, as wide as the anchor and at its end', async ({
  page,
}) => {
  await open(page, 'overlays-menu--anchored');
  const menu = page.getByRole('menu', { name: 'Regions' });
  await expect(menu.getByRole('menuitem', { name: 'Region 1' })).toBeFocused();
  const anchor = await box(page.getByText('The anchor'));
  const panel = await box(page.locator('[data-umbra="menu"]'));
  expect(Math.abs(panel.width - anchor.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(panel.x + panel.width - (anchor.x + anchor.width))).toBeLessThanOrEqual(1);
  expect(Math.abs(panel.y - (anchor.y + anchor.height + 8))).toBeLessThanOrEqual(1);
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
});

test('overflow actions: buttons become menu items, a toggle a checkbox item and a Menu a submenu', async ({
  page,
}) => {
  await open(page, 'overlays-menu--overflow-actions');
  const card = page.locator('[data-umbra="card"]');
  await expect(card.getByRole('button', { name: 'Filter' })).toHaveCount(0);
  const more = card.getByRole('button', { name: 'More actions' });
  await more.focus();
  await page.keyboard.press('Enter');
  const menu = page.getByRole('menu', { name: 'More actions' });
  const filter = menu.getByRole('menuitem', { name: 'Filter' });
  await expect(filter).toBeFocused();
  await expect(filter.locator('svg')).toBeVisible();
  await expect(menu.getByRole('button')).toHaveCount(0);
  // A plain wrapper around buttons gives way to them; text among the actions is left out.
  await expect(menu.locator('[role^="menuitem"]')).toHaveCount(3);
  await expect(menu).not.toContainText('3 new');

  // Arrow keys and type-ahead work across the buttons.
  await page.keyboard.press('ArrowDown');
  const favourite = menu.getByRole('menuitemcheckbox', { name: 'Favourite' });
  await expect(favourite).toBeFocused();
  await expect(favourite).toHaveAttribute('aria-checked', 'false');
  // Space toggles and keeps the menu open (Enter would toggle and close it).
  await page.keyboard.press('Space');
  await expect(page.getByText('Favourite: yes')).toBeVisible();
  await expect(favourite).toHaveAttribute('aria-checked', 'true');
  await expect(favourite.locator('[data-part="check"] svg')).toBeVisible();
  await page.keyboard.press('e');
  const exportItem = menu.getByRole('menuitem', { name: 'Export' });
  await expect(exportItem).toBeFocused();
  await expect(exportItem).toHaveAttribute('aria-haspopup', 'menu');
  await page.keyboard.press('ArrowRight');
  await page.getByRole('menuitem', { name: 'As a document' }).click();
  await expect(page.getByText('Last action: Export pdf')).toBeVisible();
  await expect(page.getByRole('menu')).toHaveCount(0);

  await more.click();
  await filter.click();
  await expect(page.getByText('Last action: Filter')).toBeVisible();
  await expect(menu).toHaveCount(0);
  await expect(more).toBeFocused();
});

// Navigation dropdowns (PrimaryNav and SubNav), now menus

test('nav: the caret has its own name and a pointer target of at least 24px, without growing', async ({
  page,
}) => {
  for (const [story, label] of [
    ['shell-primarynav--items', 'Main'],
    ['shell-subnav--slots', 'Section'],
  ] as const) {
    await open(page, story);
    const nav = page.getByRole('navigation', { name: label });
    const caret = nav.locator('button[aria-haspopup="menu"][aria-label$=", submenu"]').first();
    const name = (await caret.getAttribute('aria-label'))!.replace(', submenu', '');
    await expect(nav.getByRole('link', { name, exact: true })).toBeVisible();
    await expect(nav.getByRole('button', { name: `${name}, submenu` })).toHaveCount(1);
    const size = await box(caret);
    const target = await caret.evaluate((el) => {
      const after = getComputedStyle(el, '::after');
      return { width: parseFloat(after.width), height: parseFloat(after.height) };
    });
    expect(target.width).toBeGreaterThanOrEqual(24);
    expect(target.height).toBeGreaterThanOrEqual(24);
    // A press beside the icon, inside the target, opens the dropdown; the link beside it is not covered.
    await page.mouse.click(size.x + 20, size.y + size.height / 2);
    await expect(page.getByRole('menu', { name })).toBeVisible();
    await page.keyboard.press('Escape');
    const link = await box(nav.getByRole('link', { name, exact: true }));
    expect(
      await page.evaluate(
        ([x, y]) => document.elementFromPoint(x!, y!)?.closest('a, button')?.tagName,
        [link.x + link.width - 2, link.y + link.height / 2],
      ),
    ).toBe('A');
  }
});

test('nav: a dropdown is a menu of links with arrow keys and type-ahead; the current page is marked', async ({
  page,
}) => {
  await open(page, 'shell-app-shell--full-screen', 1920, 1080);
  const nav = page.getByRole('navigation', { name: 'Main' });
  const caret = nav.getByRole('button', { name: 'Orders, submenu' });
  await caret.focus();
  await page.keyboard.press('ArrowDown');
  const menu = page.getByRole('menu', { name: 'Orders' });
  const open_ = menu.getByRole('menuitem', { name: 'Open orders' });
  await expect(open_).toBeFocused();
  await expect(open_).toHaveAttribute('href', '#open');
  await page.keyboard.press('r');
  const returns = menu.getByRole('menuitem', { name: 'Returns' });
  await expect(returns).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(menu).toHaveCount(0);

  // The chosen sub-page is the current one when the menu opens again.
  await caret.click();
  await expect(returns).toHaveAttribute('aria-current', 'page');
  await expect(open_).not.toHaveAttribute('aria-current');
  await page.keyboard.press('Escape');
  await expect(caret).toBeFocused();
});

test('nav: in "More", an item with sub-pages is a submenu that starts with its own page', async ({
  page,
}) => {
  await open(page, 'shell-app-shell--full-screen', 700, 600);
  const nav = page.getByRole('navigation', { name: 'Main' });
  await nav.getByRole('button', { name: 'More' }).click();
  const more = page.getByRole('menu', { name: 'More' });
  const orders = more.getByRole('menuitem', { name: 'Orders' });
  await expect(orders).toHaveAttribute('aria-haspopup', 'menu');
  await orders.click();
  const sub = page.getByRole('menu', { name: 'Orders' });
  await expect(sub.getByRole('menuitem')).toHaveText(['Orders', 'Open orders', 'Returns']);
  await expect(sub.getByRole('menuitem', { name: 'Orders', exact: true })).toHaveAttribute('href', '#orders');
  await sub.getByRole('menuitem', { name: 'Returns' }).click();
  await expect(page.getByRole('menu')).toHaveCount(0);
});

test('nav: submenuLabel names the caret, and textValue names an item whose label is a node', async ({
  page,
}) => {
  await open(page, 'shell-primarynav--submenu-label');
  const nav = page.getByRole('navigation', { name: 'Main' });
  const caret = nav.getByRole('button', { name: 'Pages under Orders' });
  await expect(caret).toHaveAttribute('aria-haspopup', 'menu');
  await caret.click();
  await expect(page.getByRole('menu', { name: 'Orders', exact: true }).getByRole('menuitem')).toHaveText([
    'Open orders',
    'Returns',
  ]);
});

// Card

test('card: the popover of a layout-collapsed card holds the one copy of its content, and the header toggles it', async ({
  page,
}) => {
  await open(page, 'layout-card--collapsed-actions');
  const card = page.locator('[data-umbra="card"][data-collapsed="layout"]');
  const header = card.getByRole('button', { name: 'Exports' });
  const bodies = page.locator('[data-part="body"]', { hasText: 'File 1' });
  await expect(bodies).toHaveCount(0);

  await header.click();
  const dialog = page.getByRole('dialog', { name: 'Show content' });
  await expect(dialog.locator('[data-part="body"]')).toHaveCount(1);
  await expect(bodies).toHaveCount(1);
  // The actions come before the body, and the panel is as wide as the card's header.
  const actions = await box(dialog.getByRole('button', { name: 'Refresh' }));
  const body = await box(dialog.locator('[data-part="body"]'));
  expect(actions.y + actions.height).toBeLessThanOrEqual(body.y);
  const header_ = await box(card.locator('[data-part="header"]'));
  expect(Math.abs((await box(dialog)).width - header_.width)).toBeLessThanOrEqual(1);
  // No id is repeated in the page.
  expect(
    await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
      return ids.length - new Set(ids).size;
    }),
  ).toBe(0);

  await header.click();
  await expect(dialog).toHaveCount(0);
  await expect(header).toHaveAttribute('aria-expanded', 'false');
});

// Placement at the window edges

test.describe('window edges', () => {
  /** Opens one control of a corner and returns its overlay. */
  const kinds = {
    popover: async (page: Page, corner: Locator) => {
      await corner.getByRole('button', { name: 'Popover' }).click();
      const overlay = page.locator('[data-umbra="popover"]');
      // The content arrives after the popover opened.
      await expect(overlay.getByText('Item 8')).toBeVisible();
      return overlay;
    },
    menu: async (page: Page, corner: Locator) => {
      await corner.getByRole('button', { name: 'Menu' }).click();
      return page.locator('[data-umbra="menu"]');
    },
    select: async (page: Page, corner: Locator) => {
      await corner.getByRole('button', { name: /Select/ }).click();
      return page.locator('[data-umbra="select-popover"]');
    },
    search: async (page: Page, corner: Locator) => {
      await corner.getByRole('combobox', { name: 'Search' }).click();
      await page.keyboard.press('ArrowDown');
      return page.locator('[data-umbra="search-field-suggestions"]');
    },
    tooltip: async (page: Page, corner: Locator) => {
      await corner.getByRole('button', { name: 'Tip' }).focus();
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Tab');
      return page.locator('[data-umbra="tooltip"]');
    },
  };
  for (const [width, height] of [
    [1280, 720],
    [1024, 600],
    // Short: no side has room for the whole list, so it is capped and scrolls inside.
    [1024, 300],
  ] as const) {
    for (const corner of ['top start', 'top end', 'bottom start', 'bottom end']) {
      test(`overlays at the ${corner} corner stay in a ${width}x${height} window and are not cut`, async ({
        page,
      }) => {
        await open(page, 'overlays-window-edges--corners', width, height);
        const group = page.locator(`[data-corner="${corner}"]`);
        for (const [kind, show] of Object.entries(kinds)) {
          const overlay = await show(page, group);
          await expect(overlay, kind).toBeVisible();
          // A late flip happens in the frame after a size change.
          await page.waitForTimeout(150);
          const rect = await box(overlay);
          const anchor = (await group.boundingBox())!;
          expect(rect.x, kind).toBeGreaterThanOrEqual(0);
          expect(rect.y, kind).toBeGreaterThanOrEqual(0);
          expect(rect.x + rect.width, kind).toBeLessThanOrEqual(width);
          expect(rect.y + rect.height, kind).toBeLessThanOrEqual(height);
          // On the side with room: below a control at the top, above one at the bottom.
          if (corner.startsWith('top'))
            expect(rect.y, kind).toBeGreaterThanOrEqual(anchor.y + anchor.height - 8);
          else expect(rect.y + rect.height, kind).toBeLessThanOrEqual(anchor.y + 8);
          // Nothing is cut without a way to reach it: the last row can be scrolled into the overlay.
          const reach = await overlay.evaluate((el) => {
            const rows = el.querySelectorAll('[role="option"], [role="menuitem"], [data-part="body"] div');
            const last = [...rows].at(-1);
            if (!last) return 0;
            last.scrollIntoView({ block: 'nearest' });
            const [a, b] = [last.getBoundingClientRect(), el.getBoundingClientRect()];
            return Math.max(a.bottom - b.bottom, b.top - a.top, 0);
          });
          expect(reach, kind).toBeLessThanOrEqual(1);
          await page.keyboard.press('Escape');
          await expect(overlay, kind).toHaveCount(0);
        }
      });
    }
  }
});
