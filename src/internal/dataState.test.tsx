import { isValidElement, type ReactElement } from 'react';
import { expect, test } from 'vitest';
import { dataState } from './dataState';

const props = (node: unknown) => (node as ReactElement<Record<string, unknown>>).props;

test('data is shown unless the component is empty or in error', () => {
  expect(dataState({}, { isEmpty: false })).toBeNull();
  expect(dataState({ loading: true }, { isEmpty: true })).toBeNull();
  expect(dataState({ empty: 'Unused' }, { isEmpty: false })).toBeNull();
});

test('the empty state takes text, pieces, or the default', () => {
  expect(props(dataState({}, { isEmpty: true, defaultEmpty: { title: 'No rows' } })).title).toBe('No rows');
  expect(props(dataState({ empty: 'None yet' }, { isEmpty: true })).title).toBe('None yet');
  expect(props(dataState({ empty: { description: 'Why' } }, { isEmpty: true })).description).toBe('Why');
});

test('an error wins over loading and empty, is an alert, and gets the retry button', () => {
  const state = props(dataState({ error: true, loading: true, onRetry: () => {} }, { isEmpty: true }));
  expect(state).toMatchObject({ title: 'Something went wrong', tone: 'error', role: 'alert' });
  expect(isValidElement(state.action)).toBe(true);
  expect(props(dataState({ error: 'Failed' }, { isEmpty: false })).action).toBeFalsy();
});
