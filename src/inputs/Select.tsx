import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  Autocomplete,
  Button as AriaButton,
  ButtonContext,
  FieldErrorContext,
  Header as AriaHeader,
  Input as AriaInput,
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  ListBoxSection as AriaListBoxSection,
  Popover as AriaPopover,
  SearchField as AriaSearchField,
  Select as AriaSelect,
  SelectValue as AriaSelectValue,
} from 'react-aria-components';
import { ButtonBase, Spinner } from '../basics/Button';
import { Skeleton } from '../basics/Skeleton';
import shared from '../data/shared.module.css';
import { toneColour, toneProps, type Tone } from '../data/tone';
import { dataState, type DataStateProps } from '../internal/dataState';
import { TruncatedText } from '../internal/TruncatedText';
import { useShrinkLevel } from '../internal/useShrinkLevel';
import { CheckMark } from '../overlays/Menu';
import menuStyles from '../overlays/Menu.module.css';
import {
  toAriaPlacement,
  useFlipWhenCut,
  useOpenState,
  useOverlayLayer,
  type OverlayPlacement,
} from '../overlays/shared';
import { BareIcon, Icon, IconSlot } from '../provider/icons';
import { useScopeAttributes } from '../provider/UmbraProvider';
import { cx, renderPart, type Part } from '../utils/parts';
import type { BlockProps } from './fieldParts';
import styles from './Select.module.css';
import { useField, useFieldControl } from './useField';

/** One choice of a select. */
export interface SelectOption {
  id: string;
  label: ReactNode;
  /** The label as text, for type-ahead and filtering. Needed when `label` is not a string. */
  textValue?: string;
  /** A second, quieter line. */
  description?: ReactNode;
  icon?: ReactNode;
  /** An `Avatar` or any node, shown before the label in place of `icon`. */
  avatar?: ReactNode;
  /** A colour meaning: a swatch before the label, and the fill of an `inCell` trigger. */
  tone?: Tone;
  /** A custom colour (any CSS colour). Replaces `tone`. */
  color?: string;
  disabled?: boolean;
  /** Short text at the end of the row: a count, a code. */
  meta?: ReactNode;
}

/** A group of options under an optional heading. */
export interface SelectSectionData {
  type: 'section';
  label?: ReactNode;
  options: SelectOption[];
}

export type SelectEntry = SelectOption | SelectSectionData;

/** Decides whether an option stays in the list for the text typed in the filter field. */
export type SelectFilter = (option: SelectOption, search: string) => boolean;

const textOf = (option: SelectOption) =>
  option.textValue ?? (typeof option.label === 'string' ? option.label : option.id);

const contains: SelectFilter = (option, search) =>
  `${textOf(option)} ${typeof option.description === 'string' ? option.description : ''}`
    .toLowerCase()
    .includes(search.trim().toLowerCase());

const tinted = (option: SelectOption | undefined): option is SelectOption =>
  !!option && (!!option.color || (!!option.tone && option.tone !== 'neutral'));

// Blocks that only carry data: `Select.Root` reads their props and renders the rows itself, so they
// must be direct children of `Select` or `Select.Root`.

export interface SelectOptionProps extends Omit<SelectOption, 'label'> {
  /** The label. */
  children?: ReactNode;
}
const Option = (() => null) as (props: SelectOptionProps) => null;

export interface SelectSectionProps {
  /** The heading. */
  label?: ReactNode;
  /** `Select.Option`s. */
  children?: ReactNode;
}
const Section = (() => null) as (props: SelectSectionProps) => null;

const toOption = ({ children, ...option }: SelectOptionProps): SelectOption => ({
  ...option,
  label: children,
});

/** The data blocks among the children become entries; everything else is rendered. */
function split(children: ReactNode) {
  const entries: SelectEntry[] = [];
  const rest: ReactNode[] = [];
  for (const child of Children.toArray(children)) {
    if (isValidElement<SelectOptionProps>(child) && child.type === Option)
      entries.push(toOption(child.props));
    else if (isValidElement<SelectSectionProps>(child) && child.type === Section)
      entries.push({
        type: 'section',
        label: child.props.label,
        options: split(child.props.children).options,
      });
    else rest.push(child);
  }
  return { entries, rest, options: entries.filter((entry): entry is SelectOption => 'id' in entry) };
}

