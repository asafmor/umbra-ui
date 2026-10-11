// Sample data. Everything is computed from the index, so every run shows the same rows.
export const regions = ['Region A', 'Region B', 'Region C'] as const;
export const statuses = ['Open', 'Packed', 'Sent'] as const;
export type OrderStatus = (typeof statuses)[number];

export interface Contact {
  name: string;
  role: string;
  email: string;
}

export interface Client {
  id: string;
  name: string;
  region: string;
  tier: 'Standard' | 'Plus' | 'Key';
  health: 'success' | 'warning' | 'neutral';
  healthLabel: string;
  owner: string;
  since: number;
  revenue: number;
  /** Out of five, in halves. */
  rating: number;
  contacts: Contact[];
}

export interface Order {
  id: string;
  number: number;
  clientId: string;
  client: string;
  region: string;
  status: OrderStatus;
  owner: string;
  due: string;
  items: number;
  total: number;
  priority: boolean;
}

const pick = <T>(list: readonly T[], i: number) => list[i % list.length]!;
const roles = ['Buyer', 'Finance', 'Operations', 'Director'];

export const clients: Client[] = Array.from({ length: 24 }, (_, i) => {
  const health = pick(['success', 'success', 'warning', 'neutral'] as const, i);
  return {
    id: `c-${i + 1}`,
    name: `Client ${i + 1}`,
    region: pick(regions, i),
    tier: pick(['Standard', 'Plus', 'Key'] as const, i + (i % 2)),
    health,
    healthLabel: { success: 'Active', warning: 'Payment late', neutral: 'Paused' }[health],
    owner: `Person ${(i % 6) + 1}`,
    since: 2015 + (i % 10),
    revenue: 40_000 + ((i * 37) % 23) * 12_500,
    rating: 2.5 + ((i * 3) % 6) / 2,
    contacts: Array.from({ length: 2 + (i % 3) }, (_, n) => {
      const person = 10 + i * 3 + n;
      return { name: `Person ${person}`, role: pick(roles, i + n), email: `person${person}@example.com` };
    }),
  };
});

export const initialOrders: Order[] = Array.from({ length: 40 }, (_, i) => {
  const client = pick(clients, i * 5);
  return {
    id: `o-${1001 + i}`,
    number: 1001 + i,
    clientId: client.id,
    client: client.name,
    region: client.region,
    status: pick(statuses, i + (i % 4)),
    owner: client.owner,
    due: `2026-11-${String(1 + ((i * 11) % 28)).padStart(2, '0')}`,
    items: 1 + ((i * 3) % 12),
    total: 180 + ((i * 53) % 40) * 45,
    priority: i % 7 === 0,
  };
});

export const money = (value: number) => `${value.toLocaleString('en-GB')} cr`;
