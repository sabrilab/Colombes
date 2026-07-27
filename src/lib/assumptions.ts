import type { SimulatorInputs } from './engine/types'
import { formatCurrency, formatPercent } from './format'

/**
 * Le mode Simple masque une partie des réglages sans les neutraliser.
 * Cette ligne dit lesquels, pour que le simulateur reste honnête.
 */
export function describeHiddenAssumptions(
  inputs: SimulatorInputs,
  t: (text: string) => string = (text) => text,
): string {
  return [
    `CAC ${formatCurrency(inputs.cac)}`,
    `${t('expansion')} ${formatPercent(inputs.expansion)}${t('/mo')}`,
    `${t('margin')} ${formatPercent(inputs.grossMargin, 0)}`,
    `${t('fixed costs')} ${formatCurrency(inputs.fixedCosts)}${t('/mo')}`,
  ].join(', ')
}
