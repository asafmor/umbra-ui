import { expect, test } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { contextPresets, densities, minWindow } from '../../src/styles/tokens.generated';

// Every story is opened at three window sizes and all three density levels, and must never make the
// document scroll; stories tagged `narrow` are also opened below the minimum window. An image is kept
// for part of these only (plan/decisions/06-docs-and-testing.md, "Baseline images"): the default
// density at every size, compact at 1280x720 and spacious at the minimum window. The other tints get an
// image (1280x720, default density) for the stories tagged `tints`, or else the first story, of each
// stories file: the first entry with that `importPath` in the order of Storybook's `index.json`, which
// is the order of the exports in the file.
type Entry = { id: string; type: string; importPath: string; tags?: string[] };
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

const tagged = (story: Entry, tag: string) => !!story.tags?.includes(tag);

const onTints = new Set<Entry>();
for (const importPath of new Set(stories.map((story) => story.importPath))) {
  const file = stories.filter((story) => story.importPath === importPath);
  const chosen = file.filter((story) => tagged(story, 'tints'));
  for (const story of chosen.length ? chosen : file.slice(0, 1)) onTints.add(story);
}

const baselines = new Set<string>();

const capture = (
  story: Entry,
  density: string,
  context: string,
  width: number,
  height: number,
  image: boolean,
) => {
  const tint = context === contextPresets[0] ? '' : `-${context}`;
  const file = `${story.id}-${density}${tint}-${width}x${height}.png`;
  if (image) baselines.add(file);
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

    if (image) await expect(page).toHaveScreenshot(file);
  });
};

const kept = (density: string, width: number) =>
  density === 'default' ||
  (density === 'compact' && width === 1280) ||
  (density === 'spacious' && width === minWindow.width);

for (const story of stories) {
  for (const density of densities) {
    for (const [width, height] of tagged(story, 'narrow') ? [...sizes, narrow] : sizes) {
      capture(story, density, contextPresets[0], width, height, kept(density, width));
    }
  }
  if (onTints.has(story)) {
    for (const context of contextPresets.slice(1)) capture(story, 'default', context, 1280, 720, true);
  }
}

// A baseline no test produces is dead weight that nothing compares: delete it with the capture.
test('no baseline image without a test', () => {
  const stray = readdirSync('tests/visual/__screenshots__').filter((file) => !baselines.has(file));
  expect(stray).toEqual([]);
});
