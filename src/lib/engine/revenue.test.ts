import { describe, expect, it } from 'vitest'
import { computeRevenue } from './revenue'
import type { SimulatorInputs } from './types'

function inputs(overrides: Partial<SimulatorInputs> = {}): SimulatorInputs {
  return {
    tiers: [
      { name: 'Starter', price: 10, mix: 0.5 },
      { name: 'Pro', price: 20, mix: 0.5 },
      { name: 'Scale', price: 100, mix: 0 },
    ],
    customers: 100,
    newCustomersPerMonth: 10,
    cac: 50,
    revenueChurn: 0.03,
    expansion: 0.01,
    grossMargin: 0.8,
    fixedCosts: 500,
    founderDependency: 'medium',
    techTransferability: 'medium',
    topClientShare: 0.1,
    ageMonths: 24,
    annualShare: 0,
    annualDiscount: 0.17,
    ltdPerMonth: 0,
    ltdPrice: 300,
    baseMultipleOverride: null,
    ...overrides,
  }
}

describe('computeRevenue', () => {
  it('pondère l ARPU par le mix', () => {
    expect(computeRevenue(inputs()).arpu).toBeCloseTo(15)
  })

  it('normalise un mix qui ne somme pas à 1', () => {
    const result = computeRevenue(
      inputs({
        tiers: [
          { name: 'A', price: 10, mix: 30 },
          { name: 'B', price: 20, mix: 30 },
          { name: 'C', price: 100, mix: 0 },
        ],
      }),
    )
    expect(result.arpu).toBeCloseTo(15)
  })

  it('rend un ARPU nul quand le mix est entièrement à zéro', () => {
    const result = computeRevenue(
      inputs({
        tiers: [
          { name: 'A', price: 10, mix: 0 },
          { name: 'B', price: 20, mix: 0 },
          { name: 'C', price: 100, mix: 0 },
        ],
      }),
    )
    expect(result.arpu).toBe(0)
    expect(result.mrr).toBe(0)
    expect(Number.isNaN(result.arpu)).toBe(false)
  })

  it('ignore un plan à prix nul sans fausser la pondération', () => {
    const result = computeRevenue(
      inputs({
        tiers: [
          { name: 'Gratuit', price: 0, mix: 0.5 },
          { name: 'Pro', price: 20, mix: 0.5 },
          { name: 'Scale', price: 100, mix: 0 },
        ],
      }),
    )
    expect(result.arpu).toBeCloseTo(10)
  })

  it('dérive MRR, ARR et nouveau MRR de l ARPU', () => {
    const result = computeRevenue(inputs())
    expect(result.mrr).toBeCloseTo(1500)
    expect(result.arr).toBeCloseTo(18000)
    expect(result.newMrr).toBeCloseTo(150)
  })

  it('calcule le compte de résultat mensuel', () => {
    const result = computeRevenue(inputs())
    expect(result.variableCost).toBeCloseTo(300)
    expect(result.acquisitionCost).toBeCloseTo(500)
    expect(result.sdeMonthly).toBeCloseTo(200)
    expect(result.sdeAnnual).toBeCloseTo(2400)
    expect(result.netMargin).toBeCloseTo(200 / 1500)
  })

  it('admet un SDE négatif sans le tronquer', () => {
    const result = computeRevenue(inputs({ fixedCosts: 5000 }))
    expect(result.sdeMonthly).toBeLessThan(0)
  })

  it('rend une marge nette nulle plutôt que NaN quand le MRR est nul', () => {
    const result = computeRevenue(inputs({ customers: 0 }))
    expect(result.mrr).toBe(0)
    expect(result.netMargin).toBe(0)
  })
})
