import { createElement, Fragment, useId, useState, type CSSProperties, type ReactNode } from 'react';
import { TextField } from '../inputs/TextField';
import { Kbd } from '../internal/Kbd';
import { Icon } from '../provider/icons';
import { formatKeys, keyCaps } from '../provider/shortcuts';
import { useShortcut, useShortcutList } from '../provider/UmbraProvider';
import { cx, renderPart, type Part } from '../utils/parts';
import { Modal, ModalNameContext, type ModalHeaderProps, type ModalSize } from './Modal';
import { useOpenState } from './shared';
import styles from './ShortcutsSheet.module.css';
import { passThrough, type RootAttributes } from '../utils/passThrough';

interface BlockProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

/** One line of the sheet that does not come from the provider's registry. */
export interface ShortcutsSheetItemData {
  /** A stable key for the row. Defaults to the label. */
  id?: string | undefined;
  /** What the keys do. */
  label: string;
  /** The keys, written like a registered shortcut (`Mod+K`, `ArrowUp`). Several are alternatives. */
  keys: string | string[];
}

/** A group of lines the app adds, for keys that are not in the registry (the arrow keys of a table). */
export interface ShortcutsSheetSectionData {
  title: string;
  items: ShortcutsSheetItemData[];
}

export interface ShortcutsSheetKeysProps extends BlockProps {
  /** The keys, written like a registered shortcut (`Mod+K`). Several are alternatives. */
  keys: string | string[];
  /** The word between alternatives. */
  orLabel?: string | undefined;
}

/** A key combination drawn as key caps, written for the platform: Ctrl and K, or ⌘ and K. */
function Keys({ keys, orLabel = 'or', className, style }: ShortcutsSheetKeysProps) {
  const combinations = Array.isArray(keys) ? keys : [keys];
  return (
    <span data-part="keys" className={cx(styles.keys, className)} style={style}>
      {combinations.map((combination, index) => (
        <Fragment key={combination}>
          {index > 0 && <span className={styles.or}>{orLabel}</span>}
          <kbd className={styles.combination}>
            {keyCaps(combination).map((cap, at) => (
              // A combination may hold the same key twice only by mistake; the position is its key.
              <Kbd key={at}>{cap}</Kbd>
            ))}
          </kbd>
        </Fragment>
      ))}
    </span>
  );
}

export interface ShortcutsSheetItemProps extends ShortcutsSheetKeysProps {
  /** What the keys do. */
  label: ReactNode;
}

/** One line: what the keys do, and the keys. */
function Item({ label, keys, orLabel, className, style }: ShortcutsSheetItemProps) {
  return (
    <li data-part="item" className={cx(styles.item, className)} style={style}>
      <span data-part="label" className={styles.label}>
        {label}
      </span>
      <Keys keys={keys} orLabel={orLabel} />
    </li>
  );
}

export interface ShortcutsSheetSectionProps extends BlockProps {
  title: ReactNode;
  /** Heading level of the title. */
  headingLevel?: 2 | 3 | 4 | 5 | 6 | undefined;
  /** `ShortcutsSheet.Item` elements. */
  children?: ReactNode | undefined;
}

/** A titled group of lines. A section is never split over two columns. */
function Section({ title, headingLevel = 3, className, style, children }: ShortcutsSheetSectionProps) {
  const id = useId();
  return (
    <section data-part="section" aria-labelledby={id} className={cx(styles.section, className)} style={style}>
      {createElement(
        `h${headingLevel}`,
        { id, 'data-part': 'sectionTitle', className: styles.sectionTitle },
        title,
      )}
      <ul className={styles.list}>{children}</ul>
    </section>
  );
}

/** The sections, in as many columns as fit the width. */
function Columns({ className, style, children }: BlockProps & { children?: ReactNode | undefined }) {
  return (
    <div data-part="columns" className={cx(styles.columns, className)} style={style}>
      {children}
    </div>
  );
}

