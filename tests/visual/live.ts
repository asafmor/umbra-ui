import { expect, type Page } from '@playwright/test';

/**
 * `highlightChanges`, the same on every component that has it. The story is built with `LiveValues`
 * (src/stories/live.tsx): copies of the component whose value rises, falls, changes as text and stays.
 */
export async function expectChangeHighlights(page: Page, story: string, text = true) {
  const open = async () => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`/iframe.html?id=${story}&viewMode=story`);
    await page.locator('#storybook-root > *').first().waitFor();
  };
  const mark = (kind: string, part: 'flash' | 'sign') =>
    page.locator(`[data-live="${kind}"] [data-part="change-${part}"]`);
  const update = page.getByRole('button', { name: 'Update values' });

  await open();
  // Nothing flashes for the first value.
  await expect(page.locator('[data-part="changeFlash"]')).toHaveCount(0);
  await update.click();
  await expect(mark('up', 'flash')).toHaveAttribute('data-direction', 'up');
  await expect(mark('up', 'sign')).toHaveText('▲increased');
  await expect(mark('down', 'flash')).toHaveAttribute('data-direction', 'down');
  await expect(mark('down', 'sign')).toHaveText('▼decreased');
  if (text) {
    // Text has no direction: a neutral flash and no sign.
    await expect(mark('text', 'flash')).toHaveAttribute('data-direction', 'neutral');
    await expect(mark('text', 'sign')).toHaveCount(0);
  }
  // Only what changed flashes; the value is the new one at once, not counted up.
  await expect(mark('same', 'flash')).toHaveCount(0);
  await expect(page.locator('[data-live="up"]')).toContainText('41');
  await expect(page.locator('[data-live="down"]')).toContainText('39');
  // The flash covers the value's own element, and is a fade that plays once.
  const flash = await mark('up', 'flash').evaluate((el) => {
    const css = getComputedStyle(el);
    const host = el.parentElement!;
    return {
      name: css.animationName,
      seconds: parseFloat(css.animationDuration),
      times: css.animationIterationCount,
      host: host.hasAttribute('data-umbra-change') && getComputedStyle(host).position,
      events: css.pointerEvents,
    };
  });
  expect(flash).toMatchObject({ times: '1', host: 'relative', events: 'none' });
  expect(flash.name).not.toBe('none');
  expect(flash.seconds).toBeGreaterThan(0.5);
  // The sign goes away by itself.
  await expect(page.locator('[data-part="changeSign"]')).toHaveCount(0, { timeout: 8000 });

  // Under reduced motion there is no flash to see; the sign still shows the direction.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open();
  await update.click();
  await expect(mark('up', 'sign')).toHaveText('▲increased');
  expect(await mark('up', 'flash').evaluate((el) => parseFloat(getComputedStyle(el).animationDuration))).toBe(
    0,
  );
  expect(await mark('up', 'flash').evaluate((el) => getComputedStyle(el).opacity)).toBe('0');
}