interface SelectContextValue {
  entries: SelectEntry[];
  all: SelectOption[];
  selected: SelectOption[];
  multiple: boolean;
  placeholder: string;
  id: string | undefined;
  invalid: boolean;
  setMessage: (message: string | null) => void;
  canClear: boolean;
  clear: () => void;
  clearLabel: string;
  search: string;
  setSearch: (text: string) => void;
  /** The box the list is anchored to, and its width when the list opened. */
  box: RefObject<HTMLDivElement | null>;
  width: number;
}
const SelectContext = createContext<SelectContextValue | null>(null);
function useSelect() {
  const select = useContext(SelectContext);
  if (!select) throw new Error('Select blocks must be rendered inside <Select.Root>.');
  return select;
}

export interface SelectRootProps extends BlockProps {
  /** The choices, as data. Or pass `Select.Option` and `Select.Section` blocks as children. */
  options?: SelectEntry[];
  /** The id of the chosen option; `''` is none. Controlled. */
  value?: string;
  defaultValue?: string;
  /** Called with the id of the chosen option, or `''` when the choice is cleared. */
  onChange?: (id: string) => void;
  /** Lets several options be chosen: use `values` and `onValuesChange`. Options show checkboxes. */
  multiple?: boolean;
  /** The ids of the chosen options of a `multiple` select. Controlled. */
  values?: string[];
  defaultValues?: string[];
  onValuesChange?: (ids: string[]) => void;
  /** Controlled state of the list. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Shown while nothing is chosen. */
  placeholder?: string;
  /** Shows a button that removes the choice. */
  clearable?: boolean;
  /** Accessible name of the clear button. */
  clearLabel?: string;
  disabled?: boolean;
  /** Focusable, but the choice cannot be changed and the list does not open. */
  readOnly?: boolean;
  /** Shows the danger border and an error icon. Put the message in the `error` of a `FormField`. */
  invalid?: boolean;
  required?: boolean;
  /** `small` is for table cells and dense toolbars. Otherwise the height follows the density level. */
  size?: 'default' | 'small';
  /**
   * `ghost` has no border until hovered, for toolbars and headers. `inCell` fills a table cell and takes
   * the `tone` or `color` of the chosen option as its fill.
   */
  variant?: 'default' | 'ghost' | 'inCell';
  /** Fills the width of its slot. Otherwise it is as wide as its value. */
  fullWidth?: boolean;
  /** Form field name: the chosen ids are sent with the form. */
  name?: string;
  id?: string;
  /** Accessible name of a select that has no `FormField` label. */
  'aria-label'?: string;
  /** Called with the text typed in the filter field of a `searchable` select, and with `''` when it closes. */
  onSearchChange?: (text: string) => void;
}