export interface ShortcutsSheetSearchProps {
  value: string;
  onChange: (value: string) => void;
  /** Accessible name of the field. */
  label: string;
  placeholder: string;
  clearLabel?: string | undefined;
}

export interface ShortcutsSheetProps extends BlockProps, RootAttributes {
  /** Controlled state. */
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  /** A button that opens the sheet. Leave out to open it with the key, or with `open`. */
  trigger?: ReactNode | undefined;
  /** Id of the shortcut that opens and closes the sheet. `null` binds none. */
  shortcut?: string | null | undefined;
  /** The search text the sheet opens with: a help button can open it on one topic. */
  defaultQuery?: string | undefined;
  /** Sections for keys that are not in the registry, listed after it. */
  extra?: ShortcutsSheetSectionData[] | undefined;
  /** `dialog`: a panel in the middle of the window. `drawer`: a sheet attached to an edge. */
  variant?: 'dialog' | 'drawer' | undefined;
  /** The edge a `drawer` is attached to. */
  side?: 'start' | 'end' | 'bottom' | undefined;
  /** Width, as for a `Modal`. */
  size?: ModalSize | undefined;
  /** `fill` keeps the full height while the list is filtered. */
  height?: 'auto' | 'fill' | undefined;
  title?: ReactNode | undefined;
  /** A line under the title. */
  description?: ReactNode | undefined;
  /** Heading level of the title; the sections are one level below. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | undefined;
  /** Accessible name and placeholder of the search field. */
  searchLabel?: string | undefined;
  searchPlaceholder?: string | undefined;
  clearLabel?: string | undefined;
  closeLabel?: string | undefined;
  /** Shown when the search matches nothing. */
  emptyLabel?: string | undefined;
  /** Heading of the app's shortcuts that have no `group`. */
  ungroupedLabel?: string | undefined;
  /** Heading of the library's own shortcuts. */
  reservedLabel?: string | undefined;
  /** The word between two alternatives of one line. */
  orLabel?: string | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        header?: Part<ModalHeaderProps> | undefined;
        search?: Part<ShortcutsSheetSearchProps> | undefined;
        section?: Part<ShortcutsSheetSectionProps> | undefined;
        item?: Part<ShortcutsSheetItemProps> | undefined;
        /** Shown when the search matches nothing. */
        empty?: Part<{ query: string; children: ReactNode }> | undefined;
      }
    | undefined;
}

type PanelProps = Omit<
  ShortcutsSheetProps,
  'open' | 'defaultOpen' | 'onOpenChange' | 'trigger' | 'shortcut' | 'variant' | 'side' | 'size' | 'height'
>;

