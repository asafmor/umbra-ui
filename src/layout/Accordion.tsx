import {
  createContext,
  createElement,
  Fragment,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Icon, IconSlot } from '../provider/icons';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './Accordion.module.css';
import { ScrollArea } from './ScrollArea';
import { LayoutProvider, useSlot, type SlotProps } from './useSlot';
import { passThrough, type RootAttributes } from '../utils/passThrough';

interface AccordionContextValue {
  open: string[];
  toggle: (id: string) => void;
  /** True when the open section of a single accordion may not be closed. */
  locked: (id: string) => boolean;
  headingLevel: number;
  keepMounted: boolean;
}
const AccordionContext = createContext<AccordionContextValue | null>(null);
function useAccordion() {
  const accordion = useContext(AccordionContext);
  if (!accordion) throw new Error('Accordion blocks must be rendered inside <Accordion.Root>.');
  return accordion;
}

interface SectionContextValue {
  id: string;
  open: boolean;
  disabled: boolean;
  triggerId: string;
  panelId: string;
}
const SectionContext = createContext<SectionContextValue | null>(null);
function useSection() {
  const section = useContext(SectionContext);
  if (!section) throw new Error('Accordion.Header and Accordion.Panel must be inside <Accordion.Section>.');
  return section;
}

interface BlockProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

interface RootBaseProps extends BlockProps, SlotProps, RootAttributes {
  /** May every section be closed? Only matters for `type="single"`; when `false`, the open section stays open. */
  collapsible?: boolean | undefined;
  /** `plain`: rules between the sections. `card`: each section looks like a card. */
  variant?: 'plain' | 'card' | undefined;
  /** Heading level of the section titles. */
  headingLevel?: 2 | 3 | 4 | 5 | 6 | undefined;
  /** Keeps the content of closed sections in the page (hidden), so it keeps its state. */
  keepMounted?: boolean | undefined;
  /** Accessible name of the group of sections. */
  'aria-label'?: string | undefined;
}
interface SingleProps {
  /** `single`: one section open at a time. `multiple`: any number. */
  type: 'single';
  /** The open section (controlled). `null` for none. */
  value?: string | null | undefined;
  defaultValue?: string | null | undefined;
  /** Called with the id of the open section, or `null`. */
  onChange?: ((value: string | null) => void) | undefined;
}
interface MultipleProps {
  /** `single`: one section open at a time. `multiple`: any number. */
  type?: 'multiple' | undefined;
  /** The open sections (controlled). */
  value?: string[] | undefined;
  defaultValue?: string[] | undefined;
  /** Called with the ids of the open sections. */
  onChange?: ((value: string[]) => void) | undefined;
}
export type AccordionRootProps = RootBaseProps & (SingleProps | MultipleProps);

const toList = (value: string | string[] | null | undefined) =>
  value == null ? [] : Array.isArray(value) ? value : [value];

function Root({
  type = 'multiple',
  value,
  defaultValue,
  onChange,
  collapsible = true,
  variant = 'plain',
  headingLevel = 3,
  keepMounted = false,
  'aria-label': ariaLabel,
  className,
  style,
  children,
  ...slot
}: AccordionRootProps) {
  const { ref, props } = useSlot<HTMLDivElement>(slot);
  const [inner, setInner] = useState(() => toList(defaultValue));
  const open = value !== undefined ? toList(value) : inner;
  const single = type === 'single';
  const locked = (id: string) => single && !collapsible && open.includes(id);
  const toggle = (id: string) => {
    if (locked(id)) return;
    const isOpen = open.includes(id);
    const next = single ? (isOpen ? [] : [id]) : isOpen ? open.filter((v) => v !== id) : [...open, id];
    setInner(next);
    if (single) (onChange as SingleProps['onChange'])?.(next[0] ?? null);
    else (onChange as MultipleProps['onChange'])?.(next);
  };

  // Up, Down, Home and End move between the section headers of this accordion (not of one nested in it).
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const root = event.currentTarget;
    const from = (event.target as HTMLElement).closest<HTMLElement>('[data-accordion-trigger]');
    if (!from) return;
    const triggers = [...root.querySelectorAll<HTMLButtonElement>('[data-accordion-trigger]')].filter(
      (t) => !t.disabled && t.closest('[data-umbra="accordion"]') === root,
    );
    const index = triggers.indexOf(from as HTMLButtonElement);
    const next = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: triggers.length - 1 }[event.key];
    if (index < 0 || next === undefined) return;
    event.preventDefault();
    triggers[Math.max(0, Math.min(triggers.length - 1, next))]?.focus();
  };

  return (
    <div
      {...passThrough(slot)}
      {...props}
      ref={ref}
      role={ariaLabel ? 'group' : undefined}
      aria-label={ariaLabel}
      data-umbra="accordion"
      data-variant={variant}
      data-type={type}
      className={cx(styles.root, className)}
      style={{ ...props.style, ...style }}
      onKeyDown={onKeyDown}
    >
      {/* Layout children inside a panel belong to the accordion, not to the Stack or Columns around it. */}
      <LayoutProvider value={null}>
        <AccordionContext value={{ open, toggle, locked, headingLevel, keepMounted }}>
          {children}
        </AccordionContext>
      </LayoutProvider>
    </div>
  );
}

