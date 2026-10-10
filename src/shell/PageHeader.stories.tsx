import type { Meta, StoryObj } from '@storybook/react-vite';
import { Download, Pencil, Share2 } from 'lucide-react';
import { useState, type CSSProperties, type ReactNode } from 'react';
import { Button } from '../basics/Button';
import { Avatar } from '../data/Avatar';
import { EntityIcon } from '../data/EntityIcon';
import { Tag } from '../data/Tag';
import { Card } from '../layout/Card';
import { Columns } from '../layout/Columns';
import { Page } from '../layout/Page';
import { Log, Rows } from '../stories/placeholders';
import { AppShell } from './AppShell';
import { PageHeader, type PageHeaderFact } from './PageHeader';

const meta = {
  title: 'Shell/PageHeader',
  component: PageHeader,
  parameters: { frame: 'padded' },
} satisfies Meta<typeof PageHeader>;
export default meta;
type Story = StoryObj<typeof meta>;

const column: CSSProperties = { display: 'grid', gap: 20, alignContent: 'start', minWidth: 0 };
const facts: PageHeaderFact[] = [
  { label: 'Based in', value: 'Region 2' },
  { label: 'Owner', value: 'Person A' },
  { label: 'Status', value: 'Active' },
];
const actions = (
  <>
    <Button iconStart={<Share2 />}>Share</Button>
    <Button variant="accent" iconStart={<Pencil />}>
      Edit
    </Button>
  </>
);
/** Stands in for the `Tabs` component, which is built separately. */
const tabs = (
  <div
    role="tablist"
    aria-label="Views"
    style={{ display: 'flex', gap: 20, font: 'var(--umbra-font-label)' }}
  >
    {['Overview', 'Activity', 'Settings'].map((label, i) => (
      <button
        key={label}
        type="button"
        role="tab"
        aria-selected={i === 0}
        style={{
          padding: '8px 0',
          border: 0,
          borderBottom: `2px solid ${i === 0 ? 'currentColor' : 'transparent'}`,
          background: 'none',
          color: 'inherit',
          font: 'inherit',
          fontWeight: i === 0 ? 700 : 500,
        }}
      >
        {label}
      </button>
    ))}
  </div>
);

/** As the header of a page: fixed above the content by `Page`. */
export const InPage: Story = {
  parameters: { frame: undefined },
  render: () => (
    <AppShell>
      <Page
        header={
          <PageHeader
            title="Programme A"
            subtitle="20 teams"
            media={<EntityIcon name="Programme A" shape="circle" />}
            meta={facts}
            actions={actions}
          />
        }
      >
        <Columns>
          <Card title="Summary" size={2}>
            <Rows count={12} />
          </Card>
          <Card title="Activity">
            <Rows count={8} prefix="Update" />
          </Card>
        </Columns>
      </Page>
    </AppShell>
  ),
};

/** The three tones, and a band in a colour of the app's choice: the text is light or dark to suit it. */
export const Tones: Story = {
  render: () => (
    <div style={column}>
      {(
        [
          ['default', undefined],
          ['tinted', undefined],
          ['band', undefined],
          ['band', '#f2c53a'],
          ['band', '#12365c'],
        ] as const
      ).map(([tone, bandColor]) => (
        <PageHeader
          key={tone + bandColor}
          tone={tone}
          bandColor={bandColor}
          headingLevel={2}
          overline="Project"
          title={`Tone: ${tone}${bandColor ? ` ${bandColor}` : ''}`}
          subtitle="Updated two days ago"
          media={<EntityIcon name="Project 4" />}
          meta={facts}
          onBack={() => {}}
          actions={
            <>
              <Button variant="ghost">Share</Button>
              <Button>Edit</Button>
            </>
          }
        />
      ))}
    </div>
  ),
};

/** Breadcrumbs, a back button, an overline, tags, media of each kind, meta as nodes, and tabs on the bottom edge. */
export const Content: Story = {
  render: function Render() {
    const [back, setBack] = useState(0);
    return (
      <div style={column}>
        <PageHeader
          tone="tinted"
          breadcrumbs={[
            { label: 'Workspace', href: '#workspace' },
            { label: 'Projects', href: '#projects' },
            { label: 'Project 4' },
          ]}
          onBack={() => setBack((n) => n + 1)}
          backLabel="Back to projects"
          overline="Project"
          title="Project 4"
          tags={
            <>
              <Tag tone="success">Active</Tag>
              <Tag>Internal</Tag>
            </>
          }
          subtitle="Planning for the second half of the year"
          media={<Avatar name="Person B" alt="" />}
          meta={facts}
          actions={actions}
          tabs={tabs}
        />
        <PageHeader
          headingLevel={2}
          title="Meta as nodes"
          media={
            <svg viewBox="0 0 10 10" role="img" aria-label="Sample image">
              <rect width="10" height="10" fill="#1f8f7f" />
              <circle cx="5" cy="5" r="3" fill="#f5f3f8" />
            </svg>
          }
          meta={
            <>
              <Tag tone="info">12 open</Tag>
              <Tag tone="warning">3 late</Tag>
            </>
          }
        />
        <PageHeader headingLevel={2} title="Title only" />
        <Log>Back pressed: {back}.</Log>
      </div>
    );
  },
};

