import { describe, expect, it } from 'vitest'
import { computeGrowth, computeProjection } from './projection'
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
    revenueChurn: 0.05,
    expansion: 0,
    grossMargin: 0.8,
    fixedCosts: 500,
    founderDependency: 'medium',
    techTransferability: 'medium',
    topClientShare: 0.1,
    ageMonths: 24,
    baseMultipleOverride: null,
    ...overrides,
  }
}

function growthOf(overrides: Partial<SimulatorInputs> = {}) {
  const i = inputs(overrides)
  return computeGrowth(i, computeRevenue(i))
}

function projectionOf(overrides: Partial<SimulatorInputs> = {}) {
  const i = inputs(overrides)
  return computeProjection(i, computeRevenue(i))
}

describe('computeGrowth', () => {
  it('calcule le churn net', () => {
    expect(growthOf({ revenueChurn: 0.05, expansion: 0.02 }).netChurn).toBeCloseTo(0.03)
  })

  it('calcule le plafond de MRR', () => {
    expect(growthOf().mrrCeiling).toBeCloseTo(150 / 0.05)
  })

  it('supprime le plafond quand la rétention nette est négative', () => {
    expect(growthOf({ revenueChurn: 0.02, expansion: 0.03 }).mrrCeiling).toBeNull()
  })

  it('supprime le plafond quand le churn net est exactement nul', () => {
    expect(growthOf({ revenueChurn: 0.03, expansion: 0.03 }).mrrCeiling).toBeNull()
  })

  it('calcule la croissance mensuelle instantanée', () => {
    expect(growthOf().growthMoM).toBeCloseTo((150 - 1500 * 0.05) / 1500)
  })

  it('annualise la croissance de façon composée', () => {
    const g = growthOf()
    expect(g.growthAnnual).toBeCloseTo((1 + g.growthMoM) ** 12 - 1)
  })

  it('exprime la Rule of 40 en points', () => {
    const i = inputs()
    const revenue = computeRevenue(i)
    const g = computeGrowth(i, revenue)
    expect(g.ruleOf40).toBeCloseTo(g.growthAnnual * 100 + revenue.netMargin * 100)
  })

  it('rend une croissance nulle plutôt que NaN quand le MRR est nul', () => {
    expect(growthOf({ customers: 0 }).growthMoM).toBe(0)
  })
})

describe('computeProjection', () => {
  it('rend 37 points, du mois 0 au mois 36', () => {
    const series = projectionOf()
    expect(series).toHaveLength(37)
  })

  it('démarre au MRR courant', () => {
    expect(projectionOf()[0]).toBeCloseTo(1500)
  })

  it('applique la récurrence de la spec au premier pas', () => {
    expect(projectionOf()[1]).toBeCloseTo(1500 * 0.95 + 150)
  })

  it('converge vers le plafond quand le churn net est positif', () => {
    const series = projectionOf({ customers: 1 })
    const ceiling = 150 / 0.05
    expect(series[36]).toBeGreaterThan(ceiling * 0.8)
    expect(series[36]).toBeLessThan(ceiling)
  })

  it('approche le plafond par le haut quand on démarre au-dessus', () => {
    const series = projectionOf({ customers: 1000 })
    const ceiling = 150 / 0.05
    expect(series[0]).toBeGreaterThan(ceiling)
    expect(series[36]).toBeLessThan(series[0])
    expect(series[36]).toBeGreaterThan(ceiling)
  })

  it('croît sans borne quand la rétention nette est négative', () => {
    const series = projectionOf({ revenueChurn: 0.02, expansion: 0.04 })
    expect(series[36]).toBeGreaterThan(series[18])
    expect(series[18]).toBeGreaterThan(series[0])
  })

  it('ne descend jamais sous zéro', () => {
    const series = projectionOf({ customers: 0, newCustomersPerMonth: 0 })
    expect(series.every((value) => value >= 0)).toBe(true)
  })
})
