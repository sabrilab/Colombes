import { describe, expect, it } from 'vitest'
import { compute } from './index'
import { DEFAULT_INPUTS } from '@/lib/defaults'
import type { SimulatorInputs } from './types'

function withInput(patch: Partial<SimulatorInputs>): SimulatorInputs {
  return { ...DEFAULT_INPUTS, ...patch }
}

/**
 * Médiane d'un tableau de nombres (copie triée, ne mute pas l'entrée).
 */
function median(xs: number[]): number {
  if (xs.length === 0) return 0
  const sorted = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

/**
 * Plus grand écart local, comparé à une base de référence tirée d'une
 * fenêtre de pas plus éloignés de chaque côté (voisins immédiats exclus).
 *
 * Trois dénominateurs plus simples ont été essayés et mesurés, tous trois
 * invalidés (voir .superpowers/sdd/task-9-report.md pour les tableaux
 * complets) :
 * - la valeur locale (`max(|v[i]|, |v[i-1]|, plancher)`) casse au passage par
 *   zéro : la valorisation traverse exactement 0 au seuil de rentabilité, et
 *   un mouvement minuscule en absolu s'y lit comme un saut de 100 % relatif.
 * - l'amplitude totale du balayage (`max − min`) est diluée par la queue du
 *   domaine : sur le balayage `customers`, la valorisation à l'extrémité haute
 *   atteint ~30 M€, si bien qu'une vraie marche de 27 897 € au franchissement
 *   des 100 000 € de MRR se lit comme 0.09 % et passe sous le seuil.
 * - le maximum des deux voisins immédiats (`max(|Δ_{i-1}|, |Δ_{i+1}|,
 *   plancher)`) se défend lui-même : une marche qui atterrit sur deux pas
 *   consécutifs comparables voit chaque moitié excusée par l'autre. Un saut
 *   de 50 000 € scindé en deux pas de 25 000 € mesurait ~1.0 avec ce
 *   dénominateur — sous le seuil de 5 — alors qu'il est plus grand que le
 *   saut unique de 27 897 € que la métrique doit détecter.
 *
 * Comparer chaque pas à une fenêtre de référence qui exclut ses deux voisins
 * immédiats élimine les trois biais : le dénominateur suit localement
 * l'échelle de la fonction (pas de dilution par la queue du domaine), n'est
 * pas écrasé par un passage à zéro (fenêtre plutôt que valeur locale), et
 * n'est pas contaminé par l'autre moitié d'un saut scindé (les voisins
 * immédiats sont exclus, et la médiane — pas le maximum — n'est pas déplacée
 * par une poignée d'entrées contaminées si le saut s'étale sur plus de deux
 * pas). Une fonction lisse donne des ratios proches de 1 partout ; une
 * marche, scindée ou non, donne un ratio très supérieur. Le plancher (en
 * euros absolus) évite une division par une quasi-zéro dans les zones
 * plates.
 */
function maxWindowedDiscontinuity(values: number[], floor = 1, window = 8): number {
  const deltas: number[] = []
  for (let i = 1; i < values.length; i++) deltas.push(values[i] - values[i - 1])

  let worst = 0
  for (let i = 0; i < deltas.length; i++) {
    const leftStart = Math.max(0, i - window)
    const leftEnd = Math.max(0, i - 1) // exclusif : inclut jusqu'à i-2
    const left = deltas.slice(leftStart, leftEnd)

    const rightStart = Math.min(deltas.length, i + 2)
    const rightEnd = Math.min(deltas.length, i + window + 1)
    const right = deltas.slice(rightStart, rightEnd)

    const baseline = median([...left, ...right].map(Math.abs))
    const denom = Math.max(baseline, floor)
    worst = Math.max(worst, Math.abs(deltas[i]) / denom)
  }
  return worst
}

/**
 * Seuil choisi par mesure (voir .superpowers/sdd/task-9-report.md, section
 * « reprise fenêtre glissante, tentative 4 »).
 *
 * - Table A (moteur correct, non modifié) : pire ratio tous curseurs
 *   confondus (y compris les six dimensions de tiers) = 2.0576, sur
 *   `newCustomersPerMonth`. Ce n'est pas un défaut : c'est un coude réel et
 *   attendu d'un barème d'ajustement linéaire par morceaux (les segments de
 *   `ADJUSTMENT_ANCHORS` ont des pentes qui diffèrent jusqu'à ×2 d'un
 *   segment à l'autre), amplifié par une fenêtre qui exclut les voisins
 *   immédiats.
 * - Table B (mutation « bascule dure », `arrWeight = mrr >= 100_000 ? 1 : 0`)
 *   : ratio `customers` = 20.3925.
 * - Table C (mutation « saut scindé », `arrWeight = mrr >= 100_000 ? 1 : mrr
 *   >= 99_000 ? 0.5 : 0`, le cas qui a motivé ce correctif) : ratio
 *   `customers` = 87.2205.
 *
 * Seuil retenu : 6.5, à égale distance (en échelle log) des deux bornes.
 * Marge basse : 6.5 / 2.0576 ≈ ×3.16 au-dessus du pire cas du moteur
 * correct. Marge haute : min(20.3925, 87.2205) / 6.5 ≈ ×3.14 en dessous du
 * plus petit des deux ratios de régression détectés. Les deux marges
 * dépassent le ×3 minimal requis.
 */
const CONTINUITY_THRESHOLD = 6.5

function sweepValuation(
  apply: (x: number) => SimulatorInputs,
  from: number,
  to: number,
  steps = 1_500,
): number[] {
  const values: number[] = []
  for (let i = 0; i <= steps; i++) {
    values.push(compute(apply(from + ((to - from) * i) / steps)).valuation.value)
  }
  return values
}

/**
 * Balayage entier : un compute() par valeur entière consécutive.
 *
 * Pour un curseur conceptuellement entier (nombre de clients, mois), balayer
 * une fraction puis arrondir produit un artefact d'échantillonnage : sur 1500
 * pas entre 0 et 1000, l'incrément vaut 0.667, et les valeurs arrondies
 * alternent entre « aucun changement » et « +1 unité », ce qui fait
 * apparaître un faux saut local. Évaluer directement sur les entiers
 * consécutifs élimine l'artefact.
 */
function sweepValuationInt(apply: (n: number) => SimulatorInputs, from: number, to: number): number[] {
  const values: number[] = []
  for (let n = from; n <= to; n++) {
    values.push(compute(apply(n)).valuation.value)
  }
  return values
}

/**
 * Balaye une seule dimension (`price` ou `mix`) d'un seul tier, les deux
 * autres tiers restant aux valeurs par défaut. Domaine prix : 0 → 500 € ;
 * domaine mix : 0 → 1. Les deux sont continus, balayés fractionnairement
 * (`sweepValuation`, sans arrondi).
 */
function sweepTierDimension(tierIndex: 0 | 1 | 2, dimension: 'price' | 'mix', steps = 1_500): number[] {
  const to = dimension === 'price' ? 500 : 1
  return sweepValuation(
    (x) =>
      withInput({
        tiers: DEFAULT_INPUTS.tiers.map((tier, i) =>
          i === tierIndex ? { ...tier, [dimension]: x } : tier,
        ) as SimulatorInputs['tiers'],
      }),
    0,
    to,
    steps,
  )
}

describe('compute', () => {
  it('assemble toutes les composantes du résultat', () => {
    const results = compute(DEFAULT_INPUTS)
    expect(results.revenue.mrr).toBeGreaterThan(0)
    expect(results.economics.ltv).not.toBeNull()
    expect(results.growth.mrrCeiling).not.toBeNull()
    expect(results.projection).toHaveLength(37)
    expect(results.valuation.value).toBeGreaterThan(0)
  })

  it('est une fonction pure : deux appels identiques rendent le même résultat', () => {
    expect(compute(DEFAULT_INPUTS)).toEqual(compute(DEFAULT_INPUTS))
  })

  it('ne mute pas ses entrées', () => {
    const snapshot = structuredClone(DEFAULT_INPUTS)
    compute(DEFAULT_INPUTS)
    expect(DEFAULT_INPUTS).toEqual(snapshot)
  })

  it('ne produit jamais NaN sur des entrées dégénérées', () => {
    const results = compute(
      withInput({
        customers: 0,
        newCustomersPerMonth: 0,
        revenueChurn: 0,
        expansion: 0,
        grossMargin: 0,
        cac: 0,
        tiers: [
          { name: 'A', price: 0, mix: 0 },
          { name: 'B', price: 0, mix: 0 },
          { name: 'C', price: 0, mix: 0 },
        ],
      }),
    )
    expect(Number.isNaN(results.valuation.value)).toBe(false)
    expect(Number.isFinite(results.valuation.multiple)).toBe(true)
    expect(results.projection.every(Number.isFinite)).toBe(true)
  })

  it('ne rend jamais une valorisation négative', () => {
    const results = compute(withInput({ fixedCosts: 100_000, cac: 2_000 }))
    expect(results.valuation.value).toBeGreaterThanOrEqual(0)
  })
})

describe('continuité de la valorisation', () => {
  it('reste continue en balayant le nombre de clients à travers la zone de fondu', () => {
    const values = sweepValuationInt((n) => withInput({ customers: n }), 0, 20_000)
    expect(maxWindowedDiscontinuity(values)).toBeLessThan(CONTINUITY_THRESHOLD)
  })

  it('reste continue en balayant le churn', () => {
    expect(
      maxWindowedDiscontinuity(sweepValuation((x) => withInput({ revenueChurn: x }), 0, 0.15)),
    ).toBeLessThan(CONTINUITY_THRESHOLD)
  })

  it('reste continue en balayant l expansion', () => {
    expect(
      maxWindowedDiscontinuity(sweepValuation((x) => withInput({ expansion: x }), 0, 0.1)),
    ).toBeLessThan(CONTINUITY_THRESHOLD)
  })

  const TIER_LABELS = ['Starter', 'Pro', 'Scale'] as const
  const TIER_SWEEPS = (['price', 'mix'] as const).flatMap((dimension) =>
    ([0, 1, 2] as const).map((tierIndex) => ({
      tierIndex,
      dimension,
      label: `${dimension === 'price' ? 'le prix' : 'le mix'} du plan ${TIER_LABELS[tierIndex]}`,
    })),
  )

  it.each(TIER_SWEEPS)('reste continue en balayant $label', ({ tierIndex, dimension }) => {
    expect(maxWindowedDiscontinuity(sweepTierDimension(tierIndex, dimension))).toBeLessThan(
      CONTINUITY_THRESHOLD,
    )
  })

  it('reste continue en balayant le CAC à travers le passage en perte', () => {
    expect(
      maxWindowedDiscontinuity(sweepValuation((x) => withInput({ cac: x }), 0, 2_000)),
    ).toBeLessThan(CONTINUITY_THRESHOLD)
  })

  it('reste continue en balayant les charges fixes à travers le passage en perte', () => {
    expect(
      maxWindowedDiscontinuity(sweepValuation((x) => withInput({ fixedCosts: x }), 0, 100_000)),
    ).toBeLessThan(CONTINUITY_THRESHOLD)
  })

  it('reste continue en balayant la marge brute', () => {
    expect(
      maxWindowedDiscontinuity(sweepValuation((x) => withInput({ grossMargin: x }), 0.5, 0.99)),
    ).toBeLessThan(CONTINUITY_THRESHOLD)
  })

  it('reste continue en balayant l acquisition', () => {
    const values = sweepValuationInt((n) => withInput({ newCustomersPerMonth: n }), 0, 1_000)
    expect(maxWindowedDiscontinuity(values)).toBeLessThan(CONTINUITY_THRESHOLD)
  })

  it('reste continue en balayant la concentration client', () => {
    expect(
      maxWindowedDiscontinuity(sweepValuation((x) => withInput({ topClientShare: x }), 0, 0.6)),
    ).toBeLessThan(CONTINUITY_THRESHOLD)
  })

  it('reste continue en balayant l ancienneté', () => {
    const values = sweepValuationInt((n) => withInput({ ageMonths: n }), 0, 96)
    expect(maxWindowedDiscontinuity(values)).toBeLessThan(CONTINUITY_THRESHOLD)
  })
})