// Mounted while the sheet is open, so every opening starts with an empty search.
function Panel({
  extra = [],
  defaultQuery = '',
  title = 'Keyboard shortcuts',
  description,
  headingLevel = 2,
  searchLabel = 'Search shortcuts',
  searchPlaceholder = searchLabel,
  clearLabel,
  closeLabel,
  emptyLabel = 'No shortcuts match',
  ungroupedLabel = 'Shortcuts',
  reservedLabel = 'General',
  orLabel,
  parts,
}: PanelProps) {
  const [query, setQuery] = useState(defaultQuery);
  // The same list as the command palette's `includeShortcuts`: what owns its keys and would run now.
  const listed = useShortcutList().filter((s) => s.canRun());
  const sections = new Map<string, ShortcutsSheetItemData[]>();
  const add = (section: string, item: ShortcutsSheetItemData) =>
    sections.set(section, [...(sections.get(section) ?? []), item]);
  const row = (s: (typeof listed)[number]) => ({ id: s.id, label: s.label, keys: s.combination });
  // The app's groups in the order they were registered, then its ungrouped, then the library's own.
  for (const s of listed) if (s.group) add(s.group, row(s));
  for (const s of listed) if (!s.group && !s.reserved) add(ungroupedLabel, row(s));
  for (const s of listed) if (!s.group && s.reserved) add(reservedLabel, row(s));
  for (const section of extra) for (const item of section.items) add(section.title, item);

  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = (section: string, item: ShortcutsSheetItemData) => {
    // The keys as they are drawn ("↑") and as they are written ("ArrowUp").
    const text = [section, item.label, ...[item.keys].flat().flatMap((keys) => [formatKeys(keys), keys])]
      .join(' ')
      .toLowerCase();
    return words.every((word) => text.includes(word));
  };
  const shown = [...sections]
    .map(([section, items]) => [section, items.filter((item) => matches(section, item))] as const)
    .filter(([, items]) => items.length > 0);

  return (
    <>
      {renderPart(parts?.header, { title, description, closeLabel }, (p) => (
        <Modal.Header {...p} />
      ))}
      <Modal.Toolbar>
        {renderPart(
          parts?.search,
          {
            value: query,
            onChange: setQuery,
            label: searchLabel,
            placeholder: searchPlaceholder,
            clearLabel,
          },
          (p) => (
            <div data-part="search" className={styles.search}>
              <TextField
                aria-label={p.label}
                placeholder={p.placeholder}
                value={p.value}
                onChange={p.onChange}
                prefix={<Icon name="search" />}
                clearable
                clearLabel={p.clearLabel}
                autoComplete="off"
              />
            </div>
          ),
        )}
      </Modal.Toolbar>
      <Modal.Body>
        <Columns>
          {shown.map(([section, items]) => (
            <Fragment key={section}>
              {renderPart(
                parts?.section,
                {
                  title: section,
                  headingLevel: (headingLevel + 1) as 2 | 3 | 4 | 5 | 6,
                  children: items.map((item) => (
                    <Fragment key={item.id ?? item.label}>
                      {renderPart(parts?.item, { label: item.label, keys: item.keys, orLabel }, (p) => (
                        <Item {...p} />
                      ))}
                    </Fragment>
                  )),
                },
                (p) => (
                  <Section {...p} />
                ),
              )}
            </Fragment>
          ))}
        </Columns>
        {/* Always in the page, so that a screen reader hears it when the last match goes. */}
        <div role="status" className={styles.status}>
          {shown.length === 0 &&
            renderPart(parts?.empty, { query, children: emptyLabel }, (p) => (
              <div data-part="empty" className={styles.empty}>
                {p.children}
              </div>
            ))}
        </div>
      </Modal.Body>
    </>
  );
}

/**
 * The help overlay: every shortcut of the provider's registry that has a label, with its keys written
 * for the platform, in groups, with a search. Opened by `?` and by the app. A `Modal`: focus stays
 * inside, Escape closes it and focus returns to where it was.
 */
export function ShortcutsSheet({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  shortcut = 'umbra.shortcutsSheet',
  variant = 'dialog',
  side = 'end',
  size = 'lg',
  height = 'auto',
  headingLevel = 2,
  className,
  style,
  ...panel
}: ShortcutsSheetProps) {
  const [isOpen, setOpen] = useOpenState(open, defaultOpen, onOpenChange);
  useShortcut(shortcut ?? undefined, shortcut ? () => setOpen(!isOpen) : undefined);
  return (
    <ModalNameContext value="shortcuts-sheet">
      <Modal.Root
        open={isOpen}
        onOpenChange={setOpen}
        variant={variant}
        side={side}
        size={size}
        height={height}
        headingLevel={headingLevel}
      >
        {trigger && <Modal.Trigger>{trigger}</Modal.Trigger>}
        <Modal.Overlay>
          <Modal.Content {...passThrough(panel)} className={cx(styles.root, className)} style={style}>
            <Panel {...panel} headingLevel={headingLevel} />
          </Modal.Content>
        </Modal.Overlay>
      </Modal.Root>
    </ModalNameContext>
  );
}

ShortcutsSheet.Columns = Columns;
ShortcutsSheet.Section = Section;
ShortcutsSheet.Item = Item;
ShortcutsSheet.Keys = Keys;
