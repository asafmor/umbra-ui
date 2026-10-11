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
import { passThrough } from '../utils/passThrough';

export interface PrimaryNavRootProps extends NavRootProps {
  /** Replace or hide named pieces. */
  parts?:
    | { indicator?: Part | undefined; more?: Part<{ label: string; children: ReactNode }> | undefined }
    | undefined;
}

function Root({ 'aria-label': label = 'Main', className, style, ...list }: PrimaryNavRootProps) {
  return (
    <nav
      {...passThrough(list)}
      aria-label={label}
      data-umbra="primary-nav"
      className={navClass('primary', className)}
      style={style}
    >
      <NavList {...list} />
    </nav>
  );
}

export interface PrimaryNavProps extends Omit<PrimaryNavRootProps, 'children' | 'parts'> {
  /** The top-level sections. `items` inside an item makes a dropdown. */
  items?: NavItem[] | undefined;
  /** Replace or hide named pieces. An `item` function receives each item's props. */
  parts?: (PrimaryNavRootProps['parts'] & { item?: Part<NavItemProps> | undefined }) | undefined;
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
