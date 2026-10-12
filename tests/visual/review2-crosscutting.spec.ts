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

// OP-2: a spotlight that is not interactive lets nothing but its callout be used, shortcuts included.
test.describe('a spotlight and the shortcut registry', () => {
  const callout = (page: Page) => page.getByRole('dialog', { name: 'The dialog button' });
  const sheet = (page: Page) => page.locator('[data-umbra="shortcuts-sheet"]');

  test('not interactive: no shortcut of the registry runs, and Escape still closes it', async ({ page }) => {
    await open(page, 'shortcuts');
    await page.getByRole('button', { name: 'Show locked' }).click();
    await expect(callout(page)).toBeVisible();
    await pressKeys(page, 'n', '?');
    await settle(page);
    await expect(page.getByText('New orders: 0')).toBeVisible();
    await expect(sheet(page)).toHaveCount(0);
    await expect(callout(page)).toBeVisible();
    await pressKeys(page, 'Escape');
    await expect(callout(page)).toHaveCount(0);
    // The page is itself again.
    await pressKeys(page, 'n');
    await expect(page.getByText('New orders: 1')).toBeVisible();
  });

  test('interactive: shortcuts run, and a modal that opens takes the place of the spotlight', async ({
    page,
  }) => {
    await open(page, 'shortcuts');
    await page.getByRole('button', { name: 'Show usable' }).click();
    await expect(callout(page)).toBeVisible();
    await pressKeys(page, 'n');
    await expect(page.getByText('New orders: 1')).toBeVisible();

    // The target opens a modal: it is not left under the dim.
    await page.getByRole('button', { name: 'Open dialog' }).click();
    const modal = page.getByRole('dialog', { name: 'A dialog' });
    await expect(modal).toBeVisible();
    await expect(callout(page)).toHaveCount(0);
    await expect(page.locator('[data-umbra="spotlight"]')).toHaveCount(0);
    await expect(page.getByText('Spotlight: closed')).toBeAttached();
    expect(
      await modal.evaluate((el) => {
        const box = el.getBoundingClientRect();
        return el.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
      }),
    ).toBe(true);
    await expectFocusKept(page);
    await pressKeys(page, 'Escape');
    await expect(modal).toHaveCount(0);

    // The sheet is a modal too.
    await page.getByRole('button', { name: 'Show usable' }).click();
    await expect(callout(page)).toBeVisible();
    await pressKeys(page, '?');
    await expect(sheet(page)).toBeVisible();
    await expect(callout(page)).toHaveCount(0);
    await expectFocusKept(page);
  });

  // OP-8.
  test('a tour whose targets are all missing passes over each step, then closes, in that order', async ({
    page,
  }) => {
    await open(page, 'shortcuts');
    await page.getByRole('button', { name: 'Missing tour' }).click();
    await expect(page.getByText(/Tour: .*closed/)).toBeVisible();
    await settle(page);
    await settle(page);
    await expect(page.getByText('Tour: step 1, step 2, closed', { exact: false })).toBeVisible();
    await expect(page.getByText(/closed, /)).toHaveCount(0);
    await expectFocusKept(page);
  });
});

// O-8: the floating bar of a selection is above every sticky row and cell of the table under it.
test.describe('a floating action bar over a table', () => {
  for (const footer of [true, false]) {
    for (const density of ['compact', 'default', 'spacious']) {
      for (const [width, height] of [
        [1920, 1080],
        [1280, 720],
        [1024, 600],
      ] as const) {
        test(`${footer ? 'with' : 'without'} a summary row, ${density}, ${width}x${height}: every button of the bar can be pressed`, async ({
          page,
        }) => {
          await page.setViewportSize({ width, height });
          await page.goto(
            `/iframe.html?id=integration-review-2--bar-over-table&viewMode=story&globals=density:${density}${footer ? '' : '&footer=0'}`,
          );
          const bar = page.getByRole('group', { name: 'Selected orders' });
          await expect(bar).toBeVisible();
          await expect(bar).toHaveCSS('opacity', '1');
          await expect(page.locator('[data-umbra="data-table"] tfoot')).toHaveCount(footer ? 1 : 0);
          // The whole bar: its corners, its middle, and the middle of each button.
          const covered = await bar.evaluate((el) => {
            const box = el.getBoundingClientRect();
            const points: [string, number, number][] = [
              ['top left', box.left + 3, box.top + 3],
              ['top right', box.right - 3, box.top + 3],
              ['bottom left', box.left + 3, box.bottom - 3],
              ['bottom right', box.right - 3, box.bottom - 3],
              ['middle', box.left + box.width / 2, box.top + box.height / 2],
              ...[...el.querySelectorAll('button')].map((button): [string, number, number] => {
                const b = button.getBoundingClientRect();
                return [
                  button.textContent || button.getAttribute('aria-label')!,
                  b.x + b.width / 2,
                  b.y + b.height / 2,
                ];
              }),
            ];
            return points
              .filter(([, x, y]) => !el.contains(document.elementFromPoint(x, y)))
              .map(([name]) => name);
          });
          expect(covered, 'points of the bar that something covers').toEqual([]);
          const inside = await bar.evaluate((el) => {
            const box = el.getBoundingClientRect();
            const card = el.closest('[data-umbra="card"]')!.getBoundingClientRect();
            return box.left >= card.left && box.right <= card.right && box.bottom <= card.bottom;
          });
          expect(inside, 'the bar is inside its card').toBe(true);
          await bar.getByRole('button', { name: 'Archive' }).click();
          await expect(page.getByText('Last: Archive')).toBeVisible();
        });
      }
    }
  }
});

