import { expect, test, type Page } from '@playwright/test';
import { exampleUrl } from '../../playwright.examples.config';

// The main interactions of examples/advanced: the hash router behind the navs, the palette and the
// history keys, list + detail, the table's sorting and bulk actions, and the form in a modal.
// Checkboxes and radios are checked with `force`: the real input lies under the mark that is drawn.
const url = exampleUrl('advanced');
const open = async (page: Page, route = '') => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(url + route);
  await page.locator('[data-umbra="page"]').waitFor();
};
const hash = (page: Page) => page.evaluate(() => window.location.hash);
const nav = (page: Page) => page.getByRole('navigation', { name: 'Main' });
const context = (page: Page) => page.locator('[data-umbra="page"]').getAttribute('data-umbra-context');
const table = (page: Page) => page.getByRole('grid', { name: 'Orders' });

test('the nav links change the route, the page and the context tint', async ({ page }) => {
  await open(page);
  await expect(page.getByRole('heading', { name: 'Clients', exact: true })).toBeVisible();
  const seen = [await context(page)];

  await nav(page).getByRole('link', { name: 'Orders' }).click();
  expect(await hash(page)).toBe('#/orders');
  await expect(page.getByRole('heading', { name: 'Orders', level: 1 })).toBeVisible();
  await expect(nav(page).getByRole('link', { name: 'Orders' })).toHaveAttribute('aria-current', 'page');
  seen.push(await context(page));

  await nav(page).getByRole('link', { name: 'Settings' }).click();
  expect(await hash(page)).toBe('#/settings');
  await expect(page.getByRole('heading', { name: 'Appearance' })).toBeVisible();
  seen.push(await context(page));

  await page.getByRole('navigation', { name: 'Settings' }).getByRole('link', { name: 'Profile' }).click();
  expect(await hash(page)).toBe('#/settings/profile');
  await expect(page.getByRole('textbox', { name: 'Email' })).toHaveValue('person1@example.com');

  expect(seen).toEqual(['teal', 'slate', 'green']);
});

test('an unknown route shows the not-found state with a way back', async ({ page }) => {
  await open(page, '#/nowhere');
  await page.getByRole('link', { name: 'Go to clients' }).click();
  expect(await hash(page)).toBe('#/clients');
  await expect(page.getByRole('heading', { name: 'Clients', exact: true })).toBeVisible();
});

test('the palette goes to a section and to a client', async ({ page }) => {
  await open(page);
  await page.keyboard.press('ControlOrMeta+k');
  const input = page.getByRole('combobox');
  await input.fill('orders');
  await page.keyboard.press('Enter');
  await expect(input).toBeHidden();
  expect(await hash(page)).toBe('#/orders');

  await page.keyboard.press('ControlOrMeta+k');
  await page.getByRole('combobox').fill('client 12');
  await page.keyboard.press('Enter');
  expect(await hash(page)).toBe('#/clients/c-12');
  await expect(page.getByRole('heading', { name: 'Client 12', level: 2 })).toBeVisible();
});

test('the app shortcuts and the history keys move between routes', async ({ page }) => {
  await open(page);
  await page.keyboard.press('Alt+2');
  await expect(page.getByRole('heading', { name: 'Orders', level: 1 })).toBeVisible();
  await page.keyboard.press('Alt+3');
  await expect(page.getByRole('heading', { name: 'Appearance' })).toBeVisible();

  await page.keyboard.press('Alt+ArrowLeft');
  await expect(page.getByRole('heading', { name: 'Orders', level: 1 })).toBeVisible();
  expect(await hash(page)).toBe('#/orders');
  await page.keyboard.press('Alt+ArrowRight');
  await expect(page.getByRole('heading', { name: 'Appearance' })).toBeVisible();

  // The browser's own history does the same, and so do the buttons in the top bar.
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Orders', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Forward' }).click();
  await expect(page.getByRole('heading', { name: 'Appearance' })).toBeVisible();

  // A bare key opens the form, and does nothing while the user types.
  await page.keyboard.press('n');
  const dialog = page.getByRole('dialog', { name: 'New order' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('textbox', { name: 'Client' }).pressSequentially('nn');
  expect(await hash(page)).toBe('#/orders/new');
  await expect(dialog.getByRole('textbox', { name: 'Client' })).toHaveValue('nn');
});

