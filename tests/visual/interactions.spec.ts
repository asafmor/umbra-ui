import { expect, test, type Page } from '@playwright/test';

// Behaviour the static captures cannot show: popovers, tab mode keys, overflow menus.
const open = async (page: Page, id: string, width = 1280, height = 720, density = 'default') => {
  await page.setViewportSize({ width, height });
  await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=density:${density}`);
  await page.locator('#storybook-root > *').first().waitFor();
};

test('a card collapsed by its stack opens its content in a popover, and Escape returns focus', async ({
  page,
}) => {
  await open(page, 'layout-page-layouts--stack-collapse');
  const card = page.locator('[data-umbra="card"][data-collapsed="layout"]').first();
  const header = card.getByRole('button', { name: 'Data hub' });
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
  const menu = page.getByRole('dialog');
  await expect(menu.getByRole('button', { name: 'Filter' })).toContainText('Filter');
  await menu.getByRole('button', { name: 'Export' }).click();
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
  const caret = nav.getByRole('button', { name: 'Orders' });
  await expect(caret).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(caret).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('dialog').getByRole('link', { name: 'Returns' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

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
  await expect(nav.getByRole('link', { name: 'Finance' })).toBeVisible();

  await page.setViewportSize({ width: 900, height: 600 });
  await expect(bar).toHaveAttribute('data-shrink', '3');
  await expect(nav.getByRole('link', { name: 'Overview' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Finance' })).toHaveCount(0);
  await nav.getByRole('button', { name: 'More' }).click();
  await expect(page.getByRole('dialog').getByRole('link', { name: 'Finance' })).toBeVisible();
  await page.keyboard.press('Escape');

  // Growing again brings everything back.
  await page.setViewportSize({ width: 1920, height: 1080 });
  await expect(bar).toHaveAttribute('data-shrink', '0');
  await expect(nav.getByRole('link', { name: 'Finance' })).toBeVisible();
});