// O-5: a pressed toggle is a filled, coloured icon; a pointer press leaves no focus ring.
test.describe('toggle buttons', () => {
  const look = (page: Page, name: string) =>
    page.getByRole('button', { name, exact: true }).evaluate((el) => {
      const style = getComputedStyle(el);
      const svg = getComputedStyle(el.querySelector('svg')!);
      return {
        pressed: el.getAttribute('aria-pressed'),
        fill: svg.fill,
        color: style.color,
        border: style.borderTopColor,
        ring: style.outlineStyle,
      };
    });

  test('pressed: the accent colour and a filled icon; a ghost icon button has no box', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/iframe.html?id=basics-buttons--toggles&viewMode=story');
    const off = await look(page, 'Star (off)');
    const on = await look(page, 'Star');
    expect(off).toMatchObject({ pressed: 'false', fill: 'none', ring: 'none' });
    expect(on.pressed).toBe('true');
    // Filled with its own colour, which is not the colour of the one that is off.
    expect(on.fill).toBe(on.color);
    expect(on.color).not.toBe(off.color);
    expect(on.border).toBe('rgba(0, 0, 0, 0)');
    // With a box, the outline stays as well.
    const boxed = await look(page, 'Star (neutral)');
    expect(boxed.fill).toBe(boxed.color);
    expect(boxed.border).toBe(boxed.color);
    // An icon of its own is drawn as it is.
    expect((await look(page, 'Notify')).fill).toBe('none');
    // A text button fills its icon and keeps the outline.
    const text = await look(page, 'Pinned (ghost)');
    expect(text.fill).toBe(text.color);
    expect(text.border).toBe(text.color);
  });

  test('by pointer and by keyboard: the state follows, a ring only after Tab', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/iframe.html?id=basics-buttons--toggles&viewMode=story');
    const star = page.getByRole('button', { name: 'Star (off)', exact: true });
    // The keyboard was used before: the next pointer press must still leave no ring.
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    await star.click();
    await expect(star).toHaveAttribute('aria-pressed', 'true');
    await expect(star).toBeFocused();
    await settle(page);
    expect(await look(page, 'Star (off)')).toMatchObject({ ring: 'none' });
    expect((await look(page, 'Star (off)')).fill).not.toBe('none');
    await star.click();
    await expect(star).toHaveAttribute('aria-pressed', 'false');
    expect(await look(page, 'Star (off)')).toMatchObject({ ring: 'none', fill: 'none' });
    // The keyboard: Space toggles, and the ring shows.
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(star).toBeFocused();
    expect((await look(page, 'Star (off)')).ring).toBe('solid');
    await pressKeys(page, 'Space');
    await expect(star).toHaveAttribute('aria-pressed', 'true');
    expect((await look(page, 'Star (off)')).fill).not.toBe('none');
  });

  test('the star of a message in the inbox: filled when on, and no ring after a pointer press', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/iframe.html?id=pages-list-and-detail--list-and-detail&viewMode=story');
    const star = page.getByRole('button', { name: 'Star', exact: true });
    // A whole page: it may take longer than a story of one component.
    await expect(star).toBeVisible({ timeout: 20_000 });
    await page.evaluate(() => document.fonts.ready);
    // As a user who has just used the keyboard.
    await page.keyboard.press('Tab');
    for (let press = 0; press < 3; press++) {
      await star.click();
      await settle(page);
      await expect(star).toHaveAttribute('aria-pressed', press % 2 ? 'false' : 'true');
      const now = await look(page, 'Star');
      expect(now.ring, `press ${press + 1}: no ring`).toBe('none');
      expect(now.fill === 'none', `press ${press + 1}: fill`).toBe(press % 2 === 1);
      expect(now.border).toBe('rgba(0, 0, 0, 0)');
    }
  });
});

// X-9: with a control that stayed in the row before the actions, "the first control of the row" and
// "the first action that came back" are two different places.
test('the row has room again as its menu closes: the focus goes to an action that came back', async ({
  page,
}) => {
  await open(page, 'kept-controls');
  const column = page.locator('[data-width="380"]');
  const card = column.locator('[data-umbra="card"]', { hasText: 'Orders by region' });
  await page.evaluate(() => document.fonts.ready);
  await card.getByRole('button', { name: 'More actions' }).focus();
  await pressKeys(page, 'Enter');
  await expect(page.getByRole('menuitem', { name: 'Export' })).toBeFocused();
  // Wider while the menu is open: the row waits for the menu, then draws its actions again.
  await column.evaluate((el) => (el.style.width = '1100px'));
  await settle(page);
  await pressKeys(page, 'Escape');
  await expect(card.getByRole('button', { name: 'More actions' })).toHaveCount(0);
  await expect(card.getByRole('button', { name: 'Export' })).toBeFocused();
});
