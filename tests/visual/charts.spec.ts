import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { runAxe } from './helpers';

// Charts: keyboard, tooltip, legend, the data states, and each step of "show less as the slot shrinks".
const open = async (page: Page, id: string, width = 1280, height = 720) => {
  await page.setViewportSize({ width, height });
  await page.goto(`/iframe.html?id=${id}&viewMode=story`);
  await page.locator('#storybook-root > *').first().waitFor();
  await page.evaluate(async () => {
    await Promise.all(
      [...document.fonts].filter((f) => f.unicodeRange.startsWith('U+0-FF')).map((f) => f.load()),
    );
    await document.fonts.ready;
  });
};
/** Axe on the charts of the page. Storybook's own accessibility panel may be running axe: wait for it. */
const axe = (page: Page) => runAxe(page, new AxeBuilder({ page }).include('figure'));
const tile = (page: Page, id: string) => page.locator(`[data-tile="${id}"] figure`);
const sized = (page: Page, size: string, nth = 0) => page.locator(`[data-size="${size}"] figure`).nth(nth);
const marks = (chart: Locator) => chart.getByRole('listbox');
const tooltip = (chart: Locator) => chart.locator('[data-part="tooltip"]');
const ring = (chart: Locator) => chart.locator('[data-part="focusRing"]');
/** The accessible name of the point the arrow keys are on. */
const current = async (chart: Locator) => {
  const id = await marks(chart).getAttribute('aria-activedescendant');
  return id ? chart.locator(`[id="${id}"]`).getAttribute('aria-label') : null;
};
const inside = async (inner: Locator, outer: Locator) => {
  const [a, b] = [(await inner.boundingBox())!, (await outer.boundingBox())!];
  expect(a.x).toBeGreaterThanOrEqual(b.x - 1);
  expect(a.y).toBeGreaterThanOrEqual(b.y - 1);
  expect(a.x + a.width).toBeLessThanOrEqual(b.x + b.width + 1);
  expect(a.y + a.height).toBeLessThanOrEqual(b.y + b.height + 1);
};
const has = (chart: Locator, part: string) => chart.locator(`[data-part="${part}"]`);

