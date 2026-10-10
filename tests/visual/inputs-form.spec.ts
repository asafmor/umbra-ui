import { expect, test, type Locator, type Page } from '@playwright/test';

// Checkbox, Radio, Toggle, TextField and FormField: keyboard, label clicks, form values, the wiring a
// screen reader depends on, and each step of "show less as it narrows".
const open = async (page: Page, id: string, width = 1280, height = 720) => {
  await page.setViewportSize({ width, height });
  await page.goto(`/iframe.html?id=${id}&viewMode=story`);
  await page.locator('#storybook-root > *').first().waitFor();
  await page.evaluate(() => document.fonts.ready);
};
const box = async (locator: Locator) => (await locator.boundingBox())!;
const at = (page: Page, width: number) => page.locator(`[data-width="${width}"]`);
/** The number of columns a grid of options shows: the distinct left edges of its children. */
const columns = (options: Locator) =>
  options.evaluate(
    (el) => new Set([...el.children].map((c) => Math.round(c.getBoundingClientRect().x))).size,
  );
const submit = async (page: Page) => {
  await page.getByRole('button', { name: 'Save' }).click();
  return page.getByText(/^Sent: /);
};

test.describe('Checkbox', () => {
  test('Space toggles it, Tab moves on and skips disabled ones', async ({ page }) => {
    await open(page, 'inputs-checkbox--states');
    const all = page.locator('input[type="checkbox"]');
    await page.keyboard.press('Tab');
    await expect(all.nth(0)).toBeFocused();
    await expect(page.locator('[data-umbra="checkbox"]').first()).toHaveAttribute(
      'data-focus-visible',
      'true',
    );
    await expect(all.nth(0)).not.toBeChecked();
    await page.keyboard.press('Space');
    await expect(all.nth(0)).toBeChecked();
    await page.keyboard.press('Space');
    await expect(all.nth(0)).not.toBeChecked();

    // Six in the first column, then three disabled ones that Tab passes over.
    for (let i = 0; i < 5; i++) await page.keyboard.press('Tab');
    await expect(all.nth(5)).toBeFocused();
    await expect(all.nth(5)).toHaveAccessibleName('No visible label');
    await expect(all.nth(6)).toBeDisabled();
    await page.keyboard.press('Tab');
    await expect(all.nth(9)).toBeFocused();
  });

  test('a click on the label or the description toggles it; the name is the label alone', async ({
    page,
  }) => {
    await open(page, 'inputs-checkbox--states');
    const input = page.getByRole('checkbox', { name: 'With a description', exact: true });
    await expect(input).toHaveAccessibleDescription('A second line that explains the choice.');
    await expect(input).toBeChecked();
    await page.getByText('With a description').click();
    await expect(input).not.toBeChecked();
    await page.getByText('A second line that explains the choice.').click();
    await expect(input).toBeChecked();
  });

  test('indeterminate, read-only, required and invalid reach the input', async ({ page }) => {
    await open(page, 'inputs-checkbox--states');
    const mixed = page.getByRole('checkbox', { name: 'Indeterminate' }).first();
    expect(await mixed.evaluate((el: HTMLInputElement) => el.indeterminate)).toBe(true);

    // Read-only: focusable, and neither the keyboard nor a click changes it.
    const readOnly = page.locator('[data-umbra="checkbox"][data-readonly]', { hasText: 'Unchecked' });
    await readOnly.locator('input').focus();
    await page.keyboard.press('Space');
    await readOnly.click();
    await expect(readOnly.locator('input')).not.toBeChecked();
    await expect(readOnly.locator('input')).toHaveAttribute('aria-readonly', 'true');

    // The required marker is text, hidden from screen readers because the input says it.
    const terms = page.getByRole('checkbox', { name: 'I accept the terms' });
    await expect(terms).toHaveAttribute('required', '');
    await expect(terms).toHaveAttribute('aria-invalid', 'true');
    await expect(terms).toHaveAccessibleDescription('Accept the terms to continue.');
    const error = page.locator('[data-part="error"]', { hasText: 'Accept the terms' });
    await expect(error.locator('svg')).toBeVisible();
    await expect(page.locator('[data-part="marker"]').first()).toHaveAttribute('aria-hidden', 'true');
  });

  test('the pointer target of a small bare checkbox is at least 24px', async ({ page }) => {
    await open(page, 'inputs-checkbox--states');
    const small = page.locator('[data-umbra="checkbox"][data-size="small"]').last();
    const mark = await box(small.locator('[data-part="box"]'));
    expect(mark.width).toBeLessThan(24);
    await expect(small.locator('input')).toBeChecked();
    // 11px from the centre is outside the box and inside the target.
    await page.mouse.click(mark.x + mark.width / 2 + 11, mark.y + mark.height / 2 - 11);
    await expect(small.locator('input')).not.toBeChecked();
  });

  test('a group is one named group; "select all" follows its value', async ({ page }) => {
    await open(page, 'inputs-checkbox--group');
    const group = page.getByRole('group', { name: 'Notify me about' });
    await expect(group).toHaveAccessibleDescription('Choose any number.');
    await expect(group.getByRole('checkbox', { name: 'Reports' })).toBeDisabled();
    // An option is described by its own description, then by the group's.
    await expect(group.getByRole('checkbox', { name: 'Returns' })).toHaveAccessibleDescription(
      'Including refunds. Choose any number.',
    );

    // The error of a group is announced on each of its checkboxes.
    const invalid = page.getByRole('group', { name: 'Required, with an error' });
    await expect(invalid.getByRole('checkbox', { name: 'Email' })).toHaveAttribute('aria-invalid', 'true');
    await expect(invalid.getByRole('checkbox', { name: 'Email' })).toHaveAccessibleDescription(
      'Choose at least one channel.',
    );

    // Disabled and read-only groups do not change.
    await page.getByRole('group', { name: 'Read-only group' }).getByText('Item 2').click();
    await expect(
      page.getByRole('group', { name: 'Read-only group' }).getByRole('checkbox', { name: 'Item 2' }),
    ).not.toBeChecked();
    await expect(
      page.getByRole('group', { name: 'Disabled group' }).getByRole('checkbox', { name: 'Item 1' }),
    ).toBeDisabled();

    const everything = page.getByRole('checkbox', { name: 'All regions' });
    expect(await everything.evaluate((el: HTMLInputElement) => el.indeterminate)).toBe(true);
    await page.getByText('Region 4').click();
    await expect(page.getByText('Checked: Region 2, Region 4.')).toBeVisible();
    await page.getByText('All regions').click();
    await expect(page.getByText('Checked: Region 1, Region 2, Region 3, Region 4.')).toBeVisible();
    expect(await everything.evaluate((el: HTMLInputElement) => el.indeterminate)).toBe(false);
    await page.getByText('All regions').click();
    await expect(page.getByText('Checked: none.')).toBeVisible();
  });

  test('a form receives the values', async ({ page }) => {
    await open(page, 'inputs-checkbox--form');
    await page.getByText('I accept the terms').click();
    await page.getByText('Phone').click();
    await expect(await submit(page)).toHaveText(
      'Sent: [["terms","accepted"],["news","on"],["channel","email"],["channel","phone"]]',
    );
  });

  test('the columns of a group drop as it narrows, and nothing overflows', async ({ page }) => {
    await open(page, 'inputs-checkbox--shrink');
    const options = (width: number) => at(page, width).locator('[data-part="options"]');
    expect(await columns(options(620))).toBe(3);
    expect(await columns(options(420))).toBe(2);
    expect(await columns(options(200))).toBe(1);
    const narrow = at(page, 200).locator('[data-umbra="checkbox-group"]');
    expect(await narrow.evaluate((el) => el.scrollWidth - el.clientWidth)).toBe(0);
  });

  test('parts and blocks', async ({ page }) => {
    await open(page, 'inputs-checkbox--parts-and-blocks');
    await expect(page.getByText('Hidden by null.')).toHaveCount(0);
    await expect(page.getByRole('checkbox', { name: 'A function wraps the label (wrapped)' })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Group label (wrapped)' })).toBeVisible();
    // Composed by hand, the blocks wire themselves: name, description, and the error makes it invalid.
    const composed = page.getByRole('checkbox', { name: 'Composed by hand', exact: true });
    await expect(composed).toHaveAccessibleDescription('Root, Box, Label, Description and Error.');
    await expect(page.getByRole('checkbox', { name: 'With an error block' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    await expect(page.getByRole('group', { name: 'Composed by hand' })).toHaveAccessibleDescription(
      'Root, Label, Description, Options and Error.',
    );
  });
});

test.describe('Radio', () => {
  test('a group is one tab stop; the arrow keys move the choice and skip a disabled option', async ({
    page,
  }) => {
    await open(page, 'inputs-radio--default');
    const group = page.getByRole('radiogroup', { name: 'Summary' });
    await expect(group).toHaveAccessibleDescription('How often the summary is sent.');
    await page.keyboard.press('Tab');
    await expect(group.getByRole('radio', { name: 'Weekly' })).toBeFocused();
    await expect(group.getByRole('radio', { name: 'Weekly' })).toHaveAccessibleDescription(
      'Every Monday morning. How often the summary is sent.',
    );
    await page.keyboard.press('ArrowDown');
    await expect(group.getByRole('radio', { name: 'Monthly' })).toBeChecked();
    // The last option is disabled, so the next step wraps to the first.
    await page.keyboard.press('ArrowDown');
    await expect(group.getByRole('radio', { name: 'Daily' })).toBeChecked();
    await expect(group.getByRole('radio', { name: 'Daily' })).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(group.getByRole('radio', { name: 'Monthly' })).toBeChecked();

    // Tab leaves the group for the next one, landing on its chosen option.
    await page.keyboard.press('Tab');
    const horizontal = page.getByRole('radiogroup', { name: 'Horizontal' });
    await expect(horizontal.getByRole('radio', { name: 'Item 2' })).toBeFocused();
    await expect(horizontal).toHaveAttribute('aria-orientation', 'horizontal');
    await page.keyboard.press('ArrowRight');
    await expect(horizontal.getByRole('radio', { name: 'Item 3' })).toBeChecked();
    await page.keyboard.press('ArrowLeft');
    await expect(horizontal.getByRole('radio', { name: 'Item 2' })).toBeChecked();
  });

  test('label clicks, required, error, disabled and read-only', async ({ page }) => {
    await open(page, 'inputs-radio--default');
    await page.getByText('Daily', { exact: true }).first().click();
    await expect(
      page.getByRole('radiogroup', { name: 'Summary' }).getByRole('radio', { name: 'Daily' }),
    ).toBeChecked();

    const invalid = page.getByRole('radiogroup', { name: 'Required, with an error' });
    await expect(invalid).toHaveAttribute('aria-invalid', 'true');
    await expect(invalid).toHaveAttribute('aria-required', 'true');
    await expect(invalid).toHaveAccessibleDescription('Choose one option.');
    await expect(invalid.locator('[data-part="error"] svg')).toBeVisible();

    const disabled = page.getByRole('radiogroup', { name: 'Disabled group' });
    await expect(disabled.getByRole('radio', { name: 'Item 2' })).toBeDisabled();
    const readOnly = page.getByRole('radiogroup', { name: 'Read-only group' });
    await readOnly.getByText('Item 2').click();
    await expect(readOnly.getByRole('radio', { name: 'Item 1' })).toBeChecked();

    const controlled = page.getByRole('radiogroup', { name: 'Controlled' });
    await controlled.getByText('Monthly').click();
    await expect(page.getByText('Chosen: monthly.')).toBeVisible();
  });

  test('a card is chosen by a click anywhere on it and shows it without colour', async ({ page }) => {
    await open(page, 'inputs-radio--cards');
    const group = page.getByRole('radiogroup', { name: 'Review pace' });
    const card = (name: string) => group.locator('[data-umbra="radio"]', { hasText: name });
    await expect(card('Balanced')).toHaveAttribute('data-selected', 'true');
    // The name is the title; the description is announced as a description.
    await expect(group.getByRole('radio', { name: 'Thorough', exact: true })).toHaveAccessibleDescription(
      'A stop at every change, so nothing is missed. How often the review stops for you.',
    );
    const dot = (name: string) =>
      card(name)
        .locator('[data-part="mark"] > span')
        .evaluate((el) => getComputedStyle(el, '::before').opacity);
    expect(await dot('Balanced')).toBe('1');
    expect(await dot('Thorough')).toBe('0');
    await card('Thorough').click({ position: { x: 300, y: 8 } });
    await expect(card('Thorough')).toHaveAttribute('data-selected', 'true');
    expect(await dot('Thorough')).toBe('1');
    await expect(card('Balanced')).not.toHaveAttribute('data-selected');
    // A disabled card cannot be chosen.
    await card('Custom').click({ force: true });
    await expect(card('Thorough')).toHaveAttribute('data-selected', 'true');
    // The keyboard ring is on the whole card.
    await page.keyboard.press('ArrowUp');
    await expect(card('Balanced')).toHaveAttribute('data-focus-visible', 'true');
    expect(await card('Balanced').evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid');
  });

  test('a form receives the chosen values', async ({ page }) => {
    await open(page, 'inputs-radio--form');
    await page.getByText('Monthly').click();
    await page.getByText('Medium').click();
    await page.getByText('Large').click({ force: true });
    await expect(await submit(page)).toHaveText('Sent: [["summary","monthly"],["size","m"]]');
  });

  test('columns drop as the group narrows; a narrow card hides its media and truncates', async ({ page }) => {
    await open(page, 'inputs-radio--shrink');
    const options = (width: number) => at(page, width).locator('[data-part="options"]');
    expect(await columns(options(700))).toBe(3);
    expect(await columns(options(460))).toBe(2);
    expect(await columns(options(200))).toBe(1);
    // Step 1: only a card narrower than 11em hides its media.
    await expect(options(700).locator('[data-part="media"]').first()).toBeVisible();
    await expect(options(460).locator('[data-part="media"]').first()).toBeVisible();
    await expect(options(200).locator('[data-part="media"]').first()).toBeHidden();
    for (const width of [700, 460, 200]) {
      const group = at(page, width).locator('[data-umbra="radio-group"]');
      expect(await group.evaluate((el) => el.scrollWidth - el.clientWidth)).toBe(0);
      for (const card of await options(width).locator('[data-umbra="radio"]').all()) {
        expect(await card.evaluate((el) => el.scrollWidth - el.clientWidth)).toBe(0);
      }
    }
  });

  test('parts and blocks', async ({ page }) => {
    await open(page, 'inputs-radio--parts-and-blocks');
    await expect(page.getByText('Hidden by null.')).toHaveCount(0);
    await expect(page.getByRole('radiogroup', { name: 'Group label (wrapped)' })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'A function wraps the label (wrapped)' })).toBeVisible();
    await expect(page.getByRole('radio', { name: 'A node replaces the label' })).toBeVisible();
    const composed = page.getByRole('radiogroup', { name: 'Composed by hand', exact: true });
    await expect(composed).toHaveAttribute('aria-invalid', 'true');
    await expect(composed).toHaveAccessibleDescription(
      'Root, Label, Description, Options and Error. The error block makes the group invalid.',
    );
    await expect(composed.getByRole('radio', { name: 'Item 1' })).toBeChecked();
    await expect(
      page.getByRole('radiogroup', { name: 'Cards composed by hand' }).locator('[data-part="media"]'),
    ).toBeVisible();
  });
});

test.describe('Toggle', () => {
  test('it is a switch: Space and a label click toggle it', async ({ page }) => {
    await open(page, 'inputs-toggle--states');
    const off = page.getByRole('switch', { name: 'Off' }).first();
    await page.keyboard.press('Tab');
    await expect(off).toBeFocused();
    await page.keyboard.press('Space');
    await expect(off).toBeChecked();
    await page.getByText('Off', { exact: true }).first().click();
    await expect(off).not.toBeChecked();

    const described = page.getByRole('switch', { name: 'With a description', exact: true });
    await expect(described).toHaveAccessibleDescription('A second line that explains the setting.');
    await expect(page.getByRole('switch', { name: 'No visible label' })).toBeChecked();

    await page.getByText('Controlled').click();
    await expect(page.getByText('Sound is on.')).toBeVisible();
  });

  test('on is shown by the thumb position and a mark, not by colour alone', async ({ page }) => {
    await open(page, 'inputs-toggle--states');
    const toggle = (name: string) => page.locator('[data-umbra="toggle"]', { hasText: name }).first();
    const thumbOffset = async (name: string) =>
      (await box(toggle(name).locator('[data-part="thumb"]'))).x -
      (await box(toggle(name).locator('[data-part="track"]'))).x;
    const mark = (name: string) =>
      toggle(name)
        .locator('[data-part="thumb"] svg')
        .evaluate((el) => getComputedStyle(el).opacity);
    expect(await thumbOffset('On')).toBeGreaterThan((await thumbOffset('Off')) + 10);
    expect(await mark('On')).toBe('1');
    expect(await mark('Off')).toBe('0');
  });

  test('disabled and read-only do not change; the label can be at the start', async ({ page }) => {
    await open(page, 'inputs-toggle--states');
    const readOnly = page.locator('[data-umbra="toggle"][data-readonly]').first();
    await readOnly.locator('input').focus();
    await page.keyboard.press('Space');
    await readOnly.click();
    await expect(readOnly.locator('input')).not.toBeChecked();
    await expect(page.locator('[data-umbra="toggle"][data-disabled] input').first()).toBeDisabled();

    const start = page.locator('[data-umbra="toggle"][data-label-position="start"]').first();
    expect((await box(start.locator('[data-part="label"]'))).x).toBeLessThan(
      (await box(start.locator('[data-part="track"]'))).x,
    );
    const end = page.locator('[data-umbra="toggle"][data-label-position="end"]').first();
    expect((await box(end.locator('[data-part="label"]'))).x).toBeGreaterThan(
      (await box(end.locator('[data-part="track"]'))).x,
    );
  });

  test('a form receives the value only while on', async ({ page }) => {
    await open(page, 'inputs-toggle--form');
    await expect(await submit(page)).toHaveText('Sent: [["sound","on"]]');
    await page.getByText('Sound', { exact: true }).click();
    await page.getByText('Music').click();
    await expect(await submit(page)).toHaveText('Sent: [["music","yes"]]');
  });

  test('parts and blocks', async ({ page }) => {
    await open(page, 'inputs-toggle--parts-and-blocks');
    await expect(page.getByText('Hidden by null.')).toHaveCount(0);
    await expect(page.getByRole('switch', { name: 'A function wraps the label (wrapped)' })).toBeVisible();
    const composed = page.getByRole('switch', { name: 'Composed by hand' });
    await expect(composed).toBeChecked();
    await expect(composed).toHaveAccessibleDescription('Root, Track, Label and Description.');
  });
});

test.describe('TextField', () => {
  test('typing reports the text; the clear button empties the field and returns focus to it', async ({
    page,
  }) => {
    await open(page, 'inputs-textfield--states');
    const input = page.getByRole('textbox', { name: 'Controlled' });
    await input.fill('Report 5');
    await expect(page.getByText('Value: "Report 5".')).toBeVisible();
    const root = page.locator('[data-umbra="text-field"]', { has: input });
    // The clear button is the next tab stop, and works from the keyboard.
    await input.focus();
    await page.keyboard.press('Tab');
    await expect(root.getByRole('button', { name: 'Clear' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByText('Value: "".')).toBeVisible();
    await expect(input).toBeFocused();
    // With nothing to clear there is no button.
    await expect(root.getByRole('button', { name: 'Clear' })).toHaveCount(0);
    await page.keyboard.type('ab');
    await expect(root.getByRole('button', { name: 'Clear' })).toBeVisible();
  });

  test('states reach the input, and an invalid field shows an icon', async ({ page }) => {
    await open(page, 'inputs-textfield--states');
    const field = (name: string) =>
      page.locator('[data-umbra="text-field"]', { has: page.getByRole('textbox', { name, exact: true }) });
    await expect(page.getByRole('textbox', { name: 'Invalid', exact: true })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    await expect(field('Invalid').locator('[data-part="invalidIcon"]')).toBeVisible();
    await expect(field('With text').locator('[data-part="invalidIcon"]')).toBeHidden();

    await expect(page.getByRole('textbox', { name: 'Disabled' })).toBeDisabled();
    await expect(field('Disabled').getByRole('button')).toHaveCount(0);
    const readOnly = page.getByRole('textbox', { name: 'Read-only' });
    await expect(readOnly).toHaveAttribute('readonly', '');
    await expect(field('Read-only').getByRole('button')).toHaveCount(0);
    await readOnly.focus();
    await page.keyboard.type('x');
    await expect(readOnly).toHaveValue('Report 4');

    await expect(page.getByRole('spinbutton', { name: 'Weight' })).toHaveAttribute('type', 'number');
    await expect(page.getByRole('textbox', { name: 'Email' })).toHaveAttribute('type', 'email');
    await expect(page.locator('input[type="password"]')).toHaveAccessibleName('Password');
    expect(await page.getByRole('textbox', { name: 'Notes', exact: true }).evaluate((el) => el.tagName)).toBe(
      'TEXTAREA',
    );
  });

  test('a click on the prefix focuses the input, and the ring is drawn on the whole field', async ({
    page,
  }) => {
    await open(page, 'inputs-textfield--states');
    const input = page.getByRole('textbox', { name: 'Address' });
    const root = page.locator('[data-umbra="text-field"]', { has: input });
    await root.locator('[data-part="prefix"]').click();
    await expect(input).toBeFocused();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(input).toBeFocused();
    expect(await root.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid');
    expect(await input.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('none');
  });

  test('a form receives the text', async ({ page }) => {
    await open(page, 'inputs-textfield--form');
    await page.getByRole('textbox', { name: 'Notes' }).fill('Two\nlines');
    await page.getByRole('button', { name: 'Clear' }).click();
    await page.getByRole('textbox', { name: 'Name' }).fill('Person B');
    await expect(await submit(page)).toHaveText(
      'Sent: [["name","Person B"],["amount","12"],["notes","Two\\nlines"]]',
    );
  });

  test('it fills its slot and never overflows it', async ({ page }) => {
    await open(page, 'inputs-textfield--shrink');
    for (const width of [320, 180, 96]) {
      const slot = at(page, width);
      for (const field of await slot.locator('[data-umbra="text-field"]').all()) {
        const size = await box(field);
        expect(size.width).toBeLessThanOrEqual(width - 16);
        expect(size.width).toBeGreaterThan(width - 20);
        expect(await field.evaluate((el) => el.scrollWidth - el.clientWidth)).toBe(0);
      }
    }
    // The prefix truncates instead of pushing the text box out.
    const prefix = at(page, 96).locator('[data-part="prefix"]').first();
    expect(await prefix.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  });

  test('parts and blocks', async ({ page }) => {
    await open(page, 'inputs-textfield--parts-and-blocks');
    const field = (name: string) =>
      page.locator('[data-umbra="text-field"]', { has: page.getByRole('textbox', { name }) });
    await expect(field('No clear button').getByRole('button')).toHaveCount(0);
    await expect(field('Wrapped').getByRole('button', { name: 'Empty the field' })).toBeVisible();
    await expect(field('Wrapped').locator('[data-part="prefix"]')).toHaveText('Name:');
    const composed = field('Composed by hand');
    await composed.getByRole('button', { name: 'Clear' }).click();
    await expect(page.getByRole('textbox', { name: 'Composed by hand' })).toHaveValue('');
    await expect(composed.locator('[data-part="suffix"]')).toHaveText('kg');
  });
});

test.describe('FormField', () => {
  /** The field of a given layout whose label starts with `label`. */
  const field = (page: Page, layout: string, label: string) =>
    page
      .locator(`[data-umbra="form-field"][data-layout="${layout}"]`, {
        has: page.locator('[data-part="label"]', { hasText: new RegExp(`^${label}( |$)`) }),
      })
      .first();
  const parts = async (root: Locator) => ({
    root: await box(root),
    label: await box(root.locator('[data-part="label"]')),
    control: await box(root.locator('[data-part="control"] > *')),
  });

  test('the label names the control and a click on it reaches the control', async ({ page }) => {
    await open(page, 'inputs-formfield--layouts');
    // A text field: the click focuses it.
    const name = page.getByRole('textbox', { name: 'Display name' }).first();
    await page.locator('label', { hasText: 'Display name' }).first().click();
    await expect(name).toBeFocused();
    // A toggle and a checkbox: the click toggles them.
    const sound = page.getByRole('switch', { name: 'Sound' }).first();
    await expect(sound).toBeChecked();
    await page.locator('label', { hasText: 'Sound' }).first().click();
    await expect(sound).not.toBeChecked();
    // A group takes its name and description from the field.
    await expect(page.getByRole('radiogroup', { name: /^Summary/ })).toBeVisible();
    // ...and its options do not take the field's id.
    expect(await page.locator('[id]').evaluateAll((all) => new Set(all.map((e) => e.id)).size)).toBe(
      await page.locator('[id]').count(),
    );
  });

  test('description and error are announced; required, optional and disabled reach the control', async ({
    page,
  }) => {
    await open(page, 'inputs-formfield--layouts');
    const name = page.getByRole('textbox', { name: 'Display name' }).first();
    await expect(name).toHaveAccessibleDescription('Shown to the people you share with.');
    await expect(name).toHaveAttribute('required', '');
    await expect(name).not.toHaveAttribute('aria-invalid');
    // The required marker is visible text, but not part of the name: the control says "required".
    const marker = page.locator('label', { hasText: 'Display name' }).first().locator('[data-part="marker"]');
    await expect(marker).toHaveText('Required');
    await expect(name).toHaveAccessibleName('Display name');

    // The optional marker has no ARIA equivalent, so it is part of the name.
    const reference = page.getByRole('textbox', { name: 'Reference Optional' });
    await expect(reference).toHaveAttribute('aria-invalid', 'true');
    await expect(reference).toHaveAccessibleDescription('Use letters and digits only.');
    const error = page.locator('[data-part="error"]', { hasText: 'Use letters and digits only.' });
    await expect(error.locator('svg')).toBeVisible();
    await expect(page.getByText('Not needed')).toBeVisible();

    await expect(page.getByRole('checkbox', { name: 'Archive' })).toBeDisabled();
  });

  test('row puts the control at the end of the line, stacked puts it below the label', async ({ page }) => {
    await open(page, 'inputs-formfield--layouts');
    const row = await parts(field(page, 'row', 'Display name'));
    expect(row.control.x).toBeGreaterThan(row.label.x + row.label.width);
    expect(row.control.x + row.control.width).toBeCloseTo(row.root.x + row.root.width, 0);

    const stacked = await parts(field(page, 'stacked', 'Display name'));
    expect(stacked.control.y).toBeGreaterThan(stacked.label.y + stacked.label.height);
    expect(stacked.control.x).toBeCloseTo(stacked.label.x, 0);
  });

  test('inline puts the control beside the label; `labelWidth` fixes the label column', async ({ page }) => {
    await open(page, 'inputs-formfield--inline');
    const inline = await parts(field(page, 'inline', 'Notes'));
    expect(inline.control.x).toBeCloseTo(inline.label.x + 64 + 16, 0);
    const description = await box(field(page, 'inline', 'Notes').locator('[data-part="description"]'));
    expect(description.x).toBeCloseTo(inline.control.x, 0);
    expect(description.y).toBeGreaterThan(inline.control.y + inline.control.height - 1);

    // Without `labelWidth` the label column is as wide as its text.
    const free = await parts(field(page, 'inline', 'Show reviewed items only'));
    expect(free.control.x).toBeCloseTo(free.label.x + free.label.width + 16, 0);

    // `labelWidth` on a row: the control starts right after the label column and fills the rest.
    const fixed = await parts(field(page, 'row', 'Name'));
    expect(fixed.control.x).toBeCloseTo(fixed.label.x + 140 + 16, 0);
    expect(fixed.control.x + fixed.control.width).toBeCloseTo(fixed.root.x + fixed.root.width, 0);
  });

  test('step 1: a narrow row or inline field stacks', async ({ page }) => {
    await open(page, 'inputs-formfield--shrink');
    const parts = async (width: number, layout: string) => {
      const root = at(page, width).locator(`[data-umbra="form-field"][data-layout="${layout}"]`);
      return {
        root: await box(root),
        label: await box(root.locator('[data-part="label"]')),
        description: await box(root.locator('[data-part="description"]')),
        control: await box(root.locator('[data-part="control"] > *')),
      };
    };
    for (const width of [520, 360]) {
      const row = await parts(width, 'row');
      expect(row.control.x, `row at ${width}`).toBeGreaterThan(row.label.x + row.label.width);
      expect(row.control.y).toBeLessThan(row.description.y + row.description.height);
      const inline = await parts(width, 'inline');
      expect(inline.control.x, `inline at ${width}`).toBeGreaterThan(inline.label.x + inline.label.width);
    }
    for (const layout of ['row', 'inline']) {
      const narrow = await parts(280, layout);
      expect(narrow.control.x, layout).toBeCloseTo(narrow.label.x, 0);
      expect(narrow.control.y, layout).toBeGreaterThan(narrow.description.y + narrow.description.height - 1);
      expect(narrow.description.y).toBeGreaterThan(narrow.label.y + narrow.label.height - 1);
    }
    for (const root of await page.locator('[data-umbra="form-field"]').all()) {
      expect(await root.evaluate((el) => el.scrollWidth - el.clientWidth)).toBe(0);
    }
  });

  test('a plain input is wired through the render function', async ({ page }) => {
    await open(page, 'inputs-formfield--parts-and-blocks');
    const input = page.getByRole('textbox', { name: 'Plain input' });
    await expect(input).toHaveAccessibleDescription('Not an umbra-ui control. Still announced.');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAttribute('required', '');
    await page.locator('label', { hasText: 'Plain input' }).click();
    await expect(input).toBeFocused();
    await expect(page.getByRole('textbox', { name: 'Plain, disabled' })).toBeDisabled();
  });

  test('parts and blocks', async ({ page }) => {
    await open(page, 'inputs-formfield--parts-and-blocks');
    await expect(
      page.getByRole('switch', { name: 'A node replaces the description' }),
    ).toHaveAccessibleDescription('A node.');
    // `null` hides the error text; the control is still invalid.
    await expect(page.getByText('Hidden.')).toHaveCount(0);
    await expect(page.getByRole('textbox', { name: 'null hides the error text' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    await expect(page.getByRole('checkbox', { name: 'A function wraps the label (wrapped)' })).toBeVisible();
    const composed = page.getByRole('textbox', { name: 'Composed by hand' });
    await expect(composed).toHaveAccessibleDescription(
      'The blocks wire themselves to the control. The error block makes the control invalid.',
    );
    await expect(composed).toHaveAttribute('aria-invalid', 'true');
    await expect(composed).toHaveAttribute('required', '');
    await expect(page.getByText('Needed')).toBeVisible();
  });

  test('a settings form: Tab order follows the rows, an error appears, and the values are sent', async ({
    page,
  }) => {
    await open(page, 'inputs-formfield--settings');
    const name = page.getByRole('textbox', { name: 'Display name' });
    await page.keyboard.press('Tab');
    await expect(name).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('checkbox', { name: 'Sort names in one language' })).toBeFocused();
    await page.keyboard.press('Space');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('checkbox', { name: 'Show the editor in the menu' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('switch', { name: 'Sound' })).toBeFocused();
    await page.keyboard.press('Space');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('spinbutton', { name: 'Volume' })).toBeFocused();

    // Submitting without the name shows the error, with its icon, and marks the field.
    await expect(name).not.toHaveAttribute('aria-invalid');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Sent: nothing: the name is missing')).toBeVisible();
    await expect(name).toHaveAttribute('aria-invalid', 'true');
    await expect(name).toHaveAccessibleDescription('Shown to the people you share with. Enter a name.');

    await name.fill('Person A');
    await expect(name).not.toHaveAttribute('aria-invalid');
    await page.getByText('Thorough').click();
    await page.getByText('Returns').click();
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText(/^Sent: \[/)).toHaveText(
      'Sent: [["name","Person A"],["sort","on"],["editor","on"],["volume","60"],["pace","full"],["notify","orders"],["notify","returns"]]',
    );
  });
});
