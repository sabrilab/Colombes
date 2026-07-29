import { HEALTH_THRESHOLDS, type HealthMetric } from './engine'

export type GlossaryKey =
  | 'mrr'
  | 'arr'
  | 'arpu'
  | 'grossMargin'
  | 'ltv'
  | 'ltvCacRatio'
  | 'paybackMonths'
  | 'nrr'
  | 'ruleOf40'
  | 'mrrCeiling'

export interface GlossaryEntry {
  title: string
  /** Une ou deux phrases pour un fondateur non-financier. */
  definition: string
  /** Rappel du seuil de santé, repris de benchmarks.ts quand il existe. */
  threshold?: string
}

const thresholdOf = (metric: HealthMetric) => HEALTH_THRESHOLDS[metric].label

export const GLOSSARY: Record<GlossaryKey, GlossaryEntry> = {
  mrr: {
    title: 'MRR — monthly recurring revenue',
    definition:
      'What your subscriptions bring in every month, before costs. It is the pulse of your app: everything else flows from it.',
  },
  arr: {
    title: 'ARR — annual recurring revenue',
    definition:
      'MRR times 12: your subscription revenue projected over a year. It is the number buyers and investors use to compare one company with another.',
  },
  arpu: {
    title: 'ARPU — average revenue per user',
    definition:
      'MRR divided by your customer count: what the average customer pays each month. It places you on the market map (B2C, SMB, mid-market) and sets the churn that is “normal” for your zone.',
  },
  grossMargin: {
    title: 'Gross margin',
    definition:
      'The share of every euro of revenue left after direct costs (servers, APIs, support). For an app sold by subscription it is typically very high — that is what makes the model attractive.',
    threshold: thresholdOf('grossMargin'),
  },
  ltv: {
    title: 'LTV — customer lifetime value',
    definition:
      'The total margin a customer brings in before churning, estimated from your churn rate: the longer customers stay, the more each one is worth. Computed here on revenue churn, without counting expansion.',
  },
  ltvCacRatio: {
    title: 'LTV:CAC — return on acquisition',
    definition:
      'How much a customer brings in (LTV) for every euro spent acquiring them (CAC). At 3×, one euro of marketing returns three: the machine deserves to accelerate.',
    threshold: thresholdOf('ltvCacRatio'),
  },
  paybackMonths: {
    title: 'Payback — months to recover CAC',
    definition:
      'How many months of margin a new customer needs to pay back their acquisition cost. The shorter it is, the less cash your growth burns.',
    threshold: thresholdOf('paybackMonths'),
  },
  nrr: {
    title: 'NRR — net revenue retention (over a year)',
    definition:
      'What €100 of existing revenue becomes after one year, ignoring new customers: cancellations pull it down, upgrades pull it up. Above 100%, your base grows on its own.',
    threshold: thresholdOf('nrr'),
  },
  ruleOf40: {
    title: 'Rule of 40 — growth + profitability balance',
    definition:
      'Annual growth (%) added to net margin (%). A company can grow fast without profit, or the reverse: above 40, the balance of the two is considered healthy.',
    threshold: thresholdOf('ruleOf40'),
  },
  mrrCeiling: {
    title: 'MRR ceiling',
    definition:
      'The level where your MRR eventually stalls if nothing changes: every month churn removes a percentage that grows with the base, until it cancels out your new sales. To raise the ceiling: less churn or more acquisition.',
  },
}
