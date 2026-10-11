import { useLayoutEffect, type CSSProperties, type ReactNode } from 'react';
import { Skeleton } from '../basics/Skeleton';
import { ScopeProvider, useScope, type ContextTint } from '../provider/UmbraProvider';
import { useShell } from '../shell/AppShell';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './Page.module.css';
import { passThrough, type RootAttributes } from '../utils/passThrough';

interface BlockProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export interface PageRootProps extends BlockProps, RootAttributes {
  /** Context tint for this page: a preset name or a colour. Defaults to the provider's. */
  context?: ContextTint | undefined;
  /** `none` for edge-to-edge content. */
  padding?: 'default' | 'none' | undefined;
}

function Root({ context, padding = 'default', className, style, children, ...rest }: PageRootProps) {
  const provided = useScope({ context });
  const scope = provided.attributes;
  const setPageContext = useShell()?.setPageContext;
  useLayoutEffect(() => {
    setPageContext?.(context);
    return () => setPageContext?.(undefined);
  }, [setPageContext, context]);
  return (
    <ScopeProvider scope={provided}>
      <div
        {...passThrough(rest)}
        {...scope}
        data-umbra="page"
        data-padding={padding}
        className={cx(styles.root, className)}
        style={{ ...scope.style, ...style }}
      >
        {children}
      </div>
    </ScopeProvider>
  );
}

const block = (part: 'header' | 'content' | 'footer') =>
  function PageBlock({
    className,
    style,
    children,
    ...rest
  }: BlockProps & { 'aria-busy'?: boolean | undefined }) {
    return (
      <div {...rest} data-part={part} className={cx(styles[part], className)} style={style}>
        {children}
      </div>
    );
  };
const Header = block('header');
const Content = block('content');
const Footer = block('footer');

export interface PageProps extends PageRootProps {
  /** A `PageHeader`, fixed above the content. */
  header?: ReactNode | undefined;
  /** An `ActionBar`, fixed below the content. */
  footer?: ReactNode | undefined;
  /** Shows a skeleton in place of the content. */
  loading?: boolean | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        header?: Part<{ children: ReactNode }> | undefined;
        content?: Part<{ children: ReactNode }> | undefined;
        footer?: Part<{ children: ReactNode }> | undefined;
      }
    | undefined;
  /** One `Columns`, `Stack` or `Card`. */
  children?: ReactNode | undefined;
}

/** The content area under the bars: applies the outer margin and the context tint. */
export function Page({ header, footer, loading = false, parts, children, ...root }: PageProps) {
  const content = loading ? <Skeleton shape="block" /> : children;
  return (
    <Root {...root}>
      {renderPart(parts?.header, { children: header }, (p) => p.children && <Header>{p.children}</Header>)}
      {renderPart(parts?.content, { children: content }, (p) => (
        <Content aria-busy={loading || undefined}>{p.children}</Content>
      ))}
      {renderPart(parts?.footer, { children: footer }, (p) => p.children && <Footer>{p.children}</Footer>)}
    </Root>
  );
}

Page.Root = Root;
Page.Header = Header;
Page.Content = Content;
Page.Footer = Footer;
