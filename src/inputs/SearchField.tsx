import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  ButtonContext,
  ComboBox as AriaComboBox,
  Header as AriaHeader,
  Input as AriaInput,
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  ListBoxSection as AriaListBoxSection,
  Popover as AriaPopover,
  SearchField as AriaSearchField,
} from 'react-aria-components';
import { ButtonBase, Spinner } from '../basics/Button';
import { Skeleton } from '../basics/Skeleton';
import { useShrinkLevel } from '../internal/useShrinkLevel';
import menuStyles from '../overlays/Menu.module.css';
import { BareIcon, Icon, IconSlot } from '../provider/icons';
import { formatKeys, isTypingTarget, matchesKeys } from '../provider/shortcuts';
import { useScopeAttributes, useShortcut, useUmbra } from '../provider/UmbraProvider';
import { useFlipWhenCut, useOverlayLayer } from '../overlays/shared';
import { cx, renderPart, type Part } from '../utils/parts';
import type { BlockProps } from './fieldParts';
import styles from './SearchField.module.css';
import { useFieldControl } from './useField';
import { defined } from '../utils/defined';

/** One row of the list under the field. */
export interface SearchSuggestion {
  id: string;
  label: ReactNode;
  /** The label as text: it becomes the field's text when the row is chosen. Needed when `label` is not a string. */
  textValue?: string | undefined;
  /** A second, quieter line. */
  description?: ReactNode | undefined;
  icon?: ReactNode | undefined;
  /** The heading this row is grouped under. */
  section?: string | undefined;
}

interface Row {
  key: string;
  text: string;
  /** A recent search, not a suggestion. */
  recent: boolean;
  suggestion?: SearchSuggestion | undefined;
}

interface SearchFieldContextValue {
  placeholder: string | undefined;
  inputId: string | undefined;
  inputRef: RefObject<HTMLInputElement | null>;
  boxRef: RefObject<HTMLDivElement | null>;
  loading: boolean;
  loadingLabel: string;
  invalid: boolean;
  collapsed: boolean;
  collapsedLabel: ReactNode;
  canClear: boolean;
  clear: () => void;
  /** The keys to show, while the hint is shown. */
  hint: string | undefined;
  hasList: boolean;
  rows: Row[];
  width: number;
  removeRecent: ((text: string) => void) | undefined;
}
const SearchFieldContext = createContext<SearchFieldContextValue | null>(null);
function useSearchField() {
  const field = useContext(SearchFieldContext);
  if (!field) throw new Error('SearchField blocks must be rendered inside <SearchField.Root>.');
  return field;
}

