import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { I18nProvider, useLocale } from 'react-aria-components';
import { contextPresets, densities, paletteDefaults, type TokenName } from '../styles/tokens.generated';
import { warn } from '../utils/dev';
import { cx } from '../utils/parts';
import { focusColourOn, mutedTextOn, parseColour, textColourOn } from './contrast';
import { derivePalette, type PaletteInputs } from './palette';
import { resolveLocale } from './direction';
import { defaultIcons, type IconMap } from './icons';
import {
  formatKeys,
  isTypingTarget,
  listShortcuts,
  ownedShortcut,
  resolveShortcuts,
  shortcutForEvent,
  unreportedConflicts,
  type Shortcut,
  type ShortcutRegistry,
} from './shortcuts';
import styles from './UmbraProvider.module.css';
import { passThrough, type RootAttributes } from '../utils/passThrough';

export type Density = (typeof densities)[number];
export type ContextPreset = (typeof contextPresets)[number];
/** A context tint: a preset name, or any CSS colour. */
export type ContextTint = ContextPreset | (string & {});
/**
 * Token overrides, keyed by variable name without the `--umbra-` prefix.
 * Example: `{ 'radius-card': '12px', 'card-bg': '#101018' }`.
 */
export type TokenOverrides = Partial<Record<TokenName | (string & {}), string | number | undefined>>;

