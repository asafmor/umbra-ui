import {
  Children,
  cloneElement,
  Fragment,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ButtonBase } from '../basics/Button';
import { Icon } from '../provider/icons';
import { warn } from '../utils/dev';
import { ActionProbeContext, overflowsToMenu, staysInRow, type ActionKind } from './contexts';

type OverflowMenu = typeof import('../overlays/Menu').OverflowMenu;

// The menu is the heaviest thing a header could hold, and most headers fit. So its module is loaded
// the first time one does not: an app's bundler makes a chunk of it, and a card, a section title or a
// page header whose actions fit never asks for it (plan/decisions/05-packaging.md, "Loaded on demand").
// One request for the page; a failed one is tried again by the next header or the next press.
let loading: Promise<OverflowMenu> | undefined;
const load = () =>
  (loading ??= import('../overlays/Menu').then(
    (module) => module.OverflowMenu,
    (error: unknown) => {
      loading = undefined;
      throw error;
    },
  ));

/** What the component at one place among the actions was seen to hold, while it was drawn in the row. */
interface Seen {
  type: unknown;
  row: boolean;
  stays: boolean;
}

/** A plain element that holds a component somewhere inside: it gives way to what it holds in the menu. */
const holdsComponent = (node: ReactNode): boolean =>
  Children.toArray(node).some(
    (child) =>
      isValidElement<{ children?: ReactNode | undefined }>(child) &&
      (typeof child.type !== 'string' || holdsComponent(child.props.children)),
  );

let told = false;
/** Once per page: the app is told what a row of actions can move into its menu. */
const tell = () => {
  if (told) return;
  told = true;
  warn(
    'actions that overflow: only a Button, an IconButton, a Menu or a SplitButton (or a component that ' +
      'renders exactly one of them) moves into the "more" menu. Anything else stays in the row.',
  );
};

/**
 * Internal: a "more" button that opens `children` as a menu, for actions that no longer fit in a row.
 * Each `Button` and `IconButton` among them renders as a menu item, and each `Menu` as a submenu. The
 * host renders it always and says with `shrunk` whether the actions still fit.
 *
 * A menu holds rows only, and anything else drawn into it breaks it. So only what can be a row moves:
 * the four marked `overflowsToMenu`, a plain element around them, and a component of the app that was
 * seen to hold buttons and nothing that must stay (`ActionProbeContext`: it is drawn in the row first,
 * and what is inside says what it is). Everything else stays where it was, before the button: a control
 * marked `staysInRow` (a `Stepper`, a `Slider`, a field), a component of the app around one, and what
 * is no action at all (a `Tag`, a `<span>`, text), with a warning in development. With nothing that can
 * move there is no button.
 *
 * The button is drawn here, at once, and stays the same element when the menu's code arrives: it keeps
 * the focus and its place in the row that `useShrinkLevel` measures. The code is asked for when the
 * button appears, not when it is pressed. A press that comes first is kept as the open state, and the
 * menu opens when it arrives, with the focus where that press would have put it.
 */
export function ActionsOverflow({
  shrunk,
  children,
  ...more
}: {
  /** The actions no longer fit. While false the children are drawn as they are, in their row. */
  shrunk: boolean;
  label: string;
  size?: 'default' | 'small' | undefined;
  children: ReactNode;
}) {
  const [seen, setSeen] = useState<Record<number, Seen>>({});
  const note = (index: number, type: unknown, kind: ActionKind) =>
    setSeen((old) => {
      const last = old[index];
      const was: Seen = last && last.type === type ? last : { type, row: false, stays: false };
      return was[kind] ? old : { ...old, [index]: { ...was, [kind]: true } };
    });
  // One flat list with the same keys in both states: a control that stays in the row is the same
  // element before and after, so it keeps its state and the focus.
  const items: { node: ReactNode; kept: boolean }[] = [];
  const sort = (nodes: ReactNode) =>
    Children.forEach(nodes, (child) => {
      if (child == null || typeof child === 'boolean') return;
      const index = items.length;
      if (!isValidElement<{ children?: ReactNode | undefined }>(child)) {
        // Text is no action: it stays.
        if (shrunk) tell();
        return void items.push({ node: child, kept: true });
      }
      if (child.type === Fragment) return sort(child.props.children);
      const node = cloneElement(child, { key: index });
      if (staysInRow(child)) return void items.push({ node, kept: true });
      if (overflowsToMenu(child)) return void items.push({ node, kept: !shrunk });
      if (typeof child.type === 'string') {
        const moves = holdsComponent(child.props.children);
        if (shrunk && !moves) tell();
        return void items.push({ node, kept: !shrunk || !moves });
      }
      // A component of the app: what it was seen to hold decides. Not seen yet, it stays.
      const { type } = child;
      const known = seen[index]?.type === type ? seen[index] : undefined;
      const moves = !!known?.row && !known.stays;
      if (shrunk && !moves && !(known?.stays && !known.row)) tell();
      items.push({
        node: (
          <ActionProbeContext key={index} value={(kind) => note(index, type, kind)}>
            {child}
          </ActionProbeContext>
        ),
        kept: !shrunk || !moves,
      });
    });
  sort(children);
  // In the menu the probe is not around them: there they are rows.
  const rows = items.filter((item) => !item.kept).map((item) => item.node);
  return (
    <>
      {items.filter((item) => item.kept).map((item) => item.node)}
      {rows.length > 0 && <More {...more}>{rows}</More>}
    </>
  );
}

function More({
  label,
  size,
  children,
}: {
  label: string;
  size?: 'default' | 'small' | undefined;
  children: ReactNode;
}) {
  const button = useRef<HTMLElement>(null);
  const [Menu, setMenu] = useState<OverflowMenu>();
  // Open, and where the focus goes: `true` is the menu itself (a pointer), or its first or last row.
  const [open, setOpen] = useState<boolean | 'first' | 'last'>(false);
  const request = () => {
    load().then(
      (menu) => setMenu(() => menu),
      () => {},
    );
  };
  // Once, when the button appears.
  useEffect(request, []);
  const show = (focus: true | 'first' | 'last') => {
    if (!Menu) request();
    setOpen(focus);
  };
  return (
    <>
      <ButtonBase
        umbra="icon-button"
        variant="ghost"
        size={size}
        iconOnly
        label={label}
        popup
        expanded={open !== false}
        elementRef={button}
        onPress={(event) =>
          open
            ? setOpen(false)
            : show(event.pointerType === 'keyboard' || event.pointerType === 'virtual' ? 'first' : true)
        }
        onKeyDown={(event) => {
          if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
          event.preventDefault();
          show(event.key === 'ArrowUp' ? 'last' : 'first');
        }}
      >
        <Icon name="more" />
      </ButtonBase>
      {Menu && (
        <Menu label={label} anchorRef={button} open={open} onOpenChange={setOpen}>
          {children}
        </Menu>
      )}
    </>
  );
}