function Root({
  options,
  value,
  defaultValue = '',
  onChange,
  multiple = false,
  values,
  defaultValues,
  onValuesChange,
  open,
  defaultOpen,
  onOpenChange,
  placeholder = 'Select',
  clearable = false,
  clearLabel = 'Clear',
  disabled,
  readOnly = false,
  invalid,
  required,
  size = 'default',
  variant = 'default',
  fullWidth = false,
  name,
  id,
  'aria-label': ariaLabel,
  onSearchChange,
  className,
  style,
  children,
}: SelectRootProps) {
  const control = useFieldControl({ id, disabled, invalid, required });
  // The browser's own message when the form is submitted with a required select left empty. A field
  // around the select shows it as its error; alone, the select carries it as its description.
  const [message, setMessage] = useState<string | null>(null);
  const messageId = useId();
  const report = useField().report;
  useEffect(() => {
    report?.(message);
    return () => report?.(null);
  }, [report, message]);
  const [isOpen, setOpen] = useOpenState(open, defaultOpen, onOpenChange);
  const [own, setOwn] = useState(multiple ? (defaultValues ?? []) : defaultValue ? [defaultValue] : []);
  const current = multiple ? (values ?? own) : value !== undefined ? (value ? [value] : []) : own;
  const blocks = split(children);
  const entries = options ?? blocks.entries;
  const all = entries.flatMap((entry) => ('id' in entry ? [entry] : entry.options));
  const selected = all.filter((option) => current.includes(option.id));
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const shown = isOpen && !readOnly;
  useLayoutEffect(() => {
    if (shown && box.current) setWidth(box.current.offsetWidth);
  }, [shown]);
  const [search, setSearchText] = useState('');
  const setSearch = (text: string) => {
    if (text === search) return;
    setSearchText(text);
    onSearchChange?.(text);
  };
  const change = (ids: string[]) => {
    if (readOnly) return;
    setOwn(ids);
    if (multiple) onValuesChange?.(ids);
    else onChange?.(ids[0] ?? '');
  };
  // In a cell the chosen option's colour fills the trigger; its label is the cue that is not colour.
  const first = selected[0];
  const tone =
    variant === 'inCell' && !multiple && tinted(first)
      ? toneProps(first.tone ?? 'neutral', first.color, style)
      : { style };
  return (
    <AriaSelect
      {...tone}
      ref={box}
      data-umbra="select"
      data-size={size}
      data-variant={variant}
      data-multiple={multiple || undefined}
      data-readonly={readOnly || undefined}
      data-full-width={fullWidth || undefined}
      className={cx(shared.tone, styles.root, className)}
      selectionMode={multiple ? 'multiple' : 'single'}
      value={multiple ? current : (current[0] ?? null)}
      onChange={(next) => change(next == null ? [] : Array.isArray(next) ? next.map(String) : [String(next)])}
      isOpen={shown}
      // A list without options still opens, for its loading, empty and error states.
      allowsEmptyCollection
      onOpenChange={(next) => {
        if (readOnly) return;
        setOpen(next);
        if (!next) setSearch('');
      }}
      isDisabled={control.disabled}
      // Only when it is set: a `false` would tell React Aria that the app decides, and silence the
      // select's own validation (required, on submit).
      isInvalid={control.invalid || undefined}
      isRequired={control.required}
      name={name}
      placeholder={placeholder}
      aria-label={ariaLabel}
      aria-labelledby={control.labelledBy}
      aria-describedby={
        [control.describedBy, message && !report && messageId].filter(Boolean).join(' ') || undefined
      }
    >
      {message && !report && (
        <span id={messageId} hidden>
          {message}
        </span>
      )}
      <SelectContext
        value={{
          entries,
          all,
          selected,
          multiple,
          placeholder,
          id: control.id,
          invalid: control.invalid,
          setMessage,
          canClear: clearable && current.length > 0 && !control.disabled && !readOnly,
          clear: () => change([]),
          clearLabel,
          search,
          setSearch,
          box,
          width,
        }}
      >
        {blocks.rest}
      </SelectContext>
    </AriaSelect>
  );
}

export interface SelectTriggerProps extends BlockProps {
  /** The caret. `null` hides it. */
  icon?: ReactNode;
}

/** The button that opens the list, with the clear button and the caret beside it. Holds a `Select.Value`. */
function Trigger({ icon, className, style, children }: SelectTriggerProps) {
  const select = useSelect();
  const button = useRef<HTMLButtonElement>(null);
  // Invalid by the app's word, or by the select's own validation (required, on submit).
  const validation = useContext(FieldErrorContext);
  const invalid = select.invalid || !!validation?.isInvalid;
  const message = validation?.isInvalid ? (validation.validationErrors[0] ?? null) : null;
  const { setMessage } = select;
  useEffect(() => setMessage(message), [setMessage, message]);
  // On the trigger, which is what has the focus and what a screen reader reads. `aria-invalid` is a
  // global attribute, so a button may carry it (`aria-required` is not, and stays off). Set on the
  // element: React Aria's button does not pass it on.
  useLayoutEffect(() => {
    if (invalid) button.current?.setAttribute('aria-invalid', 'true');
    else button.current?.removeAttribute('aria-invalid');
  }, [invalid]);
  return (
    <>
      <AriaButton
        ref={button}
        id={select.id}
        data-part="trigger"
        className={cx(styles.trigger, className)}
        style={style}
      >
        {children === undefined ? <Value /> : children}
      </AriaButton>
      {invalid && (
        <span data-part="invalidIcon" className={styles.invalidIcon}>
          <IconSlot>
            <BareIcon name="invalid" />
          </IconSlot>
        </span>
      )}
      {select.canClear && (
        <span data-part="clear" className={styles.clear}>
          {/* Not the select's own button: without this it would take the trigger's id and state. */}
          <ButtonContext value={{}}>
            <ButtonBase
              umbra="icon-button"
              variant="ghost"
              size="small"
              iconOnly
              label={select.clearLabel}
              onPress={() => {
                select.clear();
                button.current?.focus();
              }}
            >
              <Icon name="close" />
            </ButtonBase>
          </ButtonContext>
        </span>
      )}
      {icon === undefined ? (
        <Icon name="chevronDown" part="icon" />
      ) : (
        icon !== null && <IconSlot part="icon">{icon}</IconSlot>
      )}
    </>
  );
}

