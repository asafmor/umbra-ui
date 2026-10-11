// What the four meters share: the label block, and what a `MeterList` tells the meters inside it.
import { createContext, useContext, useRef, type CSSProperties, type ReactNode } from 'react';
import { Label as AriaLabel } from 'react-aria-components';
import { useTruncatedTip } from '../internal/TruncatedText';

/** True inside a `MeterList`: the meter lays its label, bar and value out on the list's columns. */
const MeterListContext = createContext(false);
export const MeterListProvider = MeterListContext.Provider;
export const useInMeterList = () => useContext(MeterListContext);

/**
 * The name of a meter. Cut with an ellipsis when it does not fit, and then its whole text is in a
 * tooltip. While the meter loads its root is no meter, so there is nothing to label: a plain element.
 */
export function MeterLabel({
  loading,
  children,
  className,
  style,
}: {
  loading: boolean;
  children?: ReactNode | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}) {
  const ref = useRef<HTMLLabelElement>(null);
  const tip = useTruncatedTip(ref, children);
  const props = { ref, 'data-part': 'label', className, style };
  return (
    <>
      {loading ? (
        <span {...props} ref={ref as never}>
          {children}
        </span>
      ) : (
        <AriaLabel {...props}>{children}</AriaLabel>
      )}
      {tip}
    </>
  );
}

/**
 * For the tooltip of a meter's value: not while the pointer is on a label that is cut, whose own
 * tooltip shows its text. One tooltip shows at a time, and there the label's is the one wanted.
 */
export const notOnCutLabel = (root: HTMLElement) => {
  const label = root.querySelector<HTMLElement>(':scope > [data-part="label"]:hover');
  return !label || label.scrollWidth <= label.clientWidth;
};
