import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bell, Download, Settings, Users } from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { IconButton } from '../basics/IconButton';
import { Log, Rows } from '../stories/placeholders';
import { Accordion, type AccordionItemData } from './Accordion';
import { Card } from './Card';
import { Stack } from './Stack';

const meta = {
  title: 'Layout/Accordion',
  component: Accordion,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof Accordion>;
export default meta;
type Story = StoryObj<typeof meta>;

const grid = (columns: number): CSSProperties => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
  gap: 24,
  alignItems: 'start',
});
const text =
  'Orders from Region 2 arrived later than planned on four of the last seven days. The backlog is larger than at any point this quarter.';

const sections: AccordionItemData[] = [
  { id: 'general', title: 'General', content: text },
  { id: 'alerts', title: 'Alerts', content: <Rows count={3} prefix="Alert" /> },
  { id: 'access', title: 'Access', content: <Rows count={4} prefix="Person" /> },
];

/** The two looks: rules between the sections, or each section as a card. */
export const Variants: Story = {
  render: () => (
    <div style={grid(2)}>
      <Accordion aria-label="Plain" items={sections} defaultValue={['general']} />
      <Accordion aria-label="Card" variant="card" items={sections} defaultValue={['general']} />
    </div>
  ),
};

/** Icon, subtitle, meta text, actions and a disabled section. Actions do not toggle the section. */
export const Content: Story = {
  render: function Render() {
    const [exports, setExports] = useState(0);
    return (
      <div style={grid(2)}>
        {(['plain', 'card'] as const).map((variant) => (
          <Accordion
            key={variant}
            aria-label={`Content, ${variant}`}
            variant={variant}
            defaultValue={['alerts']}
            items={[
              {
                id: 'general',
                title: 'General',
                subtitle: 'Name, language and time zone',
                icon: <Settings />,
                content: text,
              },
              {
                id: 'alerts',
                title: 'Alerts',
                icon: <Bell />,
                meta: '3 active',
                actions: (
                  <IconButton
                    icon={<Download />}
                    label={`Export alerts (${variant})`}
                    onPress={() => setExports((n) => n + 1)}
                  />
                ),
                content: <Rows count={3} prefix="Alert" />,
              },
              {
                id: 'access',
                title: 'Access',
                subtitle: 'Not available on this plan',
                icon: <Users />,
                meta: 'Locked',
                disabled: true,
                content: text,
              },
            ]}
          />
        ))}
        <Log>Exports: {exports}.</Log>
      </div>
    );
  },
};

/** `type="single"`: one section at a time. Controlled, and one that may not close its open section. */
export const Single: Story = {
  render: function Render() {
    const [value, setValue] = useState<string | null>('general');
    return (
      <div style={grid(2)}>
        <div>
          <Accordion
            aria-label="Controlled"
            type="single"
            items={sections}
            value={value}
            onChange={setValue}
          />
          <Log>Open: {value ?? 'none'}.</Log>
        </div>
        <Accordion
          aria-label="Always one open"
          type="single"
          collapsible={false}
          variant="card"
          items={sections}
          defaultValue="alerts"
        />
      </div>
    );
  },
};

/**
 * In a slot with limited height the accordion fills the slot and never grows past it: the open panels
 * share what the headers leave, and each scrolls inside.
 */
export const LimitedHeight: Story = {
  render: () => (
    <div style={{ ...grid(2), height: '100%', alignItems: 'stretch' }}>
      <Stack>
        <Accordion
          aria-label="In a stack"
          variant="card"
          defaultValue={['long']}
          items={[
            { id: 'long', title: 'Long section', content: <Rows count={40} /> },
            { id: 'second', title: 'Second section', content: <Rows count={30} prefix="Entry" /> },
            { id: 'third', title: 'Third section', content: text },
          ]}
        />
        <Card title="A card below" size="content">
          It keeps its place.
        </Card>
      </Stack>
      <Card title="In a card" padding="none">
        <Accordion
          aria-label="In a card"
          headingLevel={3}
          defaultValue={['long']}
          style={{ height: '100%' }}
          items={[
            { id: 'long', title: 'Long section', content: <Rows count={40} /> },
            { id: 'second', title: 'Second section', content: <Rows count={30} prefix="Entry" /> },
          ]}
        />
      </Card>
    </div>
  ),
};