/** What comes before an option's label: its avatar, its icon, or a swatch of its colour. */
function Leading({ option, gutter }: { option: SelectOption; gutter?: 'icon' | 'swatch' | false }) {
  // Decorative: the label beside it already names the option.
  if (option.avatar)
    return (
      <span aria-hidden="true" className={styles.leading}>
        {option.avatar}
      </span>
    );
  if (option.icon) return <IconSlot part="icon">{option.icon}</IconSlot>;
  // In a list where other options have one, an empty place keeps the labels in one column.
  if (!tinted(option))
    return gutter === 'icon' ? (
      <IconSlot>{null}</IconSlot>
    ) : gutter ? (
      <span className={styles.swatch} />
    ) : null;
  return (
    <span
      aria-hidden="true"
      data-part="swatch"
      className={styles.swatch}
      style={{ background: option.color ?? toneColour(option.tone!) }}
    />
  );
}

export interface SelectValueProps extends Omit<BlockProps, 'children'> {
  /** Shows the chosen option's description as a second line; the trigger grows taller. */
  valueDescription?: boolean;
  /** The text of a `multiple` select whose labels do not fit. */
  selectedLabel?: (count: number) => string;
  /** Replaces the content shown for the chosen options. */
  renderValue?: (selected: SelectOption[]) => ReactNode;
}

/** The chosen option, the chosen labels of a `multiple` select, or the placeholder. */
function Value({
  valueDescription = false,
  selectedLabel = (count) => `${count} selected`,
  renderValue,
  className,
  style,
}: SelectValueProps) {
  const { selected, multiple, placeholder } = useSelect();
  const ref = useRef<HTMLSpanElement>(null);
  // Level 1: the labels of a `multiple` select do not fit, so it shows how many are chosen.
  const many = multiple && selected.length > 1 && !renderValue;
  const level = useShrinkLevel(ref, many ? 1 : 0, selected.map((option) => option.id).join());
  const one = selected[0];
  const content =
    selected.length === 0
      ? placeholder
      : renderValue
        ? renderValue(selected)
        : multiple
          ? level === 1
            ? selectedLabel(selected.length)
            : selected.map((option, i) => (
                <span key={option.id}>
                  {i > 0 && ', '}
                  {option.label}
                </span>
              ))
          : one && (
              <>
                <Leading option={one} />
                <span className={styles.valueText}>
                  <TruncatedText hoverOwner className={styles.valueLabel}>
                    {one.label}
                  </TruncatedText>
                  {valueDescription && one.description && (
                    <span className={styles.valueDescription}>{one.description}</span>
                  )}
                </span>
              </>
            );
  return (
    <AriaSelectValue
      ref={ref}
      data-part="value"
      data-empty={selected.length === 0 || undefined}
      data-count={level === 1 || undefined}
      className={cx(styles.value, className)}
      style={style}
    >
      {() => content}
    </AriaSelectValue>
  );
}

/** What the `option` part receives: the option and its state. */
export interface SelectOptionPartProps {
  option: SelectOption;
  selected: boolean;
  /** The default content of the row. */
  children: ReactNode;
}

