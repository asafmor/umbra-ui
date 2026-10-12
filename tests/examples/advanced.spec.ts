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
  await dialog.getByRole('button', { name: /Client/ }).click();
  const filter = page.getByRole('searchbox', { name: 'Filter options' });
  await filter.pressSequentially('nn');
  expect(await hash(page)).toBe('#/orders/new');
  await expect(filter).toHaveValue('nn');
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
  // Owner's O-8: nothing of the table (its sticky header, a pinned cell, a summary row) covers the bar.
  await expect(bar).toHaveCSS('opacity', '1');
  const covered = await bar.evaluate((el) => {
    const box = el.getBoundingClientRect();
    const points: [number, number][] = [
      [box.left + 3, box.top + 3],
      [box.right - 3, box.top + 3],
      [box.left + 3, box.bottom - 3],
      [box.right - 3, box.bottom - 3],
      ...[...el.querySelectorAll('button')].map((button): [number, number] => {
        const b = button.getBoundingClientRect();
        return [b.x + b.width / 2, b.y + b.height / 2];
      }),
    ];
    return points.filter(([x, y]) => !el.contains(document.elementFromPoint(x, y))).length;
  });
  expect(covered).toBe(0);

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
  await expect(dialog).toContainText('Choose the client');
  await expect(dialog.locator('[data-umbra="select"]')).toHaveAttribute('data-invalid', 'true');

  // The client is a choice: a searchable select over the clients.
  const choose = async (scope: typeof dialog, name: string) => {
    await scope.getByRole('button', { name: /Client/ }).click();
    await page.getByRole('searchbox', { name: 'Filter options' }).fill(name);
    await page.getByRole('option', { name, exact: true }).click();
  };
  await choose(dialog, 'Client 9');
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
  await expect(row).toContainText('Client 9');
  await expect(row).toContainText('4,321 cr');

  // Enter on a row opens it in the form; the route names the order.
  await row.getByRole('rowheader').click();
  await page.keyboard.press('Enter');
  expect(await hash(page)).toBe('#/orders/o-1041');
  const edit = page.getByRole('dialog', { name: 'Edit order 1041' });
  await expect(edit.getByRole('button', { name: /Client/ })).toContainText('Client 9');
  await choose(edit, 'Client 10');
  await edit.getByRole('button', { name: 'Save order' }).click();
  await expect(table(page).getByRole('row', { name: /Order 1041/ })).toContainText('Client 10');

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

test('the planner shows the orders by due date; an order opens its form, a day shows its week', async ({
  page,
}) => {
  await open(page);
  await nav(page).getByRole('link', { name: 'Planner' }).click();
  expect(await hash(page)).toBe('#/planner');
  const grid = page.getByRole('grid', { name: 'Orders by due date, November 2026' });
  await expect(grid).toBeVisible();
  expect(await context(page)).toBe('violet');

  // The week strip appears with the first day that is selected.
  await expect(page.getByText('Select a day in the month')).toBeVisible();
  await grid.getByRole('gridcell', { name: 'Tuesday, November 10, 2026' }).click();
  const strip = page.locator('[data-umbra="week-strip"]');
  await expect(strip.locator('time').first()).toHaveAttribute('datetime', '2026-11-09');

  // The next month is empty, and the first of the two is as it was on the way back.
  await page.getByRole('button', { name: 'Next month' }).click();
  await expect(page.getByRole('grid', { name: 'Orders by due date, December 2026' })).toBeVisible();
  await page.getByRole('button', { name: 'Previous month' }).click();

  // Order 1001 is due on the first: a press opens its form, which is a route.
  await grid.getByRole('gridcell', { name: /1001/ }).click();
  expect(await hash(page)).toBe('#/orders/o-1001');
  await expect(page.getByRole('dialog', { name: 'Edit order 1001' })).toBeVisible();

  await page.keyboard.press('Escape');
  await page.keyboard.press('Alt+4');
  expect(await hash(page)).toBe('#/planner');
});

test('the switcher in the bar steps through the clients and finds one by name', async ({ page }) => {
  await open(page);
  const bar = page.getByRole('navigation', { name: 'Section' });
  await bar.getByRole('button', { name: 'Next: Client 2' }).click();
  expect(await hash(page)).toBe('#/clients/c-2');
  await expect(page.getByRole('heading', { name: 'Client 2', level: 2 })).toBeVisible();
  // A rating is a picture with a text name.
  await expect(page.getByRole('img', { name: /Rating/ })).toBeVisible();

  await bar.getByRole('button', { name: 'Client 2', exact: true }).click();
  await page.keyboard.type('Client 17');
  const rows = page.getByRole('dialog').locator('[data-part="row"]');
  await expect(rows).toHaveCount(1);
  await rows.click();
  expect(await hash(page)).toBe('#/clients/c-17');

  // The switcher belongs to the clients: the other sections do not have it.
  await nav(page).getByRole('link', { name: 'Orders' }).click();
  await expect(bar.locator('[data-umbra="entity-switcher"]')).toHaveCount(0);
});

