# umbra-ui

React components for full-window, data-dense applications: dashboards, consoles, back-office tools.

- **The page never scrolls.** The app fills the window; only regions inside cards scroll.
- **Components fill their slot** and show less as space shrinks, instead of overflowing.
- **Its own dark look**, with a brand colour and a context tint set by your app.
- **Three density levels**, set once.
- **Customisable in four layers**, the same for every component: tokens, props, parts, blocks.

> **Status: pre-release.** Milestone 0 (foundation) is built: the provider, the layout system, the shell
> and the basic controls. It is not on npm yet. See [`plan/roadmap.md`](plan/roadmap.md).

## Install

Until the first release, install from GitHub (this builds the package on install):

```sh
npm install github:asafmor/umbra-ui react-aria-components lucide-react
```

It needs React 19 or later. The fonts are loaded by your app, not shipped by the library:

```sh
npm install @fontsource/figtree @fontsource/barlow-condensed
```

## A first full-window page

```tsx
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/figtree/400.css';
import 'umbra-ui/styles.css';
import { AppShell, Card, Columns, Page, Stack, TopBar, UmbraProvider } from 'umbra-ui';

export function App() {
  return (
    <UmbraProvider brand="#2a2f8f" context="violet" density="default">
      <AppShell topBar={<TopBar logo="U" />}>
        <Page>
          <Columns>
            <Card title="Inbox">A long list scrolls inside its card.</Card>
            <Card title="Summary" size={2}>
              Twice the width of its siblings.
            </Card>
            <Stack>
              <Card title="Budget" priority={1}>
                Stays open longest.
              </Card>
              <Card title="Schedule">Collapses to its header first.</Card>
            </Stack>
          </Columns>
        </Page>
      </AppShell>
    </UmbraProvider>
  );
}
```

That page fills any window from 1024 x 600 up. Make the window shorter and the lowest-priority card in
the stack collapses to its header; below 1024 x 600 the columns become tabs.

## Learn more

|                                                      |                                                               |
| ---------------------------------------------------- | ------------------------------------------------------------- |
| [Getting started](docs/getting-started.md)           | Install, the provider, theme and density                      |
| [Layout](docs/layout.md)                             | How space is shared, and what happens as it shrinks           |
| [Customisation tables](docs/customisation-tables.md) | Every component's tokens, props, parts and blocks (generated) |
| [`examples/basic`](examples/basic)                   | A small app to copy from                                      |
| Storybook                                            | `npm run storybook`: every component, variant and state       |

## Develop

```sh
npm install
npm run storybook      # workshop and docs, port 6006
npm run lint && npm run typecheck && npm test
npm run test:visual    # every story at three window sizes and three densities
npm run build
```

[`AGENTS.md`](AGENTS.md) describes the project for contributors and coding agents; the design decisions
are in [`plan/`](plan).

## Licence

MIT
