import { expect, test, type Page } from '@playwright/test';

// Behaviour the static captures cannot show: popovers, tab mode keys, overflow menus.
// The overlays themselves (Popover, Tooltip, Menu) are tested in overlays.spec.ts.
const open = async (page: Page, id: string, width = 1280, height = 720, density = 'default') => {
  await page.setViewportSize({ width, height });
  await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=density:${density}`);
  await page.locator('#storybook-root > *').first().waitFor();
  // Load every Latin font face now. A face that first loads later (the body font, when a menu is the
  // first thing to use it) restarts every shrink level, which closes an overflow menu as it opens.
  await page.evaluate(async () => {
    await Promise.all(
      [...document.fonts].filter((f) => f.unicodeRange.startsWith('U+0-FF')).map((f) => f.load()),
    );
    await document.fonts.ready;
  });
};

test('a card collapsed by its stack opens its content in a popover, and Escape returns focus', async ({
  page,
}) => {
  await open(page, 'layout-page-layouts--stack-collapse');
  const card = page.locator('[data-umbra="card"][data-collapsed="layout"]').first();
  const header = card.getByRole('button', { name: 'Insights' });
  await expect(header).toHaveAttribute('aria-haspopup', 'dialog');
  await expect(card.locator('[data-part="body"]')).toHaveCount(0);

  await header.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Item 1')).toBeVisible();
  await expect(header).toHaveAttribute('aria-expanded', 'true');

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(header).toBeFocused();
});

test('resizing the window collapses and reopens cards', async ({ page }) => {
  await open(page, 'layout-page-layouts--three-columns', 1280, 900, 'spacious');
  const collapsed = page.locator('[data-umbra="card"][data-collapsed="layout"]');
  await expect(collapsed).toHaveCount(0);
  await page.setViewportSize({ width: 1280, height: 600 });
  await expect(collapsed).not.toHaveCount(0);
  // The highest-priority card stays open.
  await expect(page.locator('[data-umbra="card"]', { hasText: 'Next review' })).not.toHaveAttribute(
    'data-collapsed',
  );
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(collapsed).toHaveCount(0);
});

test('below the minimum window, columns become tabs driven by arrow keys', async ({ page }) => {
  await open(page, 'layout-page-layouts--three-columns', 900, 560);
  await expect(page.locator('[data-umbra="app-shell"]')).toHaveAttribute('data-narrow', 'true');
  const tabs = page.getByRole('tab');
  await expect(tabs).toHaveText(['Inbox', 'Summary', 'Status']);
  await expect(page.getByRole('tabpanel')).toHaveCount(1);
  await expect(page.getByRole('tabpanel')).toContainText('Message 1');

  await tabs.first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel')).toContainText('Update 1');

  // Exactly the minimum window is not narrow: the columns come back.
  await page.setViewportSize({ width: 1024, height: 600 });
  await expect(page.getByRole('tab')).toHaveCount(0);
  await expect(page.locator('[data-umbra="card"]', { hasText: 'Summary' })).toBeVisible();
});

test('header actions that do not fit move into one menu', async ({ page }) => {
  await open(page, 'layout-card--header-shrink');
  const narrow = page.locator('[data-umbra="card"]').nth(2);
  await expect(narrow.getByRole('button', { name: 'Filter' })).toHaveCount(0);
  await narrow.getByRole('button', { name: 'More actions' }).click();
  const menu = page.getByRole('menu', { name: 'More actions' });
  await expect(menu.getByRole('menuitem', { name: 'Filter' })).toContainText('Filter');
  await menu.getByRole('menuitem', { name: 'Export' }).click();
  await expect(menu).toHaveCount(0);
});

test('a user-collapsible card toggles with its caret', async ({ page }) => {
  await open(page, 'layout-card--states');
  const card = page.locator('[data-umbra="card"]', { hasText: 'Collapsible' }).first();
  const caret = card.getByRole('button', { name: 'Collapse' });
  await expect(caret).toHaveAttribute('aria-expanded', 'true');
  await caret.click();
  await expect(card).toHaveAttribute('data-collapsed', 'user');
  await expect(card.getByRole('button', { name: 'Show content' })).toHaveAttribute('aria-expanded', 'false');
});

test('the skip link is the first focus stop', async ({ page }) => {
  await open(page, 'layout-page-layouts--three-columns');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
});

test('nav: one tab stop, arrow keys, a caret that opens the dropdown, and choosing an item', async ({
  page,
}) => {
  await open(page, 'shell-app-shell--full-screen', 1920, 1080);
  const nav = page.getByRole('navigation', { name: 'Main' });
  const overview = nav.getByRole('link', { name: 'Overview' });
  await expect(overview).toHaveAttribute('aria-current', 'page');

  await overview.focus();
  await page.keyboard.press('ArrowRight');
  await expect(nav.getByRole('link', { name: 'Orders' })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  const caret = nav.getByRole('button', { name: 'Orders, submenu' });
  await expect(caret).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(caret).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('menu', { name: 'Orders' }).getByRole('menuitem', { name: 'Returns' }).click();
  await expect(page.getByRole('menu')).toHaveCount(0);

  await nav.getByRole('link', { name: 'Planning' }).click();
  await expect(nav.getByRole('link', { name: 'Planning' })).toHaveAttribute('aria-current', 'page');
});

test('top bar: as it narrows, items move into "More" and the active item stays', async ({ page }) => {
  await open(page, 'shell-app-shell--full-screen', 1920, 1080);
  const bar = page.locator('[data-umbra="top-bar"]');
  const nav = page.getByRole('navigation', { name: 'Main' });
  await expect(bar).toHaveAttribute('data-shrink', '0');
  await expect(nav.getByRole('button', { name: 'More' })).toHaveCount(0);

  // At the minimum window, hiding the context block and collapsing the actions is enough.
  await page.setViewportSize({ width: 1024, height: 600 });
  await expect(bar).toHaveAttribute('data-shrink', '2');
  await expect(nav.getByRole('button', { name: 'Finance' })).toBeVisible();

  await page.setViewportSize({ width: 900, height: 600 });
  await expect(bar).toHaveAttribute('data-shrink', '3');
  await expect(nav.getByRole('link', { name: 'Overview' })).toBeVisible();
  await expect(nav.getByRole('button', { name: 'Finance' })).toHaveCount(0);
  await nav.getByRole('button', { name: 'More' }).click();
  await expect(
    page.getByRole('menu', { name: 'More' }).getByRole('menuitem', { name: 'Finance' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');

  // Growing again brings everything back.
  await page.setViewportSize({ width: 1920, height: 1080 });
  await expect(bar).toHaveAttribute('data-shrink', '0');
  await expect(nav.getByRole('button', { name: 'Finance' })).toBeVisible();
});

test('nav: a disabled item does nothing, and arrow keys pass over it', async ({ page }) => {
  await open(page, 'shell-app-shell--full-screen', 1920, 1080);
  const nav = page.getByRole('navigation', { name: 'Main' });
  const finance = nav.getByRole('button', { name: 'Finance' });
  await expect(finance).toHaveAttribute('aria-disabled', 'true');
  await finance.click({ force: true });
  expect(new URL(page.url()).hash).toBe('');
  await expect(nav.getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page');

  // End lands on it, and one more step wraps to the first item: the tab stop is never lost.
  await nav.getByRole('link', { name: 'Overview' }).focus();
  await page.keyboard.press('End');
  await expect(finance).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(nav.getByRole('link', { name: 'Overview' })).toBeFocused();
});

test('top bar without a nav still shrinks, down to the icon of the primary action', async ({ page }) => {
  await open(page, 'shell-app-shell--without-nav');
  const bars = page.locator('[data-umbra="top-bar"]');
  await expect(bars).toHaveCount(3);
  await expect(bars.nth(0)).toHaveAttribute('data-shrink', '0');
  await expect(bars.nth(2)).toHaveAttribute('data-shrink', '4');
  for (const bar of await bars.all()) {
    expect(await bar.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
  }
});

test('a card popover closes when its card opens again or the window enters tab mode', async ({ page }) => {
  await open(page, 'shell-app-shell--full-screen', 1280, 620, 'spacious');
  const header = page.locator('[data-umbra="card"][data-collapsed="layout"] button[aria-haspopup]').last();
  await header.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 1080 });
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.setViewportSize({ width: 1280, height: 620 });
  await expect(header).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await header.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.setViewportSize({ width: 1000, height: 620 });
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('after one large resize the stack collapses enough cards and nothing leaves it', async ({ page }) => {
  await open(page, 'shell-app-shell--full-screen', 1280, 1080, 'spacious');
  for (const height of [610, 660, 720, 800]) {
    await page.setViewportSize({ width: 1280, height: 1080 });
    await page.setViewportSize({ width: 1280, height });
    // One measurement: how far the last card leaves the stack, and how much taller than its header a
    // collapsed card is (it must not take the spare space).
    const excess = () =>
      page.evaluate(() => {
        const stack = [...document.querySelectorAll('[data-umbra="stack"]')].at(-1)!;
        const bottom = Math.max(...[...stack.children].map((c) => c.getBoundingClientRect().bottom));
        const grown = [...stack.querySelectorAll('[data-collapsed="layout"]')].map(
          (c) => c.clientHeight - c.querySelector('[data-part="header"]')!.clientHeight,
        );
        return Math.round(Math.max(bottom - stack.getBoundingClientRect().bottom, ...grown));
      });
    await expect.poll(excess).toBeLessThanOrEqual(1);
  }
});

test('a stack too short for its highest-priority card keeps that card open, scrolling inside', async ({
  page,
}) => {
  await open(page, 'layout-page-layouts--stack-too-short');
  for (const stack of await page.locator('[data-umbra="stack"]').all()) {
    const cards = stack.locator('[data-umbra="card"]');
    await expect(cards.nth(0)).not.toHaveAttribute('data-collapsed');
    await expect(cards.nth(1)).toHaveAttribute('data-collapsed', 'layout');
    // The open card takes what the collapsed header leaves, and nothing leaves the stack.
    const fit = await stack.evaluate((el) => {
      const [open, closed] = [...el.querySelectorAll('[data-umbra="card"]')].map((c) =>
        c.getBoundingClientRect(),
      );
      const box = el.getBoundingClientRect();
      return { open: open!.height, spare: box.bottom - closed!.bottom, top: open!.top - box.top };
    });
    expect(fit.open).toBeGreaterThan(60);
    expect(Math.abs(fit.spare)).toBeLessThanOrEqual(1);
    expect(fit.top).toBe(0);
    const body = cards.nth(0).locator('[data-part="body"] > [data-part="viewport"]');
    await expect(body.getByText('Order 1', { exact: true })).toBeVisible();
    expect(await body.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  }
});

// Page, Columns and Stack

test('slot: size="content" hugs its child in height and stretches it across the stack', async ({ page }) => {
  await open(page, 'layout-page-layouts--slot-content');
  const stack = page.locator('[data-umbra="stack"]');
  const width = (await stack.boundingBox())!.width;
  const slots = stack.locator('> [data-umbra="slot"]');
  await expect(slots).toHaveCount(3);
  for (const slot of await slots.all()) {
    const child = (await slot.locator('> *').boundingBox())!;
    expect(child.width).toBe(width);
    expect(child.height).toBeGreaterThan(20);
    expect((await slot.boundingBox())!.height).toBe(child.height);
  }
  await expect(page.getByRole('heading', { name: 'A page header in a slot' })).toBeVisible();
});

test('page: loading replaces the content with a skeleton and marks it busy; header and footer stay', async ({
  page,
}) => {
  await open(page, 'layout-page-layouts--page-loading');
  const content = page.locator('[data-umbra="page"] > [data-part="content"]');
  await expect(content).toHaveAttribute('aria-busy', 'true');
  await expect(content.locator('[data-umbra="skeleton"]')).toBeVisible();
  await expect(page.locator('[data-umbra="card"]')).toHaveCount(0);
  await expect(page.getByText('Page header')).toBeVisible();
  await expect(page.getByText('Page footer')).toBeVisible();
});

test('page: padding="none" removes the outer margin, and the blocks carry their part names', async ({
  page,
}) => {
  await open(page, 'layout-page-layouts--page-padding-none');
  await expect(page.locator('[data-umbra="page"]')).toHaveCSS('padding', '0px');

  await open(page, 'layout-page-layouts--page-blocks');
  const root = page.locator('[data-umbra="page"]');
  await expect(root).toHaveAttribute('data-umbra-context', 'green');
  for (const part of ['header', 'content', 'footer']) {
    await expect(root.locator(`> [data-part="${part}"]`)).toBeVisible();
  }
});

test('narrow="keep" keeps the columns below the minimum window; overflow="keep" collapses nothing', async ({
  page,
}) => {
  await open(page, 'layout-page-layouts--keep-columns-and-cards', 900, 560);
  await expect(page.locator('[data-umbra="app-shell"]')).toHaveAttribute('data-narrow', 'true');
  await expect(page.getByRole('tab')).toHaveCount(0);
  await expect(page.locator('[data-umbra="card"]')).toHaveCount(6);
  await expect(page.locator('[data-umbra="card"][data-collapsed]')).toHaveCount(0);
  // `gap` is a step of the spacing scale.
  await expect(page.locator('[data-umbra="columns"]')).toHaveCSS('column-gap', '24px');
  await expect(page.locator('[data-umbra="stack"]')).toHaveCSS('row-gap', '2px');
});

test('nested columns get their own tabs, and a child without a label gets its number', async ({ page }) => {
  await open(page, 'layout-page-layouts--nested-tabs', 900, 560);
  const outer = page.getByRole('tablist', { name: 'Sections' });
  await expect(outer.getByRole('tab')).toHaveText(['Orders', 'Regions', '3']);

  await outer.getByRole('tab', { name: 'Regions' }).click();
  const inner = page.getByRole('tablist', { name: 'Regions' });
  await expect(inner.getByRole('tab')).toHaveText(['Region 1', 'Region 2']);
  await expect(page.getByText('Site 6')).toBeVisible();
  await inner.getByRole('tab', { name: 'Region 2' }).click();
  await expect(page.getByText('Site 6')).toBeHidden();
  await expect(page.getByText('Site 3').last()).toBeVisible();

  await outer.getByRole('tab', { name: '3' }).click();
  await expect(page.getByText('Plain content in a Slot without a label')).toBeVisible();
  await expect(inner).toBeHidden();
});

test('a custom tab strip selects the panels', async ({ page }) => {
  await open(page, 'layout-page-layouts--custom-tab-strip', 900, 560);
  const strip = page.getByRole('tablist', { name: 'Views' });
  await expect(strip.getByRole('tab')).toHaveText(['Orders', 'Reports', 'People']);
  await strip.getByRole('tab', { name: 'Reports' }).click();
  await expect(strip.getByRole('tab', { name: 'Reports' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel', { name: 'Reports' })).toContainText('Report 1');
  await expect(page.getByRole('tabpanel')).toHaveCount(1);
});

// AppShell

test('activating the skip link moves focus to main', async ({ page }) => {
  await open(page, 'shell-app-shell--separate-bars');
  const bars = page.locator('[data-umbra="app-shell"] > [data-part="bars"]');
  await expect(bars.locator('> [data-umbra="top-bar"]')).toBeVisible();
  await expect(bars.locator('> [data-umbra="sub-nav"]')).toBeVisible();

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
});

test('app shell: blocks, the skip label, the flat background and the pattern token', async ({ page }) => {
  await open(page, 'shell-app-shell--blocks');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to the page' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();

  const pattern = () =>
    page
      .locator('[data-part="background"]')
      .evaluate((el) => [getComputedStyle(el, '::after').display, getComputedStyle(el, '::after').opacity]);
  await open(page, 'shell-app-shell--flat-background');
  await expect(page.locator('[data-umbra="app-shell"]')).toHaveAttribute('data-background', 'flat');
  expect(await pattern()).toEqual(['none', '0']);
  await open(page, 'shell-app-shell--pattern');
  expect(await pattern()).toEqual(['block', '0.06']);
});

// ScrollArea

test('scroll area: onReachEnd is called once each time the end is reached', async ({ page }) => {
  await open(page, 'layout-scrollarea--reach-end');
  const viewport = page.locator('[data-part="viewport"]');
  const scrollTo = (end: boolean) =>
    viewport.evaluate((el, e) => el.scrollTo(0, e ? el.scrollHeight : 0), end);
  await expect(page.getByText('Reached the end 0 times')).toBeVisible();

  await scrollTo(true);
  await expect(page.getByText('Reached the end 1 times')).toBeVisible();
  // The callback re-rendered the story with new children; staying at the end must not call it again.
  await page.waitForTimeout(300);
  await expect(page.getByText('Reached the end 1 times')).toBeVisible();

  await scrollTo(false);
  await expect(page.locator('[data-umbra="scroll-area"]')).not.toHaveAttribute('data-fade-start');
  await scrollTo(true);
  await expect(page.getByText('Reached the end 2 times')).toBeVisible();
});

test('scroll area: without a control inside, the viewport is a named focus stop that arrow keys scroll', async ({
  page,
}) => {
  await open(page, 'layout-scrollarea--keyboard');
  const viewport = page.getByRole('group', { name: 'Item list' });
  await expect(viewport).toHaveAttribute('tabindex', '0');
  await page.keyboard.press('Tab');
  await expect(viewport).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect.poll(() => viewport.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);

  // With a button inside, focus goes to the button and the viewport is not a stop.
  const other = page.locator('[data-part="viewport"]').nth(1);
  await expect(other).not.toHaveAttribute('tabindex');
  await expect(other).not.toHaveAttribute('role');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Add item' })).toBeFocused();
});

test('scroll area: the fade follows the scroll position, and can be replaced, hidden or turned off', async ({
  page,
}) => {
  await open(page, 'layout-scrollarea--fades');
  const areas = page.locator('[data-umbra="scroll-area"]');
  await expect(areas.nth(0)).toHaveAttribute('data-fade-end', 'true');
  await expect(areas.nth(0)).not.toHaveAttribute('data-fade-start');
  await areas
    .nth(0)
    .locator('[data-part="viewport"]')
    .evaluate((el) => el.scrollTo(0, 100));
  await expect(areas.nth(0)).toHaveAttribute('data-fade-start', 'true');

  await expect(areas.nth(0).locator('[data-part="fade"]')).toHaveCount(2);
  await expect(areas.nth(1).locator('[data-part="fade"]')).toHaveCount(0);
  await expect(areas.nth(1).locator('> [aria-hidden]')).toHaveCount(2);
  await expect(areas.nth(2).locator('> *')).toHaveCount(1);
  await expect(areas.nth(3).locator('> *')).toHaveCount(1);
  await expect(areas.nth(3)).not.toHaveAttribute('data-fade-end');
  await expect(areas.nth(3)).toHaveAttribute('data-scrollbar', 'hover');
});

// SectionTitle

test('section title: onOpen makes the title a button, and actions work from the overflow menu', async ({
  page,
}) => {
  await open(page, 'layout-sectiontitle--callbacks');
  await page.getByRole('heading', { name: 'Open orders' }).getByRole('button').click();
  await expect(page.getByText('Last action: Opened the section')).toBeVisible();

  const narrow = page.locator('[data-umbra="section-title"]').nth(1);
  await expect(narrow.getByRole('button', { name: 'Sort' })).toHaveCount(0);
  await narrow.getByRole('button', { name: 'More actions' }).click();
  const menu = page.getByRole('menu', { name: 'More actions' });
  await expect(menu.getByRole('menuitem', { name: 'Sort' })).toBeVisible();
  await menu.getByRole('menuitem', { name: 'Export' }).click();
  await expect(menu).toHaveCount(0);
  await expect(page.getByText('Last action: Export')).toBeVisible();
});

test('section title: level sets the heading level; parts replace and hide pieces', async ({ page }) => {
  await open(page, 'layout-sectiontitle--levels-and-parts');
  await expect(page.getByRole('heading', { level: 2, name: 'Level 2' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Level 3, the default' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 4, name: 'Level 4 with a count' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 6, name: 'Level 6, rule' })).toBeVisible();

  const titles = page.locator('[data-umbra="card"]').nth(1).locator('[data-umbra="section-title"]');
  await expect(titles.nth(0).locator('[data-part="count"]')).toHaveText('12 open');
  await expect(titles.nth(1).locator('[data-part="count"]')).toHaveText('New');
  await expect(titles.nth(2).locator('[data-part="count"], [data-part="actions"]')).toHaveCount(0);
});

// Card

test('card: band colour, a title that opens, the heading level and a name without a title', async ({
  page,
}) => {
  await open(page, 'layout-card--header-options');
  await expect(page.getByRole('region', { name: 'Band colour' }).locator('[data-part="header"]')).toHaveCSS(
    'background-color',
    'rgb(19, 78, 74)',
  );
  await page.getByRole('button', { name: 'Opens a fuller view' }).click();
  await expect(page.getByText('Opened 1 times')).toBeVisible();
  await expect(page.getByRole('heading', { level: 4, name: 'Heading level 4' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Band colour' })).toBeVisible();
  const untitled = page.getByRole('region', { name: 'Totals' });
  await expect(untitled).toBeVisible();
  await expect(untitled.locator('[data-part="header"]')).toHaveCount(0);
});

test('card: empty and error take the richer forms of the data components, and plain text stays as it was', async ({
  page,
}) => {
  await open(page, 'layout-card--rich-states');
  const card = (name: string) => page.getByRole('region', { name });
  const empty = card('Empty, in pieces').locator('[data-umbra="empty-state"]');
  await expect(empty.getByText('No orders yet')).toBeVisible();
  await expect(empty.getByText('Orders appear here')).toBeVisible();
  await expect(empty.getByRole('button', { name: 'New order' })).toBeVisible();

  // An error is an alert; `onRetry` adds the button, and `retryLabel` names it.
  const retrying = card('Error with retry');
  await expect(retrying.getByRole('alert')).toContainText('Could not load the orders.');
  await retrying.getByRole('button', { name: 'Try again' }).click();
  await expect(retrying.getByRole('alert')).toBeVisible();
  await expect(card('Error, default text').getByRole('alert')).toContainText('Something went wrong');
  await expect(card('Error, in pieces').getByRole('button', { name: 'Load again' })).toBeVisible();

  // Plain text and a plain node are drawn as before, without the shared empty state.
  await open(page, 'layout-card--states');
  await expect(card('Empty').locator('[data-state="empty"]')).toHaveText('Nothing to show yet.');
  await expect(card('Empty').locator('[data-umbra="empty-state"]')).toHaveCount(0);
  await expect(card('Error').getByRole('alert')).toHaveAttribute('data-state', 'error');
  await expect(card('Error').getByRole('button', { name: 'Retry' })).toBeVisible();
});

test('card: controlled collapse follows the app state, and the caret reports to it', async ({ page }) => {
  await open(page, 'layout-card--controlled-collapse');
  const card = page.getByRole('region', { name: 'Controlled' });
  await expect(card).not.toHaveAttribute('data-collapsed');

  await page.getByRole('button', { name: 'Toggle from outside' }).click();
  await expect(card).toHaveAttribute('data-collapsed', 'user');
  await expect(card.locator('[data-part="body"]')).toHaveCount(0);
  await expect(page.getByText('Collapsed: yes')).toBeVisible();

  await card.getByRole('button', { name: 'Show content' }).click();
  await expect(page.getByText('Collapsed: no')).toBeVisible();
  await expect(card).not.toHaveAttribute('data-collapsed');
  await expect(card.getByRole('button', { name: 'Collapse' })).toHaveAttribute('aria-expanded', 'true');
});

test('card: Enter and Space toggle the caret', async ({ page }) => {
  await open(page, 'layout-card--states');
  const card = page.locator('[data-umbra="card"]', { hasText: 'Collapsible' }).first();
  const caret = card.locator('[data-part="toggle"]').getByRole('button');
  await caret.focus();
  await page.keyboard.press('Enter');
  await expect(caret).toHaveAttribute('aria-expanded', 'false');
  await expect(caret).toHaveAccessibleName('Show content');
  await expect(card).toHaveAttribute('data-collapsed', 'user');
  await page.keyboard.press('Space');
  await expect(caret).toHaveAttribute('aria-expanded', 'true');
  await expect(caret).toHaveAccessibleName('Collapse');
  await expect(caret).toBeFocused();
});

test('card: a PageHeader as header and an ActionBar as footer take the card padding', async ({ page }) => {
  await open(page, 'layout-card--page-header-and-action-bar');
  const pad = 16;
  const measure = (name: string) =>
    page.getByRole('region', { name }).evaluate((el) => {
      const box = (node: Element) => node.getBoundingClientRect();
      const card = box(el);
      const title = box(el.querySelector('[data-umbra="page-header"] [data-part="title"]')!);
      const header = box(el.querySelector('[data-umbra="page-header"]')!);
      const row = box(el.querySelector('[data-part="body"] [data-part="viewport"] > div > div')!);
      const bar = el.querySelector('[data-umbra="action-bar"]')!;
      const button = box(bar.querySelector('button')!);
      return {
        // The border is 1px on each side.
        headerInset: Math.round(header.left - card.left),
        headerTop: Math.round(header.top - card.top),
        gapAboveBody: Math.round(row.top - header.bottom),
        bodyInset: Math.round(row.left - card.left),
        barBottom: Math.round(card.bottom - box(bar).bottom),
        buttonInset: Math.round(card.right - button.right),
        buttonFromBottom: Math.round(card.bottom - button.bottom),
        titleTop: Math.round(title.top - card.top),
        titleInset: Math.round(title.left - card.left),
      };
    });
  const plain = await measure('Plain header');
  expect(plain).toMatchObject({ headerInset: 1, headerTop: 1, gapAboveBody: pad, bodyInset: pad + 1 });
  expect(plain.titleTop).toBeGreaterThanOrEqual(pad);
  expect(plain.titleInset).toBe(pad + 1);
  expect(plain).toMatchObject({ barBottom: 1, buttonInset: pad + 1 });
  expect(plain.buttonFromBottom).toBeGreaterThanOrEqual(8);

  // A tinted header keeps its own padding and runs edge to edge; a strong bar keeps its own, too.
  const tinted = await measure('Tinted header');
  expect(tinted).toMatchObject({ headerInset: 1, headerTop: 1, gapAboveBody: pad, bodyInset: pad + 1 });
  expect(tinted).toMatchObject({ barBottom: 1, buttonInset: pad + 1 });
  const header = page.getByRole('region', { name: 'Tinted header' }).locator('[data-umbra="page-header"]');
  await expect(header).toHaveCSS('border-top-width', '0px');
  await expect(header).toHaveCSS('border-bottom-width', '1px');
  await expect(header).toHaveCSS('border-top-left-radius', '0px');
});

test('card: size="content" is as tall as its header and content, and scrolls inside a short stack', async ({
  page,
}) => {
  await open(page, 'layout-card--content-sized');
  const card = (name: string) => page.getByRole('region', { name });
  const heights = (name: string) =>
    card(name).evaluate((el) => {
      const viewport = el.querySelector('[data-part="body"] > [data-part="viewport"]')!;
      const header = el.querySelector('[data-part="header"]');
      return {
        card: el.clientHeight,
        header: header?.clientHeight ?? 0,
        body: viewport.clientHeight,
        content: viewport.scrollHeight,
      };
    });
  for (const name of ['Hugs its content', 'Note']) {
    const h = await heights(name);
    expect(h.body, name).toBeGreaterThan(20);
    expect(h.body, name).toBe(h.content);
    expect(h.card, name).toBe(h.header + h.body);
  }
  await expect(card('Note')).toContainText('A content-sized card without a title.');
  // The rest of the stack goes to the card with a weight.
  expect((await heights('Takes the rest')).card).toBeGreaterThan(200);

  // In the short stack the content-sized card gets what is left of 220px and scrolls inside.
  const tall = await heights('Taller than the stack');
  expect(tall.content).toBeGreaterThan(tall.body);
  expect(tall.body).toBeGreaterThan(40);
  await expect(card('Keeps its minimum')).not.toHaveAttribute('data-collapsed');
  expect((await heights('Keeps its minimum')).card).toBeGreaterThanOrEqual(70);
  const stack = page.locator('[data-umbra="stack"]').last();
  expect(await stack.evaluate((el) => el.scrollHeight - el.clientHeight)).toBe(0);
});

test('card: the popover of a layout-collapsed card repeats the header actions, and they work', async ({
  page,
}) => {
  await open(page, 'layout-card--collapsed-actions');
  const card = page.locator('[data-umbra="card"][data-collapsed="layout"]');
  await expect(card).toHaveCount(1);
  await expect(card.getByRole('button', { name: 'Refresh' })).toHaveCount(0);

  await card.getByRole('button', { name: 'Exports' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('File 1')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Export' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Refresh' }).click();
  await expect(page.getByText('Last action: Refresh')).toBeVisible();
});

test('card: parts replace, change and hide pieces', async ({ page }) => {
  await open(page, 'layout-card--parts');
  await expect(page.getByRole('region', { name: 'Title from a node' })).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Header from a function' }).locator('[data-part="header"]'),
  ).toHaveAttribute('data-header-style', 'band');
  await expect(
    page.getByRole('region', { name: 'Body from a function' }).locator('[data-part="body"]'),
  ).toHaveAttribute('data-padding', 'none');
  await expect(page.getByRole('region', { name: 'Actions hidden' }).getByRole('button')).toHaveCount(0);
  await expect(
    page.getByRole('region', { name: 'Header hidden' }).locator('[data-part="header"]'),
  ).toHaveCount(0);
  await expect(
    page.getByRole('region', { name: 'Skeleton from a node' }).locator('[data-umbra="skeleton"]'),
  ).toHaveAttribute('data-shape', 'block');
});

// UmbraProvider and UmbraScope

test('shortcuts: a key runs its action or its button; a bare key typed in a field does not; Mod+K searches', async ({
  page,
}) => {
  await open(page, 'foundation-umbraprovider--shortcuts');
  const last = page.getByText(/^Last shortcut:/);
  await page.keyboard.press('s');
  await expect(last).toHaveText('Last shortcut: Save');
  await page.keyboard.press('Shift+R');
  await expect(last).toHaveText('Last shortcut: Refresh');

  const field = page.getByLabel('Notes');
  await field.focus();
  await page.keyboard.press('s');
  await expect(field).toHaveValue('s');
  await expect(last).toHaveText('Last shortcut: Refresh');

  // A combination with a modifier also works while typing.
  await page.keyboard.press('Control+k');
  await expect(last).toHaveText('Last shortcut: Search');
});

test('provider: icons, reducedMotion, locale and tokens', async ({ page }) => {
  await open(page, 'foundation-umbraprovider--icons');
  await expect(page.locator('[data-part="toggle"] svg.lucide-minus')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Search' }).locator('svg.lucide-zoom-in')).toBeVisible();
  await expect(page.locator('[data-part="spinner"] svg.lucide-refresh-cw')).toBeVisible();

  await open(page, 'foundation-umbraprovider--reduced-motion');
  const scale = (selector: string) =>
    page
      .locator(selector)
      .first()
      .evaluate((el) => getComputedStyle(el).getPropertyValue('--umbra-motion-scale'));
  expect(await scale('[data-umbra="skeleton"]')).toBe('0');
  expect(await scale('.story-frame')).toBe('1');

  await open(page, 'foundation-umbraprovider--locale');
  await expect(page.locator('[lang="he-IL"]')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('[lang="de-DE"]')).toHaveAttribute('dir', 'ltr');
  await expect(page.locator('[lang="de-DE"]')).toContainText('1.234.567,89');
  await expect(page.locator('[lang="en-GB"]')).toContainText('1,234,567.89');

  await open(page, 'foundation-umbraprovider--tokens');
  await expect(page.locator('[data-umbra="card"]')).toHaveCSS('border-radius', '0px');
  await expect(page.locator('[data-umbra="card"] [data-part="header"]')).toHaveCSS('min-height', '56px');
});

test('nested scopes change only what they set', async ({ page }) => {
  await open(page, 'foundation-umbraprovider--nested-scopes');
  const spacious = page.locator('[data-umbra-density="spacious"]');
  await expect(spacious).toHaveAttribute('data-umbra-context', 'teal');
  const slate = page.locator('[data-umbra-context="slate"]').first();
  await expect(slate).toHaveAttribute('data-umbra-density', 'compact');
  const brand = (scope: typeof slate) =>
    scope.evaluate((el) => getComputedStyle(el).getPropertyValue('--umbra-color-brand'));
  expect(await brand(spacious)).toBe('#0f766e');
  expect(await brand(slate)).toBe('#e8e4f0');
});

// TopBar, PrimaryNav and SubNav

test('top bar: the context block hides first, then the actions collapse into a menu that works', async ({
  page,
}) => {
  await open(page, 'shell-topbar--slots', 1920, 1080);
  const bar = page.locator('[data-umbra="top-bar"]');
  await expect(bar).toHaveAttribute('data-shrink', '0');
  await expect(bar.locator('[data-part="context"]')).toBeVisible();

  // Step 1 only: the context block is gone, the actions are still in the bar.
  await page.setViewportSize({ width: 1200, height: 720 });
  await expect(bar).toHaveAttribute('data-shrink', '1');
  await expect(bar.locator('[data-part="context"]')).toHaveCount(0);
  await expect(bar.getByRole('button', { name: 'Settings' })).toBeVisible();
  await expect(bar.getByRole('button', { name: 'More actions' })).toHaveCount(0);

  await page.setViewportSize({ width: 1100, height: 720 });
  await expect(bar).toHaveAttribute('data-shrink', '2');
  await expect(bar.getByRole('button', { name: 'Settings' })).toHaveCount(0);
  // The search trigger is pinned: it stays in the bar.
  await expect(bar.getByRole('button', { name: 'Search' })).toBeVisible();
  await bar.getByRole('button', { name: 'More actions' }).click();
  const menu = page.getByRole('menu', { name: 'More actions' });
  await expect(menu.getByRole('menuitem', { name: 'Notifications (3)' })).toContainText('Notifications');
  await menu.getByRole('menuitem', { name: 'Settings' }).click();
  await expect(menu).toHaveCount(0);
  await expect(page.getByText('Last action: Settings')).toBeVisible();
});

test('top bar: Mod+K runs the search, and its tooltip shows on focus with the key hint', async ({ page }) => {
  await open(page, 'shell-topbar--slots', 1920, 1080);
  await page.keyboard.press('Control+k');
  await expect(page.getByText('Last action: Search')).toBeVisible();

  // Reached with the keyboard, the search trigger shows its tooltip.
  await page.getByRole('button', { name: 'Search' }).focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Search' })).toBeFocused();
  const tooltip = page.getByRole('tooltip');
  await expect(tooltip).toContainText('Search');
  await expect(tooltip.locator('kbd')).toHaveText('Ctrl+K');
});

test('top bar: parts and blocks', async ({ page }) => {
  await open(page, 'shell-topbar--parts', 1920, 1080);
  const bars = page.locator('[data-umbra="top-bar"]');
  await expect(bars.nth(0).locator('[data-part="logo"]')).toHaveText('U / Console');
  await expect(bars.nth(0).getByRole('button', { name: 'Help' })).toBeVisible();
  await expect(bars.nth(1).locator('[data-part="start"], [data-part="context"]')).toHaveCount(0);

  // Built from blocks, the bar still shrinks: the pinned action stays and the others go into the menu.
  await open(page, 'shell-topbar--blocks', 700, 600);
  const bar = page.locator('[data-umbra="top-bar"]');
  for (const part of ['start', 'nav', 'actions', 'end']) {
    await expect(bar.locator(`[data-part="${part}"]`)).toHaveCount(1);
  }
  await expect(bar.getByRole('button', { name: 'Help' })).toBeVisible();
  await expect(bar.getByRole('button', { name: 'Settings' })).toHaveCount(0);
  await bar.getByRole('button', { name: 'More tools' }).click();
  await expect(
    page.getByRole('menu', { name: 'More tools' }).getByRole('menuitem', { name: 'Settings' }),
  ).toBeVisible();
});

test('nav keys: ArrowLeft, Home and End move; ArrowDown opens a dropdown; Escape closes it and returns focus', async ({
  page,
}) => {
  await open(page, 'shell-primarynav--items');
  const nav = page.getByRole('navigation', { name: 'Main' });
  const planning = nav.getByRole('link', { name: 'Planning' });
  await expect(planning).toHaveAttribute('aria-current', 'page');
  // One tab stop: the active item.
  await page.keyboard.press('Tab');
  await expect(planning).toBeFocused();

  await page.keyboard.press('ArrowLeft');
  await expect(nav.getByRole('button', { name: 'Orders, submenu' })).toBeFocused();
  await page.keyboard.press('Home');
  await expect(nav.getByRole('link', { name: 'Overview' })).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(nav.getByRole('button', { name: 'Finance' })).toBeFocused();
  await page.keyboard.press('Home');
  await page.keyboard.press('End');
  await expect(nav.getByRole('button', { name: 'Finance' })).toBeFocused();

  await page.keyboard.press('ArrowLeft');
  const people = nav.getByRole('button', { name: 'People' });
  await expect(people).toBeFocused();
  await page.keyboard.press('ArrowDown');
  const menu = page.getByRole('menu', { name: 'People' });
  // Focus moves to the first row of the menu.
  await expect(menu.getByRole('menuitem', { name: 'Teams' })).toBeFocused();
  await expect(people).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(people).toBeFocused();
  await expect(people).toHaveAttribute('aria-expanded', 'false');

  // On a link with sub-pages, ArrowDown opens them too.
  await nav.getByRole('link', { name: 'Orders' }).focus();
  await page.keyboard.press('ArrowDown');
  await expect(
    page.getByRole('menu', { name: 'Orders' }).getByRole('menuitem', { name: 'Returns' }),
  ).toBeVisible();
});

test('primary nav: an active item that is not the first stays while the others move into "More"', async ({
  page,
}) => {
  await open(page, 'shell-primarynav--overflow');
  const wide = page.getByRole('navigation', { name: 'Main' }).nth(0);
  await expect(wide.getByRole('button', { name: 'More' })).toHaveCount(0);

  const nav = page.getByRole('navigation', { name: 'Main' }).nth(2);
  await expect(nav.getByRole('link', { name: 'Sourcing' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Sourcing' })).toHaveAttribute('aria-current', 'page');
  await expect(nav.getByRole('link', { name: 'Planning' })).toHaveCount(0);
  await expect(nav.getByRole('button', { name: 'Finance' })).toHaveCount(0);

  await nav.getByRole('button', { name: 'More' }).click();
  const menu = page.getByRole('menu', { name: 'More' });
  await expect(menu.getByRole('menuitem', { name: 'Finance' })).toHaveAttribute('aria-disabled', 'true');
  await menu.getByRole('menuitem', { name: 'Planning' }).click();
  await expect(menu).toHaveCount(0);
  // The chosen item is now the one that stays.
  await expect(nav.getByRole('link', { name: 'Planning' })).toHaveAttribute('aria-current', 'page');
  await expect(nav.getByRole('link', { name: 'Sourcing' })).toHaveCount(0);
});

test('primary nav: renderLink, parts and blocks', async ({ page }) => {
  await open(page, 'shell-primarynav--render-link');
  const link = page.getByRole('link', { name: 'Orders' });
  await expect(link).toHaveAttribute('data-router-link', '');
  await link.click();
  await expect(page.getByText('The router went to: #orders')).toBeVisible();
  await expect(page.getByText('Current section: orders')).toBeVisible();
  expect(new URL(page.url()).hash).toBe('');

  await open(page, 'shell-primarynav--parts-and-blocks');
  const custom = page.getByRole('navigation', { name: 'Main' });
  await expect(custom.locator('[data-part="indicator"]')).toHaveCSS('height', '4px');
  await custom.getByRole('button', { name: 'All sections' }).click();
  await expect(
    page.getByRole('menu', { name: 'All sections' }).getByRole('menuitem', { name: 'Finance' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');

  const blocks = page.getByRole('navigation', { name: 'Built from blocks' });
  await expect(blocks.getByRole('link', { name: 'Reports' })).toHaveAttribute('aria-current', 'page');
  await expect(blocks.getByRole('button', { name: 'People' })).toHaveAttribute('aria-disabled', 'true');
  await blocks.getByRole('button', { name: 'Reports, submenu' }).click();
  await expect(page.getByRole('menu', { name: 'Reports' }).getByRole('menuitem')).toHaveText([
    'Monthly',
    'Yearly',
  ]);
});

test('sub nav: pages move into "More", then the label hides', async ({ page }) => {
  await open(page, 'shell-subnav--shrink');
  const bars = page.locator('[data-umbra="sub-nav"]');
  await expect(bars.nth(0).locator('> [data-part="label"]')).toBeVisible();
  const more = (bar: number) => bars.nth(bar).getByRole('button', { name: 'More', exact: true });
  await expect(more(0)).toHaveCount(0);
  // The shortcuts at the end give way first (shell-extras.spec.ts); then "More" comes before the label goes.
  await expect(more(1)).toHaveCount(0);
  await expect(more(3)).toBeVisible();
  await expect(bars.nth(3).locator('> [data-part="label"]')).toBeVisible();
  await expect(bars.nth(4).locator('> [data-part="label"]')).toHaveCount(0);
  await expect(bars.nth(4).getByRole('link', { name: 'Inbox' })).toHaveAttribute('aria-current', 'page');

  await more(4).click();
  const menu = page.getByRole('menu', { name: 'More' });
  await menu.getByRole('menuitem', { name: 'Reports' }).click();
  await expect(menu).toHaveCount(0);
  await expect(page.getByText('Current page: reports')).toHaveCount(1);
  await expect(bars.nth(4).getByRole('link', { name: 'Reports' })).toHaveAttribute('aria-current', 'page');
});

test('sub nav: icons, a dropdown, parts and blocks', async ({ page }) => {
  await open(page, 'shell-subnav--slots');
  const nav = page.getByRole('navigation', { name: 'Section' });
  await expect(nav.getByRole('link', { name: 'Inbox', exact: true }).locator('svg')).toBeVisible();
  await nav.getByRole('button', { name: 'Reports, submenu' }).click();
  await page.getByRole('menu', { name: 'Reports' }).getByRole('menuitem', { name: 'Yearly' }).click();
  await expect(page.getByText('Current page: yearly')).toBeVisible();

  await open(page, 'shell-subnav--parts-and-blocks');
  const custom = page.getByRole('navigation', { name: 'Section' });
  await expect(custom.locator('> [data-part="label"]')).toHaveText('Section: Orders');
  await expect(custom.locator('[data-part="end"]')).toHaveCount(0);
  await expect(custom.getByRole('link', { name: 'Summary' }).locator('svg')).toBeVisible();
  const blocks = page.getByRole('navigation', { name: 'Built from blocks' });
  await expect(blocks.locator('> [data-part="label"]')).toHaveText('Reports');
  await expect(blocks.locator('[data-part="end"]').getByRole('button', { name: 'Export' })).toBeVisible();
  await blocks.getByRole('button', { name: 'Yearly' }).click();
  await expect(page.getByRole('menu', { name: 'Yearly' }).getByRole('menuitem')).toHaveText([
    'This year',
    'Last year',
  ]);
});

// Button, IconButton and Skeleton

test('button: Enter and Space press it', async ({ page }) => {
  await open(page, 'basics-buttons--press');
  await page.getByRole('button', { name: 'Save' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Presses: 1')).toBeVisible();
  await page.keyboard.press('Space');
  await expect(page.getByText('Presses: 2')).toBeVisible();
});

test('button: loading blocks presses but stays focusable and says it is loading; disabled is not focusable', async ({
  page,
}) => {
  await open(page, 'basics-buttons--press');
  // The names the browser gives to assistive technology. (Playwright computes names itself and leaves
  // the progress element out, so its role queries only see the label.)
  const session = await page.context().newCDPSession(page);
  const { nodes } = await session.send('Accessibility.getFullAXTree');
  const names = nodes.filter((n) => n.role?.value === 'button').map((n) => n.name?.value);
  expect(names).toEqual(['Save', 'Loading Publish', 'Sending Send', 'Archive', 'Approve Approving']);
  const publish = page.getByRole('button', { name: 'Publish' });

  await publish.focus();
  await expect(publish).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  await publish.click({ force: true });
  await expect(page.getByText('Presses: 0')).toBeVisible();

  // Tab passes over the disabled button: after the two loading text buttons comes the icon button.
  const archive = page.getByRole('button', { name: 'Archive' });
  await expect(archive).toBeDisabled();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: /Approve/ })).toBeFocused();
  await archive.click({ force: true });
  await expect(page.getByText('Presses: 0')).toBeVisible();
});

test('button: collapseTo="icon" hides the label when it does not fit, and brings it back', async ({
  page,
}) => {
  await open(page, 'basics-buttons--collapse-to-icon');
  const button = page.getByRole('button', { name: 'Continue' });
  await expect(button.locator('[data-part="label"]')).toBeVisible();
  await expect(button).not.toHaveAttribute('data-icon-only');

  await page.setViewportSize({ width: 500, height: 720 });
  await expect(button).toHaveAttribute('data-icon-only', 'true');
  await expect(button.locator('[data-part="label"]')).toHaveCount(0);
  await expect(button).toHaveAttribute('aria-label', 'Continue');

  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(button.locator('[data-part="label"]')).toBeVisible();
  await expect(button).not.toHaveAttribute('data-icon-only');
});

test('button parts replace, change and hide pieces', async ({ page }) => {
  await open(page, 'basics-buttons--button-parts');
  const buttons = page.locator('[data-umbra="button"]');
  await expect(buttons.nth(0).locator('[data-part="label"]')).toHaveCSS('text-decoration-line', 'underline');
  await expect(buttons.nth(1).locator('[data-part="iconStart"]')).toHaveCount(0);
  await expect(buttons.nth(1).locator('[data-part="iconEnd"]')).toHaveCount(1);
  await expect(buttons.nth(2).locator('[data-part="iconEnd"]')).toHaveText('»');
  await expect(buttons.nth(3).locator('[data-part="spinner"]')).toHaveText('...');
});

test('icon button: a toggle flips aria-pressed', async ({ page }) => {
  await open(page, 'basics-buttons--icon-buttons');
  const star = page.getByRole('button', { name: 'Favourite' });
  await expect(star).toHaveAttribute('aria-pressed', 'true');
  await star.click();
  await expect(star).toHaveAttribute('aria-pressed', 'false');
  await star.focus();
  await page.keyboard.press('Space');
  await expect(star).toHaveAttribute('aria-pressed', 'true');
});

test('icon button: the tooltip shows on focus, can be turned off or replaced, and parts apply', async ({
  page,
}) => {
  await open(page, 'basics-buttons--icon-button-options');
  const tooltip = page.getByRole('tooltip');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Settings' })).toBeFocused();
  await expect(tooltip).toHaveText('Settings');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'No tooltip' })).toBeFocused();
  await expect(tooltip).toHaveCount(0);
  await page.keyboard.press('Tab');
  await expect(tooltip).toHaveText('Preferences for this workspace');

  await page.keyboard.press('Tab');
  const alerts = page.getByRole('button', { name: 'Alerts (120)' });
  await expect(alerts).toBeFocused();
  await expect(tooltip).toHaveText('Alerts (from a part)');
  await expect(alerts.locator('[data-part="badge"]')).toHaveText('');
  await expect(
    page.getByRole('button', { name: 'Muted alerts (3)' }).locator('[data-part="badge"]'),
  ).toHaveCount(0);
});

test('icon button: the badge is the public Badge, drawn but not text, and its count is in the name', async ({
  page,
}) => {
  await open(page, 'basics-buttons--icon-buttons');
  const button = page.getByRole('button', { name: 'Notifications (3)' });
  const badge = button.locator('[data-part="badge"]');
  await expect(badge).toHaveAttribute('aria-hidden', 'true');
  const indicator = badge.locator('[data-umbra="badge"] [data-part="indicator"]');
  // The count is drawn from an attribute: the button has no text content, only its name.
  await expect(indicator).toHaveAttribute('data-text', '3');
  await expect(button).toHaveText('');
  expect(await indicator.evaluate((el) => getComputedStyle(el, '::after').content)).toBe('"3"');
  // One default colour for a count: the badge of a button is the colour of a badge that stands alone.
  const colour = await indicator.evaluate((el) => getComputedStyle(el).backgroundColor);
  await open(page, 'data-badge--variants');
  const alone = page.locator('[data-umbra="badge"]:not([data-anchored]) [data-part="indicator"]').first();
  expect(await alone.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(colour);
  // A dot has no text and adds nothing to the name.
  await open(page, 'basics-buttons--icon-buttons');
  const dot = page.getByRole('button', { name: 'Notifications', exact: true }).locator('[data-part="badge"]');
  await expect(dot.locator('[data-part="indicator"]')).toHaveAttribute('data-dot', 'true');
});

test('skeleton: shapes, lines, and animation="none"', async ({ page }) => {
  await open(page, 'basics-buttons--skeletons');
  const skeletons = page.locator('[data-umbra="skeleton"]');
  await expect(skeletons).toHaveCount(4);
  await expect(skeletons.nth(0).locator('> span')).toHaveCount(3);
  await expect(skeletons.nth(1)).toHaveAttribute('data-shape', 'circle');
  await expect(skeletons.nth(2)).toHaveAttribute('data-shape', 'block');
  for (const s of await skeletons.all()) await expect(s).toHaveAttribute('aria-hidden', 'true');
  const animation = (i: number) => skeletons.nth(i).evaluate((el) => getComputedStyle(el).animationName);
  // Both wait 200ms before they appear; only the first pulses.
  expect(await animation(2)).toContain('pulse');
  expect(await animation(3)).not.toContain('pulse');
});
