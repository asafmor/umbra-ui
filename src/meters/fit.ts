/**
 * True when the label, the value and (on one line) the shortest bar do not fit side by side: the value
 * then hides. Shared by the meters that show a label, a value and a bar (`bar` is the part's name).
 * `stacked`: the value has a line of its own (a `PieIndicator` with the disc above), so it only hides
 * when it does not fit that line.
 */
export function tooNarrow(root: HTMLElement, bar = 'track', stacked = false) {
  const part = (name: string) => root.querySelector<HTMLElement>(`:scope > [data-part="${name}"]`);
  const value = part('value');
  if (!value) return false;
  if (stacked) return value.scrollWidth > root.clientWidth + 1;
  const gap = parseFloat(getComputedStyle(root).columnGap) || 0;
  const label = part('label');
  const track = root.dataset.layout === 'inline' ? part(bar) : null;
  const needed =
    value.offsetWidth +
    (label ? label.scrollWidth + gap : 0) +
    (track ? (parseFloat(getComputedStyle(track).minWidth) || 0) + gap : 0);
  if (needed > root.clientWidth + 1) return true;
  // The sum is of rounded widths, so for a pixel it can fit while the label is already cut. The label's
  // own text is the exact measure: the value never shows beside a cut label.
  if (!label) return false;
  const text = document.createRange();
  text.selectNodeContents(label);
  return text.getBoundingClientRect().width > label.getBoundingClientRect().width + 0.01;
}
