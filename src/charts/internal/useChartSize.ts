import { useLayoutEffect, useState, type RefObject } from 'react';
import { flushSync } from 'react-dom';
import type { Measure } from './scales';

export interface ChartSize {
  width: number;
  height: number;
  /** The element's font size in pixels. */
  fontSize: number;
  /** The element's font, as CSS: labels are measured in it. */
  font: string;
  /** Goes up when a web font has loaded, so labels measured in the fallback font are measured again. */
  fonts: number;
}

const none: ChartSize = { width: 0, height: 0, fontSize: 13, font: '', fonts: 0 };

const widths = new Map<string, number>();
let probe: SVGTextElement | undefined;
let loaded = 0;
if (typeof document !== 'undefined')
  document.fonts?.addEventListener('loadingdone', () => {
    widths.clear();
    loaded += 1;
  });

/**
 * Measures labels in a font: the real width of the text as SVG draws it, with tabular figures like
 * the charts' own text. One hidden `<text>` on the page does the measuring, and every width is kept,
 * so a label is measured once per font. Without a DOM the width is estimated from the font size.
 */
export function measurer(font: string, fontSize: number): Measure {
  if (typeof document === 'undefined' || !font) return (text) => text.length * fontSize * 0.58;
  return (text) => {
    const key = `${font}\n${text}`;
    let width = widths.get(key);
    if (width === undefined) {
      if (!probe?.isConnected) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('data-umbra-chart-probe', '');
        svg.style.cssText =
          'position:fixed;top:0;left:0;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none;direction:ltr';
        probe = svg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'text'));
        document.body.appendChild(svg);
      }
      probe.style.font = font;
      probe.style.fontVariantNumeric = 'tabular-nums';
      probe.style.whiteSpace = 'pre';
      probe.textContent = text;
      width = probe.getComputedTextLength();
      // ponytail: the kept widths are dropped whole past 50,000 labels (a scatter of 5,000 named points
      // must not measure them again on every resize); an LRU if a chart ever streams unique labels.
      if (widths.size > 50000) widths.clear();
      widths.set(key, width);
    }
    return width;
  };
}

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
      const style = getComputedStyle(el);
      const next = {
        width: el.clientWidth,
        height: el.clientHeight,
        fontSize: parseFloat(style.fontSize) || none.fontSize,
        font: style.font || `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
        fonts: loaded,
      };
      setSize((old) =>
        (Object.keys(next) as (keyof ChartSize)[]).every((k) => old[k] === next[k]) ? old : next,
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
