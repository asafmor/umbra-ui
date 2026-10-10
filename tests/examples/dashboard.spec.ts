import { expect, test, type Page } from '@playwright/test';
import { exampleUrl } from '../../playwright.examples.config';

// The dashboard example's own interactions. The checks every example shares (loading, no page scroll,
// densities, tab mode, a keyboard walk) are in examples.spec.ts.
const root = (page: Page) => page.locator('[data-umbra-root]');
const collapsedByLayout = (page: Page) => page.locator('[data-umbra="card"][data-collapsed="layout"]');

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(exampleUrl('dashboard'));
  await page.getByRole('heading', { name: 'Revenue by region' }).waitFor();
});

test('Mod+K opens the palette, and a command changes the context tint', async ({ page }) => {
  await page.keyboard.press('ControlOrMeta+k');
  const palette = page.getByRole('dialog');
  await palette.getByRole('combobox').fill('teal');
  await page.keyboard.press('Enter');
  await expect(palette).toBeHidden();
  await expect(root(page)).toHaveAttribute('data-umbra-context', 'teal');
  await expect(
    page.getByRole('radiogroup', { name: 'Context' }).getByRole('radio', { name: 'Teal' }),
  ).toBeChecked();
});

test('the search trigger opens the palette, which lists commands and shortcuts', async ({ page }) => {
  await page.getByRole('button', { name: 'Search' }).click();
  const palette = page.getByRole('dialog');
  await expect(palette.getByRole('option', { name: /Next density level/ })).toBeVisible();
  await palette.getByRole('combobox').fill('compact');
  await palette.getByRole('option', { name: /Compact density/ }).click();
  await expect(root(page)).toHaveAttribute('data-umbra-density', 'compact');
});

test('the context switcher and the density shortcut change the provider', async ({ page }) => {
  await page.getByRole('radiogroup', { name: 'Context' }).getByRole('radio', { name: 'Green' }).click();
  await expect(root(page)).toHaveAttribute('data-umbra-context', 'green');
  await page.keyboard.press('Shift+D');
  await expect(root(page)).toHaveAttribute('data-umbra-density', 'spacious');
});

test('the navigation switches the channel, and the figures follow', async ({ page }) => {
  const revenue = page.locator('[data-umbra="summary-tile"]').first();
  const before = await revenue.innerText();
  await page.getByRole('navigation').getByText('Partners').click();
  await expect(revenue).not.toHaveText(before);
});

test('the stack collapses its lowest-priority cards in a low window only', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 600 });
  await expect(collapsedByLayout(page)).not.toHaveCount(0);
  // The card with the highest priority of the status column stays open.
  await expect(page.locator('[data-umbra="card"]', { hasText: 'Year target' })).not.toHaveAttribute(
    'data-collapsed',
  );
  await page.setViewportSize({ width: 1920, height: 1080 });
  await expect(collapsedByLayout(page)).toHaveCount(0);
});

test('one legend switches a region off in both charts', async ({ page }) => {
  const series = page.locator('[data-series="b"]');
  await expect(series).not.toHaveCount(0);
  await page.getByRole('button', { name: 'Region B' }).click();
  await expect(series).toHaveCount(0);
  await page.getByRole('button', { name: 'Region B' }).click();
  await expect(series).not.toHaveCount(0);
});
