import { expect, test, type Page } from '@playwright/test';
import { expectFocusKept } from './helpers';

// Modal and ConfirmDialog: opening and closing, focus, the close guard, stacking, scrolling, the
// inert page behind, and the full-window form below the minimum window.
const open = async (page: Page, story: string, width = 1280, height = 720) => {
  await page.setViewportSize({ width, height });
  await page.goto(`/iframe.html?id=overlays-modal--${story}&viewMode=story`);
  await page.locator('[data-umbra="modal"]').first().waitFor();
  await page.evaluate(() => document.fonts.ready);
};
const dialog = (page: Page, name: string | RegExp) => page.getByRole('dialog', { name });
/** A press on the backdrop, outside the panel. */
const pressOutside = (page: Page) => page.mouse.click(8, 8);

test.describe('open and close', () => {
  test('the trigger opens it and gets the focus back when it closes', async ({ page }) => {
    await open(page, 'medium');
    const modal = dialog(page, 'Export report (md)');
    await expect(modal).toBeVisible();
    // Everything else is hidden from assistive technology while it is open.
    await expect(page.locator('#storybook-root')).toHaveAttribute('inert', '');
    await expect(modal).toHaveAccessibleDescription('Choose what the export contains.');
    await modal.getByRole('button', { name: 'Close' }).click();
    await expect(modal).toBeHidden();

    const trigger = page.getByRole('button', { name: 'Open report' });
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(modal).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('an outside press and a footer action close it', async ({ page }) => {
    await open(page, 'medium');
    const modal = dialog(page, 'Export report (md)');
    await pressOutside(page);
    await expect(modal).toBeHidden();
    await page.getByRole('button', { name: 'Open report' }).click();
    await expect(modal).toBeVisible();
    await modal.getByRole('button', { name: 'Confirm' }).click();
    await expect(modal).toBeHidden();
  });

  test('the panel keeps the density and context of where it was opened', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(
      '/iframe.html?id=overlays-modal--medium&viewMode=story&globals=density:compact;context:teal',
    );
    const backdrop = page.locator('[data-umbra="modal-backdrop"]');
    await expect(backdrop).toHaveAttribute('data-umbra-density', 'compact');
    await expect(backdrop).toHaveAttribute('data-umbra-context', 'teal');
  });
});

test.describe('focus', () => {
  test('starts on the first control outside the header and is trapped inside', async ({ page }) => {
    await open(page, 'medium');
    const modal = dialog(page, 'Export report (md)');
    const cancel = modal.getByRole('button', { name: 'Cancel' });
    const close = modal.getByRole('button', { name: 'Close' });
    await expect(cancel).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(modal.getByRole('button', { name: 'Confirm' })).toBeFocused();
    // Past the last control it wraps to the first: the close button, the header's last focus stop.
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(modal.getByRole('button', { name: 'Confirm' })).toBeFocused();
  });

  test('`initialFocusRef` chooses the control', async ({ page }) => {
    await open(page, 'blocks');
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeFocused();
  });

  test('a form starts on its first field', async ({ page }) => {
    await open(page, 'form');
    await expect(page.getByRole('textbox', { name: 'Display name' })).toBeFocused();
  });
});

test('the page behind is inert: its button cannot be clicked or focused', async ({ page }) => {
  await open(page, 'drawer-start');
  const refresh = page.getByRole('button', { name: 'Refresh', includeHidden: true });
  // The drawer leaves the button in view; the press lands on the backdrop and closes the drawer instead.
  const box = (await refresh.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.getByText('Background presses: 0')).toBeAttached();
  await expect(dialog(page, 'Order 12 (start)')).toBeHidden();
  await page.getByRole('button', { name: 'Show details' }).click();
  await expect(dialog(page, 'Order 12 (start)')).toBeVisible();

  // Hidden from assistive technology, and not reachable by Tab or by script.
  expect(await refresh.evaluate((el) => !!el.closest('[inert]'))).toBe(true);
  await refresh.evaluate((el: HTMLElement) => el.focus());
  await expect(refresh).not.toBeFocused();
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('[data-umbra="modal"]'))).toBe(true);
  }
  await expect(page.getByText('Background presses: 0')).toBeAttached();
});

