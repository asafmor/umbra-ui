import { createContext, type ReactNode } from 'react';

/** What a `Button` or `IconButton` hands to the overflow menu, to be drawn as one of its rows. */
export interface OverflowRowProps {
  /** Accessible name, when the content is not text. */
  label?: string | undefined;
  /** The label as text, for type-ahead. */
  text?: string | undefined;
  href?: string | undefined;
  disabled: boolean;
  /** A toggle: the row is a checkbox item. */
  pressed?: boolean | undefined;
  /** Id of a shortcut: its keys are shown at the end of the row. */
  shortcut?: string | undefined;
  onPress?: (() => void) | undefined;
  className?: string | undefined;
  children: ReactNode;
}

/**
 * Set inside the menu that holds actions which did not fit in their row: what draws a row. There, a `Button` or `IconButton` renders as a menu item with its icon and label, and a `Menu`
 * as a submenu. The menu supplies the row, so a button does not carry the menu item's code.
 */
export const OverflowMenuContext = createContext<((row: OverflowRowProps) => ReactNode) | null>(null);

/** Set by a container (the TopBar) to make buttons with `collapseTo="icon"` show their icon only. */
export const ForceCollapseContext = createContext(false);

/**
 * Set by a `Modal`: its backdrop element. Overlays opened from inside the modal (tooltip, menu, select
 * list, popover) render into it instead of `<body>`. They are then above the modal, and inside what the
 * modal leaves reachable: everything outside it is inert.
 */
export const OverlayContainerContext = createContext<HTMLElement | null>(null);
