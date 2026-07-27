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
  /** De 1 à 4 plans (TIER_COUNT_BOUNDS dans inputBounds.ts). */
  tiers: Tier[]
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
  /** Taille de l'audience que vous possédez déjà : liste, abonnés, réseau. */
  audienceSize: number
  /** Part de cette audience qui devient cliente chaque mois, décimal. */
  audienceConversion: number
  /** Part des clients qui paient l'année d'avance, décimal. */
  annualShare: number
  /** Remise accordée pour le paiement annuel, décimal. */
  annualDiscount: number
  /** Lifetime deals vendus par mois. */
  ltdPerMonth: number
  /** Prix d'un lifetime deal, en euros. */
  ltdPrice: number
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
  /** Nouveaux clients venus de l'audience détenue, donc sans coût d'achat. */
  ownedNewCustomers: number
  /** Coût d'acquisition moyen une fois l'audience prise en compte. */
  blendedCac: number
  /** Encaissé d'avance par les abonnements annuels, sur un an. */
  cashUpfront: number
  /**
   * Trésorerie mensuelle des lifetime deals. Volontairement à l'écart du
   * MRR, de l'ARR et de la valorisation : ce n'est pas du récurrent, et
   * l'inclure gonflerait un multiple qui se paie sur la récurrence.
   */
  ltdCashMonthly: number
}

export interface Economics {
  ltv: number | null
  ltvCacRatio: number | null
  paybackMonths: number | null
  /** NRR annuel : rétention nette mensuelle composée sur 12 mois, décimal. */
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
