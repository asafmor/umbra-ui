// Invented, domain-neutral sample data for the DataTable stories. Every value is derived from the row's
// index, so the stories render the same every time.

export interface Region {
  id: string;
  name: string;
  orders: number;
  won: number;
  open: number;
  lost: number;
  points: number;
}

/** Twenty regions in ranking order. */
export const regions: Region[] = Array.from({ length: 20 }, (_, i) => {
  const won = Math.max(1, 19 - i - (i % 3));
  const open = (i * 5) % 7;
  const lost = Math.max(0, 30 - won - open - (i % 4));
  return {
    id: `r${i + 1}`,
    name: `Region ${i + 1}`,
    orders: won + open + lost,
    won,
    open,
    lost,
    points: won * 3 + open,
  };
}).sort((a, b) => b.points - a.points);

export interface Person {
  id: string;
  name: string;
  team: string;
  role: string;
  status: 'active' | 'away' | 'offline';
  score: number;
  progress: number;
  change: number;
  level: number;
  tasks: number;
}

const roles = ['Analyst', 'Planner', 'Reviewer', 'Lead'];
const statuses = ['active', 'away', 'offline'] as const;

/** `count` people: "Person A", "Person B", … */
export const people = (count: number): Person[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Person ${String.fromCharCode(65 + (i % 26))}${i >= 26 ? Math.floor(i / 26) : ''}`,
    team: `Team ${(i % 4) + 1}`,
    role: roles[i % roles.length]!,
    status: statuses[(i * 2) % 3]!,
    score: 38 + ((i * 17) % 60),
    progress: (i * 23 + 15) % 101,
    change: ((i * 7) % 9) - 4,
    level: 1 + ((i * 3) % 5),
    tasks: (i * 5) % 13,
  }));

export interface Site {
  id: string;
  name: string;
  area: string;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  target: number;
  staff: number;
  cost: number;
}

/** `count` sites with four quarters of numbers. */
export const sites = (count: number): Site[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `s${i + 1}`,
    name: `Site ${i + 1}`,
    area: `Area ${(i % 3) + 1}`,
    q1: 120 + ((i * 37) % 180),
    q2: 140 + ((i * 53) % 160),
    q3: 110 + ((i * 29) % 210),
    q4: 150 + ((i * 41) % 170),
    target: 700 + ((i * 61) % 300),
    staff: 4 + ((i * 3) % 22),
    cost: 18 + ((i * 11) % 40),
  }));

export interface Order {
  id: string;
  item: string;
  category: string;
  owner: string;
  amount: number;
  quantity: number;
  state: 'open' | 'packed' | 'sent';
}

const states = ['open', 'packed', 'sent'] as const;

/** `count` orders; used for grouping and for the 10,000-row story. */
export const orders = (count: number): Order[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `o${i + 1}`,
    item: `Item ${i + 1}`,
    category: `Category ${(i % 8) + 1}`,
    owner: `Person ${String.fromCharCode(65 + ((i * 7) % 26))}`,
    amount: 20 + ((i * 7919) % 4980),
    quantity: 1 + ((i * 13) % 40),
    state: states[(i * 5) % 3]!,
  }));

export const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
