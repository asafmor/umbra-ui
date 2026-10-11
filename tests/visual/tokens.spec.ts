import { expect, test } from '@playwright/test';
import { openStory } from './helpers';

// A token an app sets on an ancestor reaches its reader inside every container that has a default of
// its own for it (plan/decisions/07-customisation.md, "Tokens"): the container sets a private
// property, never the public one. Each case fails if its container declares the token again.
interface Case {
  /** The container, and what inside it reads the token. */
  where: string;
  story: string;
  /** The element that reads the token. */
  selector: string;
  token: string;
  value: string;
  /** The computed property that shows it: a CSS property in camelCase, or a custom property. */
  shows: string;
  /** What the computed value holds once the token is set; `value` by default. */
  holds?: string;
  /** The property is drawn only on the focused element. */
  focus?: boolean;
}

const colour = 'rgb(1, 2, 3)';
const inwards = '-2px';
const cases: Case[] = [
  // --umbra-badge-ring: the filled surfaces give a badge a ring in their text colour.
  ...[
    [
      'a filled Button',
      'data-badge--on-filled-surfaces',
      'button[data-variant="accent"] [data-part="indicator"]',
    ],
    [
      'the TopBar',
      'shell-app-shell--full-screen',
      '[data-umbra="top-bar"] [data-umbra="badge"] [data-part="indicator"]',
    ],
    [
      'a band Card header',
      'data-badge--on-filled-surfaces',
      '[data-header-style="band"] [data-part="indicator"]',
    ],
  ].map(([where, story, selector]) => ({
    where: `badge ring in ${where}`,
    story: story!,
    selector: selector!,
    token: '--umbra-badge-ring',
    value: colour,
    shows: 'boxShadow',
  })),
  {
    // No story has a badge in a band header: the token itself is read where the badge would be.
    where: 'badge ring in a band PageHeader',
    story: 'shell-pageheader--tones',
    selector: '[data-umbra="page-header"][data-tone="band"] [data-part="title"]',
    token: '--umbra-badge-ring',
    value: colour,
    shows: '--umbra-badge-ring',
  },
  // The badge in the corner of an icon button is smaller, through Badge's tokens.
  {
    where: 'badge size in an IconButton',
    story: 'shell-app-shell--full-screen',
    selector: 'button[data-icon-only] [data-part="indicator"]:not([data-dot])',
    token: '--umbra-badge-size',
    value: '21px',
    shows: 'height',
  },
  {
    where: 'badge padding in an IconButton',
    story: 'shell-app-shell--full-screen',
    selector: 'button[data-icon-only] [data-part="indicator"]:not([data-dot])',
    token: '--umbra-badge-padding-x',
    value: '9px',
    shows: 'paddingLeft',
  },
  {
    where: 'badge font in an IconButton',
    story: 'shell-app-shell--full-screen',
    selector: 'button[data-icon-only] [data-part="indicator"]:not([data-dot])',
    token: '--umbra-badge-font',
    value: '700 17px / 1 sans-serif',
    shows: 'fontSize',
    holds: '17px',
  },
  {
    // No story has a dot on an icon button: the token itself is read on the badge.
    where: 'badge dot size in an IconButton',
    story: 'shell-app-shell--full-screen',
    selector: 'button[data-icon-only] [data-part="indicator"]',
    token: '--umbra-badge-dot-size',
    value: '11px',
    shows: '--umbra-badge-dot-size',
  },
  // The media of a PageHeader takes the header's size.
  {
    where: 'avatar size in a PageHeader',
    story: 'shell-pageheader--content',
    selector: '[data-umbra="page-header"] [data-part="media"] [data-umbra="avatar"]',
    token: '--umbra-avatar-size',
    value: '37px',
    shows: 'height',
  },
  {
    where: 'entity icon size in a PageHeader',
    story: 'shell-pageheader--in-page',
    selector: '[data-umbra="page-header"] [data-part="media"] [data-part="mark"]',
    token: '--umbra-entity-icon-size',
    value: '37px',
    shows: 'height',
  },
  // --umbra-focus-color: a filled surface picks a ring that shows on it.
  ...[
    [
      'the TopBar',
      'shell-app-shell--full-screen',
      '[data-umbra="top-bar"] [data-umbra="icon-button"]:not(:disabled, [aria-disabled])',
    ],
    ['a band PageHeader', 'shell-pageheader--tones', '[data-umbra="page-header"][data-tone="band"] button'],
    [
      'a PageHeader with a band colour',
      'shell-pageheader--tones',
      '[data-umbra="page-header"][style*="--umbra-page-header-bg"] button',
    ],
    ['a solid Banner', 'data-banner--content', '[data-umbra="banner"][data-variant="solid"] button'],
  ].map(([where, story, selector]) => ({
    where: `focus colour in ${where}`,
    story: story!,
    selector: selector!,
    token: '--umbra-focus-color',
    value: colour,
    shows: 'outlineColor',
    focus: true,
  })),
  // --umbra-focus-offset: a container that clips draws the rings of its controls inwards.
  ...[
    ['a DataTable control', 'data-datatable--people', '[data-umbra="data-table"] td button[data-icon-only]'],
    ['a Legend', 'data-legend--interactive', '[data-umbra="legend"] button'],
    ['an EmptyState', 'data-emptystate--variants', '[data-umbra="empty-state"] button'],
    ['a ListItem', 'data-listitem--default', '[data-umbra="list-item"] [data-part="trailing"] button'],
    ['a GroupHeader', 'data-groupheader--variants', '[data-umbra="group-header"] button'],
    ['a solid Banner', 'data-banner--content', '[data-umbra="banner"][data-variant="solid"] button'],
    [
      'the dismiss button of a Banner',
      'data-banner--dismissal',
      '[data-umbra="banner"] [data-part="dismiss"] button',
    ],
  ].map(([where, story, selector]) => ({
    where: `focus offset in ${where}`,
    story: story!,
    selector: selector!,
    token: '--umbra-focus-offset',
    value: '7px',
    shows: 'outlineOffset',
    focus: true,
  })),
  // --umbra-icon-button-size and --umbra-icon-size.
  {
    where: 'icon button size in a DataTable',
    story: 'data-datatable--people',
    selector: '[data-umbra="data-table"] td button[data-icon-only]',
    token: '--umbra-icon-button-size',
    value: '31px',
    shows: 'height',
  },
  {
    where: 'icon button size of the dismiss button of a Banner',
    story: 'data-banner--dismissal',
    selector: '[data-umbra="banner"] [data-part="dismiss"] button',
    token: '--umbra-icon-button-size',
    value: '31px',
    shows: 'height',
  },
  {
    where: 'icon size in an EmptyState',
    story: 'data-emptystate--variants',
    selector: '[data-umbra="empty-state"]:not([data-variant="inline"]) > [data-part="icon"] > *',
    token: '--umbra-icon-size',
    value: '37px',
    shows: 'height',
  },
  {
    where: 'icon size in an inline EmptyState',
    story: 'data-emptystate--variants',
    selector: '[data-umbra="empty-state"][data-variant="inline"] > [data-part="icon"] > *',
    token: '--umbra-icon-size',
    value: '37px',
    shows: 'height',
  },
  // --umbra-scroll-fade-color: a surface sets the colour the fade of a ScrollArea blends into.
  ...[
    ['a Card', 'pages-overview--overview', '[data-umbra="card"] [data-part="fade"]'],
    ['a Modal', 'overlays-modal--medium', '[data-umbra="modal"] [data-part="fade"]'],
    ['a Popover', 'overlays-popover--basic', '[data-umbra="popover"] [data-part="fade"]'],
    ['a card Accordion', 'layout-accordion--limited-height', '[data-umbra="accordion"] [data-part="fade"]'],
  ].map(([where, story, selector]) => ({
    where: `scroll fade colour in ${where}`,
    story: story!,
    selector: selector!,
    token: '--umbra-scroll-fade-color',
    value: colour,
    shows: 'backgroundImage',
  })),
  {
    // The table mixes its opaque fills into the surface it is on, which it reads from the same token.
    where: 'scroll fade colour as the surface of a DataTable in a Card',
    story: 'pages-table--table',
    selector: '[data-umbra="card"] [data-umbra="data-table"]',
    token: '--umbra-scroll-fade-color',
    value: colour,
    shows: '--surface',
  },
];

