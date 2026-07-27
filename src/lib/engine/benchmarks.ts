import { logAnchors, type Anchor } from './interpolate'
import type { Health, Level } from './types'

/**
 * Point unique de vérité pour tout chiffre de marché.
 *
 * Sources : transactions observées sur les places de marché spécialisées
 * (Acquire.com, Empire Flippers, Flippa) et chez les brokers SaaS
 * (FE International, Quiet Light), après la compression des multiples de 2022.
 * Révision annuelle recommandée — ce fichier doit rester le seul à éditer.
 */

/** Multiple du SDE annuel, indexé sur log10(MRR mensuel en euros). */
export const SDE_BASE_ANCHORS: Anchor[] = logAnchors([
  [500, 2.2],
  [2_000, 2.6],
  [5_000, 2.9],
  [15_000, 3.3],
  [50_000, 3.8],
  [150_000, 4.3],
])

/** Multiple de l'ARR, indexé sur log10(ARR en euros). */
export const ARR_BASE_ANCHORS: Anchor[] = logAnchors([
  [600_000, 2.6],
  [1_200_000, 3.0],
  [3_000_000, 3.6],
  [10_000_000, 4.5],
])

/** Bornes du fondu SDE → ARR, en MRR mensuel. */
export const ARR_BLEND_FROM = 60_000
export const ARR_BLEND_TO = 140_000

/**
 * Seuils des libellés de profil, en MRR mensuel. Purement cosmétiques :
 * aucun calcul de valorisation ne les lit, ils n'alimentent qu'un badge.
 * Ils vivent ici malgré tout, parce que ce fichier est le point unique de
 * vérité pour tout chiffre de marché — y compris ceux qui ne pilotent rien.
 */
export const PROFILE_MRR_THRESHOLDS = {
  micro: 5_000,
  established: 100_000,
} as const

/**
 * Deltas exprimés en pourcentage du multiple de base, en décimal.
 * Unité de l'abscisse indiquée par courbe.
 */
export const ADJUSTMENT_ANCHORS = {
  /** Abscisse : churn de revenu mensuel, décimal. */
  revenueChurn: [
    [0, 0.2],
    [0.02, 0.12],
    [0.03, 0.05],
    [0.05, 0],
    [0.08, -0.15],
    [0.15, -0.3],
  ] as Anchor[],
  /** Abscisse : croissance mensuelle du MRR, décimal. */
  growthMoM: [
    [0, -0.1],
    [0.02, 0],
    [0.05, 0.12],
    [0.1, 0.22],
    [0.2, 0.35],
  ] as Anchor[],
  /** Abscisse : NRR, décimal (1 = 100 %). */
  nrr: [
    [0.8, -0.12],
    [0.95, -0.04],
    [1, 0],
    [1.1, 0.11],
    [1.3, 0.22],
  ] as Anchor[],
  /** Abscisse : Rule of 40, en points. */
  ruleOf40: [
    [0, -0.09],
    [20, -0.04],
    [40, 0.04],
    [60, 0.1],
    [100, 0.17],
  ] as Anchor[],
  /** Abscisse : marge brute, décimal. */
  grossMargin: [
    [0.5, -0.12],
    [0.7, -0.05],
    [0.8, 0],
    [0.9, 0.06],
  ] as Anchor[],
  /** Abscisse : part du plus gros client, décimal. */
  topClientShare: [
    [0, 0.03],
    [0.1, 0],
    [0.25, -0.09],
    [0.5, -0.2],
  ] as Anchor[],
  /** Abscisse : ancienneté, en mois. */
  ageMonths: [
    [0, -0.12],
    [12, -0.05],
    [24, 0],
    [48, 0.06],
  ] as Anchor[],
} as const

/** Critères discrets : non pilotés par une jauge, la continuité ne s'applique pas. */
export const LEVEL_DELTAS: Record<'founderDependency' | 'techTransferability', Record<Level, number>> = {
  founderDependency: { low: 0.06, medium: 0, high: -0.12 },
  techTransferability: { low: -0.07, medium: 0, high: 0.04 },
}

/** Bornes du cumul des deltas, avant application au multiple de base. */
export const ADJ_SUM_MIN = -0.6
export const ADJ_SUM_MAX = 0.9

/** Bornes absolues du multiple final. */
export const MULTIPLE_MIN = 1
export const MULTIPLE_MAX = 10

/** Demi-largeur de la fourchette affichée. */
export const VALUATION_SPREAD = 0.15

/**
 * Réduction du churn apportée par l'engagement annuel. Un client engagé
 * douze mois ne peut pas partir chaque mois : il ne décide qu'au
 * renouvellement. Les cohortes annuelles retiennent couramment de l'ordre
 * du double des mensuelles ; on retient donc la moitié du churn.
 */
export const ANNUAL_CHURN_RELIEF = 0.5

export const PROJECTION_MONTHS = 36

export interface PriceZone {
  key: 'b2c' | 'smb' | 'b2b' | 'midmarket'
  label: string
  /** Borne haute d'ARPU, exclue. */
  maxArpu: number
  churnMin: number
  churnMax: number
}

export const PRICE_ZONES: PriceZone[] = [
  { key: 'b2c', label: 'B2C / prosumer', maxArpu: 15, churnMin: 0.05, churnMax: 0.08 },
  { key: 'smb', label: 'Prosumer / micro-SMB', maxArpu: 50, churnMin: 0.03, churnMax: 0.05 },
  { key: 'b2b', label: 'SMB / B2B', maxArpu: 200, churnMin: 0.02, churnMax: 0.03 },
  { key: 'midmarket', label: 'B2B mid-market', maxArpu: Infinity, churnMin: 0.01, churnMax: 0.02 },
]

export function priceZoneFor(arpu: number): PriceZone {
  return PRICE_ZONES.find((zone) => arpu < zone.maxArpu) ?? PRICE_ZONES[PRICE_ZONES.length - 1]
}

export type HealthMetric =
  | 'revenueChurn'
  | 'ltvCacRatio'
  | 'paybackMonths'
  | 'nrr'
  | 'ruleOf40'
  | 'grossMargin'

interface Threshold {
  /** 'up' : plus c'est haut, mieux c'est. 'down' : l'inverse. */
  direction: 'up' | 'down'
  good: number
  warn: number
  label: string
}

export const HEALTH_THRESHOLDS: Record<HealthMetric, Threshold> = {
  revenueChurn: { direction: 'down', good: 0.03, warn: 0.05, label: 'Good ≤ 3%/mo, watch up to 5%' },
  ltvCacRatio: { direction: 'up', good: 3, warn: 1.5, label: 'Good ≥ 3, watch down to 1.5' },
  paybackMonths: { direction: 'down', good: 12, warn: 18, label: 'Good ≤ 12 months, watch up to 18' },
  nrr: { direction: 'up', good: 1, warn: 0.9, label: 'Good ≥ 100%, watch down to 90%' },
  ruleOf40: { direction: 'up', good: 40, warn: 20, label: 'Good ≥ 40, watch down to 20' },
  grossMargin: { direction: 'up', good: 0.8, warn: 0.7, label: 'Good ≥ 80%, watch down to 70%' },
}

export function healthOf(metric: HealthMetric, value: number | null): Health | null {
  if (value === null || !Number.isFinite(value)) return null
  const { direction, good, warn } = HEALTH_THRESHOLDS[metric]
  if (direction === 'up') {
    if (value >= good) return 'good'
    return value >= warn ? 'warn' : 'bad'
  }
  if (value <= good) return 'good'
  return value <= warn ? 'warn' : 'bad'
}
