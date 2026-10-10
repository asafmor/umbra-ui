import type { ReactNode } from 'react';
import type { Part } from '../utils/parts';
import {
  Item,
  itemsToElements,
  Menu,
  navClass,
  NavList,
  type NavItem,
  type NavItemProps,
  type NavRootProps,
} from './nav';

export interface PrimaryNavRootProps extends NavRootProps {
  /** Replace or hide named pieces. */
  parts?: { indicator?: Part; more?: Part<{ label: string; children: ReactNode }> };
}

function Root({ 'aria-label': label = 'Main', className, style, ...list }: PrimaryNavRootProps) {
  return (
    <nav aria-label={label} data-umbra="primary-nav" className={navClass('primary', className)} style={style}>
      <NavList {...list} />
    </nav>
  );
}

export interface PrimaryNavProps extends Omit<PrimaryNavRootProps, 'children' | 'parts'> {
  /** The top-level sections. `items` inside an item makes a dropdown. */
  items?: NavItem[];
  /** Replace or hide named pieces. An `item` function receives each item's props. */
  parts?: PrimaryNavRootProps['parts'] & { item?: Part<NavItemProps> };
}

/** The top-level sections of the app, inside the `TopBar`. */
export function PrimaryNav({ items, parts, ...root }: PrimaryNavProps) {
  return (
    <Root {...root} parts={parts}>
      {itemsToElements(items, parts?.item)}
    </Root>
  );
}

PrimaryNav.Root = Root;
PrimaryNav.Item = Item;
PrimaryNav.Menu = Menu;
