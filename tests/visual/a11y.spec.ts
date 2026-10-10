import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { contextPresets } from '../../src/styles/tokens.generated';

// Every story must pass the automated WCAG 2.2 AA checks on every context tint
// (plan/interaction.md, "Accessibility"). Automated checks find only part of the problems;
// keyboard and focus behaviour is tested in interactions.spec.ts.
type Entry = { id: string; type: string; tags?: string[] };
const index = JSON.parse(readFileSync('storybook-static/index.json', 'utf8')) as {
  entries: Record<string, Entry>;
};
const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

for (const story of Object.values(index.entries).filter((e) => e.type === 'story')) {
  for (const context of contextPresets) {
    test(`${story.id} on ${context}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto(`/iframe.html?id=${story.id}&viewMode=story&globals=context:${context}`);
      await page.locator('#storybook-root > *').first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      // Storybook's own accessibility panel may be running axe on the same page; wait for it.
      const analyze = async (tries = 20): Promise<Awaited<ReturnType<AxeBuilder['analyze']>>> => {
        try {
          return await new AxeBuilder({ page }).withTags(tags).analyze();
        } catch (error) {
          if (tries === 0 || !String(error).includes('already running')) throw error;
          await page.waitForTimeout(250);
          return analyze(tries - 1);
        }
      };
      const { violations } = await analyze();
      expect(violations.flatMap((v) => v.nodes.map((n) => `${v.id}: ${n.html.slice(0, 600)}`))).toEqual([]);
    });
  }
}