export interface SearchFieldRootProps extends BlockProps {
  /** Controlled text. */
  value?: string | undefined;
  defaultValue?: string | undefined;
  /** Called with the text as it changes, after `debounce` milliseconds without typing. */
  onChange?: ((text: string) => void) | undefined;
  /** Called with the text when Enter is pressed, or a recent search is chosen. */
  onSubmit?: ((text: string) => void) | undefined;
  /** Called when the field is emptied with its clear button or Escape. */
  onClear?: (() => void) | undefined;
  /** Milliseconds `onChange` waits after the last keystroke. Submitting and clearing do not wait. */
  debounce?: number | undefined;
  placeholder?: string | undefined;
  /** Shows a spinner in place of the search icon, and skeleton rows in an empty list. */
  loading?: boolean | undefined;
  /** What a screen reader hears while `loading`. */
  loadingLabel?: string | undefined;
  /** `small` is for table cells and dense toolbars. Otherwise the height follows the density level. */
  size?: 'default' | 'small' | undefined;
  /**
   * A key that focuses the field, shown at its end while it is empty: the id of a shortcut in the
   * provider's list, or the keys themselves (`/`, `Mod+F`).
   */
  shortcut?: string | undefined;
  /** Shows only the search icon until it is pressed, focused or has text; it collapses again when empty and blurred. */
  collapsible?: boolean | undefined;
  /**
   * How a `collapsible` field opens. `overlay`: over the space beside it, so nothing around it moves.
   * `inline`: it takes the space, and what is beside it moves.
   */
  expandMode?: 'overlay' | 'inline' | undefined;
  /** The direction an `overlay` field grows in. `start` suits a field at the end of a bar. */
  expandTo?: 'start' | 'end' | undefined;
  /** Text beside the icon of a collapsed field. */
  collapsedLabel?: ReactNode | undefined;
  /** Makes the field a `search` landmark, for the main search of a page. */
  landmark?: boolean | undefined;
  /** Accessible name, when there is no `FormField` label. */
  'aria-label'?: string | undefined;
  /** @deprecated Use `aria-label`: the field shows no label of its own (decision 07). */
  label?: string | undefined;
  /** Rows shown in a list under the field, as given: the app filters them. Pass `[]`, not nothing, while there are none. */
  suggestions?: SearchSuggestion[] | undefined;
  /** Earlier searches, shown in the list while the field is empty. */
  recent?: string[] | undefined;
  /** Called with the id of the suggestion the user chose. Its text becomes the field's text. */
  onSelect?: ((id: string) => void) | undefined;
  /** Lets the user remove a recent search: a button on its row, or Shift+Delete. */
  onRemoveRecent?: ((text: string) => void) | undefined;
  disabled?: boolean | undefined;
  /** Focusable and selectable, but cannot be changed. */
  readOnly?: boolean | undefined;
  /** Shows the danger border and an error icon. */
  invalid?: boolean | undefined;
  required?: boolean | undefined;
  /** Form field name. */
  name?: string | undefined;
  id?: string | undefined;
}

