# Getting started

From an empty Vite app to a full-window screen in six steps.

## 1. Install

```sh
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install github:asafmor/umbra-ui
npm install @fontsource/figtree @fontsource/barlow-condensed lucide-react
```

- React 19 or later.
- The package is ESM only and ships its types.
- The two fonts are yours to load. Any way of loading Figtree and Barlow Condensed works; without them
  the text falls back to system fonts.
- `lucide-react` is the icon set the library uses inside. Install it to use the same icons in your own
  buttons and cards, as the samples do. Any icon set works: an icon prop takes any node.

## 2. Load the stylesheet and fonts, once

Replace `src/main.tsx` with this, and delete the template's `index.css` and `App.css`: their colours
and centring fight the library's.

```tsx
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/figtree/400.css';
import '@fontsource/figtree/500.css';
import '@fontsource/figtree/700.css';
import 'umbra-ui/styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

Nothing else is needed in the page: no reset, no sizes on `html` or `body`. The shell fixes itself to
the window.

## 3. Wrap the app in the provider

Replace `src/App.tsx`. Every umbra-ui component must be inside one `UmbraProvider`.

```tsx
import { AppShell, Card, Page, TopBar, UmbraProvider } from 'umbra-ui';

export function App() {
  return (
    <UmbraProvider brand="#2a2f8f" context="violet" density="default">
      <AppShell topBar={<TopBar logo="U" />}>
        <Page>
          <Card title="Hello">This card fills the page. The page never scrolls.</Card>
        </Page>
      </AppShell>
    </UmbraProvider>
  );
}
```

`npm run dev` now shows a brand-coloured bar and one card that fills the rest of the window.

| Prop            | Values                                            | Effect                                                                            |
| --------------- | ------------------------------------------------- | --------------------------------------------------------------------------------- |
| `brand`         | a hex or `rgb()` colour                           | The colour of the top bar. Text on it is light or dark, whichever contrasts more. |
| `context`       | `violet`, `teal`, `green`, `slate`, or any colour | The tint of the page background and of tinted cards.                              |
| `density`       | `compact`, `default`, `spacious`                  | Spacing, row heights and text sizes.                                              |
| `tokens`        | `{ 'radius-card': '12px' }`                       | Overrides single tokens (CSS variables, without the `--umbra-` prefix).           |
| `icons`         | `{ search: <MyIcon /> }`                          | Replaces built-in icons by name.                                                  |
| `shortcuts`     | `[{ id, keys: 'Mod+S', label, action }]`          | Your key bindings. `Mod` is Command on macOS, Ctrl elsewhere.                     |
| `reducedMotion` | `system`, `always`, `never`                       | `system` follows the operating system.                                            |
| `locale`        | `en-GB`                                           | Language, number format and text direction.                                       |

Two colours are fixed and do not follow the theme: violet means **selected** and magenta means the
**primary action**. [Theming](theming.md) has the rest.

## 4. Build the frame

```tsx
import { Bell, Plus } from 'lucide-react';
import { useState } from 'react';
import {
  AppShell,
  Card,
  Columns,
  CommandPalette,
  IconButton,
  Page,
  PrimaryAction,
  PrimaryNav,
  SubNav,
  TopBar,
  UmbraProvider,
  type NavItem,
} from 'umbra-ui';

const sections: NavItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'orders', label: 'Orders' },
  { id: 'reports', label: 'Reports', items: [{ id: 'monthly', label: 'Monthly' }] },
];
const pages: NavItem[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'activity', label: 'Activity' },
];

