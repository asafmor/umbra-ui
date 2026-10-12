import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectFocusKept, openStory, settle } from './helpers';

// A control that disables or removes itself under the focus hands the focus on (plan/interaction.md,
// "Keyboard"; `leaveDisabled` and `holdFocus` in src/internal/focus.ts): "Back" at the first page,
// "Next" at the last item, the button at the edge of a row that has scrolled to its end. Each test
// walks a control to its end with the keyboard and with the mouse, and asks where the focus is.

/** Presses the control until it is disabled or gone, checking the focus after every press. */
async function walkToTheEnd(page: Page, control: Locator, press: (control: Locator) => Promise<void>) {
  for (let i = 0; i < 20; i++) {
    // Read in one go: the control may leave between two questions.
    const left = await control.evaluateAll(
      ([el]) => !el || el.matches(':disabled, [aria-disabled="true"]') || el.getClientRects().length === 0,
    );
    if (left) return expectFocusKept(page);
    await press(control);
    await settle(page);
    await expectFocusKept(page);
  }
  throw new Error('The control never reached its end');
}
const withKeyboard = async (control: Locator) => {
  await control.focus();
  await control.press('Enter');
};
// By its place, not through the locator: a click through the locator waits for a button that stands
// still, and the button at the edge of a row leaves while the row is still scrolling.
const withMouse = async (control: Locator) => {
  const box = await control.boundingBox();
  if (box) await control.page().mouse.click(box.x + box.width / 2, box.y + box.height / 2);
};
const ways = [
  ['keyboard', withKeyboard],
  ['mouse', withMouse],
] as const;

for (const [way, press] of ways) {
  test(`HistoryButtons, ${way}: Back at the first place hands the focus to Forward, and the other way round`, async ({
    page,
  }) => {
    await openStory(page, 'shell-historybuttons--controlled');
    const back = page.getByRole('button', { name: 'Back' }).first();
    const forward = page.getByRole('button', { name: 'Forward' }).first();
    await walkToTheEnd(page, back, press);
    await expect(back).toBeDisabled();
    await expect(forward).toBeFocused();
    await walkToTheEnd(page, forward, press);
    await expect(forward).toBeDisabled();
    await expect(back).toBeFocused();
  });

  test(`HorizontalScroller, ${way}: the button that leaves at the end of the row hands the focus on`, async ({
    page,
  }) => {
    await openStory(page, 'layout-horizontalscroller--default');
    const scroller = page.locator('[data-umbra="horizontal-scroller"]').first();
    const next = scroller.locator('[data-part="next"] button');
    const previous = scroller.locator('[data-part="previous"] button');
    await walkToTheEnd(page, next, press);
    await expect(next).toHaveCount(0);
    await expect(previous).toBeFocused();
    await walkToTheEnd(page, previous, press);
    await expect(previous).toHaveCount(0);
    await expect(next).toBeFocused();
  });

  test(`Spotlight, ${way}: Back at the first step and Next at the last keep the focus in the callout`, async ({
    page,
  }) => {
    await openStory(page, 'overlays-spotlight--tour');
    const callout = page.locator('[data-umbra="spotlight"]');
    const inCallout = () => callout.evaluate((el) => el.contains(document.activeElement));
    await press(callout.getByRole('button', { name: 'Next' }));
    await settle(page);
    await expectFocusKept(page);
    // Back leaves at the first step.
    await walkToTheEnd(page, callout.getByRole('button', { name: 'Back' }), press);
    await expect(callout.getByRole('button', { name: 'Back' })).toHaveCount(0);
    await expect.poll(inCallout).toBe(true);
    // Next becomes Done at the last step, and Skip leaves.
    await walkToTheEnd(page, callout.getByRole('button', { name: 'Next' }), press);
    await expect(callout.getByRole('button', { name: 'Skip' })).toHaveCount(0);
    await expect.poll(inCallout).toBe(true);
  });

  test(`EntitySwitcher, ${way}: a stepper at the end of the list keeps the focus`, async ({ page }) => {
    await openStory(page, 'shell-entityswitcher--default');
    const next = page.locator('[data-umbra="entity-switcher"] [data-part="next"]').first();
    const previous = page.locator('[data-umbra="entity-switcher"] [data-part="previous"]').first();
    await walkToTheEnd(page, next, press);
    await expect(next).toHaveAttribute('aria-disabled', 'true');
    await expect(next).toBeFocused();
    await walkToTheEnd(page, previous, press);
    await expect(previous).toHaveAttribute('aria-disabled', 'true');
    await expect(previous).toBeFocused();
  });
}

test('Stepper: at its maximum and its minimum without `wrap`, the focus stays on the value', async ({
  page,
}) => {
  await openStory(page, 'inputs-stepper--states');
  const stepper = page.locator('[data-umbra="stepper"]', {
    has: page.getByRole('spinbutton', { name: 'Copies' }),
  });
  const value = stepper.getByRole('spinbutton');
  // With the keyboard: the value is the one tab stop.
  await value.focus();
  for (let i = 0; i < 9; i++) await page.keyboard.press('ArrowUp');
  await expect(value).toHaveAttribute('aria-valuenow', '8');
  await expect(value).toBeFocused();
  // With the mouse: the buttons never take the focus, so a button that disables itself cannot drop it.
  const previous = stepper.locator('[data-part="previous"]');
  await walkToTheEnd(page, previous, withMouse);
  await expect(previous).toBeDisabled();
  await expect(value).toHaveAttribute('aria-valuenow', '1');
  await expect(value).toBeFocused();
});

test('EntitySwitcher: a picker opened while another one is open gives the focus back to its own trigger', async ({
  page,
}) => {
  // The first picker of the story is open from the start, with no element that opened it.
  await openStory(page, 'shell-entityswitcher--picker-states');
  const second = page.locator('[data-umbra="entity-switcher"]').nth(1).locator('[data-part="trigger"]');
  const first = page.locator('[data-umbra="entity-switcher"]').nth(0).locator('[data-part="trigger"]');
  await expect(first).toHaveAttribute('aria-expanded', 'true');
  // Focus moves to the second trigger, which closes the first picker, and Enter follows at once:
  // the second picker opens while the first is still leaving.
  await second.focus();
  await page.keyboard.press('Enter');
  await expect(second).toHaveAttribute('aria-expanded', 'true');
  await expectFocusKept(page);
  await page.keyboard.press('Escape');
  await expect(second).toHaveAttribute('aria-expanded', 'false');
  await expect(second).toBeFocused();
  // And once more, with nothing else going on.
  await page.keyboard.press('Enter');
  await expect(second).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(second).toBeFocused();
});

test('Popover: one that is open from the start gives the focus to its trigger when it closes', async ({
  page,
}) => {
  await openStory(page, 'shell-entityswitcher--picker-states');
  const first = page.locator('[data-umbra="entity-switcher"]').nth(0).locator('[data-part="trigger"]');
  await expect(first).toHaveAttribute('aria-expanded', 'true');
  await expectFocusKept(page);
  await page.keyboard.press('Escape');
  await expect(first).toHaveAttribute('aria-expanded', 'false');
  await expect(first).toBeFocused();
});