export interface AccordionSectionProps extends BlockProps {
  /** Identifies the section in `value`. */
  id: string;
  disabled?: boolean | undefined;
}

/** One section: holds a `Header` and a `Panel`. */
function Section({ id, disabled = false, className, style, children }: AccordionSectionProps) {
  const accordion = useAccordion();
  const base = useId();
  const open = accordion.open.includes(id);
  return (
    <SectionContext value={{ id, open, disabled, triggerId: `${base}t`, panelId: `${base}p` }}>
      <div
        data-part="item"
        data-open={open || undefined}
        data-disabled={disabled || undefined}
        className={cx(styles.item, className)}
        style={style}
      >
        {children}
      </div>
    </SectionContext>
  );
}

export interface AccordionHeaderProps extends BlockProps {
  /** Leading icon. */
  icon?: ReactNode | undefined;
  title?: ReactNode | undefined;
  /** Second line under the title. */
  subtitle?: ReactNode | undefined;
  /** A short value or status at the end of the header. Hides when the section is narrow. */
  meta?: ReactNode | undefined;
  /** Controls at the end of the header. They do not toggle the section. */
  actions?: ReactNode | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        title?: Part<{ children: ReactNode }> | undefined;
        meta?: Part<{ children: ReactNode }> | undefined;
        actions?: Part<{ children: ReactNode }> | undefined;
        chevron?: Part | undefined;
      }
    | undefined;
}

/** The header of a section: a button inside a heading. `children` replace the default content of the button. */
function Header({
  icon,
  title,
  subtitle,
  meta,
  actions,
  parts,
  className,
  style,
  children,
}: AccordionHeaderProps) {
  const accordion = useAccordion();
  const section = useSection();
  return (
    <div data-part="header" className={cx(styles.header, className)} style={style}>
      {createElement(
        `h${accordion.headingLevel}`,
        { className: styles.heading },
        <button
          type="button"
          id={section.triggerId}
          data-accordion-trigger=""
          className={styles.trigger}
          aria-expanded={section.open}
          aria-controls={section.panelId}
          // The open section of a single accordion that may not close all: pressing it does nothing.
          aria-disabled={accordion.locked(section.id) || undefined}
          disabled={section.disabled}
          onClick={() => accordion.toggle(section.id)}
        >
          {children ?? (
            <>
              {icon && <IconSlot part="icon">{icon}</IconSlot>}
              <span className={styles.titles}>
                {renderPart(parts?.title, { children: title }, (p) => (
                  <span data-part="title" className={styles.title}>
                    {p.children}
                  </span>
                ))}
                {subtitle && (
                  <span data-part="subtitle" className={styles.subtitle}>
                    {subtitle}
                  </span>
                )}
              </span>
            </>
          )}
        </button>,
      )}
      {meta != null &&
        renderPart(parts?.meta, { children: meta }, (p) => (
          <div data-part="meta" className={styles.meta}>
            {p.children}
          </div>
        ))}
      {actions != null &&
        renderPart(parts?.actions, { children: actions }, (p) => (
          <div data-part="actions" className={styles.actions}>
            {p.children}
          </div>
        ))}
      {renderPart(parts?.chevron, {}, () => (
        <span data-part="chevron" className={styles.chevron}>
          <Icon name="chevronDown" />
        </span>
      ))}
    </div>
  );
}