test.describe('LineChart', () => {
  test('arrow keys move between points, and Enter and Space press one', async ({ page }) => {
    await open(page, 'charts-linechart--interaction');
    const chart = tile(page, 'controlled');
    await page.getByRole('button', { name: 'Show all' }).focus();
    await page.keyboard.press('Tab');
    await expect(marks(chart)).toBeFocused();
    expect(await current(chart)).toBeNull();
    await expect(tooltip(chart)).toHaveCount(0);

    await page.keyboard.press('ArrowRight');
    expect(await current(chart)).toBe('Plan, Jan: 40 orders');
    await expect(ring(chart)).toHaveAttribute('data-keyboard', 'true');
    await expect(tooltip(chart)).toContainText('Jan');
    await expect(tooltip(chart)).toContainText('40 orders');
    // The tooltip shows every series at that position.
    await expect(tooltip(chart)).toContainText('42 orders');

    await page.keyboard.press('ArrowRight');
    expect(await current(chart)).toBe('Plan, Feb: 44 orders');
    await page.keyboard.press('ArrowDown');
    expect(await current(chart)).toBe('Actual, Feb: 48 orders');
    await page.keyboard.press('ArrowDown');
    expect(await current(chart)).toBe('Actual, Feb: 48 orders');
    await page.keyboard.press('ArrowUp');
    expect(await current(chart)).toBe('Plan, Feb: 44 orders');
    await page.keyboard.press('End');
    expect(await current(chart)).toBe('Plan, Dec: 84 orders');
    await page.keyboard.press('ArrowRight');
    expect(await current(chart)).toBe('Plan, Dec: 84 orders');
    await page.keyboard.press('Home');
    expect(await current(chart)).toBe('Plan, Jan: 40 orders');

    await page.keyboard.press('Enter');
    await expect(page.getByText('Pressed: Plan, Jan, 40.')).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Space');
    await expect(page.getByText('Pressed: Plan, Feb, 44.')).toBeVisible();

    await page.keyboard.press('Escape');
    expect(await current(chart)).toBeNull();
    await expect(tooltip(chart)).toHaveCount(0);
    await expect(ring(chart)).toHaveCount(0);
    await expect(marks(chart)).toBeFocused();

    // One tab stop: the next Tab leaves the points for the legend.
    await page.keyboard.press('Tab');
    await expect(chart.getByRole('button', { name: 'Plan' })).toBeFocused();
  });

  test('hovering a point shows a tooltip that stays inside the chart', async ({ page }) => {
    await open(page, 'charts-linechart--interaction');
    const chart = tile(page, 'controlled');
    const plot = has(chart, 'plot');
    await chart.getByRole('option', { name: 'Actual, Jan: 42 orders' }).hover();
    await expect(tooltip(chart)).toBeVisible();
    await expect(tooltip(chart)).toHaveAttribute('data-align', 'start');
    await expect(tooltip(chart)).toHaveAttribute('data-side', 'above');
    await inside(tooltip(chart), plot);
    // A hovered point is outlined, but not with the focus ring.
    await expect(ring(chart)).not.toHaveAttribute('data-keyboard', 'true');

    await chart.getByRole('option', { name: 'Actual, Dec: 90 orders' }).hover();
    await expect(tooltip(chart)).toHaveAttribute('data-align', 'end');
    await expect(tooltip(chart)).toHaveAttribute('data-side', 'below');
    await inside(tooltip(chart), plot);

    await chart.getByRole('option', { name: 'Actual, Jun: 58 orders' }).hover();
    await expect(tooltip(chart)).toHaveAttribute('data-align', 'center');
    await inside(tooltip(chart), plot);

    await chart.getByRole('option', { name: 'Actual, Jun: 58 orders' }).click();
    await expect(page.getByText('Pressed: Actual, Jun, 58.')).toBeVisible();
    await page.mouse.move(2, 2);
    await expect(tooltip(chart)).toHaveCount(0);
  });

  test('a legend item hides its series, controlled and uncontrolled, and hovering one dims the others', async ({
    page,
  }) => {
    await open(page, 'charts-linechart--interaction');
    const chart = tile(page, 'controlled');
    await expect(chart.getByRole('option')).toHaveCount(24);
    await chart.getByRole('button', { name: 'Actual' }).hover();
    await expect(chart.locator('[data-series="plan"]')).toHaveAttribute('data-dim', 'true');
    await expect(chart.locator('[data-series="actual"]')).not.toHaveAttribute('data-dim', 'true');

    await chart.getByRole('button', { name: 'Actual' }).click();
    await expect(chart.locator('[data-series="actual"]')).toHaveCount(0);
    await expect(chart.getByRole('option')).toHaveCount(12);
    await expect(chart.getByRole('button', { name: 'Actual' })).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByText('Hidden: actual.')).toBeVisible();
    await page.getByRole('button', { name: 'Show all' }).click();
    await expect(chart.locator('[data-series="actual"]')).toHaveCount(1);

    const other = tile(page, 'uncontrolled');
    await expect(other.locator('[data-series="r3"]')).toHaveCount(0);
    await other.getByRole('button', { name: 'Region 3' }).press('Enter');
    await expect(other.locator('[data-series="r3"]')).toHaveCount(1);
    // The legend marker is the series' own line and point shape.
    await expect(
      other.getByRole('button', { name: 'Region 3' }).locator('[data-kind="diamond"]'),
    ).toHaveCount(1);
  });

  test('sheds the legend, the labels, the axis titles and the axes as the slot shrinks', async ({ page }) => {
    await open(page, 'charts-linechart--shrink');
    const parts = async (size: string) => {
      const chart = sized(page, size);
      await inside(chart.locator('svg').first(), chart);
      return {
        level: await chart.getAttribute('data-level'),
        legend: await has(chart, 'legend').count(),
        labels: await has(chart, 'seriesLabel').count(),
        titles: await chart.locator('[data-part="xTitle"], [data-part="yTitle"]').count(),
        axes: await has(chart, 'axes').count(),
        ticks: await chart.locator('[data-part="xTicks"] text').count(),
      };
    };
    expect(await parts('420x270')).toEqual({
      level: '0',
      legend: 1,
      labels: 2,
      titles: 2,
      axes: 1,
      ticks: 6,
    });
    expect(await parts('330x230')).toMatchObject({ level: '1', legend: 0, labels: 2, titles: 2, axes: 1 });
    expect(await parts('270x180')).toMatchObject({ level: '2', legend: 0, labels: 0, titles: 2, axes: 1 });
    expect(await parts('210x140')).toEqual({
      level: '3',
      legend: 0,
      labels: 0,
      titles: 0,
      axes: 1,
      ticks: 4,
    });
    expect(await parts('140x80')).toMatchObject({ level: '4', legend: 0, labels: 0, titles: 0, axes: 0 });
  });

  test('redraws to fill its slot when the window changes size', async ({ page }) => {
    await open(page, 'charts-linechart--variants');
    const chart = tile(page, 'plan');
    const widths = async () => {
      const svg = (await chart.locator('svg').first().boundingBox())!;
      const plot = (await has(chart, 'plot').boundingBox())!;
      return [Math.round(svg.width), Math.round(plot.width), Math.round(svg.height), Math.round(plot.height)];
    };
    const before = await widths();
    expect(before[0]).toBe(before[1]);
    expect(before[2]).toBe(before[3]);
    await page.setViewportSize({ width: 1024, height: 600 });
    await expect.poll(async () => (await widths())[0]).toBeLessThan(before[0]!);
    const after = await widths();
    expect(after[0]).toBe(after[1]);
    expect(after[2]).toBe(after[3]);
    // At this size the card is too small for the legend.
    await expect(has(chart, 'legend')).toHaveCount(0);
  });

  test('missing values break the line, and a lone value keeps its point', async ({ page }) => {
    await open(page, 'charts-linechart--variants');
    const line = tile(page, 'missing').locator('[data-series="s1"] [data-part="line"]');
    const d = (await line.getAttribute('d'))!;
    expect(d.match(/M/g)).toHaveLength(4);
    await expect(tile(page, 'missing').getByRole('option', { name: /^Sensor 1/ })).toHaveCount(8);
    // The ordinal axis names its levels, and points carry their own shape.
    const ordinal = tile(page, 'ordinal');
    await expect(ordinal.locator('[data-part="yTicks"] text')).toHaveText(['Tier C', 'Tier B', 'Tier A']);
    await expect(ordinal.getByRole('option', { name: 'Service level, 2019: Tier C' })).toHaveCount(1);
    await expect(ordinal.locator('[data-shape="triangle"]')).toHaveCount(3);
  });

  test('marks draw in over the base duration, and not at all with reduced motion', async ({ page }) => {
    const duration = () =>
      tile(page, 'plan')
        .locator('svg > g')
        .first()
        .evaluate((g) => getComputedStyle(g).animationDuration);
    await open(page, 'charts-linechart--variants');
    expect(await duration()).toBe('0.18s');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, 'charts-linechart--variants');
    expect(await duration()).toBe('0s');
  });
});

