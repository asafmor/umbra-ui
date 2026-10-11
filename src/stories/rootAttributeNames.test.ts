import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { exceptions, names } from './rootAttributeNames';

/** The components an entry exports: its value exports whose name starts with a capital letter. */
function exported(entry: string) {
  const source = readFileSync(new URL(entry, import.meta.url), 'utf8');
  return [...source.matchAll(/^export \{([^}]+)\} from/gm)]
    .flatMap((match) => match[1]!.split(','))
    .map((name) => name.trim().split(' as ').pop()!)
    .filter((name) => /^[A-Z]/.test(name));
}

const components = [...exported('../index.ts'), ...exported('../charts/index.ts')];

test('the entries are read', () => {
  expect(components).toContain('Card');
  expect(components).toContain('Sparkline');
  expect(components).not.toContain('CardProps');
});

test('every exported component is in the root attributes story, or is an exception with a reason', () => {
  const missing = components.filter((name) => !names.includes(name) && !exceptions[name]);
  expect(missing).toEqual([]);
});

test('the list names nothing else, and nothing twice', () => {
  expect(names.filter((name) => !components.includes(name))).toEqual([]);
  expect(new Set(names).size).toBe(names.length);
});
