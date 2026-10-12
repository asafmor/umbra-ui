import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties, ReactNode } from 'react';
import { Button } from '../basics/Button';
import { Link } from '../data/Link';
import { List } from '../data/List';
import { Tag } from '../data/Tag';
import { Checkbox } from '../inputs/Checkbox';
import { SegmentedFilter } from '../inputs/SegmentedFilter';
import { Select } from '../inputs/Select';
import { Slider } from '../inputs/Slider';
import { Tabs } from '../inputs/Tabs';
import { Toggle } from '../inputs/Toggle';
import { Card } from '../layout/Card';
import { Columns } from '../layout/Columns';
import { ProgressBar } from '../meters/ProgressBar';
import { Menu } from '../overlays/Menu';
import { UmbraScope, type UmbraScopeProps } from './UmbraProvider';

type Theme = Pick<UmbraScopeProps, 'brand' | 'context' | 'interaction' | 'action' | 'surfaceOpacity'>;

const page: CSSProperties = {
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  borderRadius: 'var(--umbra-radius-card)',
  border: '1px solid var(--umbra-color-base-border-subtle)',
  background:
    'linear-gradient(160deg, var(--umbra-context-page-background) 30%, var(--umbra-context-page-background-end))',
  color: 'var(--umbra-color-base-text-primary)',
};
const bar: CSSProperties = {
  flex: 'none',
  padding: 'var(--umbra-space-3) var(--umbra-space-4)',
  background: 'var(--umbra-color-brand)',
  color: 'var(--umbra-color-on-brand)',
  font: 'var(--umbra-font-nav)',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};
const body: CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--umbra-space-4)',
  padding: 'var(--umbra-space-4)',
  overflow: 'hidden',
};
const row: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--umbra-space-4)',
  minWidth: 0,
};
const views = [
  { id: 'open', label: 'Open', count: 12 },
  { id: 'done', label: 'Done' },
  { id: 'all', label: 'All' },
];

/** One small screen: a brand bar over a page with a card. Everything in it reads the palette. */
function Screen({ title, ...theme }: Theme & { title: string }) {
  return (
    <UmbraScope {...theme}>
      <div style={page} data-screen={title}>
        <div style={bar}>{title}</div>
        <div style={body}>
          <div style={row}>
            <Button variant="primary">Save</Button>
            <Button variant="accent">Assign</Button>
            <Link href="#orders">All orders</Link>
          </div>
          <div style={row}>
            <SegmentedFilter aria-label={`${title}: view`} items={views} defaultValue="open" />
            <Tag tone="accent">New</Tag>
          </div>
          <div style={row}>
            <Checkbox defaultChecked>Notify</Checkbox>
            <Toggle defaultChecked>Live</Toggle>
          </div>
          <Slider aria-label={`${title}: level`} defaultValue={60} />
          <ProgressBar aria-label={`${title}: progress`} value={72} />
          <Card padding="none" size="content">
            <List
              aria-label={`${title}: orders`}
              selectionMode="single"
              defaultSelectedIds={['b']}
              itemSize="compact"
            >
              <List.Item id="a" title="Order 1041" meta="Mon" />
              <List.Item id="b" title="Order 1042" meta="Tue" />
              <List.Item id="c" title="Order 1043" meta="Wed" />
            </List>
          </Card>
        </div>
      </div>
    </UmbraScope>
  );
}

const grid: CSSProperties = {
  height: '100%',
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gridAutoRows: 'minmax(0, 1fr)',
  gap: 'var(--umbra-space-4)',
};
const Grid = ({ children }: { children: ReactNode }) => <div style={grid}>{children}</div>;