function Root({
  value,
  defaultValue = '',
  onChange,
  onSubmit,
  onClear,
  debounce = 0,
  placeholder,
  loading = false,
  loadingLabel = 'Loading',
  size = 'default',
  shortcut,
  collapsible = false,
  expandMode = 'overlay',
  expandTo = 'start',
  collapsedLabel,
  landmark = false,
  'aria-label': ariaLabel,
  label = ariaLabel ?? 'Search',
  suggestions,
  recent,
  onSelect,
  onRemoveRecent,
  disabled,
  readOnly = false,
  invalid,
  required,
  name,
  id,
  className,
  style,
  children,
}: SearchFieldRootProps) {
  const control = useFieldControl({ id, disabled, invalid, required });
  const rootRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // The field shows what was typed at once; `onChange` may hear of it later (`debounce`).
  const [text, setText] = useState(value ?? defaultValue);
  const [previous, setPrevious] = useState(value);
  if (value !== previous) {
    setPrevious(value);
    if (value !== undefined) setText(value);
  }
  const shown = debounce > 0 ? text : (value ?? text);
  const timer = useRef(0);
  const emitted = useRef(shown);
  useEffect(() => {
    if (value !== undefined) emitted.current = value;
  }, [value]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const emit = (next: string, now = false) => {
    window.clearTimeout(timer.current);
    const fire = () => {
      timer.current = 0;
      if (next === emitted.current) return;
      emitted.current = next;
      onChange?.(next);
    };
    if (debounce > 0 && !now) timer.current = window.setTimeout(fire, debounce);
    else fire();
  };
  const change = (next: string, now = false) => {
    setText(next);
    emit(next, now);
  };
  const clear = () => {
    change('', true);
    onClear?.();
    inputRef.current?.focus();
  };

  // The shortcut: one from the provider's list, or keys of its own.
  const { registry } = useUmbra();
  const registered = !!shortcut && registry.shortcuts.has(shortcut);
  const focus = () => inputRef.current?.focus();
  const fromList = useShortcut(registered ? shortcut : undefined, control.disabled ? undefined : focus);
  useEffect(() => {
    if (!shortcut || registered || control.disabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || isTypingTarget(event.target) || !matchesKeys(event, shortcut)) return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [shortcut, registered, control.disabled]);
  const keys = shortcut ? (fromList ?? formatKeys(shortcut)) : undefined;

  // Show less as it narrows: the key hint hides, then a collapsible field that takes space opens over
  // its neighbours instead. A field that already opens over them has nothing to give up.
  const [focused, setFocused] = useState(false);
  const inFlow = !(collapsible && expandMode === 'overlay');
  const steps = inFlow ? (keys ? 1 : 0) + (collapsible ? 1 : 0) : 0;
  const level = useShrinkLevel(rootRef, steps);
  const forced = collapsible && steps > 0 && level === steps;
  const overlay = collapsible && (!inFlow || forced);
  const collapsed = collapsible && !focused && shown === '';
  const hint = keys && !(inFlow && level >= 1) && !focused && shown === '' && !collapsed ? keys : undefined;

  const hasList = suggestions !== undefined || recent !== undefined;
  // Choosing a row closes the list. The field has no "open" of its own to set: the list closes when it
  // has no rows, so it has none until the text changes again.
  const [picked, setPicked] = useState<string | null>(null);
  const chosen = picked === shown;
  const all: Row[] = [
    ...(shown === '' ? (recent ?? []) : []).map((entry) => ({
      key: `recent:${entry}`,
      text: entry,
      recent: true,
    })),
    ...(suggestions ?? []).map((suggestion) => ({
      key: suggestion.id,
      text: suggestion.textValue ?? (typeof suggestion.label === 'string' ? suggestion.label : suggestion.id),
      recent: false,
      suggestion,
    })),
  ];
  const rows = chosen ? [] : all;
  const pick = (key: string) => {
    const row = rows.find((r) => r.key === key);
    if (!row) return;
    setPicked(row.text);
    change(row.text, true);
    if (row.recent) onSubmit?.(row.text);
    else onSelect?.(row.suggestion!.id);
  };
  // The list is as wide as the field.
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box || !hasList) return;
    const observer = new ResizeObserver(() => setWidth(box.offsetWidth));
    observer.observe(box);
    return () => observer.disconnect();
  }, [hasList]);

  // Enter submits unless a row of the list has the keyboard; Escape closes the list, then clears, then blurs.
  const onKeyDownCapture = (event: React.KeyboardEvent) => {
    const input = inputRef.current;
    if (!input || event.target !== input || control.disabled) return;
    const listOpen = input.getAttribute('aria-expanded') === 'true';
    const active = listOpen ? input.getAttribute('aria-activedescendant') : null;
    if (event.key === 'Enter' && !active) {
      emit(shown, true);
      if (!onSubmit) return;
      event.preventDefault();
      onSubmit(shown);
    } else if (event.key === 'Escape' && !listOpen) {
      if (shown === '' || readOnly) return input.blur();
      // Emptying the field is all this press does: a popover around the field stays open.
      event.stopPropagation();
      event.preventDefault();
      clear();
    } else if (event.key === 'Delete' && event.shiftKey && active && onRemoveRecent) {
      const entry = document.getElementById(active)?.dataset.recent;
      if (entry === undefined) return;
      event.preventDefault();
      onRemoveRecent(entry);
    }
  };

  const field = {
    'data-part': 'field',
    className: styles.box,
    isDisabled: control.disabled,
    isReadOnly: readOnly,
    isInvalid: control.invalid,
    isRequired: control.required,
    name,
    'aria-label': control.labelledBy ? undefined : label,
    'aria-labelledby': control.labelledBy,
    'aria-describedby': control.describedBy,
  };
  const content = (
    <SearchFieldContext
      value={{
        placeholder,
        inputId: control.id,
        inputRef,
        boxRef,
        loading,
        loadingLabel,
        invalid: control.invalid,
        collapsed,
        collapsedLabel,
        canClear: shown !== '' && !control.disabled && !readOnly,
        clear,
        hint,
        hasList,
        rows,
        width,
        removeRecent: onRemoveRecent,
      }}
    >
      {/* The field's own clear and menu buttons are not used; a button inside is just a button. */}
      <ButtonContext value={{}}>{children}</ButtonContext>
    </SearchFieldContext>
  );
  return (
    <div
      ref={rootRef}
      role={landmark ? 'search' : undefined}
      aria-label={landmark ? label : undefined}
      data-umbra="search-field"
      data-size={size}
      data-collapsible={collapsible || undefined}
      data-collapsed={collapsed || undefined}
      data-overlay={overlay || undefined}
      data-expand-to={overlay ? expandTo : undefined}
      data-fixed={(inFlow && level < steps) || undefined}
      data-hint={hint ? '' : undefined}
      data-shrink={level || undefined}
      data-disabled={control.disabled || undefined}
      data-invalid={control.invalid || undefined}
      data-readonly={readOnly || undefined}
      className={cx(styles.root, className)}
      style={style}
      onKeyDownCapture={onKeyDownCapture}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        const next = event.relatedTarget as Element | null;
        if (!event.currentTarget.contains(next) && !next?.closest('[data-umbra-overlay]')) setFocused(false);
      }}
    >
      {/* A field that opens over its neighbours leaves this behind: the room of the collapsed field. */}
      {overlay && (
        <span aria-hidden="true" className={styles.sizer}>
          <IconSlot>{null}</IconSlot>
          {collapsedLabel != null && <span className={styles.label}>{collapsedLabel}</span>}
        </span>
      )}
      {hasList ? (
        <AriaComboBox
          ref={boxRef}
          {...defined(field)}
          inputValue={shown}
          onInputChange={(next) => change(next)}
          value={null}
          onChange={(key) => key != null && pick(String(key))}
          allowsCustomValue
          // An empty list still opens for its loading and "no results" rows.
          allowsEmptyCollection={!chosen && (loading || (shown !== '' && suggestions !== undefined))}
          menuTrigger="focus"
          defaultFilter={() => true}
          formValue="text"
        >
          {content}
        </AriaComboBox>
      ) : (
        <AriaSearchField ref={boxRef} {...defined(field)} value={shown} onChange={(next) => change(next)}>
          {content}
        </AriaSearchField>
      )}
    </div>
  );
}

