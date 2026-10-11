import { Check, CircleDashed, Package } from 'lucide-react';
import { useState } from 'react';
import {
  Card,
  Columns,
  Page,
  Planner as MonthPlanner,
  WeekStrip,
  type IsoDate,
  type ScheduleItem,
} from 'umbra-ui';
import { money, type Order, type OrderStatus } from '../data';
import { navigate } from '../router';

// Each status has its own icon, so none is told from the others by colour alone.
const looks: Record<OrderStatus, Pick<ScheduleItem, 'tone' | 'icon'>> = {
  Open: { tone: 'info', icon: <CircleDashed /> },
  Packed: { tone: 'warning', icon: <Package /> },
  Sent: { tone: 'success', icon: <Check /> },
};

/**
 * The orders by their due date. An order's `due` is an ISO date already (`2026-11-08`), which is what
 * the planner takes: no `Date` object, so no time zone can move an order to the day before.
 */
export function Planner({ orders }: { orders: Order[] }) {
  const [selected, setSelected] = useState<IsoDate | null>(null);
  const items: ScheduleItem[] = orders.map((order) => ({
    id: order.id,
    date: order.due,
    label: `${order.number} · ${order.client}`,
    ...looks[order.status],
  }));
  // The month the orders are due in; today is the day it is where the user is.
  const month = orders[0]?.due.slice(0, 7) ?? '2026-11';

  return (
    <Page context="violet">
      <Columns>
        <Card title="Due dates" label="Month" size={3}>
          <MonthPlanner
            aria-label="Orders by due date"
            defaultMonth={month}
            items={items}
            slotsPerDay={3}
            weekStartsOn={1}
            selectedDate={selected}
            onSelectedDateChange={setSelected}
            // An order opens in its form, which is a route.
            onAction={(id) => navigate(`/orders/${id}`)}
            renderWeek={(week) => {
              const due = orders.filter((order) => order.due >= week.start && order.due <= week.end);
              return (
                <>
                  <b>{due.length === 1 ? '1 order' : `${due.length} orders`}</b>
                  <span>{money(due.reduce((sum, order) => sum + order.total, 0))}</span>
                </>
              );
            }}
            weekAsideWidth={120}
            emptyWeekLabel="Nothing due"
          />
        </Card>
        <Card
          title="The selected week"
          label="Week"
          empty={selected ? undefined : 'Select a day in the month'}
        >
          {selected && (
            <WeekStrip
              aria-label="The week of the selected day"
              date={selected}
              weekStartsOn={1}
              items={items}
              slotsPerDay={3}
              selectedDate={selected}
              onSelectedDateChange={setSelected}
              onAction={(id) => navigate(`/orders/${id}`)}
            />
          )}
        </Card>
      </Columns>
    </Page>
  );
}
