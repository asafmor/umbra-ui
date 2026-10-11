import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectFocusKept } from './helpers';

// PageHeader, ActionBar, VerticalNav and Accordion: keyboard, focus, semantics, motion, and each step of
// "show less as it narrows".
const open = async (page: Page, id: string, width = 1280, height = 720) => {
  await page.setViewportSize({ width, height });
  await page.goto(`/iframe.html?id=${id}&viewMode=story`);
  await page.locator('#storybook-root > *').first().waitFor();
  // No font face is loaded ahead of time: one that first loads when a menu opens must disturb nothing.
  await page.evaluate(async () => {
    await document.fonts.ready;
    // Calls `each` on every frame until no transition is running under `element` (delayed ones included).
    // The first frame holds every transition halfway (90 of 180ms), so a test always sees a state in
    // between, however few frames a busy machine draws.
    window.umbraFrames = async (element, each) => {
      // React renders the click that came just before in a microtask.
      for (let i = 0; i < 3; i++) await Promise.resolve();
      const running = element.getAnimations({ subtree: true });
      for (const animation of running) {
        animation.pause();
        animation.currentTime = 90;
      }
      await new Promise(requestAnimationFrame);
      each();
      for (const animation of running) animation.play();
      const start = performance.now();
      for (let idle = 0; idle < 2 && performance.now() - start < 5000;) {
        await new Promise(requestAnimationFrame);
        each();
        idle = element.getAnimations({ subtree: true }).length ? 0 : idle + 1;
      }
    };
  });
};
declare global {
  interface Window {
    umbraFrames: (element: Element, each: () => void) => Promise<void>;
  }
}
const box = async (locator: Locator) => (await locator.boundingBox())!;
const truncated = (locator: Locator) => locator.evaluate((el) => el.scrollWidth > el.clientWidth);
/** True when nothing inside the element reaches past its right edge. */
const contains = async (outer: Locator, inner: Locator) => {
  const [o, i] = [await box(outer), await box(inner)];
  return i.x >= o.x - 0.5 && i.x + i.width <= o.x + o.width + 0.5;
};

