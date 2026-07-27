import type { SimulatorInputs } from './engine/types'

/**
 * La volière : six boîtes fictives mais réalistes, calibrées sur les
 * benchmarks du moteur (benchmarks.ts). Aucune métrique n'est stockée ici —
 * tout est recalculé en direct par compute(), pour que les profils restent
 * cohérents avec le moteur quand le barème évolue.
 */

export interface Colombe {
  id: string
  name: string
  sector: string
  /** Teinte oklch (0-360) de l'accent visuel de la colombe. */
  hue: number
  /** Une phrase de présentation, ton pitch de fondateur. */
  pitch: string
  /** Le « pourquoi elle vaut ça » pédagogique, 2-3 phrases. */
  lesson: string
  inputs: SimulatorInputs
}

const base = {
  audienceSize: 0,
  audienceConversion: 0.002,
  annualShare: 0,
  annualDiscount: 0.17,
  ltdPerMonth: 0,
  ltdPrice: 300,
  baseMultipleOverride: null,
} as const

export const AVIARY: Colombe[] = [
  {
    id: 'turquoise',
    name: 'Turquoise',
    sector: 'Dev tool · API monitoring',
    hue: 185,
    pitch:
      'Watches its customers’ APIs and alerts before the outage. Pure self-serve adoption: developers sign up on their own, nobody ever books a demo.',
    lesson:
      'The portrait of a beautiful dove: low churn, expansion that outpaces cancellations (NRR above 100%), an 88% gross margin and no founder dependency. Every euro of revenue turns into transferable profit — exactly what buyers pay a premium for.',
    inputs: {
      ...base,
      tiers: [
        { name: 'Solo', price: 19, mix: 0.45 },
        { name: 'Team', price: 49, mix: 0.4 },
        { name: 'Scale', price: 149, mix: 0.15 },
      ],
      customers: 1_400,
      newCustomersPerMonth: 90,
      cac: 210,
      revenueChurn: 0.018,
      expansion: 0.02,
      grossMargin: 0.88,
      fixedCosts: 18_000,
      founderDependency: 'low',
      techTransferability: 'high',
      topClientShare: 0.05,
      ageMonths: 42,
    },
  },
  {
    id: 'biset',
    name: 'Biset',
    sector: 'Vertical SaaS · restaurants',
    hue: 60,
    pitch:
      'Bookings, payments and loyalty for independent restaurants. Sold over a demo, installed in a day, indispensable from the first dinner service.',
    lesson:
      'A solid vertical: restaurant owners stay, but they never buy more (no expansion). NRR below 100% caps its growth — every year it must re-sign customers just to offset closures. A fair valuation, without the premium.',
    inputs: {
      ...base,
      tiers: [
        { name: 'Essential', price: 79, mix: 0.6 },
        { name: 'Pro', price: 129, mix: 0.4 },
      ],
      customers: 320,
      newCustomersPerMonth: 14,
      cac: 320,
      revenueChurn: 0.02,
      expansion: 0.01,
      grossMargin: 0.82,
      fixedCosts: 9_000,
      founderDependency: 'medium',
      techTransferability: 'medium',
      topClientShare: 0.04,
      ageMonths: 54,
    },
  },
  {
    id: 'diamant',
    name: 'Diamant',
    sector: 'B2C · fitness coaching',
    hue: 355,
    pitch:
      'An adaptive fitness coach on mobile: €9 a month, thousands of subscribers recruited on social media, and a product that runs itself.',
    lesson:
      'Volume hides a leaky bucket: 6% monthly churn means nearly half the base evaporates every year. The MRR looks impressive, but the ceiling is already in sight and buyers know it — the multiple compresses hard on this profile.',
    inputs: {
      ...base,
      tiers: [{ name: 'Premium', price: 9, mix: 1 }],
      customers: 8_500,
      newCustomersPerMonth: 600,
      cac: 12,
      revenueChurn: 0.06,
      expansion: 0.002,
      grossMargin: 0.78,
      fixedCosts: 22_000,
      founderDependency: 'medium',
      techTransferability: 'high',
      topClientShare: 0,
      ageMonths: 36,
    },
  },
  {
    id: 'colombine',
    name: 'Colombine',
    sector: 'Creators · paid newsletters',
    hue: 300,
    pitch:
      'The go-to tool for paid newsletters: writing, payments and referrals built in, carried by its founder’s audience.',
    lesson:
      'A lovely creator business… that rests on the creator. Founder dependency and a young track record weigh on the multiple: the same revenue, carried by a transferable brand, would be worth meaningfully more. The most counter-intuitive lesson in the whole scale.',
    inputs: {
      ...base,
      tiers: [
        { name: 'Creator', price: 15, mix: 0.7 },
        { name: 'Studio', price: 39, mix: 0.3 },
      ],
      customers: 950,
      newCustomersPerMonth: 70,
      cac: 45,
      revenueChurn: 0.03,
      expansion: 0.02,
      grossMargin: 0.83,
      fixedCosts: 6_500,
      founderDependency: 'high',
      techTransferability: 'medium',
      topClientShare: 0.03,
      ageMonths: 28,
    },
  },
  {
    id: 'ramier',
    name: 'Ramier',
    sector: 'Construction · quotes & invoicing',
    hue: 40,
    pitch:
      'Quotes, invoices and progress billing for construction contractors. Seven years old, solid word of mouth, a founder who still runs every demo.',
    lesson:
      'The established annuity: seven years of history and real recurring profit reassure any buyer. But an ever-present founder and a dated stack that is hard to take over shave the multiple — the same EBITDA, documented and transferable, would trade a notch higher.',
    inputs: {
      ...base,
      tiers: [
        { name: 'Craftsman', price: 39, mix: 0.5 },
        { name: 'Site', price: 89, mix: 0.35 },
        { name: 'Trade', price: 189, mix: 0.15 },
      ],
      customers: 610,
      newCustomersPerMonth: 22,
      cac: 150,
      revenueChurn: 0.02,
      expansion: 0.008,
      grossMargin: 0.8,
      fixedCosts: 12_000,
      founderDependency: 'high',
      techTransferability: 'low',
      topClientShare: 0.12,
      ageMonths: 84,
    },
  },
  {
    id: 'tourterelle',
    name: 'Tourterelle',
    sector: 'Mid-market HR · onboarding',
    hue: 230,
    pitch:
      'Digitizes employee onboarding for mid-size companies: integration journeys, signatures and equipment, sold through a three-month sales cycle.',
    lesson:
      'The mid-market paradox: NRR above 100% and a short payback — superb fundamentals — yet the sales machine eats nearly all the profit. Valued on EBITDA today, it is worth little; every point of margin freed would send the price jumping. The real asset here is retention.',
    inputs: {
      ...base,
      tiers: [
        { name: 'Growth', price: 290, mix: 0.65 },
        { name: 'Enterprise', price: 490, mix: 0.35 },
      ],
      customers: 85,
      newCustomersPerMonth: 4,
      cac: 1_900,
      revenueChurn: 0.01,
      expansion: 0.012,
      grossMargin: 0.86,
      fixedCosts: 15_000,
      founderDependency: 'medium',
      techTransferability: 'medium',
      topClientShare: 0.18,
      ageMonths: 20,
    },
  },
]

export function colombeById(id: string): Colombe | null {
  return AVIARY.find((colombe) => colombe.id === id) ?? null
}
