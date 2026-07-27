import { describe, expect, it } from 'vitest'
import { compute } from './index'
import { DEFAULT_INPUTS } from '../defaults'
import type { SimulatorInputs } from './types'

function results(overrides: Partial<SimulatorInputs> = {}) {
  return compute({ ...DEFAULT_INPUTS, ...overrides })
}

describe('leviers d actif', () => {
  it('sans audience, rien ne change', () => {
    const base = results()
    const same = results({ audienceSize: 0, audienceConversion: 0.01 })
    expect(same.revenue.acquisitionCost).toBeCloseTo(base.revenue.acquisitionCost)
    expect(same.revenue.blendedCac).toBeCloseTo(DEFAULT_INPUTS.cac)
  })

  it('une audience convertit une part des nouveaux clients sans rien coûter', () => {
    // 10 000 abonnés à 0,1 %/mois = 10 clients gratuits sur les 45 visés.
    const withAudience = results({ audienceSize: 10_000, audienceConversion: 0.001 })
    expect(withAudience.revenue.ownedNewCustomers).toBe(10)
    expect(withAudience.revenue.acquisitionCost).toBeCloseTo(
      (DEFAULT_INPUTS.newCustomersPerMonth - 10) * DEFAULT_INPUTS.cac,
    )
  })

  it('le CAC mélangé baisse, et c est lui que lit le payback', () => {
    const base = results()
    const levered = results({ audienceSize: 10_000, audienceConversion: 0.001 })
    expect(levered.revenue.blendedCac).toBeLessThan(base.revenue.blendedCac)
    expect(levered.economics.paybackMonths!).toBeLessThan(base.economics.paybackMonths!)
    expect(levered.economics.ltvCacRatio!).toBeGreaterThan(base.economics.ltvCacRatio!)
  })

  it('l audience ne crée pas de clients à partir de rien', () => {
    // Une audience énorme ne peut pas dépasser l'acquisition visée : elle la
    // rend gratuite, elle ne l'invente pas.
    const huge = results({ audienceSize: 1_000_000, audienceConversion: 0.05 })
    expect(huge.revenue.ownedNewCustomers).toBe(DEFAULT_INPUTS.newCustomersPerMonth)
    expect(huge.revenue.acquisitionCost).toBe(0)
    expect(huge.revenue.blendedCac).toBe(0)
    expect(huge.revenue.mrr).toBeCloseTo(results().revenue.mrr)
  })

  it('ne touche pas au multiple : un actif ne vaut pas plus par son audience', () => {
    const base = results()
    const levered = results({ audienceSize: 10_000, audienceConversion: 0.001 })
    const churnLine = (r: typeof base) => r.valuation.lines.find((l) => l.key === 'revenueChurn')!
    expect(churnLine(levered).deltaPct).toBeCloseTo(churnLine(base).deltaPct)
    // La valorisation monte, mais seulement parce que le profit monte.
    expect(levered.valuation.multiple).toBeGreaterThanOrEqual(base.valuation.multiple)
    expect(levered.revenue.sdeMonthly).toBeGreaterThan(base.revenue.sdeMonthly)
  })
})
