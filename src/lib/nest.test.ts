import { describe, expect, it } from 'vitest'
import { animalOf, provenMrr, readinessOf, readinessScore, statusOf } from './nest'
import { quickInputs } from './quickSim'
import { compute } from './engine'
import type { RepoSignals } from './github'
import type { SavedSimulation } from '@/store/simulator'

function idea(patch: Partial<SavedSimulation> = {}): SavedSimulation {
  return {
    id: 'x',
    name: 'Boucle',
    inputs: quickInputs({ price: 29, customers: 500 }),
    basedOn: null,
    ...patch,
  }
}

const FRESH: RepoSignals = {
  slug: 'sabri/boucle',
  description: null,
  language: 'TypeScript',
  stars: 0,
  openIssues: 0,
  ageMonths: 7,
  daysSincePush: 2,
  isArchived: false,
}

describe('statusOf', () => {
  it('reste un œuf tant que personne ne paie', () => {
    expect(statusOf(idea())).toBe('egg')
    expect(statusOf(idea({ provenCustomers: 0 }))).toBe('egg')
  })

  it('éclot au premier client qui paie', () => {
    expect(statusOf(idea({ provenCustomers: 1 }))).toBe('hatched')
  })

  it("l'abandon prime sur tout le reste", () => {
    // Une idée qu'on a arrêtée ne redevient pas active parce qu'un ancien client
    // paie encore : c'est une décision, pas un état du marché.
    expect(statusOf(idea({ provenCustomers: 40, abandonedAt: 1 }))).toBe('abandoned')
  })
})

describe('readinessOf', () => {
  const results = compute(quickInputs({ price: 29, customers: 500 }))

  it('ne coche rien pour une idée nue, sauf le prix', () => {
    const checks = readinessOf(idea(), results, null)
    expect(checks.filter((check) => check.done).map((check) => check.key)).toEqual(['priced'])
    expect(readinessScore(checks)).toBeCloseTo(0.2, 6)
  })

  it('ne déclare pas « vivant » sans dépôt lié', () => {
    // Sans dépôt, on ne sait pas : faux plutôt qu'optimiste.
    const checks = readinessOf(idea(), results, null)
    expect(checks.find((check) => check.key === 'alive')?.done).toBe(false)
  })

  it('coche « vivant » sur une poussée récente, pas sur un dépôt archivé', () => {
    const linked = idea({ repo: 'sabri/boucle' })
    expect(readinessOf(linked, results, FRESH).find((c) => c.key === 'alive')?.done).toBe(true)
    expect(
      readinessOf(linked, results, { ...FRESH, isArchived: true }).find((c) => c.key === 'alive')
        ?.done,
    ).toBe(false)
    expect(
      readinessOf(linked, results, { ...FRESH, daysSincePush: 45 }).find((c) => c.key === 'alive')
        ?.done,
    ).toBe(false)
  })

  it('atteint le plein exactement quand l’œuf éclot', () => {
    const full = idea({ note: 'Suivi d’abonnements', repo: 'sabri/boucle', provenCustomers: 3 })
    const checks = readinessOf(full, results, FRESH)
    expect(readinessScore(checks)).toBe(1)
    expect(statusOf(full)).toBe('hatched')
  })

  it('nomme la provenance de chaque poste', () => {
    const checks = readinessOf(idea(), results, null)
    expect(checks.filter((c) => c.kind === 'measured').map((c) => c.key)).toEqual([
      'coded',
      'alive',
      'paid',
    ])
  })
})

describe('animalOf', () => {
  const results = compute(quickInputs({ price: 29, customers: 500 }))

  it('ne donne pas d’animal à un œuf', () => {
    expect(animalOf(idea(), results)).toBeNull()
  })

  it('donne le palier du revenu par client une fois éclose', () => {
    expect(animalOf(idea({ provenCustomers: 4 }), results)).toBe('Deer')
  })
})

describe('provenMrr', () => {
  it('compte les clients réels, pas ceux de la simulation', () => {
    const results = compute(quickInputs({ price: 29, customers: 500 }))
    // La simulation en suppose 500 ; trois paient.
    expect(results.revenue.mrr).toBeCloseTo(14_500, 6)
    expect(provenMrr(idea({ provenCustomers: 3 }), results)).toBeCloseTo(87, 6)
    expect(provenMrr(idea(), results)).toBe(0)
  })
})
