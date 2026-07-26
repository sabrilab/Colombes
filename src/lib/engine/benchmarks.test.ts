import { describe, expect, it } from 'vitest'
import { interpolate } from './interpolate'
import {
  ADJ_SUM_MAX,
  ADJ_SUM_MIN,
  ADJUSTMENT_ANCHORS,
  ARR_BASE_ANCHORS,
  ARR_BLEND_FROM,
  ARR_BLEND_TO,
  HEALTH_THRESHOLDS,
  LEVEL_DELTAS,
  MULTIPLE_MAX,
  MULTIPLE_MIN,
  PRICE_ZONES,
  SDE_BASE_ANCHORS,
  healthOf,
  priceZoneFor,
} from './benchmarks'

describe('courbes de base', () => {
  it('rend les multiples de la spec aux ancrages SDE', () => {
    expect(interpolate(SDE_BASE_ANCHORS, Math.log10(500))).toBeCloseTo(2.2)
    expect(interpolate(SDE_BASE_ANCHORS, Math.log10(5000))).toBeCloseTo(2.9)
    expect(interpolate(SDE_BASE_ANCHORS, Math.log10(150000))).toBeCloseTo(4.3)
  })

  it('rend les multiples de la spec aux ancrages ARR', () => {
    expect(interpolate(ARR_BASE_ANCHORS, Math.log10(600000))).toBeCloseTo(2.6)
    expect(interpolate(ARR_BASE_ANCHORS, Math.log10(10000000))).toBeCloseTo(4.5)
  })

  it('croît avec la taille', () => {
    const small = interpolate(SDE_BASE_ANCHORS, Math.log10(1000))
    const large = interpolate(SDE_BASE_ANCHORS, Math.log10(100000))
    expect(large).toBeGreaterThan(small)
  })
})

describe('ancrages d ajustement', () => {
  it('annule le delta de churn au repère de 5 %', () => {
    expect(interpolate(ADJUSTMENT_ANCHORS.revenueChurn, 0.05)).toBeCloseTo(0)
  })

  it('récompense un churn faible et pénalise un churn fort', () => {
    expect(interpolate(ADJUSTMENT_ANCHORS.revenueChurn, 0)).toBeCloseTo(0.2)
    expect(interpolate(ADJUSTMENT_ANCHORS.revenueChurn, 0.15)).toBeCloseTo(-0.3)
  })

  it('annule le delta de NRR à 100 %', () => {
    expect(interpolate(ADJUSTMENT_ANCHORS.nrr, 1)).toBeCloseTo(0)
  })

  it('annule le delta de marge brute à 80 %', () => {
    expect(interpolate(ADJUSTMENT_ANCHORS.grossMargin, 0.8)).toBeCloseTo(0)
  })

  it('exprime la Rule of 40 en points et non en décimal', () => {
    expect(interpolate(ADJUSTMENT_ANCHORS.ruleOf40, 40)).toBeCloseTo(0.04)
  })
})

describe('LEVEL_DELTAS', () => {
  it('neutralise le niveau medium', () => {
    expect(LEVEL_DELTAS.founderDependency.medium).toBe(0)
    expect(LEVEL_DELTAS.techTransferability.medium).toBe(0)
  })

  it('pénalise une forte dépendance au fondateur', () => {
    expect(LEVEL_DELTAS.founderDependency.high).toBeLessThan(0)
    expect(LEVEL_DELTAS.founderDependency.low).toBeGreaterThan(0)
  })
})

describe('priceZoneFor', () => {
  it('classe l ARPU dans la bonne zone', () => {
    expect(priceZoneFor(9).key).toBe('b2c')
    expect(priceZoneFor(29).key).toBe('smb')
    expect(priceZoneFor(120).key).toBe('b2b')
    expect(priceZoneFor(400).key).toBe('midmarket')
  })

  it('couvre toute la plage des ARPU positifs', () => {
    for (const arpu of [0, 0.5, 14.99, 15, 50, 200, 10000]) {
      expect(priceZoneFor(arpu)).toBeDefined()
    }
  })

  it('donne une plage de churn plausible croissante vers le bas de gamme', () => {
    expect(priceZoneFor(9).churnMin).toBeGreaterThan(priceZoneFor(400).churnMin)
  })
})

