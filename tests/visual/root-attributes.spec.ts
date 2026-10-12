import { expect, test, type Page } from '@playwright/test';
import { names, overlays, rootSelectors } from '../../src/stories/rootAttributeNames';
import { openStory } from './helpers';

// Every component hands `id`, `data-*` and `aria-*` on to its root element (src/utils/passThrough.ts).
// The story `Integration/Root attributes` gives each exported component `data-test-root="<Name>"` and
// `aria-description="x"`, two attributes no component knows.

const STORY = 'integration-root-attributes--all';

/** The names whose attributes did not arrive on exactly one element that is the component's root. */
const wrong = (page: Page, list: string[]) =>
  page.evaluate(
    ([list, selectors]) =>
      list.filter((name) => {
        const found = document.querySelectorAll(`[data-test-root="${name}"]`);
        const root = found[0];
        return !(
          found.length === 1 &&
          root!.matches(selectors[name] ?? '[data-umbra]') &&
          root!.getAttribute('aria-description') === 'x'
        );
      }),
    [list, rootSelectors] as const,
  );

test('every component hands data-* and aria-* attributes on to its root element', async ({ page }) => {
  await openStory(page, STORY);
  const inPage = names.filter((name) => !overlays.includes(name));
  expect(inPage.length).toBeGreaterThan(80);
  await expect.poll(() => wrong(page, inPage)).toEqual([]);
});

for (const name of overlays) {
  test(`${name}, open, has them on the element that carries data-umbra`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`/iframe.html?id=${STORY}&viewMode=story&open=${name}`);
    await expect.poll(() => wrong(page, [name])).toEqual([]);
  });
}

test('an id goes to the root too, of a plain element and of one React Aria draws', async ({ page }) => {
  await openStory(page, STORY);
  await expect(page.locator('#root-id-card')).toHaveAttribute('data-test-root', 'Card');
  await expect(page.locator('#root-id-button')).toHaveAttribute('data-test-root', 'Button');
  // X-5 of review 2: a group that is a field's control took its id from the field only.
  await expect(page.locator('#root-id-split-button')).toHaveAttribute('data-test-root', 'SplitButton');
});

test("aria-describedby reaches the root of a control that also takes a field's description", async ({
  page,
}) => {
  await openStory(page, STORY);
  for (const name of ['SplitButton', 'ColorScaleEditor'])
    await expect(page.locator(`[data-test-root="${name}"]`)).toHaveAttribute(
      'aria-describedby',
      /(^| )root-described( |$)/,
    );
});

test('the search trigger of the top bar is a named part', async ({ page }) => {
  await openStory(page, 'shell-topbar--slots');
  await expect(page.locator('[data-umbra="top-bar"] [data-part="search"]')).toHaveAttribute(
    'data-umbra',
    'icon-button',
  );
});
