import { expect, test, type Locator, type Page } from '@playwright/test';

// Tag, Badge, ValuePill, TrendArrow, StatusIndicator and Link: keyboard, focus, accessible text and
// the shrink steps, which the still captures cannot show.
const open = async (page: Page, id: string) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`/iframe.html?id=${id}&viewMode=story`);
  await page.locator('#storybook-root > *').first().waitFor();
  await page.evaluate(() => document.fonts.ready);
};

const card = (page: Page, title: string) => page.locator('[data-umbra="card"]', { hasText: title });

/** The component stays inside its box, and the named part is cut short with an ellipsis. */
const expectTruncated = async (root: Locator, part: string) => {
  const fits = await root.evaluate((el) => {
    const box = el.closest('[data-narrow]')!.getBoundingClientRect();
    return el.getBoundingClientRect().right <= box.right + 0.5;
  });
  expect(fits, 'stays inside its container').toBe(true);
  const piece = root.locator(`[data-part="${part}"]`);
  expect(await piece.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  await expect(piece).toHaveCSS('text-overflow', 'ellipsis');
};

test('a tag is removed from the keyboard, and its button names what it removes', async ({ page }) => {
  await open(page, 'data-tag--behaviour-and-parts');
  const removable = card(page, 'Removable');
  await expect(removable.locator('[data-umbra="tag"]')).toHaveCount(5);
  const remove = removable.getByRole('button', { name: 'Remove Region 2' });
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(remove).toBeFocused();
  await expect(remove).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Enter');
  await expect(removable.getByText('Last removed: Region 2')).toBeVisible();
  await expect(removable.locator('[data-umbra="tag"]')).toHaveCount(4);

  // `removeLabel` replaces the word, and Space works too.
  await removable.getByRole('button', { name: 'Clear Filter' }).focus();
  await page.keyboard.press('Space');
  await expect(removable.getByText('Last removed: Filter')).toBeVisible();
});

test('a tag with little room truncates its label and keeps its icon and remove button', async ({ page }) => {
  await open(page, 'data-tag--behaviour-and-parts');
  const tag = card(page, 'Little room').locator('[data-umbra="tag"]').first();
  await expectTruncated(tag, 'label');
  await expect(tag.locator('[data-part="icon"]')).toBeVisible();
  await expect(tag.getByRole('button')).toBeVisible();
});

test('tag parts are replaced by a function or a node and hidden by null', async ({ page }) => {
  await open(page, 'data-tag--behaviour-and-parts');
  const parts = card(page, 'Parts and blocks');
  await expect(parts.locator('b[data-part="label"]')).toHaveText('Label wrapped (new)');
  const hidden = parts.locator('[data-umbra="tag"]', { hasText: 'Icon and remove hidden' });
  await expect(hidden.locator('[data-part="icon"], [data-part="remove"]')).toHaveCount(0);
  await expect(parts.getByRole('button', { name: 'Remove By hand' })).toBeVisible();
});

test('the stripe of a tag has a text equivalent', async ({ page }) => {
  await open(page, 'data-tag--variants');
  const tag = page.locator('[data-umbra="tag"][data-stripe]').first();
  await expect(tag).toHaveText('Set(under review)');
  await expect(tag).toHaveAttribute('title', 'under review');
});

test('a badge shows "99+" above its maximum and reads the full count', async ({ page }) => {
  await open(page, 'data-badge--variants');
  const max = page.locator('[data-umbra="badge"]', { hasText: '99+' }).first();
  await expect(max.locator('[aria-hidden="true"]')).toHaveText('99+');
  await expect(max.locator('[data-part="indicator"] > :not([aria-hidden])')).toHaveText('100');
  await expect(page.getByText('3 unread messages')).toHaveCount(1);
  await expect(page.getByText('New notifications')).toHaveCount(1);
  // A count of zero is hidden unless `showZero` is set.
  const zero = card(page, 'Standalone').locator('[data-umbra="badge"]').filter({ hasText: /^0$/ });
  await expect(zero).toHaveCount(1);
});

test('an anchored badge leaves its button reachable, and follows the count', async ({ page }) => {
  await open(page, 'data-badge--behaviour-and-parts');
  const live = card(page, 'Live count');
  const add = live.getByRole('button', { name: 'Add order' });
  const indicator = live.locator('[data-part="indicator"]');
  await expect(indicator.locator('[aria-hidden="true"]')).toHaveText('98');
  await page.keyboard.press('Tab');
  await expect(add).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(indicator.locator('[aria-hidden="true"]')).toHaveText('99+');
  await expect(indicator).toContainText('100 open orders');
  // The badge overlaps the corner of the button but does not take its clicks.
  const box = (await indicator.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height - 2);
  await expect(indicator).toContainText('101 open orders');
  await live.getByRole('button', { name: 'Clear' }).click();
  await expect(indicator).toHaveCount(0);
});

test('a value pill takes its ramp step from the value, in both directions', async ({ page }) => {
  await open(page, 'data-valuepill--variants');
  const levels = (label: string) =>
    card(page, 'Ramp')
      .locator('div', { has: page.getByText(label, { exact: true }) })
      .last()
      .locator('[data-umbra="value-pill"]')
      .evaluateAll((pills) => pills.map((p) => p.getAttribute('data-level')));
  expect(await levels('0 to 100')).toEqual(['1', '2', '3', '4', '5']);
  expect(await levels('Lower is better')).toEqual(['5', '4', '3', '2', '1']);
  expect(await levels('Thresholds')).toEqual(['1', '2', '3', '4', '5']);
  expect(await levels('One threshold')).toEqual(['1', '5']);
  await expect(page.locator('[data-umbra="value-pill"][data-level="none"]').first()).toHaveText('–');
});

test('the level marker of a value pill fills one bar per step and has a text equivalent', async ({
  page,
}) => {
  await open(page, 'data-valuepill--variants');
  const marker = page.locator('[data-umbra="value-pill"][data-level="4"] [data-part="level"]').first();
  await expect(marker.locator('i')).toHaveCount(5);
  await expect(marker.locator('i[data-on]')).toHaveCount(4);
  await expect(marker).toHaveText('Level 4 of 5');
});

test('a value pill with little room truncates its value and keeps its level marker', async ({ page }) => {
  await open(page, 'data-valuepill--behaviour-and-parts');
  const pill = card(page, 'Little room').locator('[data-umbra="value-pill"]');
  await expectTruncated(pill, 'value');
  await expect(pill.locator('[data-part="level"]')).toBeVisible();
});

test('a trend arrow says its direction, and colours it by which direction is good', async ({ page }) => {
  await open(page, 'data-trendarrow--variants');
  const row = (label: string) =>
    card(page, 'Directions')
      .locator('div', { has: page.getByText(label, { exact: true }) })
      .last()
      .locator('[data-umbra="trend-arrow"]');
  await expect(row('Up is good')).toHaveText(['Up', 'Down', 'No change']);
  expect(await row('Up is good').evaluateAll((els) => els.map((e) => e.getAttribute('data-tone')))).toEqual([
    'good',
    'bad',
    'neutral',
  ]);
  expect(await row('Down is good').evaluateAll((els) => els.map((e) => e.getAttribute('data-tone')))).toEqual(
    ['bad', 'good', 'neutral'],
  );
  await expect(row('With a value').first()).toHaveText('Up2.4%');
  // The arrow itself is hidden from screen readers; the words carry it.
  await expect(row('Up is good').first().locator('[data-part="icon"]')).toHaveAttribute(
    'aria-hidden',
    'true',
  );
});

test('a trend arrow with little room truncates its value and keeps its arrow', async ({ page }) => {
  await open(page, 'data-trendarrow--variants');
  const arrow = page.locator('[data-narrow] [data-umbra="trend-arrow"]');
  await expectTruncated(arrow, 'value');
  await expect(arrow.locator('[data-part="icon"]')).toBeVisible();
});

test('every status has its own dot shape and its own icon', async ({ page }) => {
  await open(page, 'data-statusindicator--variants');
  const shapes = await page
    .locator('[data-umbra="status-indicator"][data-variant="dot"][role="img"] [data-part="indicator"]')
    .evaluateAll((dots) =>
      dots.map((dot) => {
        const s = getComputedStyle(dot, '::before');
        return [s.clipPath, s.borderRadius, s.backgroundColor === 'rgba(0, 0, 0, 0)'].join('/');
      }),
    );
  expect(new Set(shapes).size).toBe(5);
  const icons = await page
    .locator('[data-umbra="status-indicator"][data-variant="icon"][role="img"] svg')
    .evaluateAll((svgs) => svgs.map((svg) => svg.innerHTML));
  expect(new Set(icons).size).toBe(5);
  await expect(page.getByRole('img', { name: 'Slow' })).toHaveCount(2);
});

test('the status pulse grows a ring, and stands still with reduced motion', async ({ page }) => {
  const scale = () =>
    page
      .locator('[data-pulse] [data-part="indicator"]')
      .first()
      .evaluate((dot) => {
        const ring = dot.getAnimations({ subtree: true })[0]!;
        ring.pause();
        ring.currentTime = 800;
        return parseFloat(getComputedStyle(dot, '::after').scale) || 1;
      });
  await open(page, 'data-statusindicator--variants');
  expect(await scale()).toBeGreaterThan(1.5);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, 'data-statusindicator--variants');
  expect(await scale()).toBe(1);
});

