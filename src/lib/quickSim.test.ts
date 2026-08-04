import { describe, expect, it } from 'vitest'
import { quickInputs } from './quickSim'
import { compute, priceZoneFor } from './engine'
import { toMonthly } from './billingPeriod'
import { clampTo, INPUT_BOUNDS } from './inputBounds'

describe('quickInputs', () => {
  it('construit un plan unique au prix donné, part à 100 %', () => {
    const inputs = quickInputs({ price: 29, customers: 500 })
    expect(inputs.tiers).toHaveLength(1)
    expect(inputs.tiers[0].price).toBe(29)
    expect(inputs.tiers[0].mix).toBe(1)
    expect(inputs.customers).toBe(500)
  })

  it('déduit un churn dans la zone typique du prix', () => {
    for (const price of [9, 29, 120, 350]) {
      const zone = priceZoneFor(price)
      const { revenueChurn } = quickInputs({ price, customers: 300 })
      expect(revenueChurn, `prix ${price}`).toBeGreaterThanOrEqual(zone.churnMin)
      expect(revenueChurn, `prix ${price}`).toBeLessThanOrEqual(zone.churnMax)
    }
  })

  it('cale le CAC sur un payback d environ 8 mois', () => {
    const inputs = quickInputs({ price: 49, customers: 400 })
    const payback = inputs.cac / (49 * inputs.grossMargin)
    expect(payback).toBeGreaterThan(7)
    expect(payback).toBeLessThan(9)
  })

  it('reste dans les bornes des jauges pour les cas extrêmes', () => {
    for (const [price, customers] of [
      [1, 1],
      [500, 20_000],
      [9, 15_000],
    ] as const) {
      const inputs = quickInputs({ price, customers })
      for (const key of Object.keys(INPUT_BOUNDS) as (keyof typeof INPUT_BOUNDS)[]) {
        if (key === 'baseMultipleOverride') continue
        const value = inputs[key]
        expect(clampTo(INPUT_BOUNDS[key], value), `${price}×${customers}.${key}`).toBe(value)
      }
    }
  })

  it('produit une valorisation finie et positive', () => {
    const results = compute(quickInputs({ price: 19, customers: 800 }))
    expect(Number.isFinite(results.valuation.value)).toBe(true)
    expect(results.valuation.value).toBeGreaterThan(0)
  })
})

describe('cadence de facturation', () => {
  const params = { price: 29, customers: 500 }

  it('ne change pas le revenu quand on change de cadence', () => {
    // Le prix stocké est mensuel dans les trois cas : seule la lecture change.
    // Une remise annuelle qui traînerait ferait tomber le MRR de 17 % au simple
    // basculement, et l'écran passerait pour cassé.
    const monthly = compute(quickInputs(params, 'monthly'))
    const yearly = compute(quickInputs(params, 'yearly'))
    const weekly = compute(quickInputs(params, 'weekly'))

    expect(yearly.revenue.mrr).toBeCloseTo(monthly.revenue.mrr, 6)
    expect(weekly.revenue.mrr).toBeCloseTo(monthly.revenue.mrr, 6)
  })

  it("compte l'engagement annuel là où il compte : le churn", () => {
    const monthly = compute(quickInputs(params, 'monthly'))
    const yearly = compute(quickInputs(params, 'yearly'))

    // Un client engagé douze mois ne décide qu'au renouvellement : le churn
    // effectif tombe de moitié, et le multiple monte.
    expect(quickInputs(params, 'yearly').annualShare).toBe(1)
    expect(yearly.valuation.multiple).toBeGreaterThan(monthly.valuation.multiple)
  })
})

describe('coût par client', () => {
  it('applique le montant donné, sans le traduire en pourcentage arrondi', () => {
    // 6 € de coût sur un prix de 29 € : le moteur doit dépenser 6 € par client,
    // soit 3 000 € pour cinq cents clients. Passer par une marge arrondie au
    // point de pourcentage donnerait 2 900 € ou 3 190 €, et l'écran mentirait
    // sur le seul chiffre que la personne a saisi.
    const results = compute(quickInputs({ price: 29, customers: 500 }, 'monthly', { costPerCustomer: 6 }))
    expect(results.revenue.variableCost).toBeCloseTo(3_000, 6)
  })

  it('reste cohérent quand le coût égale le prix', () => {
    const results = compute(quickInputs({ price: 29, customers: 500 }, 'monthly', { costPerCustomer: 29 }))
    // Marge brute nulle : tout le revenu part dans le service, et il ne reste
    // rien pour payer l'acquisition ni les charges fixes.
    expect(results.revenue.variableCost).toBeCloseTo(results.revenue.mrr, 6)
    expect(results.revenue.sdeMonthly).toBeLessThan(0)
  })

  it('déduit le coût du prix tant qu’on ne l’a pas donné', () => {
    const derived = compute(quickInputs({ price: 29, customers: 500 }))
    // 15 % de 29 €, la marge par défaut de l'app.
    expect(derived.revenue.variableCost / derived.revenue.mrr).toBeCloseTo(0.15, 6)
  })
})

describe('supplément par client', () => {
  const params = { price: 29, customers: 500 }

  it("s'ajoute au prix et au revenu", () => {
    // 29 € de plan et 6 € de supplément : chaque client paie 35 €, et les cinq
    // cents en font 17 500 € par mois.
    const results = compute(quickInputs(params, 'monthly', { addOnPerCustomer: 6 }))
    expect(results.revenue.arpu).toBeCloseTo(35, 6)
    expect(results.revenue.mrr).toBeCloseTo(17_500, 6)
  })

  it('déplace le palier quand il change ce que le client rapporte', () => {
    // Le palier de Janz se lit sur le revenu par client, pas sur le prix du
    // plan : un supplément qui double l'addition doit pouvoir changer d'animal.
    const plain = compute(quickInputs({ price: 29, customers: 500 }))
    const boosted = compute(quickInputs({ price: 29, customers: 500 }, 'monthly', { addOnPerCustomer: 200 }))
    expect(boosted.revenue.arpu).toBeGreaterThan(plain.revenue.arpu)
  })

  it('se saisit dans la cadence choisie, sans perdre les semaines', () => {
    // 6 € par semaine font 26 € par mois : le film complet de la conversion est
    // gardé par billingPeriod.test.ts, on vérifie ici qu'il arrive au moteur.
    const weekly = compute(quickInputs(params, 'weekly', { addOnPerCustomer: toMonthly(6, 'weekly') }))
    expect(weekly.revenue.arpu).toBeCloseTo(29 + 26, 6)
  })
})
