import { describe, expect, it } from 'vitest'
import { addTierTo, removeTierAt } from './tiers'
import { DEFAULT_INPUTS } from './defaults'

describe('addTierTo', () => {
  it('ajoute un plan avec un nom inédit et une part nulle', () => {
    const next = addTierTo(DEFAULT_INPUTS.tiers)
    expect(next).toHaveLength(4)
    expect(next[3].mix).toBe(0)
    expect(next[3].price).toBeGreaterThan(DEFAULT_INPUTS.tiers[2].price)
    const names = next.map((tier) => tier.name)
    expect(new Set(names).size).toBe(4)
  })

  it('refuse de dépasser 4 plans', () => {
    const four = addTierTo(DEFAULT_INPUTS.tiers)
    expect(addTierTo(four)).toBe(four)
  })
})

describe('removeTierAt', () => {
  it('retire le plan visé', () => {
    const next = removeTierAt(DEFAULT_INPUTS.tiers, 1)
    expect(next).toHaveLength(2)
    expect(next.map((tier) => tier.name)).toEqual(['Starter', 'Scale'])
  })

  it('refuse de descendre sous 1 plan', () => {
    const single = [DEFAULT_INPUTS.tiers[0]]
    expect(removeTierAt(single, 0)).toBe(single)
  })
})