test.describe('Accordion', () => {
  const accordion = (page: Page, name: string) =>
    page.locator(`[data-umbra="accordion"][aria-label="${name}"]`);
  const header = (root: Locator, name: string | RegExp) => root.getByRole('button', { name, exact: true });
  const section = (root: Locator, name: string | RegExp) =>
    root.locator('[data-part="item"]', { has: root.page().getByRole('button', { name, exact: true }) });

  /** Presses a header, then records the section's panel on every frame for a while. */
  const record = (trigger: Locator) =>
    trigger.evaluate(async (button) => {
      const item = button.closest('[data-part="item"]')!;
      const panel = item.querySelector<HTMLElement>('[data-part="panel"]')!;
      const viewport = panel.querySelector<HTMLElement>('[data-part="viewport"]')!;
      const region = panel.querySelector<HTMLElement>('[role="region"]')!;
      (button as HTMLElement).click();
      const frames: { height: number; overflow: string; mounted: boolean; visibility: string }[] = [];
      await window.umbraFrames(item, () =>
        frames.push({
          height: panel.getBoundingClientRect().height,
          overflow: getComputedStyle(viewport).overflowY,
          mounted: region.childNodes.length > 0,
          visibility: getComputedStyle(panel).visibility,
        }),
      );
      return frames;
    });

  test('a header is a button in a heading that controls a labelled region', async ({ page }) => {
    await open(page, 'layout-accordion--variants');
    const root = accordion(page, 'Plain');
    await expect(root).toHaveRole('group');
    const general = header(root, 'General');
    await expect(general).toHaveAttribute('aria-expanded', 'true');
    expect(await general.evaluate((el) => el.parentElement!.tagName)).toBe('H3');
    const region = root.getByRole('region', { name: 'General' });
    await expect(region).toBeVisible();
    expect(await general.getAttribute('aria-controls')).toBe(await region.getAttribute('id'));

    // A closed section: its region is in the page for `aria-controls`, hidden, and its content is not.
    const alerts = header(root, 'Alerts');
    await expect(alerts).toHaveAttribute('aria-expanded', 'false');
    const closed = page.locator(`[id="${await alerts.getAttribute('aria-controls')}"]`);
    await expect(closed).toBeHidden();
    await expect(closed).toBeEmpty();
    await expect(root.getByRole('region')).toHaveCount(1);
  });

  test('arrow keys, Home and End move between headers; Enter and Space toggle', async ({ page }) => {
    await open(page, 'layout-accordion--content');
    const root = accordion(page, 'Content, plain');
    await page.keyboard.press('Tab');
    await expect(header(root, /^General/)).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(header(root, 'Alerts')).toBeFocused();
    // The disabled section is skipped, and the last arrow press stays on the last header.
    await page.keyboard.press('ArrowDown');
    await expect(header(root, 'Alerts')).toBeFocused();
    await expect(header(root, /^Access/)).toBeDisabled();
    await page.keyboard.press('Home');
    await expect(header(root, /^General/)).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(header(root, /^General/)).toBeFocused();
    await page.keyboard.press('End');
    await expect(header(root, 'Alerts')).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(header(root, 'Alerts')).toHaveAttribute('aria-expanded', 'false');
    await page.keyboard.press('Space');
    await expect(header(root, 'Alerts')).toHaveAttribute('aria-expanded', 'true');
    // Multiple: opening one section leaves the other as it was.
    await header(root, /^General/).press('Enter');
    await expect(header(root, /^General/)).toHaveAttribute('aria-expanded', 'true');
    await expect(header(root, 'Alerts')).toHaveAttribute('aria-expanded', 'true');

    // Each header is a tab stop, and the action between them takes its own press without toggling.
    await header(root, 'Alerts').focus();
    await page.keyboard.press('Tab');
    const action = page.getByRole('button', { name: 'Export alerts (plain)' });
    await expect(action).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByText('Exports: 1.')).toBeVisible();
    await action.click();
    await expect(page.getByText('Exports: 2.')).toBeVisible();
    await expect(header(root, 'Alerts')).toHaveAttribute('aria-expanded', 'true');
    // A press anywhere else on the header toggles the section: here on the meta text, which the button covers.
    await section(root, 'Alerts').locator('[data-part="meta"]').click({ force: true });
    await expect(header(root, 'Alerts')).toHaveAttribute('aria-expanded', 'false');
  });

  test('single: one section at a time, controlled, and one that may not close all', async ({ page }) => {
    await open(page, 'layout-accordion--single');
    const controlled = accordion(page, 'Controlled');
    await header(controlled, 'Alerts').click();
    await expect(header(controlled, 'General')).toHaveAttribute('aria-expanded', 'false');
    await expect(header(controlled, 'Alerts')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText('Open: alerts.')).toBeVisible();
    await header(controlled, 'Alerts').click();
    await expect(page.getByText('Open: none.')).toBeVisible();
    await expect(controlled.locator('[aria-expanded="true"]')).toHaveCount(0);

    const fixed = accordion(page, 'Always one open');
    await expect(header(fixed, 'Alerts')).toHaveAttribute('aria-disabled', 'true');
    await header(fixed, 'Alerts').click({ force: true });
    await expect(header(fixed, 'Alerts')).toHaveAttribute('aria-expanded', 'true');
    await header(fixed, 'Access').click();
    await expect(header(fixed, 'Alerts')).toHaveAttribute('aria-expanded', 'false');
    await expect(header(fixed, 'Alerts')).not.toHaveAttribute('aria-disabled');
    await expect(header(fixed, 'Access')).toHaveAttribute('aria-disabled', 'true');
  });

  test('opening and closing animate the height, with no scrollbar on the way', async ({ page }) => {
    await open(page, 'layout-accordion--variants');
    const root = accordion(page, 'Card');
    const opening = await record(header(root, 'Alerts'));
    const full = opening.at(-1)!.height;
    expect(full).toBeGreaterThan(60);
    // It grows frame by frame, and never shrinks back.
    expect(opening[0]!.height).toBeGreaterThan(2);
    expect(opening[0]!.height).toBeLessThan(full - 2);
    expect(opening.every((f, i) => i === 0 || f.height >= opening[i - 1]!.height - 0.5)).toBe(true);
    // While it moves the viewport cannot scroll; at rest it can.
    expect(opening.filter((f) => f.height < full - 1).every((f) => f.overflow === 'hidden')).toBe(true);
    expect(opening.at(-1)!.overflow).toBe('auto');
    expect(opening.every((f) => f.mounted && f.visibility === 'visible')).toBe(true);

    const closing = await record(header(root, 'Alerts'));
    expect(closing[0]!.height).toBeGreaterThan(2);
    expect(closing[0]!.height).toBeLessThan(full - 2);
    expect(closing.every((f, i) => i === 0 || f.height <= closing[i - 1]!.height + 0.5)).toBe(true);
    expect(closing.every((f) => f.overflow === 'hidden')).toBe(true);
    // The content stays while the panel moves, and leaves the page when it has closed.
    expect(closing.filter((f) => f.height > 2).every((f) => f.mounted && f.visibility === 'visible')).toBe(
      true,
    );
    expect(closing.at(-1)).toEqual({ height: 0, overflow: 'hidden', mounted: false, visibility: 'hidden' });
  });

  test('with reduced motion the section opens and closes at once', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, 'layout-accordion--variants');
    const root = accordion(page, 'Card');
    const opening = await record(header(root, 'Alerts'));
    expect(new Set(opening.map((f) => f.height)).size).toBe(1);
    expect(opening[0]!.height).toBeGreaterThan(60);
    expect(opening[0]!.overflow).toBe('auto');
    const closing = await record(header(root, 'Alerts'));
    expect(closing.every((f) => f.height === 0)).toBe(true);
    expect(closing.at(-1)!.mounted).toBe(false);
  });

  test('in a slot with limited height the open panels scroll inside and nothing is pushed out', async ({
    page,
  }) => {
    await open(page, 'layout-accordion--limited-height');
    const root = accordion(page, 'In a stack');
    const below = page.locator('[data-umbra="card"]', { hasText: 'A card below' });
    const fits = () => root.evaluate((el) => el.scrollHeight <= el.clientHeight + 1);
    const scrolls = (name: string) =>
      section(root, name)
        .locator('[data-part="viewport"]')
        .evaluate((el) => el.scrollHeight > el.clientHeight + 1 && getComputedStyle(el).overflowY === 'auto');
    const before = await box(below);
    expect(await fits()).toBe(true);
    expect(await scrolls('Long section')).toBe(true);
    // The headers of the closed sections are whole.
    for (const name of ['Second section', 'Third section']) {
      expect((await box(section(root, name))).height).toBeGreaterThan(36);
    }

    // A second long section opens: the accordion is never taller than its slot, also on the way.
    const overflowed = await header(root, 'Second section').evaluate(async (button) => {
      const accordion = button.closest<HTMLElement>('[data-umbra="accordion"]')!;
      (button as HTMLElement).click();
      let worst = 0;
      await window.umbraFrames(accordion, () => {
        worst = Math.max(worst, accordion.scrollHeight - accordion.clientHeight);
      });
      return worst;
    });
    expect(overflowed).toBeLessThanOrEqual(1);
    expect(await scrolls('Long section')).toBe(true);
    expect(await scrolls('Second section')).toBe(true);
    expect((await box(section(root, 'Third section'))).height).toBeGreaterThan(36);
    expect(await box(below)).toEqual(before);

    // Closing one in this state does not jump to its full height first.
    const tallest = await header(root, 'Long section').evaluate(async (button) => {
      const item = button.closest<HTMLElement>('[data-part="item"]')!;
      const first = item.getBoundingClientRect().height;
      (button as HTMLElement).click();
      let worst = 0;
      await window.umbraFrames(item, () => {
        worst = Math.max(worst, item.getBoundingClientRect().height - first);
      });
      return worst;
    });
    expect(tallest).toBeLessThanOrEqual(1);
    expect(await box(below)).toEqual(before);

    // The same inside a card.
    const inCard = accordion(page, 'In a card');
    expect(await inCard.evaluate((el) => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
    await expect(header(inCard, 'Second section')).toBeInViewport();
  });

  test('`keepMounted` keeps the content of a closed section, and its state', async ({ page }) => {
    await open(page, 'layout-accordion--keep-mounted');
    for (const [name, title, kept] of [
      ['Kept', 'Kept while closed', true],
      ['Removed', 'Removed while closed', false],
    ] as const) {
      const root = accordion(page, name);
      const field = root.getByRole('textbox');
      await field.fill('typed');
      await header(root, title).click();
      await expect(field).toBeHidden();
      await expect(root.locator('input')).toHaveCount(kept ? 1 : 0);
      // Closed content cannot be reached with Tab.
      await header(root, title).focus();
      await page.keyboard.press('Tab');
      await expect(header(root, 'Another section')).toBeFocused();
      await header(root, title).click();
      await expect(field).toHaveValue(kept ? 'typed' : '');
    }
  });

  test('a narrow section drops the meta text and truncates the title', async ({ page }) => {
    await open(page, 'layout-accordion--shrink');
    const at = (width: number) => page.locator(`[data-width="${width}"]`);
    await expect(at(420).locator('[data-part="meta"]')).toBeVisible();
    expect(await truncated(at(420).locator('[data-part="title"]'))).toBe(false);
    await expect(at(260).locator('[data-part="meta"]')).toBeHidden();
    expect(await truncated(at(260).locator('[data-part="title"]'))).toBe(true);
    for (const width of [420, 260, 160]) {
      const item = at(width).locator('[data-part="item"]');
      for (const part of ['actions', 'chevron']) {
        await expect(item.locator(`[data-part="${part}"]`)).toBeVisible();
        expect(await contains(item, item.locator(`[data-part="${part}"]`))).toBe(true);
      }
      expect(await item.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    }
  });

  test('parts and blocks', async ({ page }) => {
    await open(page, 'layout-accordion--parts');
    const root = accordion(page, 'Item parts');
    await expect(section(root, 'A node replaces the chevron').locator('[data-part="chevron"]')).toHaveText(
      '±',
    );
    const hidden = section(root, 'null hides the meta text');
    await expect(hidden.locator('[data-part="meta"], [data-part="chevron"]')).toHaveCount(0);
    await header(root, 'A function wraps the default (wrapped)').click();
    await expect(
      section(root, 'A function wraps the default (wrapped)').locator('[data-part="content"]'),
    ).toHaveAttribute('data-padding', 'none');
    await expect(accordion(page, 'Every item').locator('[data-part="meta"]')).toHaveText([
      '#general',
      '#alerts',
      '#access',
    ]);

    await open(page, 'layout-accordion--blocks');
    const composed = accordion(page, 'Composed');
    await header(composed, 'Custom button content').click();
    await expect(composed.getByRole('region', { name: 'Custom button content' })).toBeVisible();
    await expect(header(composed, 'Composed from blocks Header and panel placed by hand')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});

// The size animation of a card collapsed with its caret (plan/specs/Card.md). It lives here because it
// shares the frame recorder with the accordion.
test.describe('Card collapse animation', () => {
  const card = (page: Page) => page.locator('[data-umbra="card"]', { hasText: 'Collapsible' }).first();
  /** Presses the caret, then records the card and its stack on every frame until nothing moves. */
  const record = (root: Locator) =>
    root.evaluate(async (el) => {
      const stack = el.parentElement!;
      const sibling = [...stack.children].find((child) => child !== el)!;
      el.querySelector<HTMLElement>('[data-part="header"] button[aria-expanded]')!.click();
      const frames: { height: number; sibling: number; inside: boolean; body: boolean; moving: boolean }[] =
        [];
      await window.umbraFrames(el, () => {
        const outer = stack.getBoundingClientRect();
        const last = stack.lastElementChild!.getBoundingClientRect();
        frames.push({
          height: el.getBoundingClientRect().height,
          sibling: sibling.getBoundingClientRect().height,
          // Nothing leaves the stack: the last card ends inside it.
          inside: last.bottom <= outer.bottom + 0.5,
          body: !!el.querySelector(':scope > [data-part="body"]'),
          moving: el.hasAttribute('data-resizing'),
        });
      });
      return frames;
    });

  test('the caret animates the height both ways; the body stays while it closes', async ({ page }) => {
    await open(page, 'layout-card--states');
    const root = card(page);
    const full = (await box(root)).height;
    const header = (await box(root.locator('[data-part="header"]'))).height;
    expect(full).toBeGreaterThan(header + 60);

    const closing = await record(root);
    const closed = closing.at(-1)!.height;
    expect(closed).toBeLessThan(header + 24);
    // A real state in between, then only smaller, down to the header.
    expect(closing[0]!.height).toBeGreaterThan(closed + 2);
    expect(closing[0]!.height).toBeLessThan(full - 2);
    expect(closing[0]!.moving).toBe(true);
    expect(closing.every((f, i) => i === 0 || f.height <= closing[i - 1]!.height + 0.5)).toBe(true);
    // The other card of the stack takes the room as it comes, and nothing leaves the stack.
    expect(closing.every((f, i) => i === 0 || f.sibling >= closing[i - 1]!.sibling - 0.5)).toBe(true);
    expect(closing.every((f) => f.inside)).toBe(true);
    // The body is there while the card moves, and gone when it has closed.
    expect(closing.filter((f) => f.moving).every((f) => f.body)).toBe(true);
    expect(closing.at(-1)).toMatchObject({ body: false, moving: false });
    await expect(root).toHaveAttribute('data-collapsed', 'user');

    const opening = await record(root);
    expect(opening[0]!.height).toBeGreaterThan(closed + 2);
    expect(opening[0]!.height).toBeLessThan(full - 2);
    expect(opening.every((f, i) => i === 0 || f.height >= opening[i - 1]!.height - 0.5)).toBe(true);
    expect(opening.every((f) => f.inside && f.body)).toBe(true);
    // It ends exactly where its share of the stack puts it: no jump when the animation lets go.
    expect(Math.abs(opening.at(-1)!.height - full)).toBeLessThan(1);
    expect(Math.abs(opening.at(-2)!.height - full)).toBeLessThan(1);
    expect(opening.at(-1)!.moving).toBe(false);
    await expect(root).not.toHaveAttribute('data-collapsed');
  });

  test('with reduced motion the card collapses and expands at once', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, 'layout-card--states');
    const root = card(page);
    const full = (await box(root)).height;
    const closing = await record(root);
    expect(new Set(closing.map((f) => Math.round(f.height))).size).toBe(1);
    expect(closing[0]!.height).toBeLessThan(full - 60);
    expect(closing.every((f) => !f.body && !f.moving && f.inside)).toBe(true);
    const opening = await record(root);
    expect(opening.every((f) => Math.abs(f.height - full) < 1 && !f.moving)).toBe(true);
  });

  test('a collapse by the layout, or by the app without the caret, does not animate', async ({ page }) => {
    await open(page, 'layout-page-layouts--three-columns', 1280, 900);
    const moving = () =>
      page.evaluate(
        () =>
          document.querySelectorAll('[data-resizing]').length +
          [...document.querySelectorAll('[data-umbra="card"]')].flatMap((el) => el.getAnimations()).length,
      );
    await page.setViewportSize({ width: 1280, height: 560 });
    expect(await moving()).toBe(0);
    await expect(page.locator('[data-umbra="card"][data-collapsed="layout"]')).not.toHaveCount(0);
    expect(await moving()).toBe(0);

    await open(page, 'layout-card--controlled-collapse');
    const controlled = page.getByRole('region', { name: 'Controlled' });
    await page.getByRole('button', { name: 'Toggle from outside' }).click();
    expect(await moving()).toBe(0);
    await expect(controlled).toHaveAttribute('data-collapsed', 'user');
    await expect(controlled.locator('[data-part="body"]')).toHaveCount(0);
  });
});

test.describe('PageHeader', () => {
  const headerOf = (page: Page, title: string) =>
    page.locator('[data-umbra="page-header"]', { hasText: title });

  test('the title is a heading, the breadcrumbs a landmark, the back button a button', async ({ page }) => {
    await open(page, 'shell-pageheader--content');
    await expect(page.getByRole('heading', { level: 1, name: 'Project 4' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Title only' })).toBeVisible();
    const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(crumbs.getByRole('link')).toHaveText(['Workspace', 'Projects']);
    await expect(crumbs.locator('[aria-current="page"]')).toHaveText('Project 4');
    await expect(crumbs.getByRole('listitem')).toHaveCount(3);

    // Tab order: breadcrumb links, back button, actions, then the tabs on the bottom edge.
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(crumbs.getByRole('link', { name: 'Projects' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Back to projects' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByText('Back pressed: 1.')).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Share' })).toBeFocused();

    // The tabs sit on the bottom edge of the header.
    const root = headerOf(page, 'Project 4');
    const [outer, tabs] = [await box(root), await box(root.locator('[data-part="tabs"]'))];
    expect(Math.abs(outer.y + outer.height - (tabs.y + tabs.height))).toBeLessThanOrEqual(1.5);
    // Labelled facts are a description list.
    await expect(root.locator('dl dt')).toHaveText(['Based in', 'Owner', 'Status']);
  });

  test('as it narrows: meta hides, actions move into a menu, subtitle hides, media shrinks, title truncates', async ({
    page,
  }) => {
    await open(page, 'shell-pageheader--shrink');
    const at = (width: number) => {
      const root = page.locator(`[data-width="${width}"] [data-umbra="page-header"]`);
      const part = (name: string) => root.locator(`[data-part="${name}"]`);
      return { root, part };
    };
    const levels = await page
      .locator('[data-umbra="page-header"]')
      .evaluateAll((all) => all.map((el) => el.getAttribute('data-shrink')));
    expect(levels).toEqual(['0', '1', '2', '3', '4', '4']);
    const beside = async (width: number) => {
      const [titles, actions] = [await box(at(width).part('titles')), await box(at(width).part('actions'))];
      return actions.y < titles.y + titles.height;
    };
    const more = (width: number) => at(width).root.getByRole('button', { name: 'More actions' });

    await expect(at(860).part('meta')).toBeVisible();
    expect(await beside(860)).toBe(true);
    // Step 1: the meta row is gone, and the actions are still buttons.
    await expect(at(680).part('meta')).toHaveCount(0);
    await expect(at(680).root.getByRole('button', { name: 'Edit' })).toBeVisible();
    await expect(more(680)).toHaveCount(0);
    // Step 2: the actions are in an overflow menu, still beside the titles.
    await expect(more(480)).toBeVisible();
    await expect(at(480).root.getByRole('button', { name: 'Edit' })).toHaveCount(0);
    expect(await beside(480)).toBe(true);
    await expect(at(480).part('subtitle')).toBeVisible();
    await more(480).click();
    const menu = page.getByRole('menu', { name: 'More actions' });
    await expect(menu.getByRole('menuitem')).toHaveText(['Export', 'Edit']);
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    // Step 3: the subtitle is gone.
    await expect(at(420).part('subtitle')).toHaveCount(0);
    expect((await box(at(420).part('media').locator('> *'))).width).toBe(56);
    // Step 4: the media is smaller, and the title is still whole.
    expect((await box(at(380).part('media').locator('> *'))).width).toBe(32);
    expect(await truncated(at(380).part('title'))).toBe(false);
    // Last: the title truncates.
    expect(await truncated(at(240).part('title'))).toBe(true);
    await expect(at(240).part('title')).toHaveCSS('text-overflow', 'ellipsis');

    // Nothing leaves the header at any width, and the actions are always one press away, on one line.
    for (const width of [860, 680, 480, 420, 380, 240]) {
      await expect(
        at(width).root.getByRole('button', { name: width > 480 ? 'Edit' : 'More actions' }),
      ).toBeVisible();
      expect(await beside(width)).toBe(true);
      for (const name of ['titles', 'actions']) {
        expect(await contains(at(width).root, at(width).part(name)), `${name} at ${width}`).toBe(true);
      }
    }
  });

  test('the steps are taken back when the header gets wider', async ({ page }) => {
    await open(page, 'shell-pageheader--in-page', 1280, 720);
    const root = page.locator('[data-umbra="page-header"]');
    await expect(root).toHaveAttribute('data-shrink', '0');
    await page.setViewportSize({ width: 560, height: 720 });
    await expect.poll(() => root.getAttribute('data-shrink')).not.toBe('0');
    await expect(root.locator('[data-part="meta"]')).toHaveCount(0);
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(root).toHaveAttribute('data-shrink', '0');
    await expect(root.locator('[data-part="meta"]')).toBeVisible();
    // Fixed above the content by the page: the card starts under it.
    const card = page.locator('[data-umbra="card"]').first();
    expect((await box(card)).y).toBeGreaterThan((await box(root)).y + (await box(root)).height);
  });

  test('text on a band is light or dark, whichever suits the band colour', async ({ page }) => {
    await open(page, 'shell-pageheader--tones');
    const colour = (title: string) =>
      headerOf(page, title)
        .getByRole('heading')
        .evaluate((el) => getComputedStyle(el).color);
    expect(await colour('Tone: band #f2c53a')).toBe('rgb(11, 6, 18)');
    expect(await colour('Tone: band #12365c')).toBe('rgb(255, 255, 255)');
    // The focus ring on a band takes the text colour.
    const back = headerOf(page, 'Tone: band #f2c53a').getByRole('button', { name: 'Back' });
    await back.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(back).toBeFocused();
    await expect(back).toHaveCSS('outline-color', 'rgb(11, 6, 18)');
  });

  test('parts and blocks', async ({ page }) => {
    await open(page, 'shell-pageheader--parts');
    await expect(headerOf(page, 'A node replaces the media').locator('[data-part="media"]')).toHaveText(
      'NEW',
    );
    const hidden = headerOf(page, 'null hides');
    await expect(hidden.locator('[data-part="subtitle"]')).toHaveCount(0);
    await expect(hidden.getByRole('button')).toHaveCount(0);
    const wrapped = headerOf(page, 'A function wraps the default');
    await expect(wrapped.locator('[data-part="tags"]')).toHaveText('wrapped');
    await expect(wrapped.locator('dt')).toHaveText(['Based in']);
    await expect(wrapped.locator('[data-part="actions"]')).toContainText('3 drafts');

    await open(page, 'shell-pageheader--blocks');
    await expect(page.getByRole('heading', { level: 2, name: 'Composed from blocks' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link')).toHaveText([
      'Reports',
    ]);
    await expect(page.getByRole('button', { name: 'Back to reports' })).toBeVisible();
  });
});

test.describe('ActionBar', () => {
  const bar = (page: Page, name: string) => page.getByRole('group', { name, exact: true });

  test('a named group with a status that is announced; each tone has its own icon', async ({ page }) => {
    await open(page, 'overlays-actionbar--status');
    const danger = bar(page, 'Tone danger');
    await expect(danger).toHaveAttribute('data-umbra', 'action-bar');
    await expect(danger.getByRole('status')).toHaveText('Status with the danger tone');
    const icons = await page
      .locator('[data-umbra="action-bar"][data-emphasis="default"] [data-part="status-icon"] svg')
      .evaluateAll((all) => all.map((svg) => svg.innerHTML));
    expect(icons).toHaveLength(5);
    expect(new Set(icons).size).toBe(5);
    await expect(bar(page, 'Response')).toHaveAttribute('data-emphasis', 'strong');
  });

  test('the groups are in tab order: tertiary, secondary, primary; a disabled action is skipped', async ({
    page,
  }) => {
    await open(page, 'overlays-actionbar--groups');
    const structured = bar(page, 'Structured');
    for (const name of ['Help', 'Support', 'Undo', 'Reset', 'Confirm']) {
      await page.keyboard.press('Tab');
      await expect(structured.getByRole('button', { name })).toBeFocused();
    }
    await page.keyboard.press('Enter');
    await expect(page.getByText('Last action: Confirm.')).toBeVisible();
    await structured.getByRole('button', { name: 'Undo' }).click();
    await expect(page.getByText('Last action: Undo.')).toBeVisible();
    await expect(structured.getByRole('button', { name: 'Redo' })).toBeDisabled();

    // Tertiary actions sit at the start, the others at the end; `align` moves the end group.
    const x = async (root: Locator, name: string) => (await box(root.getByRole('button', { name }))).x;
    const outer = await box(structured);
    expect(await x(structured, 'Help')).toBeLessThan(outer.x + 20);
    expect(await x(structured, 'Confirm')).toBeGreaterThan(outer.x + outer.width - 160);
    const start = await x(bar(page, 'Aligned start'), 'Save');
    const center = await x(bar(page, 'Aligned center'), 'Save');
    const end = await x(bar(page, 'Aligned end'), 'Save');
    expect(start).toBeLessThan(center - 100);
    expect(center).toBeLessThan(end - 100);
  });

  test('as it narrows: the status truncates, then icons only, then the actions take a second line', async ({
    page,
  }) => {
    await open(page, 'overlays-actionbar--shrink');
    const at = (width: number) => bar(page, `${width}px`);
    const text = (width: number) => at(width).locator('[data-part="status-text"]');
    const labelled = (width: number, name: string) =>
      at(width).getByRole('button', { name }).locator('[data-part="label"]');

    // Wide: everything is whole.
    expect(await truncated(text(760))).toBe(false);
    await expect(labelled(760, 'Undo')).toBeVisible();
    // Step 0: the status text truncates first; every label is still there.
    expect(await truncated(text(520))).toBe(true);
    await expect(text(520)).toHaveCSS('text-overflow', 'ellipsis');
    await expect(at(520)).not.toHaveAttribute('data-compact');
    await expect(labelled(520, 'Undo')).toBeVisible();
    // Step 1: secondary actions with an icon keep only the icon, and their name.
    await expect(at(400)).toHaveAttribute('data-compact');
    await expect(at(400)).not.toHaveAttribute('data-wrap');
    for (const name of ['Undo', 'Redo']) {
      await expect(at(400).getByRole('button', { name })).toHaveAttribute('data-icon-only');
      await expect(labelled(400, name)).toHaveCount(0);
    }
    // The label of an icon-only action is its tooltip; an action that kept its label has none.
    await at(400).getByRole('button', { name: 'Undo' }).focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('tooltip')).toHaveText('Undo');
    await page.evaluate(() => (document.activeElement as HTMLElement).blur());
    await at(760).getByRole('button', { name: 'Undo' }).hover();
    await page.waitForTimeout(700);
    await expect(page.getByRole('tooltip')).toHaveCount(0);
    // One without an icon keeps its label, and so does the primary action, at every width.
    await expect(labelled(400, 'Discard')).toBeVisible();
    // Step 2: the actions are on a line under the status.
    for (const width of [300, 200]) {
      await expect(at(width)).toHaveAttribute('data-wrap');
      const status = await box(at(width).getByRole('status'));
      expect((await box(at(width).getByRole('button', { name: 'Undo' }))).y).toBeGreaterThan(status.y + 10);
    }
    for (const width of [760, 520, 400, 300, 200]) {
      await expect(labelled(width, 'Confirm')).toBeVisible();
      expect(await truncated(labelled(width, 'Confirm')), `Confirm at ${width}`).toBe(false);
      for (const name of ['Undo', 'Redo', 'Discard', 'Confirm']) {
        const button = at(width).getByRole('button', { name });
        expect(await contains(at(width), button), `${name} at ${width}`).toBe(true);
        expect((await box(button)).width, `${name} at ${width}`).toBeGreaterThan(24);
      }
      await expect(at(width).locator('[data-part="status-icon"]')).toBeVisible();
    }
  });

  test('a floating bar enters when something is selected and leaves when nothing is', async ({ page }) => {
    await open(page, 'overlays-actionbar--floating');
    const root = page.locator('[data-umbra="action-bar"]');
    await expect(root).toBeHidden();
    await expect(root).toHaveAttribute('inert');
    // Closed, nothing in it can be reached: Tab goes from one checkbox to the next.
    await page.getByRole('checkbox', { name: 'Item 5' }).focus();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button')).toHaveCount(0);

    /** Changes the selection, then records the bar's opacity and offset on every frame. */
    const record = (trigger: Locator) =>
      trigger.evaluate(async (el) => {
        const bar = document.querySelector<HTMLElement>('[data-umbra="action-bar"]')!;
        (el as HTMLElement).click();
        const frames: { opacity: number; y: number; visible: boolean; text: string }[] = [];
        await window.umbraFrames(bar, () => {
          const style = getComputedStyle(bar);
          frames.push({
            opacity: Number(style.opacity),
            y: parseFloat(style.translate.split(' ')[1] ?? '0'),
            visible: style.visibility === 'visible',
            text: bar.querySelector('[role="status"]')!.textContent!,
          });
        });
        return frames;
      });

    const entering = await record(page.getByRole('checkbox', { name: 'Item 2' }));
    expect(entering[0]!.opacity).toBeGreaterThan(0.05);
    expect(entering[0]!.opacity).toBeLessThan(0.95);
    expect(entering[0]!.y).toBeGreaterThan(0.5);
    expect(entering.at(-1)).toEqual({ opacity: 1, y: 0, visible: true, text: '1 selected' });
    await expect(bar(page, 'Selected items')).toBeVisible();
    await expect(root).not.toHaveAttribute('inert');

    // It sits over the bottom of its container, inside it.
    const card = page.locator('[data-umbra="card"]');
    const [outer, inner] = [await box(card), await box(root)];
    expect(inner.y + inner.height).toBeLessThan(outer.y + outer.height);
    expect(inner.y + inner.height).toBeGreaterThan(outer.y + outer.height - 40);
    expect(await contains(card, root)).toBe(true);

    await page.getByRole('checkbox', { name: 'Item 4' }).check();
    await expect(root.getByRole('status')).toHaveText('2 selected');
    await root.getByRole('button', { name: 'Archive' }).click();
    await expect(page.getByText('Selected: 2. Archived: 1.')).toBeVisible();

    // Clearing the selection: the bar fades out with the count it had, then is hidden.
    const leaving = await record(root.getByRole('button', { name: 'Clear selection' }));
    expect(leaving[0]!.visible).toBe(true);
    expect(leaving[0]!.opacity).toBeGreaterThan(0.05);
    expect(leaving[0]!.opacity).toBeLessThan(0.95);
    expect(leaving.every((f) => f.text === '2 selected')).toBe(true);
    expect(leaving.at(-1)).toMatchObject({ opacity: 0, visible: false });
    await expect(page.getByText('Selected: 0. Archived: 1.')).toBeVisible();
    await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(0);
  });

  test('"Clear selection" closes a floating bar and hands the focus back', async ({ page }) => {
    // The bar becomes inert as it closes; the focus used to fall to <body>.
    await open(page, 'overlays-actionbar--floating');
    const box = page.getByRole('checkbox', { name: 'Item 2' });
    await box.focus();
    await page.keyboard.press('Space');
    const bar = page.locator('[data-umbra="action-bar"]');
    await expect(bar).toBeVisible();
    // From the checkbox into the bar, to its clear button.
    const clear = bar.getByRole('button', { name: /clear/i });
    for (let i = 0; i < 12 && !(await clear.evaluate((el) => el === document.activeElement)); i++) {
      await page.keyboard.press('Tab');
    }
    await expect(clear).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(bar).toHaveAttribute('inert');
    await expectFocusKept(page);
    expect(await page.evaluate(() => !document.activeElement!.closest('[data-umbra="action-bar"]'))).toBe(
      true,
    );
    // Reached by a pointer press on the bar, with nothing remembered, it goes to a control beside it.
    await page.getByRole('checkbox', { name: 'Item 3' }).click();
    await expect(bar).toBeVisible();
    await clear.focus();
    await page.keyboard.press('Enter');
    await expectFocusKept(page);
  });

  test('with reduced motion a floating bar fades without moving', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, 'overlays-actionbar--floating');
    const root = page.locator('[data-umbra="action-bar"]');
    expect(await root.evaluate((el) => getComputedStyle(el).translate)).toMatch(/^(none|0px( 0px)?)$/);
    await page.getByRole('checkbox', { name: 'Item 1' }).check();
    await expect(root).toBeVisible();
  });

  test('parts and blocks', async ({ page }) => {
    await open(page, 'overlays-actionbar--parts');
    await expect(bar(page, 'Node').locator('[data-part="status"]')).toHaveText('A node replaces the status');
    await expect(bar(page, 'Null').getByRole('status')).toHaveText('2 selected');
    await expect(bar(page, 'Null').getByRole('button', { name: 'Clear selection' })).toHaveCount(0);
    await expect(bar(page, 'Function').getByRole('status')).toHaveText('Saved (wrapped)');
    await expect(bar(page, 'Function').locator('[data-part="actions"]')).toContainText('3 drafts');

    await open(page, 'overlays-actionbar--blocks');
    const composed = bar(page, 'Composed');
    await expect(composed).toHaveAttribute('data-tone', 'warning');
    await expect(composed.getByRole('button')).toHaveText(['Help', 'Undo', 'Confirm']);
  });
});

test.describe('VerticalNav', () => {
  const nav = (page: Page, name = 'Section navigation') =>
    page.getByRole('navigation', { name, exact: true });

  test('a landmark with the current page marked, and one tab stop', async ({ page }) => {
    await open(page, 'shell-verticalnav--default');
    const root = nav(page);
    const current = root.locator('[aria-current="page"]');
    await expect(current).toHaveText('Display');
    // A second cue beside the colour: an edge stripe and weight.
    await expect(current).toHaveCSS('font-weight', '700');
    expect(await current.evaluate((el) => getComputedStyle(el).boxShadow)).toContain('inset');
    await expect(root.locator('[data-part="section-label"]')).toHaveText('Advanced');

    await page.keyboard.press('Tab');
    await expect(current).toBeFocused();
    expect(await root.locator('[data-part="list"] [tabindex="0"]').count()).toBe(1);
    // Tab leaves the list for the toggle button; Shift+Tab comes back to the same item.
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Tab');
    await expect(root.getByRole('button', { name: 'Collapse navigation' })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(root.getByRole('button', { name: 'Sound 2 new' })).toBeFocused();
  });

  test('arrow keys move, Home and End jump, Right and Left open and close a group', async ({ page }) => {
    await open(page, 'shell-verticalnav--default');
    const root = nav(page);
    const item = (name: string) => root.getByRole('button', { name, exact: true });
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowUp');
    await expect(item('General')).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(item('General')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByText('Current: general.')).toBeVisible();
    await expect(item('General')).toHaveAttribute('aria-current', 'page');

    await page.keyboard.press('End');
    await expect(item('All preferences')).toBeFocused();
    // A disabled item keeps its place in the order, and does nothing.
    await page.keyboard.press('ArrowUp');
    await expect(item('Plug-ins')).toBeFocused();
    await expect(item('Plug-ins')).toHaveAttribute('aria-disabled', 'true');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Current: general.')).toBeVisible();
    await page.keyboard.press('Home');
    await expect(item('General')).toBeFocused();

    // The group: Right opens it, Right again goes in, Left goes back to it, Left closes it.
    for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowDown');
    const people = item('People');
    await expect(people).toBeFocused();
    await expect(people).toHaveAttribute('aria-expanded', 'false');
    await expect(item('Teams')).toHaveCount(0);
    await page.keyboard.press('ArrowRight');
    await expect(people).toHaveAttribute('aria-expanded', 'true');
    await expect(people).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(item('Teams')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(item('Roles')).toBeFocused();
    await page.keyboard.press('Space');
    await expect(page.getByText('Current: roles.')).toBeVisible();
    await page.keyboard.press('ArrowLeft');
    await expect(people).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(people).toHaveAttribute('aria-expanded', 'false');
    // Closed over the current item, the group carries the stripe.
    await expect(people).toHaveAttribute('data-holds-current');
    await page.keyboard.press('Enter');
    await expect(people).toHaveAttribute('aria-expanded', 'true');
    expect(await root.locator('[data-part="list"] [tabindex="0"]').count()).toBe(1);
  });

  test('the rail shows icons only and keeps every name; the toggle switches', async ({ page }) => {
    await open(page, 'shell-verticalnav--default');
    const root = nav(page);
    const wide = (await box(root)).width;
    expect(wide).toBe(240);
    await root.getByRole('button', { name: 'Collapse navigation' }).click();
    await expect(root).toHaveAttribute('data-collapsed', 'user');
    expect((await box(root)).width).toBeLessThan(70);
    const toggle = root.getByRole('button', { name: 'Expand navigation' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();

    // Labels are not on screen, but they are still the names, and the tooltip of each row.
    const general = root.getByRole('button', { name: 'General', exact: true });
    const tooltip = page.getByRole('tooltip');
    await expect(general).toBeVisible();
    await expect(general).not.toHaveAttribute('title');
    await general.hover();
    await expect(tooltip).toHaveText('General');
    expect((await box(general.locator('[data-part="label"]'))).width).toBeLessThanOrEqual(1);
    await expect(root.locator('[aria-current="page"]')).toHaveAccessibleName('Display');
    expect(await root.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    // Keys work the same in the rail.
    await general.focus();
    await page.keyboard.press('ArrowDown');
    await expect(root.getByRole('button', { name: 'Display', exact: true })).toBeFocused();
    // Keyboard focus shows the tooltip of the focused row at once.
    await expect(tooltip).toHaveText('Display');

    await toggle.click();
    await expect(root).not.toHaveAttribute('data-collapsed');
    expect((await box(root)).width).toBe(wide);
    // With the labels on screen there is no tooltip.
    await general.hover();
    await page.waitForTimeout(700);
    await expect(tooltip).toHaveCount(0);

    // Controlled by the prop.
    await open(page, 'shell-verticalnav--rail');
    await expect(nav(page)).toHaveAttribute('data-collapsed', 'user');
    await expect(nav(page).getByRole('button', { name: 'Teams', exact: true })).toBeVisible();
  });

  test('in a slot narrower than the token width it becomes the rail by itself, and comes back', async ({
    page,
  }) => {
    await open(page, 'shell-verticalnav--narrow-slot', 1280, 720);
    const root = nav(page);
    await expect(root).not.toHaveAttribute('data-collapsed');
    expect((await box(root)).width).toBeGreaterThanOrEqual(160);
    await expect(root.getByText('General')).toBeInViewport();

    await page.setViewportSize({ width: 1024, height: 600 });
    await expect(root).toHaveAttribute('data-collapsed', 'auto');
    expect((await box(root)).width).toBeLessThan(160);
    expect((await box(root.locator('[data-part="label"]').first())).width).toBeLessThanOrEqual(1);
    await expect(root.getByRole('button', { name: 'General', exact: true })).toBeVisible();
    await expect(root.locator('[aria-current="page"]')).toHaveAccessibleName('Display');

    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(root).not.toHaveAttribute('data-collapsed');

    // Without an icon on every item there is no rail: the labels truncate.
    await open(page, 'shell-verticalnav--without-icons');
    const plain = nav(page, 'Without icons');
    expect((await box(plain)).width).toBe(130);
    await expect(plain).not.toHaveAttribute('data-collapsed');
    await expect(plain.locator('[data-part="label"]').first()).toHaveCSS('text-overflow', 'ellipsis');
    expect(await plain.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  });

  test('a list taller than its slot scrolls inside; links go through `renderLink`', async ({ page }) => {
    await open(page, 'shell-verticalnav--scrolling');
    const root = nav(page, 'Pages');
    expect((await box(root)).height).toBeLessThanOrEqual(320);
    const viewport = root.locator('[data-part="viewport"]');
    expect(await viewport.evaluate((el) => el.scrollHeight > el.clientHeight + 100)).toBe(true);
    const links = root.getByRole('link');
    await expect(links).toHaveCount(24);
    await expect(links.first()).toHaveAttribute('data-router', '');
    await expect(root.locator('[aria-current="page"]')).toHaveText('Page 3');

    // Header and footer stay; End brings the last item into view.
    await page.keyboard.press('Tab');
    await page.keyboard.press('End');
    await expect(links.last()).toBeFocused();
    await expect(links.last()).toBeInViewport({ ratio: 1 });
    await expect(root.getByText('Preferences')).toBeInViewport({ ratio: 1 });
    await expect(root.getByText('Version 4.2')).toBeInViewport({ ratio: 1 });
    await page.keyboard.press('Enter');
    await expect(page.getByText('Current: page-24.')).toBeVisible();
  });

  test('groups can be controlled', async ({ page }) => {
    await open(page, 'shell-verticalnav--groups');
    const people = nav(page, 'Groups').getByRole('button', { name: 'People', exact: true });
    await expect(people).toHaveAttribute('aria-expanded', 'false');
    await expect(people).toHaveAttribute('data-holds-current');
    await people.click();
    await expect(page.getByText('Open: people. Current: roles.')).toBeVisible();
    await expect(nav(page, 'Groups').locator('[aria-current="page"]')).toHaveText('Roles');
    await people.click();
    await expect(page.getByText('Open: none.')).toBeVisible();
  });

  test('parts and blocks', async ({ page }) => {
    await open(page, 'shell-verticalnav--parts');
    const first = nav(page, 'Node and null');
    await expect(first.getByText('A node replaces the header')).toBeVisible();
    await expect(first.locator('[data-part="toggle"]')).toHaveCount(0);
    await expect(first.locator('[data-part="footer"]')).toBeVisible();
    await expect(nav(page, 'Function').locator('[data-part="badge"]')).toHaveCount(3);

    await open(page, 'shell-verticalnav--blocks');
    const composed = nav(page, 'Composed');
    await expect(composed.getByRole('button', { name: 'Teams', exact: true })).toBeVisible();
    await expect(composed.locator('[aria-current="page"]')).toHaveText('Display');
    await composed.getByRole('button', { name: 'Collapse navigation' }).click();
    // One item has no icon, but the user can still ask for the rail.
    await expect(composed).toHaveAttribute('data-collapsed', 'user');
  });
});
