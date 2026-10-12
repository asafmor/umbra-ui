import { createContext, isValidElement, useContext, useLayoutEffect, type ReactNode } from 'react';

/**
 * A control that cannot be a row of a menu (a `Stepper`, a `Slider`, a field) says so with a static
 * `staysInRow = true` on its component. Among actions that no longer fit, it stays in the row beside the
 * "more" button, and it is never rendered into the menu: a menu holds rows only, and anything else
 * drawn there breaks it.
 */
export const staysInRow = (child: ReactNode) =>
  isValidElement(child) && !!(child.type as { staysInRow?: boolean | undefined }).staysInRow;

/**
 * What can be a row of a menu says so with a static `overflowsToMenu = true`: `Button`, `IconButton`,
 * `Menu`, `SplitButton`. Among actions that no longer fit, these move into the "more" menu.
 */
export const overflowsToMenu = (child: ReactNode) =>
  isValidElement(child) && !!(child.type as { overflowsToMenu?: boolean | undefined }).overflowsToMenu;

/** What an action holds: something that can be a row of a menu, or a control that stays in the row. */
export type ActionKind = 'row' | 'stays';

/**
 * Set by `ActionsOverflow` around each action that is a component of the app, while it is drawn in the
 * row: the row cannot see into such a component, so what is inside tells it. A button says `row`, a
 * control that cannot be a row of a menu says `stays`.
 */
export const ActionProbeContext = createContext<((kind: ActionKind) => void) | null>(null);

/** Tells the row of actions around this component what it is. Outside such a row it does nothing. */
export function useActionKind(kind: ActionKind) {
  const probe = useContext(ActionProbeContext);
  useLayoutEffect(() => probe?.(kind), [probe, kind]);
}

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

/**
 * True inside the overflow menu. A control that stays in the row is a direct child of the actions; one
 * that an app's own component renders cannot be seen there and arrives in the menu, where it draws
 * nothing rather than break the menu.
 */
export const useInOverflowMenu = () => useContext(OverflowMenuContext) !== null;

/** Set by a container (the TopBar) to make buttons with `collapseTo="icon"` show their icon only. */
export const ForceCollapseContext = createContext(false);

/**
 * Set by the `TopBar`: how many of its own steps the `ContextBlock` in the bar has to take (0 to 2)
 * before the bar hides the block altogether.
 */
export const ContextShrinkContext = createContext(0);

/**
 * Set by a `Modal`: its backdrop element. Overlays opened from inside the modal (tooltip, menu, select
 * list, popover) render into it instead of `<body>`. They are then above the modal, and inside what the
 * modal leaves reachable: everything outside it is inert.
 */
export const OverlayContainerContext = createContext<HTMLElement | null>(null);

/**
 * True directly inside the rows of a `List`, where only `List.Item` and `List.Group` can be: React Aria
 * renders what is there into a document of its own, which holds no drawing (an SVG there throws). A
 * `List.Item` and a group header turn it off again for what they draw.
 */
export const RowsOnlyContext = createContext(false);
