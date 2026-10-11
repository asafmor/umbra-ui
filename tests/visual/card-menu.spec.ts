import { expect, test, type Page } from '@playwright/test';
import { expectFocusKept, openStory, pressKeys, resizeTwice, settle } from './helpers';

// A card loads the menu of its header only when the header does not fit, and its popover only when a
// stack has collapsed it (plan/decisions/05-packaging.md, "Loaded on demand"). The built Storybook
// splits both into chunks of their own, as an app's bundler does, and the story's file imports nothing
// else that holds them: the requests seen here are the ones a user's browser makes.
const story = 'layout-card-on-demand--fits-until-the-window-shrinks';
const menuChunk = /\/assets\/Menu-[\w-]+\.js$/;
const popoverChunk = /\/assets\/Popover-[\w-]+\.js$/;
// In a narrow window the actions of the first card do not fit; in a short one the stack collapses.
const narrow = { width: 700, height: 720 };
const short = { width: 1280, height: 400 };

/** The requests for a chunk that the page makes, from before it loads. */
function requests(page: Page, chunk: RegExp) {
  const seen: string[] = [];
  page.on('request', (request) => {
    if (chunk.test(request.url())) seen.push(request.url());
  });
  return seen;
}

/** Holds every request for the chunk until `release` is called. */
async function hold(page: Page, chunk: RegExp) {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  let asked!: () => void;
  const requested = new Promise<void>((resolve) => (asked = resolve));
  await page.route(chunk, async (route) => {
    asked();
    await gate;
    await route.continue();
  });
  return { release, requested };
}

const card = (page: Page) => page.locator('[data-umbra="card"]', { hasText: 'Quarterly review' });
const more = (page: Page) => card(page).getByRole('button', { name: 'More actions' });
const menu = (page: Page) => page.getByRole('menu', { name: 'More actions' });
const row = (page: Page, name: string) => menu(page).getByRole('menuitem', { name });

test('a card whose header fits asks for neither the menu nor the popover', async ({ page }) => {
  const menus = requests(page, menuChunk);
  const popovers = requests(page, popoverChunk);
  await openStory(page, story);
  // Its actions are in the row, and they work.
  await expect(more(page)).toHaveCount(0);
  await card(page).getByRole('button', { name: 'Filter' }).focus();
  await pressKeys(page, 'Tab', 'Enter');
  await expect(page.getByText('Last action: Export')).toBeVisible();
  await card(page).getByRole('button', { name: 'Refresh' }).hover();
  await page.waitForLoadState('networkidle');
  expect(menus).toEqual([]);
  expect(popovers).toEqual([]);
});

