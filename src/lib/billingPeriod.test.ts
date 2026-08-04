import { describe, expect, it } from 'vitest'
import {
  BILLING_PERIODS,
  billingPeriodOption,
  fromMonthly,
  PERIODS_PER_MONTH,
  toMonthly,
  type BillingPeriod,
} from './billingPeriod'

const PERIODS: BillingPeriod[] = ['weekly', 'monthly', 'yearly']

describe('billingPeriod', () => {
  it('laisse le mois inchangé', () => {
    expect(fromMonthly(29, 'monthly')).toBe(29)
    expect(toMonthly(29, 'monthly')).toBe(29)
  })

  it('compte cinquante-deux semaines par an, pas quarante-huit', () => {
    // 29 €/mois font 6,69 €/semaine — et non 7,25 € comme le donnerait un mois
    // de quatre semaines. L'écart de 8,3 % est précisément ce que ce test garde.
    expect(fromMonthly(29, 'weekly')).toBeCloseTo(6.6923, 4)
    expect(PERIODS_PER_MONTH.weekly).toBeCloseTo(4.3333, 4)
  })

  it('multiplie l’année par douze', () => {
    expect(fromMonthly(29, 'yearly')).toBe(348)
    expect(toMonthly(348, 'yearly')).toBe(29)
  })

  it('fait l’aller-retour sans dériver, dans les trois cadences', () => {
    for (const period of PERIODS) {
      for (const monthly of [1, 9, 29, 79, 500]) {
        expect(toMonthly(fromMonthly(monthly, period), period)).toBeCloseTo(monthly, 9)
      }
    }
  })

  it('rend le mois pour une cadence inconnue', () => {
    // Une valeur venue d'une URL périmée ne doit pas casser l'écran.
    expect(billingPeriodOption('quarterly' as BillingPeriod).id).toBe('monthly')
  })

  it('nomme les trois cadences avec leur suffixe', () => {
    expect(BILLING_PERIODS.map((option) => option.unit)).toEqual(['/wk', '/mo', '/yr'])
  })
})