test('the split button of the bulk bar marks the selection as sent, or as another status', async ({
  page,
}) => {
  await open(page, '#/orders');
  const bar = page.getByRole('group', { name: 'Selected orders' });
  const row = (n: number) => table(page).getByRole('row', { name: new RegExp(`Order ${n}`) });
  await expect(row(1002)).toContainText('Sent');

  await page.getByRole('checkbox', { name: 'Select order 1002' }).check({ force: true });
  await bar.getByRole('button', { name: 'Mark as another status' }).click();
  await page.getByRole('menuitem', { name: 'Mark as packed' }).click();
  await expect(row(1002)).toContainText('Packed');
  await expect(bar).toBeHidden();

  await page.getByRole('checkbox', { name: 'Select order 1002' }).check({ force: true });
  await bar.getByRole('button', { name: 'Mark as sent' }).click();
  await expect(row(1002)).toContainText('Sent');
});

test('the stepper of the form and the slider of the settings change their values', async ({ page }) => {
  await open(page, '#/orders/o-1004');
  const dialog = page.getByRole('dialog', { name: 'Edit order 1004' });
  const items = dialog.getByRole('spinbutton', { name: 'Items' });
  const before = Number(await items.getAttribute('aria-valuenow'));
  await dialog.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(items).toHaveAttribute('aria-valuenow', String(before + 1));
  await expect(dialog).toContainText('Unsaved changes');
  await dialog.getByRole('button', { name: 'Save order' }).click();
  await expect(table(page).getByRole('row', { name: /Order 1004/ })).toBeVisible();

  await page.evaluate(() => (location.hash = '#/settings/notifications'));
  const slider = page.getByRole('slider', { name: 'Late after' });
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('group', { name: 'Late after' }).getByRole('status')).toHaveText('3 days');
  // The setting it belongs to switches it off.
  await page.getByRole('switch', { name: 'Late orders' }).click({ force: true });
  await expect(slider).toBeDisabled();
});

test('the tour walks through the frame, and ? lists the shortcuts of the app', async ({ page }) => {
  await open(page);
  const start = page.getByRole('button', { name: 'Take the tour' });
  await start.click();
  const callout = page.getByRole('dialog');
  for (const [i, title] of ['Four sections', 'Search everything', 'A new order', 'The page'].entries()) {
    await expect(callout).toHaveAccessibleName(title);
    await callout.getByRole('button', { name: i === 3 ? 'Done' : 'Next' }).click();
  }
  await expect(callout).toBeHidden();
  await expect(start).toBeFocused();

  await page.keyboard.press('Shift+T');
  await expect(callout).toHaveAccessibleName('Four sections');
  await page.keyboard.press('Escape');
  await expect(callout).toBeHidden();

  await page.keyboard.press('?');
  const sheet = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
  await expect(sheet.getByText('Go to the planner')).toBeVisible();
  await expect(sheet.getByText('Take the tour')).toBeVisible();
});

test("the user's columns are saved by the app and are there after a reload", async ({ page }) => {
  await open(page, '#/orders');
  const headers = () => table(page).locator('thead th [data-part="headerLabel"]').allTextContents();
  const before = (await headers()).filter(Boolean);
  expect(before).toContain('Region');

  // Hide a column from the list of the columns button, and move another from its header's menu.
  await table(page).getByRole('button', { name: 'Columns', exact: true }).click();
  const list = page.getByRole('dialog', { name: 'Columns' });
  await list.getByRole('checkbox', { name: 'Region' }).uncheck({ force: true });
  await page.keyboard.press('Escape');
  await table(page).getByRole('columnheader', { name: 'Client' }).click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Move right' }).click();
  await expect(table(page).getByRole('button', { name: '1 column hidden' })).toBeVisible();
  const after = (await headers()).filter(Boolean);
  expect(after).not.toContain('Region');
  expect(after.indexOf('Client')).toBe(before.indexOf('Client') + 1);

  // The app wrote it to its own storage; the table ships none.
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('advanced.orders.columns')!));
  expect(saved.visibility).toEqual({ region: false });
  expect(saved.order.indexOf('client')).toBe(2);

  await page.reload();
  await page.locator('[data-umbra="page"]').waitFor();
  await expect(table(page).getByRole('button', { name: '1 column hidden' })).toBeVisible();
  expect((await headers()).filter(Boolean)).toEqual(after);

  // "Reset" returns to the columns as the app defines them, and that is saved too.
  await table(page).getByRole('button', { name: '1 column hidden' }).click();
  await list.getByRole('button', { name: 'Reset' }).click();
  await expect.poll(async () => (await headers()).filter(Boolean)).toEqual(before);
  expect(await page.evaluate(() => localStorage.getItem('advanced.orders.columns'))).toBe('{}');
});
