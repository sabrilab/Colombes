import { describe, expect, it } from 'vitest'
import { clamp, interpolate, logAnchors, smoothstep, type Anchor } from './interpolate'

const ANCHORS: Anchor[] = [
  [0, 10],
  [10, 20],
  [20, 0],
]

describe('clamp', () => {
  it('laisse passer une valeur dans les bornes', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('écrête en bas et en haut', () => {
    expect(clamp(-3, 0, 10)).toBe(0)
    expect(clamp(42, 0, 10)).toBe(10)
  })
})

describe('interpolate', () => {
  it('rend la valeur exacte à chaque ancrage', () => {
    expect(interpolate(ANCHORS, 0)).toBe(10)
    expect(interpolate(ANCHORS, 10)).toBe(20)
    expect(interpolate(ANCHORS, 20)).toBe(0)
  })

  it('interpole linéairement entre deux ancrages', () => {
    expect(interpolate(ANCHORS, 5)).toBeCloseTo(15)
    expect(interpolate(ANCHORS, 15)).toBeCloseTo(10)
  })

  it('écrête hors du domaine au lieu d extrapoler', () => {
    expect(interpolate(ANCHORS, -100)).toBe(10)
    expect(interpolate(ANCHORS, 100)).toBe(0)
  })

  it('est continue sur tout le domaine', () => {
    let previous = interpolate(ANCHORS, -5)
    for (let x = -5; x <= 25; x += 0.01) {
      const current = interpolate(ANCHORS, x)
      expect(Math.abs(current - previous)).toBeLessThan(0.05)
      previous = current
    }
  })
})

describe('smoothstep', () => {
  it('vaut 0 sous la borne basse et 1 au-dessus de la borne haute', () => {
    expect(smoothstep(10, 20, 5)).toBe(0)
    expect(smoothstep(10, 20, 10)).toBe(0)
    expect(smoothstep(10, 20, 20)).toBe(1)
    expect(smoothstep(10, 20, 99)).toBe(1)
  })

  it('vaut 0,5 au milieu', () => {
    expect(smoothstep(10, 20, 15)).toBeCloseTo(0.5)
  })

  it('a une dérivée nulle aux bornes', () => {
    const epsilon = 1e-4
    expect(smoothstep(0, 1, epsilon)).toBeLessThan(epsilon)
    expect(1 - smoothstep(0, 1, 1 - epsilon)).toBeLessThan(epsilon)
  })
})

describe('logAnchors', () => {
  it('remplace chaque abscisse par son logarithme décimal', () => {
    const result = logAnchors([
      [100, 1],
      [1000, 2],
    ])
    expect(result[0][0]).toBeCloseTo(2)
    expect(result[1][0]).toBeCloseTo(3)
    expect(result[0][1]).toBe(1)
  })

  it('protège le logarithme d une abscisse nulle', () => {
    expect(logAnchors([[0, 5]])[0][0]).toBe(0)
  })
})