export interface AccordionPanelProps extends BlockProps {
  /** `none` for edge-to-edge content. */
  padding?: 'default' | 'none' | undefined;
}

/**
 * The content of a section. Opening and closing animate its height in CSS (see Accordion.module.css);
 * when the accordion has less height than its open panels need, the panel scrolls inside.
 */
function Panel({ padding = 'default', className, style, children }: AccordionPanelProps) {
  const { keepMounted } = useAccordion();
  const { open, panelId, triggerId } = useSection();
  const grid = useRef<HTMLDivElement>(null);
  // The content stays in the page while the panel closes, and leaves when the transition has ended.
  const [present, setPresent] = useState(open);
  if (open && !present) setPresent(true);
  useLayoutEffect(() => {
    if (open || keepMounted) return;
    let current = true;
    // Asking for the animations starts the close transition. With none (reduced motion) this ends at once.
    const running = grid.current?.getAnimations().map((a) => a.finished) ?? [];
    void Promise.allSettled(running).then(() => current && setPresent(false));
    return () => {
      current = false;
    };
  }, [open, keepMounted]);

  return (
    <ScrollArea data-part="panel" className={styles.panel}>
      <div ref={grid} className={styles.grid}>
        <div className={styles.clip}>
          <div
            role="region"
            id={panelId}
            aria-labelledby={triggerId}
            data-part="content"
            data-padding={padding}
            className={cx(styles.content, className)}
            style={style}
          >
            {(keepMounted || open || present) && children}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

export interface AccordionItemProps
  extends
    AccordionSectionProps,
    Pick<AccordionHeaderProps, 'icon' | 'title' | 'subtitle' | 'meta' | 'actions'> {
  /** Overrides the padding of the panel. */
  padding?: 'default' | 'none' | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        header?: Part<AccordionHeaderProps> | undefined;
        title?: Part<{ children: ReactNode }> | undefined;
        meta?: Part<{ children: ReactNode }> | undefined;
        actions?: Part<{ children: ReactNode }> | undefined;
        chevron?: Part | undefined;
        panel?: Part<AccordionPanelProps> | undefined;
      }
    | undefined;
  /** The content of the section. */
  children?: ReactNode | undefined;
}

/** One complete section: a header and a panel. */
function Item({
  icon,
  title,
  subtitle,
  meta,
  actions,
  padding,
  parts,
  children,
  ...section
}: AccordionItemProps) {
  const { header, panel, ...headerParts } = parts ?? {};
  return (
    <Section {...section}>
      {renderPart(header, { icon, title, subtitle, meta, actions, parts: headerParts }, (p) => (
        <Header {...p} />
      ))}
      {renderPart(panel, { padding, children }, (p) => (
        <Panel {...p} />
      ))}
    </Section>
  );
}

/** One section of the `items` prop. */
export interface AccordionItemData extends Omit<AccordionItemProps, 'children' | 'className' | 'style'> {
  /** The content of the section. */
  content: ReactNode;
}

export type AccordionProps = AccordionRootProps & {
  /** The sections. Or pass `Accordion.Item` elements as children. */
  items?: AccordionItemData[] | undefined;
  /** Replace or hide named pieces. `item` applies to every section built from `items`. */
  parts?: { item?: Part<AccordionItemProps> | undefined } | undefined;
};

/** A stack of sections that open and close. It fills its slot; an open panel scrolls inside when space is short. */
export function Accordion({ items, parts, children, ...root }: AccordionProps) {
  return (
    <Root {...(root as AccordionRootProps)}>
      {items?.map(({ content, ...item }) => (
        <Fragment key={item.id}>
          {renderPart(parts?.item, { ...item, children: content }, (p) => (
            <Item {...p} />
          ))}
        </Fragment>
      ))}
      {children}
    </Root>
  );
}

Accordion.Root = Root;
Accordion.Item = Item;
Accordion.Section = Section;
Accordion.Header = Header;
Accordion.Panel = Panel;