/** `keepMounted` keeps closed content in the page, so a field keeps what was typed in it. */
export const KeepMounted: Story = {
  render: () => {
    const field = (label: string) => ({
      content: (
        <label style={{ display: 'grid', gap: 4, font: 'var(--umbra-font-label)' }}>
          {label}
          <input aria-label={label} defaultValue="" style={{ font: 'inherit', padding: 4 }} />
        </label>
      ),
    });
    return (
      <div style={grid(2)}>
        <Accordion
          aria-label="Kept"
          keepMounted
          defaultValue={['a']}
          items={[
            { id: 'a', title: 'Kept while closed', ...field('Kept note') },
            { id: 'b', title: 'Another section', content: text },
          ]}
        />
        <Accordion
          aria-label="Removed"
          defaultValue={['a']}
          items={[
            { id: 'a', title: 'Removed while closed', ...field('Removed note') },
            { id: 'b', title: 'Another section', content: text },
          ]}
        />
      </div>
    );
  },
};

/** A narrow section drops its meta text; the title and subtitle truncate; actions and the chevron stay. */
export const Shrink: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'start' }}>
      {[420, 260, 160].map((width) => (
        <div key={width} style={{ width }} data-width={width}>
          <Accordion
            aria-label={`${width}px`}
            variant="card"
            defaultValue={['a']}
            items={[
              {
                id: 'a',
                title: 'A section with a long title',
                subtitle: 'And a subtitle that is longer still',
                icon: <Settings />,
                meta: '12 entries',
                actions: <IconButton icon={<Download />} label={`Export (${width})`} />,
                content: text,
              },
            ]}
          />
        </div>
      ))}
    </div>
  ),
};

/** Each kind of `parts` override: a node replaces, `null` hides, a function wraps the default. */
export const Parts: Story = {
  render: () => (
    <div style={grid(2)}>
      <Accordion aria-label="Item parts" defaultValue={['node']}>
        <Accordion.Item
          id="node"
          title="A node replaces the chevron"
          parts={{ chevron: <span data-part="chevron">±</span> }}
        >
          {text}
        </Accordion.Item>
        <Accordion.Item
          id="null"
          title="null hides the meta text"
          meta="hidden"
          parts={{ meta: null, chevron: null }}
        >
          {text}
        </Accordion.Item>
        <Accordion.Item
          id="function"
          title="A function wraps the default"
          meta="3"
          parts={{
            title: (p) => <em data-part="title">{p.children} (wrapped)</em>,
            panel: (p) => <Accordion.Panel {...p} padding="none" />,
          }}
        >
          <Rows count={2} />
        </Accordion.Item>
      </Accordion>
      <Accordion
        aria-label="Every item"
        items={sections}
        defaultValue={['alerts']}
        parts={{ item: (p) => <Accordion.Item {...p} meta={`#${p.id}`} /> }}
      />
    </div>
  ),
};

/** The same accordion composed by hand from the blocks, with a header of its own. */
export const Blocks: Story = {
  render: () => (
    <div style={{ maxWidth: 520 }}>
      <Accordion.Root aria-label="Composed" variant="card" type="single" defaultValue="first">
        <Accordion.Section id="first">
          <Accordion.Header title="Composed from blocks" subtitle="Header and panel placed by hand" />
          <Accordion.Panel>{text}</Accordion.Panel>
        </Accordion.Section>
        <Accordion.Section id="second">
          <Accordion.Header meta="custom">
            <strong>Custom button content</strong>
          </Accordion.Header>
          <Accordion.Panel padding="none">
            <Rows count={3} />
          </Accordion.Panel>
        </Accordion.Section>
      </Accordion.Root>
    </div>
  ),
};
