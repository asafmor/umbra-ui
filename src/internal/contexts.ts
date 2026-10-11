import { createContext } from 'react';

/**
 * True inside the menu that holds actions which did not fit in their row. There, a `Button` or
 * `IconButton` renders as a menu item with its icon and label, and a `Menu` as a submenu.
 */
export const OverflowMenuContext = createContext(false);

/** Set by a container (the TopBar) to make buttons with `collapseTo="icon"` show their icon only. */
export const ForceCollapseContext = createContext(false);

/**
 * Set by a `Modal`: its backdrop element. Overlays opened from inside the modal (tooltip, menu, select
 * list, popover) render into it instead of `<body>`. They are then above the modal, and inside what the
 * modal leaves reachable: everything outside it is inert.
 */
export const OverlayContainerContext = createContext<HTMLElement | null>(null);
