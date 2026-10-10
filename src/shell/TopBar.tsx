import {
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import { IconButton } from '../basics/IconButton';
import { ForceCollapseContext } from '../internal/contexts';
import { isOverflowing, useShrinkLevel } from '../internal/useShrinkLevel';
import { MoreButton } from '../layout/SectionTitle';
import type { CommandPaletteProps } from '../overlays/CommandPalette';
import { ActionsOverflow } from '../overlays/Menu';
import { Icon } from '../provider/icons';
import { ScopeProvider, useScope } from '../provider/UmbraProvider';
import { cx, renderPart, type Part } from '../utils/parts';
import { HistoryButtons } from './HistoryButtons';
import { NavHoldContext } from './nav';
import styles from './TopBar.module.css';

interface BlockProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/**
 * Shrink steps, in order: 1 the context block hides, 2 the actions collapse into one menu, 3 the nav
 * moves items into "More", 4 the primary action shows its icon only. Each step is taken by a block
 * that reads the level from the root, so a bar composed by hand shrinks the same way; a step whose
 * block is missing changes nothing and the next one follows at once.
 */
interface TopBarContextValue {
  level: number;
  moreLabel: string;
}
const TopBarContext = createContext<TopBarContextValue>({ level: 0, moreLabel: 'More actions' });
const NavRefContext = createContext<RefObject<HTMLDivElement | null> | null>(null);

export interface TopBarRootProps extends BlockProps {
  /** Overrides the brand colour for this bar only. Text on it is computed for contrast. */
  brand?: string;
  /** Accessible name of the menu that holds the actions when they do not fit. */
  moreLabel?: string;
}

function Root({ brand, moreLabel = 'More actions', className, style, children }: TopBarRootProps) {
  const scope = useScope({ brand });
  const nav = useRef<HTMLDivElement>(null);
  // Whether the nav has moved all it can. A ref, because the nav reports in its
  // layout effect and the bar reads it in its own, later in the same pass; the state forces that pass.
  const navExhausted = useRef(false);
  const [, setTick] = useState(0);
  // The nav slot is what runs out of room; a nav inside it clips its own list, so look at that too.
  // The bar itself is what is watched for growth: the slot's width changes with every step taken.
  const root = useRef<HTMLElement>(null);
  const level = useShrinkLevel(root, 4, undefined, {
    overflowing: () => {
      const slot = nav.current;
      // Without a nav to give way, the bar itself is what overflows.
      if (root.current && isOverflowing(root.current)) return true;
      if (!slot) return false;
      return (
        isOverflowing(slot) ||
        [...slot.querySelectorAll<HTMLElement>('[data-overflow-watch]')].some(isOverflowing)
      );
    },
    // Step 3 belongs to the nav. Step 4 waits until the nav has nothing left to move, or there is none.
    canAdvance: (current) =>
      current < 3 || navExhausted.current || !nav.current?.querySelector('[data-overflow-watch]'),
  });
  const report = useCallback((exhausted: boolean) => {
    if (navExhausted.current === exhausted) return;
    navExhausted.current = exhausted;
    setTick((t) => t + 1);
  }, []);
  const hold = useMemo(() => ({ hold: level < 3, report }), [level, report]);
  const bar = useMemo(() => ({ level, moreLabel }), [level, moreLabel]);
  return (
    <ScopeProvider value={scope}>
      <TopBarContext value={bar}>
        <NavRefContext value={nav}>
          <NavHoldContext value={hold}>
            <ForceCollapseContext value={level >= 4}>
              <header
                {...scope}
                ref={root}
                data-umbra="top-bar"
                data-shrink={level}
                className={cx(styles.root, className)}
                style={{ ...scope.style, ...style }}
              >
                {children}
              </header>
            </ForceCollapseContext>
          </NavHoldContext>
        </NavRefContext>
      </TopBarContext>
    </ScopeProvider>
  );
}

function Start({ className, style, children }: BlockProps) {
  return (
    <div data-part="start" className={cx(styles.start, className)} style={style}>
      {children}
    </div>
  );
}

function Nav({ className, style, children }: BlockProps) {
  return (
    <div ref={useContext(NavRefContext)} data-part="nav" className={cx(styles.nav, className)} style={style}>
      {children}
    </div>
  );
}

export interface TopBarActionsProps extends BlockProps {
  /** Stays visible when the other actions collapse into the menu, for example the search trigger. */
  pinned?: ReactNode;
}

function Actions({ pinned, className, style, children }: TopBarActionsProps) {
  const { level, moreLabel } = useContext(TopBarContext);
  return (
    <div data-part="actions" className={cx(styles.actions, className)} style={style}>
      {pinned}
      {children && level >= 2 ? (
        <ActionsOverflow label={moreLabel} trigger={<MoreButton label={moreLabel} />}>
          {children}
        </ActionsOverflow>
      ) : (
        children
      )}
    </div>
  );
}

function End({ className, style, children }: BlockProps) {
  return (
    <div data-part="end" className={cx(styles.end, className)} style={style}>
      {children}
    </div>
  );
}

/** The app or entity mark: a round badge in the bar's text colour. */
function Logo({ className, style, children }: BlockProps) {
  return (
    <div data-part="logo" className={cx(styles.logo, className)} style={style}>
      {children}
    </div>
  );
}

/** A two-line status block. Hidden at the first shrink step. */
function Context({ className, style, children }: BlockProps) {
  const { level } = useContext(TopBarContext);
  return level >= 1 ? null : (
    <div data-part="context" className={cx(styles.context, className)} style={style}>
      {children}
    </div>
  );
}

/**
 * The slot at the very end of the bar. A `PrimaryAction` in it fills the bar's height and touches the
 * window edge; anything else is centred. At the last shrink step what is inside shows its icon only.
 */
function PrimaryActionSlot({ className, style, children }: BlockProps) {
  return (
    <div data-part="primaryAction" className={cx(styles.primaryAction, className)} style={style}>
      {children}
    </div>
  );
}

export interface TopBarSearchProps {
  /** Accessible name and tooltip of the trigger. */
  label?: string;
  /** Called when the trigger is used, for an app with its own search. */
  onSearch?: () => void;
  /** A `CommandPalette` element. The trigger opens and closes it. */
  commandPalette?: ReactNode;
  /** Id of the shortcut the trigger binds. */
  shortcut?: string;
}

/** The search trigger. It opens the `commandPalette` it is given, calls `onSearch`, or both. */
function Search({
  label = 'Search',
  onSearch,
  commandPalette,
  shortcut = 'umbra.commandPalette',
}: TopBarSearchProps) {
  const [own, setOwn] = useState(false);
  const palette = isValidElement<CommandPaletteProps>(commandPalette) ? commandPalette : null;
  // The app may control the palette itself; then the trigger only asks it to change.
  const open = palette?.props.open ?? own;
  const change = (next: boolean) => {
    setOwn(next);
    palette?.props.onOpenChange?.(next);
  };
  return (
    <>
      <IconButton
        icon={<Icon name="search" />}
        label={label}
        shortcut={shortcut}
        onPress={() => {
          if (palette) change(!open);
          onSearch?.();
        }}
      />
      {/* The trigger owns the key, so the palette does not bind it a second time. */}
      {palette ? cloneElement(palette, { open, onOpenChange: change, shortcut: null }) : commandPalette}
    </>
  );
}

export interface TopBarProps extends TopBarRootProps {
  /** App or entity mark. */
  logo?: ReactNode;
  /** A `PrimaryNav`. */
  nav?: ReactNode;
  /** `IconButton`s. They collapse into one menu when space is short. */
  actions?: ReactNode;
  /** A two-line status block. Hides first when space is short. */
  context?: ReactNode;
  /** The one primary action of the app: a `PrimaryAction`. Any other node is shown as it is. */
  primaryAction?: ReactNode;
  /** `true` shows `HistoryButtons` that use the browser history; a node replaces them. */
  history?: boolean | ReactNode;
  /** A `CommandPalette`. Shows the search trigger, which opens it (also by the `Mod+K` shortcut). */
  commandPalette?: ReactNode;
  /** For an app with its own search: shows the search trigger and is called when it is used (also by `Mod+K`). */
  onSearch?: () => void;
  /** Accessible names of the built-in buttons. */
  searchLabel?: string;
  backLabel?: string;
  forwardLabel?: string;
  /** Replace or hide named pieces. */
  parts?: {
    start?: Part<{ children: ReactNode }>;
    logo?: Part<{ children: ReactNode }>;
    nav?: Part<{ children: ReactNode }>;
    actions?: Part<TopBarActionsProps>;
    search?: Part<TopBarSearchProps>;
    context?: Part<{ children: ReactNode }>;
    primaryAction?: Part<{ children: ReactNode }>;
  };
}

/** The brand-coloured bar at the top: where the user is, the main sections, and the one primary action. */
export function TopBar({
  logo,
  nav,
  actions,
  context,
  primaryAction,
  history = false,
  commandPalette,
  onSearch,
  searchLabel = 'Search',
  backLabel = 'Back',
  forwardLabel = 'Forward',
  parts,
  ...root
}: TopBarProps) {
  const historyButtons =
    history === true ? <HistoryButtons backLabel={backLabel} forwardLabel={forwardLabel} /> : history;
  const logoNode = renderPart(
    parts?.logo,
    { children: logo },
    (p) => p.children && <Logo>{p.children}</Logo>,
  );
  const search =
    (onSearch || commandPalette) &&
    renderPart(parts?.search, { label: searchLabel, onSearch, commandPalette }, (p) => <Search {...p} />);
  return (
    <Root {...root}>
      {renderPart(
        parts?.start,
        {
          children: (
            <>
              {historyButtons}
              {logoNode}
            </>
          ),
        },
        (p) => (historyButtons || logoNode ? <Start>{p.children}</Start> : null),
      )}
      {renderPart(parts?.nav, { children: nav }, (p) => (
        <Nav>{p.children}</Nav>
      ))}
      <End>
        {(search || actions) &&
          renderPart(parts?.actions, { pinned: search, children: actions }, (p) => <Actions {...p} />)}
        {context && renderPart(parts?.context, { children: context }, (p) => <Context>{p.children}</Context>)}
        {primaryAction &&
          renderPart(parts?.primaryAction, { children: primaryAction }, (p) => (
            <PrimaryActionSlot>{p.children}</PrimaryActionSlot>
          ))}
      </End>
    </Root>
  );
}

TopBar.Root = Root;
TopBar.Start = Start;
TopBar.Logo = Logo;
TopBar.Nav = Nav;
TopBar.End = End;
TopBar.Actions = Actions;
TopBar.Search = Search;
TopBar.Context = Context;
TopBar.PrimaryAction = PrimaryActionSlot;