/** The search icon, or the spinner while loading. A collapsed field shows its label after it. */
function SearchIcon({ className, style, children }: BlockProps) {
  const field = useSearchField();
  return (
    <>
      <span data-part="icon" className={cx(styles.icon, className)} style={style}>
        {field.loading ? (
          <Spinner label={field.loadingLabel} />
        ) : children ? (
          <IconSlot>{children}</IconSlot>
        ) : (
          <Icon name="search" />
        )}
      </span>
      {field.collapsed && field.collapsedLabel != null && (
        <span data-part="label" className={styles.label}>
          {field.collapsedLabel}
        </span>
      )}
    </>
  );
}

/** The text box, and the icon an invalid field shows. */
function Input({ className, style }: Omit<BlockProps, 'children'>) {
  const { inputRef, inputId, placeholder, invalid } = useSearchField();
  return (
    <>
      <AriaInput
        ref={inputRef}
        id={inputId}
        data-part="input"
        {...defined({ placeholder, className: cx(styles.input, className), style })}
      />
      {invalid && (
        <span data-part="invalidIcon" className={styles.invalidIcon}>
          <IconSlot>
            <BareIcon name="invalid" />
          </IconSlot>
        </span>
      )}
    </>
  );
}

export interface SearchFieldClearProps {
  /** Accessible name of the button. */
  label?: string | undefined;
  className?: string | undefined;
  style?: React.CSSProperties | undefined;
}

/** The button that empties the field. It is rendered only while there is text to clear. */
function Clear({ label = 'Clear', className, style }: SearchFieldClearProps) {
  const field = useSearchField();
  if (!field.canClear) return null;
  return (
    // With the list open React Aria hides everything but the input and the list from assistive
    // technology. This button stays reachable by Tab, so it must stay visible to it: the mark says so.
    <span
      data-part="clear"
      data-react-aria-top-layer="true"
      className={cx(styles.clear, className)}
      style={style}
    >
      <ButtonBase
        umbra="icon-button"
        variant="ghost"
        size="small"
        iconOnly
        label={label}
        onPress={field.clear}
      >
        <Icon name="close" />
      </ButtonBase>
    </span>
  );
}

