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
      const { violations } = await new AxeBuilder({ page }).withTags(tags).analyze();
      expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual(
        [],
      );
    });
  }
}