export function App() {
  const [section, setSection] = useState('overview');
  const [page, setPage] = useState('summary');

  return (
    <UmbraProvider brand="#2a2f8f">
      <AppShell
        topBar={
          <TopBar
            logo="U"
            history
            nav={<PrimaryNav items={sections} value={section} onChange={setSection} />}
            commandPalette={
              <CommandPalette
                commands={sections.map((s) => ({
                  id: s.id,
                  label: String(s.label),
                  section: 'Go to',
                  onRun: () => setSection(s.id),
                }))}
              />
            }
            actions={<IconButton icon={<Bell />} label="Notifications" badge={3} />}
            primaryAction={<PrimaryAction label="New order" icon={<Plus />} />}
          />
        }
        subNav={<SubNav label="Overview" items={pages} value={page} onChange={setPage} />}
      >
        <Page>
          <Columns>
            <Card title="Inbox">A long list scrolls inside its card.</Card>
            <Card title={`${section} / ${page}`} size={2}>
              Twice the width of its sibling.
            </Card>
          </Columns>
        </Page>
      </AppShell>
    </UmbraProvider>
  );
}
```

- `AppShell` is exactly the size of the window and never scrolls.
- Navigation items are `{ id, label, href?, icon?, items?, disabled? }`. `items` makes a dropdown.
- `history` adds back and forward buttons. `commandPalette` adds the search trigger; `Mod+K` opens it.
- With a router, give the items `href` and pass `renderLink` to the navs
  ([recipe](recipes.md#11-the-shell-with-a-router)).
- As the window narrows the bars shed content in a fixed order; nothing wraps or overflows.
- A `Page` holds one `Columns`, `Stack` or `Card`. [Layout](layout.md) explains how they share the space.

## 5. Change one part of the screen

`UmbraScope` takes the same `context`, `density`, `brand` and `tokens` for one subtree:

```tsx
<UmbraScope density="compact" context="teal">
  <Card title="Dense table" />
</UmbraScope>
```

A `Page` also takes `context`, and the frame around it follows.

## 6. Customise a component

Try these in order and stop at the first that is enough.

| Layer  | For                       | Example                                                                       |
| ------ | ------------------------- | ----------------------------------------------------------------------------- |
| Tokens | The look                  | `tokens={{ 'card-radius': '0px' }}` or `--umbra-card-radius: 0` in your CSS   |
| Props  | Variants and behaviour    | `<Card title="Budget" tone="neutral" collapsible />`                          |
| Parts  | Replace or hide one piece | `<Card parts={{ footer: <Card.Footer>12 items</Card.Footer> }} />`            |
| Blocks | Build your own version    | `<Card.Root><Card.Header>…</Card.Header><Card.Body>…</Card.Body></Card.Root>` |

A part takes a node (replace it), `null` (hide it) or a function that receives the default part's props.
[Customisation](customisation.md) takes one example through all four.

## What is in the box

| Group    | Components                                                                                                               |
| -------- | ------------------------------------------------------------------------------------------------------------------------ |
| Layout   | `AppShell`, `Page`, `Columns`, `Stack`, `Slot`, `Card`, `SectionTitle`, `ScrollArea`, `Accordion`                        |
| Shell    | `TopBar`, `PrimaryNav`, `SubNav`, `VerticalNav`, `PageHeader`, `PrimaryAction`, `HistoryButtons`, `ShortcutBar`          |
| Data     | `List`, `ListItem`, `DataTable`, `KeyValue`, `StatValue`, `SummaryTile`, `Tag`, `Badge`, `ValuePill`, `Avatar`, and more |
| Meters   | `ProgressBar`, `LevelMeter`                                                                                              |
| Charts   | `LineChart`, `BarChart`, `DonutChart`, `RadarChart`, from `umbra-ui/charts`                                              |
| Inputs   | `Button`, `IconButton`, `TextField`, `Checkbox`, `RadioGroup`, `Toggle`, `FormField`, `Tabs`, `SegmentedFilter`          |
| Overlays | `Modal`, `ConfirmDialog`, `Popover`, `Menu`, `Tooltip`, `CommandPalette`, `ActionBar`                                    |

The [README](../README.md#components) has one line on each.

## Next

| Guide                                           | Read it for                                                            |
| ----------------------------------------------- | ---------------------------------------------------------------------- |
| [Layout](layout.md)                             | How space is shared, and what happens as it shrinks                    |
| [Theming](theming.md)                           | Brand, context, density, tokens, fonts, icons, direction               |
| [Customisation](customisation.md)               | The four layers, router links, translating built-in strings            |
| [Recipes](recipes.md)                           | Thirteen whole screens, from a first page to a table with bulk actions |
| [Customisation tables](customisation-tables.md) | Every component's tokens, props, parts and blocks                      |

And three apps to copy from: `examples/basic`, `examples/dashboard` and `examples/advanced`.
