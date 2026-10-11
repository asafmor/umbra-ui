import { expect, test, type Page } from '@playwright/test';
import { expectFocusKept, pressKeys, settle } from './helpers';

// The cross-cutting findings of review 2 (plan/reviews/milestone-2.md): overlays inside overlays, the
// shortcut registry beside every kind of control, and rows of controls that cannot move into a menu.
// The stories are `Integration/Review 2`.
const open = async (page: Page, story: string, place?: string, size = { width: 1280, height: 720 }) => {
  await page.setViewportSize(size);
  await page.goto(
    `/iframe.html?id=integration-review-2--${story}&viewMode=story${place ? `&in=${place}` : ''}`,
  );
  await page.locator('#storybook-root > *').first().waitFor();
};

const containers = { modal: 'Edit order', popover: 'Details' } as const;
const dialogs = (page: Page) => page.evaluate(() => document.querySelectorAll('[role="dialog"]').length);

for (const place of ['modal', 'popover'] as const) {
  const container = (page: Page) => page.getByRole('dialog', { name: containers[place], exact: true });
  const stillOpen = async (page: Page) => {
    await expect(container(page)).toBeVisible();
    await expect(page.getByText('Container: open')).toBeVisible();
  };

  // X-1: the popover of a collapsed card took the modal's open state for its own.
  test(`a stack that collapses in a ${place}: a header opens its card there, and the ${place} stays`, async ({
    page,
  }) => {
    await open(page, 'collapsed-cards', place);
    await stillOpen(page);
    const header = container(page).getByRole('button', { name: 'Notes', exact: true });
    await expect(header).toHaveAttribute('aria-expanded', 'false');
    await page.waitForLoadState('networkidle');
    await settle(page);
    // Before any press: the container, and no empty dialog of a collapsed card.
    expect(await dialogs(page)).toBe(1);
    await expect(page.getByRole('dialog')).toHaveCount(1);

    await header.focus();
    await pressKeys(page, 'Enter');
    const panel = page.getByRole('dialog', { name: 'Notes', exact: true });
    await expect(panel).toBeVisible();
    await expect(header).toHaveAttribute('aria-expanded', 'true');
    await stillOpen(page);
    // Inside the container's layer, so above it and not inert.
    expect(
      await panel.evaluate((el) => ({
        inert: !!el.closest('[inert]'),
        top: el.contains(
          document.elementFromPoint(
            el.getBoundingClientRect().x + 20,
            el.getBoundingClientRect().y + el.getBoundingClientRect().height / 2,
          ),
        ),
      })),
    ).toEqual({ inert: false, top: true });
    await panel.getByRole('button', { name: 'Use Notes' }).click();
    await expect(page.getByText('Last: Notes')).toBeVisible();
    await stillOpen(page);

    // Escape closes the card's popover first, and the focus is back on its header.
    await panel.getByRole('button', { name: 'Use Notes' }).focus();
    await pressKeys(page, 'Escape');
    await expect(panel).toHaveCount(0);
    await expect(header).toBeFocused();
    await stillOpen(page);
    expect(await dialogs(page)).toBe(1);

    // The pointer too, and a second press closes it again.
    await header.click();
    await expect(panel).toBeVisible();
    await stillOpen(page);
    await header.click();
    await expect(panel).toHaveCount(0);
    await stillOpen(page);
    // Only now does Escape close the container.
    if (place === 'modal') {
      await pressKeys(page, 'Escape');
      await expect(container(page)).toHaveCount(0);
    }
  });

  test(`overlays without a trigger of their own in a ${place} keep their own state`, async ({ page }) => {
    await open(page, 'standalone-overlays', place);
    await stillOpen(page);
    await settle(page);
    expect(await dialogs(page)).toBe(1);
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(page.getByText('Never', { exact: true })).toHaveCount(0);
    const inside = container(page);
    const last = (text: string) => expect(page.getByText(`Last: ${text}`)).toBeVisible();

    // A popover against an anchor.
    await inside.getByRole('button', { name: 'Panel', exact: true }).click();
    const panel = page.getByRole('dialog', { name: 'Panel', exact: true });
    await expect(panel).toBeVisible();
    await stillOpen(page);
    await panel.getByRole('button', { name: 'In the panel' }).click();
    await last('panel');
    await pressKeys(page, 'Escape');
    await expect(panel).toHaveCount(0);
    await stillOpen(page);

    // A menu against an anchor.
    await inside.getByRole('button', { name: 'Rows', exact: true }).click();
    await expect(page.getByRole('menu', { name: 'Rows' })).toBeVisible();
    await stillOpen(page);
    await page.getByRole('menuitem', { name: 'Row one' }).click();
    await last('one');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await stillOpen(page);

    // A tooltip.
    await inside.getByRole('button', { name: 'Hint', exact: true }).focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('tooltip')).toBeVisible();
    await stillOpen(page);

    // A select list.
    await inside.getByRole('button', { name: /Region/ }).click();
    await page.getByRole('option', { name: 'South' }).click();
    await last('south');
    await stillOpen(page);

    // The picker of an entity switcher.
    await inside.locator('[data-umbra="entity-switcher"] [aria-haspopup]').click();
    await page
      .getByRole('dialog', { name: 'Workspace' })
      .getByRole('button', { name: 'Workspace 2' })
      .click();
    await last('w2');
    await stillOpen(page);

    // A spotlight on something inside.
    await inside.getByRole('button', { name: 'Tour', exact: true }).click();
    const callout = page.getByRole('dialog', { name: 'The hint' });
    await expect(callout).toBeVisible();
    await expect(container(page)).toBeVisible();
    await callout.getByRole('button', { name: 'Done' }).click();
    await expect(callout).toHaveCount(0);
    await stillOpen(page);
    await expectFocusKept(page);
    expect(await dialogs(page)).toBe(1);
  });
}

