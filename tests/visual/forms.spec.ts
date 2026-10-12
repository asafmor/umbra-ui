import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectFocusKept, openStory } from './helpers';

// One native form with every input of the library that takes `name`, tier 1 and tier 2, each in a
// `FormField` (stories `Integration/Forms`). They all behave as a native control does: the value is sent
// under the name, a native reset brings the starting value back, a press on the field's label gives the
// control the focus, a required control left empty holds the form back and its field says why, and a
// disabled control sends nothing.
const open = async (page: Page, story: string) => {
  await openStory(page, `integration-forms--${story}`);
  await page.evaluate(() => document.fonts.ready);
};
const field = (page: Page, name: string) => page.locator(`[data-field="${name}"]`);
/** What the form sent: its entries, or null while it has sent nothing. */
const submit = async (page: Page) => {
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  const text = (await page.getByText(/^Sent: /).textContent())!.slice('Sent: '.length);
  return text === 'nothing yet' ? null : (JSON.parse(text) as [string, string][]);
};
const valuesOf = (sent: [string, string][] | null, name: string) =>
  sent?.filter(([key]) => key === name).map(([, value]) => value);
const key = async (page: Page, control: Locator, press: string) => {
  await control.focus();
  await page.keyboard.press(press);
};
const scale = (from: number) =>
  JSON.stringify([
    { from: 0, tone: 'success' },
    { from, tone: 'danger' },
  ]);

interface Control {
  name: string;
  /** What it sends with its starting value. */
  start: string[];
  /** A change a user makes, and what it sends after it. */
  change: (page: Page, field: Locator) => Promise<void>;
  changed: string[];
  /** From empty: gives it a value, and what it sends then. Only the controls that can be required. */
  fill?: (page: Page, field: Locator) => Promise<void>;
  filled?: string[];
}

const pick = async (page: Page, f: Locator, option: string) => {
  await f.locator('[data-part="trigger"]').click();
  await page.getByRole('option', { name: option }).click();
};
const controls: Control[] = [
  {
    name: 'text',
    start: ['one'],
    change: (_, f) => f.locator('input').fill('uno'),
    changed: ['uno'],
    fill: (_, f) => f.locator('input').fill('uno'),
    filled: ['uno'],
  },
  {
    name: 'search',
    start: ['two'],
    change: (_, f) => f.locator('input').first().fill('dos'),
    changed: ['dos'],
    fill: (_, f) => f.locator('input').first().fill('dos'),
    filled: ['dos'],
  },
  {
    name: 'select',
    start: ['a'],
    change: (page, f) => pick(page, f, 'Option B'),
    changed: ['b'],
    fill: (page, f) => pick(page, f, 'Option B'),
    filled: ['b'],
  },
  {
    name: 'checkbox',
    start: ['on'],
    change: (page, f) => key(page, f.getByRole('checkbox'), 'Space'),
    changed: [],
    fill: (page, f) => key(page, f.getByRole('checkbox'), 'Space'),
    filled: ['on'],
  },
  {
    name: 'checks',
    start: ['a'],
    change: (page, f) => key(page, f.getByRole('checkbox', { name: 'B' }), 'Space'),
    changed: ['a', 'b'],
    fill: (page, f) => key(page, f.getByRole('checkbox', { name: 'B' }), 'Space'),
    filled: ['b'],
  },
  {
    name: 'radio',
    start: ['a'],
    change: (page, f) => key(page, f.getByRole('radio', { name: 'B' }), 'Space'),
    changed: ['b'],
    fill: (page, f) => key(page, f.getByRole('radio', { name: 'B' }), 'Space'),
    filled: ['b'],
  },
  {
    name: 'rating',
    start: ['3'],
    change: (page, f) => key(page, f.getByRole('radio', { name: '4 of 5' }), 'Space'),
    changed: ['4'],
    fill: (page, f) => key(page, f.getByRole('radio', { name: '4 of 5' }), 'Space'),
    filled: ['4'],
  },
  {
    name: 'stepper',
    start: ['3'],
    change: (page, f) => key(page, f.getByRole('spinbutton'), 'ArrowUp'),
    changed: ['4'],
    fill: (page, f) => key(page, f.getByRole('spinbutton'), 'End'),
    filled: ['10'],
  },
  {
    name: 'toggle',
    start: ['on'],
    change: (page, f) => key(page, f.getByRole('switch'), 'Space'),
    changed: [],
  },
  {
    name: 'slider',
    start: ['30'],
    change: (page, f) => key(page, f.getByRole('slider'), 'ArrowRight'),
    changed: ['31'],
  },
  {
    // Starts above its scale: it shows the top of the scale, and sends what it shows.
    name: 'held',
    start: ['10'],
    change: (page, f) => key(page, f.getByRole('spinbutton'), 'ArrowDown'),
    changed: ['9'],
  },
  {
    name: 'scale',
    start: [scale(50)],
    change: (_, f) => f.getByRole('spinbutton', { name: 'Stop 2: From' }).fill('51'),
    changed: [scale(51)],
  },
];

