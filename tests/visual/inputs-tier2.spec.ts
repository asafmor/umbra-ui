import { expect, test, type Locator, type Page } from '@playwright/test';
import { contextPresets } from '../../src/styles/tokens.generated';
import { expectFocusKept, openStory, pressKeys } from './helpers';

// StarRating, SplitButton, Slider, Stepper and ColorScaleEditor: keyboard, pointer, form values, the
// wiring a screen reader depends on, right to left, and each step of "show less as it narrows".
const open = async (page: Page, id: string, options?: Parameters<typeof openStory>[2]) => {
  await openStory(page, id, options);
  await page.evaluate(() => document.fonts.ready);
};
const box = async (locator: Locator) => (await locator.boundingBox())!;
const at = (page: Page, width: number) => page.locator(`[data-width="${width}"]`);
const submit = async (page: Page) => {
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  return page.getByText(/^Sent: /);
};
/** The element stays inside the dashed box of its `Width` sample. */
const inside = async (outer: Locator, inner: Locator) => {
  const [a, b] = [await box(outer), await box(inner)];
  expect(b.x).toBeGreaterThanOrEqual(a.x - 0.5);
  expect(b.x + b.width).toBeLessThanOrEqual(a.x + a.width + 0.5);
};

test.describe('StarRating', () => {
  const id = 'inputs-starrating--states';

  test('display mode is a picture named by its value, and draws a fraction as a partial star', async ({
    page,
  }) => {
    await open(page, id);
    await expect(page.getByRole('img', { name: '2.5 of 5', exact: true })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Quality: 7 of 10' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'No rating' })).toHaveText('—');
    await expect(page.locator('[data-umbra="star-rating"][data-loading]')).toHaveAttribute(
      'aria-busy',
      'true',
    );

    const stars = page.getByRole('img', { name: '3.7 of 5' }).locator('[data-part="star"]');
    await expect(stars).toHaveCount(5);
    await expect(stars.nth(2)).toHaveAttribute('data-fill', 'full');
    await expect(stars.nth(3)).toHaveAttribute('data-fill', 'partial');
    await expect(stars.nth(4)).toHaveAttribute('data-fill', 'empty');
    // The full star over the empty one is cut to 0.7 of its width, from the left.
    const [glyph, filled] = await stars.nth(3).evaluate((star) => {
      const rect = (el: Element) => el.getBoundingClientRect();
      const g = rect(star.firstElementChild!);
      const f = rect(star.firstElementChild!.children[1]!);
      return [
        { x: g.x, width: g.width },
        { x: f.x, width: f.width },
      ];
    });
    expect(filled!.width / glyph!.width).toBeCloseTo(0.7, 1);
    expect(filled!.x).toBeCloseTo(glyph!.x, 0);
    // No control in display mode.
    await expect(page.getByRole('img', { name: '3.7 of 5' }).locator('input')).toHaveCount(0);
  });

  test('input mode is a radio group: one tab stop, arrow keys, and "no rating" when clearable', async ({
    page,
  }) => {
    await open(page, id);
    const whole = page.getByRole('radiogroup', { name: 'Whole stars' });
    await expect(whole.getByRole('radio')).toHaveCount(5);
    await whole.getByRole('radio', { name: '3 of 5' }).focus();
    await pressKeys(page, 'ArrowRight');
    await expect(whole.getByRole('radio', { name: '4 of 5' })).toBeChecked();
    await expect(whole.getByRole('radio', { name: '4 of 5' })).toBeFocused();
    await expect(whole.locator('[data-part="star"]').nth(3)).toHaveAttribute('data-fill', 'full');
    await pressKeys(page, 'ArrowLeft', 'ArrowLeft');
    await expect(whole.getByRole('radio', { name: '2 of 5' })).toBeChecked();
    // One tab stop: Tab leaves the group for the next one.
    await pressKeys(page, 'Tab');
    const halves = page.getByRole('radiogroup', { name: 'Half steps' });
    await expect(halves.getByRole('radio')).toHaveCount(10);
    await expect(halves.getByRole('radio', { name: '2.5 of 5' })).toBeFocused();
    await pressKeys(page, 'ArrowRight');
    await expect(halves.getByRole('radio', { name: '3 of 5' })).toBeChecked();
    await expect(halves.locator('[data-part="value"]')).toHaveText('3');

    // Clearable: "No rating" is the choice before the first star.
    const clearable = page.getByRole('radiogroup', { name: 'Controlled' });
    await expect(clearable.getByRole('radio')).toHaveCount(6);
    await clearable.getByRole('radio', { name: '3 of 5' }).focus();
    await pressKeys(page, 'ArrowLeft', 'ArrowLeft', 'ArrowLeft');
    await expect(clearable.getByRole('radio', { name: 'No rating' })).toBeChecked();
    await expect(page.getByText('Rating: none.')).toBeVisible();
    await expect(clearable.locator('[data-part="star"][data-fill="empty"]')).toHaveCount(5);
    await pressKeys(page, 'ArrowRight');
    await expect(page.getByText('Rating: 1.')).toBeVisible();
  });

  test('a press chooses a star, hovering previews, and a press on the chosen star clears', async ({
    page,
  }) => {
    await open(page, id);
    const whole = page.getByRole('radiogroup', { name: 'Whole stars' });
    const stars = whole.locator('[data-part="star"]');
    const choices = whole.locator('label');
    await choices.nth(4).hover();
    await expect(stars.nth(4)).toHaveAttribute('data-fill', 'full');
    await expect(whole.getByRole('radio', { name: '3 of 5' })).toBeChecked();
    await page.mouse.move(0, 0);
    await expect(stars.nth(4)).toHaveAttribute('data-fill', 'empty');
    await choices.nth(4).click();
    await expect(whole.getByRole('radio', { name: '5 of 5' })).toBeChecked();
    // Not clearable: a second press keeps it.
    await choices.nth(4).click();
    await expect(whole.getByRole('radio', { name: '5 of 5' })).toBeChecked();

    // Half steps: the left half of the fourth star is 3.5.
    const halves = page.getByRole('radiogroup', { name: 'Half steps' });
    const fourth = await box(halves.locator('[data-part="star"]').nth(3));
    await page.mouse.click(fourth.x + fourth.width * 0.25, fourth.y + fourth.height / 2);
    await expect(halves.getByRole('radio', { name: '3.5 of 5' })).toBeChecked();
    await expect(halves.locator('[data-part="star"]').nth(3)).toHaveAttribute('data-fill', 'partial');

    const clearable = page.getByRole('radiogroup', { name: 'Controlled' });
    // The first label is "No rating", which takes no pointer; the fourth is the third star.
    await clearable.locator('label').nth(3).click();
    await expect(page.getByText('Rating: none.')).toBeVisible();
    await expectFocusKept(page);
    await clearable.locator('label').nth(2).click();
    await expect(page.getByText('Rating: 2.')).toBeVisible();

    // Disabled: nothing changes, and it is not a tab stop.
    const disabled = page.getByRole('radiogroup', { name: 'Disabled' });
    await disabled.locator('label').nth(4).click({ force: true });
    await expect(disabled.getByRole('radio', { name: '2 of 5' })).toBeChecked();
    await expect(disabled.getByRole('radio', { name: '2 of 5' })).toBeDisabled();
    // A choice is never under 24px wide or tall.
    for (const group of ['Whole stars', 'Small input']) {
      const target = await box(page.getByRole('radiogroup', { name: group }).locator('label').first());
      expect(Math.min(target.width, target.height)).toBeGreaterThanOrEqual(24);
    }
  });

  test('a field names and describes it, and its value is sent with the form', async ({ page }) => {
    await open(page, 'inputs-starrating--in-field');
    const quality = page.getByRole('radiogroup', { name: 'Quality' });
    await expect(quality).toHaveAccessibleDescription('How good the result was.');
    await expect(quality).toHaveAttribute('aria-required', 'true');
    const speed = page.getByRole('radiogroup', { name: 'Speed' });
    const service = page.getByRole('radiogroup', { name: 'Service' });
    await expect(service).toHaveAccessibleDescription('Choose a rating.');
    await expect(service).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByRole('img', { name: 'Last review 3.5 of 5' })).toBeVisible();
    // "No rating" is the checked choice, and sends nothing.
    await expect(speed.getByRole('radio', { name: 'No rating' })).toBeChecked();
    await expect(await submit(page)).toHaveText('Sent: [["quality","4"]]');
    await speed.getByRole('radio', { name: 'No rating' }).focus();
    await pressKeys(page, 'ArrowRight', 'ArrowRight', 'ArrowRight');
    await expect(await submit(page)).toHaveText('Sent: [["quality","4"],["speed","1.5"]]');
  });

  test('the empty star has 3:1 against the page and the surfaces, on every tint', async ({ page }) => {
    for (const context of contextPresets) {
      await open(page, id, { context });
      const ratios = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
        const probe = document.createElement('span');
        document.querySelector('[data-umbra="star-rating"]')!.append(probe);
        const rgb = (css: string) => {
          probe.style.color = css;
          ctx.clearRect(0, 0, 1, 1);
          ctx.fillStyle = getComputedStyle(probe).color;
          ctx.fillRect(0, 0, 1, 1);
          return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
        };
        const luminance = (c: number[]) => {
          const [r, g, b] = c.map((v) => {
            const s = v / 255;
            return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
          });
          return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
        };
        const empty = document.querySelector('[data-fill="empty"] > span > span')!;
        const star = luminance(rgb(getComputedStyle(empty).color));
        const out = [
          '--umbra-context-page-background',
          '--umbra-context-page-background-end',
          '--umbra-color-base-surface1',
          '--umbra-color-base-surface2',
        ].map((token) => {
          const surface = luminance(rgb(`var(${token})`));
          return (Math.max(star, surface) + 0.05) / (Math.min(star, surface) + 0.05);
        });
        probe.remove();
        return out;
      });
      for (const ratio of ratios) expect(ratio, context).toBeGreaterThanOrEqual(3);
    }
  });

  test('as it narrows the value text hides first, then the row is cut and the name stays', async ({
    page,
  }) => {
    await open(page, 'inputs-starrating--shrink');
    const rating = (width: number) => at(page, width).locator('[data-umbra="star-rating"]');
    await expect(rating(200).locator('[data-part="value"]')).toBeVisible();
    await expect(rating(130).locator('[data-part="value"]')).toHaveCount(0);
    for (const width of [200, 130]) {
      const [root, last] = [
        await box(rating(width)),
        await box(rating(width).locator('[data-part="star"]').nth(4)),
      ];
      expect(last.x + last.width).toBeLessThanOrEqual(root.x + root.width + 0.5);
    }
    await inside(at(page, 60), rating(60));
    await expect(rating(60)).toHaveAccessibleName('3.5 of 5');
    await expect(rating(60).locator('[data-part="star"]')).toHaveCount(5);
  });

  test('right to left: the first star is at the right, a partial star fills from the right', async ({
    page,
  }) => {
    await open(page, 'inputs-starrating--right-to-left');
    const stars = page.getByRole('img', { name: '2.5 of 5' }).locator('[data-part="star"]');
    expect((await box(stars.nth(0))).x).toBeGreaterThan((await box(stars.nth(4))).x);
    const [glyph, filled] = await stars.nth(2).evaluate((star) => {
      const g = star.firstElementChild!.getBoundingClientRect();
      const f = star.firstElementChild!.children[1]!.getBoundingClientRect();
      return [g.right, f.right, f.width / g.width];
    });
    expect(filled).toBeCloseTo(glyph!, 0);
    // The arrow keys follow what is drawn: left is towards more stars.
    const group = page.getByRole('radiogroup', { name: 'Half steps' });
    await group.getByRole('radio', { name: '1.5 of 5' }).focus();
    await pressKeys(page, 'ArrowLeft');
    await expect(group.getByRole('radio', { name: '2 of 5' })).toBeChecked();
    await pressKeys(page, 'ArrowRight', 'ArrowRight');
    await expect(group.getByRole('radio', { name: '1 of 5' })).toBeChecked();
  });
});

