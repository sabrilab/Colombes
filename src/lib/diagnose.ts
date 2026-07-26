import type { SimulatorResults } from './engine/types'
import { formatCompactCurrency, formatCurrency, formatMultiple, formatPercent } from './format'

export type InsightTone = 'bad' | 'warn' | 'good'

export interface Insight {
  tone: InsightTone
  text: string
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
      text: `You are losing ${formatCurrency(Math.abs(revenue.sdeMonthly))} a month: gross margin (${formatCompactCurrency(grossMarginAmount)}) does not cover acquisition (${formatCompactCurrency(revenue.acquisitionCost)}) plus fixed costs (${formatCompactCurrency(fixedCosts)}) — so a profit-based valuation collapses.`,
    })
  }

  if (economics.nrr < 0.9) {
    candidates.push({
      tone: 'bad',
      weight: 90,
      text: `Churn is the biggest drag: €100 of today's revenue melts to ${formatCurrency(economics.nrr * 100)} within a year (NRR ${formatPercent(economics.nrr, 0)}). Fixing retention beats any acquisition push.`,
    })
  }

  if (growth.mrrCeiling !== null && revenue.mrr > 0) {
    const ratio = revenue.mrr / growth.mrrCeiling
    if (ratio > 1) {
      candidates.push({
        tone: 'bad',
        weight: 85,
        text: `MRR sits above its ${formatCompactCurrency(growth.mrrCeiling)} ceiling: at this churn and acquisition pace, revenue shrinks back toward it month after month.`,
      })
    } else if (ratio >= 0.6) {
      candidates.push({
        tone: 'warn',
        weight: 70,
        text: `You have already reached ${formatPercent(ratio, 0)} of your ${formatCompactCurrency(growth.mrrCeiling)} MRR ceiling: growth flattens out soon unless churn drops or acquisition rises.`,
      })
    }
  }

  if (economics.paybackMonths !== null) {
    if (economics.paybackMonths > 18) {
      candidates.push({
        tone: 'bad',
        weight: 65,
        text: `Each new customer takes ${Math.round(economics.paybackMonths)} months to pay back their CAC — growth burns cash long before it returns any.`,
      })
    } else if (economics.paybackMonths > 12) {
      candidates.push({
        tone: 'warn',
        weight: 50,
        text: `CAC payback runs ${Math.round(economics.paybackMonths)} months: acquisition works, but it ties up cash for over a year.`,
      })
    }
  }

  if (economics.nrr >= 1.02) {
    candidates.push({
      tone: 'good',
      weight: 60,
      text: `Your existing base compounds on its own: expansion outpaces churn (NRR ${formatPercent(economics.nrr, 0)}) — revenue grows even with zero new customers.`,
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
      text: `Acquisition is a profitable machine: every euro of CAC returns ${economics.ltvCacRatio.toFixed(1)}€ of lifetime margin, repaid in ${Math.round(economics.paybackMonths)} months.`,
    })
  }

  if (growth.ruleOf40 < 20) {
    candidates.push({
      tone: 'warn',
      weight: 45,
      text: `Rule of 40 at ${growth.ruleOf40.toFixed(0)}: neither growth nor profitability carries the scenario right now.`,
    })
  } else if (growth.ruleOf40 >= 40 && !valuation.isLossMaking) {
    candidates.push({
      tone: 'good',
      weight: 30,
      text: `Rule of 40 at ${growth.ruleOf40.toFixed(0)}: the growth-profit balance sits in the healthy zone buyers look for.`,
    })
  }

  if (candidates.length === 0) {
    candidates.push({
      tone: 'good',
      weight: 10,
      text: `A balanced scenario: ${formatMultiple(valuation.multiple)} on ${formatCompactCurrency(revenue.sdeAnnual)} of annual profit. Retention and margin are the levers that move the needle most.`,
    })
  }

  return candidates
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map(({ tone, text }) => ({ tone, text }))
}
