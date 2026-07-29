import { describe, expect, it } from 'vitest'
import { GRAINS, GRAIN_IDS, grainById, prerequisitesOf } from './learn'

describe('GRAINS', () => {
  it('donne des identifiants uniques', () => {
    expect(new Set(GRAIN_IDS).size).toBe(GRAINS.length)
  })

  it('remplit tous les champs, sans texte vide', () => {
    for (const grain of GRAINS) {
      for (const field of ['title', 'question', 'misconception', 'insight'] as const) {
        expect(grain[field].trim().length, `${grain.id}.${field}`).toBeGreaterThan(0)
      }
    }
  })

  it('pose une question, pas un titre de cours', () => {
    // La règle de la bible : la question est dans les mots du fondateur.
    for (const grain of GRAINS) {
      expect(grain.question.trim().endsWith('?'), grain.id).toBe(true)
    }
  })

  it('ne référence que des prérequis existants', () => {
    for (const grain of GRAINS) {
      for (const need of grain.needs) {
        expect(grainById(need), `${grain.id} → ${need}`).toBeDefined()
      }
    }
  })

  it('ne dépend jamais de lui-même', () => {
    for (const grain of GRAINS) {
      expect(grain.needs, grain.id).not.toContain(grain.id)
    }
  })
})

describe('prerequisitesOf', () => {
  it('ne rend rien pour un grain d entrée', () => {
    expect(prerequisitesOf('levers')).toEqual([])
  })

  it('remonte la chaîne complète, pas seulement le parent direct', () => {
    // multiple → what-remains → levers
    expect(prerequisitesOf('multiple').map((grain) => grain.id)).toEqual([
      'levers',
      'what-remains',
    ])
  })

  it('termine sur tous les grains — le graphe est acyclique', () => {
    // Un cycle ferait boucler la remontée : si tout rend, il n'y en a pas.
    for (const grain of GRAINS) {
      expect(() => prerequisitesOf(grain.id), grain.id).not.toThrow()
      expect(prerequisitesOf(grain.id)).not.toContainEqual(grain)
    }
  })
})
