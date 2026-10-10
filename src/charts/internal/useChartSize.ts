import { useLayoutEffect, useState, type RefObject } from 'react';
import { flushSync } from 'react-dom';

export interface ChartSize {
  width: number;
  height: number;
  /** The element's font size in pixels: label widths are estimated from it. */
  fontSize: number;
}

const none: ChartSize = { width: 0, height: 0, fontSize: 13 };

/**
 * The size of an element, kept up to date by a ResizeObserver. Every chart draws from this instead of
 * a fixed pixel size. The first measurement and every later one land before the browser paints, so no
 * frame shows a chart drawn for another size.
 */
export function useChartSize(element: RefObject<HTMLElement | null>): ChartSize {
  const [size, setSize] = useState(none);
  useLayoutEffect(() => {
    const el = element.current;
    if (!el) return;
    const measure = () => {
      const next = {
        width: el.clientWidth,
        height: el.clientHeight,
        fontSize: parseFloat(getComputedStyle(el).fontSize) || none.fontSize,
      };
      setSize((old) =>
        old.width === next.width && old.height === next.height && old.fontSize === next.fontSize ? old : next,
      );
    };
    measure();
    const observer = new ResizeObserver(() => flushSync(measure));
    observer.observe(el);
    // The density level changes the font size without always changing the box.
    document.fonts?.addEventListener('loadingdone', measure);
    return () => {
      observer.disconnect();
      document.fonts?.removeEventListener('loadingdone', measure);
    };
  }, [element]);
  return size;
}
