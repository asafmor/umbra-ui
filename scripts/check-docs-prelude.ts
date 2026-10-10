// The app's own values that the documentation samples refer to without defining them. The docs check
// (scripts/check-docs.mjs) imports a name from here when a sample uses it and the library does not
// export it. Keep it small: prefer a sample that defines what it uses.
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import type { NavItem } from '../src';

/** The app a sample wraps in the provider. */
export declare function App(): ReactNode;

/** A router's link, as `react-router-dom` exports it: samples import `Link` from there. */
export declare function Link(props: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }): ReactNode;
/** A router's imperative navigation. */
export declare function useNavigate(): (to: string | number) => void;

// Navigation state of the frame samples.
export declare const sections: NavItem[];
export declare const section: string;
export declare const setSection: (id: string) => void;
export declare const pages: NavItem[];
export declare const page: string;
export declare const setPage: (id: string) => void;
export declare const openSearch: () => void;
