import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { I18nProvider } from 'react-aria-components';
import { contextPresets, densities, type TokenName } from '../styles/tokens.generated';
import { warn } from '../utils/dev';
import { cx } from '../utils/parts';
import { textColourOn } from './contrast';
import { defaultIcons, type IconMap } from './icons';
import {
  findConflicts,
  formatKeys,
  isTypingTarget,
  matchesKeys,
  reservedShortcuts,
  type Shortcut,
} from './shortcuts';
import styles from './UmbraProvider.module.css';

export type Density = (typeof densities)[number];
export type ContextPreset = (typeof contextPresets)[number];
/** A context tint: a preset name, or any CSS colour. */
export type ContextTint = ContextPreset | (string & {});
/**
 * Token overrides, keyed by variable name without the `--umbra-` prefix.
 * Example: `{ 'radius-card': '12px', 'card-bg': '#101018' }`.
 */
export type TokenOverrides = Partial<Record<TokenName | (string & {}), string | number>>;

export interface UmbraScopeProps {
  /** Brand colour, used by the TopBar. Text on it is computed for contrast. Hex or `rgb()`. */
  brand?: string;
  /** Context tint for the page background and tinted cards. */
  context?: ContextTint;
  /** Spacing, row heights and text sizes. */
  density?: Density;
  /** Overrides individual tokens for this subtree. */
  tokens?: TokenOverrides;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export interface UmbraProviderProps extends UmbraScopeProps {
  /** Overrides built-in icons by name. */
  icons?: Partial<IconMap>;
  /** The app's key bindings. */
  shortcuts?: Shortcut[];
  /** `system` follows the operating system setting. */
  reducedMotion?: 'system' | 'always' | 'never';
  /** Locale for number and date formatting and text direction. Defaults to the browser's. */
  locale?: string;
}

type ScopeAttributes = {
  'data-umbra-scope': '';
  'data-umbra-density'?: Density;
  'data-umbra-context'?: ContextPreset;
  'data-umbra-reduced-motion'?: string;
  style: CSSProperties;
};

interface UmbraContextValue {
  icons: IconMap;
  shortcuts: Map<string, Shortcut>;
  /** Handlers bound by mounted components; they take precedence over a shortcut's own `action`. */
  bound: Map<string, () => void>;
}

const UmbraContext = createContext<UmbraContextValue | null>(null);
const ScopeContext = createContext<ScopeAttributes>({ 'data-umbra-scope': '', style: {} });

export function useUmbra() {
  const value = useContext(UmbraContext);
  if (!value) throw new Error('umbra-ui components must be rendered inside <UmbraProvider>.');
  return value;
}

/**
 * Internal: the attributes of every scope above, merged. Overlays render outside the scope's element
 * (in a portal), so they apply these to their own root to keep the same density, context and tokens.
 */
export function useScopeAttributes() {
  return useContext(ScopeContext);
}

function isPreset(context: ContextTint): context is ContextPreset {
  return (contextPresets as readonly string[]).includes(context);
}

function useScope({ brand, context, density, tokens }: UmbraScopeProps, extra?: Partial<ScopeAttributes>) {
  const parent = useContext(ScopeContext);
  return useMemo(() => {
    const vars: Record<string, string | number> = {};
    if (context && !isPreset(context)) vars['--umbra-context'] = context;
    if (brand) {
      const text = textColourOn(brand);
      if (!text) warn(`brand "${brand}" is not a hex or rgb() colour; text on it defaults to white.`);
      else if (text.ratio < 4.5)
        warn(`brand "${brand}" gives at most ${text.ratio.toFixed(2)}:1 text contrast; 4.5:1 is required.`);
      vars['--umbra-color-brand'] = brand;
      vars['--umbra-color-on-brand'] = text?.colour ?? '#ffffff';
    }
    for (const [name, value] of Object.entries(tokens ?? {})) {
      if (value !== undefined) vars[`--umbra-${name}`] = value;
    }
    const attributes: ScopeAttributes = {
      ...parent,
      ...extra,
      style: { ...parent.style, ...(vars as CSSProperties) },
    };
    if (density) attributes['data-umbra-density'] = density;
    if (context) {
      // A custom colour must not be overridden by a preset attribute inherited from a parent scope.
      if (isPreset(context)) {
        attributes['data-umbra-context'] = context;
        attributes.style = { ...attributes.style, ['--umbra-context' as string]: undefined };
      } else delete attributes['data-umbra-context'];
    }
    return attributes;
  }, [parent, brand, context, density, tokens, extra]);
}

/** The same `context`, `density`, `brand` and `tokens` as the provider, for one subtree. */
export function UmbraScope({ className, style, children, ...scope }: UmbraScopeProps) {
  const attributes = useScope(scope);
  return (
    <ScopeContext value={attributes}>
      <div {...attributes} className={cx(styles.scope, className)} style={{ ...attributes.style, ...style }}>
        {children}
      </div>
    </ScopeContext>
  );
}

/** Wraps the app once. Supplies the theme, density, icon map and shortcut registry to every component. */
export function UmbraProvider({
  icons,
  shortcuts,
  reducedMotion = 'system',
  locale,
  className,
  style,
  children,
  ...scope
}: UmbraProviderProps) {
  const motion = useMemo(() => ({ 'data-umbra-reduced-motion': reducedMotion }), [reducedMotion]);
  const attributes = useScope({ density: 'default', context: 'violet', ...scope }, motion);

  const [bound] = useState(() => new Map<string, () => void>());
  const value = useMemo<UmbraContextValue>(() => {
    const all = [...reservedShortcuts, ...(shortcuts ?? [])];
    for (const ids of findConflicts(all)) warn(`shortcuts ${ids.join(', ')} use the same keys.`);
    return {
      icons: { ...defaultIcons, ...icons },
      shortcuts: new Map(all.map((s) => [s.id, s])),
      bound,
    };
  }, [icons, shortcuts, bound]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of value.shortcuts.values()) {
        if (!matchesKeys(event, shortcut.keys)) continue;
        const bare = !event.ctrlKey && !event.metaKey && !event.altKey;
        if (bare && isTypingTarget(event.target)) return;
        const run = bound.get(shortcut.id) ?? shortcut.action;
        if (!run) return;
        event.preventDefault();
        run();
        return;
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [value, bound]);

  const direction = locale ? textDirection(locale) : undefined;
  const tree = (
    <UmbraContext value={value}>
      <ScopeContext value={attributes}>
        <div
          {...attributes}
          data-umbra-root=""
          lang={locale}
          dir={direction}
          className={cx(styles.scope, className)}
          style={{ ...attributes.style, ...style }}
        >
          {children}
        </div>
      </ScopeContext>
    </UmbraContext>
  );
  return locale ? <I18nProvider locale={locale}>{tree}</I18nProvider> : tree;
}

function textDirection(locale: string) {
  try {
    const info = new Intl.Locale(locale) as Intl.Locale & {
      getTextInfo?: () => { direction: 'ltr' | 'rtl' };
    };
    return info.getTextInfo?.().direction;
  } catch {
    warn(`locale "${locale}" is not a valid language tag.`);
    return undefined;
  }
}

/**
 * Internal: binds a shortcut id to a handler while the component is mounted, and returns the key hint
 * to display (for example "Ctrl+K"), or undefined when the id is not registered.
 */
export function useShortcut(id: string | undefined, handler: (() => void) | undefined) {
  const { shortcuts, bound } = useUmbra();
  const latest = useRef(handler);
  useEffect(() => {
    latest.current = handler;
  });
  const shortcut = id ? shortcuts.get(id) : undefined;
  const enabled = !!handler;
  useEffect(() => {
    if (!id || !enabled) return;
    if (!shortcut) return warn(`shortcut "${id}" is not in the provider's shortcut list.`);
    const run = () => latest.current?.();
    bound.set(id, run);
    return () => {
      if (bound.get(id) === run) bound.delete(id);
    };
  }, [id, enabled, shortcut, bound]);
  return shortcut ? formatKeys(shortcut.keys) : undefined;
}
