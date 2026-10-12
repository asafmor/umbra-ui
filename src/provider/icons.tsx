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
  History,
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
  Star,
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
  recent: <History />,
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
  // One shape for a full and an empty star of `StarRating`: the full one is filled.
  star: <Star />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof defaultIcons;

/** Icons that point along the reading direction: mirrored when the direction is right to left. */
const directional: ReadonlySet<IconName> = new Set([
  'back',
  'forward',
  'chevronRight',
  'panelClose',
  'panelOpen',
]);
export type IconMap = Record<IconName, ReactNode>;

/** Internal: renders a built-in icon from the provider's icon map. Decorative, so hidden from screen readers. */
export function Icon({
  name,
  spin,
  part,
}: {
  name: IconName;
  spin?: boolean | undefined;
  part?: string | undefined;
}) {
  return (
    <span
      className={styles.icon}
      data-part={part}
      data-spin={spin || undefined}
      data-mirror={directional.has(name) || undefined}
      aria-hidden="true"
    >
      {useUmbra().icons[name]}
    </span>
  );
}

/** Internal: a built-in icon from the provider's icon map with no wrapper, for a part that sizes its own mark. */
export function RawIcon({ name }: { name: IconName }) {
  return useUmbra().icons[name];
}

/** Internal: a built-in icon without a wrapper, for a component that sizes the icon itself. */
export function BareIcon({ name }: { name: IconName }) {
  return useUmbra().icons[name];
}

/** Internal: wraps an icon node supplied by the app so it gets the same size as built-in icons. */
export function IconSlot({
  children,
  part,
  filled,
}: {
  children: ReactNode;
  part?: string | undefined;
  /** The icon of a toggle that is on: its shape is drawn filled (`Button.module.css`). */
  filled?: boolean | undefined;
}) {
  return (
    <span className={styles.icon} data-part={part} data-filled={filled || undefined} aria-hidden="true">
      {children}
    </span>
  );
}
