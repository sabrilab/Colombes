import type { SimulatorInputs } from './engine/types'
import { formatCurrency, formatPercent } from './format'

/**
 * Le mode Simple masque une partie des réglages sans les neutraliser.
 * Cette ligne dit lesquels, pour que le simulateur reste honnête.
 */
export function describeHiddenAssumptions(inputs: SimulatorInputs): string {
  return [
    `CAC ${formatCurrency(inputs.cac)}`,
    `expansion ${formatPercent(inputs.expansion)}/mo`,
    `margin ${formatPercent(inputs.grossMargin, 0)}`,
    `fixed costs ${formatCurrency(inputs.fixedCosts)}/mo`,
  ].join(', ')
}
