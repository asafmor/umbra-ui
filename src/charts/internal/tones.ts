// The colour of a tone in a chart that colours by value (BarChart, DonutChart).
import type { ThresholdTone } from '../../utils/thresholds';

/** The colour of a tone in a chart. The semantic ones can be set for the charts alone. */
export const toneColours: Record<'default' | ThresholdTone, string> = {
  default: 'var(--umbra-chart-value, var(--umbra-color-series-1))',
  success: 'var(--umbra-chart-positive, var(--umbra-color-semantic-success))',
  warning: 'var(--umbra-chart-warning, var(--umbra-color-semantic-warning))',
  danger: 'var(--umbra-chart-negative, var(--umbra-color-semantic-danger))',
  info: 'var(--umbra-chart-info, var(--umbra-color-semantic-info))',
  neutral: 'var(--umbra-color-base-text-muted)',
  accent: 'var(--umbra-color-fixed-selected)',
  'ramp-1': 'var(--umbra-color-value-ramp-1)',
  'ramp-2': 'var(--umbra-color-value-ramp-2)',
  'ramp-3': 'var(--umbra-color-value-ramp-3)',
  'ramp-4': 'var(--umbra-color-value-ramp-4)',
  'ramp-5': 'var(--umbra-color-value-ramp-5)',
};
