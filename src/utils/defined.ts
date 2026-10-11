/** `T` as `defined` returns it: a member that may be `undefined` becomes optional, without `undefined`. */
export type Defined<T> = T extends unknown
  ? { [K in keyof T as undefined extends T[K] ? never : K]: T[K] } & Partial<{
      [K in keyof T as undefined extends T[K] ? K : never]: Exclude<T[K], undefined>;
    }>
  : never;

/**
 * A copy of `props` without the keys whose value is `undefined`.
 *
 * The library's own optional props accept an explicit `undefined`; the optional props of React Aria and
 * of the table engine do not (`exactOptionalPropertyTypes`). Props that may be `undefined` go through
 * this where they are handed over: `<AriaButton {...defined({ className: cx(a, b), onPress })} />`.
 * A missing prop and an `undefined` one mean the same to a component, so nothing changes at run time.
 */
export function defined<const T extends object>(props: T): Defined<T>;
export function defined(props: object): object {
  return Object.fromEntries(Object.entries(props).filter(([, value]) => value !== undefined));
}