/** The key that focuses the field, shown while it is empty and not focused. */
function Shortcut({ className, style }: Omit<BlockProps, 'children'>) {
  const { hint } = useSearchField();
  if (!hint) return null;
  return (
    <kbd data-part="shortcut" className={cx(styles.shortcut, className)} style={style}>
      {hint}
    </kbd>
  );
}

/** What the `suggestion` part receives: the row's data. `suggestion` is not set for a recent search. */
export interface SearchFieldSuggestionPartProps {
  suggestion: SearchSuggestion | undefined;
  /** The text the field takes when the row is chosen. */
  text: string;
  recent: boolean;
  /** The default content of the row. */
  children: ReactNode;
}

export interface SearchFieldSuggestionsProps extends Omit<BlockProps, 'children'> {
  /** Heading of the recent searches. */
  recentLabel?: string | undefined;
  /** Tooltip of the button that removes a recent search. */
  removeRecentLabel?: string | undefined;
  /** Shown when there is text and no suggestion for it. */
  noResultsLabel?: string | undefined;
  /** Tallest the list may be, in pixels. It is never taller than the room in the window; the rows scroll. */
  maxHeight?: number | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        suggestion?: Part<SearchFieldSuggestionPartProps> | undefined;
        empty?: Part<{ children: ReactNode }> | undefined;
      }
    | undefined;
}

/** The list under the field: recent searches and suggestions. It is rendered only when the field has either. */
function Suggestions({
  recentLabel = 'Recent searches',
  removeRecentLabel = 'Remove',
  noResultsLabel = 'No results',
  maxHeight = 320,
  parts,
  className,
  style,
}: SearchFieldSuggestionsProps) {
  const field = useSearchField();
  const scope = useScopeAttributes();
  const layer = useOverlayLayer('popover');
  const flipWhenCut = useFlipWhenCut(maxHeight);
  if (!field.hasList) return null;
  // Rows without a section come first; each section keeps the place of its first row.
  const groups = new Map<string, Row[]>();
  for (const row of field.rows) {
    const section = row.recent ? recentLabel : (row.suggestion?.section ?? '');
    groups.set(section, [...(groups.get(section) ?? []), row]);
  }
  const stop = (event: React.SyntheticEvent) => event.stopPropagation();
  const item = (row: Row) => (
    <AriaListBoxItem
      key={row.key}
      id={row.key}
      textValue={row.text}
      data-part="suggestion"
      data-recent={row.recent ? row.text : undefined}
      {...defined({ className: cx(menuStyles.item, styles.suggestion) })}
    >
      {renderPart(
        parts?.suggestion,
        {
          suggestion: row.suggestion,
          text: row.text,
          recent: row.recent,
          children: (
            <>
              {row.recent ? (
                <IconSlot part="icon">
                  <BareIcon name="recent" />
                </IconSlot>
              ) : (
                row.suggestion?.icon && <IconSlot part="icon">{row.suggestion.icon}</IconSlot>
              )}
              <span className={menuStyles.text}>
                <span data-part="label" className={menuStyles.label}>
                  {row.suggestion?.label ?? row.text}
                </span>
                {row.suggestion?.description && (
                  <span data-part="description" className={menuStyles.description}>
                    {row.suggestion.description}
                  </span>
                )}
              </span>
            </>
          ),
        },
        (p) => p.children,
      )}
      {/* Not a button: an option cannot hold one. The keyboard removes a recent search with Shift+Delete. */}
      {row.recent && field.removeRecent && (
        <span
          aria-hidden="true"
          title={removeRecentLabel}
          data-part="remove"
          className={styles.remove}
          onPointerDown={stop}
          onPointerUp={stop}
          onMouseDown={(event) => {
            // Focus stays in the field.
            event.preventDefault();
            event.stopPropagation();
          }}
          onClick={(event) => {
            event.stopPropagation();
            field.removeRecent?.(row.text);
          }}
        >
          <BareIcon name="close" />
        </span>
      )}
    </AriaListBoxItem>
  );
  const empty = field.loading ? (
    <>
      {/* React Aria renders this inside an option, which must have a name. */}
      <span className={styles.hiddenText}>{field.loadingLabel}</span>
      <Skeleton />
      <Skeleton width="70%" />
    </>
  ) : (
    noResultsLabel
  );
  return (
    <AriaPopover
      {...scope}
      {...defined(layer)}
      ref={flipWhenCut}
      triggerRef={field.boxRef}
      placement="bottom start"
      offset={4}
      maxHeight={maxHeight}
      data-umbra="search-field-suggestions"
      data-umbra-overlay=""
      data-part="suggestions"
      {...defined({ className: cx(menuStyles.root, styles.popover, className) })}
      style={{ ...scope.style, minWidth: field.width, ...style }}
    >
      <AriaListBox
        data-part="list"
        {...defined({ className: menuStyles.list })}
        renderEmptyState={() =>
          renderPart(parts?.empty, { children: empty }, (p) => (
            <div data-part="empty" aria-busy={field.loading || undefined} className={styles.empty}>
              {p.children}
            </div>
          ))
        }
      >
        {[...groups]
          .sort(([a], [b]) => Number(b === '') - Number(a === ''))
          .map(([section, rows]) =>
            section === '' ? (
              rows.map(item)
            ) : (
              <AriaListBoxSection key={`section:${section}`} {...defined({ className: menuStyles.section })}>
                <AriaHeader data-part="sectionHeader" className={menuStyles.sectionHeader}>
                  {section}
                </AriaHeader>
                {rows.map(item)}
              </AriaListBoxSection>
            ),
          )}
      </AriaListBox>
    </AriaPopover>
  );
}

