import { describe, expect, it } from 'vitest'
import { LOG_STEPS, positionToValue, valueToPosition } from './logScale'

describe('positionToValue', () => {
  it('rend exactement 0 à la position 0', () => {
    expect(positionToValue(0, 20_000)).toBe(0)
  })

  it('rend 1 à la première position non nulle', () => {
    expect(positionToValue(1, 20_000)).toBe(1)
  })

  it('rend le maximum à la dernière position', () => {
    expect(positionToValue(LOG_STEPS, 20_000)).toBe(20_000)
  })

  it('croît de façon monotone', () => {
    let previous = -1
    for (let position = 0; position <= LOG_STEPS; position++) {
      const value = positionToValue(position, 20_000)
      expect(value).toBeGreaterThanOrEqual(previous)
      previous = value
    }
  })

  it('donne une résolution fine dans le bas de l échelle', () => {
    expect(positionToValue(Math.round(LOG_STEPS / 2), 20_000)).toBeLessThan(200)
  })

  it('rend des entiers', () => {
    for (const position of [7, 55, 123, 200]) {
      expect(Number.isInteger(positionToValue(position, 20_000))).toBe(true)
    }
  })
})

describe('valueToPosition', () => {
  it('est l inverse de positionToValue aux extrémités', () => {
    expect(valueToPosition(0, 20_000)).toBe(0)
    expect(valueToPosition(20_000, 20_000)).toBe(LOG_STEPS)
  })

  it('fait un aller-retour stable', () => {
    for (const value of [1, 12, 340, 5_000, 20_000]) {
      const roundTrip = positionToValue(valueToPosition(value, 20_000), 20_000)
      expect(Math.abs(roundTrip - value) / Math.max(value, 1)).toBeLessThan(0.05)
    }
  })

  it('écrête une valeur hors bornes', () => {
    expect(valueToPosition(-10, 20_000)).toBe(0)
    expect(valueToPosition(99_999, 20_000)).toBe(LOG_STEPS)
  })
})
