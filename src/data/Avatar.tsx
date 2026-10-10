import {
  Children,
  createContext,
  useContext,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { useShrinkLevel } from '../internal/useShrinkLevel';
import { RawIcon } from '../provider/icons';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './Avatar.module.css';
import { initialsOf } from './entity';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarShape = 'circle' | 'square';

/** Lets an `AvatarGroup` give its avatars one size and shape. */
const GroupContext = createContext<{ size?: AvatarSize; shape?: AvatarShape } | null>(null);

interface BlockProps {
  className?: string;
  style?: CSSProperties;
}

export interface AvatarRootProps extends BlockProps {
  /** Fixed size. Without it the avatar is as tall as a control, so it follows the density level. */
  size?: AvatarSize;
  shape?: AvatarShape;
  /** A ring around the avatar: `true` for the accent colour, or any CSS colour. */
  ring?: boolean | string;
  children?: ReactNode;
}

function Root({ size, shape, ring, className, style, children }: AvatarRootProps) {
  const group = useContext(GroupContext);
  return (
    <span
      data-umbra="avatar"
      data-size={size ?? group?.size ?? 'density'}
      data-shape={shape ?? group?.shape ?? 'circle'}
      data-ring={ring ? '' : undefined}
      data-in-group={group ? '' : undefined}
      className={cx(styles.root, className)}
      style={{ ...(typeof ring === 'string' && { ['--ring' as string]: ring }), ...style }}
    >
      {children}
    </span>
  );
}

export interface AvatarImageProps extends BlockProps {
  src: string;
  /** What the image shows. Empty when the name is written next to the avatar. */
  alt: string;
  /** Called when the image cannot be loaded. */
  onError?: () => void;
}

function Image({ src, alt, onError, className, style }: AvatarImageProps) {
  return (
    <img
      data-part="image"
      src={src}
      alt={alt}
      draggable={false}
      onError={onError}
      className={cx(styles.media, className)}
      style={style}
    />
  );
}

export interface AvatarFallbackProps extends BlockProps {
  /** Accessible name. Without it the fallback is decorative. */
  label?: string;
  children?: ReactNode;
}

const named = (label: string | undefined) =>
  label ? ({ role: 'img', 'aria-label': label } as const) : ({ 'aria-hidden': true } as const);

function Initials({ label, className, style, children }: AvatarFallbackProps) {
  return (
    <span data-part="initials" {...named(label)} className={cx(styles.media, className)} style={style}>
      {children}
    </span>
  );
}

function Fallback({ label, className, style, children }: AvatarFallbackProps) {
  return (
    <span data-part="fallback" {...named(label)} className={cx(styles.media, className)} style={style}>
      {children ?? <RawIcon name="user" />}
    </span>
  );
}

function Status({ className, style, children }: BlockProps & { children?: ReactNode }) {
  return (
    <span data-part="status" className={cx(styles.status, className)} style={style}>
      {children}
    </span>
  );
}

export interface AvatarProps extends Omit<AvatarRootProps, 'children'> {
  /** The image. When it is missing or fails to load, the initials or the silhouette show instead. */
  src?: string;
  /** Accessible name. Defaults to `name`. Pass `""` when the name is written next to the avatar. */
  alt?: string;
  /** The person or entity. Gives the initials shown without an image. */
  name?: string;
  /** Replaces the silhouette shown when there is no image and no name. */
  fallbackIcon?: ReactNode;
  /** A small node at the corner, for example a status dot. */
  status?: ReactNode;
  /** Replace or hide named pieces. */
  parts?: {
    image?: Part<AvatarImageProps>;
    initials?: Part<AvatarFallbackProps>;
    fallback?: Part<AvatarFallbackProps>;
    status?: Part<{ children: ReactNode }>;
  };
}

/** A person or entity: its image, or its initials, or a silhouette. */
export function Avatar({ src, alt, name, fallbackIcon, status, parts, ...root }: AvatarProps) {
  // Remembering which address failed shows a new `src` again without an effect.
  const [failed, setFailed] = useState<string>();
  const label = alt ?? name;
  const initials = name ? initialsOf(name) : '';
  return (
    <Root {...root}>
      {src && failed !== src
        ? renderPart(parts?.image, { src, alt: label ?? '', onError: () => setFailed(src) }, (p) => (
            <Image {...p} />
          ))
        : initials
          ? renderPart(parts?.initials, { label, children: initials }, (p) => <Initials {...p} />)
          : renderPart(parts?.fallback, { label, children: fallbackIcon }, (p) => <Fallback {...p} />)}
      {status != null &&
        status !== false &&
        renderPart(parts?.status, { children: status }, (p) => <Status>{p.children}</Status>)}
    </Root>
  );
}

Avatar.Root = Root;
Avatar.Image = Image;
Avatar.Initials = Initials;
Avatar.Fallback = Fallback;
Avatar.Status = Status;

export interface AvatarGroupRootProps extends BlockProps {
  /** Size and shape of every avatar in the group. */
  size?: AvatarSize;
  shape?: AvatarShape;
  /** Names the group for assistive technology. */
  'aria-label'?: string;
  ref?: React.Ref<HTMLDivElement>;
  children?: ReactNode;
}

function GroupRoot({
  size,
  shape,
  'aria-label': ariaLabel,
  ref,
  className,
  style,
  children,
}: AvatarGroupRootProps) {
  return (
    <div
      ref={ref}
      role="group"
      aria-label={ariaLabel}
      data-umbra="avatar-group"
      className={cx(styles.group, className)}
      style={style}
    >
      <GroupContext value={{ size, shape }}>{children}</GroupContext>
    </div>
  );
}

export interface AvatarGroupOverflowProps extends BlockProps {
  /** How many avatars are not shown. */
  count: number;
  /** Accessible name. */
  label: string;
}

function Overflow({ count, label, className, style }: AvatarGroupOverflowProps) {
  return (
    <Root className={className} style={style}>
      <span data-part="overflow" role="img" aria-label={label} className={styles.media}>
        +{count}
      </span>
    </Root>
  );
}

export interface AvatarGroupProps extends Omit<AvatarGroupRootProps, 'ref'> {
  /** The avatars. */
  children?: ReactNode;
  /** Shows at most this many avatars; the rest are counted in "+N". Fewer show when the group is narrow. */
  max?: number;
  /** The number of members, when it is larger than the number of avatars given. */
  total?: number;
  /** Accessible name of the "+N" counter. */
  moreLabel?: (count: number) => string;
  /** Replace or hide named pieces. */
  parts?: {
    overflow?: Part<AvatarGroupOverflowProps>;
  };
}

/** A row of overlapping avatars. Those that do not fit are counted in a "+N" at the end. */
export function AvatarGroup({
  children,
  max,
  total,
  moreLabel = (count) => `${count} more`,
  parts,
  ...root
}: AvatarGroupProps) {
  const ref = useRef<HTMLDivElement>(null);
  const avatars = Children.toArray(children);
  const limit = Math.min(avatars.length, Math.max(1, max ?? avatars.length));
  // One avatar fewer per level; the first one always stays.
  const level = useShrinkLevel(ref, limit - 1, `${avatars.length}/${limit}/${total}`);
  const shown = limit - level;
  const hidden = Math.max(total ?? 0, avatars.length) - shown;
  return (
    <GroupRoot {...root} ref={ref}>
      {avatars.slice(0, shown)}
      {hidden > 0 &&
        renderPart(parts?.overflow, { count: hidden, label: moreLabel(hidden) }, (p) => <Overflow {...p} />)}
    </GroupRoot>
  );
}

AvatarGroup.Root = GroupRoot;
AvatarGroup.Overflow = Overflow;
