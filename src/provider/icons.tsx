import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Ellipsis,
  LoaderCircle,
  Maximize2,
  Search,
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

/** Internal: wraps an icon node supplied by the app so it gets the same size as built-in icons. */
export function IconSlot({ children, part }: { children: ReactNode; part?: string }) {
  return (
    <span className={styles.icon} data-part={part} aria-hidden="true">
      {children}
    </span>
  );
}
