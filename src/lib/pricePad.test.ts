import { describe, expect, it } from 'vitest'
import { PAD_BOUNDS, padToParams, paramsToPad } from './pricePad'

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
