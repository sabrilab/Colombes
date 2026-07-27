import { describe, expect, it } from 'vitest'
import { computeEconomics } from './economics'
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

function economicsOf(overrides: Partial<SimulatorInputs> = {}) {
  const i = inputs(overrides)
  return computeEconomics(i, computeRevenue(i))
}

describe('computeEconomics', () => {
  it('calcule la LTV sur la marge brute et le churn brut', () => {
    expect(economicsOf().ltv).toBeCloseTo((15 * 0.8) / 0.03)
  })

  it('ignore l expansion dans la LTV', () => {
    const withExpansion = economicsOf({ expansion: 0.02 })
    const withoutExpansion = economicsOf({ expansion: 0 })
    expect(withExpansion.ltv).toBeCloseTo(withoutExpansion.ltv as number)
  })

  it('rend une LTV nulle-définie quand le churn est nul', () => {
    const result = economicsOf({ revenueChurn: 0 })
    expect(result.ltv).toBeNull()
    expect(result.ltvCacRatio).toBeNull()
  })

  it('calcule le ratio LTV:CAC', () => {
    const result = economicsOf()
    expect(result.ltvCacRatio).toBeCloseTo(400 / 50)
  })

  it('laisse le ratio non défini quand le CAC est nul', () => {
    const result = economicsOf({ cac: 0 })
    expect(result.ltvCacRatio).toBeNull()
  })

  it('calcule le payback en mois', () => {
    expect(economicsOf().paybackMonths).toBeCloseTo(50 / (15 * 0.8))
  })

  it('rend un payback nul pour une acquisition organique', () => {
    expect(economicsOf({ cac: 0 }).paybackMonths).toBe(0)
  })

  it('laisse le payback non défini quand la marge unitaire est nulle', () => {
    const result = economicsOf({ grossMargin: 0 })
    expect(result.paybackMonths).toBeNull()
  })

  it('annualise le NRR : rétention nette mensuelle composée sur 12 mois', () => {
    // 1 − 0,03 + 0,01 = 0,98 mensuel → 0,98^12 annuel (convention de marché,
    // cohérente avec les ancres et seuils annuels de benchmarks.ts)
    expect(economicsOf().nrr).toBeCloseTo(0.98 ** 12)
    expect(economicsOf({ expansion: 0.05 }).nrr).toBeCloseTo(1.02 ** 12)
  })

  it('un NRR mensuel neutre reste neutre en annuel', () => {
    expect(economicsOf({ revenueChurn: 0.02, expansion: 0.02 }).nrr).toBeCloseTo(1)
  })
})
