import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { contextPresets } from '../../src/styles/tokens.generated';
import { expectFocusKept, openStory, settle } from './helpers';

// One test (or a few) per finding of the second review, for what no other spec covers. The id of the
// finding is in each title.
const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const axe = async (page: Page) => {
  // Nothing is fading in or out: a colour read during a fade is not the colour the user reads.
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        // Not the ones that never end (a spinner, a skeleton).
        .filter((a) => Number.isFinite(a.effect?.getComputedTiming().endTime))
        .map((a) => a.finished.catch(() => null)),
    ),
  );
  const { violations } = await new AxeBuilder({ page }).withTags(tags).analyze();
  return violations.flatMap((v) => v.nodes.map((n) => `${v.id}: ${n.html.slice(0, 200)}`));
};
/** True when the focus ring of `el` (its outline, with its offset) lies inside the box of `clip`. */
const ringInside = async (el: Locator, clip: Locator) =>
  el.evaluate(
    (node, box) => {
      const css = getComputedStyle(node);
      const grow = parseFloat(css.outlineOffset) + parseFloat(css.outlineWidth);
      const [r, c] = [node.getBoundingClientRect(), box!.getBoundingClientRect()];
      return (
        css.outlineStyle !== 'none' &&
        r.left - grow >= c.left - 0.5 &&
        r.top - grow >= c.top - 0.5 &&
        r.right + grow <= c.right + 0.5 &&
        r.bottom + grow <= c.bottom + 0.5
      );
    },
    await clip.elementHandle(),
  );

