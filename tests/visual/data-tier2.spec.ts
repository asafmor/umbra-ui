import { expect, test, type Locator, type Page } from '@playwright/test';
import { contextPresets } from '../../src/styles/tokens.generated';
import { expectFocusKept, openStory, pressKeys, settle } from './helpers';
import { expectChangeHighlights } from './live';
import { contrast } from './pixels';

// Behaviour of SequenceDots, MediaCard and Comparison that a still image cannot show: names and roles
// for assistive technology, keyboard and focus, and every "show less as it shrinks" step.
const fits = (locator: Locator) =>
  locator.evaluate((el) => el.scrollWidth <= el.clientWidth + 1 && el.scrollHeight <= el.clientHeight + 1);
const box = async (locator: Locator) => (await locator.boundingBox())!;
const region = (page: Page, name: string) => page.getByRole('region', { name, exact: true });
/** A labelled row of a story (`Row` of storyParts.tsx), in the page or in one card. */
const row = (scope: Page | Locator, label: string) =>
  scope.locator(`div:has(> span:text-is("${label}"))`).last();
const tooltip = (page: Page) => page.locator('[data-umbra="tooltip"]');
const resize = async (page: Page, target: Locator, size: { width?: number; height?: number }) => {
  await target.evaluate((el, { width, height }) => {
    if (width !== undefined) (el as HTMLElement).style.width = `${width}px`;
    if (height !== undefined) (el as HTMLElement).style.height = `${height}px`;
  }, size);
  await settle(page);
};