// X-8.
for (const place of ['page', 'modal'] as const) {
  test(`a collapsed card removed while its popover has the focus (${place}): the focus goes to the next card`, async ({
    page,
  }) => {
    await open(page, 'collapsed-cards', place);
    const header = page.getByRole('button', { name: 'Notes', exact: true });
    await header.focus();
    await pressKeys(page, 'Enter');
    const panel = page.getByRole('dialog', { name: 'Notes', exact: true });
    await panel.getByRole('button', { name: 'Remove Notes' }).focus();
    await pressKeys(page, 'Enter');
    await expect(panel).toHaveCount(0);
    await expect(header).toHaveCount(0);
    await settle(page);
    // The next control of the stack: the header of the card after it.
    await expect(page.getByRole('button', { name: 'History', exact: true })).toBeFocused();
  });
}

// OP-3: only a control that takes text holds a bare key back.
test('a bare-key shortcut runs on a checkbox, a radio, a slider and a button, and is text in a field', async ({
  page,
}) => {
  await open(page, 'shortcuts');
  const count = (n: number) => expect(page.getByText(`New orders: ${n}`)).toBeVisible();
  let n = 0;
  for (const control of [
    page.getByRole('checkbox', { name: 'Checkbox' }),
    page.getByRole('switch', { name: 'Toggle' }),
    page.getByRole('radio', { name: 'Radio' }),
    page.getByRole('slider', { name: 'Range' }),
    page.getByRole('button', { name: 'Button' }),
  ]) {
    await control.focus();
    await pressKeys(page, 'n');
    await count(++n);
  }
  for (const field of [
    page.getByRole('textbox', { name: 'Text', exact: true }),
    page.getByRole('textbox', { name: 'Custom text' }),
    page.getByLabel('Date'),
  ]) {
    await field.focus();
    await pressKeys(page, 'n');
    await count(n);
  }
  await expect(page.getByRole('textbox', { name: 'Text', exact: true })).toHaveValue('n');

  // `?` opens the sheet from a checkbox, and not from a field.
  await page.getByRole('textbox', { name: 'Text', exact: true }).focus();
  await pressKeys(page, '?');
  await expect(page.locator('[data-umbra="shortcuts-sheet"]')).toHaveCount(0);
  await page.getByRole('checkbox', { name: 'Checkbox' }).focus();
  await pressKeys(page, '?');
  await expect(page.locator('[data-umbra="shortcuts-sheet"]')).toBeVisible();
});

