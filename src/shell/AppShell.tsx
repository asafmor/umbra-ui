import {
  createContext,
  useContext,
  useId,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { useNarrow } from '../internal/useNarrow';
import { ScopeProvider, useScope, type ContextTint } from '../provider/UmbraProvider';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './AppShell.module.css';
import { passThrough, type RootAttributes } from '../utils/passThrough';

interface ShellContextValue {
  mainId: string;
  /** A `Page` reports its context tint here, so the frame around it always matches. */
  setPageContext: (context: ContextTint | undefined) => void;
}
const ShellContext = createContext<ShellContextValue | null>(null);
export const useShell = () => useContext(ShellContext);

interface BlockProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export interface AppShellRootProps extends BlockProps, RootAttributes {
  /** `flat` removes the gradient and pattern. */
  background?: 'gradient' | 'flat' | undefined;
  /** Text of the "skip to content" link, the first focus stop. */
  skipLabel?: string | undefined;
}

function Root({
  background = 'gradient',
  skipLabel = 'Skip to content',
  className,
  style,
  children,
  ...rest
}: AppShellRootProps) {
  const narrow = useNarrow();
  const [pageContext, setPageContext] = useState<ContextTint>();
  const scope = useScope({ context: pageContext });
  const mainId = useId();
  const shell = useMemo(() => ({ mainId, setPageContext }), [mainId]);
  return (
    <ShellContext value={shell}>
      <ScopeProvider value={scope}>
        <div
          {...passThrough(rest)}
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
    <div data-part="bars" className={cx(styles.bars, className)} style={style}>
      {children}
    </div>
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
  topBar?: ReactNode | undefined;
  /** A `SubNav`. */
  subNav?: ReactNode | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        topBar?: Part<{ children: ReactNode }> | undefined;
        subNav?: Part<{ children: ReactNode }> | undefined;
        main?: Part<{ children: ReactNode }> | undefined;
        background?: Part | undefined;
      }
    | undefined;
  /** The `Page`. */
  children?: ReactNode | undefined;
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
