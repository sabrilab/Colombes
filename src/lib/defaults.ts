import type { SimulatorInputs } from '@/lib/engine/types'

export const DEFAULT_INPUTS: SimulatorInputs = {
  tiers: [
    { name: 'Starter', price: 9, mix: 0.4 },
    { name: 'Pro', price: 29, mix: 0.5 },
    { name: 'Scale', price: 79, mix: 0.1 },
  ],
  customers: 760,
  newCustomersPerMonth: 45,
  cac: 180,
  revenueChurn: 0.021,
  expansion: 0.008,
  grossMargin: 0.85,
  fixedCosts: 3_500,
  founderDependency: 'medium',
  techTransferability: 'medium',
  topClientShare: 0.08,
  ageMonths: 30,
  audienceSize: 0,
  audienceConversion: 0.002,
  annualShare: 0,
  annualDiscount: 0.17,
  ltdPerMonth: 0,
  ltdPrice: 300,
  baseMultipleOverride: null,
}
