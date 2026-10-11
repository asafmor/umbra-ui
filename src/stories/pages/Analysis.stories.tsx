import type { Meta, StoryObj } from '@storybook/react-vite';
import { App } from './App';
import { withShortcuts } from './help';

const meta = { title: 'Pages/Analysis', component: App } satisfies Meta<typeof App>;
export default meta;

/**
 * The reports page: a row of reports to pick from, a board of chart widgets and a table of sites. One
 * scale of bands colours all of them, and "Scale" (Shift+S) edits it in a modal while the page follows.
 * "Tour" (Shift+T) walks through the page, and `?` lists the keyboard shortcuts.
 */
export const Analysis: StoryObj<typeof meta> = {
  tags: ['narrow', 'tints'],
  args: { initial: 'overview/reports' },
  render: (args, { globals }) => withShortcuts(<App {...args} />, globals),
};