describe('healthOf', () => {
  it('juge le churn selon les seuils de la spec', () => {
    expect(healthOf('revenueChurn', 0.02)).toBe('good')
    expect(healthOf('revenueChurn', 0.04)).toBe('warn')
    expect(healthOf('revenueChurn', 0.07)).toBe('bad')
  })

  it('juge le ratio LTV:CAC dans le sens croissant', () => {
    expect(healthOf('ltvCacRatio', 4)).toBe('good')
    expect(healthOf('ltvCacRatio', 2)).toBe('warn')
    expect(healthOf('ltvCacRatio', 1)).toBe('bad')
  })

  it('juge le payback dans le sens décroissant', () => {
    expect(healthOf('paybackMonths', 8)).toBe('good')
    expect(healthOf('paybackMonths', 15)).toBe('warn')
    expect(healthOf('paybackMonths', 24)).toBe('bad')
  })

  it('rend null pour une valeur non définie', () => {
    expect(healthOf('ltvCacRatio', null)).toBeNull()
  })
})

describe('propriétés structurelles du barème', () => {
  const BETTER_WHEN_HIGHER = ['growthMoM', 'nrr', 'ruleOf40', 'grossMargin', 'ageMonths'] as const
  const BETTER_WHEN_LOWER = ['revenueChurn', 'topClientShare'] as const

  it('récompense de façon monotone les critères où plus est mieux', () => {
    for (const key of BETTER_WHEN_HIGHER) {
      const anchors = ADJUSTMENT_ANCHORS[key]
      for (let i = 1; i < anchors.length; i++) {
        expect(anchors[i][1]).toBeGreaterThan(anchors[i - 1][1])
      }
    }
  })

  it('pénalise de façon monotone les critères où plus est pire', () => {
    for (const key of BETTER_WHEN_LOWER) {
      const anchors = ADJUSTMENT_ANCHORS[key]
      for (let i = 1; i < anchors.length; i++) {
        expect(anchors[i][1]).toBeLessThan(anchors[i - 1][1])
      }
    }
  })

  it('trie toutes les abscisses, condition de validité de interpolate', () => {
    const curves = [...Object.values(ADJUSTMENT_ANCHORS), SDE_BASE_ANCHORS, ARR_BASE_ANCHORS]
    for (const anchors of curves) {
      for (let i = 1; i < anchors.length; i++) {
        expect(anchors[i][0]).toBeGreaterThan(anchors[i - 1][0])
      }
    }
  })

  it('fait croître les multiples de base avec la taille de l actif', () => {
    for (const anchors of [SDE_BASE_ANCHORS, ARR_BASE_ANCHORS]) {
      for (let i = 1; i < anchors.length; i++) {
        expect(anchors[i][1]).toBeGreaterThan(anchors[i - 1][1])
      }
    }
  })

  it('annule le delta au repère de marché de chaque courbe continue', () => {
    expect(interpolate(ADJUSTMENT_ANCHORS.revenueChurn, 0.05)).toBeCloseTo(0)
    expect(interpolate(ADJUSTMENT_ANCHORS.growthMoM, 0.02)).toBeCloseTo(0)
    expect(interpolate(ADJUSTMENT_ANCHORS.nrr, 1)).toBeCloseTo(0)
    expect(interpolate(ADJUSTMENT_ANCHORS.grossMargin, 0.8)).toBeCloseTo(0)
    expect(interpolate(ADJUSTMENT_ANCHORS.topClientShare, 0.1)).toBeCloseTo(0)
    expect(interpolate(ADJUSTMENT_ANCHORS.ageMonths, 24)).toBeCloseTo(0)
  })

  it('borne le cumul des deltas de façon à garder un multiple positif', () => {
    expect(ADJ_SUM_MIN).toBeGreaterThan(-1)
    expect(ADJ_SUM_MAX).toBeGreaterThan(0)
    expect(MULTIPLE_MIN).toBeGreaterThan(0)
    expect(MULTIPLE_MAX).toBeGreaterThan(MULTIPLE_MIN)
    expect(ARR_BLEND_TO).toBeGreaterThan(ARR_BLEND_FROM)
  })

  it('couvre toute la plage d ARPU par des zones croissantes et non vides', () => {
    for (let i = 1; i < PRICE_ZONES.length; i++) {
      expect(PRICE_ZONES[i].maxArpu).toBeGreaterThan(PRICE_ZONES[i - 1].maxArpu)
    }
    expect(PRICE_ZONES[PRICE_ZONES.length - 1].maxArpu).toBe(Infinity)
    for (const zone of PRICE_ZONES) {
      expect(zone.churnMax).toBeGreaterThan(zone.churnMin)
    }
  })

  it('ordonne chaque seuil de santé dans le sens de sa direction', () => {
    for (const threshold of Object.values(HEALTH_THRESHOLDS)) {
      if (threshold.direction === 'up') {
        expect(threshold.good).toBeGreaterThan(threshold.warn)
      } else {
        expect(threshold.good).toBeLessThan(threshold.warn)
      }
    }
  })
})
