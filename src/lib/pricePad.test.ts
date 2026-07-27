import { describe, expect, it } from 'vitest'
import {
  animalFor,
  isoRevenueSegment,
  PAD_BOUNDS,
  PRICING_ANIMALS,
  padToParams,
  paramsToPad,
} from './pricePad'

describe('padToParams', () => {
  it('place le coin bas-gauche sur le minimum des deux axes', () => {
    const { price, customers } = padToParams({ x: 0, y: 1 })
    expect(price).toBe(PAD_BOUNDS.price.min)
    expect(customers).toBe(PAD_BOUNDS.customers.min)
  })

  it('place le coin haut-droit sur le maximum des deux axes', () => {
    const { price, customers } = padToParams({ x: 1, y: 0 })
    expect(price).toBe(PAD_BOUNDS.price.max)
    expect(customers).toBe(PAD_BOUNDS.customers.max)
  })

  it('inverse l axe vertical : monter augmente le prix', () => {
    const low = padToParams({ x: 0.5, y: 0.9 })
    const high = padToParams({ x: 0.5, y: 0.1 })
    expect(high.price).toBeGreaterThan(low.price)
  })

  it('écrête une position hors du pad plutôt que de sortir des bornes', () => {
    const under = padToParams({ x: -3, y: 4 })
    expect(under.customers).toBe(PAD_BOUNDS.customers.min)
    expect(under.price).toBe(PAD_BOUNDS.price.min)

    const over = padToParams({ x: 9, y: -9 })
    expect(over.customers).toBe(PAD_BOUNDS.customers.max)
    expect(over.price).toBe(PAD_BOUNDS.price.max)
  })

  it('progresse en log : la moitié du pad n est pas la moitié de la plage', () => {
    const middle = padToParams({ x: 0.5, y: 0.5 })
    // Milieu géométrique, non arithmétique : très en dessous de max/2.
    expect(middle.customers).toBeLessThan(PAD_BOUNDS.customers.max / 4)
    expect(middle.price).toBeLessThan(PAD_BOUNDS.price.max / 4)
  })
})

describe('PRICING_ANIMALS', () => {
  it('couvre la plage de prix du pad sans trou ni chevauchement', () => {
    expect(PRICING_ANIMALS[0].minPrice).toBe(PAD_BOUNDS.price.min)
    for (let i = 1; i < PRICING_ANIMALS.length; i++) {
      expect(PRICING_ANIMALS[i].minPrice, PRICING_ANIMALS[i].name).toBe(
        PRICING_ANIMALS[i - 1].maxPrice,
      )
    }
    expect(PRICING_ANIMALS.at(-1)!.maxPrice).toBeGreaterThanOrEqual(PAD_BOUNDS.price.max)
  })

  it('monte en ordre de grandeur, du moins cher au plus cher', () => {
    const prices = PRICING_ANIMALS.map((animal) => animal.minPrice)
    expect([...prices].sort((a, b) => a - b)).toEqual(prices)
  })
})

describe('animalFor', () => {
  it('classe un prix dans son palier', () => {
    // Repères de Janz, ramenés au mois : lapin ≈ 100 $/an, cerf ≈ 1 000 $/an.
    expect(animalFor(9).name).toBe('Rabbits')
    expect(animalFor(83).name).toBe('Deer')
  })

  it('classe tout prix, même hors bornes', () => {
    expect(animalFor(0).name).toBe(PRICING_ANIMALS[0].name)
    expect(animalFor(99_999).name).toBe(PRICING_ANIMALS.at(-1)!.name)
  })
})

describe('isoRevenueSegment', () => {
  it('rend un segment dont les deux bouts portent le MRR visé', () => {
    const segment = isoRevenueSegment(10_000)
    expect(segment).not.toBeNull()
    for (const end of [segment!.from, segment!.to]) {
      const { price, customers } = padToParams(end)
      expect(price * customers).toBeGreaterThan(10_000 * 0.97)
      expect(price * customers).toBeLessThan(10_000 * 1.03)
    }
  })

  it('garde ses extrémités dans le pad', () => {
    for (const mrr of [100, 10_000, 1_000_000]) {
      const segment = isoRevenueSegment(mrr)
      expect(segment, `mrr ${mrr}`).not.toBeNull()
      for (const end of [segment!.from, segment!.to]) {
        expect(end.x).toBeGreaterThanOrEqual(0)
        expect(end.x).toBeLessThanOrEqual(1)
        expect(end.y).toBeGreaterThanOrEqual(0)
        expect(end.y).toBeLessThanOrEqual(1)
      }
    }
  })

  it('rend null quand la courbe ne traverse pas le pad', () => {
    // Au-delà de prix max × clients max, aucun point du pad n'atteint ce MRR.
    expect(isoRevenueSegment(PAD_BOUNDS.price.max * PAD_BOUNDS.customers.max * 2)).toBeNull()
    expect(isoRevenueSegment(0)).toBeNull()
  })
})

describe('paramsToPad', () => {
  it('fait un aller-retour stable', () => {
    for (const [price, customers] of [
      [9, 100],
      [29, 500],
      [290, 85],
      [1, 1],
    ] as const) {
      const pad = paramsToPad({ price, customers })
      const back = padToParams(pad)
      // Tolérance d'un pas d'arrondi entier.
      expect(Math.abs(back.price - price), `price ${price}`).toBeLessThanOrEqual(1)
      expect(Math.abs(back.customers - customers) / customers, `cust ${customers}`).toBeLessThan(
        0.02,
      )
    }
  })

  it('rend des coordonnées toujours dans [0, 1]', () => {
    for (const [price, customers] of [
      [0, 0],
      [99_999, 99_999],
      [-5, -5],
    ] as const) {
      const { x, y } = paramsToPad({ price, customers })
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThanOrEqual(1)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThanOrEqual(1)
    }
  })
})
