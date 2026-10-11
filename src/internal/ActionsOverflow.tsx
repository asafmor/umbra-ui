import {
  Children,
  cloneElement,
  Fragment,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { ButtonBase } from '../basics/Button';
import { Icon } from '../provider/icons';
import styles from './ActionsOverflow.module.css';
import { staysInRow } from './contexts';
import { focusableIn } from './focus';

type OverflowMenu = typeof import('../overlays/Menu').OverflowMenu;

// The menu is the heaviest thing a header could hold, and most headers fit. So its module is loaded
// the first time one does not: an app's bundler makes a chunk of it, and a card, a section title or a
// page header whose actions fit never asks for it (plan/decisions/05-packaging.md, "Loaded on demand").
// One request for the page; a failed one is tried again by the next header and by every press, and
// until one succeeds the actions open as a plain list that needs no code (`Fallback`).
let loading: Promise<OverflowMenu> | undefined;
const load = () =>
  (loading ??= import('../overlays/Menu').then(
    (module) => module.OverflowMenu,
    (error: unknown) => {
      loading = undefined;
      throw error;
    },
  ));

/** For the host's actions container once its row has taken its last step: see the stylesheet. */
export const wrapsKept = styles.wrap;

/**
 * Internal: a "more" button that opens `children` as a menu, for actions that no longer fit in a row.
 * Each `Button` and `IconButton` among them renders as a menu item, and each `Menu` as a submenu. A
 * control that cannot be a row (`staysInRow`: a `Stepper`, a `Slider`, a field) stays where it was,
 * before the button; with nothing but such controls there is no button. The host renders it always and
 * says with `shrunk` whether the actions still fit.
 *
 * The button is drawn here, at once, and stays the same element when the menu's code arrives: it keeps
 * the focus and its place in the row that `useShrinkLevel` measures. The code is asked for when the
 * button appears, not when it is pressed. A press that comes first is kept as the open state, and the
 * menu opens when it arrives, with the focus where that press would have put it; Escape, focus that
 * leaves the button and a press elsewhere take that press back. If the code cannot be loaded, the
 * actions open as a plain list instead, and every press asks for the code again (plan/specs/Card.md).
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
  // One flat list with the same keys in both states: a control that stays in the row is the same
  // element before and after, so it keeps its state and the focus.
  const items: { node: ReactNode; kept: boolean }[] = [];
  const sort = (nodes: ReactNode) =>
    Children.forEach(nodes, (child) => {
      if (isValidElement<{ children?: ReactNode | undefined }>(child) && child.type === Fragment)
        return sort(child.props.children);
      items.push({
        node: isValidElement(child) ? cloneElement(child, { key: items.length }) : child,
        kept: !shrunk || staysInRow(child),
      });
    });
  sort(children);
  const rows = items.filter((item) => !item.kept).map((item) => item.node);
  // The row has room again while the focus is on the "more" button (Escape in its menu put it
  // there): the focus goes to the first action that came back, not to whatever is first in the row.
  const back = useRef<{ row: Element; before: Set<Element> } | null>(null);
  useLayoutEffect(() => {
    const was = back.current;
    back.current = null;
    if (was)
      focusableIn(was.row)
        .find((el) => el.tabIndex >= 0 && !was.before.has(el))
        ?.focus();
  });
  return (
    <>
      {items.filter((item) => item.kept).map((item) => item.node)}
      {rows.length > 0 && (
        <More {...more} back={back}>
          {rows}
        </More>
      )}
    </>
  );
}

function More({
  label,
  size,
  back,
  children,
}: {
  label: string;
  size?: 'default' | 'small' | undefined;
  back: RefObject<{ row: Element; before: Set<Element> } | null>;
  children: ReactNode;
}) {
  const button = useRef<HTMLElement>(null);
  const [Menu, setMenu] = useState<OverflowMenu>();
  // The code did not arrive: the actions open as a plain list until it does.
  const [failed, setFailed] = useState(false);
  // Open, and where the focus goes: `true` is the menu itself (a pointer), or its first or last row.
  const [open, setOpen] = useState<boolean | 'first' | 'last'>(false);
  // The list is showing. It stays for as long as it is open, also when the code arrives meanwhile.
  const [listed, setListed] = useState(false);
  const request = () => {
    load().then(
      (menu) => {
        setMenu(() => menu);
        setFailed(false);
      },
      () => setFailed(true),
    );
  };
  // Once, when the button appears.
  useEffect(request, []);
  if (open && failed && !Menu && !listed) setListed(true);
  if (!open && listed) setListed(false);
  const waiting = open !== false && !Menu && !listed;

  // A press kept while the code loads is taken back by Escape, by focus that leaves the button and by
  // a press elsewhere: a menu must not open, and take the focus, where the user no longer is.
  useEffect(() => {
    const el = button.current;
    if (!waiting || !el) return;
    const cancel = () => setOpen(false);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cancel();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node && el.contains(event.target))) cancel();
    };
    el.addEventListener('focusout', cancel);
    el.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      el.removeEventListener('focusout', cancel);
      el.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [waiting]);

  useLayoutEffect(() => {
    const el = button.current;
    return () => {
      const row = el?.parentElement;
      if (el && row && document.activeElement === el)
        back.current = { row, before: new Set(focusableIn(row)) };
    };
  }, [back]);

  const show = (focus: true | 'first' | 'last') => {
    // Every press asks again, until the code is there.
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
        // Also while the plain list shows: the row does not start again under an open panel
        // (`useShrinkLevel` looks for an expanded trigger).
        popup
        expanded={open !== false}
        elementRef={button}
        onPress={(event) => {
          if (!Menu) request();
          if (open) setOpen(false);
          else show(event.pointerType === 'keyboard' || event.pointerType === 'virtual' ? 'first' : true);
        }}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
          event.preventDefault();
          show(event.key === 'ArrowUp' ? 'last' : 'first');
        }}
      >
        <Icon name="more" />
      </ButtonBase>
      {listed ? (
        <Fallback
          label={label}
          anchor={button}
          focus={open === true ? false : open}
          onClose={() => setOpen(false)}
        >
          {children}
        </Fallback>
      ) : (
        Menu && (
          <Menu label={label} anchorRef={button} open={open} onOpenChange={setOpen}>
            {children}
          </Menu>
        )
      )}
    </>
  );
}

/**
 * The actions as a plain list under the "more" button, for when the menu's code could not be loaded
 * (the app is offline, or a new version was deployed under an open page). It needs nothing that is not
 * already here: the actions are drawn as the buttons they are, in the browser's top layer (the
 * Popover API), so no card or bar clips them. Tab walks them; Escape, a press elsewhere, focus that
 * leaves and a press on an action close it.
 */
function Fallback({
  label,
  anchor,
  focus,
  onClose,
  children,
}: {
  label: string;
  anchor: RefObject<HTMLElement | null>;
  focus: false | 'first' | 'last';
  onClose: () => void;
  children: ReactNode;
}) {
  const list = useRef<HTMLDivElement>(null);
  const latest = useRef(onClose);
  useEffect(() => {
    latest.current = onClose;
  });
  useLayoutEffect(() => {
    const el = list.current;
    const button = anchor.current;
    if (!el || !button) return;
    el.showPopover?.();
    // Under the button, its end edge on the button's, and inside the window.
    const place = () => {
      const at = button.getBoundingClientRect();
      const rtl = getComputedStyle(button).direction === 'rtl';
      const left = rtl ? at.left : at.right - el.offsetWidth;
      const below = at.bottom + 4;
      const fits = below + el.offsetHeight <= window.innerHeight - 4;
      el.style.left = `${Math.max(4, Math.min(left, window.innerWidth - el.offsetWidth - 4))}px`;
      el.style.top = `${fits ? below : Math.max(4, at.top - 4 - el.offsetHeight)}px`;
    };
    place();
    const stops = focusableIn(el).filter((stop) => stop.tabIndex >= 0);
    if (focus) (focus === 'last' ? stops.at(-1) : stops[0])?.focus();
    const inside = (target: EventTarget | null) =>
      target instanceof Node && (el.contains(target) || button.contains(target));
    const onPointerDown = (event: PointerEvent) => {
      if (!inside(event.target)) latest.current();
    };
    const onFocusOut = (event: FocusEvent) => {
      if (event.relatedTarget && !inside(event.relatedTarget)) latest.current();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    el.addEventListener('focusout', onFocusOut);
    button.addEventListener('focusout', onFocusOut);
    window.addEventListener('resize', place);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      el.removeEventListener('focusout', onFocusOut);
      button.removeEventListener('focusout', onFocusOut);
      window.removeEventListener('resize', place);
      // The list goes with the focus in it (Escape, or an action was pressed): back to the button.
      if (el.contains(document.activeElement)) button.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- placed and focused once, when it opens
  }, []);
  return (
    <div
      ref={list}
      popover="manual"
      role="group"
      aria-label={label}
      data-part="moreList"
      className={styles.list}
      // On the way down: a button of React Aria keeps its keys to itself.
      onKeyDownCapture={(event) => {
        if (event.key !== 'Escape') return;
        // The modal or popover the row is in must not take the key for itself.
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
    >
      {/* An action closes the list once it has run, as a row of the menu does. */}
      {Children.map(children, (child) =>
        isValidElement<{ onPress?: ((...args: unknown[]) => void) | undefined }>(child)
          ? cloneElement(child, {
              onPress: (...args: unknown[]) => {
                child.props.onPress?.(...args);
                onClose();
              },
            })
          : child,
      )}
    </div>
  );
}
