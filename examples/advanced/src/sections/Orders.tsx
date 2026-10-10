import { Check, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  ActionBar,
  actionsColumn,
  Button,
  Card,
  Checkbox,
  ConfirmDialog,
  DataTable,
  FormField,
  Modal,
  numberColumn,
  Page,
  PageHeader,
  Radio,
  RadioGroup,
  Select,
  Tag,
  TextField,
  type DataTableColumn,
} from 'umbra-ui';
import { clients, money, regions, type Order } from '../data';
import { navigate } from '../router';

const statusTone = { Open: 'info', Packed: 'warning', Sent: 'success' } as const;

/**
 * A table with bulk actions and a form in a modal. The modal is a route: `#/orders/new` adds an
 * order and `#/orders/o-1004` edits one, so the palette, a shortcut and a link can all open it.
 */
export function Orders({
  orders,
  onChange,
  editing,
}: {
  orders: Order[];
  onChange: (orders: Order[]) => void;
  /** `new`, the id of an order, or undefined while the form is closed. */
  editing: string | undefined;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  const remove = (ids: string[]) => {
    onChange(orders.filter((order) => !ids.includes(order.id)));
    setSelectedIds((selected) => selected.filter((id) => !ids.includes(id)));
  };

  // The columns are stable between renders, as DataTable asks. `priority` decides which hide first.
  const columns = useMemo<DataTableColumn<Order>[]>(
    () => [
      {
        id: 'number',
        header: 'Order',
        accessor: 'number',
        format: (value) => `Order ${value}`,
        rowHeader: true,
        sortable: true,
        priority: 'always',
        numeric: false,
        width: { min: 104, flex: 1 },
      },
      { id: 'client', header: 'Client', accessor: 'client', sortable: true, priority: 4 },
      {
        id: 'status',
        header: 'Status',
        accessor: 'status',
        sortable: true,
        priority: 3,
        cell: (order) => (
          <Tag size="small" tone={statusTone[order.status]}>
            {order.status}
          </Tag>
        ),
      },
      { id: 'region', header: 'Region', accessor: 'region', sortable: true, priority: 1 },
      { id: 'owner', header: 'Owner', accessor: 'owner', sortable: true },
      { id: 'due', header: 'Due', accessor: 'due', sortable: true, priority: 2, width: 104 },
      numberColumn({ id: 'items', header: 'Items', accessor: 'items', sortable: true }),
      numberColumn({
        id: 'total',
        header: 'Total',
        accessor: 'total',
        format: (value) => money(value as number),
        sortable: true,
        priority: 5,
        width: 112,
      }),
      actionsColumn({
        menu: () => [
          { id: 'edit', label: 'Edit' },
          { id: 'delete', label: 'Delete', danger: true },
        ],
        onMenuAction: (id, order) => {
          if (id === 'edit') return navigate(`/orders/${order.id}`);
          setSelectedIds([order.id]);
          setConfirming(true);
        },
        menuLabel: (order) => `Actions for order ${order.number}`,
      }),
    ],
    [],
  );

  return (
    <Page
      context="slate"
      header={
        <PageHeader
          title="Orders"
          subtitle={`${orders.length} orders, ${orders.filter((o) => o.status === 'Open').length} open`}
          actions={
            <Button variant="accent" iconStart={<Plus />} onPress={() => navigate('/orders/new')}>
              Add order
            </Button>
          }
        />
      }
    >
      <Card aria-label="Orders" padding="none" style={{ position: 'relative' }}>
        <DataTable
          aria-label="Orders"
          data={orders}
          getRowId={(order) => order.id}
          columns={columns}
          defaultSort={[{ id: 'number', direction: 'asc' }]}
          selectionMode="multiple"
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          selectRowLabel={(order) => `Select order ${order.number}`}
          rowHighlight={(order) => order.priority}
          highlightLabel="Priority handling"
          onRowAction={(order) => navigate(`/orders/${order.id}`)}
          expandableHidden
          striped
          empty={{ title: 'No orders', description: 'Add an order to see it here.' }}
        />
        <ActionBar
          variant="floating"
          aria-label="Selected orders"
          selectionCount={selectedIds.length}
          selectionLabel={(count) => `${count} selected`}
          onClearSelection={() => setSelectedIds([])}
          secondary={{
            label: 'Delete',
            icon: <Trash2 />,
            variant: 'danger',
            onPress: () => setConfirming(true),
          }}
          primary={{
            label: 'Mark as sent',
            icon: <Check />,
            variant: 'accent',
            onPress: () => {
              onChange(orders.map((o) => (selectedIds.includes(o.id) ? { ...o, status: 'Sent' } : o)));
              setSelectedIds([]);
            },
          }}
        />
      </Card>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        tone="danger"
        title={selectedIds.length === 1 ? 'Delete 1 order?' : `Delete ${selectedIds.length} orders?`}
        description="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => remove(selectedIds)}
      />

      {editing !== undefined && (
        <OrderForm
          // A new key per route, so the form starts from that order's values.
          key={editing}
          order={orders.find((order) => order.id === editing)}
          nextNumber={Math.max(1000, ...orders.map((order) => order.number)) + 1}
          onSave={(saved) => {
            onChange(
              orders.some((o) => o.id === saved.id)
                ? orders.map((o) => (o.id === saved.id ? saved : o))
                : [...orders, saved],
            );
            navigate('/orders');
          }}
        />
      )}
    </Page>
  );
}

function OrderForm({
  order,
  nextNumber,
  onSave,
}: {
  order: Order | undefined;
  nextNumber: number;
  onSave: (order: Order) => void;
}) {
  // An order made before clients were a choice has a name only: it is found by that name.
  const [clientId, setClientId] = useState(
    order ? (clients.find((c) => c.id === order.clientId || c.name === order.client)?.id ?? '') : '',
  );
  const client = clients.find((c) => c.id === clientId);
  const [region, setRegion] = useState<string>(order?.region ?? regions[0]);
  const [total, setTotal] = useState(String(order?.total ?? ''));
  const [priority, setPriority] = useState(order?.priority ?? false);
  const [submitted, setSubmitted] = useState(false);

  const amount = Number(total);
  const errors = {
    client: client ? undefined : 'Choose the client',
    total: total !== '' && amount > 0 ? undefined : 'Enter an amount above 0',
  };
  const dirty =
    (client?.name ?? '') !== (order?.client ?? '') ||
    region !== (order?.region ?? regions[0]) ||
    total !== String(order?.total ?? '') ||
    priority !== (order?.priority ?? false);

  const save = () => {
    setSubmitted(true);
    if (!client || errors.total) return;
    onSave({
      id: order?.id ?? `o-${nextNumber}`,
      number: order?.number ?? nextNumber,
      clientId: client.id,
      client: client.name,
      region,
      status: order?.status ?? 'Open',
      owner: order?.owner ?? 'Person 1',
      due: order?.due ?? '2026-11-30',
      items: order?.items ?? 1,
      total: amount,
      priority,
    });
  };

  return (
    <Modal
      open
      onOpenChange={(open) => !open && navigate('/orders')}
      title={order ? `Edit order ${order.number}` : 'New order'}
      description={order ? undefined : `It becomes order ${nextNumber}.`}
      footer={
        <ActionBar
          status={dirty ? { tone: 'warning', text: 'Unsaved changes' } : undefined}
          secondary={<Modal.Close>Cancel</Modal.Close>}
          primary={
            <Button variant="primary" onPress={save}>
              {order ? 'Save order' : 'Create order'}
            </Button>
          }
        />
      }
    >
      <div style={{ display: 'grid', gap: 'var(--umbra-space-5)' }}>
        <FormField label="Client" required error={submitted ? errors.client : undefined}>
          <Select
            searchable
            fullWidth
            placeholder="Choose a client"
            options={clients.map((c) => ({ id: c.id, label: c.name }))}
            value={clientId}
            onChange={setClientId}
          />
        </FormField>
        <RadioGroup label="Region" orientation="horizontal" value={region} onChange={setRegion}>
          {regions.map((name) => (
            <Radio key={name} value={name}>
              {name}
            </Radio>
          ))}
        </RadioGroup>
        <FormField
          label="Total"
          description="In credits, without tax."
          required
          error={submitted ? errors.total : undefined}
        >
          <TextField type="number" value={total} onChange={setTotal} suffix="cr" />
        </FormField>
        <Checkbox checked={priority} onChange={setPriority} description="Marks the row in the table.">
          Priority handling
        </Checkbox>
      </div>
    </Modal>
  );
}
