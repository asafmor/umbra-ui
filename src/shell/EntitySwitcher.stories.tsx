import type { Meta, StoryObj } from '@storybook/react-vite';
import { Building2 } from 'lucide-react';
import { useEffect, useState, type CSSProperties } from 'react';
import { EntityIcon } from '../data/EntityIcon';
import { Log, pages, sections } from '../stories/placeholders';
import { EntitySwitcher, type EntitySwitcherItem, type EntitySwitcherProps } from './EntitySwitcher';
import { PageHeader } from './PageHeader';
import { PrimaryNav } from './PrimaryNav';
import { SampleContext, SamplePrimaryAction } from './samples';
import { SubNav } from './SubNav';
import { TopBar } from './TopBar';

const meta = {
  title: 'Shell/EntitySwitcher',
  component: EntitySwitcher,
  parameters: { frame: 'padded' },
  args: { items: [] },
} satisfies Meta<typeof EntitySwitcher>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Six regions in two groups, the last one disabled; without marks. */
const plain: EntitySwitcherItem[] = [1, 2, 3, 4, 5, 6].map((n) => ({
  id: `region-${n}`,
  label: `Region ${n}`,
  description: n === 6 ? 'Closed' : `${5 + n * 7} teams`,
  group: n <= 3 ? 'North' : 'South',
  disabled: n === 6,
}));
const regions = plain.map((item) => ({ ...item, icon: <EntityIcon name={item.label as string} /> }));
const column: CSSProperties = { display: 'grid', gap: 16, justifyItems: 'start', minWidth: 0 };

/** A switcher that keeps its value, and a line that shows what its callbacks reported. */
function Switcher(props: Partial<EntitySwitcherProps>) {
  const [value, setValue] = useState('region-2');
  const [last, setLast] = useState('none');
  return (
    <div style={column}>
      <EntitySwitcher
        items={regions}
        value={value}
        onChange={setValue}
        onAction={setLast}
        aria-label="Switch region"
        {...props}
      />
      <Log>
        Current: {value} · last action: {last}
      </Log>
    </div>
  );
}

/**
 * The current entity with its mark, a caret, and the two stacked steppers. The trigger opens a
 * searchable list in groups; the steppers go to the previous and the next entity in that order.
 */
export const Default: Story = { tags: ['tints'], render: () => <Switcher /> };

/** The picker, open: the search field, groups, a second line per row, a disabled row, and the current row marked. */
export const Open: Story = {
  render: () => (
    <div style={{ height: 440 }}>
      <EntitySwitcher items={regions} defaultValue="region-2" defaultOpen aria-label="Switch region" />
    </div>
  ),
};

/** `wrap`, no icons, the steppers before the name, no search, a single entity, and disabled. */
export const Variants: Story = {
  render: () => {
    return (
      <div style={column}>
        <EntitySwitcher items={regions} defaultValue="region-5" wrap aria-label="Wraps around" />
        <EntitySwitcher items={plain} defaultValue="region-1" aria-label="No icons" />
        <EntitySwitcher
          items={regions}
          defaultValue="region-3"
          stepperPosition="start"
          aria-label="Steppers first"
        />
        <EntitySwitcher items={plain} defaultValue="region-4" searchable={false} aria-label="No search" />
        <EntitySwitcher items={regions.slice(0, 1)} defaultValue="region-1" aria-label="One entity" />
        <EntitySwitcher items={regions} defaultValue="region-2" disabled aria-label="Disabled" />
        <EntitySwitcher items={regions} aria-label="Nothing chosen" />
      </div>
    );
  },
};

/** The picker while its list loads, and with nothing to choose from. */
export const PickerStates: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 320, height: 320 }}>
      <EntitySwitcher items={[]} loading defaultOpen aria-label="Loading" placeholder="Loading" />
      <EntitySwitcher items={[]} aria-label="Empty" placeholder="No regions" />
    </div>
  ),
};

/** At the start of a `SubNav` (the `start` slot). The bar is low, so the steppers sit side by side. */
export const InSubNav: Story = {
  render: function Render() {
    const [value, setValue] = useState('region-2');
    const [page, setPage] = useState('inbox');
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 8 }}>
        {[900, 520, 300].map((width) => (
          <div key={width} style={{ width }}>
            <SubNav
              start={
                <EntitySwitcher
                  items={regions}
                  value={value}
                  onChange={setValue}
                  aria-label="Switch region"
                />
              }
              items={pages}
              value={page}
              onChange={setPage}
            />
          </div>
        ))}
        <Log>Current: {value}</Log>
      </div>
    );
  },
};

/** As the title of a `PageHeader`, with the mark in `media` and the steppers before the name. */
export const InPageHeader: Story = {
  render: function Render() {
    const [value, setValue] = useState('region-2');
    const current = regions.find((item) => item.id === value)!;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 16 }}>
        {[900, 360].map((width) => (
          <div key={width} style={{ width }}>
            <PageHeader
              media={<EntityIcon name={current.label as string} />}
              title={
                <EntitySwitcher
                  items={plain}
                  value={value}
                  onChange={setValue}
                  stepperPosition="start"
                  wrap
                  aria-label="Switch region"
                />
              }
              subtitle={current.description}
              meta={[
                { label: 'Owner', value: 'Person A' },
                { label: 'Status', value: 'Active' },
              ]}
            />
          </div>
        ))}
      </div>
    );
  },
};

