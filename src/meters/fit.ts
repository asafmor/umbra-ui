/**
 * True when the label, the value and (on one line) the shortest bar do not fit side by side: the value
 * then hides. Shared by the meters that show a label, a value and a bar (`bar` is the part's name).
 */
export function tooNarrow(root: HTMLElement, bar = 'track') {
  const part = (name: string) => root.querySelector<HTMLElement>(`:scope > [data-part="${name}"]`);
  const value = part('value');
  if (!value) return false;
  const gap = parseFloat(getComputedStyle(root).columnGap) || 0;
  const label = part('label');
  const track = root.dataset.layout === 'inline' ? part(bar) : null;
  const needed =
    value.offsetWidth +
    (label ? label.scrollWidth + gap : 0) +
    (track ? (parseFloat(getComputedStyle(track).minWidth) || 0) + gap : 0);
  return needed > root.clientWidth + 1;
}
