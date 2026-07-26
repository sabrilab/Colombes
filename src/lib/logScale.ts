/**
 * Les jauges de volume couvrent quatre ordres de grandeur. Une échelle
 * linéaire rendrait impossible le réglage fin sous 500, qui est la zone
 * la plus fréquente. Le logarithme n'étant pas défini en 0, la position 0
 * est réservée à la valeur 0 et les positions 1..LOG_STEPS couvrent [1, max].
 */
export const LOG_STEPS = 240

export function positionToValue(position: number, max: number): number {
  if (position <= 0) return 0
  const t = Math.min(position - 1, LOG_STEPS - 1) / (LOG_STEPS - 1)
  return Math.round(max ** t)
}

export function valueToPosition(value: number, max: number): number {
  if (value <= 0) return 0
  if (value >= max) return LOG_STEPS
  const t = Math.log10(value) / Math.log10(max)
  return Math.round(t * (LOG_STEPS - 1)) + 1
}
