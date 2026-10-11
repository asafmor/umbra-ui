import { expect, test, type Page } from '@playwright/test';
import { expectFocusKept, openStory, settle } from './helpers';

// Every component that shows less as it narrows (`useShrinkLevel`, `useMoreItems`): what it shows is a
// function of its width alone. Stories are opened with no font face loaded ahead of time.
//
// `box` is the element whose width the test sets; `from` and `to` are the widths swept between.
const cases = [
  {
    name: 'TopBar, PrimaryNav, SubNav and ShortcutBar',
    story: 'shell-app-shell--full-screen',
    box: '[data-umbra="app-shell"]',
    from: 1100,
    to: 480,
  },
  {
    name: 'SubNav with a ShortcutBar',
    story: 'shell-subnav--slots',
    box: '[data-umbra="sub-nav"]',
    from: 900,
    to: 420,
  },
  {
    name: 'PrimaryNav',
    story: 'shell-primarynav--overflow',
    box: '[data-umbra="top-bar"]',
    from: 1000,
    to: 480,
  },
  {
    name: 'ShortcutBar',
    story: 'shell-shortcutbar--overflow',
    box: '[data-umbra="shortcut-bar"]',
    parent: true,
    from: 700,
    to: 120,
  },
  {
    name: 'Tabs',
    story: 'inputs-tabs--narrowing',
    box: '[data-umbra="tabs"]',
    parent: true,
    from: 900,
    to: 220,
  },
  {
    name: 'SegmentedFilter',
    story: 'inputs-segmentedfilter--narrowing',
    box: '[data-umbra="segmented-filter"]',
    parent: true,
    from: 620,
    to: 120,
  },
  {
    name: 'Card header',
    story: 'layout-card--header-shrink',
    box: '[data-umbra="card"]',
    parent: true,
    from: 700,
    to: 160,
  },
  {
    name: 'SectionTitle',
    story: 'layout-sectiontitle--variants',
    box: 'div[style*="200px"] > [data-umbra="section-title"]',
    parent: true,
    from: 420,
    to: 100,
  },
  {
    name: 'GroupHeader',
    story: 'data-groupheader--shrink',
    box: '[data-umbra="group-header"]',
    parent: true,
    from: 600,
    to: 120,
  },
  {
    name: 'PageHeader',
    story: 'shell-pageheader--shrink',
    box: '[data-umbra="page-header"]',
    parent: true,
    from: 900,
    to: 240,
  },
  {
    name: 'Button collapseTo',
    story: 'basics-buttons--collapse-to-icon',
    box: '[data-umbra="button"]',
    parent: true,
    from: 300,
    to: 40,
  },
] as const;
type Case = (typeof cases)[number];

declare global {
  interface Window {
    umbraShrink: {
      box: (selector: string, parent: boolean) => HTMLElement;
      signature: (box: HTMLElement) => string;
      clipped: (box: HTMLElement) => string[];
      frame: () => Promise<void>;
    };
  }
}

/** Installs the page-side helpers. */
const install = (page: Page) =>
  page.evaluate(() => {
    const drawn = (el: Element) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
    };
    const controls = 'a[href], button, [role="tab"], [role="radio"], [role="checkbox"]';
    window.umbraShrink = {
      box: (selector, parent) => {
        const el = document.querySelector<HTMLElement>(selector)!;
        const box = parent ? el.parentElement! : el;
        box.style.maxWidth = 'none';
        box.style.minWidth = '0';
        return box;
      },
      // What is shown: the controls by name, and the named parts.
      signature: (box) =>
        [
          ...[...box.querySelectorAll(controls)]
            .filter(drawn)
            .map((el) => el.getAttribute('aria-label') ?? el.textContent?.trim()),
          ...[...box.querySelectorAll<HTMLElement>('[data-part]')].filter(drawn).map((el) => el.dataset.part),
        ].join('·'),
      // Controls cut by something that clips, between them and the box.
      clipped: (box) =>
        [...box.querySelectorAll(controls)].filter(drawn).flatMap((el) => {
          const r = el.getBoundingClientRect();
          for (let a = el.parentElement; a && a !== box.parentElement; a = a.parentElement) {
            if (getComputedStyle(a).overflowX === 'visible') continue;
            const c = a.getBoundingClientRect();
            if (r.right > c.right + 1.5 || r.left < c.left - 1.5) {
              return [
                `${el.getAttribute('aria-label') ?? el.textContent?.trim()} by ${Math.round(Math.max(r.right - c.right, c.left - r.left))}px`,
              ];
            }
          }
          return [];
        }),
      frame: () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(() => done()))),
    };
  });

const fresh = async (page: Page, c: Case, width: number) => {
  await openStory(page, c.story);
  await install(page);
  return page.evaluate(
    async ([selector, parent, w]) => {
      const box = window.umbraShrink.box(selector as string, parent as boolean);
      box.style.width = `${w}px`;
      await document.fonts.ready;
      await window.umbraShrink.frame();
      await window.umbraShrink.frame();
      return { shown: window.umbraShrink.signature(box), clipped: window.umbraShrink.clipped(box) };
    },
    [c.box, 'parent' in c, width] as const,
  );
};

