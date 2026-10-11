import { Children, isValidElement, useState, type CSSProperties, type ReactNode } from 'react';
import { cx, renderPart, type Part } from '../utils/parts';
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
import styles from './SubNav.module.css';

interface BlockProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

function Label({ className, style, children }: BlockProps) {
  return (
    <strong data-part="label" className={cx(styles.label, className)} style={style}>
      {children}
    </strong>
  );
}

function End({ className, style, children }: BlockProps) {
  return (
    <div data-part="end" className={cx(styles.end, className)} style={style}>
      {children}
    </div>
  );
}

export interface SubNavRootProps extends NavRootProps {
  /** Replace or hide named pieces. */
  parts?:
    | { indicator?: Part | undefined; more?: Part<{ label: string; children: ReactNode }> | undefined }
    | undefined;
}

interface FrameProps extends SubNavRootProps {
  label: ReactNode;
  end: ReactNode;
}

function Frame({ 'aria-label': ariaLabel = 'Section', label, end, className, style, ...list }: FrameProps) {
  // Shrink order: the end slot first (its ShortcutBar sheds labels, then chips), then items into "More",
  // then the label hides.
  const [labelHidden, setLabelHidden] = useState(false);
  return (
    <nav
      aria-label={ariaLabel}
      data-umbra="sub-nav"
      className={cx(navClass('sub', className), styles.root)}
      style={style}
    >
      {!labelHidden && label}
      <NavList {...list} extraSteps={label ? 1 : 0} onExtraSteps={(count) => setLabelHidden(count > 0)} />
      {end}
    </nav>
  );
}

function Root({ children, ...frame }: SubNavRootProps) {
  const all = Children.toArray(children);
  const is = (type: unknown) => (child: ReactNode) => isValidElement(child) && child.type === type;
  return (
    <Frame {...frame} label={all.find(is(Label))} end={all.find(is(End))}>
      {all.filter((child) => !is(Label)(child) && !is(End)(child))}
    </Frame>
  );
}

export interface SubNavProps extends Omit<SubNavRootProps, 'children' | 'parts'> {
  /** The section name. */
  label?: ReactNode | undefined;
  /** The pages of the section. Same shape as `PrimaryNav`. */
  items?: NavItem[] | undefined;
  /** Free slot at the end, normally a `ShortcutBar`. Its content is never clipped. */
  end?: ReactNode | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | (SubNavRootProps['parts'] & {
        label?: Part<{ children: ReactNode }> | undefined;
        item?: Part<NavItemProps> | undefined;
        end?: Part<{ children: ReactNode }> | undefined;
      })
    | undefined;
}

/** The second bar: the pages of the current section, and room for shortcuts at the end. */
export function SubNav({ label, items, end, parts, ...root }: SubNavProps) {
  return (
    <Frame
      {...root}
      parts={parts}
      label={renderPart(parts?.label, { children: label }, (p) => p.children && <Label>{p.children}</Label>)}
      end={renderPart(parts?.end, { children: end }, (p) => p.children && <End>{p.children}</End>)}
    >
      {itemsToElements(items, parts?.item)}
    </Frame>
  );
}

SubNav.Root = Root;
SubNav.Label = Label;
SubNav.Item = Item;
SubNav.Menu = Menu;
SubNav.End = End;
