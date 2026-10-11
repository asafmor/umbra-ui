import { warn } from '../utils/dev';

type Direction = 'ltr' | 'rtl';

/** The scripts written right to left, for a browser that cannot say how a locale is written. */
const rtlScripts = new Set(['Adlm', 'Arab', 'Hebr', 'Mand', 'Mend', 'Nkoo', 'Rohg', 'Samr', 'Syrc', 'Thaa']);

/** The direction a locale is written in, or undefined when it is not a valid language tag. */
export function textDirection(locale: string): Direction | undefined {
  try {
    const info = new Intl.Locale(locale) as Intl.Locale & {
      getTextInfo?: (() => { direction: Direction }) | undefined;
      textInfo?: { direction: Direction } | undefined;
    };
    // Firefox before 153 has neither form. The script of the locale decides there, as in React Aria.
    return (
      info.getTextInfo?.().direction ??
      info.textInfo?.direction ??
      (rtlScripts.has(info.maximize().script ?? '') ? 'rtl' : 'ltr')
    );
  } catch {
    warn(`locale "${locale}" is not a valid language tag.`);
    return undefined;
  }
}

/**
 * The one source of locale and direction (plan/specs/UmbraProvider.md, "Direction"): the `locale` prop,
 * else the document's `dir` with the browser's locale, else the browser's locale alone.
 *
 * React Aria takes its direction from a locale only. A document direction that the browser's locale
 * does not have is therefore given to it as a script subtag: "en-Arab" reads right to left and still
 * formats numbers and dates as English.
 */
export function resolveLocale(locale: string | undefined, documentDir: string, browserLocale: string) {
  if (locale !== undefined) return { locale, direction: textDirection(locale) ?? 'ltr' };
  const own = textDirection(browserLocale) ?? 'ltr';
  if ((documentDir !== 'rtl' && documentDir !== 'ltr') || documentDir === own) {
    return { locale: browserLocale, direction: own };
  }
  try {
    const script = documentDir === 'rtl' ? 'Arab' : 'Latn';
    return {
      locale: new Intl.Locale(browserLocale, { script }).toString(),
      direction: documentDir as Direction,
    };
  } catch {
    return { locale: browserLocale, direction: own };
  }
}