test.describe('Stepper', () => {
  const id = 'inputs-stepper--states';
  const spin = (page: Page, name: string) => page.getByRole('spinbutton', { name, exact: true });
  const stepperOf = (control: Locator) => control.locator('xpath=ancestor::*[@data-umbra="stepper"]');

  test('options: a spin button that the arrow keys, Home and End walk, going round', async ({ page }) => {
    await open(page, id);
    const value = spin(page, 'Controlled');
    await value.focus();
    await expect(value).toHaveAttribute('aria-valuetext', 'Zone 5');
    await expect(value).toHaveAttribute('aria-valuenow', '5');
    await expect(value).toHaveAttribute('aria-valuemin', '1');
    await expect(value).toHaveAttribute('aria-valuemax', '6');
    await pressKeys(page, 'ArrowRight');
    await expect(value).toHaveText('Zone 6');
    await pressKeys(page, 'ArrowRight');
    await expect(value).toHaveText('Zone 1');
    await expect(page.getByText('Chosen: zone-1.')).toBeVisible();
    await pressKeys(page, 'ArrowLeft');
    await expect(value).toHaveText('Zone 6');
    await pressKeys(page, 'Home');
    await expect(value).toHaveAttribute('aria-valuetext', 'Zone 1');
    await pressKeys(page, 'End', 'ArrowDown');
    await expect(value).toHaveAttribute('aria-valuetext', 'Zone 5');
    await pressKeys(page, 'ArrowUp');
    await expect(value).toHaveAttribute('aria-valuenow', '6');
    await expect(value).toBeFocused();
    // The current segment is the one that is taller: a cue that is not colour.
    const segments = stepperOf(value).locator('[data-part="segment"]');
    await expect(segments).toHaveCount(6);
    await expect(segments.nth(5)).toHaveAttribute('data-current', 'true');
    expect((await box(segments.nth(5))).height).toBeGreaterThan((await box(segments.nth(0))).height);
    // One tab stop: the buttons are passed over.
    await pressKeys(page, 'Tab');
    await expect(spin(page, 'Stops at the ends')).toBeFocused();
  });

  test('the buttons step without taking the focus, say the new value, and stop at an end', async ({
    page,
  }) => {
    await open(page, id);
    const value = spin(page, 'Stops at the ends');
    const stepper = stepperOf(value);
    const next = stepper.getByRole('button', { name: 'Next' });
    const previous = stepper.getByRole('button', { name: 'Previous' });
    await expect(next).toBeDisabled();
    await value.focus();
    await pressKeys(page, 'ArrowRight');
    await expect(value).toHaveText('Zone 6');
    await previous.click();
    await expect(value).toHaveText('Zone 5');
    await expect(value).toBeFocused();
    await expect(stepper.getByRole('status')).toHaveText('Zone 5');
    await expect(next).toBeEnabled();
    await next.click();
    await expect(stepper.getByRole('status')).toHaveText('Zone 6');
    await expect(next).toBeDisabled();
    await expectFocusKept(page);
    expect(Math.min((await box(previous)).width, (await box(previous)).height)).toBeGreaterThanOrEqual(24);

    // Without a value: nothing is current, and the first step lands on the first option.
    const empty = spin(page, 'No value');
    await expect(empty).toHaveText('—');
    await expect(empty).not.toHaveAttribute('aria-valuenow', /./);
    await stepperOf(empty).getByRole('button', { name: 'Next' }).click();
    await expect(empty).toHaveText('Zone 1');
  });

  test('numeric: min, max and step, the value text from formatValue, Page keys', async ({ page }) => {
    await open(page, id);
    const copies = spin(page, 'Copies');
    await copies.focus();
    await expect(copies).toHaveAttribute('aria-valuenow', '3');
    await expect(copies).toHaveAttribute('aria-valuemax', '8');
    await pressKeys(page, 'ArrowUp', 'End');
    await expect(copies).toHaveText('8');
    await pressKeys(page, 'ArrowUp');
    await expect(copies).toHaveText('8');
    await expect(stepperOf(copies).getByRole('button', { name: 'Next' })).toBeDisabled();

    const share = spin(page, 'Share');
    await share.focus();
    await expect(share).toHaveAttribute('aria-valuetext', '40%');
    await pressKeys(page, 'ArrowRight');
    await expect(share).toHaveAttribute('aria-valuenow', '45');
    await pressKeys(page, 'PageUp');
    await expect(share).toHaveAttribute('aria-valuenow', '55');
    // Twenty-one positions: no row of segments.
    await expect(stepperOf(share).locator('[data-part="indicator"]')).toHaveCount(0);

    const hour = spin(page, 'Hour');
    await hour.focus();
    await pressKeys(page, 'ArrowUp');
    await expect(hour).toHaveText('0');
  });

  test('read-only keeps its value and the focus; disabled is not a tab stop', async ({ page }) => {
    await open(page, id);
    const readOnly = spin(page, 'Read-only');
    await readOnly.focus();
    await expect(readOnly).toHaveAttribute('aria-readonly', 'true');
    await pressKeys(page, 'ArrowRight', 'End');
    await expect(readOnly).toHaveText('Zone 2');
    await expect(stepperOf(readOnly).getByRole('button', { name: 'Next' })).toBeDisabled();
    const disabled = spin(page, 'Disabled');
    await expect(disabled).toHaveAttribute('aria-disabled', 'true');
    await expect(disabled).not.toHaveAttribute('tabindex', /./);
    await expect(spin(page, 'Invalid')).toHaveAttribute('aria-invalid', 'true');
  });

  test('a field names and describes it, and its value is sent with the form', async ({ page }) => {
    await open(page, 'inputs-stepper--in-field');
    const target = spin(page, 'Target');
    await expect(target).toHaveAccessibleDescription('Where the result is sent.');
    const copies = page.getByRole('spinbutton', { name: 'Copies' });
    await expect(copies).toHaveAccessibleDescription('Choose between 1 and 8.');
    await expect(copies).toHaveAttribute('aria-invalid', 'true');
    await expect(copies).toHaveAttribute('aria-required', 'true');
    await target.focus();
    await pressKeys(page, 'ArrowRight');
    await expect(await submit(page)).toHaveText('Sent: [["target","zone-3"],["copies","8"]]');
  });

  test('as it narrows the label truncates, then the indicator hides', async ({ page }) => {
    await open(page, 'inputs-stepper--shrink');
    const stepper = (width: number) => at(page, width).locator('[data-umbra="stepper"]');
    const cut = (width: number) =>
      stepper(width)
        .locator('[data-part="value"] > span')
        .evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(await cut(220)).toBe(false);
    await expect(stepper(220).locator('[data-part="indicator"]')).toBeVisible();
    expect(await cut(130)).toBe(true);
    await expect(stepper(130).locator('[data-part="indicator"]')).toBeVisible();
    await expect(stepper(90).locator('[data-part="indicator"]')).toBeHidden();
    for (const width of [220, 130, 90]) {
      await inside(at(page, width), stepper(width));
      await expect(stepper(width).getByRole('button', { name: 'Next' })).toBeVisible();
      await expect(stepper(width).getByRole('spinbutton')).toHaveAttribute(
        'aria-valuetext',
        'A longer option',
      );
    }
  });

  test('right to left: Previous is at the right, and the arrow keys follow what is drawn', async ({
    page,
  }) => {
    await open(page, 'inputs-stepper--right-to-left');
    const value = spin(page, 'Options');
    const stepper = stepperOf(value);
    expect((await box(stepper.getByRole('button', { name: 'Previous' }))).x).toBeGreaterThan(
      (await box(stepper.getByRole('button', { name: 'Next' }))).x,
    );
    await value.focus();
    await pressKeys(page, 'ArrowLeft');
    await expect(value).toHaveText('Zone 3');
    await pressKeys(page, 'ArrowRight', 'ArrowRight');
    await expect(value).toHaveText('Zone 1');
    await pressKeys(page, 'ArrowUp');
    await expect(value).toHaveText('Zone 2');
  });
});

