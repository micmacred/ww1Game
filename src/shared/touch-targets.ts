// iPad touch target standards
// 44pt = Apple HIG minimum for comfortable touch
// 48pt = elevated minimum for time-pressure controls (battle phase)

export const TOUCH = {
  /** Minimum touch target size (44pt) — all interactive elements */
  min: 44,
  /** Elevated touch target size (48pt) — time-pressure contexts like battle phase */
  timePressure: 48,
  /** Minimum spacing between adjacent touch targets */
  spacing: 8,
} as const;