/** `size="compact"` inside a card: the header of a detail pane, here with a band. */
export const DetailPane: Story = {
  render: () => (
    <Columns style={{ height: '100%' }}>
      <Card title="Messages">
        <Rows count={10} prefix="Message" />
      </Card>
      <Card size={2} aria-label="Message" padding="none">
        <div style={{ display: 'grid', gap: 16, padding: 16 }}>
          <PageHeader
            size="compact"
            headingLevel={3}
            overline="Person C"
            title="Introduction to the planning team"
            media={<Avatar name="Person C" alt="" />}
            meta="08:30"
          />
          <PageHeader
            size="compact"
            tone="band"
            headingLevel={3}
            title="Region 2"
            subtitle="North"
            media={<EntityIcon name="Region 2" />}
            meta={facts}
          />
          <Rows count={4} />
        </div>
      </Card>
    </Columns>
  ),
};

const Shrinking = ({ width, extra }: { width: number; extra?: ReactNode }) => (
  <div style={{ width }} data-width={width}>
    <PageHeader
      tone="tinted"
      headingLevel={2}
      title="Quarterly planning"
      subtitle="Second half of the year, all regions and teams"
      media={<EntityIcon name="Quarterly planning" />}
      meta={facts.slice(0, 2)}
      actions={
        <>
          <Button iconStart={<Download />}>Export</Button>
          <Button variant="accent">Edit</Button>
        </>
      }
    />
    {extra}
  </div>
);

/**
 * As it narrows: the meta row hides, the actions move into an overflow menu, the subtitle hides, the
 * media gets smaller, and last the title truncates.
 */
export const Shrink: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'start' }}>
      {[860, 680, 480, 420, 380, 240].map((width) => (
        <Shrinking key={width} width={width} />
      ))}
    </div>
  ),
};

/** Each kind of `parts` override: a node replaces, `null` hides, a function wraps the default. */
export const Parts: Story = {
  render: () => (
    <div style={column}>
      <PageHeader
        headingLevel={2}
        title="A node replaces the media"
        media={<EntityIcon name="Hidden" />}
        parts={{ media: <strong data-part="media">NEW</strong> }}
      />
      <PageHeader
        headingLevel={2}
        title="null hides the subtitle and the back button"
        subtitle="Not shown"
        onBack={() => {}}
        parts={{ subtitle: null, back: null }}
      />
      <PageHeader
        headingLevel={2}
        title="A function wraps the default"
        meta={facts}
        actions={<Button>Edit</Button>}
        parts={{
          title: (p) => <PageHeader.Title {...p} tags={<Tag>wrapped</Tag>} />,
          meta: (p) => <PageHeader.Meta {...p} items={p.items?.slice(0, 1)} />,
          actions: (p) => <PageHeader.Actions>{p.children} · 3 drafts</PageHeader.Actions>,
        }}
      />
    </div>
  ),
};

/** The same header composed by hand from the blocks. */
export const Blocks: Story = {
  render: () => (
    <PageHeader.Root tone="tinted" headingLevel={2}>
      <PageHeader.Breadcrumbs items={[{ label: 'Reports', href: '#reports' }, { label: 'Report 7' }]} />
      <PageHeader.Bar>
        <PageHeader.Content>
          <PageHeader.Back label="Back to reports" />
          <PageHeader.Media>
            <Avatar name="Person D" alt="" />
          </PageHeader.Media>
          <PageHeader.Titles>
            <PageHeader.Overline>Report</PageHeader.Overline>
            <PageHeader.Title tags={<Tag tone="info">Draft</Tag>}>Composed from blocks</PageHeader.Title>
            <PageHeader.Subtitle>Written by Person D</PageHeader.Subtitle>
          </PageHeader.Titles>
          <PageHeader.Meta items={facts} />
        </PageHeader.Content>
        <PageHeader.Actions>
          <Button variant="accent">Publish</Button>
        </PageHeader.Actions>
      </PageHeader.Bar>
      <PageHeader.Tabs>{tabs}</PageHeader.Tabs>
    </PageHeader.Root>
  ),
};
