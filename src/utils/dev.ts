/** Logs a warning in development builds only. */
export function warn(message: string) {
  if (process.env.NODE_ENV !== 'production') console.warn(`[umbra-ui] ${message}`);
}
