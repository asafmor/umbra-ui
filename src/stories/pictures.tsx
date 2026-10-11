// Drawn pictures for stories that need an image. Shapes and gradients only: never a photograph.
import { useId } from 'react';

/** A simple landscape in one hue. `light` is close to white: the hardest picture to put text on. */
export function Picture({
  hue = 265,
  light = false,
  label,
}: {
  hue?: number;
  light?: boolean;
  /** What the picture shows. Without it the picture is decoration. */
  label?: string;
}) {
  const id = useId();
  const l = light ? [97, 92, 88] : [34, 46, 24];
  return (
    <svg
      viewBox="0 0 160 90"
      preserveAspectRatio="xMidYMid slice"
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={`hsl(${hue} 60% ${l[0]}%)`} />
          <stop offset="1" stopColor={`hsl(${hue + 40} 55% ${l[1]}%)`} />
        </linearGradient>
      </defs>
      <rect width="160" height="90" fill={`url(#${id})`} />
      <circle cx="118" cy="26" r="12" fill={`hsl(${hue + 60} 80% ${light ? 99 : 72}%)`} />
      <path d="M0 90 44 38l26 30 20-18 70 40z" fill={`hsl(${hue} 45% ${l[2]}%)`} />
    </svg>
  );
}
