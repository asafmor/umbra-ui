import { expect, test, type Page } from '@playwright/test';
import { densities, minWindow } from '../../src/styles/tokens.generated';
import { settle } from './helpers';

// A row that shows less as it narrows (`useShrinkLevel`) inside a modal or a popover: what it shows is
// a function of its width alone there too. The focus is inside the overlay for as long as it is open,
// and the hook once took that for a menu opened from the row: no row on the page started again, so a
// header measured before the web fonts arrived stayed collapsed, and one that had been narrower never
// grew back. A CI capture of a card in a modal showed its "more" button where the baseline had both
// actions.
const overlays = ['modal', 'popover'] as const;
const boxes = ['card', 'section-title', 'segmented-filter'] as const;
const sizes = [
  [1920, 1080],
  [1280, 720],
  [minWindow.width, minWindow.height],
] as const;
const fontFiles = /\.woff2?$/;
const storyChunk = /\/assets\/Layers\.stories-[\w-]+\.js$/;

const url = (overlay: string, density: string) =>
  `/iframe.html?id=overlays-layers--rows-in-${overlay}&viewMode=story&globals=density:${density}`;

/** Holds every request that matches until `release` is called. */
async function hold(page: Page, match: RegExp) {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  await page.route(match, async (route) => {
    await gate;
    await route.continue();
  });
  return release;
}

declare global {
  interface Window {
    umbraShown: (box: HTMLElement) => string;
  }
}

/** What each box shows: its controls and named parts that are drawn. */
const shown = (page: Page) =>
  page.evaluate(() => {
    window.umbraShown = (box) =>
      [...box.querySelectorAll<HTMLElement>('button, [role="radio"], [data-part]')]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
        })
        .map((el) => el.getAttribute('aria-label') ?? el.dataset.part ?? el.textContent?.trim())
        .join('·');
    const active = document.activeElement as HTMLElement | null;
    return Object.fromEntries([
      ...[...document.querySelectorAll<HTMLElement>('[data-box]')].map((box) => [
        box.dataset.box,
        window.umbraShown(box),
      ]),
      [
        'focus',
        `${active?.closest<HTMLElement>('[data-box]')?.dataset.box}: ${active?.getAttribute('aria-label') ?? active?.tagName}`,
      ],
    ]);
  });

const focusInOverlay = (page: Page) =>
  page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'));

for (const overlay of overlays) {
  test.describe(`rows in a ${overlay}`, () => {
    for (const density of densities) {
      for (const [width, height] of sizes) {
        test(`late fonts end where loaded fonts start: ${density} ${width}x${height}`, async ({
          page,
          browser,
        }) => {
          // Warm: the story is held until every font face has loaded, so its first measure is the last.
          const warm = await browser.newPage({ viewport: { width, height } });
          const releaseStory = await hold(warm, storyChunk);
          await warm.goto(url(overlay, density));
          await warm.evaluate(async () => {
            while (!document.fonts.size) await new Promise((done) => setTimeout(done, 20));
            await Promise.all([...document.fonts].map((face) => face.load()));
          });
          releaseStory();
          await warm.locator('[data-box]').first().waitFor();
          await settle(warm);
          const expected = await shown(warm);
          await warm.close();
          expect(expected.card, 'the box is wide enough for both actions').toContain('Import lines');

          // Cold: the font files are held, and until they come the text is wider than it will be, as
          // with a fallback font that is wider than the web font (which one a machine has, differs).
          await page.setViewportSize({ width, height });
          const releaseFonts = await hold(page, fontFiles);
          await page.route(/\/iframe\.html/, async (route) => {
            const response = await route.fetch();
            const wide = '<style id="wide-fallback">* { letter-spacing: 0.3em !important; }</style>';
            await route.fulfill({
              response,
              body: (await response.text()).replace('<head>', `<head>${wide}`),
            });
          });
          await page.goto(url(overlay, density));
          await page.locator('[data-box]').first().waitFor();
          await expect.poll(() => focusInOverlay(page)).toBe(true);
          await settle(page);
          const before = await shown(page);
          // The rows have given way, or the test means nothing.
          expect(before.card).toContain('More actions');
          expect(before['section-title']).toContain('More actions');

          await page.evaluate(() => document.getElementById('wide-fallback')!.remove());
          releaseFonts();
          await page.evaluate(() => document.fonts.ready);
          await settle(page);
          expect(await focusInOverlay(page)).toBe(true);
          expect(await shown(page)).toEqual(expected);
        });
      }

      test(`one pixel at a time, narrowing and widening show the same: ${density}`, async ({ page }) => {
        test.slow();
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.goto(url(overlay, density));
        await page.locator('[data-box]').first().waitFor();
        await page.evaluate(() => document.fonts.ready);
        await expect.poll(() => focusInOverlay(page)).toBe(true);
        await shown(page);
        const result = await page.evaluate(async (names) => {
          const frame = () =>
            new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done())));
          const out: Record<string, { down: string[]; up: string[]; from: number }> = {};
          for (const name of names) {
            const box = document.querySelector<HTMLElement>(`[data-box="${name}"]`)!;
            const from = box.getBoundingClientRect().width;
            const read = () => window.umbraShown(box);
            const down: string[] = [];
            const up: string[] = [];
            const at = async (w: number, into: string[]) => {
              box.style.width = `${w}px`;
              await frame();
              into[from - w] = read();
            };
            for (let w = from; w >= from - 300; w--) await at(w, down);
            for (let w = from - 300; w <= from; w++) await at(w, up);
            out[name] = { down, up, from };
          }
          return out;
        }, boxes);
        expect(await focusInOverlay(page)).toBe(true);
        for (const name of boxes) {
          const { down, up, from } = result[name]!;
          const different = down.flatMap((s, i) => (s === up[i] ? [] : [from - i]));
          expect(different, `${name}: widths that show something else on the way back`).toEqual([]);
          expect(down[300], `${name}: the sweep crossed a step`).not.toBe(down[0]);
        }
        // The actions of the card and of the section title move into the menu at one width, and come
        // back at the same one.
        for (const name of ['card', 'section-title'] as const) {
          for (const way of ['down', 'up'] as const) {
            const more = result[name]![way].map((s) => s.includes('More actions'));
            const changes = more.filter((m, i) => i > 0 && m !== more[i - 1]).length;
            expect(changes, `${name}, ${way}: change points of the "more" button`).toBe(1);
          }
        }
      });
    }
  });
}
