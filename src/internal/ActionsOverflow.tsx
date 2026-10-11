import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ButtonBase } from '../basics/Button';
import { Icon } from '../provider/icons';

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

/**
 * Internal: a "more" button that opens `children` as a menu, for actions that no longer fit in a row.
 * Each `Button` and `IconButton` among them renders as a menu item, and each `Menu` as a submenu.
 *
 * The button is drawn here, at once, and stays the same element when the menu's code arrives: it keeps
 * the focus and its place in the row that `useShrinkLevel` measures. The code is asked for when the
 * button appears, not when it is pressed. A press that comes first is kept as the open state, and the
 * menu opens when it arrives, with the focus where that press would have put it.
 */
export function ActionsOverflow({
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
