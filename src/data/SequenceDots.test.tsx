import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import { SequenceDots } from './SequenceDots';

const items = [
  { id: 'a', label: 'First' },
  { id: 'b', label: 'Second' },
];

test('a `mark` part given as a function or a node needs no key', () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const html = [
    renderToStaticMarkup(<SequenceDots items={items} parts={{ mark: (p) => <i data-id={p.id} /> }} />),
    renderToStaticMarkup(<SequenceDots items={items} parts={{ mark: <b /> }} />),
  ];
  expect(html[0]).toContain('<i data-id="a"></i><i data-id="b"></i>');
  expect(html[1]).toContain('<b></b><b></b>');
  expect(error.mock.calls.flat().join(' ')).not.toMatch(/key/);
  expect(error).not.toHaveBeenCalled();
  error.mockRestore();
});