test.describe('Chart accessibility and states', () => {
  test('a chart is a named figure with a summary, a list of points and a data table', async ({ page }) => {
    await open(page, 'charts-linechart--variants');
    const chart = page.getByRole('figure', { name: 'Orders, plan and actual' });
    await expect(chart).toHaveCount(1);
    const describedBy = (await chart.getAttribute('aria-describedby'))!;
    await expect(page.locator(`[id="${describedBy}"]`)).toHaveText('Plan, Actual: Jan – Dec');
    await expect(marks(chart)).toHaveAccessibleName('Data points');
    await expect(chart.getByRole('option').first()).toHaveAccessibleName('Plan, Jan: 40');

    const table = chart.getByRole('table', { name: 'Orders, plan and actual' });
    await expect(table.getByRole('columnheader')).toHaveCount(12);
    await expect(table.getByRole('rowheader')).toHaveText(['Plan', 'Actual']);
    await expect(table.getByRole('row').nth(2).getByRole('cell')).toHaveText([
      '42',
      '48',
      '45',
      '53',
      '60',
      '58',
      '66',
      '71',
      '69',
      '78',
      '84',
      '90',
    ]);
  });

  test('loading is busy and has no points; an error offers a retry; no data shows the empty text', async ({
    page,
  }) => {
    await open(page, 'charts-linechart--states');
    const charts = page.getByRole('figure');
    await expect(charts.nth(0)).toHaveAttribute('aria-busy', 'true');
    await expect(charts.nth(0).getByRole('listbox')).toHaveCount(0);
    await expect(charts.nth(0).locator('[data-umbra="skeleton"]').first()).toBeAttached();
    await expect(charts.nth(0).locator('[data-part="skeleton"]')).toHaveAttribute('aria-hidden', 'true');
    await expect(charts.nth(1).locator('[data-part="empty"]')).toHaveText('No data');
    await expect(charts.nth(3).locator('[data-part="empty"]')).toHaveText('No orders in this period.');
    // Nothing to summarise: the figure is not described by a sentence about no data.
    await expect(charts.nth(1)).not.toHaveAttribute('aria-describedby');
    await expect(charts.nth(1).getByRole('table')).toHaveCount(0);

    const error = charts.nth(2).getByRole('alert');
    await expect(error).toHaveAttribute('data-part', 'error');
    await expect(error).toContainText('Retries: 0.');
    await error.getByRole('button', { name: 'Try again' }).focus();
    await page.keyboard.press('Enter');
    await expect(error).toContainText('Retries: 1.');
    // The button is still there, and still has the focus.
    await expect(error.getByRole('button', { name: 'Try again' })).toBeFocused();
  });

  test('the states are the shared ones: `error` takes true and pieces, and Retry keeps the focus (C6)', async ({
    page,
  }) => {
    await open(page, 'charts-linechart--states');
    const chart = tile(page, 'retry');
    // `true` gives the default text, as on a List or a DataTable.
    await expect(chart.getByRole('alert')).toContainText('Something went wrong');
    await chart.getByRole('button', { name: 'Try again' }).focus();
    await page.keyboard.press('Enter');
    await expect(chart.getByRole('alert')).toHaveCount(0);
    await expect(chart.getByRole('option')).toHaveCount(24);
    // The button is gone: the focus moved into the chart instead of falling to the page.
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.closest('[data-umbra="line-chart"]') !== null))
      .toBe(true);

    await open(page, 'charts-donutchart--states');
    const pieces = page.getByRole('figure', { name: 'Budget used' }).getByRole('alert');
    await expect(pieces.locator('[data-part="title"]')).toHaveText('The budget could not be loaded');
    await expect(pieces.locator('[data-part="description"]')).toContainText('Retries: 0.');
    await open(page, 'charts-barchart--states');
    const empty = page.locator('figure [data-part="empty"]');
    await expect(empty.locator('[data-part="title"]')).toHaveText('No orders in this period');
    await expect(empty.locator('[data-part="description"]')).toHaveText(
      'Choose a longer period to see more.',
    );
  });

  test('with every series switched off the chart says so, keeps its legend, and has no empty list (C4)', async ({
    page,
  }) => {
    for (const [story, id, names] of [
      ['charts-linechart--interaction', 'controlled', ['Plan', 'Actual']],
      ['charts-barchart--interaction', 'vertical', ['Plan', 'Actual']],
      ['charts-donutchart--interaction', 'segments', ['Web', 'Phone', 'Partners', 'Other']],
      ['charts-radarchart--interaction', 'several', ['Region 1', 'Region 2', 'Region 3']],
    ] as const) {
      await open(page, story);
      const chart = tile(page, id);
      for (const name of names) await chart.getByRole('button', { name, exact: true }).click();
      await expect(chart.locator('[data-part="empty"]'), story).toHaveText('All series are hidden');
      await expect(chart).toHaveAttribute('data-state', 'empty');
      await expect(chart.getByRole('listbox')).toHaveCount(0);
      await expect(chart.locator('[tabindex="0"]:not(button)')).toHaveCount(0);
      const { violations } = await axe(page);
      expect(violations.map((v) => v.id)).toEqual([]);
      // The legend is still there, so a series can be switched back on.
      await chart.getByRole('button', { name: names[0], exact: true }).click();
      await expect(chart.locator('[data-part="empty"]')).toHaveCount(0);
      await expect(chart.getByRole('listbox')).toHaveCount(1);
    }
    // The text is a prop, and the state shows at once when the chart starts with everything hidden.
    await open(page, 'charts-linechart--states');
    await expect(tile(page, 'hidden').locator('[data-part="empty"]')).toHaveText('All series are hidden');
    await expect(has(tile(page, 'hidden'), 'legend').getByRole('button')).toHaveCount(2);

    // A value of zero has no arc: no point, no list of points, and the value is in the summary.
    await open(page, 'charts-donutchart--states');
    const zero = page.getByRole('figure', { name: 'Nothing used' });
    await expect(zero.getByRole('option')).toHaveCount(0);
    await expect(zero.getByRole('listbox')).toHaveCount(0);
    await expect(zero).toHaveAccessibleDescription('0% (0 / 100)');
  });

  test('the skeleton, empty, error and tooltip parts take a node, null and a function (C17)', async ({
    page,
  }) => {
    await open(page, 'charts-linechart--state-parts');
    await expect(has(tile(page, 'skeleton-node'), 'skeleton')).toHaveText('Loading orders…');
    await expect(tile(page, 'skeleton-node').locator('[data-umbra="skeleton"]')).toHaveCount(0);
    await expect(has(tile(page, 'skeleton-null'), 'skeleton').locator('*')).toHaveCount(0);
    await expect(has(tile(page, 'empty-node'), 'plot')).toHaveText('Nothing to draw yet.');
    // Nothing but the element that holds the focus of the plot through a change of state.
    await expect(has(tile(page, 'empty-null'), 'plot').locator('*:not([data-idle])')).toHaveCount(0);
    // A function receives the default state as `children`.
    await expect(tile(page, 'empty-function').locator('[data-part="empty"] [data-part="title"]')).toHaveText(
      'No orders',
    );
    await expect(tile(page, 'error-node').getByRole('alert')).toHaveText('Could not load the orders.');
    await expect(has(tile(page, 'error-null'), 'plot').locator('*:not([data-idle])')).toHaveCount(0);
    const error = tile(page, 'error-function').getByRole('alert');
    await expect(error).toContainText('Orders did not load');
    await expect(error.getByRole('button', { name: 'Load again' })).toBeVisible();

    await tile(page, 'tooltip-node').getByRole('option', { name: 'Actual, Dec: 90' }).hover();
    await expect(tooltip(tile(page, 'tooltip-node'))).toHaveText('Orders');
    await tile(page, 'tooltip-null').getByRole('option', { name: 'Actual, Dec: 90' }).hover();
    await expect(ring(tile(page, 'tooltip-null'))).toBeAttached();
    await expect(tooltip(tile(page, 'tooltip-null'))).toHaveCount(0);
  });

  test('a donut named by another element calls its value by `valueLabel` (C7)', async ({ page }) => {
    await open(page, 'charts-donutchart--parts-and-blocks');
    const chart = tile(page, 'named');
    await expect(page.getByRole('figure', { name: 'Budget', exact: true })).toHaveCount(1);
    await expect(chart.getByRole('option')).toHaveAccessibleName('Used: 81% (81 / 100)');
    await expect(chart.getByRole('columnheader')).toHaveText('Used');
  });

  test('the tooltip part receives the title and the rows', async ({ page }) => {
    await open(page, 'charts-linechart--parts-and-blocks');
    const chart = tile(page, 'tooltip');
    await chart.getByRole('option', { name: 'Plan, Mar: 48' }).hover();
    await expect(tooltip(chart)).toHaveText('Mar: Plan 48 · Actual 45');
    await expect(has(chart, 'legend')).toHaveCount(0);
  });
});

