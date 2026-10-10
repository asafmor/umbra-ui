// Sample content shared by the shell stories. Invented, domain-neutral.
import {
  BookOpen,
  CalendarDays,
  ChevronsRight,
  Download,
  FileText,
  Inbox,
  LayoutDashboard,
  Plus,
  Settings,
  SlidersHorizontal,
  UserRound,
  Users,
} from 'lucide-react';
import type { Command } from '../overlays/CommandPalette';
import type { Shortcut } from '../provider/shortcuts';
import { PrimaryAction, type PrimaryActionProps } from './PrimaryAction';
import type { ShortcutBarItem } from './ShortcutBar';

/** The primary action the bar stories use. */
export const SamplePrimaryAction = (props: Partial<PrimaryActionProps>) => (
  <PrimaryAction label="Continue" icon={<ChevronsRight />} {...props} />
);

/** Pinned shortcuts, each with an icon. */
export const pinned: ShortcutBarItem[] = [
  { id: 'inbox', label: 'Inbox', icon: <Inbox />, href: '#inbox', badge: 8 },
  { id: 'team', label: 'Team', icon: <Users />, href: '#team' },
  { id: 'directory', label: 'Directory', icon: <BookOpen />, href: '#directory' },
  { id: 'calendar', label: 'Calendar', icon: <CalendarDays />, href: '#calendar' },
  { id: 'reports', label: 'Reports', icon: <FileText />, href: '#reports' },
];

/** The app's own key bindings, for stories that show key hints. */
export const appShortcuts: Shortcut[] = [
  { id: 'app.newOrder', keys: 'Mod+Shift+O', label: 'New order' },
  { id: 'app.export', keys: 'Mod+E', label: 'Export report' },
  { id: 'app.continue', keys: 'Mod+Enter', label: 'Continue' },
];

/** Entries for the command palette: pages, actions, a page with sub-commands, and people. */
export const commands: Command[] = [
  { id: 'overview', label: 'Overview', section: 'Go to', icon: <LayoutDashboard />, href: '#overview' },
  { id: 'orders', label: 'Orders', section: 'Go to', icon: <Inbox />, href: '#orders' },
  { id: 'open-orders', label: 'Open orders', section: 'Go to', icon: <Inbox />, href: '#open-orders' },
  { id: 'records', label: 'Records', section: 'Go to', icon: <FileText />, href: '#records' },
  { id: 'settings', label: 'Settings', section: 'Go to', icon: <Settings />, href: '#settings' },
  {
    id: 'new-order',
    label: 'New order',
    description: 'Start an order for a region',
    section: 'Actions',
    icon: <Plus />,
    shortcut: 'app.newOrder',
  },
  {
    id: 'export',
    label: 'Export report',
    section: 'Actions',
    icon: <Download />,
    keywords: ['download', 'csv'],
    shortcut: 'app.export',
  },
  { id: 'invite', label: 'Invite a person', section: 'Actions', icon: <UserRound />, disabled: true },
  {
    id: 'density',
    label: 'Change density',
    description: 'Compact, default or spacious',
    section: 'Actions',
    icon: <SlidersHorizontal />,
    children: [
      { id: 'density-compact', label: 'Compact' },
      { id: 'density-default', label: 'Default' },
      { id: 'density-spacious', label: 'Spacious', keepOpen: true },
    ],
  },
  ...['Person A', 'Person B', 'Person C', 'Person D', 'Person E', 'Person F'].map((label, i) => ({
    id: `person-${i}`,
    label,
    description: `Region ${i + 1}`,
    section: 'People',
    icon: <UserRound />,
  })),
];
