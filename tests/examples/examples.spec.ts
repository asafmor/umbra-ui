import { expect, test, type Page } from '@playwright/test';
import { exampleUrl, examples, type ExampleName } from '../../playwright.examples.config';

// What every example app must hold to, whatever it shows: it loads cleanly, the page never scrolls at
// any window size or density, it switches to tabs below the minimum window, and the keyboard reaches
// it. Each app's own interactions are in dashboard.spec.ts and advanced.spec.ts.

const densities = ['compact', 'default', 'spacious'] as const;
type Density = (typeof densities)[number];

// From the minimum window up, with a low wide one and a narrow tall one: the two ways space runs out.
const sizes = [
  [1024, 600],
  [1024, 1080],
  [1280, 720],
  [1440, 900],
  [1920, 600],
  [1920, 1080],
  [2560, 1440],
] as const;
const narrow = [900, 560] as const;

interface Example {
  /** The screens to check, as URL hashes. */
  routes: string[];
  /** A route whose `Columns` turn into tabs below the minimum window. */
  tabRoute: string;
  setDensity: (page: Page, density: Density) => Promise<void>;
}

const title = (density: Density) => density[0]!.toUpperCase() + density.slice(1);
const segment = (page: Page, density: Density) =>
  page.getByRole('radiogroup', { name: 'Density' }).getByRole('radio', { name: title(density) });

const apps: Record<ExampleName, Example> = {
  basic: {
    routes: [''],
    tabRoute: '',
    // The density switch is the SubNav.
    setDensity: (page, density) =>
      page.getByRole('navigation').last().getByText(density, { exact: true }).click(),
  },
  dashboard: {
    routes: [''],
    tabRoute: '',
    setDensity: (page, density) => segment(page, density).click({ force: true }),
  },
  advanced: {
    routes: ['#/clients', '#/orders', '#/settings'],
    tabRoute: '#/clients',
    setDensity: async (page, density) => {
      await goTo(page, '#/settings');
      await segment(page, density).click({ force: true });
    },
  },
};

/** Console errors and warnings, and uncaught errors, while the page is used. */
function watch(page: Page) {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') problems.push(message.text());
  });
  page.on('pageerror', (error) => problems.push(error.message));
  return problems;
}

async function open(page: Page, name: ExampleName, hash = '') {
  await page.goto(exampleUrl(name) + hash);
  await page.locator('[data-umbra="app-shell"]').waitFor();
  await page.evaluate(() => document.fonts.ready);
}

/** Moves inside the app, as a link would: the app's state (its density) is kept. */
async function goTo(page: Page, hash: string) {
  await page.evaluate((to) => {
    if (location.hash !== to) location.hash = to;
  }, hash);
  await page.locator('[data-umbra="page"]').waitFor();
}

// The shell is fixed to the window, so the document rarely grows. What goes wrong instead is a card
// pushed past the edge of the page area and cut off, so that is measured too.
const overflow = (page: Page) =>
  page.evaluate(() => {
    const d = document.documentElement;
    const main = document
      .querySelector('[data-umbra="app-shell"] [data-part="main"]')!
      .getBoundingClientRect();
    const cut = [...document.querySelectorAll('[data-umbra="card"]')].filter((card) => {
      const box = card.getBoundingClientRect();
      return (
        box.width > 0 &&
        (box.right > main.right + 1 || box.bottom > main.bottom + 1 || box.left < main.left - 1)
      );
    });
    return { x: d.scrollWidth - d.clientWidth, y: d.scrollHeight - d.clientHeight, cut: cut.length };
  });
const none = { x: 0, y: 0, cut: 0 };

for (const name of examples) {
  const app = apps[name];

  test.describe(name, () => {
    test('loads without console errors or warnings', async ({ page }) => {
      const problems = watch(page);
      for (const route of app.routes) {
        await open(page, name, route);
        await expect(page.locator('[data-umbra="card"]').first()).toBeVisible();
      }
      expect(problems).toEqual([]);
    });

    for (const density of densities) {
      test(`the page never scrolls, ${density}`, async ({ page }) => {
        const problems = watch(page);
        await page.setViewportSize({ width: 1280, height: 720 });
        await open(page, name, app.routes[0]);
        await app.setDensity(page, density);
        await expect(page.locator('[data-umbra-root]')).toHaveAttribute('data-umbra-density', density);

        for (const route of app.routes) {
          await goTo(page, route);
          for (const [width, height] of [...sizes, narrow]) {
            await page.setViewportSize({ width, height });
            // The layout measures itself after a resize; two frames let it settle.
            await page.evaluate(
              () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
            );
            expect(await overflow(page), `${route || '/'} at ${width}x${height}`).toEqual(none);
          }
        }
        expect(problems).toEqual([]);
      });
    }

    test('columns become tabs below the minimum window', async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 600 });
      await open(page, name, app.tabRoute);
      const shell = page.locator('[data-umbra="app-shell"]');
      const tabbed = page.locator('[data-umbra="columns"][data-tab-mode]');
      await expect(shell).not.toHaveAttribute('data-narrow');
      await expect(tabbed).toHaveCount(0);

      await page.setViewportSize({ width: narrow[0], height: narrow[1] });
      await expect(shell).toHaveAttribute('data-narrow');
      await expect(tabbed.first()).toBeVisible();

      // Each tab shows its own content, and none makes the page scroll.
      const tabs = tabbed.first().locator('[data-part="tabs"]').getByRole('tab');
      const count = await tabs.count();
      expect(count).toBeGreaterThan(1);
      for (let i = 0; i < count; i++) {
        await tabs.nth(i).click();
        await expect(tabs.nth(i)).toHaveAttribute('aria-selected', 'true');
        expect(await overflow(page)).toEqual(none);
      }
    });

    test('the keyboard walks through the screen', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await open(page, name, app.routes[0]);

      // The first stop is the link that skips the bars.
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toHaveText(/skip/i);

      // Then every stop is a visible control inside the window, and focus keeps moving.
      const seen = new Set<string>();
      for (let i = 0; i < 12; i++) {
        await page.keyboard.press('Tab');
        const stop = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement;
          const box = el.getBoundingClientRect();
          return {
            key: `${el.tagName} ${el.getAttribute('aria-label') ?? el.textContent?.trim().slice(0, 40)} @${Math.round(box.x)},${Math.round(box.y)}`,
            inside:
              box.width > 0 &&
              box.right <= innerWidth &&
              box.bottom <= innerHeight &&
              box.x >= 0 &&
              box.y >= 0,
            isBody: el === document.body,
          };
        });
        // After the last stop the browser takes focus back: the end of the walk.
        if (stop.isBody) break;
        expect(stop.inside, `${stop.key} is outside the window`).toBe(true);
        seen.add(stop.key);
      }
      // Composite controls (a nav, a list, a table) are one stop each, so the walk is short, but it reaches
      // at least a handful of different controls.
      expect(seen.size).toBeGreaterThanOrEqual(5);
      expect(await overflow(page)).toEqual(none);
    });
  });
}