test.describe('BarChart', () => {
  test('arrow keys follow the bars: across for a vertical chart, down for a horizontal one', async ({
    page,
  }) => {
    await open(page, 'charts-barchart--interaction');
    const vertical = tile(page, 'vertical');
    await marks(vertical).focus();
    await page.keyboard.press('ArrowRight');
    expect(await current(vertical)).toBe('Plan, Q1: 120');
    await page.keyboard.press('ArrowRight');
    expect(await current(vertical)).toBe('Plan, Q2: 135');
    await page.keyboard.press('ArrowDown');
    expect(await current(vertical)).toBe('Actual, Q2: 141');
    await expect(ring(vertical)).toHaveAttribute('data-keyboard', 'true');
    await expect(tooltip(vertical)).toContainText('Q2');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Pressed: Actual, Q2, 141.')).toBeVisible();

    const horizontal = tile(page, 'horizontal');
    await marks(horizontal).focus();
    // Focus left the first chart, so its point is no longer active.
    expect(await current(vertical)).toBeNull();
    await page.keyboard.press('ArrowDown');
    expect(await current(horizontal)).toBe('Web, Q1: 42');
    await page.keyboard.press('ArrowDown');
    expect(await current(horizontal)).toBe('Web, Q2: 48');
    await page.keyboard.press('ArrowRight');
    expect(await current(horizontal)).toBe('Phone, Q2: 26');
    await page.keyboard.press('ArrowRight');
    expect(await current(horizontal)).toBe('Partners, Q2: 18');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('End');
    expect(await current(horizontal)).toBe('Phone, Q4: 21');
  });

  test('hovering a bar shows its tooltip, and the legend hides a series', async ({ page }) => {
    await open(page, 'charts-barchart--interaction');
    const chart = tile(page, 'vertical');
    await chart.getByRole('option', { name: 'Actual, Q4: 171' }).hover();
    await expect(tooltip(chart)).toContainText('Q4');
    await expect(tooltip(chart)).toContainText('171');
    await inside(tooltip(chart), has(chart, 'plot'));
    await chart.getByRole('option', { name: 'Actual, Q4: 171' }).click();
    await expect(page.getByText('Pressed: Actual, Q4, 171.')).toBeVisible();

    await expect(chart.getByRole('option')).toHaveCount(8);
    await chart.getByRole('button', { name: 'Plan' }).click();
    await expect(chart.getByRole('option')).toHaveCount(4);
    await expect(chart.locator('[data-series="plan"]')).toHaveCount(0);
    // The legend swatch has the same pattern as the bars of its series.
    await expect(chart.getByRole('button', { name: 'Actual' }).locator('[data-kind="stripes"]')).toHaveCount(
      1,
    );
    await expect(chart.locator('[data-series="actual"] [data-pattern="stripes"]')).toHaveCount(4);
  });

  test('sheds the legend, the value labels, the axis titles and the axes as the slot shrinks', async ({
    page,
  }) => {
    await open(page, 'charts-barchart--shrink');
    const parts = async (size: string, nth = 0) => {
      const chart = sized(page, size, nth);
      await inside(chart.locator('svg').first(), chart);
      return {
        level: await chart.getAttribute('data-level'),
        legend: await has(chart, 'legend').count(),
        labels: await chart.locator('[data-part="valueLabels"] text').count(),
        titles: await chart.locator('[data-part="xTitle"], [data-part="yTitle"]').count(),
        axes: await has(chart, 'axes').count(),
        ticks: await chart.locator('[data-part="xTicks"] text').count(),
      };
    };
    expect(await parts('420x270')).toEqual({
      level: '0',
      legend: 1,
      labels: 8,
      titles: 2,
      axes: 1,
      ticks: 8,
    });
    expect(await parts('330x230')).toMatchObject({ level: '1', legend: 0, labels: 8, titles: 2, axes: 1 });
    expect(await parts('270x180')).toMatchObject({ level: '2', legend: 0, labels: 0, titles: 2, axes: 1 });
    expect(await parts('210x140')).toEqual({
      level: '3',
      legend: 0,
      labels: 0,
      titles: 0,
      axes: 1,
      ticks: 4,
    });
    expect(await parts('140x80')).toMatchObject({ level: '4', legend: 0, labels: 0, titles: 0, axes: 0 });
    // Horizontal: the category labels on the left thin out as the chart gets shorter.
    const tall = sized(page, '330x230', 1).locator('[data-part="yTicks"] text');
    const short = sized(page, '210x120').locator('[data-part="yTicks"] text');
    await expect(tall).toHaveCount(8);
    await expect(short).toHaveCount(4);
  });

  test('variants: stacks, both sides of zero, and a pattern with every colour that carries data', async ({
    page,
  }) => {
    await open(page, 'charts-barchart--variants');
    // Stacked: the label is the total of the stack.
    await expect(tile(page, 'stacked').locator('[data-part="valueLabels"] text')).toHaveText([
      '84',
      '92',
      '101',
      '109',
    ]);
    // Diverging: the second series hangs below the zero line, and both sides read as positive.
    const diverging = tile(page, 'diverging');
    const up = (await diverging.getByRole('option', { name: 'Inbound, Jan: 14' }).boundingBox())!;
    const down = (await diverging.getByRole('option', { name: 'Outbound, Jan: 3' }).boundingBox())!;
    expect(down.y).toBeGreaterThanOrEqual(up.y + up.height - 1);
    await expect(diverging.locator('[data-part="yTicks"] text').first()).not.toContainText('-');
    // By sign: negative bars are striped as well as red.
    const sign = tile(page, 'sign');
    await expect(sign.locator('[data-pattern="stripes"]')).toHaveCount(2);
    await expect(sign.locator('[data-part="annotations"] [data-kind="line"]')).toContainText('Target');
    // By threshold: each step has its own fill.
    const steps = tile(page, 'thresholds');
    await expect(steps.locator('[data-pattern="stripes"]')).toHaveCount(2);
    await expect(steps.locator('[data-pattern="dots"]')).toHaveCount(1);
  });
});