export interface UmbraScopeProps extends RootAttributes {
  /**
   * Brand colour, hex or `rgb()`. Colours the TopBar, and the interaction colour, the action colour and
   * the context follow it unless they are set. Text on it is computed for contrast.
   */
  brand?: string | undefined;
  /** Context tint: the page background, card tints, and the hue of surfaces, borders and dim text. */
  context?: ContextTint | undefined;
  /**
   * The colour of selected and checked things, the accent tone, links and thin marks. Hex or `rgb()`.
   * Its lightness is adjusted where needed, so text on it and its edge against the surface keep their contrast.
   */
  interaction?: string | undefined;
  /** The colour of the primary action. Hex or `rgb()`; adjusted like `interaction`. */
  action?: string | undefined;
  /** How opaque card surfaces are over the app background, 0 to 1. Overlays stay opaque. */
  surfaceOpacity?: number | undefined;
  /** Spacing, row heights and text sizes. */
  density?: Density | undefined;
  /** Overrides individual tokens for this subtree. */
  tokens?: TokenOverrides | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

export interface UmbraProviderProps extends UmbraScopeProps {
  /** Overrides built-in icons by name. */
  icons?: Partial<IconMap> | undefined;
  /** The app's key bindings. */
  shortcuts?: Shortcut[] | undefined;
  /** `system` follows the operating system setting. */
  reducedMotion?: 'system' | 'always' | 'never' | undefined;
  /** Locale for number and date formatting and text direction. Defaults to the browser's. */
  locale?: string | undefined;
}

type ScopeAttributes = {
  'data-umbra-scope': '';
  /** The resolved text direction and the locale, so every portal carries them too. */
  dir?: 'ltr' | 'rtl' | undefined;
  lang?: string | undefined;
  'data-umbra-density'?: Density | undefined;
  'data-umbra-context'?: ContextPreset | undefined;
  'data-umbra-reduced-motion'?: string | undefined;
  style: CSSProperties;
};

interface UmbraContextValue {
  icons: IconMap;
  /** Who owns which keys (plan/specs/UmbraProvider.md, "Shortcut conflicts"). */
  registry: ShortcutRegistry;
  /** Handlers bound by mounted components; they take precedence over a shortcut's own `action`. */
  bound: Map<string, () => void>;
  /** Tells the lists of shortcuts that `bound` changed: components bind and unbind as they mount. */
  bindings: { subscribe: (listener: () => void) => () => void; version: () => number; changed: () => void };
}

function createBindings(): UmbraContextValue['bindings'] {
  const listeners = new Set<() => void>();
  let version = 0;
  return {
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    version: () => version,
    changed: () => {
      version += 1;
      listeners.forEach((listener) => listener());
    },
  };
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

type Vars = Record<string, string | number>;

/**
 * What the scopes above decided, kept apart from the attributes: the palette is derived again from all
 * the inputs in every scope, and a token set by hand in any of them wins over what is derived.
 */
interface ScopeState {
  inputs: PaletteInputs & { context?: ContextTint | undefined };
  tokens: Vars;
}
const StateContext = createContext<ScopeState>({ inputs: {}, tokens: {} });

export interface Scope {
  attributes: ScopeAttributes;
  state: ScopeState;
}

const derivedContextKeys = ['context', ...Object.keys(paletteDefaults.neutrals)];

/** The variables that follow the colour inputs (plan/decisions/08-theming.md). */
function paletteVars(inputs: ScopeState['inputs'], brandOnly = false): Vars {
  const vars: Vars = {};
  const { brand, context, interaction, action } = inputs;
  const custom = context && !isPreset(context) ? context : undefined;
  const palette = brandOnly
    ? {}
    : derivePalette({ brand, context: custom, interaction, action }, paletteDefaults);
  // A preset brings its own neutrals from the stylesheet: nothing derived from the brand may cover them.
  if (context && isPreset(context)) for (const key of derivedContextKeys) delete palette[key];
  for (const [name, value] of Object.entries(palette)) vars[`--umbra-${name}`] = value;
  // A colour the provider cannot read (a name, `hsl()`) is passed on as it is, without the guarantees.
  const unread: [string, string | undefined, string][] = [
    ['context', custom, '--umbra-context'],
    ['interaction', interaction, '--umbra-color-interaction'],
    ['action', action, '--umbra-color-action'],
  ];
  for (const [prop, value, name] of unread) {
    if (!value || parseColour(value)) continue;
    warn(
      `${prop} "${value}" is not a hex or rgb() colour; it is used as it is, and contrast is not checked.`,
    );
    vars[name] = value;
  }
  if (brand) {
    const text = textColourOn(brand);
    if (!text) warn(`brand "${brand}" is not a hex or rgb() colour; text on it defaults to white.`);
    else if (text.ratio < 4.5)
      warn(`brand "${brand}" gives at most ${text.ratio.toFixed(2)}:1 text contrast; 4.5:1 is required.`);
    vars['--umbra-color-brand'] = brand;
    const on = text?.colour ?? '#ffffff';
    vars['--umbra-color-on-brand'] = on;
    // Resting nav items and the focus ring on the brand bar keep their contrast on any brand.
    vars['--umbra-color-on-brand-muted'] = mutedTextOn(brand, on) ?? on;
    vars['--umbra-color-on-brand-focus'] = focusColourOn(brand, paletteDefaults.focusRing, on);
  }
  return vars;
}

/** Internal: the attributes for a scope element, merged with the scopes above it, and the state below it. */
export function useScope(
  { brand, context, interaction, action, surfaceOpacity, density, tokens }: UmbraScopeProps,
  extra?: Partial<ScopeAttributes>,
  /** The brand is for this element only (a `TopBar`): nothing else is derived from it. */
  brandOnly = false,
): Scope {
  const parent = useContext(ScopeContext);
  const above = useContext(StateContext);
  return useMemo(() => {
    if (brandOnly) {
      const bar = brand ? paletteVars({ brand }, true) : {};
      return { attributes: { ...parent, style: { ...parent.style, ...bar } as CSSProperties }, state: above };
    }
    const inputs = { ...above.inputs };
    if (brand) inputs.brand = brand;
    if (context) inputs.context = context;
    if (interaction) inputs.interaction = interaction;
    if (action) inputs.action = action;
    const set: Vars = { ...above.tokens };
    if (surfaceOpacity !== undefined)
      set['--umbra-surface-opacity'] = Math.min(1, Math.max(0, surfaceOpacity));
    for (const [name, value] of Object.entries(tokens ?? {})) {
      if (value !== undefined) set[`--umbra-${name}`] = value;
    }
    const derived = paletteVars(inputs);
    const attributes: ScopeAttributes = {
      ...parent,
      ...extra,
      style: { ...derived, ...set } as CSSProperties,
    };
    if (density) attributes['data-umbra-density'] = density;
    // A context of the app's, or one that follows the brand, is written as variables; a preset is an attribute.
    if (inputs.context && isPreset(inputs.context)) attributes['data-umbra-context'] = inputs.context;
    else if ('--umbra-context' in derived) delete attributes['data-umbra-context'];
    return { attributes, state: { inputs, tokens: set } };
  }, [parent, above, brand, context, interaction, action, surfaceOpacity, density, tokens, extra, brandOnly]);
}

/** Internal: hands a scope to what is inside it, for a component that is a scope itself (`Page`). */
export function ScopeProvider({ scope, children }: { scope: Scope; children?: ReactNode | undefined }) {
  return (
    <ScopeContext value={scope.attributes}>
      <StateContext value={scope.state}>{children}</StateContext>
    </ScopeContext>
  );
}

/** The same colour inputs, `density` and `tokens` as the provider, for one subtree. */
export function UmbraScope({ className, style, children, ...scope }: UmbraScopeProps) {
  const provided = useScope(scope);
  const { attributes } = provided;
  return (
    <ScopeProvider scope={provided}>
      <div
        {...passThrough(scope)}
        {...attributes}
        className={cx(styles.scope, className)}
        style={{ ...attributes.style, ...style }}
      >
        {children}
      </div>
    </ScopeProvider>
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
  // Direction has one source (plan/specs/UmbraProvider.md, "Direction"): the `locale` prop, else the
  // document's `dir`, else the browser's locale. React Aria takes its direction from a locale only, so
  // a document direction that the browser's locale does not have is given to it as a script subtag
  // ("en-Arab" reads right to left and still formats as English).
  const documentDir = useSyncExternalStore(
    noSubscription,
    () => document.documentElement.dir || document.body.dir,
    () => '',
  );
  const browser = useLocale().locale;
  const { locale: resolved, direction } = resolveLocale(locale, documentDir, browser);
  const extra = useMemo(
    // The default context is an attribute here only: a brand below the root still brings its own.
    () => ({
      'data-umbra-context': 'violet' as const,
      'data-umbra-reduced-motion': reducedMotion,
      dir: direction,
      lang: locale,
    }),
    [reducedMotion, direction, locale],
  );
  const provided = useScope({ density: 'default', ...scope }, extra);
  const { attributes } = provided;

  const [bound] = useState(() => new Map<string, () => void>());
  const [bindings] = useState(createBindings);
  const registry = useMemo(() => resolveShortcuts(shortcuts), [shortcuts]);
  const value = useMemo<UmbraContextValue>(
    () => ({ icons: { ...defaultIcons, ...icons }, registry, bound, bindings }),
    [icons, registry, bound, bindings],
  );

  // Once per conflict, and never during render.
  const [reported] = useState(() => new Set<string>());
  useEffect(() => {
    unreportedConflicts(registry, reported).forEach(warn);
  }, [registry, reported]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const shortcut = shortcutForEvent(event, registry);
      if (!shortcut) return;
      const typing = shortcut.whenTyping ?? (event.ctrlKey || event.metaKey || event.altKey);
      // Also by where the focus is: a field that keeps the focus while the arrow keys move through a
      // list (the filter of a `Select`) passes its keys on to the list, and those arrive from the list.
      if (!typing && (isTypingTarget(event.target) || isTypingTarget(document.activeElement))) return;
      // With nothing to run (a reserved key whose component is not mounted) the key is left alone.
      const run = bound.get(shortcut.id) ?? shortcut.action;
      if (!run) return;
      event.preventDefault();
      run();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [registry, bound]);

  return (
    <I18nProvider locale={resolved}>
      <UmbraContext value={value}>
        <ScopeProvider scope={provided}>
          <div
            {...passThrough(scope)}
            {...attributes}
            data-umbra-root=""
            className={cx(styles.scope, className)}
            style={{ ...attributes.style, ...style }}
          >
            {children}
          </div>
        </ScopeProvider>
      </UmbraContext>
    </I18nProvider>
  );
}

const noSubscription = () => () => {};

/**
 * Internal: binds a shortcut id to a handler while the component is mounted, and returns the key hint
 * to display (for example "Ctrl+K"), or undefined when the id is not registered or lost its keys to
 * another shortcut.
 */
export function useShortcut(id: string | undefined, handler: (() => void) | undefined) {
  const { registry, bound, bindings } = useUmbra();
  const latest = useRef(handler);
  useEffect(() => {
    latest.current = handler;
  });
  const known = !!id && registry.shortcuts.has(id);
  const enabled = !!handler;
  useEffect(() => {
    if (!id || !enabled) return;
    if (!known) return warn(`shortcut "${id}" is not in the provider's shortcut list.`);
    const run = () => latest.current?.();
    bound.set(id, run);
    bindings.changed();
    return () => {
      if (bound.get(id) !== run) return;
      bound.delete(id);
      bindings.changed();
    };
  }, [id, enabled, known, bound, bindings]);
  const shortcut = ownedShortcut(registry, id);
  return shortcut ? formatKeys(shortcut.keys) : undefined;
}

/** One registered shortcut as the command palette and the shortcuts sheet list it. */
export interface ListedShortcut {
  id: string;
  label: string;
  /** The key hint, for example "Ctrl+K". */
  keys: string;
  /** The combination as it was registered (`Mod+K`), for drawing the keys one by one. */
  combination: string;
  /** The heading it is listed under; undefined for an app shortcut without a `group`. */
  group: string | undefined;
  /** One of the library's own shortcuts. */
  reserved: boolean;
  /** Whether anything would run now: the shortcut has an `action`, or a mounted component bound it. */
  canRun: () => boolean;
  /** Runs what the keys would run. */
  run: () => void;
}

/**
 * Internal: the shortcuts that own their keys and have a label. The one source of the command palette
 * (`includeShortcuts`) and the shortcuts sheet, so both list the same shortcuts with the same keys.
 */
export function useShortcutList(): ListedShortcut[] {
  const { registry, bound, bindings } = useUmbra();
  // A new list whenever a component binds or unbinds a shortcut, so what `canRun` says is drawn again.
  const version = useSyncExternalStore(bindings.subscribe, bindings.version, bindings.version);
  return useMemo(
    () =>
      listShortcuts(registry).map(({ action, ...s }) => ({
        ...s,
        keys: formatKeys(s.keys),
        combination: s.keys,
        canRun: () => !!(bound.get(s.id) ?? action),
        run: () => (bound.get(s.id) ?? action)?.(),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `version` stands for the content of `bound`
    [registry, bound, version],
  );
}
