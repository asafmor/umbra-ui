import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectFocusKept, openStory, settle } from './helpers';

// Right to left (the provider's `locale`; Storybook's `direction` global sets it): one direction for
// the root, React Aria, our own keyboard code, measurements and every portal.
const rtl = (page: Page, id: string, size: { width?: number; height?: number } = {}) =>
  openStory(page, id, { ...size, direction: 'rtl' });
const x = async (el: Locator) => (await el.boundingBox())!.x;
const focusedX = (page: Page) =>
  page.evaluate(
    () =>
      document.activeElement!.getBoundingClientRect().left +
      document.activeElement!.getBoundingClientRect().width / 2,
  );

test('the root always carries the resolved direction, and React Aria agrees with it', async ({ page }) => {
  await openStory(page, 'inputs-segmentedfilter--variants');
  await expect(page.locator('[data-umbra-root]').first()).toHaveAttribute('dir', 'ltr');
  await rtl(page, 'inputs-segmentedfilter--variants');
  const root = page.locator('[data-umbra-root]').first();
  await expect(root).toHaveAttribute('dir', 'rtl');
  await expect(root).toHaveAttribute('lang', 'he-IL');
  // A React Aria composite: Left moves to the next item, which is drawn to the left.
  const first = page.getByRole('radio').first();
  await first.focus();
  const from = await focusedX(page);
  await page.keyboard.press('ArrowLeft');
  expect(await focusedX(page)).toBeLessThan(from);
});