test.describe('DonutChart', () => {
  test('arrow keys move around the segments, and the legend hides one', async ({ page }) => {
    await open(page, 'charts-donutchart--interaction');
    const chart = tile(page, 'segments');
    await marks(chart).focus();
    await page.keyboard.press('ArrowRight');
    expect(await current(chart)).toBe('Web: 48 (48%)');
    await expect(ring(chart)).toHaveAttribute('data-keyboard', 'true');
    await expect(tooltip(chart)).toHaveText(/Web\s*48 \(48%\)/);
    await inside(tooltip(chart), chart);
    await page.keyboard.press('ArrowRight');
    expect(await current(chart)).toBe('Phone: 26 (26%)');
    await page.keyboard.press('End');
    expect(await current(chart)).toBe('Other: 8 (8%)');
    await page.keyboard.press('Space');
    await expect(page.getByText('Pressed: Other, 8.')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(tooltip(chart)).toHaveCount(0);

    // Without the largest segment the others share the whole ring.
    await chart.getByRole('button', { name: 'Web' }).click();
    await expect(chart.getByRole('option')).toHaveCount(3);
    await expect(chart.getByRole('option').first()).toHaveAccessibleName('Phone: 26 (50%)');

    const single = tile(page, 'single');
    // The middle of a ring is its hole: point at the band, just right of 12 o'clock.
    const box = (await single.getByRole('option').boundingBox())!;
    const position = { x: box.width / 2 + 12, y: 5 };
    await single.getByRole('option').hover({ position });
    await expect(tooltip(single)).toContainText('81%');
    await single.getByRole('option').click({ position });
    await expect(page.getByText('Pressed: Budget used, 81.')).toBeVisible();
  });

  test('sheds the legend and labels, then the centre caption, then the centre value', async ({ page }) => {
    await open(page, 'charts-donutchart--shrink');
    const parts = async (size: string) => {
      const chart = sized(page, size);
      await inside(chart.locator('svg').first(), chart);
      return {
        level: await chart.getAttribute('data-level'),
        legend: await has(chart, 'legend').count(),
        labels: await chart.locator('[data-part="labels"] text').count(),
        caption: await has(chart, 'centerLabel').count(),
        value: await has(chart, 'centerValue').count(),
      };
    };
    expect(await parts('320x260')).toEqual({ level: '0', legend: 1, labels: 4, caption: 1, value: 1 });
    expect(await parts('190x180')).toEqual({ level: '1', legend: 0, labels: 0, caption: 1, value: 1 });
    expect(await parts('110x100')).toEqual({ level: '2', legend: 0, labels: 0, caption: 0, value: 1 });
    expect(await parts('56x56')).toEqual({ level: '3', legend: 0, labels: 0, caption: 0, value: 0 });
    // The single-value ring of the source: about 80px, with its percentage inside.
    await expect(has(sized(page, '80x80'), 'centerValue')).toHaveText('81%');
    await inside(has(sized(page, '80x80'), 'centerValue'), sized(page, '80x80'));
    await expect(has(sized(page, '48x48'), 'centerValue')).toHaveCount(0);
    await expect(sized(page, '48x48').getByRole('option')).toHaveAccessibleName(/81%/);
  });
});

test.describe('RadarChart', () => {
  test('arrow keys move around the axes and between series', async ({ page }) => {
    await open(page, 'charts-radarchart--interaction');
    const chart = tile(page, 'several');
    await marks(chart).focus();
    await page.keyboard.press('ArrowRight');
    expect(await current(chart)).toBe('Region 1, Speed: 16');
    await page.keyboard.press('ArrowRight');
    expect(await current(chart)).toBe('Region 1, Quality: 12');
    await page.keyboard.press('ArrowDown');
    expect(await current(chart)).toBe('Region 2, Quality: 15');
    await expect(tooltip(chart)).toContainText('Quality');
    await expect(tooltip(chart)).toContainText('Region 3');
    await inside(tooltip(chart), chart);
    await page.keyboard.press('Enter');
    await expect(page.getByText('Pressed: Region 2, Quality, 15.')).toBeVisible();

    await chart.getByRole('button', { name: 'Region 2' }).click();
    await expect(chart.locator('[data-series="b"]')).toHaveCount(0);
    await expect(chart.getByRole('option')).toHaveCount(12);
    // Each series has its own point shape, in the chart and in the legend.
    await expect(chart.locator('[data-series="c"] [data-shape="diamond"]')).toHaveCount(6);
    await expect(
      chart.getByRole('button', { name: 'Region 3' }).locator('[data-kind="diamond"]'),
    ).toHaveCount(1);
  });

  test('sheds the legend, then the values, then the axis labels, and labels stay inside', async ({
    page,
  }) => {
    await open(page, 'charts-radarchart--shrink');
    const parts = async (size: string) => {
      const chart = sized(page, size);
      for (const label of await chart.locator('[data-part="axisLabels"] text').all())
        await inside(label, chart);
      return {
        level: await chart.getAttribute('data-level'),
        legend: await has(chart, 'legend').count(),
        values: await has(chart, 'valueLabel').count(),
        labels: await chart.locator('[data-part="axisLabels"] text').count(),
      };
    };
    expect(await parts('380x300')).toEqual({ level: '0', legend: 1, values: 8, labels: 8 });
    // Measured in the chart's font, all eight names fit with their values here.
    expect(await parts('280x230')).toEqual({ level: '1', legend: 0, values: 8, labels: 8 });
    expect(await parts('210x170')).toEqual({ level: '2', legend: 0, values: 0, labels: 8 });
    expect(await parts('140x120')).toEqual({ level: '3', legend: 0, values: 0, labels: 0 });
    expect(await parts('56x56')).toEqual({ level: '3', legend: 0, values: 0, labels: 0 });
    // Labels too long for their room end in an ellipsis instead of leaving the chart.
    const long = sized(page, '230x200');
    await expect(long.locator('[data-part="axisLabels"] text').first()).toContainText('…');
    for (const label of await long.locator('[data-part="axisLabels"] text').all()) await inside(label, long);
  });
});

// `height`: the stories of "Layout/Content height" hold a table, a list and a chart side by side.
const openHeight = async (page: Page, story: string) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`/iframe.html?id=layout-content-height--${story}&viewMode=story`);
  await page.locator('#storybook-root > *').first().waitFor();
  await page.evaluate(() => document.fonts.ready);
};
/** Opens the popover of the card the stack collapsed. */
const openCollapsed = async (page: Page, title: string) => {
  await page.locator('[data-collapsed="layout"]').getByRole('button', { name: title }).click();
  return page.getByRole('dialog');
};