test.describe('SequenceDots', () => {
  const dots = '[data-umbra="sequence-dots"]';
  const marks = (scope: Locator) => scope.locator('[data-part="mark"]');

  test('the sequence is one image named by its items; `max` keeps the newest', async ({ page }) => {
    await openStory(page, 'data-sequencedots--variants');
    await expect(
      page.getByRole('img', {
        name: 'Run 1: Passed, Run 2: Passed, Run 3: Failed, Run 4: Partial, Run 5: Passed',
      }),
    ).toHaveCount(7);
    const limited = row(page, 'max={3}').locator(dots);
    await expect(limited).toHaveAttribute('aria-label', 'Run 6: Passed, Run 7: Failed, Run 8: Passed');
    await expect(marks(limited)).toHaveCount(3);
    await expect(marks(limited).last()).toHaveAttribute('data-id', 'run-8');
  });

  test('every tone has its own shape, and its own fill as a bar', async ({ page }) => {
    await openStory(page, 'data-sequencedots--variants');
    for (const card of ['Dots', 'Bars']) {
      const every = marks(row(region(page, card), 'Every tone').locator(dots));
      const tones = await every.evaluateAll((all) => all.map((el) => el.getAttribute('data-tone')));
      const shapes = await every.evaluateAll((all) => all.map((el) => el.getAttribute('data-mark')));
      expect(tones).toEqual(['success', 'danger', 'warning', 'info', 'accent', 'neutral']);
      expect(new Set(shapes).size).toBe(6);
    }
    // The six fills are drawn differently: no two bars share a background and a border.
    const fills = await marks(row(region(page, 'Bars'), 'Every tone').locator(dots)).evaluateAll((all) =>
      all.map((el) => {
        const css = getComputedStyle(el.firstElementChild!);
        return `${css.backgroundImage.replace(/rgba?\([^)]*\)/g, 'c')}|${css.borderTopStyle}`;
      }),
    );
    expect(new Set(fills).size).toBe(6);
  });

  test('a bar is as tall as its value; a missing value is a stub', async ({ page }) => {
    await openStory(page, 'data-sequencedots--variants');
    const heights = (scope: Locator) =>
      scope
        .locator('[data-part="mark"] > span')
        .evaluateAll((all) => all.map((el) => el.getBoundingClientRect().height));
    // 6.2, 7.4, 3.1, 5.5, 8.8
    const [a, b, c, d, e] = await heights(row(region(page, 'Bars'), 'Large').locator(dots));
    expect(e!).toBeGreaterThan(b!);
    expect(b!).toBeGreaterThan(a!);
    expect(a!).toBeGreaterThan(d!);
    expect(d!).toBeGreaterThan(c!);
    expect(e!).toBe(24);
    // On a range of 0 to 20 the same values are under half of the height.
    expect(Math.max(...(await heights(row(page, 'range 0 to 20').locator(dots))))).toBeLessThan(12);
    const missing = await heights(row(page, 'A missing value').locator(dots));
    expect([missing[1], missing[4]]).toEqual([2, 2]);
  });

  test('no value is a dash with a text for assistive technology; loading is busy', async ({ page }) => {
    await openStory(page, 'data-sequencedots--variants');
    const empty = row(region(page, 'Dots'), 'No value').locator('[data-part="empty"]');
    await expect(empty.first()).toHaveText('—No value');
    await expect(empty.nth(1)).toHaveText('None yetNo value');
    await expect(empty.first().locator('[data-part="mark"]')).toHaveCount(0);
    const loading = row(region(page, 'Dots'), 'Loading').locator(dots);
    await expect(loading.first()).toHaveAttribute('aria-busy', 'true');
    await expect(loading.first().locator('[data-part="skeleton"]')).toBeVisible();
    await expect(marks(loading.first())).toHaveCount(0);
  });

  test('with onAction the marks are one tab stop: arrows move, Enter and Space act', async ({ page }) => {
    await openStory(page, 'data-sequencedots--interactive');
    const toolbars = page.getByRole('toolbar');
    await expect(toolbars).toHaveCount(3);
    await expect(toolbars.first().getByRole('button')).toHaveCount(5);
    await pressKeys(page, 'Tab');
    await expect(toolbars.first().getByRole('button', { name: 'Run 1: Passed' })).toBeFocused();
    // Keyboard focus shows the mark's tooltip at once.
    await expect(tooltip(page)).toHaveText('Run 1: Passed');
    await pressKeys(page, 'ArrowRight', 'ArrowRight');
    await expect(toolbars.first().getByRole('button', { name: 'Run 3: Failed' })).toBeFocused();
    await expect(tooltip(page)).toHaveText('Run 3: Failed');
    await pressKeys(page, 'Enter');
    await expect(page.getByText('Last action: run-3')).toBeVisible();
    await pressKeys(page, 'ArrowLeft', 'Space');
    await expect(page.getByText('Last action: run-2')).toBeVisible();
    // One tab stop per sequence: Tab goes to the next one, where the bars are buttons too.
    await pressKeys(page, 'Tab');
    await expect(toolbars.nth(1).getByRole('button').first()).toBeFocused();
    // A disabled mark is passed over.
    await pressKeys(page, 'Tab', 'ArrowRight', 'ArrowRight');
    await expect(toolbars.nth(2).getByRole('button', { name: 'Run 4: Partial' })).toBeFocused();
    await expect(toolbars.nth(2)).toHaveAttribute('aria-label', 'Last five runs');
    // A press with the pointer acts too, and every target is 24px or more.
    await toolbars.first().getByRole('button').last().click();
    await expect(page.getByText('Last action: run-5')).toBeVisible();
    await expectFocusKept(page);
    const target = await box(toolbars.first().getByRole('button').first());
    expect(Math.min(target.width, target.height)).toBeGreaterThanOrEqual(24);
  });

  test('a mark that cannot be pressed shows its tooltip on hover', async ({ page }) => {
    await openStory(page, 'data-sequencedots--interactive');
    const plain = region(page, 'Tooltips only').locator(dots);
    await expect(plain.getByRole('button')).toHaveCount(0);
    await marks(plain).nth(2).hover();
    await expect(tooltip(page)).toHaveText('Run 3: Failed');
  });

  test('the oldest marks go as the room shrinks, the newest stays, and they come back', async ({ page }) => {
    await openStory(page, 'data-sequencedots--shrinking');
    const at = (label: string) => row(page, label).locator(dots);
    const counts: number[] = [];
    for (const label of ['160px', '96px', '60px', '20px']) {
      const sequence = at(label);
      counts.push(await marks(sequence).count());
      // The newest is always the last one shown, and nothing leaves the box.
      await expect(marks(sequence).last()).toHaveAttribute('data-id', 'run-8');
      expect(await fits(sequence)).toBe(true);
      // The summary is of the data, not of the room.
      expect((await sequence.getAttribute('aria-label'))!.split(', ')).toHaveLength(8);
    }
    expect(counts[0]).toBe(8);
    expect(counts[1]!).toBeLessThan(8);
    expect(counts[2]!).toBeLessThan(counts[1]!);
    expect(counts[3]).toBe(1);
    await expect(marks(at('Bars, 30px'))).toHaveCount(3);
    const pressable = at('Pressable');
    await expect(pressable.getByRole('button')).toHaveCount(3);
    expect(await fits(pressable)).toBe(true);

    // Growing restarts from everything; shrinking again gives what a fresh load at that size gives.
    const narrow = row(page, '60px').locator('[data-narrow]');
    await resize(page, narrow, { width: 200 });
    await expect(marks(at('60px'))).toHaveCount(8);
    await resize(page, narrow, { width: 60 });
    await expect(marks(at('60px'))).toHaveCount(counts[2]!);

    // Focus stays in the sequence when the focused mark is dropped.
    const holder = row(page, 'Pressable').locator('[data-narrow]');
    await pressable.getByRole('button').first().focus();
    await resize(page, holder, { width: 40 });
    await expect(pressable.getByRole('button')).toHaveCount(1);
    await expectFocusKept(page);
  });

  test('right to left: the newest mark is at the left, and the arrow keys follow what is drawn', async ({
    page,
  }) => {
    await openStory(page, 'data-sequencedots--right-to-left');
    const buttons = page.getByRole('toolbar').first().getByRole('button');
    expect((await box(buttons.last())).x).toBeLessThan((await box(buttons.first())).x);
    await pressKeys(page, 'Tab', 'ArrowLeft');
    await expect(buttons.nth(1)).toBeFocused();
    await pressKeys(page, 'ArrowRight');
    await expect(buttons.first()).toBeFocused();
  });

  test('parts and blocks', async ({ page }) => {
    await openStory(page, 'data-sequencedots--parts-and-blocks');
    const squares = row(page, 'Function').locator('[data-part="mark"]');
    expect(await squares.evaluateAll((all) => all.map((el) => el.getAttribute('data-mark')))).toEqual(
      Array(5).fill('square'),
    );
    await expect(row(page, 'Node')).toContainText('Loading runs');
    await expect(row(page, 'Hidden').locator(dots)).toHaveCount(0);
    await expect(page.getByRole('img', { name: 'Three checks: passed, passed, failed' })).toBeVisible();
  });
});

