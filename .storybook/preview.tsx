import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/figtree/400.css';
import '@fontsource/figtree/500.css';
import '@fontsource/figtree/700.css';
import type { Preview } from '@storybook/react-vite';
import '../src/styles/index.css';
import { contextPresets, densities } from '../src/styles/tokens.generated';
import './preview.css';

const preview: Preview = {
  parameters: { layout: 'fullscreen' },
  initialGlobals: { density: 'default', context: 'violet' },
  globalTypes: {
    density: { description: 'Density level', toolbar: { title: 'Density', items: [...densities] } },
    context: { description: 'Context tint', toolbar: { title: 'Context', items: [...contextPresets] } },
  },
  decorators: [
    // Every story gets the whole window, like an app does. `frame: 'padded'` adds a margin around it.
    (Story, { globals, parameters }) => (
      <div
        className="story-frame"
        data-padded={parameters.frame === 'padded' || undefined}
        data-umbra-scope=""
        data-umbra-density={globals.density}
        data-umbra-context={globals.context}
      >
        <Story />
      </div>
    ),
  ],
};

export default preview;
