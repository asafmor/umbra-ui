import { ArrowRight, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import {
  AppShell,
  Button,
  Card,
  Columns,
  IconButton,
  Page,
  PrimaryNav,
  SectionTitle,
  Stack,
  SubNav,
  TopBar,
  UmbraProvider,
  type Density,
  type NavItem,
} from 'umbra-ui';

const sections: NavItem[] = [
  { id: 'overview', label: 'Overview', href: '#overview' },
  { id: 'orders', label: 'Orders', href: '#orders' },
  { id: 'planning', label: 'Planning', href: '#planning' },
  { id: 'people', label: 'People', href: '#people' },
];
const densities: NavItem[] = (['compact', 'default', 'spacious'] satisfies Density[]).map((id) => ({
  id,
  label: id,
}));
const orders = Array.from({ length: 30 }, (_, i) => ({
  id: 1000 + i,
  client: `Client ${i + 1}`,
  total: 120 + i * 37,
}));

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <p style={{ margin: 0 }}>
      <small style={{ color: 'var(--umbra-color-base-text-secondary)' }}>{label}</small>
      <br />
      <strong style={{ font: 'var(--umbra-font-display)' }}>{value}</strong>
    </p>
  );
}

export function App() {
  const [section, setSection] = useState('overview');
  const [density, setDensity] = useState<Density>('default');
  const [loading, setLoading] = useState(false);
  const refresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1200);
  };

  return (
    <UmbraProvider brand="#2a2f8f" context={section === 'planning' ? 'teal' : 'violet'} density={density}>
      <AppShell
        topBar={
          <TopBar
            logo="U"
            nav={<PrimaryNav items={sections} value={section} onChange={setSection} />}
            primaryAction={
              <Button variant="primary" iconEnd={<ArrowRight />} collapseTo="icon">
                Continue
              </Button>
            }
          />
        }
        subNav={
          <SubNav
            label="Density"
            items={densities}
            value={density}
            onChange={(id) => setDensity(id as Density)}
          />
        }
      >
        <Page>
          <Columns>
            <Card
              title="Orders"
              size={2}
              loading={loading}
              actions={<IconButton icon={<RefreshCw />} label="Refresh" onPress={refresh} />}
            >
              <SectionTitle count={orders.length}>Open</SectionTitle>
              {orders.map((order) => (
                <div
                  key={order.id}
                  style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}
                >
                  <span>
                    #{order.id} · {order.client}
                  </span>
                  <span>{order.total}</span>
                </div>
              ))}
            </Card>
            <Card title="Notes" collapsible>
              Resize the window. The page never scrolls; this card scrolls inside when its content is taller.
            </Card>
            <Stack label="Figures">
              <Card title="Revenue" tone="neutral" priority={2}>
                <Figure label="This quarter" value="80.1M" />
              </Card>
              <Card title="Costs" tone="neutral" priority={1}>
                <Figure label="This quarter" value="12.4M" />
              </Card>
              <Card title="Headcount" tone="neutral">
                <Figure label="Today" value="275" />
              </Card>
              <Card title="Open roles" tone="neutral">
                <Figure label="Today" value="14" />
              </Card>
            </Stack>
          </Columns>
        </Page>
      </AppShell>
    </UmbraProvider>
  );
}