test('a status label with little room truncates and keeps its mark', async ({ page }) => {
  await open(page, 'data-statusindicator--variants');
  const status = page.locator('[data-narrow] [data-umbra="status-indicator"]');
  await expectTruncated(status, 'label');
  await expect(status.locator('[data-part="indicator"]')).toBeVisible();
});

test('links are reached with Tab and followed with Enter; a link without href is a button', async ({
  page,
}) => {
  await open(page, 'data-link--behaviour-and-parts');
  const callbacks = card(page, 'Callbacks');
  const action = callbacks.getByRole('button', { name: 'Run action' });
  await page.keyboard.press('Tab');
  await expect(action).toBeFocused();
  await expect(action).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Enter');
  await expect(callbacks.getByText('Last action: button pressed')).toBeVisible();

  await page.keyboard.press('Tab');
  await expect(callbacks.getByRole('link', { name: 'Follow link' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(callbacks.getByText('Last action: link followed')).toBeVisible();
  expect(page.url()).toContain('#here');
});

test('renderLink plugs in a router link that keeps the look and the props', async ({ page }) => {
  await open(page, 'data-link--behaviour-and-parts');
  const routed = page.getByRole('link', { name: 'Routed link' });
  await expect(routed).toHaveAttribute('data-router', '');
  await expect(routed).toHaveAttribute('data-umbra', 'link');
  await expect(routed).toHaveAttribute('href', '#routed');
  await routed.click();
  await expect(page.getByText('Last action: router went to #routed')).toBeVisible();
  expect(page.url()).not.toContain('#routed');
});

test('an external link opens a new tab safely and says so; a disabled link cannot be followed', async ({
  page,
}) => {
  await open(page, 'data-link--variants');
  const external = page.getByRole('link', { name: 'delivery terms (opens in a new tab)' });
  await expect(external).toHaveAttribute('target', '_blank');
  await expect(external).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(external.locator('[data-part="externalIcon"]')).toHaveAttribute('aria-hidden', 'true');

  const disabled = page.getByRole('link', { name: 'closed orders' });
  await expect(disabled).toHaveAttribute('aria-disabled', 'true');
  await expect(disabled).not.toHaveAttribute('href');
  await expect(page.getByRole('button', { name: 'reopen' })).toBeDisabled();
  // Tab order: no disabled link is ever focused.
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    if ((await focused.count()) === 0) break;
    await expect(focused).not.toHaveAttribute('aria-disabled', 'true');
  }
});

test('a standalone link with little room truncates and keeps its chevron; an inline link wraps', async ({
  page,
}) => {
  await open(page, 'data-link--variants');
  const link = page.locator('[data-narrow] [data-umbra="link"]');
  await expectTruncated(link, 'label');
  await expect(link.locator('[data-part="chevron"]')).toBeVisible();
  const inline = page.getByRole('link', { name: 'the full list of open orders in Region 2' });
  expect(await inline.evaluate((el) => el.getClientRects().length)).toBeGreaterThan(1);
});
