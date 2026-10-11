import type { Page } from '@playwright/test';

type Rgb = [number, number, number];

/** The colours of points of the page as it is drawn, read from a screenshot (so layers and mixes count). */
export async function pixels(page: Page, points: [number, number][]): Promise<Rgb[]> {
  const shot = (await page.screenshot({ animations: 'disabled' })).toString('base64');
  return page.evaluate(
    async ({ shot, points }) => {
      const image = await (await fetch(`data:image/png;base64,${shot}`)).blob();
      const bitmap = await createImageBitmap(image);
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const context = canvas.getContext('2d')!;
      context.drawImage(bitmap, 0, 0);
      return points.map(([x, y]) => {
        const [r, g, b] = context.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
        return [r, g, b] as [number, number, number];
      });
    },
    { shot, points },
  );
}

const luminance = (rgb: Rgb) => {
  const [r, g, b] = rgb.map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  }) as Rgb;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** The WCAG contrast ratio of two colours. */
export function contrast(a: Rgb, b: Rgb) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}