test('selecting a client shows its details and puts it in the route', async ({ page }) => {
  await open(page);
  const list = page.getByRole('grid', { name: 'Clients' });
  await expect(list.getByRole('row', { name: /Client 1\b/ })).toHaveAttribute('aria-selected', 'true');

  await list.getByRole('row', { name: /Client 4/ }).click();
  expect(await hash(page)).toBe('#/clients/c-4');
  await expect(page.getByRole('heading', { name: 'Client 4', level: 2 })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Contacts' })).toContainText('@example.com');

  // Selection follows the arrow keys.
  await page.keyboard.press('ArrowDown');
  expect(await hash(page)).toBe('#/clients/c-5');
  await expect(page.getByRole('heading', { name: 'Client 5', level: 2 })).toBeVisible();

  await page.goBack();
  await expect(list.getByRole('row', { name: /Client 4/ })).toHaveAttribute('aria-selected', 'true');

  // The breadcrumb is a router link.
  await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Clients' }).click();
  expect(await hash(page)).toBe('#/clients');
});

test('a column header sorts the table', async ({ page }) => {
  await open(page, '#/orders');
  const first = () => table(page).getByRole('row').nth(1).getByRole('rowheader');
  await expect(first()).toContainText('Order 1001');

  const total = table(page).getByRole('columnheader', { name: 'Total' });
  await total.getByRole('button').click();
  await expect(total).toHaveAttribute('aria-sort', 'descending');
  const totals = await table(page).getByRole('row').nth(1).getByRole('gridcell').allTextContents();
  expect(totals.join(' ')).toContain('1,935 cr');

  const order = table(page).getByRole('columnheader', { name: 'Order' });
  await order.getByRole('button').click();
  await expect(order).toHaveAttribute('aria-sort', 'ascending');
  await expect(first()).toContainText('Order 1001');
});

test('bulk selection opens the action bar; delete asks first', async ({ page }) => {
  await open(page, '#/orders');
  const bar = page.getByRole('group', { name: 'Selected orders' });
  await expect(bar).toBeHidden();

  await page.getByRole('checkbox', { name: 'Select order 1002' }).check({ force: true });
  await page.getByRole('checkbox', { name: 'Select order 1003' }).check({ force: true });
  await expect(bar).toContainText('2 selected');

  await bar.getByRole('button', { name: 'Clear selection' }).click();
  await expect(bar).toBeHidden();
  await expect(page.getByRole('checkbox', { name: 'Select order 1002' })).not.toBeChecked();

  await page.getByRole('checkbox', { name: 'Select order 1002' }).check({ force: true });
  await bar.getByRole('button', { name: 'Delete' }).click();
  const confirm = page.getByRole('alertdialog', { name: 'Delete 1 order?' });
  await confirm.getByRole('button', { name: 'Delete' }).click();
  await expect(confirm).toBeHidden();
  await expect(table(page).getByRole('rowheader', { name: 'Order 1002' })).toHaveCount(0);
  await expect(page.getByText('39 orders')).toBeVisible();
  await expect(bar).toBeHidden();
});

test('the modal form validates, adds a row and edits one', async ({ page }) => {
  await open(page, '#/orders');
  await page.getByRole('button', { name: 'Add order' }).click();
  expect(await hash(page)).toBe('#/orders/new');
  const dialog = page.getByRole('dialog', { name: 'New order' });

  await dialog.getByRole('button', { name: 'Create order' }).click();
  await expect(dialog).toContainText('Enter the client');
  await expect(dialog.getByRole('textbox', { name: 'Client' })).toHaveAttribute('aria-invalid', 'true');

  await dialog.getByRole('textbox', { name: 'Client' }).fill('Client 99');
  await dialog.getByRole('radio', { name: 'Region C' }).check({ force: true });
  await dialog.getByRole('spinbutton', { name: 'Total' }).fill('4321');
  await dialog.getByRole('checkbox', { name: 'Priority handling' }).check({ force: true });
  await dialog.getByRole('button', { name: 'Create order' }).click();

  await expect(dialog).toBeHidden();
  expect(await hash(page)).toBe('#/orders');
  await expect(page.getByText('41 orders')).toBeVisible();
  // The new row is the last one; sorting by total brings it into view.
  await table(page).getByRole('columnheader', { name: 'Total' }).getByRole('button').click();
  const row = table(page).getByRole('row', { name: /Order 1041/ });
  await expect(row).toContainText('Client 99');
  await expect(row).toContainText('4,321 cr');

  // Enter on a row opens it in the form; the route names the order.
  await row.getByRole('rowheader').click();
  await page.keyboard.press('Enter');
  expect(await hash(page)).toBe('#/orders/o-1041');
  const edit = page.getByRole('dialog', { name: 'Edit order 1041' });
  await expect(edit.getByRole('textbox', { name: 'Client' })).toHaveValue('Client 99');
  await edit.getByRole('textbox', { name: 'Client' }).fill('Client 100');
  await edit.getByRole('button', { name: 'Save order' }).click();
  await expect(table(page).getByRole('row', { name: /Order 1041/ })).toContainText('Client 100');

  // Escape closes the form and returns to the list's route.
  await page.keyboard.press('n');
  await expect(page.getByRole('dialog', { name: 'New order' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  expect(await hash(page)).toBe('#/orders');
});

test('the density chosen in the settings stays while the route changes', async ({ page }) => {
  await open(page, '#/settings');
  const root = page.locator('[data-umbra-root]');
  await expect(root).toHaveAttribute('data-umbra-density', 'default');
  await page.getByRole('radiogroup', { name: 'Density' }).getByRole('radio', { name: 'Compact' }).click();
  await expect(root).toHaveAttribute('data-umbra-density', 'compact');
  await nav(page).getByRole('link', { name: 'Clients' }).click();
  await expect(root).toHaveAttribute('data-umbra-density', 'compact');
});
