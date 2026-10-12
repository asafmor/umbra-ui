import { expect, test, type Page } from '@playwright/test';
import { paletteDefaults } from '../../src/styles/tokens.generated';
import { openStory } from './helpers';

// The derived palette in a browser (plan/decisions/08-theming.md): contrast is measured in the page,
// from what the components compute, for a sample of the colour matrix of src/provider/palette.test.ts.

/** The Playground story with the provider's colour inputs as args. */
async function play(page: Page, args: Record<string, string | number> = {}) {
  const list = Object.entries(args)
    .map(([key, value]) => `${key}:${typeof value === 'string' ? `!hex(${value.slice(1)})` : value}`)
    .join(';');
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`/iframe.html?id=foundation-theming--playground&viewMode=story${list && `&args=${list}`}`);
  await page.locator('[data-part="page"]').waitFor();
  await install(page);
}

/**
 * Colour helpers in the page. A colour is painted on a canvas and read back, so every syntax a
 * browser computes (`color-mix()`, `color(srgb …)`, alpha) becomes plain sRGB.
 */
const install = (page: Page) =>
  page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    const paint = (colours: string[]) => {
      ctx.clearRect(0, 0, 1, 1);
      for (const colour of colours) {
        ctx.fillStyle = colour;
        ctx.fillRect(0, 0, 1, 1);
      }
      return [...ctx.getImageData(0, 0, 1, 1).data];
    };
    const find = (target: string | Element) =>
      typeof target === 'string' ? document.querySelector(target)! : target;
    /** The background colours from the document down to the element, outermost first. */
    const stack = (el: Element | null): string[] =>
      el ? [...stack(el.parentElement), getComputedStyle(el).backgroundColor] : ['#000'];
    const luminance = (rgb: number[]) => {
      const [r, g, b] = rgb.slice(0, 3).map((v) => {
        const s = v / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
    };
    const ratio = (a: number[], b: number[]) => {
      const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (hi! + 0.05) / (lo! + 0.05);
    };
    const api = {
      paint,
      ratio,
      /** What is painted behind the content of the element: its own background over its ancestors'. */
      surface: (target: string | Element) => paint(stack(find(target))),
      /** What is painted behind the element. */
      under: (target: string | Element) => paint(stack(find(target).parentElement)),
      /** A colour property of the element, over its own surface. */
      ink: (target: string | Element, property = 'color') => {
        const el = find(target);
        return paint([...stack(el), getComputedStyle(el).getPropertyValue(property)]);
      },
      /** The alpha, 0 to 1, of the element's own background. */
      alpha: (target: string | Element) => paint([getComputedStyle(find(target)).backgroundColor])[3]! / 255,
      token: (name: string, target: string | Element = '[data-part="page"]') =>
        paint([getComputedStyle(find(target)).getPropertyValue(name).trim()]),
    };
    (window as unknown as { umbra: typeof api }).umbra = api;
  });

type Api = {
  paint: (colours: string[]) => number[];
  ratio: (a: number[], b: number[]) => number;
  surface: (target: string | Element) => number[];
  under: (target: string | Element) => number[];
  ink: (target: string | Element, property?: string) => number[];
  alpha: (target: string | Element) => number;
  token: (name: string, target?: string | Element) => number[];
};
declare const umbra: Api;

/** Every contrast the palette promises, measured on the components of the Playground. */
const measure = (page: Page) =>
  page.evaluate(() => {
    const u = umbra;
    const text = (selector: string) => u.ratio(u.ink(selector), u.surface(selector));
    const edge = (selector: string) => u.ratio(u.surface(selector), u.under(selector));
    const card = u.surface('[data-umbra="card"]');
    return {
      // Text, at least 4.5:1.
      primaryButton: text('button[data-variant="primary"]'),
      accentButton: text('button[data-variant="accent"]'),
      selectedRow: text('[data-umbra="list-item"][data-selected] [data-part="title"]'),
      selectedRowDescription: text('[data-umbra="list-item"][data-selected] [data-part="description"]'),
      selectedSegment: text('[data-umbra="segmented-filter"] [data-selected]'),
      selectedTab: u.ratio(
        u.ink('[data-umbra="tabs"] [data-selected] [role="tab"]'),
        u.surface('[data-umbra="tabs"] [data-part="indicator"]'),
      ),
      link: text('[data-umbra="link"]'),
      // Fills and marks against what is around or inside them, at least 3:1.
      primaryButtonEdge: edge('button[data-variant="primary"]'),
      accentButtonEdge: edge('button[data-variant="accent"]'),
      checkboxEdge: edge('[data-umbra="checkbox"] [data-part="box"]'),
      checkboxMark: text('[data-umbra="checkbox"] [data-part="box"]'),
      toggleEdge: edge('[data-umbra="toggle"] [data-part="track"]'),
      sliderFill: u.ratio(u.surface('[data-umbra="slider"] [data-part="fill"]'), card),
      sliderThumb: u.ratio(u.ink('[data-umbra="slider"] [data-part="thumb"]', 'border-top-color'), card),
      tabEdge: edge('[data-umbra="tabs"] [data-part="indicator"]'),
      segmentEdge: edge('[data-umbra="segmented-filter"] [data-selected]'),
    };
  });