test('F12 CheckboxGroup: `required` holds the form back until one box is checked', async ({ page }) => {
  await openStory(page, 'inputs-checkbox--group');
  const group = page.getByRole('group', { name: /Required, with an error/ });
  const boxes = group.getByRole('checkbox');
  // While none is checked, each box is required: that is what a browser validates.
  for (let i = 0; i < (await boxes.count()); i++) {
    await expect(boxes.nth(i)).toHaveJSProperty('required', true);
    expect(await boxes.nth(i).evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);
  }
  await group.getByText('Email').click();
  await expect(boxes.first()).toBeChecked();
  for (let i = 0; i < (await boxes.count()); i++) {
    expect(await boxes.nth(i).evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(false);
    await expect(boxes.nth(i)).toHaveJSProperty('required', false);
  }
  // A group that is not required asks for nothing.
  const other = page.getByRole('group').first().getByRole('checkbox').first();
  await expect(other).toHaveJSProperty('required', false);
});

test('F13 Select: invalid is on the trigger, the icon shows, and a required select says why on submit', async ({
  page,
}) => {
  await openStory(page, 'inputs-select--in-form-field');
  // Invalid by the field's error.
  const stage = page.getByRole('button', { name: /Stage/ });
  await expect(stage).toHaveAttribute('aria-invalid', 'true');
  await expect(stage).toHaveAccessibleDescription(/Choose a stage/);
  await expect(
    page.locator('[data-umbra="select"]', { has: stage }).locator('[data-part="invalidIcon"]'),
  ).toBeVisible();

  // Required and empty: submitting is held back, and the field shows the browser's message.
  const role = page.getByRole('button', { name: /Role/ });
  await expect(role).not.toHaveAttribute('aria-invalid');
  const field = page.locator('[data-umbra="form-field"]', { has: role });
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(role).toHaveAttribute('aria-invalid', 'true');
  const error = field.locator('[data-part="error"]');
  await expect(error).toBeVisible();
  expect(((await error.textContent()) ?? '').trim().length).toBeGreaterThan(3);
  await expect(role).toHaveAccessibleDescription(
    new RegExp((await error.textContent())!.trim().slice(0, 12)),
  );
  await expect(field.locator('[data-part="invalidIcon"]')).toBeVisible();
  // Choosing a value clears it.
  await role.click();
  await page.getByRole('option').first().click();
  await expect(role).not.toHaveAttribute('aria-invalid');
  await expect(error).toHaveCount(0);
  // The list has faded out: axe reads colours as they are painted, mid-fade too.
  await expect(page.getByRole('listbox')).toHaveCount(0);
  expect(await axe(page)).toEqual([]);
});

for (const context of contextPresets) {
  test(`F14 Menu: a danger row keeps 4.5:1 under the highlight, on ${context}`, async ({ page }) => {
    await openStory(page, 'overlays-menu--basic', { context });
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    const row = menu.getByRole('menuitem', { name: /Delete/ });
    // The arrow keys and the pointer move the same highlight, which is lighter than the menu.
    await menu.focus();
    await page.keyboard.press('End');
    await expect(row).toBeFocused();
    await settle(page);
    const ratio = await row.evaluate((el) => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      const luminance = (colour: string) => {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = colour;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3).map((c) => {
          const v = c / 255;
          return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
      };
      // The text's colour on the row's highlight (the label itself has no background).
      const label = el.querySelector('[data-part="label"]') ?? el;
      const [a, b] = [
        luminance(getComputedStyle(label).color),
        luminance(getComputedStyle(el).backgroundColor),
      ].sort((x, y) => y - x);
      return (a! + 0.05) / (b! + 0.05);
    });
    expect(ratio, 'highlighted by the keyboard').toBeGreaterThanOrEqual(4.5);
  });
}

test('F15 SearchField: no axe violation with the list open and text typed, or while loading', async ({
  page,
}) => {
  await openStory(page, 'inputs-searchfield--suggestions');
  const field = page.getByRole('combobox').first();
  await field.click();
  await page.keyboard.type('or');
  await expect(page.getByRole('listbox')).toBeVisible();
  expect(await axe(page)).toEqual([]);
  // The clear button is still a tab stop, and still exposed.
  const clear = page.getByRole('button', { name: 'Clear' }).first();
  await expect(clear).toBeVisible();
  expect(await clear.evaluate((el) => !el.closest('[aria-hidden="true"], [inert]'))).toBe(true);

  await openStory(page, 'inputs-searchfield--suggestions-loading');
  await page.getByRole('combobox').first().click();
  await page.keyboard.type('or');
  await expect(page.getByRole('listbox')).toBeVisible();
  expect(await axe(page)).toEqual([]);
});

test('F16: focus rings inside a clipping box are drawn inside it', async ({ page }) => {
  await openStory(page, 'inputs-searchfield--states');
  const small = page.locator('[data-umbra="search-field"][data-size="small"]', {
    has: page.locator('[data-part="clear"]'),
  });
  const clear = small.first().locator('[data-part="clear"] button');
  await small.first().locator('input').focus();
  await page.keyboard.press('Tab');
  await expect(clear).toBeFocused();
  expect(await ringInside(clear, small.first())).toBe(true);

  await openStory(page, 'inputs-textfield--states');
  const field = page
    .locator('[data-umbra="text-field"]', { has: page.locator('[data-part="clear"]') })
    .first();
  await field.locator('input').focus();
  await page.keyboard.press('Tab');
  const button = field.locator('[data-part="clear"] button');
  await expect(button).toBeFocused();
  expect(await ringInside(button, field)).toBe(true);

  // A control at the edge of a tab panel: the panel clips, so the ring points inwards.
  await openStory(page, 'inputs-tabs--behaviour');
  const panel = page
    .getByRole('tabpanel')
    .filter({ has: page.locator('button, a[href], input') })
    .first();
  const control = panel.locator('button, a[href], input').first();
  await control.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expectFocusKept(page);
  expect(await ringInside(control, panel)).toBe(true);
});

test('F20 ScrollArea: `axis="both"` tracks both axes', async ({ page }) => {
  await openStory(page, 'layout-scrollarea--axes');
  const both = page.locator('[data-umbra="scroll-area"][data-axis="both"]').first();
  const view = both.locator('[data-part="viewport"]');
  await expect(both).toHaveAttribute('data-fade-inline-end', 'true');
  await expect(both).not.toHaveAttribute('data-fade-inline-start');
  await expect(both.locator('[data-part="fade"]')).toHaveCount(4);
  await view.evaluate((el) => (el.scrollLeft = 9999));
  await expect(both).toHaveAttribute('data-fade-inline-start', 'true');
  await expect(both).not.toHaveAttribute('data-fade-inline-end');
  await expect(both.locator('[data-part="fade"][data-edge="inline-start"]')).toHaveCSS('opacity', '1');
  // The other axes are as before: two fades each.
  await expect(
    page.locator('[data-umbra="scroll-area"][data-axis="horizontal"]').first().locator('[data-part="fade"]'),
  ).toHaveCount(2);
});

test('F20 ScrollArea: `onReachEnd` fires when the content fits, once per size, and never loops', async ({
  page,
}) => {
  await openStory(page, 'layout-scrollarea--reach-end');
  const view = page.locator('[data-umbra="scroll-area"] [data-part="viewport"]').first();
  const count = async () =>
    Number(
      /(\d+)/.exec(
        (await page
          .getByText(/reached/i)
          .first()
          .textContent())!,
      )![1],
    );
  const start = await count();
  // The content overflows here: nothing has been reached yet.
  const shrink = (height: number) =>
    view.evaluate((el, h) => {
      for (const child of el.children) (child as HTMLElement).style.cssText = `height:${h}px;overflow:hidden`;
    }, height);
  await shrink(20);
  await expect.poll(count).toBe(start + 1);
  // Still the same size: nothing more, however long it stays.
  await page.waitForTimeout(300);
  expect(await count()).toBe(start + 1);
  // More content that still fits is a new end: once more.
  await shrink(30);
  await expect.poll(count).toBe(start + 2);
  await page.waitForTimeout(300);
  expect(await count()).toBe(start + 2);
});

test("F21, F23: a container's default gives way to the app's token on the provider root", async ({
  page,
}) => {
  const setOnRoot = (name: string, value: string) =>
    page.evaluate(
      ([n, v]) => document.querySelector<HTMLElement>('[data-umbra-root]')!.style.setProperty(n!, v!),
      [name, value],
    );
  // The clear button of a field is 24px by the field's default.
  await openStory(page, 'inputs-select--states');
  const clear = page.locator('[data-umbra="select"] [data-part="clear"] button').first();
  expect((await clear.boundingBox())!.width).toBe(24);
  await setOnRoot('--umbra-icon-button-size', '30px');
  expect((await clear.boundingBox())!.width).toBe(30);

  // In the TopBar the primary action has no minimum height of its own; the app's token still applies.
  await openStory(page, 'shell-app-shell--full-screen');
  const action = page.locator('[data-umbra="top-bar"] [data-umbra="primary-action"]').first();
  const before = (await action.boundingBox())!.height;
  await setOnRoot('--umbra-primary-action-min-height', `${before + 6}px`);
  await expect.poll(async () => (await action.boundingBox())!.height).toBe(before + 6);

  // Icons in a nav item are 0.9em by the bar's default.
  const icon = page.locator('[data-umbra="top-bar"] [data-nav-focus] span[aria-hidden]').first();
  const size = (await icon.boundingBox())!.width;
  await setOnRoot('--umbra-icon-size', `${size + 5}px`);
  await expect.poll(async () => (await icon.boundingBox())!.width).toBe(size + 5);
});

test('F31 PrimaryAction: the minimum width applies to an action with nothing to hide', async ({ page }) => {
  await openStory(page, 'shell-primaryaction--states');
  const actions = page.locator('[data-umbra="primary-action"]');
  for (let i = 0; i < (await actions.count()); i++) {
    const action = actions.nth(i);
    if ((await action.getAttribute('data-collapsed')) !== null) continue;
    expect((await action.boundingBox())!.width, `action ${i}`).toBeGreaterThanOrEqual(180);
    await expect(action).not.toHaveAttribute('data-truncate');
  }
});

test('F31 Button: a small button is at least 24px high at every density', async ({ page }) => {
  for (const density of ['compact', 'default', 'spacious']) {
    await openStory(page, 'basics-buttons--buttons', { density });
    const heights = await page
      .locator('[data-umbra="button"][data-size="small"], [data-umbra="icon-button"][data-size="small"]')
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
    expect(heights.length).toBeGreaterThan(0);
    expect(Math.min(...heights), density).toBeGreaterThanOrEqual(24);
  }
});

test('F31 PageHeader: the back button shows its name as a tooltip', async ({ page }) => {
  await openStory(page, 'shell-pageheader--content');
  const back = page.getByRole('button', { name: 'Back' }).first();
  await back.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(back).toBeFocused();
  await expect(page.getByRole('tooltip')).toHaveText(/^Back/);
});

test('F31 TopBar: "More" is not cut in a very narrow bar', async ({ page }) => {
  // Narrower than this the logo and the actions alone are wider than the bar.
  for (const width of [480, 475, 470]) {
    await openStory(page, 'shell-app-shell--full-screen', { width, height: 700 });
    await page.evaluate(() => document.fonts.ready);
    await settle(page);
    const cut = await page.evaluate(() => {
      const bar = document.querySelector('[data-umbra="top-bar"]')!;
      const more = bar.querySelector('[data-part="more"]');
      if (!more) return 0;
      const r = more.getBoundingClientRect();
      let worst = Math.max(0, r.right - bar.getBoundingClientRect().right);
      for (let a = more.parentElement; a && a !== bar; a = a.parentElement) {
        if (getComputedStyle(a).overflowX !== 'visible') {
          worst = Math.max(worst, r.right - a.getBoundingClientRect().right);
        }
      }
      return Math.round(worst);
    });
    expect(cut, `at ${width}`).toBeLessThanOrEqual(1);
    await expect(page.locator('[data-umbra="top-bar"] [data-part="more"] svg').first()).toBeVisible();
  }
});

test('F30 Tabs: with manual activation the tab stop is the selected tab once focus has left', async ({
  page,
}) => {
  await openStory(page, 'inputs-tabs--behaviour');
  // The list where an arrow key moves the focus without selecting.
  const lists = page.getByRole('tablist');
  let list = lists.first();
  for (let i = 0; i < (await lists.count()); i++) {
    const candidate = lists.nth(i);
    await candidate.getByRole('tab', { selected: true }).focus();
    await page.keyboard.press('ArrowRight');
    if (
      !(await candidate.getByRole('tab', { selected: true }).evaluate((el) => el === document.activeElement))
    ) {
      list = candidate;
      break;
    }
  }
  const selected = list.getByRole('tab', { selected: true });
  await expect(selected).not.toBeFocused();
  await page.keyboard.press('Tab');
  await expectFocusKept(page);
  await expect(selected).toHaveAttribute('tabindex', '0');
  expect(await list.locator('[role="tab"][tabindex="0"]').count()).toBe(1);
  // Coming back lands on the selected tab.
  await page.keyboard.press('Shift+Tab');
  await expect(selected).toBeFocused();
});

test('F33: pressing an unchecked checkbox or toggle darkens it', async ({ page }) => {
  for (const [story, part] of [
    [
      'inputs-checkbox--states',
      '[data-umbra="checkbox"]:not([data-selected], [data-disabled], [data-indeterminate]) [data-part="box"]',
    ],
    [
      'inputs-toggle--states',
      '[data-umbra="toggle"]:not([data-selected], [data-disabled]) [data-part="track"]',
    ],
  ] as const) {
    await openStory(page, story);
    const target = page.locator(part).first();
    const box = (await target.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    // The press is a short fade.
    await page.waitForTimeout(250);
    // Black, mixed in: never the text colour, which lightened it.
    const pressed = await target.evaluate((el) => getComputedStyle(el).backgroundColor);
    await page.mouse.up();
    expect(pressed, story).toMatch(/^(rgba\(0, 0, 0|color\(srgb 0 0 0|oklab\(0 )/);
  }
});

test('F30 CommandPalette: the input is collapsed when there are no results', async ({ page }) => {
  await openStory(page, 'overlays-commandpalette--default');
  const input = page.getByRole('combobox');
  await expect(input).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.type('zzzzzz');
  await expect(page.getByText('No results')).toBeVisible();
  await expect(input).toHaveAttribute('aria-expanded', 'false');
});

test('F22 ConfirmDialog parts: `null` hides the cancel button, a function changes the confirm button', async ({
  page,
}) => {
  await openStory(page, 'overlays-modal--confirm-parts');
  const dialog = page.getByRole('alertdialog', { name: 'Archive this report?' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toHaveCount(0);
  const confirm = dialog.getByRole('button', { name: 'Archive' });
  await expect(confirm).toHaveAttribute('data-variant', 'accent');
  await expect(confirm.locator('svg')).toBeVisible();
  // With no cancel button the focus starts on the confirm button, and the default behaviour is kept.
  await expect(confirm).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText('Result: archived')).toBeVisible();
  await expectFocusKept(page);
});

test('F22 Toggle: in a narrow slot the switch keeps its size and nothing leaves the slot', async ({
  page,
}) => {
  await openStory(page, 'inputs-toggle--states');
  const result = await page.evaluate(() => {
    const tracks = [...document.querySelectorAll<HTMLElement>('[data-umbra="toggle"] [data-part="track"]')];
    const bySize = new Map<string, Set<number>>();
    const outside: string[] = [];
    for (const track of tracks) {
      const toggle = track.closest<HTMLElement>('[data-umbra="toggle"]')!;
      const size = toggle.dataset.size ?? 'default';
      bySize.set(size, (bySize.get(size) ?? new Set()).add(Math.round(track.getBoundingClientRect().width)));
      // A wrapper with a fixed width is a narrow slot.
      const slot = toggle.closest<HTMLElement>('div[style*="width"]');
      if (!slot) continue;
      const [a, b] = [toggle.getBoundingClientRect(), slot.getBoundingClientRect()];
      if (a.right > b.right + 0.5 || a.left < b.left - 0.5) outside.push(toggle.textContent ?? '');
    }
    const small = [
      ...document.querySelectorAll<HTMLElement>(
        'div[style*="width"] [data-umbra="toggle"][data-size="small"] [data-part="label"]',
      ),
    ];
    return {
      widths: [...bySize.values()].map((set) => set.size),
      outside,
      // A small toggle keeps one line: its label ends in an ellipsis when it is too long.
      smallOneLine: small.every((label) => getComputedStyle(label).whiteSpace === 'nowrap'),
      narrow: document.querySelectorAll('div[style*="width"] [data-umbra="toggle"]').length,
    };
  });
  expect(result.narrow).toBeGreaterThan(0);
  expect(
    result.widths.every((count) => count === 1),
    'one track width per size',
  ).toBe(true);
  expect(result.outside).toEqual([]);
  expect(result.smallOneLine).toBe(true);
});

test('F22 Accordion step 3: when even the headers do not fit, the accordion itself scrolls', async ({
  page,
}) => {
  await openStory(page, 'layout-accordion--limited-height');
  const accordion = page.locator('[data-umbra="accordion"]').last();
  // Close every section, then give the accordion less height than its headers need.
  for (const header of await accordion.locator('button[aria-expanded="true"]').all()) await header.click();
  await expect(accordion.locator('button[aria-expanded="true"]')).toHaveCount(0);
  await accordion.evaluate((el) => {
    el.style.height = '40px';
    el.style.flex = 'none';
  });
  await settle(page);
  const state = await accordion.evaluate((el) => {
    const scroller = [el, ...el.querySelectorAll<HTMLElement>('*')].find(
      (node) =>
        /auto|scroll/.test(getComputedStyle(node).overflowY) && node.scrollHeight > node.clientHeight + 1,
    );
    const d = document.documentElement;
    return {
      scrolls: !!scroller,
      holdsHeaders:
        !!scroller && [...el.querySelectorAll('button[aria-expanded]')].every((b) => scroller.contains(b)),
      page: d.scrollHeight - d.clientHeight,
    };
  });
  expect(state).toEqual({ scrolls: true, holdsHeaders: true, page: 0 });
  // The last header can be brought into view and used.
  const last = accordion.locator('button[aria-expanded]').last();
  await last.focus();
  await expect(last).toBeInViewport();
});

test('minWidth: columns that cannot all have their minimum width become tabs, in any window', async ({
  page,
}) => {
  // Three columns of 360px: they fit a 1280px window and not a 1100px one, which is not "narrow".
  await openStory(page, 'layout-page-layouts--min-width', { width: 1280, height: 720 });
  const columns = page.locator('[data-umbra="columns"]');
  await expect(columns).not.toHaveAttribute('data-tab-mode');
  await expect(page.locator('[data-umbra="card"]:visible')).toHaveCount(3);
  await page.setViewportSize({ width: 1100, height: 720 });
  await expect(columns).toHaveAttribute('data-tab-mode', 'true');
  await expect(page.getByRole('tab')).toHaveText(['Orders', 'Reports', 'People']);
  await expect(page.locator('[data-umbra="card"]:visible')).toHaveCount(1);
  await page.getByRole('tab', { name: 'Reports' }).click();
  await expect(page.getByRole('tabpanel', { name: 'Reports' })).toBeVisible();
  // One answer per width: back and forth over the threshold, and the same on a fresh load.
  const widths = Array.from({ length: 41 }, (_, i) => 1150 - i);
  const seen = new Map<number, boolean>();
  for (const width of [...widths, ...[...widths].reverse()]) {
    await page.setViewportSize({ width, height: 720 });
    await settle(page);
    const tabs = (await columns.getAttribute('data-tab-mode')) !== null;
    if (seen.has(width)) expect(tabs, `at ${width}`).toBe(seen.get(width));
    seen.set(width, tabs);
  }
  const sequence = widths.map((width) => seen.get(width));
  expect(sequence.filter((value, i) => i > 0 && value !== sequence[i - 1]).length).toBeLessThanOrEqual(1);
  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(columns).not.toHaveAttribute('data-tab-mode');
});

test("renderLink: the title links of Card and SectionTitle go through the app's link", async ({ page }) => {
  await openStory(page, 'layout-page-layouts--min-width');
  const card = page.locator('[data-umbra="card"]').first();
  const title = card.locator('[data-part="header"] [data-part="title"] a');
  await expect(title).toHaveAttribute('data-router', '');
  await expect(title).toHaveAttribute('href', '#orders');
  const section = card.locator('[data-umbra="section-title"] a');
  await expect(section).toHaveAttribute('data-router', '');
  await expect(section).toHaveAttribute('href', '#all');
});
