import type { Meta, StoryObj } from '@storybook/react-vite';
import { App } from './App';

const meta = { title: 'Pages/List and detail', component: App } satisfies Meta<typeof App>;
export default meta;

/**
 * A searchable list of requests, and the selected one in a detail pane with its own header, tabs and
 * action bar. The navigation, the history buttons and the command palette (Mod+K) move between the
 * three pages.
 */
export const ListAndDetail: StoryObj<typeof meta> = { tags: ['narrow'], args: { initial: 'overview/inbox' } };