for (const c of cases) {
  test(`${c.where}: ${c.token} set on the page reaches it`, async ({ page }) => {
    await openStory(page, c.story);
    const reader = page.locator(c.selector).first();
    await reader.waitFor({ state: 'attached' });
    if (c.focus) {
      // A key first: rings are drawn for keyboard focus only.
      await page.keyboard.press('Tab');
      await reader.focus();
    }
    const shown = () =>
      reader.evaluate((el, name) => {
        const css = getComputedStyle(el);
        return name.startsWith('--') ? css.getPropertyValue(name) : String(css[name as 'height']);
      }, c.shows);
    const holds = c.holds ?? c.value;
    // The container's own default first, so the test cannot pass on a value that was always there.
    expect(await shown()).not.toContain(holds);
    if (c.token === '--umbra-focus-offset' && c.where !== 'focus offset in a solid Banner') {
      expect(await shown()).toBe(inwards);
    }
    await page.evaluate(([n, v]) => document.documentElement.style.setProperty(n!, v!), [c.token, c.value]);
    await expect.poll(shown).toContain(holds);
  });
}

test("a container's own token still sets its default while the global one is not set", async ({ page }) => {
  await openStory(page, 'data-datatable--people');
  const control = page.locator('[data-umbra="data-table"] td button[data-icon-only]').first();
  await page.evaluate(() => document.documentElement.style.setProperty('--umbra-table-control-size', '19px'));
  await expect.poll(async () => (await control.boundingBox())!.height).toBe(19);
  // The global token, set on an ancestor, wins over the container's default.
  await page.evaluate(() => document.documentElement.style.setProperty('--umbra-icon-button-size', '23px'));
  await expect.poll(async () => (await control.boundingBox())!.height).toBe(23);
});
