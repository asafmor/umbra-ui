// The two pieces of a menu row that a `Button` also draws when it is shown as a row of an overflow
// menu. They live apart from `Menu`, so that importing `Button` does not bring the menu with it.
import styles from '../overlays/Menu.module.css';
import { RawIcon } from '../provider/icons';
import { useShortcut } from '../provider/UmbraProvider';
import { renderPart, type Part } from '../utils/parts';

/** Internal: the keys of a shortcut, at the end of a row. */
export function Hint({ id }: { id: string }) {
  const keys = useShortcut(id, undefined);
  return keys ? (
    <kbd data-part="hint" className={styles.hint}>
      {keys}
    </kbd>
  ) : null;
}

/** Internal: the mark of a checked row. Also used by buttons shown as rows of an overflow menu. */
export function CheckMark({ shown, part }: { shown: boolean; part?: Part }) {
  return (
    <span data-part="check" className={styles.check} aria-hidden="true">
      {shown && renderPart(part, {}, () => <RawIcon name="check" />)}
    </span>
  );
}
