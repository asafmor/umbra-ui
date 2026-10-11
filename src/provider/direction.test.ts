import { expect, test } from 'vitest';
import { resolveLocale, textDirection } from './direction';

test('the `locale` prop decides, whatever the document and the browser say', () => {
  expect(resolveLocale('he-IL', 'ltr', 'en-US')).toEqual({ locale: 'he-IL', direction: 'rtl' });
  expect(resolveLocale('en-GB', 'rtl', 'he-IL')).toEqual({ locale: 'en-GB', direction: 'ltr' });
});

test("without the prop, the document's `dir` decides the direction and the browser the language", () => {
  // The script subtag carries the direction to React Aria; the language still formats as itself.
  expect(resolveLocale(undefined, 'rtl', 'en-US')).toEqual({ locale: 'en-Arab-US', direction: 'rtl' });
  expect(resolveLocale(undefined, 'ltr', 'he-IL')).toEqual({ locale: 'he-Latn-IL', direction: 'ltr' });
  expect(new Intl.NumberFormat('en-Arab-US').format(1234.5)).toBe('1,234.5');
  // A `dir` that agrees with the browser changes nothing.
  expect(resolveLocale(undefined, 'ltr', 'en-US')).toEqual({ locale: 'en-US', direction: 'ltr' });
});

test("with neither, the browser's locale decides, and the direction is always known", () => {
  // The root element carries this direction, so CSS and React Aria agree (it had none before).
  expect(resolveLocale(undefined, '', 'he-IL')).toEqual({ locale: 'he-IL', direction: 'rtl' });
  expect(resolveLocale(undefined, '', 'ar')).toEqual({ locale: 'ar', direction: 'rtl' });
  expect(resolveLocale(undefined, 'auto', 'fr-FR')).toEqual({ locale: 'fr-FR', direction: 'ltr' });
});

test('a browser that cannot say how a locale is written (Firefox before 153): the script decides', () => {
  const proto = Intl.Locale.prototype;
  const saved = (['getTextInfo', 'textInfo'] as const).map(
    (name) => [name, Object.getOwnPropertyDescriptor(proto, name)] as const,
  );
  for (const [name] of saved) Reflect.deleteProperty(proto, name);
  try {
    const info = new Intl.Locale('he') as unknown as Record<string, unknown>;
    expect([info.getTextInfo, info.textInfo]).toEqual([undefined, undefined]);
    expect(['he-IL', 'ar', 'fa-IR', 'ur', 'ps', 'dv', 'yi', 'ckb', 'en-Arab-US'].map(textDirection)).toEqual(
      Array(9).fill('rtl'),
    );
    expect(['en-US', 'fr', 'ja', 'ru', 'he-Latn-IL', 'az', 'tr'].map(textDirection)).toEqual(
      Array(7).fill('ltr'),
    );
  } finally {
    for (const [name, descriptor] of saved) if (descriptor) Object.defineProperty(proto, name, descriptor);
  }
  expect(textDirection('he-IL')).toBe('rtl');
});
