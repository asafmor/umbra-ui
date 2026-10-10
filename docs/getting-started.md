# Getting started

## 1. Install

```sh
npm install github:asafmor/umbra-ui
npm install @fontsource/figtree @fontsource/barlow-condensed
```

- React 19 or later.
- The package is ESM only and ships its types.
- The two fonts are yours to load. Any way of loading Figtree and Barlow Condensed works; without them
  the text falls back to system fonts.

## 2. Load the stylesheet and fonts, once

```tsx
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/figtree/400.css';
import '@fontsource/figtree/500.css';
import '@fontsource/figtree/700.css';
import 'umbra-ui/styles.css';
```

## 3. Wrap the app in the provider

```tsx
import { UmbraProvider } from 'umbra-ui';

<UmbraProvider brand="#2a2f8f" context="violet" density="default">
  <App />
</UmbraProvider>;
```

| Prop            | Values                                            | Effect                                                                            |
| --------------- | ------------------------------------------------- | --------------------------------------------------------------------------------- |
| `brand`         | a hex or `rgb()` colour                           | The colour of the top bar. Text on it is light or dark, whichever contrasts more. |
| `context`       | `violet`, `teal`, `green`, `slate`, or any colour | The tint of the page background and of tinted cards.                              |
| `density`       | `compact`, `default`, `spacious`                  | Spacing, row heights and text sizes.                                              |
| `tokens`        | `{ 'radius-card': '12px' }`                       | Overrides single tokens (CSS variables, without the `--umbra-` prefix).           |
| `icons`         | `{ search: <MyIcon /> }`                          | Replaces built-in icons by name.                                                  |
| `shortcuts`     | `[{ id, keys: 'Mod+S', label, action }]`          | Your key bindings. `Mod` is Command on macOS, Ctrl elsewhere.                     |
| `reducedMotion` | `system`, `always`, `never`                       | `system` follows the operating system.                                            |
| `locale`        | `en-GB`                                           | Language and text direction.                                                      |

Two colours are fixed and do not follow the theme: violet means **selected** and magenta means the
**primary action**.

## 4. Build the frame

```tsx
import { AppShell, Button, Page, PrimaryNav, SubNav, TopBar } from 'umbra-ui';

<AppShell
  topBar={
    <TopBar
      logo="U"
      nav={<PrimaryNav items={sections} value={section} onChange={setSection} />}
      onSearch={openSearch}
      primaryAction={<Button variant="primary">Continue</Button>}
    />
  }
  subNav={<SubNav label="Overview" items={pages} value={page} onChange={setPage} />}
>
  <Page>{/* one Columns, Stack or Card */}</Page>
</AppShell>;
```

- `AppShell` is exactly the size of the window and never scrolls.
- Navigation items are `{ id, label, href?, icon?, items?, disabled? }`. `items` makes a dropdown.
- With a router, pass `renderLink={(props) => <Link to={props.href} {...props} />}` to the navs.
- As the window narrows the bars shed content in a fixed order; nothing wraps or overflows.

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
The [customisation tables](customisation-tables.md) list all four layers for every component.

## Next

- [Layout](layout.md): how space is shared and what happens as it shrinks.
- `examples/basic`: a small app to copy from.
