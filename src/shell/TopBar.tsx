import {
  createContext,
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
import { ActionsOverflow } from '../overlays/Menu';
import { Icon } from '../provider/icons';
import { ScopeProvider, useScope } from '../provider/UmbraProvider';
import { cx, renderPart, type Part } from '../utils/parts';
import { NavHoldContext } from './nav';
import styles from './TopBar.module.css';

interface BlockProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/**
 * Shrink steps, in order: 1 the context block hides, 2 the actions collapse into one menu, 3 the nav
 * moves items into "More", 4 the primary action shows its icon only.
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
  // Whether the nav has moved all it can and still overflows. A ref, because the nav reports in its
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

/** Hidden at the first shrink step. */
function Context({ children }: { children: ReactNode }) {
  const { level } = useContext(TopBarContext);
  return level >= 1 ? null : (
    <div data-part="context" className={styles.context}>
      {children}
    </div>
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
  /** The one primary action of the app. Give the button `collapseTo="icon"` so it can shrink to its icon. */
  primaryAction?: ReactNode;
  /** `true` shows back and forward buttons that use the browser history; a node replaces them. */
  history?: boolean | ReactNode;
  /** Shows the search trigger and is called when it is used (also by the `Mod+K` shortcut). */
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
  onSearch,
  searchLabel = 'Search',
  backLabel = 'Back',
  forwardLabel = 'Forward',
  parts,
  ...root
}: TopBarProps) {
  const historyButtons =
    history === true ? (
      <>
        <IconButton icon={<Icon name="back" />} label={backLabel} onPress={() => window.history.back()} />
        <IconButton
          icon={<Icon name="forward" />}
          label={forwardLabel}
          onPress={() => window.history.forward()}
        />
      </>
    ) : (
      history
    );
  const logoNode = renderPart(
    parts?.logo,
    { children: logo },
    (p) =>
      p.children && (
        <div data-part="logo" className={styles.logo}>
          {p.children}
        </div>
      ),
  );
  const search = onSearch && (
    <IconButton
      icon={<Icon name="search" />}
      label={searchLabel}
      shortcut="umbra.commandPalette"
      onPress={onSearch}
    />
  );
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
            <div data-part="primaryAction" className={styles.primaryAction}>
              {p.children}
            </div>
          ))}
      </End>
    </Root>
  );
}

TopBar.Root = Root;
TopBar.Start = Start;
TopBar.Nav = Nav;
TopBar.Actions = Actions;
TopBar.End = End;
