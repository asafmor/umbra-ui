import { useSyncExternalStore } from 'react';
import type { NavLinkProps } from 'umbra-ui';

// A tiny hash router: the route is the part of the URL after "#". It is enough to show how umbra-ui
// meets a router; in a real app, React Router or TanStack Router take this file's place.
const fallback = '/clients';
const read = () => window.location.hash.slice(1) || fallback;
const subscribe = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
};

/** The current route: `#/orders/o-1004` gives `{ section: 'orders', param: 'o-1004' }`. */
export function useHashRoute() {
  const path = useSyncExternalStore(subscribe, read);
  const [section = '', param] = path.split('/').filter(Boolean);
  return { path, section, param };
}

/** Goes to a route. Takes `/orders` or `#/orders`. Each call adds an entry to the browser history. */
export function navigate(href: string) {
  window.location.hash = href.replace(/^#/, '');
}

/** The app's link. umbra-ui components render it through their `renderLink` prop. */
export function RouterLink({ href, onClick, ...rest }: NavLinkProps) {
  return (
    <a
      {...rest}
      href={href}
      onClick={(event) => {
        // The component's own handler first: it marks the item as chosen or closes its menu.
        onClick?.(event);
        const plain = event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey;
        if (event.defaultPrevented || !plain || !href.startsWith('#')) return;
        event.preventDefault();
        navigate(href);
      }}
    />
  );
}

/** Pass this to every `renderLink` prop. */
export const renderLink = (props: NavLinkProps) => <RouterLink {...props} />;
