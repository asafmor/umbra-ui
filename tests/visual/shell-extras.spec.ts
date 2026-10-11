import { expect, test, type Locator, type Page } from '@playwright/test';

// PrimaryAction, HistoryButtons, ShortcutBar and CommandPalette, the bars that hold them, and the
// shortcut registry's conflict rules: keyboard, focus, shrink steps and whatever a still image cannot show.
const open = async (page: Page, id: string, width = 1280, height = 720, globals = '') => {
  await page.setViewportSize({ width, height });
  await page.goto(`/iframe.html?id=${id}&viewMode=story${globals && `&globals=${globals}`}`);
  await page.locator('#storybook-root > *').first().waitFor();
  // No font face is loaded ahead of time: one that first loads when a menu opens must disturb nothing.
  await page.evaluate(() => document.fonts.ready);
};

/** WCAG contrast ratio of two `rgb()` colours. */
const contrast = (a: string, b: string) => {
  const luminance = (colour: string) => {
    const [r, g, bl] = colour
      .match(/[\d.]+/g)!
      .slice(0, 3)
      .map((v) => {
        const c = Number(v) / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * bl!;
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
};

/** True when every part of the element is inside the container: nothing of it is clipped. */
const inside = async (el: Locator, container: Locator) =>
  el.evaluate(
    (node, box) => {
      const a = node.getBoundingClientRect();
      const b = box!.getBoundingClientRect();
      return a.left >= b.left - 0.5 && a.right <= b.right + 0.5;
    },
    await container.elementHandle(),
  );

// PrimaryAction

test('primary action: a gradient from primary to primaryEnd, with 4.5:1 text on both ends, that darkens on hover', async ({
  page,
}) => {
  await open(page, 'shell-primaryaction--states');
  const button = page.getByRole('button', { name: 'Continue' }).first();
  const look = () =>
    button.evaluate((el) => {
      const style = getComputedStyle(el);
      return { image: style.backgroundImage, colour: style.color };
    });
  const rest = await look();
  const stops = rest.image.match(/rgba?\([^)]+\)|color\([^)]+\)|oklab\([^)]+\)/g)!;
  expect(rest.image).toContain('linear-gradient');
  expect(stops).toHaveLength(2);
  // The ends are the two tokens; read them as the browser resolves them.
  const ends = await page.evaluate(() => {
    const probe = document.body.appendChild(document.createElement('i'));
    const read = (token: string) => {
      probe.style.color = `var(${token})`;
      return getComputedStyle(probe).color;
    };
    const root = document.querySelector('[data-umbra="primary-action"]')!;
    root.appendChild(probe);
    const out = [read('--umbra-color-fixed-primary'), read('--umbra-color-fixed-primary-end')];
    probe.remove();
    return out;
  });
  expect(ends[0]).not.toBe(ends[1]);
  for (const end of ends) expect(contrast(rest.colour, end)).toBeGreaterThanOrEqual(4.5);

  await button.hover();
  await expect.poll(async () => (await look()).image).not.toBe(rest.image);
});

