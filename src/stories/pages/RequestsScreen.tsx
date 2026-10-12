// List and detail: a searchable, filtered list of requests, and the selected one in a detail pane.
import { Archive, Check, MoreHorizontal, Star, UserPlus, X } from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { LineChart } from '../../charts';
import {
  Accordion,
  ActionBar,
  Avatar,
  Banner,
  Button,
  Card,
  Columns,
  ConfirmDialog,
  FormField,
  IconButton,
  KeyValueList,
  LevelMeter,
  List,
  MeterList,
  Menu,
  Modal,
  Page,
  PageHeader,
  SegmentedFilter,
  Tabs,
  Tag,
  SearchField,
  TextField,
  ValuePill,
} from '../../index';
import { attributes, messages, money, months, person, type Message } from './data';
import type { InboxProps } from './OverviewScreen';

type Decision = 'approved' | 'declined';

const flow: CSSProperties = { display: 'grid', gap: 'var(--umbra-space-5)', minWidth: 0 };
const text: CSSProperties = { margin: 0, font: 'var(--umbra-font-body)' };

function RequestList({ messageId, read, onSelect }: InboxProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string | null>(null);
  const isUnread = (m: Message) => m.unread && !read.includes(m.id);
  const words = query.trim().toLowerCase();
  const shown = messages.filter(
    (m) =>
      (filter === null || (filter === 'respond' ? m.mustRespond : isUnread(m) || m.id === messageId)) &&
      (!words || `${m.title} ${m.from} ${m.tag}`.toLowerCase().includes(words)),
  );
  return (
    <Card
      title="Requests"
      label="Requests"
      size={2}
      padding="none"
      parts={{
        toolbar: (
          <Card.Toolbar style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <SearchField
              label="Search requests"
              placeholder="Search requests"
              value={query}
              onChange={setQuery}
            />
            <SegmentedFilter
              aria-label="Filter requests"
              all
              allCount={messages.length}
              value={filter}
              onChange={setFilter}
              items={[
                { id: 'respond', label: 'To answer', count: messages.filter((m) => m.mustRespond).length },
                { id: 'unread', label: 'Unread', count: messages.filter(isUnread).length },
              ]}
            />
          </Card.Toolbar>
        ),
      }}
    >
      <List
        aria-label="Requests"
        itemVariant="message"
        selectionMode="single"
        selectionBehavior="replace"
        selectedIds={[messageId]}
        onSelectionChange={([id]) => id !== undefined && onSelect(String(id))}
        empty={{ title: 'No requests found', description: 'Try another search or filter.' }}
        items={shown}
        renderItem={(m) => (
          <List.Item
            id={m.id}
            overline={m.from}
            title={m.title}
            meta={m.time}
            trailing={
              <Tag size="small" variant="outline" tone={m.mustRespond ? 'danger' : 'neutral'}>
                {m.mustRespond ? 'To answer' : m.tag}
              </Tag>
            }
            unread={isUnread(m)}
          />
        )}
      />
    </Card>
  );
}

function Summary({ m }: { m: Message }) {
  return (
    <div style={flow}>
      <p style={text}>
        {m.from} asks for a decision on “{m.title}” for {m.region}. The request covers {money(m.amount)} and
        is owned by {m.team}.
      </p>
      <Banner tone="info" emphasis="insight" title="Within budget">
        Approving keeps {m.team} below its quarterly limit.
      </Banner>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--umbra-space-6)',
        }}
      >
        <div style={flow}>
          <KeyValueList
            aria-label="Request facts"
            striped
            items={[
              { label: 'Requested by', value: m.from },
              { label: 'Role', value: m.role },
              { label: 'Region', value: m.region },
              { label: 'Team', value: m.team },
              { label: 'Amount', value: money(m.amount) },
              { label: 'Category', value: m.tag },
            ]}
          />
          <Accordion
            aria-label="More about the request"
            type="multiple"
            defaultValue={['purpose']}
            items={[
              {
                id: 'purpose',
                title: 'Purpose',
                content: (
                  <p style={text}>
                    Get the work for {m.region} agreed before the quarter closes, and record who signed it
                    off.
                  </p>
                ),
              },
              {
                id: 'people',
                title: 'Key people',
                content: (
                  <List aria-label="Key people" itemSize="compact">
                    {[0, 1, 2].map((i) => (
                      <List.Item
                        key={i}
                        id={i}
                        leading={<Avatar size="sm" name={person(i + 2)} alt="" />}
                        title={person(i + 2)}
                        meta={['Planner', 'Reviewer', 'Analyst'][i]}
                      />
                    ))}
                  </List>
                ),
              },
              { id: 'terms', title: 'Terms', content: <p style={text}>Standard terms for {m.team}.</p> },
            ]}
          />
        </div>
        <div style={flow}>
          <div style={{ height: 200 }}>
            <LineChart
              aria-label="Requests per month"
              area
              points
              legend={false}
              series={[
                { id: 'volume', label: 'Requests', data: m.trend.map((y, i) => ({ x: months[i]!, y })) },
              ]}
            />
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--umbra-space-3)',
              font: 'var(--umbra-font-label)',
            }}
          >
            Overall score <ValuePill value={m.score} showLevel />
          </div>
          <MeterList aria-label="Scores by attribute">
            {attributes.map((name, i) => (
              <LevelMeter key={name} label={name} value={m.levels[i]!} min={1} max={5} steps={5} showValue />
            ))}
          </MeterList>
        </div>
      </div>
    </div>
  );
}

