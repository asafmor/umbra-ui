import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { contextPresets, densities, minWindow } from '../../src/styles/tokens.generated';

// Every story is captured at three window sizes and all three density levels, and must never make
// the document scroll. Stories tagged `narrow` are also captured below the minimum window. Each story
// is also captured once on every other context tint, at the default density.
type Entry = { id: string; type: string; tags?: string[] };
const index = JSON.parse(readFileSync('storybook-static/index.json', 'utf8')) as {
  entries: Record<string, Entry>;
};
const sizes = [
  [1920, 1080],
  [1280, 720],
  [minWindow.width, minWindow.height],
] as const;
const narrow = [900, 560] as const;

const stories = Object.values(index.entries).filter((e) => e.type === 'story');

const capture = (story: Entry, density: string, context: string, width: number, height: number) => {
  const tint = context === contextPresets[0] ? '' : `-${context}`;
  test(`${story.id} ${density}${tint} ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto(
      `/iframe.html?id=${story.id}&viewMode=story&globals=density:${density};context:${context}`,
    );
    await page.locator('#storybook-root > *').first().waitFor();
    await page.evaluate(() => document.fonts.ready);

    const overflow = await page.evaluate(() => {
      const d = document.documentElement;
      return { x: d.scrollWidth - d.clientWidth, y: d.scrollHeight - d.clientHeight };
    });
    expect(overflow, 'the page must never scroll').toEqual({ x: 0, y: 0 });

    await expect(page).toHaveScreenshot(`${story.id}-${density}${tint}-${width}x${height}.png`);
  });
};

for (const story of stories) {
  for (const density of densities) {
    for (const [width, height] of story.tags?.includes('narrow') ? [...sizes, narrow] : sizes) {
      capture(story, density, contextPresets[0], width, height);
    }
  }
  for (const context of contextPresets.slice(1)) capture(story, 'default', context, 1280, 720);
}