test('primary action: names and states (count, attention, loading, disabled, link, split menu)', async ({
  page,
}) => {
  await open(page, 'shell-primaryaction--states');
  await expect(page.getByRole('button', { name: 'Review items 3' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Answer first Needs attention' })).toBeVisible();
  await expect(
    page.locator('[data-umbra="primary-action"][data-attention] [data-part="attention"]'),
  ).toBeVisible();
  // Loading: still focusable, named as busy. (Playwright computes names itself and leaves the progress
  // element out, so the name is read from the browser.)
  const session = await page.context().newCDPSession(page);
  const { nodes } = await session.send('Accessibility.getFullAXTree');
  const names = nodes.filter((n) => n.role?.value === 'button').map((n) => n.name?.value);
  expect(names).toContain('Continuing Loading');
  const loading = page.getByRole('button', { name: /Continuing/ });
  await loading.focus();
  await expect(loading).toBeFocused();
  await expect(
    page.locator('[data-umbra="primary-action"][data-disabled]').getByRole('button'),
  ).toBeDisabled();
  await expect(page.getByRole('link', { name: 'Next page' })).toHaveAttribute('href', '#next');
  // The description is a second line under the label.
  const root = page.locator('[data-umbra="primary-action"]', { hasText: 'To Monday 12 October' });
  const label = await root.locator('[data-part="label"]').boundingBox();
  const description = await root.locator('[data-part="description"]').boundingBox();
  expect(description!.y).toBeGreaterThanOrEqual(label!.y + label!.height - 1);
  // Every action fills the height of its strip.
  for (const action of await page.locator('[data-umbra="primary-action"]').all()) {
    expect((await action.boundingBox())!.height).toBe(60);
  }
});

test('primary action: the description hides, then the label; the icon keeps the name and a tooltip', async ({
  page,
}) => {
  await open(page, 'shell-primaryaction--shrink');
  const actions = page.locator('[data-umbra="primary-action"]');
  await expect(actions.nth(0).locator('[data-part="description"]')).toBeVisible();
  await expect(actions.nth(1).locator('[data-part="description"]')).toHaveCount(0);
  await expect(actions.nth(1).locator('[data-part="label"]')).toBeVisible();
  await expect(actions.nth(1)).not.toHaveAttribute('data-collapsed');
  await expect(actions.nth(2)).toHaveAttribute('data-collapsed', 'true');
  await expect(actions.nth(2).locator('[data-part="label"]')).toHaveCount(0);
  const icon = actions.nth(2).getByRole('button', { name: 'Continue' });
  await icon.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('tooltip')).toHaveText('Continue');
  // The count and the marker stay, on the corner of the icon.
  await expect(actions.nth(3).getByRole('button', { name: 'Review items 3' })).toBeVisible();
  await expect(actions.nth(3).locator('[data-part="badge"]')).toBeVisible();
  await expect(actions.nth(4).locator('[data-part="attention"]')).toBeVisible();
  // `collapsed` forces it, with room to spare.
  await expect(actions.nth(5)).toHaveAttribute('data-collapsed', 'true');
  // Without an icon the label truncates.
  await expect(actions.nth(6)).toHaveAttribute('data-truncate', 'true');
  const label = actions.nth(6).locator('[data-part="label"]');
  expect(await label.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  for (const action of await actions.all()) {
    expect(await action.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
  }
});

test('primary action: press, shortcut and menu report; loading blocks the press and the shortcut', async ({
  page,
}) => {
  await open(page, 'shell-primaryaction--behaviour');
  const log = page.getByText(/^Last action:/);
  const button = page.getByRole('button', { name: /^Continue/ });
  await button.click();
  await expect(log).toHaveText('Last action: Continue');

  const caret = page.getByRole('button', { name: 'More actions' });
  await caret.focus();
  await page.keyboard.press('Enter');
  await page.getByRole('menuitem', { name: 'Pause here' }).click();
  await expect(log).toHaveText('Last action: pause');
  await expect(caret).toBeFocused();

  // A focused button handles Enter itself, so the shortcut is tried from the page.
  await caret.blur();
  await page.keyboard.press('Control+Enter');
  await expect(log).toHaveText('Last action: Continue');
  // The tooltip shows the keys.
  await button.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('tooltip').locator('kbd')).toHaveText('Ctrl+Enter');

  await caret.click();
  await page.getByRole('menuitem', { name: 'Pause here' }).click();
  await caret.click();
  await page.getByRole('menuitem', { name: 'Start working' }).click();
  const working = page.getByRole('button', { name: /Working/ });
  await expect(working).toHaveAttribute('data-pending', 'true');
  await working.click({ force: true });
  await working.focus();
  await page.keyboard.press('Enter');
  await working.blur();
  await page.keyboard.press('Control+Enter');
  await expect(log).toHaveText('Last action: pause');
});

test('primary action: parts replace, change and hide pieces', async ({ page }) => {
  await open(page, 'shell-primaryaction--parts');
  const first = page.locator('[data-umbra="primary-action"]').nth(0);
  await expect(first.locator('[data-part="icon"]')).toHaveText('GO');
  await expect(first.locator('[data-part="label"]')).toHaveText('Continue!');
  await expect(first.locator('[data-part="badge"]')).toHaveText('[12]');
  await expect(first.locator('[data-part="description"]')).toHaveCount(0);
  const second = page.locator('[data-umbra="primary-action"]').nth(1);
  await expect(second.locator('[data-part="attention"]')).toHaveText('!');
  await expect(second.locator('[data-part="menuTrigger"]')).toHaveText('+');
});

// HistoryButtons

test('history buttons: router mode moves, disables at the ends, and binds Alt+Left and Alt+Right', async ({
  page,
}) => {
  await open(page, 'shell-historybuttons--entries');
  const group = page.getByRole('group', { name: 'History' });
  const back = group.getByRole('button', { name: 'Back' });
  const forward = group.getByRole('button', { name: 'Forward' });
  const place = page.getByText(/^Place:/);
  await expect(place).toHaveText('Place: Open orders. Last: none');
  await back.click();
  await expect(place).toHaveText('Place: Orders. Last: back');
  await page.keyboard.press('Alt+ArrowLeft');
  await expect(place).toHaveText('Place: Overview. Last: back');
  await expect(back).toBeDisabled();
  // Disabled, the key does nothing either.
  await page.keyboard.press('Alt+ArrowLeft');
  await expect(place).toHaveText('Place: Overview. Last: back');
  await page.keyboard.press('Alt+ArrowRight');
  await expect(place).toHaveText('Place: Orders. Last: forward');

  // The tooltip shows the keys.
  await forward.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('tooltip')).toContainText('Forward');
  await expect(page.getByRole('tooltip').locator('kbd')).toHaveText('Alt+→');

  // Never while typing in a field: there the keys move the caret.
  await page.getByLabel('Notes').focus();
  await page.keyboard.press('Alt+ArrowLeft');
  await page.keyboard.press('Alt+ArrowRight');
  await expect(place).toHaveText('Place: Orders. Last: forward');
});

test('history buttons: recent entries open from the caret, a right click and a long press', async ({
  page,
}) => {
  await open(page, 'shell-historybuttons--entries');
  const group = page.getByRole('group', { name: 'History' });
  const place = page.getByText(/^Place:/);
  const menu = page.getByRole('menu', { name: 'Recent' });

  await group.getByRole('button', { name: 'Recent' }).click();
  // Newest first, without the current place.
  await expect(menu.getByRole('menuitem')).toHaveText(['Settings', 'Reports', 'Orders', 'Overview']);
  await menu.getByRole('menuitem', { name: 'Reports' }).click();
  await expect(place).toHaveText('Place: Reports. Last: entry Reports');
  await expect(menu).toHaveCount(0);

  await group.getByRole('button', { name: 'Back' }).click({ button: 'right' });
  await expect(menu).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);

  // A long press opens the entries and does not navigate.
  const box = (await group.getByRole('button', { name: 'Back' }).boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(menu).toBeVisible();
  await page.mouse.up();
  await expect(place).toHaveText('Place: Reports. Last: entry Reports');
  await expect(menu).toBeVisible();
});

test('history buttons: on their own they follow and drive the browser history', async ({ page }) => {
  await open(page, 'shell-historybuttons--browser');
  const back = page.getByRole('button', { name: 'Back' });
  const forward = page.getByRole('button', { name: 'Forward' });
  // Chromium has the Navigation API: a fresh page has nowhere to go.
  await expect(back).toBeDisabled();
  await expect(forward).toBeDisabled();
  await page.getByRole('link', { name: 'Go to #one' }).click();
  await expect(back).toBeEnabled();
  await back.click();
  await expect.poll(() => new URL(page.url()).hash).toBe('');
  await expect(forward).toBeEnabled();
  await expect(back).toBeDisabled();
  await page.keyboard.press('Alt+ArrowRight');
  await expect.poll(() => new URL(page.url()).hash).toBe('#one');
});

test('history buttons: labels, icons and no keys through props and parts', async ({ page }) => {
  await open(page, 'shell-historybuttons--parts');
  const group = page.getByRole('group', { name: 'Places' });
  await expect(group.getByRole('button', { name: 'Next place' })).toBeDisabled();
  const back = group.getByRole('button', { name: 'Previous place' });
  await expect(back.locator('svg.lucide-chevron-left')).toBeVisible();
  await back.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('tooltip')).toHaveText('Previous place');
  await expect(group.getByRole('button', { name: 'Places' }).locator('svg.lucide-history')).toBeVisible();
});

// ShortcutBar

test('shortcut bar: a toolbar with one tab stop and arrow keys; links, buttons, counts and icon-only names', async ({
  page,
}) => {
  await open(page, 'shell-shortcutbar--modes');
  const bars = page.getByRole('toolbar', { name: 'Shortcuts' });
  await expect(bars).toHaveCount(4);
  const first = bars.nth(0);
  await expect(first).toHaveAttribute('data-mode', 'labels');
  await expect(first.getByRole('link')).toHaveText(['Inbox8', 'Team', 'Directory', 'Calendar', 'Reports']);
  await expect(first.getByRole('link', { name: 'Inbox 8' })).toHaveAttribute('href', '#inbox');

  await page.keyboard.press('Tab');
  await expect(first.getByRole('link', { name: 'Inbox 8' })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(first.getByRole('link', { name: 'Directory' })).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(first.getByRole('link', { name: 'Team' })).toBeFocused();
  // Tab leaves the toolbar for the next one, whose icons are named by their labels.
  await page.keyboard.press('Tab');
  const icons = bars.nth(1);
  await expect(icons).toHaveAttribute('data-mode', 'icons');
  await expect(icons.getByRole('link', { name: 'Inbox 8' })).toBeFocused();
  await expect(icons.locator('[data-part="label"]')).toHaveCount(0);
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tooltip')).toHaveText('Team');
  // Shift+Tab comes back to the item that had the focus.
  await page.keyboard.press('Shift+Tab');
  await expect(first.getByRole('link', { name: 'Team' })).toBeFocused();

  const last = bars.nth(3);
  await expect(last.getByRole('button', { name: 'Team' })).toBeDisabled();
  await expect(last.getByRole('button', { name: 'Refresh' })).toBeVisible();
  await expect(last.getByRole('button', { name: 'Edit shortcuts' })).toBeVisible();
});

test('shortcut bar: labels go first, then items move into the "+N" menu; nothing is clipped', async ({
  page,
}) => {
  await open(page, 'shell-shortcutbar--overflow');
  const bars = page.locator('[data-umbra="shortcut-bar"]');
  const shape = async (bar: Locator) => ({
    mode: await bar.getAttribute('data-mode'),
    items: await bar.locator('[data-part="item"]').count(),
    more: await bar.locator('[data-part="more"]').allTextContents(),
  });
  expect(await shape(bars.nth(0))).toEqual({ mode: 'labels', items: 5, more: [] });
  expect(await shape(bars.nth(1))).toEqual({ mode: 'icons', items: 5, more: [] });
  expect(await shape(bars.nth(2))).toEqual({ mode: 'icons', items: 5, more: [] });
  expect(await shape(bars.nth(3))).toEqual({ mode: 'icons', items: 2, more: ['+3'] });
  expect(await shape(bars.nth(4))).toEqual({ mode: 'icons', items: 0, more: ['+5'] });
  // Without icons, items go straight into the menu.
  expect(await shape(bars.nth(5))).toEqual({ mode: 'labels', items: 5, more: [] });
  expect(await shape(bars.nth(6))).toEqual({ mode: 'labels', items: 2, more: ['+3'] });

  // Every control is fully inside its bar, and every bar inside its strip.
  for (const bar of await bars.all()) {
    for (const control of await bar.locator('a, button').all()) expect(await inside(control, bar)).toBe(true);
    expect(await inside(bar, bar.locator('xpath=..'))).toBe(true);
  }

  // The menu holds the items that moved, in order, and they work as links.
  const more = bars.nth(3).getByRole('button', { name: '3 more shortcuts' });
  await more.focus();
  await page.keyboard.press('Enter');
  const menu = page.getByRole('menu');
  await expect(menu.getByRole('menuitem')).toHaveText(['Directory', 'Calendar', 'Reports']);
  await expect(menu.getByRole('menuitem', { name: 'Calendar' })).toHaveAttribute('href', '#calendar');
  await page.keyboard.press('Escape');
  await expect(more).toBeFocused();
  // The "+N" chip and the edit button are part of the same tab stop.
  await page.keyboard.press('ArrowRight');
  await expect(bars.nth(3).getByRole('button', { name: 'Edit shortcuts' })).toBeFocused();
});

test('shortcut bar: blocks, a router link, parts, translated texts, and presses from the bar and the menu', async ({
  page,
}) => {
  await open(page, 'shell-shortcutbar--blocks');
  const bar = page.getByRole('toolbar', { name: 'Pinned' });
  const log = page.getByText(/^Last action:/);
  await bar.getByRole('button', { name: 'Inbox 2' }).click();
  await expect(log).toHaveText('Last action: inbox');
  await expect(bar.getByRole('link', { name: 'Team' })).toHaveAttribute('data-router-link', '');
  await expect(bar.getByRole('link', { name: 'Team' }).locator('u')).toHaveText('Team');
  const more = bar.locator('[data-part="more"]');
  await expect(more.locator('b')).toHaveText(/^\(\+\d\)$/);
  await expect(more).toHaveAccessibleName(/^\d more$/);
  await more.click();
  const menu = page.getByRole('menu');
  await expect(menu.getByRole('menuitem', { name: 'Reports' })).toContainText('4');
  await menu.getByRole('menuitem', { name: 'Reports' }).click();
  await expect(log).toHaveText('Last action: reports');
  await bar.getByRole('button', { name: 'Change pinned' }).click();
  await expect(log).toHaveText('Last action: edit');
  await expect(
    bar.getByRole('button', { name: 'Change pinned' }).locator('svg.lucide-settings-2'),
  ).toBeVisible();
});

// SubNav with a ShortcutBar

test('sub nav: the shortcuts shed labels and then items before any page moves; the end slot clips nothing', async ({
  page,
}) => {
  await open(page, 'shell-subnav--shrink');
  const bars = page.locator('[data-umbra="sub-nav"]');
  const shortcuts = (i: number) => bars.nth(i).locator('[data-umbra="shortcut-bar"]');
  await expect(shortcuts(0)).toHaveAttribute('data-mode', 'labels');
  await expect(shortcuts(1)).toHaveAttribute('data-mode', 'icons');
  await expect(shortcuts(1).locator('[data-part="more"]')).toHaveCount(0);
  await expect(bars.nth(1).getByRole('button', { name: 'More', exact: true })).toHaveCount(0);
  // Pages only move once the shortcuts are down to their "+N" chip.
  await expect(shortcuts(2).locator('[data-part="more"]')).toHaveText('+3');
  await expect(shortcuts(2).locator('[data-part="item"]')).toHaveCount(0);
  await expect(bars.nth(2).getByRole('button', { name: 'More', exact: true })).toBeVisible();

  for (const bar of await bars.all()) {
    const end = bar.locator('[data-part="end"]');
    expect(await end.evaluate((el) => getComputedStyle(el).overflow)).toBe('visible');
    for (const control of await end.locator('a, button').all()) {
      expect(await inside(control, end)).toBe(true);
      expect(await inside(control, bar)).toBe(true);
    }
  }
});

test('app shell: the shortcuts come back when the window grows again', async ({ page }) => {
  await open(page, 'shell-app-shell--full-screen', 1920, 1080);
  const bar = page.locator('[data-umbra="shortcut-bar"]');
  await expect(bar).toHaveAttribute('data-mode', 'labels');
  await expect(bar.locator('[data-part="item"]')).toHaveCount(5);
  await page.setViewportSize({ width: 700, height: 600 });
  await expect(bar).toHaveAttribute('data-mode', 'icons');
  await page.setViewportSize({ width: 560, height: 600 });
  await expect(bar.locator('[data-part="more"]')).toBeVisible();
  await page.setViewportSize({ width: 1920, height: 1080 });
  await expect(bar).toHaveAttribute('data-mode', 'labels');
  await expect(bar.locator('[data-part="item"]')).toHaveCount(5);
  await expect(bar.locator('[data-part="more"]')).toHaveCount(0);
});

// TopBar

test('top bar: built from blocks only, it takes every shrink step', async ({ page }) => {
  await open(page, 'shell-topbar--blocks', 1920, 1080);
  const bar = page.locator('[data-umbra="top-bar"]');
  for (const part of ['start', 'logo', 'nav', 'end', 'actions', 'context', 'primaryAction']) {
    await expect(bar.locator(`[data-part="${part}"]`)).toHaveCount(1);
  }
  await expect(bar).toHaveAttribute('data-shrink', '0');
  const level = async (width: number) => {
    await page.setViewportSize({ width, height: 600 });
    // The bar settles before the next frame is painted.
    await page.evaluate(
      () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
    );
    return bar.getAttribute('data-shrink');
  };
  // Find a width for each step by narrowing, and check what the step did.
  const seen = new Map<string, number>();
  for (let width = 1400; width >= 360; width -= 20) {
    const step = (await level(width))!;
    if (!seen.has(step)) seen.set(step, width);
  }
  expect([...seen.keys()]).toEqual(['0', '1', '2', '3', '4']);

  await level(seen.get('1')!);
  await expect(bar.locator('[data-part="context"]')).toHaveCount(0);
  await expect(bar.getByRole('button', { name: 'Settings' })).toBeVisible();
  await level(seen.get('2')!);
  await expect(bar.getByRole('button', { name: 'Settings' })).toHaveCount(0);
  await expect(bar.getByRole('button', { name: 'Search' })).toBeVisible();
  await expect(bar.getByRole('button', { name: 'More tools' })).toBeVisible();
  await level(seen.get('3')!);
  await expect(bar.getByRole('navigation').getByRole('button', { name: 'More' })).toBeVisible();
  await expect(bar.locator('[data-umbra="primary-action"]')).not.toHaveAttribute('data-collapsed');
  await level(seen.get('4')!);
  await expect(bar.locator('[data-umbra="primary-action"]')).toHaveAttribute('data-collapsed', 'true');
  await expect(bar.getByRole('button', { name: 'Sign off' })).toBeVisible();
  expect(await bar.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);

  // The block's search trigger opens its palette.
  await page.setViewportSize({ width: 1400, height: 720 });
  await bar.getByRole('button', { name: 'Search' }).click();
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible();
});

test('top bar: the primary action fills the bar to the window edge, and is as wide as the bar is tall when collapsed', async ({
  page,
}) => {
  await open(page, 'shell-app-shell--bars-shrink');
  const bars = page.locator('[data-umbra="top-bar"]');
  const first = (await bars.nth(0).boundingBox())!;
  const action = (await bars.nth(0).locator('[data-umbra="primary-action"]').boundingBox())!;
  expect(action.height).toBe(first.height);
  expect(Math.round(action.x + action.width)).toBe(Math.round(first.x + first.width));
  const collapsed = bars.nth(4).locator('[data-umbra="primary-action"]');
  await expect(collapsed).toHaveAttribute('data-collapsed', 'true');
  const box = (await collapsed.boundingBox())!;
  expect(box.width).toBe(box.height);
});

test('top bar: edge cases without a nav and after the last step; a custom primary action is left as it is', async ({
  page,
}) => {
  await open(page, 'shell-topbar--edge-cases');
  const bars = page.locator('[data-umbra="top-bar"]');
  await expect(bars.nth(0)).toHaveAttribute('data-shrink', '2');
  await expect(bars.nth(1)).toHaveAttribute('data-shrink', '4');
  expect(await bars.nth(1).evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
  // After the last step the bar clips at its end; it never grows past its slot.
  await expect(bars.nth(2)).toHaveAttribute('data-shrink', '4');
  expect((await bars.nth(2).boundingBox())!.width).toBe(220);
  const custom = bars.nth(3).locator('[data-part="primaryAction"]');
  await expect(custom).toHaveText('Custom node');
  const slot = (await custom.boundingBox())!;
  const node = (await custom.locator('b').boundingBox())!;
  expect(node.height).toBeLessThan(slot.height);
  expect(node.x + node.width).toBeLessThan(slot.x + slot.width);
});

test('top bar: its own tokens set the size of the actions and the logo from an ancestor', async ({
  page,
}) => {
  await open(page, 'shell-topbar--slots', 1920, 1080);
  const bar = page.locator('[data-umbra="top-bar"]');
  const settings = bar.getByRole('button', { name: 'Settings' });
  expect((await settings.boundingBox())!.width).toBe(36);
  // No part of the bars declares another component's token.
  for (const part of ['primaryAction', 'actions', 'start']) {
    const declared = await bar
      .locator(`[data-part="${part}"]`)
      .evaluate((el) => getComputedStyle(el).getPropertyValue('--umbra-button-height'));
    expect(declared).toBe('');
  }
  await page.evaluate(() => {
    const root = document.querySelector<HTMLElement>('[data-umbra-root]')!;
    root.style.setProperty('--umbra-topbar-action-size', '44px');
    root.style.setProperty('--umbra-topbar-logo-size', '32px');
  });
  expect((await settings.boundingBox())!.width).toBe(44);
  expect((await bar.locator('[data-part="logo"]').boundingBox())!.width).toBe(32);
});

test('top bar: the search trigger and Mod+K open the command palette, and focus returns to the trigger', async ({
  page,
}) => {
  await open(page, 'shell-topbar--with-command-palette', 1920, 1080);
  const trigger = page.getByRole('button', { name: 'Search' });
  const dialog = page.getByRole('dialog', { name: 'Command palette' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('combobox')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();

  await page.keyboard.press('Control+k');
  await expect(dialog).toBeVisible();
  // The same keys close it again.
  await page.keyboard.press('Control+k');
  await expect(dialog).toHaveCount(0);
  // The tooltip of the trigger shows the keys.
  await expect(trigger).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('tooltip').locator('kbd')).toHaveText('Ctrl+K');
});

// CommandPalette

const palette = (page: Page) => {
  const dialog = page.getByRole('dialog', { name: 'Command palette' });
  const input = dialog.getByRole('combobox');
  const options = dialog.getByRole('option');
  /** The option the input points at. */
  const active = async () => {
    const id = await input.getAttribute('aria-activedescendant');
    return id ? page.locator(`[id="${id}"]`).locator('[data-part="label"]').textContent() : null;
  };
  return { dialog, input, options, active };
};

test('command palette: a modal near the top; focus stays in the input while the arrow keys move through the options', async ({
  page,
}) => {
  await open(page, 'overlays-commandpalette--default');
  const { dialog, input, options, active } = palette(page);
  await expect(dialog).toBeVisible();
  await expect(input).toBeFocused();
  await expect(input).toHaveAttribute('aria-expanded', 'true');
  await expect(input).toHaveAttribute('aria-autocomplete', 'list');
  const listId = await input.getAttribute('aria-controls');
  await expect(page.locator(`[id="${listId}"]`)).toHaveRole('listbox');
  // The page behind is inert, and the panel sits in the upper part of the window.
  await expect(page.locator('#storybook-root')).toHaveAttribute('inert');
  const panel = (await page.locator('[data-umbra="command-palette"]').boundingBox())!;
  expect(panel.y).toBeLessThan(720 * 0.2);
  expect(panel.x + panel.width / 2).toBeCloseTo(640, 0);

  // Recent first, then the sections.
  await expect(dialog.getByRole('group').first()).toHaveAccessibleName('Recent');
  await expect(options.first()).toHaveAttribute('aria-selected', 'true');
  expect(await active()).toBe('Export report');
  await page.keyboard.press('ArrowDown');
  expect(await active()).toBe('Orders');
  await expect(input).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  // Wraps to the last one.
  expect(await active()).toBe('Person F');
  await page.keyboard.press('Home');
  expect(await active()).toBe('Export report');
  await page.keyboard.press('End');
  expect(await active()).toBe('Person F');
  // The active option is scrolled into view.
  const results = dialog.getByRole('listbox');
  expect(await inside(options.last(), results)).toBe(true);
  expect(await results.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await page.keyboard.press('PageUp');
  const afterPage = await active();
  expect(afterPage).not.toBe('Person F');
  await page.keyboard.press('PageDown');
  expect(await active()).toBe('Person F');
  // A disabled command is passed over.
  await page.keyboard.press('Home');
  const seen: (string | null)[] = [];
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('ArrowDown');
    seen.push(await active());
  }
  expect(seen).toContain('Export report');
  expect(seen).not.toContain('Invite a person');
  await expect(dialog.getByRole('option', { name: 'Invite a person' })).toHaveAttribute(
    'aria-disabled',
    'true',
  );

  // Hover moves the active option; the footer shows the keys.
  await dialog.getByRole('option', { name: 'Overview' }).hover();
  expect(await active()).toBe('Overview');
  await expect(dialog.locator('[data-part="footer"]')).toContainText('Enter Run');
});

test('command palette: Enter runs and closes; Escape, an outside press and Mod+K close; focus returns', async ({
  page,
}) => {
  await open(page, 'overlays-commandpalette--default');
  const { dialog, input } = palette(page);
  const log = page.getByText(/^Last command:/);
  await page.keyboard.press('Enter');
  await expect(dialog).toHaveCount(0);
  await expect(log).toContainText('Last command: Export report.');

  const opener = page.getByRole('button', { name: 'Open the palette' });
  await opener.focus();
  await page.keyboard.press('Enter');
  await expect(input).toBeFocused();
  // It opens fresh: an empty input on the first page.
  await expect(input).toHaveValue('');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();

  await page.keyboard.press('Control+k');
  await expect(dialog).toBeVisible();
  await page.mouse.click(20, 700);
  await expect(dialog).toHaveCount(0);
  await page.keyboard.press('Control+k');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Control+k');
  await expect(dialog).toHaveCount(0);

  // A command with `href` goes through `navigate`; a click runs like Enter.
  await opener.click();
  await dialog.getByRole('option', { name: 'Settings' }).click();
  await expect(log).toContainText('Last command: Settings (#settings).');
  // A disabled command does nothing.
  await opener.click();
  await dialog.getByRole('option', { name: 'Invite a person' }).click({ force: true });
  await expect(dialog).toBeVisible();
  await expect(log).toContainText('Last command: Settings (#settings).');
});

test('command palette: focus leaves the input as soon as it starts to close', async ({ page }) => {
  await open(page, 'overlays-commandpalette--default');
  const { dialog, input } = palette(page);
  const opener = page.getByRole('button', { name: 'Open the palette' });
  await expect(input).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await opener.focus();
  await page.keyboard.press('Enter');
  await expect(input).toBeFocused();
  // Let it finish opening: closed while it still enters, it leaves the page at once.
  await page.waitForTimeout(350);
  // Running a command starts the 240ms exit. Every frame of it is recorded in the page: where the
  // focus is while the panel is still there.
  await page.evaluate(() => {
    const frames: string[] = [];
    (window as unknown as { paletteFrames: string[] }).paletteFrames = frames;
    const record = () => {
      const active = document.activeElement;
      const where = active?.matches('input, textarea')
        ? 'input'
        : active?.textContent?.startsWith('Open the palette')
          ? 'opener'
          : 'elsewhere';
      if (!document.querySelector('[data-umbra="command-palette"]')) return frames.push('gone');
      frames.push(where);
      requestAnimationFrame(record);
    };
    requestAnimationFrame(record);
  });
  await page.keyboard.press('Enter');
  await expect(dialog).toHaveCount(0);
  const frames = await page.evaluate(() => (window as unknown as { paletteFrames: string[] }).paletteFrames);
  const left = frames.indexOf('opener');
  // Focus is back on the opener within a few frames, long before the panel has gone: a bare-key
  // shortcut pressed then is not taken for typing in the input.
  expect(left).toBeGreaterThanOrEqual(0);
  expect(left).toBeLessThanOrEqual(4);
  expect(frames.indexOf('gone') - left).toBeGreaterThan(6);
  expect(frames.slice(left, -1).every((where) => where === 'opener')).toBe(true);
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test('command palette: typing filters and ranks, keywords match, and nothing matching says so', async ({
  page,
}) => {
  await open(page, 'overlays-commandpalette--default');
  const { dialog, input, options, active } = palette(page);
  await input.fill('ord');
  // Prefix, then word start, then inside the label; sections follow their best match.
  await expect(options.locator('[data-part="label"]')).toHaveText([
    'Orders',
    'Open orders',
    'Records',
    'New order',
  ]);
  await expect(dialog.getByRole('group')).toHaveCount(2);
  expect(await active()).toBe('Orders');
  // "Recent" is only for an empty input.
  await expect(dialog.getByRole('group', { name: 'Recent' })).toHaveCount(0);
  await input.fill('csv');
  await expect(options.locator('[data-part="label"]')).toHaveText(['Export report']);
  // Key hints from the registry sit at the end of the row.
  await expect(options.first().locator('kbd')).toHaveText('Ctrl+E');
  await input.fill('zzz');
  await expect(options).toHaveCount(0);
  await expect(dialog.getByRole('status')).toHaveText('No results');
  await expect(input).not.toHaveAttribute('aria-activedescendant');
  await page.keyboard.press('Enter');
  await expect(dialog).toBeVisible();
});

test('command palette: a command with children opens a page; Backspace and Escape go back; keepOpen keeps it open', async ({
  page,
}) => {
  await open(page, 'overlays-commandpalette--default');
  const { dialog, input, options } = palette(page);
  const log = page.getByText(/^Last command:/);
  await input.fill('density');
  await page.keyboard.press('Enter');
  await expect(dialog).toBeVisible();
  await expect(input).toHaveValue('');
  await expect(dialog.locator('[data-part="breadcrumb"]')).toHaveText(['Change density']);
  await expect(options.locator('[data-part="label"]')).toHaveText(['Compact', 'Default', 'Spacious']);
  await expect(dialog.locator('[data-part="footer"]')).toContainText('Backspace Back');

  // Backspace in a non-empty input only edits it.
  await input.pressSequentially('sp');
  await expect(options).toHaveCount(1);
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
  await expect(dialog.locator('[data-part="breadcrumb"]')).toHaveCount(1);
  await page.keyboard.press('Backspace');
  await expect(dialog.locator('[data-part="breadcrumb"]')).toHaveCount(0);
  await expect(dialog.getByRole('option', { name: 'Overview' })).toBeVisible();

  // Escape leaves the page first, and closes only from the first page.
  await input.fill('density');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('[data-part="breadcrumb"]')).toHaveCount(0);

  // The breadcrumb goes back too, and the input keeps the focus.
  await input.fill('density');
  await page.keyboard.press('Enter');
  await dialog.locator('[data-part="breadcrumb"]').click();
  await expect(dialog.locator('[data-part="breadcrumb"]')).toHaveCount(0);
  await expect(input).toBeFocused();

  await input.fill('density');
  await page.keyboard.press('Enter');
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await expect(log).toContainText('Last command: Spacious.');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Home');
  await page.keyboard.press('Enter');
  await expect(log).toContainText('Last command: Compact.');
  await expect(dialog).toHaveCount(0);
});

test('command palette: looked-up results load, a late answer is dropped, and a failure can be retried', async ({
  page,
}) => {
  await open(page, 'overlays-commandpalette--async');
  const { dialog, input, options } = palette(page);
  // Fixed commands first, then what the lookup found.
  await expect(options.locator('[data-part="label"]').first()).toHaveText('Overview');
  await expect(dialog.getByRole('group', { name: 'People' }).getByRole('option')).toHaveCount(12);

  // While it looks up: placeholder rows, and the list is busy.
  await input.fill('slow 3');
  await expect(dialog.getByRole('listbox')).toHaveAttribute('aria-busy', 'true');
  await expect(dialog.getByRole('status', { name: 'Searching' })).toBeVisible();
  // A newer text before the slow answer arrives: the slow answer must never show.
  await input.fill('7');
  await expect(options.locator('[data-part="label"]')).toHaveText(['Person 7', 'Person 17', 'Person 27']);
  await page.waitForTimeout(1800);
  await expect(options.locator('[data-part="label"]')).toHaveText(['Person 7', 'Person 17', 'Person 27']);
  await expect(dialog.getByRole('listbox')).not.toHaveAttribute('aria-busy');

  await input.fill('fail');
  const alert = dialog.getByRole('alert');
  await expect(alert).toContainText('Something went wrong');
  await alert.getByRole('button', { name: 'Try again' }).click();
  await expect(alert).toHaveCount(0);
  await expect(dialog.getByRole('status')).toHaveText('No results');
});

test('command palette: loading, empty and error states', async ({ page }) => {
  await open(page, 'overlays-commandpalette--loading');
  const { dialog, options } = palette(page);
  await expect(options).toHaveCount(2);
  await expect(dialog.locator('[data-part="loading"] [data-umbra="skeleton"]').first()).toBeVisible();
  await expect(dialog.getByRole('listbox')).toHaveAttribute('aria-busy', 'true');

  await open(page, 'overlays-commandpalette--empty');
  await expect(dialog.getByRole('status')).toHaveText('No results');

  await open(page, 'overlays-commandpalette--error-state');
  await expect(dialog.getByRole('alert')).toHaveText('The search service did not answer');
  await expect(options).toHaveCount(2);
});

test('command palette: includeShortcuts lists the registry shortcuts that can run, with their keys', async ({
  page,
}) => {
  await open(page, 'overlays-commandpalette--shortcuts');
  const { dialog, input } = palette(page);
  const group = dialog.getByRole('group', { name: 'Keyboard shortcuts' });
  // Only what would do something now: "Continue" has an action; the others have nothing mounted.
  await expect(group.getByRole('option')).toHaveCount(1);
  await expect(group.getByRole('option').locator('kbd')).toHaveText('Ctrl+Enter');
  await input.fill('contin');
  await page.keyboard.press('Enter');
  await expect(page.getByText(/Shortcut actions: 1/)).toBeVisible();
  await expect(dialog).toHaveCount(0);
});

test('command palette: it keeps the density, tint and tokens of where it is rendered, and moves over 240ms', async ({
  page,
}) => {
  await open(page, 'overlays-commandpalette--default', 1280, 720, 'density:compact;context:teal');
  const overlay = page.locator('[data-umbra-overlay]', { has: page.getByRole('dialog') });
  await expect(overlay).toHaveAttribute('data-umbra-density', 'compact');
  await expect(overlay).toHaveAttribute('data-umbra-context', 'teal');
  expect(await overlay.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0.24s');
  const panel = page.locator('[data-umbra="command-palette"]');
  expect(await panel.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0.24s');
  // Compact rows.
  expect((await page.getByRole('option').nth(1).boundingBox())!.height).toBe(28);
});

test('command palette: parts and translated texts', async ({ page }) => {
  await open(page, 'overlays-commandpalette--parts');
  const dialog = page.getByRole('dialog', { name: 'Search everything' });
  const input = dialog.getByRole('combobox', { name: 'Search everything' });
  await expect(input).toHaveAttribute('placeholder', 'Search everything');
  await expect(dialog.getByRole('listbox', { name: 'Matches' })).toBeVisible();
  await expect(dialog.locator('[data-part="footer"]')).toHaveCount(0);
  await expect(dialog.locator('[data-part="sectionHeader"]')).toHaveText('Go to:');
  await expect(dialog.getByRole('option').first().locator('small')).toHaveText('Enter');
  await expect(dialog.getByRole('option').nth(1).locator('small')).toHaveCount(0);
  await input.fill('zzz');
  await expect(dialog.locator('[data-part="empty"]')).toHaveText('Nothing here');
});

// Shortcut registry

// The development warnings are stripped from the built Storybook; they are unit-tested (shortcuts.test.ts).
test('shortcuts: an app shortcut takes a reserved key, the last of two wins, and a held key runs once', async ({
  page,
}) => {
  await open(page, 'foundation-umbraprovider--shortcut-conflicts');
  const log = page.getByText(/^Last shortcut:/);

  await page.keyboard.press('Control+k');
  await expect(log).toContainText('Last shortcut: Find.');
  // The loser has no keys: its tooltip shows none.
  const search = page.getByRole('button', { name: 'Search' });
  await search.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('tooltip')).toHaveText('Search');
  await search.blur();

  await page.keyboard.press('g');
  await expect(log).toContainText('Second ran 1 times');
  await expect(log).toContainText('Last shortcut: Find.');
  // Held down, the key repeats; the shortcut does not.
  await page.keyboard.down('g');
  await page.keyboard.down('g');
  await page.keyboard.down('g');
  await page.keyboard.up('g');
  await expect(log).toContainText('Second ran 2 times');

  // A shortcut with nothing to run leaves the key to the browser, and so does an event the app handled.
  const prevented = await page.evaluate(() => {
    const fire = (init: KeyboardEventInit, handled = false) => {
      const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
      const stop = (e: Event) => e.preventDefault();
      if (handled) document.body.addEventListener('keydown', stop, { once: true });
      document.body.dispatchEvent(event);
      return event.defaultPrevented;
    };
    return {
      unbound: fire({ key: 'j', ctrlKey: true }),
      sheet: fire({ key: '?' }),
      find: fire({ key: 'k', ctrlKey: true }),
    };
  });
  expect(prevented).toEqual({ unbound: false, sheet: false, find: true });
  const before = await log.textContent();
  await page.evaluate(() => {
    document.body.addEventListener('keydown', (e) => e.preventDefault(), { once: true });
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', bubbles: true, cancelable: true }));
  });
  expect(await log.textContent()).toBe(before);

  // Rendering again, with a new list of the same shortcuts, changes nothing.
  await page.getByRole('button', { name: 'Render again' }).click();
  await expect(log).toContainText('Last shortcut: Render.');
  await page.keyboard.press('g');
  await expect(log).toContainText('Second ran 3 times');
});
