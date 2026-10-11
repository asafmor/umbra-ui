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

// The colour inputs of the provider, as a few presets each. `default` leaves the prop out. For any
// other colour, the Foundation/Theming Playground story has colour controls.
const colours = (title: string, items: Record<string, string>) => ({
  description: `${title} colour`,
  toolbar: {
    title,
    items: [
      { value: 'default', title: `${title}: default` },
      ...Object.entries(items).map(([name, value]) => ({ value, title: `${name} ${value}` })),
    ],
    dynamicTitle: true,
  },
});
const chosen = (value: unknown) => (typeof value === 'string' && value !== 'default' ? value : undefined);

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
          'Time',
          'Integration',
        ],
      },
    },
  },
  initialGlobals: {
    density: 'default',
    context: 'violet',
    direction: 'ltr',
    brandColor: 'default',
    interactionColor: 'default',
    actionColor: 'default',
    surface: 'default',
  },
  globalTypes: {
    density: { description: 'Density level', toolbar: { title: 'Density', items: [...densities] } },
    context: {
      description: 'Context tint',
      toolbar: {
        title: 'Context',
        items: [...contextPresets, { value: 'brand', title: 'follows the brand' }],
      },
    },
    // Named apart from the props, because some stories hand the globals on to a provider of their own.
    brandColor: colours('Brand', {
      Green: '#0a7a55',
      Red: '#c81e1e',
      Orange: '#e8730c',
      Yellow: '#f5c400',
      Blue: '#0b5fff',
      Graphite: '#3a3f47',
      White: '#ffffff',
    }),
    interactionColor: colours('Interaction', {
      Blue: '#0b5fff',
      Teal: '#00a3a3',
      Orange: '#e8730c',
      Yellow: '#f5c400',
      Red: '#e11d2e',
      Grey: '#8a8f98',
    }),
    actionColor: colours('Action', {
      Blue: '#0b5fff',
      Teal: '#00a3a3',
      Orange: '#e8730c',
      Lime: '#b8d400',
      Violet: '#6a1fd6',
    }),
    surface: {
      description: 'Surface opacity',
      toolbar: { title: 'Surface', items: ['default', '0.75', '0.5', '0.25', '0'], dynamicTitle: true },
    },
    // `rtl` sets a right-to-left locale on the provider, so the layout and the arrow keys both mirror.
    direction: { description: 'Text direction', toolbar: { title: 'Direction', items: ['ltr', 'rtl'] } },
  },
  decorators: [
    // Every story gets the whole window, like an app does. `frame: 'padded'` adds a margin around it.
    (Story, { globals, parameters }) => (
      <UmbraProvider
        density={globals.density}
        context={globals.context === 'brand' ? undefined : globals.context}
        brand={chosen(globals.brandColor)}
        interaction={chosen(globals.interactionColor)}
        action={chosen(globals.actionColor)}
        surfaceOpacity={chosen(globals.surface) === undefined ? undefined : Number(globals.surface)}
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
