// Sample data shared by the three page stories. Invented and domain-neutral; every value is derived
// from an index, so the stories render the same every time.

const letter = (i: number) => String.fromCharCode(65 + (i % 26));
export const person = (i: number) => `Person ${letter(i)}${i >= 26 ? Math.floor(i / 26) : ''}`;

// --- Inbox and requests --------------------------------------------------------------------------------

export type MessageKind = 'new' | 'task' | 'info';

export interface Message {
  id: string;
  day: string;
  from: string;
  role: string;
  title: string;
  time: string;
  tag: string;
  kind: MessageKind;
  unread: boolean;
  /** The request waits for an answer. */
  mustRespond: boolean;
  amount: number;
  region: string;
  team: string;
  /** Six monthly values, for the chart of the detail pane. */
  trend: number[];
  /** Five ratings from 1 to 5. */
  levels: number[];
  score: number;
}

const subjects: [title: string, tag: string][] = [
  ['Onboarding review', 'Training'],
  ['Planning advice', 'Staff advice'],
  ['Schedule clash for Team 2', 'Scheduling'],
  ['Site 20 selection advice', 'Planning'],
  ['Trainee stands out in audit', 'Review'],
  ['Site 20 report', 'Research'],
  ['Staffing advice', 'Staff advice'],
  ['Vendor research report', 'Research'],
  ['Review preparation for Site 20', 'Planning'],
  ['Client praises on-time delivery', 'Media'],
  ['Invoice 2291 needs approval', 'Finance'],
  ['Order 1042 is blocked', 'Orders'],
  ['Q3 budget request', 'Finance'],
  ['Access request for Region 3', 'Access'],
  ['Contract renewal for Client D', 'Contracts'],
  ['Returns above target in Region 7', 'Orders'],
  ['Introduction to the planning team', 'Introduction'],
  ['Shift swap for Team 4', 'Scheduling'],
];
const roles = ['Operations lead', 'Planner', 'Reviewer', 'Analyst', 'Finance partner'];
const days = ['Fri 9 Oct', 'Thu 8 Oct', 'Wed 7 Oct'];
const kinds: MessageKind[] = ['new', 'task', 'info'];

export const messages: Message[] = subjects.map(([title, tag], i) => ({
  id: `m${i + 1}`,
  day: days[Math.min(2, Math.floor(i / 6))]!,
  from: person(i % 7),
  role: roles[i % roles.length]!,
  title,
  time: `${String(21 - ((i * 5) % 14)).padStart(2, '0')}:${String((i * 37 + 12) % 60).padStart(2, '0')}`,
  tag,
  kind: kinds[i % 3]!,
  unread: i % 4 === 0 || i === 1,
  mustRespond: i % 3 === 1,
  amount: 1200 + ((i * 7919) % 48000),
  region: `Region ${(i % 9) + 1}`,
  team: `Team ${(i % 4) + 1}`,
  trend: Array.from({ length: 6 }, (_, m) => 40 + ((i * 13 + m * 29) % 55)),
  levels: Array.from({ length: 5 }, (_, a) => 1 + ((i * 3 + a * 2) % 5)),
  score: 35 + ((i * 17) % 62),
}));

export const messageDays = days.map((day) => ({ day, items: messages.filter((m) => m.day === day) }));
export const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
export const attributes = ['Accuracy', 'Speed', 'Coverage', 'Cost', 'Quality'];

// --- Overview --------------------------------------------------------------------------------------------

export const updates = [
  { id: 'u1', title: 'Unclear outcome at Site 7', age: '3d' },
  { id: 'u2', title: 'Team 3 has work to do after a slow start', age: '2d' },
  { id: 'u3', title: 'Region 4 closes its backlog', age: '1d' },
];

export interface Delivery {
  id: string;
  date: string;
  client: string;
  site: string;
  status: 'done' | 'missed' | 'late' | 'planned';
  channel: string;
}

const deliveryStatus: Delivery['status'][] = ['done', 'done', 'done', 'missed', 'done', 'late'];
export const deliveries: Delivery[] = Array.from({ length: 9 }, (_, i) => ({
  id: `d${i + 1}`,
  date: `${String(((i * 4 + 2) % 27) + 1).padStart(2, '0')}/${i < 4 ? '09' : '10'}`,
  client: `Client ${letter(i % 8)}`,
  site: i % 3 === 1 ? 'Remote' : 'On site',
  status: i < 6 ? deliveryStatus[i]! : 'planned',
  channel: ['Direct', 'Partner', 'Tender'][i % 3]!,
}));

