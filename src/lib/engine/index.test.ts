import { describe, expect, it } from 'vitest'
import { compute } from './index'
import { DEFAULT_INPUTS } from '@/lib/defaults'
import type { SimulatorInputs } from './types'

function withInput(patch: Partial<SimulatorInputs>): SimulatorInputs {
  return { ...DEFAULT_INPUTS, ...patch }
}

/**
 * Plus grand écart local, comparé à ses deux pas voisins immédiats.
 *
 * Deux dénominateurs plus simples ont été essayés et mesurés, tous deux
 * invalidés :
 * - la valeur locale (`max(|v[i]|, |v[i-1]|, plancher)`) casse au passage par
 *   zéro : la valorisation traverse exactement 0 au seuil de rentabilité, et
 *   un mouvement minuscule en absolu s'y lit comme un saut de 100 % relatif.
 * - l'amplitude totale du balayage (`max − min`) est diluée par la queue du
 *   domaine : sur le balayage `customers`, la valorisation à l'extrémité haute
 *   atteint ~30 M€, si bien qu'une vraie marche de 27 897 € au franchissement
 *   des 100 000 € de MRR se lit comme 0.09 % et passe sous le seuil.
 *
 * Comparer chaque pas à ses voisins immédiats élimine les deux biais : le
 * dénominateur suit localement l'échelle de la fonction, qu'elle soit proche
 * de zéro ou très grande, et n'est jamais écrasé par une zone lointaine du
 * domaine. Une fonction lisse donne des ratios proches de 1 partout ; une
 * marche donne un ratio très supérieur, quel que soit l'endroit du domaine où
 * elle se produit. Le plancher (en euros absolus) évite une division par une
 * quasi-zéro dans les zones plates.
 */
function maxLocalDiscontinuity(values: number[], floor = 1): number {
  const deltas: number[] = []
  for (let i = 1; i < values.length; i++) deltas.push(values[i] - values[i - 1])

  let worst = 0
  for (let i = 0; i < deltas.length; i++) {
    const neighbors: number[] = [floor]
    if (i > 0) neighbors.push(Math.abs(deltas[i - 1]))
    if (i < deltas.length - 1) neighbors.push(Math.abs(deltas[i + 1]))
    const denom = Math.max(...neighbors)
    worst = Math.max(worst, Math.abs(deltas[i]) / denom)
  }
  return worst
}

/**
 * Seuil choisi par mesure (voir .superpowers/sdd/task-9-report.md) : le pire
 * ratio du moteur correct sur tous les curseurs est ~1.0035, le ratio du
 * curseur `customers` sous la mutation « bascule dure » de arrWeight est
 * ~19.92. 5 offre une marge ×4.98 au-dessus du moteur correct et ×3.98
 * en dessous de la mutation détectée.
 */
const CONTINUITY_THRESHOLD = 5

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
    expect(maxLocalDiscontinuity(values)).toBeLessThan(CONTINUITY_THRESHOLD)
  })

  it('reste continue en balayant le churn', () => {
    expect(
      maxLocalDiscontinuity(sweepValuation((x) => withInput({ revenueChurn: x }), 0, 0.15)),
    ).toBeLessThan(CONTINUITY_THRESHOLD)
  })

  it('reste continue en balayant l expansion', () => {
    expect(
      maxLocalDiscontinuity(sweepValuation((x) => withInput({ expansion: x }), 0, 0.1)),
    ).toBeLessThan(CONTINUITY_THRESHOLD)
  })

  it('reste continue en balayant le prix du plan Pro', () => {
    expect(
      maxLocalDiscontinuity(
        sweepValuation(
          (x) =>
            withInput({
              tiers: [
                DEFAULT_INPUTS.tiers[0],
                { ...DEFAULT_INPUTS.tiers[1], price: x },
                DEFAULT_INPUTS.tiers[2],
              ],
            }),
          0,
          500,
        ),
      ),
    ).toBeLessThan(CONTINUITY_THRESHOLD)
  })

  it('reste continue en balayant le mix du plan Scale', () => {
    expect(
      maxLocalDiscontinuity(
        sweepValuation(
          (x) =>
            withInput({
              tiers: [
                DEFAULT_INPUTS.tiers[0],
                DEFAULT_INPUTS.tiers[1],
                { ...DEFAULT_INPUTS.tiers[2], mix: x },
              ],
            }),
          0,
          1,
        ),
      ),
    ).toBeLessThan(CONTINUITY_THRESHOLD)
  })

  it('reste continue en balayant le CAC à travers le passage en perte', () => {
    expect(
      maxLocalDiscontinuity(sweepValuation((x) => withInput({ cac: x }), 0, 2_000)),
    ).toBeLessThan(CONTINUITY_THRESHOLD)
  })

  it('reste continue en balayant les charges fixes à travers le passage en perte', () => {
    expect(
      maxLocalDiscontinuity(sweepValuation((x) => withInput({ fixedCosts: x }), 0, 100_000)),
    ).toBeLessThan(CONTINUITY_THRESHOLD)
  })

  it('reste continue en balayant la marge brute', () => {
    expect(
      maxLocalDiscontinuity(sweepValuation((x) => withInput({ grossMargin: x }), 0.5, 0.99)),
    ).toBeLessThan(CONTINUITY_THRESHOLD)
  })

  it('reste continue en balayant l acquisition', () => {
    const values = sweepValuationInt((n) => withInput({ newCustomersPerMonth: n }), 0, 1_000)
    expect(maxLocalDiscontinuity(values)).toBeLessThan(CONTINUITY_THRESHOLD)
  })

  it('reste continue en balayant la concentration client', () => {
    expect(
      maxLocalDiscontinuity(sweepValuation((x) => withInput({ topClientShare: x }), 0, 0.6)),
    ).toBeLessThan(CONTINUITY_THRESHOLD)
  })

  it('reste continue en balayant l ancienneté', () => {
    const values = sweepValuationInt((n) => withInput({ ageMonths: n }), 0, 96)
    expect(maxLocalDiscontinuity(values)).toBeLessThan(CONTINUITY_THRESHOLD)
  })
})
