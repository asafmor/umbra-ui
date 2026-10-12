// The small app the five page stories share: one shell, and a place that the navigation, the history
// buttons and the command palette change. No router and no fetching: the place is state.
import {
  Bell,
  Bookmark,
  CalendarDays,
  ChevronsRight,
  FileText,
  Inbox,
  LayoutDashboard,
  ListChecks,
  Settings,
  Table2,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import {
  AppShell,
  Card,
  CommandPalette,
  EntitySwitcher,
  HistoryButtons,
  IconButton,
  Page,
  PrimaryAction,
  PrimaryNav,
  ShortcutBar,
  SubNav,
  TopBar,
  type Command,
  type NavItem,
} from '../../index';
import { SampleContext } from '../../shell/samples';
import { AnalysisScreen } from './AnalysisScreen';
import { messages } from './data';
import { OrdersScreen } from './OrdersScreen';
import { OverviewScreen } from './OverviewScreen';
import { PlanningScreen, teams } from './PlanningScreen';
import { RequestsScreen } from './RequestsScreen';

/** A place is `section/page`. Five of them are built; the others show an empty state. */
export type Place = string;

const sections: (NavItem & { pages: [id: string, label: string][] })[] = [
  {
    id: 'overview',
    label: 'Overview',
    pages: [
      ['summary', 'Summary'],
      ['inbox', 'Inbox'],
      ['calendar', 'Calendar'],
      ['reports', 'Reports'],
    ],
  },
  {
    id: 'orders',
    label: 'Orders',
    pages: [
      ['all', 'All orders'],
      ['returns', 'Returns'],
      ['invoices', 'Invoices'],
    ],
  },
  { id: 'planning', label: 'Planning', pages: [['schedule', 'Schedule']] },
  {
    id: 'people',
    label: 'People',
    pages: [
      ['teams', 'Teams'],
      ['directory', 'Directory'],
    ],
  },
  { id: 'finance', label: 'Finance', pages: [['budgets', 'Budgets']], disabled: true },
];

const section = (id: string) => sections.find((s) => s.id === id) ?? sections[0]!;
const label = (place: Place) => {
  const [s, p] = place.split('/');
  return section(s!).pages.find(([id]) => id === p)?.[1] ?? '';
};

// A section with several pages gets a dropdown of them.
const primaryItems: NavItem[] = sections.map(({ pages, ...item }) => ({
  ...item,
  ...(pages.length > 1 && { items: pages.map(([id, text]) => ({ id: `${item.id}/${id}`, label: text })) }),
}));

const pinned: [place: Place, icon: React.ReactNode][] = [
  ['overview/inbox', <Inbox key="i" />],
  ['orders/all', <Table2 key="t" />],
  ['people/teams', <Users key="u" />],
  ['overview/calendar', <CalendarDays key="c" />],
  ['overview/reports', <FileText key="r" />],
];
const icons: Record<string, React.ReactNode> = {
  'overview/summary': <LayoutDashboard />,
  'overview/inbox': <Inbox />,
  'orders/all': <Table2 />,
};

export function App({ initial }: { initial: Place }) {
  // The places visited, and where in them the user is: what the history buttons walk.
  const [trail, setTrail] = useState<{ places: Place[]; at: number }>({ places: [initial], at: 0 });
  const place = trail.places[trail.at]!;
  const go = (to: Place) => {
    // A section id alone opens its first page.
    const next = to.includes('/') ? to : `${to}/${section(to).pages[0]![0]}`;
    setTrail((t) =>
      next === t.places[t.at] ? t : { places: [...t.places.slice(0, t.at + 1), next], at: t.at + 1 },
    );
  };
  const step = (by: number) => setTrail((t) => ({ ...t, at: t.at + by }));

  // The inbox is shared by the overview and the requests page: the selected message and the read ones.
  const [messageId, setMessageId] = useState('m5');
  const [read, setRead] = useState<string[]>([]);
  const select = (id: string) => {
    setMessageId(id);
    setRead((ids) => (ids.includes(id) ? ids : [...ids, id]));
  };
  const unread = messages.filter((m) => m.unread && !read.includes(m.id)).length;
  // The team the planning page shows: chosen in the bar, above the page.
  const [team, setTeam] = useState('team-2');

  const [sectionId] = place.split('/') as [string];
  const current = section(sectionId);

  const commands: Command[] = [
    ...sections
      .filter((s) => !s.disabled)
      .flatMap((s) =>
        s.pages.map(([id, text]) => ({
          id: `go-${s.id}-${id}`,
          label: text,
          description: String(s.label),
          section: 'Go to',
          icon: icons[`${s.id}/${id}`] ?? <FileText />,
          onRun: () => go(`${s.id}/${id}`),
        })),
      ),
    {
      id: 'read-all',
      label: 'Mark every message as read',
      section: 'Actions',
      icon: <ListChecks />,
      keywords: ['inbox', 'unread'],
      onRun: () => setRead(messages.map((m) => m.id)),
    },
    {
      id: 'open-message',
      label: 'Open a message',
      description: 'Choose from the inbox',
      section: 'Actions',
      icon: <Inbox />,
      children: messages.slice(0, 8).map((m) => ({
        id: `open-${m.id}`,
        label: m.title,
        description: m.from,
        onRun: () => {
          select(m.id);
          go('overview/inbox');
        },
      })),
    },
  ];

  return (
    <AppShell
      topBar={
        <TopBar
          logo="U"
          history={
            <HistoryButtons
              canGoBack={trail.at > 0}
              canGoForward={trail.at < trail.places.length - 1}
              onBack={() => step(-1)}
              onForward={() => step(1)}
              entries={trail.places
                .map((p, i) => ({
                  id: String(i),
                  label: label(p),
                  description: String(section(p.split('/')[0]!).label),
                }))
                .reverse()}
              onNavigate={(id) => setTrail((t) => ({ ...t, at: Number(id) }))}
            />
          }
          nav={<PrimaryNav items={primaryItems} value={sectionId} onChange={go} />}
          commandPalette={
            <CommandPalette commands={commands} placeholder="Search pages and actions" includeShortcuts />
          }
          actions={
            <>
              <IconButton icon={<Bookmark />} label="Bookmarks" />
              <IconButton
                icon={<Bell />}
                label="Notifications"
                badge={unread || undefined}
                onPress={() => go('overview/inbox')}
              />
              <IconButton icon={<Settings />} label="Settings" />
            </>
          }
          context={<SampleContext variant="filled" />}
          primaryAction={
            unread > 0 && place !== 'overview/inbox' ? (
              <PrimaryAction
                label="Review inbox"
                description={`${unread} unread`}
                icon={<ChevronsRight />}
                attention
                onPress={() => go('overview/inbox')}
                menu={[
                  { id: 'orders/all', label: 'Go to all orders' },
                  { id: 'overview/summary', label: 'Go to the summary' },
                ]}
                onMenuAction={go}
              />
            ) : (
              <PrimaryAction label="Continue" icon={<ChevronsRight />} onPress={() => go('orders/all')} />
            )
          }
        />
      }
      subNav={
        <SubNav
          start={
            place === 'planning/schedule' && (
              <EntitySwitcher aria-label="Team" items={teams} value={team} onChange={setTeam} wrap />
            )
          }
          label={current.label}
          items={current.pages.map(([id, text]) => ({ id: `${current.id}/${id}`, label: text }))}
          value={place}
          onChange={go}
          end={
            <ShortcutBar
              aria-label="Pinned pages"
              items={pinned.map(([to, icon]) => ({
                id: to,
                label: label(to),
                icon,
                onPress: () => go(to),
                ...(to === 'overview/inbox' && unread > 0 && { badge: unread }),
              }))}
              onEdit={() => {}}
            />
          }
        />
      }
    >
      {place === 'overview/summary' ? (
        <OverviewScreen messageId={messageId} read={read} onSelect={select} go={go} />
      ) : place === 'overview/inbox' ? (
        <RequestsScreen messageId={messageId} read={read} onSelect={select} />
      ) : place === 'orders/all' ? (
        <OrdersScreen />
      ) : place === 'planning/schedule' ? (
        <PlanningScreen team={team} />
      ) : place === 'overview/reports' ? (
        <AnalysisScreen />
      ) : (
        <Page>
          <Card
            title={label(place)}
            empty={{
              title: 'Nothing here yet',
              description: 'This page is not part of the reference screens.',
            }}
          />
        </Page>
      )}
    </AppShell>
  );
}
