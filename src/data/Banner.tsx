import { createContext, useContext, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ButtonBase } from '../basics/Button';
import { Icon as BuiltInIcon, IconSlot, RawIcon } from '../provider/icons';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './Banner.module.css';
import { passThrough, type RootAttributes } from '../utils/passThrough';

export type BannerTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral' | 'accent';
export type BannerVariant = 'subtle' | 'solid' | 'outline';

// One shape per tone, so the tone can be read without colour.
const toneIcons: Record<BannerTone, ReactNode> = {
  info: <RawIcon name="info" />,
  success: <RawIcon name="success" />,
  warning: <RawIcon name="warning" />,
  danger: <RawIcon name="danger" />,
  neutral: <RawIcon name="message" />,
  accent: <RawIcon name="tip" />,
};

const TAB_STOPS =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]';

interface BannerContextValue {
  tone: BannerTone;
  compact: boolean;
  dismiss: () => void;
}
const BannerContext = createContext<BannerContextValue | null>(null);
function useBanner() {
  const banner = useContext(BannerContext);
  if (!banner) throw new Error('Banner blocks must be rendered inside <Banner.Root>.');
  return banner;
}

interface BlockProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export interface BannerRootProps extends BlockProps, RootAttributes {
  /** What the message is. Each tone has its own colour and its own default icon. */
  tone?: BannerTone | undefined;
  /** `subtle`: tinted fill. `solid`: filled with the tone colour. `outline`: border only. */
  variant?: BannerVariant | undefined;
  /** `insight` adds a stripe on the leading edge, for a finding or recommendation about the data beside it. */
  emphasis?: 'default' | 'insight' | undefined;
  /** One line: the title and the description share it and truncate. */
  compact?: boolean | undefined;
  /**
   * How a screen reader announces the banner when it appears. `polite` is a `status`, `assertive` an
   * `alert`, `off` is not announced. Defaults to `assertive` for the `danger` tone and `polite` otherwise.
   */
  live?: 'polite' | 'assertive' | 'off' | undefined;
  /** Controlled visibility. Set it to `false` in `onDismiss`. */
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  /** Called when the dismiss button is pressed. */
  onDismiss?: (() => void) | undefined;
}