export interface Region {
  id: string;
  pos: number;
  name: string;
  orders: number;
  won: number;
  open: number;
  lost: number;
  points: number;
}

export const regions: Region[] = Array.from({ length: 19 }, (_, i) => {
  const won = Math.max(0, 3 - Math.floor(i / 4) - (i % 4 === 3 ? 1 : 0));
  const open = i % 5 === 2 ? 1 : 0;
  return {
    id: `r${i + 1}`,
    pos: i + 1,
    name: `Region ${i + 1}`,
    orders: 3,
    won,
    open,
    lost: Math.max(0, 3 - won - open),
    points: won * 3 + open,
  };
})
  .sort((a, b) => b.points - a.points)
  .map((region, i) => ({ ...region, pos: i + 1 }));

/** The row the user owns in the ranking. */
export const ownRegion = regions[4]!.id;

export const performers = [
  { id: 'p1', label: 'Highest average rating', who: person(7), value: '9.1' },
  { id: 'p2', label: 'Most closed orders', who: person(7), value: '6' },
  { id: 'p3', label: 'Most referrals', who: person(9), value: '2' },
  { id: 'p4', label: 'Most reviews passed', who: person(10), value: '2' },
];

export const insightAxes = ['Quality', 'Speed', 'Cost', 'Reach', 'Safety', 'Growth'];
export const insightValues = { own: [72, 58, 64, 81, 69, 55], average: [60, 62, 58, 66, 71, 52] };

export const week = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => ({
  day,
  today: i === 5,
  slots: [(i * 2) % 4, (i * 3 + 1) % 4],
}));
export const slotKinds = ['Review', 'Delivery', 'Planning', 'Free'];

// --- Records -------------------------------------------------------------------------------------------

export type Stage = 'Review' | 'Approved' | 'Packed' | 'Sent';
export type Health = 'ok' | 'late' | 'blocked';

export interface Order {
  id: string;
  name: string;
  client: string;
  owner: string;
  team: string;
  region: string;
  stage: Stage;
  health: Health;
  priority: 'High' | 'Normal' | 'Low';
  channel: string;
  due: string;
  daysOpen: number;
  quantity: number;
  amount: number;
  margin: number;
  score: number;
  progress: number;
  change: number;
  level: number;
  invoices: number;
  returns: number;
  flagged: boolean;
}

export const stages: Stage[] = ['Review', 'Approved', 'Packed', 'Sent'];
const health: Health[] = ['ok', 'ok', 'late', 'ok', 'blocked', 'ok', 'ok'];
const priorities = ['Normal', 'High', 'Normal', 'Low'] as const;

export const orders: Order[] = Array.from({ length: 600 }, (_, i) => ({
  id: `o${i + 1}`,
  name: `Order ${1001 + i}`,
  client: `Client ${letter(i * 5)}`,
  owner: person((i * 7) % 26),
  team: `Team ${(i % 6) + 1}`,
  region: `Region ${((i * 3) % 9) + 1}`,
  stage: stages[(i * 7) % 4]!,
  health: health[(i * 3) % health.length]!,
  priority: priorities[(i * 5) % 4]!,
  channel: ['Direct', 'Partner', 'Tender'][(i * 2) % 3]!,
  due: `${String(((i * 11) % 28) + 1).padStart(2, '0')}/${String(((i * 5) % 3) + 10)}`,
  daysOpen: 1 + ((i * 13) % 45),
  quantity: 1 + ((i * 17) % 60),
  amount: 200 + ((i * 7919) % 9800),
  margin: 4 + ((i * 29) % 38),
  score: 20 + ((i * 31) % 80),
  progress: (i * 23 + 15) % 101,
  change: ((i * 7) % 9) - 4,
  level: 1 + ((i * 3) % 5),
  invoices: (i * 5) % 7,
  returns: (i * 11) % 5 === 0 ? (i % 4) + 1 : 0,
  flagged: i % 9 === 2,
}));

export const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
export const money = (value: number) => `€${Math.round(value).toLocaleString('en-GB')}`;
