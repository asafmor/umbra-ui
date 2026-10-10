import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { densities, minWindow } from '../../src/styles/tokens.generated';

// Every story is captured at three window sizes and all three density levels, and must never make
// the document scroll. Stories tagged `narrow` are also captured below the minimum window.
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

for (const story of Object.values(index.entries).filter((e) => e.type === 'story')) {
  for (const density of densities) {
    for (const [width, height] of story.tags?.includes('narrow') ? [...sizes, narrow] : sizes) {
      test(`${story.id} ${density} ${width}x${height}`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto(`/iframe.html?id=${story.id}&viewMode=story&globals=density:${density}`);
        await page.locator('#storybook-root > *').first().waitFor();
        await page.evaluate(() => document.fonts.ready);

        const overflow = await page.evaluate(() => {
          const d = document.documentElement;
          return { x: d.scrollWidth - d.clientWidth, y: d.scrollHeight - d.clientHeight };
        });
        expect(overflow, 'the page must never scroll').toEqual({ x: 0, y: 0 });

        await expect(page).toHaveScreenshot(`${story.id}-${density}-${width}x${height}.png`);
      });
    }
  }
}
