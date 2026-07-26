export type Level = 'low' | 'medium' | 'high'
export type ProfileLabel = 'micro' | 'bootstrapped' | 'established'
export type Health = 'good' | 'warn' | 'bad'

export interface Tier {
  name: string
  /** Prix mensuel en euros. */
  price: number
  /** Part du mix, en décimal non normalisé. */
  mix: number
}

export interface SimulatorInputs {
  tiers: [Tier, Tier, Tier]
  customers: number
  newCustomersPerMonth: number
  /** Coût d'acquisition par client, en euros. */
  cac: number
  /** Churn de revenu mensuel brut, décimal. */
  revenueChurn: number
  /** Revenu d'expansion mensuel, décimal. */
  expansion: number
  /** Marge brute, décimal. */
  grossMargin: number
  /** Charges fixes mensuelles hors acquisition, en euros. */
  fixedCosts: number
  founderDependency: Level
  techTransferability: Level
  /** Part du MRR portée par le plus gros client, décimal. */
  topClientShare: number
  ageMonths: number
  /** `null` = suivre la courbe de barème. */
  baseMultipleOverride: number | null
}

export interface Revenue {
  arpu: number
  mrr: number
  arr: number
  newMrr: number
  variableCost: number
  acquisitionCost: number
  sdeMonthly: number
  sdeAnnual: number
  netMargin: number
}

export interface Economics {
  ltv: number | null
  ltvCacRatio: number | null
  paybackMonths: number | null
  nrr: number
}

export interface Growth {
  netChurn: number
  /** `null` si la rétention nette est négative : il n'y a pas de plafond. */
  mrrCeiling: number | null
  growthMoM: number
  growthAnnual: number
  /** En points, pas en décimal. */
  ruleOf40: number
}

export interface ValuationLine {
  key: string
  label: string
  /** Delta en pourcentage du multiple de base, décimal. */
  deltaPct: number
  /** Le même delta converti en points de multiple, pour l'affichage. */
  deltaMultiple: number
}

export interface Valuation {
  baseMultiple: number
  isOverridden: boolean
  lines: ValuationLine[]
  adjSum: number
  adjClamped: boolean
  multiple: number
  multipleClamped: boolean
  /** Poids de la base ARR dans le fondu, de 0 à 1. */
  arrWeight: number
  valuationSde: number
  valuationArr: number
  value: number
  low: number
  high: number
  profileLabel: ProfileLabel
  isLossMaking: boolean
}

export interface SimulatorResults {
  revenue: Revenue
  economics: Economics
  growth: Growth
  /** 37 points : mois 0 à 36. */
  projection: number[]
  valuation: Valuation
}
