import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/figtree/400.css';
import '@fontsource/figtree/500.css';
import '@fontsource/figtree/700.css';
import type { Preview } from '@storybook/react-vite';
import { UmbraProvider } from '../src';
// Apps import 'umbra-ui/styles.css'; here the source stylesheet is loaded directly.
import '../src/styles/index.css';
import { contextPresets, densities } from '../src/styles/tokens.generated';
import './preview.css';

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    options: {
      // The sidebar reads top to bottom: the welcome page, the guides in reading order, then the components.
      storySort: {
        order: [
          'Welcome',
          'Guides',
          ['Getting started', 'Layout', 'Theming', 'Customisation', 'Recipes', 'Customisation tables'],
          'Pages',
          'Foundation',
          'Layout',
          'Shell',
          'Basics',
          'Data',
          'Inputs',
          'Overlays',
          'Meters',
          'Charts',
        ],
      },
    },
  },
  initialGlobals: { density: 'default', context: 'violet', direction: 'ltr' },
  globalTypes: {
    density: { description: 'Density level', toolbar: { title: 'Density', items: [...densities] } },
    context: { description: 'Context tint', toolbar: { title: 'Context', items: [...contextPresets] } },
    // `rtl` sets a right-to-left locale on the provider, so the layout and the arrow keys both mirror.
    direction: { description: 'Text direction', toolbar: { title: 'Direction', items: ['ltr', 'rtl'] } },
  },
  decorators: [
    // Every story gets the whole window, like an app does. `frame: 'padded'` adds a margin around it.
    (Story, { globals, parameters }) => (
      <UmbraProvider
        density={globals.density}
        context={globals.context}
        locale={globals.direction === 'rtl' ? 'he' : undefined}
      >
        <div className="story-frame" data-padded={parameters.frame === 'padded' || undefined}>
          <Story />
        </div>
      </UmbraProvider>
    ),
  ],
};

export default preview;
