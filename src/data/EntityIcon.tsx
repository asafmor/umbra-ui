import { useState, type CSSProperties, type ReactNode } from 'react';
import { cx, renderPart, type Part } from '../utils/parts';
import { colourOf, initialsOf } from './entity';
import styles from './EntityIcon.module.css';

export type EntityIconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type EntityIconShape = 'rounded' | 'circle' | 'square';

interface BlockProps {
  className?: string;
  style?: CSSProperties;
}

export interface EntityIconRootProps extends BlockProps {
  /** Fixed size of the mark. Without it the mark follows the size of the text around it. */
  size?: EntityIconSize;
  shape?: EntityIconShape;
  children?: ReactNode;
}

function Root({ size, shape = 'rounded', className, style, children }: EntityIconRootProps) {
  return (
    <span
      data-umbra="entity-icon"
      data-size={size ?? 'text'}
      data-shape={shape}
      className={cx(styles.root, className)}
      style={style}
    >
      {children}
    </span>
  );
}

export interface EntityIconMarkProps extends BlockProps {
  /** Accessible name. Without it the mark is decorative, as it is next to a visible label. */
  label?: string;
  /** `image` and `icon` show the node as it is; `generated` is the coloured square with letters. */
  kind?: 'image' | 'icon' | 'generated';
  /** Background of a generated mark. White text must keep 4.5:1 on it. */
  color?: string;
  children?: ReactNode;
}

function Mark({ label, kind = 'icon', color, className, style, children }: EntityIconMarkProps) {
  return (
    <span
      data-part="mark"
      data-kind={kind}
      data-letters={typeof children === 'string' ? children.length : undefined}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      className={cx(styles.mark, className)}
      style={{ ...(color && { ['--generated' as string]: color }), ...style }}
    >
      {children}
    </span>
  );
}

function Label({ className, style, children }: BlockProps & { children?: ReactNode }) {
  return (
    <span data-part="label" className={cx(styles.label, className)} style={style}>
      {children}
    </span>
  );
}

export interface EntityIconProps extends Omit<EntityIconRootProps, 'children'> {
  /** An image: a logo or a flag. When it is missing or fails to load, `icon` or the generated mark shows. */
  src?: string;
  /** An icon node, used when there is no image. */
  icon?: ReactNode;
  /** The entity. Names the mark, and gives the letters and colour of the generated mark. */
  name?: string;
  /** Accessible name of the mark, when it differs from `name`. */
  alt?: string;
  /** Text shown next to the mark, truncated when it does not fit. `true` shows `name`. */
  label?: ReactNode;
  /** Letters in the generated mark. Default: 1 up to `sm`, 2 from `md`. */
  letters?: 1 | 2;
  /** Background of the generated mark, in place of the colour derived from `name`. White text must keep 4.5:1 on it. */
  color?: string;
  /** Replace or hide named pieces. */
  parts?: {
    mark?: Part<EntityIconMarkProps>;
    label?: Part<{ children: ReactNode }>;
  };
}

/** A small mark for an entity (a logo, a flag, a category glyph), with an optional name next to it. */
export function EntityIcon({ src, icon, name, alt, label, letters, color, parts, ...root }: EntityIconProps) {
  // Remembering which address failed shows a new `src` again without an effect.
  const [failed, setFailed] = useState<string>();
  const text = label === true ? name : label;
  const hasText = text != null && text !== false;
  const big = root.size === 'md' || root.size === 'lg' || root.size === 'xl';
  const mark: EntityIconMarkProps =
    src && failed !== src
      ? { kind: 'image', children: <img src={src} alt="" draggable={false} onError={() => setFailed(src)} /> }
      : icon
        ? { kind: 'icon', children: icon }
        : {
            kind: 'generated',
            color: color ?? colourOf(name ?? ''),
            children: initialsOf(name ?? '', letters ?? (big ? 2 : 1)),
          };
  return (
    <Root {...root}>
      {renderPart(parts?.mark, { ...mark, label: hasText ? undefined : (alt ?? name) }, (p) => (
        <Mark {...p} />
      ))}
      {hasText && renderPart(parts?.label, { children: text }, (p) => <Label>{p.children}</Label>)}
    </Root>
  );
}

EntityIcon.Root = Root;
EntityIcon.Mark = Mark;
EntityIcon.Label = Label;