test.describe('MediaCard', () => {
  const card = (page: Page, name: string | RegExp) => page.getByRole('article', { name });
  const part = (scope: Locator, name: string) => scope.locator(`[data-part="${name}"]`);
  const boxed = (page: Page, label: string) => page.locator(`[data-box="${label}"]`);

  test('the card is an article named by its title, a heading', async ({ page }) => {
    await openStory(page, 'data-mediacard--variants');
    const hero = card(page, 'Quarterly review published');
    await expect(hero.getByRole('heading', { level: 3, name: 'Quarterly review published' })).toBeVisible();
    await expect(hero.getByRole('img', { name: 'A drawn landscape' })).toBeVisible();
    await expect(hero).toHaveAttribute('data-variant', 'hero');
    // A pair card is named by its two sides, and has no heading.
    const pair = card(page, /Region A.*12.*to.*9.*Region B/);
    await expect(pair).toHaveAttribute('data-variant', 'pair');
    await expect(pair.getByRole('heading')).toHaveCount(0);
    // The details of a pair card are above its two sides.
    expect((await box(part(pair, 'footer'))).y).toBeLessThan(
      (await box(pair.locator('[data-umbra="list-item"]'))).y,
    );
    await openStory(page, 'data-mediacard--parts-and-blocks');
    await expect(
      page.getByRole('heading', { level: 4, name: 'Function: a title of one line' }),
    ).toBeVisible();
    await expect(
      card(page, 'Composed by hand').getByRole('link', { name: 'Composed from the blocks' }),
    ).toBeVisible();
    await expect(part(card(page, 'Node: the meta line is replaced'), 'meta')).toHaveText('Replaced meta');
    await expect(part(card(page, 'Null: no category'), 'category')).toHaveCount(0);
  });

  test('the whole card is one link or button, and a control inside stays its own', async ({ page }) => {
    await openStory(page, 'data-mediacard--links-and-actions');
    const pressable = card(page, 'A button with an action inside');
    const log = (text: string) => expect(page.getByText(`Last action: ${text}`)).toBeVisible();
    // No control is nested in another.
    await expect(page.locator('a a, a button, button a, button button')).toHaveCount(0);
    // A press anywhere on the card, here on its picture, opens it.
    await pressable.click({ position: { x: 24, y: 24 } });
    await log('Opened the card');
    await pressable.getByRole('button', { name: 'Save for later' }).click();
    await log('Saved');
    const size = await box(pressable);
    await pressable.click({ position: { x: size.width / 2, y: size.height - 6 } });
    await log('Opened the card');

    // By keyboard: the card first, then its control.
    await page.locator('body').click({ position: { x: 2, y: 2 } });
    await pressKeys(page, 'Tab');
    await expect(pressable.getByRole('button', { name: 'A button with an action inside' })).toBeFocused();
    await pressKeys(page, 'Tab');
    await expect(pressable.getByRole('button', { name: 'Save for later' })).toBeFocused();
    await pressKeys(page, 'Enter');
    await log('Saved');
    await pressKeys(page, 'Shift+Tab', 'Enter');
    await log('Opened the card');

    // `renderLink` gets the link, which still covers the card.
    const routed = card(page, "A link through the app's router").getByRole('link');
    await expect(routed).toHaveAttribute('data-router', '');
    await expect(routed).toHaveAttribute('href', '#routed');
    await pressKeys(page, 'Tab', 'Tab');
    await expect(routed).toBeFocused();
    // The focus ring is around the card, inside its edge.
    const ring = await routed.evaluate((el) => {
      const after = getComputedStyle(el, '::after');
      const root = el.closest('[data-umbra="media-card"]')!.getBoundingClientRect();
      return {
        style: after.outlineStyle,
        offset: parseFloat(after.outlineOffset),
        width: root.width,
        cover: parseFloat(after.width),
      };
    });
    expect(ring.style).toBe('solid');
    expect(ring.offset).toBeLessThan(0);
    expect(ring.cover).toBeGreaterThan(ring.width - 4);

    // A pair card: a button named by the two sides covers it.
    const pair = card(page, /Region A/);
    await pressKeys(page, 'Tab');
    await expect(pair.getByRole('button', { name: /Region A.*Region B/ })).toBeFocused();
    await pressKeys(page, 'Space');
    await log('Opened the pair');
    await pressable.getByRole('button', { name: 'Save for later' }).click();
    await pair.click({ position: { x: 8, y: 8 } });
    await log('Opened the pair');
    // A plain card has nothing to press.
    await expect(card(page, 'Plain: nothing to press').locator('a, button')).toHaveCount(0);
    await expect(card(page, 'Plain: nothing to press')).not.toHaveAttribute('data-interactive');
  });

  test('a picture that fails or is missing is a drawn placeholder; loading is a skeleton', async ({
    page,
  }) => {
    await openStory(page, 'data-mediacard--states');
    const failed = card(page, 'The picture failed to load');
    await expect(part(failed, 'placeholder')).toBeVisible();
    await expect(failed.locator('img')).toHaveCount(0);
    await expect(part(card(page, 'No picture was given'), 'placeholder')).toBeVisible();
    await expect(part(card(page, 'The picture is hidden'), 'image')).toHaveCount(0);
    for (const name of ['Loading article', 'Loading item', 'Loading comparison']) {
      await expect(card(page, name)).toHaveAttribute('aria-busy', 'true');
      await expect(part(card(page, name), 'skeleton').first()).toBeVisible();
      await expect(card(page, name).getByRole('heading')).toHaveCount(0);
    }
    // The skeleton of a card with a picture has the picture's place.
    await expect(part(card(page, 'Loading item'), 'skeleton')).toHaveCount(2);
    await expect(part(card(page, 'Loading comparison'), 'skeleton')).toHaveCount(1);
  });

  test('narrower: the description and the category go, then the picture and the meta line', async ({
    page,
  }) => {
    await openStory(page, 'data-mediacard--narrower');
    const at = (width: number) => boxed(page, `Compact, ${width}px`).getByRole('article');
    for (const [width, shown, hidden] of [
      [300, ['image', 'title', 'description', 'meta', 'category'], []],
      [210, ['image', 'title', 'meta'], ['description', 'category']],
      [150, ['title'], ['image', 'description', 'meta', 'category']],
    ] as const) {
      for (const name of shown) await expect(part(at(width), name)).toBeVisible();
      for (const name of hidden) await expect(part(at(width), name)).toBeHidden();
      // Text never leaves the card.
      expect(await fits(at(width))).toBe(true);
    }
    // The description is held to two lines, the title too, each with an ellipsis.
    const lines = (locator: Locator) =>
      locator.evaluate((el) =>
        Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)),
      );
    expect(await lines(part(at(300), 'description'))).toBe(2);
    expect(await lines(part(at(150), 'title'))).toBe(2);
    // A title that is cut short shows all of it in a tooltip.
    await part(at(300), 'title').hover();
    await expect(tooltip(page)).toContainText('ends in an ellipsis when it must');
    // A pair card keeps its two values and its centre.
    const pair = boxed(page, 'Pair, 170px').getByRole('article');
    await expect(pair.locator('[data-part="center"]')).toBeVisible();
    await expect(pair.locator('[data-umbra="list-item"] [data-part="meta"]')).toHaveText(['12', '9']);
    expect(await fits(pair)).toBe(true);
  });

  test('shorter: the picture shrinks, the description clamps and goes, the meta goes, the picture goes', async ({
    page,
  }) => {
    await openStory(page, 'data-mediacard--shorter');
    const holder = (height: number) => boxed(page, `Hero, ${height}px high`);
    const at = (height: number) => holder(height).getByRole('article');
    const level = (height: number) => at(height).evaluate((el) => Number(el.getAttribute('data-level') ?? 0));
    const imageHeight = async (height: number) => (await box(part(at(height), 'image'))).height;

    // Tall enough: everything, with the picture at its ratio or more.
    expect(await level(280)).toBe(0);
    await expect(part(at(280), 'description')).toBeVisible();
    // Less: the picture alone gives way first.
    expect(await level(200)).toBe(0);
    expect(await imageHeight(200)).toBeLessThan(await imageHeight(280));
    expect(await imageHeight(200)).toBeGreaterThanOrEqual(48);
    // Then the description (one line, then none), while the picture is at its minimum or more.
    expect(await level(150)).toBe(2);
    await expect(part(at(150), 'description')).toBeHidden();
    await expect(part(at(150), 'meta')).toBeVisible();
    await expect(part(at(150), 'image')).toBeVisible();
    // Then the meta line, then the picture: the title is what is left.
    for (const height of [100, 60]) {
      expect(await level(height)).toBe(4);
      await expect(part(at(height), 'meta')).toBeHidden();
      await expect(part(at(height), 'image')).toBeHidden();
      await expect(part(at(height), 'title')).toBeVisible();
    }
    for (const height of [280, 200, 150, 100, 60]) expect(await fits(at(height))).toBe(true);

    // The steps in between, one at a time, on one card; each is a function of the height alone.
    const steps = async (height: number) => {
      await resize(page, holder(60), { height });
      return level(60);
    };
    const seen: number[] = [];
    for (let height = 60; height <= 290; height += 10) seen.push(await steps(height));
    expect(seen[0]).toBe(4);
    expect(seen.at(-1)).toBe(0);
    expect([...new Set(seen)].sort()).toEqual([0, 1, 2, 3, 4]);
    expect(seen).toEqual([...seen].sort((a, b) => b - a));
    const back: number[] = [];
    for (let height = 290; height >= 60; height -= 10) back.unshift(await steps(height));
    expect(back).toEqual(seen);
    // Level 1 is the description on one line.
    await steps(60 + 10 * seen.indexOf(1));
    await expect(part(at(60), 'description')).toBeVisible();
    expect((await box(part(at(60), 'description'))).height).toBeLessThan(20);
  });

  test('text over a picture keeps 4.5:1 on a white picture, on every tint', async ({ page }) => {
    for (const context of contextPresets) {
      await openStory(page, 'data-mediacard--over-a-light-picture', { context });
      const pairs = await page
        .locator('[data-umbra="media-card"] [data-part="content"]')
        .evaluateAll((contents) => {
          // Any colour syntax, as the browser paints it: red, green, blue and alpha.
          const context = new OffscreenCanvas(1, 1).getContext('2d', { willReadFrequently: true })!;
          const parse = (colour: string) => {
            context.clearRect(0, 0, 1, 1);
            context.fillStyle = colour.trim();
            context.fillRect(0, 0, 1, 1);
            const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
            return [r!, g!, b!, a! / 255];
          };
          const over = (top: number[], under: number[]) => {
            const alpha = top[3] ?? 1;
            return under.map((c, i) => top[i]! * alpha + c * (1 - alpha));
          };
          return contents.flatMap((content) => {
            // The scrim over the lightest picture there is.
            const scrim = over(parse(getComputedStyle(content).getPropertyValue('--scrim')), [255, 255, 255]);
            const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
            const found: { text: string; fg: number[]; bg: number[] }[] = [];
            while (walker.nextNode()) {
              const node = walker.currentNode;
              if (!node.textContent?.trim()) continue;
              // Fills between the text and the scrim, innermost last.
              let bg = scrim;
              const fills: number[][] = [];
              for (let el = node.parentElement!; el !== content; el = el.parentElement!) {
                const fill = parse(getComputedStyle(el).backgroundColor);
                if ((fill[3] ?? 1) > 0) fills.unshift(fill);
              }
              for (const fill of fills) bg = over(fill, bg);
              found.push({
                text: node.textContent,
                fg: parse(getComputedStyle(node.parentElement!).color),
                bg,
              });
            }
            return found;
          });
        });
      expect(pairs.length).toBeGreaterThanOrEqual(6);
      for (const { text, fg, bg } of pairs) {
        const ratio = contrast(fg.slice(0, 3) as [number, number, number], bg as [number, number, number]);
        expect(ratio, `${text} on ${context}`).toBeGreaterThanOrEqual(4.5);
      }
    }
    // The text lies on the scrim: the picture fills the card behind it.
    const first = page.getByRole('article').first();
    const picture = await box(first.locator('svg').first());
    const whole = await box(first);
    expect(picture.height).toBeGreaterThan(whole.height - 4);
  });

  test('right to left: the picture of a compact card is at the right, its actions at the left', async ({
    page,
  }) => {
    await openStory(page, 'data-mediacard--right-to-left');
    const compact = page.getByRole('article', { name: 'Two suppliers added to the shortlist' });
    const image = await box(compact.locator('[data-part="image"]'));
    const title = await box(compact.locator('[data-part="title"]'));
    const actions = await box(compact.locator('[data-part="actions"]'));
    expect(image.x).toBeGreaterThan(title.x);
    expect(actions.x).toBeLessThan(title.x + title.width / 2);
    // The first side of a pair card is at the right.
    const pair = page.getByRole('article', { name: /Region A/ });
    expect((await box(pair.locator('[data-part="side"]'))).x).toBeGreaterThan(
      (await box(pair.locator('[data-part="opposite"]'))).x,
    );
  });
});

