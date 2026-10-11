// Abstract drawings for the `backdrop` part of Heatmap and Scatter stories. Invented shapes: a floor
// plan-like outline and a map-like blob. They stretch to the plot, as an app's own diagram would.
const line = {
  fill: 'none',
  stroke: 'var(--umbra-color-base-border-control)',
  strokeWidth: 1.5,
  vectorEffect: 'non-scaling-stroke',
} as const;
const frame = {
  width: '100%',
  height: '100%',
  preserveAspectRatio: 'none',
  style: { display: 'block', background: 'var(--umbra-color-base-surface1)' },
} as const;

/** An outline of rooms around a hall. */
export function FloorPlan() {
  return (
    <svg data-backdrop="floor-plan" viewBox="0 0 100 60" {...frame}>
      <rect x="1" y="1" width="98" height="58" rx="1" {...line} />
      <path
        d="M1 22h30v-21M31 22v12M1 40h30v19M69 1v20h30M69 21v14M69 44v15M69 44h30M42 59v-12h16v12"
        {...line}
      />
      <circle cx="50" cy="28" r="7" {...line} />
    </svg>
  );
}

/** A coastline-like blob with two contour lines. */
export function Blob() {
  return (
    <svg data-backdrop="blob" viewBox="0 0 100 60" {...frame}>
      <path
        d="M14 30C10 14 28 5 44 8s22-6 36 2 16 24 6 36-26 10-40 8S18 46 14 30Z"
        {...line}
        fill="var(--umbra-color-base-surface3)"
      />
      <path
        d="M28 30c-2-9 9-14 19-12s14-3 22 2 9 14 3 20-16 6-24 5-18-6-20-15Z"
        {...line}
        strokeDasharray="3 3"
      />
      <path d="M42 30c0-5 6-7 11-6s8 3 8 7-5 6-10 6-9-2-9-7Z" {...line} strokeDasharray="3 3" />
    </svg>
  );
}
