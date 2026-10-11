import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { contextPresets } from '../../src/styles/tokens.generated';
import { runAxe } from './helpers';

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
      // Wait for every fade to end. A story that opens a menu or a popover fades it in, and axe reads the
      // colours as they are painted: read mid-fade, text is blended with what is behind it and fails the
      // contrast check now and then (it did, about one run in twenty, on `overlays-menu--basic`).
      await page.evaluate(async () => {
        await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
        await Promise.all(
          document
            .getAnimations()
            // Not the ones that never end (a spinner, a skeleton).
            .filter((a) => Number.isFinite(a.effect?.getComputedTiming().endTime))
            .map((a) => a.finished.catch(() => null)),
        );
      });
      const { violations } = await runAxe(page, new AxeBuilder({ page }).withTags(tags));
      expect(violations.flatMap((v) => v.nodes.map((n) => `${v.id}: ${n.html.slice(0, 600)}`))).toEqual([]);
    });
  }
}
