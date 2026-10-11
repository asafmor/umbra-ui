import type { Meta, StoryObj } from '@storybook/react-vite';
import { App } from './App';
import { withShortcuts } from './help';

const meta = { title: 'Pages/Planning', component: App } satisfies Meta<typeof App>;
export default meta;

/**
 * A month of slots as the main card, with the settings of each week beside it, figures with
 * sparklines above it, and the week, a comparison and the team at the side. The team is switched in
 * the bar. "Tour" (Shift+T) walks through the page, and `?` lists the keyboard shortcuts.
 */
export const Planning: StoryObj<typeof meta> = {
  tags: ['narrow', 'tints'],
  args: { initial: 'planning/schedule' },
  render: (args, { globals }) => withShortcuts(<App {...args} />, globals),
};