for (const c of cases) {
  test.describe(c.name, () => {
    test('pixel by pixel, narrowing and widening show the same at every width, and nothing is cut', async ({
      page,
      browser,
    }) => {
      test.slow();
      await openStory(page, c.story);
      await page.evaluate(() => document.fonts.ready);
      await install(page);
      const result = await page.evaluate(
        async ([selector, parent, from, to]) => {
          const { box, signature, clipped, frame } = window.umbraShrink;
          const el = box(selector as string, parent as boolean);
          const down: Record<number, string> = {};
          const up: Record<number, string> = {};
          const cut: Record<number, string[]> = {};
          const at = async (width: number, into: Record<number, string>) => {
            el.style.width = `${width}px`;
            await frame();
            into[width] = signature(el);
            const c = clipped(el);
            if (c.length) cut[width] = c;
          };
          for (let w = from as number; w >= (to as number); w--) await at(w, down);
          for (let w = to as number; w <= (from as number); w++) await at(w, up);
          return { down, up, cut };
        },
        [c.box, 'parent' in c, c.from, c.to] as const,
      );
      const different = Object.keys(result.down).filter((w) => result.down[+w] !== result.up[+w]);
      expect(different, 'widths that show something else on the way back').toEqual([]);
      expect(result.cut, 'controls cut at a width').toEqual({});
      // It shows less at the narrow end than at the wide end: the sweep crossed real steps.
      expect(result.down[c.to]).not.toBe(result.down[c.from]);

      // A fresh load at a width shows what the resize showed there.
      const steps = [0.1, 0.3, 0.5, 0.7, 0.9].map((t) => Math.round(c.to + (c.from - c.to) * t));
      for (const width of steps) {
        const other = await browser.newPage();
        const loaded = await fresh(other, c, width);
        expect(loaded.shown, `fresh load at ${width}`).toBe(result.down[width]);
        expect(loaded.clipped, `fresh load at ${width}`).toEqual([]);
        await other.close();
      }
    });

    test('two width changes within one frame end where one change does', async ({ page, browser }) => {
      const widths = [0.15, 0.35, 0.6].map((t) => Math.round(c.to + (c.from - c.to) * t));
      const pairs: [number, number][] = [
        [widths[1]!, widths[0]!],
        [widths[0]!, widths[2]!],
        [widths[2]!, widths[1]!],
      ];
      for (const [first, second] of pairs) {
        for (const delay of [0, 8]) {
          await openStory(page, c.story);
          await page.evaluate(() => document.fonts.ready);
          await install(page);
          const twice = await page.evaluate(
            async ([selector, parent, from, a, b, wait]) => {
              const { box, signature, clipped, frame } = window.umbraShrink;
              const el = box(selector as string, parent as boolean);
              el.style.width = `${from}px`;
              await frame();
              el.style.width = `${a}px`;
              await new Promise((done) =>
                wait ? setTimeout(done, wait as number) : queueMicrotask(() => done(0)),
              );
              el.style.width = `${b}px`;
              await frame();
              await frame();
              return { shown: signature(el), clipped: clipped(el) };
            },
            [c.box, 'parent' in c, c.from, first, second, delay] as const,
          );
          const other = await browser.newPage();
          const once = await fresh(other, c, second);
          await other.close();
          expect(twice, `${c.from} to ${first} to ${second}, ${delay}ms apart`).toEqual(once);
        }
      }
    });
  });
}

// The first press of a "more" menu loads the font face of its rows. That used to restart the shrink
// level, which unmounted the menu as it opened and dropped focus to <body> (review finding F2).
const menus = [
  { name: 'Tabs', story: 'inputs-tabs--narrowing', button: 'More tabs' },
  { name: 'SegmentedFilter', story: 'inputs-segmentedfilter--narrowing', button: 'More' },
  { name: 'Card header', story: 'layout-card--header-shrink', button: 'More actions' },
  { name: 'PrimaryNav', story: 'shell-primarynav--overflow', button: 'More' },
  { name: 'ShortcutBar', story: 'shell-shortcutbar--overflow', button: /more shortcuts/ },
] as const;

for (const menu of menus) {
  for (const how of ['Enter', 'click'] as const) {
    test(`${menu.name}: the "more" menu opens on the first try by ${how}, with fonts still loading`, async ({
      page,
    }) => {
      await openStory(page, menu.story);
      const faces = () =>
        page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').length);
      const before = await faces();
      const button = page.getByRole('button', { name: menu.button }).first();
      if (how === 'click') await button.click();
      else {
        await button.focus();
        await page.keyboard.press('Enter');
      }
      const list = page.getByRole('menu');
      await expect(list).toBeVisible();
      await expectFocusKept(page);
      // The menu is still there once every face it asked for has arrived, and after the frames that follow.
      await page.evaluate(() => document.fonts.ready);
      await settle(page);
      await page.waitForTimeout(300);
      await expect(list).toBeVisible();
      await expect(button).toHaveAttribute('aria-expanded', 'true');
      await expectFocusKept(page);
      expect(
        await faces(),
        'the story must be opened cold for this test to mean anything',
      ).toBeGreaterThanOrEqual(before);
      // Closing it returns focus to the button, which may be rendered again by the restart that waited.
      await page.keyboard.press('Escape');
      await expect(list).toHaveCount(0);
      await page.waitForTimeout(200);
      await expectFocusKept(page);
    });
  }
}
