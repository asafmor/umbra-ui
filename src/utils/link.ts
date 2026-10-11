import type { AnchorHTMLAttributes } from 'react';

/**
 * What `renderLink` receives, on every component that has it (`PrimaryNav`, `SubNav`, `VerticalNav`,
 * `PageHeader`, `ShortcutBar`, `Menu`, `Link`, `Card`, `SectionTitle`): the props of a link, to spread on the app's router link.
 * `renderLink={(props) => <RouterLink to={props.href} {...props} />}`
 */
export type LinkRenderProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
