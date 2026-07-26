import { describe, expect, it } from 'vitest'
import { GLOSSARY, type GlossaryKey } from './glossary'

const KPI_KEYS: GlossaryKey[] = [
  'mrr',
  'arr',
  'arpu',
  'grossMargin',
  'ltv',
  'ltvCacRatio',
  'paybackMonths',
  'nrr',
  'ruleOf40',
  'mrrCeiling',
]

describe('GLOSSARY', () => {
  it('définit chaque KPI de la grille', () => {
    for (const key of KPI_KEYS) {
      expect(GLOSSARY[key], key).toBeDefined()
    }
  })

  it('chaque entrée a une définition vulgarisée non vide, sans jargon nu', () => {
    for (const [key, entry] of Object.entries(GLOSSARY)) {
      expect(entry.title.length, key).toBeGreaterThan(0)
      // Une vraie phrase, pas un sigle re-déplié : au moins ~40 caractères.
      expect(entry.definition.length, key).toBeGreaterThanOrEqual(40)
    }
  })

  it('le NRR est décrit comme annuel (cohérent avec le moteur)', () => {
    expect(GLOSSARY.nrr.definition.toLowerCase()).toContain('year')
  })
})