function Detail({ m }: { m: Message }) {
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [starred, setStarred] = useState<string[]>([]);
  const [approving, setApproving] = useState(false);
  const [note, setNote] = useState('');
  const decision = decisions[m.id];
  const decide = (value: Decision) => setDecisions((all) => ({ ...all, [m.id]: value }));
  const waiting = m.mustRespond && !decision;

  return (
    <Tabs.Root defaultValue="summary" size={5} label="Request">
      <Card
        aria-label="Request"
        parts={{
          header: (
            <PageHeader
              size="compact"
              tone="tinted"
              headingLevel={2}
              media={<Avatar name={m.from} alt="" />}
              overline={`${m.from} · ${m.role}`}
              title={m.title}
              meta={[
                { label: 'Received', value: `${m.day}, ${m.time}` },
                { label: 'Region', value: m.region },
                { label: 'Amount', value: money(m.amount) },
              ]}
              tags={
                <>
                  <Tag variant="outline">{m.tag}</Tag>
                  {decision && (
                    <Tag tone={decision === 'approved' ? 'success' : 'danger'}>
                      {decision === 'approved' ? 'Approved' : 'Declined'}
                    </Tag>
                  )}
                </>
              }
              actions={
                <>
                  <IconButton
                    icon={<Star />}
                    label="Star"
                    pressed={starred.includes(m.id)}
                    onPressedChange={(on) =>
                      setStarred((ids) => (on ? [...ids, m.id] : ids.filter((id) => id !== m.id)))
                    }
                  />
                  <Menu
                    trigger={<IconButton icon={<MoreHorizontal />} label="More actions" />}
                    onAction={(id) =>
                      id === 'reopen' &&
                      setDecisions((all) =>
                        Object.fromEntries(Object.entries(all).filter(([key]) => key !== m.id)),
                      )
                    }
                    items={[
                      { id: 'reopen', label: 'Reopen', disabled: !decision },
                      {
                        id: 'assign',
                        label: 'Assign to',
                        icon: <UserPlus />,
                        items: [0, 1, 2].map((i) => ({ id: `assign-${i}`, label: person(i) })),
                      },
                      { type: 'separator' },
                      { id: 'archive', label: 'Archive', icon: <Archive />, danger: true },
                    ]}
                  />
                </>
              }
              tabs={
                <Tabs.List aria-label="Request views">
                  <Tabs.Tab id="summary">Summary</Tabs.Tab>
                  <Tabs.Tab id="activity" count={4}>
                    Activity
                  </Tabs.Tab>
                  <Tabs.Tab id="terms">Terms</Tabs.Tab>
                </Tabs.List>
              }
            />
          ),
          footer: (
            <ActionBar
              aria-label="Decision"
              emphasis={waiting ? 'strong' : 'default'}
              status={
                waiting
                  ? { tone: 'danger', text: 'Must respond' }
                  : decision === 'approved'
                    ? { tone: 'success', text: 'Approved' }
                    : decision === 'declined'
                      ? { tone: 'neutral', text: 'Declined' }
                      : { tone: 'info', text: 'No answer needed' }
              }
              secondary={
                <ConfirmDialog
                  trigger={
                    <Button iconStart={<X />} disabled={!!decision}>
                      Decline
                    </Button>
                  }
                  tone="danger"
                  title="Decline this request?"
                  description={`${m.from} is told that “${m.title}” was declined.`}
                  confirmLabel="Decline"
                  onConfirm={() => decide('declined')}
                />
              }
              primary={{
                label: 'Approve',
                icon: <Check />,
                variant: 'accent',
                disabled: !!decision,
                onPress: () => setApproving(true),
              }}
            />
          ),
        }}
      >
        <Tabs.Panel id="summary">
          <Summary m={m} />
        </Tabs.Panel>
        <Tabs.Panel id="activity">
          <List aria-label="Activity" dividers>
            {['Request received', 'Assigned for review', 'Budget checked', 'Reminder sent'].map((step, i) => (
              <List.Item
                key={step}
                id={step}
                leading={<Avatar size="sm" name={person(i + 1)} alt="" />}
                title={step}
                description={person(i + 1)}
                meta={`${i + 1}d ago`}
              />
            ))}
          </List>
        </Tabs.Panel>
        <Tabs.Panel id="terms">
          <p style={text}>
            Standard terms apply to {m.team} in {m.region}. Changes need a second approval.
          </p>
        </Tabs.Panel>
      </Card>
      <Modal
        open={approving}
        onOpenChange={setApproving}
        size="sm"
        title="Approve the request"
        description={m.title}
        footer={
          <ActionBar
            aria-label="Approve"
            secondary={{ label: 'Cancel', onPress: () => setApproving(false) }}
            primary={{
              label: 'Approve',
              variant: 'accent',
              onPress: () => {
                decide('approved');
                setApproving(false);
              },
            }}
          />
        }
      >
        <FormField label="Note" description="Sent with the approval." layout="stacked" optional>
          <TextField multiline rows={3} value={note} onChange={setNote} />
        </FormField>
      </Modal>
    </Tabs.Root>
  );
}

export function RequestsScreen(props: InboxProps) {
  const message = messages.find((m) => m.id === props.messageId) ?? messages[0]!;
  return (
    <Page>
      <Columns>
        <RequestList {...props} />
        <Detail m={message} />
      </Columns>
    </Page>
  );
}