test.describe('Comparison', () => {
  const root = '[data-umbra="comparison"]';
  const boxed = (page: Page, label: string) => page.locator(`[data-box="${label}"]`);
  const part = (scope: Locator, name: string) => scope.locator(`[data-part="${name}"]`);

  test('it is a table: each row reads its label, then the first and the second side', async ({ page }) => {
    await openStory(page, 'data-comparison--variants');
    const table = page.getByRole('table', { name: 'Region A and Region B', exact: true });
    await expect(table.getByRole('columnheader')).toHaveText(['Metric', /Region A/, /Region B/]);
    const orders = table.getByRole('row', { name: /Orders/ });
    await expect(orders.getByRole('rowheader')).toHaveText('Orders');
    await expect(orders.getByRole('cell')).toHaveText(['128Leading', '96']);
    // In the page's order too: label, first side, second side.
    expect(await orders.evaluate((el) => [...el.children].map((c) => c.getAttribute('role')))).toEqual([
      'rowheader',
      'cell',
      'cell',
      null,
    ]);
    // Drawn with the label between the two values.
    const [a, label, b] = await Promise.all([
      box(orders.getByRole('cell').first()),
      box(orders.getByRole('rowheader')),
      box(orders.getByRole('cell').last()),
    ]);
    expect(a.x).toBeLessThan(label.x);
    expect(label.x).toBeLessThan(b.x);
    // The label is in the middle, whatever the two values are.
    const whole = await box(orders);
    expect(Math.abs(label.x + label.width / 2 - (whole.x + whole.width / 2))).toBeLessThan(1);
    // The bars are a drawing of the two values beside them.
    await expect(part(orders, 'bars')).toHaveAttribute('aria-hidden', 'true');
  });

  test('the leading side is heavier and marked; `lowerIsBetter` turns it; level and missing have none', async ({
    page,
  }) => {
    await openStory(page, 'data-comparison--variants');
    const table = page.getByRole('table', { name: 'Region A and Region B', exact: true });
    const leaders = async (label: string) => {
      const cells = table.getByRole('row', { name: new RegExp(label) }).getByRole('cell');
      return cells.evaluateAll((all) =>
        all.map((el) => ({
          leader: el.hasAttribute('data-leader'),
          weight: getComputedStyle(el).fontWeight,
          mark: !!el.querySelector('[data-part="leader"]'),
        })),
      );
    };
    const lead = { leader: true, weight: '700', mark: true };
    const plain = { leader: false, weight: '500', mark: false };
    expect(await leaders('Orders')).toEqual([lead, plain]);
    expect(await leaders('Returns')).toEqual([lead, plain]);
    expect(await leaders('Cost per order')).toEqual([plain, lead]);
    expect(await leaders('Visits')).toEqual([plain, plain]);
    expect(await leaders('Average rating')).toEqual([plain, plain]);
    await expect(
      table
        .getByRole('row', { name: /Average rating/ })
        .getByRole('cell')
        .last(),
    ).toHaveText('—');
    await expect(
      table
        .getByRole('row', { name: /Delivered on time/ })
        .getByRole('cell')
        .first(),
    ).toHaveText('92%Leading');
    // `highlightLeader={false}`: no mark and no weight.
    const quiet = page.getByRole('table', { name: 'Plan and actual' });
    await expect(part(quiet, 'leader')).toHaveCount(0);
  });

  test('each bar grows from the centre by its share, in both directions', async ({ page }) => {
    for (const direction of ['ltr', 'rtl'] as const) {
      await openStory(page, 'data-comparison--variants', { direction });
      const table = page.getByRole('table', { name: 'Region A and Region B', exact: true });
      const bars = table.getByRole('row', { name: /Orders/ }).locator('[data-part="bar"]');
      const [a, b] = await Promise.all([box(bars.first()), box(bars.last())]);
      const [trackA, trackB] = await Promise.all([
        box(bars.first().locator('..')),
        box(bars.last().locator('..')),
      ]);
      const end = (rect: typeof a) => rect.x + rect.width;
      // 128 against 96: a full bar and three quarters of one.
      expect(a.width).toBeCloseTo(trackA.width, 0);
      expect(b.width / trackB.width).toBeCloseTo(0.75, 1);
      // The first side is at the start of the line, and each bar touches the centre.
      if (direction === 'ltr') {
        expect(trackA.x).toBeLessThan(trackB.x);
        expect(b.x).toBeCloseTo(trackB.x, 0);
        expect(end(b)).toBeLessThan(end(trackB) - 10);
      } else {
        expect(trackA.x).toBeGreaterThan(trackB.x);
        expect(end(b)).toBeCloseTo(end(trackB), 0);
        expect(b.x).toBeGreaterThan(trackB.x + 10);
      }
      const names = await Promise.all([box(part(table, 'side')), box(part(table, 'opposite'))]);
      expect(names[0].x < names[1].x).toBe(direction === 'ltr');
      // The values follow their sides.
      const cells = table.getByRole('row', { name: /Orders/ }).getByRole('cell');
      expect((await box(cells.first())).x < (await box(cells.last())).x).toBe(direction === 'ltr');
    }
  });

  test('the summary is a row of the table, large and in the middle of the header', async ({ page }) => {
    await openStory(page, 'data-comparison--variants');
    const table = page.getByRole('table', { name: 'Region A and Region B, week 12' });
    const summary = table.getByRole('row', { name: /Week 12/ });
    await expect(summary.getByRole('rowheader')).toHaveText('Week 12');
    await expect(summary.getByRole('cell')).toHaveText(['12', '9']);
    const size = (locator: Locator) => locator.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(await size(summary.getByRole('cell').first())).toBeGreaterThan(
      (await size(part(table, 'side'))) * 1.5,
    );
    const [whole, middle] = await Promise.all([box(part(table, 'header')), box(summary)]);
    expect(Math.abs(middle.x + middle.width / 2 - (whole.x + whole.width / 2))).toBeLessThan(1);
    await expect(part(table, 'bars')).toHaveCount(0);
  });

  test('the strip is one line, read from the first side to the second', async ({ page }) => {
    await openStory(page, 'data-comparison--variants');
    const strip = page.getByRole('group', { name: 'Week 12' });
    await expect(strip).toHaveText(/Region A12–9.*Region BWeek 12/);
    expect((await box(strip)).height).toBeLessThanOrEqual(40);
    // Without a summary it shows the first row.
    await expect(page.getByRole('group', { name: 'Orders' })).toHaveText(/Region A128–96.*Region BOrders/);
    await expect(page.getByRole('group', { name: 'Orders' }).locator('..')).toHaveAttribute(
      'data-variant',
      'strip',
    );
  });

  test('loading, empty and error; the focus stays after a retry', async ({ page }) => {
    await openStory(page, 'data-comparison--states');
    const loading = region(page, 'Loading').locator(root);
    await expect(loading).toHaveAttribute('aria-busy', 'true');
    // The two sides are known, so they are shown; the rows are placeholders in the rows' layout.
    await expect(loading.getByRole('columnheader')).toHaveText(['Metric', /Region A/, /Region B/]);
    await expect(part(loading, 'skeleton').locator(':scope > div')).toHaveCount(6);
    await expect(loading.getByRole('row')).toHaveCount(1);
    await page.getByRole('button', { name: 'Finish loading' }).click();
    await expect(loading).not.toHaveAttribute('aria-busy');
    await expect(loading.getByRole('row')).toHaveCount(7);

    await expect(region(page, 'Empty').locator('[data-part="empty"]')).toHaveText('Nothing to compare');
    const failed = region(page, 'Error');
    await expect(failed.getByRole('alert')).toContainText('Something went wrong');
    await failed.getByRole('button', { name: 'Try again' }).focus();
    await pressKeys(page, 'Enter');
    await expect(failed.getByRole('table')).toBeVisible();
    await expect(failed.getByRole('alert')).toHaveCount(0);
    await expectFocusKept(page);
  });

  test('narrower: the bars go, the marks of the sides go, and a long label truncates', async ({ page }) => {
    await openStory(page, 'data-comparison--shrinking');
    const at = (width: number) => boxed(page, `${width}px wide`).locator(root);
    await expect(part(at(320), 'bars').first()).toBeVisible();
    await expect(part(at(320), 'icon').first()).toBeVisible();
    await expect(part(at(230), 'bars').first()).toBeHidden();
    await expect(part(at(230), 'icon').first()).toBeVisible();
    await expect(part(at(170), 'bars').first()).toBeHidden();
    await expect(part(at(170), 'icon').first()).toBeHidden();
    for (const width of [320, 230, 170]) {
      expect(await fits(at(width))).toBe(true);
      // Every value stays whole.
      await expect(
        at(width)
          .getByRole('row', { name: /Delivered/ })
          .getByRole('cell'),
      ).toHaveText(['92%Leading', '88%']);
    }
    const label = at(170).getByRole('rowheader', { name: 'Delivered on time' }).locator('span');
    expect(await label.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
    await label.hover();
    await expect(tooltip(page)).toHaveText('Delivered on time');
  });

  test('shorter: the bars go, then one line is left; growing brings everything back', async ({ page }) => {
    await openStory(page, 'data-comparison--shrinking');
    const holder = boxed(page, '260px high');
    const comparison = holder.locator(root);
    const state = () =>
      comparison.evaluate((el) => [
        el.getAttribute('data-variant'),
        Number(el.getAttribute('data-level') ?? 0),
      ]);
    const tableHeight = async () => (await box(comparison.getByRole('table'))).height;

    await resize(page, holder, { height: 600 });
    expect(await state()).toEqual(['table', 0]);
    const full = await tableHeight();
    // A little less than the rows with their bars: the bars go, the rows stay.
    await resize(page, holder, { height: full - 6 });
    expect(await state()).toEqual(['table', 1]);
    await expect(part(comparison, 'bars').first()).toBeHidden();
    await expect(comparison.getByRole('row')).toHaveCount(8);
    const bare = await tableHeight();
    expect(bare).toBeLessThan(full - 12);
    expect(await fits(comparison)).toBe(true);
    // Less than the rows without bars: the strip.
    await resize(page, holder, { height: bare - 6 });
    expect(await state()).toEqual(['strip', 2]);
    await expect(comparison.getByRole('table')).toHaveCount(0);
    await expect(comparison.getByRole('group', { name: 'In 260' })).toContainText('12–9');
    // Back up: each height gives what it gave on the way down.
    await resize(page, holder, { height: full - 6 });
    expect(await state()).toEqual(['table', 1]);
    await resize(page, holder, { height: full + 6 });
    expect(await state()).toEqual(['table', 0]);
    await expect(part(comparison, 'bars').first()).toBeVisible();

    // As loaded: too short for the rows, so the strip, which fits its box.
    for (const label of ['190px high', '60px high']) {
      const short = boxed(page, label).locator(root);
      await expect(short).toHaveAttribute('data-variant', 'strip');
      expect(await fits(short)).toBe(true);
      // The names give way before the two values do.
      await expect(part(short, 'summary')).toHaveText('12–9');
    }
  });

  test('a value that changes flashes once, with a sign', async ({ page }) => {
    await expectChangeHighlights(page, 'data-comparison--live-updates', false);
  });

  test('parts and blocks', async ({ page }) => {
    await openStory(page, 'data-comparison--parts-and-blocks');
    const pills = page.getByRole('table', { name: 'With pills' });
    await expect(pills.locator('[data-umbra="value-pill"]')).toHaveCount(8);
    await expect(
      pills
        .getByRole('row', { name: /Orders/ })
        .getByRole('cell')
        .first(),
    ).toContainText('128');
    const replaced = page.getByRole('table', { name: 'Replaced parts' });
    await expect(part(replaced, 'bars')).toHaveCount(0);
    await expect(replaced.getByRole('row', { name: /Replaced summary/ }).getByRole('cell')).toHaveText([
      'A',
      'B',
    ]);
    const hand = page.getByRole('table', { name: 'Composed by hand' });
    await expect(hand.getByRole('columnheader')).toHaveText(['Measure', 'Group 1', 'Group 2']);
    await expect(hand.getByRole('row', { name: /Open tasks/ }).getByRole('cell')).toHaveText([
      '5',
      '3Leading',
    ]);
  });
});