test('`onRequestClose` keeps it open while there are unsaved changes', async ({ page }) => {
  await open(page, 'form');
  const modal = dialog(page, 'Edit profile');
  await page.getByRole('textbox', { name: 'Display name' }).fill('Person B');
  await page.keyboard.press('Escape');
  await expect(modal.getByText('Close blocked: 1')).toBeVisible();
  await pressOutside(page);
  await expect(modal.getByText('Close blocked: 2')).toBeVisible();
  await modal.getByRole('button', { name: 'Close' }).click();
  await expect(modal.getByText('Close blocked: 3')).toBeVisible();
  await expect(modal).toBeVisible();

  await modal.getByRole('button', { name: 'Discard' }).click();
  await expect(modal.getByText('No changes')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(modal).toBeHidden();
});

test('an alert dialog starts on its first action and ignores an outside press', async ({ page }) => {
  await open(page, 'alert-dialog');
  const alert = page.getByRole('alertdialog', { name: 'Sign out everywhere?' });
  await expect(alert).toHaveAccessibleDescription('You will need to sign in again on every device.');
  await expect(alert.getByRole('button', { name: 'Stay signed in' })).toBeFocused();
  await expect(alert.getByRole('button', { name: 'Close' })).toHaveCount(0);
  await pressOutside(page);
  await expect(alert).toBeVisible();
  // The press took the focus for a moment; it comes back to where it was.
  await expect(alert.getByRole('button', { name: 'Stay signed in' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(alert).toBeHidden();
});

test('nested: Escape and an outside press close only the top modal', async ({ page }) => {
  await open(page, 'nested');
  const outer = page.getByRole('dialog', { name: 'Order 12', includeHidden: true });
  const inner = dialog(page, 'Add a note');
  await expect(inner).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Note' })).toBeFocused();
  // The top modal is in front of the one it was opened from.
  expect(
    await inner.evaluate((el) => {
      const { x, y, width, height } = el.getBoundingClientRect();
      return el.contains(document.elementFromPoint(x + width / 2, y + height / 2));
    }),
  ).toBe(true);

  await page.keyboard.press('Escape');
  await expect(inner).toBeHidden();
  await expect(outer).toBeVisible();
  await expect(outer.getByRole('button', { name: 'Add a note' })).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(page.getByRole('textbox', { name: 'Note' })).toBeFocused();
  await pressOutside(page);
  await expect(inner).toBeHidden();
  await expect(outer).toBeVisible();
  await expect(outer.getByRole('button', { name: 'Add a note' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(outer).toBeHidden();
});

test('a menu opened inside a modal is above it, and Escape closes the menu first', async ({ page }) => {
  await open(page, 'toolbar-tabs');
  const modal = dialog(page, 'Region 2');
  await modal.getByRole('button', { name: 'More' }).focus();
  await page.keyboard.press('Enter');
  const item = page.getByRole('menuitem', { name: 'Export' });
  await expect(item).toBeFocused();
  expect(
    await item.evaluate((el) => {
      const { x, y, width, height } = el.getBoundingClientRect();
      return el.contains(document.elementFromPoint(x + width / 2, y + height / 2));
    }),
  ).toBe(true);
  await page.keyboard.press('Escape');
  await expect(item).toBeHidden();
  await expect(page.locator('[data-umbra="modal"]')).toBeVisible();
  await expect(modal.getByRole('button', { name: 'More' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-umbra="modal"]')).toBeHidden();
});

test('ConfirmDialog: loading while the action runs, open after a failure, closed after a success', async ({
  page,
}) => {
  await open(page, 'confirm');
  const confirm = page.getByRole('alertdialog', { name: 'Delete this report?' });
  const cancel = confirm.getByRole('button', { name: 'Cancel' });
  const submit = confirm.getByRole('button', { name: /Delete/ });
  await expect(cancel).toBeFocused();

  await submit.click();
  await expect(submit).toHaveAttribute('data-pending', 'true');
  await expect(cancel).toBeDisabled();
  // Nothing closes it while the action runs.
  await page.keyboard.press('Escape');
  await expect(confirm).toBeVisible();
  // The action fails: the dialog stays open and can be tried again.
  await confirm.getByRole('button', { name: 'Fails' }).click();
  await expect(confirm.getByRole('alert')).toHaveText('Could not delete the report. Try again.');
  await expect(submit).not.toHaveAttribute('data-pending', 'true');
  await expect(cancel).toBeEnabled();
  await expect(confirm).toBeVisible();

  await submit.click();
  await expect(cancel).toBeDisabled();
  await confirm.getByRole('button', { name: 'Succeeds' }).click();
  await expect(confirm).toBeHidden();
  await expect(page.getByText('Result: deleted')).toBeVisible();

  // Cancel closes it without running the action.
  await page.getByRole('button', { name: 'Delete report' }).click();
  await confirm.getByRole('button', { name: 'Cancel' }).click();
  await expect(confirm).toBeHidden();
  await expect(page.getByText('Result: cancelled')).toBeVisible();
});

test.describe('size and scrolling', () => {
  const overflow = (page: Page) =>
    page.evaluate(() => {
      const d = document.documentElement;
      return { x: d.scrollWidth - d.clientWidth, y: d.scrollHeight - d.clientHeight };
    });

  test('a long body scrolls inside the modal; the header, the footer and the page do not', async ({
    page,
  }) => {
    await open(page, 'long-body', 1024, 600);
    const modal = dialog(page, 'Activity');
    const viewport = modal.locator('[data-part="body"] > [data-part="viewport"]');
    const panel = (await page.locator('[data-umbra="modal"]').boundingBox())!;
    expect(panel.y).toBeGreaterThan(0);
    expect(panel.y + panel.height).toBeLessThan(600);
    expect(await viewport.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);

    const footer = async () => (await modal.locator('[data-part="footer"]').boundingBox())!.y;
    const before = await footer();
    await viewport.hover();
    await page.mouse.wheel(0, 400);
    await expect.poll(() => viewport.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    expect(await footer()).toBe(before);
    await expect(modal.getByRole('heading', { name: 'Activity' })).toBeInViewport();
    expect(await overflow(page)).toEqual({ x: 0, y: 0 });
    expect(await page.evaluate(() => document.documentElement.scrollTop)).toBe(0);
  });

  test('sizes: widths come from the tokens, `full` and `height="fill"` take the window minus the margin', async ({
    page,
  }) => {
    const panel = async (story: string) => {
      await open(page, story, 1920, 1080);
      return (await page.locator('[data-umbra="modal"]').boundingBox())!;
    };
    expect((await panel('small')).width).toBe(400);
    expect((await panel('medium')).width).toBe(560);
    expect((await panel('large')).width).toBe(800);
    expect((await panel('extra-large')).width).toBe(1120);
    expect(await panel('full')).toEqual({ x: 32, y: 32, width: 1856, height: 1016 });
    const fill = await panel('fill-height');
    expect([fill.width, fill.height]).toEqual([560, 1016]);
  });

  test('a drawer is attached to its edge', async ({ page }) => {
    const panel = async (story: string) => {
      await open(page, story);
      return (await page.locator('[data-umbra="modal"]').boundingBox())!;
    };
    expect(await panel('drawer-end')).toEqual({ x: 720, y: 0, width: 560, height: 720 });
    expect(await panel('drawer-start')).toEqual({ x: 0, y: 0, width: 560, height: 720 });
    const bottom = await panel('drawer-bottom');
    expect([bottom.x, bottom.width, bottom.y + bottom.height]).toEqual([0, 1280, 720]);
    expect(bottom.y).toBeGreaterThan(40);
  });

  test('the navigation is a side column, with the body beside it', async ({ page }) => {
    await open(page, 'with-nav');
    const nav = (await page.locator('[data-part="nav"]').boundingBox())!;
    const body = (await page.locator('[data-umbra="modal"] [data-part="body"]').boundingBox())!;
    expect(nav.width).toBe(240);
    expect(body.x).toBeGreaterThanOrEqual(nav.x + nav.width);
    expect(body.y).toBe(nav.y);
    await page.getByRole('button', { name: 'Display' }).click();
    await expect(page.getByText('Display: display name')).toBeVisible();
  });

  test('below the minimum window every modal fills the window', async ({ page }) => {
    await open(page, 'medium', 900, 560);
    expect(await page.locator('[data-umbra="modal"]').boundingBox()).toEqual({
      x: 0,
      y: 0,
      width: 900,
      height: 560,
    });
    expect(await overflow(page)).toEqual({ x: 0, y: 0 });
  });

  test('below the minimum window the navigation is behind a "Sections" toggle', async ({ page }) => {
    await open(page, 'with-nav', 900, 560);
    const modal = dialog(page, 'Preferences');
    const toggle = modal.getByRole('button', { name: 'Sections' });
    const body = modal.locator('[data-part="body"]');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(modal.getByRole('button', { name: 'Display' })).toBeHidden();
    await expect(body).toBeVisible();
    expect((await body.boundingBox())!.width).toBe(900);

    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(body).toBeHidden();
    // Choosing a section shows it and closes the list.
    await modal.getByRole('button', { name: 'Display' }).click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(modal.getByText('Display: display name')).toBeVisible();
    expect(await overflow(page)).toEqual({ x: 0, y: 0 });
    // The chosen control is hidden with the list: the focus is on the toggle, by pointer and by key.
    await expect(toggle).toBeFocused();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
    await expectFocusKept(page);
  });
});

test.describe('parts and motion', () => {
  test('parts: a function wraps, `null` hides, a node replaces', async ({ page }) => {
    await open(page, 'parts');
    const modal = dialog(page, 'Share report (wrapped by a function)');
    await expect(modal).toBeVisible();
    await expect(modal.locator('[data-part="description"]')).toHaveCount(0);
    await expect(modal).not.toHaveAttribute('aria-describedby', /.+/);
    await expect(modal.getByText('A footer replaced by a node')).toBeVisible();
    await modal.getByRole('button', { name: 'Dismiss' }).click();
    await expect(modal).toBeHidden();
  });

  test('opening animates the backdrop and the panel; reduced motion keeps only the fade', async ({
    page,
  }) => {
    // Which properties start a transition on the panel and on the backdrop as the modal opens.
    const entering = async () => {
      await page.evaluate(() => {
        const seen = ((window as unknown as { seen: string[] }).seen = [] as string[]);
        document.addEventListener('transitionrun', (event) => {
          const part = (event.target as Element).getAttribute('data-umbra');
          if (part?.startsWith('modal')) seen.push(`${part} ${event.propertyName}`);
        });
      });
      await page.getByRole('button', { name: 'Open report' }).click();
      await expect(dialog(page, 'Export report (md)')).toBeVisible();
      await expect(page.locator('[data-umbra="modal"]')).toHaveCSS('opacity', '1');
      return page.evaluate(() => [...new Set((window as unknown as { seen: string[] }).seen)].sort());
    };
    await open(page, 'medium');
    await expect(page.locator('[data-umbra="modal"]')).toHaveCSS('transition-duration', '0s');
    await page.keyboard.press('Escape');
    await expect(dialog(page, 'Export report (md)')).toBeHidden();
    expect(await entering()).toEqual(['modal opacity', 'modal translate', 'modal-backdrop opacity']);
    await expect(page.locator('[data-umbra="modal"]')).toHaveCSS('transition-duration', '0.24s, 0.24s');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.keyboard.press('Escape');
    await expect(dialog(page, 'Export report (md)')).toBeHidden();
    expect(await entering()).toEqual(['modal opacity', 'modal-backdrop opacity']);
  });
});

test.describe('without an AppShell', () => {
  const story = async (page: Page, width: number, height: number) => {
    await page.setViewportSize({ width, height });
    await page.goto('/iframe.html?id=overlays-modal-without-a-shell--without-app-shell&viewMode=story');
    await page.locator('#storybook-root > *').first().waitFor();
  };

  test('the narrow state comes from the window: columns become tabs and the modal fills the window', async ({
    page,
  }) => {
    await story(page, 1280, 720);
    await expect(page.locator('[data-umbra="app-shell"]')).toHaveCount(0);
    await expect(page.getByRole('tab')).toHaveCount(0);
    await page.getByRole('button', { name: 'Preferences' }).click();
    const modal = page.locator('[data-umbra="modal"]');
    await expect(modal).not.toHaveAttribute('data-narrow');
    await expect(modal.getByRole('button', { name: 'Sections' })).toHaveCount(0);
    await expect(modal.getByRole('button', { name: 'Display' })).toBeVisible();

    // Resized below the minimum while open: it switches without being reopened.
    await page.setViewportSize({ width: 900, height: 560 });
    await expect(modal).toHaveAttribute('data-narrow', 'true');
    await expect.poll(() => modal.boundingBox()).toEqual({ x: 0, y: 0, width: 900, height: 560 });
    const toggle = modal.getByRole('button', { name: 'Sections' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(modal.getByRole('button', { name: 'Display' })).toBeHidden();
    await toggle.focus();
    await page.keyboard.press('Escape');
    await expect(modal).toHaveCount(0);
    await expect(page.getByRole('tab')).toHaveText(['Orders', 'Reports']);
    await expect(page.getByRole('tabpanel')).toHaveCount(1);

    // Too short counts as narrow as well; back above the minimum the columns return.
    await page.setViewportSize({ width: 1280, height: 560 });
    await expect(page.getByRole('tab')).toHaveCount(2);
    await page.setViewportSize({ width: 1024, height: 600 });
    await expect(page.getByRole('tab')).toHaveCount(0);
  });
});