function Root({
  tone = 'info',
  variant = 'subtle',
  emphasis = 'default',
  compact = false,
  live,
  open,
  defaultOpen = true,
  onDismiss,
  className,
  style,
  children,
  ...rest
}: BannerRootProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const ref = useRef<HTMLDivElement>(null);
  if (!(open ?? uncontrolled)) return null;
  const announce = live ?? (tone === 'danger' ? 'assertive' : 'polite');
  const dismiss = () => {
    // The banner takes the focused button with it. The focus goes where Tab would have gone: to the
    // next control after the banner, or to the one before it when the banner was the last.
    // ponytail: document order of plain controls; it ignores positive tabindex values and shadow roots.
    const banner = ref.current;
    if (banner?.contains(document.activeElement)) {
      const stops = [...document.querySelectorAll<HTMLElement>(TAB_STOPS)].filter(
        (el) => !banner.contains(el) && el.getClientRects().length > 0,
      );
      const after = (el: HTMLElement) =>
        !!(banner.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
      const next = stops.find(after) ?? stops.filter((el) => !after(el)).pop();
      requestAnimationFrame(() => {
        if (!banner.isConnected && (!document.activeElement || document.activeElement === document.body))
          next?.focus();
      });
    }
    setUncontrolled(false);
    onDismiss?.();
  };
  return (
    <div
      {...passThrough(rest)}
      role={announce === 'off' ? undefined : announce === 'assertive' ? 'alert' : 'status'}
      data-umbra="banner"
      data-tone={tone}
      data-variant={variant}
      data-emphasis={emphasis}
      data-compact={compact || undefined}
      ref={ref}
      className={cx(styles.root, className)}
      style={style}
    >
      <BannerContext value={{ tone, compact, dismiss }}>{children}</BannerContext>
    </div>
  );
}

/** The leading icon. Without children it is the default icon of the banner's tone. */
function BannerIcon({ className, style, children }: BlockProps) {
  const { tone } = useBanner();
  return (
    <span className={cx(styles.icon, className)} style={style}>
      <IconSlot part="icon">{children ?? toneIcons[tone]}</IconSlot>
    </span>
  );
}

/** Holds the title and the description; takes the space the other blocks leave. */
function Content({ className, style, children }: BlockProps) {
  return (
    <div data-part="content" className={cx(styles.content, className)} style={style}>
      {children}
    </div>
  );
}

function Title({ className, style, children }: BlockProps) {
  return (
    <div data-part="title" className={cx(styles.title, className)} style={style}>
      {children}
    </div>
  );
}

export interface BannerDescriptionProps extends BlockProps {
  /** Clamps the text to this many lines, with an ellipsis. */
  maxLines?: number | undefined;
}

function Description({ maxLines, className, style, children }: BannerDescriptionProps) {
  return (
    <div
      data-part="description"
      data-clamp={maxLines ? true : undefined}
      className={cx(styles.description, className)}
      style={{ ...(maxLines && { ['--lines' as string]: maxLines }), ...style }}
    >
      {children}
    </div>
  );
}

function Actions({ className, style, children }: BlockProps) {
  return (
    <div data-part="actions" className={cx(styles.actions, className)} style={style}>
      {children}
    </div>
  );
}

export interface BannerDismissProps {
  /** Accessible name of the button. */
  label?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

function Dismiss({ label = 'Dismiss', className, style }: BannerDismissProps) {
  const { dismiss } = useBanner();
  return (
    <span data-part="dismiss" className={cx(styles.dismiss, className)} style={style}>
      <ButtonBase umbra="icon-button" variant="ghost" iconOnly label={label} onPress={dismiss}>
        <BuiltInIcon name="close" />
      </ButtonBase>
    </span>
  );
}

export interface BannerProps extends Omit<BannerRootProps, 'children'> {
  /** The headline, in bold. */
  title?: ReactNode | undefined;
  /** The description. */
  children?: ReactNode | undefined;
  /** Replaces the tone's default icon. `null` hides it. */
  icon?: ReactNode | undefined;
  /** Trailing controls, usually one or two buttons. They move below the text when the banner is narrow. */
  actions?: ReactNode | undefined;
  /** Shows a dismiss button. */
  dismissible?: boolean | undefined;
  /** Accessible name of the dismiss button. */
  dismissLabel?: string | undefined;
  /** Clamps the description to this many lines. */
  maxLines?: number | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        icon?: Part<{ children: ReactNode }> | undefined;
        title?: Part<{ children: ReactNode }> | undefined;
        description?: Part<BannerDescriptionProps> | undefined;
        actions?: Part<{ children: ReactNode }> | undefined;
        dismiss?: Part<BannerDismissProps> | undefined;
      }
    | undefined;
}

/** A message band inside a card or page: a notice, a warning, or an insight about the data beside it. */
export function Banner({
  title,
  children,
  icon,
  actions,
  dismissible = false,
  dismissLabel,
  maxLines,
  parts,
  ...root
}: BannerProps) {
  return (
    <Root {...root}>
      {icon !== null &&
        renderPart(parts?.icon, { children: icon }, (p) => <BannerIcon>{p.children}</BannerIcon>)}
      <Content>
        {title != null && renderPart(parts?.title, { children: title }, (p) => <Title>{p.children}</Title>)}
        {children != null &&
          renderPart(parts?.description, { maxLines, children }, (p) => <Description {...p} />)}
      </Content>
      {actions != null &&
        renderPart(parts?.actions, { children: actions }, (p) => <Actions>{p.children}</Actions>)}
      {dismissible && renderPart(parts?.dismiss, { label: dismissLabel }, (p) => <Dismiss {...p} />)}
    </Root>
  );
}

Banner.Root = Root;
Banner.Icon = BannerIcon;
Banner.Content = Content;
Banner.Title = Title;
Banner.Description = Description;
Banner.Actions = Actions;
Banner.Dismiss = Dismiss;
