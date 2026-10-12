import {
  Building2,
  CalendarRange,
  CircleHelp,
  ClipboardList,
  Plus,
  Route,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  AppShell,
  Card,
  CommandPalette,
  EmptyState,
  EntitySwitcher,
  IconButton,
  Link,
  Page,
  PrimaryAction,
  PrimaryNav,
  ShortcutBar,
  ShortcutsSheet,
  Spotlight,
  SubNav,
  TopBar,
  UmbraProvider,
  type Command,
  type NavItem,
  type Shortcut,
  type SpotlightStep,
} from 'umbra-ui';
import { clients, initialOrders } from './data';
import { navigate, renderLink, useHashRoute } from './router';
import { Clients } from './sections/Clients';
import { Orders } from './sections/Orders';
import { Planner } from './sections/Planner';
import { defaultSettings, Settings } from './sections/Settings';

const sections: NavItem[] = [
  { id: 'clients', label: 'Clients', href: '#/clients' },
  { id: 'orders', label: 'Orders', href: '#/orders' },
  { id: 'planner', label: 'Planner', href: '#/planner' },
  { id: 'settings', label: 'Settings', href: '#/settings' },
];

// The app's key bindings. Buttons and the palette show their keys; `Alt+ArrowLeft` and
// `Alt+ArrowRight` (back and forward) come from the library and are bound by the TopBar's history buttons.
const shortcuts: Shortcut[] = [
  { id: 'app.clients', keys: 'Alt+1', label: 'Go to clients', action: () => navigate('/clients') },
  { id: 'app.orders', keys: 'Alt+2', label: 'Go to orders', action: () => navigate('/orders') },
  { id: 'app.settings', keys: 'Alt+3', label: 'Go to settings', action: () => navigate('/settings') },
  { id: 'app.planner', keys: 'Alt+4', label: 'Go to the planner', action: () => navigate('/planner') },
  { id: 'app.newOrder', keys: 'N', label: 'New order', action: () => navigate('/orders/new') },
  // No action: the tour button binds it while it is mounted.
  { id: 'app.tour', keys: 'Shift+T', label: 'Take the tour', group: 'Help' },
];

// The tour points at parts of the frame by the attributes the library puts on them.
const tour: SpotlightStep[] = [
  {
    target: '[data-umbra="primary-nav"]',
    title: 'Four sections',
    body: 'Each is a route: the back and forward buttons walk through the ones you visited.',
  },
  {
    // The search trigger has no attribute of its own: it is found by its name.
    target: '[data-umbra="top-bar"] [aria-label="Search"]',
    title: 'Search everything',
    body: 'Pages, clients and actions. Ctrl+K or ⌘K opens it from anywhere.',
  },
  {
    target: '[data-umbra="primary-action"]',
    title: 'A new order',
    body: 'The one main action of the app is always here.',
    placement: 'bottom end',
  },
  {
    target: '[data-umbra="page"]',
    title: 'The page',
    body: 'It fills the window and never scrolls: lists and tables scroll inside their cards.',
    placement: 'top',
  },
];

const commands: Command[] = [
  {
    id: 'go-clients',
    label: 'Clients',
    section: 'Pages',
    icon: <Building2 />,
    href: '#/clients',
    shortcut: 'app.clients',
  },
  {
    id: 'go-orders',
    label: 'Orders',
    section: 'Pages',
    icon: <ClipboardList />,
    href: '#/orders',
    shortcut: 'app.orders',
  },
  {
    id: 'go-planner',
    label: 'Planner',
    section: 'Pages',
    icon: <CalendarRange />,
    href: '#/planner',
    shortcut: 'app.planner',
    keywords: ['calendar', 'month', 'due'],
  },
  {
    id: 'go-settings',
    label: 'Settings',
    section: 'Pages',
    icon: <SettingsIcon />,
    href: '#/settings',
    shortcut: 'app.settings',
    keywords: ['density', 'preferences', 'profile'],
  },
  {
    id: 'new-order',
    label: 'New order',
    section: 'Actions',
    icon: <Plus />,
    href: '#/orders/new',
    shortcut: 'app.newOrder',
  },
  ...clients.map((client) => ({
    id: client.id,
    label: client.name,
    description: `${client.region} · ${client.owner}`,
    section: 'Clients',
    href: `#/clients/${client.id}`,
  })),
];

const pinned = [
  { id: 'key', label: 'Client 3', href: '#/clients/c-3' },
  { id: 'late', label: 'Client 7', href: '#/clients/c-7' },
];

export function App() {
  const { section, param } = useHashRoute();
  const [settings, setSettings] = useState(defaultSettings);
  const [orders, setOrders] = useState(initialOrders);
  const [touring, setTouring] = useState(false);
  const open = useMemo(() => orders.filter((order) => order.status === 'Open').length, [orders]);

  const pages: Record<string, React.ReactNode> = {
    clients: <Clients selectedId={param} orders={orders} />,
    orders: <Orders orders={orders} onChange={setOrders} editing={param} />,
    planner: <Planner orders={orders} />,
    settings: <Settings pane={param} settings={settings} onChange={setSettings} />,
  };

  return (
    // The theme: a brand colour, from which the primary action is derived, and an interaction colour of
    // the app's own for everything selected. Each section's `Page` sets its own context tint.
    <UmbraProvider
      brand="#14506b"
      interaction="#d97706"
      density={settings.density}
      reducedMotion={settings.reduceMotion ? 'always' : 'system'}
      shortcuts={shortcuts}
    >
      <AppShell
        background={settings.flatBackground ? 'flat' : 'gradient'}
        topBar={
          <TopBar
            logo="B"
            history
            nav={<PrimaryNav items={sections} value={section} renderLink={renderLink} />}
            commandPalette={
              <CommandPalette
                commands={commands}
                navigate={navigate}
                includeShortcuts
                placeholder="Search pages, clients and actions"
              />
            }
            actions={
              <>
                <IconButton
                  icon={<Route />}
                  label="Take the tour"
                  shortcut="app.tour"
                  onPress={() => setTouring(true)}
                />
                <ShortcutsSheet trigger={<IconButton icon={<CircleHelp />} label="Keyboard shortcuts" />} />
              </>
            }
            primaryAction={
              <PrimaryAction
                label="New order"
                description={`${open} open`}
                icon={<Plus />}
                shortcut="app.newOrder"
                onPress={() => navigate('/orders/new')}
              />
            }
          />
        }
        subNav={
          <SubNav
            // On the clients page the bar steps through the clients: the page is about one of them.
            start={
              section === 'clients' && (
                <EntitySwitcher
                  aria-label="Client"
                  items={clients.map((c) => ({ id: c.id, label: c.name, description: c.region }))}
                  value={param ?? clients[0]!.id}
                  onChange={(id) => navigate(`/clients/${id}`)}
                />
              )
            }
            label={sections.find((s) => s.id === section)?.label ?? 'Not found'}
            end={<ShortcutBar aria-label="Pinned clients" items={pinned} renderLink={renderLink} />}
          />
        }
      >
        {pages[section] ?? (
          <Page>
            <Card aria-label="Not found">
              <EmptyState
                title="There is no such page"
                description="The address does not match a section of the app."
                action={
                  <Link href="#/clients" renderLink={renderLink} variant="standalone" chevron>
                    Go to clients
                  </Link>
                }
              />
            </Card>
          </Page>
        )}
      </AppShell>
      <Spotlight open={touring} onOpenChange={setTouring} steps={tour} />
    </UmbraProvider>
  );
}
