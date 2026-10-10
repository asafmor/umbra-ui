import { useContext, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { warn } from '../utils/dev';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './layout.module.css';
import { LayoutProvider, NarrowContext, useLayoutParent, useSlot, type SlotProps } from './useSlot';
import { gapStyle, type SpaceToken } from './Stack';

/** Props of the default tab strip, passed to a `tabs` part function. */
export interface ColumnsTabsProps {
  tabs: { id: string; label: string; selected: boolean; tabId: string; panelId: string }[];
  onSelect: (id: string) => void;
}

export interface ColumnsProps extends SlotProps {
  /** Overrides the gap, which otherwise follows the density level. */
  gap?: SpaceToken;
  /** Below the minimum window: `tabs` shows one child at a time, `keep` keeps the columns. */
  narrow?: 'tabs' | 'keep';
  /** Replace or hide named pieces. */
  parts?: { tabs?: Part<ColumnsTabsProps> };
  /** Accessible name of the tab strip. */
  tabsLabel?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

function Tabs({ tabs, onSelect, label }: ColumnsTabsProps & { label: string }) {
  // The tabs pattern: one tab stop, arrow keys move and select.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = tabs.findIndex((t) => t.selected);
    const next = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 }[event.key];
    const target = next === undefined ? undefined : tabs[(next + tabs.length) % tabs.length];
    if (!target) return;
    event.preventDefault();
    onSelect(target.id);
    document.getElementById(target.tabId)?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className={styles.tabs} data-part="tabs" onKeyDown={onKeyDown}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          id={tab.tabId}
          aria-selected={tab.selected}
          aria-controls={tab.panelId}
          tabIndex={tab.selected ? 0 : -1}
          className={styles.tab}
          onClick={() => onSelect(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/** Shares its width among its children. Below the minimum window it shows one child at a time. */
export function Columns({
  gap,
  narrow = 'tabs',
  parts,
  tabsLabel = 'Columns',
  className,
  style,
  children,
  ...slot
}: ColumnsProps) {
  const { ref, props } = useSlot<HTMLDivElement>(slot);
  const tabMode = useContext(NarrowContext) && narrow === 'tabs';
  const layout = useLayoutParent(ref, { tabs: tabMode });
  const tabs = layout.tabList.map((tab, index) => {
    if (!tab.label) warn('a child of <Columns> has no `label` (or title) for its tab.');
    return {
      id: tab.id,
      label: tab.label ?? String(index + 1),
      selected: tab.id === layout.activeId,
      tabId: layout.value.tabs!.tabId(tab.id),
      panelId: layout.value.tabs!.panelId(tab.id),
    };
  });
  return (
    <LayoutProvider value={layout.value}>
      <div
        {...props}
        ref={ref}
        data-umbra="columns"
        data-tab-mode={tabMode || undefined}
        className={cx(styles.slot, styles.columns, className)}
        style={{ ...props.style, ...gapStyle(gap), ...style }}
      >
        {tabMode &&
          renderPart(parts?.tabs, { tabs, onSelect: layout.select }, (p) => (
            <Tabs {...p} label={tabsLabel} />
          ))}
        {children}
      </div>
    </LayoutProvider>
  );
}