test.describe('SplitButton', () => {
  const id = 'inputs-splitbutton--variants';
  const group = (page: Page, text: string) =>
    page.locator('[data-umbra="split-button"]').filter({ hasText: text }).first();

  test('two tab stops; the caret opens a menu of related actions and takes the focus back', async ({
    page,
  }) => {
    await open(page, id);
    const split = group(page, 'Save');
    await expect(split).toHaveRole('group');
    const action = split.getByRole('button', { name: 'Save', exact: true });
    const caret = split.getByRole('button', { name: 'More options' });
    await group(page, 'Primary').getByRole('button', { name: 'More options' }).focus();
    await pressKeys(page, 'Tab');
    await expect(action).toBeFocused();
    await pressKeys(page, 'Enter');
    await expect(page.getByText('Last action: save.')).toBeVisible();
    await pressKeys(page, 'Tab');
    await expect(caret).toBeFocused();
    await expect(caret).toHaveAttribute('aria-haspopup', /true|menu/);
    await expect(caret).toHaveAttribute('aria-expanded', 'false');
    await pressKeys(page, 'Enter');
    const menu = page.getByRole('menu', { name: 'More options' });
    await expect(menu).toBeVisible();
    await expect(caret).toHaveAttribute('aria-expanded', 'true');
    await expect(menu.getByRole('menuitem')).toHaveText([
      'Save a copy',
      'Save as template',
      'Discard changes',
    ]);
    await pressKeys(page, 'ArrowDown', 'Enter');
    await expect(page.getByText('Last action: template.')).toBeVisible();
    await expect(menu).toBeHidden();
    await expect(caret).toBeFocused();
    // Escape closes it and gives the focus back too.
    await pressKeys(page, 'ArrowDown');
    await expect(menu).toBeVisible();
    await pressKeys(page, 'Escape');
    await expect(menu).toBeHidden();
    await expect(caret).toBeFocused();
    // A pointer opens it as well, under the caret.
    await caret.click();
    await expect(menu).toBeVisible();
    expect((await box(menu)).y).toBeGreaterThanOrEqual((await box(caret)).y + (await box(caret)).height);
  });

  test('the halves are one control to look at: joined, the same height, in the variant of Button', async ({
    page,
  }) => {
    await open(page, id);
    for (const text of ['Neutral', 'Primary', 'Ghost', 'Danger', 'Export']) {
      const split = group(page, text);
      const [action, caret] = [
        await box(split.locator('[data-part="action"]')),
        await box(split.locator('[data-part="caret"]')),
      ];
      expect(caret.height).toBe(action.height);
      expect(caret.y).toBe(action.y);
      // They touch, or overlap by the border.
      expect(caret.x - (action.x + action.width)).toBeLessThanOrEqual(0);
      expect(caret.width).toBeGreaterThanOrEqual(24);
    }
    const primary = group(page, 'Primary');
    await expect(primary.locator('[data-part="action"]')).toHaveAttribute('data-variant', 'primary');
    await expect(primary.locator('[data-part="caret"]')).toHaveAttribute('data-variant', 'primary');
    const colours = await primary
      .locator('button')
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor));
    expect(colours[0]).toBe(colours[1]);
    // Small is never under 24px.
    const small = page.locator('[data-umbra="split-button"][data-size="small"]').first();
    expect((await box(small)).height).toBeGreaterThanOrEqual(24);
    // The action can be a link.
    await expect(page.getByRole('link', { name: 'Open the report' })).toHaveAttribute('href', '#report');
  });

  test('loading blocks the action and leaves the menu; disabled stops both', async ({ page }) => {
    await open(page, id);
    const loading = group(page, 'Saving');
    const busy = loading.locator('[data-part="action"]');
    await expect(busy).toHaveAttribute('data-pending', 'true');
    await expect(busy.getByRole('progressbar', { name: 'Loading' })).toBeVisible();
    await busy.focus();
    await pressKeys(page, 'Tab', 'Enter');
    await expect(page.getByRole('menu')).toBeVisible();
    await pressKeys(page, 'Escape');
    const disabled = page
      .locator('[data-umbra="split-button"]')
      .filter({ has: page.locator('button:disabled') })
      .first();
    await expect(disabled.locator('button:disabled')).toHaveCount(2);
  });

  test('a field names, describes and disables the pair; the action submits the form', async ({ page }) => {
    await open(page, 'inputs-splitbutton--in-field');
    const draft = page.getByRole('group', { name: 'Draft' });
    await expect(draft).toHaveAccessibleDescription('Saved to your own space.');
    await expect(page.getByRole('group', { name: 'Export' })).toHaveAccessibleDescription(
      'Nothing to export yet.',
    );
    await expect(page.getByRole('group', { name: 'Archive' }).locator('button:disabled')).toHaveCount(2);
    await draft.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText(/^Sent: /)).toHaveText('Sent: [["draft","Draft 1"]]');
  });

  test('among actions in an overflow menu it is a row, and its menu a submenu', async ({ page }) => {
    await open(page, 'inputs-splitbutton--in-overflow-menu');
    // Where the header has room it is the control itself.
    await expect(at(page, 520).locator('[data-umbra="split-button"]')).toBeVisible();
    const narrow = at(page, 240);
    await expect(narrow.locator('[data-umbra="split-button"]')).toHaveCount(0);
    const more = narrow.getByRole('button', { name: 'More' });
    await more.focus();
    await pressKeys(page, 'Enter');
    const rows = page.getByRole('menu').first().getByRole('menuitem');
    await expect(rows).toHaveText(['Save', 'More ways to save', 'Share']);
    await expect(rows.nth(0)).toBeFocused();
    await pressKeys(page, 'ArrowDown');
    await expect(rows.nth(1)).toHaveAttribute('aria-haspopup', /menu|true/);
    await pressKeys(page, 'ArrowRight');
    const sub = page.getByRole('menu').nth(1);
    await expect(sub.getByRole('menuitem')).toHaveText([
      'Save a copy',
      'Save as template',
      'Discard changes',
    ]);
    await pressKeys(page, 'Escape', 'Escape');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(more).toBeFocused();
  });

  test('as it narrows the label truncates and the caret keeps its width', async ({ page }) => {
    await open(page, 'inputs-splitbutton--shrink');
    const widths: number[] = [];
    for (const width of [260, 150, 90]) {
      const split = at(page, width).locator('[data-umbra="split-button"]');
      await inside(at(page, width), split);
      widths.push((await box(split.locator('[data-part="caret"]'))).width);
      const cut = await split
        .locator('[data-part="label"]')
        .evaluate((el) => el.scrollWidth > el.clientWidth);
      expect(cut).toBe(width !== 260);
      await expect(split.getByRole('button', { name: 'Save the whole report' })).toBeVisible();
    }
    expect(new Set(widths).size).toBe(1);
  });

  test('right to left: the caret is at the left', async ({ page }) => {
    await open(page, 'inputs-splitbutton--right-to-left');
    const split = group(page, 'Neutral');
    expect((await box(split.locator('[data-part="caret"]'))).x).toBeLessThan(
      (await box(split.locator('[data-part="action"]'))).x,
    );
    await split.locator('[data-part="caret"]').focus();
    await pressKeys(page, 'Enter');
    await expect(page.getByRole('menu')).toBeVisible();
    await pressKeys(page, 'Escape');
  });
});

