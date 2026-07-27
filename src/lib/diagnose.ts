import type { SimulatorResults } from './engine/types'
import { formatCompactCurrency, formatCurrency, formatMultiple, formatPercent } from './format'

export type InsightTone = 'bad' | 'warn' | 'good'

export interface Insight {
  tone: InsightTone
  /** Gabarit à jetons `{nom}` : c'est lui qui est traduit à l'affichage. */
  text: string
  vars?: Record<string, string | number>
}

interface Weighted extends Insight {
  /** Plus c'est haut, plus ça mérite d'être dit en premier. */
  weight: number
}

/**
 * La lecture en direct du scénario : pourquoi ça marche, pourquoi ça coince.
 * Rend 1 à 3 phrases, la plus importante d'abord — le « pourquoi » que les
 * chiffres seuls ne disent pas.
 */
export function diagnose(results: SimulatorResults): Insight[] {
  const { revenue, economics, growth, valuation } = results
  const candidates: Weighted[] = []

  const grossMarginAmount = revenue.mrr - revenue.variableCost
  // Non exposé tel quel par le moteur : reconstitué par différence exacte.
  const fixedCosts = grossMarginAmount - revenue.acquisitionCost - revenue.sdeMonthly

  if (valuation.isLossMaking) {
    candidates.push({
      tone: 'bad',
      weight: 100,
      text: 'You are losing {loss} a month: gross margin ({margin}) does not cover acquisition ({acquisition}) plus fixed costs ({fixed}) — so a profit-based valuation collapses.',
      vars: {
        loss: formatCurrency(Math.abs(revenue.sdeMonthly)),
        margin: formatCompactCurrency(grossMarginAmount),
        acquisition: formatCompactCurrency(revenue.acquisitionCost),
        fixed: formatCompactCurrency(fixedCosts),
      },
    })
  }

  if (economics.nrr < 0.9) {
    candidates.push({
      tone: 'bad',
      weight: 90,
      text: 'Churn is the biggest drag: €100 of today’s revenue melts to {left} within a year (NRR {nrr}). Fixing retention beats any acquisition push.',
      vars: { left: formatCurrency(economics.nrr * 100), nrr: formatPercent(economics.nrr, 0) },
    })
  }

  if (growth.mrrCeiling !== null && revenue.mrr > 0) {
    const ratio = revenue.mrr / growth.mrrCeiling
    if (ratio > 1) {
      candidates.push({
        tone: 'bad',
        weight: 85,
        text: 'MRR sits above its {ceiling} ceiling: at this churn and acquisition pace, revenue shrinks back toward it month after month.',
        vars: { ceiling: formatCompactCurrency(growth.mrrCeiling) },
      })
    } else if (ratio >= 0.6) {
      candidates.push({
        tone: 'warn',
        weight: 70,
        text: 'You have already reached {share} of your {ceiling} MRR ceiling: growth flattens out soon unless churn drops or acquisition rises.',
        vars: { share: formatPercent(ratio, 0), ceiling: formatCompactCurrency(growth.mrrCeiling) },
      })
    }
  }

  if (economics.paybackMonths !== null) {
    if (economics.paybackMonths > 18) {
      candidates.push({
        tone: 'bad',
        weight: 65,
        text: 'Each new customer takes {months} months to pay back their CAC — growth burns cash long before it returns any.',
        vars: { months: Math.round(economics.paybackMonths) },
      })
    } else if (economics.paybackMonths > 12) {
      candidates.push({
        tone: 'warn',
        weight: 50,
        text: 'CAC payback runs {months} months: acquisition works, but it ties up cash for over a year.',
        vars: { months: Math.round(economics.paybackMonths) },
      })
    }
  }

  if (economics.nrr >= 1.02) {
    candidates.push({
      tone: 'good',
      weight: 60,
      text: 'Your existing base compounds on its own: expansion outpaces churn (NRR {nrr}) — revenue grows even with zero new customers.',
      vars: { nrr: formatPercent(economics.nrr, 0) },
    })
  }

  if (
    economics.ltvCacRatio !== null &&
    economics.ltvCacRatio >= 3 &&
    economics.paybackMonths !== null &&
    economics.paybackMonths <= 12
  ) {
    candidates.push({
      tone: 'good',
      weight: 40,
      text: 'Acquisition is a profitable machine: every euro of CAC returns {ratio}€ of lifetime margin, repaid in {months} months.',
      vars: { ratio: economics.ltvCacRatio.toFixed(1), months: Math.round(economics.paybackMonths) },
    })
  }

  if (growth.ruleOf40 < 20) {
    candidates.push({
      tone: 'warn',
      weight: 45,
      text: 'Rule of 40 at {score}: neither growth nor profitability carries the scenario right now.',
      vars: { score: growth.ruleOf40.toFixed(0) },
    })
  } else if (growth.ruleOf40 >= 40 && !valuation.isLossMaking) {
    candidates.push({
      tone: 'good',
      weight: 30,
      text: 'Rule of 40 at {score}: the growth-profit balance sits in the healthy zone buyers look for.',
      vars: { score: growth.ruleOf40.toFixed(0) },
    })
  }

  if (candidates.length === 0) {
    candidates.push({
      tone: 'good',
      weight: 10,
      text: 'A balanced scenario: {multiple} on {profit} of annual profit. Retention and margin are the levers that move the needle most.',
      vars: { multiple: formatMultiple(valuation.multiple), profit: formatCompactCurrency(revenue.sdeAnnual) },
    })
  }

  return candidates
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map(({ tone, text, vars }) => ({ tone, text, vars }))
}