test.describe('every named input in a native form', () => {
  test('the form sends each value under its name, and nothing from a control without a name', async ({
    page,
  }) => {
    await open(page, 'values');
    expect(await submit(page)).toEqual(controls.flatMap((c) => c.start.map((value) => [c.name, value])));
  });

  for (const control of controls) {
    test(`${control.name}: a change is sent, and a native reset brings the starting value back`, async ({
      page,
    }) => {
      await open(page, 'values');
      await control.change(page, field(page, control.name));
      expect(valuesOf(await submit(page), control.name)).toEqual(control.changed);
      await page.getByRole('button', { name: 'Start over', exact: true }).click();
      expect(valuesOf(await submit(page), control.name)).toEqual(control.start);
      // What is shown went back too: a second change starts from the starting value again.
      await control.change(page, field(page, control.name));
      expect(valuesOf(await submit(page), control.name)).toEqual(control.changed);
    });

    test(`${control.name}: a press on the field's label gives the control the focus`, async ({ page }) => {
      await open(page, 'values');
      const f = field(page, control.name);
      await f.locator('[data-part="label"]').first().click();
      await expectFocusKept(page);
      expect(
        await f
          .locator('[data-part="control"]')
          .evaluate((el) => el.contains(document.activeElement) && document.activeElement !== el),
      ).toBe(true);
    });
  }

  test('a required control left empty holds the form back, takes the focus, and its field says why', async ({
    page,
  }) => {
    const required = controls.filter((c) => c.fill);
    await open(page, 'required');
    expect(await submit(page)).toBeNull();
    for (const control of required) {
      const f = field(page, control.name);
      await expect(f, control.name).toHaveAttribute('data-invalid');
      await expect(f.locator('[data-part="error"]'), control.name).toHaveText(/\S/);
    }
    // The first of them has the focus, as the browser gives it to the first invalid control.
    expect(await field(page, required[0]!.name).evaluate((el) => el.contains(document.activeElement))).toBe(
      true,
    );

    // Each one alone still holds the form back; with all of them filled it is sent.
    for (const [index, control] of required.entries()) {
      expect(await submit(page), `before ${control.name}`).toBeNull();
      await control.fill!(page, field(page, control.name));
      if (index < required.length - 1) continue;
      expect(await submit(page)).toEqual(required.flatMap((c) => c.filled!.map((value) => [c.name, value])));
    }
    await expect(page.locator('[data-part="error"]')).toHaveCount(0);
    await expect(page.locator('[data-umbra="form-field"][data-invalid]')).toHaveCount(0);
  });

  test('a disabled control sends nothing', async ({ page }) => {
    await open(page, 'disabled');
    expect(await submit(page)).toEqual([]);
  });
});