export interface SearchFieldProps
  extends
    Omit<SearchFieldRootProps, 'children'>,
    Pick<SearchFieldSuggestionsProps, 'recentLabel' | 'removeRecentLabel' | 'noResultsLabel' | 'maxHeight'> {
  /** Accessible name of the clear button. */
  clearLabel?: string | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        icon?: Part<BlockProps> | undefined;
        input?: Part<Omit<BlockProps, 'children'>> | undefined;
        clear?: Part<SearchFieldClearProps> | undefined;
        shortcut?: Part<Omit<BlockProps, 'children'>> | undefined;
        suggestions?: Part<SearchFieldSuggestionsProps> | undefined;
        /** The content of a row of the list. */
        suggestion?: Part<SearchFieldSuggestionPartProps> | undefined;
        /** What the list shows when it has no rows: the loading and "no results" states. */
        empty?: Part<{ children: ReactNode }> | undefined;
      }
    | undefined;
}

/** A field for searching: always an input, or an icon that opens into one. It can list suggestions and recent searches. */
export function SearchField({
  clearLabel,
  recentLabel,
  removeRecentLabel,
  noResultsLabel,
  maxHeight,
  parts,
  ...root
}: SearchFieldProps) {
  return (
    <Root {...root}>
      {renderPart(parts?.icon, {}, (p) => (
        <SearchIcon {...p} />
      ))}
      {renderPart(parts?.input, {}, (p) => (
        <Input {...p} />
      ))}
      {renderPart(parts?.clear, { label: clearLabel }, (p) => (
        <Clear {...p} />
      ))}
      {renderPart(parts?.shortcut, {}, (p) => (
        <Shortcut {...p} />
      ))}
      {renderPart(
        parts?.suggestions,
        {
          recentLabel,
          removeRecentLabel,
          noResultsLabel,
          maxHeight,
          parts: { suggestion: parts?.suggestion, empty: parts?.empty },
        },
        (p) => (
          <Suggestions {...p} />
        ),
      )}
    </Root>
  );
}

SearchField.Root = Root;
SearchField.Icon = SearchIcon;
SearchField.Input = Input;
SearchField.Clear = Clear;
SearchField.Shortcut = Shortcut;
SearchField.Suggestions = Suggestions;
