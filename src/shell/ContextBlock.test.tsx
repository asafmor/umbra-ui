import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';
import { ContextBlock } from './ContextBlock';

// X-6 of review 2: a server and a browser are rarely in the same time zone, and the markup of both
// must be the same. Node reads `TZ` again each time it is set.
const zone = process.env.TZ;
const inZone = (tz: string, render: () => string) => {
  process.env.TZ = tz;
  return render();
};
afterEach(() => {
  if (zone === undefined) delete process.env.TZ;
  else process.env.TZ = zone;
});

const time = '2026-10-10T09:30:00Z';
const h23 = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' } as const;

describe('ContextBlock on a server', () => {
  it('writes the same markup in every time zone when no time zone is given, with the time not shown', () => {
    const render = () => renderToString(<ContextBlock primary="Today" time={time} timeFormat={h23} />);
    const tokyo = inZone('Asia/Tokyo', render);
    expect(tokyo).toBe(inZone('America/New_York', render));
    // The chip is there, with its machine-readable time and its size; the text waits for the browser.
    expect(tokyo).toContain('dateTime="2026-10-10T09:30:00.000Z"');
    expect(tokyo).toMatch(/visibility:hidden[^>]*>09:30</);
  });

  it('writes the time at once when the time zone is given', () => {
    const render = () =>
      renderToString(
        <ContextBlock primary="Today" time={time} timeFormat={{ ...h23, timeZone: 'Asia/Tokyo' }} />,
      );
    const tokyo = inZone('Asia/Tokyo', render);
    expect(tokyo).toBe(inZone('America/New_York', render));
    expect(tokyo).toContain('>18:30<');
    expect(tokyo).not.toContain('visibility');
  });
});
