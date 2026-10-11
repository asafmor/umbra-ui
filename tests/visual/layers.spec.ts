import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectFocusKept, openStory } from './helpers';

// Overlays in combination (plan/tokens.json "layer", plan/specs/Modal.md): everything opened from
// inside a modal is above it, reachable and described; the palette opens over a modal; each in both
// text directions.

/** True when `el` is what a press at its centre would hit: nothing is painted over it. */
const onTop = (el: Locator) =>
  el.evaluate((node) => {
    const box = node.getBoundingClientRect();
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return !!hit && (node === hit || node.contains(hit));
  });
/** True when nothing around `el` makes it inert or hidden from assistive technology. */
const reachable = (el: Locator) => el.evaluate((node) => !node.closest('[inert], [aria-hidden="true"]'));
const direction = (el: Locator) => el.evaluate((node) => getComputedStyle(node).direction);

for (const dir of ['ltr', 'rtl'] as const) {
  test.describe(`inside a modal, ${dir}`, () => {
    const open = async (page: Page) => {
      await openStory(page, 'overlays-layers--in-modal', { direction: dir });
      await expect(page.getByRole('dialog', { name: 'Edit order' })).toBeVisible();
    };

    test('a tooltip is above the modal, not inert, and describes its control', async ({ page }) => {
      await open(page);
      const button = page.getByRole('button', { name: 'Dispatch' });
      await button.focus();
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Tab');
      const tooltip = page.getByRole('tooltip');
      await expect(tooltip).toHaveText('Sends the order to the warehouse');
      expect(await reachable(tooltip)).toBe(true);
      expect(await onTop(tooltip)).toBe(true);
      expect(await direction(tooltip)).toBe(dir);
      await expect(button).toHaveAccessibleDescription('Sends the order to the warehouse');
    });

    test('a menu opens above the modal and its rows can be chosen', async ({ page }) => {
      await open(page);
      await page.getByRole('button', { name: 'Order actions' }).focus();
      await page.keyboard.press('Enter');
      const menu = page.getByRole('menu');
      await expect(menu).toBeVisible();
      expect(await reachable(menu)).toBe(true);
      expect(await onTop(menu.getByRole('menuitem', { name: 'Archive' }))).toBe(true);
      expect(await direction(menu)).toBe(dir);
      await expectFocusKept(page);
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await expect(page.getByText('Last: archive')).toBeVisible();
      // The modal is still open, and focus is back on the trigger inside it.
      await expect(page.getByRole('dialog', { name: 'Edit order' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Order actions' })).toBeFocused();
    });

    test('a select list opens above the modal and an option can be chosen', async ({ page }) => {
      await open(page);
      await page.getByRole('button', { name: /Region/ }).focus();
      await page.keyboard.press('Enter');
      const list = page.getByRole('listbox');
      await expect(list).toBeVisible();
      expect(await reachable(list)).toBe(true);
      expect(await onTop(list.getByRole('option', { name: 'South' }))).toBe(true);
      expect(await direction(list)).toBe(dir);
      await list.getByRole('option', { name: 'South' }).click();
      await expect(page.getByText('Last: south')).toBeVisible();
      await expect(page.getByRole('dialog', { name: 'Edit order' })).toBeVisible();
      await expectFocusKept(page);
    });

    test('search suggestions open above the modal and one can be chosen', async ({ page }) => {
      await open(page);
      const field = page.getByRole('combobox', { name: 'Find an order' });
      await field.focus();
      await page.keyboard.type('Order');
      const list = page.getByRole('listbox');
      await expect(list).toBeVisible();
      expect(await reachable(list)).toBe(true);
      expect(await onTop(list.getByRole('option').first())).toBe(true);
      expect(await direction(list)).toBe(dir);
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await expect(page.getByText('Last: Order 12', { exact: true })).toBeVisible();
      await expect(page.getByRole('dialog', { name: 'Edit order' })).toBeVisible();
    });

    test('a popover opens above the modal, and Escape closes only the popover', async ({ page }) => {
      await open(page);
      const trigger = page.getByRole('button', { name: 'Notes' });
      await trigger.focus();
      await page.keyboard.press('Enter');
      const popover = page.getByRole('dialog', { name: 'Notes' });
      await expect(popover).toBeVisible();
      expect(await reachable(popover)).toBe(true);
      expect(await onTop(popover.getByRole('button', { name: 'Add a note' }))).toBe(true);
      expect(await direction(popover)).toBe(dir);
      await popover.getByRole('button', { name: 'Add a note' }).click();
      await expect(page.getByText('Last: note')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(popover).toHaveCount(0);
      await expect(page.getByRole('dialog', { name: 'Edit order' })).toBeVisible();
      await expect(trigger).toBeFocused();
    });
  });

  test(`the palette opens over a modal with focus in its input, ${dir}`, async ({ page }) => {
    await openStory(page, 'overlays-layers--palette-over-modal', { direction: dir });
    const modal = page.getByRole('dialog', { name: 'Edit order' });
    await expect(modal).toBeVisible();
    await page.keyboard.press('ControlOrMeta+k');
    const input = page.getByRole('combobox');
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();
    expect(await onTop(input)).toBe(true);
    expect(await direction(input)).toBe(dir);
    // Typing goes to the palette, and a command runs.
    await page.keyboard.type('exp');
    await expect(page.getByRole('option', { name: 'Export orders' })).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.getByText('Last command: Export orders')).toBeAttached();
    // The palette has closed; the modal is still there and has the focus back.
    await expect(input).toHaveCount(0);
    await expect(modal).toBeVisible();
    await expect.poll(() => modal.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  });

  test(`a modal opened from a modal is above it, and closing it returns to the first, ${dir}`, async ({
    page,
  }) => {
    await openStory(page, 'overlays-modal--nested', { direction: dir });
    const inner = page.getByRole('dialog', { name: 'Add a note' });
    const outer = page.getByRole('dialog', { name: 'Order 12' });
    await expect(inner).toBeVisible();
    expect(await onTop(inner.getByRole('textbox', { name: 'Note' }))).toBe(true);
    expect(await direction(inner)).toBe(dir);
    await expect.poll(() => inner.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(inner).toHaveCount(0);
    await expect(outer).toBeVisible();
    await expect.poll(() => outer.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  });
}

test('the layers are tokens, in order: popover, tooltip, modal, palette', async ({ page }) => {
  await openStory(page, 'overlays-layers--in-modal');
  const layers = await page.evaluate(() => {
    const css = getComputedStyle(document.querySelector('[data-umbra-root]')!);
    return ['popover', 'tooltip', 'modal', 'palette'].map((name) =>
      Number(css.getPropertyValue(`--umbra-layer-${name}`)),
    );
  });
  expect(layers.every((value, i) => i === 0 || value > layers[i - 1]!)).toBe(true);
  const backdrop = page.locator('[data-umbra="modal-backdrop"]');
  expect(await backdrop.evaluate((el) => Number(getComputedStyle(el).zIndex))).toBe(layers[2]);
  // An app can move a whole layer from the provider root.
  await page.evaluate(() =>
    document.querySelector<HTMLElement>('[data-umbra-root]')!.style.setProperty('--umbra-layer-popover', '5'),
  );
  await page.getByRole('button', { name: 'Order actions' }).click();
  const menu = page.locator('[data-umbra="menu"]');
  await expect(menu).toBeVisible();
  expect(await menu.evaluate((el) => getComputedStyle(el).zIndex)).not.toBe('100000');
});
