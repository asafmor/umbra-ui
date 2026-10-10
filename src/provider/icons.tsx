import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  CircleAlert,
  CircleCheck,
  CircleMinus,
  Ellipsis,
  ExternalLink,
  Info,
  Lightbulb,
  LoaderCircle,
  Maximize2,
  MessageSquare,
  Minus,
  OctagonAlert,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Search,
  TriangleAlert,
  User,
  X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import styles from './icons.module.css';
import { useUmbra } from './UmbraProvider';

/** The built-in icons, by name. Override any of them with the `icons` prop of `UmbraProvider`. */
export const defaultIcons = {
  back: <ArrowLeft />,
  forward: <ArrowRight />,
  chevronDown: <ChevronDown />,
  chevronRight: <ChevronRight />,
  close: <X />,
  expand: <Maximize2 />,
  more: <Ellipsis />,
  search: <Search />,
  spinner: <LoaderCircle />,
  edit: <Pencil />,
  // The direction of a sorted column is the shape of its arrow.
  sortAscending: <ArrowUp />,
  sortDescending: <ArrowDown />,
  sortNone: <ChevronsUpDown />,
  // Marks of a selected or mixed control, and of an invalid field.
  check: <Check />,
  indeterminate: <Minus />,
  invalid: <CircleAlert />,
  // One shape per tone, so a tone never depends on colour.
  info: <Info />,
  success: <CircleCheck />,
  warning: <TriangleAlert />,
  danger: <OctagonAlert />,
  neutral: <CircleMinus />,
  message: <MessageSquare />,
  tip: <Lightbulb />,
  trendUp: <ArrowUp />,
  trendDown: <ArrowDown />,
  trendFlat: <Minus />,
  externalLink: <ExternalLink />,
  user: <User />,
  panelClose: <PanelLeftClose />,
  panelOpen: <PanelLeftOpen />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof defaultIcons;
export type IconMap = Record<IconName, ReactNode>;

/** Internal: renders a built-in icon from the provider's icon map. Decorative, so hidden from screen readers. */
export function Icon({ name, spin, part }: { name: IconName; spin?: boolean; part?: string }) {
  return (
    <span className={styles.icon} data-part={part} data-spin={spin || undefined} aria-hidden="true">
      {useUmbra().icons[name]}
    </span>
  );
}

/** Internal: a built-in icon from the provider's icon map with no wrapper, for a part that sizes its own mark. */
export function RawIcon({ name }: { name: IconName }) {
  return useUmbra().icons[name];
}

/** Internal: wraps an icon node supplied by the app so it gets the same size as built-in icons. */
export function IconSlot({ children, part }: { children: ReactNode; part?: string }) {
  return (
    <span className={styles.icon} data-part={part} aria-hidden="true">
      {children}
    </span>
  );
}
