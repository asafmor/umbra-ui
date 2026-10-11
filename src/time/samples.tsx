// Sample data shared by the stories of this folder. Invented and domain-neutral. Not part of the library.
import { ClipboardList, Coffee, SearchCheck, Truck, Users, Wrench } from 'lucide-react';
import type { ReactNode } from 'react';
import { addDays } from './dates';
import type { ScheduleItem } from './ScheduleSlot';

/** Every story passes this as `today`, so its pictures do not change with the calendar. A Wednesday. */
export const TODAY = '2026-10-14';

type Kind = Pick<ScheduleItem, 'label' | 'tone' | 'series' | 'variant'> & { label: string; icon: ReactNode };

/** The categories of the sample schedule: each has its own icon, so none rests on its colour. */
export const kinds = {
  planning: { label: 'Planning', tone: 'info', icon: <ClipboardList /> },
  delivery: { label: 'Delivery', tone: 'success', icon: <Truck /> },
  review: { label: 'Quarterly review', tone: 'accent', icon: <SearchCheck /> },
  upkeep: { label: 'Upkeep', tone: 'warning', icon: <Wrench /> },
  workshop: { label: 'Team workshop', series: 5, icon: <Users /> },
  free: { label: 'Free', variant: 'empty', icon: <Coffee /> },
} satisfies Record<string, Kind>;

const order = Object.keys(kinds) as (keyof typeof kinds)[];

/** Items for `days` days from `start`: up to `perDay` a day, in a fixed pattern with some slots left free. */
export function sampleItems(
  start: string,
  days: number,
  perDay = 3,
  skip: (date: string) => boolean = () => false,
) {
  const items: ScheduleItem[] = [];
  for (let d = 0; d < days; d++) {
    const date = addDays(start, d);
    if (skip(date)) continue;
    for (let s = 0; s < perDay; s++) {
      // A slot in seven is left free.
      if ((d * 3 + s * 5) % 7 === 3) continue;
      const kind = order[(d * 2 + s * 3) % order.length]!;
      items.push({ id: `${date}-${s}`, date, slot: s, ...kinds[kind] });
    }
  }
  return items;
}

/** September to November 2026, with the week of 18 October left without items. */
export const october = sampleItems(
  '2026-08-30',
  98,
  3,
  (date) => date >= '2026-10-18' && date <= '2026-10-24',
);

/** The week of `TODAY`, two slots a day. */
export const thisWeek = sampleItems('2026-10-11', 7, 2);
