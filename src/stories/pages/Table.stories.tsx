import type { Meta, StoryObj } from '@storybook/react-vite';
import { App } from './App';

const meta = { title: 'Pages/Table', component: App } satisfies Meta<typeof App>;
export default meta;

/**
 * A dense table of 600 rows as the main content, with a toolbar above it and a summary beside it.
 * The navigation, the history buttons and the command palette (Mod+K) move between the three pages.
 */
export const Table: StoryObj<typeof meta> = { tags: ['narrow'], args: { initial: 'orders/all' } };
