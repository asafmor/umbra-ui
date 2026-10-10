import { useContext, type CSSProperties, type ReactNode } from 'react';
import { TabStrip } from '../inputs/Tabs';
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
  // Outside tab mode there is no tab state, whatever the list still holds from before.
  const tabState = layout.value.tabs;
  const tabs = (tabState ? layout.tabList : []).map((tab, index) => {
    if (!tab.label) warn('a child of <Columns> has no `label` (or title) for its tab.');
    return {
      id: tab.id,
      label: tab.label ?? String(index + 1),
      selected: tab.id === layout.activeId,
      tabId: tabState!.tabId(tab.id),
      panelId: tabState!.panelId(tab.id),
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
            // The strip is the one `Tabs` draws, so it looks, moves and shrinks the same way.
            <div data-part="tabs" className={styles.tabs}>
              <TabStrip {...p} label={tabsLabel} />
            </div>
          ))}
        {children}
      </div>
    </LayoutProvider>
  );
}