const meta = {
  title: 'Foundation/Theming',
  component: UmbraScope,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof UmbraScope>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * One screen under six themes. The first is the default. In the others only `brand` is set, or `brand`
 * with one more input: the interaction colour, the action colour and the context follow the brand
 * unless the app sets them.
 */
export const Combinations: Story = {
  tags: ['tints'],
  render: () => (
    <Grid>
      <Screen title="Default" />
      <Screen title="Brand green" brand="#0a7a55" />
      <Screen title="Brand red" brand="#c81e1e" />
      <Screen title="Brand blue, context slate" brand="#0b5fff" context="slate" />
      <Screen title="Brand grey, interaction orange" brand="#3a3f47" interaction="#e8730c" />
      <Screen title="Brand purple, action teal" brand="#5b2a86" action="#00a3a3" context="#1f8f7f" />
    </Grid>
  ),
};

/** A light brand: the bar, a light selected fill and a light primary action all get dark text. */
export const LightBrands: Story = {
  render: () => (
    <Grid>
      <Screen title="Brand yellow" brand="#f5c400" />
      <Screen title="Brand pale blue" brand="#bfe3ff" />
      <Screen title="Brand white" brand="#ffffff" />
      <Screen title="Interaction yellow" interaction="#f5c400" />
      <Screen title="Action lime" action="#b8d400" />
      <Screen title="Brand pink" brand="#ff4fd8" />
    </Grid>
  ),
};

const pattern: CSSProperties = {
  ...page,
  flexDirection: 'row',
  gap: 'var(--umbra-density-gap)',
  padding: 'var(--umbra-density-gap)',
  height: '100%',
  background:
    'repeating-linear-gradient(135deg, transparent 0 22px, rgba(255, 255, 255, 0.22) 22px 24px), linear-gradient(160deg, var(--umbra-context-page-background) 30%, var(--umbra-context-page-background-end))',
};
const frequency = [
  { id: 'always', label: 'Every time' },
  { id: 'needed', label: 'When needed' },
  { id: 'never', label: 'Never' },
];

/**
 * `surfaceOpacity` (the token `--umbra-surface-opacity`) is how opaque card surfaces are over the app
 * background, here a pattern. The content of a card and every overlay stay opaque.
 */
export const SurfaceOpacity: Story = {
  render: () => (
    <div style={pattern}>
      {[1, 0.5, 0].map((opacity) => (
        <UmbraScope key={opacity} surfaceOpacity={opacity}>
          <Card title={`Opacity ${opacity}`} data-opacity={opacity}>
            <p style={{ margin: 0 }}>Text on the card stays opaque.</p>
            <p style={{ margin: 0, color: 'var(--umbra-color-base-text-secondary)' }}>Secondary text.</p>
            <div style={{ ...row, marginTop: 'var(--umbra-space-4)' }}>
              <Select aria-label={`Frequency at ${opacity}`} options={frequency} defaultValue="needed" />
              <Button variant="primary">Save</Button>
            </div>
          </Card>
        </UmbraScope>
      ))}
    </div>
  ),
};

const tabs = [
  { id: 'orders', label: 'Orders' },
  { id: 'people', label: 'People' },
];
const menu = [
  { id: 'home', label: 'Overview', current: true },
  { id: 'orders', label: 'Orders' },
  { id: 'dense', label: 'Dense rows', type: 'checkbox' as const },
  { id: 'lines', label: 'Grid lines', type: 'checkbox' as const },
];

/**
 * Every role on one page, with the four colours and the surface opacity as controls: try any colour.
 * The browser tests measure contrast here.
 */
export const Playground: Story = {
  argTypes: {
    brand: { control: 'color', type: 'string' },
    context: { control: 'color', type: 'string' },
    interaction: { control: 'color', type: 'string' },
    action: { control: 'color', type: 'string' },
    surfaceOpacity: { control: { type: 'range', min: 0, max: 1, step: 0.05 }, type: 'number' },
  },
  render: (args) => (
    <UmbraScope {...args}>
      <div style={{ ...page, height: '100%' }} data-part="page">
        <div style={bar}>Brand</div>
        <div style={{ ...body, flexDirection: 'row' }}>
          <Columns style={{ flex: 1 }}>
            <Card title="Selection" padding="none">
              <div style={{ padding: 'var(--umbra-space-4)' }}>
                <Tabs aria-label="Views" variant="pill" items={tabs} />
              </div>
              <List aria-label="Orders" selectionMode="single" defaultSelectedIds={['b']}>
                <List.Item id="a" title="Order 1041" description="Region 1" meta="Mon" />
                <List.Item id="b" title="Order 1042" description="Region 2" meta="Tue" />
                <List.Item id="c" title="Order 1043" description="Region 3" meta="Wed" />
              </List>
            </Card>
            <Card title="Controls">
              <div style={{ display: 'grid', gap: 'var(--umbra-space-4)', justifyItems: 'start' }}>
                <Checkbox defaultChecked>Notify</Checkbox>
                <Toggle defaultChecked>Live</Toggle>
                <SegmentedFilter aria-label="View" items={views} defaultValue="open" />
                <Select aria-label="Frequency" options={frequency} defaultValue="needed" />
                <div style={{ justifySelf: 'stretch' }}>
                  <Slider aria-label="Level" defaultValue={60} />
                </div>
              </div>
            </Card>
            <Card title="Actions">
              <div style={{ display: 'grid', gap: 'var(--umbra-space-4)', justifyItems: 'start' }}>
                <div style={row}>
                  <Button variant="primary">Save</Button>
                  <Button variant="accent">Assign</Button>
                  <Button>Cancel</Button>
                </div>
                <Menu trigger={<Button>View options</Button>} items={menu} defaultSelectedIds={['dense']} />
                <Link href="#orders">All orders</Link>
                <Tag tone="accent">New</Tag>
                <div style={{ justifySelf: 'stretch' }}>
                  <ProgressBar label="Progress" value={72} showValue />
                </div>
              </div>
            </Card>
          </Columns>
        </div>
      </div>
    </UmbraScope>
  ),
};

/** A token set by hand wins over what is derived: here the interaction colour, under a green brand. */
export const TokenWins: Story = {
  render: () => (
    <UmbraScope
      brand="#0a7a55"
      tokens={{ 'color-interaction': 'rgb(1, 2, 3)', 'color-on-interaction': '#ffffff' }}
    >
      <div style={{ ...row, color: 'var(--umbra-color-base-text-primary)' }}>
        <Button variant="primary">Derived from the brand</Button>
        <Button variant="accent">Set by hand</Button>
      </div>
    </UmbraScope>
  ),
};