for (const [name, story, item] of [
  ['PrimaryNav', 'shell-app-shell--full-screen', '[data-umbra="top-bar"] [data-nav-focus]'],
  ['SubNav', 'shell-app-shell--full-screen', '[data-umbra="sub-nav"] [data-nav-focus]'],
  ['ShortcutBar', 'shell-shortcutbar--modes', '[data-umbra="shortcut-bar"] [data-part="item"]'],
  ['Tabs', 'inputs-tabs--variants', '[role="tab"]'],
] as const) {
  test(`${name}: the arrow keys follow what is drawn, in both directions`, async ({ page }) => {
    for (const dir of ['ltr', 'rtl'] as const) {
      await openStory(page, story, { direction: dir });
      await page.locator(item).first().focus();
      const start = await focusedX(page);
      // Left goes to what is on the left: back in ltr (so it wraps or stays), forward in rtl.
      await page.keyboard.press(dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight');
      await expectFocusKept(page);
      const next = await focusedX(page);
      if (dir === 'rtl') expect(next, 'rtl: Left moves left').toBeLessThan(start);
      else expect(next, 'ltr: Right moves right').toBeGreaterThan(start);
      await page.keyboard.press(dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft');
      expect(Math.abs((await focusedX(page)) - start)).toBeLessThan(1);
      // React Aria's toolbar has no End key.
      if (name === 'ShortcutBar') continue;
      // End is the last item, which is the leftmost one in rtl.
      await page.keyboard.press('End');
      const end = await focusedX(page);
      if (dir === 'rtl') expect(end).toBeLessThan(start);
      else expect(end).toBeGreaterThan(start);
    }
  });
}

test('VerticalNav: towards the end of the line opens a group, towards its start closes it', async ({
  page,
}) => {
  await rtl(page, 'shell-verticalnav--default');
  const group = page.locator('[data-umbra="vertical-nav"] [data-group-id]').first();
  await group.focus();
  if ((await group.getAttribute('aria-expanded')) === 'true') await page.keyboard.press('ArrowRight');
  await expect(group).toHaveAttribute('aria-expanded', 'false');
  await page.keyboard.press('ArrowLeft');
  await expect(group).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(group).toHaveAttribute('aria-expanded', 'false');
  await expectFocusKept(page);
});

test('Tabs: the indicator sits on the selected tab, and follows it', async ({ page }) => {
  await rtl(page, 'inputs-tabs--variants');
  await page.evaluate(() => document.fonts.ready);
  const lists = page.locator('[data-umbra="tabs"]');
  for (let i = 0; i < (await lists.count()); i++) {
    const list = lists.nth(i);
    const offset = () =>
      list.evaluate((el) => {
        const tab = el.querySelector('[data-part="tab"][data-selected]');
        const bar = el.querySelector('[data-part="indicator"]');
        if (!tab || !bar) return 0;
        const [a, b] = [tab.getBoundingClientRect(), bar.getBoundingClientRect()];
        return Math.max(Math.abs(a.left - b.left), Math.abs(a.right - b.right));
      });
    await settle(page);
    await expect.poll(offset).toBeLessThan(1.5);
    const tabs = list.getByRole('tab');
    // The first tab is the rightmost one.
    if ((await tabs.count()) > 1 && (await list.getAttribute('data-orientation')) !== 'vertical') {
      expect(await x(tabs.nth(0))).toBeGreaterThan(await x(tabs.nth(1)));
    }
    await tabs.nth(1).click();
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect.poll(offset).toBeLessThan(1.5);
  }
});

test('Tabs and SegmentedFilter: every shrink step runs, with "more" at the left end and nothing cut', async ({
  page,
}) => {
  for (const [story, root, itemSelector] of [
    ['inputs-tabs--narrowing', '[data-umbra="tabs"]', '[data-part="tab"]'],
    ['inputs-segmentedfilter--narrowing', '[data-umbra="segmented-filter"]', '[data-part="item"]'],
  ] as const) {
    await rtl(page, story);
    await page.evaluate(() => document.fonts.ready);
    await settle(page);
    const state = await page.locator(root).evaluateAll(
      (els, sel) =>
        els.map((el) => {
          const strip = (el.matches('[data-level]') ? el : el.querySelector('[data-level]')) as HTMLElement;
          const box = strip.getBoundingClientRect();
          const items = [...el.querySelectorAll(sel)];
          const more = el.querySelector('[data-part="more"]');
          return {
            level: strip.dataset.level,
            cut: items.filter((item) => {
              const r = item.getBoundingClientRect();
              return r.left < box.left - 1.5 || r.right > box.right + 1.5;
            }).length,
            // "more" is after the items: to their left.
            moreAtEnd:
              !more ||
              items.every(
                (item) => more.getBoundingClientRect().right <= item.getBoundingClientRect().left + 1,
              ),
          };
        }),
      itemSelector,
    );
    expect(
      state.map((s) => s.cut),
      `${story}: items cut`,
    ).toEqual(state.map(() => 0));
    expect(
      state.every((s) => s.moreAtEnd),
      `${story}: "more" at the end`,
    ).toBe(true);
    // The story has strips narrow enough for every step.
    expect(new Set(state.map((s) => s.level)).size, `${story}: steps taken`).toBeGreaterThan(1);
  }
});

test('Modal: the `start` drawer is on the right and its close button on the left', async ({ page }) => {
  await rtl(page, 'overlays-modal--drawer-start');
  const panel = page.locator('[data-umbra="modal"]');
  await expect(panel).toBeVisible();
  await expect(page.locator('[data-umbra="modal-backdrop"]')).toHaveAttribute('dir', 'rtl');
  await expect
    .poll(async () => {
      const box = (await panel.boundingBox())!;
      return Math.round(box.x + box.width);
    })
    .toBe(1280);
  const close = panel.getByRole('button', { name: 'Close' }).first();
  const title = panel.getByRole('heading').first();
  expect(await x(close)).toBeLessThan(await x(title));
});

test('icons that point along the line are mirrored, and the stripes are on the start side', async ({
  page,
}) => {
  await rtl(page, 'overlays-menu--submenus');
  await page.getByRole('button', { name: 'Column' }).click();
  const row = page
    .getByRole('menuitem')
    .filter({ has: page.locator('[data-part="submenuIndicator"]') })
    .first();
  const chevron = row.locator('[data-part="submenuIndicator"]');
  await expect(chevron).toHaveCSS('scale', '-1 1');
  // The chevron trails: it is at the left end of its row.
  const [rowBox, chevronBox] = [(await row.boundingBox())!, (await chevron.boundingBox())!];
  expect(chevronBox.x - rowBox.x).toBeLessThan(rowBox.width / 4);

  await rtl(page, 'shell-verticalnav--default');
  const current = page.locator('[data-umbra="vertical-nav"] [aria-current]').first();
  // An inset shadow with a negative x is drawn on the right edge.
  expect(await current.evaluate((el) => getComputedStyle(el).boxShadow)).toMatch(/-\d+px 0px 0px 0px inset/);
});

for (const story of [
  'shell-app-shell--full-screen',
  'pages-overview--overview',
  'pages-list-and-detail--list-and-detail',
  'inputs-formfield--settings',
  'inputs-select--states',
  'overlays-menu--basic',
  'overlays-modal--with-nav',
  'layout-card--variants',
  'layout-scrollarea--axes',
  'basics-buttons--buttons',
]) {
  test(`${story}: right to left, nothing leaves the window and nothing errors`, async ({ page }) => {
    const problems: string[] = [];
    page.on('console', (m) => m.type() === 'error' && problems.push(m.text()));
    page.on('pageerror', (error) => problems.push(String(error)));
    for (const [width, height] of [
      [1280, 720],
      [1024, 600],
    ] as const) {
      await rtl(page, story, { width, height });
      await page.evaluate(() => document.fonts.ready);
      await settle(page);
      const result = await page.evaluate(() => {
        const d = document.documentElement;
        const outside = [...document.querySelectorAll('[data-umbra]')].filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && (r.left < -0.5 || r.right > innerWidth + 0.5);
        }).length;
        return { x: d.scrollWidth - d.clientWidth, y: d.scrollHeight - d.clientHeight, outside };
      });
      expect(result, `${width}x${height}`).toEqual({ x: 0, y: 0, outside: 0 });
    }
    expect(problems).toEqual([]);
  });
}
