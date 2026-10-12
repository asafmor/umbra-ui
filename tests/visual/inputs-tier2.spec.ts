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

    // Half steps by pointer: see "StarRating, review 1".

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

  test('as it narrows the value text hides first, then a display is one star and the number, and the name stays', async ({
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
    // Review 2, OP-4: a display too narrow for its row is one star and the value, not a row cut at its end.
    await expect(rating(60)).toHaveAttribute('data-compact', '');
    await expect(rating(60).locator('[data-part="star"]')).toHaveCount(1);
    await expect(rating(60).locator('[data-part="value"]')).toHaveText('3.5');
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

// Review 1 of Milestone 2 (plan/reviews/milestone-2.md): one test per finding, each failing without
// its fix. The form findings (I-4, I-7, I-8, I-10, I-13) are in forms.spec.ts, for every input at once.
test.describe('Slider, review 1', () => {
  const id = 'inputs-slider--edge-cases';
  const slider = (page: Page, name: string) => page.getByRole('group', { name }).first();
  const trackWidth = async (root: Locator) => (await box(root.locator('[data-part="track"]'))).width;

  test('I-1: locking and unlocking an uncontrolled slider keeps the value the user chose', async ({
    page,
  }) => {
    await open(page, id);
    const thumb = page.getByRole('slider', { name: 'Lockable' });
    await thumb.focus();
    await pressKeys(page, 'End');
    await expect(thumb).toHaveValue('100');
    await page.getByRole('button', { name: 'Lock', exact: true }).click();
    await expect(thumb).toHaveValue('100');
    await thumb.focus();
    await pressKeys(page, 'Home');
    await expect(thumb).toHaveValue('100');
    await page.getByRole('button', { name: 'Unlock' }).click();
    await expect(thumb).toHaveValue('100');
    await thumb.focus();
    await pressKeys(page, 'ArrowLeft');
    await expect(thumb).toHaveValue('99');
  });

  test('I-2: a long band label never takes the track: it is cut, and the slider stays in its slot', async ({
    page,
  }) => {
    await open(page, id);
    for (const width of [260, 200, 130]) {
      const root = at(page, width).locator('[data-umbra="slider"]');
      expect(await trackWidth(root), `track at ${width}`).toBeGreaterThanOrEqual(48);
      await inside(at(page, width), root);
    }
    // At every width of the slot, pixel by pixel: the track keeps its least width and nothing sticks out.
    const worst = await at(page, 260).evaluate((slot) => {
      const root = slot.querySelector<HTMLElement>('[data-umbra="slider"]')!;
      const track = root.querySelector<HTMLElement>('[data-part="track"]')!;
      let least = Infinity;
      let over = 0;
      for (let width = 320; width >= 100; width--) {
        slot.style.width = `${width}px`;
        least = Math.min(least, track.getBoundingClientRect().width);
        over = Math.max(over, root.scrollWidth - root.clientWidth);
      }
      slot.style.width = '';
      return { least, over };
    });
    expect(worst.least).toBeGreaterThanOrEqual(48);
    expect(worst.over).toBe(0);
    // Cut text has its whole text in a tooltip.
    const output = at(page, 200).locator('[data-part="output"]');
    await at(page, 200).evaluate((slot) => (slot.style.width = '170px'));
    await output.hover();
    await expect(page.getByRole('tooltip')).toHaveText('100 · Very high');
  });

  test('I-3: a drag across a band with a longer label moves one pixel at a time: the track keeps its size', async ({
    page,
  }) => {
    await open(page, id);
    const root = at(page, 260).locator('[data-umbra="slider"]');
    const thumb = root.getByRole('slider');
    const width = await trackWidth(root);
    const handle = await box(root.locator('[data-part="thumb"]'));
    const y = handle.y + handle.height / 2;
    let x = handle.x + handle.width / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    let last = Number(await thumb.inputValue());
    expect(last).toBe(60);
    const perPixel = 100 / width;
    // From 60 to past 90: over the boundary at 70, where the label changes from "Low" to "Very high".
    for (let step = 0; step < Math.ceil(32 / perPixel); step++) {
      x += 1;
      await page.mouse.move(x, y);
      const value = Number(await thumb.inputValue());
      expect(value - last, `at ${value}`).toBeGreaterThanOrEqual(0);
      expect(value - last, `at ${value}`).toBeLessThanOrEqual(Math.ceil(perPixel) + 1);
      expect(await trackWidth(root)).toBe(width);
      last = value;
    }
    await page.mouse.up();
    expect(last).toBeGreaterThan(85);
    await expect(root.locator('[data-part="output"]')).toContainText('Very high');
  });

  test('I-14: the bar of a scrubber is a pointer target 24px wide', async ({ page }) => {
    await open(page, 'inputs-slider--scrubber-and-vertical');
    const thumb = slider(page, 'Position').locator('[data-part="thumb"]');
    const bar = await box(thumb);
    expect(bar.width).toBeLessThan(24);
    const centre = { x: bar.x + bar.width / 2, y: bar.y + bar.height / 2 };
    for (const [dx, dy] of [
      [-11, 0],
      [11, 0],
      [0, -11],
      [0, 11],
    ] as const) {
      const hit = await page.evaluate(
        ([x, y]) => !!document.elementFromPoint(x, y)?.closest('[data-part="thumb"]'),
        [centre.x + dx, centre.y + dy] as const,
      );
      expect(hit, `${dx}, ${dy}`).toBe(true);
    }
  });

  test('I-15: a value given twice among the marks is drawn twice, with nothing logged', async ({ page }) => {
    const logged: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') logged.push(message.text());
    });
    await open(page, id);
    await expect(slider(page, 'Repeated marks').locator('[data-part="tick"]')).toHaveCount(4);
    expect(logged).toEqual([]);
  });
});

test.describe('StarRating, review 1', () => {
  test('half steps: a press chooses the whole star (a target of 24px), a drag along the row a half', async ({
    page,
  }) => {
    await open(page, 'inputs-starrating--states');
    const halves = page.getByRole('radiogroup', { name: 'Half steps' });
    const star = (index: number) => box(halves.locator('[data-part="star"]').nth(index));
    const fourth = await star(3);
    expect(fourth.width).toBeGreaterThanOrEqual(24);
    // Both halves of the star are one target: the choice "4 of 5".
    for (const share of [0.1, 0.4, 0.6, 0.9]) {
      const target = await page.evaluate(
        ([x, y]) => document.elementFromPoint(x, y)?.closest('label')?.querySelector('input')?.value,
        [fourth.x + fourth.width * share, fourth.y + fourth.height / 2] as const,
      );
      expect(target, `at ${share}`).toBe('4');
    }
    await page.mouse.click(fourth.x + fourth.width * 0.25, fourth.y + fourth.height / 2);
    await expect(halves.getByRole('radio', { name: '4 of 5', exact: true })).toBeChecked();

    // A drag: the stars follow the pointer in half steps, and the value is taken where it is let go.
    const [first, third] = [await star(0), await star(2)];
    const y = first.y + first.height / 2;
    await page.mouse.move(first.x + first.width / 2, y);
    await page.mouse.down();
    await page.mouse.move(third.x + third.width * 0.25, y, { steps: 8 });
    await expect(halves.locator('[data-part="star"]').nth(2)).toHaveAttribute('data-fill', 'partial');
    await page.mouse.up();
    await expect(halves.getByRole('radio', { name: '2.5 of 5' })).toBeChecked();
    await expect(halves.locator('[data-part="value"]')).toHaveText('2.5');
    await expectFocusKept(page);
    // A drag that ends on the star it began on, in its first half.
    await page.mouse.move(fourth.x + fourth.width * 0.9, y);
    await page.mouse.down();
    await page.mouse.move(fourth.x + fourth.width * 0.2, y, { steps: 6 });
    await page.mouse.up();
    await expect(halves.getByRole('radio', { name: '3.5 of 5' })).toBeChecked();
    // The focus is on the value the drag chose, so the keyboard goes on from there, in halves.
    await expect(halves.getByRole('radio', { name: '3.5 of 5' })).toBeFocused();
    await pressKeys(page, 'ArrowRight');
    await expect(halves.getByRole('radio', { name: '4 of 5', exact: true })).toBeChecked();
  });

  test('I-11: loading holds the layout: the placeholder is as large as the stars with their value', async ({
    page,
  }) => {
    await open(page, 'inputs-starrating--loading');
    for (const size of ['small', 'default', 'large']) {
      const [loading, loaded] = await page
        .locator(`[data-size-row="${size}"] [data-umbra="star-rating"]`)
        .evaluateAll((els) => els.map((el) => el.getBoundingClientRect()).map((r) => [r.width, r.height]));
      expect(Math.abs(loading![0]! - loaded![0]!), `${size} width`).toBeLessThanOrEqual(2);
      expect(Math.abs(loading![1]! - loaded![1]!), `${size} height`).toBeLessThanOrEqual(1);
    }
  });
});

test.describe('SplitButton, review 1', () => {
  test('I-9, I-16: the root takes an id, and the callbacks get what their types say and no event', async ({
    page,
  }) => {
    await open(page, 'inputs-splitbutton--callbacks');
    await expect(page.locator('#reported-split')).toHaveAttribute('data-umbra', 'split-button');
    await page.getByRole('button', { name: 'Report', exact: true }).click();
    await expect(page.getByText('Last: press with 0 arguments.')).toBeVisible();
    await page.getByRole('button', { name: 'More options' }).click();
    await page.getByRole('menuitem', { name: 'Save a copy' }).click();
    await expect(page.getByText('Last: action copy with 1 arguments.')).toBeVisible();
    // The same for `Button` itself, which the action is made of.
    await page.getByRole('button', { name: 'Plain button' }).click();
    await expect(page.getByText('Last: button press with 0 arguments.')).toBeVisible();
  });
});

test.describe('I-6: two rows with one id', () => {
  const id = 'integration-duplicate-ids--rows';
  const names = ['First', 'Second', 'Third'];

  test('Menu and SplitButton draw every row, and report the id the app gave', async ({ page }) => {
    await open(page, id);
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(page.getByRole('menuitem')).toHaveText(names);
    await pressKeys(page, 'ArrowDown', 'ArrowDown', 'ArrowDown');
    await expect(page.getByRole('menuitem', { name: 'Third' })).toBeFocused();
    await pressKeys(page, 'Escape');
    await page.getByRole('button', { name: 'More saves' }).click();
    await expect(page.getByRole('menuitem')).toHaveText(names);
    await pressKeys(page, 'Escape');
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();
  });

  test('Select and SearchField draw every option; choosing the second of the two gives their id', async ({
    page,
  }) => {
    await open(page, id);
    await page.locator('[data-umbra="select"] [data-part="trigger"]').click();
    await expect(page.getByRole('option')).toHaveText(names);
    await page.getByRole('option', { name: 'Second' }).click();
    await expect(page.locator('[data-umbra="select"] [data-part="trigger"]')).toContainText('First');
    await page.getByRole('combobox', { name: 'Search' }).fill('s');
    await expect(page.getByRole('option')).toHaveText(names);
    await pressKeys(page, 'Escape');
  });

  test('List, Tabs and SegmentedFilter draw every row and stay usable', async ({ page }) => {
    await open(page, id);
    await expect(page.getByRole('grid', { name: 'List' }).getByRole('row')).toHaveText(names);
    await expect(page.getByRole('tab')).toHaveText(names);
    await page.getByRole('tab', { name: 'Third' }).click();
    await expect(page.getByRole('tabpanel')).toHaveText('Panel of Third');
    const segments = page.getByRole('radiogroup', { name: 'Segments' }).getByRole('radio');
    await expect(segments).toHaveText(names);
    await segments.nth(0).click();
    await expect(segments.nth(0)).toBeChecked();
    await expectFocusKept(page);
  });
});

test.describe('ColorScaleEditor, review 1', () => {
  const id = 'inputs-colorscaleeditor--tight';

  test('I-17: at 180px the colour of a stop still shows beside the caret of its choice', async ({ page }) => {
    await open(page, id);
    const editor = at(page, 180).getByRole('group', { name: 'At 180' });
    await inside(at(page, 180), editor);
    for (const row of await editor.locator('[data-part="stop"]').all()) {
      const select = row.locator('[data-umbra="select"]');
      const swatch = await box(select.locator('[data-part="swatch"]'));
      const frame = await box(select);
      expect(frame.width).toBeGreaterThanOrEqual(60);
      expect(swatch.width).toBeGreaterThanOrEqual(10);
      expect(swatch.x).toBeGreaterThanOrEqual(frame.x);
      expect(swatch.x + swatch.width).toBeLessThanOrEqual(frame.x + frame.width);
      await inside(editor, row);
      expect((await box(row.locator('[data-umbra="text-field"]').first())).width).toBeGreaterThanOrEqual(44);
    }
  });

  test('in a short slot the rows scroll in a ScrollArea, and the keyboard reaches the last row', async ({
    page,
  }) => {
    await open(page, id);
    const slot = page.locator('[data-case="short"]');
    const editor = slot.getByRole('group', { name: 'Short' });
    const [outer, inner] = [await box(slot), await box(editor)];
    expect(inner.y + inner.height).toBeLessThanOrEqual(outer.y + outer.height + 0.5);
    const rows = editor.locator('[data-part="stops"]');
    await expect(rows).toHaveAttribute('data-umbra', 'scroll-area');
    const viewport = rows.locator('[data-part="viewport"]');
    expect(await viewport.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
    // The library's thin thumb, not the browser's bar: the viewport is as wide as the rows' area.
    expect(
      await viewport.evaluate((el) => (el as HTMLElement).offsetWidth - el.clientWidth),
    ).toBeLessThanOrEqual(8);
    const last = editor.getByRole('spinbutton', { name: 'Stop 5: From' });
    await last.focus();
    await expectFocusKept(page);
    const [field, area] = [await box(last), await box(rows)];
    expect(field.y).toBeGreaterThanOrEqual(area.y - 0.5);
    expect(field.y + field.height).toBeLessThanOrEqual(area.y + area.height + 0.5);
  });
});

// Whatever an app puts among actions that overflow, the "more" menu never breaks (decision 07,
// "Controls among actions that overflow"; review 3, F1).
test.describe('actions that overflow: anything among them', () => {
  const id = 'integration-actions-that-overflow--any-node';
  const card = (page: Page, name: string) => page.locator(`[data-case="${name}"]`);
  const openMore = async (page: Page, name: string) => {
    await card(page, name).getByRole('button', { name: 'More actions' }).click();
    await expectFocusKept(page);
  };

  test('a Tag and a plain element stay in the row; the buttons move, and the menu opens', async ({
    page,
  }) => {
    await open(page, id);
    for (const [name, text] of [
      ['Tag', 'Beta'],
      ['Span', 'Today'],
    ] as const) {
      await expect(card(page, name).locator('[data-part="actions"]').getByText(text)).toBeVisible();
      await openMore(page, name);
      await expect(page.getByRole('menuitem')).toHaveText(['Refresh', 'Export']);
      await pressKeys(page, 'Escape');
      await expect(card(page, name).getByRole('button', { name: 'More actions' })).toBeFocused();
    }
    await expect(page.locator('[data-case]')).toHaveCount(5);
  });

  test('a component of the app: a button inside it moves, a control inside it stays and still works', async ({
    page,
  }) => {
    await open(page, id);
    const stepper = card(page, 'Wrapped').getByRole('spinbutton', { name: 'Own stepper' });
    await expect(stepper).toBeVisible();
    await stepper.focus();
    await pressKeys(page, 'ArrowRight');
    await expect(stepper).toHaveAttribute('aria-valuetext', 'Week');
    await openMore(page, 'Wrapped');
    await expect(page.getByRole('menuitem')).toHaveText(['Refresh', 'Export', 'Archive']);
    await pressKeys(page, 'Escape');
    // The control kept its state through the menu.
    await expect(stepper).toHaveAttribute('aria-valuetext', 'Week');

    const select = card(page, 'Select').locator('[data-umbra="select"] [data-part="trigger"]');
    await expect(select).toBeVisible();
    await openMore(page, 'Select');
    await expect(page.getByRole('menuitem')).toHaveText(['Refresh', 'Export']);
    await pressKeys(page, 'Escape');
    await select.click();
    await page.getByRole('option', { name: 'Open' }).click();
    await expect(select).toContainText('Open');
  });

  test('a component that mixes a button with what is no action is left out of the menu, which stays whole', async ({
    page,
  }) => {
    await open(page, id);
    await openMore(page, 'Mixture');
    await expect(page.getByRole('menuitem')).toHaveText(['Refresh', 'Export']);
    await pressKeys(page, 'ArrowDown', 'ArrowDown');
    await expect(page.getByRole('menuitem', { name: 'Export' })).toBeFocused();
    await pressKeys(page, 'Escape');
    await expect(page.locator('[data-case]')).toHaveCount(5);
  });
});
