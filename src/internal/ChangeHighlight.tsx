import type { ReactNode } from 'react';
import styles from './ChangeHighlight.module.css';
import { useChangeHighlight } from './useChangeHighlight';

/** The props of a value block that can highlight its changes. The same on every component that has them. */
export interface ChangeHighlightProps {
  /**
   * A changed value flashes softly once: green when a number rose, red when it fell, neutral otherwise.
   * A sign shows the direction without colour. No flash under reduced motion; the sign stays. The value
   * is never counted up or down.
   */
  highlightChanges?: boolean;
  /** What is compared, when the content is not the value itself (a formatted text). Default: the content, when it is text or a number. */
  changeValue?: unknown;
  /** What a screen reader hears with the sign of a value that rose or fell. */
  increasedLabel?: string;
  decreasedLabel?: string;
}

const comparable = (node: unknown) =>
  typeof node === 'string' || typeof node === 'number' ? node : undefined;

function Mark({
  value,
  increasedLabel = 'increased',
  decreasedLabel = 'decreased',
}: {
  value: unknown;
  increasedLabel?: string;
  decreasedLabel?: string;
}) {
  const { direction, stamp } = useChangeHighlight(value);
  if (!direction) return null;
  return (
    <>
      <span
        key={stamp}
        aria-hidden="true"
        data-part="changeFlash"
        data-direction={direction}
        className={styles.flash}
      />
      {direction !== 'neutral' && (
        <span data-part="changeSign" data-direction={direction} className={styles.sign}>
          <span aria-hidden="true">{direction === 'up' ? '▲' : '▼'}</span>
          <span className={styles.srOnly}>{direction === 'up' ? increasedLabel : decreasedLabel}</span>
        </span>
      )}
    </>
  );
}

/**
 * The flash and the sign of a changed value. A value block renders it before its content, and spreads
 * `changeHost(props)` on its element, which the flash covers.
 */
export function ChangeHighlight({
  highlightChanges,
  changeValue,
  increasedLabel,
  decreasedLabel,
  children,
}: ChangeHighlightProps & { children?: ReactNode }) {
  if (!highlightChanges) return null;
  return (
    <Mark
      value={changeValue !== undefined ? changeValue : comparable(children)}
      increasedLabel={increasedLabel}
      decreasedLabel={decreasedLabel}
    />
  );
}

/** The attribute of the element the flash covers. */
export const changeHost = (props: ChangeHighlightProps) =>
  props.highlightChanges ? { 'data-umbra-change': '' } : undefined;

/** Splits the change props off the props of an all-in-one component. */
export function splitChange<P extends ChangeHighlightProps>(props: P) {
  const { highlightChanges, changeValue, increasedLabel, decreasedLabel, ...rest } = props;
  return [
    { highlightChanges, changeValue, increasedLabel, decreasedLabel } as ChangeHighlightProps,
    rest,
  ] as const;
}
