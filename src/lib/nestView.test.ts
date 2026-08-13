import { describe, expect, it } from 'vitest'
import { buildNest, nestCensus, nestIdea, orderNest } from './nestView'
import { quickInputs } from './quickSim'
import type { Goal } from './goals'
import type { RepoSignals } from './github'
import type { SavedSimulation } from '@/store/simulator'

const GOAL: Goal = { metric: 'mrr', target: 30_000, months: 18 }

function idea(name: string, patch: Partial<SavedSimulation> = {}): SavedSimulation {
  return {
    id: name,
    name,
    inputs: quickInputs({ price: 29, customers: 400 }),
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
  ageMonths: 4,
  daysSincePush: 3,
  isArchived: false,
}

describe('nestIdea', () => {
  it('assemble le statut, la maturité et le revenu encaissé', () => {
    const built = nestIdea(idea('boucle', { note: 'Un truc', provenCustomers: 12 }), GOAL)
    expect(built.status).toBe('hatched')
    expect(built.animal).not.toBeNull()
    expect(built.proven).toBeCloseTo(12 * built.results.revenue.arpu)
    expect(built.readiness).toBeGreaterThan(0)
  })

  it("n'attribue pas d'animal à un œuf", () => {
    expect(nestIdea(idea('boucle'), GOAL).animal).toBeNull()
  })
})

describe('buildNest', () => {
  it('donne à chaque idée les signaux de son propre dépôt', () => {
    const withRepo = idea('avec', { repo: 'sabri/boucle' })
    const without = idea('sans')
    const [a, b] = buildNest([withRepo, without], GOAL, new Map([['sabri/boucle', FRESH]]))

    expect(a.checks.find((check) => check.key === 'alive')?.done).toBe(true)
    // Sans dépôt lié, on ne sait pas — et « on ne sait pas » vaut « non ».
    expect(b.checks.find((check) => check.key === 'alive')?.done).toBe(false)
  })

  it('supporte un dépôt lié dont GitHub n’a rien dit', () => {
    const [built] = buildNest([idea('privée', { repo: 'sabri/privee' })], GOAL, new Map())
    expect(built.checks.find((check) => check.key === 'alive')?.done).toBe(false)
    expect(built.checks.find((check) => check.key === 'coded')?.done).toBe(true)
  })
})

describe('orderNest', () => {
  const bare = nestIdea(idea('nue'), GOAL)
  const documented = nestIdea(idea('documentée', { note: 'Un truc', repo: 'sabri/boucle' }), GOAL, FRESH)
  const dropped = nestIdea(
    idea('abandonnée', { note: 'Un truc', repo: 'sabri/boucle', abandonedAt: 1_000 }),
    GOAL,
    FRESH,
  )

  it('met devant celle à qui il manque le moins', () => {
    expect(orderNest([bare, documented], 'ready').map((entry) => entry.sim.name)).toEqual([
      'documentée',
      'nue',
    ])
  })

  it('range les abandonnées en dernier, quel que soit l’ordre', () => {
    for (const order of ['ready', 'value', 'speed', 'recent'] as const) {
      const names = orderNest([dropped, bare, documented], order).map((entry) => entry.sim.name)
      expect(names.at(-1)).toBe('abandonnée')
    }
  })

  it('ne perd aucune idée', () => {
    for (const order of ['ready', 'value', 'speed', 'recent'] as const) {
      expect(orderNest([dropped, bare, documented], order)).toHaveLength(3)
    }
  })

  it('met celles qui n’atteignent jamais l’objectif après celles qui y arrivent', () => {
    const tiny = nestIdea({ ...idea('minuscule'), inputs: quickInputs({ price: 5, customers: 10 }) }, GOAL)
    const large = nestIdea({ ...idea('large'), inputs: quickInputs({ price: 79, customers: 900 }) }, GOAL)
    const months = orderNest([tiny, large], 'speed').map((entry) => entry.goal.monthReached)
    const found = months.filter((month): month is number => month !== null)
    expect(found).toEqual([...found].sort((a, b) => a - b))
    expect(months.indexOf(null) === -1 || months.indexOf(null) >= found.length).toBe(true)
  })

  it('trie la valeur décroissante à statut égal', () => {
    const small = nestIdea({ ...idea('petite'), inputs: quickInputs({ price: 9, customers: 60 }) }, GOAL)
    const big = nestIdea({ ...idea('grosse'), inputs: quickInputs({ price: 79, customers: 900 }) }, GOAL)
    expect(orderNest([small, big], 'value')[0].sim.name).toBe('grosse')
  })
})

describe('nestCensus', () => {
  it('compte les trois états', () => {
    const census = nestCensus([
      nestIdea(idea('a'), GOAL),
      nestIdea(idea('b'), GOAL),
      nestIdea(idea('c', { provenCustomers: 3 }), GOAL),
      nestIdea(idea('d', { abandonedAt: 1 }), GOAL),
    ])
    expect(census).toEqual({ egg: 2, hatched: 1, abandoned: 1 })
  })
})