export interface SelectPopoverProps
  extends Omit<BlockProps, 'children'>, Pick<DataStateProps, 'loading' | 'error' | 'onRetry' | 'retryLabel'> {
  /** Adds a field above the options: typing in it filters them. */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Accessible name of the filter field. */
  searchLabel?: string;
  /** Replaces the built-in filter (label or description contains the text). Pass `() => true` when the server filters. */
  filter?: SelectFilter;
  /** What a screen reader hears while `loading`. */
  loadingLabel?: string;
  /** Shown when there are no options: text, a node, or `{ title, description, icon, action }`. */
  empty?: DataStateProps['empty'];
  /** Shown when the filter leaves no options. */
  noResultsLabel?: string;
  /** Side of the trigger and alignment along it. It flips to the other side to stay in the window. */
  placement?: OverlayPlacement;
  /** Gap between the trigger and the list, in pixels. */
  offset?: number;
  /** Gives the list the width of the trigger. Otherwise it is at least that wide. */
  matchTriggerWidth?: boolean;
  /** Tallest the list may be, in pixels. It is never taller than the room in the window; the options scroll. */
  maxHeight?: number;
  /** Replaces the content of an option row. The check mark stays. */
  renderOption?: (option: SelectOption, state: { selected: boolean }) => ReactNode;
  /** Replace or hide named pieces. */
  parts?: {
    option?: Part<SelectOptionPartProps>;
    check?: Part;
    empty?: Part<{ children: ReactNode }>;
  };
}

/** The list of options, in a panel anchored to the trigger. */
function Popover({
  searchable = false,
  searchPlaceholder = 'Search',
  searchLabel = 'Filter options',
  filter = contains,
  loading = false,
  loadingLabel = 'Loading',
  empty = 'No options',
  error,
  onRetry,
  retryLabel,
  noResultsLabel = 'No results',
  placement = 'bottom start',
  offset = 4,
  matchTriggerWidth = false,
  maxHeight = 320,
  renderOption,
  parts,
  className,
  style,
}: SelectPopoverProps) {
  const select = useSelect();
  const scope = useScopeAttributes();
  const layer = useOverlayLayer('popover');
  const flipWhenCut = useFlipWhenCut(maxHeight);
  const searching = searchable && select.search.trim() !== '';
  const matches = (option: SelectOption | undefined, text: string) =>
    !option || !text.trim() || filter(option, text);
  const isEmpty = !select.all.some((option) => !searching || filter(option, select.search));
  const state = dataState(
    { loading, empty: searching ? noResultsLabel : empty, error, onRetry, retryLabel },
    { isEmpty, variant: 'inline' },
  );
  const placeholder =
    state ??
    (loading && isEmpty && (
      <>
        <Skeleton />
        <Skeleton width="70%" />
        <Skeleton width="85%" />
      </>
    ));

  const gutter = select.all.some((option) => option.icon)
    ? 'icon'
    : select.all.some((option) => !option.avatar && tinted(option)) && 'swatch';
  const row = (option: SelectOption) => (
    <AriaListBoxItem
      key={option.id}
      id={option.id}
      textValue={textOf(option)}
      isDisabled={option.disabled}
      data-part="option"
      className={cx(menuStyles.item, styles.option)}
    >
      {({ isSelected }) => (
        <>
          {select.multiple && (
            <span data-part="check" aria-hidden="true" className={styles.box}>
              {isSelected && renderPart(parts?.check, {}, () => <BareIcon name="check" />)}
            </span>
          )}
          {renderPart(
            parts?.option,
            {
              option,
              selected: isSelected,
              children: renderOption ? (
                renderOption(option, { selected: isSelected })
              ) : (
                <>
                  <Leading option={option} gutter={gutter} />
                  <span className={menuStyles.text}>
                    <span data-part="label" className={menuStyles.label}>
                      {option.label}
                    </span>
                    {option.description && (
                      <span data-part="description" className={menuStyles.description}>
                        {option.description}
                      </span>
                    )}
                  </span>
                  {option.meta && (
                    <span data-part="meta" className={styles.meta}>
                      {option.meta}
                    </span>
                  )}
                </>
              ),
            },
            (p) => p.children,
          )}
          {!select.multiple && <CheckMark shown={isSelected} part={parts?.check} />}
        </>
      )}
    </AriaListBoxItem>
  );
  const list = (
    <AriaListBox data-part="list" className={searchable ? styles.rows : cx(menuStyles.list, styles.list)}>
      {/* An error takes the place of the options. */}
      {!error &&
        select.entries.map((entry, i) =>
          'id' in entry ? (
            row(entry)
          ) : (
            <AriaListBoxSection key={`section-${i}`} className={menuStyles.section}>
              {entry.label !== undefined && (
                <AriaHeader data-part="sectionHeader" className={menuStyles.sectionHeader}>
                  {entry.label}
                </AriaHeader>
              )}
              {entry.options.map(row)}
            </AriaListBoxSection>
          ),
        )}
    </AriaListBox>
  );
  const byId = new Map(select.all.map((option) => [option.id, option]));
  return (
    <AriaPopover
      {...scope}
      {...layer}
      ref={flipWhenCut}
      triggerRef={select.box}
      placement={toAriaPlacement(placement)}
      offset={offset}
      maxHeight={maxHeight}
      data-umbra="select-popover"
      data-umbra-overlay=""
      data-part="popover"
      className={cx(menuStyles.root, styles.popover, className)}
      style={{
        ...scope.style,
        minWidth: select.width,
        ...(matchTriggerWidth && { width: select.width }),
        ...style,
      }}
    >
      {searchable ? (
        <Autocomplete
          inputValue={select.search}
          onInputChange={select.setSearch}
          filter={(_text, input, node) => matches(byId.get(String(node.key)), input)}
        >
          <AriaSearchField aria-label={searchLabel} autoFocus data-part="search" className={styles.search}>
            {loading ? <Spinner label={loadingLabel} /> : <Icon name="search" />}
            <AriaInput placeholder={searchPlaceholder} className={styles.searchInput} />
          </AriaSearchField>
          {/*
            With a filter field, focus stays in the field and the options are not focusable. The region
            that scrolls is then a tab stop of its own, so the keyboard can reach and scroll it.
          */}
          <div tabIndex={0} data-part="scroll" className={cx(menuStyles.list, styles.list, styles.scroll)}>
            {list}
          </div>
        </Autocomplete>
      ) : (
        list
      )}
      {placeholder &&
        renderPart(parts?.empty, { children: placeholder }, (p) => (
          <div data-part="empty" aria-busy={loading || undefined} className={styles.empty}>
            {p.children}
          </div>
        ))}
    </AriaPopover>
  );
}

