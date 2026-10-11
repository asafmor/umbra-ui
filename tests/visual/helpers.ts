import type AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/**
 * Opens a story as a user's browser does: no font face is loaded ahead of time. A face that first
 * loads when a menu opens must not disturb anything (`useShrinkLevel`), so no test hides that.
 */
export async function openStory(
  page: Page,
  id: string,
  {
    width = 1280,
    height = 720,
    ...globals
  }: { width?: number; height?: number; density?: string; context?: string; direction?: string } = {},
) {
  await page.setViewportSize({ width, height });
  const list = Object.entries(globals)
    .map(([key, value]) => `${key}:${value}`)
    .join(';');
  await page.goto(`/iframe.html?id=${id}&viewMode=story${list && `&globals=${list}`}`);
  await page.locator('#storybook-root > *').first().waitFor();
}

/** Focus is never lost: after an interaction step it is on an element, not on `<body>`. */
export async function expectFocusKept(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const el = document.activeElement;
        return !!el && el !== document.body && el.isConnected;
      }),
    )
    .toBe(true);
}

/** Presses the keys in order, checking after each that focus is still on an element. */
export async function pressKeys(page: Page, ...keys: string[]) {
  for (const key of keys) {
    await page.keyboard.press(key);
    await expectFocusKept(page);
  }
}

/** Waits until the layout has settled: two frames with nothing pending. */
export const settle = (page: Page) =>
  page.evaluate(
    () => new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done()))),
  );

/** Sets the width of an element twice within one frame, as a window drag can. */
export const resizeTwice = (page: Page, selector: string, first: number, second: number) =>
  page.evaluate(
    ([sel, a, b]) =>
      new Promise<void>((done) => {
        const el = document.querySelector<HTMLElement>(sel as string)!;
        el.style.maxWidth = 'none';
        el.style.width = `${a}px`;
        setTimeout(() => {
          el.style.width = `${b}px`;
          done();
        }, 8);
      }),
    [selector, first, second] as const,
  );

/**
 * Runs axe. Storybook's own accessibility panel may be running axe on the same page, and axe refuses
 * a second run: wait for the first to end. Every axe run in the tests goes through here.
 */
export async function runAxe(
  page: Page,
  builder: AxeBuilder,
  tries = 20,
): Promise<Awaited<ReturnType<AxeBuilder['analyze']>>> {
  try {
    return await builder.analyze();
  } catch (error) {
    if (tries === 0 || !String(error).includes('already running')) throw error;
    await page.waitForTimeout(250);
    return runAxe(page, builder, tries - 1);
  }
}
