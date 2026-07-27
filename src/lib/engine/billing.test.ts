import { describe, expect, it } from 'vitest'
import { compute } from './index'
import { DEFAULT_INPUTS } from '../defaults'
import type { SimulatorInputs } from './types'

function results(overrides: Partial<SimulatorInputs> = {}) {
  return compute({ ...DEFAULT_INPUTS, ...overrides })
}

describe('facturation annuelle prépayée', () => {
  it('sans part annuelle, rien ne change', () => {
    const base = results()
    const same = results({ annualShare: 0, annualDiscount: 0.2 })
    expect(same.revenue.mrr).toBeCloseTo(base.revenue.mrr)
    expect(same.economics.nrr).toBeCloseTo(base.economics.nrr)
  })

  it('la remise annuelle baisse l ARPU au prorata de la part annuelle', () => {
    const base = results()
    const discounted = results({ annualShare: 0.5, annualDiscount: 0.2 })
    // La moitié des clients paie 20 % de moins : ARPU à −10 %.
    expect(discounted.revenue.arpu).toBeCloseTo(base.revenue.arpu * 0.9, 1)
  })

  it('l engagement annuel réduit le churn effectif', () => {
    const base = results()
    const annual = results({ annualShare: 1 })
    expect(annual.growth.netChurn).toBeLessThan(base.growth.netChurn)
    // Un client engagé douze mois ne peut pas partir chaque mois.
    expect(annual.economics.nrr).toBeGreaterThan(base.economics.nrr)
  })

  it('remonte la trésorerie encaissée d avance', () => {
    const none = results({ annualShare: 0 })
    const half = results({ annualShare: 0.5 })
    expect(none.revenue.cashUpfront).toBe(0)
    expect(half.revenue.cashUpfront).toBeGreaterThan(0)
    // Douze mois encaissés d'un coup pour la moitié de la base.
    expect(half.revenue.cashUpfront).toBeCloseTo(half.revenue.mrr * 12 * 0.5, -2)
  })
})

describe('lifetime deals', () => {
  it('n entrent jamais dans le MRR ni dans l ARR', () => {
    const base = results()
    const withLtd = results({ ltdPerMonth: 20, ltdPrice: 300 })
    expect(withLtd.revenue.mrr).toBeCloseTo(base.revenue.mrr)
    expect(withLtd.revenue.arr).toBeCloseTo(base.revenue.arr)
  })

  it('n enflent pas la valorisation : elle se paie sur le récurrent', () => {
    const base = results()
    const withLtd = results({ ltdPerMonth: 50, ltdPrice: 500 })
    expect(withLtd.valuation.value).toBeCloseTo(base.valuation.value)
  })

  it('apportent bien de la trésorerie, comptée à part', () => {
    const withLtd = results({ ltdPerMonth: 20, ltdPrice: 300 })
    expect(withLtd.revenue.ltdCashMonthly).toBe(6_000)
    expect(results().revenue.ltdCashMonthly).toBe(0)
  })
})
