import { warn } from '../utils/dev';

/**
 * Internal: for rows whose ids come from the app. Two rows with one id are the app's mistake, and must
 * not take the page down: React Aria keys the rows of a list by id, throws on a repeat in development
 * and loses rows in production; React itself may drop or double a child. So every row gets a key of its
 * own: its id the first time, and a made-up one for a repeat, with a warning in development.
 *
 * `scope()` gives the key function of one list (a menu and its submenu are two); `idOf` turns any key
 * back into the id the app gave, for what is reported to it.
 */
export function distinctIds(component: string) {
  const original = new Map<string, string>();
  return {
    scope: () => {
      const seen = new Map<string, number>();
      return (id: string) => {
        const count = (seen.get(id) ?? 0) + 1;
        seen.set(id, count);
        if (count === 1) return id;
        if (count === 2)
          warn(`${component}: the id "${id}" is given to more than one item. Ids must be unique.`);
        const key = `${id}::${count}`;
        original.set(key, id);
        return key;
      };
    },
    idOf: (key: string) => original.get(key) ?? key,
  };
}
