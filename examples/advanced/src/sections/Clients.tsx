import { Plus } from 'lucide-react';
import {
  Avatar,
  Button,
  Card,
  Columns,
  KeyValueList,
  Link,
  List,
  ListItem,
  Page,
  PageHeader,
  Slot,
  Stack,
  StatusIndicator,
  Tag,
} from 'umbra-ui';
import { ContactsCard } from '../components/ContactsCard';
import { clients, money, type Order } from '../data';
import { navigate, renderLink } from '../router';

/** List + detail. The selected client is in the route (`#/clients/c-3`), so back and forward work. */
export function Clients({ selectedId, orders }: { selectedId: string | undefined; orders: Order[] }) {
  const client = clients.find((c) => c.id === selectedId) ?? clients[0]!;
  const own = orders.filter((order) => order.clientId === client.id);

  return (
    <Page context="teal">
      <Columns>
        <Card title="Clients" subtitle={`${clients.length} accounts`} padding="none">
          <List
            aria-label="Clients"
            items={clients}
            selectionMode="single"
            selectionBehavior="replace"
            selectedIds={[client.id]}
            onSelectionChange={([id]) => id !== undefined && navigate(`/clients/${id}`)}
            dividers
            renderItem={(item) => (
              <List.Item
                id={item.id}
                title={item.name}
                description={`${item.region} · ${item.owner}`}
                leading={<Avatar name={item.name} alt="" size="sm" shape="square" />}
                meta={item.tier}
              />
            )}
          />
        </Card>
        <Stack size={2} label={client.name}>
          {/* The header of the detail pane takes the height of its content; the cards share the rest. */}
          <Slot size="content">
            <div style={{ display: 'grid', gap: 'var(--umbra-space-4)' }}>
              <PageHeader
                size="compact"
                headingLevel={2}
                breadcrumbs={[{ label: 'Clients', href: '#/clients' }, { label: client.name }]}
                renderLink={renderLink}
                overline="Client"
                title={client.name}
                subtitle={`Managed by ${client.owner}`}
                media={<Avatar name={client.name} alt="" shape="square" />}
                tags={
                  <>
                    <Tag tone={client.tier === 'Key' ? 'accent' : 'neutral'}>{client.tier}</Tag>
                    <StatusIndicator status={client.health}>{client.healthLabel}</StatusIndicator>
                  </>
                }
                actions={
                  <Button iconStart={<Plus />} href="#/orders/new">
                    New order
                  </Button>
                }
              />
              <KeyValueList
                aria-label="Facts"
                layout="columns"
                dividers
                items={[
                  { label: 'Region', value: client.region },
                  { label: 'Client since', value: client.since },
                  { label: 'Revenue', value: money(client.revenue) },
                  { label: 'Orders', value: own.length },
                  { label: 'Open', value: own.filter((order) => order.status === 'Open').length },
                  { label: 'Contacts', value: client.contacts.length },
                ]}
              />
            </div>
          </Slot>
          {/* Side by side also below the minimum window: the stack is already one tab of the page. */}
          <Columns narrow="keep">
            <ContactsCard contacts={client.contacts} />
            <Card
              title="Orders"
              tone="neutral"
              empty={own.length === 0 ? 'No orders yet' : undefined}
              parts={{
                footer: (
                  <Card.Footer>
                    <Link href="#/orders" renderLink={renderLink} variant="standalone" chevron>
                      All orders
                    </Link>
                  </Card.Footer>
                ),
              }}
            >
              {own.map((order) => (
                <ListItem
                  key={order.id}
                  size="compact"
                  title={`Order ${order.number}`}
                  description={`Due ${order.due}`}
                  meta={money(order.total)}
                  trailing={<Tag size="small">{order.status}</Tag>}
                />
              ))}
            </Card>
          </Columns>
        </Stack>
      </Columns>
    </Page>
  );
}