// X-3: controls that stay in the row obey "nothing overflows its slot".
test.describe('controls that cannot move into the "more" menu', () => {
  for (const density of ['compact', 'default', 'spacious']) {
    for (const width of [380, 240]) {
      test(`${width}px, ${density}: the title keeps a minimum, nothing is cut, every control is reachable`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.goto(
          `/iframe.html?id=integration-review-2--kept-controls&viewMode=story&globals=density:${density}`,
        );
        const column = page.locator(`[data-width="${width}"]`);
        await column.locator('[data-umbra="card"]').first().waitFor();
        await page.evaluate(() => document.fonts.ready);
        await settle(page);
        for (const title of ['Orders by region', 'Filters']) {
          const card = column.locator('[data-umbra="card"]', { hasText: title });
          const state = await card.evaluate((el) => {
            const box = el.getBoundingClientRect();
            const header = el.querySelector<HTMLElement>('[data-part="header"]')!;
            const controls = [
              ...header.querySelectorAll<HTMLElement>('button, input, [role="switch"], [role="checkbox"]'),
            ].filter((c) => c.getClientRects().length > 0 && !c.closest('[aria-hidden="true"]'));
            const text = [...header.querySelectorAll<HTMLElement>('label, [data-part="label"]')];
            return {
              title: el.querySelector<HTMLElement>('[data-part="title"]')!.getBoundingClientRect().width,
              headerFits: header.scrollWidth <= header.clientWidth + 1,
              outside: controls
                .filter((c) => {
                  const r = c.getBoundingClientRect();
                  return r.left < box.left - 0.5 || r.right > box.right + 0.5 || r.bottom > box.bottom + 0.5;
                })
                .map((c) => c.getAttribute('aria-label') ?? c.textContent),
              // A control another element covers, or a clipping ancestor cuts, cannot be pressed.
              covered: controls
                .filter((c) => {
                  const r = c.getBoundingClientRect();
                  const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
                  return !top || !(c.contains(top) || top.contains(c) || c.closest('label')?.contains(top));
                })
                .map((c) => c.getAttribute('aria-label') ?? c.textContent),
              // A label wrapped to a letter per line is taller than three lines of its font.
              tallText: text
                .filter(
                  (t) => t.getBoundingClientRect().height > 3 * parseFloat(getComputedStyle(t).lineHeight),
                )
                .map((t) => t.textContent),
              count: controls.length,
            };
          });
          expect(state.title, `${title}: the title keeps a minimum`).toBeGreaterThanOrEqual(48);
          expect(state.headerFits, `${title}: the header does not overflow`).toBe(true);
          expect(state.outside, `${title}: controls outside the card`).toEqual([]);
          expect(state.covered, `${title}: controls that cannot be pressed`).toEqual([]);
          expect(state.tallText, `${title}: labels wrapped letter by letter`).toEqual([]);
          expect(state.count).toBeGreaterThan(0);
        }
        // Every control of the first card is a tab stop, and the "more" menu holds the two buttons.
        const card = column.locator('[data-umbra="card"]', { hasText: 'Orders by region' });
        await card.getByRole('button', { name: 'More actions' }).click();
        await page.getByRole('menuitem', { name: 'Refresh' }).click();
        await expect(card.getByText('Last: Refresh')).toBeVisible();
        const search = card.getByRole('searchbox').or(card.getByRole('combobox', { name: 'Search orders' }));
        await search.first().fill('abc');
        await expect(search.first()).toHaveValue('abc');
      });
    }
  }
});
