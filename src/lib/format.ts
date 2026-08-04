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

const preciseCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatCurrency(value: number): string {
  return currency.format(Math.round(value))
}

/**
 * Un prix, avec ses centimes seulement quand il en a.
 *
 * `formatCurrency` arrondit à l'euro, ce qui va pour une valorisation et pas
 * pour un prix à la semaine : 29 €/mois font 6,69 €/semaine, et l'afficher
 * « 7 € » ment de cinq pour cent sur le seul chiffre que la personne est venue
 * régler. Un prix rond reste rond — on n'écrit pas « 29,00 € » pour rien.
 */
export function formatPrice(value: number): string {
  const rounded = Math.round(value * 100) / 100
  return Number.isInteger(rounded) ? currency.format(rounded) : preciseCurrency.format(rounded)
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