test('a header that does not fit asks for the menu at once, before any press, and not for the popover', async ({
  page,
}) => {
  const menus = requests(page, menuChunk);
  const popovers = requests(page, popoverChunk);
  await openStory(page, story, narrow);
  await expect(more(page)).toBeVisible();
  await expect(more(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(more(page)).toHaveAttribute('aria-haspopup', 'true');
  await expect.poll(() => menus.length).toBe(1);
  await page.waitForLoadState('networkidle');
  expect(popovers).toEqual([]);
});

test('on a cold load the menu opens with the pointer, and a row runs', async ({ page }) => {
  await openStory(page, story, narrow);
  await expect(card(page).getByRole('button', { name: 'Filter' })).toHaveCount(0);
  await more(page).click();
  await expect(menu(page)).toBeVisible();
  await expect(more(page)).toHaveAttribute('aria-expanded', 'true');
  // A pointer opens it with the focus on the menu, not on a row.
  await expect.poll(() => menu(page).evaluate((el) => el.contains(document.activeElement))).toBe(true);
  await expect(row(page, 'Filter')).toContainText('Filter');
  await row(page, 'Export').click();
  await expect(page.getByText('Last action: Export')).toBeVisible();
  await expect(menu(page)).toHaveCount(0);
  await expect(more(page)).toBeFocused();
  await expect(more(page)).toHaveAttribute('aria-expanded', 'false');
});

test('on a cold load the menu opens with the keyboard: Enter, Space, the arrows, Escape', async ({
  page,
}) => {
  await openStory(page, story, narrow);
  await more(page).focus();
  await pressKeys(page, 'Enter');
  await expect(row(page, 'Filter')).toBeFocused();
  await pressKeys(page, 'ArrowDown');
  await expect(row(page, 'Export')).toBeFocused();
  await pressKeys(page, 'Escape');
  await expect(menu(page)).toHaveCount(0);
  await expect(more(page)).toBeFocused();
  await pressKeys(page, 'Space');
  await expect(row(page, 'Filter')).toBeFocused();
  await pressKeys(page, 'Escape');
  await expect(more(page)).toBeFocused();
  // The arrows open it too: down on the first row, up on the last.
  await pressKeys(page, 'ArrowDown');
  await expect(row(page, 'Filter')).toBeFocused();
  await pressKeys(page, 'Escape');
  await expect(more(page)).toBeFocused();
  await pressKeys(page, 'ArrowUp');
  await expect(row(page, 'Refresh')).toBeFocused();
  await pressKeys(page, 'Enter');
  await expect(page.getByText('Last action: Refresh')).toBeVisible();
  await expect(menu(page)).toHaveCount(0);
  await expect(more(page)).toBeFocused();
});

for (const how of ['keyboard', 'pointer'] as const) {
  test(`a press while the menu is still loading is kept: ${how}`, async ({ page }) => {
    const chunk = await hold(page, menuChunk);
    await openStory(page, story, narrow);
    // The "more" button is there at once, before the menu's code is.
    await expect(more(page)).toBeVisible();
    await chunk.requested;
    if (how === 'keyboard') {
      await more(page).focus();
      await pressKeys(page, 'Enter');
    } else {
      await more(page).click();
    }
    await expect(more(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(more(page)).toBeFocused();
    await expect(menu(page)).toHaveCount(0);

    chunk.release();
    await expect(menu(page)).toBeVisible();
    // Focus is where that press would have put it: on the first row for the keyboard, on the menu for
    // the pointer.
    if (how === 'keyboard') await expect(row(page, 'Filter')).toBeFocused();
    else await expect.poll(() => menu(page).evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await pressKeys(page, 'Escape');
    await expect(menu(page)).toHaveCount(0);
    await expect(more(page)).toBeFocused();
  });
}

test('two resizes in one frame move the actions into the menu, which is asked for only then', async ({
  page,
}) => {
  const menus = requests(page, menuChunk);
  const chunk = await hold(page, menuChunk);
  await openStory(page, story);
  const filter = card(page).getByRole('button', { name: 'Filter' });
  await expect(filter).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(menus).toEqual([]);

  // The focus is on an action when the row gives way: it moves to the "more" button.
  await filter.focus();
  await card(page).evaluate((el) => el.parentElement!.setAttribute('data-test', 'box'));
  await resizeTwice(page, '[data-test="box"]', 260, 180);
  await settle(page);
  await expect(more(page)).toBeVisible();
  await expect(filter).toHaveCount(0);
  await expectFocusKept(page);
  await chunk.requested;
  expect(menus).toHaveLength(1);

  await more(page).focus();
  await pressKeys(page, 'Enter');
  await expect(menu(page)).toHaveCount(0);
  chunk.release();
  await expect(row(page, 'Filter')).toBeFocused();

  // Wide again, twice in a frame: the actions come back once the menu has closed, with the focus kept.
  await pressKeys(page, 'Escape');
  await expect(more(page)).toBeFocused();
  await resizeTwice(page, '[data-test="box"]', 300, 420);
  await expect(filter).toBeVisible();
  await expect(more(page)).toHaveCount(0);
  await expectFocusKept(page);
  // Narrow once more: the code is there, and it is not asked for again.
  await resizeTwice(page, '[data-test="box"]', 260, 180);
  await more(page).click();
  await expect(menu(page)).toBeVisible();
  expect(menus).toHaveLength(1);
});

test('a card collapsed by its stack asks for the popover, and a press while it loads is kept', async ({
  page,
}) => {
  const menus = requests(page, menuChunk);
  const chunk = await hold(page, popoverChunk);
  await openStory(page, story, short);
  const header = page.getByRole('button', { name: 'Exports' });
  await expect(header).toBeVisible();
  await chunk.requested;
  await header.focus();
  await pressKeys(page, 'Enter');
  await expect(header).toHaveAttribute('aria-expanded', 'true');
  await expect(header).toBeFocused();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  chunk.release();
  const popover = page.getByRole('dialog', { name: 'Exports' });
  await expect(popover).toBeVisible();
  // The header's actions are repeated in the popover, above the content.
  await expect(popover.getByRole('button', { name: 'Export' })).toBeVisible();
  await expect.poll(() => popover.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  await pressKeys(page, 'Escape');
  await expect(popover).toHaveCount(0);
  await expect(header).toBeFocused();
  // No header overflowed, so the menu was never asked for.
  expect(menus).toEqual([]);
});

// Review 2, X-2: the menu's code does not arrive (the app is offline, or a new version was deployed
// under an open page). The "more" button must not be a dead end.
test('the menu cannot be loaded: the actions open as a plain list', async ({ page }) => {
  const menus = requests(page, menuChunk);
  await page.route(menuChunk, (route) => route.abort());
  await openStory(page, story, narrow);
  await expect(more(page)).toBeVisible();
  await expect.poll(() => menus.length).toBe(1);
  const list = page.getByRole('group', { name: 'More actions' });
  const action = (name: string) => list.getByRole('button', { name });

  // The pointer: the list opens under the button, and nothing clips or covers its actions.
  await more(page).click();
  await expect(list).toBeVisible();
  await expect(more(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(menu(page)).toHaveCount(0);
  for (const name of ['Filter', 'Export', 'Refresh']) {
    const reached = await action(name).evaluate((el) => {
      const box = el.getBoundingClientRect();
      const top = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      return box.x >= 0 && box.right <= innerWidth && box.bottom <= innerHeight && el.contains(top);
    });
    expect(reached, `${name} can be pressed`).toBe(true);
  }
  await action('Export').click();
  await expect(page.getByText('Last action: Export')).toBeVisible();
  await expect(list).toHaveCount(0);
  await expect(more(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(more(page)).toBeFocused();

  // The keyboard: the first action has the focus, Tab walks them, Escape closes and gives the focus back.
  await pressKeys(page, 'Enter');
  await expect(action('Filter')).toBeFocused();
  await pressKeys(page, 'Tab');
  await expect(action('Export')).toBeFocused();
  await pressKeys(page, 'Escape');
  await expect(list).toHaveCount(0);
  await expect(more(page)).toBeFocused();
  await pressKeys(page, 'ArrowUp');
  await expect(action('Refresh')).toBeFocused();
  await pressKeys(page, 'Enter');
  await expect(page.getByText('Last action: Refresh')).toBeVisible();
  await expect(more(page)).toBeFocused();
  // A press elsewhere closes it.
  await more(page).click();
  await expect(list).toBeVisible();
  await page.getByText('Last action: Refresh').click();
  await expect(list).toHaveCount(0);

  // Every press asked for the code again. Whether the browser then makes a request is its own
  // business: Chromium remembers a module that failed for as long as the page lives, so there the list
  // stays until a reload, and where a request is made and answered the menu takes over.
  await more(page).focus();
  await pressKeys(page, 'Enter');
  await expect(list.or(menu(page))).toBeVisible();
  await expectFocusKept(page);
});

// Review 2, X-4.
for (const how of ['Escape', 'Tab', 'a press elsewhere'] as const) {
  test(`a press kept while the menu loads is taken back by ${how}`, async ({ page }) => {
    const chunk = await hold(page, menuChunk);
    await openStory(page, story, narrow);
    await chunk.requested;
    await more(page).focus();
    await pressKeys(page, 'Enter');
    await expect(more(page)).toHaveAttribute('aria-expanded', 'true');
    if (how === 'a press elsewhere') await page.getByText('Last action: none').click();
    else await page.keyboard.press(how);
    await expect(more(page)).toHaveAttribute('aria-expanded', 'false');
    const focus = () => page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? null);
    const before = await focus();
    if (how === 'Escape') expect(before).toBe('More actions');
    else expect(before).not.toBe('More actions');

    chunk.release();
    await page.waitForLoadState('networkidle');
    await settle(page);
    // The code is there, and no menu opens or takes the focus.
    await expect(menu(page)).toHaveCount(0);
    expect(await focus()).toBe(before);
    // The next press opens it.
    await more(page).click();
    await expect(menu(page)).toBeVisible();
  });
}

// Review 2, X-9.
test('the row has room again when its menu closes: the focus goes to the first action that came back', async ({
  page,
}) => {
  await openStory(page, story);
  await card(page).evaluate((el) => el.parentElement!.setAttribute('data-test', 'box'));
  await resizeTwice(page, '[data-test="box"]', 260, 180);
  await more(page).focus();
  await pressKeys(page, 'Enter');
  await expect(row(page, 'Filter')).toBeFocused();
  // Wider while the menu is open: the row waits for the menu.
  await resizeTwice(page, '[data-test="box"]', 300, 420);
  await settle(page);
  await expect(menu(page)).toBeVisible();
  await pressKeys(page, 'Escape');
  await expect(more(page)).toHaveCount(0);
  await expect(card(page).getByRole('button', { name: 'Filter' })).toBeFocused();
});
