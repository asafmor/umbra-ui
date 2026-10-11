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
const GroupContext = createContext<{ size?: AvatarSize | undefined; shape?: AvatarShape | undefined } | null>(
  null,
);

interface BlockProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

export interface AvatarRootProps extends BlockProps {
  /** Fixed size. Without it the avatar is as tall as a control, so it follows the density level. */
  size?: AvatarSize | undefined;
  shape?: AvatarShape | undefined;
  /** A ring around the avatar: `true` for the accent colour, or any CSS colour. */
  ring?: boolean | string | undefined;
  children?: ReactNode | undefined;
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
  onError?: (() => void) | undefined;
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
  label?: string | undefined;
  children?: ReactNode | undefined;
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

function Status({ className, style, children }: BlockProps & { children?: ReactNode | undefined }) {
  return (
    <span data-part="status" className={cx(styles.status, className)} style={style}>
      {children}
    </span>
  );
}

export interface AvatarProps extends Omit<AvatarRootProps, 'children'> {
  /** The image. When it is missing or fails to load, the initials or the silhouette show instead. */
  src?: string | undefined;
  /** Accessible name. Defaults to `name`. Pass `""` when the name is written next to the avatar. */
  alt?: string | undefined;
  /** The person or entity. Gives the initials shown without an image. */
  name?: string | undefined;
  /** Replaces the silhouette shown when there is no image and no name. */
  fallbackIcon?: ReactNode | undefined;
  /** A small node at the corner, for example a status dot. */
  status?: ReactNode | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        image?: Part<AvatarImageProps> | undefined;
        initials?: Part<AvatarFallbackProps> | undefined;
        fallback?: Part<AvatarFallbackProps> | undefined;
        status?: Part<{ children: ReactNode }> | undefined;
      }
    | undefined;
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
  size?: AvatarSize | undefined;
  shape?: AvatarShape | undefined;
  /** Names the group for assistive technology. */
  'aria-label'?: string | undefined;
  ref?: React.Ref<HTMLDivElement> | undefined;
  children?: ReactNode | undefined;
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
  children?: ReactNode | undefined;
  /** Shows at most this many avatars; the rest are counted in "+N". Fewer show when the group is narrow. */
  max?: number | undefined;
  /** The number of members, when it is larger than the number of avatars given. */
  total?: number | undefined;
  /** Accessible name of the "+N" counter. */
  moreLabel?: ((count: number) => string) | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        overflow?: Part<AvatarGroupOverflowProps> | undefined;
      }
    | undefined;
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
