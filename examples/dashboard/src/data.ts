// Invented, deterministic sample data: the same numbers on every run.

export const channels = [
  { id: 'all', label: 'All channels' },
  { id: 'direct', label: 'Direct' },
  { id: 'partners', label: 'Partners' },
];
/** Each channel is a share of the whole. */
const share: Record<string, number> = { all: 1, direct: 0.62, partners: 0.38 };

export const regions = [
  { id: 'a', label: 'Region A' },
  { id: 'b', label: 'Region B' },
  { id: 'c', label: 'Region C' },
  { id: 'd', label: 'Region D' },
];
export const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const productLines = ['Line A', 'Line B', 'Line C', 'Line D', 'Line E'];

/** A smooth, repeatable series: no random numbers. */
const wave = (i: number, seed: number) => 60 + 22 * Math.sin(i * 0.8 + seed * 1.7) + i * 3 + seed * 9;

export function dashboardData(channel: string) {
  const k = share[channel] ?? 1;
  const revenue = regions.map((region, r) => ({
    ...region,
    data: months.map((x, i) => ({ x, y: Math.round(wave(i, r) * k) })),
  }));
  const orders = regions.map((region, r) => ({
    ...region,
    values: productLines.map((_, i) => Math.round((40 + ((i * 17 + r * 23) % 45)) * k)),
  }));
  const total = revenue.reduce((sum, s) => sum + s.data.reduce((a, p) => a + p.y, 0), 0);
  const orderCount = orders.reduce((sum, s) => sum + s.values.reduce((a, v) => a + v, 0), 0);
  return {
    revenue,
    orders,
    total,
    orderCount,
    newClients: Math.round(48 * k),
    returns: Math.round(21 * k),
    target: Math.round(64 + 14 * k),
    status: [
      { id: 'open', label: 'Open', value: Math.round(118 * k) },
      { id: 'packed', label: 'Packed', value: Math.round(64 * k) },
      { id: 'sent', label: 'Sent', value: Math.round(402 * k) },
      { id: 'returned', label: 'Returned', value: Math.round(21 * k) },
    ],
  };
}

export interface Order {
  id: string;
  client: string;
  region: string;
  total: number;
  status: 'Open' | 'Packed' | 'Sent' | 'Returned';
}
const statuses = ['Open', 'Packed', 'Sent', 'Returned'] as const;
export const recentOrders: Order[] = Array.from({ length: 24 }, (_, i) => ({
  id: `#${4120 - i}`,
  client: `Client ${((i * 7) % 19) + 1}`,
  region: regions[i % regions.length]!.label,
  total: 180 + ((i * 137) % 900),
  status: statuses[(i * 3) % statuses.length]!,
}));

export const activity = [
  { id: 1, who: 'Person 7', what: 'Approved the discount for Client 12', when: '09:40' },
  { id: 2, who: 'Person 3', what: 'Moved 14 orders to Region B', when: '09:12' },
  { id: 3, who: 'Person 11', what: 'Closed the stock count for Line C', when: '08:55' },
  { id: 4, who: 'Person 2', what: 'Added Client 20', when: '08:31' },
  { id: 5, who: 'Person 7', what: 'Raised the target of Region D', when: 'Yesterday' },
  { id: 6, who: 'Person 5', what: 'Returned order #4098 to the depot', when: 'Yesterday' },
  { id: 7, who: 'Person 9', what: 'Published the weekly report', when: 'Yesterday' },
  { id: 8, who: 'Person 3', what: 'Changed the price list of Line A', when: 'Mon' },
];
