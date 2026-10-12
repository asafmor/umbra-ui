export interface BoardItem {
  /** Columns the item takes. Cut to the number of columns of the board. */
  span: number;
  /** How far the next item of its columns starts under its top: its height plus the gap. */
  advance: number;
  /** The column to keep (0 is the first), while a card of the board is moving. */
  column?: number | undefined;
}

/**
 * Where each item of a `WidgetBoard` goes. In source order, an item takes the place whose top is
 * highest, the leftmost of equals ("shortest column"). An item that spans columns starts under
 * everything already in the columns it covers. Nothing is ever put above an item that came before it in
 * the same column, so each column reads in source order, and the room left above a spanning item in the
 * shorter of its columns stays empty.
 *
 * An item with a `column` that still fits keeps it: only its top follows.
 */
export function packBoard(items: readonly BoardItem[], columns: number) {
  const count = Math.max(1, Math.floor(columns));
  const ends = new Array<number>(count).fill(0);
  const placed = items.map((item) => {
    const span = Math.min(Math.max(1, Math.floor(item.span) || 1), count);
    const topAt = (column: number) => Math.max(...ends.slice(column, column + span));
    let column =
      item.column !== undefined && item.column >= 0 && item.column + span <= count ? item.column : -1;
    if (column < 0) {
      column = 0;
      for (let i = 1; i + span <= count; i++) if (topAt(i) < topAt(column)) column = i;
    }
    const top = topAt(column);
    ends.fill(top + item.advance, column, column + span);
    return { column, span, top };
  });
  return { placed, end: Math.max(...ends) };
}
