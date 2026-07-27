import {
  ADJ_SUM_MAX,
  ADJ_SUM_MIN,
  ADJUSTMENT_ANCHORS,
  ARR_BASE_ANCHORS,
  ARR_BLEND_FROM,
  ARR_BLEND_TO,
  LEVEL_DELTAS,
  MULTIPLE_MAX,
  MULTIPLE_MIN,
  PROFILE_MRR_THRESHOLDS,
  SDE_BASE_ANCHORS,
  VALUATION_SPREAD,
} from './benchmarks'
import { clamp, interpolate, smoothstep } from './interpolate'
import { effectiveChurn } from './revenue'
import type {
  Economics,
  Growth,
  ProfileLabel,
  Revenue,
  SimulatorInputs,
  Valuation,
  ValuationLine,
} from './types'

/** Purement cosmétique : ces seuils ne participent à aucun calcul. */
export function profileLabelFor(mrr: number): ProfileLabel {
  if (mrr < PROFILE_MRR_THRESHOLDS.micro) return 'micro'
  return mrr < PROFILE_MRR_THRESHOLDS.established ? 'bootstrapped' : 'established'
}

export function computeValuation(
  inputs: SimulatorInputs,
  revenue: Revenue,
  economics: Economics,
  growth: Growth,
): Valuation {
  // Poids de la base ARR. smoothstep a une dérivée nulle aux bornes :
  // la bascule profit → revenu est lisse, sans coude visible.
  const arrWeight = smoothstep(ARR_BLEND_FROM, ARR_BLEND_TO, revenue.mrr)

  const baseSde = interpolate(SDE_BASE_ANCHORS, Math.log10(Math.max(revenue.mrr, 1)))
  const baseArr = interpolate(ARR_BASE_ANCHORS, Math.log10(Math.max(revenue.arr, 1)))
  const curveBase = (1 - arrWeight) * baseSde + arrWeight * baseArr

  const baseMultiple = inputs.baseMultipleOverride ?? curveBase
  const isOverridden = inputs.baseMultipleOverride !== null

  const deltas: Array<Pick<ValuationLine, 'key' | 'label' | 'deltaPct'>> = [
    {
      key: 'revenueChurn',
      label: 'Churn',
      deltaPct: interpolate(ADJUSTMENT_ANCHORS.revenueChurn, effectiveChurn(inputs)),
    },
    {
      key: 'growthMoM',
      label: 'Monthly growth',
      deltaPct: interpolate(ADJUSTMENT_ANCHORS.growthMoM, growth.growthMoM),
    },
    { key: 'nrr', label: 'NRR', deltaPct: interpolate(ADJUSTMENT_ANCHORS.nrr, economics.nrr) },
    {
      key: 'ruleOf40',
      label: 'Rule of 40',
      deltaPct: interpolate(ADJUSTMENT_ANCHORS.ruleOf40, growth.ruleOf40),
    },
    {
      key: 'grossMargin',
      label: 'Gross margin',
      deltaPct: interpolate(ADJUSTMENT_ANCHORS.grossMargin, inputs.grossMargin),
    },
    {
      key: 'topClientShare',
      label: 'Client concentration',
      deltaPct: interpolate(ADJUSTMENT_ANCHORS.topClientShare, inputs.topClientShare),
    },
    {
      key: 'ageMonths',
      label: 'Age',
      deltaPct: interpolate(ADJUSTMENT_ANCHORS.ageMonths, inputs.ageMonths),
    },
    {
      key: 'founderDependency',
      label: 'Founder dependency',
      deltaPct: LEVEL_DELTAS.founderDependency[inputs.founderDependency],
    },
    {
      key: 'techTransferability',
      label: 'Tech transferability',
      deltaPct: LEVEL_DELTAS.techTransferability[inputs.techTransferability],
    },
  ]

  // deltaMultiple est calculé sur le cumul non écrêté, pour que
  // baseMultiple + Σ deltaMultiple reconcilie avec le multiple avant écrêtage.
  // Deux écrêtages indépendants suivent (adjSum puis multiple) ; l'identité ne
  // tient que si ni adjClamped ni multipleClamped ne sont vrais.
  const lines: ValuationLine[] = deltas.map((delta) => ({
    ...delta,
    deltaMultiple: baseMultiple * delta.deltaPct,
  }))

  const rawAdjSum = lines.reduce((total, line) => total + line.deltaPct, 0)
  const adjSum = clamp(rawAdjSum, ADJ_SUM_MIN, ADJ_SUM_MAX)
  const adjClamped = adjSum !== rawAdjSum

  const rawMultiple = baseMultiple * (1 + adjSum)
  const multiple = clamp(rawMultiple, MULTIPLE_MIN, MULTIPLE_MAX)
  const multipleClamped = multiple !== rawMultiple

  // Un actif déficitaire n'a pas une valeur de rendement négative : elle est nulle.
  const valuationSde = Math.max(0, multiple * revenue.sdeAnnual)
  const valuationArr = multiple * revenue.arr
  const value = (1 - arrWeight) * valuationSde + arrWeight * valuationArr

  return {
    baseMultiple,
    isOverridden,
    lines,
    adjSum,
    adjClamped,
    multiple,
    multipleClamped,
    arrWeight,
    valuationSde,
    valuationArr,
    value,
    low: value * (1 - VALUATION_SPREAD),
    high: value * (1 + VALUATION_SPREAD),
    profileLabel: profileLabelFor(revenue.mrr),
    isLossMaking: revenue.sdeAnnual <= 0,
  }
}