test.describe('height', () => {
  const plot = async (chart: Locator) =>
    Math.round((await chart.locator('[data-part="plot"]').boundingBox())!.height);

  test('with no height to fill a chart takes its content height; "content" says so', async ({ page }) => {
    await openHeight(page, 'flowing');
    const flowing = page.getByRole('figure', { name: 'Flowing chart' });
    await flowing.scrollIntoViewIfNeeded();
    await expect(flowing).toHaveAttribute('data-height', 'fill');
    expect(await plot(flowing)).toBe(240);
    await expect(marks(flowing).getByRole('option')).toHaveCount(6);
    const content = page.getByRole('figure', { name: 'Content chart' });
    await expect(content).toHaveAttribute('data-height', 'content');
    expect(await plot(content)).toBe(240);
    // The token sets the content height; a number sets the whole chart.
    await content.evaluate((el) => el.style.setProperty('--umbra-chart-content-height', '100px'));
    await expect.poll(() => plot(content)).toBe(100);
  });

  test('a chart shows in the popover of a collapsed card, an accordion panel and a modal', async ({
    page,
  }) => {
    await openHeight(page, 'collapsed-cards');
    const dialog = await openCollapsed(page, 'Chart');
    const donut = dialog.getByRole('figure', { name: 'Orders by region' });
    expect(await plot(donut)).toBe(240);
    await expect(marks(donut).getByRole('option')).toHaveCount(4);

    await openHeight(page, 'panel-and-modal');
    const inModal = page.getByRole('dialog').getByRole('figure', { name: 'Chart in a modal' });
    expect(await plot(inModal)).toBe(240);
    await expect(marks(inModal).getByRole('option')).toHaveCount(4);
    await page.keyboard.press('Escape');
    const inPanel = page.getByRole('figure', { name: 'Chart in a panel' });
    expect(await plot(inPanel)).toBe(240);
    await expect(marks(inPanel).getByRole('option')).toHaveCount(6);
  });
});

/** Every label drawn in a chart that sticks out of its drawing, with how far on each side. */
const cutLabels = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('figure svg text')].flatMap((text) => {
      const svg = text.closest('svg')!.getBoundingClientRect();
      const box = text.getBoundingClientRect();
      const out = Math.max(
        svg.left - box.left,
        box.right - svg.right,
        svg.top - box.top,
        box.bottom - svg.bottom,
      );
      return out > 0.5 ? [`${text.textContent}: ${out.toFixed(1)}px`] : [];
    }),
  );

test.describe('labels are measured in the chart’s font, so none is cut (C2, C3, C11)', () => {
  for (const chart of ['barchart', 'donutchart', 'linechart', 'radarchart']) {
    test(`${chart}: at every size and density`, async ({ page }) => {
      test.setTimeout(90_000);
      for (const [width, height] of [
        [1024, 600],
        [1280, 720],
        [1920, 1080],
      ] as const) {
        for (const density of ['compact', 'default', 'spacious']) {
          await open(page, `charts-${chart}--variants&globals=density:${density}`, width, height);
          await expect(page.locator('figure svg').first()).toBeAttached();
          expect(await cutLabels(page), `${width}x${height} ${density}`).toEqual([]);
        }
      }
    });
  }

  test('the last value under a sideways bar chart has room, and stays on its grid line', async ({ page }) => {
    await open(page, 'charts-barchart--variants', 1024, 600);
    const chart = tile(page, 'thresholds');
    const last = has(chart, 'xTicks').locator('text').last();
    await expect(last).toHaveText('100%');
    const [label, svg] = [(await last.boundingBox())!, (await chart.locator('svg').boundingBox())!];
    expect(label.x + label.width).toBeLessThanOrEqual(svg.x + svg.width);
    // Centred on the end of the plot, where the last grid line is.
    const line = (await has(chart, 'grid').locator('line').last().boundingBox())!;
    expect(Math.abs(label.x + label.width / 2 - line.x)).toBeLessThan(1.5);
  });
});