const brands = ['#0a7a55', '#c81e1e', '#f5c400', '#0b5fff', '#0a0a0c', '#f2f2f2', '#808080', '#ff4fd8'];
const picked = ['#e11d2e', '#16b877', '#f5c400', '#000000', '#ffffff', '#ffb3f5', '#0000ff', '#00c2d1'];
const text = [
  'primaryButton',
  'accentButton',
  'selectedRow',
  'selectedRowDescription',
  'selectedSegment',
  'selectedTab',
  'link',
];

function expectContrast(measured: Record<string, number>) {
  for (const [name, value] of Object.entries(measured)) {
    expect(value, name).toBeGreaterThanOrEqual(text.includes(name) ? 4.5 : 3);
  }
}

test('the default look is the token values: the provider derives nothing', async ({ page }) => {
  await play(page);
  const d = paletteDefaults;
  const read = await page.evaluate(() =>
    [
      '--umbra-color-interaction',
      '--umbra-color-action',
      '--umbra-color-action-end',
      '--umbra-color-focus-ring',
    ].map((name) => umbra.token(name).slice(0, 3)),
  );
  const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  expect(read).toEqual([d.interaction, d.action, d.actionEnd, d.focusRing].map(rgb));
  expect(await page.locator('[data-umbra-root]').getAttribute('style')).toBeNull();
});

for (const brand of brands) {
  test(`brand ${brand}: every role keeps its contrast`, async ({ page }) => {
    await play(page, { brand });
    expectContrast(await measure(page));
  });
}

for (const colour of picked) {
  test(`interaction and action ${colour}: every role keeps its contrast`, async ({ page }) => {
    await play(page, { interaction: colour, action: colour });
    expectContrast(await measure(page));
  });
}

test('the brand changes the look: the selected fill, the primary action, links and the page follow it', async ({
  page,
}) => {
  const look = () =>
    page.evaluate(() => ({
      selected: umbra.surface('[data-umbra="segmented-filter"] [data-selected]').join(),
      action: umbra.surface('button[data-variant="primary"]').join(),
      link: umbra.ink('[data-umbra="link"]').join(),
      card: umbra.surface('[data-umbra="card"]').join(),
      border: umbra.ink('[data-umbra="card"]', 'border-top-color').join(),
    }));
  await play(page);
  const before = await look();
  await play(page, { brand: '#0a7a55' });
  const after = await look();
  for (const key of Object.keys(before) as (keyof typeof before)[])
    expect(after[key], key).not.toBe(before[key]);
});

for (const colour of ['#0a7a55', '#f5c400', '#ffb3f5']) {
  test(`interaction ${colour}: the focus ring shows on the card and is not the selected fill`, async ({
    page,
  }) => {
    await play(page, { interaction: colour });
    await page.locator('button[data-variant="primary"]').focus();
    await page.keyboard.press('Tab');
    const accent = page.locator('button[data-variant="accent"]');
    await expect(accent).toBeFocused();
    const measured = await page.evaluate(() => {
      const ring = umbra.ink('button[data-variant="accent"]', 'outline-color');
      const fill = umbra.surface('button[data-variant="accent"]');
      const card = umbra.surface('[data-umbra="card"]');
      return {
        onCard: umbra.ratio(ring, card),
        apart: Math.hypot(...ring.slice(0, 3).map((v, i) => v - fill[i]!)),
        width: getComputedStyle(document.querySelector('button[data-variant="accent"]')!).outlineWidth,
      };
    });
    expect(measured.width).toBe('2px');
    expect(measured.onCard).toBeGreaterThanOrEqual(3);
    // Far apart in sRGB (of 441): two colours nobody takes for each other.
    expect(measured.apart).toBeGreaterThan(40);
  });
}

test('a token set by hand wins over the derivation, on the scope and on any element inside it', async ({
  page,
}) => {
  await play(page, { brand: '#0a7a55' });
  const derived = await page.evaluate(() => umbra.surface('button[data-variant="accent"]').slice(0, 3));
  expect(derived).not.toEqual([1, 2, 3]);
  // On an element inside the scope, as an app's stylesheet would.
  await page
    .locator('[data-umbra="card"]')
    .last()
    .evaluate((card: HTMLElement) => card.style.setProperty('--umbra-color-interaction', 'rgb(1, 2, 3)'));
  // The button's background has a transition: wait for its end.
  await expect
    .poll(() => page.evaluate(() => umbra.surface('button[data-variant="accent"]').slice(0, 3)))
    .toEqual([1, 2, 3]);
  // The checkbox is in another card: it keeps the derived colour.
  expect(
    await page.evaluate(() => umbra.surface('[data-umbra="checkbox"] [data-part="box"]').slice(0, 3)),
  ).toEqual(derived);
});

