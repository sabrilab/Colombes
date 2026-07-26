const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const compactCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'EUR',
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function formatCurrency(value: number): string {
  return currency.format(Math.round(value))
}

export function formatCompactCurrency(value: number): string {
  return compactCurrency.format(value)
}

export function formatPercent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`
}

export function formatMultiple(value: number, signed = false): string {
  const sign = signed && value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}×`
}

export function formatMonths(value: number): string {
  return `${Math.round(value)} mo`
}

/** Rend le tiret cadratin pour une grandeur non définie, jamais un zéro inventé. */
export function formatNullable(value: number | null, format: (v: number) => string): string {
  return value === null || !Number.isFinite(value) ? '—' : format(value)
}