test.describe('tooltip', () => {
  const box = async (locator: Locator) => (await locator.boundingBox())!;

  test('is never cut: in a plot too short for it, it leaves the chart, whole and beside its point (C9)', async ({
    page,
  }) => {
    await open(page, 'charts-linechart--short-plot');
    for (const size of ['420x108', '150x108']) {
      const chart = sized(page, size);
      const tip = tooltip(chart);
      let outside = 0;
      for (const name of ['Region 1, Jan 1: 30', 'Region 3, Jan 29: 17', 'Region 1, Feb 19: 58']) {
        // Points are close together here: the pointer goes to the point's place, whichever point is on top.
        await chart.getByRole('option', { name }).hover({ force: true });
        await expect(tip).toBeVisible();
        const [t, c, point] = [await box(tip), await box(chart), await box(ring(chart))];
        // It is drawn in the top layer, where the chart does not clip it, and inside the window.
        expect(await tip.evaluate((el) => el.matches(':popover-open'))).toBe(true);
        if (t.y < c.y || t.y + t.height > c.y + c.height) outside += 1;
        expect(t.x).toBeGreaterThanOrEqual(0);
        expect(t.y).toBeGreaterThanOrEqual(0);
        expect(t.x + t.width).toBeLessThanOrEqual(1280);
        expect(t.y + t.height).toBeLessThanOrEqual(720);
        // Nothing of its content is cut inside it either.
        expect(await tip.evaluate((el) => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(0);
        expect(await tip.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0);
        // It sits above or below the point, not on it.
        const middle = point.y + point.height / 2;
        expect(middle < t.y || middle > t.y + t.height, `${size} ${name} off the point`).toBe(true);
      }
      // A point in the middle of the plot has no room for it on either side inside the chart.
      expect(outside, size).toBeGreaterThan(0);
    }
    // Where it fits, it stays inside the chart.
    await open(page, 'charts-linechart--interaction');
    const roomy = tile(page, 'controlled');
    await roomy.getByRole('option', { name: 'Actual, Jun: 58 orders' }).hover();
    await inside(tooltip(roomy), roomy);
  });

  test('Escape dismisses a hover tooltip, with the focus anywhere (C10)', async ({ page }) => {
    await open(page, 'charts-linechart--interaction');
    const chart = tile(page, 'controlled');
    await chart.getByRole('option', { name: 'Actual, Jun: 58 orders' }).hover();
    await expect(tooltip(chart)).toBeVisible();
    expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(tooltip(chart)).toHaveCount(0);
    await expect(ring(chart)).toHaveCount(0);
    // It comes back when the pointer reaches another point, and Escape works from another control too.
    await chart.getByRole('option', { name: 'Actual, Dec: 90 orders' }).hover();
    await expect(tooltip(chart)).toContainText('Dec');
    await page.getByRole('button', { name: 'Show all' }).focus();
    await page.keyboard.press('Escape');
    await expect(tooltip(chart)).toHaveCount(0);
  });

  test('hovering a donut segment or a radar point shows its tooltip', async ({ page }) => {
    await open(page, 'charts-donutchart--interaction');
    const donut = tile(page, 'segments');
    const segment = await box(donut.getByRole('option', { name: /^Web:/ }).locator('path').last());
    // The middle of a segment's box is the hole of the ring; a quarter in from the right edge is on the ring.
    await page.mouse.move(segment.x + segment.width - 6, segment.y + segment.height / 2);
    await expect(tooltip(donut)).toContainText('Web');
    await expect(tooltip(donut)).toContainText('48');
    await inside(tooltip(donut), donut);
    await page.mouse.move(2, 2);
    await expect(tooltip(donut)).toHaveCount(0);

    await open(page, 'charts-radarchart--interaction');
    const radar = tile(page, 'several');
    const point = await box(
      radar.getByRole('option', { name: 'Region 2, Quality: 15' }).locator('[data-shape]'),
    );
    await page.mouse.move(point.x + point.width / 2, point.y + point.height / 2);
    await expect(tooltip(radar)).toContainText('Quality');
    // One row for each series on that axis.
    await expect(tooltip(radar)).toContainText('Region 1');
    await expect(tooltip(radar)).toContainText('15');
    await expect(ring(radar)).not.toHaveAttribute('data-keyboard', 'true');
  });
});

test.describe('non-text contrast and target size (C12, C13, C14)', () => {
  /** Contrast of an element's paint against the card it sits on, as the browser resolves both colours. */
  const contrast = (locator: Locator, property: 'stroke' | 'fill') =>
    locator.evaluate((el, prop) => {
      const context = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
      const luminance = (colour: string) => {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = colour;
        context.fillRect(0, 0, 1, 1);
        const [r, g, b] = [...context.getImageData(0, 0, 1, 1).data].map((v) => {
          const c = v / 255;
          return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
      };
      const card = getComputedStyle(el.closest('[data-umbra="card"]')!).backgroundColor;
      const [a, b] = [luminance(getComputedStyle(el)[prop]), luminance(card)];
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    }, property);

  for (const tint of ['violet', 'teal', 'green', 'slate']) {
    test(`on ${tint}: the donut track and an annotation band have an edge with 3:1`, async ({ page }) => {
      await open(page, `charts-donutchart--variants&globals=context:${tint}`);
      const track = has(tile(page, 'single'), 'track').locator('path[class*="track"]');
      expect(await contrast(track, 'stroke')).toBeGreaterThanOrEqual(3);
      // The edge is inside the ring: the track is no larger than it was.
      const [ring, plot] = [
        (await track.boundingBox())!,
        (await tile(page, 'single').locator('svg').boundingBox())!,
      ];
      expect(ring.width).toBeLessThanOrEqual(plot.width);

      await open(page, `charts-barchart--variants&globals=context:${tint}`);
      const band = tile(page, 'thresholds').locator('[data-part="annotations"] [data-kind="band"]');
      await expect(band.locator('rect')).toHaveCount(1);
      // One line at each end of the band, across the plot.
      await expect(band.locator('line')).toHaveCount(2);
      for (const line of await band.locator('line').all())
        expect(await contrast(line, 'stroke')).toBeGreaterThanOrEqual(3);
    });
  }

  test('a point of a line or a radar is a target of at least 24 by 24 pixels', async ({ page }) => {
    for (const [story, id] of [
      ['charts-linechart--interaction', 'controlled'],
      ['charts-radarchart--interaction', 'several'],
    ] as const) {
      await open(page, story);
      const hit = (await tile(page, id).getByRole('option').first().locator('circle').first().boundingBox())!;
      expect(hit.width, story).toBeGreaterThanOrEqual(24);
      expect(hit.height, story).toBeGreaterThanOrEqual(24);
    }
  });
});

test('a legend glyph is drawn with the dash of its line (C5)', async ({ page }) => {
  for (const [story, id, series] of [
    ['charts-radarchart--interaction', 'several', { a: 'Region 1', b: 'Region 2', c: 'Region 3' }],
    ['charts-linechart--interaction', 'controlled', { plan: 'Plan', actual: 'Actual' }],
  ] as const) {
    await open(page, story, 1920, 1080);
    const chart = tile(page, id);
    const dashes: string[] = [];
    for (const [seriesId, name] of Object.entries(series)) {
      const line = chart.locator(`[data-series="${seriesId}"] path[class*="line"]`);
      const glyph = chart.getByRole('button', { name, exact: true }).locator('svg > path').first();
      const drawn = await line.getAttribute('stroke-dasharray');
      expect(await glyph.getAttribute('stroke-dasharray'), `${story} ${name}`).toBe(drawn);
      dashes.push(drawn ?? 'solid');
    }
    expect(dashes).toEqual(['solid', '6 3', '2 3'].slice(0, dashes.length));
  }
});

test.describe('right to left (C1)', () => {
  /** Where every label of every chart sits inside its drawing, by tile. */
  const labelPlaces = (page: Page) =>
    page.evaluate(() =>
      Object.fromEntries(
        [...document.querySelectorAll('[data-tile]')].map((tile) => [
          tile.getAttribute('data-tile'),
          [...tile.querySelectorAll('figure svg text')].map((text) => {
            const svg = text.closest('svg')!.getBoundingClientRect();
            const box = text.getBoundingClientRect();
            return `${text.textContent} ${Math.round(box.left - svg.left)},${Math.round(box.top - svg.top)}`;
          }),
        ]),
      ),
    );

  for (const chart of ['barchart', 'donutchart', 'linechart', 'radarchart']) {
    test(`${chart}: the plot is drawn as in a left-to-right page, with every label in its place`, async ({
      page,
    }) => {
      await open(page, `charts-${chart}--variants`);
      const ltr = await labelPlaces(page);
      await open(page, `charts-${chart}--variants&globals=direction:rtl`);
      await expect(page.locator('figure').first()).toHaveCSS('direction', 'rtl');
      const rtl = await labelPlaces(page);
      // A date is written in the page's language, so only tiles with the same words can be compared.
      const words = (places: string[]) => places.map((p) => p.replace(/ -?\d+,-?\d+$/, '')).join();
      const same = Object.keys(ltr).filter((id) => words(ltr[id]!) === words(rtl[id]!));
      expect(same.length).toBeGreaterThanOrEqual(4);
      for (const id of same) expect(rtl[id], id).toEqual(ltr[id]);
    });
  }

  test('labels stay off the marks, the legend mirrors, and the arrow keys follow what is drawn', async ({
    page,
  }) => {
    await open(page, 'charts-right-to-left--all-charts');
    const overlaps = await page.evaluate(() => {
      const hit = (a: DOMRect, b: DOMRect) =>
        a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
      return [...document.querySelectorAll('figure')].flatMap((figure) => {
        const marks = [
          ...figure.querySelectorAll('[data-part="bars"] rect, [data-part="point"] [data-shape]'),
        ];
        const labels = [...figure.querySelectorAll('[data-part="axes"] text, [data-part="axisLabels"] text')];
        return labels.flatMap((label) =>
          marks.some((mark) => hit(label.getBoundingClientRect(), mark.getBoundingClientRect()))
            ? [label.textContent]
            : [],
        );
      });
    });
    expect(overlaps).toEqual([]);
    expect(await cutLabels(page)).toEqual([]);

    // Sideways bars: the categories are left of the plot and the bars grow to the right, as drawn.
    const bar = tile(page, 'bar');
    const category = (await has(bar, 'yTicks').locator('text').first().boundingBox())!;
    const first = (await has(bar, 'bars').locator('rect').first().boundingBox())!;
    expect(category.x + category.width).toBeLessThanOrEqual(first.x);
    // A label in a right-to-left script keeps its own direction.
    await expect(has(bar, 'yTicks').locator('text').last()).toHaveText('אזור 4');
    // The legend is HTML: `end` is the left side of a right-to-left page.
    const [legend, plot] = [
      (await has(bar, 'legend').boundingBox())!,
      (await has(bar, 'plot').boundingBox())!,
    ];
    expect(legend.x + legend.width).toBeLessThanOrEqual(plot.x + 1);

    // ArrowRight moves to the point on the right, because the plot is not mirrored.
    const line = tile(page, 'line');
    await marks(line).focus();
    await page.keyboard.press('ArrowRight');
    expect(await current(line)).toBe('Plan, Jan: 40');
    const x = () => ring(line).evaluate((el) => el.getBoundingClientRect().x);
    const before = await x();
    await page.keyboard.press('ArrowRight');
    expect(await current(line)).toBe('Plan, Feb: 44');
    expect(await x()).toBeGreaterThan(before);
    await page.keyboard.press('ArrowLeft');
    expect(await current(line)).toBe('Plan, Jan: 40');
  });
});
