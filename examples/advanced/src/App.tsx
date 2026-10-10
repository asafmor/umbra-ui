import { Building2, ClipboardList, Plus, Settings as SettingsIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  AppShell,
  Card,
  CommandPalette,
  EmptyState,
  Link,
  Page,
  PrimaryAction,
  PrimaryNav,
  ShortcutBar,
  SubNav,
  TopBar,
  UmbraProvider,
  type Command,
  type NavItem,
  type Shortcut,
} from 'umbra-ui';
import { clients, initialOrders } from './data';
import { navigate, renderLink, useHashRoute } from './router';
import { Clients } from './sections/Clients';
import { Orders } from './sections/Orders';
import { defaultSettings, Settings } from './sections/Settings';

const sections: NavItem[] = [
  { id: 'clients', label: 'Clients', href: '#/clients' },
  { id: 'orders', label: 'Orders', href: '#/orders' },
  { id: 'settings', label: 'Settings', href: '#/settings' },
];

// The app's key bindings. Buttons and the palette show their keys; `Alt+ArrowLeft` and
// `Alt+ArrowRight` (back and forward) come from the library and are bound by the TopBar's history buttons.
const shortcuts: Shortcut[] = [
  { id: 'app.clients', keys: 'Alt+1', label: 'Go to clients', action: () => navigate('/clients') },
  { id: 'app.orders', keys: 'Alt+2', label: 'Go to orders', action: () => navigate('/orders') },
  { id: 'app.settings', keys: 'Alt+3', label: 'Go to settings', action: () => navigate('/settings') },
  { id: 'app.newOrder', keys: 'N', label: 'New order', action: () => navigate('/orders/new') },
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
  const open = useMemo(() => orders.filter((order) => order.status === 'Open').length, [orders]);

  const pages: Record<string, React.ReactNode> = {
    clients: <Clients selectedId={param} orders={orders} />,
    orders: <Orders orders={orders} onChange={setOrders} editing={param} />,
    settings: <Settings pane={param} settings={settings} onChange={setSettings} />,
  };

  return (
    // The theme: one brand colour for the bar; each section's `Page` sets its own context tint.
    <UmbraProvider
      brand="#14506b"
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
    </UmbraProvider>
  );
}
