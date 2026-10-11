import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectFocusKept, openStory, pressKeys } from './helpers';

// The tooltips the library opens by itself (a text that is cut, a table cell, a table header), a chart's
// tooltip and a card's header menu, inside a modal: above it, not inert, and a tooltip can be hovered
// and dismissed (WCAG 1.4.13) without closing the modal (plan/specs/Modal.md, plan/specs/Tooltip.md).

const modalOf = (page: Page) => page.getByRole('dialog', { name: 'Order lines' });
const open = async (page: Page) => {
  await openStory(page, 'overlays-layers--data-in-modal');
  await expect(modalOf(page)).toBeVisible();
  // The modal has finished its entrance: nothing below moves while the pointer does.
  await expect(page.locator('[data-umbra="modal-backdrop"]')).not.toHaveAttribute('data-entering');
};

/** True when `el` is what a press at its centre would hit: nothing is painted over it. */
const onTop = (el: Locator) =>
  el.evaluate((node) => {
    const box = node.getBoundingClientRect();
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return !!hit && (node === hit || node.contains(hit));
  });
const reachable = (el: Locator) => el.evaluate((node) => !node.closest('[inert], [aria-hidden="true"]'));
const insideBackdrop = (el: Locator) =>
  el.evaluate((node) => !!node.closest('[data-umbra="modal-backdrop"]'));

/** The tooltip is shown where a user can read it: above the modal, inside its layer, not inert. */
async function expectUsable(page: Page, text: string) {
  const tip = page.getByRole('tooltip');
  await expect(tip).toHaveText(text);
  await expect(tip).not.toHaveAttribute('data-entering');
  expect(await insideBackdrop(tip)).toBe(true);
  expect(await reachable(tip)).toBe(true);
  expect(await onTop(tip)).toBe(true);
  return tip;
}

/** Hoverable: the tooltip stays while the pointer moves onto it and rests there, and goes when it leaves. */
async function expectHoverable(page: Page, tip: Locator) {
  const box = (await tip.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
  // Longer than the time a tooltip waits before it hides.
  await page.waitForTimeout(500);
  await expect(tip).toBeVisible();
  await page.mouse.move(2, 2, { steps: 4 });
  await expect(tip).toHaveCount(0);
  await expect(modalOf(page)).toBeVisible();
}

/** Escape dismisses the tooltip only: the modal stays, and so does the focus. */
async function expectEscapeDismisses(page: Page, tip: Locator) {
  await page.keyboard.press('Escape');
  await expect(tip).toHaveCount(0);
  await expect(modalOf(page)).toBeVisible();
  await expectFocusKept(page);
}

const cases = [
  {
    name: 'a text that is cut',
    text: 'A delivery note that is far too long to fit on one line of this list',
    hover: (page: Page) => page.locator('[data-umbra="list-item"] [data-part="title"]'),
    focus: (page: Page) => page.getByRole('button', { name: /A delivery note/ }),
    keys: ['Tab', 'Shift+Tab'],
  },
  {
    name: 'a table cell that is cut',
    text: 'Shelf bracket, powder coated, 300 mm, box of 40',
    hover: (page: Page) => page.getByRole('rowheader', { name: /Shelf bracket/ }),
    focus: (page: Page) => page.getByRole('rowheader', { name: /Shelf bracket/ }),
    keys: ['Tab', 'ArrowDown'],
  },
  {
    name: 'a table header with a hint',
    text: 'Handling note',
    hover: (page: Page) => page.getByRole('columnheader', { name: 'Note' }),
    focus: (page: Page) => page.getByRole('columnheader', { name: 'Note' }),
    keys: ['Tab', 'ArrowRight'],
  },
];

for (const { name, text, hover, focus, keys } of cases) {
  test.describe(`the tooltip of ${name}, in a modal`, () => {
    test('shows on hover, can be hovered, and Escape dismisses it alone', async ({ page }) => {
      await open(page);
      await hover(page).hover();
      const tip = await expectUsable(page, text);
      await expectHoverable(page, tip);
      await hover(page).hover();
      await expectUsable(page, text);
      await expectEscapeDismisses(page, tip);
    });

    test('shows on keyboard focus, and Escape dismisses it alone', async ({ page }) => {
      await open(page);
      // The modal opens with the focus on its first control, the list row. The target is reached from
      // there with the keyboard, so the focus is one a tooltip answers to.
      const target = focus(page);
      await expect(page.getByRole('button', { name: /A delivery note/ })).toBeFocused();
      await pressKeys(page, ...keys);
      await expect(target).toBeFocused();
      const tip = await expectUsable(page, text);
      await expectEscapeDismisses(page, tip);
      await expect(target).toBeFocused();
    });
  });
}

test("a chart's tooltip shows inside a modal, above it", async ({ page }) => {
  await open(page);
  // The modal opens with the focus on the list row, whose text is cut: its tooltip takes the first Escape.
  await expect(page.getByRole('tooltip')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  const chart = modalOf(page).locator('[data-umbra="bar-chart"]');
  await chart.getByRole('option', { name: /Bracket/ }).hover();
  const tip = chart.locator('[data-part="tooltip"]');
  await expect(tip).toBeVisible();
  // Drawn inside the chart, so inside the modal. It is hidden from assistive technology by design
  // (the points carry the names), so only `inert` is checked.
  expect(await tip.evaluate((node) => !node.closest('[inert]'))).toBe(true);
  // It takes no pointer events, so a hit test passes through it: what is under it is the modal's content.
  const under = await tip.evaluate((node) => {
    const box = node.getBoundingClientRect();
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return !!hit?.closest('[role="dialog"]');
  });
  expect(under).toBe(true);
  // A chart does not stop the key (plan/specs/BarChart.md): the tooltip goes, and so does the modal.
  await page.keyboard.press('Escape');
  await expect(tip).toHaveCount(0);
});

test("a card's header menu opens inside a modal, above it, and a row runs", async ({ page }) => {
  await open(page);
  // The header has room for its two actions: narrow the card until it has not.
  await modalOf(page)
    .locator('[data-umbra="card"]')
    .evaluate((card) => (card.parentElement!.style.width = '240px'));
  const more = modalOf(page).getByRole('button', { name: 'More actions' });
  await more.focus();
  await page.keyboard.press('Enter');
  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  expect(await insideBackdrop(menu)).toBe(true);
  expect(await reachable(menu)).toBe(true);
  expect(await onTop(menu.getByRole('menuitem').first())).toBe(true);
  await expectFocusKept(page);
  await menu.getByRole('menuitem', { name: 'Import lines' }).click();
  await expect(page.getByText('Last: import')).toBeVisible();
  await expect(modalOf(page)).toBeVisible();
  await expectFocusKept(page);
});
