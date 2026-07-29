/**
 * Le catalogue des grains pédagogiques — voir
 * docs/superpowers/specs/2026-07-29-bible-pedagogique.md.
 *
 * Un grain est la plus petite chose qu'on puisse comprendre seule. Il n'existe
 * que s'il corrige une croyance précise : « expliquer le NRR » n'est pas un
 * objectif, « montrer qu'on peut croître en perdant de l'argent » en est un.
 *
 * Les textes sont en anglais comme partout dans le code ; fr.ts les traduit.
 */

export type GrainId = 'levers' | 'tiers' | 'what-remains' | 'multiple'

export interface Grain {
  id: GrainId
  /** La question dans les mots du fondateur, jamais dans le jargon. */
  question: string
  /** Le titre court, pour le sommaire et les liens entrants. */
  title: string
  /** La croyance précise qu'on corrige. */
  misconception: string
  /** La phrase qu'on doit pouvoir dire soi-même après avoir manipulé. */
  insight: string
  /** Grains prérequis : sert à proposer, jamais à verrouiller. */
  needs: GrainId[]
}

export const GRAINS: Grain[] = [
  {
    id: 'levers',
    title: 'The two levers',
    question: 'Where does that number even come from?',
    misconception: 'I need more customers.',
    insight:
      'Your revenue is a surface: price on one side, customers on the other. Doubling either doubles it — but one of the two is free.',
    needs: [],
  },
  {
    id: 'tiers',
    title: 'Which animal are you',
    question: 'What am I, in all this?',
    misconception: 'My price is a packaging detail.',
    insight:
      'Your price per customer decides your trade: who sells, who onboards, and how many customers you need. Spotify is a mouse, Salesforce is a whale.',
    needs: ['levers'],
  },
  {
    id: 'what-remains',
    title: 'What actually remains',
    question: 'Why is my revenue not my income?',
    misconception: 'I make €12K of MRR, so I earn €12K.',
    insight:
      'Direct costs, acquisition and fixed costs each take their share. What a buyer pays for is the bottom of that waterfall, never the top.',
    needs: ['levers'],
  },
  {
    id: 'multiple',
    title: 'How a multiple is built',
    question: 'Why three times and not ten?',
    misconception: 'A valuation is just an opinion.',
    insight:
      'The market curve gives a base multiple for your size. Nine quality lines then push it up or down — and you can name every one of them.',
    needs: ['what-remains'],
  },
]

export const GRAIN_IDS = GRAINS.map((grain) => grain.id)

export function grainById(id: string): Grain | undefined {
  return GRAINS.find((grain) => grain.id === id)
}

/**
 * Les grains manquants avant celui-ci, à plat et dans l'ordre du catalogue.
 * On les propose, on ne les impose pas : on entre par là où ça coince, pas
 * par le début.
 */
export function prerequisitesOf(id: GrainId): Grain[] {
  const seen = new Set<GrainId>()

  const walk = (current: GrainId) => {
    for (const need of grainById(current)?.needs ?? []) {
      if (seen.has(need)) continue
      seen.add(need)
      walk(need)
    }
  }
  walk(id)

  return GRAINS.filter((grain) => seen.has(grain.id))
}