test.describe('Slider', () => {
  const id = 'inputs-slider--states';
  const slider = (page: Page, name: string) => page.getByRole('group', { name, exact: true });
  const thumb = (page: Page, name: string) => slider(page, name).getByRole('slider');

  test('one thumb: arrows, Page keys, Home and End', async ({ page }) => {
    await open(page, id);
    const input = thumb(page, 'Controlled');
    await input.focus();
    await expect(input).toHaveValue('30');
    await pressKeys(page, 'ArrowRight');
    await expect(input).toHaveValue('31');
    await pressKeys(page, 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'PageUp');
    await expect(input).toHaveValue('40');
    await pressKeys(page, 'PageDown', 'Home');
    await expect(input).toHaveValue('0');
    await pressKeys(page, 'End');
    await expect(input).toHaveValue('100');
    await expect(input).toHaveAttribute('aria-valuetext', '100');
    await expect(page.getByText('Value 100; range 20 to 60.')).toBeVisible();
    await expect(slider(page, 'Controlled').locator('[data-part="output"]')).toHaveText('100');
    // The step: marks at every 25.
    const marks = thumb(page, 'Marks');
    await marks.focus();
    await pressKeys(page, 'ArrowRight');
    await expect(marks).toHaveValue('75');
  });

  test('a range has two named thumbs that do not pass each other', async ({ page }) => {
    await open(page, id);
    const thumbs = thumb(page, 'Controlled range');
    await expect(thumbs).toHaveCount(2);
    await expect(thumbs.nth(0)).toHaveAccessibleName(/From/);
    await expect(thumbs.nth(1)).toHaveAccessibleName(/To/);
    await thumbs.nth(0).focus();
    await pressKeys(page, 'End');
    await expect(thumbs.nth(0)).toHaveValue('60');
    await pressKeys(page, 'Tab');
    await expect(thumbs.nth(1)).toBeFocused();
    await pressKeys(page, 'ArrowRight');
    await expect(page.getByText('range 60 to 61.')).toBeVisible();
    await expect(slider(page, 'Controlled range').locator('[data-part="output"]')).toHaveText('60 – 61');
    // The fill runs between the two thumbs.
    const fill = await box(slider(page, 'Controlled range').locator('[data-part="fill"]'));
    const track = await box(slider(page, 'Controlled range').locator('[data-part="track"]'));
    expect((fill.x - track.x) / track.width).toBeCloseTo(0.6, 1);
  });

  test('a press on the track and a drag of the thumb set the value', async ({ page }) => {
    await open(page, id);
    const input = thumb(page, 'Controlled');
    const track = await box(slider(page, 'Controlled').locator('[data-part="track"]'));
    await page.mouse.click(track.x + track.width * 0.8, track.y + track.height / 2);
    await expect(input).toHaveValue('80');
    const handle = await box(slider(page, 'Controlled').locator('[data-part="thumb"]'));
    expect(handle.x + handle.width / 2).toBeCloseTo(track.x + track.width * 0.8, 0);
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
    await page.mouse.down();
    await page.mouse.move(track.x + track.width * 0.25, track.y + track.height / 2, { steps: 4 });
    await page.mouse.up();
    await expect(input).toHaveValue('25');
    await expectFocusKept(page);
  });

  test('thresholds colour the fill by the band, with its pattern and label', async ({ page }) => {
    await open(page, id);
    const light = slider(page, 'Light load');
    const fill = light.locator('[data-part="fill"]');
    await expect(fill).toHaveAttribute('data-band', '0');
    await expect(fill).toHaveAttribute('data-pattern', 'diagonal');
    await expect(light.locator('[data-part="output"]')).toHaveText('20 · Light');
    await expect(light.getByRole('slider')).toHaveAttribute('aria-valuetext', '20, Light');
    // A tick where each band starts.
    await expect(light.locator('[data-part="boundary"]')).toHaveCount(2);
    const before = await fill.evaluate((el) => getComputedStyle(el).backgroundColor);
    await light.getByRole('slider').focus();
    await pressKeys(page, 'End');
    await expect(fill).toHaveAttribute('data-band', '2');
    // The top band is solid.
    await expect(fill).toHaveAttribute('data-pattern', 'none');
    await expect(light.getByRole('slider')).toHaveAttribute('aria-valuetext', '100, Heavy');
    expect(await fill.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe(before);
  });

  test('the bubble shows the value while the thumb has keyboard focus', async ({ page }) => {
    await open(page, id);
    const share = slider(page, 'Share');
    const bubble = share.locator('[data-part="bubble"]');
    await expect(share.locator('[data-part="output"]')).toHaveCount(0);
    await expect(bubble).toHaveCSS('opacity', '0');
    await page.keyboard.press('Tab');
    await share.getByRole('slider').focus();
    await pressKeys(page, 'ArrowRight');
    await expect(bubble).toHaveText('66%');
    await expect(bubble).toHaveCSS('opacity', '1');
    await expect(share.locator('[data-part="thumb"]')).toHaveAttribute('data-focus-visible', 'true');
  });

  test('read-only keeps its value; disabled is not a tab stop; invalid is said', async ({ page }) => {
    await open(page, id);
    const readOnly = thumb(page, 'Read-only');
    await readOnly.focus();
    await expect(readOnly).toHaveAttribute('aria-readonly', 'true');
    await pressKeys(page, 'ArrowRight', 'End');
    await expect(readOnly).toHaveValue('40');
    const track = await box(slider(page, 'Read-only').locator('[data-part="track"]'));
    await page.mouse.click(track.x + track.width * 0.9, track.y + track.height / 2);
    await expect(readOnly).toHaveValue('40');
    await expect(thumb(page, 'Disabled')).toBeDisabled();
    await expect(thumb(page, 'Invalid')).toHaveAttribute('aria-invalid', 'true');
    // The pointer target of a thumb, and the height of the track, are 24px.
    expect((await box(slider(page, 'Small').locator('[data-part="track"]'))).height).toBeGreaterThanOrEqual(
      24,
    );
  });

  test('scrubber: the value is in a box before the track; vertical runs from the bottom up', async ({
    page,
  }) => {
    await open(page, 'inputs-slider--scrubber-and-vertical');
    const position = slider(page, 'Position');
    const output = position.locator('[data-part="output"]');
    await expect(output).toHaveText('20:45');
    expect((await box(output)).x).toBeLessThan((await box(position.locator('[data-part="track"]'))).x);
    await position.getByRole('slider').focus();
    await pressKeys(page, 'ArrowRight');
    await expect(output).toHaveText('21:00');
    await expect(position.getByRole('slider')).toHaveAttribute('aria-valuetext', '21:00');

    const vertical = slider(page, 'Vertical');
    const before = await box(vertical.locator('[data-part="thumb"]'));
    await vertical.getByRole('slider').focus();
    await expect(vertical.getByRole('slider')).toHaveAttribute('aria-orientation', 'vertical');
    await pressKeys(page, 'ArrowUp', 'PageUp');
    await expect(vertical.getByRole('slider')).toHaveValue('71');
    expect((await box(vertical.locator('[data-part="thumb"]'))).y).toBeLessThan(before.y);
    // The fill starts at the bottom of the track.
    const [fill, track] = [
      await box(vertical.locator('[data-part="fill"]')),
      await box(vertical.locator('[data-part="track"]')),
    ];
    expect(fill.y + fill.height).toBeCloseTo(track.y + track.height, 0);
    expect(fill.height / track.height).toBeCloseTo(0.71, 1);
    expect(track.height).toBeGreaterThan(150);
  });

  test('a field names and describes it, and each thumb sends its value', async ({ page }) => {
    await open(page, 'inputs-slider--in-field');
    const volume = page.getByRole('slider', { name: 'Volume' });
    await expect(volume).toHaveAccessibleDescription('Of every sound.');
    const price = page.getByRole('group', { name: 'Price' }).getByRole('slider');
    await expect(price.nth(0)).toHaveAccessibleDescription('The range is too wide.');
    await expect(price.nth(1)).toHaveAttribute('aria-invalid', 'true');
    await expect(price.nth(1)).toHaveAttribute('aria-valuetext', '90 units');
    await volume.focus();
    await pressKeys(page, 'ArrowRight');
    await expect(await submit(page)).toHaveText('Sent: [["volume","71"],["price","10"],["price","90"]]');
  });

  test('as it narrows the mark labels hide first, then the output', async ({ page }) => {
    await open(page, 'inputs-slider--shrink');
    const sample = (width: number) => at(page, width).locator('[data-umbra="slider"]');
    await expect(sample(320).locator('[data-part="marks"]')).toBeVisible();
    await expect(sample(320).locator('[data-part="output"]')).toBeVisible();
    await expect(sample(200).locator('[data-part="marks"]')).toBeHidden();
    await expect(sample(200).locator('[data-part="output"]')).toBeVisible();
    await expect(sample(120).locator('[data-part="marks"]')).toBeHidden();
    await expect(sample(120).locator('[data-part="output"]')).toBeHidden();
    for (const width of [320, 200, 120]) {
      await inside(at(page, width), sample(width));
      await inside(at(page, width), sample(width).locator('[data-part="thumb"]'));
      // The first and last labels stay inside the slider.
      for (const label of await sample(width).locator('[data-part="markLabel"]:visible').all())
        await inside(sample(width), label);
      await expect(sample(width).getByRole('slider')).toHaveAttribute('aria-valuetext', '50');
    }
    expect((await box(sample(120).locator('[data-part="track"]'))).width).toBeGreaterThan(60);
  });

  test('right to left: the low end is at the right, and the arrow keys follow what is drawn', async ({
    page,
  }) => {
    await open(page, 'inputs-slider--right-to-left');
    const value = slider(page, 'Value');
    const track = await box(value.locator('[data-part="track"]'));
    const handle = await box(value.locator('[data-part="thumb"]'));
    expect((handle.x + handle.width / 2 - track.x) / track.width).toBeCloseTo(0.75, 1);
    const fill = await box(value.locator('[data-part="fill"]'));
    expect(fill.x + fill.width).toBeCloseTo(track.x + track.width, 0);
    await value.getByRole('slider').focus();
    await pressKeys(page, 'ArrowLeft');
    await expect(value.getByRole('slider')).toHaveValue('26');
    await pressKeys(page, 'ArrowRight', 'ArrowRight');
    await expect(value.getByRole('slider')).toHaveValue('24');
    // The box of a scrubber is before the track: at the right.
    const position = slider(page, 'Position');
    expect((await box(position.locator('[data-part="output"]'))).x).toBeGreaterThan(
      (await box(position.locator('[data-part="track"]'))).x,
    );
  });
});

test.describe('ColorScaleEditor', () => {
  const id = 'inputs-colorscaleeditor--editor';
  const froms = (scope: Locator) => scope.locator('[data-part="preview"] [data-part="from"]');
  const field = (page: Page, name: string) => page.getByRole('spinbutton', { name, exact: true });

  test('the preview: a list of numbered swatches, each with its colour, pattern and label', async ({
    page,
  }) => {
    await open(page, 'inputs-colorscaleeditor--preview-and-states');
    const preview = page.getByRole('group', { name: 'Five steps' });
    await expect(preview.getByRole('listitem')).toHaveCount(5);
    await expect(froms(preview)).toHaveText(['1', '5', '9', '13', '17']);
    await expect(preview.getByRole('listitem').nth(0)).toHaveText('1Poor, Ramp 1 (lowest)');
    // Read-only: nothing to operate.
    await expect(preview.locator('button, input, [role="slider"]')).toHaveCount(0);
    // The cue that is not colour: hatched, by position; the top band is solid.
    const chips = preview.locator('[data-part="chip"]');
    await expect(chips.nth(0)).toHaveAttribute('data-pattern', 'diagonal');
    await expect(chips.nth(1)).toHaveAttribute('data-pattern', 'vertical');
    await expect(chips.nth(4)).toHaveAttribute('data-pattern', 'none');
    const free = page.getByRole('group', { name: 'Free colours' });
    await expect(free.getByRole('listitem').nth(1)).toHaveText('4, #c2410c');
    expect(
      await free
        .locator('[data-part="chip"]')
        .nth(1)
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    ).toBe('rgb(194, 65, 12)');
  });

  test('a handle on each boundary: arrow keys move it, and it stays between its neighbours', async ({
    page,
  }) => {
    await open(page, id);
    const editor = page.getByRole('group', { name: 'Value colours' });
    const handles = editor.getByRole('slider');
    await expect(handles).toHaveCount(4);
    await expect(handles.nth(0)).toHaveAccessibleName(/Stop 2/);
    await handles.nth(0).focus();
    await expect(handles.nth(0)).toHaveValue('5');
    await pressKeys(page, 'ArrowRight');
    await expect(froms(editor)).toHaveText(['1', '6', '9', '13', '17']);
    await expect(field(page, 'Stop 2: From')).toHaveValue('6');
    // One step clear of the next stop (9), and of the bottom of the scale (1).
    await pressKeys(page, 'End');
    await expect(froms(editor)).toHaveText(['1', '8', '9', '13', '17']);
    await pressKeys(page, 'Home');
    await expect(froms(editor)).toHaveText(['1', '2', '9', '13', '17']);
    await expect(handles.nth(0)).toBeFocused();
    // Dragging the last handle to the end of the track: the top of the scale.
    const last = await box(editor.locator('[data-part="handle"]').nth(3));
    const track = await box(editor.locator('[data-part="track"]'));
    await page.mouse.move(last.x + last.width / 2, last.y + last.height / 2);
    await page.mouse.down();
    await page.mouse.move(track.x + track.width + 40, last.y + last.height / 2, { steps: 4 });
    await page.mouse.up();
    await expect(froms(editor)).toHaveText(['1', '2', '9', '13', '20']);
    expect((await box(editor.locator('[data-part="handle"]').first())).width).toBeGreaterThanOrEqual(10);
  });

  test('the number field of a boundary: typed values are held between the neighbours', async ({ page }) => {
    await open(page, id);
    const editor = page.getByRole('group', { name: 'Value colours' });
    await expect(field(page, 'Stop 1: From')).toHaveAttribute('readonly', '');
    const third = field(page, 'Stop 3: From');
    await third.fill('11');
    await expect(froms(editor)).toHaveText(['1', '5', '11', '13', '17']);
    // Out of range: kept as typed and marked, and the value stays until the field is left.
    await third.fill('99');
    await expect(third).toHaveAttribute('aria-invalid', 'true');
    await expect(froms(editor)).toHaveText(['1', '5', '11', '13', '17']);
    await pressKeys(page, 'Tab');
    await expect(third).toHaveValue('12');
    await expect(third).not.toHaveAttribute('aria-invalid', 'true');
    await expect(froms(editor)).toHaveText(['1', '5', '12', '13', '17']);
    await third.fill('');
    await third.blur();
    await expect(third).toHaveValue('12');
  });

  test('a colour is a tone, a step of the ramp, or a free colour from the colour field', async ({ page }) => {
    await open(page, id);
    const editor = page.getByRole('group', { name: 'Value colours' });
    const chip = editor.locator('[data-part="preview"] [data-part="chip"]').nth(1);
    const colour = () => chip.evaluate((el) => getComputedStyle(el).backgroundColor);
    const before = await colour();
    const select = editor.getByRole('button', { name: /Stop 2: Colour/ });
    await select.focus();
    await pressKeys(page, 'Enter');
    await page.getByRole('option', { name: 'Danger' }).click();
    await expectFocusKept(page);
    await expect(select).toContainText('Danger');
    expect(await colour()).not.toBe(before);
    await expect(editor.locator('input[type="color"]')).toHaveCount(0);
    await select.click();
    await page.getByRole('option', { name: 'Custom colour' }).click();
    const free = editor.getByLabel('Stop 2: Custom colour');
    await expect(free).toBeVisible();
    await free.fill('#00ff00');
    expect(await colour()).toBe('rgb(0, 255, 0)');
    await expect(editor.getByRole('listitem').nth(1)).toContainText('#00ff00');
    // A label is shown in the preview.
    await editor.getByRole('textbox', { name: 'Stop 2: Label' }).fill('Weak');
    await expect(editor.getByRole('listitem').nth(1)).toContainText('Weak');
  });

  test('add, remove and reset keep the focus and are announced; the limits disable them', async ({
    page,
  }) => {
    await open(page, id);
    const editor = page.getByRole('group', { name: 'Value colours' });
    const add = editor.getByRole('button', { name: 'Add stop' });
    const reset = editor.getByRole('button', { name: 'Reset' });
    await expect(reset).toBeDisabled();
    await add.focus();
    await pressKeys(page, 'Enter');
    // In the middle of the widest band, and the focus is in its number field.
    await expect(froms(editor)).toHaveText(['1', '3', '5', '9', '13', '17']);
    await expect(field(page, 'Stop 2: From')).toBeFocused();
    await expect(editor.getByRole('status')).toHaveText('Stop 2 added');
    await expect(reset).toBeEnabled();
    await add.click();
    await add.click();
    await expect(editor.getByRole('listitem')).toHaveCount(8);
    // Eight is the most.
    await expect(add).toBeDisabled();
    await expectFocusKept(page);

    const remove = editor.getByRole('button', { name: 'Stop 8: Remove' });
    await remove.focus();
    await pressKeys(page, 'Enter');
    await expect(editor.getByRole('listitem')).toHaveCount(7);
    await expect(editor.getByRole('status')).toHaveText('Stop 8 removed');
    await expect(editor.getByRole('button', { name: 'Stop 7: Remove' })).toBeFocused();
    // Removing the first stop: the next one becomes the bottom of the scale.
    await editor.getByRole('button', { name: 'Stop 1: Remove' }).focus();
    await pressKeys(page, 'Enter');
    await expect(froms(editor).first()).toHaveText('1');
    await expect(editor.getByRole('button', { name: 'Stop 1: Remove' })).toBeFocused();

    await reset.focus();
    await pressKeys(page, 'Enter');
    await expect(froms(editor)).toHaveText(['1', '5', '9', '13', '17']);
    await expect(editor.getByRole('status')).toHaveText('Scale reset');
    await expect(reset).toBeDisabled();
    await expect(add).toBeFocused();
  });

  test('at the fewest stops nothing can be removed; a disabled editor takes no input', async ({ page }) => {
    await open(page, 'inputs-colorscaleeditor--preview-and-states');
    const two = page.getByRole('group', { name: 'Two stops' });
    await expect(two.getByRole('button', { name: 'Stop 1: Remove' })).toBeDisabled();
    await expect(two.getByRole('button', { name: 'Stop 2: Remove' })).toBeDisabled();
    await expect(two.getByLabel('Stop 2: Custom colour')).toHaveValue('#d946ef');
    // Removing down to the fewest: the focus goes to Add when the remove buttons switch off.
    await two.getByRole('button', { name: 'Add stop' }).click();
    await two.getByRole('button', { name: 'Stop 3: Remove' }).focus();
    await pressKeys(page, 'Enter');
    await expect(two.getByRole('button', { name: 'Add stop' })).toBeFocused();
    const disabled = page.getByRole('group', { name: 'Disabled editor' });
    await expect(disabled.locator('button:not(:disabled), input:not(:disabled)')).toHaveCount(0);
  });

  test('its value is the thresholds of the other components: they recolour as it is edited', async ({
    page,
  }) => {
    await open(page, 'inputs-colorscaleeditor--live-with-consumers');
    const band = (selector: string) => page.locator(selector).first();
    const pill = page.locator('[data-umbra="value-pill"]').filter({ hasText: '48' });
    const bar = page.locator('[data-umbra="progress-bar"]').filter({ hasText: 'Task 48' });
    await expect(pill).toHaveAttribute('data-band', '1');
    await expect(bar).toHaveAttribute('data-band', '1');
    await expect(band('[data-umbra="level-meter"]')).toHaveAttribute('data-band', '1');
    await expect(bar).toContainText('Medium');
    const donut = page.locator('[data-umbra="donut-chart"] [data-band]').first();
    await expect(donut).toHaveAttribute('data-band', '1');
    const chartBars = page.locator('[data-umbra="bar-chart"] [data-band]');
    await expect(chartBars.nth(1)).toHaveAttribute('data-band', '1');
    // Move the second boundary above 48: everything that showed 48 is in the first band.
    await field(page, 'Stop 2: From').fill('50');
    await expect(pill).toHaveAttribute('data-band', '0');
    await expect(bar).toHaveAttribute('data-band', '0');
    await expect(bar).toContainText('Low');
    await expect(band('[data-umbra="level-meter"]')).toHaveAttribute('data-band', '0');
    await expect(donut).toHaveAttribute('data-band', '0');
    await expect(chartBars.nth(1)).toHaveAttribute('data-band', '0');
    // A free colour reaches them too.
    await page.getByRole('button', { name: /Stop 1: Colour/ }).click();
    await page.getByRole('option', { name: 'Custom colour' }).click();
    await page.getByLabel('Stop 1: Custom colour').fill('#0000ff');
    await expect(pill).toHaveCSS('background-color', 'rgb(0, 0, 255)');
    // Controlled, with a default to go back to.
    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(pill).toHaveAttribute('data-band', '1');
    await expectFocusKept(page);
  });

  test('a field names and describes it; the stops are sent as JSON, ascending and JSON-safe', async ({
    page,
  }) => {
    await open(page, 'inputs-colorscaleeditor--in-field');
    const editor = page.getByRole('group', { name: 'Completion colours' });
    await expect(editor).toHaveAccessibleDescription(
      'From this value up, until the next stop. Two stops have the same colour.',
    );
    // The fields inside are named by the editor, not by the field around it.
    await expect(field(page, 'Stop 2: From')).toHaveValue('40');
    await editor.getByRole('button', { name: 'Add stop' }).click();
    const sent = await (await submit(page)).textContent();
    const [[name, json]] = JSON.parse(sent!.replace('Sent: ', '')) as [[string, string]];
    expect(name).toBe('scale');
    expect(JSON.parse(json)).toEqual([
      { from: 0, tone: 'danger', label: 'Low' },
      { from: 40, tone: 'warning', label: 'Medium' },
      { from: 70, tone: 'ramp-1' },
    ]);
  });

  test('as it narrows the label fields hide first, then the track', async ({ page }) => {
    await open(page, 'inputs-colorscaleeditor--shrink');
    const editor = (width: number) => at(page, width).locator('[data-umbra="color-scale-editor"]');
    await expect(editor(520).getByRole('textbox', { name: 'Stop 1: Label' })).toBeVisible();
    await expect(editor(520).locator('[data-part="track"]')).toBeVisible();
    await expect(editor(400).getByRole('textbox', { name: 'Stop 1: Label' })).toBeHidden();
    await expect(editor(400).locator('[data-part="track"]')).toBeVisible();
    await expect(editor(270).getByRole('textbox', { name: 'Stop 1: Label' })).toBeHidden();
    await expect(editor(270).locator('[data-part="track"]')).toBeHidden();
    for (const width of [520, 400, 270]) {
      await inside(at(page, width), editor(width));
      // Every boundary keeps its number field, its colour and its remove button.
      for (const control of [
        editor(width).getByRole('spinbutton', { name: 'Stop 2: From' }),
        editor(width).getByRole('button', { name: /Stop 2: Colour/ }),
        editor(width).getByRole('button', { name: 'Stop 2: Remove' }),
      ]) {
        await expect(control).toBeVisible();
        await inside(editor(width), control);
      }
    }
  });

  test('right to left: the bottom of the scale is at the right', async ({ page }) => {
    await open(page, 'inputs-colorscaleeditor--right-to-left');
    const editor = page.getByRole('group', { name: 'Completion colours' });
    const bands = editor.locator('[data-part="band"]');
    expect((await box(bands.nth(0))).x).toBeGreaterThan((await box(bands.nth(2))).x);
    const handle = editor.getByRole('slider').first();
    await handle.focus();
    await pressKeys(page, 'ArrowLeft');
    await expect(handle).toHaveValue('41');
    await pressKeys(page, 'ArrowRight', 'ArrowRight');
    await expect(handle).toHaveValue('39');
  });
});
