import { expect, test, type Page } from '@playwright/test';
import { SourceMap } from 'node:module';
import { devUrl } from '../../playwright.examples.config';

// What a developer sees in DevTools when a library component throws, in the `basic` example run by
// the Vite development server (not `vite preview`: a production build is the app's own bundle).
//
// A browser does not rewrite `error.stack`: DevTools shows the original file by fetching the source
// map the script names and looking the frame up in it. The test does the same, with the same data:
// the frame's URL as the browser reports it, the map that URL's response names, and Node's own
// source map reader. Whatever it resolves to is what DevTools shows.

/** Renders a `PageHeader` block outside its root, next to the running app, and returns the stack. */
async function throwingStack(page: Page, url: string): Promise<string> {
  const problems: string[] = [];
  page.on('pageerror', (error) => problems.push(error.message));
  await page.goto(url);
  await page.locator('[data-umbra="app-shell"]').waitFor();
  // The first visit can find dependencies Vite has not prepared yet; it then reloads the page once.
  await page.waitForLoadState('networkidle');
  await page.locator('[data-umbra="app-shell"]').waitFor();
  expect(problems).toEqual([]);

  return page.evaluate(async () => {
    // The modules the app itself loaded, at the URLs the development server gave them.
    const loaded = performance.getEntriesByType('resource').map((entry) => entry.name);
    const find = (pattern: RegExp) => {
      const found = loaded.find((name) => pattern.test(name));
      if (!found) throw new Error(`the app did not load ${pattern}`);
      return found;
    };
    const lib = await import(
      /* @vite-ignore */ find(/\/(deps\/umbra-ui\.js|umbra-ui\/dist\/index\.js)(\?|$)/)
    );
    const react = (await import(/* @vite-ignore */ find(/\/deps\/react\.js(\?|$)/))).default;
    const dom = (await import(/* @vite-ignore */ find(/\/deps\/react-dom_client\.js(\?|$)/))).default;

    return new Promise<string>((resolve) => {
      const root = dom.createRoot(document.body.appendChild(document.createElement('div')), {
        onUncaughtError: (error: unknown) => resolve(String((error as Error).stack)),
      });
      root.render(react.createElement(lib.PageHeader.Title, null, 'Outside its root'));
    });
  });
}

/** Looks the first frame of a stack up in the source map its script names, as DevTools does. */
async function resolveFrame(page: Page, stack: string) {
  const frame = /\(?(https?:\/\/[^\s)]+):(\d+):(\d+)\)?/.exec(stack);
  if (!frame) throw new Error(`no frame in:\n${stack}`);
  const [, url, line, column] = frame as unknown as [string, string, string, string];

  const script = await (await page.request.get(url)).text();
  const reference = /\/\/# sourceMappingURL=(\S+)\s*$/.exec(script)?.[1];
  if (!reference) throw new Error(`${url} names no source map`);
  const map = reference.startsWith('data:')
    ? JSON.parse(Buffer.from(reference.slice(reference.indexOf(',') + 1), 'base64').toString('utf8'))
    : await (await page.request.get(new URL(reference, url).href)).json();

  const entry = new SourceMap(map).findEntry(Number(line) - 1, Number(column) - 1);
  if (!('originalSource' in entry)) throw new Error(`${url}:${line}:${column} is not in its source map`);
  // Node resolves the source to a URL; the map lists it as written. They end the same way.
  const tail = (source: string) => source.replace(/^(\.\.?\/)+/, '');
  const index = (map.sources as string[]).findIndex((source) => entry.originalSource.endsWith(tail(source)));
  const text: string = map.sourcesContent?.[index] ?? '';
  return {
    url,
    source: (map.sources as string[])[index] ?? entry.originalSource,
    line: entry.originalLine + 1,
    text: text.split('\n')[entry.originalLine] ?? '',
    embedded: text.length > 0,
  };
}

const message = 'PageHeader blocks must be rendered inside <PageHeader.Root>.';

test('as the example is: the frame is a readable module of the library', async ({ page }) => {
  const stack = await throwingStack(page, devUrl('prebundled'));
  expect(stack).toContain(message);
  // Vite bundles a dependency before serving it, and its map stops at the package's built files.
  expect(stack).toMatch(/at useHeader \(.*\/node_modules\/\.vite\/deps\/umbra-ui\.js/);

  const frame = await resolveFrame(page, stack);
  expect(frame.source).toMatch(/umbra-ui\/dist\/shell\/PageHeader\.js$/);
  expect(frame.embedded).toBe(true);
  // The whole line, so a minified module would fail: the built file is as readable as its source.
  expect(frame.text.trim()).toBe(`if (!header) throw new Error("${message}");`);
});

test('with the library out of the pre-bundle: the frame is a line of the .tsx source', async ({ page }) => {
  const stack = await throwingStack(page, devUrl('excluded'));
  expect(stack).toContain(message);
  expect(stack).toMatch(/at useHeader \(.*\/node_modules\/umbra-ui\/dist\/shell\/PageHeader\.js/);

  const frame = await resolveFrame(page, stack);
  expect(frame.source).toMatch(/src\/shell\/PageHeader\.tsx$/);
  // The source is in the map itself: the package does not hold src/.
  expect(frame.embedded).toBe(true);
  expect(frame.text).toContain(`throw new Error('${message}')`);
  // The line of the repository's file, so a stack can be read against GitHub too.
  expect(frame.line).toBe(35);
});