/** In a `TopBar`, in place of the logo: the switcher takes the bar's text colour. */
export const InTopBar: Story = {
  render: function Render() {
    const [value, setValue] = useState('region-2');
    return (
      <div style={{ display: 'grid', gap: 16 }}>
        {[undefined, '#e8e4f0'].map((brand) => (
          <TopBar
            key={brand ?? 'default'}
            brand={brand}
            parts={{
              logo: (
                <EntitySwitcher
                  items={regions}
                  value={value}
                  onChange={setValue}
                  aria-label="Switch region"
                />
              ),
            }}
            nav={<PrimaryNav items={sections.slice(0, 3)} value="overview" onChange={() => {}} />}
            context={<SampleContext />}
            primaryAction={<SamplePrimaryAction />}
          />
        ))}
      </div>
    );
  },
};

/** As it narrows: the name is cut, then the steppers hide, then only the icon is left, with the name in a tooltip. */
export const Shrink: Story = {
  render: () => (
    <div style={column}>
      {[260, 150, 96, 64, 30].map((width) => (
        <div key={width} style={{ width, display: 'flex' }}>
          <EntitySwitcher
            items={regions.map((item) => ({ ...item, label: `${item.label as string} and its districts` }))}
            defaultValue="region-2"
            aria-label="Switch region"
          />
        </div>
      ))}
    </div>
  ),
};

/** Rows with `href` are links, drawn by the app's router link through `renderLink`. */
export const Links: Story = {
  render: () => (
    <Switcher
      items={regions.map((item) => ({ ...item, href: `#${item.id}` }))}
      renderLink={(props) => <a {...props} data-router-link="" />}
    />
  ),
};

/** Each part as a node, as `null` and as a function; and the switcher composed from its blocks. */
export const PartsAndBlocks: Story = {
  render: () => (
    <div style={column}>
      <EntitySwitcher
        items={regions}
        defaultValue="region-1"
        aria-label="Custom icon"
        parts={{ icon: <Building2 data-custom="" size={18} />, caret: null }}
      />
      <EntitySwitcher
        items={regions}
        defaultValue="region-1"
        aria-label="No steppers"
        parts={{ steppers: null, name: (p) => <em data-part="name">{p.children}</em> }}
      />
      <EntitySwitcher
        items={regions}
        defaultValue="region-1"
        aria-label="Custom rows"
        parts={{
          search: null,
          row: (p) => (
            <div data-custom-row="" style={{ opacity: p.item.group === 'South' ? 0.9 : 1 }}>
              {p.children}
            </div>
          ),
        }}
      />
      <EntitySwitcher.Root items={regions} defaultValue="region-3" aria-label="From blocks">
        <EntitySwitcher.Steppers />
        <EntitySwitcher.Trigger />
        <EntitySwitcher.Picker />
      </EntitySwitcher.Root>
    </div>
  ),
};

const changing: EntitySwitcherItem[] = [
  { id: 'a', label: 'Region A', group: 'North' },
  { id: 'b', label: 'Region B', group: 'North', disabled: true },
  { id: 'c', label: 'Region C', group: 'North' },
  { id: 'd', label: 'Region D', group: 'South' },
  { id: 'e', label: 'Everywhere' },
];

/**
 * A list that changes while the picker is open, as when an app loads it again: the focus stays in the
 * picker. The current entity of the first switcher is disabled (the steppers still go to its
 * neighbours), and the last entity has no group, so a line sets it apart from the group above. The
 * list is changed from outside the page, so that the picker stays open: dispatch `story:loading` or
 * `story:shorten` on `window`.
 */
export const ChangingList: Story = {
  render: function Render() {
    const [loading, setLoading] = useState(false);
    const [short, setShort] = useState(false);
    useEffect(() => {
      const load = () => setLoading((now) => !now);
      const shorten = () => setShort((now) => !now);
      window.addEventListener('story:loading', load);
      window.addEventListener('story:shorten', shorten);
      return () => {
        window.removeEventListener('story:loading', load);
        window.removeEventListener('story:shorten', shorten);
      };
    }, []);
    const items = short ? changing.slice(0, 1) : changing;
    return (
      <div style={{ display: 'grid', gap: 16, height: 400, alignContent: 'start' }}>
        <div style={{ display: 'flex', gap: 320 }}>
          <EntitySwitcher items={items} loading={loading} defaultValue="b" aria-label="With search" />
          <EntitySwitcher
            items={items}
            loading={loading}
            defaultValue="a"
            searchable={false}
            aria-label="Without search"
          />
        </div>
        <Log>
          Loading: {String(loading)} · short list: {String(short)}
        </Log>
      </div>
    );
  },
};