test('the `tokens` prop wins over the derivation in the same scope', async ({ page }) => {
  await openStory(page, 'foundation-theming--token-wins');
  await install(page);
  expect(await page.evaluate(() => umbra.surface('button[data-variant="accent"]').slice(0, 3))).toEqual([
    1, 2, 3,
  ]);
  // The action colour was not set by hand: it is still derived from the brand.
  expect(await page.evaluate(() => umbra.surface('button[data-variant="primary"]').slice(0, 3))).not.toEqual([
    0xdb, 0x10, 0x65,
  ]);
});

test('UmbraScope derives again for its subtree, and a preset context keeps its own neutrals', async ({
  page,
}) => {
  await openStory(page, 'foundation-theming--combinations');
  await install(page);
  const read = (screen: string) =>
    page.evaluate((name) => {
      const root = document.querySelector(`[data-screen="${name}"]`)!;
      return {
        selected: umbra
          .surface(root.querySelector('[data-umbra="segmented-filter"] [data-selected]')!)
          .join(),
        action: umbra.surface(root.querySelector('button[data-variant="primary"]')!).join(),
        border: umbra.ink(root.querySelector('[data-umbra="card"]')!, 'border-top-color').join(),
        context: getComputedStyle(root).getPropertyValue('--umbra-context').trim(),
      };
    }, screen);
  const [base, green, slate, orange] = [
    await read('Default'),
    await read('Brand green'),
    await read('Brand blue, context slate'),
    await read('Brand grey, interaction orange'),
  ];
  expect(green.selected).not.toBe(base.selected);
  expect(green.action).not.toBe(base.action);
  // The context follows the brand when none is set, and is the app's when one is.
  expect(green.context).not.toBe('');
  expect(green.context).not.toBe(base.context);
  expect(green.border).not.toBe(base.border);
  expect(slate.context).toBe('#5a6670');
  expect(slate.selected).not.toBe(base.selected);
  // An interaction colour of the app's is used; the action colour still follows the brand.
  expect(orange.selected).not.toBe(base.selected);
  expect(orange.action).not.toBe(base.action);
});

test('surface opacity: the card surface is mixed with transparent, and its content stays opaque', async ({
  page,
}) => {
  await openStory(page, 'foundation-theming--surface-opacity');
  await install(page);
  for (const opacity of [1, 0.5, 0]) {
    const card = `[data-umbra="card"][data-opacity="${opacity}"]`;
    const measured = await page.evaluate((selector) => {
      const el = document.querySelector(selector)!;
      const opacities = [
        el,
        ...el.querySelectorAll('p, button, [data-part="title"], [data-part="body"]'),
      ].map((node) => getComputedStyle(node).opacity);
      return {
        alpha: umbra.alpha(selector),
        text: umbra.paint([getComputedStyle(el.querySelector('p')!).color])[3],
        opaque: opacities.every((value) => value === '1'),
        // Over the pattern's bright lines, the worst the library's own background gets.
        onBackground: umbra.ratio(
          umbra.paint([getComputedStyle(el.querySelector('p')!).color]),
          umbra.paint(['#000', getComputedStyle(el).getPropertyValue('--umbra-context-page-background-end')]),
        ),
      };
    }, card);
    expect(measured.alpha).toBeCloseTo(opacity, 1);
    expect(measured.text).toBe(255);
    expect(measured.opaque).toBe(true);
    expect(measured.onBackground).toBeGreaterThanOrEqual(4.5);
  }
});

test('surface opacity: an overlay opened from a transparent card is opaque', async ({ page }) => {
  await openStory(page, 'foundation-theming--surface-opacity');
  await install(page);
  await page
    .locator('[data-opacity="0"]')
    .getByRole('button', { name: /Frequency/ })
    .click();
  const list = page.getByRole('listbox');
  await expect(list).toBeVisible();
  // The panel that carries the background is the list or an element around it.
  const alpha = await list.evaluate((el) => {
    for (let node: Element | null = el; node; node = node.parentElement) {
      const value = umbra.alpha(node);
      if (value > 0) return value;
    }
    return 0;
  });
  expect(alpha).toBe(1);
  // The scope's setting reaches the portal, and still nothing there reads it.
  expect(
    await list.evaluate((el) => getComputedStyle(el).getPropertyValue('--umbra-surface-opacity').trim()),
  ).toBe('0');
});

