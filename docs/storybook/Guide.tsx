import { Markdown } from '@storybook/addon-docs/blocks';

// One guide, from its Markdown file. The same files are read on GitHub, where a link to another guide
// is a relative path (`layout.md#the-pieces`). Here each guide is a Storybook docs page, so those links
// are rewritten to that page; a link into the repository goes to GitHub.
const pages: Record<string, string> = {
  'getting-started.md': 'guides-getting-started',
  'layout.md': 'guides-layout',
  'theming.md': 'guides-theming',
  'customisation.md': 'guides-customisation',
  'recipes.md': 'guides-recipes',
  'customisation-tables.md': 'guides-customisation-tables',
};
const repository = 'https://github.com/asafmor/umbra-ui/blob/main/';

export const rewriteLinks = (text: string) =>
  text.replace(/\]\((?!https?:|#|\?)([^)#\s]*)(#[^)\s]*)?\)/g, (_, path: string, hash = '') => {
    const page = pages[path.replace(/^\.\//, '')];
    if (page) return `](?path=/docs/${page}--docs${hash})`;
    // From docs/: `../README.md` is the repository root, anything else is beside the guides.
    return `](${repository}${path.startsWith('../') ? path.slice(3) : `docs/${path}`}${hash})`;
  });

// A wide table (the generated props tables) scrolls inside the page instead of widening it.
const css = `
.umbra-guide table { display: block; max-width: 100%; overflow-x: auto; }
.umbra-guide td code, .umbra-guide th code { white-space: normal; overflow-wrap: anywhere; }
.umbra-guide td:first-child code { white-space: nowrap; }
`;

export function Guide({ children }: { children: string }) {
  return (
    <div className="umbra-guide">
      <style>{css}</style>
      <Markdown>{rewriteLinks(children)}</Markdown>
    </div>
  );
}
