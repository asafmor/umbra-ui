import type { Meta, StoryObj } from '@storybook/react-vite';
import { App } from './App';

const meta = { title: 'Pages/Overview', component: App } satisfies Meta<typeof App>;
export default meta;

/**
 * An overview with many cards: an inbox, a wide summary and a stack of small cards that collapse by
 * priority. The navigation, the history buttons and the command palette (Mod+K) move between the
 * three pages.
 */
export const Overview: StoryObj<typeof meta> = {
  tags: ['narrow', 'tints'],
  args: { initial: 'overview/summary' },
};