export interface SelectProps
  extends
    Omit<SelectRootProps, 'children'>,
    Omit<SelectPopoverProps, 'parts' | 'className' | 'style'>,
    Pick<SelectValueProps, 'valueDescription' | 'selectedLabel' | 'renderValue'> {
  /** The choices as `Select.Option` and `Select.Section` blocks, in place of `options`. */
  children?: ReactNode;
  /** Replace or hide named pieces. */
  parts?: {
    trigger?: Part<SelectTriggerProps>;
    value?: Part<SelectValueProps>;
    /** The caret. */
    icon?: Part;
    popover?: Part<SelectPopoverProps>;
    /** The content of an option row. */
    option?: Part<SelectOptionPartProps>;
    /** The mark of a chosen option. */
    check?: Part;
    /** What the list shows in place of options: the loading, empty and error states. */
    empty?: Part<{ children: ReactNode }>;
  };
}

/** Chooses one option, or several with `multiple`, from a list that opens under a button. */
export function Select({
  valueDescription,
  selectedLabel,
  renderValue,
  searchable,
  searchPlaceholder,
  searchLabel,
  filter,
  loading,
  loadingLabel,
  empty,
  error,
  onRetry,
  retryLabel,
  noResultsLabel,
  placement,
  offset,
  matchTriggerWidth,
  maxHeight,
  renderOption,
  parts,
  children,
  ...root
}: SelectProps) {
  const popover: SelectPopoverProps = {
    searchable,
    searchPlaceholder,
    searchLabel,
    filter,
    loading,
    loadingLabel,
    empty,
    error,
    onRetry,
    retryLabel,
    noResultsLabel,
    placement,
    offset,
    matchTriggerWidth,
    maxHeight,
    renderOption,
    parts: { option: parts?.option, check: parts?.check, empty: parts?.empty },
  };
  const icon = renderPart(parts?.icon, {}, () => undefined);
  return (
    <Root {...root}>
      {children}
      {renderPart(parts?.trigger, { icon }, (p) => (
        <Trigger {...p}>
          {renderPart(parts?.value, { valueDescription, selectedLabel, renderValue }, (v) => (
            <Value {...v} />
          ))}
        </Trigger>
      ))}
      {renderPart(parts?.popover, popover, (p) => (
        <Popover {...p} />
      ))}
    </Root>
  );
}

Select.Root = Root;
Select.Trigger = Trigger;
Select.Value = Value;
Select.Popover = Popover;
Select.Option = Option;
Select.Section = Section;