// O-4: the edge stripe is for rows of data. A menu-like row has none: a chosen option shows a check, the
// current page is bold on the fill, and the highlight (pointer or arrow keys) is not the selected fill.
const noStripe = (el: Element) => {
  const style = getComputedStyle(el);
  const before = getComputedStyle(el, '::before');
  return (
    style.boxShadow === 'none' &&
    parseFloat(style.borderInlineStartWidth) === 0 &&
    (before.content === 'none' ||
      parseFloat(before.width) === 0 ||
      before.backgroundColor === 'rgba(0, 0, 0, 0)')
  );
};

test('menu: no stripe; a checked row has a check, the current row is bold, and the highlight differs', async ({
  page,
}) => {
  await play(page);
  await page.getByRole('button', { name: 'View options' }).click();
  const menu = page.getByRole('menu');
  const current = menu.locator('[data-current]');
  const checked = menu.getByRole('menuitemcheckbox', { name: 'Dense rows' });
  const plain = menu.getByRole('menuitem', { name: 'Orders' });
  for (const row of [current, checked, plain]) expect(await row.evaluate(noStripe)).toBe(true);
  await expect(checked.locator('[data-part="check"] svg')).toBeVisible();
  await expect(menu.getByRole('menuitemcheckbox', { name: 'Grid lines' }).locator('svg')).toHaveCount(0);
  await expect(current).toHaveAttribute('aria-current', 'page');
  expect(await current.evaluate((el) => getComputedStyle(el).fontWeight)).toBe('700');
  await plain.hover();
  await expect(plain).toHaveAttribute('data-hovered', 'true');
  const [highlight, selected, resting] = await Promise.all(
    [plain, current, checked].map((row) => row.evaluate((el) => umbra.surface(el).join())),
  );
  expect(highlight).not.toBe(selected);
  expect(highlight).not.toBe(resting);
});

test('select: no stripe on the chosen option, which has a check; the highlight differs from it', async ({
  page,
}) => {
  await play(page);
  await page.getByRole('button', { name: /Frequency/ }).click();
  const list = page.getByRole('listbox');
  const chosen = list.getByRole('option', { name: 'When needed' });
  const other = list.getByRole('option', { name: 'Never' });
  expect(await chosen.evaluate(noStripe)).toBe(true);
  await expect(chosen.locator('[data-part="check"] svg')).toBeVisible();
  await expect(other.locator('svg')).toHaveCount(0);
  await other.hover();
  await expect(other).toHaveAttribute('data-hovered', 'true');
  const [highlight, selected] = await Promise.all(
    [other, chosen].map((row) => row.evaluate((el) => umbra.surface(el).join())),
  );
  expect(highlight).not.toBe(selected);
});

test('vertical nav: no stripe on the current item, which is bold with aria-current', async ({ page }) => {
  await openStory(page, 'shell-verticalnav--default');
  const current = page.locator('[data-umbra="vertical-nav"] [aria-current]').first();
  await expect(current).toBeVisible();
  expect(await current.evaluate(noStripe)).toBe(true);
  expect(await current.evaluate((el) => getComputedStyle(el).fontWeight)).toBe('700');
  const other = page
    .locator(
      '[data-umbra="vertical-nav"] a:not([aria-current]), [data-umbra="vertical-nav"] button:not([aria-current])',
    )
    .first();
  expect(await other.evaluate((el) => getComputedStyle(el).fontWeight)).not.toBe('700');
});

test('command palette: the highlighted row has no stripe and is not the selected fill', async ({ page }) => {
  await openStory(page, 'overlays-commandpalette--default');
  await install(page);
  const active = page.locator('[data-umbra="command-palette"] [data-active]').first();
  await expect(active).toBeVisible();
  expect(await active.evaluate(noStripe)).toBe(true);
  const measured = await active.evaluate((el) => ({
    row: umbra.surface(el).slice(0, 3).join(),
    panel: umbra.under(el).slice(0, 3).join(),
    selected: umbra.token('--umbra-color-interaction', el).slice(0, 3).join(),
    text: umbra.ratio(umbra.ink(el), umbra.surface(el)),
  }));
  expect(measured.row).not.toBe(measured.selected);
  expect(measured.row).not.toBe(measured.panel);
  expect(measured.text).toBeGreaterThanOrEqual(4.5);
});

test('the stripe stays on rows of data: a selected list row', async ({ page }) => {
  await play(page);
  const stripe = await page
    .locator('[data-umbra="list-item"][data-selected]')
    .evaluate((el) => parseFloat(getComputedStyle(el, '::before').width));
  expect(stripe).toBeGreaterThan(0);
});
