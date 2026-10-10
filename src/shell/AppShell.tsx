import {
  createContext,
  useContext,
  useId,
  useMemo,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { NarrowContext } from '../layout/useSlot';
import { ScopeProvider, useScope, type ContextTint } from '../provider/UmbraProvider';
import { minWindow } from '../styles/tokens.generated';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './AppShell.module.css';

// Narrow means below the minimum window in either direction; exactly the minimum is not narrow.
const narrowQuery = `(max-width: ${minWindow.width - 0.02}px), (max-height: ${minWindow.height - 0.02}px)`;
const subscribeNarrow = (onChange: () => void) => {
  const media = window.matchMedia(narrowQuery);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
};

interface ShellContextValue {
  mainId: string;
  /** A `Page` reports its context tint here, so the frame around it always matches. */
  setPageContext: (context: ContextTint | undefined) => void;
}
const ShellContext = createContext<ShellContextValue | null>(null);
export const useShell = () => useContext(ShellContext);

interface BlockProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export interface AppShellRootProps extends BlockProps {
  /** `flat` removes the gradient and pattern. */
  background?: 'gradient' | 'flat';
  /** Text of the "skip to content" link, the first focus stop. */
  skipLabel?: string;
}

function Root({
  background = 'gradient',
  skipLabel = 'Skip to content',
  className,
  style,
  children,
}: AppShellRootProps) {
  const narrow = useSyncExternalStore(
    subscribeNarrow,
    () => window.matchMedia(narrowQuery).matches,
    () => false,
  );
  const [pageContext, setPageContext] = useState<ContextTint>();
  const scope = useScope({ context: pageContext });
  const mainId = useId();
  const shell = useMemo(() => ({ mainId, setPageContext }), [mainId]);
  return (
    <ShellContext value={shell}>
      <ScopeProvider value={scope}>
        <NarrowContext value={narrow}>
          <div
            {...scope}
            data-umbra="app-shell"
            data-background={background}
            data-narrow={narrow || undefined}
            className={cx(styles.root, className)}
            style={{ ...scope.style, ...style }}
          >
            <a href={`#${mainId}`} className={styles.skip}>
              {skipLabel}
            </a>
            {children}
          </div>
        </NarrowContext>
      </ScopeProvider>
    </ShellContext>
  );
}

function Background({ className, style }: Omit<BlockProps, 'children'>) {
  return (
    <div
      aria-hidden="true"
      data-part="background"
      className={cx(styles.background, className)}
      style={style}
    />
  );
}

function Bars({ className, style, children }: BlockProps) {
  return (
    <header data-part="bars" className={cx(styles.bars, className)} style={style}>
      {children}
    </header>
  );
}

function Main({ className, style, children }: BlockProps) {
  return (
    <main
      id={useShell()?.mainId}
      tabIndex={-1}
      data-part="main"
      className={cx(styles.main, className)}
      style={style}
    >
      {children}
    </main>
  );
}

export interface AppShellProps extends AppShellRootProps {
  /** A `TopBar`. */
  topBar?: ReactNode;
  /** A `SubNav`. */
  subNav?: ReactNode;
  /** Replace or hide named pieces. */
  parts?: {
    topBar?: Part<{ children: ReactNode }>;
    subNav?: Part<{ children: ReactNode }>;
    main?: Part<{ children: ReactNode }>;
    background?: Part;
  };
  /** The `Page`. */
  children?: ReactNode;
}

/** The outermost frame: exactly the size of the window, never scrolls, bars above one `Page`. */
export function AppShell({ topBar, subNav, parts, children, ...root }: AppShellProps) {
  const top = renderPart(parts?.topBar, { children: topBar }, (p) => p.children);
  const sub = renderPart(parts?.subNav, { children: subNav }, (p) => p.children);
  return (
    <Root {...root}>
      {renderPart(parts?.background, {}, () => (
        <Background />
      ))}
      {(top || sub) && (
        <Bars>
          {top}
          {sub}
        </Bars>
      )}
      {renderPart(parts?.main, { children }, (p) => (
        <Main>{p.children}</Main>
      ))}
    </Root>
  );
}

AppShell.Root = Root;
AppShell.Background = Background;
AppShell.Bars = Bars;
AppShell.Main = Main;
